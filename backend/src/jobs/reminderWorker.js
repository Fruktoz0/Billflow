const cron = require('node-cron');
const { FixedExpense, ExpensePayment, BankAccount, Household, User, PushSubscription } = require('../models');
const { webpush } = require('../config/webpush');

/**
 * Execute the reminder checks for today and the upcoming 2 days.
 */
async function runReminderJob() {
  console.log('[ReminderWorker] Running scheduled payment reminder check...');
  const now = new Date();

  // Targets: today (0), tomorrow (1), day after tomorrow (2)
  const targets = [
    { offset: 0, label: 'Ma esedékes' },
    { offset: 1, label: 'Holnap esedékes' },
    { offset: 2, label: '2 nap múlva esedékes' }
  ];

  let totalNotificationsSent = 0;

  for (const target of targets) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + target.offset);
    const targetDay = targetDate.getDate();
    const targetYearMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

    // Find active expenses due on targetDay
    const expenses = await FixedExpense.findAll({
      where: {
        dueDay: targetDay,
        active: true
      },
      include: [
        {
          model: BankAccount,
          as: 'defaultAccount',
          attributes: ['id', 'name', 'type', 'currency']
        },
        {
          model: ExpensePayment,
          as: 'payments',
          where: { periodYearMonth: targetYearMonth },
          required: false
        },
        {
          model: Household,
          as: 'household',
          include: [
            {
              model: User,
              as: 'members',
              include: [
                {
                  model: PushSubscription,
                  as: 'pushSubscriptions'
                }
              ]
            }
          ]
        }
      ]
    });

    for (const expense of expenses) {
      const payment = expense.payments && expense.payments.length > 0 ? expense.payments[0] : null;

      // Skip already paid or skipped items
      if (payment && (payment.status === 'PAID' || payment.status === 'SKIPPED')) {
        continue;
      }

      // Collect all push subscriptions from household members
      const subscriptions = [];
      if (expense.household && expense.household.members) {
        for (const member of expense.household.members) {
          if (member.pushSubscriptions && member.pushSubscriptions.length > 0) {
            subscriptions.push(...member.pushSubscriptions);
          }
        }
      }

      if (subscriptions.length === 0) {
        continue;
      }

      const accountName = expense.defaultAccount ? expense.defaultAccount.name : 'Alapértelmezett számla';
      const formattedAmount = Number(expense.defaultAmount).toLocaleString('hu-HU');

      const payload = JSON.stringify({
        title: 'Közelgő fizetési kötelezettség',
        body: `${target.label}: ${expense.name} (~${formattedAmount} Ft). Szükséges fedezet ellenőrzése: ${accountName}.`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: {
          fixedExpenseId: expense.id,
          periodYearMonth: targetYearMonth,
          url: `/?source=reminder&month=${targetYearMonth}`
        }
      });

      // Send notifications to all member devices
      await Promise.all(
        subscriptions.map(async (sub) => {
          const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          };

          try {
            await webpush.sendNotification(pushConfig, payload);
            totalNotificationsSent++;
          } catch (err) {
            console.error(`[ReminderWorker] Failed sending notification to sub ${sub.id}:`, err.message);
            // Auto cleanup 404 Not Found or 410 Gone
            if (err.statusCode === 404 || err.statusCode === 410) {
              console.log(`[ReminderWorker] Deleting expired push subscription ${sub.id}`);
              await sub.destroy().catch(() => {});
            }
          }
        })
      );
    }
  }

  console.log(`[ReminderWorker] Check completed. Sent ${totalNotificationsSent} reminder notification(s).`);
  return totalNotificationsSent;
}

/**
 * Initialize and start the daily cron schedule (default: 08:00 AM every day).
 */
function startReminderCron() {
  const cronExpression = process.env.REMINDER_CRON || '0 8 * * *';

  if (!cron.validate(cronExpression)) {
    console.error(`[ReminderWorker] Invalid cron expression: "${cronExpression}". Defaulting to "0 8 * * *".`);
  }

  const validCron = cron.validate(cronExpression) ? cronExpression : '0 8 * * *';

  console.log(`[ReminderWorker] Initializing reminder cron schedule with expression: "${validCron}"`);
  cron.schedule(validCron, () => {
    runReminderJob().catch((err) => {
      console.error('[ReminderWorker] Unexpected error in scheduled reminder job:', err);
    });
  });
}

module.exports = {
  runReminderJob,
  startReminderCron
};
