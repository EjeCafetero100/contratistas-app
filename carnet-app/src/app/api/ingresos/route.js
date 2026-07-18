import { NextResponse } from 'next/server';
import db from '@/database/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, status } = body;
    
    if (!user_id || !status) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const { data, error } = await db
      .from('ingresos')
      .insert([{ user_id, status }])
      .select();

    if (error) throw error;

    return NextResponse.json({ id: data[0].id, success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Left join ingresos with personal
    const { data, error } = await db
      .from('ingresos')
      .select(`
        id,
        timestamp,
        status,
        personal (
          nombre,
          cedula,
          empresa,
          cargo
        )
      `)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    const history = data.map(record => ({
      id: record.id,
      timestamp: record.timestamp,
      ingreso_status: record.status,
      nombre: record.personal?.nombre,
      cedula: record.personal?.cedula,
      empresa: record.personal?.empresa,
      tipo: record.personal?.cargo
    }));

    return NextResponse.json(history);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
