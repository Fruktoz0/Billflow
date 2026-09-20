/**
 * Format a number as Hungarian Forint with a non-breaking space before 'Ft'.
 * E.g. 84200 -> "84 200 Ft"
 */
export function formatHUF(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 Ft';
  }
  const formatted = new Intl.NumberFormat('hu-HU', {
    maximumFractionDigits: 0
  }).format(Math.round(amount));

  // Use non-breaking space (\u00A0) before Ft so it never wraps alone
  return `${formatted}\u00A0Ft`;
}

/**
 * Get localized Hungarian day label for an expense due date.
 */
export function getRelativeDayLabel(dueDay: number, currentDay: number): { label: string; urgency: 'today' | 'tomorrow' | 'soon' | 'future' | 'overdue' } {
  const diff = dueDay - currentDay;

  if (diff < 0) {
    return { label: `${Math.abs(diff)} napja lejárt`, urgency: 'overdue' };
  }
  if (diff === 0) {
    return { label: 'Ma, szombat', urgency: 'today' };
  }
  if (diff === 1) {
    return { label: 'Holnap, vasárnap', urgency: 'tomorrow' };
  }
  if (diff <= 3) {
    return { label: `${diff} nap múlva`, urgency: 'soon' };
  }
  return { label: `Minden hó ${dueDay}-én`, urgency: 'future' };
}
