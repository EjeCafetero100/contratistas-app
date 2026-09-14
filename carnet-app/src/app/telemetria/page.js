"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// Paleta corporativa de Seguridad Vial y SST
const COLORS = ['#0284c7', '#f59e0b', '#dc2626', '#10b981', '#8b5cf6', '#ec4899', '#6366f1'];
const PIE_COLORS = {
  'Exceso de velocidad en carretera': '#f59e0b',
  'Exceso de velocidad en curva semiabierta': '#dc2626',
  'Cinturón desabrochado fuera del CD (> 5 seg)': '#8b5cf6',
  'Otros': '#0284c7'
};

export default function TelemetriaPage() {
  const [dataEventos, setDataEventos] = useState([]);
  const [dataGestion, setDataGestion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen', 'eventos', 'gestion', 'cruce'
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataSource, setDataSource] = useState('Servidor (telemetria.xlsx)');

  // Modal interactivo de detalle al oprimir un cuadro
  const [modalDetail, setModalDetail] = useState(null);

  // Filtros interactivos
  const [selectedMes, setSelectedMes] = useState('Todos');
  const [selectedSemana, setSelectedSemana] = useState('Todas');
  const [selectedTipo, setSelectedTipo] = useState('Todos');
  const [selectedMotivo, setSelectedMotivo] = useState('Todos');
  const [selectedPlaca, setSelectedPlaca] = useState('Todas');
  const [selectedConductor, setSelectedConductor] = useState('Todos');
  const [selectedReincidente, setSelectedReincidente] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const fileInputRef = useRef(null);

  // 1. Cargar datos iniciales desde el endpoint API
  const loadDefaultData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/telemetria');
      if (!res.ok) throw new Error(`Error en servidor: ${res.statusText}`);
      const json = await res.json();

      if (json.error) throw new Error(json.error);

      setDataEventos(json.eventos || []);
      setDataGestion(json.gestionConsecuencia || []);
      setLastUpdate(new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
      setDataSource('Servidor (telemetria.xlsx - CD Barrancabermeja)');
    } catch (err) {
      console.error('Error cargando telemetria:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefaultData();
  }, []);

  // 2. Procesar subida manual de Excel para actualización interactiva
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // Hoja eventos
        const wsEventos = wb.Sheets['eventos'] || wb.Sheets[wb.SheetNames[0]];
        const rawEventos = wsEventos ? XLSX.utils.sheet_to_json(wsEventos, { raw: false }) : [];

        const eventos = rawEventos.map((row, idx) => {
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
            mes: (row['MES'] || '').trim().toUpperCase(),
            semana: String(row['SEMANA'] || '').trim(),
            placa: (row['PLACA'] || '').trim().toUpperCase(),
            motivo: row['Motivo'] || 'Telemetria',
            tipoEvento,
            responsable: (row['RESPONSABLE'] || '').trim().toUpperCase(),
            total: Number(row['TOTAL'] || 1)
          };
        });

        // Hoja gestión
        const wsGestion = wb.Sheets['Gestión de consecuencia'] || wb.Sheets[wb.SheetNames[1]];
        const rawGestion = wsGestion ? XLSX.utils.sheet_to_json(wsGestion, { raw: false }) : [];

        const gestion = rawGestion.map((row, idx) => {
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

        setDataEventos(eventos);
        setDataGestion(gestion);
        setLastUpdate(new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
        setDataSource(`Archivo subido: ${file.name}`);
      } catch (err) {
        console.error('Error al procesar archivo:', err);
        setError('Error al leer el archivo Excel: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // 3. Opciones dinámicas para los selectores de filtro
  const optionsMes = useMemo(() => {
    const set = new Set(dataEventos.map(e => e.mes).filter(Boolean));
    return ['Todos', ...Array.from(set)];
  }, [dataEventos]);

  const optionsSemana = useMemo(() => {
    const set = new Set(dataEventos.map(e => e.semana).filter(Boolean));
    return ['Todas', ...Array.from(set).sort((a, b) => Number(a) - Number(b))];
  }, [dataEventos]);

  const optionsTipo = useMemo(() => {
    const set = new Set(dataEventos.map(e => e.tipoEvento).filter(Boolean));
    return ['Todos', ...Array.from(set)];
  }, [dataEventos]);

  const optionsMotivo = useMemo(() => {
    const set = new Set(dataEventos.map(e => e.motivo).filter(Boolean));
    return ['Todos', ...Array.from(set)];
  }, [dataEventos]);

  const optionsPlaca = useMemo(() => {
    const set = new Set(dataEventos.map(e => e.placa).filter(Boolean));
    return ['Todas', ...Array.from(set).sort()];
  }, [dataEventos]);

  const optionsConductor = useMemo(() => {
    const fromEventos = dataEventos.map(e => e.responsable);
    const fromGestion = dataGestion.map(g => g.conductor);
    const set = new Set([...fromEventos, ...fromGestion].filter(Boolean));
    return ['Todos', ...Array.from(set).sort()];
  }, [dataEventos, dataGestion]);

  // 4. Filtrado reactivo de datos
  const filteredEventos = useMemo(() => {
    return dataEventos.filter(e => {
      if (selectedMes !== 'Todos' && e.mes !== selectedMes) return false;
      if (selectedSemana !== 'Todas' && e.semana !== selectedSemana) return false;
      if (selectedTipo !== 'Todos' && e.tipoEvento !== selectedTipo) return false;
      if (selectedMotivo !== 'Todos' && e.motivo !== selectedMotivo) return false;
      if (selectedPlaca !== 'Todas' && e.placa !== selectedPlaca) return false;
      if (selectedConductor !== 'Todos' && e.responsable !== selectedConductor) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match = 
          e.placa.toLowerCase().includes(q) ||
          e.responsable.toLowerCase().includes(q) ||
          e.tipoEvento.toLowerCase().includes(q) ||
          e.motivo.toLowerCase().includes(q) ||
          e.fecha.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [dataEventos, selectedMes, selectedSemana, selectedTipo, selectedMotivo, selectedPlaca, selectedConductor, searchTerm]);

  const filteredGestion = useMemo(() => {
    return dataGestion.filter(g => {
      if (selectedConductor !== 'Todos' && !g.conductor.includes(selectedConductor) && !selectedConductor.includes(g.conductor)) return false;
      if (selectedReincidente !== 'Todos' && g.reincidente !== selectedReincidente) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match = 
          g.conductor.toLowerCase().includes(q) ||
          g.cedula.toLowerCase().includes(q) ||
          g.reporteCredit.toLowerCase().includes(q) ||
          g.medidas.some(m => m.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [dataGestion, selectedConductor, selectedReincidente, searchTerm]);

  // 5. KPIs calculados dinámicamente
  const kpis = useMemo(() => {
    const totalEventos = filteredEventos.reduce((sum, e) => sum + e.total, 0);
    const placasUnicas = new Set(filteredEventos.map(e => e.placa)).size;
    const conductoresEventos = new Set(filteredEventos.map(e => e.responsable)).size;
    const totalGestion = filteredGestion.length;
    const reincidentes = filteredGestion.filter(g => g.reincidente === 'SÍ').length;
    const bloqueosPermanentes = filteredGestion.filter(g => g.medidas.some(m => m.toLowerCase().includes('permanente'))).length;
    const bloqueosTemporales = filteredGestion.filter(g => g.medidas.some(m => m.toLowerCase().includes('bloqueo 1 día') || m.toLowerCase().includes('bloqueo por 1 dia'))).length;

    // Desglose por tipos de evento específicos
    const eventosCarretera = filteredEventos.filter(e => e.tipoEvento.includes('carretera')).reduce((s, e) => s + e.total, 0);
    const eventosCurva = filteredEventos.filter(e => e.tipoEvento.includes('curva')).reduce((s, e) => s + e.total, 0);
    const eventosCinturon = filteredEventos.filter(e => e.tipoEvento.includes('cinturón') || e.tipoEvento.includes('cinturon')).reduce((s, e) => s + e.total, 0);

    return {
      totalEventos,
      placasUnicas,
      conductoresEventos,
      totalGestion,
      reincidentes,
      bloqueosPermanentes,
      bloqueosTemporales,
      eventosCarretera,
      eventosCurva,
      eventosCinturon
    };
  }, [filteredEventos, filteredGestion]);

  // 6. Datos para Gráficos
  const dataPorMes = useMemo(() => {
    const orderMeses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const agrupado = {};
    filteredEventos.forEach(e => {
      const mes = e.mes || 'OTRO';
      agrupado[mes] = (agrupado[mes] || 0) + e.total;
    });

    return Object.entries(agrupado)
      .sort(([a], [b]) => orderMeses.indexOf(a) - orderMeses.indexOf(b))
      .map(([mes, cantidad]) => ({ mes, cantidad }));
  }, [filteredEventos]);

  const dataPorTipo = useMemo(() => {
    const map = {};
    filteredEventos.forEach(e => {
      map[e.tipoEvento] = (map[e.tipoEvento] || 0) + e.total;
    });
    const total = filteredEventos.reduce((s, e) => s + e.total, 0) || 1;
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      porcentaje: ((value / total) * 100).toFixed(1)
    }));
  }, [filteredEventos]);

  const dataRankingConductores = useMemo(() => {
    const map = {};
    filteredEventos.forEach(e => {
      map[e.responsable] = (map[e.responsable] || 0) + e.total;
    });
    return Object.entries(map)
      .map(([conductor, eventos]) => ({ conductor, eventos }))
      .sort((a, b) => b.eventos - a.eventos);
  }, [filteredEventos]);

  const dataPorVehiculo = useMemo(() => {
    const map = {};
    filteredEventos.forEach(e => {
      map[e.placa] = (map[e.placa] || 0) + e.total;
    });
    return Object.entries(map)
      .map(([placa, eventos]) => ({ placa, eventos }))
      .sort((a, b) => b.eventos - a.eventos);
  }, [filteredEventos]);

  const dataMedidas = useMemo(() => {
    const map = {
      'Compromiso de vida': 0,
      'Bloqueo 1 día + Manejo': 0,
      'Bloqueo permanente': 0,
      'Otras medidas': 0
    };
    filteredGestion.forEach(g => {
      g.medidas.forEach(m => {
        const mLow = m.toLowerCase();
        if (mLow.includes('compromiso')) map['Compromiso de vida']++;
        else if (mLow.includes('bloqueo 1 día') || mLow.includes('bloqueo por 1 dia')) map['Bloqueo 1 día + Manejo']++;
        else if (mLow.includes('permanente')) map['Bloqueo permanente']++;
        else map['Otras medidas']++;
      });
    });
    return Object.entries(map).map(([medida, cantidad]) => ({ medida, cantidad }));
  }, [filteredGestion]);

  const dataReincidencia = useMemo(() => {
    let reincidentes = 0;
    let noReincidentes = 0;
    filteredGestion.forEach(g => {
      if (g.reincidente === 'SÍ') reincidentes++;
      else noReincidentes++;
    });
    return [
      { name: 'No Reincidentes', value: noReincidentes, color: '#10b981' },
      { name: 'Reincidentes', value: reincidentes, color: '#dc2626' }
    ];
  }, [filteredGestion]);

  // Limpieza de filtros
  const handleClearFilters = () => {
    setSelectedMes('Todos');
    setSelectedSemana('Todas');
    setSelectedTipo('Todos');
    setSelectedMotivo('Todos');
    setSelectedPlaca('Todas');
    setSelectedConductor('Todos');
    setSelectedReincidente('Todos');
    setSearchTerm('');
  };

  // 7. Manejo interactivo de clics en los cuadros (Drill-Down / Modal Específico)
  const openCardDetail = (type) => {
    switch (type) {
      case 'total_eventos':
        setModalDetail({
          title: '🚨 Total de Eventos Registrados',
          subtitle: `Mostrando los ${filteredEventos.length} eventos de telemetría y dashcam en ruta`,
          badge: `${filteredEventos.length} eventos`,
          color: '#0284c7',
          type: 'eventos',
          items: filteredEventos,
          filterKey: null
        });
        break;

      case 'tipo_carretera':
        const carreteraEvs = filteredEventos.filter(e => e.tipoEvento.includes('carretera'));
        setModalDetail({
          title: '⚡ Infracción: Exceso de Velocidad en Carretera',
          subtitle: `Mostrando ${carreteraEvs.length} eventos con conductores, vehículos y fechas de ocurrencia`,
          badge: `${carreteraEvs.length} casos`,
          color: '#f59e0b',
          type: 'eventos',
          items: carreteraEvs,
          filterKey: { type: 'tipo', value: 'Exceso de velocidad en carretera' }
        });
        break;

      case 'tipo_curva':
        const curvaEvs = filteredEventos.filter(e => e.tipoEvento.includes('curva'));
        setModalDetail({
          title: '🔄 Infracción: Exceso de Velocidad en Curva Semiabierta',
          subtitle: `Mostrando ${curvaEvs.length} eventos críticos de velocidad en curva (SIF potencial)`,
          badge: `${curvaEvs.length} casos`,
          color: '#dc2626',
          type: 'eventos',
          items: curvaEvs,
          filterKey: { type: 'tipo', value: 'Exceso de velocidad en curva semiabierta' }
        });
        break;

      case 'tipo_cinturon':
        const cinturonEvs = filteredEventos.filter(e => e.tipoEvento.includes('cinturón') || e.tipoEvento.includes('cinturon'));
        setModalDetail({
          title: '🦺 Infracción: Cinturón Desabrochado Fuera del CD (> 5 seg)',
          subtitle: `Mostrando ${cinturonEvs.length} evento detectado mediante cámara Dashcam con conductor y placa`,
          badge: `${cinturonEvs.length} caso`,
          color: '#8b5cf6',
          type: 'eventos',
          items: cinturonEvs,
          filterKey: { type: 'tipo', value: 'Cinturón desabrochado fuera del CD (> 5 seg)' }
        });
        break;

      case 'vehiculos':
        const vehiculosGroup = [];
        const vehMap = {};
        filteredEventos.forEach(e => {
          if (!vehMap[e.placa]) {
            vehMap[e.placa] = { placa: e.placa, eventos: 0, tipos: new Set(), conductores: new Set(), fechas: [] };
            vehiculosGroup.push(vehMap[e.placa]);
          }
          vehMap[e.placa].eventos += e.total;
          vehMap[e.placa].tipos.add(e.tipoEvento);
          vehMap[e.placa].conductores.add(e.responsable);
          vehMap[e.placa].fechas.push(e.fecha);
        });
        setModalDetail({
          title: '🚚 Vehículos Afectados por Infracciones',
          subtitle: `Detalle de las ${vehiculosGroup.length} placas vehiculares con eventos de telemetría`,
          badge: `${vehiculosGroup.length} vehículos`,
          color: '#f59e0b',
          type: 'vehiculos',
          items: vehiculosGroup.sort((a, b) => b.eventos - a.eventos)
        });
        break;

      case 'conductores':
        const condGroup = [];
        const condMap = {};
        filteredEventos.forEach(e => {
          if (!condMap[e.responsable]) {
            condMap[e.responsable] = { conductor: e.responsable, eventos: 0, placas: new Set(), tipos: new Set(), fechas: [] };
            condGroup.push(condMap[e.responsable]);
          }
          condMap[e.responsable].eventos += e.total;
          condMap[e.responsable].placas.add(e.placa);
          condMap[e.responsable].tipos.add(e.tipoEvento);
          condMap[e.responsable].fechas.push(e.fecha);
        });
        setModalDetail({
          title: '👤 Conductores Involucrados en Eventos',
          subtitle: `Desglose de los ${condGroup.length} conductores con faltas registradas en ruta`,
          badge: `${condGroup.length} conductores`,
          color: '#10b981',
          type: 'conductores',
          items: condGroup.sort((a, b) => b.eventos - a.eventos)
        });
        break;

      case 'gestiones':
        setModalDetail({
          title: '📋 Casos de Gestión de Consecuencia (Credit)',
          subtitle: `Detalle de las ${filteredGestion.length} actas y reportes disciplinarios de Bavaria`,
          badge: `${filteredGestion.length} reportes`,
          color: '#6366f1',
          type: 'gestion',
          items: filteredGestion
        });
        break;

      case 'reincidentes':
        const reinc = filteredGestion.filter(g => g.reincidente === 'SÍ');
        setModalDetail({
          title: '⚠️ Conductores Reincidentes (Crítico)',
          subtitle: `Conductores que acumulan más de una falta en la plataforma Credit`,
          badge: `${reinc.length} caso crítico`,
          color: '#dc2626',
          type: 'gestion',
          items: reinc,
          filterKey: { type: 'reincidente', value: 'SÍ' }
        });
        break;

      case 'bloqueo_permanente':
        const bloqPerm = filteredGestion.filter(g => g.medidas.some(m => m.toLowerCase().includes('permanente')));
        setModalDetail({
          title: '🚫 Sanción: Bloqueo Permanente a Nivel Nacional',
          subtitle: `Conductor retirado de la operación por reincidencia o falta grave`,
          badge: `${bloqPerm.length} sanción máxima`,
          color: '#991b1b',
          type: 'gestion',
          items: bloqPerm
        });
        break;

      default:
        break;
    }
  };

  // Aplicar filtro directo desde el modal
  const applyFilterFromModal = (filterKey) => {
    if (!filterKey) return;
    if (filterKey.type === 'tipo') setSelectedTipo(filterKey.value);
    if (filterKey.type === 'reincidente') setSelectedReincidente(filterKey.value);
    if (filterKey.type === 'conductor') setSelectedConductor(filterKey.value);
    if (filterKey.type === 'placa') setSelectedPlaca(filterKey.value);
    setModalDetail(null);
  };

  // Exportar a CSV
  const exportToCSV = (tipo, customRows = null) => {
    const rows = customRows || (tipo === 'eventos' ? filteredEventos : filteredGestion);
    if (!rows || !rows.length) return;

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tipo);
    XLSX.writeFile(wb, `telemetria_barrancabermeja_${tipo}.xlsx`);
  };

  return (
    <div style={{ padding: '2rem 1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* 1. ENCABEZADO PRINCIPAL */}
      <header style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '2rem 2.5rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0, 32, 91, 0.06)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div style={{ flex: '1 1 500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
            <span style={{
              backgroundColor: '#00205b',
              color: '#fcd116',
              padding: '0.35rem 0.9rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: '900',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <span>📍</span> CD Barrancabermeja
            </span>
            <span style={{
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: '800'
            }}>
              Seguridad Vial & SST
            </span>
          </div>

          <h1 style={{
            fontSize: '2.3rem',
            fontWeight: '900',
            color: '#00205b',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <span>📡</span> DASHBOARD DE TELEMETRÍA Y SEGURIDAD VIAL
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0, lineHeight: '1.4' }}>
            Análisis interactivo de eventos, hábitos de conducción y gestión de consecuencias disciplinarias
          </p>
          
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', fontSize: '0.86rem', color: '#64748b', flexWrap: 'wrap' }}>
            <span>🕒 <strong>Última actualización:</strong> {lastUpdate || 'Cargando...'}</span>
            <span>📁 <strong>Fuente de datos:</strong> {dataSource}</span>
            <span>📊 <strong>Registros analizados:</strong> {dataEventos.length} eventos / {dataGestion.length} gestiones</span>
          </div>
        </div>

        {/* Acciones de Cabecera */}
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls"
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '0.7rem 1.15rem',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            title="Cargar un nuevo archivo telemetria.xlsx desde tu equipo"
          >
            <span>📁</span> Reemplazar / Subir Excel
          </button>

          <a
            href="/Barrancabermeja/telemetria.xlsx"
            download="telemetria.xlsx"
            style={{
              backgroundColor: '#00205b',
              color: '#ffffff',
              padding: '0.7rem 1.15rem',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.88rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(0, 32, 91, 0.25)'
            }}
          >
            <span>📥</span> Descargar telemetria.xlsx
          </a>

          <button
            onClick={loadDefaultData}
            style={{
              backgroundColor: '#f1f5f9',
              border: 'none',
              color: '#0f172a',
              padding: '0.7rem 1rem',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
            title="Recargar datos originales del servidor"
          >
            ↺ Recargar
          </button>
        </div>
      </header>

      {/* 2. FILTROS INTERACTIVOS */}
      <section style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '18px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🎛️</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#00205b', fontWeight: '800' }}>
              Filtros Dinámicos de Análisis
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              Los gráficos e indicadores se recalculan automáticamente
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleClearFilters}
              style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>🧹</span> Limpiar Filtros
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Búsqueda Global */}
          <div style={{ gridColumn: 'span 2', minWidth: '280px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              🔍 Búsqueda Rápida
            </label>
            <input
              type="text"
              placeholder="Buscar por placa, conductor, infracción, cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
                backgroundColor: '#f8fafc'
              }}
            />
          </div>

          {/* Filtro Mes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              📅 Mes
            </label>
            <select
              value={selectedMes}
              onChange={(e) => setSelectedMes(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                backgroundColor: '#ffffff'
              }}
            >
              {optionsMes.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Filtro Semana */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              🗓️ Semana
            </label>
            <select
              value={selectedSemana}
              onChange={(e) => setSelectedSemana(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                backgroundColor: '#ffffff'
              }}
            >
              {optionsSemana.map(s => (
                <option key={s} value={s}>{s === 'Todas' ? 'Todas' : `Semana ${s}`}</option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo de Evento */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              ⚠️ Tipo de Infracción
            </label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                backgroundColor: '#ffffff'
              }}
            >
              {optionsTipo.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Filtro Vehículo / Placa */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              🚚 Placa Vehicular
            </label>
            <select
              value={selectedPlaca}
              onChange={(e) => setSelectedPlaca(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                backgroundColor: '#ffffff'
              }}
            >
              {optionsPlaca.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Filtro Conductor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              👤 Conductor / Responsable
            </label>
            <select
              value={selectedConductor}
              onChange={(e) => setSelectedConductor(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                backgroundColor: '#ffffff'
              }}
            >
              {optionsConductor.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Filtro Reincidencia */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
              ⚖️ Reincidencia en Credit
            </label>
            <select
              value={selectedReincidente}
              onChange={(e) => setSelectedReincidente(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Todos">Todos</option>
              <option value="SÍ">SÍ (Reincidentes)</option>
              <option value="NO">NO (Primer Reporte)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. BLOQUE DESTACADO: TIPOS DE EVENTOS ESPECÍFICOS (¡INTERACTIVOS!) */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#00205b', fontWeight: '800' }}>
              Tipos Específicos de Infracción (Haz clic en cualquiera para ver el detalle)
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: '800' }}>
            👆 Oprime un recuadro para ver conductores, placas y fechas
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Card Tipo 1: Exceso en Carretera */}
          <div
            onClick={() => openCardDetail('tipo_carretera')}
            style={{
              backgroundColor: selectedTipo === 'Exceso de velocidad en carretera' ? '#fefce8' : '#ffffff',
              border: selectedTipo === 'Exceso de velocidad en carretera' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
              boxShadow: '0 6px 18px rgba(245, 158, 11, 0.12)',
              cursor: 'pointer',
              borderLeft: '6px solid #f59e0b',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  backgroundColor: '#fffbeb',
                  color: '#b45309',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: '900',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  62.5% del total
                </span>
                <h4 style={{ margin: '0.6rem 0 0.2rem 0', fontSize: '1.15rem', color: '#78350f', fontWeight: '900' }}>
                  Exceso en Carretera
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400e' }}>
                  Velocidad superior al límite de vía nacional
                </p>
              </div>
              <div style={{ fontSize: '2rem' }}>⚡</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.2rem' }}>
              <div>
                <span style={{ fontSize: '2.4rem', fontWeight: '900', color: '#b45309', lineHeight: 1 }}>
                  {kpis.eventosCarretera}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#78350f', fontWeight: '700', marginLeft: '0.4rem' }}>
                  eventos
                </span>
              </div>
              <span style={{
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
              }}>
                Ver Detalle ➔
              </span>
            </div>
          </div>

          {/* Card Tipo 2: Exceso en Curva Semiabierta */}
          <div
            onClick={() => openCardDetail('tipo_curva')}
            style={{
              backgroundColor: selectedTipo === 'Exceso de velocidad en curva semiabierta' ? '#fef2f2' : '#ffffff',
              border: selectedTipo === 'Exceso de velocidad en curva semiabierta' ? '2px solid #dc2626' : '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
              boxShadow: '0 6px 18px rgba(220, 38, 38, 0.12)',
              cursor: 'pointer',
              borderLeft: '6px solid #dc2626',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: '900',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  25.0% (Crítico / SIF)
                </span>
                <h4 style={{ margin: '0.6rem 0 0.2rem 0', fontSize: '1.15rem', color: '#7f1d1d', fontWeight: '900' }}>
                  Exceso en Curva Semiabierta
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#991b1b' }}>
                  Riesgo alto de volcamiento vehicular
                </p>
              </div>
              <div style={{ fontSize: '2rem' }}>🔄</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.2rem' }}>
              <div>
                <span style={{ fontSize: '2.4rem', fontWeight: '900', color: '#dc2626', lineHeight: 1 }}>
                  {kpis.eventosCurva}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: '700', marginLeft: '0.4rem' }}>
                  eventos
                </span>
              </div>
              <span style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
              }}>
                Ver Detalle ➔
              </span>
            </div>
          </div>

          {/* Card Tipo 3: Cinturón Desabrochado */}
          <div
            onClick={() => openCardDetail('tipo_cinturon')}
            style={{
              backgroundColor: selectedTipo === 'Cinturón desabrochado fuera del CD (> 5 seg)' ? '#f5f3ff' : '#ffffff',
              border: selectedTipo === 'Cinturón desabrochado fuera del CD (> 5 seg)' ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
              boxShadow: '0 6px 18px rgba(139, 92, 246, 0.12)',
              cursor: 'pointer',
              borderLeft: '6px solid #8b5cf6',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  backgroundColor: '#ede9fe',
                  color: '#6d28d9',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: '900',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  12.5% (Detectado Dashcam)
                </span>
                <h4 style={{ margin: '0.6rem 0 0.2rem 0', fontSize: '1.15rem', color: '#4c1d95', fontWeight: '900' }}>
                  Cinturón Desabrochado
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#5b21b6' }}>
                  Cinturón desabrochado fuera del CD &gt; 5 seg
                </p>
              </div>
              <div style={{ fontSize: '2rem' }}>🦺</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1.2rem' }}>
              <div>
                <span style={{ fontSize: '2.4rem', fontWeight: '900', color: '#7c3aed', lineHeight: 1 }}>
                  {kpis.eventosCinturon}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#5b21b6', fontWeight: '700', marginLeft: '0.4rem' }}>
                  evento
                </span>
              </div>
              <span style={{
                backgroundColor: '#7c3aed',
                color: '#ffffff',
                padding: '0.35rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)'
              }}>
                Ver Detalle ➔
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INDICADORES CLAVE (KPIS GENERALES INTERACTIVOS) */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* KPI 1: Total Eventos */}
        <div 
          onClick={() => openCardDetail('total_eventos')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.4rem 1.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            borderLeft: '5px solid #0284c7',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Total Eventos</span>
            <span style={{ fontSize: '1.3rem' }}>🚨</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#00205b', margin: '0.35rem 0 0.2rem' }}>
            {kpis.totalEventos}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: '600' }}>
              100% de los registrados
            </span>
            <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: '800' }}>👆 Clic detalle</span>
          </div>
        </div>

        {/* KPI 2: Vehículos Afectados */}
        <div 
          onClick={() => openCardDetail('vehiculos')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.4rem 1.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            borderLeft: '5px solid #f59e0b',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Vehículos Afectados</span>
            <span style={{ fontSize: '1.3rem' }}>🚚</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#00205b', margin: '0.35rem 0 0.2rem' }}>
            {kpis.placasUnicas}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: '600' }}>
              Placas con infracción
            </span>
            <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: '800' }}>👆 Clic detalle</span>
          </div>
        </div>

        {/* KPI 3: Conductores Telemetría */}
        <div 
          onClick={() => openCardDetail('conductores')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.4rem 1.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            borderLeft: '5px solid #10b981',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Conductores Telemetría</span>
            <span style={{ fontSize: '1.3rem' }}>👤</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#00205b', margin: '0.35rem 0 0.2rem' }}>
            {kpis.conductoresEventos}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#047857', fontWeight: '600' }}>
              Involucrados en eventos
            </span>
            <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: '800' }}>👆 Clic detalle</span>
          </div>
        </div>

        {/* KPI 4: Gestiones Credit */}
        <div 
          onClick={() => openCardDetail('gestiones')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.4rem 1.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            borderLeft: '5px solid #6366f1',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Gestiones Credit</span>
            <span style={{ fontSize: '1.3rem' }}>📋</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#00205b', margin: '0.35rem 0 0.2rem' }}>
            {kpis.totalGestion}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#4338ca', fontWeight: '600' }}>
              Reportes procesados
            </span>
            <span style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: '800' }}>👆 Clic detalle</span>
          </div>
        </div>

        {/* KPI 5: Reincidentes */}
        <div 
          onClick={() => openCardDetail('reincidentes')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.4rem 1.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            borderLeft: '5px solid #dc2626',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Reincidentes</span>
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#dc2626', margin: '0.35rem 0 0.2rem' }}>
            {kpis.reincidentes}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: '600' }}>
              Reincidencia crítica
            </span>
            <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: '800' }}>👆 Clic detalle</span>
          </div>
        </div>

        {/* KPI 6: Bloqueo Permanente */}
        <div 
          onClick={() => openCardDetail('bloqueo_permanente')}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.4rem 1.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            borderLeft: '5px solid #991b1b',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase' }}>
            <span>Bloqueo Permanente</span>
            <span style={{ fontSize: '1.3rem' }}>🚫</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#991b1b', margin: '0.35rem 0 0.2rem' }}>
            {kpis.bloqueosPermanentes}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: '600' }}>
              Sanción nacional máxima
            </span>
            <span style={{ fontSize: '0.72rem', color: '#991b1b', fontWeight: '800' }}>👆 Clic detalle</span>
          </div>
        </div>
      </section>

      {/* 5. MODAL INTERACTIVO DE DETALLE (DRILL-DOWN) */}
      {modalDetail && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 32, 91, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setModalDetail(null)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: `2px solid ${modalDetail.color || '#00205b'}`,
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderTopLeftRadius: '18px',
              borderTopRightRadius: '18px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#00205b', fontWeight: '900' }}>
                    {modalDetail.title}
                  </h3>
                  <span style={{
                    backgroundColor: modalDetail.color || '#00205b',
                    color: '#ffffff',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: '800'
                  }}>
                    {modalDetail.badge}
                  </span>
                </div>
                <p style={{ margin: '0.35rem 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  {modalDetail.subtitle}
                </p>
              </div>

              <button
                onClick={() => setModalDetail(null)}
                style={{
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  color: '#475569',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  fontSize: '1.2rem',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s ease'
                }}
                title="Cerrar ventana"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div style={{ padding: '1.5rem 2rem', flex: 1, overflowY: 'auto' }}>
              
              {/* VISTA 1: Lista de Eventos Específicos */}
              {modalDetail.type === 'eventos' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', color: '#334155' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>#</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Conductor</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Placa</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Infracción Detectada</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Motivo</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalDetail.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#00205b' }}>{item.fecha}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '800', color: '#1e293b' }}>{item.responsable}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '800' }}>
                              {item.placa}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              backgroundColor: item.tipoEvento.includes('curva') ? '#fee2e2' : item.tipoEvento.includes('cinturón') ? '#ede9fe' : '#fef3c7',
                              color: item.tipoEvento.includes('curva') ? '#dc2626' : item.tipoEvento.includes('cinturón') ? '#7c3aed' : '#d97706',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '6px',
                              fontWeight: '800',
                              fontSize: '0.78rem'
                            }}>
                              {item.tipoEvento}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#64748b' }}>{item.motivo}</td>
                          <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '800', color: '#00205b' }}>{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VISTA 2: Desglose por Vehículos */}
              {modalDetail.type === 'vehiculos' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {modalDetail.items.map((veh, idx) => (
                    <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', backgroundColor: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#00205b' }}>🚚 {veh.placa}</span>
                        <span style={{ backgroundColor: '#00205b', color: '#fcd116', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '900', fontSize: '0.8rem' }}>
                          {veh.eventos} {veh.eventos === 1 ? 'evento' : 'eventos'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.4rem' }}>
                        <strong>Conductores:</strong> {Array.from(veh.conductores).join(', ')}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                        <strong>Infracciones:</strong>
                        <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {Array.from(veh.tipos).map((t, tIdx) => (
                            <span key={tIdx} style={{ color: '#b45309', fontWeight: '600' }}>• {t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* VISTA 3: Desglose por Conductores */}
              {modalDetail.type === 'conductores' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {modalDetail.items.map((cond, idx) => (
                    <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem', backgroundColor: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#00205b' }}>👤 {cond.conductor}</span>
                        <span style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '900', fontSize: '0.8rem' }}>
                          {cond.eventos} {cond.eventos === 1 ? 'evento' : 'eventos'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.4rem' }}>
                        <strong>Vehículos:</strong> {Array.from(cond.placas).join(', ')}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                        <strong>Infracciones:</strong>
                        <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {Array.from(cond.tipos).map((t, tIdx) => (
                            <span key={tIdx} style={{ color: '#0369a1', fontWeight: '600' }}>• {t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* VISTA 4: Gestión de Consecuencias (Credit) */}
              {modalDetail.type === 'gestion' && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', color: '#334155' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>#</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Conductor</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Cédula</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Reporte Credit</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Reincidente</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Sanción Aplicada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalDetail.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: item.reincidente === 'SÍ' ? '#fff5f5' : '#ffffff' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '800', color: '#00205b' }}>{item.conductor}</td>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{item.cedula}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#0369a1', fontWeight: '700' }}>#{item.reporteCredit}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>{item.fechaReporte}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              backgroundColor: item.reincidente === 'SÍ' ? '#fee2e2' : '#dcfce7',
                              color: item.reincidente === 'SÍ' ? '#dc2626' : '#166534',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '9999px',
                              fontWeight: '900',
                              fontSize: '0.75rem'
                            }}>
                              {item.reincidente === 'SÍ' ? '⚠️ SÍ (Crítico)' : 'NO'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{
                              backgroundColor: item.medidas.some(m => m.includes('permanente')) ? '#450a0a' : '#f0fdf4',
                              color: item.medidas.some(m => m.includes('permanente')) ? '#ffffff' : '#15803d',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              fontWeight: '800',
                              fontSize: '0.78rem'
                            }}>
                              {item.medidas.join('; ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>

            {/* Footer del Modal con Acciones */}
            <div style={{
              padding: '1.25rem 2rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderBottomLeftRadius: '18px',
              borderBottomRightRadius: '18px',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                {modalDetail.filterKey && (
                  <button
                    onClick={() => applyFilterFromModal(modalDetail.filterKey)}
                    style={{
                      backgroundColor: '#00205b',
                      color: '#fcd116',
                      border: 'none',
                      padding: '0.6rem 1.1rem',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <span>🎯</span> Filtrar Dashboard con este grupo
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => exportToCSV(modalDetail.type, modalDetail.items)}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.6rem 1.1rem',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>📊</span> Exportar estos datos
                </button>

                <button
                  onClick={() => setModalDetail(null)}
                  style={{
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    padding: '0.6rem 1.1rem',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 6. PESTAÑAS DE NAVEGACIÓN */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}>
        <button
          onClick={() => setActiveTab('resumen')}
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            borderBottom: activeTab === 'resumen' ? '3px solid #00205b' : '3px solid transparent',
            backgroundColor: activeTab === 'resumen' ? '#ffffff' : 'transparent',
            color: activeTab === 'resumen' ? '#00205b' : '#64748b',
            fontWeight: '800',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>📊</span> Gráficos y Análisis General
        </button>

        <button
          onClick={() => setActiveTab('eventos')}
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            borderBottom: activeTab === 'eventos' ? '3px solid #00205b' : '3px solid transparent',
            backgroundColor: activeTab === 'eventos' ? '#ffffff' : 'transparent',
            color: activeTab === 'eventos' ? '#00205b' : '#64748b',
            fontWeight: '800',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>🚨</span> Tabla de Eventos ({filteredEventos.length})
        </button>

        <button
          onClick={() => setActiveTab('gestion')}
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            borderBottom: activeTab === 'gestion' ? '3px solid #00205b' : '3px solid transparent',
            backgroundColor: activeTab === 'gestion' ? '#ffffff' : 'transparent',
            color: activeTab === 'gestion' ? '#00205b' : '#64748b',
            fontWeight: '800',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>⚖️</span> Gestión de Consecuencias ({filteredGestion.length})
        </button>

        <button
          onClick={() => setActiveTab('cruce')}
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            borderBottom: activeTab === 'cruce' ? '3px solid #00205b' : '3px solid transparent',
            backgroundColor: activeTab === 'cruce' ? '#ffffff' : 'transparent',
            color: activeTab === 'cruce' ? '#00205b' : '#64748b',
            fontWeight: '800',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>🔄</span> Matriz Cruce Conductores
        </button>
      </div>

      {/* 7. CONTENIDO DE LAS PESTAÑAS */}

      {/* PESTAÑA 1: RESUMEN GRÁFICO */}
      {activeTab === 'resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Fila 1 de Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
            
            {/* Gráfico 1: Evolución Temporal */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#00205b', fontWeight: '800' }}>
                    📈 Evolución de Eventos por Mes
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                    Comportamiento mensual de infracciones registradas
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '700' }}>
                  Tendencia 2026
                </span>
              </div>

              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dataPorMes}>
                    <defs>
                      <linearGradient id="colorEventos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00205b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00205b" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#00205b', borderRadius: '8px', color: '#ffffff', border: 'none' }}
                      itemStyle={{ color: '#fcd116' }}
                      formatter={(val) => [`${val} eventos`, 'Cantidad']}
                    />
                    <Area type="monotone" dataKey="cantidad" stroke="#00205b" strokeWidth={3} fillOpacity={1} fill="url(#colorEventos)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Distribución por Tipo de Evento */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#00205b', fontWeight: '800' }}>
                    🍩 Distribución por Tipo de Infracción
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                    Porcentaje de participación sobre el total de eventos
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {dataPorTipo.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataPorTipo}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={105}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {dataPorTipo.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#00205b', borderRadius: '8px', color: '#ffffff', border: 'none' }}
                        formatter={(val, name, props) => [`${val} eventos (${props.payload.porcentaje}%)`, name]}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ color: '#94a3b8' }}>Sin datos disponibles para los filtros seleccionados</div>
                )}
              </div>
            </div>
          </div>

          {/* Fila 2 de Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
            
            {/* Gráfico 3: Ranking de Conductores */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#00205b', fontWeight: '800' }}>
                    🏆 Ranking de Conductores con Eventos
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                    Número total de infracciones acumuladas por conductor
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataRankingConductores}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="conductor" type="category" width={110} tick={{ fill: '#1e293b', fontSize: 10, fontWeight: '600' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#00205b', borderRadius: '8px', color: '#ffffff', border: 'none' }}
                      formatter={(val) => [`${val} eventos`, 'Infracciones']}
                    />
                    <Bar dataKey="eventos" fill="#0284c7" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 4: Eventos por Placa */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#00205b', fontWeight: '800' }}>
                    🚚 Eventos por Vehículo (Placa)
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                    Identificación de vehículos con mayor recurrencia
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataPorVehiculo} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="placa" tick={{ fill: '#1e293b', fontSize: 11, fontWeight: '700' }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#00205b', borderRadius: '8px', color: '#ffffff', border: 'none' }}
                      formatter={(val) => [`${val} eventos`, 'Vehículo']}
                    />
                    <Bar dataKey="eventos" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Fila 3: Análisis de Consecuencias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
            
            {/* Gráfico 5: Medidas Disciplinarias */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#00205b', fontWeight: '800' }}>
                    ⚖️ Medidas Disciplinarias Aplicadas (Credit)
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                    Tipos de sanciones ejecutadas según política de consecuencias
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataMedidas} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="medida" tick={{ fill: '#1e293b', fontSize: 10, fontWeight: '600' }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#00205b', borderRadius: '8px', color: '#ffffff', border: 'none' }}
                      formatter={(val) => [`${val} aplicaciones`, 'Medida']}
                    />
                    <Bar dataKey="cantidad" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 6: Proporción de Reincidencia */}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              padding: '1.75rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#00205b', fontWeight: '800' }}>
                    🔄 Proporción de Reincidencia en Conductores
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                    Conductores primerizos vs infractores reincidentes
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataReincidencia}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dataReincidencia.map((entry, index) => (
                        <Cell key={`cell-reinc-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#00205b', borderRadius: '8px', color: '#ffffff', border: 'none' }}
                      formatter={(val, name) => [`${val} casos`, name]}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: TABLA DE EVENTOS DE TELEMETRÍA */}
      {activeTab === 'eventos' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '1.75rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#00205b', fontWeight: '800' }}>
                🚨 Registro Completo de Eventos de Telemetría ({filteredEventos.length} filas)
              </h3>
              <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                Hoja original <code>eventos</code> de <code>telemetria.xlsx</code>
              </p>
            </div>

            <button
              onClick={() => exportToCSV('eventos')}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>📊</span> Exportar a Excel
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>#</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Fecha</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Mes</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Semana</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Placa</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Motivo</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Infracción Detectada</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Responsable</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredEventos.length > 0 ? (
                  filteredEventos.map((e, idx) => (
                    <tr 
                      key={e.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fcfdfd',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: '#0f172a' }}>{e.fecha}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{e.mes}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>Semana {e.semana}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          backgroundColor: '#f1f5f9',
                          color: '#00205b',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: '800',
                          letterSpacing: '0.5px'
                        }}>
                          {e.placa}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          backgroundColor: e.motivo === 'Dashcam' ? '#fdf2f8' : '#e0f2fe',
                          color: e.motivo === 'Dashcam' ? '#db2777' : '#0284c7',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: '700',
                          fontSize: '0.78rem'
                        }}>
                          {e.motivo}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          backgroundColor: e.tipoEvento.includes('curva') ? '#fef2f2' : e.tipoEvento.includes('cinturón') ? '#f5f3ff' : '#fffbeb',
                          color: e.tipoEvento.includes('curva') ? '#dc2626' : e.tipoEvento.includes('cinturón') ? '#7c3aed' : '#d97706',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          display: 'inline-block'
                        }}>
                          {e.tipoEvento}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#1e293b' }}>
                        {e.responsable}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: '800', color: '#00205b' }}>
                        {e.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      No se encontraron eventos con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: TABLA DE GESTIÓN DE CONSECUENCIAS */}
      {activeTab === 'gestion' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '1.75rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#00205b', fontWeight: '800' }}>
                ⚖️ Matriz de Gestión de Consecuencia - Plataforma Credit ({filteredGestion.length} registros)
              </h3>
              <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                Hoja original <code>Gestión de consecuencia</code> de <code>telemetria.xlsx</code>
              </p>
            </div>

            <button
              onClick={() => exportToCSV('gestion')}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>📊</span> Exportar a Excel
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>#</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Conductor</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Cédula</th>
                  <th style={{ padding: '0.85rem 1rem' }}># Reporte Credit</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Fecha Reporte</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Reincidente</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Medidas Disciplinarias Aplicadas</th>
                </tr>
              </thead>
              <tbody>
                {filteredGestion.length > 0 ? (
                  filteredGestion.map((g, idx) => (
                    <tr 
                      key={g.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: g.reincidente === 'SÍ' ? '#fff5f5' : idx % 2 === 0 ? '#ffffff' : '#fcfdfd'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '800', color: '#00205b' }}>
                        {g.conductor}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569', fontFamily: 'monospace' }}>
                        {g.cedula ? Number(g.cedula).toLocaleString('es-CO') : 'N/A'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#0369a1', fontWeight: '600' }}>
                        #{g.reporteCredit}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                        {g.fechaReporte}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          backgroundColor: g.reincidente === 'SÍ' ? '#fee2e2' : '#dcfce7',
                          color: g.reincidente === 'SÍ' ? '#dc2626' : '#166534',
                          padding: '0.3rem 0.75rem',
                          borderRadius: '9999px',
                          fontWeight: '800',
                          fontSize: '0.78rem'
                        }}>
                          {g.reincidente === 'SÍ' ? '⚠️ SÍ (Crítico)' : '✓ NO'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {g.medidas.map((m, mIdx) => {
                            const isPerm = m.toLowerCase().includes('permanente');
                            const is1Dia = m.toLowerCase().includes('1 día') || m.toLowerCase().includes('1 dia');
                            return (
                              <span
                                key={mIdx}
                                style={{
                                  backgroundColor: isPerm ? '#450a0a' : is1Dia ? '#fef3c7' : '#f0fdf4',
                                  color: isPerm ? '#ffffff' : is1Dia ? '#b45309' : '#15803d',
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: '700',
                                  border: isPerm ? '1px solid #7f1d1d' : 'none'
                                }}
                              >
                                {m}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                      No se encontraron registros de gestión con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: MATRIZ DE CRUCE CONDUCTORES */}
      {activeTab === 'cruce' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid #e2e8f0',
          padding: '1.75rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#00205b', fontWeight: '800' }}>
              🔄 Cruce Integral de Datos: Telemetría vs Consecuencias Disciplinarias
            </h3>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Correlación entre infracciones en ruta y medidas sancionatorias en la plataforma Credit
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {optionsConductor.filter(c => c !== 'Todos').map(conductor => {
              const evs = dataEventos.filter(e => e.responsable.includes(conductor) || conductor.includes(e.responsable));
              const ges = dataGestion.filter(g => g.conductor.includes(conductor) || conductor.includes(g.conductor));
              const hasReinc = ges.some(g => g.reincidente === 'SÍ');
              const hasBloqueoPerm = ges.some(g => g.medidas.some(m => m.toLowerCase().includes('permanente')));

              return (
                <div
                  key={conductor}
                  style={{
                    border: hasBloqueoPerm ? '2px solid #dc2626' : '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    backgroundColor: hasBloqueoPerm ? '#fff5f5' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1rem', color: '#00205b' }}>{conductor}</strong>
                      {hasBloqueoPerm && (
                        <span style={{ backgroundColor: '#dc2626', color: '#ffffff', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '800' }}>
                          BLOQUEADO
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      {ges[0]?.cedula ? `CC: ${Number(ges[0].cedula).toLocaleString('es-CO')}` : 'Sin cédula registrada'}
                    </div>

                    <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: '700', color: '#0369a1', marginBottom: '0.3rem' }}>
                        📡 Eventos en Ruta ({evs.length}):
                      </div>
                      {evs.length > 0 ? (
                        evs.map((e, idx) => (
                          <div key={idx} style={{ color: '#334155', fontSize: '0.78rem', marginBottom: '0.15rem' }}>
                            • {e.fecha} | Placa: <strong>{e.placa}</strong> ({e.tipoEvento})
                          </div>
                        ))
                      ) : (
                        <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Reportado directamente en Credit</div>
                      )}
                    </div>

                    <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: '700', color: '#15803d', marginBottom: '0.3rem' }}>
                        ⚖️ Gestión Credit ({ges.length}):
                      </div>
                      {ges.length > 0 ? (
                        ges.map((g, idx) => (
                          <div key={idx} style={{ color: '#334155', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                            • Reporte #{g.reporteCredit} ({g.fechaReporte}) - Reincidente: <strong>{g.reincidente}</strong>
                            <div style={{ color: '#475569', fontSize: '0.74rem', marginTop: '0.1rem' }}>
                              Medida: {g.medidas.join('; ')}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin reporte Credit registrado</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
