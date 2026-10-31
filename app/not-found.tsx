import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">Ups</p>
      <h1>Esta rifa no existe</h1>
      <p>El enlace puede estar incompleto o la rifa fue eliminada. Pídele al organizador que te lo comparta de nuevo.</p>
      <Link className="btn" href="/">Crear mi propia rifa</Link>
    </main>
  );
}
