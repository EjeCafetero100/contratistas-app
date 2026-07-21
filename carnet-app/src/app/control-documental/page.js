"use client";

import { useEffect, useState } from 'react';

export default function ControlDocumentalPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/control-documental', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al cargar datos');
      const records = await res.json();
      
      setData(records || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular días y determinar el color
  const getExpirationInfo = (dateString) => {
    if (!dateString) return { days: '-', color: 'var(--text-muted)', text: 'N/A' };
    
    // Tratamiento de la fecha
    const targetDate = new Date(dateString);
    const today = new Date();
    
    // Resetear horas para comparar días exactos
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Lógica de colores según lo solicitado:
    // <= 15 días: rojo
    // <= 60 días: amarillo
    // > 60 días: verde
    let color = 'var(--success)';
    
    if (diffDays <= 15) {
      color = 'var(--danger)'; // rojo
    } else if (diffDays <= 60) {
      color = '#eab308'; // amarillo (tailwind yellow-500)
    }

    let text = '';
    if (diffDays < 0) {
      text = `Vencido hace ${Math.abs(diffDays)} días`;
    } else if (diffDays === 0) {
      text = 'Vence hoy';
    } else {
      text = `Faltan ${diffDays} días`;
    }

    return { days: diffDays, color, text, dateObj: targetDate };
  };

  const renderDateCell = (dateString) => {
    if (!dateString) return <td style={{ color: 'var(--text-muted)' }}>N/A</td>;
    
    const info = getExpirationInfo(dateString);
    
    // Formatear la fecha para mostrar (ej. 15/02/2026)
    const formattedDate = info.dateObj.toLocaleDateString('es-CO');
    
    return (
      <td>
        <div>{formattedDate}</div>
        <div style={{ color: info.color, fontWeight: 'bold', fontSize: '0.85rem', marginTop: '4px' }}>
          {info.text}
        </div>
      </td>
    );
  };

  return (
    <div className="container">
      <div className="glass-panel" style={{ marginTop: '2rem' }}>
        <h2>Control Documental ABI</h2>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--text-main)' }}>Indicadores de Renovación:</strong>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--danger)', borderRadius: '50%' }}></span>
            15 días o menos
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: '#eab308', borderRadius: '50%' }}></span>
            16 a 60 días
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--success)', borderRadius: '50%' }}></span>
            Más de 60 días
          </span>
        </div>

        {loading ? (
          <p>Cargando datos...</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Placa</th>
                  <th>CC/NIT</th>
                  <th>SOAT</th>
                  <th>Tecnomecánica</th>
                  <th>Tipo Licencia</th>
                  <th>Licencia Conducción</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      No hay registros disponibles. Asegúrate de ejecutar el script de subida.
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.placa || item.id}>
                      <td style={{ fontWeight: '600' }}>{item.nombre}</td>
                      <td>{item.placa}</td>
                      <td>{item.cc_nit_propietario}</td>
                      {renderDateCell(item.soat)}
                      {renderDateCell(item.tecnomecanica)}
                      <td>{item.tipo_licencia}</td>
                      {renderDateCell(item.licencia_conduccion)}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
