import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getAdminTickets, releaseTicket, updateTicketStatus } from '@/lib/db';
import { validateNumber, validateTicketStatus } from '@/lib/validation';
import { handle, jsonError, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string; number: string }> };

export async function PATCH(request: Request, props: Params) {
  const p = await props.params;
  return handle(async () => {
    const raffle = await requireAdmin(p.slug, request.headers.get('x-admin-token'));
    if (!raffle) return jsonError(404, 'Esta rifa no existe');
    const number = validateNumber(p.number); if (!number.ok) return jsonError(400, number.error);
    const body = (await readJson(request)) as Record<string, unknown> | null;
    const status = validateTicketStatus(body?.status); if (!status.ok) return jsonError(400, status.error);

    const updated = await updateTicketStatus(raffle.id, number.value, status.value);
    if (!updated) return jsonError(404, 'Ese número no está reservado');
    return NextResponse.json({ tickets: await getAdminTickets(raffle.id) });
  });
}

export async function DELETE(request: Request, props: Params) {
  const p = await props.params;
  return handle(async () => {
    const raffle = await requireAdmin(p.slug, request.headers.get('x-admin-token'));
    if (!raffle) return jsonError(404, 'Esta rifa no existe');
    const number = validateNumber(p.number); if (!number.ok) return jsonError(400, number.error);

    const released = await releaseTicket(raffle.id, number.value);
    if (!released) return jsonError(404, 'Ese número no está reservado');
    return NextResponse.json({ tickets: await getAdminTickets(raffle.id) });
  });
}
