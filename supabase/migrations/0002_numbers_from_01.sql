-- Los números válidos van del 01 al 99 (se retira el 00).
alter table public.tickets drop constraint if exists tickets_number_check;
alter table public.tickets add constraint tickets_number_check check (number between 1 and 99);
