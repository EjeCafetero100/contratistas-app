"use client";

import { useState, useEffect } from "react";
import { useCity } from "@/context/CityContext";

export default function CalculadoraAccidentes() {
  const { selectedCity, selectCity } = useCity();
  const currentCity = (selectedCity || "Pereira").toLowerCase();
  const isPereira = currentCity === "pereira";
  const isArmenia = currentCity === "armenia";
  const isBarranca = currentCity.includes("barranca");

  // Fechas fijas
  const FIXED_PEREIRA_DATE = "2020-01-08"; // 08-01-2020
  const FIXED_PEREIRA_SIF_DATE = "2026-08-10"; // 10-08-2026

  const FIXED_ARMENIA_DATE = "2018-03-17"; // 17-03-2018
  const FIXED_ARMENIA_SIF_DATE = "2026-08-10"; // 10-08-2026

  const FIXED_BARRANCA_DATE = "2018-01-18"; // 18-01-2018
  const FIXED_BARRANCA_SIF_DATE = "2026-07-22"; // 22-07-2026 (22 de Julio de 2026)

  // Formateadores de fecha amigables
  const formatDateDMY = (isoDate) => {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const [year, month, day] = parts;
    return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
  };

  const formatDateLong = (isoDate) => {
    if (!isoDate) return "";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const [year, month, day] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  };

  // Fecha del último accidente (Pereira: 08-01-2020, Armenia: 17-03-2018, Barrancabermeja: 18-01-2018)
  const [lastAccidentDate, setLastAccidentDate] = useState(() => {
    if (typeof window !== "undefined") {
      if (isBarranca) {
        const manualBarranca = localStorage.getItem("manual_accident_date_barranca_v2");
        if (manualBarranca) return manualBarranca;
        return FIXED_BARRANCA_DATE;
      }
      if (isArmenia) {
        const manualArmenia = localStorage.getItem("manual_accident_date_armenia_v2");
        if (manualArmenia) return manualArmenia;
        return FIXED_ARMENIA_DATE;
      }
      if (isPereira) {
        const manualPereira = localStorage.getItem("manual_accident_date_pereira_v2");
        if (manualPereira) return manualPereira;
        return FIXED_PEREIRA_DATE;
      }
      const cityKey = (selectedCity || "general").toLowerCase();
      const saved = localStorage.getItem(`last_accident_date_${cityKey}`);
      if (saved) return saved;
    }
    if (isBarranca) return FIXED_BARRANCA_DATE;
    if (isArmenia) return FIXED_ARMENIA_DATE;
    if (isPereira) return FIXED_PEREIRA_DATE;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() - 21);
    return defaultDate.toISOString().split('T')[0];
  });

  const [daysWithoutAccidents, setDaysWithoutAccidents] = useState(0);

  // Fecha SIF (Pereira y Armenia al 10-08-2026, Barrancabermeja al 22-07-2026)
  const [lastSifDate, setLastSifDate] = useState(() => {
    if (typeof window !== "undefined") {
      // Limpiar versiones anteriores erróneas si existen
      localStorage.removeItem("manual_sif_date_barranca_v2");
      if (isBarranca) {
        const manualBarrancaSif = localStorage.getItem("manual_sif_date_barranca_v3");
        if (manualBarrancaSif) return manualBarrancaSif;
        return FIXED_BARRANCA_SIF_DATE;
      }
      if (isArmenia) {
        const manualArmeniaSif = localStorage.getItem("manual_sif_date_armenia_v2");
        if (manualArmeniaSif) return manualArmeniaSif;
        return FIXED_ARMENIA_SIF_DATE;
      }
      if (isPereira) {
        const manual = localStorage.getItem("manual_sif_date_pereira_v2");
        if (manual) return manual;
        return FIXED_PEREIRA_SIF_DATE;
      }
      const cityKey = (selectedCity || "general").toLowerCase();
      const saved = localStorage.getItem(`last_sif_date_${cityKey}`);
      if (saved) return saved;
    }
    if (isBarranca) return FIXED_BARRANCA_SIF_DATE;
    return FIXED_ARMENIA_SIF_DATE; // Default siempre 10-08-2026
  });

  const [daysWithoutSif, setDaysWithoutSif] = useState(0);

  // Sincronizar fechas según la sede seleccionada
  useEffect(() => {
    if (isBarranca) {
      const manualBarranca = localStorage.getItem("manual_accident_date_barranca_v2");
      setLastAccidentDate(manualBarranca || FIXED_BARRANCA_DATE);

      const manualBarrancaSif = localStorage.getItem("manual_sif_date_barranca_v3");
      setLastSifDate(manualBarrancaSif || FIXED_BARRANCA_SIF_DATE);
    } else if (isArmenia) {
      const manualArmenia = localStorage.getItem("manual_accident_date_armenia_v2");
      setLastAccidentDate(manualArmenia || FIXED_ARMENIA_DATE);

      const manualArmeniaSif = localStorage.getItem("manual_sif_date_armenia_v2");
      setLastSifDate(manualArmeniaSif || FIXED_ARMENIA_SIF_DATE);
    } else if (isPereira) {
      const manualAccident = localStorage.getItem("manual_accident_date_pereira_v2");
      setLastAccidentDate(manualAccident || FIXED_PEREIRA_DATE);

      const manualSif = localStorage.getItem("manual_sif_date_pereira_v2");
      setLastSifDate(manualSif || FIXED_PEREIRA_SIF_DATE);
    } else {
      const cityKey = (selectedCity || "general").toLowerCase();
      const savedAccident = localStorage.getItem(`last_accident_date_${cityKey}`);
      setLastAccidentDate(savedAccident || FIXED_ARMENIA_DATE);

      const savedSif = localStorage.getItem(`last_sif_date_${cityKey}`);
      setLastSifDate(savedSif || FIXED_ARMENIA_SIF_DATE);
    }
  }, [selectedCity, isArmenia, isPereira, isBarranca]);

  // Manejar cambio manual de fecha de accidentes
  const handleAccidentDateChange = (newDate) => {
    setLastAccidentDate(newDate);
    if (isBarranca) {
      if (newDate === FIXED_BARRANCA_DATE) {
        localStorage.removeItem("manual_accident_date_barranca_v2");
      } else {
        localStorage.setItem("manual_accident_date_barranca_v2", newDate);
      }
      localStorage.setItem("last_accident_date_barrancabermeja", newDate);
    } else if (isArmenia) {
      if (newDate === FIXED_ARMENIA_DATE) {
        localStorage.removeItem("manual_accident_date_armenia_v2");
      } else {
        localStorage.setItem("manual_accident_date_armenia_v2", newDate);
      }
      localStorage.setItem("last_accident_date_armenia", newDate);
    } else if (isPereira) {
      if (newDate === FIXED_PEREIRA_DATE) {
        localStorage.removeItem("manual_accident_date_pereira_v2");
      } else {
        localStorage.setItem("manual_accident_date_pereira_v2", newDate);
      }
      localStorage.setItem("last_accident_date_pereira", newDate);
    } else {
      const cityKey = (selectedCity || "general").toLowerCase();
      localStorage.setItem(`last_accident_date_${cityKey}`, newDate);
    }
  };

  // Manejar cambio manual de fecha SIF
  const handleSifDateChange = (newDate) => {
    setLastSifDate(newDate);
    if (isBarranca) {
      if (newDate === FIXED_BARRANCA_SIF_DATE) {
        localStorage.removeItem("manual_sif_date_barranca_v3");
      } else {
        localStorage.setItem("manual_sif_date_barranca_v3", newDate);
      }
      localStorage.setItem("last_sif_date_barrancabermeja", newDate);
    } else if (isArmenia) {
      if (newDate === FIXED_ARMENIA_SIF_DATE) {
        localStorage.removeItem("manual_sif_date_armenia_v2");
      } else {
        localStorage.setItem("manual_sif_date_armenia_v2", newDate);
      }
      localStorage.setItem("last_sif_date_armenia", newDate);
    } else if (isPereira) {
      if (newDate === FIXED_PEREIRA_SIF_DATE) {
        localStorage.removeItem("manual_sif_date_pereira_v2");
      } else {
        localStorage.setItem("manual_sif_date_pereira_v2", newDate);
      }
      localStorage.setItem("last_sif_date_pereira", newDate);
    } else {
      const cityKey = (selectedCity || "general").toLowerCase();
      localStorage.setItem(`last_sif_date_${cityKey}`, newDate);
    }
  };

  // Cálculo de días sin accidentes desde la fecha
  useEffect(() => {
    if (!lastAccidentDate) return;
    const [year, month, day] = lastAccidentDate.split('-').map(Number);
    const lastDateObj = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const diffTime = today.getTime() - lastDateObj.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    setDaysWithoutAccidents(diffDays);
  }, [lastAccidentDate]);

  // Cálculo de días sin SIF
  useEffect(() => {
    if (!lastSifDate) return;
    const [year, month, day] = lastSifDate.split('-').map(Number);
    const lastDateObj = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const diffTime = today.getTime() - lastDateObj.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    setDaysWithoutSif(diffDays);
  }, [lastSifDate]);

  return (
    <div className="container" style={{ maxWidth: '1050px', position: 'relative' }}>


      <header style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#00205b', color: '#fcd116', padding: '0.35rem 1.1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          📍 CENTRO DE DISTRIBUCIÓN: {selectedCity ? selectedCity.toUpperCase() : 'ARMENIA'}
        </div>

        {/* Selector rápido de CD */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['Armenia', 'Pereira', 'Barrancabermeja'].map((city) => {
            const active = (selectedCity || 'Armenia').toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                onClick={() => selectCity(city)}
                style={{
                  backgroundColor: active ? '#00205b' : '#ffffff',
                  color: active ? '#fcd116' : '#475569',
                  border: active ? '2px solid #00205b' : '1px solid #cbd5e1',
                  borderRadius: '20px',
                  padding: '0.35rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: active ? '0 4px 10px rgba(0,32,91,0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                📍 {city}
              </button>
            );
          })}
        </div>

        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏱️ Calculadora de Accidentes</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          {isBarranca
            ? "CD Barrancabermeja • Accidente: 18-01-2018 (Incidente con montacargas) | SIF Potencial: 22-07-2026 (Golpe en la cabeza con objeto en taller aliado) (solo actualizable manualmente)."
            : isArmenia
            ? "CD Armenia • Accidente: 17-03-2018 (Explosión de botella) | SIF Potencial: 10-08-2026 (solo actualizable manualmente)."
            : isPereira 
            ? "CD Pereira • Accidente: 08-01-2020 | SIF Potencial: 10-08-2026 (solo actualizable manualmente)."
            : "Seguimiento de nuestro compromiso con la Seguridad y Salud en el Trabajo"
          }
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2.5rem', width: '100%' }}>
        
        {/* Contenedor Principal del Gran Número de Accidentes */}
        <div 
          className="glass-panel" 
          style={{ 
            width: '100%', 
            padding: '2.25rem 2rem 2.75rem', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '430px',
            boxShadow: '0 20px 40px rgba(162, 219, 115, 0.15)',
            border: '2px solid rgba(162, 219, 115, 0.3)',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(240, 255, 230, 0.6) 100%)',
            position: 'relative'
          }}
        >
          {/* Fila Superior de Insignia de Evento (En flujo normal, nunca tapa la información) */}
          <div style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem' }}>
            {isBarranca && (
              <div
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '0.45rem 1.1rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: '900',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  border: '2px solid rgba(255, 255, 255, 0.7)',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  maxWidth: '100%',
                  lineHeight: '1.25'
                }}
              >
                <span style={{ fontSize: '1.15rem' }}>🚜</span>
                <span>INCIDENTE CON MONTACARGAS</span>
              </div>
            )}

            {isArmenia && (
              <div
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '0.45rem 1.1rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: '900',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  border: '2px solid rgba(255, 255, 255, 0.7)',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  maxWidth: '100%',
                  lineHeight: '1.25'
                }}
              >
                <span style={{ fontSize: '1.15rem' }}>💥</span>
                <span>EXPLOSIÓN DE BOTELLA</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <h2 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Llevamos
            </h2>
            
            <div style={{ 
              fontSize: daysWithoutAccidents >= 1000 ? '6.8rem' : '8rem', 
              fontWeight: '800', 
              color: '#15803d', 
              lineHeight: '1',
              textShadow: '0px 4px 20px rgba(34, 197, 94, 0.3)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {daysWithoutAccidents.toLocaleString("es-CO")}
            </div>
            
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', marginTop: '0.85rem', fontWeight: '700' }}>
              DÍAS SIN ACCIDENTES
            </h2>
          </div>
          
          <div style={{ marginTop: '0.85rem' }}>
            {isPereira && (
              <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: '800', backgroundColor: '#dcfce7', padding: '0.35rem 1rem', borderRadius: '12px', border: '1px solid #86efac' }}>
                ✓ Desde el 08-01-2020 (08 de Enero de 2020)
              </span>
            )}

            {isArmenia && (
              <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: '800', backgroundColor: '#dcfce7', padding: '0.35rem 1rem', borderRadius: '12px', border: '1px solid #86efac' }}>
                ✓ Desde el 17-03-2018 (17 de Marzo de 2018)
              </span>
            )}

            {isBarranca && (
              <span style={{ fontSize: '0.9rem', color: '#166534', fontWeight: '800', backgroundColor: '#dcfce7', padding: '0.35rem 1rem', borderRadius: '12px', border: '1px solid #86efac' }}>
                ✓ Desde el 18-01-2018 (18 de Enero de 2018)
              </span>
            )}
          </div>
        </div>

        {/* Contenedor Principal del Gran Número SIF */}
        <div 
          className="glass-panel" 
          style={{ 
            width: '100%', 
            padding: '2.25rem 2rem 2.75rem', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '430px',
            boxShadow: '0 20px 40px rgba(45, 212, 191, 0.15)',
            border: '2px solid rgba(45, 212, 191, 0.3)',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(230, 255, 250, 0.6) 100%)',
            position: 'relative'
          }}
        >
          {/* Fila Superior de Insignia de Evento (En flujo normal, nunca tapa la información) */}
          <div style={{ width: '100%', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.9rem' }}>
            {isBarranca && (
              <div
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '0.45rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.76rem',
                  fontWeight: '900',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  border: '2px solid rgba(255, 255, 255, 0.7)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  maxWidth: '96%',
                  textAlign: 'center',
                  lineHeight: '1.25'
                }}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
                <span>GOLPE EN LA CABEZA CON OBJETO EN TALLER ALIADO</span>
              </div>
            )}

            {(isPereira || isArmenia) && (
              <div
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  padding: '0.45rem 1.1rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: '900',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  border: '2px solid rgba(255, 255, 255, 0.7)',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  maxWidth: '100%',
                  lineHeight: '1.25'
                }}
              >
                <span style={{ fontSize: '1.15rem' }}>🌋</span>
                <span>TERREMOTO</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <h2 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Llevamos
            </h2>
            
            <div style={{ 
              fontSize: daysWithoutSif >= 1000 ? '6.8rem' : '8rem', 
              fontWeight: '800', 
              color: '#0f766e', 
              lineHeight: '1',
              textShadow: '0px 4px 20px rgba(45, 212, 191, 0.4)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {daysWithoutSif.toLocaleString("es-CO")}
            </div>
            
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', marginTop: '0.85rem', fontWeight: '700' }}>
              DÍAS SIN SIF POTENCIAL
            </h2>
          </div>

          <div style={{ marginTop: '0.85rem' }}>
            {(isPereira || isArmenia) && (
              <span style={{ fontSize: '0.9rem', color: '#0f766e', fontWeight: '800', backgroundColor: '#ccfbf1', padding: '0.35rem 1rem', borderRadius: '12px', border: '1px solid #5eead4' }}>
                ✓ Desde el 10-08-2026 (10 de Agosto de 2026)
              </span>
            )}

            {isBarranca && (
              <span style={{ fontSize: '0.9rem', color: '#0f766e', fontWeight: '800', backgroundColor: '#ccfbf1', padding: '0.35rem 1rem', borderRadius: '12px', border: '1px solid #5eead4' }}>
                ✓ Desde el 22-07-2026 (22 de Julio de 2026)
              </span>
            )}
          </div>
        </div>
        
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', marginTop: '2.5rem' }}>

        {/* Selector de Fechas */}
        <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary)' }}>Configuración de Fechas de Eventos</h3>

          {/* Aviso especial CD Barrancabermeja */}
          {isBarranca && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#166534', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔒</span>
                <div>
                  <strong>CD Barrancabermeja:</strong> Fechas base fijadas de forma permanente.
                  <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.2rem' }}>
                    • Último Accidente: <strong>18-01-2018</strong> (18 de Enero de 2018) — <strong>🚜 Incidente con montacargas</strong><br />
                    • Último SIF Potencial: <strong>22-07-2026</strong> (22 de Julio de 2026) — <strong>⚠️ Golpe en la cabeza con objeto en taller aliado</strong><br />
                    <em>Estas fechas no se mueven solas ni se borran; únicamente si tú las editas manualmente aquí abajo.</em>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                {lastAccidentDate !== FIXED_BARRANCA_DATE && (
                  <button
                    onClick={() => handleAccidentDateChange(FIXED_BARRANCA_DATE)}
                    style={{ background: '#00205b', color: '#fcd116', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ↺ Restablecer Accidente (18-01-2018)
                  </button>
                )}
                {lastSifDate !== FIXED_BARRANCA_SIF_DATE && (
                  <button
                    onClick={() => handleSifDateChange(FIXED_BARRANCA_SIF_DATE)}
                    style={{ background: '#00205b', color: '#fcd116', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ↺ Restablecer SIF (22-07-2026)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Aviso especial CD Armenia */}
          {isArmenia && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#166534', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔒</span>
                <div>
                  <strong>CD Armenia:</strong> Fechas base fijadas de forma permanente.
                  <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.2rem' }}>
                    • Último Accidente: <strong>17-03-2018</strong> (17 de Marzo de 2018) — <strong>💥 Explosión de botella</strong><br />
                    • Último SIF Potencial: <strong>10-08-2026</strong> (10 de Agosto de 2026)<br />
                    <em>Estas fechas no se mueven solas ni se borran; únicamente si tú las editas manualmente aquí abajo.</em>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                {lastAccidentDate !== FIXED_ARMENIA_DATE && (
                  <button
                    onClick={() => handleAccidentDateChange(FIXED_ARMENIA_DATE)}
                    style={{ background: '#00205b', color: '#fcd116', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ↺ Restablecer Accidente (17-03-2018)
                  </button>
                )}
                {lastSifDate !== FIXED_ARMENIA_SIF_DATE && (
                  <button
                    onClick={() => handleSifDateChange(FIXED_ARMENIA_SIF_DATE)}
                    style={{ background: '#00205b', color: '#fcd116', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ↺ Restablecer SIF (10-08-2026)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Aviso especial CD Pereira */}
          {isPereira && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#166534', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔒</span>
                <div>
                  <strong>CD Pereira:</strong> Fechas base fijadas de forma permanente.
                  <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.2rem' }}>
                    • Último Accidente: <strong>08-01-2020</strong><br />
                    • Último SIF Potencial: <strong>10-08-2026</strong><br />
                    <em>Estas fechas no se borran ni se modifican solas; únicamente si tú las editas manualmente aquí abajo.</em>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                {lastAccidentDate !== FIXED_PEREIRA_DATE && (
                  <button
                    onClick={() => handleAccidentDateChange(FIXED_PEREIRA_DATE)}
                    style={{ background: '#00205b', color: '#fcd116', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ↺ Restablecer Accidente (08-01-2020)
                  </button>
                )}
                {lastSifDate !== FIXED_PEREIRA_SIF_DATE && (
                  <button
                    onClick={() => handleSifDateChange(FIXED_PEREIRA_SIF_DATE)}
                    style={{ background: '#00205b', color: '#fcd116', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ↺ Restablecer SIF (10-08-2026)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Campo Accidente */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <label htmlFor="accident-date" style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🛑</span>
              <span>¿Cuándo ocurrió el último accidente?</span>
            </label>

            {/* Badge destacado de fecha configurada */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '2px solid #16a34a',
              borderRadius: '12px',
              padding: '0.5rem 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#166534',
              boxShadow: '0 2px 6px rgba(22, 163, 74, 0.12)'
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Fecha configurada:</span>
              <strong style={{ fontSize: '1.3rem', color: '#052e16', letterSpacing: '1px' }}>
                {formatDateDMY(lastAccidentDate)}
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: '500' }}>
                ({formatDateLong(lastAccidentDate)})
              </span>
            </div>

            <input 
              id="accident-date"
              type="date" 
              value={lastAccidentDate}
              onChange={(e) => handleAccidentDateChange(e.target.value)}
              style={{ 
                padding: '0.85rem 1.5rem', 
                fontSize: '1.15rem', 
                fontWeight: '700',
                borderRadius: '12px', 
                border: '2px solid #cbd5e1',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: '#00205b',
                backgroundColor: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                width: '100%',
                maxWidth: '300px',
                textAlign: 'center'
              }}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 0 0', maxWidth: '480px', lineHeight: '1.4' }}>
              {isBarranca 
                ? "🔒 Fecha fijada permanentemente en 18-01-2018 para CD Barrancabermeja (Incidente con montacargas). No se puede quitar ni modificar automáticamente (solo si tú la cambias manualmente aquí)."
                : isArmenia 
                ? "🔒 Fecha fijada permanentemente en 17-03-2018 para CD Armenia (Explosión de botella). No se puede quitar ni modificar automáticamente (solo si tú la cambias manualmente aquí)."
                : isPereira 
                ? "🔒 Fecha fijada permanentemente en 08-01-2020 para CD Pereira. No se puede quitar ni modificar automáticamente (solo si tú la cambias manualmente aquí)."
                : "Al cambiar la fecha, el contador se actualizará automáticamente."
              }
            </p>
          </div>
          
          {/* Campo SIF Potencial */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '2.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.75rem' }}>
            <label htmlFor="sif-date" style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>⚠️</span>
              <span>¿Cuándo ocurrió el último SIF potencial?</span>
            </label>

            {/* Badge destacado de fecha configurada */}
            <div style={{
              backgroundColor: '#f0fdfa',
              border: '2px solid #0d9488',
              borderRadius: '12px',
              padding: '0.5rem 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#0f766e',
              boxShadow: '0 2px 6px rgba(13, 148, 136, 0.12)'
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Fecha configurada:</span>
              <strong style={{ fontSize: '1.3rem', color: '#042f2e', letterSpacing: '1px' }}>
                {formatDateDMY(lastSifDate)}
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: '500' }}>
                ({formatDateLong(lastSifDate)})
              </span>
            </div>

            <input 
              id="sif-date"
              type="date" 
              value={lastSifDate}
              onChange={(e) => handleSifDateChange(e.target.value)}
              style={{ 
                padding: '0.85rem 1.5rem', 
                fontSize: '1.15rem', 
                fontWeight: '700',
                borderRadius: '12px', 
                border: '2px solid #cbd5e1',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: '#00205b',
                backgroundColor: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                width: '100%',
                maxWidth: '300px',
                textAlign: 'center'
              }}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 0 0', maxWidth: '480px', lineHeight: '1.4' }}>
              {isBarranca
                ? "🔒 Fecha fijada permanentemente en 22-07-2026 para CD Barrancabermeja (Golpe en la cabeza con objeto en taller aliado). No se puede quitar ni modificar automáticamente (solo si tú la cambias manualmente aquí)."
                : isArmenia
                ? "🔒 Fecha fijada permanentemente en 10-08-2026 para CD Armenia. No se puede quitar ni modificar automáticamente (solo si tú la cambias manualmente aquí)."
                : isPereira 
                ? "🔒 Fecha fijada permanentemente en 10-08-2026 para CD Pereira. No se puede quitar ni modificar automáticamente (solo si tú la cambias manualmente aquí)."
                : "Al cambiar la fecha, el contador se actualizará automáticamente."
              }
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
