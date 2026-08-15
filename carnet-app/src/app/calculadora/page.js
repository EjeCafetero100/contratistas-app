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
  // Fecha fija solicitada: 08 de Enero del 2020
  const FIXED_BASE_DATE = "2020-01-08";

  const [baseDate, setBaseDate] = useState(FIXED_BASE_DATE);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cálculos estadísticos
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

  const handleCopySummary = () => {
    const text = `📊 INDICADOR CRONOLÓGICO - AB INBEV CD PEREIRA:\n• Fecha Base: 08 de Enero de 2020\n• Días Transcurridos: ${stats.daysFormatted}\n• Tiempo Exacto: ${stats.years} Años, ${stats.months} Meses, ${stats.days} Días\n• Horas Totales: ${stats.totalHours.toLocaleString("es-CO")} hrs`;
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
        minHeight: "100vh",
        backgroundColor: "#f4f6f9",
        padding: "0.5rem 0.75rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#00205b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        overflowY: "auto"
      }}
    >
      {/* Contenedor Principal tipo Lámina Slide - Autoajustable al 100% de la pantalla */}
      <div
        style={{
          width: "100%",
          maxWidth: "1160px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 8px 30px rgba(0, 32, 91, 0.08)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box"
        }}
      >
        {/* ============================================================
            1. CABECERA AB INBEV
           ============================================================ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff"
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
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "#fcd116",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <div
                  style={{
                    width: "11px",
                    height: "11px",
                    border: "2px solid #00205b",
                    borderRadius: "50%"
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "900",
                  color: "#00205b",
                  letterSpacing: "-0.03em"
                }}
              >
                ABInBev
              </span>
            </div>

            <div style={{ borderLeft: "2px solid #cbd5e1", height: "26px" }} />

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "0.88rem",
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
                  gap: "0.5rem",
                  marginTop: "0.1rem",
                  flexWrap: "wrap"
                }}
              >
                <span
                  style={{
                    fontSize: "0.68rem",
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

          {/* Banner Derecho Poligonal */}
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
              clipPath: "polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)",
              minWidth: "180px"
            }}
          >
            <span style={{ fontSize: "0.55rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              MEJORAMOS JUNTOS
            </span>
            <span style={{ fontSize: "0.55rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              PARA SER
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "900",
                color: "#fcd116",
                letterSpacing: "0.5px",
                textTransform: "uppercase"
              }}
            >
              LOS MEJORES
            </span>
          </div>
        </div>

        {/* Cinta tricolor */}
        <div style={{ display: "flex", height: "3px", width: "100%" }}>
          <div style={{ flex: 6, backgroundColor: "#00205b" }} />
          <div style={{ flex: 3, backgroundColor: "#fcd116" }} />
          <div style={{ flex: 1, backgroundColor: "#dc2626" }} />
        </div>

        {/* ============================================================
            CUERPO DE LA LÁMINA (Compacto y 100% visible)
           ============================================================ */}
        <div style={{ padding: "0.6rem 0.9rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          
          {/* ============================================================
              2. SECCIÓN SUPERIOR: 3 CARDS
             ============================================================ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.25fr 1fr",
              gap: "0.6rem",
              alignItems: "stretch"
            }}
          >
            {/* Card 1: Fecha Base */}
            <div
              style={{
                backgroundColor: "#00205b",
                borderRadius: "8px",
                padding: "0.5rem 0.8rem",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem"
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>🗓️</span>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: "800",
                    color: "rgba(255, 255, 255, 0.8)",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap"
                  }}
                >
                  FECHA BASE INICIAL
                </div>
                <div
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: "900",
                    color: "#fcd116",
                    lineHeight: "1.1",
                    margin: "0.05rem 0",
                    whiteSpace: "nowrap"
                  }}
                >
                  08-01-2020
                </div>
                <div
                  style={{
                    fontSize: "0.6rem",
                    color: "#93c5fd",
                    fontWeight: "600",
                    whiteSpace: "nowrap"
                  }}
                >
                  8 de Enero 2020 (Fija)
                </div>
              </div>
            </div>

            {/* Card 2: Gran Número Central */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                padding: "0.4rem 0.6rem",
                textAlign: "center",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: "900",
                  color: "#00205b",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase"
                }}
              >
                {stats.currentMonthName} 2026
              </span>

              <div
                style={{
                  fontSize: "2.1rem",
                  fontWeight: "900",
                  color: "#00205b",
                  lineHeight: "1",
                  margin: "0.05rem 0",
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums"
                }}
              >
                {isClient ? stats.daysFormatted : "2.410,0"}
              </div>

              <div
                style={{
                  width: "65%",
                  height: "1.5px",
                  backgroundColor: "#00205b",
                  marginBottom: "0.15rem"
                }}
              />
              <span
                style={{
                  fontSize: "0.58rem",
                  fontWeight: "800",
                  color: "#00205b",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase"
                }}
              >
                DÍAS TRANSCURRIDOS ACUMULADOS
              </span>
            </div>

            {/* Card 3: Tiempo Exacto */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                padding: "0.5rem 0.8rem",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "0.6rem"
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "2px solid #fcd116",
                  backgroundColor: "#fffdf0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>⏱️</span>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: "800",
                    color: "#64748b",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap"
                  }}
                >
                  TIEMPO ACUMULADO
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: "900",
                    color: "#00205b",
                    lineHeight: "1.1",
                    margin: "0.05rem 0",
                    whiteSpace: "nowrap"
                  }}
                >
                  {stats.years} Años, {stats.months}m, {stats.days}d
                </div>
                <div
                  style={{
                    fontSize: "0.6rem",
                    color: "#64748b",
                    fontWeight: "600",
                    whiteSpace: "nowrap"
                  }}
                >
                  {isClient ? `${stats.hours}h ${stats.minutes}m ${stats.seconds}s` : "Calculando..."}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              3. SECCIÓN MEDIA: GRÁFICO + HALLAZGOS (2 COLUMNAS)
             ============================================================ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gap: "0.6rem"
            }}
          >
            {/* Columna Izquierda: Gráfico de Tendencia */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                padding: "0.4rem 0.6rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "0.2rem" }}>
                <span
                  style={{
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    padding: "0.15rem 0.8rem",
                    borderRadius: "10px",
                    fontSize: "0.65rem",
                    fontWeight: "800",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    display: "inline-block"
                  }}
                >
                  TENDENCIA ACUMULADA (2020 - 2026)
                </span>
              </div>

              <div style={{ width: "100%", height: "90px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.chartData}
                    margin={{ top: 4, right: 8, left: -32, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={8}
                      tickLine={false}
                      axisLine={{ stroke: "#cbd5e1" }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={8}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 2600]}
                    />
                    <Tooltip
                      formatter={(value) => [`${value.toLocaleString("es-CO")} días`, "Días"]}
                      contentStyle={{
                        backgroundColor: "#00205b",
                        borderRadius: "4px",
                        border: "none",
                        color: "#fff",
                        fontSize: "0.65rem",
                        fontWeight: "700"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="dias"
                      stroke="#00205b"
                      strokeWidth={2}
                      dot={{ fill: "#00205b", stroke: "#fcd116", strokeWidth: 1.5, r: 2.5 }}
                      activeDot={{ r: 4, fill: "#fcd116", stroke: "#00205b", strokeWidth: 1.5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.58rem",
                  color: "#64748b",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  paddingTop: "0.1rem",
                  borderTop: "1px solid #f1f5f9"
                }}
              >
                <span>Inicio: 08/01/2020</span>
                <span>Hoy: {stats.totalDays.toLocaleString("es-CO")} días</span>
              </div>
            </div>

            {/* Columna Derecha: Hallazgos & Hitos */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                padding: "0.4rem 0.6rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div style={{ textAlign: "center", marginBottom: "0.2rem" }}>
                <span
                  style={{
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    padding: "0.15rem 0.8rem",
                    borderRadius: "10px",
                    fontSize: "0.65rem",
                    fontWeight: "800",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    display: "inline-block"
                  }}
                >
                  HALLAZGOS & HITOS
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {/* Item 1 */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <span style={{ fontSize: "0.65rem" }}>📉</span>
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "#1e293b", lineHeight: "1.15" }}>
                    <strong>Próximo aniversario:</strong> Faltan{" "}
                    <span style={{ color: "#dc2626", fontWeight: "800" }}>
                      {stats.daysToNextAnniversary} días
                    </span>{" "}
                    para <strong>{stats.years + 1} años</strong> (08-01-{stats.nextAnniversaryYear}).
                  </div>
                </div>

                {/* Item 2 */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: "#fcd116",
                      color: "#00205b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <span style={{ fontSize: "0.65rem" }}>⚡</span>
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "#1e293b", lineHeight: "1.15" }}>
                    <strong>Total acumulado:</strong>{" "}
                    <strong>{stats.totalHours.toLocaleString("es-CO")} hrs</strong> y{" "}
                    <strong>{stats.totalWeeks.toLocaleString("es-CO")} semanas</strong> continuas.
                  </div>
                </div>

                {/* Item 3 */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      backgroundColor: "#00205b",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    <span style={{ fontSize: "0.65rem" }}>🔍</span>
                  </div>
                  <div style={{ fontSize: "0.64rem", color: "#1e293b", lineHeight: "1.15" }}>
                    <strong>Cálculo automático:</strong> Descuento diario sincronizado con el sistema.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              4. SECCIÓN INFERIOR: PLAN DE ACCIÓN (5 CÍRCULOS)
             ============================================================ */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              padding: "0.4rem 0.6rem"
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "0.35rem" }}>
              <span
                style={{
                  backgroundColor: "#00205b",
                  color: "#ffffff",
                  padding: "0.15rem 0.8rem",
                  borderRadius: "10px",
                  fontSize: "0.65rem",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  display: "inline-block"
                }}
              >
                PLAN DE ACCIÓN
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "0.4rem",
                alignItems: "center"
              }}
            >
              {/* Acción 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: "0.65rem" }}>📅</span>
                </div>
                <div style={{ fontSize: "0.6rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.1" }}>
                  Seguimiento diario de días.
                </div>
              </div>

              {/* Acción 2 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "#fcd116",
                    color: "#00205b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: "0.65rem" }}>👤</span>
                </div>
                <div style={{ fontSize: "0.6rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.1" }}>
                  Validación de novedades.
                </div>
              </div>

              {/* Acción 3 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: "0.65rem" }}>📍</span>
                </div>
                <div style={{ fontSize: "0.6rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.1" }}>
                  Acompañamiento en sitio.
                </div>
              </div>

              {/* Acción 4 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: "0.65rem" }}>📈</span>
                </div>
                <div style={{ fontSize: "0.6rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.1" }}>
                  Monitoreo semanal de rutina.
                </div>
              </div>

              {/* Acción 5 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "#fcd116",
                    color: "#00205b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: "0.65rem" }}>📢</span>
                </div>
                <div style={{ fontSize: "0.6rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.1" }}>
                  Socialización de resultados.
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              5. BARRA DE ACCIONES Y CONTROLES
             ============================================================ */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.4rem",
              paddingTop: "0.4rem",
              borderTop: "1px dashed #cbd5e1"
            }}
          >
            <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <Link
                href="/"
                style={{
                  background: "#00205b",
                  color: "#ffffff",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "5px",
                  fontWeight: "700",
                  fontSize: "0.7rem",
                  textDecoration: "none"
                }}
              >
                ← Volver al Panel
              </Link>

              <button
                onClick={handleCopySummary}
                style={{
                  background: copied ? "#10b981" : "#ffffff",
                  color: copied ? "#ffffff" : "#00205b",
                  border: "1px solid #cbd5e1",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "5px",
                  fontWeight: "700",
                  fontSize: "0.7rem",
                  cursor: "pointer"
                }}
              >
                {copied ? "✓ Copiado" : "📋 Copiar"}
              </button>

              <button
                onClick={toggleFullscreen}
                style={{
                  background: "#f8fafc",
                  color: "#00205b",
                  border: "1px solid #cbd5e1",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "5px",
                  fontWeight: "700",
                  fontSize: "0.7rem",
                  cursor: "pointer"
                }}
              >
                🖥️ {isFullscreen ? "Salir Pantalla Completa" : "Pantalla Completa"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: "600" }}>
                Fecha Base:
              </span>
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                style={{
                  padding: "0.2rem 0.4rem",
                  borderRadius: "5px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  color: "#00205b"
                }}
              />
              {baseDate !== FIXED_BASE_DATE && (
                <button
                  onClick={handleResetToFixed}
                  style={{
                    background: "#fcd116",
                    color: "#00205b",
                    border: "none",
                    padding: "0.2rem 0.4rem",
                    borderRadius: "5px",
                    fontWeight: "800",
                    fontSize: "0.68rem",
                    cursor: "pointer"
                  }}
                >
                  Restaurar
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Barra tricolor inferior */}
        <div style={{ display: "flex", height: "3px", width: "100%" }}>
          <div style={{ flex: 6, backgroundColor: "#00205b" }} />
          <div style={{ flex: 3, backgroundColor: "#fcd116" }} />
          <div style={{ flex: 1, backgroundColor: "#dc2626" }} />
        </div>
      </div>
    </div>
  );
}
