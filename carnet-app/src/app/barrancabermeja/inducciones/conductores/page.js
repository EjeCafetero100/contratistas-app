"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useCity } from "@/context/CityContext";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";

const COLORS = ["#00205b", "#fcd116", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

// Catálogo maestro de las 13 preguntas del formulario oficial de inducción
export const EVALUATION_QUESTIONS = [
  {
    id: "red_zone",
    num: 1,
    bloque: "Operación Segura & Red Zone",
    bloqueColor: "#00205b",
    title: "1. La Red Zone es:",
    shortTitle: "Definición Red Zone",
    expectedAnswer: "Es el lugar en bahía donde se estaciona el vehiculo para realizar el proceso de cargue y descargue de vehículos",
    icono: "🛑"
  },
  {
    id: "ingreso_red_zone",
    num: 2,
    bloque: "Operación Segura & Red Zone",
    bloqueColor: "#00205b",
    title: "2. El proceso para ingresar hasta la Red Zone cómo debe ser:",
    shortTitle: "Proceso ingreso a Red Zone",
    expectedAnswer: "Todas las anteriores",
    icono: "🚶"
  },
  {
    id: "bloqueo_vehiculo",
    num: 3,
    bloque: "Operación Segura & Red Zone",
    bloqueColor: "#00205b",
    title: "3. El bloqueo del vehículo consiste en:",
    shortTitle: "Bloqueo y trabaruedas",
    expectedAnswer: "El conductor debe estacionarse en bahía, apagar el vehículo, descender, ubicar aviso panorámico trabaruedas y realizar control de llaves",
    icono: "🔒"
  },
  {
    id: "zona_segura",
    num: 4,
    bloque: "Operación Segura & Red Zone",
    bloqueColor: "#00205b",
    title: "4. La zona segura es un lugar para los conductores con el fin de evitar interacción hombre-máquina:",
    shortTitle: "Zona segura hombre-máquina",
    expectedAnswer: "Verdadero",
    icono: "🛡️"
  },
  {
    id: "reporte_salud",
    num: 5,
    bloque: "Salud y Bienestar",
    bloqueColor: "#10b981",
    title: "5. Si no me siento bien de salud en el centro de distribución debo reportar al supervisor de turno o al encargado de seguridad:",
    shortTitle: "Reporte de condición de salud",
    expectedAnswer: "Verdadero",
    icono: "🩺"
  },
  {
    id: "comportamientos_cd",
    num: 6,
    bloque: "Comportamiento Seguro",
    bloqueColor: "#3b82f6",
    title: "6. Mis comportamientos en el CD deben ser:",
    shortTitle: "Comportamientos en CD",
    expectedAnswer: "Todas las anteriores",
    icono: "🤝"
  },
  {
    id: "punto_encuentro",
    num: 7,
    bloque: "Evacuación & Emergencias",
    bloqueColor: "#f59e0b",
    title: "7. El punto de encuentro queda en el área externa del CD:",
    shortTitle: "Punto de encuentro exterior",
    expectedAnswer: "Verdadero",
    icono: "📍"
  },
  {
    id: "alarma_evacuacion",
    num: 8,
    bloque: "Evacuación & Emergencias",
    bloqueColor: "#f59e0b",
    title: "8. A partir de qué señal sonora del sistema de alarma se debe iniciar el proceso de evacuación hacia el punto de encuentro:",
    shortTitle: "Señal de alarma sonora",
    expectedAnswer: "Al tercer pitido",
    icono: "🚨"
  },
  {
    id: "evacuacion_contratista",
    num: 9,
    bloque: "Evacuación & Emergencias",
    bloqueColor: "#f59e0b",
    title: "9. En caso de evacuación en el punto de encuentro se debe ubicar con el personal de su contratista y así facilitar el conteo:",
    shortTitle: "Ubicación con contratista",
    expectedAnswer: "Verdadero",
    icono: "👥"
  },
  {
    id: "brigadistas",
    num: 10,
    bloque: "Evacuación & Emergencias",
    bloqueColor: "#f59e0b",
    title: "10. Los brigadistas se identifican con una insignia en el casco:",
    shortTitle: "Insignia de brigadistas",
    expectedAnswer: "Verdadero",
    icono: "⛑️"
  },
  {
    id: "senalizacion_verde",
    num: 11,
    bloque: "Evacuación & Emergencias",
    bloqueColor: "#f59e0b",
    title: "11. La señalización verde con flechas qué indica:",
    shortTitle: "Ruta de evacuación verde",
    expectedAnswer: "Me dice cual es la ruta de evacuación que debo seguir en caso de evacuación",
    icono: "🟢"
  },
  {
    id: "info_clara",
    num: 12,
    bloque: "Percepción & Calidad",
    bloqueColor: "#8b5cf6",
    title: "12. La información suministrada fue clara:",
    shortTitle: "Claridad de la información",
    expectedAnswer: "Si",
    icono: "💡"
  },
  {
    id: "normas_protegen",
    num: 13,
    bloque: "Percepción & Calidad",
    bloqueColor: "#8b5cf6",
    title: "13. Las normas de seguridad protegen mi vida y la de otros funcionarios dentro del CD:",
    shortTitle: "Protección de la vida",
    expectedAnswer: "Si",
    icono: "❤️"
  }
];

export default function InduccionConductoresDashboard() {
  const { selectCity } = useCity();

  useEffect(() => {
    selectCity("Barrancabermeja");
  }, [selectCity]);

  // Estados de datos
  const [data, setData] = useState({
    records: [],
    kpis: {
      total: 0,
      aprobados: 0,
      reprobados: 0,
      tasaAprobacion: 100,
      promedioPuntuacion: 100,
      promedioCalificacion: 10,
      licenciasVigentes: 0,
      licenciasPorVencer: 0,
      licenciasVencidas: 0
    },
    stats: {
      distEmpresas: [],
      distLicencias: [],
      distEps: [],
      distArl: []
    },
    source: "cargando"
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("matriz"); // 'matriz' | 'estadisticas' | 'directorio'

  // Estados de filtros y búsqueda
  const [search, setSearch] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState("Todas");
  const [filterLicencia, setFilterLicencia] = useState("Todas");
  const [filterEstadoLic, setFilterEstadoLic] = useState("Todos");
  const [filterPreguntaSelect, setFilterPreguntaSelect] = useState("Todas");

  // Estado de filas expandidas en la matriz de respuestas
  const [expandedRows, setExpandedRows] = useState({});

  // Modal de detalle
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Modal de nuevo registro
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    cedula: "",
    celular: "",
    tipo_licencia: "B1",
    fecha_vencimiento_licencia: "",
    eps: "",
    afp: "",
    arl: "",
    tipo_sangre: "O+",
    contacto_emergencia_nombre: "",
    contacto_emergencia_telefono: "",
    empresa: "Kopps",
    nit_empresa: "",
    puntuacion: 100,
    calificacion_proceso: 10,
    respuestas_evaluacion: {
      red_zone: "Es el lugar en bahía donde se estaciona el vehiculo para realizar el proceso de cargue y descargue de vehículos",
      ingreso_red_zone: "Todas las anteriores",
      bloqueo_vehiculo: "El conductor debe estacionarse en bahía, apagar el vehículo, descender, ubicar aviso panorámico trabaruedas y realizar control de llaves",
      zona_segura: "Verdadero",
      reporte_salud: "Verdadero",
      comportamientos_cd: "Todas las anteriores",
      punto_encuentro: "Verdadero",
      alarma_evacuacion: "Al tercer pitido",
      evacuacion_contratista: "Verdadero",
      brigadistas: "Verdadero",
      senalizacion_verde: "Me dice cual es la ruta de evacuación que debo seguir en caso de evacuación",
      info_clara: "Si",
      normas_protegen: "Si"
    }
  });

  // Cargar datos desde la API conectada a Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inducciones/conductores");
      const json = await res.json();
      if (json.success) {
        setData(json);
        // Expandir por defecto el primer conductor si hay pocos
        if (json.records && json.records.length > 0) {
          const initExp = {};
          json.records.forEach((r, idx) => {
            if (idx === 0) initExp[r.id] = true;
          });
          setExpandedRows(initExp);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrar registros
  const filteredRecords = useMemo(() => {
    return (data.records || []).filter((r) => {
      const matchSearch =
        search === "" ||
        (r.nombre_completo || "").toLowerCase().includes(search.toLowerCase()) ||
        String(r.cedula || "").includes(search) ||
        (r.empresa || "").toLowerCase().includes(search.toLowerCase()) ||
        String(r.celular || "").includes(search);

      const matchEmpresa =
        filterEmpresa === "Todas" || r.empresa === filterEmpresa;

      const matchLicencia =
        filterLicencia === "Todas" || r.tipo_licencia === filterLicencia;

      const matchEstadoLic =
        filterEstadoLic === "Todos" || r.estado_licencia === filterEstadoLic;

      return matchSearch && matchEmpresa && matchLicencia && matchEstadoLic;
    });
  }, [data.records, search, filterEmpresa, filterLicencia, filterEstadoLic]);

  // Lista única de empresas
  const uniqueEmpresas = useMemo(() => {
    const set = new Set((data.records || []).map((r) => r.empresa).filter(Boolean));
    return Array.from(set);
  }, [data.records]);

  // Toggle de expansión de respuestas por persona
  const toggleRowExpand = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleExpandAll = () => {
    const allExpanded = filteredRecords.every((r) => expandedRows[r.id]);
    const nextState = {};
    filteredRecords.forEach((r) => {
      nextState[r.id] = !allExpanded;
    });
    setExpandedRows(nextState);
  };

  // Cálculo estadístico por pregunta en tiempo real a medida que respondan más personas
  const questionStats = useMemo(() => {
    const records = data.records || [];
    const totalResp = records.length;

    return EVALUATION_QUESTIONS.map((q) => {
      let correctCount = 0;
      const answerCounts = {};

      records.forEach((r) => {
        const resp = (r.respuestas_evaluacion || {})[q.id];
        if (resp !== undefined && resp !== null && resp !== "") {
          const respStr = String(resp).trim();
          answerCounts[respStr] = (answerCounts[respStr] || 0) + 1;
          
          // Comparar con respuesta esperada
          const normResp = respStr.toLowerCase().replace(/[s.,/]/g, "");
          const normExp = q.expectedAnswer.toLowerCase().replace(/[s.,/]/g, "");
          if (normResp === normExp || (q.expectedAnswer === "Si" && (normResp === "si" || normResp === "sí"))) {
            correctCount++;
          }
        }
      });

      const accuracy = totalResp > 0 ? Math.round((correctCount / totalResp) * 100) : 100;
      const answersBreakdown = Object.entries(answerCounts).map(([ans, count]) => ({
        answer: ans,
        count,
        percentage: totalResp > 0 ? Math.round((count / totalResp) * 100) : 0
      }));

      return {
        ...q,
        totalRespondents: totalResp,
        correctCount,
        accuracy,
        answersBreakdown
      };
    });
  }, [data.records]);

  // Exportar a Excel con todas las 13 preguntas en columnas independientes
  const handleExportExcel = () => {
    if (!filteredRecords.length) return;
    const exportData = filteredRecords.map((r, i) => {
      const resp = r.respuestas_evaluacion || {};
      const row = {
        "#": i + 1,
        "Fecha Inducción": r.fecha || "",
        "Nombre Completo": r.nombre_completo,
        "Cédula": r.cedula,
        "Celular": r.celular,
        "Empresa": r.empresa,
        "NIT / CC Empresa": r.nit_empresa,
        "Tipo Licencia": r.tipo_licencia,
        "Vencimiento Licencia": r.fecha_vencimiento_licencia,
        "Estado Licencia": r.estado_licencia,
        "EPS": r.eps,
        "AFP": r.afp,
        "ARL": r.arl,
        "Tipo Sangre": r.tipo_sangre,
        "Contacto Emergencia": r.contacto_emergencia_nombre,
        "Tel. Emergencia": r.contacto_emergencia_telefono,
        "Puntuación Evaluación": r.puntuacion,
        "Resultado": r.aprobado ? "APROBADO" : "REPROBADO",
        "Calificación Proceso (1-10)": r.calificacion_proceso
      };

      // Agregar cada una de las 13 preguntas como columnas separadas en el Excel
      EVALUATION_QUESTIONS.forEach((q) => {
        row[`P${q.num}. ${q.shortTitle}`] = resp[q.id] || "Sin respuesta";
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Respuestas Conductores");
    XLSX.writeFile(wb, "Induccion_Conductores_Evaluaciones_Barrancabermeja.xlsx");
  };

  // Enviar nuevo registro a Supabase
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/inducciones/conductores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setIsNewModalOpen(false);
        await fetchData();
        alert("¡Inducción de conductor guardada exitosamente en Supabase!");
      } else {
        alert("Error: " + (json.error || "No se pudo registrar"));
      }
    } catch (err) {
      alert("Error de conexión al guardar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "1.5rem" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        
        {/* Barra Superior con Navegación y Badges */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
          background: "#ffffff",
          padding: "1rem 1.5rem",
          borderRadius: 16,
          boxShadow: "0 2px 10px rgba(0, 32, 91, 0.05)",
          border: "1px solid #e2e8f0"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
            <Link
              href="/barrancabermeja/inducciones"
              className="btn-inducciones-back"
              style={{
                background: "#00205b",
                color: "#ffffff",
                padding: "0.55rem 1.15rem",
                borderRadius: 9999,
                fontWeight: 700,
                fontSize: "0.85rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem"
              }}
            >
              <span>←</span> VOLVER A INDUCCIONES
            </Link>

            <span style={{
              background: "rgba(252, 209, 22, 0.2)",
              border: "1px solid rgba(252, 209, 22, 0.7)",
              color: "#00205b",
              padding: "0.4rem 0.9rem",
              borderRadius: 9999,
              fontSize: "0.8rem",
              fontWeight: 800,
              letterSpacing: "0.04em"
            }}>
              📍 BARRANCABERMEJA • CONDUCTORES
            </span>

            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.85rem",
              borderRadius: 9999,
              fontSize: "0.78rem",
              fontWeight: 700,
              background: data.source === "supabase" ? "#ecfdf5" : "#fef3c7",
              color: data.source === "supabase" ? "#065f46" : "#92400e",
              border: `1px solid ${data.source === "supabase" ? "#a7f3d0" : "#fde68a"}`
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: data.source === "supabase" ? "#10b981" : "#f59e0b"
              }} />
              {data.source === "supabase" ? "⚡ Supabase Online" : "📁 Excel Local"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setIsNewModalOpen(true)}
              style={{
                background: "#fcd116",
                color: "#00205b",
                border: "none",
                padding: "0.55rem 1.25rem",
                borderRadius: 10,
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 4px 12px rgba(252, 209, 22, 0.35)"
              }}
            >
              <span>➕</span> REGISTRAR INDUCCIÓN
            </button>

            <button
              onClick={handleExportExcel}
              style={{
                background: "#ffffff",
                color: "#00205b",
                border: "1px solid #cbd5e1",
                padding: "0.55rem 1.15rem",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
              title="Descarga el Excel con las 13 preguntas completas"
            >
              <span>📥</span> EXPORTAR CON PREGUNTAS (.XLSX)
            </button>

            <button
              onClick={fetchData}
              style={{
                background: "#f1f5f9",
                color: "#00205b",
                border: "1px solid #cbd5e1",
                padding: "0.55rem 0.85rem",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
              title="Actualizar datos"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Header Hero del Dashboard */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <span style={{
              background: "#00205b",
              color: "#fcd116",
              padding: "0.45rem 1rem",
              borderRadius: 10,
              fontWeight: 900,
              fontSize: "1.3rem"
            }}>
              🚚
            </span>
            <div>
              <h1 style={{
                fontSize: "2.1rem",
                fontWeight: 900,
                color: "#00205b",
                margin: 0,
                letterSpacing: "-0.01em"
              }}>
                INDUCCIÓN DE CONDUCTORES — MATRIZ DE PREGUNTAS Y EVALUACIONES
              </h1>
              <p style={{ color: "#64748b", margin: "0.25rem 0 0 0", fontSize: "0.95rem" }}>
                Monitoreo individual y consolidado de respuestas al examen de seguridad vial,Red Zone, bloqueo de vehículos y evacuación.
              </p>
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas Principales (KPIs) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem"
        }}>
          {/* KPI 1 */}
          <div style={{
            background: "#ffffff",
            padding: "1.4rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            borderTop: "5px solid #00205b",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Conductores Evaluados
              </span>
              <span style={{ fontSize: "1.2rem" }}>👥</span>
            </div>
            <div style={{ fontSize: "2.3rem", fontWeight: 900, color: "#00205b" }}>
              {data.kpis.total}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700, marginTop: "0.25rem" }}>
              ✓ Base en crecimiento continuo
            </div>
          </div>

          {/* KPI 2 */}
          <div style={{
            background: "#ffffff",
            padding: "1.4rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            borderTop: "5px solid #10b981",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Tasa de Aprobación
              </span>
              <span style={{ fontSize: "1.2rem" }}>🎯</span>
            </div>
            <div style={{ fontSize: "2.3rem", fontWeight: 900, color: "#10b981" }}>
              {data.kpis.tasaAprobacion}%
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
              {data.kpis.aprobados} Aprobados • {data.kpis.reprobados} Reprobados
            </div>
          </div>

          {/* KPI 3 */}
          <div style={{
            background: "#ffffff",
            padding: "1.4rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            borderTop: "5px solid #fcd116",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Preguntas por Examen
              </span>
              <span style={{ fontSize: "1.2rem" }}>📝</span>
            </div>
            <div style={{ fontSize: "2.3rem", fontWeight: 900, color: "#00205b" }}>
              13 Preguntas
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
              Promedio: <strong>{data.kpis.promedioPuntuacion} pts</strong> (Satisfacción: {data.kpis.promedioCalificacion}/10)
            </div>
          </div>

          {/* KPI 4 */}
          <div style={{
            background: "#ffffff",
            padding: "1.4rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            borderTop: "5px solid #ef4444",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Control de Licencias
              </span>
              <span style={{ fontSize: "1.2rem" }}>🪪</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span style={{ fontSize: "2.3rem", fontWeight: 900, color: data.kpis.licenciasVencidas > 0 ? "#ef4444" : "#10b981" }}>
                {data.kpis.licenciasVencidas}
              </span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ef4444" }}>Vencidas</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
              {data.kpis.licenciasVigentes} Vigentes • {data.kpis.licenciasPorVencer} Por vencer
            </div>
          </div>
        </div>

        {/* Pestañas de Modo de Visualización */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          background: "#ffffff",
          padding: "0.5rem",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
        }}>
          <button
            onClick={() => setActiveTab("matriz")}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: 10,
              border: "none",
              background: activeTab === "matriz" ? "#00205b" : "transparent",
              color: activeTab === "matriz" ? "#ffffff" : "#64748b",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s ease"
            }}
          >
            <span>📋</span> MATRIZ DE RESPUESTAS POR PERSONA ({filteredRecords.length})
          </button>

          <button
            onClick={() => setActiveTab("estadisticas")}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: 10,
              border: "none",
              background: activeTab === "estadisticas" ? "#00205b" : "transparent",
              color: activeTab === "estadisticas" ? "#ffffff" : "#64748b",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s ease"
            }}
          >
            <span>📊</span> ANÁLISIS CONSOLIDADO DE LAS 13 PREGUNTAS
          </button>

          <button
            onClick={() => setActiveTab("directorio")}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: 10,
              border: "none",
              background: activeTab === "directorio" ? "#00205b" : "transparent",
              color: activeTab === "directorio" ? "#ffffff" : "#64748b",
              fontWeight: 800,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s ease"
            }}
          >
            <span>🗂️</span> DIRECTORIO GENERAL & LICENCIAS
          </button>
        </div>

        {/* Filtros Globales de Búsqueda */}
        <div style={{
          background: "#ffffff",
          padding: "1.25rem 1.5rem",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          marginBottom: "1.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          {/* Buscador */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              type="text"
              placeholder="🔍 Buscar conductor por nombre, cédula, empresa o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.65rem 1rem",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: "0.9rem",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            {/* Filtro Empresa */}
            <select
              value={filterEmpresa}
              onChange={(e) => setFilterEmpresa(e.target.value)}
              style={{
                padding: "0.6rem 0.85rem",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                color: "#00205b",
                fontWeight: 700,
                background: "#fff"
              }}
            >
              <option value="Todas">Empresa: Todas</option>
              {uniqueEmpresas.map((emp) => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>

            {/* Filtro Licencia */}
            <select
              value={filterLicencia}
              onChange={(e) => setFilterLicencia(e.target.value)}
              style={{
                padding: "0.6rem 0.85rem",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                color: "#00205b",
                fontWeight: 700,
                background: "#fff"
              }}
            >
              <option value="Todas">Licencia: Todas</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
              <option value="C3">C3</option>
            </select>

            {/* Filtro Estado Licencia */}
            <select
              value={filterEstadoLic}
              onChange={(e) => setFilterEstadoLic(e.target.value)}
              style={{
                padding: "0.6rem 0.85rem",
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                color: "#00205b",
                fontWeight: 700,
                background: "#fff"
              }}
            >
              <option value="Todos">Estado Licencia: Todos</option>
              <option value="Vigente">Vigente</option>
              <option value="Por Vencer">Por Vencer</option>
              <option value="Vencida">Vencida</option>
            </select>

            {activeTab === "matriz" && (
              <button
                onClick={toggleExpandAll}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  color: "#00205b",
                  padding: "0.6rem 0.95rem",
                  borderRadius: 10,
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                🔄 Expandir / Contraer Todo
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            TAB 1: MATRIZ DE RESPUESTAS POR PERSONA (PREFERIDA)
           ======================================================== */}
        {activeTab === "matriz" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Aviso explicativo */}
            <div style={{
              background: "rgba(0, 32, 91, 0.04)",
              border: "1px solid rgba(0, 32, 91, 0.15)",
              borderRadius: 12,
              padding: "0.85rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <span style={{ fontSize: "1.2rem" }}>ℹ️</span>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#00205b", fontWeight: 600 }}>
                A continuación se muestra cada persona evaluada con el desglose íntegro de las <strong>13 preguntas oficiales</strong>. Conforme más conductores completen el examen, se listarán aquí de forma individual con sus respuestas exactas.
              </p>
            </div>

            {loading ? (
              <div style={{ background: "#fff", padding: "4rem", borderRadius: 16, textAlign: "center", color: "#64748b" }}>
                Cargando evaluaciones desde Supabase...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div style={{ background: "#fff", padding: "4rem", borderRadius: 16, textAlign: "center", color: "#94a3b8" }}>
                No hay conductores que coincidan con la búsqueda.
              </div>
            ) : (
              filteredRecords.map((r, idx) => {
                const isExpanded = !!expandedRows[r.id];
                const resp = r.respuestas_evaluacion || {};

                return (
                  <div
                    key={r.id}
                    style={{
                      background: "#ffffff",
                      borderRadius: 18,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 18px rgba(0, 32, 91, 0.06)",
                      overflow: "hidden",
                      transition: "all 0.25s ease"
                    }}
                  >
                    {/* Encabezado del Conductor */}
                    <div
                      onClick={() => toggleRowExpand(r.id)}
                      style={{
                        padding: "1.25rem 1.5rem",
                        background: isExpanded ? "linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)" : "#ffffff",
                        cursor: "pointer",
                        borderBottom: isExpanded ? "2px solid #e2e8f0" : "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "1rem"
                      }}
                    >
                      {/* Información Principal */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{
                          width: 46,
                          height: 46,
                          borderRadius: "50%",
                          background: "#00205b",
                          color: "#fcd116",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "1.1rem"
                        }}>
                          {r.nombre_completo.charAt(0)}
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900, color: "#00205b" }}>
                              {r.nombre_completo}
                            </h3>
                            <span style={{
                              background: r.aprobado ? "#d1fae5" : "#fee2e2",
                              color: r.aprobado ? "#065f46" : "#991b1b",
                              padding: "0.2rem 0.55rem",
                              borderRadius: 6,
                              fontSize: "0.72rem",
                              fontWeight: 800
                            }}>
                              {r.aprobado ? "APROBADO" : "REPROBADO"} ({r.puntuacion} pts)
                            </span>
                          </div>
                          <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem" }}>
                            CC: <strong>{r.cedula}</strong> • Empresa: <strong>{r.empresa}</strong> • Cel: {r.celular || "S/N"} • Fecha: {r.fecha || "Reciente"}
                          </div>
                        </div>
                      </div>

                      {/* Badges de Licencia y Botón Toggle */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                        <span style={{
                          background: "#f1f5f9",
                          color: "#00205b",
                          padding: "0.3rem 0.75rem",
                          borderRadius: 8,
                          fontSize: "0.82rem",
                          fontWeight: 800,
                          border: "1px solid #cbd5e1"
                        }}>
                          Lic: {r.tipo_licencia || "B1"} ({r.estado_licencia})
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(r);
                          }}
                          style={{
                            background: "#00205b",
                            color: "#ffffff",
                            border: "none",
                            padding: "0.45rem 0.9rem",
                            borderRadius: 8,
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          👁️ Ficha
                        </button>

                        <div style={{
                          background: isExpanded ? "#fcd116" : "#f1f5f9",
                          color: "#00205b",
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "0.85rem",
                          transition: "transform 0.2s ease",
                          transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)"
                        }}>
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Despliegue de las 13 Preguntas y Respuestas */}
                    {isExpanded && (
                      <div style={{ padding: "1.5rem", background: "#f8fafc" }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "1rem"
                        }}>
                          <span style={{ fontWeight: 800, color: "#00205b", fontSize: "0.95rem" }}>
                            📝 Respuestas Registradas (13 Preguntas Oficiales):
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            Calificación del Proceso: <strong>{r.calificacion_proceso}/10 ⭐</strong>
                          </span>
                        </div>

                        {/* Cuadrícula de Preguntas */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
                          gap: "1rem"
                        }}>
                          {EVALUATION_QUESTIONS.map((q) => {
                            const conductorAnswer = resp[q.id];
                            const hasAnswer = conductorAnswer !== undefined && conductorAnswer !== null && conductorAnswer !== "";
                            const normCond = String(conductorAnswer || "").toLowerCase().replace(/[s.,/]/g, "");
                            const normExp = q.expectedAnswer.toLowerCase().replace(/[s.,/]/g, "");
                            const isCorrect = normCond === normExp || (q.expectedAnswer === "Si" && (normCond === "si" || normCond === "sí"));

                            return (
                              <div
                                key={q.id}
                                style={{
                                  background: "#ffffff",
                                  borderRadius: 12,
                                  padding: "1rem 1.15rem",
                                  border: "1px solid #e2e8f0",
                                  borderLeft: `4px solid ${q.bloqueColor}`,
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between"
                                }}
                              >
                                <div>
                                  {/* Encabezado Pregunta */}
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.35rem" }}>
                                    <span style={{
                                      fontSize: "0.72rem",
                                      fontWeight: 800,
                                      color: q.bloqueColor,
                                      background: "rgba(0, 32, 91, 0.05)",
                                      padding: "0.15rem 0.45rem",
                                      borderRadius: 4
                                    }}>
                                      {q.icono} P{q.num} • {q.bloque}
                                    </span>

                                    <span style={{
                                      fontSize: "0.7rem",
                                      fontWeight: 800,
                                      padding: "0.15rem 0.45rem",
                                      borderRadius: 9999,
                                      background: isCorrect ? "#ecfdf5" : "#fef2f2",
                                      color: isCorrect ? "#059669" : "#dc2626"
                                    }}>
                                      {isCorrect ? "✓ Acertada" : "⚠️ Revisar"}
                                    </span>
                                  </div>

                                  <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.6rem", lineHeight: 1.35 }}>
                                    {q.title}
                                  </div>
                                </div>

                                {/* Respuesta del conductor */}
                                <div style={{
                                  background: isCorrect ? "#f0fdf4" : "#fef2f2",
                                  border: `1px solid ${isCorrect ? "#bbf7d0" : "#fecaca"}`,
                                  borderRadius: 8,
                                  padding: "0.55rem 0.75rem",
                                  fontSize: "0.85rem"
                                }}>
                                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", display: "block" }}>
                                    RESPUESTA DEL CONDUCTOR:
                                  </span>
                                  <strong style={{ color: isCorrect ? "#166534" : "#991b1b" }}>
                                    {hasAnswer ? String(conductorAnswer) : "(Sin respuesta)"}
                                  </strong>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: ANÁLISIS CONSOLIDADO POR PREGUNTA
           ======================================================== */}
        {activeTab === "estadisticas" && (
          <div>
            <div style={{
              background: "rgba(0, 32, 91, 0.04)",
              border: "1px solid rgba(0, 32, 91, 0.15)",
              borderRadius: 12,
              padding: "0.85rem 1.25rem",
              marginBottom: "1.5rem"
            }}>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#00205b", fontWeight: 600 }}>
                📊 <strong>Rendimiento Global del Cuestionario:</strong> Monitorea en tiempo real qué preguntas presentan mayor índice de acierto o dónde se concentran las dudas de los conductores para reforzar las charlas de inducción.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.25rem" }}>
              {questionStats.map((q) => (
                <div
                  key={q.id}
                  style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    padding: "1.4rem",
                    border: "1px solid #e2e8f0",
                    borderTop: `5px solid ${q.bloqueColor}`,
                    boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: q.bloqueColor }}>
                      {q.icono} P{q.num} • {q.bloque}
                    </span>
                    <span style={{
                      fontSize: "0.85rem",
                      fontWeight: 900,
                      color: q.accuracy >= 80 ? "#10b981" : "#ef4444"
                    }}>
                      {q.accuracy}% Acierto ({q.correctCount}/{q.totalRespondents})
                    </span>
                  </div>

                  <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#00205b", margin: "0.25rem 0 0.75rem 0", lineHeight: 1.35 }}>
                    {q.title}
                  </h4>

                  {/* Barra de Progreso */}
                  <div style={{ width: "100%", height: 8, background: "#f1f5f9", borderRadius: 9999, overflow: "hidden", marginBottom: "1rem" }}>
                    <div style={{
                      width: `${q.accuracy}%`,
                      height: "100%",
                      background: q.accuracy >= 80 ? "#10b981" : "#ef4444",
                      borderRadius: 9999,
                      transition: "width 0.4s ease"
                    }} />
                  </div>

                  {/* Desglose de Respuestas Recibidas */}
                  <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: 10 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "0.35rem" }}>
                      DESGLOSE DE RESPUESTAS ({q.totalRespondents} conductores):
                    </span>
                    {q.answersBreakdown.map((ab, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", padding: "0.25rem 0", borderBottom: i < q.answersBreakdown.length - 1 ? "1px dashed #e2e8f0" : "none" }}>
                        <span style={{ color: "#334155", maxWidth: "80%" }}>{ab.answer}</span>
                        <span style={{ fontWeight: 800, color: "#00205b" }}>{ab.count} ({ab.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: DIRECTORIO GENERAL & LICENCIAS
           ======================================================== */}
        {activeTab === "directorio" && (
          <div style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)",
            overflow: "hidden"
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#00205b" }}>
                    <th style={{ padding: "0.9rem 1.25rem", fontWeight: 800 }}>CONDUCTOR</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 800 }}>EMPRESA</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 800 }}>LICENCIA</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 800 }}>VENCIMIENTO</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 800 }}>EPS / ARL</th>
                    <th style={{ padding: "0.9rem 1rem", fontWeight: 800 }}>EVALUACIÓN</th>
                    <th style={{ padding: "0.9rem 1.25rem", fontWeight: 800, textAlign: "center" }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                        Cargando registros desde Supabase...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                        No se encontraron conductores.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ fontWeight: 800, color: "#00205b" }}>{r.nombre_completo}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            CC: {r.cedula} • 📞 {r.celular || "S/N"}
                          </div>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 700, color: "#1e293b" }}>{r.empresa || "Kopps"}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>NIT: {r.nit_empresa || "123"}</div>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <span style={{
                            background: "#f1f5f9",
                            color: "#00205b",
                            padding: "0.25rem 0.65rem",
                            borderRadius: 6,
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            border: "1px solid #cbd5e1"
                          }}>
                            {r.tipo_licencia || "B1"}
                          </span>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <div>{r.fecha_vencimiento_licencia || "N/A"}</div>
                          <span style={{
                            display: "inline-block",
                            marginTop: "0.25rem",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            padding: "0.2rem 0.55rem",
                            borderRadius: 9999,
                            background: r.estado_licencia === "Vencida" ? "#fee2e2" : r.estado_licencia === "Por Vencer" ? "#fef3c7" : "#ecfdf5",
                            color: r.estado_licencia === "Vencida" ? "#b91c1c" : r.estado_licencia === "Por Vencer" ? "#b45309" : "#047857"
                          }}>
                            {r.estado_licencia}
                          </span>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontSize: "0.85rem" }}>EPS: {r.eps || "N/A"}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>ARL: {r.arl || "N/A"}</div>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <span style={{
                            fontWeight: 900,
                            fontSize: "1.05rem",
                            color: r.aprobado ? "#10b981" : "#ef4444"
                          }}>
                            {r.puntuacion} pts
                          </span>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            Satisfacción: {r.calificacion_proceso}/10
                          </div>
                        </td>

                        <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                          <button
                            onClick={() => setSelectedRecord(r)}
                            style={{
                              background: "#00205b",
                              color: "#fff",
                              border: "none",
                              padding: "0.45rem 0.95rem",
                              borderRadius: 8,
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            👁️ Ver Expediente
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Ficha y Expediente */}
        {selectedRecord && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 32, 91, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1.5rem"
          }}>
            <div style={{
              background: "#ffffff",
              borderRadius: 20,
              maxWidth: 860,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{
                background: "linear-gradient(135deg, #00205b 0%, #001233 100%)",
                color: "#ffffff",
                padding: "1.5rem 2rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <span style={{
                    background: "#fcd116",
                    color: "#00205b",
                    padding: "0.25rem 0.75rem",
                    borderRadius: 9999,
                    fontSize: "0.75rem",
                    fontWeight: 800
                  }}>
                    Expediente Oficial de Inducción
                  </span>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff", margin: "0.4rem 0 0 0" }}>
                    {selectedRecord.nombre_completo}
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}>
                    CC: {selectedRecord.cedula} • Empresa: {selectedRecord.empresa}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    fontSize: "1.1rem",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: "2rem" }}>
                {/* Datos básicos */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem", background: "#f8fafc", padding: "1.2rem", borderRadius: 12 }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>LICENCIA</span>
                    <div style={{ fontWeight: 800, color: "#00205b" }}>{selectedRecord.tipo_licencia} ({selectedRecord.estado_licencia})</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Vence: {selectedRecord.fecha_vencimiento_licencia}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>PUNTAJE</span>
                    <div style={{ fontWeight: 900, color: "#10b981", fontSize: "1.2rem" }}>{selectedRecord.puntuacion} / 100</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Calificación: {selectedRecord.calificacion_proceso}/10</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>SEGURIDAD SOCIAL</span>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.85rem" }}>EPS: {selectedRecord.eps}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>ARL: {selectedRecord.arl}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>EMERGENCIA</span>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.85rem" }}>{selectedRecord.contacto_emergencia_nombre}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Tel: {selectedRecord.contacto_emergencia_telefono}</div>
                  </div>
                </div>

                {/* 13 Preguntas */}
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#00205b", marginBottom: "1rem" }}>
                  📋 Desglose de las 13 Preguntas de la Inducción:
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {EVALUATION_QUESTIONS.map((q) => {
                    const ans = (selectedRecord.respuestas_evaluacion || {})[q.id];
                    return (
                      <div key={q.id} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.85rem 1rem" }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: "0.25rem" }}>
                          {q.title}
                        </div>
                        <div style={{ fontSize: "0.88rem", color: "#1e293b", fontWeight: 600 }}>
                          ✓ Respuesta: <strong>{ans ? String(ans) : "(Sin respuesta)"}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: "2rem", textAlign: "right" }}>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    style={{ background: "#00205b", color: "#fff", border: "none", padding: "0.65rem 1.5rem", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}
                  >
                    Cerrar Expediente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nuevo Registro */}
        {isNewModalOpen && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 32, 91, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1.5rem"
          }}>
            <div style={{
              background: "#ffffff",
              borderRadius: 20,
              maxWidth: 760,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{
                background: "#00205b",
                color: "#ffffff",
                padding: "1.5rem 2rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ffffff", margin: 0 }}>
                  ➕ Registrar Evaluación de Inducción de Conductor
                </h2>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  style={{ background: "none", border: "none", color: "#fff", fontSize: "1.2rem", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRecord} style={{ padding: "2rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>
                      Cédula *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.cedula}
                      onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>
                      Celular
                    </label>
                    <input
                      type="text"
                      value={formData.celular}
                      onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.empresa}
                      onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>
                      Tipo de Licencia
                    </label>
                    <select
                      value={formData.tipo_licencia}
                      onChange={(e) => setFormData({ ...formData, tipo_licencia: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    >
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                      <option value="C3">C3</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>
                      Vencimiento de Licencia
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_vencimiento_licencia}
                      onChange={(e) => setFormData({ ...formData, fecha_vencimiento_licencia: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    style={{ background: "#f1f5f9", color: "#334155", border: "none", padding: "0.7rem 1.5rem", borderRadius: 10, fontWeight: 700 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      background: "#fcd116",
                      color: "#00205b",
                      border: "none",
                      padding: "0.7rem 1.8rem",
                      borderRadius: 10,
                      fontWeight: 800,
                      cursor: submitting ? "not-allowed" : "pointer"
                    }}
                  >
                    {submitting ? "Guardando..." : "Guardar en Supabase"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
