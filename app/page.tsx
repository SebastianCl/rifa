import CreateRaffleForm from '@/components/CreateRaffleForm';

export default function Home() {
  return (
    <main>
      <section className="hero compact">
        <div className="spark spark-a" aria-hidden="true">✦</div><div className="spark spark-b" aria-hidden="true">★</div>
        <nav>
          <span className="brand"><span className="brand-mark" aria-hidden="true">🎟</span><span>Rifa</span></span>
          <span className="status"><i /> Gratis y sin registro</span>
        </nav>
        <div className="hero-copy">
          <p className="eyebrow">Organiza tu rifa en minutos</p>
          <h1>Crea tu <span>rifa</span></h1>
          <p className="intro">Llena los datos, comparte el enlace por WhatsApp y deja que cada persona escoja su número. Tú confirmas los pagos desde tu panel.</p>
        </div>
      </section>

      <section className="content narrow">
        <CreateRaffleForm />
      </section>

      <footer>
        <span aria-hidden="true">★</span> 100 números del 00 al 99 · sin números repetidos · panel para el organizador <span aria-hidden="true">★</span>
      </footer>
    </main>
  );
}
