import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import RaffleBoard from '@/components/RaffleBoard';
import { getPublicTickets, getRaffleBySlug } from '@/lib/db';
import { formatDate, money } from '@/lib/format';
import { TOTAL_NUMBERS } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { params: { slug: string } };

// Una sola consulta por petición aunque la usen generateMetadata y la página.
const loadRaffle = cache((slug: string) => getRaffleBySlug(slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const raffle = await loadRaffle(params.slug);
  if (!raffle) return { title: 'Rifa no encontrada' };
  return {
    title: `${raffle.title} · Rifa`,
    description: raffle.description || `Escoge tu número y participa por ${raffle.prize}. Cada número vale ${money(raffle.ticket_price, raffle.currency)}.`
  };
}

export default async function RafflePage({ params }: Props) {
  const raffle = await loadRaffle(params.slug);
  if (!raffle) notFound();
  const tickets = await getPublicTickets(raffle.id);
  const drawDate = formatDate(raffle.draw_date);
  const closed = raffle.status !== 'active';

  return (
    <main>
      <section className="hero">
        <div className="spark spark-a" aria-hidden="true">✦</div><div className="spark spark-b" aria-hidden="true">★</div>
        <nav>
          <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">🎟</span><span>Rifa de <b>{raffle.organizer_name}</b></span></Link>
          <span className={`status ${closed ? 'closed' : ''}`}><i /> {closed ? 'Rifa cerrada' : 'Rifa activa'}</span>
        </nav>
        <div className="hero-copy">
          <p className="eyebrow">Organiza {raffle.organizer_name}</p>
          <h1>{raffle.title}</h1>
          <p className="intro">{raffle.description || 'Elige tu número de la suerte y acompáñanos en esta rifa. ¡Gracias por participar!'}</p>
        </div>
        <div className="cause-card">
          <div><p className="label">Premio</p><strong>{raffle.prize}</strong></div>
          <div className="card-divider" />
          <div><p className="label">Cada número</p><strong className="small-price">{money(raffle.ticket_price, raffle.currency)}</strong><p className="muted">{TOTAL_NUMBERS} números · del 00 al 99</p></div>
          <div className="card-icon" aria-hidden="true">★</div>
        </div>
      </section>

      <RaffleBoard raffle={raffle} initialTickets={tickets} />

      <footer>
        <span aria-hidden="true">★</span> Gracias por participar <span aria-hidden="true">★</span>
        {(drawDate || raffle.draw_description) && (
          <small>{drawDate ? `Se juega el ${drawDate}` : 'Sorteo'}{raffle.draw_description ? ` · ${raffle.draw_description}` : ''}</small>
        )}
        <small><Link href="/">¿Quieres organizar tu propia rifa?</Link></small>
      </footer>
    </main>
  );
}
