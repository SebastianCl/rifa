import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rifa · Todos por Mafe',
  description: 'Elige tu número y apoya el tratamiento de Mafe Quejada Loaiza.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
