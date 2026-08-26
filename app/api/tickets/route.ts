import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

type Ticket = { number: number; name: string; phone: string; createdAt: string };
const key = 'rifa:tickets';
const memory: Ticket[] = [];
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN ? Redis.fromEnv() : null;

async function getTickets(): Promise<Ticket[]> {
  if (redis) return (await redis.get<Ticket[]>(key)) || [];
  return memory;
}

export async function GET() { return NextResponse.json({ tickets: await getTickets() }); }

export async function POST(request: Request) {
  const incoming = await request.json() as Ticket;
  if (!Number.isInteger(incoming.number) || incoming.number < 0 || incoming.number > 99 || !incoming.name || !incoming.phone) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const tickets = await getTickets();
  if (tickets.some(ticket => ticket.number === incoming.number)) return NextResponse.json({ error: 'Ese número ya fue separado' }, { status: 409 });
  const next = [...tickets, incoming].sort((a, b) => a.number - b.number);
  if (redis) await redis.set(key, next);
  else { memory.splice(0, memory.length, ...next); }
  return NextResponse.json({ tickets: next });
}
