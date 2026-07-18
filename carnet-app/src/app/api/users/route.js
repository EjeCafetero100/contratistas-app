import { NextResponse } from 'next/server';
import db from '@/database/db';

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
      fechaInduccion360: u.vigencia_induccion,
      induccionEspecifica: u.induccion_especifica,
      fechaInduccionEspecifica: u.vigencia_induccion,
      ss: u.seguridad_social_vigente,
      fechaSeguridadSocial: null,
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

    const { data, error } = await db
      .from('personal')
      .insert([{
        fecha: fecha,
        nombre: nombre,
        cedula: cedula,
        empresa: empresa,
        cargo: tipo,
        induccion_safety_360: induccion360,
        induccion_especifica: induccionEspecifica,
        vigencia_induccion: fechaInduccion360 || fechaInduccionEspecifica,
        seguridad_social_vigente: ss,
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
