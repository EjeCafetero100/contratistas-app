import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await db.from('kpi_definitions').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { cd, responsable, nombre, unidad, meta_semanal, meta_mensual, disparador, comparador, agregacion } = body;
    
    const { data, error } = await db.from('kpi_definitions').insert([{
      cd,
      responsable,
      nombre,
      unidad,
      meta_semanal,
      meta_mensual,
      disparador: disparador ?? meta_mensual, // default to meta_mensual if not provided
      comparador,
      agregacion: agregacion || 'SUMA'
    }]).select();

    if (error) throw error;
    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, meta_mensual, disparador, comparador, usuario } = body;

    // Obtener valores anteriores
    const { data: existing } = await db.from('kpi_definitions').select('*').eq('id', id).single();
    if (!existing) return NextResponse.json({ error: 'KPI no encontrado' }, { status: 404 });

    // Actualizar configuración
    const { data, error } = await db.from('kpi_definitions')
      .update({
        meta_mensual: meta_mensual !== undefined ? meta_mensual : existing.meta_mensual,
        meta_semanal: meta_mensual !== undefined ? meta_mensual : existing.meta_mensual, // mantengo ambas iguales por simpleza operativa actual
        disparador: disparador !== undefined ? disparador : existing.disparador,
        comparador: comparador !== undefined ? comparador : existing.comparador
      })
      .eq('id', id)
      .select();

    if (error) throw error;

    // Registrar en el historial si cambió algo relevante
    await db.from('kpi_definitions_history').insert([{
      kpi_id: id,
      usuario: usuario || 'Administrador',
      meta_anterior: existing.meta_mensual,
      meta_nueva: data[0].meta_mensual,
      disparador_anterior: existing.disparador,
      disparador_nuevo: data[0].disparador,
      comparador_anterior: existing.comparador,
      comparador_nuevo: data[0].comparador
    }]);

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
