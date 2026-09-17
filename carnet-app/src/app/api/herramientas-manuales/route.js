import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Buscar archivo según tipo
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

  // Patrones de búsqueda según tipo
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

  // Fallback: si se busca estibadores-ol y no hay archivo específico, buscar Carretillas OL que contiene registros de estibadores
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
  if (typeof serial === 'string' && serial.includes('-')) return serial;
  if (typeof serial === 'number') {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
  }
  return String(serial);
}

// Plantilla de registros iniciales cuando aún no se ha subido el archivo Excel
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
            // Filtrar y parsear según el tipo específico
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
            // Parser genérico para otros formatos
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
            const total = records.length;
            const operativos = records.filter(r => r.estado === 'Operativo').length;
            const mantenimiento = records.filter(r => r.estado === 'Mantenimiento').length;
            const fueraServicio = records.filter(r => r.estado === 'Fuera de Servicio').length;
            const cumplimientoPct = total > 0 ? Math.round(((operativos + mantenimiento) / total) * 100) : 100;

            // Flota de carretillas únicas
            const flotaMap = {};
            records.forEach(r => {
              if (!flotaMap[r.codigo]) {
                flotaMap[r.codigo] = {
                  codigo: r.codigo,
                  equipo: r.equipo,
                  totalInspecciones: 0,
                  operativos: 0,
                  mantenimiento: 0,
                  fueraServicio: 0,
                  ultimoEstado: r.estado,
                  ultimaFecha: r.fecha_inspeccion,
                  ultimoInspector: r.inspector,
                  area: r.area || 'Picking',
                  turno: r.turno || 'Turno A'
                };
              }
              flotaMap[r.codigo].totalInspecciones++;
              if (r.estado === 'Operativo') flotaMap[r.codigo].operativos++;
              else if (r.estado === 'Mantenimiento') flotaMap[r.codigo].mantenimiento++;
              else if (r.estado === 'Fuera de Servicio') flotaMap[r.codigo].fueraServicio++;
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

            return NextResponse.json({
              success: true,
              found: true,
              fileName: match.fileName,
              tipo,
              total,
              operativos,
              mantenimiento,
              fueraServicio,
              cumplimientoPct,
              flota,
              componentes,
              records
            });
          }
        }
      } catch (readErr) {
        console.warn(`Error leyendo Excel ${match.filePath}:`, readErr.message);
      }
    }

    // Si aún no se ha colocado el Excel en scratch, devolver plantilla esperando el archivo
    const placeholder = getPlaceholderData(tipo);
    return NextResponse.json({
      success: true,
      found: false,
      message: `Esperando base de datos Excel para ${tipo}. Puedes colocar el archivo en la carpeta scratch/ o subirlo directamente aquí.`,
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
    const formData = await request.formData();
    const file = formData.get('file');
    const tipo = formData.get('tipo') || 'carretillas-ol';

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const publicDir = path.resolve(process.cwd(), 'public', 'data');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const saveName = `${tipo}_${Date.now()}.xlsx`;
    const savePath = path.join(publicDir, saveName);
    fs.writeFileSync(savePath, buffer);

    return NextResponse.json({
      success: true,
      message: `Archivo ${file.name} guardado con éxito como ${saveName}`,
      fileName: saveName
    });
  } catch (err) {
    console.error('Error al subir Excel de herramientas:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
