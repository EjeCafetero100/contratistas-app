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
      path.join(publicDir, 'Barrancabermeja', 'Inducciones', 'Inducción Conductores.xlsx'),
      path.join(publicDir, 'Barrancabermeja', 'Inducciones', 'induccion_conductores.xlsx'),
      path.join(parentDir, 'Barrancabermeja', 'Inducciones', 'Inducción Conductores.xlsx'),
      path.join(process.cwd(), 'Barrancabermeja', 'Inducciones', 'Inducción Conductores.xlsx')
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
        id: 'excel-' + (idx + 1),
        marca_temporal: marcaTemporal,
        puntuacion,
        fecha,
        nombre_completo: String(r['Nombre completo'] || '').trim(),
        cedula: String(r['Cedula'] || '').trim(),
        celular: String(r['Celular'] || '').trim(),
        tipo_licencia: String(r['Tipo de licencia'] || '').trim(),
        fecha_vencimiento_licencia: fechaVencLic,
        eps: String(r['Eps'] || '').trim(),
        afp: String(r['Afp (Fondo de pensiones)'] || '').trim(),
        arl: String(r['Arl'] || '').trim(),
        tipo_sangre: String(r['Tipo de sangre'] || '').trim(),
        contacto_emergencia_nombre: String(r['Nombre del contacto de emergencia'] || '').trim(),
        contacto_emergencia_telefono: String(r['Número del Contacto de emergencia'] || '').trim(),
        empresa: String(r['Empresa o persona natural bajo la cual esta afiliado'] || 'Kopps').trim(),
        nit_empresa: String(r['Nit de empresa o cc de la persona que lo tiene afiliado'] || '').trim(),
        calificacion_proceso: Number(r['CALIFIQUE EL PROCESO DE INDUCCION'] || 10),
        sede: 'Barrancabermeja',
        aprobado: puntuacion >= 80,
        estado_licencia: estadoLic,
        respuestas_evaluacion: {
          red_zone: r['1. La red Zone es'],
          ingreso_red_zone: r['2. El proceso para ingresar hasta la red zone como debe ser'],
          bloqueo_vehiculo: r['3. El bloqueo del vehículo consiste'],
          zona_segura: r['4. La zona segura es un lugar para  los conductores con el fin de evitar  interacción entre hombre y maquina'],
          reporte_salud: r['5. Si no me siento bien de salud en el centro de distribución debo reportar al supervisor de turno o al encargado de seguridad'],
          comportamientos_cd: r['6. Mis comportamientos en el cd deben ser'],
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
  } catch (e) {
    console.error('Error leyendo Excel de conductores:', e);
    return [];
  }
}

