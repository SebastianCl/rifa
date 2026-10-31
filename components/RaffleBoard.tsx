'use client';

import { useMemo, useRef, useState } from 'react';
import type { PublicTicket, Raffle, RaffleStatus, TicketStatus } from '@/lib/types';
import { ALL_NUMBERS, TOTAL_NUMBERS } from '@/lib/types';
import { formatNumber, formatNumberList, whatsappLink } from '@/lib/format';
import { MAX_NUMBERS_PER_RESERVATION } from '@/lib/validation';

type Props = { raffle: Raffle; initialTickets: PublicTicket[] };
type Filter = 'all' | 'available' | 'taken';
type TicketsResponse = { status?: RaffleStatus; tickets?: PublicTicket[]; error?: string };

export default function RaffleBoard({ raffle, initialTickets }: Props) {
  const [tickets, setTickets] = useState<PublicTicket[]>(initialTickets);
  const [status, setStatus] = useState<RaffleStatus>(raffle.status);
  const [selected, setSelected] = useState<number[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [filter, setFilter] = useState<Filter>('available');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reservedNumbers, setReservedNumbers] = useState<number[]>([]);
  const nameInput = useRef<HTMLInputElement>(null);

  const taken = useMemo(() => new Map<number, TicketStatus>(tickets.map(t => [t.number, t.status])), [tickets]);
  const available = TOTAL_NUMBERS - tickets.length;
  const closed = status !== 'active';
  const shownNumbers = ALL_NUMBERS
    .filter(n => filter === 'all' || (filter === 'available' ? !taken.has(n) : taken.has(n)));

  const applyResponse = (data: TicketsResponse) => {
    if (data.tickets) setTickets(data.tickets);
    if (data.status) setStatus(data.status);
  };

  const refresh = async () => {
    try {
      const response = await fetch(`/api/raffles/${raffle.slug}/tickets`, { cache: 'no-store' });
      if (response.ok) applyResponse(await response.json());
    } catch { /* se mantiene la lista actual */ }
  };

  const choose = (number: number) => {
    if (taken.has(number) || closed) return;
    setError(''); setReservedNumbers([]);
    if (selected.includes(number)) { setSelected(selected.filter(n => n !== number)); return; }
    if (selected.length >= MAX_NUMBERS_PER_RESERVATION) { setError(`Puedes separar hasta ${MAX_NUMBERS_PER_RESERVATION} números a la vez.`); return; }
    setSelected([...selected, number]);
  };

  const goToForm = () => {
    document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    nameInput.current?.focus({ preventScroll: true });
  };

  const reserve = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selected.length === 0 || !name.trim() || !phone.trim()) return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/raffles/${raffle.slug}/tickets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: selected, name: name.trim(), phone: phone.trim() })
      });
      const data = (await response.json().catch(() => ({}))) as TicketsResponse;
      if (!response.ok) {
        setError(data.error || 'No se pudo separar tu selección. Intenta de nuevo.');
        await refresh();
        if (response.status === 409) setSelected([]);
        return;
      }
      applyResponse(data);
      setReservedNumbers(selected); setSelected([]); setName(''); setPhone('');
    } catch {
      setError('No hay conexión. Revisa tu internet e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const reservedPlural = reservedNumbers.length > 1;
  const organizerMessage = reservedNumbers.length > 0
    ? `Hola ${raffle.organizer_name}, separé ${reservedPlural ? 'los números' : 'el número'} ${formatNumberList(reservedNumbers)} de la rifa "${raffle.title}". ¿Cómo coordinamos el pago?`
    : '';

  return (
    <section className="content">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Participa aquí</p>
          <h2>Escoge tus números</h2>
          <p className="subheading">{closed ? 'Esta rifa ya cerró. Gracias a todos los que participaron.' : 'Toca uno o varios números disponibles para separarlos.'}</p>
        </div>
        <div className="count"><strong>{available}</strong><span>disponibles</span></div>
      </div>

      <div className="legend">
        <button type="button" aria-pressed={filter === 'available'} onClick={() => setFilter('available')}><i className="dot available-dot" />Disponibles <b>{available}</b></button>
        <button type="button" aria-pressed={filter === 'taken'} onClick={() => setFilter('taken')}><i className="dot taken-dot" />Separados <b>{tickets.length}</b></button>
        <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Ver todos</button>
      </div>

      <div className="tickets" role="group" aria-label="Números de la rifa">
        {shownNumbers.length === 0 && <div className="empty">{filter === 'available' ? '¡Todos los números ya fueron separados!' : 'Todavía nadie ha separado un número.'}</div>}
        {shownNumbers.map(number => {
          const ticketStatus = taken.get(number);
          const isTaken = ticketStatus !== undefined;
          const tag = ticketStatus === 'paid' ? 'Pagado' : 'Separado';
          return (
            <button
              type="button" key={number}
              className={['ticket', isTaken ? `taken ${ticketStatus}` : '', selected.includes(number) ? 'selected' : ''].filter(Boolean).join(' ')}
              onClick={() => choose(number)} disabled={isTaken || closed}
              aria-label={`Número ${formatNumber(number)}${isTaken ? `, ${tag.toLowerCase()}` : ''}`}
              aria-pressed={isTaken ? undefined : selected.includes(number)}
            >
              {formatNumber(number)}{isTaken && <small aria-hidden="true">{tag}</small>}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && !closed && (
        <div className="pick-bar">
          <p>{selected.length > 1 ? 'Elegiste los' : 'Elegiste el'} <strong>{formatNumberList(selected)}</strong></p>
          <button type="button" className="btn" onClick={goToForm}>Continuar →</button>
        </div>
      )}

      <div id="reserve" className="reserve-wrap">
        <div className="reserve-intro">
          <span className="ticket-icon" aria-hidden="true">🎟</span>
          <div>
            <p className="eyebrow">{selected.length > 1 ? 'Tus números de la suerte' : 'Tu número de la suerte'}</p>
            <h2>{selected.length === 0 ? 'Selecciona tus números' : `${selected.length > 1 ? 'Números' : 'Número'} ${formatNumberList(selected)}`}</h2>
            <p>{closed ? 'La rifa está cerrada y ya no recibe reservas.' : selected.length === 0 ? 'Toca uno o varios números disponibles del tablero para comenzar.' : `Déjanos tus datos y ${raffle.organizer_name} te contactará para confirmar el pago.`}</p>
          </div>
        </div>
        {closed ? (
          <p className="closed-note">Si ya separaste un número, el organizador se comunicará contigo con el resultado.</p>
        ) : (
          <form onSubmit={reserve}>
            <label>Tu nombre<input ref={nameInput} name="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. María Pérez" autoComplete="name" required minLength={2} maxLength={80} /></label>
            <label>WhatsApp / teléfono<input name="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="300 000 0000" autoComplete="tel" required minLength={7} maxLength={20} /></label>
            <button className="reserve-button" disabled={selected.length === 0 || saving}>{saving ? 'Separando…' : selected.length > 1 ? 'Separar mis números →' : 'Separar mi número →'}</button>
          </form>
        )}
        <div className="reserve-status" aria-live="polite">
          {error && <p className="error" role="alert">✕ {error}</p>}
          {reservedNumbers.length > 0 && (
            <div className="after-reserve">
              <p className="success">✓ {reservedPlural ? `¡Números ${formatNumberList(reservedNumbers)} separados!` : `¡Número ${formatNumberList(reservedNumbers)} separado!`} Ahora coordina el pago con {raffle.organizer_name}.</p>
              {raffle.organizer_phone && (
                <a className="btn whatsapp" href={whatsappLink(raffle.organizer_phone, organizerMessage)} target="_blank" rel="noopener noreferrer">Avisar por WhatsApp</a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
