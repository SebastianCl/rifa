import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';
import { requireAdmin } from '@/lib/admin';
import { getAdminTickets } from '@/lib/db';

export const dynamic = 'force-dynamic';

// El token viaja en la URL: que no se indexe ni salga por Referer al abrir enlaces externos.
export const metadata: Metadata = {
  title: 'Panel del organizador · Rifa',
  robots: { index: false, follow: false },
  referrer: 'no-referrer'
};

type Props = { params: Promise<{ slug: string; token: string }> };

export default async function AdminPage(props: Props) {
  const p = await props.params;
  const raffle = await requireAdmin(p.slug, p.token);
  if (!raffle) notFound();
  const tickets = await getAdminTickets(raffle.id);

  return (
    <main>
      <section className="hero compact">
        <nav>
          <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true">🎟</span><span>Rifa · <b>Panel del organizador</b></span></Link>
          <span className="status"><i /> Enlace privado</span>
        </nav>
      </section>
      <AdminPanel raffle={raffle} initialTickets={tickets} token={p.token} />
      <footer>
        <span aria-hidden="true">★</span> No compartas este enlace: quien lo tenga puede administrar la rifa <span aria-hidden="true">★</span>
      </footer>
    </main>
  );
}