export async function GET() {
  try {
    let records = [];
    let source = 'supabase';

    // 1. Intentar consultar Supabase
    try {
      const { data, error } = await db
        .from('induccion_conductores')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        records = data.map(r => ({
          ...r,
          estado_licencia: r.estado_licencia || getLicenseStatus(r.fecha_vencimiento_licencia),
          source: 'supabase'
        }));
      }
    } catch (dbErr) {
      console.warn('Fallo consulta Supabase induccion_conductores, recurriendo a Excel:', dbErr);
    }

    // 2. Si Supabase no tiene datos o falló, recurrir al archivo Excel
    if (records.length === 0) {
      records = readExcelFallback();
      source = 'excel';
    }

    // 3. Calcular KPIs y estadísticas
    const total = records.length;
    const aprobados = records.filter(r => r.aprobado !== false && Number(r.puntuacion || 0) >= 80).length;
    const reprobados = total - aprobados;
    const tasaAprobacion = total > 0 ? Math.round((aprobados / total) * 100) : 100;
    
    const sumPuntuacion = records.reduce((acc, r) => acc + Number(r.puntuacion || 0), 0);
    const promedioPuntuacion = total > 0 ? Math.round((sumPuntuacion / total) * 10) / 10 : 100;

    const sumCalificacion = records.reduce((acc, r) => acc + Number(r.calificacion_proceso || 10), 0);
    const promedioCalificacion = total > 0 ? Math.round((sumCalificacion / total) * 10) / 10 : 10;

    const licenciasVigentes = records.filter(r => r.estado_licencia === 'Vigente').length;
    const licenciasPorVencer = records.filter(r => r.estado_licencia === 'Por Vencer').length;
    const licenciasVencidas = records.filter(r => r.estado_licencia === 'Vencida').length;

    // Distribución por empresa
    const empresasMap = {};
    records.forEach(r => {
      const emp = r.empresa || 'Otras';
      empresasMap[emp] = (empresasMap[emp] || 0) + 1;
    });
    const distEmpresas = Object.entries(empresasMap).map(([name, count]) => ({ name, count }));

    // Distribución por tipo de licencia
    const licenciaMap = {};
    records.forEach(r => {
      const lic = r.tipo_licencia || 'Sin especificar';
      licenciaMap[lic] = (licenciaMap[lic] || 0) + 1;
    });
    const distLicencias = Object.entries(licenciaMap).map(([tipo, total]) => ({ tipo, total }));

    // Distribución por EPS y ARL
    const epsMap = {};
    records.forEach(r => {
      const e = r.eps || 'Sin EPS';
      epsMap[e] = (epsMap[e] || 0) + 1;
    });
    const distEps = Object.entries(epsMap).map(([eps, total]) => ({ eps, total }));

    const arlMap = {};
    records.forEach(r => {
      const a = r.arl || 'Sin ARL';
      arlMap[a] = (arlMap[a] || 0) + 1;
    });
    const distArl = Object.entries(arlMap).map(([arl, total]) => ({ arl, total }));

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
        promedioCalificacion,
        licenciasVigentes,
        licenciasPorVencer,
        licenciasVencidas
      },
      stats: {
        distEmpresas,
        distLicencias,
        distEps,
        distArl
      },
      records
    });
  } catch (err) {
    console.error('Error en API induccion conductores:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      nombre_completo,
      cedula,
      celular,
      tipo_licencia,
      fecha_vencimiento_licencia,
      eps,
      afp,
      arl,
      tipo_sangre,
      contacto_emergencia_nombre,
      contacto_emergencia_telefono,
      empresa,
      nit_empresa,
      puntuacion = 100,
      calificacion_proceso = 10,
      respuestas_evaluacion = {}
    } = body;

    if (!nombre_completo || !cedula) {
      return NextResponse.json({ error: 'Nombre completo y cédula son obligatorios' }, { status: 400 });
    }

    const estado_licencia = getLicenseStatus(fecha_vencimiento_licencia);
    const aprobado = Number(puntuacion) >= 80;

    const newRecord = {
      nombre_completo: nombre_completo.trim(),
      cedula: String(cedula).trim(),
      celular: celular ? String(celular).trim() : null,
      tipo_licencia: tipo_licencia ? String(tipo_licencia).trim() : null,
      fecha_vencimiento_licencia: fecha_vencimiento_licencia || null,
      eps: eps ? String(eps).trim() : null,
      afp: afp ? String(afp).trim() : null,
      arl: arl ? String(arl).trim() : null,
      tipo_sangre: tipo_sangre ? String(tipo_sangre).trim() : null,
      contacto_emergencia_nombre: contacto_emergencia_nombre ? String(contacto_emergencia_nombre).trim() : null,
      contacto_emergencia_telefono: contacto_emergencia_telefono ? String(contacto_emergencia_telefono).trim() : null,
      empresa: empresa ? String(empresa).trim() : 'Kopps',
      nit_empresa: nit_empresa ? String(nit_empresa).trim() : null,
      puntuacion: Number(puntuacion),
      calificacion_proceso: Number(calificacion_proceso),
      sede: 'Barrancabermeja',
      aprobado,
      estado_licencia,
      respuestas_evaluacion,
      fecha: new Date().toISOString().split('T')[0],
      marca_temporal: new Date().toISOString()
    };

    const { data, error } = await db
      .from('induccion_conductores')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      console.error('Error insertando en Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, record: data });
  } catch (err) {
    console.error('Error en POST induccion conductores:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
