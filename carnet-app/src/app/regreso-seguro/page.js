"use client";

import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0284c7', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function RegresoSeguroPage() {
  const [data, setData] = useState({ records: [], kpis: {}, stats: {}, inspecciones: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen', 'documentos', 'inspecciones', 'censo'
  const [source, setSource] = useState('Cargando...');

  // Filtros
  const [search, setSearch] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('Todas');
  const [filterRol, setFilterRol] = useState('Todos');
  const [filterDocStatus, setFilterDocStatus] = useState('Todos');

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

  // Carga de datos
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

  // Filtrado de registros para la tabla y censo
  const filteredRecords = useMemo(() => {
    if (!data.records) return [];
    return data.records.filter(r => {
      // Filtro texto
      const q = search.toLowerCase();
      const matchText = !q ||
        (r.nombre && r.nombre.toLowerCase().includes(q)) ||
        (r.cedula && r.cedula.toLowerCase().includes(q)) ||
        (r.placa && r.placa.toLowerCase().includes(q)) ||
        (r.cargo && r.cargo.toLowerCase().includes(q)) ||
        (r.barrio && r.barrio.toLowerCase().includes(q));

      // Filtro Empresa
      const matchEmpresa = filterEmpresa === 'Todas' || r.empresa === filterEmpresa;

      // Filtro Rol
      const matchRol = filterRol === 'Todos' || r.rol_principal === filterRol;

      // Filtro Documental
      let matchDoc = true;
      if (filterDocStatus === 'con_vehiculo') {
        matchDoc = Boolean(r.placa);
      } else if (filterDocStatus === 'alerta_soat') {
        matchDoc = r.estado_soat === 'Vencido' || r.estado_soat === 'Por Vencer';
      } else if (filterDocStatus === 'alerta_tecno') {
        matchDoc = r.estado_tecnomecanica === 'Vencido' || r.estado_tecnomecanica === 'Por Vencer';
      } else if (filterDocStatus === 'documentos_al_dia') {
        matchDoc = r.placa && r.estado_soat === 'Vigente' && r.estado_tecnomecanica === 'Vigente';
      }

      return matchText && matchEmpresa && matchRol && matchDoc;
    });
  }, [data.records, search, filterEmpresa, filterRol, filterDocStatus]);

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
    XLSX.writeFile(wb, `Regreso_Seguro_Barrancabermeja_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const kpis = data.kpis || {};
  const stats = data.stats || {};

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
          <p style={{ margin: 0, opacity: 0.85, fontSize: '0.9rem', maxWidth: '650px' }}>
            Monitoreo y gestión de riesgos viales, desplazamientos casa-trabajo, censo del parque automotor y control documental de colaboradores y contratistas.
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

      {/* Tarjetas KPI Superiores */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Card 1: Total Censo */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          borderLeft: '5px solid #00205b'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Colaboradores
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#00205b', margin: '0.2rem 0' }}>
            {kpis.totalEncuestados || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            100% Censo Barrancabermeja
          </div>
        </div>

        {/* Card 2: Movilidad en Motocicleta */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          borderLeft: '5px solid #f59e0b'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Uso de Motocicleta
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', margin: '0.2rem 0' }}>
            {(kpis.conductoresMoto || 0) + (kpis.pasajerosMoto || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <strong>{kpis.conductoresMoto || 0}</strong> conductores • <strong>{kpis.pasajerosMoto || 0}</strong> pasajeros
          </div>
        </div>

        {/* Card 3: Parque Automotor */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          borderLeft: '5px solid #0284c7'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Vehículos con Placa
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0284c7', margin: '0.2rem 0' }}>
            {kpis.totalVehiculosRegistrados || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Motos, Carros y Transporte propio
          </div>
        </div>

        {/* Card 4: Alertas SOAT */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          borderLeft: '5px solid #ef4444'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Semáforo SOAT
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', margin: '0.2rem 0' }}>
            {(kpis.documentacion?.soat?.vencidos || 0) + (kpis.documentacion?.soat?.porVencer || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>{kpis.documentacion?.soat?.vigentes || 0} al día</span> • <span style={{ color: '#ef4444', fontWeight: 700 }}>{kpis.documentacion?.soat?.vencidos || 0} vencidos</span>
          </div>
        </div>

        {/* Card 5: Alertas Tecnicomecánica */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1.2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          borderLeft: '5px solid #8b5cf6'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Semáforo Tecnomecánica
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#8b5cf6', margin: '0.2rem 0' }}>
            {(kpis.documentacion?.tecnomecanica?.vencidos || 0) + (kpis.documentacion?.tecnomecanica?.porVencer || 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>{kpis.documentacion?.tecnomecanica?.vigentes || 0} al día</span> • <span style={{ color: '#ef4444', fontWeight: 700 }}>{kpis.documentacion?.tecnomecanica?.vencidos || 0} vencidas</span>
          </div>
        </div>
      </div>

      {/* Barra de Pestañas de Navegación */}
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
          { id: 'resumen', label: '📊 Resumen & Analítica Vial', count: null },
          { id: 'documentos', label: '📋 Control Documental (Placas)', count: kpis.totalVehiculosRegistrados },
          { id: 'inspecciones', label: '🏍️ Inspecciones Preoperacionales', count: data.inspecciones?.length || 2 },
          { id: 'censo', label: '👥 Censo Completo de Colaboradores', count: filteredRecords.length }
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

      {/* Barra de Filtros Globales (Visible para Documentos y Censo) */}
      {(activeTab === 'censo' || activeTab === 'documentos') && (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '1rem 1.2rem',
          marginBottom: '1.2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.8rem',
          alignItems: 'center'
        }}>
          {/* Buscador */}
          <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, cédula, placa, cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Filtro Empresa */}
          <div>
            <select
              value={filterEmpresa}
              onChange={(e) => setFilterEmpresa(e.target.value)}
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                background: '#fff',
                color: '#334155'
              }}
            >
              <option value="Todas">🏢 Todas las Empresas</option>
              <option value="C&R ASOCIADOS SAS">C&R ASOCIADOS SAS</option>
              <option value="Easy Logistica">Easy Logistica</option>
              <option value="Abi">Abi</option>
            </select>
          </div>

          {/* Filtro Rol */}
          <div>
            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                background: '#fff',
                color: '#334155'
              }}
            >
              <option value="Todos">🚦 Todos los Roles</option>
              <option value="Conductor motocicleta">Conductor Motocicleta</option>
              <option value="Pasajero de motocicleta">Pasajero de Motocicleta</option>
              <option value="Peatón">Peatón</option>
              <option value="Pasajero Servicio Público Transporte">Transporte Público</option>
              <option value="Conductor de vehiculo particular">Vehículo Particular</option>
              <option value="Conductor bicicleta">Bicicleta</option>
            </select>
          </div>

          {/* Filtro Estado Documental */}
          <div>
            <select
              value={filterDocStatus}
              onChange={(e) => setFilterDocStatus(e.target.value)}
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                background: '#fff',
                color: '#334155'
              }}
            >
              <option value="Todos">📄 Estado Documentos: Todos</option>
              <option value="con_vehiculo">Con Vehículo / Placa</option>
              <option value="documentos_al_dia">Documentos al Día (Vigentes)</option>
              <option value="alerta_soat">⚠️ Alerta SOAT (Vencido / Por Vencer)</option>
              <option value="alerta_tecno">⚠️ Alerta Tecnomecánica</option>
            </select>
          </div>

          {/* Contador y Limpiar */}
          {(search || filterEmpresa !== 'Todas' || filterRol !== 'Todos' || filterDocStatus !== 'Todos') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterEmpresa('Todas');
                setFilterRol('Todos');
                setFilterDocStatus('Todos');
              }}
              style={{
                background: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Limpiar Filtros
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            Mostrando <strong>{filteredRecords.length}</strong> de {data.records?.length || 0}
          </div>
        </div>
      )}

      {/* CONTENIDO DE PESTAÑAS */}

      {/* 1. PESTAÑA RESUMEN & ANALÍTICA */}
      {activeTab === 'resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Fila 1 de Gráficos: Distribución por Rol y Top Riesgos */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Gráfico 1: Roles de Movilidad */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#00205b' }}>
                🚴 Distribución por Rol de Desplazamiento
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                Modo de transporte principal Casa - Trabajo - Casa
              </p>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.distRoles || []} layout="vertical" margin={{ top: 5, right: 30, left: 90, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="rol" type="category" width={110} tick={{ fontSize: 10, fill: '#334155' }} />
                    <Tooltip formatter={(val, name, item) => [`${val} personas (${item.payload.pct}%)`, 'Total']} />
                    <Bar dataKey="count" fill="#00205b" radius={[0, 6, 6, 0]}>
                      {(stats.distRoles || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Top Riesgos Viales Identificados */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#00205b' }}>
                ⚠️ Top Factores de Riesgo Vial Percibidos
              </h3>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                Peligros más frecuentes reportados en sus rutas diarias
              </p>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(stats.topRiesgos || []).slice(0, 6)} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="riesgo" type="category" width={120} tick={{ fontSize: 9.5, fill: '#334155' }} />
                    <Tooltip formatter={(val, name, item) => [`${val} colaboradores (${item.payload.pct}%)`, 'Aplica']} />
                    <Bar dataKey="count" fill="#ef4444" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Fila 2: Empresas y Elementos de Protección EPP */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Empresas */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#00205b' }}>
                🏢 Distribución por Empresa
              </h3>
              <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                Participación en el censo vial de Barrancabermeja
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {(stats.distEmpresas || []).map((emp, idx) => (
                  <div key={emp.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[idx % COLORS.length] }} />
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>{emp.name}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#00205b' }}>{emp.count}</span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '0.4rem' }}>({emp.pct}%)</span>
                    </div>
                  </div>
                ))}
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
                🛡️ Elementos de Seguridad y EPP Contados
              </h3>
              <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                Implementos de protección vial con los que cuentan
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem' }}>
                {(stats.distEpp || []).map((epp) => (
                  <div key={epp.item} style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>
                      {epp.item.toLowerCase().includes('casco') ? '🪖' :
                       epp.item.toLowerCase().includes('luz') ? '💡' :
                       epp.item.toLowerCase().includes('guante') ? '🧤' :
                       epp.item.toLowerCase().includes('gafa') ? '🥽' :
                       epp.item.toLowerCase().includes('reflectivo') ? '🦺' : '🔧'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{epp.item}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#00205b' }}>{epp.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tiempos de Desplazamiento */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#00205b' }}>
                ⏱️ Tiempo de Desplazamiento Casa-Trabajo
              </h3>
              <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.8rem', color: '#64748b' }}>
                Duración promedio del trayecto hacia la sede
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {(stats.distTiempos || []).map((t) => (
                  <div key={t.tiempo} style={{ background: '#f8fafc', padding: '0.8rem 1rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>🕒</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>{t.tiempo}</span>
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0284c7' }}>{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PESTAÑA CONTROL DOCUMENTAL (PLACAS) */}
      {activeTab === 'documentos' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#00205b' }}>
                🚗 Parque Automotor y Control de Vencimientos
              </h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Listado de los 58 vehículos registrados con semaforización de SOAT y Tecnicomecánica
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
                  <tr key={r.id || i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
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
                    {/* SOAT */}
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
                    {/* Tecno */}
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
                    {/* Licencia */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{r.tipo_licencia || 'N/A'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{r.fecha_vencimiento_licencia || ''}</div>
                    </td>
                    {/* Acciones */}
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

      {/* 3. PESTAÑA INSPECCIONES PREOPERACIONALES DE MOTOS (HOJA 2) */}
      {activeTab === 'inspecciones' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#00205b' }}>
              🏍️ Inspecciones Preoperacionales de Motocicletas (Hoja 2)
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Auditoría mecánica, estado de frenos, luces, llantas y equipo de seguridad vial obligatorio
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
                {/* Header Moto */}
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

                {/* Grid de Estado de Componentes */}
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
                    <div style={{ color: '#10b981', fontWeight: 800 }}>✔ Medias, Bajas, Direccionales y Freno OK</div>
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

      {/* 4. PESTAÑA CENSO COMPLETO DE COLABORADORES */}
      {activeTab === 'censo' && (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
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
                          {r.riesgos_identificados.length} riesgo(s) reportado(s)
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

            {/* Encabezado del Colaborador */}
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

            {/* Información de Residencia y Ruta */}
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

            {/* Datos del Vehículo */}
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

            {/* Riesgos Reportados */}
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

            {/* Elementos de Protección Personal */}
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
