const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tzyelxvrutltxoygiety.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6eWVseHZydXRsdHhveWdpZXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzY2NzAsImV4cCI6MjA4NTA1MjY3MH0.fR6wa9UA8sNobNbCYV6XGBz4d0k-QLRieDSuAYXVqhI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function excelDateToJSDate(serial) {
  if (!serial) return null;
  if (typeof serial === 'string' && serial.includes('-')) return serial;
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
  return null;
}

function parseExcelDateTime(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(val);
      if (d && d.y) {
        const dateObj = new Date(Date.UTC(d.y, d.m - 1, d.d, d.H || 0, d.M || 0, Math.floor(d.S || 0)));
        return dateObj.toISOString();
      }
    } catch (e) {}
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString();
  return null;
}

async function runSync() {
  console.log('🚀 Iniciando sincronización de CARRETILLAS OL con Supabase...');
  
  const possiblePaths = [
    path.join(__dirname, 'Barrancabermeja', 'HERRAMIENTAS MANUALES', 'Carretillas OL.xlsx'),
    path.join(__dirname, 'carnet-app', 'public', 'data', 'Carretillas OL.xlsx'),
    path.join(__dirname, 'carnet-app', 'public', 'Barrancabermeja', 'HERRAMIENTAS MANUALES', 'Carretillas OL.xlsx')
  ];

  let filePath = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    console.error('❌ No se encontró el archivo Carretillas OL.xlsx en ninguna de las rutas esperadas');
    process.exit(1);
  }

  console.log(`📖 Leyendo archivo: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`📊 Total de filas en el archivo: ${rows.length}`);

  const recordsToInsert = [];
  let carretillasCount = 0;
  let estibadoresCount = 0;

  for (const r of rows) {
    const tipo = String(r['TIPO DE HERRAMIENTA MANUAL:'] || '').trim().toUpperCase();
    const numeroCarretilla = String(r['NÚMERO DE CARRETILLA'] || '').trim();

    const isCarretilla = tipo.includes('CARRETILLA') || numeroCarretilla.length > 0;
    const isEstibador = tipo.includes('ESTIBADOR');

    let submodulo = 'otro';
    if (isCarretilla) {
      submodulo = 'carretillas-ol';
      carretillasCount++;
    } else if (isEstibador) {
      submodulo = 'estibadores-ol';
      estibadoresCount++;
    }

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
      motivo = !soldaduras ? 'Fisura/falla en puntos de soldadura' : 'Daño en base del espaldar/posterior';
    } else if (!llantas || !buges || !mango) {
      estado = 'Mantenimiento';
      motivo = !buges ? 'Desgaste en buges de llantas' : (!llantas ? 'Desgaste/daño en llantas' : 'Falta mango de agarre ergonómico');
    } else if (!pintura) {
      motivo = 'Pintura deteriorada (observación estética)';
    }

    const fechaInspeccion = excelDateToJSDate(r['FECHA DE INSPECCION']) || excelDateToJSDate(r['Marca temporal']);
    const marcaTemporal = parseExcelDateTime(r['Marca temporal']) || (fechaInspeccion ? new Date(fechaInspeccion).toISOString() : new Date().toISOString());

    recordsToInsert.push({
      marca_temporal: marcaTemporal,
      fecha_inspeccion: fechaInspeccion,
      turno: r['TURNO*'] ? String(r['TURNO*']).trim() : 'Turno 1',
      inspector_nombre: (r['NOMBRE COMPLETO:\r\n'] || r['NOMBRE COMPLETO:'] || 'Auxiliar').trim(),
      cargo: (r['CARGO:'] || 'Auxiliar Operativo').trim(),
      area: (r['AREA'] || 'BODEGA OL').trim(),
      sede: 'Barrancabermeja',
      submodulo: submodulo,
      tipo_herramienta: tipo || (isCarretilla ? 'CARRETILLAS' : 'HERRAMIENTAS MANUALES'),
      numero_equipo: numeroCarretilla || (isCarretilla ? 'CARRETILLA' : 'EQUIPO'),
      mango_agarre: mango,
      llantas_buen_estado: llantas,
      soldaduras_buen_estado: soldaduras,
      bases_espaldar_buen_estado: bases,
      buges_llantas_buen_estado: buges,
      pintura_buen_estado: pintura,
      estado: estado,
      observaciones: motivo,
      chequeos_extra: {
        marca_temporal_original: r['Marca temporal'],
        fecha_original: r['FECHA DE INSPECCION']
      }
    });
  }

  console.log(`🔍 Registros clasificados:`);
  console.log(`   - Carretillas OL: ${carretillasCount}`);
  console.log(`   - Estibadores OL: ${estibadoresCount}`);
  console.log(`   - Total a sincronizar: ${recordsToInsert.length}`);

  console.log('🧹 Limpiando registros previos en Supabase...');
  const { error: delError } = await supabase
    .from('herramientas_manuales_inspecciones')
    .delete()
    .neq('id', 0);

  if (delError) {
    console.warn('⚠️ Nota sobre limpieza previa:', delError.message);
  }

  const BATCH_SIZE = 100;
  let insertedTotal = 0;

  for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
    const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from('herramientas_manuales_inspecciones')
      .insert(batch);

    if (error) {
      console.error(`❌ Error insertando lote ${i} a ${i + batch.length}:`, error.message);
    } else {
      insertedTotal += batch.length;
      process.stdout.write(`✅ Sincronizados ${insertedTotal}/${recordsToInsert.length} registros...\r`);
    }
  }

  console.log(`\n🎉 Sincronización finalizada exitosamente. Total registros en Supabase: ${insertedTotal}`);
}

runSync().catch(err => {
  console.error('❌ Error fatal en sincronización:', err);
  process.exit(1);
});
