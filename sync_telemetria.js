import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { supabase } from './supabaseClient.js';
import dotenv from 'dotenv';

dotenv.config();

const EXCEL_PATH = path.resolve('Barrancabermeja', 'telemetria.xlsx');

function parseExcelDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  const parts = str.split(/[/ -]/);
  if (parts.length === 3) {
    let [p1, p2, p3] = parts.map(Number);
    let year = p3 < 100 ? 2000 + p3 : p3;
    let month = p1;
    let day = p2;
    if (p1 > 12) {
      day = p1;
      month = p2;
    }
    const d = new Date(Date.UTC(year, month - 1, day));
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }
  return null;
}

async function sync() {
  console.log('📡 Iniciando sincronización de Telemetría Barrancabermeja con Supabase...');

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('❌ Archivo no encontrado en:', EXCEL_PATH);
    process.exit(1);
  }

  const wb = XLSX.readFile(EXCEL_PATH);

  // 1. Procesar Hoja "eventos"
  const wsEventos = wb.Sheets['eventos'] || wb.Sheets[wb.SheetNames[0]];
  const rawEventos = XLSX.utils.sheet_to_json(wsEventos, { raw: false });

  const eventos = rawEventos.map((row) => {
    let tipoEvento = 'Otros';
    if (row['EXCESO DE VELOCIDAD EN CURVA SEMIABIERTA']) {
      tipoEvento = 'EXCESO DE VELOCIDAD EN CURVA SEMIABIERTA';
    } else if (row['EXCESO DE VELOCIDAD EN CARRETERA']) {
      tipoEvento = 'EXCESO DE VELOCIDAD EN CARRETERA';
    } else if (row['CINTURON DESABROCHADO FUERA DEL CD > 5 SEG']) {
      tipoEvento = 'CINTURON DESABROCHADO FUERA DEL CD > 5 SEG';
    }

    return {
      cd: 'Barrancabermeja',
      fecha: parseExcelDate(row['FECHA']),
      mes: row['MES'] ? String(row['MES']).trim().toUpperCase() : null,
      semana: row['SEMANA'] ? String(row['SEMANA']).trim() : null,
      placa: row['PLACA'] ? String(row['PLACA']).trim().toUpperCase() : null,
      motivo: row['Motivo'] ? String(row['Motivo']).trim() : 'Telemetria',
      tipo_evento: tipoEvento,
      responsable: row['RESPONSABLE'] ? String(row['RESPONSABLE']).trim().toUpperCase() : null,
      total: Number(row['TOTAL'] || 1)
    };
  });

  // 2. Procesar Hoja "Gestión de consecuencia"
  const wsGestion = wb.Sheets['Gestión de consecuencia'] || wb.Sheets[wb.SheetNames[1]];
  const rawGestion = XLSX.utils.sheet_to_json(wsGestion, { raw: false });

  const gestion = rawGestion.map((row) => {
    const conductor = (row['NOMBRE DEL CONDUCTOR '] || row['NOMBRE DEL CONDUCTOR'] || '').trim().toUpperCase();
    const reporteCredit = String(row['# REPORTE EN CREDIT'] || '').trim();
    const cedula = String(row['CEDULA '] || row['CEDULA'] || '').replace(/[^\d]/g, '');
    const fechaReporte = parseExcelDate(row['FECHA EN REPORTE CREDIT']);
    const reincidente = String(row['REINCIDENTE'] || 'NO').trim().toUpperCase() === 'SI' ? 'SI' : 'NO';

    const medidas = [];
    for (const [key, val] of Object.entries(row)) {
      const valStr = String(val || '').trim().toUpperCase();
      if (valStr === 'X' || valStr === '1' || valStr === 'SI') {
        if (key.includes('Compromiso de vida')) {
          medidas.push('Compromiso de vida Escrito');
        } else if (key.toLowerCase().includes('bloqueo por 1 dia')) {
          medidas.push('Bloqueo por 1 día + Reentrenamiento en Manejo defensivo');
        } else if (key.toLowerCase().includes('bloqueo permanente')) {
          medidas.push('Bloqueo permanente a nivel Nacional');
        } else if (!['REINCIDENTE', '# REPORTE EN CREDIT', 'CEDULA', 'FECHA EN REPORTE CREDIT'].some(skip => key.includes(skip))) {
          medidas.push(key.trim());
        }
      }
    }

    return {
      cd: 'Barrancabermeja',
      nombre_conductor: conductor,
      reporte_credit: reporteCredit,
      cedula: cedula,
      fecha_reporte_credit: fechaReporte,
      reincidente: reincidente,
      medidas_aplicadas: [...new Set(medidas)].join('; ')
    };
  });

  console.log(`📊 Encontrados: ${eventos.length} eventos y ${gestion.length} registros de gestión.`);

  // Subir a Supabase
  try {
    const { error: delErr1 } = await supabase.from('telemetria_eventos').delete().eq('cd', 'Barrancabermeja');
    if (delErr1) console.warn('Aviso al limpiar eventos:', delErr1.message);

    const { error: insErr1 } = await supabase.from('telemetria_eventos').insert(eventos);
    if (insErr1) throw insErr1;
    console.log(`✅ ${eventos.length} eventos sincronizados con Supabase.`);

    const { error: delErr2 } = await supabase.from('telemetria_gestion_consecuencia').delete().eq('cd', 'Barrancabermeja');
    if (delErr2) console.warn('Aviso al limpiar gestión:', delErr2.message);

    const { error: insErr2 } = await supabase.from('telemetria_gestion_consecuencia').insert(gestion);
    if (insErr2) throw insErr2;
    console.log(`✅ ${gestion.length} gestiones de consecuencia sincronizadas con Supabase.`);

    console.log('🎉 Sincronización completa con éxito.');
  } catch (err) {
    console.error('❌ Error sincronizando con Supabase:', err.message);
  }
}

sync();
