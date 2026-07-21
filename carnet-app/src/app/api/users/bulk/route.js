import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { records } = await request.json();

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'No se enviaron registros válidos' }, { status: 400 });
    }

    // Obtener cédulas existentes para evitar duplicados
    const { data: existentes, error: errFetch } = await db.from('personal').select('cedula');
    if (errFetch) throw errFetch;

    const cedulasExistentes = new Set(existentes.map(e => String(e.cedula).trim()));

    const toInsert = [];
    let duplicatesSkipped = 0;

    for (const record of records) {
      const cedulaStr = String(record.cedula).trim();
      
      if (!cedulaStr || cedulasExistentes.has(cedulaStr)) {
        duplicatesSkipped++;
        continue;
      }

      toInsert.push({
        fecha: record.fecha,
        nombre: String(record.nombre).trim(),
        cedula: cedulaStr,
        empresa: record.empresa,
        cargo: record.cargo,
        induccion_safety_360: record.induccion360,
        fecha_induccion_360: record.fechaInduccion360 || null,
        induccion_especifica: record.induccionEspecifica,
        fecha_induccion_especifica: record.fechaInduccionEspecifica || null,
        seguridad_social_vigente: record.ss,
        fecha_seguridad_social: record.fechaSeguridadSocial || null,
        foto: record.foto || '',
        estado: record.estado || 'Activo'
      });
      
      cedulasExistentes.add(cedulaStr);
    }

    if (toInsert.length > 0) {
      // Chunking if necessary, but Supabase standard insert handles up to 1000s easily
      // Doing 100 chunks just in case it's huge
      const chunkSize = 100;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await db.from('personal').insert(chunk);
        if (error) throw error;
      }
    }

    return NextResponse.json({ 
      success: true, 
      inserted: toInsert.length, 
      duplicates: duplicatesSkipped 
    }, { status: 201 });

  } catch (error) {
    console.error('Error en bulk insert:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
