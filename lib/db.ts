import 'server-only';
import { getSupabase } from './supabase';
import type { PublicTicket, Raffle, RaffleInput, RaffleUpdate, Ticket, TicketStatus } from './types';

const RAFFLE_COLUMNS = 'id, slug, title, description, organizer_name, organizer_phone, prize, ticket_price, currency, draw_date, draw_description, status, created_at';
const UNIQUE_VIOLATION = '23505';
const SLUG_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomSuffix(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join('');
}

function slugify(text: string): string {
  const base = text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 40).replace(/-+$/, '');
  return base || 'rifa';
}

export async function getRaffleBySlug(slug: string): Promise<Raffle | null> {
  const { data, error } = await getSupabase().from('raffles').select(RAFFLE_COLUMNS).eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data as Raffle | null;
}

export async function getRaffleForAdmin(slug: string, tokenHash: string): Promise<Raffle | null> {
  const { data, error } = await getSupabase().from('raffles').select(RAFFLE_COLUMNS).eq('slug', slug).eq('admin_token_hash', tokenHash).maybeSingle();
  if (error) throw error;
  return data as Raffle | null;
}

export async function getPublicTickets(raffleId: string): Promise<PublicTicket[]> {
  const { data, error } = await getSupabase().from('tickets').select('number, status').eq('raffle_id', raffleId).order('number');
  if (error) throw error;
  return (data ?? []) as PublicTicket[];
}

export async function getAdminTickets(raffleId: string): Promise<Ticket[]> {
  const { data, error } = await getSupabase().from('tickets').select('*').eq('raffle_id', raffleId).order('number');
  if (error) throw error;
  return (data ?? []) as Ticket[];
}

export async function createRaffle(input: RaffleInput, adminTokenHash: string): Promise<Raffle> {
  const base = slugify(input.title);
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = `${base}-${randomSuffix()}`;
    const { data, error } = await getSupabase().from('raffles').insert({ ...input, slug, admin_token_hash: adminTokenHash }).select(RAFFLE_COLUMNS).single();
    if (!error) return data as Raffle;
    if (error.code !== UNIQUE_VIOLATION) throw error;
  }
  throw new Error('No se pudo generar un enlace único para la rifa');
}

export async function updateRaffle(id: string, patch: RaffleUpdate): Promise<Raffle> {
  const { data, error } = await getSupabase().from('raffles').update(patch).eq('id', id).select(RAFFLE_COLUMNS).single();
  if (error) throw error;
  return data as Raffle;
}

type ReserveInput = { number: number; buyer_name: string; buyer_phone: string; status?: TicketStatus };

/** Inserta la boleta. La PK (raffle_id, number) garantiza que no haya dobles reservas. */
export async function reserveTicket(raffleId: string, input: ReserveInput): Promise<'ok' | 'taken'> {
  const status = input.status ?? 'reserved';
  const { error } = await getSupabase().from('tickets').insert({
    raffle_id: raffleId, number: input.number, buyer_name: input.buyer_name, buyer_phone: input.buyer_phone,
    status, paid_at: status === 'paid' ? new Date().toISOString() : null
  });
  if (!error) return 'ok';
  if (error.code === UNIQUE_VIOLATION) return 'taken';
  throw error;
}

/** Devuelve false si la boleta ya no existe. */
export async function updateTicketStatus(raffleId: string, number: number, status: TicketStatus): Promise<boolean> {
  const { data, error } = await getSupabase().from('tickets')
    .update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null })
    .eq('raffle_id', raffleId).eq('number', number).select('number').maybeSingle();
  if (error) throw error;
  return data !== null;
}

/** Devuelve false si la boleta ya no existe. */
export async function releaseTicket(raffleId: string, number: number): Promise<boolean> {
  const { data, error } = await getSupabase().from('tickets').delete().eq('raffle_id', raffleId).eq('number', number).select('number').maybeSingle();
  if (error) throw error;
  return data !== null;
}
