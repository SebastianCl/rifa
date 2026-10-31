'use client';

import { useMemo, useState } from 'react';
import type { PublicTicket, Raffle, RaffleStatus, TicketStatus } from '@/lib/types';
import { TOTAL_NUMBERS } from '@/lib/types';
import { formatNumber, whatsappLink } from '@/lib/format';

type Props = { raffle: Raffle; initialTickets: PublicTicket[] };
type Filter = 'all' | 'available' | 'taken';
type TicketsResponse = { status?: RaffleStatus; tickets?: PublicTicket[]; error?: string };

export default function RaffleBoard({ raffle, initialTickets }: Props) {
  const [tickets, setTickets] = useState<PublicTicket[]>(initialTickets);
  const [status, setStatus] = useState<RaffleStatus>(raffle.status);
  const [selected, setSelected] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [filter, setFilter] = useState<Filter>('available');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [reservedNumber, setReservedNumber] = useState<number | null>(null);

  const taken = useMemo(() => new Map<number, TicketStatus>(tickets.map(t => [t.number, t.status])), [tickets]);
  const available = TOTAL_NUMBERS - tickets.length;
  const closed = status !== 'active';
  const shownNumbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i)
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
    setSelected(number); setError(''); setReservedNumber(null);
    document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const reserve = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selected === null || !name.trim() || !phone.trim()) return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/raffles/${raffle.slug}/tickets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: selected, name: name.trim(), phone: phone.trim() })
      });
      const data = (await response.json().catch(() => ({}))) as TicketsResponse;
      if (!response.ok) {
        setError(data.error || 'No se pudo separar el número. Intenta de nuevo.');
        await refresh();
        if (response.status === 409) setSelected(null);
        return;
      }
      applyResponse(data);
      setReservedNumber(selected); setSelected(null); setName(''); setPhone('');
    } catch {
      setError('No hay conexión. Revisa tu internet e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const organizerMessage = reservedNumber !== null
    ? `Hola ${raffle.organizer_name}, separé el número ${formatNumber(reservedNumber)} de la rifa "${raffle.title}". ¿Cómo coordinamos el pago?`
    : '';

  return (
    <section className="content">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Participa aquí</p>
          <h2>Escoge tu número</h2>
          <p className="subheading">{closed ? 'Esta rifa ya cerró. Gracias a todos los que participaron.' : 'Los números en blanco todavía están disponibles.'}</p>
        </div>
        <div className="count"><strong>{available}</strong><span>disponibles</span></div>
      </div>

      <div className="legend">
        <button type="button" className={filter === 'available' ? 'active' : ''} onClick={() => setFilter('available')}><i className="dot available-dot" />Disponibles <b>{available}</b></button>
        <button type="button" className={filter === 'taken' ? 'active' : ''} onClick={() => setFilter('taken')}><i className="dot taken-dot" />Separados <b>{tickets.length}</b></button>
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Ver todos</button>
      </div>

      <div className="tickets" role="group" aria-label="Números de la rifa">
        {shownNumbers.length === 0 && <div className="empty">{filter === 'available' ? '¡Todos los números ya fueron separados!' : 'Todavía nadie ha separado un número.'}</div>}
        {shownNumbers.map(number => {
          const ticketStatus = taken.get(number);
          const isTaken = ticketStatus !== undefined;
          return (
            <button
              type="button" key={number}
              className={['ticket', isTaken ? `taken ${ticketStatus}` : '', selected === number ? 'selected' : ''].filter(Boolean).join(' ')}
              onClick={() => choose(number)} disabled={isTaken || closed}
              aria-label={`Número ${formatNumber(number)}${isTaken ? ', separado' : ''}`}
            >
              {formatNumber(number)}{isTaken && <span>✓</span>}
            </button>
          );
        })}
      </div>

      <div id="reserve" className="reserve-wrap">
        <div className="reserve-intro">
          <span className="ticket-icon" aria-hidden="true">🎟</span>
          <div>
            <p className="eyebrow">Tu número de la suerte</p>
            <h2>{selected === null ? 'Selecciona un número' : `Número ${formatNumber(selected)}`}</h2>
            <p>{closed ? 'La rifa está cerrada y ya no recibe reservas.' : selected === null ? 'Haz clic en cualquier número disponible para comenzar.' : `Déjanos tus datos y ${raffle.organizer_name} te contactará para confirmar el pago.`}</p>
          </div>
        </div>
        {closed ? (
          <p className="closed-note">Si ya separaste un número, el organizador se comunicará contigo con el resultado.</p>
        ) : (
          <form onSubmit={reserve}>
            <label>Tu nombre<input name="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. María Pérez" autoComplete="name" required minLength={2} maxLength={80} /></label>
            <label>WhatsApp / teléfono<input name="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="300 000 0000" autoComplete="tel" required minLength={7} maxLength={20} /></label>
            <button className="reserve-button" disabled={selected === null || saving}>{saving ? 'Separando…' : 'Separar mi número →'}</button>
          </form>
        )}
        {error && <p className="error" role="alert">✕ {error}</p>}
        {reservedNumber !== null && (
          <div className="after-reserve">
            <p className="success">✓ ¡Número {formatNumber(reservedNumber)} separado! Ahora coordina el pago con {raffle.organizer_name}.</p>
            {raffle.organizer_phone && (
              <a className="btn whatsapp small" href={whatsappLink(raffle.organizer_phone, organizerMessage)} target="_blank" rel="noopener noreferrer">Avisar por WhatsApp</a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
