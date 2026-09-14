import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const parentDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), '..');
    const publicDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'public');

    const candidates = [
      path.join(publicDir, 'Barrancabermeja', 'telemetria.xlsx'),
      path.join(publicDir, 'telemetria.xlsx'),
      path.join(parentDir, 'Barrancabermeja', 'telemetria.xlsx')
    ];

    let filePath = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        filePath = c;
        break;
      }
    }

    if (!filePath) {
      return NextResponse.json({ error: 'Archivo telemetria.xlsx no encontrado' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    // 1. Hoja "eventos"
    const eventosSheet = workbook.Sheets['eventos'] || workbook.Sheets[workbook.SheetNames[0]];
    const rawEventos = eventosSheet ? XLSX.utils.sheet_to_json(eventosSheet, { raw: false }) : [];

    const eventos = rawEventos.map((row, idx) => {
      // Determinar el tipo de evento específico
      let tipoEvento = 'Otros';
      if (row['EXCESO DE VELOCIDAD EN CURVA SEMIABIERTA']) {
        tipoEvento = 'Exceso de velocidad en curva semiabierta';
      } else if (row['EXCESO DE VELOCIDAD EN CARRETERA']) {
        tipoEvento = 'Exceso de velocidad en carretera';
      } else if (row['CINTURON DESABROCHADO FUERA DEL CD > 5 SEG']) {
        tipoEvento = 'Cinturón desabrochado fuera del CD (> 5 seg)';
      }

      return {
        id: idx + 1,
        cd: 'Barrancabermeja',
        fecha: row['FECHA'] || '',
        mes: row['MES'] || '',
        semana: row['SEMANA'] || '',
        placa: (row['PLACA'] || '').trim().toUpperCase(),
        motivo: row['Motivo'] || 'Telemetria',
        tipoEvento,
        responsable: (row['RESPONSABLE'] || '').trim().toUpperCase(),
        total: Number(row['TOTAL'] || 1)
      };
    });

    // 2. Hoja "Gestión de consecuencia"
    const gestionSheet = workbook.Sheets['Gestión de consecuencia'] || workbook.Sheets[workbook.SheetNames[1]];
    const rawGestion = gestionSheet ? XLSX.utils.sheet_to_json(gestionSheet, { raw: false }) : [];

    const gestionConsecuencia = rawGestion.map((row, idx) => {
      // Buscar columnas de sanciones o compromisos
      const medidas = [];
      for (const [key, val] of Object.entries(row)) {
        const valStr = String(val || '').trim().toUpperCase();
        if (valStr === 'X' || valStr === '1' || valStr === 'SI') {
          if (key.includes('Compromiso de vida')) {
            medidas.push('Compromiso de vida escrito');
          } else if (key.toLowerCase().includes('bloqueo por 1 dia')) {
            medidas.push('Bloqueo 1 día + Reentrenamiento manejo defensivo');
          } else if (key.toLowerCase().includes('bloqueo permanente')) {
            medidas.push('Bloqueo permanente nacional');
          } else if (!['REINCIDENTE', '# REPORTE EN CREDIT', 'CEDULA', 'FECHA EN REPORTE CREDIT'].some(skip => key.includes(skip))) {
            medidas.push(key.trim());
          }
        }
      }

      const conductor = (row['NOMBRE DEL CONDUCTOR '] || row['NOMBRE DEL CONDUCTOR'] || '').trim().toUpperCase();
      const cedula = String(row['CEDULA '] || row['CEDULA'] || '').replace(/[^\d]/g, '');
      const reporteCredit = String(row['# REPORTE EN CREDIT'] || '').trim();
      const fechaReporte = row['FECHA EN REPORTE CREDIT'] || '';
      const reincidente = String(row['REINCIDENTE'] || 'NO').trim().toUpperCase() === 'SI' ? 'SÍ' : 'NO';

      return {
        id: idx + 1,
        cd: 'Barrancabermeja',
        conductor,
        cedula,
        reporteCredit,
        fechaReporte,
        reincidente,
        medidas: [...new Set(medidas)]
      };
    });

    // 3. Resumen y Métricas calculadas para facilitar el futuro Dashboard
    const totalEventos = eventos.reduce((sum, e) => sum + e.total, 0);
    const eventosPorTipo = {};
    const eventosPorConductor = {};
    const eventosPorPlaca = {};

    eventos.forEach(e => {
      eventosPorTipo[e.tipoEvento] = (eventosPorTipo[e.tipoEvento] || 0) + e.total;
      eventosPorConductor[e.responsable] = (eventosPorConductor[e.responsable] || 0) + e.total;
      eventosPorPlaca[e.placa] = (eventosPorPlaca[e.placa] || 0) + e.total;
    });

    const totalGestionados = gestionConsecuencia.length;
    const reincidentesCount = gestionConsecuencia.filter(g => g.reincidente === 'SÍ').length;

    return NextResponse.json({
      success: true,
      centro: 'Barrancabermeja',
      archivo: 'Barrancabermeja/telemetria.xlsx',
      resumen: {
        totalEventos,
        totalConductoresInvolucrados: Object.keys(eventosPorConductor).length,
        totalVehiculosInvolucrados: Object.keys(eventosPorPlaca).length,
        totalGestionados,
        reincidentesCount,
        eventosPorTipo,
        eventosPorConductor,
        eventosPorPlaca
      },
      eventos,
      gestionConsecuencia
    });
  } catch (error) {
    console.error('Error procesando telemetria.xlsx:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
