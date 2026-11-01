-- Los números válidos van del 00 al 99.
-- Restablece el rango por si la restricción quedó en 1..99. Ampliar el rango
-- no invalida tickets existentes, así que es seguro con rifas activas.
alter table public.tickets drop constraint if exists tickets_number_check;
alter table public.tickets add constraint tickets_number_check check (number between 0 and 99);
