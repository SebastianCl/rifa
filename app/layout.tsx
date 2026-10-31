import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rifa · Organiza tu rifa en minutos',
  description: 'Crea una rifa, comparte el enlace y deja que cada persona escoja su número.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
