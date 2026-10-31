-- Rifa: esquema inicial. Pegar en el SQL Editor de Supabase.

create table if not exists raffles (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  admin_token_hash text unique not null,
  title            text not null check (char_length(title) between 3 and 80),
  description      text,
  organizer_name   text not null check (char_length(organizer_name) between 2 and 80),
  organizer_phone  text,
  prize            text not null check (char_length(prize) between 2 and 120),
  ticket_price     integer not null check (ticket_price > 0),
  currency         text not null default 'COP',
  draw_date        date,
  draw_description text,
  status           text not null default 'active' check (status in ('active', 'closed')),
  created_at       timestamptz not null default now()
);

create table if not exists tickets (
  raffle_id   uuid not null references raffles(id) on delete cascade,
  number      smallint not null check (number between 0 and 99),
  buyer_name  text not null check (char_length(buyer_name) between 2 and 80),
  buyer_phone text not null check (char_length(buyer_phone) between 7 and 20),
  status      text not null default 'reserved' check (status in ('reserved', 'paid')),
  created_at  timestamptz not null default now(),
  paid_at     timestamptz,
  primary key (raffle_id, number)
);

-- Solo el servidor (service role) accede. Sin políticas públicas.
alter table raffles enable row level security;
alter table tickets enable row level security;
revoke all on raffles, tickets from anon, authenticated;
