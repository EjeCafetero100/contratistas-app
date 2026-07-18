import { NextResponse } from 'next/server';
import db from '@/database/db';

export async function GET() {
  try {
    const { data, error } = await db
      .from('personal')
      .select('cargo')
      .not('cargo', 'is', null)
      .neq('cargo', '');

    if (error) throw error;

    const uniqueCargos = [...new Set(data.map(row => row.cargo))].sort();
    return NextResponse.json(uniqueCargos);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
