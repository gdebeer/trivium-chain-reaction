import type { NextRequest } from 'next/server';
import { getState, addEntry, updateEntry, deleteEntry } from '@/lib/pgr-store';

export async function GET() {
  const state = await getState();
  return Response.json(state);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const state = await addEntry(body);
  return Response.json(state);
}

export async function PUT(request: NextRequest) {
  const { id, ...updates } = await request.json();
  const state = await updateEntry(id, updates);
  return Response.json(state);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const state = await deleteEntry(id);
  return Response.json(state);
}
