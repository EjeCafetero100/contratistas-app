import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { data: user, error } = await db
      .from('personal')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verificar si está en la lista negra
    const { data: noGratoData } = await db
      .from('personal_no_grato')
      .select('id')
      .eq('cedula', user.cedula)
      .single();

    // Mapear para compatibilidad
    const mappedUser = {
      id: user.id,
      fecha: user.fecha,
      nombre: user.nombre,
      cedula: user.cedula,
      empresa: user.empresa,
      tipo: user.cargo,
      induccion360: user.induccion_safety_360,
      fechaInduccion360: user.fecha_induccion_360,
      induccionEspecifica: user.induccion_especifica,
      fechaInduccionEspecifica: user.fecha_induccion_especifica,
      ss: user.seguridad_social_vigente,
      fechaSeguridadSocial: user.fecha_seguridad_social,
      foto: user.foto,
      estado: user.estado,
      es_no_grato: !!noGratoData
    };

    return NextResponse.json(mappedUser);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      fecha, nombre, cedula, empresa, tipo, 
      induccion360, fechaInduccion360, induccionEspecifica, fechaInduccionEspecifica, ss, fechaSeguridadSocial, foto, estado 
    } = body;

    const { error } = await db
      .from('personal')
      .update({
        fecha: fecha,
        nombre: nombre,
        cedula: cedula,
        empresa: empresa,
        cargo: tipo,
        induccion_safety_360: induccion360,
        fecha_induccion_360: fechaInduccion360 || null,
        induccion_especifica: induccionEspecifica,
        fecha_induccion_especifica: fechaInduccionEspecifica || null,
        seguridad_social_vigente: ss,
        fecha_seguridad_social: fechaSeguridadSocial || null,
        foto: foto,
        estado: estado
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const { error } = await db
      .from('personal')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
