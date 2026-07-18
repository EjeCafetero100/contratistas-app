import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: users, error } = await db
      .from('personal')
      .select('*')
      .order('id', { ascending: false });
      
    if (error) throw error;
    
    // Mapear para mantener compatibilidad con el frontend original que esperaba SQLite
    const mappedUsers = users.map(u => ({
      id: u.id,
      fecha: u.fecha,
      nombre: u.nombre,
      cedula: u.cedula,
      empresa: u.empresa,
      tipo: u.cargo,
      induccion360: u.induccion_safety_360,
      fechaInduccion360: u.fecha_induccion_360,
      induccionEspecifica: u.induccion_especifica,
      fechaInduccionEspecifica: u.fecha_induccion_especifica,
      ss: u.seguridad_social_vigente,
      fechaSeguridadSocial: u.fecha_seguridad_social,
      foto: u.foto,
      estado: u.estado
    }));
    
    return NextResponse.json(mappedUsers);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      fecha, nombre, cedula, empresa, tipo, 
      induccion360, fechaInduccion360, induccionEspecifica, fechaInduccionEspecifica, ss, fechaSeguridadSocial, foto, estado 
    } = body;

    // Verificar si está en la lista negra
    const { data: noGratoData } = await db
      .from('personal_no_grato')
      .select('motivo')
      .eq('cedula', cedula)
      .single();

    if (noGratoData) {
      return NextResponse.json({ error: `ACCESO DENEGADO - PERSONAL NO GRATO. Motivo: ${noGratoData.motivo}` }, { status: 400 });
    }

    const { data, error } = await db
      .from('personal')
      .insert([{
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
        estado: estado || 'Activo'
      }])
      .select();

    if (error) throw error;

    return NextResponse.json({ id: data[0].id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
