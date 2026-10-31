import { NextResponse } from 'next/server';

export const jsonError = (status: number, error: string) => NextResponse.json({ error }, { status });

export async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return null; }
}

/** Ejecuta un handler y convierte errores inesperados en 500 sin filtrar detalles. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    console.error('[api]', error);
    return jsonError(500, 'Ocurrió un error inesperado. Intenta de nuevo.');
  }
}
