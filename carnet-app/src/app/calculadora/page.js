"use client";

import { useState, useEffect, useMemo } from "react";
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
  // Fecha fija solicitada por el usuario: 08 de Enero del 2020
  const FIXED_BASE_DATE = "2020-01-08";

  const [baseDate, setBaseDate] = useState(FIXED_BASE_DATE);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cálculos estadísticos y cronológicos
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
    const remainingDaysInWeek = totalDays % 7;
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

    // Mes actual en español formateado en mayúsculas
    const currentMonthName = now
      .toLocaleDateString("es-CO", { month: "long" })
      .toUpperCase();

    // Datos para el gráfico de tendencia histórica (2020 a 2026)
    const chartData = [
      { name: "2020", dias: 358, label: "358" },
      { name: "2021", dias: 723, label: "723" },
      { name: "2022", dias: 1088, label: "1.088" },
      { name: "2023", dias: 1453, label: "1.453" },
      { name: "2024", dias: 1819, label: "1.819" },
      { name: "2025", dias: 2184, label: "2.184" },
      {
        name: "2026",
        dias: totalDays,
        label: totalDays.toLocaleString("es-CO")
      }
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
      remainingDaysInWeek,
      totalHours,
      daysToNextAnniversary,
      nextAnniversaryYear: nextAnniversary.getFullYear(),
      currentMonthName,
      chartData
    };
  }, [baseDate, currentDate]);

  const handleCopySummary = () => {
    const text = `📊 INDICADOR CRONOLÓGICO - AB INBEV CD PEREIRA:\n• Fecha Base: 08 de Enero de 2020\n• Días Transcurridos: ${stats.daysFormatted}\n• Tiempo Exacto: ${stats.years} Años, ${stats.months} Meses, ${stats.days} Días\n• Semanas: ${stats.totalWeeks} | Horas: ${stats.totalHours.toLocaleString("es-CO")} hrs`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetToFixed = () => {
    setBaseDate(FIXED_BASE_DATE);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f6f9",
        padding: "1.5rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#00205b",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      {/* Contenedor tipo Lámina / Slide Corporativo */}
      <div
        style={{
          width: "100%",
          maxWidth: "1180px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 12px 35px rgba(0, 32, 91, 0.08)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* ============================================================
            1. CABECERA CORPORATIVA (ABInBev Style)
           ============================================================ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "stretch",
            borderBottom: "1px solid #e2e8f0",
            position: "relative",
            minHeight: "100px"
          }}
        >
          {/* Logo y Título Principal */}
          <div
            style={{
              padding: "1.5rem 2rem",
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              flex: 1
            }}
          >
            {/* Logo AB InBev */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#fcd116",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(252, 209, 22, 0.4)"
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "3px solid #00205b",
                    borderRadius: "50%"
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "1.6rem",
                  fontWeight: "900",
                  color: "#00205b",
                  letterSpacing: "-0.04em"
                }}
              >
                ABInBev
              </span>
            </div>

            <div style={{ borderLeft: "2px solid #cbd5e1", height: "45px" }} />

            {/* Títulos y Badge Amarillo */}
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
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
                  gap: "0.8rem",
                  marginTop: "0.3rem",
                  flexWrap: "wrap"
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: "800",
                    color: "#00205b",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}
                >
                  SEGUIMIENTO DIARIO 2026
                </span>
                <span
                  style={{
                    backgroundColor: "#fcd116",
                    color: "#00205b",
                    fontSize: "0.75rem",
                    fontWeight: "900",
                    padding: "0.2rem 0.8rem",
                    borderRadius: "20px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}
                >
                  CENTRO DE DISTRIBUCIÓN | PEREIRA
                </span>
              </div>
            </div>
          </div>

          {/* Banner Derecho Poligonal (MEJORAMOS JUNTOS PARA SER LOS MEJORES) */}
          <div
            style={{
              backgroundColor: "#00205b",
              color: "#ffffff",
              padding: "1.2rem 2.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              clipPath: "polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)",
              minWidth: "260px"
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                letterSpacing: "1px",
                textTransform: "uppercase"
              }}
            >
              MEJORAMOS JUNTOS
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: "700",
                letterSpacing: "1px",
                textTransform: "uppercase"
              }}
            >
              PARA SER
            </span>
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: "900",
                color: "#fcd116",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginTop: "0.1rem"
              }}
            >
              LOS MEJORES
            </span>
          </div>
        </div>

        {/* Barra tricolor divisoria (Azul, Amarillo, Rojo) */}
        <div style={{ display: "flex", height: "4px", width: "100%" }}>
          <div style={{ flex: 6, backgroundColor: "#00205b" }} />
          <div style={{ flex: 3, backgroundColor: "#fcd116" }} />
          <div style={{ flex: 1, backgroundColor: "#dc2626" }} />
        </div>

        {/* Contenido Principal de la Lámina */}
        <div style={{ padding: "2rem" }}>
          
          {/* ============================================================
              2. SECCIÓN SUPERIOR DE INDICADORES (3 CARDS HORIZONTALES)
             ============================================================ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.3fr 1fr",
              gap: "1.5rem",
              marginBottom: "2rem",
              alignItems: "center"
            }}
          >
            {/* Tarjeta Izquierda: Fecha Base (Azul Oscuro con Icono) */}
            <div
              style={{
                backgroundColor: "#00205b",
                borderRadius: "16px",
                padding: "1.5rem",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "1.2rem",
                boxShadow: "0 8px 20px rgba(0, 32, 91, 0.15)",
                border: "1px solid #00153c"
              }}
            >
              {/* Icono Circular Blanco con Ondas */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
                }}
              >
                <span style={{ fontSize: "1.8rem" }}>🗓️</span>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "800",
                    color: "rgba(255, 255, 255, 0.8)",
                    letterSpacing: "1px",
                    textTransform: "uppercase"
                  }}
                >
                  FECHA BASE INICIAL
                </div>
                <div
                  style={{
                    fontSize: "1.9rem",
                    fontWeight: "900",
                    color: "#fcd116",
                    lineHeight: "1.1",
                    margin: "0.2rem 0"
                  }}
                >
                  08-01-2020
                </div>
                <div style={{ fontSize: "0.75rem", color: "#93c5fd", fontWeight: "600" }}>
                  8 de Enero del 2020 (Fija)
                </div>
              </div>
            </div>

            {/* Tarjeta Central: Gran Número de Días Transcurridos (Blanco y Azul) */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "1.5rem 1rem",
                textAlign: "center",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "900",
                  color: "#00205b",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase"
                }}
              >
                {stats.currentMonthName} 2026
              </span>

              {/* Gran Número en Azul con coma decimal */}
              <div
                style={{
                  fontSize: "4.8rem",
                  fontWeight: "900",
                  color: "#00205b",
                  lineHeight: "1",
                  margin: "0.3rem 0",
                  letterSpacing: "-0.04em",
                  fontVariantNumeric: "tabular-nums"
                }}
              >
                {isClient ? stats.daysFormatted : "2.410,0"}
              </div>

              {/* Barra inferior y label */}
              <div
                style={{
                  width: "80%",
                  height: "2px",
                  backgroundColor: "#00205b",
                  marginBottom: "0.4rem"
                }}
              />
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: "800",
                  color: "#00205b",
                  letterSpacing: "1px",
                  textTransform: "uppercase"
                }}
              >
                DÍAS TRANSCURRIDOS ACUMULADOS
              </span>
            </div>

            {/* Tarjeta Derecha: Tiempo Exacto (Blanca con Acento Amarillo) */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "1.5rem",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
                display: "flex",
                alignItems: "center",
                gap: "1.2rem"
              }}
            >
              {/* Icono con Anillo Amarillo */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  border: "3px solid #fcd116",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  backgroundColor: "#fffdf0"
                }}
              >
                <span style={{ fontSize: "1.8rem" }}>⏱️</span>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "800",
                    color: "#64748b",
                    letterSpacing: "1px",
                    textTransform: "uppercase"
                  }}
                >
                  TIEMPO ACUMULADO
                </div>
                <div
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "900",
                    color: "#00205b",
                    lineHeight: "1.2",
                    margin: "0.2rem 0"
                  }}
                >
                  {stats.years} Años, {stats.months}m, {stats.days}d
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>
                  {isClient ? `${stats.hours}h ${stats.minutes}m ${stats.seconds}s (En vivo)` : "Calculando..."}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              3. SECCIÓN MEDIA: GRÁFICO DE TENDENCIA Y HALLAZGOS (2 COLUMNAS)
             ============================================================ */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: "2rem",
              marginBottom: "2rem"
            }}
          >
            {/* Columna Izquierda: Gráfico de Tendencia Histórica */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "1.5rem 1.5rem 1rem 1.5rem",
                boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              {/* Header con Pastilla Azul */}
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <span
                  style={{
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    padding: "0.4rem 1.8rem",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: "800",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    display: "inline-block"
                  }}
                >
                  TENDENCIA ACUMULADA (2020 - 2026)
                </span>
              </div>

              {/* Gráfico Recharts */}
              <div style={{ width: "100%", height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.chartData}
                    margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: "#cbd5e1" }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 2600]}
                    />
                    <Tooltip
                      formatter={(value) => [`${value.toLocaleString("es-CO")} días`, "Acumulado"]}
                      contentStyle={{
                        backgroundColor: "#00205b",
                        borderRadius: "8px",
                        border: "none",
                        color: "#fff",
                        fontSize: "0.85rem",
                        fontWeight: "700"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="dias"
                      stroke="#00205b"
                      strokeWidth={3}
                      dot={{ fill: "#00205b", stroke: "#fcd116", strokeWidth: 2, r: 5 }}
                      activeDot={{ r: 7, fill: "#fcd116", stroke: "#00205b", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                  color: "#64748b",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  paddingTop: "0.5rem",
                  borderTop: "1px solid #f1f5f9"
                }}
              >
                <span>Base: Ene 2020 (0 días)</span>
                <span>Progresión Lineal Continua</span>
                <span>Hoy: {stats.totalDays.toLocaleString("es-CO")} días</span>
              </div>
            </div>

            {/* Columna Derecha: Hallazgos & Hitos */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "1.5rem",
                boxShadow: "0 4px 15px rgba(0,0,0,0.02)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              {/* Header con Pastilla Azul */}
              <div style={{ textAlign: "center", marginBottom: "1.2rem" }}>
                <span
                  style={{
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    padding: "0.4rem 2rem",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: "800",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    display: "inline-block"
                  }}
                >
                  HALLAZGOS & HITOS
                </span>
              </div>

              {/* Lista de Hallazgos con Iconos Circulares */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                {/* Item 1: Rojo */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 3px 8px rgba(220, 38, 38, 0.3)"
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>📉</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#1e293b", lineHeight: "1.4" }}>
                      <strong>Próximo aniversario oficial:</strong> Faltan{" "}
                      <span style={{ color: "#dc2626", fontWeight: "800" }}>
                        {stats.daysToNextAnniversary} días
                      </span>{" "}
                      para completar <strong>{stats.years + 1} años</strong> ininterrumpidos (08 de Enero de {stats.nextAnniversaryYear}).
                    </div>
                  </div>
                </div>

                {/* Item 2: Amarillo */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      backgroundColor: "#fcd116",
                      color: "#00205b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 3px 8px rgba(252, 209, 22, 0.4)"
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>⚡</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#1e293b", lineHeight: "1.4" }}>
                      <strong>Acumulado total de horas:</strong> Se registran{" "}
                      <strong>{stats.totalHours.toLocaleString("es-CO")} horas</strong> y{" "}
                      <strong>{stats.totalWeeks.toLocaleString("es-CO")} semanas</strong> completas de seguimiento diario.
                    </div>
                  </div>
                </div>

                {/* Item 3: Azul Marino */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      backgroundColor: "#00205b",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 3px 8px rgba(0, 32, 91, 0.3)"
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>🔍</span>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "#1e293b", lineHeight: "1.4" }}>
                      <strong>Cálculo automático continuo:</strong> El indicador se descuenta y actualiza día a día con la fecha actual del sistema.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              4. SECCIÓN INFERIOR: PLAN DE ACCIÓN (5 CÍRCULOS HORIZONTALES)
             ============================================================ */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "1.5rem",
              boxShadow: "0 4px 15px rgba(0,0,0,0.02)"
            }}
          >
            {/* Header con Pastilla Azul */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <span
                style={{
                  backgroundColor: "#00205b",
                  color: "#ffffff",
                  padding: "0.4rem 2rem",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: "800",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  display: "inline-block"
                }}
              >
                PLAN DE ACCIÓN
              </span>
            </div>

            {/* 5 Columnas de Acciones */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "1rem",
                alignItems: "flex-start"
              }}
            >
              {/* Acción 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>📅</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.3" }}>
                  Seguimiento diario de días transcurridos.
                </div>
              </div>

              {/* Acción 2 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "#fcd116",
                    color: "#00205b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>👤</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.3" }}>
                  Validación de novedades con Responsables de ruta.
                </div>
              </div>

              {/* Acción 3 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>📍</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.3" }}>
                  Acompañamiento a puntos con menor cumplimiento.
                </div>
              </div>

              {/* Acción 4 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "#00205b",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>📈</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.3" }}>
                  Seguimiento semanal del indicador.
                </div>
              </div>

              {/* Acción 5 */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    backgroundColor: "#fcd116",
                    color: "#00205b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>📢</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#1e293b", fontWeight: "600", lineHeight: "1.3" }}>
                  Socialización de resultados en la rutina operacional.
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              5. BOTONES DE ACCIÓN Y CONFIGURACIÓN INFERIOR
             ============================================================ */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px dashed #cbd5e1"
            }}
          >
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <Link
                href="/"
                style={{
                  background: "#00205b",
                  color: "#ffffff",
                  padding: "0.6rem 1.4rem",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
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
                  padding: "0.6rem 1.4rem",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                {copied ? "✓ Copiado" : "📋 Copiar Reporte"}
              </button>
            </div>

            {/* Ajuste opcional de fecha con restauración rápida */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: "600" }}>
                Fecha Base:
              </span>
              <input
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
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
                    padding: "0.4rem 0.8rem",
                    borderRadius: "8px",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  Restaurar 08-01-2020
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Barra tricolor inferior (Footer) */}
        <div style={{ display: "flex", height: "6px", width: "100%" }}>
          <div style={{ flex: 6, backgroundColor: "#00205b" }} />
          <div style={{ flex: 3, backgroundColor: "#fcd116" }} />
          <div style={{ flex: 1, backgroundColor: "#dc2626" }} />
        </div>
      </div>
    </div>
  );
}
