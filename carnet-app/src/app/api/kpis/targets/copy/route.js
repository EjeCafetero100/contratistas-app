import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { from_anio, from_tipo, from_periodo, to_anio, to_tipo, to_periodo } = body;
    
    // 1. Fetch source targets
    const { data: sourceTargets, error: errFetch } = await db.from('kpi_targets')
      .select('*')
      .eq('anio', from_anio)
      .eq('tipo_periodo', from_tipo)
      .eq('periodo', from_periodo);
      
    if (errFetch) throw errFetch;
    
    if (!sourceTargets || sourceTargets.length === 0) {
      return NextResponse.json({ message: 'No hay configuraciones para copiar en el período de origen' }, { status: 404 });
    }

    // 2. Insert or Update destination targets
    // We can just loop and UPSERT using our PUT logic or direct db UPSERT.
    // Supabase JS doesn't have a clean UPSERT with conflict target directly exposed in simple insert unless we do it one by one or rely on unique constraints.
    // Because we have a UNIQUE constraint, we can use UPSERT
    
    const newRecords = sourceTargets.map(t => ({
      kpi_id: t.kpi_id,
      anio: to_anio,
      tipo_periodo: to_tipo,
      periodo: to_periodo,
      comparador: t.comparador,
      meta: t.meta,
      disparador: t.disparador
    }));
    
    const { data, error } = await db.from('kpi_targets')
      .upsert(newRecords, { onConflict: 'kpi_id,anio,tipo_periodo,periodo' })
      .select();
      
    if (error) throw error;

    return NextResponse.json({ message: 'Copiado exitosamente', copiedCount: data.length });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
