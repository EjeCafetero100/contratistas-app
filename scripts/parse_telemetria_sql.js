import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

// Helper para convertir fechas de Excel (números seriales o cadenas de texto) a YYYY-MM-DD
function parseExcelDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  const parts = str.split(/[/ -]/);
  if (parts.length === 3) {
    // Detectar si es M/D/YY o D/M/YYYY
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

export function getTelemetriaInserts(excelPath) {
  const wb = XLSX.readFile(excelPath);

  // 1. Hoja "eventos"
  const wsEventos = wb.Sheets['eventos'] || wb.Sheets[wb.SheetNames[0]];
  const dataEventos = XLSX.utils.sheet_to_json(wsEventos, { raw: false });

  const eventosSql = dataEventos.map(row => {
    const fecha = parseExcelDate(row['FECHA']);
    const mes = row['MES'] ? String(row['MES']).trim().toUpperCase() : null;
    const semana = row['SEMANA'] ? String(row['SEMANA']).trim() : null;
    const placa = row['PLACA'] ? String(row['PLACA']).trim().toUpperCase() : null;
    const motivo = row['Motivo'] ? String(row['Motivo']).trim() : 'Telemetria';
    const responsable = row['RESPONSABLE'] ? String(row['RESPONSABLE']).trim().toUpperCase() : null;
    const total = Number(row['TOTAL'] || 1);

    let tipoEvento = 'Otros';
    if (row['EXCESO DE VELOCIDAD EN CURVA SEMIABIERTA']) {
      tipoEvento = 'EXCESO DE VELOCIDAD EN CURVA SEMIABIERTA';
    } else if (row['EXCESO DE VELOCIDAD EN CARRETERA']) {
      tipoEvento = 'EXCESO DE VELOCIDAD EN CARRETERA';
    } else if (row['CINTURON DESABROCHADO FUERA DEL CD > 5 SEG']) {
      tipoEvento = 'CINTURON DESABROCHADO FUERA DEL CD > 5 SEG';
    }

    const escapeStr = (s) => s ? `'${s.replace(/'/g, "''")}'` : 'NULL';
    const escapeDate = (d) => d ? `'${d}'` : 'NULL';

    return `('Barrancabermeja', ${escapeDate(fecha)}, ${escapeStr(mes)}, ${escapeStr(semana)}, ${escapeStr(placa)}, ${escapeStr(motivo)}, ${escapeStr(tipoEvento)}, ${escapeStr(responsable)}, ${total})`;
  });

  // 2. Hoja "Gestión de consecuencia"
  const wsGestion = wb.Sheets['Gestión de consecuencia'] || wb.Sheets[wb.SheetNames[1]];
  const dataGestion = XLSX.utils.sheet_to_json(wsGestion, { raw: false });

  const gestionSql = dataGestion.map(row => {
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

    const escapeStr = (s) => s ? `'${s.replace(/'/g, "''")}'` : 'NULL';
    const escapeDate = (d) => d ? `'${d}'` : 'NULL';

    return `('Barrancabermeja', ${escapeStr(conductor)}, ${escapeStr(reporteCredit)}, ${escapeStr(cedula)}, ${escapeDate(fechaReporte)}, ${escapeStr(reincidente)}, ${escapeStr([...new Set(medidas)].join('; '))})`;
  });

  return { eventosSql, gestionSql };
}
