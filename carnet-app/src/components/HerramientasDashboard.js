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
  const [selectedCarretilla, setSelectedCarretilla] = useState('Todas');
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeView, setActiveView] = useState('detalle'); // 'detalle' | 'todas_paneles'
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Estado para modal de nueva inspección hacia Supabase
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newForm, setNewForm] = useState({
    equipo: 'CARRETILLA 1',
    fecha_inspeccion: new Date().toISOString().split('T')[0],
    turno: 'TURNO A',
    inspector: '',
    cargo: 'Auxiliar Operativo',
    area: 'Picking',
    mango: true,
    llantas: true,
    buges: true,
    soldaduras: true,
    bases: true,
    pintura: true,
    observaciones: 'Condiciones óptimas de seguridad'
  });

  // Guardar nueva inspección en Supabase Cloud
  const handleCreateInspection = async (e) => {
    e.preventDefault();
    if (!newForm.inspector.trim()) {
      alert('Por favor ingrese el nombre del inspector responsable.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/herramientas-manuales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newForm, tipo, submodulo: tipo })
      });
      const resData = await res.json();
      if (!res.ok || resData.error) throw new Error(resData.error || 'Error al guardar');
      alert('✔ ¡Inspección preoperacional registrada y sincronizada en Supabase Cloud!');
      setIsNewModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Error al registrar inspección: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

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

  // Registros y lista de carretillas únicas
  const records = data?.records || [];

  const carretillasList = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const c = r.codigo || r.equipo;
      if (c) map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [records]);

  // Estadísticas detalladas por cada carretilla individual
  const carretillasStats = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const c = r.codigo || r.equipo || 'Carretilla';
      if (!map[c]) {
        map[c] = {
          name: c,
          total: 0,
          operativos: 0,
          mantenimiento: 0,
          fueraServicio: 0,
          ultimoInspector: r.inspector || 'Auxiliar Operativo',
          cargo: r.cargo || 'Auxiliar',
          ultimaFecha: r.fecha_inspeccion || '',
          area: r.area || 'Picking',
          turno: r.turno || 'Turno 1'
        };
      }
      map[c].total++;
      if (r.estado === 'Operativo') map[c].operativos++;
      else if (r.estado === 'Mantenimiento') map[c].mantenimiento++;
      else if (r.estado === 'Fuera de Servicio') map[c].fueraServicio++;
    });

    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [records]);

  // Filtrado de registros reactivo
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = search.toLowerCase();
      const matchText = !q ||
        (r.codigo && r.codigo.toLowerCase().includes(q)) ||
        (r.equipo && r.equipo.toLowerCase().includes(q)) ||
        (r.inspector && r.inspector.toLowerCase().includes(q)) ||
        (r.ubicacion && r.ubicacion.toLowerCase().includes(q)) ||
        (r.observaciones && r.observaciones.toLowerCase().includes(q)) ||
        (r.turno && r.turno.toLowerCase().includes(q)) ||
        (r.area && r.area.toLowerCase().includes(q));

      const matchStatus = filterStatus === 'Todos' || r.estado === filterStatus;
      const matchCarretilla = selectedCarretilla === 'Todas' || r.codigo === selectedCarretilla || r.equipo === selectedCarretilla;

      return matchText && matchStatus && matchCarretilla;
    });
  }, [records, search, filterStatus, selectedCarretilla]);

  // Estadísticas de chequeos de componentes para los registros filtrados
  const checkStats = useMemo(() => {
    const total = filteredRecords.length || 1;
    let mangoOk = 0, llantasOk = 0, bugesOk = 0, soldadurasOk = 0, basesOk = 0, pinturaOk = 0;

    filteredRecords.forEach(r => {
      if (r.mango !== false && (!r.chequeos || r.chequeos['Mango de agarre'] === 'Conforme')) mangoOk++;
      if (r.llantas !== false && (!r.chequeos || r.chequeos['Llantas'] === 'Conforme')) llantasOk++;
      if (r.buges !== false && (!r.chequeos || r.chequeos['Bujes de llantas'] === 'Conforme')) bugesOk++;
      if (r.soldaduras !== false && (!r.chequeos || r.chequeos['Soldaduras estructurales'] === 'Conforme')) soldadurasOk++;
      if (r.bases !== false && (!r.chequeos || r.chequeos['Bases del espaldar'] === 'Conforme')) basesOk++;
      if (r.pintura !== false && (!r.chequeos || r.chequeos['Pintura y acabado'] === 'Conforme')) pinturaOk++;
    });

    return {
      mango: Math.round((mangoOk / total) * 100),
      llantas: Math.round((llantasOk / total) * 100),
      buges: Math.round((bugesOk / total) * 100),
      soldaduras: Math.round((soldadurasOk / total) * 100),
      bases: Math.round((basesOk / total) * 100),
      pintura: Math.round((pinturaOk / total) * 100)
    };
  }, [filteredRecords]);

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

  // Función para renderizar los 4 paneles idénticos a la referencia visual del usuario
  const renderKpiPanelGroup = (equipoName, total, operativos, mantenimiento, fueraServicio, isFilterable = false) => {
    const isSingleCarretilla = equipoName !== 'Todas' && equipoName !== 'FLOTA TOTAL';
    const displayTitle = isSingleCarretilla ? `INSPECCIONES ${equipoName.toUpperCase()}` : 'INSPECCIONES TOTALES';

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.2rem',
        marginBottom: '1.5rem'
      }}>
        {/* Panel 1: Total Inspecciones */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          padding: '1.45rem 1.6rem 1.35rem 1.8rem',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
          border: '1px solid #f1f5f9',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '128px'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '6px',
            background: '#00205b',
            borderTopLeftRadius: '18px',
            borderBottomLeftRadius: '18px'
          }} />
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#475569',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            marginBottom: '0.35rem'
          }}>
            {displayTitle}
          </div>
          <div style={{
            fontSize: '2.75rem',
            fontWeight: 900,
            color: '#00205b',
            lineHeight: 1,
            margin: '0 0 0.35rem 0',
            letterSpacing: '-0.03em'
          }}>
            {total}
          </div>
          <div style={{
            fontSize: '0.84rem',
            color: '#64748b',
            fontWeight: 500
          }}>
            {isSingleCarretilla ? 'Registros filtrados' : 'Total flota registrada'}
          </div>
        </div>

        {/* Panel 2: Operativos (OK) */}
        <div
          onClick={isFilterable ? () => setFilterStatus(filterStatus === 'Operativo' ? 'Todos' : 'Operativo') : undefined}
          style={{
            background: isFilterable && filterStatus === 'Operativo' ? '#f0fdf4' : '#ffffff',
            borderRadius: '18px',
            padding: '1.45rem 1.6rem 1.35rem 1.8rem',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
            border: isFilterable && filterStatus === 'Operativo' ? '2px solid #10b981' : '1px solid #f1f5f9',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '128px',
            cursor: isFilterable ? 'pointer' : 'default',
            transition: 'all 0.15s ease'
          }}
          title={isFilterable ? "Clic para filtrar operativos" : undefined}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '6px',
            background: '#10b981',
            borderTopLeftRadius: '18px',
            borderBottomLeftRadius: '18px'
          }} />
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#15803d',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            marginBottom: '0.35rem'
          }}>
            OPERATIVOS (OK)
          </div>
          <div style={{
            fontSize: '2.75rem',
            fontWeight: 900,
            color: '#15803d',
            lineHeight: 1,
            margin: '0 0 0.35rem 0',
            letterSpacing: '-0.03em'
          }}>
            {operativos}
          </div>
          <div style={{
            fontSize: '0.84rem',
            color: '#166534',
            fontWeight: 600
          }}>
            Listos para la operación
          </div>
        </div>

        {/* Panel 3: Requiere Mantenimiento */}
        <div
          onClick={isFilterable ? () => setFilterStatus(filterStatus === 'Mantenimiento' ? 'Todos' : 'Mantenimiento') : undefined}
          style={{
            background: isFilterable && filterStatus === 'Mantenimiento' ? '#fffbeb' : '#ffffff',
            borderRadius: '18px',
            padding: '1.45rem 1.6rem 1.35rem 1.8rem',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
            border: isFilterable && filterStatus === 'Mantenimiento' ? '2px solid #f59e0b' : '1px solid #f1f5f9',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '128px',
            cursor: isFilterable ? 'pointer' : 'default',
            transition: 'all 0.15s ease'
          }}
          title={isFilterable ? "Clic para filtrar en mantenimiento" : undefined}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '6px',
            background: '#f59e0b',
            borderTopLeftRadius: '18px',
            borderBottomLeftRadius: '18px'
          }} />
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#b45309',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            marginBottom: '0.35rem'
          }}>
            REQUIERE MANTENIMIENTO
          </div>
          <div style={{
            fontSize: '2.75rem',
            fontWeight: 900,
            color: '#c2410c',
            lineHeight: 1,
            margin: '0 0 0.35rem 0',
            letterSpacing: '-0.03em'
          }}>
            {mantenimiento}
          </div>
          <div style={{
            fontSize: '0.84rem',
            color: '#78350f',
            fontWeight: 600
          }}>
            Ajuste preventivo (bujes/llantas)
          </div>
        </div>

        {/* Panel 4: Fuera de Servicio */}
        <div
          onClick={isFilterable ? () => setFilterStatus(filterStatus === 'Fuera de Servicio' ? 'Todos' : 'Fuera de Servicio') : undefined}
          style={{
            background: isFilterable && filterStatus === 'Fuera de Servicio' ? '#fef2f2' : '#ffffff',
            borderRadius: '18px',
            padding: '1.45rem 1.6rem 1.35rem 1.8rem',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
            border: isFilterable && filterStatus === 'Fuera de Servicio' ? '2px solid #ef4444' : '1px solid #f1f5f9',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '128px',
            cursor: isFilterable ? 'pointer' : 'default',
            transition: 'all 0.15s ease'
          }}
          title={isFilterable ? "Clic para filtrar fuera de servicio" : undefined}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '6px',
            background: '#ef4444',
            borderTopLeftRadius: '18px',
            borderBottomLeftRadius: '18px'
          }} />
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            color: '#b91c1c',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            marginBottom: '0.35rem'
          }}>
            FUERA DE SERVICIO
          </div>
          <div style={{
            fontSize: '2.75rem',
            fontWeight: 900,
            color: '#dc2626',
            lineHeight: 1,
            margin: '0 0 0.35rem 0',
            letterSpacing: '-0.03em'
          }}>
            {fueraServicio}
          </div>
          <div style={{
            fontSize: '0.84rem',
            color: '#7f1d1d',
            fontWeight: 600
          }}>
            Fisuras o daño estructural
          </div>
        </div>
      </div>
    );
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
              Herramientas Manuales
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

        {/* Acciones e Indicador de Archivo / Supabase */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: data?.source === 'supabase' ? 'rgba(16, 185, 129, 0.22)' : data?.found ? 'rgba(59, 130, 246, 0.22)' : 'rgba(245, 158, 11, 0.25)',
            border: `1px solid ${data?.source === 'supabase' ? 'rgba(16, 185, 129, 0.45)' : data?.found ? 'rgba(59, 130, 246, 0.45)' : 'rgba(245, 158, 11, 0.4)'}`,
            padding: '0.4rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 700
          }}>
            <span style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: data?.source === 'supabase' ? '#10b981' : data?.found ? '#3b82f6' : '#f59e0b',
              boxShadow: data?.source === 'supabase' ? '0 0 8px #10b981' : 'none'
            }} />
            {data?.source === 'supabase'
              ? `🟢 Supabase Cloud (${data.total || 0} Inspecciones Conectadas)`
              : data?.found
                ? `📄 Archivo Excel Local: ${data.fileName}`
                : 'Esperando Excel en scratch (Modo Demo)'}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsNewModalOpen(true)}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.35)'
              }}
            >
              ➕ Nueva Inspección
            </button>

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
              disabled={loading}
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
              title="Consultar datos en vivo desde Supabase Cloud"
            >
              🔄 {loading ? 'Actualizando...' : 'Actualizar'}
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

      {/* Selector de Modo de Vista (Detalle vs Todas las Carretillas en Paneles) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.8rem',
        marginBottom: '1.2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          background: '#f1f5f9',
          padding: '0.35rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <button
            onClick={() => setActiveView('detalle')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '9px',
              border: 'none',
              background: activeView === 'detalle' ? '#00205b' : 'transparent',
              color: activeView === 'detalle' ? '#ffffff' : '#475569',
              fontWeight: activeView === 'detalle' ? 800 : 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: activeView === 'detalle' ? '0 2px 8px rgba(0, 32, 91, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🎯</span> Vista Activa & Filtros
          </button>

          <button
            onClick={() => setActiveView('todas_paneles')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 1.1rem',
              borderRadius: '9px',
              border: 'none',
              background: activeView === 'todas_paneles' ? '#00205b' : 'transparent',
              color: activeView === 'todas_paneles' ? '#ffffff' : '#475569',
              fontWeight: activeView === 'todas_paneles' ? 800 : 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: activeView === 'todas_paneles' ? '0 2px 8px rgba(0, 32, 91, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🗂️</span> Ver Cada Carretilla en Paneles ({carretillasStats.length})
          </button>
        </div>

        {activeView === 'detalle' && selectedCarretilla !== 'Todas' && (
          <button
            onClick={() => setSelectedCarretilla('Todas')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ✕ Quitar filtro ({selectedCarretilla})
          </button>
        )}
      </div>

      {/* VISTA 1: DETALLE INTERACTIVO CON PANELES SUPERIORES IDENTICOS A LA REFERENCIA */}
      {activeView === 'detalle' && (
        <>
          {/* Selector de Carretillas / Equipos Individuales */}
          {carretillasList.length > 1 && (
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '1rem 1.4rem',
              marginBottom: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#00205b', textTransform: 'uppercase', marginRight: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🛒</span> Seleccionar Carretilla:
              </span>
              <button
                onClick={() => setSelectedCarretilla('Todas')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '8px',
                  border: selectedCarretilla === 'Todas' ? '2px solid #00205b' : '1px solid #e2e8f0',
                  fontSize: '0.8rem',
                  fontWeight: selectedCarretilla === 'Todas' ? 800 : 600,
                  background: selectedCarretilla === 'Todas' ? '#00205b' : '#f8fafc',
                  color: selectedCarretilla === 'Todas' ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: selectedCarretilla === 'Todas' ? '0 2px 8px rgba(0, 32, 91, 0.25)' : 'none'
                }}
              >
                Todas ({records.length})
              </button>
              {carretillasList.map(c => {
                const isSelected = selectedCarretilla === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => setSelectedCarretilla(isSelected ? 'Todas' : c.name)}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #00205b' : '1px solid #e2e8f0',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 800 : 600,
                      background: isSelected ? '#fcd116' : '#f8fafc',
                      color: isSelected ? '#00205b' : '#334155',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 8px rgba(252, 209, 22, 0.4)' : 'none'
                    }}
                  >
                    {c.name} ({c.count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Paneles KPI idénticos a la referencia visual para la carretilla seleccionada */}
          {renderKpiPanelGroup(
            selectedCarretilla === 'Todas' ? 'FLOTA TOTAL' : selectedCarretilla,
            filteredRecords.length,
            filteredRecords.filter(r => r.estado === 'Operativo').length,
            filteredRecords.filter(r => r.estado === 'Mantenimiento').length,
            filteredRecords.filter(r => r.estado === 'Fuera de Servicio').length,
            true
          )}
        </>
      )}

      {/* VISTA 2: VER CADA CARRETILLA EN PANELES INDIVIDUALES (REQUERIMIENTO DEL USUARIO) */}
      {activeView === 'todas_paneles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2.5rem' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.2rem 1.6rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#00205b' }}>
                📦 Paneles Preoperacionales por Cada Carretilla de la Flota
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.83rem', color: '#64748b' }}>
                Monitoreo simultáneo con paneles idénticos para cada una de las {carretillasStats.length} carretillas de Operaciones Logísticas.
              </p>
            </div>
            <button
              onClick={() => setActiveView('detalle')}
              style={{
                background: '#00205b',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              Ir a Tabla y Filtros ➔
            </button>
          </div>

          {carretillasStats.map(carretilla => {
            const dispPct = carretilla.total > 0
              ? Math.round(((carretilla.operativos + carretilla.mantenimiento) / carretilla.total) * 100)
              : 100;
            const isGood = dispPct >= 95;
            const isMed = dispPct >= 85 && dispPct < 95;

            return (
              <div
                key={carretilla.name}
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '1.6rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 6px 24px -4px rgba(0, 0, 0, 0.06)'
                }}
              >
                {/* Cabecera de la Carretilla */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.2rem',
                  paddingBottom: '0.8rem',
                  borderBottom: '1px solid #f1f5f9',
                  flexWrap: 'wrap',
                  gap: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#00205b',
                      color: '#fcd116',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '10px',
                      fontWeight: 900,
                      fontSize: '1rem',
                      letterSpacing: '0.02em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}>
                      <span>🛒</span> {carretilla.name}
                    </span>

                    <span style={{
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '999px',
                      background: isGood ? '#dcfce7' : isMed ? '#fef3c7' : '#fee2e2',
                      color: isGood ? '#15803d' : isMed ? '#b45309' : '#b91c1c'
                    }}>
                      Disponibilidad: {dispPct}%
                    </span>

                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Última inspección: <strong style={{ color: '#1e293b' }}>{carretilla.ultimaFecha || 'Reciente'}</strong> por <strong style={{ color: '#1e293b' }}>{carretilla.ultimoInspector}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCarretilla(carretilla.name);
                      setActiveView('detalle');
                    }}
                    style={{
                      background: '#f8fafc',
                      color: '#00205b',
                      border: '1.5px solid #cbd5e1',
                      padding: '0.45rem 0.9rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      transition: 'all 0.15s ease'
                    }}
                    title="Ver histórico detallado de inspecciones de esta carretilla"
                  >
                    🔍 Ver Tabla de {carretilla.name}
                  </button>
                </div>

                {/* Los 4 Paneles exactamente con el diseño solicitado */}
                {renderKpiPanelGroup(
                  carretilla.name,
                  carretilla.total,
                  carretilla.operativos,
                  carretilla.mantenimiento,
                  carretilla.fueraServicio,
                  false
                )}
              </div>
            );
          })}
        </div>
      )}

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
            🛠️ Cumplimiento por Criterio de Inspección
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>
            Porcentaje de conformidad técnica evaluado en las inspecciones ({selectedCarretilla})
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
            {/* Bujes */}
            <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#00205b' }}>🛞 Bujes de Llantas</span>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: checkStats.buges >= 90 ? '#10b981' : '#f59e0b' }}>
                  {checkStats.buges}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${checkStats.buges}%`, height: '100%', background: checkStats.buges >= 90 ? '#10b981' : '#f59e0b', borderRadius: '999px' }} />
              </div>
            </div>

            {/* Llantas */}
            <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#00205b' }}>🔘 Estado de Llantas</span>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: checkStats.llantas >= 90 ? '#10b981' : '#f59e0b' }}>
                  {checkStats.llantas}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${checkStats.llantas}%`, height: '100%', background: checkStats.llantas >= 90 ? '#10b981' : '#f59e0b', borderRadius: '999px' }} />
              </div>
            </div>

            {/* Soldaduras */}
            <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#00205b' }}>🛡️ Puntos de Soldadura</span>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: checkStats.soldaduras >= 90 ? '#10b981' : '#ef4444' }}>
                  {checkStats.soldaduras}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${checkStats.soldaduras}%`, height: '100%', background: checkStats.soldaduras >= 90 ? '#10b981' : '#ef4444', borderRadius: '999px' }} />
              </div>
            </div>

            {/* Bases Espaldar */}
            <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#00205b' }}>📐 Bases de Espaldar</span>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: checkStats.bases >= 90 ? '#10b981' : '#ef4444' }}>
                  {checkStats.bases}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${checkStats.bases}%`, height: '100%', background: checkStats.bases >= 90 ? '#10b981' : '#ef4444', borderRadius: '999px' }} />
              </div>
            </div>

            {/* Mango Agarre */}
            <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#00205b' }}>✋ Mango de Agarre</span>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: checkStats.mango >= 90 ? '#10b981' : '#f59e0b' }}>
                  {checkStats.mango}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${checkStats.mango}%`, height: '100%', background: checkStats.mango >= 90 ? '#10b981' : '#f59e0b', borderRadius: '999px' }} />
              </div>
            </div>

            {/* Pintura */}
            <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#00205b' }}>🎨 Pintura y Acabado</span>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: checkStats.pintura >= 90 ? '#10b981' : '#f59e0b' }}>
                  {checkStats.pintura}%
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${checkStats.pintura}%`, height: '100%', background: checkStats.pintura >= 90 ? '#10b981' : '#f59e0b', borderRadius: '999px' }} />
              </div>
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
                <th style={{ padding: '0.75rem 1rem' }}>Turno</th>
                <th style={{ padding: '0.75rem 1rem' }}>Inspector</th>
                <th style={{ padding: '0.75rem 1rem' }}>Ubicación</th>
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
                  <td style={{ padding: '0.75rem 1rem', color: '#475569', fontSize: '0.78rem', fontWeight: 600 }}>
                    {r.turno || 'Turno A'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#334155', fontWeight: 700 }}>
                    <div>{r.inspector}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>{r.cargo || 'Auxiliar'}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                    {r.ubicacion}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b', whiteSpace: 'nowrap' }}>
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
                        padding: '0.35rem 0.75rem',
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
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {selectedItem.ubicacion} • Inspector: <strong>{selectedItem.inspector}</strong> ({selectedItem.cargo || 'Auxiliar'})
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, marginTop: '0.2rem' }}>
                  🕒 {selectedItem.turno || 'Turno A'} • 📅 {selectedItem.fecha_inspeccion}
                </div>
              </div>
            </div>

            {/* Chequeos Preoperacionales detallados */}
            {selectedItem.chequeos && (
              <div style={{ marginBottom: '1.2rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#00205b', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                  📋 Lista de Chequeo Preoperacional:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {Object.entries(selectedItem.chequeos).map(([criterio, val]) => {
                    const isOk = val === 'Conforme';
                    return (
                      <div key={criterio} style={{
                        background: isOk ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${isOk ? '#bbf7d0' : '#fecaca'}`,
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.8rem'
                      }}>
                        <span style={{ fontWeight: 600, color: isOk ? '#166534' : '#991b1b' }}>{criterio}</span>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          background: isOk ? '#22c55e' : '#ef4444',
                          color: '#fff',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px'
                        }}>
                          {isOk ? '✔ SI' : '✖ NO'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

      {/* Modal: Registrar Nueva Inspección en Supabase Cloud */}
      {isNewModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 32, 91, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 700 }}>
                  ☁️ Supabase Cloud Sync
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#00205b', margin: '0.4rem 0 0.1rem 0' }}>
                  Nueva Inspección Preoperacional
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  El registro se almacenará inmediatamente en la base de datos de Supabase.
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInspection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.3rem' }}>
                    Equipo / Carretilla *
                  </label>
                  <select
                    value={newForm.equipo}
                    onChange={e => setNewForm({ ...newForm, equipo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    {carretillasList.length > 0 ? (
                      carretillasList.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="CARRETILLA 1">CARRETILLA 1</option>
                        <option value="CARRETILLA 2">CARRETILLA 2</option>
                        <option value="CARRETILLA 3">CARRETILLA 3</option>
                        <option value="CARRETILLA 4">CARRETILLA 4</option>
                        <option value="CARRETILLA 5">CARRETILLA 5</option>
                        <option value="CARRETILLA 6 GLP">CARRETILLA 6 GLP</option>
                        <option value="CARRETILLA GLP">CARRETILLA GLP</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.3rem' }}>
                    Fecha de Inspección *
                  </label>
                  <input
                    type="date"
                    required
                    value={newForm.fecha_inspeccion}
                    onChange={e => setNewForm({ ...newForm, fecha_inspeccion: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.3rem' }}>
                    Turno *
                  </label>
                  <select
                    value={newForm.turno}
                    onChange={e => setNewForm({ ...newForm, turno: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="TURNO A (23:00 - 7:00)">TURNO A (23:00 - 7:00)</option>
                    <option value="TURNO B (7:00 - 15:00)">TURNO B (7:00 - 15:00)</option>
                    <option value="TURNO C (15:00 - 23:00)">TURNO C (15:00 - 23:00)</option>
                    <option value="Turno 1">Turno 1</option>
                    <option value="Turno 2">Turno 2</option>
                    <option value="Turno 3">Turno 3</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.3rem' }}>
                    Área Operativa
                  </label>
                  <input
                    type="text"
                    value={newForm.area}
                    onChange={e => setNewForm({ ...newForm, area: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.3rem' }}>
                    Inspector / Responsable *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    value={newForm.inspector}
                    onChange={e => setNewForm({ ...newForm, inspector: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.3rem' }}>
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={newForm.cargo}
                    onChange={e => setNewForm({ ...newForm, cargo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Lista de Chequeo Rápida */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00205b', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                  📋 Verificación de Puntos Críticos:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
                  {[
                    { key: 'mango', label: '✋ Mango de agarre' },
                    { key: 'llantas', label: '🔘 Llantas en buen estado' },
                    { key: 'buges', label: '🛞 Bujes de rodadura' },
                    { key: 'soldaduras', label: '🛡️ Soldaduras estructurales' },
                    { key: 'bases', label: '📐 Bases y espaldar' },
                    { key: 'pintura', label: '🎨 Pintura y acabado' }
                  ].map(c => (
                    <label
                      key={c.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.7rem',
                        background: newForm[c.key] ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${newForm[c.key] ? '#bbf7d0' : '#fecaca'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: newForm[c.key] ? '#166534' : '#991b1b'
                      }}
                    >
                      <span>{c.label}</span>
                      <input
                        type="checkbox"
                        checked={newForm[c.key]}
                        onChange={e => setNewForm({ ...newForm, [c.key]: e.target.checked })}
                        style={{ cursor: 'pointer' }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.3rem' }}>
                  Observaciones / Hallazgos
                </label>
                <textarea
                  rows={2}
                  value={newForm.observaciones}
                  onChange={e => setNewForm({ ...newForm, observaciones: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  style={{
                    background: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.6rem 1.4rem',
                    borderRadius: '8px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  {submitting ? 'Sincronizando con Supabase...' : '💾 Registrar en Supabase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
