import { NextResponse } from 'next/server';

export const jsonError = (status: number, error: string) => NextResponse.json({ error }, { status });

export async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { return null; }
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const { code, details, hint } = error as Error & { code?: string; details?: string; hint?: string };
    return [`${error.name}: ${error.message}`, code && `code=${code}`, details && `details=${details}`, hint && `hint=${hint}`].filter(Boolean).join(' | ');
  }
  if (error && typeof error === 'object') {
    try { return JSON.stringify(error); } catch { /* objeto circular */ }
  }
  return String(error);
}

/** Ejecuta un handler y convierte errores inesperados en 500 sin filtrar detalles. */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    // Los logs de Workers pueden perder el mensaje de un Error; se escribe aparte.
    console.error('[api]', describeError(error), error);
    return jsonError(500, 'Ocurrió un error inesperado. Intenta de nuevo.');
  }
}
