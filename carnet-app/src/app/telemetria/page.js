"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList, ComposedChart, Line
} from 'recharts';

// Paleta corporativa de Seguridad Vial y SST
const COLORS = ['#0284c7', '#f59e0b', '#dc2626', '#10b981', '#8b5cf6', '#ec4899', '#6366f1'];
const PIE_COLORS = {
  'Exceso de velocidad en carretera': '#f59e0b',
  'Exceso de velocidad en curva semiabierta': '#dc2626',
  'Cinturón desabrochado fuera del CD (> 5 seg)': '#8b5cf6',
  'Otros': '#0284c7'
};

// Comparador inteligente de nombres de conductores entre hojas
const matchDriverName = (driver1, driver2) => {
  if (!driver1 || !driver2) return false;
  const d1 = String(driver1).trim().toUpperCase();
  const d2 = String(driver2).trim().toUpperCase();
  if (d1 === d2 || d1.includes(d2) || d2.includes(d1)) return true;

  const p1 = d1.split(/\s+/);
  const p2 = d2.split(/\s+/);
  if (p1[0] && p2[0] && (p1[0] === p2[0] || p1[0].startsWith(p2[0]) || p2[0].startsWith(p1[0]))) {
    if (p1.length > 1 && p2.length > 1) {
      const last1 = p1[p1.length - 1];
      const last2 = p2[p2.length - 1];
      if (last1 === last2 || last1.slice(0, 4) === last2.slice(0, 4)) return true;
    }
  }
  return false;
};

