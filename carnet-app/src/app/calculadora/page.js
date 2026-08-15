"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function CalculadoraPage() {
  // -------------------------------------------------------------
  // 1. ESTADOS CALCULADORA CRONOLÓGICA (08-01-2020)
  // -------------------------------------------------------------
  const FIXED_BASE_DATE = "2020-01-08";

  const [baseDate, setBaseDate] = useState(FIXED_BASE_DATE);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // -------------------------------------------------------------
  // 2. ESTADOS PIRÁMIDE DE SEGURIDAD PEREIRA
  // -------------------------------------------------------------
  const defaultPyramidData = {
    fat_sif: 0,
    fat_nosif: 0,
    lti_sif: 0,
    lti_nosif: 0,
    mdi_sif: 0,
    mdi_nosif: 0,
    mti_sif: 0,
    mti_nosif: 0,
    fai_sif: 1,
    fai_nosif: 0,
    incidentes_sif: 319,
    incidentes_nosif: 0,
    sif_actual: 0,
    sif_potencial: 2,
    sif_precursor: 318,
    dias_sin_lti: 3122,
    comentarios: "• FAI – SIF POTENCIAL – 22 JULIO 2026\nEvento en taller aliado (golpe con objeto a colaborador)."
  };

  const [pyramid, setPyramid] = useState(defaultPyramidData);
  const [isPyramidEditOpen, setIsPyramidEditOpen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    try {
      const saved = localStorage.getItem("piramide_pereira_2026");
      if (saved) {
        setPyramid(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }

    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSavePyramid = (newPyramidData) => {
    setPyramid(newPyramidData);
    try {
      localStorage.setItem("piramide_pereira_2026", JSON.stringify(newPyramidData));
    } catch (e) {
      console.error(e);
    }
  };

  const updatePyramidField = (field, value) => {
    const updated = { ...pyramid, [field]: value };
    handleSavePyramid(updated);
  };

  // Cálculos estadísticos calculadora
  const stats = useMemo(() => {
    const [bYear, bMonth, bDay] = baseDate.split("-").map(Number);
    const start = new Date(bYear, bMonth - 1, bDay, 0, 0, 0, 0);
    const now = currentDate;

    const diffMs = now.getTime() - start.getTime();
    const absDiffMs = Math.abs(diffMs);

    const totalDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((absDiffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((absDiffMs / 1000) % 60);

    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = Math.floor(absDiffMs / (1000 * 60 * 60));

    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const nextAnniversary = new Date(now.getFullYear(), bMonth - 1, bDay);
    if (nextAnniversary < now) {
      nextAnniversary.setFullYear(now.getFullYear() + 1);
    }
    const daysToNextAnniversary = Math.ceil(
      (nextAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const currentMonthName = now
      .toLocaleDateString("es-CO", { month: "long" })
      .toUpperCase();

    const chartData = [
      { name: "2020", dias: 358 },
      { name: "2021", dias: 723 },
      { name: "2022", dias: 1088 },
      { name: "2023", dias: 1453 },
      { name: "2024", dias: 1819 },
      { name: "2025", dias: 2184 },
      { name: "2026", dias: totalDays }
    ];

    return {
      totalDays,
      daysFormatted: totalDays.toLocaleString("es-CO") + ",0",
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      totalWeeks,
      totalHours,
      daysToNextAnniversary,
      nextAnniversaryYear: nextAnniversary.getFullYear(),
      currentMonthName,
      chartData
    };
  }, [baseDate, currentDate]);

  const totalSifCalculado = useMemo(() => {
    return Number(pyramid.sif_actual || 0) + Number(pyramid.sif_potencial || 0) + Number(pyramid.sif_precursor || 0);
  }, [pyramid.sif_actual, pyramid.sif_potencial, pyramid.sif_precursor]);

  const handleCopySummary = () => {
    const text = `📊 INFORME EJECUTIVO - AB INBEV CD PEREIRA:\n• Días Transcurridos: ${stats.daysFormatted}\n• Tiempo Exacto: ${stats.years} Años, ${stats.months}m, ${stats.days}d\n• Días sin LTI: ${pyramid.dias_sin_lti}\n• SIF Total: ${totalSifCalculado} (Actual: ${pyramid.sif_actual}, Potencial: ${pyramid.sif_potencial}, Precursor: ${pyramid.sif_precursor})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetToFixed = () => {
    setBaseDate(FIXED_BASE_DATE);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        padding: "0.6rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#00205b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box"
      }}
    >
      {/* Contenedor Principal Unificado: Lámina Completa 16:9 en Una Sola Pantalla */}
      <div
        style={{
          width: "100%",
          maxWidth: "1400px",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.35)",
          border: "1px solid #cbd5e1",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box"
        }}
      >
        {/* ============================================================
            1. CABECERA MAESTRA UNIFICADA (AB INBEV + CD PEREIRA)
           ============================================================ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            minHeight: "58px"
          }}
        >
          {/* Logo y Título Principal */}
          <div
            style={{
              padding: "0.4rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.8rem",
              flex: 1,
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  backgroundColor: "#fcd116",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    border: "2px solid #00205b",
                    borderRadius: "50%"
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "900",
                  color: "#00205b",
                  letterSpacing: "-0.03em"
                }}
              >
                ABInBev
              </span>
            </div>

            <div style={{ borderLeft: "2px solid #cbd5e1", height: "28px" }} />

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  fontWeight: "900",
                  color: "#00205b",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase"
                }}
              >
                INDICADOR CRONOLÓGICO & PIRÁMIDE DE INCIDENTES 2026
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.1rem" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: "800", color: "#00205b", textTransform: "uppercase" }}>
                  SEGUIMIENTO DIARIO
                </span>
                <span
                  style={{
                    backgroundColor: "#fcd116",
                    color: "#00205b",
                    fontSize: "0.65rem",
                    fontWeight: "900",
                    padding: "0.1rem 0.5rem",
                    borderRadius: "10px",
                    textTransform: "uppercase"
                  }}
                >
                  CENTRO DE DISTRIBUCIÓN | PEREIRA
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Control Rápidos */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem" }}>
            <button
              onClick={() => setIsPyramidEditOpen(true)}
              style={{
                background: "#fcd116",
                color: "#00205b",
                border: "none",
                padding: "0.3rem 0.7rem",
                borderRadius: "6px",
                fontWeight: "900",
                fontSize: "0.72rem",
                cursor: "pointer"
              }}
            >
              ✏️ Editar
            </button>
            <button
              onClick={handleCopySummary}
              style={{
                background: copied ? "#10b981" : "#f1f5f9",
                color: copied ? "#ffffff" : "#00205b",
                border: "1px solid #cbd5e1",
                padding: "0.3rem 0.7rem",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "0.72rem",
                cursor: "pointer"
              }}
            >
              {copied ? "✓ Copiado" : "📋 Copiar"}
            </button>
            <button
              onClick={toggleFullscreen}
              style={{
                background: "#f1f5f9",
                color: "#00205b",
                border: "1px solid #cbd5e1",
                padding: "0.3rem 0.7rem",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "0.72rem",
                cursor: "pointer"
              }}
            >
              🖥️ {isFullscreen ? "Salir" : "Pantalla Completa"}
            </button>
            <Link
              href="/"
              style={{
                background: "#00205b",
                color: "#ffffff",
                padding: "0.3rem 0.7rem",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "0.72rem",
                textDecoration: "none"
              }}
            >
              Panel
            </Link>
          </div>

          {/* Banner Slogan */}
          <div
            style={{
              backgroundColor: "#00205b",
              color: "#ffffff",
              padding: "0.4rem 1.4rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              clipPath: "polygon(12% 0%, 100% 0%, 100% 100%, 0% 100%)",
              minWidth: "170px"
            }}
          >
            <span style={{ fontSize: "0.55rem", fontWeight: "700", textTransform: "uppercase" }}>MEJORAMOS JUNTOS</span>
            <span style={{ fontSize: "0.55rem", fontWeight: "700", textTransform: "uppercase" }}>PARA SER</span>
            <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "#fcd116", textTransform: "uppercase" }}>LOS MEJORES</span>
          </div>
        </div>

        {/* Cinta tricolor */}
        <div style={{ display: "flex", height: "3px", width: "100%" }}>
          <div style={{ flex: 6, backgroundColor: "#00205b" }} />
          <div style={{ flex: 3, backgroundColor: "#fcd116" }} />
          <div style={{ flex: 1, backgroundColor: "#dc2626" }} />
        </div>

        {/* ============================================================
            2. GRID PRINCIPAL: 2 COLUMNAS PERFECTAMENTE EQUILIBRADAS
           ============================================================ */}
        <div
          style={{
            padding: "0.6rem 0.8rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.8rem",
            alignItems: "stretch"
          }}
        >
          
          {/* ----------------------------------------------------------
              COLUMNA IZQUIERDA: CALCULADORA DE DÍAS Y PLAN DE ACCIÓN
             ---------------------------------------------------------- */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              justifyContent: "space-between",
              borderRight: "1px solid #e2e8f0",
              paddingRight: "0.8rem"
            }}
          >
            {/* Fila Superior: 3 Mini Tarjetas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr 1fr", gap: "0.4rem" }}>
              
              {/* Tarjeta 1: Fecha Base */}
              <div
                style={{
                  backgroundColor: "#00205b",
                  borderRadius: "8px",
                  padding: "0.4rem 0.6rem",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.9rem" }}>🗓️</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.55rem", fontWeight: "800", color: "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>FECHA BASE</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "#fcd116", lineHeight: "1" }}>08-01-2020</div>
                  <div style={{ fontSize: "0.55rem", color: "#93c5fd" }}>Fija Inicial</div>
                </div>
              </div>

              {/* Tarjeta 2: Gran Número Central */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  padding: "0.3rem 0.5rem",
                  textAlign: "center",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <span style={{ fontSize: "0.62rem", fontWeight: "900", color: "#00205b", textTransform: "uppercase" }}>{stats.currentMonthName} 2026</span>
                <div style={{ fontSize: "1.85rem", fontWeight: "900", color: "#00205b", lineHeight: "1", margin: "0.05rem 0", fontVariantNumeric: "tabular-nums" }}>
                  {isClient ? stats.daysFormatted : "2.410,0"}
                </div>
                <div style={{ width: "70%", height: "1.5px", backgroundColor: "#00205b", marginBottom: "0.1rem" }} />
                <span style={{ fontSize: "0.52rem", fontWeight: "800", color: "#00205b", textTransform: "uppercase" }}>DÍAS TRANSCURRIDOS</span>
              </div>

              {/* Tarjeta 3: Tiempo Exacto */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "8px",
                  padding: "0.4rem 0.6rem",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid #fcd116", backgroundColor: "#fffdf0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.9rem" }}>⏱️</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.55rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>ACUMULADO</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#00205b", lineHeight: "1" }}>{stats.years}a, {stats.months}m, {stats.days}d</div>
                  <div style={{ fontSize: "0.55rem", color: "#64748b" }}>{isClient ? `${stats.hours}h ${stats.minutes}m ${stats.seconds}s` : "En vivo"}</div>
                </div>
              </div>

            </div>

            {/* Fila Media: Gráfico Recharts + Hallazgos */}
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "0.5rem" }}>
              
              {/* Gráfico */}
              <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "0.3rem 0.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ textAlign: "center", marginBottom: "0.1rem" }}>
                  <span style={{ backgroundColor: "#00205b", color: "#ffffff", padding: "0.1rem 0.6rem", borderRadius: "10px", fontSize: "0.58rem", fontWeight: "800", textTransform: "uppercase" }}>
                    TENDENCIA (2020 - 2026)
                  </span>
                </div>
                <div style={{ width: "100%", height: "80px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.chartData} margin={{ top: 4, right: 6, left: -36, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={7.5} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
                      <YAxis stroke="#64748b" fontSize={7.5} tickLine={false} axisLine={false} domain={[0, 2600]} />
                      <Tooltip formatter={(val) => [`${val} días`, "Días"]} />
                      <Line type="monotone" dataKey="dias" stroke="#00205b" strokeWidth={2} dot={{ fill: "#00205b", stroke: "#fcd116", strokeWidth: 1, r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.52rem", color: "#64748b", fontWeight: "700", borderTop: "1px solid #f1f5f9", paddingTop: "0.1rem" }}>
                  <span>08/01/2020</span>
                  <span>Hoy: {stats.totalDays.toLocaleString("es-CO")} días</span>
                </div>
              </div>

              {/* Hallazgos */}
              <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "0.3rem 0.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ textAlign: "center", marginBottom: "0.1rem" }}>
                  <span style={{ backgroundColor: "#00205b", color: "#ffffff", padding: "0.1rem 0.6rem", borderRadius: "10px", fontSize: "0.58rem", fontWeight: "800", textTransform: "uppercase" }}>
                    HALLAZGOS & HITOS
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#dc2626", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.55rem" }}>📉</span>
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "#1e293b", lineHeight: "1.15" }}>
                      Faltan <strong style={{ color: "#dc2626" }}>{stats.daysToNextAnniversary} días</strong> para {stats.years + 1} años.
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fcd116", color: "#00205b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.55rem" }}>⚡</span>
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "#1e293b", lineHeight: "1.15" }}>
                      Acumulado: <strong>{stats.totalHours.toLocaleString("es-CO")} hrs</strong> y <strong>{stats.totalWeeks} sem</strong>.
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#00205b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "0.55rem" }}>🔍</span>
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "#1e293b", lineHeight: "1.15" }}>
                      Cálculo continuo 24/7 sin incidentes.
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Fila Inferior: Plan de Acción (5 Círculos) */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "0.3rem 0.5rem" }}>
              <div style={{ textAlign: "center", marginBottom: "0.2rem" }}>
                <span style={{ backgroundColor: "#00205b", color: "#ffffff", padding: "0.1rem 0.8rem", borderRadius: "10px", fontSize: "0.58rem", fontWeight: "800", textTransform: "uppercase" }}>
                  PLAN DE ACCIÓN
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.3rem", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#00205b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.55rem" }}>📅</span>
                  </div>
                  <div style={{ fontSize: "0.52rem", color: "#1e293b", fontWeight: "600", lineHeight: "1" }}>Seguimiento diario.</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fcd116", color: "#00205b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.55rem" }}>👤</span>
                  </div>
                  <div style={{ fontSize: "0.52rem", color: "#1e293b", fontWeight: "600", lineHeight: "1" }}>Novedades en ruta.</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#dc2626", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.55rem" }}>📍</span>
                  </div>
                  <div style={{ fontSize: "0.52rem", color: "#1e293b", fontWeight: "600", lineHeight: "1" }}>Puntos clave.</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#00205b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.55rem" }}>📈</span>
                  </div>
                  <div style={{ fontSize: "0.52rem", color: "#1e293b", fontWeight: "600", lineHeight: "1" }}>Monitoreo semanal.</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fcd116", color: "#00205b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.55rem" }}>📢</span>
                  </div>
                  <div style={{ fontSize: "0.52rem", color: "#1e293b", fontWeight: "600", lineHeight: "1" }}>Rutina operativa.</div>
                </div>
              </div>
            </div>

          </div>

          {/* ----------------------------------------------------------
              COLUMNA DERECHA: PIRÁMIDE DE INCIDENTES 2026 PEREIRA
             ---------------------------------------------------------- */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
              justifyContent: "space-between"
            }}
          >
            {/* Cabecera Interna Pirámide */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "6px", backgroundColor: "#fcd116", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #00205b" }}>
                  <span style={{ fontSize: "0.85rem" }}>🛡️</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#00205b", textTransform: "uppercase" }}>
                    PIRÁMIDE DE INCIDENTES 2026
                  </span>
                  <span style={{ marginLeft: "0.3rem", fontSize: "0.75rem", fontWeight: "900", color: "#fcd116" }}>
                    PEREIRA
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "0.58rem", color: "#64748b", fontWeight: "600" }}>
                Clic en números para editar
              </span>
            </div>

            {/* Pirámide + Panel SIF */}
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "0.5rem", alignItems: "stretch" }}>
              
              {/* Pirámide Escalonada (6 Niveles) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                
                {/* 1. FAT */}
                <div style={{ display: "flex", alignItems: "center", height: "26px" }}>
                  <div style={{ width: "70px", backgroundColor: "#ea580c", color: "#fff", fontWeight: "900", fontSize: "0.68rem", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", borderRadius: "4px 0 0 4px", clipPath: "polygon(14% 0%, 100% 0%, 100% 100%, 0% 100%)" }}>FAT</div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", border: "2px solid #dc2626", borderBottom: "none", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <input type="number" value={pyramid.fat_sif} onChange={(e) => updatePyramidField("fat_sif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.82rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }} />
                  </div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(0% 0%, 86% 0%, 100% 100%, 0% 100%)" }}>
                    <input type="number" value={pyramid.fat_nosif} onChange={(e) => updatePyramidField("fat_nosif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.82rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }} />
                  </div>
                </div>

                {/* 2. LTI */}
                <div style={{ display: "flex", alignItems: "center", height: "26px" }}>
                  <div style={{ width: "78px", backgroundColor: "#f97316", color: "#fff", fontWeight: "900", fontSize: "0.68rem", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", borderRadius: "4px 0 0 4px", clipPath: "polygon(12% 0%, 100% 0%, 100% 100%, 0% 100%)" }}>LTI</div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", borderLeft: "2px solid #dc2626", borderRight: "2px solid #dc2626", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <input type="number" value={pyramid.lti_sif} onChange={(e) => updatePyramidField("lti_sif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.82rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }} />
                  </div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(0% 0%, 88% 0%, 100% 100%, 0% 100%)" }}>
                    <input type="number" value={pyramid.lti_nosif} onChange={(e) => updatePyramidField("lti_nosif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.82rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }} />
                  </div>
                </div>

                {/* 3. MDI */}
                <div style={{ display: "flex", alignItems: "center", height: "26px" }}>
                  <div style={{ width: "86px", backgroundColor: "#f59e0b", color: "#fff", fontWeight: "900", fontSize: "0.68rem", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", borderRadius: "4px 0 0 4px", clipPath: "polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)" }}>MDI</div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", borderLeft: "2px solid #dc2626", borderRight: "2px solid #dc2626", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <input type="number" value={pyramid.mdi_sif} onChange={(e) => updatePyramidField("mdi_sif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.82rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }} />
                  </div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(0% 0%, 90% 0%, 100% 100%, 0% 100%)" }}>
                    <input type="number" value={pyramid.mdi_nosif} onChange={(e) => updatePyramidField("mdi_nosif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.82rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }} />
                  </div>
                </div>

                {/* 4. MTI */}
                <div style={{ display: "flex", alignItems: "center", height: "26px" }}>
                  <div style={{ width: "94px", backgroundColor: "#eab308", color: "#fff", fontWeight: "900", fontSize: "0.68rem", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", borderRadius: "4px 0 0 4px", clipPath: "polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)" }}>MTI</div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", borderLeft: "2px solid #dc2626", borderRight: "2px solid #dc2626", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <input type="number" value={pyramid.mti_sif} onChange={(e) => updatePyramidField("mti_sif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.82rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }} />
                  </div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(0% 0%, 92% 0%, 100% 100%, 0% 100%)" }}>
                    <input type="number" value={pyramid.mti_nosif} onChange={(e) => updatePyramidField("mti_nosif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.82rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }} />
                  </div>
                </div>

                {/* 5. FAI */}
                <div style={{ display: "flex", alignItems: "center", height: "26px" }}>
                  <div style={{ width: "102px", backgroundColor: "#facc15", color: "#00205b", fontWeight: "900", fontSize: "0.68rem", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", borderRadius: "4px 0 0 4px", clipPath: "polygon(6% 0%, 100% 0%, 100% 100%, 0% 100%)" }}>FAI</div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", borderLeft: "2px solid #dc2626", borderRight: "2px solid #dc2626", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <input type="number" value={pyramid.fai_sif} onChange={(e) => updatePyramidField("fai_sif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.82rem", fontWeight: "900", color: "#dc2626", background: "transparent", outline: "none" }} />
                  </div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(0% 0%, 94% 0%, 100% 100%, 0% 100%)" }}>
                    <input type="number" value={pyramid.fai_nosif} onChange={(e) => updatePyramidField("fai_nosif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.82rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }} />
                  </div>
                </div>

                {/* 6. INCIDENTES */}
                <div style={{ display: "flex", alignItems: "center", height: "28px" }}>
                  <div style={{ width: "110px", backgroundColor: "#00205b", color: "#ffffff", fontWeight: "900", fontSize: "0.68rem", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", borderRadius: "4px 0 0 4px", clipPath: "polygon(4% 0%, 100% 0%, 100% 100%, 0% 100%)" }}>INCIDENTES</div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", border: "2px solid #dc2626", borderTop: "none", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <input type="number" value={pyramid.incidentes_sif} onChange={(e) => updatePyramidField("incidentes_sif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.85rem", fontWeight: "900", color: "#dc2626", background: "transparent", outline: "none" }} />
                  </div>
                  <div style={{ flex: 1, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", clipPath: "polygon(0% 0%, 96% 0%, 100% 100%, 0% 100%)" }}>
                    <input type="number" value={pyramid.incidentes_nosif} onChange={(e) => updatePyramidField("incidentes_nosif", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.82rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }} />
                  </div>
                </div>

                {/* Etiquetas SIF vs NO SIF */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ width: "110px" }} />
                  <div style={{ flex: 1, textAlign: "center", fontWeight: "900", color: "#00205b", fontSize: "0.72rem" }}>SIF</div>
                  <div style={{ flex: 1, textAlign: "center", fontWeight: "900", color: "#00205b", fontSize: "0.72rem" }}>NO SIF</div>
                </div>

              </div>

              {/* Panel Control SIF */}
              <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "0.5rem 0.6rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  
                  {/* SIF ACTUAL */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ fontSize: "0.7rem" }}>📊</span>
                      <span style={{ fontWeight: "900", fontSize: "0.68rem", color: "#00205b" }}>SIF ACTUAL</span>
                    </div>
                    <div style={{ width: "38px", height: "22px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <input type="number" value={pyramid.sif_actual} onChange={(e) => updatePyramidField("sif_actual", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.8rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }} />
                    </div>
                  </div>

                  {/* SIF POTENCIAL */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ fontSize: "0.7rem" }}>📈</span>
                      <span style={{ fontWeight: "900", fontSize: "0.68rem", color: "#00205b" }}>SIF POTENCIAL</span>
                    </div>
                    <div style={{ width: "38px", height: "22px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <input type="number" value={pyramid.sif_potencial} onChange={(e) => updatePyramidField("sif_potencial", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.8rem", fontWeight: "900", color: "#dc2626", background: "transparent", outline: "none" }} />
                    </div>
                  </div>

                  {/* SIF PRECURSOR */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ fontSize: "0.7rem" }}>⚠️</span>
                      <span style={{ fontWeight: "900", fontSize: "0.68rem", color: "#00205b" }}>SIF PRECURSOR</span>
                    </div>
                    <div style={{ width: "38px", height: "22px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <input type="number" value={pyramid.sif_precursor} onChange={(e) => updatePyramidField("sif_precursor", e.target.value)} style={{ width: "100%", textAlign: "center", border: "none", fontSize: "0.8rem", fontWeight: "900", color: "#dc2626", background: "transparent", outline: "none" }} />
                    </div>
                  </div>

                  {/* TOTAL SIF */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.2rem", borderTop: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <span style={{ fontSize: "0.7rem" }}>👥</span>
                      <span style={{ fontWeight: "900", fontSize: "0.72rem", color: "#00205b" }}>TOTAL SIF</span>
                    </div>
                    <div style={{ width: "38px", height: "22px", borderRadius: "4px", border: "1px solid #cbd5e1", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#dc2626" }}>{totalSifCalculado}</span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Fila Inferior: Días Sin LTI + Comentarios */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "0.4rem" }}>
              
              {/* DÍAS SIN LTI */}
              <div style={{ backgroundColor: "#00205b", borderRadius: "8px", padding: "0.4rem", color: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.62rem", fontWeight: "800" }}>
                  <span>🗓️</span> DÍAS SIN LTI
                </div>
                <input
                  type="number"
                  value={pyramid.dias_sin_lti}
                  onChange={(e) => updatePyramidField("dias_sin_lti", e.target.value)}
                  style={{ width: "100%", textAlign: "center", border: "none", fontSize: "1.5rem", fontWeight: "900", color: "#fcd116", background: "transparent", outline: "none", lineHeight: "1" }}
                />
              </div>

              {/* COMENTARIOS */}
              <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ backgroundColor: "#00205b", color: "#ffffff", padding: "0.15rem 0.5rem", fontWeight: "900", fontSize: "0.58rem", textAlign: "center", textTransform: "uppercase" }}>
                  COMENTARIOS
                </div>
                <div style={{ padding: "0.3rem", flex: 1 }}>
                  <textarea
                    value={pyramid.comentarios}
                    onChange={(e) => updatePyramidField("comentarios", e.target.value)}
                    rows={2}
                    style={{ width: "100%", height: "100%", border: "none", outline: "none", resize: "none", fontSize: "0.6rem", lineHeight: "1.2", color: "#1e293b", fontFamily: "inherit", background: "transparent" }}
                    placeholder="Comentarios de eventos..."
                  />
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ============================================================
            3. BARRA INFERIOR / FOOTER
           ============================================================ */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            padding: "0.35rem 0.8rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.4rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.75rem" }}>🛡️</span>
            <span style={{ fontSize: "0.68rem", fontWeight: "900", color: "#00205b", textTransform: "uppercase" }}>
              SEGURIDAD HOY, <span style={{ color: "#854d0e" }}>RESULTADOS MAÑANA.</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.65rem", color: "#64748b", fontWeight: "600" }}>
              Fecha Base:
            </span>
            <input
              type="date"
              value={baseDate}
              onChange={(e) => setBaseDate(e.target.value)}
              style={{ padding: "0.15rem 0.4rem", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "0.68rem", fontWeight: "700", color: "#00205b" }}
            />
            {baseDate !== FIXED_BASE_DATE && (
              <button
                onClick={handleResetToFixed}
                style={{ background: "#fcd116", color: "#00205b", border: "none", padding: "0.15rem 0.4rem", borderRadius: "4px", fontWeight: "800", fontSize: "0.62rem", cursor: "pointer" }}
              >
                Fijar 08-01-2020
              </button>
            )}
          </div>
        </div>

        {/* Barra tricolor inferior */}
        <div style={{ display: "flex", height: "3px", width: "100%" }}>
          <div style={{ flex: 6, backgroundColor: "#00205b" }} />
          <div style={{ flex: 3, backgroundColor: "#fcd116" }} />
          <div style={{ flex: 1, backgroundColor: "#dc2626" }} />
        </div>
      </div>

      {/* ==============================================================
          MODAL DE EDICIÓN RÁPIDA
         ============================================================== */}
      {isPyramidEditOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 32, 91, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.5rem",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.6rem" }}>
              <h3 style={{ margin: 0, color: "#00205b", fontSize: "1.15rem", fontWeight: "900" }}>
                ✏️ Editar Valores de la Pirámide (Pereira)
              </h3>
              <button
                onClick={() => setIsPyramidEditOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsPyramidEditOpen(false);
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.6rem", alignItems: "center", marginBottom: "1rem" }}>
                <strong style={{ color: "#64748b", fontSize: "0.78rem" }}>Nivel</strong>
                <strong style={{ color: "#dc2626", fontSize: "0.78rem", textAlign: "center" }}>SIF</strong>
                <strong style={{ color: "#00205b", fontSize: "0.78rem", textAlign: "center" }}>NO SIF</strong>

                <span style={{ fontSize: "0.8rem" }}>1. FAT (Fatalidad):</span>
                <input type="number" value={pyramid.fat_sif} onChange={(e) => updatePyramidField("fat_sif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.fat_nosif} onChange={(e) => updatePyramidField("fat_nosif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />

                <span style={{ fontSize: "0.8rem" }}>2. LTI (Tiempo Perdido):</span>
                <input type="number" value={pyramid.lti_sif} onChange={(e) => updatePyramidField("lti_sif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.lti_nosif} onChange={(e) => updatePyramidField("lti_nosif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />

                <span style={{ fontSize: "0.8rem" }}>3. MDI (Incapacidad):</span>
                <input type="number" value={pyramid.mdi_sif} onChange={(e) => updatePyramidField("mdi_sif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.mdi_nosif} onChange={(e) => updatePyramidField("mdi_nosif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />

                <span style={{ fontSize: "0.8rem" }}>4. MTI (Tratamiento):</span>
                <input type="number" value={pyramid.mti_sif} onChange={(e) => updatePyramidField("mti_sif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.mti_nosif} onChange={(e) => updatePyramidField("mti_nosif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />

                <span style={{ fontSize: "0.8rem" }}>5. FAI (Primeros Auxilios):</span>
                <input type="number" value={pyramid.fai_sif} onChange={(e) => updatePyramidField("fai_sif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.fai_nosif} onChange={(e) => updatePyramidField("fai_nosif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />

                <span style={{ fontSize: "0.8rem" }}>6. INCIDENTES:</span>
                <input type="number" value={pyramid.incidentes_sif} onChange={(e) => updatePyramidField("incidentes_sif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.incidentes_nosif} onChange={(e) => updatePyramidField("incidentes_nosif", e.target.value)} style={{ padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.6rem", marginBottom: "0.8rem", backgroundColor: "#f8fafc", padding: "0.8rem", borderRadius: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: "700", display: "block", marginBottom: "0.2rem" }}>SIF ACTUAL</label>
                  <input type="number" value={pyramid.sif_actual} onChange={(e) => updatePyramidField("sif_actual", e.target.value)} style={{ width: "100%", padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: "700", display: "block", marginBottom: "0.2rem" }}>SIF POTENCIAL</label>
                  <input type="number" value={pyramid.sif_potencial} onChange={(e) => updatePyramidField("sif_potencial", e.target.value)} style={{ width: "100%", padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: "700", display: "block", marginBottom: "0.2rem" }}>SIF PRECURSOR</label>
                  <input type="number" value={pyramid.sif_precursor} onChange={(e) => updatePyramidField("sif_precursor", e.target.value)} style={{ width: "100%", padding: "0.35rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>

              <div style={{ marginBottom: "0.8rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: "700", display: "block", marginBottom: "0.2rem" }}>DÍAS SIN LTI</label>
                <input type="number" value={pyramid.dias_sin_lti} onChange={(e) => updatePyramidField("dias_sin_lti", e.target.value)} style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1rem", fontWeight: "800" }} />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: "700", display: "block", marginBottom: "0.2rem" }}>COMENTARIOS</label>
                <textarea value={pyramid.comentarios} onChange={(e) => updatePyramidField("comentarios", e.target.value)} rows={2} style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.8rem" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button
                  type="button"
                  onClick={() => handleSavePyramid(defaultPyramidData)}
                  style={{ background: "#f1f5f9", color: "#64748b", border: "none", padding: "0.5rem 0.8rem", borderRadius: "6px", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer" }}
                >
                  Restaurar
                </button>
                <button
                  type="submit"
                  style={{ background: "#00205b", color: "#ffffff", border: "none", padding: "0.5rem 1.2rem", borderRadius: "6px", fontWeight: "800", fontSize: "0.8rem", cursor: "pointer" }}
                >
                  💾 Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
