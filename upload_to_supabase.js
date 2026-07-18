import XLSX from 'xlsx';
import { supabase } from './supabaseClient.js';
import dotenv from 'dotenv';

dotenv.config();

const file = 'Proveedores, Contratistas y VisitantesP.xlsx';

async function uploadData() {
  console.log('Leyendo archivo Excel...');
  const workbook = XLSX.readFile(file, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

  console.log(`Se encontraron ${data.length} registros en el Excel. Comenzando subida...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    // Extraer y limpiar datos
    const cedula = row['Cedula'] ? String(row['Cedula']).trim() : null;
    const nombre = row['Nombre'] ? String(row['Nombre']).trim() : null;
    
    // Saltar filas vacías o sin cédula
    if (!cedula || !nombre) {
      continue;
    }

    // Convertir fechas en formato MM/DD/YY (común en Excel crudo) a YYYY-MM-DD para Supabase
    const formatDate = (val) => {
      if (!val) return null;
      // Si viene como string '2/15/22', tratar de convertirlo
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      return null;
    };

    const record = {
      fecha: formatDate(row['Fecha']),
      nombre: nombre,
      cedula: cedula,
      empresa: row['Empresa'] ? String(row['Empresa']).trim() : null,
      cargo: row['Cargo'] ? String(row['Cargo']).trim() : null,
      induccion_safety_360: row['Inducción safety 360'] ? String(row['Inducción safety 360']).trim() : null,
      induccion_especifica: row['Inducción especifica'] ? String(row['Inducción especifica']).trim() : null,
      vigencia_induccion: formatDate(row['Vigencia de la inducción']),
      seguridad_social_vigente: row['seguridad social vigente'] ? String(row['seguridad social vigente']).trim() : null,
      foto: row['Foto'] ? String(row['Foto']).trim() : null,
      estado: row['Estado'] || row['Esado'] ? String(row['Estado'] || row['Esado']).trim() : null
    };

    // Insertar o actualizar (upsert) basado en la cédula
    const { error } = await supabase
      .from('personal')
      .upsert(record, { onConflict: 'cedula' });

    if (error) {
      console.error(`❌ Error con la cédula ${cedula}:`, error.message);
      errorCount++;
    } else {
      console.log(`✔ Insertado/Actualizado: ${nombre} (${cedula})`);
      successCount++;
    }
  }
  
  console.log(`\n¡Proceso terminado!`);
  console.log(`✅ Subidos con éxito: ${successCount}`);
  if (errorCount > 0) console.log(`❌ Errores: ${errorCount}`);
}

uploadData();
