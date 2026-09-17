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
    path.join(dataDir, 'herramientas'),
    publicDir,
    rootDir,
    path.join(rootDir, 'scratch'),
    path.join(rootDir, 'Barrancabermeja')
  ];

  // Patrones de búsqueda según tipo
  let pattern = 'carretilla';
  if (tipo === 'carretillas-ol') pattern = 'carretilla.*ol|ol.*carretilla';
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
  return null;
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
          const records = rawJson.map((row, idx) => {
            // Normalizar campos comunes de inspecciones de herramientas
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
              fecha_inspeccion: row['FECHA'] || row['Fecha'] || new Date().toISOString().split('T')[0],
              estado,
              ruedas: row['RUEDAS'] || row['Ruedas'] || row['Estado Ruedas'] || 'OK',
              estructura: row['ESTRUCTURA'] || row['Estructura'] || 'OK',
              manubrio_agarre: row['MANUBRIO'] || row['Agarre'] || 'OK',
              freno_seguro: row['FRENOS'] || row['Seguros'] || 'OK',
              observaciones: row['OBSERVACIONES'] || row['Observaciones'] || row['Hallazgos'] || 'Inspeccionado',
              rawData: row
            };
          });

          const total = records.length;
          const operativos = records.filter(r => r.estado === 'Operativo').length;
          const mantenimiento = records.filter(r => r.estado === 'Mantenimiento').length;
          const fueraServicio = records.filter(r => r.estado === 'Fuera de Servicio').length;
          const cumplimientoPct = total > 0 ? Math.round(((operativos + mantenimiento) / total) * 100) : 100;

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
            records
          });
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
