// Dependency-free formatting helpers (no date-fns on mobile).

function toDate(value?: string | Date | null): Date | null {
  if (!value) {
    return null;
  }
  const d = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => String(n).padStart(2, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(value?: string | Date | null): string {
  const d = toDate(value);
  if (!d) {
    return '—';
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

export function formatDay(value?: string | Date | null): string {
  const d = toDate(value);
  return d ? `${pad(d.getDate())} ${MONTHS[d.getMonth()]}` : '—';
}

export function formatRelative(value?: string | Date | null): string {
  const d = toDate(value);
  if (!d) {
    return '—';
  }
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 5) {
    return 'hozir';
  }
  if (secs < 60) {
    return `${secs} soniya oldin`;
  }
  const mins = Math.floor(secs / 60);
  if (mins < 60) {
    return `${mins} daqiqa oldin`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours} soat oldin`;
  }
  return `${Math.floor(hours / 24)} kun oldin`;
}

export function formatNumber(value?: number | null): string {
  if (value == null) {
    return '0';
  }
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** A limit value where null/undefined means unlimited. */
export function formatLimit(value: number | null | undefined, unit?: string): string {
  if (value == null) {
    return 'Cheksiz';
  }
  return unit ? `${formatNumber(value)} ${unit}` : formatNumber(value);
}

/** Plan price; null/undefined means the price is negotiated. */
export function formatPrice(price: number | null | undefined, currency = 'UZS'): string {
  if (price == null) {
    return 'Kelishuv asosida';
  }
  const label = currency === 'UZS' ? "so'm" : currency;
  return `${formatNumber(price)} ${label}`;
}
