import type { NextRequest } from 'next/server';
import { getState, addEntry, updateEntry, deleteEntry, markWaveSubmitted } from '@/lib/launch-store';

export async function GET() {
  return Response.json(await getState());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (body.action === 'SUBMIT_WAVE') {
    return Response.json(await markWaveSubmitted(body.wave));
  }
  return Response.json(await addEntry(body));
}

export async function PUT(request: NextRequest) {
  const { id, ...updates } = await request.json();
  return Response.json(await updateEntry(id, updates));
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  return Response.json(await deleteEntry(id));
}
