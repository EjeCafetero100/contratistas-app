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

  const calcSectionRef = useRef(null);
  const pyramidSectionRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    // Cargar datos de localStorage
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

  // Guardar pirámide
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

    // Total de días
    const totalDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));

    // Horas, minutos, segundos
    const hours = Math.floor((absDiffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((absDiffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((absDiffMs / 1000) % 60);

    // Semanas y Horas totales
    const totalWeeks = Math.floor(totalDays / 7);
    const totalHours = Math.floor(absDiffMs / (1000 * 60 * 60));

    // Años, Meses, Días
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

    // Próximo hito / aniversario
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

    // Datos del gráfico histórico
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

  // Total SIF calculado
  const totalSifCalculado = useMemo(() => {
    return Number(pyramid.sif_actual || 0) + Number(pyramid.sif_potencial || 0) + Number(pyramid.sif_precursor || 0);
  }, [pyramid.sif_actual, pyramid.sif_potencial, pyramid.sif_precursor]);

  const handleCopySummary = () => {
    const text = `📊 INFORME DE SEGURIDAD & TIEMPO - AB INBEV PEREIRA:\n• Días Transcurridos: ${stats.daysFormatted}\n• Tiempo Exacto: ${stats.years} Años, ${stats.months}m, ${stats.days}d\n• Días sin LTI: ${pyramid.dias_sin_lti}\n• SIF Total: ${totalSifCalculado} (Actual: ${pyramid.sif_actual}, Potencial: ${pyramid.sif_potencial}, Precursor: ${pyramid.sif_precursor})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#f1f5f9",
        padding: "1.5rem 1.5rem 6rem 1.5rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#00205b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box"
      }}
    >
      {/* ==============================================================
          BARRA DE NAVEGACIÓN Y ACCIONES SUPERIOR (STICKY)
         ============================================================== */}
      <div
        style={{
          width: "100%",
          maxWidth: "1180px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.8rem",
          marginBottom: "1.5rem",
          backgroundColor: "#ffffff",
          padding: "0.8rem 1.2rem",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0, 32, 91, 0.05)",
          border: "1px solid #e2e8f0"
        }}
      >
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              background: "#00205b",
              color: "#ffffff",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "0.85rem",
              textDecoration: "none"
            }}
          >
            ← Volver al Panel
          </Link>

          <button
            onClick={() => scrollToSection(calcSectionRef)}
            style={{
              background: "#f8fafc",
              color: "#00205b",
              border: "1px solid #cbd5e1",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            ⏱️ 1. Ver Calculadora Días
          </button>

          <button
            onClick={() => scrollToSection(pyramidSectionRef)}
            style={{
              background: "#fcd116",
              color: "#00205b",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(252, 209, 22, 0.3)"
            }}
          >
            🔺 2. Ver Pirámide de Seguridad
          </button>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsPyramidEditOpen(true)}
            style={{
              background: "#00205b",
              color: "#ffffff",
              border: "none",
              padding: "0.5rem 1.1rem",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            ✏️ Editar Pirámide
          </button>

          <button
            onClick={handleCopySummary}
            style={{
              background: copied ? "#10b981" : "#ffffff",
              color: copied ? "#ffffff" : "#00205b",
              border: "1px solid #cbd5e1",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            {copied ? "✓ Copiado" : "📋 Copiar Reporte"}
          </button>
        </div>
      </div>

      {/* ==============================================================
          LÁMINA 1: CALCULADORA DE CUMPLIMIENTO CRONOLÓGICO (AB INBEV)
         ============================================================== */}
      <div
        ref={calcSectionRef}
        style={{
          width: "100%",
          maxWidth: "1180px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 10px 35px rgba(0, 32, 91, 0.08)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          marginBottom: "2.5rem"
        }}
      >
        {/* Cabecera ABInBev */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff"
          }}
        >
          <div
            style={{
              padding: "1rem 1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1.2rem",
              flex: 1,
              flexWrap: "wrap"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#fcd116",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(252, 209, 22, 0.3)"
                }}
              >
                <div
                  style={{
                    width: "15px",
                    height: "15px",
                    border: "2.5px solid #00205b",
                    borderRadius: "50%"
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "1.45rem",
                  fontWeight: "900",
                  color: "#00205b",
                  letterSpacing: "-0.03em"
                }}
              >
                ABInBev
              </span>
            </div>

            <div style={{ borderLeft: "2px solid #cbd5e1", height: "38px" }} />

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.15rem",
                  fontWeight: "900",
                  color: "#00205b",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase"
                }}
              >
                INDICADOR DE CUMPLIMIENTO CRONOLÓGICO
              </h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  marginTop: "0.2rem",
                  flexWrap: "wrap"
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "800",
                    color: "#00205b",
                    textTransform: "uppercase"
                  }}
                >
                  SEGUIMIENTO DIARIO 2026
                </span>
                <span
                  style={{
                    backgroundColor: "#fcd116",
                    color: "#00205b",
                    fontSize: "0.72rem",
                    fontWeight: "900",
                    padding: "0.15rem 0.6rem",
                    borderRadius: "15px",
                    textTransform: "uppercase"
                  }}
                >
                  CENTRO DE DISTRIBUCIÓN | PEREIRA
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#00205b",
              color: "#ffffff",
              padding: "0.8rem 2rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              clipPath: "polygon(12% 0%, 100% 0%, 100% 100%, 0% 100%)",
              minWidth: "220px"
            }}
          >
            <span style={{ fontSize: "0.68rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              MEJORAMOS JUNTOS
            </span>
            <span style={{ fontSize: "0.68rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              PARA SER
            </span>
            <span
              style={{
                fontSize: "0.92rem",
                fontWeight: "900",
                color: "#fcd116",
                letterSpacing: "0.8px",
                textTransform: "uppercase"
              }}
            >
              LOS MEJORES
            </span>
          </div>
        </div>

        {/* Cinta tricolor */}
        <div style={{ display: "flex", height: "4px", width: "100%" }}>
          <div style={{ flex: 6, backgroundColor: "#00205b" }} />
          <div style={{ flex: 3, backgroundColor: "#fcd116" }} />
          <div style={{ flex: 1, backgroundColor: "#dc2626" }} />
        </div>

        {/* Cuerpo de la Lámina 1 */}
        <div style={{ padding: "1.5rem 1.8rem" }}>
          
          {/* 3 Tarjetas Superiores */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.3fr 1fr",
              gap: "1.2rem",
              marginBottom: "1.5rem",
              alignItems: "stretch"
            }}
          >
            {/* Card 1: Fecha Base */}
            <div
              style={{
                backgroundColor: "#00205b",
                borderRadius: "14px",
                padding: "1.2rem 1.4rem",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                boxShadow: "0 6px 16px rgba(0, 32, 91, 0.12)"
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>🗓️</span>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: "800", color: "rgba(255, 255, 255, 0.8)", textTransform: "uppercase" }}>
                  FECHA BASE INICIAL
                </div>
                <div style={{ fontSize: "1.65rem", fontWeight: "900", color: "#fcd116", lineHeight: "1.1", margin: "0.2rem 0" }}>
                  08-01-2020
                </div>
                <div style={{ fontSize: "0.75rem", color: "#93c5fd", fontWeight: "600" }}>
                  8 de Enero 2020 (Fija)
                </div>
              </div>
            </div>

            {/* Card 2: Gran Número Central */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                padding: "1rem 1.2rem",
                textAlign: "center",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span style={{ fontSize: "0.95rem", fontWeight: "900", color: "#00205b", textTransform: "uppercase", letterSpacing: "1px" }}>
                {stats.currentMonthName} 2026
              </span>
              <div style={{ fontSize: "3.8rem", fontWeight: "900", color: "#00205b", lineHeight: "1.05", margin: "0.2rem 0", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                {isClient ? stats.daysFormatted : "2.410,0"}
              </div>
              <div style={{ width: "75%", height: "2px", backgroundColor: "#00205b", marginBottom: "0.3rem" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#00205b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                DÍAS TRANSCURRIDOS ACUMULADOS
              </span>
            </div>

            {/* Card 3: Tiempo Exacto */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                padding: "1.2rem 1.4rem",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  border: "2.5px solid #fcd116",
                  backgroundColor: "#fffdf0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: "1.6rem" }}>⏱️</span>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "0.72rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                  TIEMPO ACUMULADO
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: "900", color: "#00205b", lineHeight: "1.15", margin: "0.2rem 0" }}>
                  {stats.years} Años, {stats.months}m, {stats.days}d
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>
                  {isClient ? `${stats.hours}h ${stats.minutes}m ${stats.seconds}s (En vivo)` : "Calculando..."}
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Tendencia + Hallazgos */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "1.5rem",
              marginBottom: "1.5rem"
            }}
          >
            {/* Gráfico */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                padding: "1.2rem 1.2rem 0.8rem 1.2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "0.8rem" }}>
                <span
                  style={{
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    padding: "0.35rem 1.4rem",
                    borderRadius: "15px",
                    fontSize: "0.8rem",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    display: "inline-block"
                  }}
                >
                  TENDENCIA ACUMULADA (2020 - 2026)
                </span>
              </div>

              <div style={{ width: "100%", height: "160px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.chartData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 2600]} />
                    <Tooltip formatter={(value) => [`${value.toLocaleString("es-CO")} días`, "Días"]} />
                    <Line type="monotone" dataKey="dias" stroke="#00205b" strokeWidth={3} dot={{ fill: "#00205b", stroke: "#fcd116", strokeWidth: 2, r: 4.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#64748b", fontWeight: "700", paddingTop: "0.5rem", borderTop: "1px solid #f1f5f9" }}>
                <span>Inicio: 08/01/2020</span>
                <span>Hoy: {stats.totalDays.toLocaleString("es-CO")} días</span>
              </div>
            </div>

            {/* Hallazgos */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                padding: "1.2rem 1.4rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "0.8rem" }}>
                <span
                  style={{
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    padding: "0.35rem 1.6rem",
                    borderRadius: "15px",
                    fontSize: "0.8rem",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    display: "inline-block"
                  }}
                >
                  HALLAZGOS & HITOS
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#dc2626", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "1rem" }}>📉</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#1e293b", lineHeight: "1.3" }}>
                    <strong>Próximo aniversario:</strong> Faltan <span style={{ color: "#dc2626", fontWeight: "800" }}>{stats.daysToNextAnniversary} días</span> para cumplir <strong>{stats.years + 1} años</strong> (08-01-{stats.nextAnniversaryYear}).
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#fcd116", color: "#00205b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "1rem" }}>⚡</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#1e293b", lineHeight: "1.3" }}>
                    <strong>Total acumulado:</strong> <strong>{stats.totalHours.toLocaleString("es-CO")} hrs</strong> y <strong>{stats.totalWeeks.toLocaleString("es-CO")} semanas</strong> continuas.
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#00205b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "1rem" }}>🔍</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#1e293b", lineHeight: "1.3" }}>
                    <strong>Cálculo automático:</strong> Descuento diario sincronizado con la fecha actual del sistema.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan de Acción */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "1.2rem 1.4rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span style={{ backgroundColor: "#00205b", color: "#ffffff", padding: "0.35rem 1.8rem", borderRadius: "15px", fontSize: "0.8rem", fontWeight: "800", textTransform: "uppercase", display: "inline-block" }}>
                PLAN DE ACCIÓN
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#00205b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "1rem" }}>📅</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.25" }}>Seguimiento diario de días.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#fcd116", color: "#00205b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "1rem" }}>👤</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.25" }}>Validación de novedades en ruta.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#dc2626", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "1rem" }}>📍</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.25" }}>Acompañamiento a puntos clave.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#00205b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "1rem" }}>📈</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.25" }}>Monitoreo semanal del indicador.</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#fcd116", color: "#00205b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "1rem" }}>📢</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.25" }}>Socialización en rutina operativa.</div>
              </div>
            </div>
          </div>

        </div>

        {/* Barra tricolor inferior */}
        <div style={{ display: "flex", height: "4px", width: "100%" }}>
          <div style={{ flex: 6, backgroundColor: "#00205b" }} />
          <div style={{ flex: 3, backgroundColor: "#fcd116" }} />
          <div style={{ flex: 1, backgroundColor: "#dc2626" }} />
        </div>
      </div>

      {/* ==============================================================
          LÁMINA 2: PIRÁMIDE DE INCIDENTES 2026 - CD PEREIRA
         ============================================================== */}
      <div
        ref={pyramidSectionRef}
        style={{
          width: "100%",
          maxWidth: "1180px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 10px 35px rgba(0, 32, 91, 0.08)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Cabecera Pirámide */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#ffffff",
            padding: "1.2rem 1.8rem",
            borderBottom: "1px solid #e2e8f0",
            position: "relative"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#fcd116",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2.5px solid #00205b",
                boxShadow: "0 4px 10px rgba(252, 209, 22, 0.3)"
              }}
            >
              <span style={{ fontSize: "1.7rem" }}>🛡️</span>
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.6rem",
                  fontWeight: "900",
                  color: "#00205b",
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase"
                }}
              >
                PIRÁMIDE DE INCIDENTES
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.6rem", fontWeight: "900", color: "#fcd116" }}>
                  2026
                </span>
                <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "#00205b", textTransform: "uppercase" }}>
                  CD PEREIRA
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 7px)",
              gap: "7px",
              opacity: 0.5
            }}
          >
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#00205b" }} />
            ))}
          </div>
        </div>

        {/* Línea amarilla decorativa */}
        <div style={{ height: "4px", backgroundColor: "#fcd116", width: "100%" }} />

        {/* Cuerpo de la Pirámide: 2 Columnas */}
        <div
          style={{
            padding: "1.8rem",
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: "2.5rem",
            alignItems: "stretch"
          }}
        >
          {/* Columna Izquierda: Pirámide Gráfica Escalonada */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", maxWidth: "540px", display: "flex", flexDirection: "column", gap: "6px" }}>
              
              {/* 1. FAT */}
              <div style={{ display: "flex", alignItems: "center", height: "50px" }}>
                <div
                  style={{
                    width: "130px",
                    backgroundColor: "#ea580c",
                    color: "#ffffff",
                    fontWeight: "900",
                    fontSize: "1.15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    borderRadius: "6px 0 0 6px",
                    clipPath: "polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  FAT
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    border: "3px solid #dc2626",
                    borderBottom: "none",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.fat_sif}
                    onChange={(e) => updatePyramidField("fat_sif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      color: "#15803d",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    clipPath: "polygon(0% 0%, 85% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.fat_nosif}
                    onChange={(e) => updatePyramidField("fat_nosif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      color: "#15803d",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* 2. LTI */}
              <div style={{ display: "flex", alignItems: "center", height: "50px" }}>
                <div
                  style={{
                    width: "145px",
                    backgroundColor: "#f97316",
                    color: "#ffffff",
                    fontWeight: "900",
                    fontSize: "1.15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    borderRadius: "6px 0 0 6px",
                    clipPath: "polygon(12% 0%, 100% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  LTI
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    borderLeft: "3px solid #dc2626",
                    borderRight: "3px solid #dc2626",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.lti_sif}
                    onChange={(e) => updatePyramidField("lti_sif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      color: "#15803d",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    clipPath: "polygon(0% 0%, 88% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.lti_nosif}
                    onChange={(e) => updatePyramidField("lti_nosif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      color: "#15803d",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* 3. MDI */}
              <div style={{ display: "flex", alignItems: "center", height: "50px" }}>
                <div
                  style={{
                    width: "160px",
                    backgroundColor: "#f59e0b",
                    color: "#ffffff",
                    fontWeight: "900",
                    fontSize: "1.15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    borderRadius: "6px 0 0 6px",
                    clipPath: "polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  MDI
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    borderLeft: "3px solid #dc2626",
                    borderRight: "3px solid #dc2626",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.mdi_sif}
                    onChange={(e) => updatePyramidField("mdi_sif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      color: "#15803d",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    clipPath: "polygon(0% 0%, 90% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.mdi_nosif}
                    onChange={(e) => updatePyramidField("mdi_nosif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      color: "#15803d",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* 4. MTI */}
              <div style={{ display: "flex", alignItems: "center", height: "50px" }}>
                <div
                  style={{
                    width: "175px",
                    backgroundColor: "#eab308",
                    color: "#ffffff",
                    fontWeight: "900",
                    fontSize: "1.15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    borderRadius: "6px 0 0 6px",
                    clipPath: "polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  MTI
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    borderLeft: "3px solid #dc2626",
                    borderRight: "3px solid #dc2626",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.mti_sif}
                    onChange={(e) => updatePyramidField("mti_sif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      color: "#15803d",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    clipPath: "polygon(0% 0%, 92% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.mti_nosif}
                    onChange={(e) => updatePyramidField("mti_nosif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      color: "#15803d",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* 5. FAI */}
              <div style={{ display: "flex", alignItems: "center", height: "50px" }}>
                <div
                  style={{
                    width: "190px",
                    backgroundColor: "#facc15",
                    color: "#00205b",
                    fontWeight: "900",
                    fontSize: "1.15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    borderRadius: "6px 0 0 6px",
                    clipPath: "polygon(6% 0%, 100% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  FAI
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    borderLeft: "3px solid #dc2626",
                    borderRight: "3px solid #dc2626",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.fai_sif}
                    onChange={(e) => updatePyramidField("fai_sif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      color: "#dc2626",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    clipPath: "polygon(0% 0%, 94% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.fai_nosif}
                    onChange={(e) => updatePyramidField("fai_nosif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      color: "#15803d",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* 6. INCIDENTES */}
              <div style={{ display: "flex", alignItems: "center", height: "52px" }}>
                <div
                  style={{
                    width: "205px",
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    fontWeight: "900",
                    fontSize: "1.15rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    borderRadius: "6px 0 0 6px",
                    clipPath: "polygon(4% 0%, 100% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  INCIDENTES
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    border: "3px solid #dc2626",
                    borderTop: "none",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.incidentes_sif}
                    onChange={(e) => updatePyramidField("incidentes_sif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.5rem",
                      fontWeight: "900",
                      color: "#dc2626",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    clipPath: "polygon(0% 0%, 96% 0%, 100% 100%, 0% 100%)"
                  }}
                >
                  <input
                    type="number"
                    value={pyramid.incidentes_nosif}
                    onChange={(e) => updatePyramidField("incidentes_nosif", e.target.value)}
                    style={{
                      width: "100%",
                      textAlign: "center",
                      border: "none",
                      fontSize: "1.4rem",
                      fontWeight: "900",
                      color: "#15803d",
                      background: "transparent",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              {/* Etiquetas SIF vs NO SIF */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <div style={{ width: "205px" }} />
                <div style={{ flex: 1, textAlign: "center", fontWeight: "900", color: "#00205b", fontSize: "1.2rem" }}>
                  SIF
                </div>
                <div style={{ flex: 1, textAlign: "center", fontWeight: "900", color: "#00205b", fontSize: "1.2rem" }}>
                  NO SIF
                </div>
              </div>

            </div>
          </div>

          {/* Columna Derecha: Tarjeta SIF, Días sin LTI y Comentarios */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Tarjeta SIF Breakdown */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "1.6rem",
                boxShadow: "0 4px 15px rgba(0, 32, 91, 0.05)",
                position: "relative"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-14px",
                  left: "24px",
                  backgroundColor: "#00205b",
                  color: "#fcd116",
                  padding: "0.25rem 1.2rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "900",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}
              >
                <span>❯</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.6rem" }}>
                
                {/* SIF ACTUAL */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#00205b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span>📊</span>
                    </div>
                    <span style={{ fontWeight: "900", fontSize: "1.1rem", color: "#00205b", letterSpacing: "0.5px" }}>
                      SIF ACTUAL
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px dotted #cbd5e1", flex: 1, margin: "0 1.2rem" }} />
                  <div style={{ width: "70px", height: "40px", borderRadius: "8px", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
                    <input
                      type="number"
                      value={pyramid.sif_actual}
                      onChange={(e) => updatePyramidField("sif_actual", e.target.value)}
                      style={{ width: "100%", textAlign: "center", border: "none", fontSize: "1.4rem", fontWeight: "900", color: "#15803d", background: "transparent", outline: "none" }}
                    />
                  </div>
                </div>

                {/* SIF POTENCIAL */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#00205b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span>📈</span>
                    </div>
                    <span style={{ fontWeight: "900", fontSize: "1.1rem", color: "#00205b", letterSpacing: "0.5px" }}>
                      SIF POTENCIAL
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px dotted #cbd5e1", flex: 1, margin: "0 1.2rem" }} />
                  <div style={{ width: "70px", height: "40px", borderRadius: "8px", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
                    <input
                      type="number"
                      value={pyramid.sif_potencial}
                      onChange={(e) => updatePyramidField("sif_potencial", e.target.value)}
                      style={{ width: "100%", textAlign: "center", border: "none", fontSize: "1.4rem", fontWeight: "900", color: "#dc2626", background: "transparent", outline: "none" }}
                    />
                  </div>
                </div>

                {/* SIF PRECURSOR */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#00205b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span>⚠️</span>
                    </div>
                    <span style={{ fontWeight: "900", fontSize: "1.1rem", color: "#00205b", letterSpacing: "0.5px" }}>
                      SIF PRECURSOR
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px dotted #cbd5e1", flex: 1, margin: "0 1.2rem" }} />
                  <div style={{ width: "70px", height: "40px", borderRadius: "8px", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" }}>
                    <input
                      type="number"
                      value={pyramid.sif_precursor}
                      onChange={(e) => updatePyramidField("sif_precursor", e.target.value)}
                      style={{ width: "100%", textAlign: "center", border: "none", fontSize: "1.4rem", fontWeight: "900", color: "#dc2626", background: "transparent", outline: "none" }}
                    />
                  </div>
                </div>

                {/* TOTAL SIF */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.6rem", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#00205b", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span>👥</span>
                    </div>
                    <span style={{ fontWeight: "900", fontSize: "1.2rem", color: "#00205b", letterSpacing: "0.5px" }}>
                      TOTAL SIF
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px dotted #cbd5e1", flex: 1, margin: "0 1.2rem" }} />
                  <div style={{ width: "70px", height: "40px", borderRadius: "8px", border: "1px solid #cbd5e1", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fee2e2" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: "900", color: "#dc2626" }}>
                      {totalSifCalculado}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Fila Inferior: Días Sin LTI + Comentarios */}
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.6fr", gap: "1.2rem" }}>
              
              {/* DÍAS SIN LTI */}
              <div
                style={{
                  backgroundColor: "#00205b",
                  borderRadius: "14px",
                  padding: "1.2rem",
                  color: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                  boxShadow: "0 6px 16px rgba(0, 32, 91, 0.2)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "1.6rem" }}>🗓️</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    DÍAS SIN LTI
                  </span>
                </div>
                <input
                  type="number"
                  value={pyramid.dias_sin_lti}
                  onChange={(e) => updatePyramidField("dias_sin_lti", e.target.value)}
                  style={{
                    width: "100%",
                    textAlign: "center",
                    border: "none",
                    fontSize: "2.8rem",
                    fontWeight: "900",
                    color: "#fcd116",
                    background: "transparent",
                    outline: "none",
                    lineHeight: "1"
                  }}
                />
              </div>

              {/* COMENTARIOS */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div
                  style={{
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    padding: "0.5rem 1rem",
                    fontWeight: "900",
                    fontSize: "0.85rem",
                    textAlign: "center",
                    letterSpacing: "1px",
                    textTransform: "uppercase"
                  }}
                >
                  COMENTARIOS
                </div>
                <div style={{ padding: "0.8rem", flex: 1 }}>
                  <textarea
                    value={pyramid.comentarios}
                    onChange={(e) => updatePyramidField("comentarios", e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontSize: "0.82rem",
                      lineHeight: "1.4",
                      color: "#1e293b",
                      fontFamily: "inherit",
                      background: "transparent"
                    }}
                    placeholder="Escribe comentarios o novedades de eventos aquí..."
                  />
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Ribbon Inferior Pirámide */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            padding: "1rem 1.8rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                backgroundColor: "#00205b",
                color: "#fcd116",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span>🛡️</span>
            </div>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: "900",
                color: "#00205b",
                letterSpacing: "0.5px",
                textTransform: "uppercase"
              }}
            >
              SEGURIDAD HOY, <span style={{ color: "#854d0e" }}>RESULTADOS MAÑANA.</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: "600" }}>
              💡 Tip: Puedes hacer clic y cambiar cualquier número directamente sobre la pirámide.
            </span>
          </div>
        </div>
      </div>

      {/* ==============================================================
          MODAL DE EDICIÓN DE LA PIRÁMIDE (FORMULARIO COMPLETO)
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
              maxWidth: "650px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.8rem",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.8rem" }}>
              <h3 style={{ margin: 0, color: "#00205b", fontSize: "1.3rem", fontWeight: "900" }}>
                ✏️ Editar Valores de la Pirámide de Seguridad (Pereira)
              </h3>
              <button
                onClick={() => setIsPyramidEditOpen(false)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b" }}
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
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "0.8rem", alignItems: "center", marginBottom: "1.2rem" }}>
                <strong style={{ color: "#64748b", fontSize: "0.85rem" }}>Nivel</strong>
                <strong style={{ color: "#dc2626", fontSize: "0.85rem", textAlign: "center" }}>SIF</strong>
                <strong style={{ color: "#00205b", fontSize: "0.85rem", textAlign: "center" }}>NO SIF</strong>

                <span>1. FAT (Fatalidad):</span>
                <input type="number" value={pyramid.fat_sif} onChange={(e) => updatePyramidField("fat_sif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.fat_nosif} onChange={(e) => updatePyramidField("fat_nosif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />

                <span>2. LTI (Tiempo Perdido):</span>
                <input type="number" value={pyramid.lti_sif} onChange={(e) => updatePyramidField("lti_sif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.lti_nosif} onChange={(e) => updatePyramidField("lti_nosif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />

                <span>3. MDI (Incapacidad):</span>
                <input type="number" value={pyramid.mdi_sif} onChange={(e) => updatePyramidField("mdi_sif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.mdi_nosif} onChange={(e) => updatePyramidField("mdi_nosif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />

                <span>4. MTI (Tratamiento Médico):</span>
                <input type="number" value={pyramid.mti_sif} onChange={(e) => updatePyramidField("mti_sif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.mti_nosif} onChange={(e) => updatePyramidField("mti_nosif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />

                <span>5. FAI (Primeros Auxilios):</span>
                <input type="number" value={pyramid.fai_sif} onChange={(e) => updatePyramidField("fai_sif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.fai_nosif} onChange={(e) => updatePyramidField("fai_nosif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />

                <span>6. INCIDENTES:</span>
                <input type="number" value={pyramid.incidentes_sif} onChange={(e) => updatePyramidField("incidentes_sif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                <input type="number" value={pyramid.incidentes_nosif} onChange={(e) => updatePyramidField("incidentes_nosif", e.target.value)} style={{ padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.8rem", marginBottom: "1rem", backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "8px" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: "700", display: "block", marginBottom: "0.3rem" }}>SIF ACTUAL</label>
                  <input type="number" value={pyramid.sif_actual} onChange={(e) => updatePyramidField("sif_actual", e.target.value)} style={{ width: "100%", padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: "700", display: "block", marginBottom: "0.3rem" }}>SIF POTENCIAL</label>
                  <input type="number" value={pyramid.sif_potencial} onChange={(e) => updatePyramidField("sif_potencial", e.target.value)} style={{ width: "100%", padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", fontWeight: "700", display: "block", marginBottom: "0.3rem" }}>SIF PRECURSOR</label>
                  <input type="number" value={pyramid.sif_precursor} onChange={(e) => updatePyramidField("sif_precursor", e.target.value)} style={{ width: "100%", padding: "0.4rem", textAlign: "center", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "0.3rem" }}>DÍAS SIN LTI</label>
                <input type="number" value={pyramid.dias_sin_lti} onChange={(e) => updatePyramidField("dias_sin_lti", e.target.value)} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "1.1rem", fontWeight: "800" }} />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "0.3rem" }}>COMENTARIOS / DETALLE DE EVENTOS</label>
                <textarea value={pyramid.comentarios} onChange={(e) => updatePyramidField("comentarios", e.target.value)} rows={3} style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.8rem" }}>
                <button
                  type="button"
                  onClick={() => handleSavePyramid(defaultPyramidData)}
                  style={{ background: "#f1f5f9", color: "#64748b", border: "none", padding: "0.6rem 1rem", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                >
                  Restaurar Valores Iniciales
                </button>
                <button
                  type="submit"
                  style={{ background: "#00205b", color: "#ffffff", border: "none", padding: "0.6rem 1.5rem", borderRadius: "8px", fontWeight: "800", cursor: "pointer" }}
                >
                  💾 Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
