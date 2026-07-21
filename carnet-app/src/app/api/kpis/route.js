import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await db.from('kpi_definitions').select('*');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { cd, responsable, nombre, unidad, meta_semanal, meta_mensual, comparador, agregacion } = body;
    
    const { data, error } = await db.from('kpi_definitions').insert([{
      cd,
      responsable,
      nombre,
      unidad,
      meta_semanal,
      meta_mensual,
      comparador,
      agregacion: agregacion || 'SUMA'
    }]).select();

    if (error) throw error;
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
