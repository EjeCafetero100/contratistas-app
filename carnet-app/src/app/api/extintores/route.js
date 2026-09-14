import { NextResponse } from 'next/server';
import db from '@/database/db';

export async function GET() {
  try {
    const { data, error } = await db
      .from('extintores')
      .select('*')
      .order('fecha_vencimiento', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { item, ubicacion, fecha_vencimiento } = body;

    if (!item || !ubicacion || !fecha_vencimiento) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const { data, error } = await db
      .from('extintores')
      .insert([{ item, ubicacion, fecha_vencimiento }])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
