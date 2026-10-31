import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { updateRaffle } from '@/lib/db';
import { validateRaffleUpdate } from '@/lib/validation';
import { handle, jsonError, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, props: { params: Promise<{ slug: string }> }) {
  const p = await props.params;
  return handle(async () => {
    const raffle = await requireAdmin(p.slug, request.headers.get('x-admin-token'));
    if (!raffle) return jsonError(404, 'Esta rifa no existe');
    const parsed = validateRaffleUpdate(await readJson(request));
    if (!parsed.ok) return jsonError(400, parsed.error);
    return NextResponse.json({ raffle: await updateRaffle(raffle.id, parsed.value) });
  });
}
