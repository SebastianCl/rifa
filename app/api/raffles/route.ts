import { NextResponse } from 'next/server';
import { createRaffle } from '@/lib/db';
import { generateToken, hashToken } from '@/lib/admin';
import { validateRaffleInput } from '@/lib/validation';
import { handle, jsonError, readJson } from '@/lib/api';

export async function POST(request: Request) {
  return handle(async () => {
    const parsed = validateRaffleInput(await readJson(request));
    if (!parsed.ok) return jsonError(400, parsed.error);
    const token = generateToken();
    const raffle = await createRaffle(parsed.value, await hashToken(token));
    // Única vez que el token viaja en claro.
    return NextResponse.json({ slug: raffle.slug, adminToken: token }, { status: 201 });
  });
}
