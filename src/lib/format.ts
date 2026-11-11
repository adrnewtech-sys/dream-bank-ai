const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const currencyExact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

export function formatMoney(value: number): string {
  return currency.format(value);
}

export function formatMoneyExact(value: number): string {
  return currencyExact.format(value);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value;
  return dateFormat.format(date);
}

export function formatMonth(value: Date): string {
  return monthFormat.format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
