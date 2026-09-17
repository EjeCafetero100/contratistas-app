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
  CartesianGrid,
  Legend
} from "recharts";

// Catálogo de preguntas oficial para Distoyota
export const EVALUATION_QUESTIONS = [
  {
    "id": "normas_seguridad",
    "num": 1,
    "bloque": "Mantenimiento & Seguridad",
    "bloqueColor": "#00205b",
    "title": "1. Seleccione las respuestas correctas con respecto a las normas de seguridad",
    "shortTitle": "P1. Normas Seguridad",
    "expectedAnswer": "Todas las anteriores",
    "icono": "🛡️"
  },
  {
    "id": "permiso_trabajo",
    "num": 2,
    "bloque": "Mantenimiento & Seguridad",
    "bloqueColor": "#00205b",
    "title": "2. Para ingresar al cd debo tener un permiso de trabajo o ingreso aprobado, además de haber presentado la seguridad social vigente",
    "shortTitle": "P2. Permiso Trabajo",
    "expectedAnswer": "Verdadero",
    "icono": "📋"
  },
  {
    "id": "limite_velocidad",
    "num": 3,
    "bloque": "Seguridad Vial en CD",
    "bloqueColor": "#3b82f6",
    "title": "3. El limite de velocidad dentro del cd es?",
    "shortTitle": "P3. Límite Velocidad",
    "expectedAnswer": "10 Km/hr",
    "icono": "⚡"
  },
  {
    "id": "mantenimiento_2000h",
    "num": 4,
    "bloque": "Mantenimiento & Seguridad",
    "bloqueColor": "#00205b",
    "title": "4. Los trabajos de mantenimiento de 2000 horas requieren permiso de trabajo Y Dpa",
    "shortTitle": "P4. Mantenimiento 2000h",
    "expectedAnswer": "Verdadero",
    "icono": "⚙️"
  },
  {
    "id": "apoyo_personal_cd",
    "num": 5,
    "bloque": "Mantenimiento & Seguridad",
    "bloqueColor": "#00205b",
    "title": "5. Esta prohibido solicitar ayuda al personal del cd para realizar apoyo en los trabajos de mantenimiento de montacargas",
    "shortTitle": "P5. Prohibido Apoyo CD",
    "expectedAnswer": "Verdadero",
    "icono": "🚫"
  },
  {
    "id": "cinco_s",
    "num": 6,
    "bloque": "Orden & Aseo (5S)",
    "bloqueColor": "#10b981",
    "title": "6. Se debe realizar 5´S de la zona después de las actividades de mantenimiento",
    "shortTitle": "P6. Realizar 5'S",
    "expectedAnswer": "Verdadero",
    "icono": "🧹"
  },
  {
    "id": "cambio_metodo",
    "num": 7,
    "bloque": "Gestión del Cambio",
    "bloqueColor": "#00205b",
    "title": "7. Si se presenta cambio en la declaración de metodo, debo reportar y solicitar la aprobación de Abi antes de proceder",
    "shortTitle": "P7. Cambio de Método",
    "expectedAnswer": "Verdadero",
    "icono": "📝"
  },
  {
    "id": "punto_encuentro",
    "num": 8,
    "bloque": "Evacuación & Emergencias",
    "bloqueColor": "#f59e0b",
    "title": "8. El punto de encuentro queda en el área externa del cd",
    "shortTitle": "P8. Punto Encuentro",
    "expectedAnswer": "Verdadero",
    "icono": "📍"
  },
  {
    "id": "alarma_evacuacion",
    "num": 9,
    "bloque": "Evacuación & Emergencias",
    "bloqueColor": "#f59e0b",
    "title": "9. A partir de qué señal sonora del sistema de alarma se debe iniciar el proceso de evacuación hacia el punto de encuentro",
    "shortTitle": "P9. Alarma Sonora",
    "expectedAnswer": "Al tercer pitido",
    "icono": "🔔"
  },
  {
    "id": "evacuacion_contratista",
    "num": 10,
    "bloque": "Evacuación & Emergencias",
    "bloqueColor": "#f59e0b",
    "title": "10. En caso de evacuación en el punto de encuentro se debe ubicar con el personal de su contratista y así facilitar el conteo",
    "shortTitle": "P10. Conteo Contratistas",
    "expectedAnswer": "Verdaero",
    "icono": "🏃"
  },
  {
    "id": "brigadistas",
    "num": 11,
    "bloque": "Evacuación & Emergencias",
    "bloqueColor": "#f59e0b",
    "title": "11. Los brigadistas se identifican con una insignia en el casco",
    "shortTitle": "P11. Brigadistas",
    "expectedAnswer": "Verdadero",
    "icono": "👷"
  },
  {
    "id": "senalizacion_verde",
    "num": 12,
    "bloque": "Evacuación & Emergencias",
    "bloqueColor": "#f59e0b",
    "title": "12. La señalización verde con flechas que me indican",
    "shortTitle": "P12. Señal Verde",
    "expectedAnswer": "Me dice cual es la ruta de evacuación que debo seguir en caso de evacuación",
    "icono": "🟩"
  },
  {
    "id": "info_clara",
    "num": 13,
    "bloque": "Compromiso & Percepción",
    "bloqueColor": "#8b5cf6",
    "title": "13. La información suministrada fue clara",
    "shortTitle": "P13. Claridad Info",
    "expectedAnswer": "Si",
    "icono": "💡"
  },
  {
    "id": "normas_protegen",
    "num": 14,
    "bloque": "Compromiso & Percepción",
    "bloqueColor": "#8b5cf6",
    "title": "14. Las normas de seguridad protegen mi vida y la de otros funcionarios dentro del cd",
    "shortTitle": "P14. Protege la Vida",
    "expectedAnswer": "Si",
    "icono": "❤️"
  }
];

