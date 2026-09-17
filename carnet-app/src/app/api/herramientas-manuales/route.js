import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import db from '@/database/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Buscar archivo local según tipo como contingencia/fallback
function findExcelForType(tipo) {
  const rootDir = path.resolve(process.cwd(), '..');
  const publicDir = path.resolve(process.cwd(), 'public');
  const dataDir = path.join(publicDir, 'data');

  const searchDirs = [
    dataDir,
    path.join(publicDir, 'Barrancabermeja', 'HERRAMIENTAS MANUALES'),
    path.join(dataDir, 'herramientas'),
    path.join(rootDir, 'Barrancabermeja', 'HERRAMIENTAS MANUALES'),
    path.join(rootDir, 'scratch'),
    path.join(rootDir, 'Barrancabermeja'),
    rootDir,
    publicDir
  ];

  let pattern = 'carretilla';
  if (tipo === 'carretillas-ol') pattern = 'carretilla.*ol|ol.*carretilla|carretillas';
  else if (tipo === 'estibadores-ol') pattern = 'estibador|estibadores';
  else if (tipo === 'carretillas-uc') pattern = 'carretilla.*uc|uc.*carretilla';

  const regex = new RegExp(pattern, 'i');

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if ((file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.csv')) && regex.test(file)) {
          return { filePath: path.join(dir, file), fileName: file };
        }
      }
    } catch (e) {}
  }

  // Fallback: si se busca estibadores-ol y no hay archivo específico, buscar Carretillas OL
  if (tipo === 'estibadores-ol') {
    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if ((file.endsWith('.xlsx') || file.endsWith('.xls')) && /carretilla.*ol/i.test(file)) {
            return { filePath: path.join(dir, file), fileName: file, isShared: true };
          }
        }
      } catch (e) {}
    }
  }

  return null;
}

// Conversión de fecha serial de Excel a YYYY-MM-DD
function excelDateToJSDate(serial) {
  if (!serial) return '';
  if (typeof serial === 'string' && serial.includes('-')) return serial.split('T')[0];
  if (typeof serial === 'number') {
    try {
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toISOString().split('T')[0];
    } catch (e) {}
  }
  const d = new Date(serial);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return String(serial);
}

// Helper para calcular métricas a partir de registros estandarizados
function calculateMetricsAndFleet(records, tipo) {
  const total = records.length;
  const operativos = records.filter(r => r.estado === 'Operativo').length;
  const mantenimiento = records.filter(r => r.estado === 'Mantenimiento').length;
  const fueraServicio = records.filter(r => r.estado === 'Fuera de Servicio').length;
  const cumplimientoPct = total > 0 ? Math.round(((operativos + mantenimiento) / total) * 100) : 100;

  // Flota agrupada única
  const flotaMap = {};
  records.forEach(r => {
    const key = r.codigo || r.equipo || 'Equipo';
    if (!flotaMap[key]) {
      flotaMap[key] = {
        codigo: key,
        equipo: r.equipo || key,
        totalInspecciones: 0,
        operativos: 0,
        mantenimiento: 0,
        fueraServicio: 0,
        ultimoEstado: r.estado,
        ultimaFecha: r.fecha_inspeccion,
        ultimoInspector: r.inspector,
        area: r.area || 'Picking',
        turno: r.turno || 'Turno 1'
      };
    }
    flotaMap[key].totalInspecciones++;
    if (r.estado === 'Operativo') flotaMap[key].operativos++;
    else if (r.estado === 'Mantenimiento') flotaMap[key].mantenimiento++;
    else if (r.estado === 'Fuera de Servicio') flotaMap[key].fueraServicio++;
  });
  const flota = Object.values(flotaMap);

  // Estadísticas por componente
  const totalRec = records.length || 1;
  const componentes = {
    ruedas: Math.round((records.filter(r => r.ruedas?.includes('100') || r.ruedas?.includes('Buen') || r.ruedas === 'OK').length / totalRec) * 100),
    estructura: Math.round((records.filter(r => r.estructura?.includes('Conforme') || r.estructura?.includes('Buen') || r.estructura === 'OK').length / totalRec) * 100),
    manubrio: Math.round((records.filter(r => r.manubrio_agarre?.includes('antideslizante') || r.manubrio_agarre?.includes('Buen') || r.manubrio_agarre === 'OK').length / totalRec) * 100),
    frenos: Math.round((records.filter(r => r.freno_seguro?.includes('firmes') || r.freno_seguro?.includes('Operativo') || r.freno_seguro === 'OK').length / totalRec) * 100)
  };

  return {
    total,
    operativos,
    mantenimiento,
    fueraServicio,
    cumplimientoPct,
    flota,
    componentes,
    records
  };
}

