import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import db from '@/database/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatExcelDate(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(val);
      if (d && d.y) {
        const mm = String(d.m).padStart(2, '0');
        const dd = String(d.d).padStart(2, '0');
        return `${d.y}-${mm}-${dd}`;
      }
    } catch (e) {}
  }
  return String(val);
}

function readExcelFallback() {
  try {
    const parentDir = path.resolve(process.cwd(), '..');
    const publicDir = path.resolve(process.cwd(), 'public');

    const candidates = [
      path.join(publicDir, 'Barrancabermeja', 'Inducciones', 'Inducción visitantes .xlsx'),
      path.join(publicDir, 'Barrancabermeja', 'Inducciones', 'Inducción Visitantes.xlsx'),
      path.join(parentDir, 'Barrancabermeja', 'Inducciones', 'Inducción visitantes .xlsx'),
      path.join(process.cwd(), 'Barrancabermeja', 'Inducciones', 'Inducción visitantes .xlsx')
    ];

    let filePath = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        filePath = c;
        break;
      }
    }

    if (!filePath) return [];

    const fileBuffer = fs.readFileSync(filePath);
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: '' });

    return rawRows.map((r, idx) => {
      const fecha = formatExcelDate(r['Fecha']);
      const marcaTemporal = formatExcelDate(r['Marca temporal']);
      const puntuacion = Number(r['Puntuación'] || 100);

      return {
        id: 'excel-vis-' + (idx + 1),
        marca_temporal: marcaTemporal,
        puntuacion,
        fecha,
        nombre_completo: String(r['Nombre completo'] || '').trim(),
        cedula: String(r['Cedula'] || '').trim(),
        celular: String(r['Celular'] || '').trim(),
        eps: String(r['Eps'] || '').trim(),
        afp: String(r['Afp (Fondo de pensiones)'] || '').trim(),
        arl: String(r['Arl'] || '').trim(),
        tipo_sangre: String(r['Tipo de sangre'] || '').trim(),
        contacto_emergencia_nombre: String(r['Nombre del contacto de emergencia'] || '').trim(),
        contacto_emergencia_telefono: String(r['Número del Contacto de emergencia'] || '').trim(),
        empresa: String(r['Empresa o persona natural bajo la cual esta afiliado'] || 'Visitante').trim(),
        nit_empresa: String(r['Nit de empresa o cc de la persona que lo tiene afiliado'] || '').trim(),
        calificacion_proceso: Number(r['CALIFIQUE EL PROCESO DE INDUCCION'] || 10),
        sede: 'Barrancabermeja',
        aprobado: puntuacion >= 80,
        respuestas_evaluacion: {
          normas_cd: r['1. Seleccione la respuesta correcta con respecto a las normas del cd'],
          permiso_ingreso: r['2. Para ingresar al cd debo tener un permiso de ingreso, haber presentado seguridad social y afiliaciones '],
          limite_velocidad: r['3. El limite de velocidad en el Cd es '],
          parqueadero_particular: r['4. Para ingresar al parqueadero de vehículos particulares es necesario contar con la documentación al día'],
          areas_operativas: r['5. Si realiza trabajos administrativos, esta permitido ingresar a las áreas operativas, patio de maniobra, parqueaderos de T2, área de almacenamiento de producto'],
          punto_encuentro: r['1. El punto de encuentro queda en el área externa del cd'],
          alarma_evacuacion: r['2. A partir de qué señal sonora del sistema de alarma se debe iniciar el proceso de evacuación  hacia el punto de encuentro '],
          evacuacion_contratista: r['3. En caso de evacuación en el punto de encuentro se debe ubicar con el personal de su contratista y así facilitar el conteo'],
          brigadistas: r['4. Los brigadistas se identifican con una insignia en el casco '],
          senalizacion_verde: r['5. La señalización verde con flechas que me indican '],
          info_clara: r['1. La información suministrada fue clara'],
          normas_protegen: r['2. Las normas de seguridad protegen mi vida y la de otros funcionarios dentro del cd']
        },
        source: 'excel'
      };
    });
  } catch (err) {
    console.error('Error reading Visitantes excel fallback:', err);
    return [];
  }
}

export async function GET() {
  try {
    let records = [];
    let source = 'supabase';

    if (db) {
      const { data, error } = await db
        .from('induccion_visitantes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        records = data.map((r) => ({
          ...r,
          aprobado: Number(r.puntuacion || 0) >= 80,
          source: 'supabase'
        }));
      }
    }

    if (records.length === 0) {
      records = readExcelFallback();
      source = 'excel';
    }

    const total = records.length;
    const aprobados = records.filter((r) => r.aprobado).length;
    const reprobados = total - aprobados;
    const tasaAprobacion = total > 0 ? Math.round((aprobados / total) * 100) : 0;
    const promedioPuntuacion = total > 0 ? Math.round(records.reduce((acc, r) => acc + (Number(r.puntuacion) || 0), 0) / total) : 0;
    const promedioCalificacion = total > 0 ? (records.reduce((acc, r) => acc + (Number(r.calificacion_proceso) || 10), 0) / total).toFixed(1) : '10.0';

    return NextResponse.json({
      success: true,
      source,
      total,
      kpis: {
        total,
        aprobados,
        reprobados,
        tasaAprobacion,
        promedioPuntuacion,
        promedioCalificacion: Number(promedioCalificacion)
      },
      records
    });
  } catch (error) {
    console.error('Error GET /api/inducciones/visitantes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.nombre_completo || !body.cedula) {
      return NextResponse.json({ success: false, error: 'Nombre y cédula requeridos' }, { status: 400 });
    }

    const newRecord = {
      nombre_completo: body.nombre_completo.trim(),
      cedula: body.cedula.trim(),
      celular: body.celular ? body.celular.trim() : '',
      eps: body.eps || '',
      afp: body.afp || '',
      arl: body.arl || '',
      tipo_sangre: body.tipo_sangre || 'O+',
      contacto_emergencia_nombre: body.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: body.contacto_emergencia_telefono || '',
      empresa: body.empresa || 'Visitante',
      nit_empresa: body.nit_empresa || '',
      puntuacion: Number(body.puntuacion || 100),
      calificacion_proceso: Number(body.calificacion_proceso || 10),
      respuestas_evaluacion: body.respuestas_evaluacion || {},
      sede: 'Barrancabermeja',
      fecha: new Date().toISOString().split('T')[0]
    };

    if (db) {
      const { data, error } = await db.from('induccion_visitantes').insert([newRecord]).select();
      if (error) throw error;
      return NextResponse.json({ success: true, record: data[0] });
    } else {
      return NextResponse.json({ success: true, record: { id: Date.now(), ...newRecord } });
    }
  } catch (error) {
    console.error('Error POST /api/inducciones/visitantes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
