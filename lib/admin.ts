import 'server-only';
import { getRaffleForAdmin } from './db';
import type { Raffle } from './types';

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Token de administración: 32 bytes aleatorios en base64url. Solo viaja en claro una vez. */
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Buffer.from(digest).toString('hex');
}

/** Devuelve la rifa si el token corresponde a ese slug; null en cualquier otro caso. */
export async function requireAdmin(slug: string, token: string | null | undefined): Promise<Raffle | null> {
  if (!slug || !token || token.length < 20) return null;
  return getRaffleForAdmin(slug, await hashToken(token));
}
