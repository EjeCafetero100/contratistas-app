const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tzyelxvrutltxoygiety.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6eWVseHZydXRsdHhveWdpZXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzY2NzAsImV4cCI6MjA4NTA1MjY3MH0.fR6wa9UA8sNobNbCYV6XGBz4d0k-QLRieDSuAYXVqhI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseExcelDate(val) {
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
  console.log('🚀 Iniciando sincronización de REGRESO SEGURO A CASA con Supabase...');
  const excelPath = path.resolve('REGRESO SEGURO A CASA B.xlsx');
  const wb = XLSX.readFile(excelPath);

  // 1. Hoja 1: Encuestas de colaboradores
  const ws1 = wb.Sheets['Respuestas de formulario 1'];
  const rawRows = XLSX.utils.sheet_to_json(ws1, { header: 1 });
  const headers = rawRows[0];

  console.log(`Total filas en hoja 1: ${rawRows.length}`);
  const records = [];

  for (let i = 1; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r || !r[1] || !r[2]) continue; // Requiere nombre y cédula

    const nombre = String(r[1]).trim();
    const cedula = String(r[2]).trim().replace(/[^\w-]/g, '');
    const empresa = String(r[3] || 'C&R ASOCIADOS SAS').trim();
    const cargo = String(r[4] || '').trim();
    const ciudad = String(r[5] || 'Barrancabermeja').trim();
    const barrio = String(r[6] || '').trim();
    const tiempoDesplazamiento = String(r[7] || '').trim();
    const tipoLicencia = String(r[8] || '').trim();
    const rolPrincipal = String(r[9] || '').trim();

    // Placa y datos de carro
    const placaCarro = r[10] ? String(r[10]).trim().toUpperCase() : null;
    const soatCarro = parseExcelDate(r[11]);
    const tecnoCarro = parseExcelDate(r[12]);

    // Placa y datos de moto
    const placaMoto = r[18] ? String(r[18]).trim().toUpperCase() : null;
    const soatMoto = parseExcelDate(r[19]);
    const tecnoMoto = parseExcelDate(r[20]);

    const placa = placaMoto || placaCarro || null;
    const soatVencimiento = soatMoto || soatCarro || null;
    const tecnoVencimiento = tecnoMoto || tecnoCarro || null;
    const licenciaVencimiento = parseExcelDate(r[53]);

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

    const propiedadVehiculo = String(r[50] || '').trim() || (placa ? 'Propio' : 'No tiene');
    const cascoReglamentario = String(r[51] || r[52] || '').trim();

    // Extraer riesgos identificados
    const riesgos = [];
    headers.forEach((colName, colIdx) => {
      if (colName && colName.includes('Seleccione los riesgos viales')) {
        const val = r[colIdx];
        if (val && (String(val).toLowerCase() === 'aplica' || String(val).toLowerCase() === 'si' || String(val).toLowerCase() === 'sí')) {
          const match = colName.match(/\[(.*?)\]/);
          const riesgoNombre = match ? match[1].trim() : colName;
          if (!riesgos.includes(riesgoNombre)) {
            riesgos.push(riesgoNombre);
          }
        }
      }
    });

    // Extraer elementos de protección personal (EPP)
    const epp = [];
    headers.forEach((colName, colIdx) => {
      if (colName && colName.includes('elementos de seguridad y proteción')) {
        const val = r[colIdx];
        if (val && (String(val).toLowerCase() === 'aplica' || String(val).toLowerCase() === 'si' || String(val).toLowerCase() === 'sí')) {
          const match = colName.match(/\[(.*?)\]/);
          const eppNombre = match ? match[1].trim() : colName;
          if (!epp.includes(eppNombre)) {
            epp.push(eppNombre);
          }
        }
      }
    });

    // Mapeo crudo completo para auditoría
    const rawMap = {};
    headers.forEach((colName, colIdx) => {
      if (r[colIdx] !== undefined && r[colIdx] !== '') {
        rawMap[colName] = r[colIdx];
      }
    });

    const marcaTemporal = parseExcelDateTime(r[0]);
    const fechaRegistro = parseExcelDate(r[0]) || new Date().toISOString().split('T')[0];

    records.push({
      sede: 'Barrancabermeja',
      fecha_registro: fechaRegistro,
      marca_temporal: marcaTemporal,
      nombre,
      cedula,
      empresa,
      cargo,
      ciudad,
      barrio,
      tiempo_desplazamiento: tiempoDesplazamiento,
      tipo_licencia: tipoLicencia,
      fecha_vencimiento_licencia: licenciaVencimiento,
      rol_principal: rolPrincipal,
      propiedad_vehiculo: propiedadVehiculo,
      placa,
      tipo_vehiculo: tipoVehiculo,
      soat_vencimiento: soatVencimiento,
      tecnomecanica_vencimiento: tecnoVencimiento,
      casco_reglamentario: cascoReglamentario,
      riesgos_identificados: riesgos,
      epp_elementos: epp,
      respuestas_completas: rawMap
    });
  }

  console.log(`✅ Registros listos para insertar: ${records.length}`);

  // Limpiar e insertar en lotes
  const { error: delErr } = await supabase.from('regreso_seguro').delete().neq('id', 0);
  if (delErr) console.warn('Aviso al limpiar regreso_seguro:', delErr.message);

  // Insertar en lotes de 50
  for (let i = 0; i < records.length; i += 50) {
    const chunk = records.slice(i, i + 50);
    const { error: insErr } = await supabase.from('regreso_seguro').insert(chunk);
    if (insErr) {
      console.error(`❌ Error insertando lote ${i} - ${i + chunk.length}:`, insErr.message);
    } else {
      console.log(`✔ Lote ${i + 1} a ${Math.min(i + 50, records.length)} insertado con éxito.`);
    }
  }

  // 2. Hoja 2: Inspecciones preoperacionales
  const ws2 = wb.Sheets['Respuestas de formulario 2'];
  if (ws2) {
    const rawInspecciones = XLSX.utils.sheet_to_json(ws2);
    console.log(`Filas encontradas en Hoja 2 (Inspecciones): ${rawInspecciones.length}`);

    const inspRecords = rawInspecciones.map(row => {
      const propietario = String(row['PROPIETARIO DEL VÉHICULO'] || '').trim();
      const placa = String(row['PLACA DEL HEHÍCULO'] || '').trim().toUpperCase();

      return {
        sede: 'Barrancabermeja',
        fecha_inspeccion: parseExcelDate(row['Marca temporal']),
        marca_temporal: parseExcelDateTime(row['Marca temporal']),
        propietario,
        placa,
        marca: String(row['MARCA'] || '').trim(),
        modelo: Number(row['MODELO']) || null,
        cilindraje: Number(row['CILINDRAJE CC']) || null,
        color: String(row['COLOR'] || '').trim(),
        combustible: String(row['COMBUSTIBLE'] || 'GASOLINA').trim(),
        soat: String(row['SOAT'] || 'SI').trim(),
        soat_vencimiento: parseExcelDate(row['FECHA DE VENCIMIENTO DE SOAT']),
        tecnomecanica: String(row['TECNÓMECANICA'] || 'SI').trim(),
        tecnomecanica_vencimiento: parseExcelDate(row['FECHA DE VENCIMIENTO DE TECNÓ MECANICA']),
        licencia: String(row['LICENCIA DE CONDUCCIÓN'] || 'SI').trim(),
        licencia_vencimiento: parseExcelDate(row['FECHA DE VENCIMIENTO DE CONDUCCIÓN']),
        tarjeta_propiedad: String(row['TARJETA DE PROPIEDAD'] || 'SI').trim(),
        detalles_inspeccion: row
      };
    });

    const { error: delInspErr } = await supabase.from('regreso_seguro_inspecciones').delete().neq('id', 0);
    if (delInspErr) console.warn('Aviso al limpiar inspecciones:', delInspErr.message);

    const { error: insInspErr } = await supabase.from('regreso_seguro_inspecciones').insert(inspRecords);
    if (insInspErr) {
      console.error('❌ Error insertando inspecciones:', insInspErr.message);
    } else {
      console.log(`✔ ${inspRecords.length} inspecciones vehiculares insertadas con éxito.`);
    }
  }

  // Verificación final
  const { count: count1 } = await supabase.from('regreso_seguro').select('*', { count: 'exact', head: true });
  const { count: count2 } = await supabase.from('regreso_seguro_inspecciones').select('*', { count: 'exact', head: true });
  console.log(`\n🎉 Sincronización finalizada exitosamente!`);
  console.log(`📊 Total en public.regreso_seguro: ${count1} registros`);
  console.log(`🏍️ Total en public.regreso_seguro_inspecciones: ${count2} registros`);
}

runSync().catch(err => {
  console.error('Error general:', err);
  process.exit(1);
});
