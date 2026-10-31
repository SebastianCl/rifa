import { NextResponse } from 'next/server';
import { getPublicTickets, getRaffleBySlug, reserveTicket } from '@/lib/db';
import { validateName, validateNumber, validatePhone } from '@/lib/validation';
import { handle, jsonError, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, props: Params) {
  const p = await props.params;
  return handle(async () => {
    const raffle = await getRaffleBySlug(p.slug);
    if (!raffle) return jsonError(404, 'Esta rifa no existe');
    return NextResponse.json({ status: raffle.status, tickets: await getPublicTickets(raffle.id) });
  });
}

export async function POST(request: Request, props: Params) {
  const p = await props.params;
  return handle(async () => {
    const raffle = await getRaffleBySlug(p.slug);
    if (!raffle) return jsonError(404, 'Esta rifa no existe');
    if (raffle.status !== 'active') return jsonError(409, 'Esta rifa ya está cerrada');

    const body = (await readJson(request)) as Record<string, unknown> | null;
    const number = validateNumber(body?.number); if (!number.ok) return jsonError(400, number.error);
    const name = validateName(body?.name); if (!name.ok) return jsonError(400, name.error);
    const phone = validatePhone(body?.phone); if (!phone.ok || !phone.value) return jsonError(400, phone.ok ? 'El teléfono es obligatorio' : phone.error);

    const result = await reserveTicket(raffle.id, { number: number.value, buyer_name: name.value, buyer_phone: phone.value });
    if (result === 'taken') return jsonError(409, 'Ese número ya fue separado');
    return NextResponse.json({ status: raffle.status, tickets: await getPublicTickets(raffle.id) }, { status: 201 });
  });
}
