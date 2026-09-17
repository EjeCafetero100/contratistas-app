"use client";

import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

// Colores corporativos y semafóricos
const SOAT_COLORS = {
  'Vigente': '#10b981',        // Verde esmeralda
  'Por Vencer': '#f59e0b',     // Amarillo / Ámbar
  'Vencido': '#ef4444',        // Rojo alerta
  'Sin Vehículo': '#94a3b8'    // Gris pizarra
};

const TRANSPORT_COLORS = {
  'Pasajero de motocicleta': '#3b82f6',
  'Conductor motocicleta': '#f59e0b',
  'Peatón': '#10b981',
  'Pasajero Servicio Público Transporte': '#8b5cf6',
  'Conductor de vehiculo particular': '#0284c7',
  'Conductor bicicleta': '#ec4899',
  'Pasajero de compañero de trabajo': '#64748b'
};

const EMPRESA_COLORS = {
  'C&R ASOCIADOS SAS': '#00205b',
  'Easy Logistica': '#f59e0b',
  'Abi': '#10b981'
};

export default function RegresoSeguroPage() {
  const [data, setData] = useState({ records: [], kpis: {}, stats: {}, inspecciones: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen', 'documentos', 'inspecciones', 'censo'
  const [source, setSource] = useState('Cargando...');

  // FILTROS VINCULADOS INTERACTIVOS
  const [selectedSoat, setSelectedSoat] = useState(null);            // 'Vigente', 'Vencido', 'Por Vencer', 'Sin Vehículo'
  const [selectedTransport, setSelectedTransport] = useState(null);  // Rol de movilidad
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);      // Empresa
  const [selectedRiesgo, setSelectedRiesgo] = useState(null);        // Riesgo específico
  const [search, setSearch] = useState('');

  // Modales
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newFormData, setNewFormData] = useState({
    nombre: '',
    cedula: '',
    empresa: 'C&R ASOCIADOS SAS',
    cargo: '',
    ciudad: 'Barrancabermeja',
    barrio: '',
    rol_principal: 'Conductor motocicleta',
    placa: '',
    soat_vencimiento: '',
    tecnomecanica_vencimiento: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Carga de datos desde API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/regreso-seguro');
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
      setSource(json.source === 'supabase' ? 'Supabase Cloud (Tiempo Real)' : 'Archivo Local (Excel Backup)');
    } catch (err) {
      console.error('Error cargando datos regreso seguro:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Función para normalizar el estado SOAT del colaborador
  const getCollaboratorSoatCategory = (r) => {
    if (!r.placa) return 'Sin Vehículo';
    if (r.estado_soat === 'Vigente') return 'Vigente';
    if (r.estado_soat === 'Por Vencer') return 'Por Vencer';
    if (r.estado_soat === 'Vencido') return 'Vencido';
    return 'Sin Vehículo';
  };

  // MANEJADORES DE CLIC EN GRÁFICAS (TOGGLE)
  const handleSoatClick = (soatCategory) => {
    if (!soatCategory) return;
    setSelectedSoat(prev => (prev === soatCategory ? null : soatCategory));
  };

  const handleTransportClick = (transportName) => {
    if (!transportName) return;
    setSelectedTransport(prev => (prev === transportName ? null : transportName));
  };

  const handleEmpresaClick = (empresaName) => {
    if (!empresaName) return;
    setSelectedEmpresa(prev => (prev === empresaName ? null : empresaName));
  };

  const handleRiesgoClick = (riesgoName) => {
    if (!riesgoName) return;
    setSelectedRiesgo(prev => (prev === riesgoName ? null : riesgoName));
  };

  const clearAllFilters = () => {
    setSelectedSoat(null);
    setSelectedTransport(null);
    setSelectedEmpresa(null);
    setSelectedRiesgo(null);
    setSearch('');
  };

  const hasActiveFilters = Boolean(selectedSoat || selectedTransport || selectedEmpresa || selectedRiesgo || search);

  // 1. REGISTROS FILTRADOS DINÁMICAMENTE (REPLICA EN TODO EL DASHBOARD)
  const filteredRecords = useMemo(() => {
    const rawList = data.records || [];
    return rawList.filter(r => {
      // 1. Filtro SOAT
      if (selectedSoat) {
        const cat = getCollaboratorSoatCategory(r);
        if (cat !== selectedSoat) return false;
      }

      // 2. Filtro Tipo de Transporte
      if (selectedTransport) {
        if (r.rol_principal !== selectedTransport) return false;
      }

      // 3. Filtro Empresa
      if (selectedEmpresa && selectedEmpresa !== 'Todas') {
        if (r.empresa !== selectedEmpresa) return false;
      }

      // 4. Filtro Riesgo Específico
      if (selectedRiesgo) {
        const listRiesgos = Array.isArray(r.riesgos_identificados) ? r.riesgos_identificados : [];
        if (!listRiesgos.includes(selectedRiesgo)) return false;
      }

      // 5. Búsqueda de Texto
      if (search) {
        const q = search.toLowerCase();
        const match =
          (r.nombre && r.nombre.toLowerCase().includes(q)) ||
          (r.cedula && r.cedula.toLowerCase().includes(q)) ||
          (r.placa && r.placa.toLowerCase().includes(q)) ||
          (r.cargo && r.cargo.toLowerCase().includes(q)) ||
          (r.barrio && r.barrio.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [data.records, selectedSoat, selectedTransport, selectedEmpresa, selectedRiesgo, search]);

  // 2. CÁLCULO DINÁMICO DE DATOS PARA LA GRÁFICA DE SOAT (BASADA EN EL SUBCONJUNTO ACTUAL)
  const soatChartData = useMemo(() => {
    // Si queremos ver el conteo de SOAT dentro del filtro de transporte actual, usamos una base sin filtro de SOAT
    const baseList = (data.records || []).filter(r => {
      if (selectedTransport && r.rol_principal !== selectedTransport) return false;
      if (selectedEmpresa && r.empresa !== selectedEmpresa) return false;
      if (selectedRiesgo && (!Array.isArray(r.riesgos_identificados) || !r.riesgos_identificados.includes(selectedRiesgo))) return false;
      return true;
    });

    const counts = { 'Vigente': 0, 'Por Vencer': 0, 'Vencido': 0, 'Sin Vehículo': 0 };
    baseList.forEach(r => {
      const cat = getCollaboratorSoatCategory(r);
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const totalBase = baseList.length || 1;
    return [
      { name: 'Vigente', value: counts['Vigente'], pct: Math.round((counts['Vigente'] / totalBase) * 100), color: SOAT_COLORS['Vigente'] },
      { name: 'Por Vencer', value: counts['Por Vencer'], pct: Math.round((counts['Por Vencer'] / totalBase) * 100), color: SOAT_COLORS['Por Vencer'] },
      { name: 'Vencido', value: counts['Vencido'], pct: Math.round((counts['Vencido'] / totalBase) * 100), color: SOAT_COLORS['Vencido'] },
      { name: 'Sin Vehículo', value: counts['Sin Vehículo'], pct: Math.round((counts['Sin Vehículo'] / totalBase) * 100), color: SOAT_COLORS['Sin Vehículo'] }
    ];
  }, [data.records, selectedTransport, selectedEmpresa, selectedRiesgo]);

  // 3. CÁLCULO DINÁMICO DE DATOS PARA LA GRÁFICA DE TRANSPORTE
  const transportChartData = useMemo(() => {
    // Base considerando filtro de SOAT, Empresa y Riesgo
    const baseList = (data.records || []).filter(r => {
      if (selectedSoat) {
        const cat = getCollaboratorSoatCategory(r);
        if (cat !== selectedSoat) return false;
      }
      if (selectedEmpresa && r.empresa !== selectedEmpresa) return false;
      if (selectedRiesgo && (!Array.isArray(r.riesgos_identificados) || !r.riesgos_identificados.includes(selectedRiesgo))) return false;
      return true;
    });

    const counts = {};
    baseList.forEach(r => {
      const rol = r.rol_principal || 'No especificado';
      counts[rol] = (counts[rol] || 0) + 1;
    });

    const totalBase = baseList.length || 1;
    return Object.entries(counts)
      .map(([rol, count]) => ({
        rol,
        count,
        pct: Math.round((count / totalBase) * 100),
        color: TRANSPORT_COLORS[rol] || '#0284c7'
      }))
      .sort((a, b) => b.count - a.count);
  }, [data.records, selectedSoat, selectedEmpresa, selectedRiesgo]);

  // 4. CÁLCULO DINÁMICO DE KPIS VINCULADOS
  const dynamicKpis = useMemo(() => {
    const list = filteredRecords;
    const total = list.length;
    const conPlaca = list.filter(r => r.placa).length;
    const motos = list.filter(r => (r.rol_principal || '').toLowerCase().includes('moto')).length;
    const soatVigente = list.filter(r => r.placa && r.estado_soat === 'Vigente').length;
    const soatVencido = list.filter(r => r.placa && r.estado_soat === 'Vencido').length;
    const soatPorVencer = list.filter(r => r.placa && r.estado_soat === 'Por Vencer').length;
    const tecnoVencida = list.filter(r => r.placa && r.estado_tecnomecanica === 'Vencido').length;

    return {
      total,
      conPlaca,
      motos,
      soatVigente,
      soatVencido,
      soatPorVencer,
      tecnoVencida
    };
  }, [filteredRecords]);

  // Exportar a Excel
  const exportToExcel = () => {
    if (!filteredRecords || filteredRecords.length === 0) return;
    const exportData = filteredRecords.map(r => ({
      'Nombre': r.nombre,
      'Cédula': r.cedula,
      'Empresa': r.empresa,
      'Cargo': r.cargo,
      'Ciudad': r.ciudad,
      'Barrio': r.barrio,
      'Rol Movilidad': r.rol_principal,
      'Tipo Vehículo': r.tipo_vehiculo,
      'Placa': r.placa || 'N/A',
      'SOAT Vence': r.soat_vencimiento || 'N/A',
      'Estado SOAT': r.estado_soat || 'N/A',
      'Tecnomecánica Vence': r.tecnomecanica_vencimiento || 'N/A',
      'Estado Tecnomecánica': r.estado_tecnomecanica || 'N/A',
      'Tiempo Desplazamiento': r.tiempo_desplazamiento || 'N/A',
      'Riesgos Viales Identificados': Array.isArray(r.riesgos_identificados) ? r.riesgos_identificados.join('; ') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Regreso_Seguro');
    XLSX.writeFile(wb, `Regreso_Seguro_Filtrado_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Crear nuevo colaborador
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/regreso-seguro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFormData)
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) throw new Error(resJson.error || 'Error al guardar');

      alert('Colaborador guardado exitosamente en Supabase');
      setShowNewModal(false);
      setNewFormData({
        nombre: '',
        cedula: '',
        empresa: 'C&R ASOCIADOS SAS',
        cargo: '',
        ciudad: 'Barrancabermeja',
        barrio: '',
        rol_principal: 'Conductor motocicleta',
        placa: '',
        soat_vencimiento: '',
        tecnomecanica_vencimiento: ''
      });
      fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
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
            <span style={{ fontSize: '1.8rem' }}>🏡</span>
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
              Seguridad Vial • SafeTogether
            </span>
            <span style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '0.72rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              fontWeight: 600
            }}>
              📍 CD Barrancabermeja
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
            REGRESO SEGURO A CASA
          </h1>
          <p style={{ margin: 0, opacity: 0.85, fontSize: '0.9rem', maxWidth: '680px' }}>
            Dashboard interactivo de desplazamiento seguro. <strong>Haz clic en cualquier gráfica (SOAT, transporte o empresa)</strong> para filtrar y replicar automáticamente todas las métricas y la tabla en tiempo real.
          </p>
        </div>

        {/* Acciones y Badge Fuente */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.12)',
            padding: '0.35rem 0.75rem',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 600
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: data.source === 'supabase' ? '#10b981' : '#f59e0b'
            }} />
            Fuente: {source}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={fetchData}
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
              title="Recargar datos desde Supabase"
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

            <button
              onClick={() => setShowNewModal(true)}
              style={{
                background: '#fcd116',
                color: '#00205b',
                border: 'none',
                padding: '0.5rem 1rem',
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
              ➕ Nuevo Registro
            </button>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS ACTIVOS DINÁMICOS (CROSS-FILTERING) */}
      {hasActiveFilters && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '0.8rem 1.2rem',
          marginBottom: '1.2rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 32, 91, 0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#00205b' }}>
              🎯 FILTROS APLICADOS:
            </span>

            {/* Chip SOAT */}
            {selectedSoat && (
              <span style={{
                background: SOAT_COLORS[selectedSoat] || '#3b82f6',
                color: '#ffffff',
                padding: '0.3rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                📄 SOAT: {selectedSoat}
                <button
                  onClick={() => setSelectedSoat(null)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Chip Transporte */}
            {selectedTransport && (
              <span style={{
                background: '#00205b',
                color: '#fcd116',
                padding: '0.3rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                🛵 Transporte: {selectedTransport}
                <button
                  onClick={() => setSelectedTransport(null)}
                  style={{ background: 'transparent', border: 'none', color: '#fcd116', cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Chip Empresa */}
            {selectedEmpresa && (
              <span style={{
                background: '#f59e0b',
                color: '#ffffff',
                padding: '0.3rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                🏢 {selectedEmpresa}
                <button
                  onClick={() => setSelectedEmpresa(null)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Chip Riesgo */}
            {selectedRiesgo && (
              <span style={{
                background: '#ef4444',
                color: '#ffffff',
                padding: '0.3rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                ⚠️ Riesgo: {selectedRiesgo}
                <button
                  onClick={() => setSelectedRiesgo(null)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              </span>
            )}

            {/* Chip Texto */}
            {search && (
              <span style={{
                background: '#64748b',
                color: '#ffffff',
                padding: '0.3rem 0.65rem',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                🔍 "{search}"
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>
              Mostrando <strong>{filteredRecords.length}</strong> de {data.records?.length || 204} colaboradores
            </span>
            <button
              onClick={clearAllFilters}
              style={{
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              ↺ Restablecer Filtros
            </button>
          </div>
        </div>
      )}

      {/* TARJETAS KPI VINCULADAS EN TIEMPO REAL */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Colaboradores Filtrados */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          borderLeft: '5px solid #00205b'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Colaboradores {hasActiveFilters ? 'Filtrados' : 'Censo'}
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#00205b', margin: '0.2rem 0' }}>
            {dynamicKpis.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {hasActiveFilters ? `${Math.round((dynamicKpis.total / (data.records?.length || 1)) * 100)}% de la población total` : '100% CD Barrancabermeja'}
          </div>
        </div>

        {/* SOAT VIGENTE */}
        <div
          onClick={() => handleSoatClick('Vigente')}
          style={{
            background: selectedSoat === 'Vigente' ? '#ecfdf5' : '#ffffff',
            borderRadius: '12px',
            padding: '1.2rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '5px solid #10b981',
            border: selectedSoat === 'Vigente' ? '2px solid #10b981' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
          title="Haz clic para filtrar solo colaboradores con SOAT Vigente"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
              SOAT Vigente
            </span>
            <span style={{ fontSize: '0.9rem' }}>🟢</span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#15803d', margin: '0.2rem 0' }}>
            {dynamicKpis.soatVigente}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>
            {selectedSoat === 'Vigente' ? '✔ Filtro Activo (Clic para quitar)' : 'Documentos al día'}
          </div>
        </div>

        {/* SOAT VENCIDO */}
        <div
          onClick={() => handleSoatClick('Vencido')}
          style={{
            background: selectedSoat === 'Vencido' ? '#fef2f2' : '#ffffff',
            borderRadius: '12px',
            padding: '1.2rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '5px solid #ef4444',
            border: selectedSoat === 'Vencido' ? '2px solid #ef4444' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
          title="Haz clic para filtrar solo colaboradores con SOAT Vencido"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>
              SOAT Vencido
            </span>
            <span style={{ fontSize: '0.9rem' }}>🔴</span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#b91c1c', margin: '0.2rem 0' }}>
            {dynamicKpis.soatVencido}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>
            {selectedSoat === 'Vencido' ? '✔ Filtro Activo (Clic para quitar)' : 'Requiere gestión urgente'}
          </div>
        </div>

        {/* SOAT POR VENCER */}
        <div
          onClick={() => handleSoatClick('Por Vencer')}
          style={{
            background: selectedSoat === 'Por Vencer' ? '#fffbeb' : '#ffffff',
            borderRadius: '12px',
            padding: '1.2rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '5px solid #f59e0b',
            border: selectedSoat === 'Por Vencer' ? '2px solid #f59e0b' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
          title="Haz clic para filtrar colaboradores con SOAT próximo a vencer"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
              SOAT Por Vencer (≤30d)
            </span>
            <span style={{ fontSize: '0.9rem' }}>🟡</span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#b45309', margin: '0.2rem 0' }}>
            {dynamicKpis.soatPorVencer}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>
            {selectedSoat === 'Por Vencer' ? '✔ Filtro Activo (Clic para quitar)' : 'En periodo de renovación'}
          </div>
        </div>

        {/* USO DE MOTOCICLETA */}
        <div
          onClick={() => handleTransportClick('Conductor motocicleta')}
          style={{
            background: selectedTransport?.includes('moto') ? '#eff6ff' : '#ffffff',
            borderRadius: '12px',
            padding: '1.2rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderLeft: '5px solid #0284c7',
            cursor: 'pointer'
          }}
          title="Haz clic para filtrar por motociclistas"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
              Motocicletas
            </span>
            <span style={{ fontSize: '0.9rem' }}>🏍️</span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0284c7', margin: '0.2rem 0' }}>
            {dynamicKpis.motos}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>
            Conductores y pasajeros
          </div>
        </div>
      </div>

      {/* PESTAÑAS */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '1.5rem',
        background: '#ffffff',
        padding: '0.6rem 0.8rem',
        borderRadius: '12px'
      }}>
        {[
          { id: 'resumen', label: '📊 Resumen & Gráficas Interactivas', count: null },
          { id: 'documentos', label: '📋 Control Documental (Placas)', count: dynamicKpis.conPlaca },
          { id: 'inspecciones', label: '🏍️ Inspecciones Preoperacionales', count: data.inspecciones?.length || 2 },
          { id: 'censo', label: '👥 Censo Filtrado de Colaboradores', count: filteredRecords.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.65rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: activeTab === tab.id ? 800 : 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === tab.id ? '#00205b' : 'transparent',
              color: activeTab === tab.id ? '#ffffff' : '#64748b',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {tab.label}
            {tab.count !== null && (
              <span style={{
                background: activeTab === tab.id ? '#fcd116' : '#e2e8f0',
                color: activeTab === tab.id ? '#00205b' : '#475569',
                padding: '0.15rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* PESTAÑA 1: RESUMEN Y GRÁFICAS VINCULADAS INTERACTIVAS */}
      {activeTab === 'resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Fila Principal de Gráficas: SOAT (Vigente/Vencido) y Tipo de Transporte */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* GRÁFICA 1: ESTADO DEL SOAT (INTERACTIVA) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
              border: selectedSoat ? `2px solid ${SOAT_COLORS[selectedSoat]}` : '1px solid #e2e8f0',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#00205b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    📄 Estado de SOAT (Vigentes vs Vencidos)
                    {selectedSoat && <span style={{ fontSize: '0.75rem', background: SOAT_COLORS[selectedSoat], color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>Filtrado: {selectedSoat}</span>}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    <strong>Presiona cualquier sección</strong> para filtrar la lista y demás gráficas
                  </p>
                </div>
                {selectedSoat && (
                  <button
                    onClick={() => setSelectedSoat(null)}
                    style={{ background: '#f1f5f9', border: 'none', color: '#475569', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✕ Quitar
                  </button>
                )}
              </div>

              {/* Gráfica Donut de SOAT */}
              <div style={{ height: '260px', width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={soatChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      onClick={(entry) => handleSoatClick(entry.name)}
                      cursor="pointer"
                    >
                      {soatChartData.map((entry) => {
                        const isSelected = selectedSoat === entry.name;
                        const isDimmed = selectedSoat && !isSelected;
                        return (
                          <Cell
                            key={`cell-${entry.name}`}
                            fill={entry.color}
                            opacity={isDimmed ? 0.35 : 1}
                            stroke={isSelected ? '#00205b' : '#ffffff'}
                            strokeWidth={isSelected ? 3 : 1}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip formatter={(value, name, item) => [`${value} colaboradores (${item.payload.pct}%)`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Botones / Tarjetitas interactivas de SOAT */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '0.8rem' }}>
                {soatChartData.map(s => {
                  const isSelected = selectedSoat === s.name;
                  return (
                    <button
                      key={s.name}
                      onClick={() => handleSoatClick(s.name)}
                      style={{
                        background: isSelected ? s.color : '#f8fafc',
                        color: isSelected ? '#ffffff' : '#1e293b',
                        border: `1px solid ${isSelected ? s.color : '#cbd5e1'}`,
                        borderRadius: '8px',
                        padding: '0.55rem 0.3rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, opacity: isSelected ? 0.95 : 0.75 }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900 }}>
                        {s.value}
                      </div>
                      <div style={{ fontSize: '0.68rem', opacity: isSelected ? 0.9 : 0.65 }}>
                        {s.pct}%
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GRÁFICA 2: TIPO DE TRANSPORTE UTILIZADO (INTERACTIVA) */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
              border: selectedTransport ? '2px solid #00205b' : '1px solid #e2e8f0',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#00205b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    🛵 Tipo de Transporte Utilizado
                    {selectedTransport && <span style={{ fontSize: '0.75rem', background: '#00205b', color: '#fcd116', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>Filtrado: {selectedTransport}</span>}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    <strong>Presiona cualquier barra</strong> para filtrar por ese rol de movilidad
                  </p>
                </div>
                {selectedTransport && (
                  <button
                    onClick={() => setSelectedTransport(null)}
                    style={{ background: '#f1f5f9', border: 'none', color: '#475569', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✕ Quitar
                  </button>
                )}
              </div>

              {/* Gráfica de Barras Horizontales de Transporte */}
              <div style={{ height: '310px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={transportChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 110, bottom: 5 }}
                    onClick={(state) => {
                      if (state && state.activePayload && state.activePayload[0]) {
                        handleTransportClick(state.activePayload[0].payload.rol);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="rol"
                      type="category"
                      width={120}
                      tick={{ fontSize: 9.5, fill: '#334155', cursor: 'pointer' }}
                    />
                    <Tooltip formatter={(val, name, item) => [`${val} colaboradores (${item.payload.pct}%)`, 'Cantidad']} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} cursor="pointer">
                      {transportChartData.map((entry) => {
                        const isSelected = selectedTransport === entry.rol;
                        const isDimmed = selectedTransport && !isSelected;
                        return (
                          <Cell
                            key={`cell-${entry.rol}`}
                            fill={entry.color}
                            opacity={isDimmed ? 0.35 : 1}
                            stroke={isSelected ? '#00205b' : 'none'}
                            strokeWidth={isSelected ? 2 : 0}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Fila Secundaria: Empresas, Top Riesgos Viales y Tiempos de Trayecto */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Filtro por Empresa */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#00205b' }}>
                🏢 Empresas Participantes (Clic para filtrar)
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                Distribución del personal encuestado en Barrancabermeja
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(data.stats?.distEmpresas || []).map((emp) => {
                  const isSelected = selectedEmpresa === emp.name;
                  return (
                    <div
                      key={emp.name}
                      onClick={() => handleEmpresaClick(emp.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: isSelected ? '#00205b' : '#f8fafc',
                        color: isSelected ? '#ffffff' : '#1e293b',
                        border: `1px solid ${isSelected ? '#00205b' : '#e2e8f0'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: isSelected ? '#fcd116' : (EMPRESA_COLORS[emp.name] || '#64748b')
                        }} />
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{emp.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 900, fontSize: '1rem', color: isSelected ? '#fcd116' : '#00205b' }}>
                          {emp.count}
                        </span>
                        <span style={{ fontSize: '0.78rem', marginLeft: '0.35rem', opacity: 0.8 }}>
                          ({emp.pct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Riesgos Viales Identificados */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#00205b' }}>
                ⚠️ Principales Riesgos en la Vía (Clic para filtrar)
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                Peligros más reportados por los colaboradores
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(data.stats?.topRiesgos || []).slice(0, 5).map((rg) => {
                  const isSelected = selectedRiesgo === rg.riesgo;
                  return (
                    <div
                      key={rg.riesgo}
                      onClick={() => handleRiesgoClick(rg.riesgo)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        background: isSelected ? '#ef4444' : '#fee2e2',
                        color: isSelected ? '#ffffff' : '#991b1b',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        • {rg.riesgo}
                      </span>
                      <span style={{ background: isSelected ? '#fff' : '#b91c1c', color: isSelected ? '#b91c1c' : '#fff', padding: '0.1rem 0.45rem', borderRadius: '999px', fontSize: '0.75rem' }}>
                        {rg.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Elementos de Protección EPP */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#00205b' }}>
                🛡️ Elementos de Seguridad Vial (EPP)
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                Conteo de implementos disponibles
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                {(data.stats?.distEpp || []).map((epp) => (
                  <div key={epp.item} style={{ background: '#f8fafc', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.1rem' }}>
                      {epp.item.toLowerCase().includes('casco') ? '🪖' :
                       epp.item.toLowerCase().includes('luz') ? '💡' :
                       epp.item.toLowerCase().includes('guante') ? '🧤' :
                       epp.item.toLowerCase().includes('gafa') ? '🥽' :
                       epp.item.toLowerCase().includes('reflectivo') ? '🦺' : '🔧'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>{epp.item}</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#00205b' }}>{epp.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VISTA PREVIA DE LA TABLA VINCULADA EN RESUMEN */}
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#00205b' }}>
                  👥 Colaboradores Filtrados ({filteredRecords.length})
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Esta lista responde de inmediato a los clics realizados en las gráficas de SOAT, transporte o empresa
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar en esta vista..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: '0.5rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    minWidth: '220px'
                  }}
                />
                <button
                  onClick={() => setActiveTab('censo')}
                  style={{
                    background: '#00205b',
                    color: '#fff',
                    border: 'none',
                    padding: '0.5rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Ver en Censo Completo →
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.7rem 0.9rem' }}>Colaborador</th>
                    <th style={{ padding: '0.7rem 0.9rem' }}>Empresa</th>
                    <th style={{ padding: '0.7rem 0.9rem' }}>Rol de Movilidad</th>
                    <th style={{ padding: '0.7rem 0.9rem' }}>Placa</th>
                    <th style={{ padding: '0.7rem 0.9rem' }}>Estado SOAT</th>
                    <th style={{ padding: '0.7rem 0.9rem' }}>Tecnomecánica</th>
                    <th style={{ padding: '0.7rem 0.9rem', textAlign: 'center' }}>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.slice(0, 15).map((r, idx) => (
                    <tr key={r.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.7rem 0.9rem' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.nombre}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>CC: {r.cedula} • {r.cargo}</div>
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', color: '#334155', fontWeight: 600 }}>
                        {r.empresa}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem' }}>
                        <span style={{
                          background: '#f1f5f9',
                          color: '#0f172a',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.73rem'
                        }}>
                          {r.rol_principal}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem' }}>
                        {r.placa ? (
                          <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.45rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}>
                            {r.placa}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Sin vehículo</span>
                        )}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: r.estado_soat === 'Vigente' ? '#dcfce7' : r.estado_soat === 'Por Vencer' ? '#fef3c7' : r.estado_soat === 'Vencido' ? '#fee2e2' : '#f1f5f9',
                          color: r.estado_soat === 'Vigente' ? '#15803d' : r.estado_soat === 'Por Vencer' ? '#b45309' : r.estado_soat === 'Vencido' ? '#b91c1c' : '#64748b'
                        }}>
                          {r.estado_soat}
                        </span>
                        {r.soat_vencimiento && <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '0.15rem' }}>{r.soat_vencimiento}</div>}
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem' }}>
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: r.estado_tecnomecanica === 'Vigente' ? '#dcfce7' : r.estado_tecnomecanica === 'Por Vencer' ? '#fef3c7' : r.estado_tecnomecanica === 'Vencido' ? '#fee2e2' : '#f1f5f9',
                          color: r.estado_tecnomecanica === 'Vigente' ? '#15803d' : r.estado_tecnomecanica === 'Por Vencer' ? '#b45309' : r.estado_tecnomecanica === 'Vencido' ? '#b91c1c' : '#64748b'
                        }}>
                          {r.estado_tecnomecanica}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 0.9rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedRecord(r)}
                          style={{
                            background: '#00205b',
                            color: '#fff',
                            border: 'none',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Ver Perfil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRecords.length > 15 && (
                <div style={{ textAlign: 'center', padding: '0.8rem', fontSize: '0.8rem', color: '#64748b' }}>
                  Mostrando los primeros 15 de <strong>{filteredRecords.length}</strong> registros filtrados. Haz clic en la pestaña <strong>"Censo Completo"</strong> para explorar todos.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: CONTROL DOCUMENTAL DE PLACAS */}
      {activeTab === 'documentos' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#00205b' }}>
                🚗 Parque Automotor y Control de Vencimientos
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Mostrando {filteredRecords.filter(r => r.placa).length} vehículos registrados
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', borderRadius: '8px 0 0 8px' }}>Placa</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Colaborador</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Empresa</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tipo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>SOAT Vencimiento</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tecnomecánica Vence</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Licencia</th>
                  <th style={{ padding: '0.75rem 1rem', borderRadius: '0 8px 8px 0', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.filter(r => r.placa).map((r, i) => (
                  <tr key={r.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#00205b' }}>
                      <span style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '0.25rem 0.55rem',
                        borderRadius: '6px',
                        border: '1px solid #fcd34d',
                        letterSpacing: '0.05em'
                      }}>
                        {r.placa}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{r.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CC: {r.cedula}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569', fontWeight: 600 }}>{r.empresa}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        background: r.tipo_vehiculo === 'Motocicleta' ? '#e0f2fe' : '#f3e8ff',
                        color: r.tipo_vehiculo === 'Motocicleta' ? '#0369a1' : '#6b21a8',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {r.tipo_vehiculo}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div>{r.soat_vencimiento || 'Sin fecha'}</div>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: r.estado_soat === 'Vigente' ? '#dcfce7' : r.estado_soat === 'Por Vencer' ? '#fef3c7' : '#fee2e2',
                        color: r.estado_soat === 'Vigente' ? '#15803d' : r.estado_soat === 'Por Vencer' ? '#b45309' : '#b91c1c'
                      }}>
                        {r.estado_soat}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div>{r.tecnomecanica_vencimiento || 'Sin fecha'}</div>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: r.estado_tecnomecanica === 'Vigente' ? '#dcfce7' : r.estado_tecnomecanica === 'Por Vencer' ? '#fef3c7' : '#fee2e2',
                        color: r.estado_tecnomecanica === 'Vigente' ? '#15803d' : r.estado_tecnomecanica === 'Por Vencer' ? '#b45309' : '#b91c1c'
                      }}>
                        {r.estado_tecnomecanica}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{r.tipo_licencia || 'N/A'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.fecha_vencimiento_licencia || ''}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedRecord(r)}
                        style={{
                          background: '#f1f5f9',
                          color: '#00205b',
                          border: '1px solid #cbd5e1',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: INSPECCIONES PREOPERACIONALES DE MOTOS */}
      {activeTab === 'inspecciones' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#00205b' }}>
              🏍️ Inspecciones Preoperacionales de Motocicletas (Hoja 2)
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Auditoría mecánica y de seguridad vial para motocicletas de la operación Barrancabermeja
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
            {(data.inspecciones || []).map((insp) => (
              <div
                key={insp.id || insp.placa}
                style={{
                  background: '#f8fafc',
                  borderRadius: '14px',
                  padding: '1.4rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span style={{
                      background: '#00205b',
                      color: '#fcd116',
                      fontWeight: 900,
                      fontSize: '1rem',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '8px',
                      letterSpacing: '0.06em'
                    }}>
                      {insp.placa}
                    </span>
                    <h4 style={{ margin: '0.5rem 0 0.2rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                      {insp.propietario}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {insp.marca} {insp.modelo} • {insp.cilindraje} cc • Color {insp.color}
                    </div>
                  </div>

                  <span style={{
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '0.3rem 0.7rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    ✔ BUEN ESTADO
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', fontSize: '0.78rem' }}>
                  <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>Niveles y Líquidos:</div>
                    <div style={{ color: '#10b981', fontWeight: 800 }}>✔ Sin fugas de combustible ni aceite</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>Estado Mecánico:</div>
                    <div style={{ color: '#10b981', fontWeight: 800 }}>✔ Cadena, Relación y Frenos OK</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>Sistema de Luces:</div>
                    <div style={{ color: '#10b981', fontWeight: 800 }}>✔ Luces Medias, Bajas, Freno y Direccionales</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>Llantas y Pernos:</div>
                    <div style={{ color: '#10b981', fontWeight: 800 }}>✔ Desgaste y ajuste óptimo</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>Equipo de Seguridad:</div>
                    <div style={{ color: '#10b981', fontWeight: 800 }}>✔ Casco, Chaleco, Botas y Herramientas</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ color: '#64748b', fontWeight: 600 }}>Documentos:</div>
                    <div style={{ color: '#0284c7', fontWeight: 800 }}>SOAT: {insp.soat_vencimiento} • Tecno: {insp.tecnomecanica_vencimiento}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PESTAÑA 4: CENSO COMPLETO DE COLABORADORES */}
      {activeTab === 'censo' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#00205b' }}>
              Directorio General de Colaboradores ({filteredRecords.length})
            </h3>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Usa los filtros superiores para refinar la búsqueda
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', borderRadius: '8px 0 0 8px' }}>Colaborador</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Empresa / Cargo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Sector / Barrio</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Rol Principal</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Vehículo / Placa</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Riesgos Identificados</th>
                  <th style={{ padding: '0.75rem 1rem', borderRadius: '0 8px 8px 0', textAlign: 'center' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, idx) => (
                  <tr key={r.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{r.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CC: {r.cedula}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#00205b' }}>{r.empresa}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.cargo}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                      <div>{r.barrio || 'No especificado'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.ciudad}</div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        background: r.rol_principal?.includes('Conductor') ? '#fef3c7' : '#f1f5f9',
                        color: r.rol_principal?.includes('Conductor') ? '#92400e' : '#334155',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.74rem'
                      }}>
                        {r.rol_principal}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {r.placa ? (
                        <span style={{ background: '#fef08a', color: '#854d0e', padding: '0.2rem 0.45rem', borderRadius: '4px', fontWeight: 800, fontSize: '0.75rem' }}>
                          {r.placa}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Sin placa</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {Array.isArray(r.riesgos_identificados) && r.riesgos_identificados.length > 0 ? (
                        <span style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {r.riesgos_identificados.length} riesgo(s)
                        </span>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>Sin riesgos</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedRecord(r)}
                        style={{
                          background: '#00205b',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.35rem 0.7rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE PERFIL VIAL */}
      {selectedRecord && (
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
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedRecord(null)}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#00205b',
                color: '#fcd116',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 900
              }}>
                {selectedRecord.nombre ? selectedRecord.nombre[0].toUpperCase() : 'C'}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#00205b' }}>
                  {selectedRecord.nombre}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  Cédula: <strong>{selectedRecord.cedula}</strong> • {selectedRecord.empresa} ({selectedRecord.cargo})
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.2rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: '#64748b' }}>Ciudad y Barrio:</span>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedRecord.ciudad} - {selectedRecord.barrio || 'N/A'}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Tiempo de Trayecto:</span>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedRecord.tiempo_desplazamiento || 'N/A'}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Rol de Desplazamiento:</span>
                <div style={{ fontWeight: 700, color: '#00205b' }}>{selectedRecord.rol_principal}</div>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Tipo de Licencia:</span>
                <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedRecord.tipo_licencia || 'No aplica'}</div>
              </div>
            </div>

            {selectedRecord.placa && (
              <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px', marginBottom: '1.2rem', border: '1px solid #bfdbfe' }}>
                <h4 style={{ margin: '0 0 0.6rem 0', color: '#1e40af', fontSize: '0.9rem', fontWeight: 800 }}>
                  🚗 Datos del Vehículo Registrado
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Placa:</span>
                    <div style={{ fontWeight: 800, color: '#00205b' }}>{selectedRecord.placa}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>SOAT Vencimiento:</span>
                    <div style={{ fontWeight: 700, color: selectedRecord.estado_soat === 'Vigente' ? '#15803d' : '#b91c1c' }}>
                      {selectedRecord.soat_vencimiento || 'N/A'} ({selectedRecord.estado_soat})
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Tecnomecánica:</span>
                    <div style={{ fontWeight: 700, color: selectedRecord.estado_tecnomecanica === 'Vigente' ? '#15803d' : '#b91c1c' }}>
                      {selectedRecord.tecnomecanica_vencimiento || 'N/A'} ({selectedRecord.estado_tecnomecanica})
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.2rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#b91c1c' }}>
                ⚠️ Riesgos Viales Reportados en sus Desplazamientos
              </h4>
              {Array.isArray(selectedRecord.riesgos_identificados) && selectedRecord.riesgos_identificados.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {selectedRecord.riesgos_identificados.map((rg, idx) => (
                    <div key={idx} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.45rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                      • {rg}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.82rem', fontStyle: 'italic' }}>
                  No se reportaron factores de riesgo vial críticos.
                </div>
              )}
            </div>

            {Array.isArray(selectedRecord.epp_elementos) && selectedRecord.epp_elementos.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 800, color: '#00205b' }}>
                  🛡️ Elementos de Seguridad y EPP
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedRecord.epp_elementos.map((ep, idx) => (
                    <span key={idx} style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                      ✔ {ep}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL NUEVO REGISTRO */}
      {showNewModal && (
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
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowNewModal(false)}
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

            <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.3rem', fontWeight: 900, color: '#00205b' }}>
              ➕ Registrar Encuesta de Regreso Seguro
            </h2>
            <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.82rem', color: '#64748b' }}>
              Los datos se almacenarán directamente en Supabase Cloud.
            </p>

            <form onSubmit={handleCreateRecord} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={newFormData.nombre}
                    onChange={(e) => setNewFormData({ ...newFormData, nombre: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Cédula *</label>
                  <input
                    type="text"
                    required
                    value={newFormData.cedula}
                    onChange={(e) => setNewFormData({ ...newFormData, cedula: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Empresa</label>
                  <select
                    value={newFormData.empresa}
                    onChange={(e) => setNewFormData({ ...newFormData, empresa: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="C&R ASOCIADOS SAS">C&R ASOCIADOS SAS</option>
                    <option value="Easy Logistica">Easy Logistica</option>
                    <option value="Abi">Abi</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Cargo</label>
                  <input
                    type="text"
                    value={newFormData.cargo}
                    onChange={(e) => setNewFormData({ ...newFormData, cargo: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Rol de Movilidad</label>
                  <select
                    value={newFormData.rol_principal}
                    onChange={(e) => setNewFormData({ ...newFormData, rol_principal: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  >
                    <option value="Conductor motocicleta">Conductor Motocicleta</option>
                    <option value="Pasajero de motocicleta">Pasajero de Motocicleta</option>
                    <option value="Peatón">Peatón</option>
                    <option value="Pasajero Servicio Público Transporte">Transporte Público</option>
                    <option value="Conductor de vehiculo particular">Vehículo Particular</option>
                    <option value="Conductor bicicleta">Bicicleta</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Placa (si aplica)</label>
                  <input
                    type="text"
                    value={newFormData.placa}
                    onChange={(e) => setNewFormData({ ...newFormData, placa: e.target.value.toUpperCase() })}
                    placeholder="Ej: ABC12D"
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Vencimiento SOAT</label>
                  <input
                    type="date"
                    value={newFormData.soat_vencimiento}
                    onChange={(e) => setNewFormData({ ...newFormData, soat_vencimiento: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>Vencimiento Tecnomecánica</label>
                  <input
                    type="date"
                    value={newFormData.tecnomecanica_vencimiento}
                    onChange={(e) => setNewFormData({ ...newFormData, tecnomecanica_vencimiento: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: '#00205b',
                  color: '#ffffff',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '0.8rem',
                  boxShadow: '0 4px 12px rgba(0, 32, 91, 0.25)'
                }}
              >
                {submitting ? 'Guardando en Supabase...' : 'Guardar Colaborador en Supabase'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
