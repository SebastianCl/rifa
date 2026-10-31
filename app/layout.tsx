import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Fraunces } from 'next/font/google';
import './globals.css';

// Atkinson Hyperlegible: pensada para baja visión, distingue bien 0/O, 1/l/I y 6/8.
const body = Atkinson_Hyperlegible({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-body', display: 'swap' });
const display = Fraunces({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'Rifa · Organiza tu rifa en minutos',
  description: 'Crea una rifa, comparte el enlace y deja que cada persona escoja su número.'
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fffaf4' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1714' }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es" className={`${body.variable} ${display.variable}`}><body>{children}</body></html>;
}
