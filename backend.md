# 🏦 Billflow – Backend Rendszerterv (backend.md)
*Verzió: 0.1.0 (PWA, Multi-Account & Cash-Flow Architecture)*

---

## 1. Célkitűzés és Vezérelvek

A rendszer a fix és ismétlődő havi kötelezettségek (rezsi, lakáshitel, biztosítások, előfizetések) nyilvántartására, ütemezésére és számlaszintű fedezet-ellenőrzésére fókuszál.

### Fő vezérelvek:
1. **Mikromenedzsment megszüntetése:** Banki API jogosultságok (PSD2/Open Banking) hiányában a napi készpénzes és kártyás apróköltések manuális rögzítése elhagyásra kerül.
2. **Sallangmentesítés:** A korábbi gamifikációs modulok (Penny bolt, érmék, XP, skinek, kitűzők, házimunkák) és az izolált bevásárlólista modul törlésre kerülnek.
3. **Tervezett vs. Tény rugalmasság:** Minden kiadási sablon rendelkezik egy tervezett keretösszeggel, de a havi befizetés lekönyvelésekor az összeg és a fizetéshez használt forrásszámla egyetlen lépésben felülbírálható.
4. **Több bankszámla kezelése (Multi-Account):** Dinamikusan rögzíthető számlák (pl. UniCredit Főszámla, Revolut Józsi, Revolut Párom, Készpénz). A rendszer számlánként kiszámolja a hónap hátralévő részében szükséges fedezetet.
5. **PWA-kompatibilis értesítések:** Web Push protokoll (VAPID) alapú közvetlen értesítésküldés böngészőbe és telepített PWA-ra.

---

## 2. Technológiai Stack

* **Futtatókörnyezet:** Node.js (v20+ LTS)
* **Web keretrendszer:** Express.js (v5)
* **Adatbázis & ORM:** MySQL 8 / MariaDB + Sequelize v6
* **Autentikáció:** JWT (stateless), bcrypt jelszóhashelés
* **Értesítések:** Web Push API (`web-push` csomag) + `node-cron`
* **Infrastruktúra:** Docker & Docker Compose

---

## 3. Adatbázis Séma (Sequelize Modellek)

```
┌──────────────┐          ┌──────────────┐
│    users     │──────────│  households  │
└──────────────┘          └──────────────┘
                                  │
       ┌──────────────────────────┼─────────────────────────┐
       │ 1:N                      │ 1:N                     │ 1:N
┌──────────────┐          ┌──────────────┐          ┌────────────────────┐
│bank_accounts │          │fixed_expenses│          │ push_subscriptions │
└──────────────┘          └──────────────┘          └────────────────────┘
       │                          │
       │                          │ 1:N
       │                   ┌──────────────┐
       └───────────────────│expense_payments│
         (tény forrás)     └──────────────┘
```

### 3.1. `users` (Felhasználók)
* `id` (CHAR(36) UUID, PK)
* `email` (VARCHAR(255), UNIQUE, NOT NULL)
* `password` (VARCHAR(255), NOT NULL - bcrypt hash)
* `displayName` (VARCHAR(100), NOT NULL)
* `householdId` (CHAR(36) UUID, FK -> households.id, NULLABLE)
* `role` (ENUM('OWNER', 'MEMBER'), DEFAULT 'MEMBER')
* `createdAt`, `updatedAt`

### 3.2. `households` (Háztartások)
* `id` (CHAR(36) UUID, PK)
* `name` (VARCHAR(100), NOT NULL)
* `currency` (VARCHAR(3), DEFAULT 'HUF')
* `inviteCode` (VARCHAR(20), UNIQUE, NOT NULL)
* `createdAt`, `updatedAt`

### 3.3. `bank_accounts` (Bankszámlák & Kártyák)
* `id` (CHAR(36) UUID, PK)
* `householdId` (CHAR(36) UUID, FK -> households.id, NOT NULL)
* `name` (VARCHAR(100), NOT NULL, pl. "UniCredit Folyószámla", "Revolut (Józsi)")
* `type` (ENUM('BANK_ACCOUNT', 'REVOLUT', 'CREDIT_CARD', 'CASH', 'SAVINGS'), NOT NULL)
* `currency` (VARCHAR(3), DEFAULT 'HUF')
* `color` (VARCHAR(7), NOT NULL, DEFAULT '#5D9CEC' - HEX kód UI jelöléshez)
* `icon` (VARCHAR(50), DEFAULT 'credit-card')
* `isDefault` (BOOLEAN, DEFAULT false)
* `active` (BOOLEAN, DEFAULT true)
* `createdAt`, `updatedAt`