// Plantilla de datos iniciales en espera de información
function getPlaceholderData(tipo) {
  const names = {
    'carretillas-ol': { title: 'Carretillas OL', prefix: 'CRT-OL' },
    'estibadores-ol': { title: 'Estibadores OL', prefix: 'EST-OL' },
    'carretillas-uc': { title: 'Carretillas UC', prefix: 'CRT-UC' }
  }[tipo] || { title: 'Herramientas Manuales', prefix: 'HRR' };

  const sampleRecords = [
    {
      id: 1,
      codigo: `${names.prefix}-01`,
      equipo: `${names.title} #1`,
      ubicacion: 'Zona de Picking / Almacén',
      inspector: 'Supervisor Turno A',
      fecha_inspeccion: '2026-09-10',
      estado: 'Operativo',
      ruedas: 'Buen estado',
      estructura: 'Sin deformaciones',
      manubrio_agarre: 'Con recubrimiento antideslizante',
      freno_seguro: 'Operativo',
      observaciones: 'Equipo en condiciones óptimas de seguridad'
    },
    {
      id: 2,
      codigo: `${names.prefix}-02`,
      equipo: `${names.title} #2`,
      ubicacion: 'Muelle de Cargue',
      inspector: 'Supervisor Turno B',
      fecha_inspeccion: '2026-09-12',
      estado: 'Mantenimiento',
      ruedas: 'Desgaste moderado en rueda izquierda',
      estructura: 'Requiere lubricación de eje',
      manubrio_agarre: 'Buen estado',
      freno_seguro: 'Ajuste preventivo requerido',
      observaciones: 'Programado para ajuste en taller de mantenimiento'
    },
    {
      id: 3,
      codigo: `${names.prefix}-03`,
      equipo: `${names.title} #3`,
      ubicacion: 'Patio de Maniobras',
      inspector: 'Líder SST',
      fecha_inspeccion: '2026-09-15',
      estado: 'Operativo',
      ruedas: 'Buen estado',
      estructura: 'Buen estado',
      manubrio_agarre: 'Buen estado',
      freno_seguro: 'Operativo',
      observaciones: 'Inspección periódica conforme a estándar SafeTogether'
    },
    {
      id: 4,
      codigo: `${names.prefix}-04`,
      equipo: `${names.title} #4`,
      ubicacion: 'Zona de Clasificación',
      inspector: 'Supervisor Turno A',
      fecha_inspeccion: '2026-09-08',
      estado: 'Fuera de Servicio',
      ruedas: 'Fisura en soporte de rodamiento',
      estructura: 'Fisura leve en soldadura base',
      manubrio_agarre: 'Desgaste severo',
      freno_seguro: 'No operativo',
      observaciones: 'Bloqueado con tarjeta roja hasta reparación'
    }
  ];

  return {
    isPlaceholder: true,
    total: 4,
    operativos: 2,
    mantenimiento: 1,
    fueraServicio: 1,
    cumplimientoPct: 75,
    records: sampleRecords
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'carretillas-ol';

    // 1. PRIORIDAD SUPABASE: Consultar tabla 'herramientas_manuales_inspecciones'
    try {
      const { data: supaRows, error: supaErr } = await db
        .from('herramientas_manuales_inspecciones')
        .select('*')
        .eq('submodulo', tipo)
        .order('fecha_inspeccion', { ascending: false })
        .order('id', { ascending: false });

      if (!supaErr && supaRows && supaRows.length > 0) {
        const records = supaRows.map((r, idx) => {
          const mango = r.mango_agarre !== false;
          const llantas = r.llantas_buen_estado !== false;
          const soldaduras = r.soldaduras_buen_estado !== false;
          const bases = r.bases_espaldar_buen_estado !== false;
          const buges = r.buges_llantas_buen_estado !== false;
          const pintura = r.pintura_buen_estado !== false;

          return {
            id: r.id || idx + 1,
            codigo: r.numero_equipo || `Equipo #${idx + 1}`,
            equipo: r.numero_equipo || `Equipo #${idx + 1}`,
            turno: r.turno || 'Turno 1',
            inspector: r.inspector_nombre || 'Auxiliar Operativo',
            cargo: r.cargo || 'Auxiliar',
            area: r.area || 'BODEGA OL',
            ubicacion: r.area ? `CD ${r.sede || 'Barrancabermeja'} - ${r.area}` : `CD ${r.sede || 'Barrancabermeja'}`,
            fecha_inspeccion: r.fecha_inspeccion || (r.marca_temporal ? r.marca_temporal.split('T')[0] : ''),
            estado: r.estado || 'Operativo',
            motivo: r.observaciones || 'Condiciones óptimas de seguridad',
            mango,
            llantas,
            soldaduras,
            bases,
            buges,
            pintura,
            ruedas: llantas && buges ? 'Operativas (100%)' : (!buges ? 'Bujes con desgaste' : 'Llantas en mal estado'),
            estructura: soldaduras && bases ? 'Conforme / Sin fisuras' : (!soldaduras ? 'Fisura en soldadura' : 'Deformación en espaldar'),
            manubrio_agarre: mango ? 'Con mango antideslizante' : 'Sin mango de agarre',
            freno_seguro: soldaduras ? 'Puntos de apoyo firmes' : 'Requiere ajuste en taller',
            observaciones: r.observaciones || 'Condiciones óptimas de seguridad',
            chequeos: {
              'Mango de agarre': mango ? 'Conforme' : 'No Conforme',
              'Llantas': llantas ? 'Conforme' : 'No Conforme',
              'Bujes de llantas': buges ? 'Conforme' : 'No Conforme',
              'Soldaduras estructurales': soldaduras ? 'Conforme' : 'No Conforme',
              'Bases del espaldar': bases ? 'Conforme' : 'No Conforme',
              'Pintura y acabado': pintura ? 'Conforme' : 'No Conforme'
            },
            rawData: r
          };
        });

        const metrics = calculateMetricsAndFleet(records, tipo);

        return NextResponse.json({
          success: true,
          found: true,
          source: 'supabase',
          tableName: 'herramientas_manuales_inspecciones',
          fileName: 'Supabase Cloud (Tiempo Real)',
          tipo,
          ...metrics
        });
      }
    } catch (supaEx) {
      console.warn('Supabase query fallback to Excel:', supaEx.message);
    }

    // 2. CONTINGENCIA / FALLBACK: Leer archivo Excel local
    const match = findExcelForType(tipo);

    if (match) {
      try {
        const fileBuffer = fs.readFileSync(match.filePath);
        const wb = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rawJson = XLSX.utils.sheet_to_json(sheet);

        if (rawJson && rawJson.length > 0) {
          const sampleRow = rawJson[0] || {};
          const isGoogleFormInspections = 'TIPO DE HERRAMIENTA MANUAL:' in sampleRow || 'NÚMERO DE CARRETILLA' in sampleRow;

          let records = [];

          if (isGoogleFormInspections) {
            let filteredRows = rawJson;
            if (tipo === 'carretillas-ol') {
              filteredRows = rawJson.filter(r => {
                const t = String(r['TIPO DE HERRAMIENTA MANUAL:'] || '').toUpperCase();
                const c = String(r['NÚMERO DE CARRETILLA'] || '').trim();
                return t.includes('CARRETILLA') || c.length > 0;
              });
            } else if (tipo === 'estibadores-ol') {
              filteredRows = rawJson.filter(r => {
                const t = String(r['TIPO DE HERRAMIENTA MANUAL:'] || '').toUpperCase();
                const e = String(r['NÚMERO DE ESTIBADOR \r\n'] || r['NÚMERO DE ESTIBADOR'] || '').trim();
                return t.includes('ESTIBADOR') || e.length > 0;
              });
            } else if (tipo === 'carretillas-uc') {
              filteredRows = rawJson.filter(r => {
                const t = String(r['TIPO DE HERRAMIENTA MANUAL:'] || '').toUpperCase();
                const a = String(r['AREA'] || '').toUpperCase();
                return t.includes('CARRETILLA') && a.includes('UC');
              });
            }

            records = filteredRows.map((row, idx) => {
              const carretilla = String(row['NÚMERO DE CARRETILLA'] || row['NÚMERO DE ESTIBADOR \r\n'] || `Equipo #${idx + 1}`).trim();
              const mango = String(row[' [¿ Tiene mango de agarre  ?]'] || 'SI').trim().toUpperCase() === 'SI';
              const llantas = String(row[' [¿ Las llantas se encuentran en buen estado  ?]'] || 'SI').trim().toUpperCase() === 'SI';
              const soldaduras = String(row[' [¿Las soldaduras en los puntos están en buen estado ?]'] || 'SI').trim().toUpperCase() === 'SI';
              const bases = String(row[' [¿ Las bases del espaldar y posterior se encuentran en buen estado  ?]'] || 'SI').trim().toUpperCase() === 'SI';
              const buges = String(row[' [¿ Los buges de las llantas  están en buenas condiciones  ?]'] || 'SI').trim().toUpperCase() === 'SI';
              const pintura = String(row[' [¿La pintura esta en buenas condiciones?]'] || 'SI').trim().toUpperCase() === 'SI';

              let estado = 'Operativo';
              let motivo = 'Condiciones óptimas de seguridad';
              if (!soldaduras || !bases) {
                estado = 'Fuera de Servicio';
                motivo = !soldaduras ? 'Fisura en soldadura estructural' : 'Deformación en base del espaldar';
              } else if (!llantas || !buges || !mango) {
                estado = 'Mantenimiento';
                motivo = !buges ? 'Desgaste en bujes de rodadura' : (!llantas ? 'Desgaste en llantas' : 'Falta mango antideslizante');
              } else if (!pintura) {
                estado = 'Operativo';
                motivo = 'Pintura con desgaste (observación estética)';
              }

              const turnoRaw = row['TURNO*'] || row['Turno'] || 'Turno A';
              const inspectorRaw = row['NOMBRE COMPLETO:\r\n'] || row['NOMBRE COMPLETO:'] || row['Inspector'] || 'Auxiliar Operativo';
              const areaRaw = row['AREA'] || 'Picking';
              const fecha = excelDateToJSDate(row['FECHA DE INSPECCION'] || row['Marca temporal']);

              return {
                id: idx + 1,
                codigo: carretilla,
                equipo: carretilla,
                turno: String(turnoRaw).trim(),
                inspector: String(inspectorRaw).trim(),
                cargo: row['CARGO:'] || 'Auxiliar',
                area: String(areaRaw).trim(),
                ubicacion: areaRaw ? `CD Barrancabermeja - ${areaRaw}` : 'CD Barrancabermeja',
                fecha_inspeccion: fecha || new Date().toISOString().split('T')[0],
                estado,
                motivo,
                mango,
                llantas,
                soldaduras,
                bases,
                buges,
                pintura,
                ruedas: llantas && buges ? 'Operativas (100%)' : (!buges ? 'Bujes con desgaste' : 'Llantas en mal estado'),
                estructura: soldaduras && bases ? 'Conforme / Sin fisuras' : (!soldaduras ? 'Fisura en soldadura' : 'Deformación en espaldar'),
                manubrio_agarre: mango ? 'Con mango antideslizante' : 'Sin mango de agarre',
                freno_seguro: soldaduras ? 'Puntos de apoyo firmes' : 'Requiere ajuste en taller',
                observaciones: motivo,
                chequeos: {
                  'Mango de agarre': mango ? 'Conforme' : 'No Conforme',
                  'Llantas': llantas ? 'Conforme' : 'No Conforme',
                  'Bujes de llantas': buges ? 'Conforme' : 'No Conforme',
                  'Soldaduras estructurales': soldaduras ? 'Conforme' : 'No Conforme',
                  'Bases del espaldar': bases ? 'Conforme' : 'No Conforme',
                  'Pintura y acabado': pintura ? 'Conforme' : 'No Conforme'
                },
                rawData: row
              };
            });
          } else {
            records = rawJson.map((row, idx) => {
              const codigo = row['CODIGO'] || row['CÓDIGO'] || row['Codigo'] || row['ID'] || row['Equipo'] || `EQ-${idx + 1}`;
              const equipo = row['EQUIPO'] || row['DESCRIPCION'] || row['Nombre'] || `${tipo.toUpperCase()} #${idx + 1}`;
              const estadoRaw = String(row['ESTADO'] || row['Estado'] || row['CALIFICACION'] || 'Operativo').trim().toLowerCase();
              
              let estado = 'Operativo';
              if (estadoRaw.includes('mal') || estadoRaw.includes('fuera') || estadoRaw.includes('rojo') || estadoRaw.includes('bloqueado')) {
                estado = 'Fuera de Servicio';
              } else if (estadoRaw.includes('mantenimiento') || estadoRaw.includes('regular') || estadoRaw.includes('amarillo') || estadoRaw.includes('ajuste')) {
                estado = 'Mantenimiento';
              }

              return {
                id: idx + 1,
                codigo: String(codigo).trim(),
                equipo: String(equipo).trim(),
                ubicacion: row['UBICACION'] || row['Ubicación'] || row['Sede'] || 'CD Barrancabermeja',
                inspector: row['INSPECTOR'] || row['Inspector'] || row['Responsable'] || 'Supervisor',
                fecha_inspeccion: excelDateToJSDate(row['FECHA'] || row['Fecha']) || new Date().toISOString().split('T')[0],
                estado,
                ruedas: row['RUEDAS'] || row['Ruedas'] || row['Estado Ruedas'] || 'OK',
                estructura: row['ESTRUCTURA'] || row['Estructura'] || 'OK',
                manubrio_agarre: row['MANUBRIO'] || row['Agarre'] || 'OK',
                freno_seguro: row['FRENOS'] || row['Seguros'] || 'OK',
                observaciones: row['OBSERVACIONES'] || row['Observaciones'] || row['Hallazgos'] || 'Inspeccionado',
                rawData: row
              };
            });
          }

          if (records.length > 0) {
            const metrics = calculateMetricsAndFleet(records, tipo);
            return NextResponse.json({
              success: true,
              found: true,
              source: 'excel',
              fileName: match.fileName,
              tipo,
              ...metrics
            });
          }
        }
      } catch (readErr) {
        console.warn(`Error leyendo Excel ${match.filePath}:`, readErr.message);
      }
    }

    // 3. Fallback a datos demostrativos esperando archivo
    const placeholder = getPlaceholderData(tipo);
    return NextResponse.json({
      success: true,
      found: false,
      source: 'demo',
      message: `Esperando base de datos Excel para ${tipo}. Puedes colocar el archivo en scratch/ o subirlo directamente.`,
      tipo,
      ...placeholder
    });

  } catch (err) {
    console.error('Error en API herramientas manuales:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // A. Inserción directa de nueva inspección en formato JSON hacia Supabase
    if (contentType.includes('application/json')) {
      const body = await request.json();

      const submodulo = body.submodulo || body.tipo || 'carretillas-ol';
      const isCarretilla = submodulo.includes('carretilla');

      const mango = body.mango_agarre ?? body.mango ?? true;
      const llantas = body.llantas_buen_estado ?? body.llantas ?? true;
      const soldaduras = body.soldaduras_buen_estado ?? body.soldaduras ?? true;
      const bases = body.bases_espaldar_buen_estado ?? body.bases ?? true;
      const buges = body.buges_llantas_buen_estado ?? body.buges ?? true;
      const pintura = body.pintura_buen_estado ?? body.pintura ?? true;

      let estado = body.estado || 'Operativo';
      let observaciones = body.observaciones || 'Condiciones óptimas de seguridad';

      if (!soldaduras || !bases) {
        estado = 'Fuera de Servicio';
        observaciones = !soldaduras ? 'Fisura en soldadura estructural' : 'Deformación en base del espaldar';
      } else if (!llantas || !buges || !mango) {
        estado = 'Mantenimiento';
        observaciones = !buges ? 'Desgaste en bujes de rodadura' : (!llantas ? 'Desgaste en llantas' : 'Falta mango antideslizante');
      }

      const { data: newRow, error: insertError } = await db
        .from('herramientas_manuales_inspecciones')
        .insert([{
          marca_temporal: new Date().toISOString(),
          fecha_inspeccion: body.fecha_inspeccion || new Date().toISOString().split('T')[0],
          turno: body.turno || 'Turno 1',
          inspector_nombre: body.inspector || body.inspector_nombre || 'Auxiliar Operativo',
          cargo: body.cargo || 'Auxiliar',
          area: body.area || 'BODEGA OL',
          sede: body.sede || 'Barrancabermeja',
          submodulo: submodulo,
          tipo_herramienta: body.tipo_herramienta || (isCarretilla ? 'CARRETILLAS' : 'ESTIBADORES'),
          numero_equipo: body.numero_equipo || body.equipo || body.codigo || 'CARRETILLA 1',
          mango_agarre: mango,
          llantas_buen_estado: llantas,
          soldaduras_buen_estado: soldaduras,
          bases_espaldar_buen_estado: bases,
          buges_llantas_buen_estado: buges,
          pintura_buen_estado: pintura,
          estado: estado,
          observaciones: observaciones,
          chequeos_extra: body.chequeos_extra || {}
        }])
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Inspección guardada y sincronizada exitosamente en Supabase Cloud',
        data: newRow
      });
    }

    // B. Carga de archivo Excel y sincronización a Supabase
    const formData = await request.formData();
    const file = formData.get('file');
    const tipo = formData.get('tipo') || 'carretillas-ol';

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Guardar en public/data
    const publicDir = path.resolve(process.cwd(), 'public', 'data');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const saveName = `${tipo}_${Date.now()}.xlsx`;
    const savePath = path.join(publicDir, saveName);
    fs.writeFileSync(savePath, buffer);

    // Parsear y sincronizar inmediatamente hacia Supabase
    let syncedCount = 0;
    try {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      if (rows && rows.length > 0) {
        const toInsert = rows.map(r => {
          const tipoHrr = String(r['TIPO DE HERRAMIENTA MANUAL:'] || '').trim().toUpperCase();
          const numEquipo = String(r['NÚMERO DE CARRETILLA'] || r['NÚMERO DE ESTIBADOR \r\n'] || r['NÚMERO DE ESTIBADOR'] || '').trim();

          const mango = String(r[' [¿ Tiene mango de agarre  ?]'] || 'SI').trim().toUpperCase() === 'SI';
          const llantas = String(r[' [¿ Las llantas se encuentran en buen estado  ?]'] || 'SI').trim().toUpperCase() === 'SI';
          const soldaduras = String(r[' [¿Las soldaduras en los puntos están en buen estado ?]'] || 'SI').trim().toUpperCase() === 'SI';
          const bases = String(r[' [¿ Las bases del espaldar y posterior se encuentran en buen estado  ?]'] || 'SI').trim().toUpperCase() === 'SI';
          const buges = String(r[' [¿ Los buges de las llantas  están en buenas condiciones  ?]'] || 'SI').trim().toUpperCase() === 'SI';
          const pintura = String(r[' [¿La pintura esta en buenas condiciones?]'] || 'SI').trim().toUpperCase() === 'SI';

          let estado = 'Operativo';
          let motivo = 'Condiciones óptimas de seguridad';
          if (!soldaduras || !bases) {
            estado = 'Fuera de Servicio';
            motivo = !soldaduras ? 'Fisura en soldadura estructural' : 'Deformación en base del espaldar';
          } else if (!llantas || !buges || !mango) {
            estado = 'Mantenimiento';
            motivo = !buges ? 'Desgaste en bujes de rodadura' : (!llantas ? 'Desgaste en llantas' : 'Falta mango antideslizante');
          }

          const fecha = excelDateToJSDate(r['FECHA DE INSPECCION'] || r['Marca temporal']);

          return {
            marca_temporal: new Date().toISOString(),
            fecha_inspeccion: fecha || new Date().toISOString().split('T')[0],
            turno: String(r['TURNO*'] || r['Turno'] || 'Turno 1').trim(),
            inspector_nombre: String(r['NOMBRE COMPLETO:\r\n'] || r['NOMBRE COMPLETO:'] || 'Auxiliar').trim(),
            cargo: String(r['CARGO:'] || 'Auxiliar').trim(),
            area: String(r['AREA'] || 'BODEGA OL').trim(),
            sede: 'Barrancabermeja',
            submodulo: tipo,
            tipo_herramienta: tipoHrr || 'CARRETILLAS',
            numero_equipo: numEquipo || 'EQUIPO',
            mango_agarre: mango,
            llantas_buen_estado: llantas,
            soldaduras_buen_estado: soldaduras,
            bases_espaldar_buen_estado: bases,
            buges_llantas_buen_estado: buges,
            pintura_buen_estado: pintura,
            estado: estado,
            observaciones: motivo,
            chequeos_extra: { uploadSource: saveName }
          };
        });

        // Insertar en Supabase en lotes
        for (let i = 0; i < toInsert.length; i += 100) {
          const batch = toInsert.slice(i, i + 100);
          await db.from('herramientas_manuales_inspecciones').insert(batch);
          syncedCount += batch.length;
        }
      }
    } catch (parseErr) {
      console.warn('Advertencia durante la sincronización a Supabase:', parseErr.message);
    }

    return NextResponse.json({
      success: true,
      message: `Archivo ${file.name} guardado y sincronizado (${syncedCount} registros en Supabase Cloud)`,
      fileName: saveName,
      syncedCount
    });
  } catch (err) {
    console.error('Error al procesar archivo en herramientas:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
