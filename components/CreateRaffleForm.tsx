'use client';

import { useEffect, useState } from 'react';
import { whatsappLink } from '@/lib/format';

type Created = { slug: string; adminToken: string };

const initialForm = { title: '', prize: '', ticket_price: '', organizer_name: '', organizer_phone: '', draw_date: '', draw_description: '', description: '' };

export default function CreateRaffleForm() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<Created | null>(null);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState<'public' | 'admin' | null>(null);

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const update = (field: keyof typeof initialForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const response = await fetch('/api/raffles', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ticket_price: Number(form.ticket_price) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.error || 'No se pudo crear la rifa. Intenta de nuevo.'); return; }
      setCreated(data as Created);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('No hay conexión. Revisa tu internet e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const copy = async (text: string, which: 'public' | 'admin') => {
    try { await navigator.clipboard.writeText(text); setCopied(which); setTimeout(() => setCopied(null), 2000); } catch { /* el usuario puede copiar a mano */ }
  };

  if (created) {
    const publicUrl = `${origin}/r/${created.slug}`;
    const adminUrl = `${publicUrl}/admin/${created.adminToken}`;
    const shareText = `¡Participa en la rifa "${form.title}"! Escoge tu número aquí: ${publicUrl}`;
    return (
      <div className="card">
        <p className="eyebrow">¡Lista!</p>
        <h3>Tu rifa ya está creada</h3>
        <p>Comparte el enlace público con quienes quieras que participen. El enlace de administración es solo para ti.</p>

        <div className="link-box">
          <p className="label">Enlace público · para compartir</p>
          <code>{publicUrl}</code>
          <div className="row">
            <button type="button" className="btn small" onClick={() => copy(publicUrl, 'public')}>{copied === 'public' ? '✓ Copiado' : 'Copiar enlace'}</button>
            <a className="btn whatsapp small" href={whatsappLink(null, shareText)} target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a>
            <a className="btn secondary small" href={publicUrl} target="_blank" rel="noopener noreferrer">Ver la rifa</a>
          </div>
        </div>

        <div className="link-box admin">
          <p className="label">Enlace de administración · solo para ti</p>
          <code>{adminUrl}</code>
          <div className="row">
            <button type="button" className="btn small" onClick={() => copy(adminUrl, 'admin')}>{copied === 'admin' ? '✓ Copiado' : 'Copiar enlace'}</button>
            <a className="btn secondary small" href={adminUrl}>Abrir panel</a>
          </div>
        </div>

        <div className="warning">
          <strong>Guarda el enlace de administración ahora.</strong> Es la única forma de confirmar pagos y liberar números, y no se puede recuperar si lo pierdes. Envíatelo por WhatsApp o guárdalo en tus notas.
        </div>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <h3>Datos de la rifa</h3>
      <p>Solo lo esencial. Después podrás editar todo desde el panel de administración.</p>
      <div className="form-grid">
        <label className="field full">Nombre de la rifa
          <input value={form.title} onChange={update('title')} placeholder="Ej. Rifa pro viaje de la abuela" required minLength={3} maxLength={80} />
        </label>
        <label className="field">Premio
          <input value={form.prize} onChange={update('prize')} placeholder="Ej. Un millón de pesos" required minLength={2} maxLength={120} />
        </label>
        <label className="field">Precio por número
          <input type="number" inputMode="numeric" min={1} step={1} value={form.ticket_price} onChange={update('ticket_price')} placeholder="30000" required />
          <span className="hint">En pesos, sin puntos ni comas.</span>
        </label>
        <label className="field">Tu nombre
          <input value={form.organizer_name} onChange={update('organizer_name')} placeholder="Quién organiza" autoComplete="name" required minLength={2} maxLength={80} />
        </label>
        <label className="field">Tu WhatsApp
          <input type="tel" value={form.organizer_phone} onChange={update('organizer_phone')} placeholder="300 000 0000" autoComplete="tel" minLength={7} maxLength={20} />
          <span className="hint">Opcional. Los participantes podrán escribirte al separar su número.</span>
        </label>
        <label className="field">Fecha del sorteo
          <input type="date" value={form.draw_date} onChange={update('draw_date')} />
        </label>
        <label className="field">¿Con qué se juega?
          <input value={form.draw_description} onChange={update('draw_description')} placeholder="Ej. Con la lotería del viernes, últimas dos cifras" maxLength={120} />
        </label>
        <label className="field full">Descripción
          <textarea value={form.description} onChange={update('description')} placeholder="Cuéntales para qué es la rifa y por qué vale la pena participar." maxLength={500} />
        </label>
      </div>
      <div className="form-actions">
        <button className="btn" disabled={saving}>{saving ? 'Creando…' : 'Crear mi rifa →'}</button>
        {error && <p className="error" role="alert">✕ {error}</p>}
      </div>
    </form>
  );
}
