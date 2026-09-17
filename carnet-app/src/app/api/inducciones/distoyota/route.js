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

function getLicenseStatus(expiryDateStr) {
  if (!expiryDateStr) return 'Sin fecha';
  const expiry = new Date(expiryDateStr);
  if (isNaN(expiry.getTime())) return 'Desconocido';
  const now = new Date();
  const diffDays = Math.round((expiry - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Vencida';
  if (diffDays <= 30) return 'Por Vencer';
  return 'Vigente';
}

function readExcelFallback() {
  try {
    const parentDir = path.resolve(process.cwd(), '..');
    const publicDir = path.resolve(process.cwd(), 'public');

    const candidates = [
      path.join(publicDir, 'Barrancabermeja', 'Inducciones', 'Inducción Distoyota.xlsx'),
      path.join(parentDir, 'Barrancabermeja', 'Inducciones', 'Inducción Distoyota.xlsx'),
      path.join(process.cwd(), 'Barrancabermeja', 'Inducciones', 'Inducción Distoyota.xlsx')
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
      const fechaVencLic = formatExcelDate(r['Fecha de vencimiento de licencia']);
      const marcaTemporal = formatExcelDate(r['Marca temporal']);
      const puntuacion = Number(r['Puntuación'] || 100);
      const estadoLic = getLicenseStatus(fechaVencLic);

      return {
        id: 'excel-dist-' + (idx + 1),
        marca_temporal: marcaTemporal,
        puntuacion,
        fecha,
        nombre_completo: String(r['Nombre completo'] || '').trim(),
        cedula: String(r['Cedula'] || '').trim(),
        celular: String(r['Celular'] || '').trim(),
        tipo_licencia: String(r['Tipo de licencia'] || 'B1').trim(),
        fecha_vencimiento_licencia: fechaVencLic,
        eps: String(r['Eps'] || '').trim(),
        afp: String(r['Afp (Fondo de pensiones)'] || '').trim(),
        arl: String(r['Arl'] || '').trim(),
        tipo_sangre: String(r['Tipo de sangre'] || '').trim(),
        contacto_emergencia_nombre: String(r['Nombre del contacto de emergencia'] || '').trim(),
        contacto_emergencia_telefono: String(r['Número del Contacto de emergencia'] || '').trim(),
        empresa: String(r['Empresa o persona natural bajo la cual esta afiliado'] || 'Distoyota').trim(),
        nit_empresa: String(r['Nit de empresa o cc de la persona que lo tiene afiliado'] || '').trim(),
        calificacion_proceso: Number(r['CALIFIQUE EL PROCESO DE INDUCCION'] || 10),
        sede: 'Barrancabermeja',
        aprobado: puntuacion >= 80,
        estado_licencia: estadoLic,
        respuestas_evaluacion: {
          normas_seguridad: r['1. Seleccione las respuestas correctas con respecto a las normas de seguridad'],
          permiso_trabajo: r['2. Para ingresar al cd debo tener un permiso de trabajo o ingreso aprobado, además de haber  presentado la seguridad social vigente'],
          limite_velocidad: r['3. El limite de velocidad dentro del cd es?'],
          mantenimiento_2000h: r['4. Los trabajos de mantenimiento de 2000 horas requieren permiso de trabajo  Y Dpa'],
          apoyo_personal_cd: r['5. Esta prohibido solicitar ayuda al personal del cd para realizar  apoyo en los trabajos de mantenimiento de montacargas'],
          cinco_s: r['6. Se debe realizar 5´S de la zona después de las actividades de mantenimiento'],
          cambio_metodo: r['7. Si se presenta cambio en la declaración de metodo, debo reportar y solicitar la aprobación de Abi antes de proceder'],
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
    console.error('Error reading Distoyota excel fallback:', err);
    return [];
  }
}

export async function GET() {
  try {
    let records = [];
    let source = 'supabase';

    if (db) {
      const { data, error } = await db
        .from('induccion_distoyota')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        records = data.map((r) => {
          const estadoLic = getLicenseStatus(r.fecha_vencimiento_licencia);
          return {
            ...r,
            aprobado: Number(r.puntuacion || 0) >= 80,
            estado_licencia: estadoLic,
            source: 'supabase'
          };
        });
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

    const licenciasVigentes = records.filter((r) => r.estado_licencia === 'Vigente').length;
    const licenciasPorVencer = records.filter((r) => r.estado_licencia === 'Por Vencer').length;
    const licenciasVencidas = records.filter((r) => r.estado_licencia === 'Vencida').length;

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
        promedioCalificacion: Number(promedioCalificacion),
        licenciasVigentes,
        licenciasPorVencer,
        licenciasVencidas
      },
      records
    });
  } catch (error) {
    console.error('Error GET /api/inducciones/distoyota:', error);
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
      tipo_licencia: body.tipo_licencia || 'B1',
      fecha_vencimiento_licencia: body.fecha_vencimiento_licencia || '',
      eps: body.eps || '',
      afp: body.afp || '',
      arl: body.arl || '',
      tipo_sangre: body.tipo_sangre || 'O+',
      contacto_emergencia_nombre: body.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono: body.contacto_emergencia_telefono || '',
      empresa: body.empresa || 'Distoyota',
      nit_empresa: body.nit_empresa || '',
      puntuacion: Number(body.puntuacion || 100),
      calificacion_proceso: Number(body.calificacion_proceso || 10),
      respuestas_evaluacion: body.respuestas_evaluacion || {},
      sede: 'Barrancabermeja',
      fecha: new Date().toISOString().split('T')[0]
    };

    if (db) {
      const { data, error } = await db.from('induccion_distoyota').insert([newRecord]).select();
      if (error) throw error;
      return NextResponse.json({ success: true, record: data[0] });
    } else {
      return NextResponse.json({ success: true, record: { id: Date.now(), ...newRecord } });
    }
  } catch (error) {
    console.error('Error POST /api/inducciones/distoyota:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
