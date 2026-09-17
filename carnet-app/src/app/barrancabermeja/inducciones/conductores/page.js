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

const COLORS = ["#00205b", "#fcd116", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

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
  const [error, setError] = useState(null);

  // Estados de filtros y búsqueda
  const [search, setSearch] = useState("");
  const [filterEmpresa, setFilterEmpresa] = useState("Todas");
  const [filterLicencia, setFilterLicencia] = useState("Todas");
  const [filterEstadoLic, setFilterEstadoLic] = useState("Todos");
  const [filterResultado, setFilterResultado] = useState("Todos");

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
    calificacion_proceso: 10
  });

  // Cargar datos desde la API conectada a Supabase
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inducciones/conductores");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || "Error al cargar datos");
      }
    } catch (e) {
      console.error(e);
      setError("No se pudo conectar con el servidor");
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

      const matchResultado =
        filterResultado === "Todos" ||
        (filterResultado === "Aprobado" && r.aprobado) ||
        (filterResultado === "Reprobado" && !r.aprobado);

      return (
        matchSearch &&
        matchEmpresa &&
        matchLicencia &&
        matchEstadoLic &&
        matchResultado
      );
    });
  }, [data.records, search, filterEmpresa, filterLicencia, filterEstadoLic, filterResultado]);

  // Lista única de empresas para el select
  const uniqueEmpresas = useMemo(() => {
    const set = new Set((data.records || []).map((r) => r.empresa).filter(Boolean));
    return Array.from(set);
  }, [data.records]);

  // Exportar a Excel
  const handleExportExcel = () => {
    if (!filteredRecords.length) return;
    const exportData = filteredRecords.map((r, i) => ({
      "#": i + 1,
      "Fecha": r.fecha || "",
      "Nombre Completo": r.nombre_completo,
      "Cédula": r.cedula,
      "Celular": r.celular,
      "Tipo Licencia": r.tipo_licencia,
      "Vencimiento Licencia": r.fecha_vencimiento_licencia,
      "Estado Licencia": r.estado_licencia,
      "Empresa": r.empresa,
      "NIT / CC": r.nit_empresa,
      "EPS": r.eps,
      "AFP": r.afp,
      "ARL": r.arl,
      "Tipo Sangre": r.tipo_sangre,
      "Contacto Emergencia": r.contacto_emergencia_nombre,
      "Tel. Emergencia": r.contacto_emergencia_telefono,
      "Puntuación": r.puntuacion,
      "Resultado": r.aprobado ? "APROBADO" : "REPROBADO",
      "Calificación Proceso": r.calificacion_proceso
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Induccion Conductores");
    XLSX.writeFile(wb, "Induccion_Conductores_Barrancabermeja.xlsx");
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
        setFormData({
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
          calificacion_proceso: 10
        });
        await fetchData();
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
      <div style={{ maxWidth: 1360, margin: "0 auto" }}>
        
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
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
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
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Indicador de Origen / Conexión */}
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
              {data.source === "supabase" ? "⚡ Supabase Online" : "📁 Datos Excel Local"}
            </span>

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
            >
              <span>📥</span> EXPORTAR EXCEL
            </button>
          </div>
        </div>

        {/* Encabezado Principal */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <span style={{
              background: "#00205b",
              color: "#fcd116",
              padding: "0.4rem 0.9rem",
              borderRadius: 8,
              fontWeight: 900,
              fontSize: "1.2rem"
            }}>
              🚚
            </span>
            <h1 style={{
              fontSize: "2.1rem",
              fontWeight: 900,
              color: "#00205b",
              margin: 0,
              letterSpacing: "-0.01em"
            }}>
              INDUCCIÓN DE CONDUCTORES
            </h1>
          </div>
          <p style={{ color: "#64748b", margin: 0, fontSize: "1rem" }}>
            Tablero interactivo de seguimiento, evaluación y verificación de inducciones de conductores para la sede Barrancabermeja.
          </p>
        </div>

        {/* Tarjetas de Métricas (KPIs) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem"
        }}>
          {/* KPI 1: Total Conductores */}
          <div style={{
            background: "#ffffff",
            padding: "1.5rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)",
            borderTop: "5px solid #00205b"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Total Inducidos
              </span>
              <span style={{ fontSize: "1.2rem" }}>👥</span>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#00205b" }}>
              {data.kpis.total}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700, marginTop: "0.3rem" }}>
              ✓ 100% Evaluados en CD
            </div>
          </div>

          {/* KPI 2: Tasa de Aprobación */}
          <div style={{
            background: "#ffffff",
            padding: "1.5rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)",
            borderTop: "5px solid #10b981"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Tasa Aprobación
              </span>
              <span style={{ fontSize: "1.2rem" }}>🎯</span>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#10b981" }}>
              {data.kpis.tasaAprobacion}%
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.3rem" }}>
              {data.kpis.aprobados} Aprobados • {data.kpis.reprobados} Reprobados
            </div>
          </div>

          {/* KPI 3: Promedio Puntuación */}
          <div style={{
            background: "#ffffff",
            padding: "1.5rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)",
            borderTop: "5px solid #fcd116"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Promedio Evaluación
              </span>
              <span style={{ fontSize: "1.2rem" }}>📝</span>
            </div>
            <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#00205b" }}>
              {data.kpis.promedioPuntuacion} / 100
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.3rem" }}>
              Calidad proceso: <strong>{data.kpis.promedioCalificacion}/10</strong>
            </div>
          </div>

          {/* KPI 4: Estado de Licencias */}
          <div style={{
            background: "#ffffff",
            padding: "1.5rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)",
            borderTop: "5px solid #ef4444"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Alertas Licencias
              </span>
              <span style={{ fontSize: "1.2rem" }}>🪪</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
              <span style={{ fontSize: "2.2rem", fontWeight: 900, color: data.kpis.licenciasVencidas > 0 ? "#ef4444" : "#10b981" }}>
                {data.kpis.licenciasVencidas}
              </span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ef4444" }}>Vencidas</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.3rem" }}>
              {data.kpis.licenciasVigentes} Vigentes • {data.kpis.licenciasPorVencer} Por Vencer
            </div>
          </div>
        </div>

        {/* Sección de Gráficas Interactivas */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem"
        }}>
          {/* Gráfica 1: Distribución por Empresa Transportadora */}
          <div style={{
            background: "#ffffff",
            padding: "1.5rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
          }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#00205b", marginBottom: "1rem" }}>
              🏢 Conductores por Empresa / Aliado
            </h3>
            {data.stats.distEmpresas.length > 0 ? (
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.stats.distEmpresas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                    <Tooltip
                      formatter={(val) => [val, "Conductores"]}
                      contentStyle={{ background: "#00205b", color: "#fff", borderRadius: 8 }}
                    />
                    <Bar dataKey="count" fill="#00205b" radius={[6, 6, 0, 0]}>
                      {data.stats.distEmpresas.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
                Sin datos suficientes para graficar
              </div>
            )}
          </div>

          {/* Gráfica 2: Distribución por Tipo de Licencia */}
          <div style={{
            background: "#ffffff",
            padding: "1.5rem",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)"
          }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#00205b", marginBottom: "1rem" }}>
              🪪 Categoría de Licencias de Conducción
            </h3>
            {data.stats.distLicencias.length > 0 ? (
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.stats.distLicencias}
                      dataKey="total"
                      nameKey="tipo"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ tipo, total }) => `${tipo}: ${total}`}
                    >
                      {data.stats.distLicencias.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#00205b", color: "#fff", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#94a3b8" }}>
                Sin datos suficientes para graficar
              </div>
            )}
          </div>
        </div>

        {/* Tabla Interactiva de Conductores */}
        <div style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 15px rgba(0, 32, 91, 0.04)",
          overflow: "hidden"
        }}>
          {/* Barra de Filtros */}
          <div style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            {/* Buscador */}
            <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
              <input
                type="text"
                placeholder="🔍 Buscar por nombre, cédula, empresa o celular..."
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

            {/* Selects de Filtro */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
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
                  fontWeight: 600,
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
                  fontWeight: 600,
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
                  fontWeight: 600,
                  background: "#fff"
                }}
              >
                <option value="Todos">Estado Lic: Todos</option>
                <option value="Vigente">Vigente</option>
                <option value="Por Vencer">Por Vencer</option>
                <option value="Vencida">Vencida</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
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
                      Cargando registros de inducción desde Supabase...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
                      No se encontraron conductores con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const isLicVencida = r.estado_licencia === "Vencida";
                    const isLicPorVencer = r.estado_licencia === "Por Vencer";

                    return (
                      <tr
                        key={r.id}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background 0.15s ease"
                        }}
                      >
                        {/* Conductor */}
                        <td style={{ padding: "1rem 1.25rem" }}>
                          <div style={{ fontWeight: 800, color: "#00205b" }}>{r.nombre_completo}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            CC: {r.cedula} • 📞 {r.celular || "S/N"}
                          </div>
                        </td>

                        {/* Empresa */}
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontWeight: 700, color: "#1e293b" }}>{r.empresa || "Kopps"}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>NIT: {r.nit_empresa || "123"}</div>
                        </td>

                        {/* Licencia */}
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

                        {/* Vencimiento y Estado */}
                        <td style={{ padding: "1rem" }}>
                          <div>{r.fecha_vencimiento_licencia || "N/A"}</div>
                          <span style={{
                            display: "inline-block",
                            marginTop: "0.25rem",
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            padding: "0.2rem 0.55rem",
                            borderRadius: 9999,
                            background: isLicVencida ? "#fee2e2" : isLicPorVencer ? "#fef3c7" : "#ecfdf5",
                            color: isLicVencida ? "#b91c1c" : isLicPorVencer ? "#b45309" : "#047857"
                          }}>
                            {r.estado_licencia}
                          </span>
                        </td>

                        {/* EPS / ARL */}
                        <td style={{ padding: "1rem" }}>
                          <div style={{ fontSize: "0.85rem" }}>EPS: {r.eps || "N/A"}</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>ARL: {r.arl || "N/A"}</div>
                        </td>

                        {/* Evaluación */}
                        <td style={{ padding: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{
                              fontWeight: 900,
                              fontSize: "1.05rem",
                              color: r.aprobado ? "#10b981" : "#ef4444"
                            }}>
                              {r.puntuacion} pts
                            </span>
                            <span style={{
                              fontSize: "0.7rem",
                              fontWeight: 800,
                              padding: "0.15rem 0.45rem",
                              borderRadius: 4,
                              background: r.aprobado ? "#d1fae5" : "#fee2e2",
                              color: r.aprobado ? "#065f46" : "#991b1b"
                            }}>
                              {r.aprobado ? "APROBADO" : "REPROBADO"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                            Fecha: {r.fecha || "Reciente"}
                          </div>
                        </td>

                        {/* Acciones */}
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
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem"
                            }}
                          >
                            <span>👁️</span> Ver Detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Detalle Completo de Inducción */}
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
              maxWidth: 820,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
              border: "1px solid #e2e8f0"
            }}>
              {/* Header Modal */}
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
                    fontWeight: 800,
                    textTransform: "uppercase"
                  }}>
                    Expediente de Inducción
                  </span>
                  <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#ffffff", margin: "0.4rem 0 0 0" }}>
                    {selectedRecord.nombre_completo}
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1" }}>
                    Cédula: {selectedRecord.cedula} • Empresa: {selectedRecord.empresa}
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
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Contenido Modal */}
              <div style={{ padding: "2rem" }}>
                {/* Resumen Superior */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.75rem",
                  background: "#f8fafc",
                  padding: "1.25rem",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0"
                }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>LICENCIA</span>
                    <div style={{ fontWeight: 800, color: "#00205b" }}>{selectedRecord.tipo_licencia}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Vence: {selectedRecord.fecha_vencimiento_licencia}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>EVALUACIÓN</span>
                    <div style={{ fontWeight: 900, color: "#10b981", fontSize: "1.1rem" }}>
                      {selectedRecord.puntuacion} / 100
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Calificación: {selectedRecord.calificacion_proceso}/10</div>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>SEGURIDAD SOCIAL</span>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.85rem" }}>EPS: {selectedRecord.eps}</div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>ARL: {selectedRecord.arl}</div>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>EMERGENCIA</span>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.85rem" }}>
                      {selectedRecord.contacto_emergencia_nombre}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Tel: {selectedRecord.contacto_emergencia_telefono}</div>
                  </div>
                </div>

                {/* Respuestas de la Evaluación de Seguridad */}
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#00205b", marginBottom: "1rem" }}>
                  📋 Respuestas del Conductor a la Evaluación de Seguridad
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {selectedRecord.respuestas_evaluacion && Object.keys(selectedRecord.respuestas_evaluacion).length > 0 ? (
                    Object.entries(selectedRecord.respuestas_evaluacion).map(([key, val], idx) => (
                      <div
                        key={key}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 10,
                          padding: "0.85rem 1rem"
                        }}
                      >
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#00205b", marginBottom: "0.25rem" }}>
                          Pregunta #{idx + 1} ({key.replace(/_/g, ' ').toUpperCase()})
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#334155", fontWeight: 500 }}>
                          ✓ Respuesta: <strong>{String(val)}</strong>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#94a3b8" }}>No hay detalle específico de preguntas registrado.</p>
                  )}
                </div>

                {/* Botón de Cierre */}
                <div style={{ marginTop: "2rem", textAlign: "right" }}>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    style={{
                      background: "#00205b",
                      color: "#fff",
                      border: "none",
                      padding: "0.65rem 1.5rem",
                      borderRadius: 10,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Nuevo Conductor */}
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
              maxWidth: 720,
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
                  ➕ Registrar Nueva Inducción de Conductor
                </h2>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  style={{ background: "none", border: "none", color: "#fff", fontSize: "1.2rem", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateRecord} style={{ padding: "2rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
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
                      Cédula / Documento *
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

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>
                      EPS
                    </label>
                    <input
                      type="text"
                      value={formData.eps}
                      onChange={(e) => setFormData({ ...formData, eps: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#00205b", marginBottom: 4 }}>
                      ARL
                    </label>
                    <input
                      type="text"
                      value={formData.arl}
                      onChange={(e) => setFormData({ ...formData, arl: e.target.value })}
                      style={{ width: "100%", padding: "0.6rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
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
                    {submitting ? "Guardando en Supabase..." : "Guardar en Supabase"}
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
