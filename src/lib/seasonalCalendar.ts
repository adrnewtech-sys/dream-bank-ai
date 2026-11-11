export interface SeasonalEvent {
  id: string;
  name: string;
  date: string;
  region: string;
  expenseUplift: number;
  focus: string;
}

// Dates are approximate and uplifts are planning estimates, not measured data.
export const SEASONAL_EVENTS: SeasonalEvent[] = [
  { id: 'diwali-2026', name: 'Diwali', date: '2026-11-08', region: 'India & diaspora', expenseUplift: 0.35, focus: 'Gifts, sweets and decorations' },
  { id: 'christmas-2026', name: 'Christmas', date: '2026-12-25', region: 'Global', expenseUplift: 0.3, focus: 'Gifts, travel and holiday meals' },
  { id: 'new-year-2027', name: "New Year's Day", date: '2027-01-01', region: 'Global', expenseUplift: 0.15, focus: 'Celebrations and travel' },
  { id: 'eid-al-fitr-2027', name: 'Eid al-Fitr', date: '2027-03-10', region: 'Muslim-majority regions', expenseUplift: 0.3, focus: 'Gifts, food and new clothes' },
  { id: 'eid-al-adha-2027', name: 'Eid al-Adha', date: '2027-05-16', region: 'Muslim-majority regions', expenseUplift: 0.25, focus: 'Celebrations and family meals' },
];
