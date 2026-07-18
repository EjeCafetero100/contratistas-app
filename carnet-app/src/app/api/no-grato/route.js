import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: records, error } = await db
      .from('personal_no_grato')
      .select('*')
      .order('fecha_registro', { ascending: false });
      
    if (error) throw error;
    
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { cedula, nombre, motivo } = body;

    // Verificar si ya existe en la lista negra
    const { data: existing } = await db
      .from('personal_no_grato')
      .select('id')
      .eq('cedula', cedula)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'La cédula ya se encuentra en la lista de Personal No Grato' }, { status: 400 });
    }

    const { data, error } = await db
      .from('personal_no_grato')
      .insert([{
        cedula: cedula,
        nombre: nombre,
        motivo: motivo
      }])
      .select();

    if (error) throw error;

    return NextResponse.json({ id: data[0].id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
