export type RaffleStatus = 'active' | 'closed';
export type TicketStatus = 'reserved' | 'paid';

export type Raffle = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  organizer_name: string;
  organizer_phone: string | null;
  prize: string;
  ticket_price: number;
  currency: string;
  draw_date: string | null; // 'YYYY-MM-DD'
  draw_description: string | null;
  status: RaffleStatus;
  created_at: string;
};

export type Ticket = {
  raffle_id: string;
  number: number;
  buyer_name: string;
  buyer_phone: string;
  status: TicketStatus;
  created_at: string;
  paid_at: string | null;
};

export type PublicTicket = Pick<Ticket, 'number' | 'status'>;

export type RaffleInput = {
  title: string;
  description: string | null;
  organizer_name: string;
  organizer_phone: string | null;
  prize: string;
  ticket_price: number;
  draw_date: string | null;
  draw_description: string | null;
};

export type RaffleUpdate = Partial<RaffleInput> & { status?: RaffleStatus };

export const TOTAL_NUMBERS = 100;
export const ALL_NUMBERS = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i);