export default function TelemetriaPage() {
  const [dataEventos, setDataEventos] = useState([]);
  const [dataGestion, setDataGestion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen', 'ramp', 'eventos', 'gestion', 'cruce'
  const [targetReductionPct, setTargetReductionPct] = useState(20); // Meta de reducción mensual MoM (20% solicitada)
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataSource, setDataSource] = useState('Servidor (telemetria.xlsx)');

  // Modal interactivo de detalle al oprimir un cuadro
  const [modalDetail, setModalDetail] = useState(null);

  // Filtros interactivos coordinados
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
      if (selectedConductor !== 'Todos' && !matchDriverName(selectedConductor, e.responsable)) return false;
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

  // Coordinación profunda: si se filtra por tipo, placa, mes o semana, la gestión se coordina con los conductores de esos eventos
  const filteredGestion = useMemo(() => {
    const isEventFilterActive = selectedTipo !== 'Todos' || selectedPlaca !== 'Todas' || selectedMes !== 'Todos' || selectedSemana !== 'Todas' || selectedMotivo !== 'Todos';
    const driversInEvents = isEventFilterActive ? filteredEventos.map(e => e.responsable) : null;

    return dataGestion.filter(g => {
      if (driversInEvents && !driversInEvents.some(d => matchDriverName(d, g.conductor))) {
        return false;
      }
      if (selectedConductor !== 'Todos' && !matchDriverName(selectedConductor, g.conductor)) {
        return false;
      }
      if (selectedReincidente !== 'Todos' && g.reincidente !== selectedReincidente) {
        return false;
      }
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
  }, [dataGestion, filteredEventos, selectedTipo, selectedPlaca, selectedMes, selectedSemana, selectedMotivo, selectedConductor, selectedReincidente, searchTerm]);

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

  // 6.b Cálculo Dinámico de Ramp Up / Ramp Down de Reducción MoM
  const rampAnalysis = useMemo(() => {
    const orderMeses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const reductionFactor = 1 - (targetReductionPct / 100);

    // Conteo real por mes según los eventos filtrados
    const conteoMeses = {};
    filteredEventos.forEach(e => {
      const mes = e.mes || 'OTRO';
      conteoMeses[mes] = (conteoMeses[mes] || 0) + e.total;
    });

    // Meses con datos reales ordenados cronológicamente
    const mesesConDatos = orderMeses.filter(m => conteoMeses[m] !== undefined && conteoMeses[m] > 0);

    if (mesesConDatos.length === 0) {
      return {
        chartData: [],
        tableData: [],
        resumen: {
          metaPct: targetReductionPct,
          ultimoMes: 'N/A',
          ultimoReal: 0,
          variacionUltimoMoM: 0,
          cumpleUltimo: false,
          brechaUltimo: 0,
          mejorMes: 'N/A',
          mejorVariacion: 0,
          proximoMes: 'SEPTIEMBRE',
          proximaMeta: 0,
          topePermitido: 0
        }
      };
    }

    const tableData = [];
    const chartData = [];
    let prevReal = null;

    mesesConDatos.forEach((mes, idx) => {
      const real = conteoMeses[mes];
      let meta = null;
      let varMoM = null;
      let brecha = null;
      let status = 'BASE';
      let statusLabel = 'Punto de partida';
      let statusColor = '#00205b';
      let recomendacion = 'Línea base para medir la meta de reducción.';

      if (idx === 0) {
        meta = real;
        status = 'BASE';
        statusLabel = '🏁 Mes Base';
        statusColor = '#00205b';
        recomendacion = 'Punto de partida inicial de telemetría en Barrancabermeja.';
      } else {
        meta = Number((prevReal * reductionFactor).toFixed(2));
        varMoM = Number((((real - prevReal) / prevReal) * 100).toFixed(1));
        brecha = Number((real - meta).toFixed(2));

        if (real <= meta) {
          status = 'CUMPLE';
          statusLabel = `🟢 Cumple Meta (-${Math.abs(varMoM)}%)`;
          statusColor = '#10b981';
          recomendacion = `Excelente desempeño: reducción de ${Math.abs(varMoM)}% superando la meta del -${targetReductionPct}%. Mantener buenas prácticas.`;
        } else if (varMoM <= 0) {
          status = 'PARCIAL';
          statusLabel = `⚠️ Reducción Insuficiente (-${Math.abs(varMoM)}%)`;
          statusColor = '#f59e0b';
          recomendacion = `Hubo reducción de ${Math.abs(varMoM)}%, pero no alcanzó la meta del -${targetReductionPct}% (Tope: ${meta}).`;
        } else {
          status = 'NO_CUMPLE';
          statusLabel = `🔴 Desviación (+${varMoM}%)`;
          statusColor = '#dc2626';
          recomendacion = `Aumento de +${varMoM}% respecto al periodo anterior. Excede la meta en +${brecha} eventos. Requiere plan de choque SST.`;
        }
      }

      tableData.push({
        mes,
        esProyeccion: false,
        real,
        meta,
        prevReal: idx > 0 ? prevReal : null,
        varMoM,
        brecha,
        status,
        statusLabel,
        statusColor,
        topeMaximo: meta !== null ? Math.floor(meta) : null,
        recomendacion
      });

      chartData.push({
        mes,
        real,
        meta,
        esProyeccion: false,
        statusColor,
        metaLabel: idx === 0 ? `Base: ${real}` : `Meta: ${meta}`,
        tooltipLabel: `${mes}: Real ${real} ev. | Meta: ${meta}`
      });

      prevReal = real;
    });

    // Proyecciones futuras de Ramp-Down (4 meses hacia adelante)
    const ultMesConDatos = mesesConDatos[mesesConDatos.length - 1];
    const ultIdx = orderMeses.indexOf(ultMesConDatos);
    const mesesFuturos = orderMeses.slice(ultIdx + 1, ultIdx + 5);

    let baseProyeccion = prevReal;
    mesesFuturos.forEach((mesFuturo) => {
      const metaFutura = Number((baseProyeccion * reductionFactor).toFixed(2));
      const tope = Math.floor(metaFutura);

      tableData.push({
        mes: `${mesFuturo} (Proy.)`,
        esProyeccion: true,
        real: null,
        meta: metaFutura,
        prevReal: baseProyeccion,
        varMoM: -targetReductionPct,
        brecha: 0,
        status: 'PROYECCION',
        statusLabel: `🔮 Meta: máx ${tope} ev. (-${targetReductionPct}%)`,
        statusColor: '#6366f1',
        topeMaximo: tope,
        recomendacion: `Para cumplir el -${targetReductionPct}%, el CD debe registrar máximo ${tope} ${tope === 1 ? 'evento' : 'eventos'} en el mes.`
      });

      chartData.push({
        mes: `${mesFuturo}*`,
        real: null,
        meta: metaFutura,
        esProyeccion: true,
        statusColor: '#6366f1',
        metaLabel: `Meta: ${metaFutura}`,
        tooltipLabel: `${mesFuturo} (Proy.): Meta ≤ ${metaFutura} (Máx ${tope} eventos)`
      });

      baseProyeccion = metaFutura;
    });

    // Resumen estadístico
    const evaluados = tableData.filter(d => !d.esProyeccion && d.varMoM !== null);
    const ultimoEvaluado = evaluados.length > 0 ? evaluados[evaluados.length - 1] : null;

    let mejorMes = 'N/A';
    let mejorVariacion = 0;
    evaluados.forEach(d => {
      if (d.varMoM !== null && d.varMoM < mejorVariacion) {
        mejorVariacion = d.varMoM;
        mejorMes = d.mes;
      }
    });

    const primeraProyeccion = tableData.find(d => d.esProyeccion);

    return {
      chartData,
      tableData,
      resumen: {
        metaPct: targetReductionPct,
        ultimoMes: ultimoEvaluado ? ultimoEvaluado.mes : ultMesConDatos,
        ultimoReal: ultimoEvaluado ? ultimoEvaluado.real : prevReal,
        variacionUltimoMoM: ultimoEvaluado ? ultimoEvaluado.varMoM : 0,
        cumpleUltimo: ultimoEvaluado ? ultimoEvaluado.real <= ultimoEvaluado.meta : false,
        brechaUltimo: ultimoEvaluado ? ultimoEvaluado.brecha : 0,
        mejorMes,
        mejorVariacion,
        proximoMes: primeraProyeccion ? primeraProyeccion.mes.replace(' (Proy.)', '') : 'SEPTIEMBRE',
        proximaMeta: primeraProyeccion ? primeraProyeccion.meta : 0,
        topePermitido: primeraProyeccion ? primeraProyeccion.topeMaximo : 0
      }
    };
  }, [filteredEventos, targetReductionPct]);

  // Indicador de filtros activos
  const hasActiveFilters = selectedMes !== 'Todos' || selectedSemana !== 'Todas' || selectedTipo !== 'Todos' || selectedMotivo !== 'Todos' || selectedPlaca !== 'Todas' || selectedConductor !== 'Todos' || selectedReincidente !== 'Todos' || searchTerm.trim() !== '';

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

  // 7. Acciones al hacer clic en los Gráficos para coordinar todo interactivamente
  const handlePieTipoClick = (entry) => {
    if (!entry) return;
    const targetName = entry.name;
    if (selectedTipo === targetName) {
      setSelectedTipo('Todos');
    } else {
      setSelectedTipo(targetName);
    }
  };

  const handleConductorBarClick = (entry) => {
    if (!entry) return;
    const cond = entry.conductor;
    if (selectedConductor === cond) {
      setSelectedConductor('Todos');
    } else {
      setSelectedConductor(cond);
    }
  };

  const handlePlacaBarClick = (entry) => {
    if (!entry) return;
    const p = entry.placa;
    if (selectedPlaca === p) {
      setSelectedPlaca('Todas');
    } else {
      setSelectedPlaca(p);
    }
  };

  const handleMesBarClick = (entry) => {
    if (!entry) return;
    const m = entry.mes;
    if (selectedMes === m) {
      setSelectedMes('Todos');
    } else {
      setSelectedMes(m);
    }
  };

  const handleReincidenciaClick = (entry) => {
    if (!entry) return;
    const val = entry.name === 'Reincidentes' ? 'SÍ' : 'NO';
    if (selectedReincidente === val) {
      setSelectedReincidente('Todos');
    } else {
      setSelectedReincidente(val);
    }
  };

  // 8. Manejo de clics en los cuadros de KPI (Modales con desglose exacto)
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

  const applyFilterFromModal = (filterKey) => {
    if (!filterKey) return;
    if (filterKey.type === 'tipo') setSelectedTipo(filterKey.value);
    if (filterKey.type === 'reincidente') setSelectedReincidente(filterKey.value);
    if (filterKey.type === 'conductor') setSelectedConductor(filterKey.value);
    if (filterKey.type === 'placa') setSelectedPlaca(filterKey.value);
    setModalDetail(null);
  };

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
        marginBottom: '1.75rem',
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
            <span style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: '800'
            }}>
              ✨ Gráficos Coordinados
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
            <span>📁 <strong>Fuente:</strong> {dataSource}</span>
            <span>📊 <strong>Registros:</strong> {dataEventos.length} eventos / {dataGestion.length} gestiones</span>
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
        marginBottom: '1.5rem',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🎛️</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#00205b', fontWeight: '800' }}>
              Filtros Dinámicos de Análisis
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
              También puedes oprimir directamente cualquier barra o torta de los gráficos para filtrar
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

      {/* BARRA DE FILTROS ACTIVOS COORDINADOS */}
      {hasActiveFilters && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '14px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.75rem',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.86rem', fontWeight: '900', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span>🎯</span> Filtros Activos Coordinados:
            </span>

            {selectedTipo !== 'Todos' && (
              <span style={{ backgroundColor: '#ffffff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Infracción: <strong>{selectedTipo}</strong>
                <button onClick={() => setSelectedTipo('Todos')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#dc2626', fontSize: '0.9rem' }}>✕</button>
              </span>
            )}

            {selectedConductor !== 'Todos' && (
              <span style={{ backgroundColor: '#ffffff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Conductor: <strong>{selectedConductor}</strong>
                <button onClick={() => setSelectedConductor('Todos')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#dc2626', fontSize: '0.9rem' }}>✕</button>
              </span>
            )}

            {selectedPlaca !== 'Todas' && (
              <span style={{ backgroundColor: '#ffffff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Placa: <strong>{selectedPlaca}</strong>
                <button onClick={() => setSelectedPlaca('Todas')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#dc2626', fontSize: '0.9rem' }}>✕</button>
              </span>
            )}

            {selectedMes !== 'Todos' && (
              <span style={{ backgroundColor: '#ffffff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Mes: <strong>{selectedMes}</strong>
                <button onClick={() => setSelectedMes('Todos')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#dc2626', fontSize: '0.9rem' }}>✕</button>
              </span>
            )}

            {selectedSemana !== 'Todas' && (
              <span style={{ backgroundColor: '#ffffff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Semana: <strong>{selectedSemana}</strong>
                <button onClick={() => setSelectedSemana('Todas')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#dc2626', fontSize: '0.9rem' }}>✕</button>
              </span>
            )}

            {selectedReincidente !== 'Todos' && (
              <span style={{ backgroundColor: '#ffffff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Reincidente: <strong>{selectedReincidente}</strong>
                <button onClick={() => setSelectedReincidente('Todos')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#dc2626', fontSize: '0.9rem' }}>✕</button>
              </span>
            )}

            {searchTerm.trim() !== '' && (
              <span style={{ backgroundColor: '#ffffff', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                Búsqueda: <em>&quot;{searchTerm}&quot;</em>
                <button onClick={() => setSearchTerm('')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: '900', color: '#dc2626', fontSize: '0.9rem' }}>✕</button>
              </span>
            )}
          </div>

          <button
            onClick={handleClearFilters}
            style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '0.35rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            Restablecer Todo
          </button>
        </div>
      )}

      {/* 3. BLOQUE DESTACADO: TIPOS DE EVENTOS ESPECÍFICOS (CLICABLES PARA FILTRAR O VER DETALLE) */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#00205b', fontWeight: '800' }}>
              Tipos Específicos de Infracción (Oprime para coordinar todo el Dashboard)
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontWeight: '800' }}>
            👆 Oprime un recuadro para filtrar gráficos o ver detalle
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem'
        }}>
          {/* Card Tipo 1: Exceso en Carretera */}
          <div
            onClick={() => {
              if (selectedTipo === 'Exceso de velocidad en carretera') {
                setSelectedTipo('Todos');
              } else {
                setSelectedTipo('Exceso de velocidad en carretera');
              }
            }}
            style={{
              backgroundColor: selectedTipo === 'Exceso de velocidad en carretera' ? '#fffbeb' : '#ffffff',
              border: selectedTipo === 'Exceso de velocidad en carretera' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
              boxShadow: selectedTipo === 'Exceso de velocidad en carretera' ? '0 10px 25px rgba(245, 158, 11, 0.25)' : '0 4px 14px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              borderLeft: '6px solid #f59e0b',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                <div style={{ fontSize: '1.8rem' }}>⚡</div>
              </div>
              <h4 style={{ margin: '0.6rem 0 0.2rem 0', fontSize: '1.15rem', color: '#78350f', fontWeight: '900' }}>
                Exceso en Carretera
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#92400e' }}>
                Velocidad superior al límite en carretera nacional
              </p>
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
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openCardDetail('tipo_carretera');
                  }}
                  style={{
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  🔍 Ver Detalle
                </button>
              </div>
            </div>
            {selectedTipo === 'Exceso de velocidad en carretera' && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#b45309', fontWeight: '800' }}>
                ✓ Filtro activo en gráficos (Oprime de nuevo para quitar)
              </div>
            )}
          </div>

          {/* Card Tipo 2: Exceso en Curva Semiabierta */}
          <div
            onClick={() => {
              if (selectedTipo === 'Exceso de velocidad en curva semiabierta') {
                setSelectedTipo('Todos');
              } else {
                setSelectedTipo('Exceso de velocidad en curva semiabierta');
              }
            }}
            style={{
              backgroundColor: selectedTipo === 'Exceso de velocidad en curva semiabierta' ? '#fef2f2' : '#ffffff',
              border: selectedTipo === 'Exceso de velocidad en curva semiabierta' ? '2px solid #dc2626' : '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
              boxShadow: selectedTipo === 'Exceso de velocidad en curva semiabierta' ? '0 10px 25px rgba(220, 38, 38, 0.25)' : '0 4px 14px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              borderLeft: '6px solid #dc2626',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                <div style={{ fontSize: '1.8rem' }}>🔄</div>
              </div>
              <h4 style={{ margin: '0.6rem 0 0.2rem 0', fontSize: '1.15rem', color: '#7f1d1d', fontWeight: '900' }}>
                Exceso en Curva Semiabierta
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#991b1b' }}>
                Riesgo alto de volcamiento vehicular
              </p>
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
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openCardDetail('tipo_curva');
                  }}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                  }}
                >
                  🔍 Ver Detalle
                </button>
              </div>
            </div>
            {selectedTipo === 'Exceso de velocidad en curva semiabierta' && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#991b1b', fontWeight: '800' }}>
                ✓ Filtro activo en gráficos (Oprime de nuevo para quitar)
              </div>
            )}
          </div>

          {/* Card Tipo 3: Cinturón Desabrochado */}
          <div
            onClick={() => {
              if (selectedTipo === 'Cinturón desabrochado fuera del CD (> 5 seg)') {
                setSelectedTipo('Todos');
              } else {
                setSelectedTipo('Cinturón desabrochado fuera del CD (> 5 seg)');
              }
            }}
            style={{
              backgroundColor: selectedTipo === 'Cinturón desabrochado fuera del CD (> 5 seg)' ? '#f5f3ff' : '#ffffff',
              border: selectedTipo === 'Cinturón desabrochado fuera del CD (> 5 seg)' ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
              boxShadow: selectedTipo === 'Cinturón desabrochado fuera del CD (> 5 seg)' ? '0 10px 25px rgba(139, 92, 246, 0.25)' : '0 4px 14px rgba(0,0,0,0.03)',
              cursor: 'pointer',
              borderLeft: '6px solid #8b5cf6',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                  12.5% (Dashcam)
                </span>
                <div style={{ fontSize: '1.8rem' }}>🦺</div>
              </div>
              <h4 style={{ margin: '0.6rem 0 0.2rem 0', fontSize: '1.15rem', color: '#4c1d95', fontWeight: '900' }}>
                Cinturón Desabrochado
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#5b21b6' }}>
                Cinturón desabrochado fuera del CD &gt; 5 seg
              </p>
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
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openCardDetail('tipo_cinturon');
                  }}
                  style={{
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.3)'
                  }}
                >
                  🔍 Ver Detalle
                </button>
              </div>
            </div>
            {selectedTipo === 'Cinturón desabrochado fuera del CD (> 5 seg)' && (
              <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#6d28d9', fontWeight: '800' }}>
                ✓ Filtro activo en gráficos (Oprime de nuevo para quitar)
              </div>
            )}
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
              {kpis.totalEventos === dataEventos.length ? '100% registros' : `${((kpis.totalEventos / (dataEventos.length || 1)) * 100).toFixed(0)}% del total`}
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
              Reportes disciplinarios
            </span>
            <span style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: '800' }}>👆 Clic detalle</span>
          </div>
        </div>

        {/* KPI 5: Reincidentes */}
        <div 
          onClick={() => {
            if (selectedReincidente === 'SÍ') {
              setSelectedReincidente('Todos');
            } else {
              setSelectedReincidente('SÍ');
            }
          }}
          style={{
            backgroundColor: selectedReincidente === 'SÍ' ? '#fee2e2' : '#ffffff',
            border: selectedReincidente === 'SÍ' ? '2px solid #dc2626' : '1px solid #e2e8f0',
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
              {selectedReincidente === 'SÍ' ? '✓ Filtrando Reincidentes' : 'Reincidencia crítica'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: '800' }}>👆 Clic filtrar</span>
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
              maxWidth: '920px',
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  {modalDetail.items.map((veh, idx) => (
                    <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', backgroundColor: '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#00205b' }}>🚚 {veh.placa}</span>
                        <span style={{ backgroundColor: '#00205b', color: '#fcd116', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '900', fontSize: '0.8rem' }}>
                          {veh.eventos} {veh.eventos === 1 ? 'evento' : 'eventos'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '0.4rem' }}>
                        <strong>Conductores:</strong> {Array.from(veh.conductores).join(', ')}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                        <strong>Infracciones:</strong>
                        <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {Array.from(veh.tipos).map((t, tIdx) => (
                            <span key={tIdx} style={{ color: '#b45309', fontWeight: '600' }}>• {t}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedPlaca(veh.placa);
                          setModalDetail(null);
                        }}
                        style={{ marginTop: '0.75rem', width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#00205b', fontWeight: '800', fontSize: '0.76rem', cursor: 'pointer' }}
                      >
                        Filtrar solo este vehículo
                      </button>
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
                      <button
                        onClick={() => {
                          setSelectedConductor(cond.conductor);
                          setModalDetail(null);
                        }}
                        style={{ marginTop: '0.75rem', width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#00205b', fontWeight: '800', fontSize: '0.76rem', cursor: 'pointer' }}
                      >
                        Filtrar solo este conductor
                      </button>
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

            {/* Footer del Modal */}
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
          <span>📊</span> Gráficos Coordinados y Análisis General
        </button>

        <button
          onClick={() => setActiveTab('ramp')}
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            borderBottom: activeTab === 'ramp' ? '3px solid #00205b' : '3px solid transparent',
            backgroundColor: activeTab === 'ramp' ? '#ffffff' : 'transparent',
            color: activeTab === 'ramp' ? '#00205b' : '#64748b',
            fontWeight: '800',
            fontSize: '0.95rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>📉</span> Ramp Up / Meta -{targetReductionPct}% MoM
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

      {/* PESTAÑA 1: RESUMEN GRÁFICO COORDINADO CON ETIQUETAS DE DATOS */}
      {activeTab === 'resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* BANNER DESTACADO: RAMP UP / META DE REDUCCIÓN -20% MoM */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '2px solid #00205b',
            padding: '1.75rem 2rem',
            boxShadow: '0 8px 24px rgba(0, 32, 91, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span style={{
                    backgroundColor: '#00205b',
                    color: '#fcd116',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: '900',
                    letterSpacing: '0.5px'
                  }}>
                    📉 MODELO RAMP UP / DOWN
                  </span>
                  <span style={{
                    backgroundColor: rampAnalysis.resumen.cumpleUltimo ? '#dcfce7' : '#fee2e2',
                    color: rampAnalysis.resumen.cumpleUltimo ? '#15803d' : '#b91c1c',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: '800'
                  }}>
                    {rampAnalysis.resumen.cumpleUltimo ? '🟢 Cumpliendo Meta MoM' : '🔴 Desviación en Último Mes'}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#00205b', fontWeight: '900' }}>
                  Meta Continua de Reducción: -{targetReductionPct}% Mes a Mes (MoM)
                </h3>
                <p style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Seguimiento de trayectoria de eventos frente a la meta corporativa de Seguridad Vial y proyección hacia cero infracciones
                </p>
              </div>

              {/* Selector interactivo rápido de meta % */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.5rem 0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '800', color: '#475569' }}>Meta:</span>
                {[10, 15, 20, 25, 30].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setTargetReductionPct(pct)}
                    style={{
                      backgroundColor: targetReductionPct === pct ? '#00205b' : '#ffffff',
                      color: targetReductionPct === pct ? '#fcd116' : '#475569',
                      border: targetReductionPct === pct ? '1px solid #00205b' : '1px solid #cbd5e1',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: targetReductionPct === pct ? '900' : '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {pct === 20 ? `★ -${pct}%` : `-${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Mini KPIs de Ramp Up */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #00205b' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Meta Fijada</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#00205b', margin: '0.2rem 0' }}>-{targetReductionPct}% MoM</div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>Disminución requerida de mes a mes</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', borderLeft: `4px solid ${rampAnalysis.resumen.cumpleUltimo ? '#10b981' : '#dc2626'}` }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Último Mes ({rampAnalysis.resumen.ultimoMes})</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: rampAnalysis.resumen.cumpleUltimo ? '#10b981' : '#dc2626', margin: '0.2rem 0' }}>
                  {rampAnalysis.resumen.ultimoReal} ev. ({rampAnalysis.resumen.variacionUltimoMoM > 0 ? '+' : ''}{rampAnalysis.resumen.variacionUltimoMoM}%)
                </div>
                <div style={{ fontSize: '0.75rem', color: rampAnalysis.resumen.cumpleUltimo ? '#15803d' : '#b91c1c' }}>
                  {rampAnalysis.resumen.cumpleUltimo ? '✓ Cumplió objetivo de reducción' : `Alerta: +${rampAnalysis.resumen.brechaUltimo} ev. sobre meta`}
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Mejor Mes ({rampAnalysis.resumen.mejorMes})</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#10b981', margin: '0.2rem 0' }}>
                  {rampAnalysis.resumen.mejorVariacion}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Superó con creces la meta del -{targetReductionPct}%</div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #6366f1' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Meta {rampAnalysis.resumen.proximoMes} (Proy.)</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#6366f1', margin: '0.2rem 0' }}>
                  ≤ {rampAnalysis.resumen.proximaMeta} ev.
                </div>
                <div style={{ fontSize: '0.75rem', color: '#4f46e5' }}>Tope máximo: {rampAnalysis.resumen.topePermitido} {rampAnalysis.resumen.topePermitido === 1 ? 'evento' : 'eventos'}</div>
              </div>
            </div>

            {/* Gráfico ComposedChart: Reales vs Meta MoM */}
            <div style={{ width: '100%', height: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rampAnalysis.chartData} margin={{ top: 25, right: 25, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fill: '#475569', fontSize: 11, fontWeight: '700' }} />
                  <YAxis allowDecimals={true} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: '#00205b', color: '#ffffff', padding: '0.8rem 1rem', borderRadius: '10px', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                          <div style={{ fontWeight: '900', color: '#fcd116', marginBottom: '0.4rem' }}>{d.mes}</div>
                          {d.real !== null && (
                            <div>• Eventos Reales: <strong>{d.real}</strong></div>
                          )}
                          <div>• Meta Teórica (-{targetReductionPct}%): <strong>{d.meta} ev.</strong></div>
                          {d.esProyeccion ? (
                            <div style={{ color: '#a5b4fc', marginTop: '0.3rem', fontSize: '0.78rem' }}>🔮 Proyección Ramp Down hacia Cero Accidentes</div>
                          ) : (
                            <div style={{ marginTop: '0.3rem', color: d.statusColor, fontWeight: '800' }}>
                              {d.status === 'BASE' ? '🏁 Punto Base' : (d.real <= d.meta ? '🟢 Cumple Meta' : '🔴 Excede Meta')}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="real" name="Eventos Reales" radius={[8, 8, 0, 0]}>
                    <LabelList
                      dataKey="real"
                      position="top"
                      fontWeight="900"
                      fontSize={13}
                      formatter={(val) => (val !== null && val !== undefined ? `${val} ev.` : '')}
                    />
                    {rampAnalysis.chartData.map((entry, index) => (
                      <Cell
                        key={`cell-ramp-${index}`}
                        fill={entry.real !== null ? entry.statusColor : 'transparent'}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="meta"
                    name={`Meta Reducción (-${targetReductionPct}% MoM)`}
                    stroke="#f59e0b"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  >
                    <LabelList
                      dataKey="metaLabel"
                      position="bottom"
                      fill="#b45309"
                      fontWeight="800"
                      fontSize={11}
                    />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                💡 <em>Nota: Los meses marcados con asterisco (*) corresponden a proyecciones automáticas de Ramp Down para alcanzar la meta continua.</em>
              </div>
              <button
                onClick={() => setActiveTab('ramp')}
                style={{
                  backgroundColor: '#00205b',
                  color: '#fcd116',
                  border: 'none',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(0, 32, 91, 0.2)'
                }}
              >
                <span>📉</span> Ver Tabla Detallada y Planes de Choque ➔
              </button>
            </div>
          </div>
          
          {/* Fila 1 de Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
            
            {/* Gráfico 1: Evolución Temporal con Etiquetas de Datos */}
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
                    📈 Eventos por Mes (Oprime una barra para filtrar)
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                    Etiquetas de datos en vivo sobre cada periodo
                  </p>
                </div>
                {selectedMes !== 'Todos' && (
                  <button
                    onClick={() => setSelectedMes('Todos')}
                    style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Quitar filtro mes ✕
                  </button>
                )}
              </div>

              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataPorMes} margin={{ top: 25, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mes" tick={{ fill: '#475569', fontSize: 11, fontWeight: '700' }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#00205b', borderRadius: '8px', color: '#ffffff', border: 'none' }}
                      formatter={(val) => [`${val} eventos`, 'Total']}
                    />
                    <Bar 
                      dataKey="cantidad" 
                      fill="#00205b" 
                      radius={[8, 8, 0, 0]} 
                      style={{ cursor: 'pointer' }}
                      onClick={(data) => handleMesBarClick(data)}
                    >
                      <LabelList 
                        dataKey="cantidad" 
                        position="top" 
                        fill="#00205b" 
                        fontWeight="900" 
                        fontSize={13} 
                        formatter={(val) => `${val} ev.`} 
                      />
                      {dataPorMes.map((entry, index) => (
                        <Cell 
                          key={`cell-mes-${index}`} 
                          fill={selectedMes === entry.mes ? '#f59e0b' : '#00205b'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 2: Distribución por Tipo con Etiquetas de Datos y Clic Coordinado */}
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
                    🍩 Distribución por Infracción (Oprime para filtrar infractor)
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                    Etiquetas de conteo y porcentaje directo en cada sector
                  </p>
                </div>
                {selectedTipo !== 'Todos' && (
                  <button
                    onClick={() => setSelectedTipo('Todos')}
                    style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Quitar filtro tipo ✕
                  </button>
                )}
              </div>

              <div style={{ width: '100%', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {dataPorTipo.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataPorTipo}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        style={{ cursor: 'pointer' }}
                        onClick={(entry) => handlePieTipoClick(entry)}
                        label={({ name, value, porcentaje }) => `${value} (${porcentaje}%)`}
                        labelLine={true}
                      >
                        {dataPorTipo.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                            stroke={selectedTipo === entry.name ? '#00205b' : '#ffffff'}
                            strokeWidth={selectedTipo === entry.name ? 3 : 1}
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
            
            {/* Gráfico 3: Ranking de Conductores con Etiquetas de Datos */}
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
                    🏆 Ranking de Conductores (Oprime para aislar conductor)
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                    Etiqueta visible con número total de infracciones por persona
                  </p>
                </div>
                {selectedConductor !== 'Todos' && (
                  <button
                    onClick={() => setSelectedConductor('Todos')}
                    style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Quitar filtro conductor ✕
                  </button>
                )}
              </div>

              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dataRankingConductores}
                    layout="vertical"
                    margin={{ top: 5, right: 60, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis dataKey="conductor" type="category" width={120} tick={{ fill: '#1e293b', fontSize: 10, fontWeight: '700' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#00205b', borderRadius: '8px', color: '#ffffff', border: 'none' }}
                      formatter={(val) => [`${val} eventos`, 'Infracciones']}
                    />
                    <Bar 
                      dataKey="eventos" 
                      fill="#0284c7" 
                      radius={[0, 8, 8, 0]} 
                      style={{ cursor: 'pointer' }}
                      onClick={(data) => handleConductorBarClick(data)}
                    >
                      <LabelList 
                        dataKey="eventos" 
                        position="right" 
                        fill="#0284c7" 
                        fontWeight="900" 
                        fontSize={12} 
                        formatter={(val) => `${val} ${val === 1 ? 'evento' : 'eventos'}`} 
                      />
                      {dataRankingConductores.map((entry, index) => (
                        <Cell 
                          key={`cell-cond-${index}`} 
                          fill={selectedConductor === entry.conductor ? '#f59e0b' : '#0284c7'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 4: Eventos por Placa con Etiquetas de Datos */}
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
                    🚚 Eventos por Vehículo (Oprime para aislar placa)
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                    Etiqueta superior en cada placa vehicular
                  </p>
                </div>
                {selectedPlaca !== 'Todas' && (
                  <button
                    onClick={() => setSelectedPlaca('Todas')}
                    style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Quitar filtro placa ✕
                  </button>
                )}
              </div>

              <div style={{ width: '100%', height: '320px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataPorVehiculo} margin={{ top: 25, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="placa" tick={{ fill: '#1e293b', fontSize: 11, fontWeight: '800' }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#00205b', borderRadius: '8px', color: '#ffffff', border: 'none' }}
                      formatter={(val) => [`${val} eventos`, 'Vehículo']}
                    />
                    <Bar 
                      dataKey="eventos" 
                      fill="#f59e0b" 
                      radius={[6, 6, 0, 0]} 
                      style={{ cursor: 'pointer' }}
                      onClick={(data) => handlePlacaBarClick(data)}
                    >
                      <LabelList 
                        dataKey="eventos" 
                        position="top" 
                        fill="#b45309" 
                        fontWeight="900" 
                        fontSize={12} 
                        formatter={(val) => `${val} ev.`} 
                      />
                      {dataPorVehiculo.map((entry, index) => (
                        <Cell 
                          key={`cell-placa-${index}`} 
                          fill={selectedPlaca === entry.placa ? '#dc2626' : '#f59e0b'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Fila 3: Análisis de Consecuencias Coordinado */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.75rem' }}>
            
            {/* Gráfico 5: Medidas Disciplinarias con Etiquetas */}
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
                    Etiquetas numéricas de sanciones ejecutadas según política
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataMedidas} margin={{ top: 25, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="medida" tick={{ fill: '#1e293b', fontSize: 10, fontWeight: '700' }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#00205b', borderRadius: '8px', color: '#ffffff', border: 'none' }}
                      formatter={(val) => [`${val} aplicaciones`, 'Medida']}
                    />
                    <Bar dataKey="cantidad" fill="#10b981" radius={[6, 6, 0, 0]}>
                      <LabelList 
                        dataKey="cantidad" 
                        position="top" 
                        fill="#047857" 
                        fontWeight="900" 
                        fontSize={12} 
                        formatter={(val) => `${val} actas`} 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico 6: Proporción de Reincidencia con Clic Coordinado */}
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
                    🔄 Proporción de Reincidencia (Oprime para filtrar)
                  </h4>
                  <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                    Etiquetas de casos y porcentajes de reincidencia
                  </p>
                </div>
                {selectedReincidente !== 'Todos' && (
                  <button
                    onClick={() => setSelectedReincidente('Todos')}
                    style={{ fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    Quitar filtro reincidencia ✕
                  </button>
                )}
              </div>

              <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      style={{ cursor: 'pointer' }}
                      onClick={(entry) => handleReincidenciaClick(entry)}
                      label={({ name, value }) => `${value} (${((value / (filteredGestion.length || 1)) * 100).toFixed(0)}%)`}
                      labelLine={true}
                    >
                      {dataReincidencia.map((entry, index) => (
                        <Cell 
                          key={`cell-reinc-${index}`} 
                          fill={entry.color} 
                          stroke={(selectedReincidente === 'SÍ' && entry.name === 'Reincidentes') || (selectedReincidente === 'NO' && entry.name === 'No Reincidentes') ? '#00205b' : '#ffffff'}
                          strokeWidth={3}
                        />
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

      {/* PESTAÑA: RAMP UP / META DE REDUCCIÓN (-20% MoM) */}
      {activeTab === 'ramp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Header del Módulo Ramp Up */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            padding: '2rem 2.5rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1.5rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <span style={{
                  backgroundColor: '#00205b',
                  color: '#fcd116',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: '900',
                  letterSpacing: '0.5px'
                }}>
                  📉 RAMP UP / RAMP DOWN SST
                </span>
                <span style={{
                  backgroundColor: rampAnalysis.resumen.cumpleUltimo ? '#dcfce7' : '#fee2e2',
                  color: rampAnalysis.resumen.cumpleUltimo ? '#15803d' : '#b91c1c',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: '800'
                }}>
                  {rampAnalysis.resumen.cumpleUltimo ? '🟢 Tendencia en Meta' : '🔴 Alerta de Desviación'}
                </span>
                <span style={{
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: '800'
                }}>
                  Meta Corporativa: -{targetReductionPct}% MoM
                </span>
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#00205b', margin: '0 0 0.4rem 0' }}>
                Modelo de Ramp Up: Meta de Reducción Continua (-{targetReductionPct}% MoM)
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0, maxWidth: '850px', lineHeight: '1.5' }}>
                Estrategia de reducción continua del <strong>{targetReductionPct}% mes a mes</strong> sobre los eventos de telemetría de CD Barrancabermeja. Permite contrastar los incidentes reales contra la meta exigida y simular la curva de descenso hacia Cero Accidentes.
              </p>
            </div>

            {/* Panel de Control Interactivo de la Meta % */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              minWidth: '280px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase' }}>
                  🎯 Ajustar Meta de Reducción:
                </span>
                <span style={{
                  backgroundColor: '#00205b',
                  color: '#fcd116',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '900'
                }}>
                  -{targetReductionPct}% MoM
                </span>
              </div>

              {/* Botones predefinidos */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[10, 15, 20, 25, 30].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setTargetReductionPct(pct)}
                    style={{
                      backgroundColor: targetReductionPct === pct ? '#00205b' : '#ffffff',
                      color: targetReductionPct === pct ? '#fcd116' : '#475569',
                      border: targetReductionPct === pct ? '1px solid #00205b' : '1px solid #cbd5e1',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: targetReductionPct === pct ? '900' : '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {pct === 20 ? `★ ${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>

              {/* Slider interactivo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={targetReductionPct}
                  onChange={(e) => setTargetReductionPct(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#64748b' }}>
                <span>Mín: 5%</span>
                <button
                  onClick={() => setTargetReductionPct(20)}
                  style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', textDecoration: 'underline', fontWeight: '700' }}
                >
                  Restablecer 20%
                </button>
                <span>Máx: 50%</span>
              </div>
            </div>
          </div>

          {/* Tarjetas KPI de Ramp Up */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem'
          }}>
            {/* KPI 1: Meta Corporativa */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              borderLeft: '5px solid #00205b'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>
                <span>Meta Mensual MoM</span>
                <span style={{ fontSize: '1.25rem' }}>🎯</span>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#00205b', margin: '0.35rem 0 0.2rem' }}>
                -{targetReductionPct}.0%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                Tasa de reducción esperada cada mes
              </div>
            </div>

            {/* KPI 2: Último Desempeño Evaluado */}
            <div style={{
              backgroundColor: rampAnalysis.resumen.cumpleUltimo ? '#f0fdf4' : '#fff5f5',
              border: rampAnalysis.resumen.cumpleUltimo ? '1px solid #86efac' : '1px solid #fecaca',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              borderLeft: `5px solid ${rampAnalysis.resumen.cumpleUltimo ? '#10b981' : '#dc2626'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>
                <span>Último Mes ({rampAnalysis.resumen.ultimoMes})</span>
                <span style={{ fontSize: '1.25rem' }}>{rampAnalysis.resumen.cumpleUltimo ? '🟢' : '🚨'}</span>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: rampAnalysis.resumen.cumpleUltimo ? '#15803d' : '#dc2626', margin: '0.35rem 0 0.2rem' }}>
                {rampAnalysis.resumen.ultimoReal} ev. ({rampAnalysis.resumen.variacionUltimoMoM > 0 ? '+' : ''}{rampAnalysis.resumen.variacionUltimoMoM}%)
              </div>
              <div style={{ fontSize: '0.8rem', color: rampAnalysis.resumen.cumpleUltimo ? '#15803d' : '#b91c1c', fontWeight: '700' }}>
                {rampAnalysis.resumen.cumpleUltimo ? '✓ Cumplió la meta de reducción' : `Exceso de +${rampAnalysis.resumen.brechaUltimo} eventos sobre meta`}
              </div>
            </div>

            {/* KPI 3: Mejor Mes Histórico */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              borderLeft: '5px solid #10b981'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>
                <span>Mejor Desempeño ({rampAnalysis.resumen.mejorMes})</span>
                <span style={{ fontSize: '1.25rem' }}>🏆</span>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#10b981', margin: '0.35rem 0 0.2rem' }}>
                {rampAnalysis.resumen.mejorVariacion}%
              </div>
              <div style={{ fontSize: '0.8rem', color: '#15803d', fontWeight: '700' }}>
                Superó la meta fijada (Redujo de 2 a 1 evento)
              </div>
            </div>

            {/* KPI 4: Objetivo Próximo Mes */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.4rem 1.5rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              borderLeft: '5px solid #6366f1'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase' }}>
                <span>Meta {rampAnalysis.resumen.proximoMes} (Proy.)</span>
                <span style={{ fontSize: '1.25rem' }}>🔮</span>
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: '900', color: '#6366f1', margin: '0.35rem 0 0.2rem' }}>
                ≤ {rampAnalysis.resumen.proximaMeta} ev.
              </div>
              <div style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: '700' }}>
                Tope máximo permitido: {rampAnalysis.resumen.topePermitido} {rampAnalysis.resumen.topePermitido === 1 ? 'evento' : 'eventos'}
              </div>
            </div>
          </div>

          {/* Gráfico ComposedChart Detallado */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#00205b', fontWeight: '900' }}>
                  📈 Curva de Descenso Ramp Up: Eventos Reales vs Meta MoM (-{targetReductionPct}%)
                </h3>
                <p style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Barras verdes = Cumplió la meta de reducción | Barras rojas = Excedió la meta | Línea dorada = Meta continua de reducción (-{targetReductionPct}% MoM)
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#15803d', fontWeight: '800' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981', display: 'inline-block' }}></span> Cumple
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#b91c1c', fontWeight: '800' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#dc2626', display: 'inline-block' }}></span> Desviación
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#b45309', fontWeight: '800' }}>
                  <span style={{ width: '16px', height: '2px', borderTop: '2px dashed #f59e0b', display: 'inline-block' }}></span> Meta MoM
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rampAnalysis.chartData} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fill: '#475569', fontSize: 11, fontWeight: '800' }} />
                  <YAxis allowDecimals={true} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: '#00205b', color: '#ffffff', padding: '0.9rem 1.15rem', borderRadius: '12px', fontSize: '0.85rem', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', minWidth: '220px' }}>
                          <div style={{ fontWeight: '900', color: '#fcd116', fontSize: '0.95rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.3rem' }}>
                            {d.mes}
                          </div>
                          {d.real !== null ? (
                            <div style={{ marginBottom: '0.25rem' }}>• Eventos Reales: <strong>{d.real} infracciones</strong></div>
                          ) : (
                            <div style={{ color: '#a5b4fc', marginBottom: '0.25rem' }}>• Eventos Reales: <em>Pendiente (Futuro)</em></div>
                          )}
                          <div style={{ marginBottom: '0.25rem' }}>• Meta Continua (-{targetReductionPct}%): <strong>{d.meta} ev.</strong></div>
                          {d.esProyeccion ? (
                            <div style={{ color: '#a5b4fc', marginTop: '0.4rem', fontSize: '0.78rem' }}>
                              🔮 Proyección de descenso continuo hacia cero
                            </div>
                          ) : (
                            <div style={{ marginTop: '0.4rem', color: d.statusColor, fontWeight: '800' }}>
                              {d.status === 'BASE' ? '🏁 Punto Base' : (d.real <= d.meta ? `🟢 Cumple Meta` : `🔴 Desviación (+${(d.real - d.meta).toFixed(2)} ev.)`)}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Bar dataKey="real" name="Eventos Reales Registrados" radius={[8, 8, 0, 0]}>
                    <LabelList
                      dataKey="real"
                      position="top"
                      fontWeight="900"
                      fontSize={13}
                      formatter={(val) => (val !== null && val !== undefined ? `${val} ev.` : '')}
                    />
                    {rampAnalysis.chartData.map((entry, index) => (
                      <Cell
                        key={`cell-ramp-main-${index}`}
                        fill={entry.real !== null ? entry.statusColor : 'transparent'}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="meta"
                    name={`Curva Meta de Reducción (-${targetReductionPct}% MoM)`}
                    stroke="#f59e0b"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                  >
                    <LabelList
                      dataKey="metaLabel"
                      position="bottom"
                      fill="#b45309"
                      fontWeight="800"
                      fontSize={11}
                    />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla Comparativa Paso a Paso de Cumplimiento y Proyección */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#00205b', fontWeight: '900' }}>
                  📋 Matriz de Seguimiento MoM y Proyección Hacia Cero Accidentes
                </h3>
                <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Cálculo histórico de variación mes a mes vs meta del -{targetReductionPct}% y metas de control futuro
                </p>
              </div>

              <button
                onClick={() => exportToCSV('ramp_up', rampAnalysis.tableData)}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.6rem 1.15rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                }}
              >
                <span>📊</span> Exportar Análisis Ramp Up (.xlsx)
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '0.9rem 1rem', color: '#00205b', fontWeight: '800' }}>Periodo</th>
                    <th style={{ padding: '0.9rem 1rem', color: '#00205b', fontWeight: '800', textAlign: 'center' }}>Eventos Reales</th>
                    <th style={{ padding: '0.9rem 1rem', color: '#00205b', fontWeight: '800', textAlign: 'center' }}>Meta (-{targetReductionPct}%)</th>
                    <th style={{ padding: '0.9rem 1rem', color: '#00205b', fontWeight: '800', textAlign: 'center' }}>Variación vs Anterior</th>
                    <th style={{ padding: '0.9rem 1rem', color: '#00205b', fontWeight: '800', textAlign: 'center' }}>Brecha vs Meta</th>
                    <th style={{ padding: '0.9rem 1rem', color: '#00205b', fontWeight: '800' }}>Estado de Cumplimiento</th>
                    <th style={{ padding: '0.9rem 1rem', color: '#00205b', fontWeight: '800' }}>Diagnóstico & Plan de Choque SST</th>
                  </tr>
                </thead>
                <tbody>
                  {rampAnalysis.tableData.map((row, idx) => (
                    <tr 
                      key={idx} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: row.esProyeccion ? '#f8fafc' : (row.status === 'CUMPLE' ? '#f0fdf4' : (row.status === 'NO_CUMPLE' ? '#fff5f5' : '#ffffff'))
                      }}
                    >
                      {/* Periodo */}
                      <td style={{ padding: '1rem', fontWeight: '800', color: '#00205b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{row.mes}</span>
                          {row.esProyeccion ? (
                            <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: '800' }}>PROYECCIÓN</span>
                          ) : (
                            <span style={{ backgroundColor: '#e2e8f0', color: '#334155', fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: '800' }}>HISTÓRICO</span>
                          )}
                        </div>
                      </td>

                      {/* Eventos Reales */}
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '900', fontSize: '1rem' }}>
                        {row.real !== null ? (
                          <span style={{
                            backgroundColor: row.status === 'CUMPLE' ? '#dcfce7' : (row.status === 'NO_CUMPLE' ? '#fee2e2' : '#f1f5f9'),
                            color: row.status === 'CUMPLE' ? '#15803d' : (row.status === 'NO_CUMPLE' ? '#b91c1c' : '#00205b'),
                            padding: '0.3rem 0.75rem',
                            borderRadius: '8px',
                            display: 'inline-block'
                          }}>
                            {row.real}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>
                        )}
                      </td>

                      {/* Meta */}
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '800', color: '#b45309' }}>
                        {row.meta !== null ? `≤ ${row.meta}` : 'Base'}
                        {row.topeMaximo !== null && row.esProyeccion && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>(Máx {row.topeMaximo})</div>
                        )}
                      </td>

                      {/* Variación vs Anterior */}
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '800' }}>
                        {row.varMoM !== null ? (
                          <span style={{
                            color: row.varMoM <= -targetReductionPct ? '#15803d' : (row.varMoM <= 0 ? '#b45309' : '#b91c1c')
                          }}>
                            {row.varMoM > 0 ? `▲ +${row.varMoM}%` : `▼ ${row.varMoM}%`}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Línea Base</span>
                        )}
                      </td>

                      {/* Brecha vs Meta */}
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '700' }}>
                        {row.real !== null && row.brecha !== null ? (
                          <span style={{
                            color: row.brecha <= 0 ? '#15803d' : '#b91c1c',
                            backgroundColor: row.brecha <= 0 ? '#dcfce7' : '#fee2e2',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem'
                          }}>
                            {row.brecha <= 0 ? `${row.brecha} ev. (A favor)` : `+${row.brecha} ev. (Exceso)`}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          backgroundColor: row.status === 'CUMPLE' ? '#10b981' : (row.status === 'NO_CUMPLE' ? '#dc2626' : (row.status === 'PARCIAL' ? '#f59e0b' : (row.status === 'PROYECCION' ? '#6366f1' : '#00205b'))),
                          color: '#ffffff',
                          padding: '0.3rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          display: 'inline-block'
                        }}>
                          {row.statusLabel}
                        </span>
                      </td>

                      {/* Recomendación */}
                      <td style={{ padding: '1rem', color: '#475569', fontSize: '0.82rem', maxWidth: '300px', lineHeight: '1.4' }}>
                        {row.recomendacion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3 Pilares Estratégicos SST para Alcanzar el -20% MoM */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Pilar 1 */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.6rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              borderTop: '5px solid #dc2626'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🔄</span>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#00205b', fontWeight: '800' }}>
                  1. Velocidad en Curvas Semiabiertas
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
                Representa el mayor riesgo de <strong>SIF Potencial (Vuelco)</strong> en las rutas del CD Barrancabermeja. Se registraron 2 infracciones críticas en el periodo.
              </p>
              <div style={{ backgroundColor: '#fef2f2', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.8rem', color: '#991b1b', fontWeight: '700' }}>
                📌 Acción SST: Geocercas con alerta acústica en cabina al aproximarse a curvas del Magdalena Medio y Santander.
              </div>
            </div>

            {/* Pilar 2 */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.6rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              borderTop: '5px solid #8b5cf6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🦺</span>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#00205b', fontWeight: '800' }}>
                  2. Tolerancia Cero al Cinturón de Seguridad
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
                Detección por <strong>Dashcam con IA</strong> (&gt; 5 seg fuera del CD). Evitar este único evento en Agosto habría mantenido la curva de reducción dentro del objetivo.
              </p>
              <div style={{ backgroundColor: '#f5f3ff', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.8rem', color: '#5b21b6', fontWeight: '700' }}>
                📌 Acción SST: Auditoría aleatoria a la salida de portería del CD y notificación inmediata al despachador.
              </div>
            </div>

            {/* Pilar 3 */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '1.6rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
              borderTop: '5px solid #10b981'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>⚖️</span>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#00205b', fontWeight: '800' }}>
                  3. Gestión Disciplinaria y Reincidentes
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5', margin: '0 0 1rem 0' }}>
                Intervención mediante <strong>plataforma Credit</strong>: 1 conductor reincidente con sanción de bloqueo permanente. El 100% de conductores infractores deben firmar compromiso.
              </p>
              <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.8rem', color: '#166534', fontWeight: '700' }}>
                📌 Acción SST: Reentrenamiento obligatorio en manejo defensivo antes de habilitar nuevamente al conductor en la flota.
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
                        <span 
                          onClick={() => setSelectedPlaca(e.placa)}
                          style={{
                            backgroundColor: '#f1f5f9',
                            color: '#00205b',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontWeight: '800',
                            letterSpacing: '0.5px',
                            cursor: 'pointer'
                          }}
                          title="Clic para filtrar por esta placa"
                        >
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
                        <span 
                          onClick={() => setSelectedTipo(e.tipoEvento)}
                          style={{
                            backgroundColor: e.tipoEvento.includes('curva') ? '#fef2f2' : e.tipoEvento.includes('cinturón') ? '#f5f3ff' : '#fffbeb',
                            color: e.tipoEvento.includes('curva') ? '#dc2626' : e.tipoEvento.includes('cinturón') ? '#7c3aed' : '#d97706',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '0.8rem',
                            display: 'inline-block',
                            cursor: 'pointer'
                          }}
                          title="Clic para filtrar por esta infracción"
                        >
                          {e.tipoEvento}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: '#1e293b' }}>
                        <span 
                          onClick={() => setSelectedConductor(e.responsable)}
                          style={{ cursor: 'pointer', textDecoration: 'underline decoration-dotted' }}
                          title="Clic para filtrar por este conductor"
                        >
                          {e.responsable}
                        </span>
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
                        <span
                          onClick={() => setSelectedConductor(g.conductor)}
                          style={{ cursor: 'pointer', textDecoration: 'underline decoration-dotted' }}
                          title="Clic para filtrar por este conductor"
                        >
                          {g.conductor}
                        </span>
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
                        <span 
                          onClick={() => setSelectedReincidente(g.reincidente)}
                          style={{
                            backgroundColor: g.reincidente === 'SÍ' ? '#fee2e2' : '#dcfce7',
                            color: g.reincidente === 'SÍ' ? '#dc2626' : '#166534',
                            padding: '0.3rem 0.75rem',
                            borderRadius: '9999px',
                            fontWeight: '800',
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                          title="Clic para filtrar reincidentes"
                        >
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
              const evs = dataEventos.filter(e => matchDriverName(conductor, e.responsable));
              const ges = dataGestion.filter(g => matchDriverName(conductor, g.conductor));
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
                      <strong 
                        onClick={() => setSelectedConductor(conductor)}
                        style={{ fontSize: '1rem', color: '#00205b', cursor: 'pointer', textDecoration: 'underline decoration-dotted' }}
                        title="Clic para filtrar por este conductor"
                      >
                        {conductor}
                      </strong>
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
