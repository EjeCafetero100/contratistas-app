import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data: records, error } = await db
      .from('control_documental')
      .select('*')
      .order('nombre');
      
    if (error) throw error;
    
    return NextResponse.json(records);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
