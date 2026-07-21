const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const db = createClient(supabaseUrl, supabaseKey);

function excelDateToJSDate(serial) {
  if (!serial) return null;
  if (typeof serial !== 'number') {
    // Si ya es un string, intentar parsear o devolverlo
    return String(serial);
  }
  const utc_days  = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;                                        
  const date = new Date(utc_value * 1000);
  
  // Add timezone offset to fix off-by-one day issues
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() + offset);
  
  return localDate.toISOString().split('T')[0];
}

async function run() {
  console.log('Leyendo el archivo Excel...');
  const workbook = XLSX.readFile('Base Datos Ingreso Bavaria (1).xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { range: 2, defval: null });
  
  console.log(`Se encontraron ${data.length} filas. Procesando...`);
  
  // Obtener cédulas existentes para no duplicar
  const { data: existentes, error: errFetch } = await db.from('personal').select('cedula');
  if (errFetch) {
    console.error('Error obteniendo registros existentes:', errFetch);
    return;
  }
  const cedulasExistentes = new Set(existentes.map(e => String(e.cedula).trim()));

  const recordsToInsert = [];
  let duplicados = 0;

  for (const row of data) {
    // El nombre de la columna CÉDULA puede tener espacios, asegurémonos
    const keys = Object.keys(row);
    const cedulaKey = keys.find(k => k.trim().toUpperCase() === 'CÉDULA');
    const nombreKey = keys.find(k => k.trim().toUpperCase() === 'NOMBRE COMPLETO');
    
    if (!cedulaKey || !row[cedulaKey] || !nombreKey || !row[nombreKey]) {
      continue; // Skip vacíos
    }

    const cedulaStr = String(row[cedulaKey]).trim();
    if (cedulasExistentes.has(cedulaStr)) {
      duplicados++;
      continue; // Skip duplicados
    }

    const fechaIngreso = excelDateToJSDate(row['FECHA AUTORIZACIÓN DE INGRESO']);
    const tipo = row['TIPO DE PERSONA'] || 'PROVEEDOR';
    const cargo = row['CARGO'] || tipo;
    const empresa = tipo; // El excel no tiene empresa, usaremos el tipo
    const ind360 = row['\r\nInducción Safety 360'] || row['Inducción Safety 360'] || 'No Aplica';
    const fechaInd360 = excelDateToJSDate(row['Fecha']);
    const indEspec = row['Inducción Específica'] || 'No Aplica';
    const fechaIndEspec = excelDateToJSDate(row['(Fecha realización)']);
    const segSocial = row['Seguridad Social'] || 'NO VIGENTE';
    const fechaSegSocial = excelDateToJSDate(row['FECHA SEGURIDAD SOCIAL']);

    recordsToInsert.push({
      fecha: fechaIngreso,
      nombre: String(row[nombreKey]).trim(),
      cedula: cedulaStr,
      empresa: empresa,
      cargo: cargo,
      induccion_safety_360: ind360,
      fecha_induccion_360: fechaInd360,
      induccion_especifica: indEspec,
      fecha_induccion_especifica: fechaIndEspec,
      seguridad_social_vigente: segSocial,
      fecha_seguridad_social: fechaSegSocial,
      estado: 'Activo'
    });
    
    cedulasExistentes.add(cedulaStr); // Para evitar duplicados en el mismo archivo
  }

  console.log(`Registros a insertar: ${recordsToInsert.length}`);
  console.log(`Duplicados omitidos: ${duplicados}`);

  if (recordsToInsert.length > 0) {
    // Insert en bloques de 100 para no saturar
    const chunkSize = 100;
    for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
      const chunk = recordsToInsert.slice(i, i + chunkSize);
      const { error } = await db.from('personal').insert(chunk);
      if (error) {
        console.error(`Error insertando bloque ${i}:`, error);
      } else {
        console.log(`Bloque insertado: ${i} a ${i + chunk.length}`);
      }
    }
  }

  console.log('Migración completada.');
}

run();