### 3.4. `fixed_expenses` (Költség Sablonok / Törzsadatok)
* `id` (CHAR(36) UUID, PK)
* `householdId` (CHAR(36) UUID, FK -> households.id, NOT NULL)
* `defaultAccountId` (CHAR(36) UUID, FK -> bank_accounts.id, NULLABLE - Tervezett forrásszámla)
* `name` (VARCHAR(150), NOT NULL, pl. "ELMŰ Áram", "Közös Költség", "Digi Internet")
* `category` (ENUM('UTILITY', 'HOUSING', 'SUBSCRIPTION', 'LOAN', 'INSURANCE', 'OTHER'), NOT NULL)
* `defaultAmount` (INT, NOT NULL - Tervezett havi összeg Ft-ban)
* `isVariableAmount` (BOOLEAN, DEFAULT false - Jelzi, ha mérőóra vagy számla alapján változik)
* `billingCycle` (ENUM('MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'YEARLY'), DEFAULT 'MONTHLY')
* `dueDay` (TINYINT, 1-31, NOT NULL - Esedékesség napja a hónapban)
* `paymentMethod` (ENUM('DIRECT_DEBIT', 'CARD', 'BANK_TRANSFER', 'MANUAL'), DEFAULT 'BANK_TRANSFER')
* `active` (BOOLEAN, DEFAULT true)
* `notes` (TEXT, NULLABLE - Ügyfélszám, mérési azonosító, megjegyzés)
* `createdAt`, `updatedAt`

### 3.5. `expense_payments` (Havi Tény / Teljesítések)
* `id` (CHAR(36) UUID, PK)
* `fixedExpenseId` (CHAR(36) UUID, FK -> fixed_expenses.id, NOT NULL)
* `householdId` (CHAR(36) UUID, FK -> households.id, NOT NULL)
* `accountId` (CHAR(36) UUID, FK -> bank_accounts.id, NOT NULL - **Tényleges forrásszámla**)
* `periodYearMonth` (VARCHAR(7), NOT NULL, INDEX, pl. '2026-10')
* `plannedAmount` (INT, NOT NULL - A sablonból vett tervezett összeg pillanatképe)
* `actualAmount` (INT, NOT NULL - **A ténylegesen kifizetett összeg**)
* `status` (ENUM('PENDING', 'PAID', 'SKIPPED'), DEFAULT 'PENDING')
* `paidAt` (DATETIME, NULLABLE)
* `paidByUserId` (CHAR(36) UUID, FK -> users.id, NULLABLE)
* `note` (VARCHAR(255), NULLABLE)
* `createdAt`, `updatedAt`
* *Egyedi megszorítás:* `UNIQUE(fixedExpenseId, periodYearMonth)`

### 3.6. `push_subscriptions` (Web Push Tokenek)
* `id` (CHAR(36) UUID, PK)
* `userId` (CHAR(36) UUID, FK -> users.id, NOT NULL)
* `endpoint` (TEXT, NOT NULL)
* `p256dh` (VARCHAR(255), NOT NULL)
* `auth` (VARCHAR(255), NOT NULL)
* `createdAt`, `updatedAt`

---

## 4. Üzleti Logika és Folyamatok

### 4.1. Havi Műszerfal Összeállítása (`GET /api/dashboard/:yearMonth`)
1. A backend lekéri a háztartás összes aktív `fixed_expenses` tételét.
2. `LEFT JOIN`-nal kapcsolja a hónaphoz (`periodYearMonth = 'YYYY-MM'`) tartozó `expense_payments` bejegyzéseket.
3. **Virtuális állapotképzés:** Ha egy tételhez még nem létezik fizetési sor az adott hónapban:
   * Státusza virtuálisan `PENDING`.
   * Tervezett összege a sablon `defaultAmount` mezője.
   * Tényleges összege `null`.
   * Hozzárendelt számlája a sablon `defaultAccountId` számlája.
4. **Globális összegzések:**
   * `totalPlanned`: Az összes tétel tervezett összegeinek szummája.
   * `totalPaid`: A már kifizetett (`PAID`) tételek `actualAmount` összege.
   * `totalRemainingPending`: A még nyitott (`PENDING`) tételek `plannedAmount` összege.
5. **Számlánkénti fedezeti bontás (`accountsBreakdown`):**
   Minden aktív számlára kiszámítja:
   * `paidAmount`: Az adott számláról már leemelt tételek összege.
   * `pendingAmount`: Az adott számláról a hónap hátralévő részében még esedékes összeg (**ennyi fedezetnek kötelező lennie a számlán**).
   * `pendingItemsCount`: Hány nyitott tétel terheli még a számlát.

### 4.2. Befizetés Rögzítése & Módosítása (`POST /api/expenses/:fixedExpenseId/pay`)
A felhasználó a felületen egy kattintással fizetettre állíthatja a tételt, és szükség esetén felülírhatja az összeget és a számlát:

```json
{
  "periodYearMonth": "2026-10",
  "actualAmount": 14320,
  "accountId": "a3b2c1d0-1234-5678-90ab-cdef12345678",
  "paidAt": "2026-10-14T11:00:00Z"
}
```

* Ha nincs megadva `accountId`, a tételhez rendelt alapértelmezett számla kerül rögzítésre.
* Ha nincs megadva `actualAmount`, a tétel tervezett összege (`defaultAmount`) válik tényadattá.
* A végpont `upsert` művelettel hozza létre vagy frissíti a rekordot `status = 'PAID'` értékkel.

### 4.3. Befizetés Visszavonása és Kihagyása
* `POST /api/expenses/:fixedExpenseId/unpay`: Visszaállítja a tételt `PENDING` állapotba (`actualAmount = null`, `paidAt = null`).
* `POST /api/expenses/:fixedExpenseId/skip`: `SKIPPED` státuszt kap a hónapra (pl. fűtési vagy szezonális szüneteltetés esetén nem torzítja a fedezeti igényt).

---

## 5. REST API Végpontok

### 5.1. Autentikáció (`/api/auth`)
* `POST /api/auth/register` – Regisztráció (opcionális háztartási kód csatolással)
* `POST /api/auth/login` – Bejelentkezés, JWT token visszaadása
* `GET  /api/auth/me` – Bejelentkezett felhasználó és háztartás adatai

### 5.2. Bankszámlák Kezelése (`/api/accounts`)
* `GET    /api/accounts` – Háztartás aktív számláinak lekérése
* `POST   /api/accounts` – Új számla rögzítése (név, típus, pénznem, színkód, ikon)
* `PUT    /api/accounts/:id` – Számla adatainak módosítása
* `DELETE /api/accounts/:id` – Számla inaktiválása (`active = false`, a múltbeli adatok épsége miatt nincs hard delete)

### 5.3. Fix Költség Sablonok (`/api/fixed-expenses`)
* `GET    /api/fixed-expenses` – Rögzített sablonok listája
* `POST   /api/fixed-expenses` – Új kötelezettség felvitele
* `PUT    /api/fixed-expenses/:id` – Sablon módosítása (összeg, határidő, kategória, alapértelmezett számla)
* `DELETE /api/fixed-expenses/:id` – Sablon archiválása / inaktiválása

### 5.4. Havi Műszerfal & Befizetések (`/api/dashboard` és `/api/expenses`)
* `GET  /api/dashboard/:yearMonth` – Adott hónap teljes statisztikája, naptári lista és számlánkénti cash-flow bontás
* `POST /api/expenses/:fixedExpenseId/pay` – Havi tétel kifizetése (tény összeg & forrásszámla rögzítésével)
* `POST /api/expenses/:fixedExpenseId/unpay` – Befizetés visszavonása
* `POST /api/expenses/:fixedExpenseId/skip` – Tétel kihagyása az adott hónapban

### 5.5. PWA Web Push (`/api/push`)
* `GET  /api/push/vapid-public-key` – Nyilvános VAPID kulcs átadása a kliens feliratkozáshoz
* `POST /api/push/subscribe` – Böngésző token regisztrálása
* `POST /api/push/unsubscribe` – Feliratkozás törlése
* `POST /api/push/test` – Tesztértesítés küldése

---

## 6. Könyvtárstruktúra

```text
backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Sequelize kapcsolat és pool beállítások
│   │   └── webpush.js           # VAPID hitelesítés beállítása
│   ├── controllers/
│   │   ├── authController.js    # Regisztráció, login, munkamenet
│   │   ├── accountController.js # Számlák és kártyák CRUD
│   │   ├── expenseController.js # Fix költség sablonok kezelése
│   │   ├── paymentController.js # Fizetés, felülbírálás, visszavonás
│   │   ├── dashboardController.js # Havi mátrix & számlánkénti aggregáció
│   │   └── pushController.js    # Web Push feliratkozások
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT token ellenőrzés
│   │   └── errorHandler.js      # Szabványos JSON hibakezelő
│   ├── models/
│   │   ├── index.js             # Modell relációk és asszociációk
│   │   ├── User.js
│   │   ├── Household.js
│   │   ├── BankAccount.js
│   │   ├── FixedExpense.js
│   │   ├── ExpensePayment.js
│   │   └── PushSubscription.js
│   ├── jobs/
│   │   └── reminderWorker.js    # Napi ütemezett push értesítő (cron)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── accountRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── pushRoutes.js
│   └── app.js                   # Express app konfiguráció, middleware-ek
├── server.js                    # Belépési pont, DB szinkronizáció, HTTP port figyelés
├── .env.example
├── Dockerfile
└── package.json
```

---

## 7. Ütemezett Feladatok (Push Értesítési Logika)

A `jobs/reminderWorker.js` minden nap reggel **08:00-kor** fut le:
1. Lekéri azokat az aktív tételeket, amelyek esedékessége `dueDay` alapján a következő **2 napon belül** esedékes, vagy **a mai napon jár le**.
2. Ellenőrzi a tétel aktuális havi státuszát az `expense_payments` táblában.
3. Ha a státusz `PAID` vagy `SKIPPED`, a rendszer kihagyja az értesítést.
4. Ha `PENDING`:
   * Meghatározza a hozzárendelt forrásszámla nevét (pl. *UniCredit Folyószámla*).
   * Lekéri a háztartás tagjainak aktív `push_subscriptions` rekordjait.
   * Kiküldi a szabványos Web Push üzenetet:
     > **Cím:** Közelgő fizetési kötelezettség  
     > **Üzenet:** *2 nap múlva esedékes: Közös Költség (~18 500 Ft). Szükséges fedezet ellenőrzése: UniCredit Folyószámla.*