import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // TODO: Validar firma HMAC y procesar payload de RAMP.
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ ok: true, received: body });
}
