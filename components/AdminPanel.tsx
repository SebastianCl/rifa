'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Raffle, Ticket, TicketStatus } from '@/lib/types';
import { ALL_NUMBERS, TOTAL_NUMBERS } from '@/lib/types';
import { formatDate, formatNumber, formatShortDate, money, whatsappLink } from '@/lib/format';

type Props = { raffle: Raffle; initialTickets: Ticket[]; token: string };

const toEditForm = (r: Raffle) => ({
  title: r.title, prize: r.prize, ticket_price: String(r.ticket_price), organizer_name: r.organizer_name,
  organizer_phone: r.organizer_phone ?? '', draw_date: r.draw_date ?? '', draw_description: r.draw_description ?? '', description: r.description ?? ''
});

export default function AdminPanel({ raffle: initialRaffle, initialTickets, token }: Props) {
  const [raffle, setRaffle] = useState(initialRaffle);
  const [tickets, setTickets] = useState(initialTickets);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; text: string } | null>(null);
  const [notice, setNotice] = useState('');
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState({ number: '', name: '', phone: '', paid: false });
  const [edit, setEdit] = useState(toEditForm(initialRaffle));

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const publicUrl = `${origin}/r/${raffle.slug}`;
  const paid = tickets.filter(t => t.status === 'paid');
  const reserved = tickets.filter(t => t.status === 'reserved');
  const available = TOTAL_NUMBERS - tickets.length;
  const closed = raffle.status !== 'active';
  const freeNumbers = useMemo(() => {
    const taken = new Set(tickets.map(t => t.number));
    return ALL_NUMBERS.filter(n => !taken.has(n));
  }, [tickets]);

  const api = async (path: string, init: RequestInit, key: string) => {
    setBusy(key); setError(null); setNotice('');
    try {
      const response = await fetch(`/api/raffles/${raffle.slug}/admin${path}`, {
        ...init, headers: { 'Content-Type': 'application/json', 'x-admin-token': token, ...(init.headers || {}) }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError({ key, text: data.error || 'Algo salió mal. Intenta de nuevo.' }); return null; }
      return data as { tickets?: Ticket[]; raffle?: Raffle };
    } catch {
      setError({ key, text: 'No hay conexión. Revisa tu internet e intenta de nuevo.' });
      return null;
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (number: number, status: TicketStatus) => {
    const data = await api(`/tickets/${number}`, { method: 'PATCH', body: JSON.stringify({ status }) }, `t${number}`);
    if (data?.tickets) { setTickets(data.tickets); setNotice(status === 'paid' ? `Número ${formatNumber(number)} marcado como pagado.` : `Número ${formatNumber(number)} vuelve a pendiente.`); }
  };

  const release = async (ticket: Ticket) => {
    if (!window.confirm(`¿Liberar el número ${formatNumber(ticket.number)} de ${ticket.buyer_name}? Volverá a estar disponible para cualquiera.`)) return;
    const data = await api(`/tickets/${ticket.number}`, { method: 'DELETE' }, `t${ticket.number}`);
    if (data?.tickets) { setTickets(data.tickets); setNotice(`Número ${formatNumber(ticket.number)} liberado.`); }
  };

  const addManual = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = await api('/tickets', {
      method: 'POST',
      body: JSON.stringify({ number: Number(manual.number), name: manual.name.trim(), phone: manual.phone.trim(), status: manual.paid ? 'paid' : 'reserved' })
    }, 'manual');
    if (data?.tickets) { setTickets(data.tickets); setNotice(`Número ${formatNumber(Number(manual.number))} asignado a ${manual.name.trim()}.`); setManual({ number: '', name: '', phone: '', paid: false }); }
  };

  const toggleRaffle = async () => {
    const next = closed ? 'active' : 'closed';
    if (!closed && !window.confirm('¿Cerrar la rifa? Nadie más podrá separar números. Puedes reabrirla después.')) return;
    const data = await api('', { method: 'PATCH', body: JSON.stringify({ status: next }) }, 'status');
    if (data?.raffle) { setRaffle(data.raffle); setNotice(next === 'closed' ? 'Rifa cerrada. La página pública ya no recibe reservas.' : 'Rifa reabierta.'); }
  };

  const saveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = await api('', { method: 'PATCH', body: JSON.stringify({ ...edit, ticket_price: Number(edit.ticket_price) }) }, 'edit');
    if (data?.raffle) { setRaffle(data.raffle); setEdit(toEditForm(data.raffle)); setNotice('Datos de la rifa actualizados.'); }
  };

  const copyPublic = async () => {
    try { await navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* copiar a mano */ }
  };

  const updateEdit = (field: keyof typeof edit) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEdit(prev => ({ ...prev, [field]: e.target.value }));
  const shareText = `¡Participa en la rifa "${raffle.title}"! Escoge tu número aquí: ${publicUrl}`;
  const errorFor = (...keys: string[]) => error && keys.includes(error.key) ? <p className="error" role="alert">✕ {error.text}</p> : null;
  const generalError = error && !['manual', 'edit'].includes(error.key) ? <p className="error" role="alert">✕ {error.text}</p> : null;

  return (
    <section className="content">
      <div className="admin-top">
        <div>
          <p className="eyebrow">Panel del organizador</p>
          <h2>{raffle.title}</h2>
          <p className="subheading">
            <span className={`badge ${closed ? 'closed' : 'reserved'}`}>{closed ? 'Cerrada' : 'Activa'}</span>
            {' '}· {money(raffle.ticket_price, raffle.currency)} por número{raffle.draw_date ? ` · se juega el ${formatDate(raffle.draw_date)}` : ''}
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn secondary small" onClick={copyPublic}>{copied ? '✓ Copiado' : 'Copiar enlace público'}</button>
          <a className="btn whatsapp small" href={whatsappLink(null, shareText)} target="_blank" rel="noopener noreferrer">Compartir</a>
          <Link className="btn secondary small" href={`/r/${raffle.slug}`} target="_blank" rel="noopener noreferrer">Ver página</Link>
          <button type="button" className={`btn small ${closed ? '' : 'danger'}`} onClick={toggleRaffle} disabled={busy === 'status'}>{closed ? 'Reabrir rifa' : 'Cerrar rifa'}</button>
        </div>
      </div>

      {generalError}
      {notice && <p className="success" role="status">✓ {notice}</p>}

      <div className="stats">
        <div className="stat accent"><strong>{available}</strong><span>Disponibles</span></div>
        <div className="stat"><strong>{reserved.length}</strong><span>Por cobrar</span></div>
        <div className="stat paid"><strong>{paid.length}</strong><span>Pagados</span></div>
        <div className="stat paid"><strong>{money(paid.length * raffle.ticket_price, raffle.currency)}</strong><span>Recaudado</span></div>
        <div className="stat"><strong>{money(reserved.length * raffle.ticket_price, raffle.currency)}</strong><span>Pendiente</span></div>
      </div>

      <h3>Números separados</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>#</th><th>Nombre</th><th>Teléfono</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr>
          </thead>
          <tbody>
            {tickets.length === 0 && <tr><td colSpan={5} className="empty">Todavía nadie ha separado un número. Comparte el enlace público para empezar.</td></tr>}
            {tickets.map(ticket => (
              <tr key={ticket.number}>
                <td className="num">{formatNumber(ticket.number)}</td>
                <td>{ticket.buyer_name}<span className="sub">{formatShortDate(ticket.created_at)}</span></td>
                <td><a href={whatsappLink(ticket.buyer_phone, `Hola ${ticket.buyer_name}, te escribo por el número ${formatNumber(ticket.number)} de la rifa "${raffle.title}".`)} target="_blank" rel="noopener noreferrer">{ticket.buyer_phone}</a></td>
                <td><span className={`badge ${ticket.status}`}>{ticket.status === 'paid' ? 'Pagado' : 'Pendiente'}</span></td>
                <td className="actions">
                  {ticket.status === 'paid'
                    ? <button type="button" className="btn ghost small" onClick={() => setStatus(ticket.number, 'reserved')} disabled={busy === `t${ticket.number}`}>Marcar pendiente</button>
                    : <button type="button" className="btn small" onClick={() => setStatus(ticket.number, 'paid')} disabled={busy === `t${ticket.number}`}>Marcar pagado</button>}
                  <button type="button" className="btn danger small" onClick={() => release(ticket)} disabled={busy === `t${ticket.number}`}>Liberar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="card">
        <summary>Asignar un número a mano</summary>
        <p>Para ventas en persona o por chat. El número queda a nombre de esa persona de inmediato.</p>
        <form onSubmit={addManual}>
          <div className="form-grid">
            <label className="field">Número
              <select value={manual.number} onChange={e => setManual(m => ({ ...m, number: e.target.value }))} required disabled={freeNumbers.length === 0}>
                <option value="">{freeNumbers.length === 0 ? 'No quedan números' : 'Elige un número'}</option>
                {freeNumbers.map(n => <option key={n} value={n}>{formatNumber(n)}</option>)}
              </select>
            </label>
            <label className="field">Nombre
              <input value={manual.name} onChange={e => setManual(m => ({ ...m, name: e.target.value }))} placeholder="Ej. María Pérez" required minLength={2} maxLength={80} />
            </label>
            <label className="field">Teléfono
              <input type="tel" value={manual.phone} onChange={e => setManual(m => ({ ...m, phone: e.target.value }))} placeholder="300 000 0000" required minLength={7} maxLength={20} />
            </label>
            <label className="check field">
              <input type="checkbox" checked={manual.paid} onChange={e => setManual(m => ({ ...m, paid: e.target.checked }))} /> Ya pagó
            </label>
          </div>
          <div className="form-actions">
            <button className="btn" disabled={busy === 'manual' || freeNumbers.length === 0}>{busy === 'manual' ? 'Guardando…' : 'Asignar número'}</button>
            {errorFor('manual')}
          </div>
        </form>
      </details>

      <details className="card">
        <summary>Editar datos de la rifa</summary>
        <form onSubmit={saveEdit}>
          <div className="form-grid">
            <label className="field full">Nombre de la rifa<input value={edit.title} onChange={updateEdit('title')} required minLength={3} maxLength={80} /></label>
            <label className="field">Premio<input value={edit.prize} onChange={updateEdit('prize')} required minLength={2} maxLength={120} /></label>
            <label className="field">Precio por número<input type="number" inputMode="numeric" min={1} step={1} value={edit.ticket_price} onChange={updateEdit('ticket_price')} required /></label>
            <label className="field">Tu nombre<input value={edit.organizer_name} onChange={updateEdit('organizer_name')} required minLength={2} maxLength={80} /></label>
            <label className="field">Tu WhatsApp<input type="tel" value={edit.organizer_phone} onChange={updateEdit('organizer_phone')} minLength={7} maxLength={20} /></label>
            <label className="field">Fecha del sorteo<input type="date" value={edit.draw_date} onChange={updateEdit('draw_date')} /></label>
            <label className="field">¿Con qué se juega?<input value={edit.draw_description} onChange={updateEdit('draw_description')} maxLength={120} /></label>
            <label className="field full">Descripción<textarea value={edit.description} onChange={updateEdit('description')} maxLength={500} /></label>
          </div>
          <div className="form-actions">
            <button className="btn" disabled={busy === 'edit'}>{busy === 'edit' ? 'Guardando…' : 'Guardar cambios'}</button>
            {errorFor('edit')}
          </div>
        </form>
      </details>
    </section>
  );
}
