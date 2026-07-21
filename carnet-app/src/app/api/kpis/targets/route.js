import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const anio = searchParams.get('anio');
    const tipo_periodo = searchParams.get('tipo_periodo');
    const periodo = searchParams.get('periodo');
    
    let query = db.from('kpi_targets').select('*');
    
    if (anio) query = query.eq('anio', anio);
    if (tipo_periodo) query = query.eq('tipo_periodo', tipo_periodo);
    if (periodo) query = query.eq('periodo', periodo);
    
    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { kpi_id, anio, tipo_periodo, periodo, comparador, meta, disparador } = body;
    
    // UPSERT
    const { data: existing } = await db.from('kpi_targets').select('id')
      .eq('kpi_id', kpi_id)
      .eq('anio', anio)
      .eq('tipo_periodo', tipo_periodo)
      .eq('periodo', periodo)
      .single();

    let result;
    if (existing) {
      const { data, error } = await db.from('kpi_targets')
        .update({ comparador, meta, disparador, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select();
      if (error) throw error;
      result = data[0];
    } else {
      const { data, error } = await db.from('kpi_targets')
        .insert([{ kpi_id, anio, tipo_periodo, periodo, comparador, meta, disparador }])
        .select();
      if (error) throw error;
      result = data[0];
    }
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
