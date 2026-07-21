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

  const getExpirationInfo = (dateString) => {
    if (!dateString) return { days: '-', color: '#6b7280', icon: '⚫', text: 'N/A' };
    
    const targetDate = new Date(dateString);
    const today = new Date();
    
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let color = '#22c55e'; // Verde
    let icon = '🟢';
    
    if (diffDays <= 30) {
      color = '#ef4444'; // Rojo
      icon = '🔴';
    } else if (diffDays <= 90) {
      color = '#eab308'; // Amarillo
      icon = '🟡';
    }

    let text = `${diffDays} días`;
    if (diffDays < 0) {
      text = `Vencido (${Math.abs(diffDays)}d)`;
    } else if (diffDays === 0) {
      text = 'Vence hoy';
    }

    return { days: diffDays, color, icon, text, dateObj: targetDate };
  };

  const renderDateCells = (dateString) => {
    if (!dateString) {
      return (
        <>
          <td style={{ verticalAlign: 'middle', textAlign: 'center', color: 'var(--text-muted)', padding: '12px 16px' }}>N/A</td>
          <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px' }}>
            <div style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '20px',
              fontWeight: 'bold',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              minWidth: '100px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              ⚫ N/A
            </div>
          </td>
        </>
      );
    }
    
    const info = getExpirationInfo(dateString);
    const formattedDate = info.dateObj.toLocaleDateString('es-CO');
    
    return (
      <>
        <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px', fontWeight: '500' }}>{formattedDate}</td>
        <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '12px 16px' }}>
          <div style={{
            backgroundColor: info.color,
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontWeight: 'bold',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minWidth: '100px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {info.icon} {info.text}
          </div>
        </td>
      </>
    );
  };

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <div className="glass-panel" style={{ marginTop: '2rem', padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '1rem' }}>Control Documental ABI</h2>
        
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', fontSize: '0.95rem', backgroundColor: 'var(--bg-secondary)', padding: '1rem 1.5rem', borderRadius: '12px' }}>
          <strong style={{ color: 'var(--text-main)' }}>Leyenda de Renovación:</strong>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            🔴 30 días o menos
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            🟡 31 a 90 días
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
            🟢 Más de 90 días
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando datos...</div>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', color: '#334155' }}>👤 Nombre</th>
                  <th style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', color: '#334155' }}>🚗 Placa</th>
                  <th style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', color: '#334155' }}>📄 CC/NIT</th>
                  <th style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', color: '#334155' }}>🛡️ SOAT</th>
                  <th style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', color: '#334155' }}>Estado SOAT</th>
                  <th style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', color: '#334155' }}>🔧 Tecnomecánica</th>
                  <th style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', color: '#334155' }}>Estado Tecno.</th>
                  <th style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', color: '#334155' }}>Tipo Licencia</th>
                  <th style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', color: '#334155' }}>🪪 Licencia</th>
                  <th style={{ padding: '16px', textAlign: 'center', verticalAlign: 'middle', color: '#334155' }}>Estado Lic.</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No hay registros disponibles. Asegúrate de ejecutar el script de subida.
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr key={item.placa || item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center', fontWeight: '600', color: '#0f172a' }}>{item.nombre}</td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center', fontWeight: '500', color: '#475569' }}>{item.placa}</td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center', color: '#64748b' }}>{item.cc_nit_propietario || 'N/A'}</td>
                      {renderDateCells(item.soat)}
                      {renderDateCells(item.tecnomecanica)}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'center', fontWeight: '500' }}>{item.tipo_licencia || 'N/A'}</td>
                      {renderDateCells(item.licencia_conduccion)}
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
