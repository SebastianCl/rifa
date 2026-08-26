'use client';

import { useEffect, useMemo, useState } from 'react';

type Ticket = { number: number; name: string; phone: string; createdAt: string };
const LOCAL_KEY = 'rifa-todos-por-mafe';

const formatNumber = (n: number) => n.toString().padStart(2, '0');
const money = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'taken'>('available');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTickets = async () => {
    try {
      const response = await fetch('/api/tickets', { cache: 'no-store' });
      if (!response.ok) throw new Error('local');
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch {
      const saved = window.localStorage.getItem(LOCAL_KEY);
      setTickets(saved ? JSON.parse(saved) : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadTickets(); }, []);

  const taken = useMemo(() => new Set(tickets.map(t => t.number)), [tickets]);
  const available = 100 - tickets.length;
  const shownNumbers = Array.from({ length: 100 }, (_, i) => i).filter(n => filter === 'all' || (filter === 'available' ? !taken.has(n) : taken.has(n)));

  const choose = (number: number) => {
    if (taken.has(number)) return;
    setSelected(number); setMessage('');
    document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const reserve = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selected === null || !name.trim() || !phone.trim()) return;
    setSaving(true); setMessage('');
    const ticket: Ticket = { number: selected, name: name.trim(), phone: phone.trim(), createdAt: new Date().toISOString() };
    try {
      const response = await fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ticket) });
      if (!response.ok) throw new Error('local');
      const data = await response.json(); setTickets(data.tickets || []);
    } catch {
      const next = [...tickets.filter(t => t.number !== selected), ticket].sort((a, b) => a.number - b.number);
      setTickets(next); window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    }
    setSelected(null); setName(''); setPhone(''); setMessage('¡Número separado! Guarda este dato para coordinar el pago.'); setSaving(false);
  };

  return <main>
    <section className="hero">
      <div className="spark spark-a">✦</div><div className="spark spark-b">♡</div>
      <nav><div className="brand"><span className="brand-mark">♥</span><span>Todos por <b>Mafe</b></span></div><span className="status"><i /> Rifa activa</span></nav>
      <div className="hero-copy"><p className="eyebrow">Una causa que nos une</p><h1>RIFA <span>por Mafe</span></h1><p className="intro">Tu apoyo hace la diferencia. Elige tu número y ayúdanos a acompañar a Mafe en su tratamiento.</p></div>
      <div className="cause-card"><div><p className="label">Premio mayor</p><strong>$1.000.000</strong><p className="muted">Un millón de pesos</p></div><div className="card-divider" /><div><p className="label">Cada número</p><strong className="small-price">{money.format(30000)}</strong><p className="muted">100 números disponibles</p></div><div className="heart-burst">♥</div></div>
    </section>

    <section className="content">
      <div className="section-heading"><div><p className="eyebrow">Participa aquí</p><h2>Escoge tu número</h2><p className="subheading">Los números en blanco todavía están disponibles.</p></div><div className="count"><strong>{available}</strong><span>disponibles</span></div></div>
      <div className="legend"><button className={filter === 'available' ? 'active' : ''} onClick={() => setFilter('available')}><i className="dot available-dot" />Disponibles <b>{available}</b></button><button className={filter === 'taken' ? 'active' : ''} onClick={() => setFilter('taken')}><i className="dot taken-dot" />Separados <b>{tickets.length}</b></button><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Ver todos</button></div>
      <div className="tickets" aria-label="Números de la rifa">{loading ? <div className="loading">Cargando números…</div> : shownNumbers.map(number => <button key={number} className={`ticket ${taken.has(number) ? 'taken' : ''} ${selected === number ? 'selected' : ''}`} onClick={() => choose(number)} disabled={taken.has(number)}>{formatNumber(number)}{taken.has(number) && <span>✓</span>}</button>)}</div>

      <div id="reserve" className="reserve-wrap"><div className="reserve-intro"><span className="ticket-icon">🎟</span><div><p className="eyebrow">Tu número de la suerte</p><h2>{selected === null ? 'Selecciona una boleta' : `Número ${formatNumber(selected)}`}</h2><p>{selected === null ? 'Haz clic en cualquier número disponible para comenzar.' : 'Déjanos tus datos y te contactaremos para confirmar.'}</p></div></div><form onSubmit={reserve}><label>Tu nombre<input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. María Pérez" required /></label><label>WhatsApp / teléfono<input value={phone} onChange={e => setPhone(e.target.value)} placeholder="300 000 0000" required /></label><button className="reserve-button" disabled={selected === null || saving}>{saving ? 'Separando…' : 'Separar mi número →'}</button></form>{message && <p className="success">✓ {message}</p>}</div>
    </section>
    <footer><span>♥</span> Gracias por ser parte de esta causa <span>♥</span><small>Se juega el 4 de septiembre de 2026 · Lotería de Medellín</small></footer>
  </main>;
}
