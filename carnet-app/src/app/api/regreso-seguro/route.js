import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import db from '@/database/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatExcelDate(val) {
  if (!val) return null;
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
  const str = String(val).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return str;
}

function getDocumentStatus(dateStr) {
  if (!dateStr) return 'Sin fecha';
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return 'Desconocido';
  const now = new Date();
  const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Vencido';
  if (diffDays <= 30) return 'Por Vencer';
  return 'Vigente';
}

function readExcelFallback() {
  try {
    const parentDir = path.resolve(process.cwd(), '..');
    const publicDir = path.resolve(process.cwd(), 'public');

    const candidates = [
      path.join(publicDir, 'data', 'REGRESO SEGURO A CASA B.xlsx'),
      path.join(publicDir, 'Barrancabermeja', 'REGRESO SEGURO A CASA B.xlsx'),
      path.join(publicDir, 'REGRESO SEGURO A CASA B.xlsx'),
      path.join(parentDir, 'REGRESO SEGURO A CASA B.xlsx'),
      path.join(parentDir, 'Barrancabermeja', 'Regreso seguro a casa', 'REGRESO SEGURO A CASA B.xlsx')
    ];

    let filePath = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        filePath = c;
        break;
      }
    }

    if (!filePath) return { records: [], inspecciones: [] };

    const fileBuffer = fs.readFileSync(filePath);
    const wb = XLSX.read(fileBuffer, { type: 'buffer' });

    // Hoja 1
    const ws1 = wb.Sheets['Respuestas de formulario 1'] || wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(ws1, { header: 1 });
    const headers = rawRows[0] || [];

    const records = [];
    for (let i = 1; i < rawRows.length; i++) {
      const r = rawRows[i];
      if (!r || !r[1] || !r[2]) continue;

      const rolPrincipal = String(r[9] || '').trim();
      const placaCarro = r[10] ? String(r[10]).trim().toUpperCase() : null;
      const placaMoto = r[18] ? String(r[18]).trim().toUpperCase() : null;
      const placa = placaMoto || placaCarro || null;

      const soatCarro = formatExcelDate(r[11]);
      const soatMoto = formatExcelDate(r[19]);
      const soatVencimiento = soatMoto || soatCarro || null;

      const tecnoCarro = formatExcelDate(r[12]);
      const tecnoMoto = formatExcelDate(r[20]);
      const tecnoVencimiento = tecnoMoto || tecnoCarro || null;
      const licVencimiento = formatExcelDate(r[53]);

      let tipoVehiculo = 'Peatón';
      if (rolPrincipal.toLowerCase().includes('moto') || placaMoto) {
        tipoVehiculo = rolPrincipal.toLowerCase().includes('pasajero') ? 'Pasajero Moto' : 'Motocicleta';
      } else if (rolPrincipal.toLowerCase().includes('vehiculo') || rolPrincipal.toLowerCase().includes('carro') || placaCarro) {
        tipoVehiculo = 'Automóvil';
      } else if (rolPrincipal.toLowerCase().includes('bici')) {
        tipoVehiculo = 'Bicicleta';
      } else if (rolPrincipal.toLowerCase().includes('servicio p') || rolPrincipal.toLowerCase().includes('público')) {
        tipoVehiculo = 'Transporte Público';
      }

      const riesgos = [];
      headers.forEach((colName, colIdx) => {
        if (colName && colName.includes('Seleccione los riesgos viales')) {
          const val = r[colIdx];
          if (val && (String(val).toLowerCase() === 'aplica' || String(val).toLowerCase() === 'si' || String(val).toLowerCase() === 'sí')) {
            const match = colName.match(/\[(.*?)\]/);
            const riesgoNombre = match ? match[1].trim() : colName;
            if (!riesgos.includes(riesgoNombre)) riesgos.push(riesgoNombre);
          }
        }
      });

      const epp = [];
      headers.forEach((colName, colIdx) => {
        if (colName && colName.includes('elementos de seguridad y proteción')) {
          const val = r[colIdx];
          if (val && (String(val).toLowerCase() === 'aplica' || String(val).toLowerCase() === 'si' || String(val).toLowerCase() === 'sí')) {
            const match = colName.match(/\[(.*?)\]/);
            const eppNombre = match ? match[1].trim() : colName;
            if (!epp.includes(eppNombre)) epp.push(eppNombre);
          }
        }
      });

      records.push({
        id: i,
        sede: 'Barrancabermeja',
        fecha_registro: formatExcelDate(r[0]),
        nombre: String(r[1]).trim(),
        cedula: String(r[2]).trim(),
        empresa: String(r[3] || 'C&R ASOCIADOS SAS').trim(),
        cargo: String(r[4] || '').trim(),
        ciudad: String(r[5] || 'Barrancabermeja').trim(),
        barrio: String(r[6] || '').trim(),
        tiempo_desplazamiento: String(r[7] || '').trim(),
        tipo_licencia: String(r[8] || '').trim(),
        fecha_vencimiento_licencia: licVencimiento,
        rol_principal: rolPrincipal,
        propiedad_vehiculo: String(r[50] || (placa ? 'Propio' : 'No tiene')).trim(),
        placa,
        tipo_vehiculo: tipoVehiculo,
        soat_vencimiento: soatVencimiento,
        tecnomecanica_vencimiento: tecnoVencimiento,
        casco_reglamentario: String(r[51] || r[52] || '').trim(),
        riesgos_identificados: riesgos,
        epp_elementos: epp
      });
    }

    // Hoja 2
    const ws2 = wb.Sheets['Respuestas de formulario 2'] || wb.Sheets[wb.SheetNames[1]];
    const rawInspecciones = ws2 ? XLSX.utils.sheet_to_json(ws2) : [];
    const inspecciones = rawInspecciones.map((row, idx) => ({
      id: idx + 1,
      sede: 'Barrancabermeja',
      fecha_inspeccion: formatExcelDate(row['Marca temporal']),
      propietario: String(row['PROPIETARIO DEL VÉHICULO'] || '').trim(),
      placa: String(row['PLACA DEL HEHÍCULO'] || '').trim().toUpperCase(),
      marca: String(row['MARCA'] || '').trim(),
      modelo: Number(row['MODELO']) || null,
      cilindraje: Number(row['CILINDRAJE CC']) || null,
      color: String(row['COLOR'] || '').trim(),
      combustible: String(row['COMBUSTIBLE'] || 'GASOLINA').trim(),
      soat: String(row['SOAT'] || 'SI').trim(),
      soat_vencimiento: formatExcelDate(row['FECHA DE VENCIMIENTO DE SOAT']),
      tecnomecanica: String(row['TECNÓMECANICA'] || 'SI').trim(),
      tecnomecanica_vencimiento: formatExcelDate(row['FECHA DE VENCIMIENTO DE TECNÓ MECANICA']),
      licencia: String(row['LICENCIA DE CONDUCCIÓN'] || 'SI').trim(),
      licencia_vencimiento: formatExcelDate(row['FECHA DE VENCIMIENTO DE CONDUCCIÓN']),
      tarjeta_propiedad: String(row['TARJETA DE PROPIEDAD'] || 'SI').trim(),
      detalles_inspeccion: row
    }));

    return { records, inspecciones };
  } catch (e) {
    console.error('Error en readExcelFallback regreso seguro:', e);
    return { records: [], inspecciones: [] };
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterSede = searchParams.get('sede');
    const filterEmpresa = searchParams.get('empresa');
    const filterRol = searchParams.get('rol');

    let records = [];
    let inspecciones = [];
    let source = 'supabase';

    // 1. Intentar consultar Supabase
    try {
      let query = db.from('regreso_seguro').select('*').order('id', { ascending: true });
      if (filterSede && filterSede !== 'Todas') {
        query = query.ilike('sede', `%${filterSede}%`);
      }
      if (filterEmpresa && filterEmpresa !== 'Todas') {
        query = query.eq('empresa', filterEmpresa);
      }
      if (filterRol && filterRol !== 'Todos') {
        query = query.eq('rol_principal', filterRol);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        records = data;

        const { data: inspData } = await db.from('regreso_seguro_inspecciones').select('*').order('id', { ascending: true });
        if (Array.isArray(inspData)) {
          inspecciones = inspData;
        }
      }
    } catch (dbErr) {
      console.warn('Error conectando a Supabase regreso_seguro, usando fallback Excel:', dbErr.message);
    }

    // 2. Si no hay datos de Supabase, recurrir al archivo local
    if (records.length === 0) {
      const fb = readExcelFallback();
      records = fb.records;
      inspecciones = fb.inspecciones;
      source = 'excel';
    }

    // 3. Normalizar estado de documentos
    const recordsWithStatus = records.map(r => ({
      ...r,
      estado_soat: r.placa ? getDocumentStatus(r.soat_vencimiento) : 'No aplica',
      estado_tecnomecanica: r.placa ? getDocumentStatus(r.tecnomecanica_vencimiento) : 'No aplica',
      estado_licencia: r.fecha_vencimiento_licencia ? getDocumentStatus(r.fecha_vencimiento_licencia) : 'Sin fecha'
    }));

    // 4. Calcular métricas y estadísticas consolidadas
    const total = recordsWithStatus.length;
    const conVehiculo = recordsWithStatus.filter(r => r.placa || r.tipo_vehiculo === 'Motocicleta' || r.tipo_vehiculo === 'Automóvil').length;

    // Distribución por empresas
    const empresaCount = {};
    recordsWithStatus.forEach(r => {
      const e = r.empresa || 'Otra';
      empresaCount[e] = (empresaCount[e] || 0) + 1;
    });
    const distEmpresas = Object.entries(empresaCount).map(([name, count]) => ({
      name,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0
    }));

    // Distribución por roles
    const rolCount = {};
    recordsWithStatus.forEach(r => {
      const rol = r.rol_principal || 'No especificado';
      rolCount[rol] = (rolCount[rol] || 0) + 1;
    });
    const distRoles = Object.entries(rolCount).map(([rol, count]) => ({
      rol,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0
    }));

    // Distribución de tiempos
    const tiemposCount = {};
    recordsWithStatus.forEach(r => {
      const t = r.tiempo_desplazamiento || 'No especificado';
      tiemposCount[t] = (tiemposCount[t] || 0) + 1;
    });
    const distTiempos = Object.entries(tiemposCount).map(([tiempo, count]) => ({ tiempo, count }));

    // Top riesgos viales consolidados
    const riesgosCount = {};
    recordsWithStatus.forEach(r => {
      const arr = Array.isArray(r.riesgos_identificados) ? r.riesgos_identificados : [];
      arr.forEach(rg => {
        if (!rg) return;
        const cleanRg = rg.trim();
        riesgosCount[cleanRg] = (riesgosCount[cleanRg] || 0) + 1;
      });
    });
    const topRiesgos = Object.entries(riesgosCount)
      .map(([riesgo, count]) => ({
        riesgo,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // EPPs
    const eppCount = {};
    recordsWithStatus.forEach(r => {
      const arr = Array.isArray(r.epp_elementos) ? r.epp_elementos : [];
      arr.forEach(ep => {
        if (!ep) return;
        const cleanEp = ep.trim();
        eppCount[cleanEp] = (eppCount[cleanEp] || 0) + 1;
      });
    });
    const distEpp = Object.entries(eppCount)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count);

    // Semáforo documental SOAT / Tecnomecánica / Licencias
    const vehiculosRegistrados = recordsWithStatus.filter(r => r.placa);
    const soatVigentes = vehiculosRegistrados.filter(r => r.estado_soat === 'Vigente').length;
    const soatPorVencer = vehiculosRegistrados.filter(r => r.estado_soat === 'Por Vencer').length;
    const soatVencidos = vehiculosRegistrados.filter(r => r.estado_soat === 'Vencido').length;

    const tecnoVigentes = vehiculosRegistrados.filter(r => r.estado_tecnomecanica === 'Vigente').length;
    const tecnoPorVencer = vehiculosRegistrados.filter(r => r.estado_tecnomecanica === 'Por Vencer').length;
    const tecnoVencidas = vehiculosRegistrados.filter(r => r.estado_tecnomecanica === 'Vencido').length;

    return NextResponse.json({
      success: true,
      source,
      total,
      kpis: {
        totalEncuestados: total,
        totalVehiculosRegistrados: vehiculosRegistrados.length,
        conductoresMoto: recordsWithStatus.filter(r => (r.rol_principal || '').toLowerCase().includes('conductor motocicleta')).length,
        pasajerosMoto: recordsWithStatus.filter(r => (r.rol_principal || '').toLowerCase().includes('pasajero de motocicleta')).length,
        peatones: recordsWithStatus.filter(r => (r.rol_principal || '').toLowerCase().includes('peatón') || (r.rol_principal || '').toLowerCase().includes('peaton')).length,
        transportePublico: recordsWithStatus.filter(r => (r.rol_principal || '').toLowerCase().includes('servicio p')).length,
        conductoresCarro: recordsWithStatus.filter(r => (r.rol_principal || '').toLowerCase().includes('vehiculo particular')).length,
        ciclistas: recordsWithStatus.filter(r => (r.rol_principal || '').toLowerCase().includes('bicicleta')).length,
        documentacion: {
          soat: { vigentes: soatVigentes, porVencer: soatPorVencer, vencidos: soatVencidos },
          tecnomecanica: { vigentes: tecnoVigentes, porVencer: tecnoPorVencer, vencidos: tecnoVencidas }
        }
      },
      stats: {
        distEmpresas,
        distRoles,
        distTiempos,
        topRiesgos,
        distEpp
      },
      records: recordsWithStatus,
      inspecciones
    });
  } catch (err) {
    console.error('Error en API regreso-seguro:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      nombre,
      cedula,
      empresa = 'C&R ASOCIADOS SAS',
      cargo = '',
      ciudad = 'Barrancabermeja',
      barrio = '',
      tiempo_desplazamiento = 'Menos de 1 hora',
      tipo_licencia = '',
      rol_principal = 'Pasajero de motocicleta',
      placa = null,
      soat_vencimiento = null,
      tecnomecanica_vencimiento = null,
      riesgos_identificados = [],
      epp_elementos = [],
      sede = 'Barrancabermeja'
    } = body;

    if (!nombre || !cedula) {
      return NextResponse.json({ error: 'Nombre y Cédula son obligatorios' }, { status: 400 });
    }

    const newRecord = {
      sede,
      fecha_registro: new Date().toISOString().split('T')[0],
      marca_temporal: new Date().toISOString(),
      nombre: String(nombre).trim(),
      cedula: String(cedula).trim(),
      empresa: String(empresa).trim(),
      cargo: String(cargo).trim(),
      ciudad: String(ciudad).trim(),
      barrio: String(barrio).trim(),
      tiempo_desplazamiento: String(tiempo_desplazamiento).trim(),
      tipo_licencia: String(tipo_licencia).trim(),
      rol_principal: String(rol_principal).trim(),
      placa: placa ? String(placa).trim().toUpperCase() : null,
      soat_vencimiento: soat_vencimiento || null,
      tecnomecanica_vencimiento: tecnomecanica_vencimiento || null,
      riesgos_identificados,
      epp_elementos
    };

    const { data, error } = await db
      .from('regreso_seguro')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      console.error('Error insertando en Supabase regreso_seguro:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, record: data });
  } catch (err) {
    console.error('Error en POST regreso-seguro:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
