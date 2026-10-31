import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getAdminTickets, reserveTicket } from '@/lib/db';
import { validateName, validateNumber, validatePhone, validateTicketStatus } from '@/lib/validation';
import { handle, jsonError, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** Reserva manual del organizador (venta presencial). Puede nacer ya pagada. */
export async function POST(request: Request, props: { params: Promise<{ slug: string }> }) {
  const p = await props.params;
  return handle(async () => {
    const raffle = await requireAdmin(p.slug, request.headers.get('x-admin-token'));
    if (!raffle) return jsonError(404, 'Esta rifa no existe');

    const body = (await readJson(request)) as Record<string, unknown> | null;
    const number = validateNumber(body?.number); if (!number.ok) return jsonError(400, number.error);
    const name = validateName(body?.name); if (!name.ok) return jsonError(400, name.error);
    const phone = validatePhone(body?.phone); if (!phone.ok || !phone.value) return jsonError(400, phone.ok ? 'El teléfono es obligatorio' : phone.error);
    const status = body?.status === undefined ? { ok: true as const, value: 'reserved' as const } : validateTicketStatus(body.status);
    if (!status.ok) return jsonError(400, status.error);

    const result = await reserveTicket(raffle.id, { number: number.value, buyer_name: name.value, buyer_phone: phone.value, status: status.value });
    if (result === 'taken') return jsonError(409, 'Ese número ya fue separado');
    return NextResponse.json({ tickets: await getAdminTickets(raffle.id) }, { status: 201 });
  });
}
