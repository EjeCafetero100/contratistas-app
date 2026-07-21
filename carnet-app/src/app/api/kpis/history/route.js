import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kpi_id = searchParams.get('kpi_id');
    const anio = searchParams.get('anio');
    const mes = searchParams.get('mes');

    if (!kpi_id) {
      return NextResponse.json({ error: 'Falta kpi_id' }, { status: 400 });
    }

    // 1. Get the kpi_data rows for this KPI (and year/month if provided)
    let query = db.from('kpi_data').select('id, semana').eq('kpi_id', kpi_id);
    if (anio) query = query.eq('anio', anio);
    if (mes) query = query.eq('mes', mes);
    
    const { data: dataRows, error: errRows } = await query;
    if (errRows) throw errRows;

    if (dataRows.length === 0) {
      return NextResponse.json([]);
    }

    const dataIds = dataRows.map(r => r.id);

    // 2. Get history for those IDs
    const { data: history, error: errHistory } = await db.from('kpi_history')
      .select('*')
      .in('kpi_data_id', dataIds)
      .order('created_at', { ascending: false });

    if (errHistory) throw errHistory;

    // Map week back to history for display
    const enrichedHistory = history.map(h => {
      const row = dataRows.find(r => r.id === h.kpi_data_id);
      return { ...h, semana: row?.semana };
    });

    return NextResponse.json(enrichedHistory);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
