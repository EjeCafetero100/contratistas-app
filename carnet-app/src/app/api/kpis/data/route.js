import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kpi_id = searchParams.get('kpi_id');
    const anio = searchParams.get('anio');
    const mes = searchParams.get('mes');

    let query = db.from('kpi_data').select(`
      id, kpi_id, anio, mes, semana, valor,
      kpi_definitions (cd, responsable, nombre, unidad, meta_semanal, meta_mensual, comparador, agregacion)
    `);

    if (kpi_id) query = query.eq('kpi_id', kpi_id);
    if (anio) query = query.eq('anio', anio);
    if (mes) query = query.eq('mes', mes);

    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { kpi_id, anio, mes, semana, valor, observaciones, usuario } = body;
    
    let finalData = null;

    // Check if exists to do UPSERT
    const { data: existing } = await db.from('kpi_data')
      .select('id, valor')
      .eq('kpi_id', kpi_id)
      .eq('anio', anio)
      .eq('mes', mes)
      .eq('semana', semana)
      .single();

    if (existing) {
      // Update
      const { data, error } = await db.from('kpi_data')
        .update({ valor, observaciones })
        .eq('id', existing.id)
        .select();
      if (error) throw error;
      finalData = data[0];

      // History
      await db.from('kpi_history').insert([{
        kpi_data_id: existing.id,
        usuario: usuario || 'Desconocido',
        valor_anterior: existing.valor,
        valor_nuevo: valor,
        observacion: observaciones || 'Edición de registro'
      }]);
    } else {
      // Insert
      const { data, error } = await db.from('kpi_data').insert([{
        kpi_id, anio, mes, semana, valor, observaciones
      }]).select();
      if (error) throw error;
      finalData = data[0];

      // History
      await db.from('kpi_history').insert([{
        kpi_data_id: finalData.id,
        usuario: usuario || 'Desconocido',
        valor_anterior: null,
        valor_nuevo: valor,
        observacion: observaciones || 'Creación inicial'
      }]);
    }

    return NextResponse.json(finalData, { status: existing ? 200 : 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
