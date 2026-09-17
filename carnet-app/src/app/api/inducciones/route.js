import { NextResponse } from 'next/server';
import db from '@/database/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Almacén en memoria de respaldo si la tabla en Supabase no ha sido migrada aún
let fallbackInducciones = [
  {
    id: 'ind-1',
    documento: '1094958210',
    nombre: 'CARLOS ALBERTO GÓMEZ',
    empresa: 'LOGÍSTICA TRANSCOL SAS',
    tipo_induccion: 'T1 - Primario',
    categoria: 'conductores',
    placa: 'TKR-482',
    sede: 'Armenia',
    calificacion: 100,
    estado: 'Aprobado',
    fecha_induccion: new Date().toISOString().split('T')[0],
    fecha_vencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    observaciones: 'Inducción de seguridad vial y amarre de carga completada con éxito.'
  },
  {
    id: 'ind-2',
    documento: '18593821',
    nombre: 'JORGE LUIS HENAO',
    empresa: 'DISTOYOTA S.A.S',
    tipo_induccion: 'Distoyota',
    categoria: 'contratistas',
    placa: 'N/A',
    sede: 'Pereira',
    calificacion: 95,
    estado: 'Aprobado',
    fecha_induccion: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fecha_vencimiento: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    observaciones: 'Mantenimiento preventivo montacargas eléctricos y de combustión.'
  },
  {
    id: 'ind-3',
    documento: '1088329415',
    nombre: 'ANDRÉS FELIPE JARAMILLO',
    empresa: 'GASES DEL CAFÉ ESP',
    tipo_induccion: 'GLP',
    categoria: 'contratistas',
    placa: 'N/A',
    sede: 'Barrancabermeja',
    calificacion: 100,
    estado: 'Aprobado',
    fecha_induccion: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fecha_vencimiento: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    observaciones: 'Manipulación, almacenamiento seguro y cambio de cilindros GLP.'
  }
];

export async function GET() {
  try {
    const { data: records, error } = await db
      .from('inducciones')
      .select('*')
      .order('fecha_induccion', { ascending: false });

    if (error || !records || records.length === 0) {
      return NextResponse.json(fallbackInducciones);
    }

    return NextResponse.json(records);
  } catch (err) {
    console.warn('Usando almacenamiento en memoria para inducciones:', err.message);
    return NextResponse.json(fallbackInducciones);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);

    const newRecord = {
      id: body.id || `ind-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      documento: body.documento?.trim() || '',
      nombre: body.nombre?.trim().toUpperCase() || '',
      empresa: body.empresa?.trim().toUpperCase() || '',
      tipo_induccion: body.tipo_induccion || 'T1 - Primario',
      categoria: body.categoria || 'conductores',
      placa: body.placa?.trim().toUpperCase() || 'N/A',
      sede: body.sede || 'Armenia',
      calificacion: Number(body.calificacion) || 100,
      estado: Number(body.calificacion || 100) >= 80 ? 'Aprobado' : 'No Aprobado',
      fecha_induccion: body.fecha_induccion || today.toISOString().split('T')[0],
      fecha_vencimiento: body.fecha_vencimiento || nextYear.toISOString().split('T')[0],
      observaciones: body.observaciones?.trim() || 'Inducción SafeTogether completada.'
    };

    try {
      const { data, error } = await db
        .from('inducciones')
        .insert([newRecord])
        .select();

      if (!error && data && data.length > 0) {
        return NextResponse.json({ success: true, record: data[0] });
      }
    } catch (dbErr) {
      console.warn('No se pudo guardar en Supabase, guardando en memoria:', dbErr.message);
    }

    // Fallback local en memoria
    fallbackInducciones.unshift(newRecord);
    return NextResponse.json({ success: true, record: newRecord });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
