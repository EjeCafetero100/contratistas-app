import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ALLOWED_FILES = [
  { id: 'credit-360', name: 'Credit 360', fileName: 'credit 360.xlsx', icon: '💳', category: 'Finanzas & Créditos' },
  { id: 'botiquin-pereira', name: 'Botiquín Pereira', fileName: 'BOTIQUIN PEREIRA.xlsx', icon: '🚑', category: 'SST & Emergencias' },
  { id: 'control-documental', name: 'Control Documental ABI', fileName: 'Control documental abi.xlsx', icon: '📑', category: 'Documentación' },
  { id: 'proveedores', name: 'Proveedores y Contratistas', fileName: 'Proveedores, Contratistas y VisitantesP.xlsx', icon: '👷', category: 'Personal' },
  { id: 'bavaria-ingreso', name: 'Base Ingreso Bavaria', fileName: 'Base Datos Ingreso Bavaria (1).xlsx', icon: '🏬', category: 'Ingresos' },
  { id: 'telemetria-barranca', name: 'Telemetría Barrancabermeja', fileName: 'Barrancabermeja/telemetria.xlsx', icon: '📡', category: 'Telemetría & Flota' }
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    const parentDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), '..');
    const publicDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'public');

    const resolveExistingPath = (relativeName) => {
      const candidates = [
        path.join(parentDir, relativeName),
        path.join(publicDir, relativeName),
        path.join(publicDir, path.basename(relativeName))
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return p;
      }
      return null;
    };

    if (fileName) {
      const match = ALLOWED_FILES.find(f => f.fileName === fileName || f.id === fileName);
      if (!match) {
        return NextResponse.json({ error: 'Archivo no permitido' }, { status: 400 });
      }

      const filePath = resolveExistingPath(match.fileName);
      if (!filePath) {
        return NextResponse.json({ error: 'Archivo no encontrado en el servidor' }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filePath);

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${path.basename(match.fileName)}"`,
        },
      });
    }

    // Retornar lista de muestras disponibles con tamaño de archivo
    const available = ALLOWED_FILES.map(file => {
      const filePath = resolveExistingPath(file.fileName);
      const exists = !!filePath;
      let sizeMB = 0;
      if (exists) {
        const stats = fs.statSync(filePath);
        sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      }
      return {
        ...file,
        exists,
        sizeMB: `${sizeMB} MB`
      };
    }).filter(f => f.exists);

    return NextResponse.json(available);
  } catch (error) {
    console.error('Error en excel-samples:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
