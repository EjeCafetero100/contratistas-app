"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

export default function CalculadoraPage() {
  // Fecha fija solicitada: 08 de Enero del 2020
  const FIXED_BASE_DATE = "2020-01-08";

  const [baseDate, setBaseDate] = useState(FIXED_BASE_DATE);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [copied, setCopied] = useState(false);

  // Actualizador en vivo cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cálculos de tiempo
  const stats = useMemo(() => {
    const [bYear, bMonth, bDay] = baseDate.split("-").map(Number);
    const start = new Date(bYear, bMonth - 1, bDay, 0, 0, 0, 0);
    const now = currentDate;

    const diffMs = now.getTime() - start.getTime();
    const isPast = diffMs >= 0;
    const absDiffMs = Math.abs(diffMs);

    // Total de días
    const totalDays = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    
    // Horas, minutos, segundos restantes del día actual
    const hours = Math.floor((absDiffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((absDiffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((absDiffMs / 1000) % 60);

    // Total de semanas
    const totalWeeks = Math.floor(totalDays / 7);
    const remainingDaysInWeek = totalDays % 7;

    // Total de horas
    const totalHours = Math.floor(absDiffMs / (1000 * 60 * 60));

    // Desglose en Años, Meses, Días
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

    // Progreso hacia el siguiente año cumplido (aniversario)
    const nextAnniversary = new Date(now.getFullYear(), bMonth - 1, bDay);
    if (nextAnniversary < now) {
      nextAnniversary.setFullYear(now.getFullYear() + 1);
    }
    const lastAnniversary = new Date(nextAnniversary.getFullYear() - 1, bMonth - 1, bDay);
    const progressMs = now.getTime() - lastAnniversary.getTime();
    const cycleTotalMs = nextAnniversary.getTime() - lastAnniversary.getTime();
    const yearProgressPercent = Math.min(100, Math.max(0, Math.round((progressMs / cycleTotalMs) * 100)));
    const daysToNextAnniversary = Math.ceil((nextAnniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalDays,
      daysFormatted: totalDays.toLocaleString("es-CO") + ".0",
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      totalWeeks,
      remainingDaysInWeek,
      totalHours,
      yearProgressPercent,
      daysToNextAnniversary,
      nextAnniversaryYear: nextAnniversary.getFullYear(),
      isPast
    };
  }, [baseDate, currentDate]);

  const handleCopySummary = () => {
    const text = `📊 Resumen Calculadora de Días:\n• Fecha Base: 08 de Enero de 2020\n• Días Transcurridos: ${stats.daysFormatted}\n• Tiempo Exacto: ${stats.years} años, ${stats.months} meses y ${stats.days} días\n• Horas Totales: ${stats.totalHours.toLocaleString("es-CO")} hrs`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetToFixed = () => {
    setBaseDate(FIXED_BASE_DATE);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      color: "#00205b",
      padding: "2.5rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{ width: "100%", maxWidth: "1150px" }}>
        
        {/* Barra superior de navegación y acciones */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem"
        }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#ffffff",
              color: "#00205b",
              padding: "0.7rem 1.4rem",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "0.9rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0, 32, 91, 0.05)",
              textDecoration: "none",
              transition: "all 0.2s ease"
            }}
          >
            ← Volver al Panel
          </Link>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button
              onClick={handleCopySummary}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: copied ? "#10b981" : "#ffffff",
                color: copied ? "#ffffff" : "#00205b",
                padding: "0.7rem 1.4rem",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "0.9rem",
                border: copied ? "1px solid #10b981" : "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0, 32, 91, 0.05)",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {copied ? "✓ Copiado al portapapeles" : "📋 Copiar Resumen"}
            </button>

            {baseDate !== FIXED_BASE_DATE && (
              <button
                onClick={handleResetToFixed}
                style={{
                  background: "#fcd116",
                  color: "#00205b",
                  padding: "0.7rem 1.4rem",
                  borderRadius: "12px",
                  fontWeight: "800",
                  fontSize: "0.9rem",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(252, 209, 22, 0.3)",
                  cursor: "pointer"
                }}
              >
                🔄 Restaurar 08-01-2020
              </button>
            )}
          </div>
        </div>

        {/* Encabezado Principal */}
        <div style={{
          textAlign: "center",
          marginBottom: "2.5rem"
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(252, 209, 22, 0.2)",
            border: "1px solid #fcd116",
            color: "#854d0e",
            padding: "0.4rem 1.2rem",
            borderRadius: "50px",
            fontSize: "0.85rem",
            fontWeight: "800",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "0.8rem"
          }}>
            ⭐ Módulo de Cálculo Diario
          </div>
          <h1 style={{
            fontSize: "2.8rem",
            fontWeight: "900",
            color: "#00205b",
            letterSpacing: "-0.03em",
            marginBottom: "0.5rem",
            textTransform: "uppercase"
          }}>
            Calculadora de Tiempo
          </h1>
          <p style={{
            color: "#475569",
            fontSize: "1.1rem",
            maxWidth: "650px",
            margin: "0 auto"
          }}>
            Contador cronológico automático fijado desde el <strong>08 de enero de 2020</strong> calculando en tiempo real con la fecha de hoy.
          </p>
        </div>

        {/* Tarjeta Hero Principal con Gran Número */}
        <div style={{
          background: "#ffffff",
          borderRadius: "24px",
          border: "2px solid #e2e8f0",
          boxShadow: "0 20px 45px -10px rgba(0, 32, 91, 0.12)",
          padding: "3.5rem 2rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          marginBottom: "2.5rem"
        }}>
          {/* Acentos decorativos en amarillo y azul */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: "linear-gradient(90deg, #00205b 0%, #0284c7 50%, #fcd116 100%)"
          }} />

          {/* Badges de Fechas */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem"
          }}>
            <div style={{
              background: "#00205b",
              color: "#ffffff",
              padding: "0.6rem 1.4rem",
              borderRadius: "14px",
              fontSize: "0.9rem",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              boxShadow: "0 4px 12px rgba(0, 32, 91, 0.2)"
            }}>
              <span style={{ color: "#fcd116", fontSize: "1.1rem" }}>📌</span>
              <span>Fecha Base: <strong>08 de Enero de 2020</strong></span>
            </div>

            <div style={{
              background: "#f8fafc",
              color: "#00205b",
              border: "1px solid #cbd5e1",
              padding: "0.6rem 1.4rem",
              borderRadius: "14px",
              fontSize: "0.9rem",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span>📅</span>
              <span>Hoy: <strong>{currentDate.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}</strong></span>
            </div>

            <div style={{
              background: "rgba(252, 209, 22, 0.15)",
              color: "#854d0e",
              border: "1px solid #fcd116",
              padding: "0.6rem 1.4rem",
              borderRadius: "14px",
              fontSize: "0.9rem",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span>⏱️</span>
              <span>{currentDate.toLocaleTimeString("es-CO")}</span>
            </div>
          </div>

          <p style={{
            color: "#64748b",
            fontSize: "1.15rem",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "3px",
            marginBottom: "0.5rem"
          }}>
            Total de Días Transcurridos
          </p>

          {/* El Gran Número Pro */}
          <div style={{
            fontSize: "clamp(4.5rem, 12vw, 9.5rem)",
            fontWeight: "900",
            color: "#00205b",
            lineHeight: "1",
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
            margin: "0.5rem 0",
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: "0.2rem"
          }}>
            <span>{stats.totalDays.toLocaleString("es-CO")}</span>
            <span style={{ color: "#f59e0b", fontSize: "0.55em", fontWeight: "800" }}>.0</span>
          </div>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "linear-gradient(135deg, #fcd116 0%, #f59e0b 100%)",
            color: "#00205b",
            padding: "0.6rem 2rem",
            borderRadius: "50px",
            fontWeight: "900",
            fontSize: "1.1rem",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginTop: "1rem",
            boxShadow: "0 6px 20px rgba(252, 209, 22, 0.4)"
          }}>
            ⚡ Días Descontados Automáticamente
          </div>

          {/* Reloj en vivo de precisión (Horas, Minutos, Segundos) */}
          <div style={{
            marginTop: "2.5rem",
            paddingTop: "2rem",
            borderTop: "1px dashed #e2e8f0",
            display: "flex",
            justifyContent: "center",
            gap: "1.5rem",
            flexWrap: "wrap"
          }}>
            <div style={{
              background: "#f8fafc",
              padding: "0.75rem 1.5rem",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              minWidth: "110px"
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#00205b" }}>{stats.hours}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Horas</div>
            </div>
            <div style={{
              background: "#f8fafc",
              padding: "0.75rem 1.5rem",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              minWidth: "110px"
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#00205b" }}>{stats.minutes}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Minutos</div>
            </div>
            <div style={{
              background: "#f8fafc",
              padding: "0.75rem 1.5rem",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              minWidth: "110px"
            }}>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#f59e0b" }}>{stats.seconds}</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700", textTransform: "uppercase" }}>Segundos</div>
            </div>
          </div>
        </div>

        {/* Cuadrícula de Métricas Detalladas (Cards Profesionales) */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2.5rem"
        }}>
          
          {/* Card 1: Desglose en Años, Meses y Días */}
          <div style={{
            background: "#ffffff",
            padding: "1.8rem",
            borderRadius: "18px",
            border: "2px solid #00205b",
            boxShadow: "0 8px 24px rgba(0, 32, 91, 0.06)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{
                display: "inline-block",
                background: "rgba(0, 32, 91, 0.08)",
                color: "#00205b",
                padding: "0.3rem 0.8rem",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: "800",
                textTransform: "uppercase",
                marginBottom: "1rem"
              }}>
                📅 Desglose Calendario
              </div>
              <h3 style={{ fontSize: "1.1rem", color: "#64748b", margin: 0, fontWeight: "700" }}>
                Tiempo Acumulado
              </h3>
              <div style={{ fontSize: "2rem", fontWeight: "900", color: "#00205b", margin: "0.5rem 0" }}>
                {stats.years} <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#64748b" }}>años</span>
              </div>
              <p style={{ color: "#475569", fontSize: "0.95rem", fontWeight: "600" }}>
                Con <strong>{stats.months}</strong> meses y <strong>{stats.days}</strong> días adicionales
              </p>
            </div>
            <div style={{ marginTop: "1rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.8rem", fontSize: "0.85rem", color: "#64748b" }}>
              Cálculo de calendario gregoriano
            </div>
          </div>

          {/* Card 2: Semanas Totales */}
          <div style={{
            background: "#ffffff",
            padding: "1.8rem",
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 24px rgba(0, 32, 91, 0.06)",
            borderTop: "5px solid #fcd116",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{
                display: "inline-block",
                background: "rgba(252, 209, 22, 0.2)",
                color: "#854d0e",
                padding: "0.3rem 0.8rem",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: "800",
                textTransform: "uppercase",
                marginBottom: "1rem"
              }}>
                🗓️ En Semanas
              </div>
              <h3 style={{ fontSize: "1.1rem", color: "#64748b", margin: 0, fontWeight: "700" }}>
                Total Semanas
              </h3>
              <div style={{ fontSize: "2rem", fontWeight: "900", color: "#00205b", margin: "0.5rem 0" }}>
                {stats.totalWeeks.toLocaleString("es-CO")} <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#64748b" }}>sem.</span>
              </div>
              <p style={{ color: "#475569", fontSize: "0.95rem", fontWeight: "600" }}>
                Más <strong>{stats.remainingDaysInWeek}</strong> días transcurridos
              </p>
            </div>
            <div style={{ marginTop: "1rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.8rem", fontSize: "0.85rem", color: "#64748b" }}>
              Equivalente a {(stats.totalWeeks / 52).toFixed(1)} años laborales
            </div>
          </div>

          {/* Card 3: Total Horas */}
          <div style={{
            background: "#ffffff",
            padding: "1.8rem",
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 24px rgba(0, 32, 91, 0.06)",
            borderTop: "5px solid #0284c7",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{
                display: "inline-block",
                background: "rgba(2, 132, 199, 0.1)",
                color: "#0369a1",
                padding: "0.3rem 0.8rem",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: "800",
                textTransform: "uppercase",
                marginBottom: "1rem"
              }}>
                ⏱️ Horas Totales
              </div>
              <h3 style={{ fontSize: "1.1rem", color: "#64748b", margin: 0, fontWeight: "700" }}>
                Horas Acumuladas
              </h3>
              <div style={{ fontSize: "2rem", fontWeight: "900", color: "#00205b", margin: "0.5rem 0" }}>
                {stats.totalHours.toLocaleString("es-CO")} <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#64748b" }}>hrs</span>
              </div>
              <p style={{ color: "#475569", fontSize: "0.95rem", fontWeight: "600" }}>
                Equivalente a <strong>{(stats.totalHours * 60).toLocaleString("es-CO")}</strong> minutos
              </p>
            </div>
            <div style={{ marginTop: "1rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.8rem", fontSize: "0.85rem", color: "#64748b" }}>
              Cálculo ininterrumpido 24/7
            </div>
          </div>

          {/* Card 4: Próximo Hito / Aniversario */}
          <div style={{
            background: "#ffffff",
            padding: "1.8rem",
            borderRadius: "18px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 24px rgba(0, 32, 91, 0.06)",
            borderTop: "5px solid #10b981",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{
                display: "inline-block",
                background: "rgba(16, 185, 129, 0.1)",
                color: "#047857",
                padding: "0.3rem 0.8rem",
                borderRadius: "8px",
                fontSize: "0.75rem",
                fontWeight: "800",
                textTransform: "uppercase",
                marginBottom: "1rem"
              }}>
                🎯 Próximo Hito
              </div>
              <h3 style={{ fontSize: "1.1rem", color: "#64748b", margin: 0, fontWeight: "700" }}>
                Faltan para {stats.nextAnniversaryYear}
              </h3>
              <div style={{ fontSize: "2rem", fontWeight: "900", color: "#10b981", margin: "0.5rem 0" }}>
                {stats.daysToNextAnniversary} <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#64748b" }}>días</span>
              </div>
              
              {/* Barra de progreso */}
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{
                  height: "8px",
                  background: "#e2e8f0",
                  borderRadius: "10px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${stats.yearProgressPercent}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #fcd116 0%, #10b981 100%)",
                    borderRadius: "10px"
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem", fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>
                  <span>Año actual</span>
                  <span>{stats.yearProgressPercent}%</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: "1rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.8rem", fontSize: "0.85rem", color: "#64748b" }}>
              Meta al 08 de Enero de {stats.nextAnniversaryYear}
            </div>
          </div>

        </div>

        {/* Panel de Configuración Opcional */}
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          padding: "2rem",
          boxShadow: "0 4px 15px rgba(0, 32, 91, 0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem"
        }}>
          <div>
            <h3 style={{ margin: "0 0 0.4rem 0", color: "#00205b", fontSize: "1.2rem", fontWeight: "800" }}>
              ⚙️ Ajuste de Fecha Base
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
              La fecha predeterminada está fijada en el <strong>08/01/2020</strong>. Si necesitas calcular desde otra fecha específica, selecciónala aquí:
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <input
              type="date"
              value={baseDate}
              onChange={(e) => setBaseDate(e.target.value)}
              style={{
                padding: "0.75rem 1.2rem",
                borderRadius: "12px",
                border: "2px solid #00205b",
                color: "#00205b",
                fontWeight: "700",
                fontSize: "1rem",
                outline: "none",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0, 32, 91, 0.08)",
                cursor: "pointer"
              }}
            />

            <button
              onClick={handleResetToFixed}
              style={{
                background: baseDate === FIXED_BASE_DATE ? "#f1f5f9" : "#fcd116",
                color: "#00205b",
                padding: "0.75rem 1.4rem",
                borderRadius: "12px",
                fontWeight: "800",
                fontSize: "0.95rem",
                border: "none",
                cursor: baseDate === FIXED_BASE_DATE ? "default" : "pointer",
                opacity: baseDate === FIXED_BASE_DATE ? 0.7 : 1,
                transition: "all 0.2s"
              }}
            >
              Fijar 08-01-2020
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
