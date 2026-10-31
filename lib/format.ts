/** Indicativo que se antepone a teléfonos sin código de país al armar enlaces de WhatsApp. */
const DEFAULT_COUNTRY_CODE = '57';

export const formatNumber = (n: number) => n.toString().padStart(2, '0');

export const money = (amount: number, currency = 'COP') =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

/** Formatea una fecha 'YYYY-MM-DD' sin pasar por la zona horaria local. */
export function formatDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Fecha corta de un timestamp ISO, en hora de Bogotá, sin depender de nombres de mes del motor. */
export function formatShortDate(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')}`;
}

export function whatsappLink(phone: string | null | undefined, text: string): string {
  const raw = (phone ?? '').trim();
  let digits = raw.replace(/\D/g, '');
  if (digits && !raw.startsWith('+') && digits.length <= 10) digits = DEFAULT_COUNTRY_CODE + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