export const checkAnswerCorrectness = (question, answer) => {
  if (answer === undefined || answer === null || answer === "") return false;
  const normAns = String(answer).toLowerCase().replace(/[s.,/]/g, "").trim();
  const normExp = question.expectedAnswer.toLowerCase().replace(/[s.,/]/g, "").trim();
  if (normAns === normExp) return true;
  if (question.expectedAnswer === "Si" && (normAns === "si" || normAns === "sí")) return true;
  if (normExp === "verdaero" && (normAns === "verdadero" || normAns === "verdaero")) return true;
  if (normExp === "verdadero" && (normAns === "verdadero" || normAns === "verdaero")) return true;
  return false;
};

export default function InduccionDistoyotaDashboard() {
  const { currentCity } = useCity();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    records: [],
    kpis: {
      total: 0,
      aprobados: 0,
      reprobados: 0,
      tasaAprobacion: 0,
      promedioPuntuacion: 0,
      promedioCalificacion: 0,
      licenciasVigentes: 0,
      licenciasPorVencer: 0,
      licenciasVencidas: 0
    }
  });

  const [activeTab, setActiveTab] = useState("graficas");
  const [search, setSearch] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState("Todas");
  const [filterLicencia, setFilterLicencia] = useState("Todas");
  const [filterEstadoLic, setFilterEstadoLic] = useState("Todos");

  const [selectedQuestionId, setSelectedQuestionId] = useState(EVALUATION_QUESTIONS[0]?.id || "");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

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
    empresa: "Distoyota",
    nit_empresa: "",
    puntuacion: 100,
    calificacion_proceso: 10,
    respuestas_evaluacion: {
    "normas_seguridad": "Todas las anteriores",
    "permiso_trabajo": "Verdadero",
    "limite_velocidad": "10 Km/hr",
    "mantenimiento_2000h": "Verdadero",
    "apoyo_personal_cd": "Verdadero",
    "cinco_s": "Verdadero",
    "cambio_metodo": "Verdadero",
    "punto_encuentro": "Verdadero",
    "alarma_evacuacion": "Al tercer pitido",
    "evacuacion_contratista": "Verdaero",
    "brigadistas": "Verdadero",
    "senalizacion_verde": "Me dice cual es la ruta de evacuación que debo seguir en caso de evacuación",
    "info_clara": "Si",
    "normas_protegen": "Si"
}
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inducciones/distoyota");
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.records && json.records.length > 0) {
          const initExp = {};
          json.records.forEach((r, idx) => {
            if (idx === 0) initExp[r.id] = true;
          });
          setExpandedRows(initExp);
        }
      }
    } catch (e) {
      console.error("Error al obtener datos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRecords = useMemo(() => {
    return (data.records || []).filter((r) => {
      const matchSearch =
        search === "" ||
        (r.nombre_completo || "").toLowerCase().includes(search.toLowerCase()) ||
        String(r.cedula || "").includes(search) ||
        (r.empresa || "").toLowerCase().includes(search.toLowerCase()) ||
        String(r.celular || "").includes(search);

      const matchEmpresa = filterEmpresa === "Todas" || r.empresa === filterEmpresa;
      const matchLicencia = filterLicencia === "Todas" || r.tipo_licencia === filterLicencia;
      const matchEstadoLic = filterEstadoLic === "Todos" || r.estado_licencia === filterEstadoLic;
      return matchSearch && matchEmpresa && matchLicencia && matchEstadoLic;
    });
  }, [data.records, search, filterEmpresa , filterLicencia, filterEstadoLic]);

  const uniqueEmpresas = useMemo(() => {
    const set = new Set((data.records || []).map((r) => r.empresa).filter(Boolean));
    return Array.from(set);
  }, [data.records]);

  const toggleRowExpand = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandAll = () => {
    const allExpanded = filteredRecords.every((r) => expandedRows[r.id]);
    const nextState = {};
    filteredRecords.forEach((r) => {
      nextState[r.id] = !allExpanded;
    });
    setExpandedRows(nextState);
  };

  // 1. Tasa de Acierto por Cada Pregunta
  const questionsChartData = useMemo(() => {
    const records = filteredRecords.length > 0 ? filteredRecords : (data.records || []);
    const total = records.length;

    return EVALUATION_QUESTIONS.map((q) => {
      let correctos = 0;
      records.forEach((r) => {
        const resp = (r.respuestas_evaluacion || {})[q.id];
        if (checkAnswerCorrectness(q, resp)) correctos++;
      });
      const acierto = total > 0 ? Math.round((correctos / total) * 100) : 100;
      return {
        id: q.id,
        num: q.num,
        tag: "P" + q.num,
        shortTitle: q.shortTitle,
        fullTitle: q.title,
        bloque: q.bloque,
        bloqueColor: q.bloqueColor,
        acierto,
        correctos,
        total,
        fallas: total - correctos
      };
    });
  }, [filteredRecords, data.records]);

  // 2. Rendimiento por Eje Temático
  const thematicBlocksData = useMemo(() => {
    const blockMap = {};
    EVALUATION_QUESTIONS.forEach((q) => {
      if (!blockMap[q.bloque]) {
        blockMap[q.bloque] = { questions: [], color: q.bloqueColor };
      }
      blockMap[q.bloque].questions.push(q);
    });

    const records = filteredRecords.length > 0 ? filteredRecords : (data.records || []);
    return Object.entries(blockMap).map(([name, conf]) => {
      let totalChecks = 0;
      let totalCorrect = 0;

      conf.questions.forEach((q) => {
        records.forEach((r) => {
          totalChecks++;
          const resp = (r.respuestas_evaluacion || {})[q.id];
          if (checkAnswerCorrectness(q, resp)) totalCorrect++;
        });
      });

      const score = totalChecks > 0 ? Math.round((totalCorrect / totalChecks) * 100) : 100;
      return {
        eje: name,
        acierto: score,
        color: conf.color,
        preguntas: conf.questions.length
      };
    });
  }, [filteredRecords, data.records]);

  // 3. Aprobados vs Reprobados
  const approvalChartData = useMemo(() => {
    const records = filteredRecords.length > 0 ? filteredRecords : (data.records || []);
    let aprobados = 0;
    let reprobados = 0;
    records.forEach((r) => {
      if (r.aprobado) aprobados++;
      else reprobados++;
    });
    return [
      { name: "Aprobados (≥80 pts)", value: aprobados, color: "#10b981" },
      { name: "Reprobados (<80 pts)", value: reprobados, color: "#ef4444" }
    ];
  }, [filteredRecords, data.records]);

  // 4. Calificación Satisfacción (1 a 10)
  const satisfactionChartData = useMemo(() => {
    const records = filteredRecords.length > 0 ? filteredRecords : (data.records || []);
    const counts = {};
    for (let i = 1; i <= 10; i++) counts[i] = 0;

    records.forEach((r) => {
      const score = Number(r.calificacion_proceso) || 10;
      if (counts[score] !== undefined) counts[score]++;
      else counts[score] = 1;
    });

    return Object.entries(counts)
      .filter(([rating, count]) => count > 0 || [7, 8, 9, 10].includes(Number(rating)))
      .map(([rating, count]) => ({
        rating: rating + " ⭐",
        evaluados: count
      }));
  }, [filteredRecords, data.records]);

  // 5. Estado de Licencias
  const licenseStatusChartData = useMemo(() => {
    const records = filteredRecords.length > 0 ? filteredRecords : (data.records || []);
    let vigentes = 0;
    let porVencer = 0;
    let vencidas = 0;

    records.forEach((r) => {
      if (r.estado_licencia === "Vencida") vencidas++;
      else if (r.estado_licencia === "Por Vencer") porVencer++;
      else vigentes++;
    });

    return [
      { name: "Vigentes", value: vigentes, color: "#10b981" },
      { name: "Por Vencer (≤30d)", value: porVencer, color: "#f59e0b" },
      { name: "Vencidas", value: vencidas, color: "#ef4444" }
    ].filter((item) => item.value > 0 || records.length === 0);
  }, [filteredRecords, data.records]);

  // 6. Drilldown por Pregunta
  const selectedQuestionObj = useMemo(() => {
    return EVALUATION_QUESTIONS.find((q) => q.id === selectedQuestionId) || EVALUATION_QUESTIONS[0];
  }, [selectedQuestionId]);

  const selectedQuestionDistribution = useMemo(() => {
    const records = filteredRecords.length > 0 ? filteredRecords : (data.records || []);
    const total = records.length;
    const answerCounts = {};

    records.forEach((r) => {
      const resp = (r.respuestas_evaluacion || {})[selectedQuestionObj.id];
      const respStr = resp !== undefined && resp !== null && String(resp).trim() !== "" ? String(resp).trim() : "(Sin responder)";
      answerCounts[respStr] = (answerCounts[respStr] || 0) + 1;
    });

    return Object.entries(answerCounts).map(([ans, count]) => {
      const isCorrect = checkAnswerCorrectness(selectedQuestionObj, ans);
      return {
        answer: ans.length > 42 ? ans.slice(0, 40) + "..." : ans,
        fullAnswer: ans,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        isCorrect,
        color: isCorrect ? "#10b981" : "#ef4444"
      };
    });
  }, [selectedQuestionObj, filteredRecords, data.records]);

  // Exportar a Excel
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
        "NIT Empresa": r.nit_empresa,
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

      EVALUATION_QUESTIONS.forEach((q) => {
        row["P" + q.num + ". " + q.shortTitle] = resp[q.id] || "Sin respuesta";
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Respuestas Distoyota");
    XLSX.writeFile(wb, "Induccion_Distoyota_Evaluaciones_Barrancabermeja.xlsx");
  };

  // Crear Registro en Supabase
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/inducciones/distoyota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setIsNewModalOpen(false);
        await fetchData();
        alert("¡Registro guardado exitosamente en Supabase!");
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
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        
        {/* Barra Superior */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.5rem",
          background: "#ffffff",
          padding: "1rem 1.5rem",
          borderRadius: 16,
          boxShadow: "0 2px 10px rgba(0, 32, 91, 0.05)",
          border: "1px solid #e2e8f0"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
            <Link
              href="/barrancabermeja/inducciones"
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
                gap: "0.45rem",
                boxShadow: "0 2px 6px rgba(0, 32, 91, 0.2)"
              }}
            >
              <span>←</span> Volver a Inducciones
            </Link>

            <span style={{
              background: "rgba(0, 32, 91, 0.08)",
              color: "#00205b",
              fontWeight: 800,
              fontSize: "0.8rem",
              padding: "0.4rem 0.85rem",
              borderRadius: 9999,
              border: "1px solid rgba(0, 32, 91, 0.15)"
            }}>
              📍 Sede: Barrancabermeja
            </span>

            <span style={{
              background: data.source === "supabase" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
              color: data.source === "supabase" ? "#047857" : "#b45309",
              fontWeight: 800,
              fontSize: "0.8rem",
              padding: "0.4rem 0.85rem",
              borderRadius: 9999,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem"
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: data.source === "supabase" ? "#10b981" : "#f59e0b",
                display: "inline-block"
              }} />
              {data.source === "supabase" ? "En Línea: Supabase DB" : "Modo Archivo: Excel Local"}
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handleExportExcel}
              style={{
                background: "#10b981",
                color: "#ffffff",
                border: "none",
                padding: "0.55rem 1.15rem",
                borderRadius: 9999,
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)"
              }}
            >
              📥 Exportar Excel (14 Preguntas)
            </button>

            <button
              onClick={() => setIsNewModalOpen(true)}
              style={{
                background: "#00205b",
                color: "#ffffff",
                border: "none",
                padding: "0.55rem 1.15rem",
                borderRadius: 9999,
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                boxShadow: "0 2px 6px rgba(0, 32, 91, 0.3)"
              }}
            >
              ➕ Registrar Inducción
            </button>
          </div>
        </div>

        {/* Hero Banner */}
        <div style={{
          background: "linear-gradient(135deg, #00205b 0%, #0f172a 100%)",
          borderRadius: 20,
          padding: "1.75rem 2rem",
          color: "#ffffff",
          marginBottom: "1.75rem",
          boxShadow: "0 10px 25px rgba(0, 32, 91, 0.15)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            right: "-20px",
            top: "-20px",
            fontSize: "9rem",
            opacity: 0.07,
            userSelect: "none"
          }}>
            🚜
          </div>

          <div style={{ maxWidth: 850, position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(252, 209, 22, 0.2)", color: "#fcd116", padding: "0.3rem 0.8rem", borderRadius: 9999, fontSize: "0.8rem", fontWeight: 800, marginBottom: "0.75rem" }}>
              📊 ANALÍTICA VISUAL & EVALUACIÓN CONTINUA
            </div>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 900, margin: "0 0 0.5rem 0", letterSpacing: "-0.5px" }}>
              Dashboard Estadístico: Inducción de Distoyota
            </h1>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#cbd5e1", lineHeight: 1.5 }}>
              Monitorea en tiempo real las evaluaciones de seguridad para personal de Distoyota (mantenimiento de montacargas, permisos DPA, 5S y protocolos de CD).
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.75rem"
        }}>
          <div style={{
            background: "#ffffff",
            padding: "1.35rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            borderTop: "5px solid #00205b",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Personas Evaluadas
              </span>
              <span style={{ fontSize: "1.25rem" }}>👥</span>
            </div>
            <div style={{ fontSize: "2.35rem", fontWeight: 900, color: "#00205b" }}>
              {data.kpis.total}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700, marginTop: "0.25rem" }}>
              ✓ Base conectada a Supabase
            </div>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "1.35rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            borderTop: "5px solid #10b981",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Tasa de Aprobación
              </span>
              <span style={{ fontSize: "1.25rem" }}>🎯</span>
            </div>
            <div style={{ fontSize: "2.35rem", fontWeight: 900, color: "#10b981" }}>
              {data.kpis.tasaAprobacion}%
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
              {data.kpis.aprobados} Aprobados • {data.kpis.reprobados} Reprobados
            </div>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "1.35rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            borderTop: "5px solid #fcd116",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Preguntas por Test
              </span>
              <span style={{ fontSize: "1.25rem" }}>📝</span>
            </div>
            <div style={{ fontSize: "2.35rem", fontWeight: 900, color: "#00205b" }}>
              14 Preguntas
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
              Promedio: <strong>{data.kpis.promedioPuntuacion} pts</strong> • Satisfacción: {data.kpis.promedioCalificacion}/10
            </div>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "1.35rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            borderTop: "5px solid #ef4444",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Control de Licencias
              </span>
              <span style={{ fontSize: "1.25rem" }}>🪪</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
              <span style={{ fontSize: "2.35rem", fontWeight: 900, color: data.kpis.licenciasVencidas > 0 ? "#ef4444" : "#10b981" }}>
                {data.kpis.licenciasVencidas}
              </span>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ef4444" }}>Vencidas</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
              {data.kpis.licenciasVigentes} Vigentes • {data.kpis.licenciasPorVencer} Por vencer
            </div>
          </div>
        </div>

        {/* Pestañas */}
        <div style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          background: "#ffffff",
          padding: "0.5rem",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          overflowX: "auto"
        }}>
          <button
            onClick={() => setActiveTab("graficas")}
            style={{
              flex: 1,
              minWidth: 200,
              padding: "0.75rem 1rem",
              borderRadius: 10,
              border: "none",
              background: activeTab === "graficas" ? "#00205b" : "transparent",
              color: activeTab === "graficas" ? "#ffffff" : "#64748b",
              fontWeight: 800,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            <span>📊</span> PANEL DE GRÁFICAS GENERAL
          </button>

          <button
            onClick={() => setActiveTab("matriz")}
            style={{
              flex: 1,
              minWidth: 220,
              padding: "0.75rem 1rem",
              borderRadius: 10,
              border: "none",
              background: activeTab === "matriz" ? "#00205b" : "transparent",
              color: activeTab === "matriz" ? "#ffffff" : "#64748b",
              fontWeight: 800,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            <span>📋</span> RESPUESTAS POR PERSONA ({filteredRecords.length})
          </button>

          <button
            onClick={() => setActiveTab("analisis_preguntas")}
            style={{
              flex: 1,
              minWidth: 220,
              padding: "0.75rem 1rem",
              borderRadius: 10,
              border: "none",
              background: activeTab === "analisis_preguntas" ? "#00205b" : "transparent",
              color: activeTab === "analisis_preguntas" ? "#ffffff" : "#64748b",
              fontWeight: 800,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            <span>🔍</span> GRÁFICA POR PREGUNTA (P1-P14)
          </button>

          <button
            onClick={() => setActiveTab("directorio")}
            style={{
              flex: 1,
              minWidth: 200,
              padding: "0.75rem 1rem",
              borderRadius: 10,
              border: "none",
              background: activeTab === "directorio" ? "#00205b" : "transparent",
              color: activeTab === "directorio" ? "#ffffff" : "#64748b",
              fontWeight: 800,
              fontSize: "0.88rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            <span>🗂️</span> DIRECTORIO & EXCEL
          </button>
        </div>

        {/* Filtros */}
        <div style={{
          background: "#ffffff",
          padding: "1.15rem 1.4rem",
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
          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              type="text"
              placeholder="🔍 Filtrar gráficas por nombre, cédula o empresa..."
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

            <select
              value={filterLicencia}
              onChange={(e) => setFilterLicencia(e.target.value)}
              style={{ padding: "0.6rem 0.85rem", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#00205b", fontWeight: 700, background: "#fff" }}
            >
              <option value="Todas">Licencia: Todas</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
              <option value="C3">C3</option>
            </select>

            <select
              value={filterEstadoLic}
              onChange={(e) => setFilterEstadoLic(e.target.value)}
              style={{ padding: "0.6rem 0.85rem", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#00205b", fontWeight: 700, background: "#fff" }}
            >
              <option value="Todos">Vigencia: Todas</option>
              <option value="Vigente">Vigente</option>
              <option value="Por Vencer">Por Vencer</option>
              <option value="Vencida">Vencida</option>
            </select>
          </div>
        </div>

        {/* TAB 1: GRÁFICAS GENERALES */}
        {activeTab === "graficas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {/* Gráfica de Preguntas */}
            <div style={{
              background: "#ffffff",
              borderRadius: 18,
              padding: "1.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.3rem" }}>📊</span>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#00205b", margin: 0 }}>
                      Gráfica de Acierto por Pregunta (14 Preguntas Oficiales)
                    </h3>
                  </div>
                  <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                    Porcentaje de acierto de los evaluados en cada una de las 14 preguntas de inducción de Distoyota.
                  </p>
                </div>
              </div>

              <div style={{ width: "100%", height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={questionsChartData} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="tag" tick={{ fill: "#00205b", fontSize: 12, fontWeight: 800 }} interval={0} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.85rem 1rem", boxShadow: "0 8px 20px rgba(0, 32, 91, 0.12)", maxWidth: 320 }}>
                              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: item.bloqueColor }}>{item.bloque}</div>
                              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#00205b", margin: "0.2rem 0 0.5rem 0" }}>{item.fullTitle}</div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderTop: "1px dashed #e2e8f0", paddingTop: "0.4rem" }}>
                                <span>Acierto General:</span>
                                <strong style={{ color: item.acierto >= 80 ? "#10b981" : "#ef4444" }}>
                                  {item.acierto}% ({item.correctos}/{item.total})
                                </strong>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="acierto" radius={[6, 6, 0, 0]}>
                      {questionsChartData.map((entry, index) => (
                        <Cell key={"cell-" + index} fill={entry.acierto >= 80 ? entry.bloqueColor : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fila 2: Ejes Temáticos + Aprobación */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
              <div style={{ background: "#ffffff", borderRadius: 18, padding: "1.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>🎯</span>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#00205b", margin: 0 }}>
                    Rendimiento por Ejes Temáticos
                  </h3>
                </div>
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.82rem", color: "#64748b" }}>
                  Desempeño consolidado por áreas de conocimiento de la inducción.
                </p>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={thematicBlocksData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="eje" tick={{ fontSize: 11, fontWeight: 700, fill: "#00205b" }} width={140} />
                      <Tooltip formatter={(val) => [val + "%", "Acierto"]} />
                      <Bar dataKey="acierto" radius={[0, 6, 6, 0]}>
                        {thematicBlocksData.map((entry, index) => (
                          <Cell key={"block-" + index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: 18, padding: "1.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>🍰</span>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#00205b", margin: 0 }}>
                    Resultado Global de Evaluaciones
                  </h3>
                </div>
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.82rem", color: "#64748b" }}>
                  Proporción de evaluados aptos para ingresar o laborar en el CD.
                </p>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={approvalChartData} innerRadius={65} outerRadius={95} paddingAngle={5} dataKey="value">
                        {approvalChartData.map((entry, index) => (
                          <Cell key={"pie-" + index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Fila 3: Calificación Satisfacción + Licencias / Seguridad */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
              <div style={{ background: "#ffffff", borderRadius: 18, padding: "1.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>⭐</span>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#00205b", margin: 0 }}>
                    Calificación de la Inducción por los Participantes
                  </h3>
                </div>
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.82rem", color: "#64748b" }}>
                  Valoración de la calidad de la sesión (escala de 1 a 10).
                </p>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={satisfactionChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="rating" tick={{ fontSize: 11, fontWeight: 700 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="evaluados" fill="#fcd116" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: "#ffffff", borderRadius: 18, padding: "1.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>🪪</span>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#00205b", margin: 0 }}>
                    Vigencia de Licencias de Conducción
                  </h3>
                </div>
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.82rem", color: "#64748b" }}>
                  Control de vigencia para operación vehicular en sede.
                </p>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={licenseStatusChartData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {licenseStatusChartData.map((entry, index) => (
                          <Cell key={"lic-pie-" + index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MATRIZ DE RESPUESTAS POR PERSONA */}
        {activeTab === "matriz" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#00205b", margin: 0 }}>
                  Matriz de Respuestas Individuales ({filteredRecords.length} evaluados)
                </h2>
                <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                  Haz clic en cualquier tarjeta o botón para desplegar las 14 preguntas de esa persona.
                </p>
              </div>

              <button
                onClick={toggleExpandAll}
                style={{
                  background: "#ffffff",
                  color: "#00205b",
                  border: "1px solid #cbd5e1",
                  padding: "0.55rem 1rem",
                  borderRadius: 8,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {filteredRecords.every((r) => expandedRows[r.id]) ? "Contraer Todos" : "Expandir Todos"}
              </button>
            </div>

            {loading ? (
              <div style={{ background: "#ffffff", padding: "3rem", textAlign: "center", borderRadius: 16, color: "#64748b" }}>
                Cargando registros desde Supabase...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div style={{ background: "#ffffff", padding: "3rem", textAlign: "center", borderRadius: 16, color: "#94a3b8" }}>
                No hay registros que coincidan con la búsqueda.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {filteredRecords.map((r, index) => {
                  const isExpanded = expandedRows[r.id];
                  const resp = r.respuestas_evaluacion || {};

                  let aciertosPersona = 0;
                  EVALUATION_QUESTIONS.forEach((q) => {
                    if (checkAnswerCorrectness(q, resp[q.id])) aciertosPersona++;
                  });
                  const porcentajeAcierto = Math.round((aciertosPersona / EVALUATION_QUESTIONS.length) * 100);

                  return (
                    <div
                      key={r.id || index}
                      style={{
                        background: "#ffffff",
                        borderRadius: 16,
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)",
                        overflow: "hidden"
                      }}
                    >
                      <div
                        onClick={() => toggleRowExpand(r.id)}
                        style={{
                          padding: "1.25rem 1.5rem",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "1rem",
                          cursor: "pointer",
                          background: isExpanded ? "rgba(0, 32, 91, 0.02)" : "#ffffff",
                          borderBottom: isExpanded ? "1px solid #e2e8f0" : "none"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: r.aprobado ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            color: r.aprobado ? "#10b981" : "#ef4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.4rem",
                            fontWeight: 900
                          }}>
                            {r.aprobado ? "✓" : "✕"}
                          </div>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#00205b", margin: 0 }}>
                                {r.nombre_completo}
                              </h3>
                              <span style={{
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                padding: "0.2rem 0.6rem",
                                borderRadius: 9999,
                                background: r.aprobado ? "#ecfdf5" : "#fef2f2",
                                color: r.aprobado ? "#047857" : "#b91c1c"
                              }}>
                                {r.aprobado ? "APROBADO" : "REPROBADO"}
                              </span>
                            </div>

                            <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem", display: "flex", gap: "0.85rem", flexWrap: "wrap" }}>
                              <span>🪪 CC: <strong>{r.cedula}</strong></span>
                              <span>🏢 Empresa: <strong>{r.empresa}</strong></span>
                              <span>📅 Fecha: <strong>{r.fecha}</strong></span>
                              <span>🚗 Lic: <strong>{r.tipo_licencia} ({r.estado_licencia})</strong></span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                          <div style={{ minWidth: 140, textAlign: "right" }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b" }}>
                              ACIERTO EVALUACIÓN
                            </div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 900, color: r.aprobado ? "#10b981" : "#ef4444" }}>
                              {porcentajeAcierto}% ({aciertosPersona}/14)
                            </div>
                            <div style={{ width: 140, height: 6, background: "#f1f5f9", borderRadius: 9999, marginTop: 4, overflow: "hidden" }}>
                              <div style={{ width: porcentajeAcierto + "%", height: "100%", background: r.aprobado ? "#10b981" : "#ef4444", borderRadius: 9999 }} />
                            </div>
                          </div>

                          <div style={{ textAlign: "right", minWidth: 80 }}>
                            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b" }}>
                              VALORACIÓN
                            </div>
                            <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#00205b" }}>
                              {r.calificacion_proceso || 10}/10 ⭐
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpand(r.id);
                            }}
                            style={{
                              background: isExpanded ? "#00205b" : "#f1f5f9",
                              color: isExpanded ? "#ffffff" : "#00205b",
                              border: "none",
                              padding: "0.55rem 0.95rem",
                              borderRadius: 8,
                              fontSize: "0.82rem",
                              fontWeight: 800,
                              cursor: "pointer"
                            }}
                          >
                            <span>{isExpanded ? "▲ Ocultar Preguntas" : "▼ Ver Preguntas"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Desglose de Preguntas */}
                      {isExpanded && (
                        <div style={{ padding: "1.5rem", background: "#fbfcfe" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                            <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#00205b", margin: 0 }}>
                              Respuestas completas de {r.nombre_completo} (14 preguntas):
                            </h4>
                            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                              Puntuación oficial registrada: <strong>{r.puntuacion} puntos</strong>
                            </span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem" }}>
                            {EVALUATION_QUESTIONS.map((q) => {
                              const answer = resp[q.id];
                              const isCorrect = checkAnswerCorrectness(q, answer);
                              const hasAnswer = answer !== undefined && answer !== null && answer !== "";

                              return (
                                <div
                                  key={q.id}
                                  style={{
                                    background: "#ffffff",
                                    borderRadius: 12,
                                    padding: "1rem 1.15rem",
                                    border: "1px solid #e2e8f0",
                                    borderLeft: "4px solid " + q.bloqueColor,
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between"
                                  }}
                                >
                                  <div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.35rem" }}>
                                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: q.bloqueColor, background: "rgba(0, 32, 91, 0.05)", padding: "0.15rem 0.45rem", borderRadius: 4 }}>
                                        {q.icono} P{q.num} • {q.bloque}
                                      </span>

                                      <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: 9999, background: isCorrect ? "#ecfdf5" : "#fef2f2", color: isCorrect ? "#059669" : "#dc2626" }}>
                                        {isCorrect ? "✓ Acertada" : "⚠️ Revisar"}
                                      </span>
                                    </div>

                                    <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.6rem", lineHeight: 1.35 }}>
                                      {q.title}
                                    </div>
                                  </div>

                                  <div style={{ background: isCorrect ? "#f0fdf4" : "#fef2f2", border: "1px solid " + (isCorrect ? "#bbf7d0" : "#fecaca"), borderRadius: 8, padding: "0.55rem 0.75rem", fontSize: "0.85rem" }}>
                                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", display: "block" }}>
                                      RESPUESTA DEL EVALUADO:
                                    </span>
                                    <strong style={{ color: isCorrect ? "#166534" : "#991b1b" }}>
                                      {hasAnswer ? String(answer) : "(Sin respuesta)"}
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
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ANÁLISIS ESPECÍFICO POR PREGUNTA */}
        {activeTab === "analisis_preguntas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ background: "#ffffff", padding: "1.25rem", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "0.75rem" }}>
                SELECCIONA UNA PREGUNTA PARA VER SU DISTRIBUCIÓN:
              </span>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(85px, 1fr))", gap: "0.5rem" }}>
                {EVALUATION_QUESTIONS.map((q) => {
                  const isSelected = q.id === selectedQuestionId;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuestionId(q.id)}
                      style={{
                        padding: "0.6rem 0.4rem",
                        borderRadius: 10,
                        border: isSelected ? "2px solid #00205b" : "1px solid #e2e8f0",
                        background: isSelected ? "#00205b" : "#f8fafc",
                        color: isSelected ? "#ffffff" : "#00205b",
                        fontWeight: 800,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.2rem"
                      }}
                    >
                      <span style={{ fontSize: "1.1rem" }}>{q.icono}</span>
                      <span>P{q.num}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#ffffff", borderRadius: 18, padding: "1.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(0, 32, 91, 0.06)", color: "#00205b", padding: "0.25rem 0.65rem", borderRadius: 6, fontSize: "0.78rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                {selectedQuestionObj.icono} Pregunta {selectedQuestionObj.num} • {selectedQuestionObj.bloque}
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#00205b", margin: "0 0 0.5rem 0", lineHeight: 1.35 }}>
                {selectedQuestionObj.title}
              </h3>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.6rem 0.85rem", borderRadius: 8, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#166534", display: "block" }}>
                  RESPUESTA CORRECTA ESPERADA:
                </span>
                <strong style={{ color: "#15803d" }}>{selectedQuestionObj.expectedAnswer}</strong>
              </div>

              <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#00205b", marginBottom: "0.85rem" }}>
                Gráfica: Opciones Marcadas por los Participantes
              </h4>

              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedQuestionDistribution} margin={{ top: 15, right: 30, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="answer" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", padding: "0.75rem 1rem", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#00205b" }}>{d.fullAnswer}</div>
                              <div style={{ fontSize: "0.8rem", color: d.isCorrect ? "#10b981" : "#ef4444", fontWeight: 700, marginTop: "0.25rem" }}>
                                {d.isCorrect ? "✓ Correcta" : "⚠️ Incorrecta"}
                              </div>
                              <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.2rem" }}>
                                Evaluados: <strong>{d.count} ({d.percentage}%)</strong>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {selectedQuestionDistribution.map((entry, idx) => (
                        <Cell key={"q-cell-" + idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {selectedQuestionDistribution.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.65rem 1rem",
                      borderRadius: 8,
                      background: item.isCorrect ? "#f0fdf4" : "#fef2f2",
                      border: "1px solid " + (item.isCorrect ? "#bbf7d0" : "#fecaca")
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "1rem" }}>{item.isCorrect ? "✅" : "❌"}</span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: item.isCorrect ? "#166534" : "#991b1b" }}>
                        {item.fullAnswer}
                      </span>
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 900, color: item.isCorrect ? "#166534" : "#991b1b" }}>
                      {item.count} evaluado(s) ({item.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIRECTORIO & EXCEL */}
        {activeTab === "directorio" && (
          <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#00205b" }}>
                    <th style={{ padding: "0.9rem 1.25rem", fontWeight: 800 }}>PERSONA</th>
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
                    <tr><td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Cargando registros...</td></tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>No se encontraron registros.</td></tr>
                  ) : (
                    filteredRecords.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ fontWeight: 800, color: "#00205b" }}>{r.nombre_completo}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>CC: {r.cedula} • 📞 {r.celular || "S/N"}</div>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 700, color: "#1e293b" }}>{r.empresa}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>NIT: {r.nit_empresa || "123"}</div>
                        </td>

                        <td style={{ padding: "1rem" }}>
                          <span style={{ background: "#f1f5f9", color: "#00205b", padding: "0.25rem 0.65rem", borderRadius: 6, fontWeight: 800, fontSize: "0.85rem", border: "1px solid #cbd5e1" }}>
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
                          <span style={{ fontWeight: 900, fontSize: "1.05rem", color: r.aprobado ? "#10b981" : "#ef4444" }}>
                            {r.puntuacion} pts
                          </span>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            Satisfacción: {r.calificacion_proceso}/10 ⭐
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
                            👁️ Ver Ficha
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

        {/* Modal de Ficha */}
        {selectedRecord && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0, 32, 91, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1.5rem" }}>
            <div style={{ background: "#ffffff", borderRadius: 20, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>EXPEDIENTE INDUCCIÓN</span>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#00205b", margin: "0.2rem 0 0 0" }}>{selectedRecord.nombre_completo}</h2>
                </div>
                <button onClick={() => setSelectedRecord(null)} style={{ background: "#f1f5f9", border: "none", width: 36, height: 36, borderRadius: "50%", cursor: "pointer" }}>✕</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "#f8fafc", padding: "1.25rem", borderRadius: 14, marginBottom: "1.5rem" }}>
                <div><strong>Cédula:</strong> {selectedRecord.cedula}</div>
                <div><strong>Celular:</strong> {selectedRecord.celular || "S/N"}</div>
                <div><strong>Empresa:</strong> {selectedRecord.empresa}</div>
                <div><strong>NIT:</strong> {selectedRecord.nit_empresa || "123"}</div>
                <div><strong>Licencia:</strong> {selectedRecord.tipo_licencia}</div>
                <div><strong>Vencimiento:</strong> {selectedRecord.fecha_vencimiento_licencia} ({selectedRecord.estado_licencia})</div>
                <div><strong>EPS:</strong> {selectedRecord.eps || "N/A"}</div>
                <div><strong>ARL:</strong> {selectedRecord.arl || "N/A"}</div>
                <div><strong>Tipo Sangre:</strong> {selectedRecord.tipo_sangre || "N/A"}</div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong>Contacto Emergencia:</strong> {selectedRecord.contacto_emergencia_nombre || "N/A"} - 📞 {selectedRecord.contacto_emergencia_telefono || "N/A"}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <button onClick={() => setSelectedRecord(null)} style={{ background: "#00205b", color: "#fff", border: "none", padding: "0.6rem 1.4rem", borderRadius: 10, fontWeight: 800, cursor: "pointer" }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Registrar */}
        {isNewModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0, 32, 91, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1.5rem" }}>
            <div style={{ background: "#ffffff", borderRadius: 20, width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#00205b", margin: 0 }}>Registrar Inducción de Distoyota</h3>
                  <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>Se sincronizará en tiempo real con Supabase.</p>
                </div>
                <button onClick={() => setIsNewModalOpen(false)} style={{ background: "#f1f5f9", border: "none", width: 36, height: 36, borderRadius: "50%", cursor: "pointer" }}>✕</button>
              </div>

              <form onSubmit={handleCreateRecord}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>Nombre Completo *</label>
                    <input required type="text" value={formData.nombre_completo} onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })} style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>Cédula *</label>
                    <input required type="text" value={formData.cedula} onChange={(e) => setFormData({ ...formData, cedula: e.target.value })} style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>Celular</label>
                    <input type="text" value={formData.celular} onChange={(e) => setFormData({ ...formData, celular: e.target.value })} style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>Empresa</label>
                    <input type="text" value={formData.empresa} onChange={(e) => setFormData({ ...formData, empresa: e.target.value })} style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>Tipo Licencia</label>
                    <select value={formData.tipo_licencia} onChange={(e) => setFormData({ ...formData, tipo_licencia: e.target.value })} style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }}>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                      <option value="C3">C3</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>Vencimiento Licencia</label>
                    <input type="date" value={formData.fecha_vencimiento_licencia} onChange={(e) => setFormData({ ...formData, fecha_vencimiento_licencia: e.target.value })} style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>Puntuación (0-100)</label>
                    <input type="number" min="0" max="100" value={formData.puntuacion} onChange={(e) => setFormData({ ...formData, puntuacion: Number(e.target.value) })} style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>Calificación Proceso (1-10)</label>
                    <input type="number" min="1" max="10" value={formData.calificacion_proceso} onChange={(e) => setFormData({ ...formData, calificacion_proceso: Number(e.target.value) })} style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button type="button" onClick={() => setIsNewModalOpen(false)} style={{ background: "#f1f5f9", color: "#64748b", border: "none", padding: "0.6rem 1.25rem", borderRadius: 10, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
                  <button type="submit" disabled={submitting} style={{ background: "#00205b", color: "#ffffff", border: "none", padding: "0.6rem 1.5rem", borderRadius: 10, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer" }}>
                    {submitting ? "Guardando..." : "Guardar Registro"}
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
