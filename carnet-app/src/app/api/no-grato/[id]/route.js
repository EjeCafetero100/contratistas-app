import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    const { error } = await db
      .from('personal_no_grato')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
