import type { RaffleInput, RaffleUpdate, RaffleStatus, TicketStatus } from './types';

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

const fail = (error: string): Validated<never> => ({ ok: false, error });
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const optional = (v: unknown) => { const s = str(v); return s ? s : null; };

export function validateName(v: unknown, label = 'El nombre'): Validated<string> {
  const s = str(v);
  if (s.length < 2 || s.length > 80) return fail(`${label} debe tener entre 2 y 80 caracteres`);
  return { ok: true, value: s };
}

export function validatePhone(v: unknown, required = true): Validated<string | null> {
  const s = str(v);
  if (!s) return required ? fail('El teléfono es obligatorio') : { ok: true, value: null };
  if (s.length < 7 || s.length > 20 || !/^[+\d][\d\s().-]*$/.test(s)) return fail('El teléfono no parece válido');
  return { ok: true, value: s };
}

export function validateNumber(v: unknown): Validated<number> {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 99) return fail('El número debe estar entre 00 y 99');
  return { ok: true, value: n };
}

export const MAX_NUMBERS_PER_RESERVATION = 10;

export function validateNumbers(v: unknown): Validated<number[]> {
  if (!Array.isArray(v) || v.length === 0) return fail('Elige al menos un número');
  if (v.length > MAX_NUMBERS_PER_RESERVATION) return fail(`Puedes separar hasta ${MAX_NUMBERS_PER_RESERVATION} números a la vez`);
  const numbers: number[] = [];
  for (const item of v) {
    const n = validateNumber(item); if (!n.ok) return n;
    if (!numbers.includes(n.value)) numbers.push(n.value);
  }
  return { ok: true, value: numbers };
}

export function validateTicketStatus(v: unknown): Validated<TicketStatus> {
  return v === 'reserved' || v === 'paid' ? { ok: true, value: v } : fail('Estado de boleta inválido');
}

function validateRaffleStatus(v: unknown): Validated<RaffleStatus> {
  return v === 'active' || v === 'closed' ? { ok: true, value: v } : fail('Estado de rifa inválido');
}

function validatePrice(v: unknown): Validated<number> {
  const n = typeof v === 'string' ? Number(v.replace(/[^\d]/g, '')) : v;
  if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0 || n > 1_000_000_000) return fail('El precio debe ser un número entero mayor que cero');
  return { ok: true, value: n };
}

function validateDate(v: unknown): Validated<string | null> {
  const s = str(v);
  if (!s) return { ok: true, value: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return fail('La fecha debe tener formato AAAA-MM-DD');
  return { ok: true, value: s };
}

function validateText(v: unknown, label: string, min: number, max: number): Validated<string> {
  const s = str(v);
  if (s.length < min || s.length > max) return fail(`${label} debe tener entre ${min} y ${max} caracteres`);
  return { ok: true, value: s };
}

function validateOptionalText(v: unknown, label: string, max: number): Validated<string | null> {
  const s = optional(v);
  if (s && s.length > max) return fail(`${label} no puede superar ${max} caracteres`);
  return { ok: true, value: s };
}

export function validateRaffleInput(body: unknown): Validated<RaffleInput> {
  if (!body || typeof body !== 'object') return fail('Datos inválidos');
  const b = body as Record<string, unknown>;
  const title = validateText(b.title, 'El título', 3, 80); if (!title.ok) return title;
  const prize = validateText(b.prize, 'El premio', 2, 120); if (!prize.ok) return prize;
  const organizer = validateName(b.organizer_name, 'El nombre del organizador'); if (!organizer.ok) return organizer;
  const phone = validatePhone(b.organizer_phone, false); if (!phone.ok) return phone;
  const price = validatePrice(b.ticket_price); if (!price.ok) return price;
  const date = validateDate(b.draw_date); if (!date.ok) return date;
  const description = validateOptionalText(b.description, 'La descripción', 500); if (!description.ok) return description;
  const drawDescription = validateOptionalText(b.draw_description, 'La descripción del sorteo', 120); if (!drawDescription.ok) return drawDescription;
  return {
    ok: true,
    value: {
      title: title.value, prize: prize.value, organizer_name: organizer.value, organizer_phone: phone.value,
      ticket_price: price.value, draw_date: date.value, description: description.value, draw_description: drawDescription.value
    }
  };
}

/** Solo acepta campos de la lista blanca; nunca slug. */
export function validateRaffleUpdate(body: unknown): Validated<RaffleUpdate> {
  if (!body || typeof body !== 'object') return fail('Datos inválidos');
  const b = body as Record<string, unknown>;
  const patch: RaffleUpdate = {};
  if ('title' in b) { const r = validateText(b.title, 'El título', 3, 80); if (!r.ok) return r; patch.title = r.value; }
  if ('prize' in b) { const r = validateText(b.prize, 'El premio', 2, 120); if (!r.ok) return r; patch.prize = r.value; }
  if ('organizer_name' in b) { const r = validateName(b.organizer_name, 'El nombre del organizador'); if (!r.ok) return r; patch.organizer_name = r.value; }
  if ('organizer_phone' in b) { const r = validatePhone(b.organizer_phone, false); if (!r.ok) return r; patch.organizer_phone = r.value; }
  if ('ticket_price' in b) { const r = validatePrice(b.ticket_price); if (!r.ok) return r; patch.ticket_price = r.value; }
  if ('draw_date' in b) { const r = validateDate(b.draw_date); if (!r.ok) return r; patch.draw_date = r.value; }
  if ('description' in b) { const r = validateOptionalText(b.description, 'La descripción', 500); if (!r.ok) return r; patch.description = r.value; }
  if ('draw_description' in b) { const r = validateOptionalText(b.draw_description, 'La descripción del sorteo', 120); if (!r.ok) return r; patch.draw_description = r.value; }
  if ('status' in b) { const r = validateRaffleStatus(b.status); if (!r.ok) return r; patch.status = r.value; }
  if (Object.keys(patch).length === 0) return fail('No hay cambios para guardar');
  return { ok: true, value: patch };
}
