"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

const STATUS_COLORS = {
  'Operativo': '#10b981',
  'Mantenimiento': '#f59e0b',
  'Fuera de Servicio': '#ef4444'
};

export default function HerramientasDashboard({ tipo, title, icon, subtitle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Cargar datos desde la API
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/herramientas-manuales?tipo=${tipo}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(`Error cargando ${tipo}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tipo]);

  // Manejador para subir archivo Excel manualmente
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', tipo);

    try {
      const res = await fetch('/api/herramientas-manuales', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Error al procesar archivo');
      alert(`✔ Archivo cargado con éxito: ${file.name}`);
      loadData();
    } catch (err) {
      alert(`Error al cargar: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Filtrado de registros
  const records = data?.records || [];
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = search.toLowerCase();
      const matchText = !q ||
        (r.codigo && r.codigo.toLowerCase().includes(q)) ||
        (r.equipo && r.equipo.toLowerCase().includes(q)) ||
        (r.inspector && r.inspector.toLowerCase().includes(q)) ||
        (r.ubicacion && r.ubicacion.toLowerCase().includes(q)) ||
        (r.observaciones && r.observaciones.toLowerCase().includes(q));

      const matchStatus = filterStatus === 'Todos' || r.estado === filterStatus;
      return matchText && matchStatus;
    });
  }, [records, search, filterStatus]);

  // Datos para la gráfica de estado
  const chartData = useMemo(() => {
    const counts = { 'Operativo': 0, 'Mantenimiento': 0, 'Fuera de Servicio': 0 };
    filteredRecords.forEach(r => {
      if (counts[r.estado] !== undefined) counts[r.estado]++;
      else counts['Operativo']++;
    });

    const total = filteredRecords.length || 1;
    return [
      { name: 'Operativo', value: counts['Operativo'], pct: Math.round((counts['Operativo'] / total) * 100), color: STATUS_COLORS['Operativo'] },
      { name: 'Mantenimiento', value: counts['Mantenimiento'], pct: Math.round((counts['Mantenimiento'] / total) * 100), color: STATUS_COLORS['Mantenimiento'] },
      { name: 'Fuera de Servicio', value: counts['Fuera de Servicio'], pct: Math.round((counts['Fuera de Servicio'] / total) * 100), color: STATUS_COLORS['Fuera de Servicio'] }
    ].filter(item => item.value > 0 || !data?.found);
  }, [filteredRecords, data?.found]);

  // Exportar a Excel
  const exportToExcel = () => {
    if (!filteredRecords || filteredRecords.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(filteredRecords);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.replace(/[^a-zA-Z0-9]/g, '_'));
    XLSX.writeFile(wb, `${tipo}_inspecciones_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div style={{ padding: '1.2rem', color: '#1e293b', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header Corporativo */}
      <div style={{
        background: 'linear-gradient(135deg, #00205b 0%, #001233 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '1.8rem',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 25px rgba(0, 32, 91, 0.2)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.8rem' }}>{icon}</span>
            <span style={{
              background: '#fcd116',
              color: '#00205b',
              fontWeight: 800,
              fontSize: '0.75rem',
              padding: '0.25rem 0.65rem',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Inspección de Herramientas Manuales
            </span>
            <span style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '0.72rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              fontWeight: 600
            }}>
              SafeTogether
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '0.9rem', maxWidth: '650px' }}>
            {subtitle || 'Tablero de control y seguimiento al estado de mantenimiento, operatividad y seguridad de herramientas.'}
          </p>
        </div>

        {/* Acciones e Indicador de Archivo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: data?.found ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.25)',
            border: `1px solid ${data?.found ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: data?.found ? '#10b981' : '#f59e0b'
            }} />
            {data?.found ? `Archivo: ${data.fileName}` : 'Esperando Excel en scratch (Modo Demo)'}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                background: '#fcd116',
                color: '#00205b',
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 10px rgba(252, 209, 22, 0.35)'
              }}
            >
              📁 {uploading ? 'Cargando...' : 'Cargar Excel'}
            </button>

            <button
              onClick={loadData}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
              title="Re-escanear carpeta scratch"
            >
              🔄 Actualizar
            </button>

            <button
              onClick={exportToExcel}
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)'
              }}
            >
              📥 Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Alerta informativa si aún no hay base de datos cargada */}
      {!data?.found && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fef3c7',
          borderLeft: '5px solid #f59e0b',
          borderRadius: '10px',
          padding: '1rem 1.2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#92400e' }}>
                Base de datos en espera para {title}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#b45309' }}>
                Coloca tu archivo de Excel en la carpeta <strong>scratch/</strong> o haz clic en el botón <strong>"Cargar Excel"</strong> para sincronizar los datos reales al instante.
              </div>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: '#f59e0b',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Subir Archivo Ahora
          </button>
        </div>
      )}

      {/* Tarjetas KPI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Equipos */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          borderLeft: '5px solid #00205b'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Equipos
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#00205b', margin: '0.2rem 0' }}>
            {data?.total || filteredRecords.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Inventario inspeccionado
          </div>
        </div>

        {/* Operativos */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'Operativo' ? 'Todos' : 'Operativo')}
          style={{
            background: filterStatus === 'Operativo' ? '#ecfdf5' : '#ffffff',
            borderRadius: '12px',
            padding: '1.2rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '5px solid #10b981',
            cursor: 'pointer'
          }}
          title="Clic para filtrar operativos"
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
            Operativos (OK)
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#15803d', margin: '0.2rem 0' }}>
            {data?.operativos || filteredRecords.filter(r => r.estado === 'Operativo').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
            Listos para la operación
          </div>
        </div>

        {/* En Mantenimiento */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'Mantenimiento' ? 'Todos' : 'Mantenimiento')}
          style={{
            background: filterStatus === 'Mantenimiento' ? '#fffbeb' : '#ffffff',
            borderRadius: '12px',
            padding: '1.2rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '5px solid #f59e0b',
            cursor: 'pointer'
          }}
          title="Clic para filtrar en mantenimiento"
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
            Requiere Mantenimiento
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#b45309', margin: '0.2rem 0' }}>
            {data?.mantenimiento || filteredRecords.filter(r => r.estado === 'Mantenimiento').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>
            Ajuste preventivo programado
          </div>
        </div>

        {/* Fuera de Servicio */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'Fuera de Servicio' ? 'Todos' : 'Fuera de Servicio')}
          style={{
            background: filterStatus === 'Fuera de Servicio' ? '#fef2f2' : '#ffffff',
            borderRadius: '12px',
            padding: '1.2rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '5px solid #ef4444',
            cursor: 'pointer'
          }}
          title="Clic para filtrar fuera de servicio"
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>
            Fuera de Servicio
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#b91c1c', margin: '0.2rem 0' }}>
            {data?.fueraServicio || filteredRecords.filter(r => r.estado === 'Fuera de Servicio').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>
            Bloqueados por seguridad
          </div>
        </div>
      </div>

      {/* Sección Gráfica y Resumen de Estado */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {/* Gráfica Donut con Etiquetas de Datos */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#00205b' }}>
            📊 Estado General de Inspección
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>
            Distribución porcentual de operatividad con etiquetas de datos directas
          </p>

          <div style={{ height: '270px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ cx, cy, midAngle, outerRadius, value, pct, name }) => {
                    if (!value) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 14;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#0f172a"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={800}
                      >
                        {`${name}: ${value} (${pct}%)`}
                      </text>
                    );
                  }}
                  labelLine={{ stroke: '#94a3b8', strokeWidth: 1.2 }}
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name, item) => [`${val} equipos (${item.payload.pct}%)`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Componentes Inspeccionados Clave */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#00205b' }}>
            🛠️ Puntos de Verificación Críticos
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>
            Criterios de seguridad evaluados en cada elemento
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>🛞</div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#00205b' }}>Ruedas y Rodamientos</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Verificación de holguras, desgastes y giro libre.</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>🔩</div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#00205b' }}>Chasis y Soldaduras</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Inspección visual de fisuras, óxido y deformaciones.</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>✋</div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#00205b' }}>Manubrio y Agarre</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Grips antideslizantes, fijación y ergonomía.</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>🛑</div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#00205b' }}>Frenos y Seguros</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Trabas de seguridad mecánicas y topes de carga.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        border: '1px solid #e2e8f0'
      }}>
        {/* Barra de Búsqueda y Filtros */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', flex: '1 1 300px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por código, inspector, ubicación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                minWidth: '240px'
              }}
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.84rem',
                background: '#fff',
                color: '#334155'
              }}
            >
              <option value="Todos">Todos los Estados</option>
              <option value="Operativo">🟢 Operativo</option>
              <option value="Mantenimiento">🟡 Mantenimiento</option>
              <option value="Fuera de Servicio">🔴 Fuera de Servicio</option>
            </select>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
            Mostrando <strong>{filteredRecords.length}</strong> de {records.length} equipos
          </div>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Código / Equipo</th>
                <th style={{ padding: '0.75rem 1rem' }}>Ubicación</th>
                <th style={{ padding: '0.75rem 1rem' }}>Inspector</th>
                <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                <th style={{ padding: '0.75rem 1rem' }}>Estado</th>
                <th style={{ padding: '0.75rem 1rem' }}>Observaciones</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r, idx) => (
                <tr key={r.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 800, color: '#00205b' }}>{r.codigo}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.equipo}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#334155', fontWeight: 600 }}>
                    {r.ubicacion}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                    {r.inspector}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>
                    {r.fecha_inspeccion}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      background: r.estado === 'Operativo' ? '#dcfce7' : r.estado === 'Mantenimiento' ? '#fef3c7' : '#fee2e2',
                      color: r.estado === 'Operativo' ? '#15803d' : r.estado === 'Mantenimiento' ? '#b45309' : '#b91c1c'
                    }}>
                      {r.estado}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.observaciones}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedItem(r)}
                      style={{
                        background: '#00205b',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Ver Ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ficha Técnica */}
      {selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 32, 91, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedItem(null)}
              style={{
                position: 'absolute',
                top: '1.2rem',
                right: '1.2rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                fontWeight: 800,
                color: '#64748b'
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '2rem' }}>{icon}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#00205b' }}>
                  {selectedItem.codigo} • {selectedItem.equipo}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {selectedItem.ubicacion} • Inspector: {selectedItem.inspector}
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Ruedas:</span>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedItem.ruedas}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Estructura:</span>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedItem.estructura}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Manubrio / Agarre:</span>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedItem.manubrio_agarre}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Frenos / Seguros:</span>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedItem.freno_seguro}</div>
              </div>
            </div>

            <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                Observaciones y Hallazgos:
              </div>
              <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>
                {selectedItem.observaciones}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: '#00205b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
