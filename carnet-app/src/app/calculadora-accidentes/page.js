"use client";

import { useState, useEffect } from "react";
import { useCity } from "@/context/CityContext";

export default function CalculadoraAccidentes() {
  const { selectedCity } = useCity();
  const isPereira = (selectedCity || "").toLowerCase() === "pereira";
  const FIXED_PEREIRA_DATE = "2020-01-08";
  const FIXED_PEREIRA_SIF_DATE = "2026-08-10";

  // Fecha del último accidente
  const [lastAccidentDate, setLastAccidentDate] = useState(() => {
    if (typeof window !== "undefined") {
      const savedPereira = localStorage.getItem("last_accident_date_pereira");
      if (isPereira) return savedPereira || FIXED_PEREIRA_DATE;
    }
    return isPereira ? FIXED_PEREIRA_DATE : (() => {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() - 21);
      return defaultDate.toISOString().split('T')[0];
    })();
  });

  const [daysWithoutAccidents, setDaysWithoutAccidents] = useState(0);

  // Fecha SIF (en Pereira fijada al 10-08-2026)
  const [lastSifDate, setLastSifDate] = useState(() => {
    if (typeof window !== "undefined") {
      if (isPereira) {
        const savedPereiraSif = localStorage.getItem("last_sif_date_pereira");
        return savedPereiraSif || FIXED_PEREIRA_SIF_DATE;
      }
      const cityKey = (selectedCity || "general").toLowerCase();
      const saved = localStorage.getItem(`last_sif_date_${cityKey}`);
      if (saved) return saved;
    }
    return isPereira ? FIXED_PEREIRA_SIF_DATE : (() => {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() - 45);
      return defaultDate.toISOString().split('T')[0];
    })();
  });

  const [daysWithoutSif, setDaysWithoutSif] = useState(0);

  // Sincronizar fechas según la sede seleccionada
  useEffect(() => {
    if (isPereira) {
      const savedAccident = localStorage.getItem("last_accident_date_pereira");
      setLastAccidentDate(savedAccident || FIXED_PEREIRA_DATE);
      const savedSif = localStorage.getItem("last_sif_date_pereira");
      setLastSifDate(savedSif || FIXED_PEREIRA_SIF_DATE);
    } else {
      const cityKey = (selectedCity || "general").toLowerCase();
      const savedAccident = localStorage.getItem(`last_accident_date_${cityKey}`);
      if (savedAccident) {
        setLastAccidentDate(savedAccident);
      } else {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() - 21);
        setLastAccidentDate(defaultDate.toISOString().split('T')[0]);
      }

      const savedSif = localStorage.getItem(`last_sif_date_${cityKey}`);
      if (savedSif) {
        setLastSifDate(savedSif);
      } else {
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() - 45);
        setLastSifDate(defaultDate.toISOString().split('T')[0]);
      }
    }
  }, [selectedCity, isPereira]);

  // Manejar cambio manual de fecha de accidentes
  const handleAccidentDateChange = (newDate) => {
    setLastAccidentDate(newDate);
    if (isPereira) {
      localStorage.setItem("last_accident_date_pereira", newDate);
    } else {
      const cityKey = (selectedCity || "general").toLowerCase();
      localStorage.setItem(`last_accident_date_${cityKey}`, newDate);
    }
  };

  // Manejar cambio manual de fecha SIF
  const handleSifDateChange = (newDate) => {
    setLastSifDate(newDate);
    if (isPereira) {
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
      
      {/* Badge TERREMOTO en una esquina superior */}
      <div
        style={{
          position: 'absolute',
          top: '0.8rem',
          right: '1rem',
          backgroundColor: '#dc2626',
          color: '#ffffff',
          padding: '0.45rem 1rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          fontWeight: '900',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.45)',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          zIndex: 20
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>🌋</span>
        <span>TERREMOTO</span>
      </div>

      <header style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#00205b', color: '#fcd116', padding: '0.35rem 1.1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
          📍 CENTRO DE DISTRIBUCIÓN: {selectedCity ? selectedCity.toUpperCase() : 'SEDE GENERAL'}
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏱️ Calculadora de Accidentes</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          {isPereira 
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
            padding: '3.5rem 2rem', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(162, 219, 115, 0.15)',
            border: '2px solid rgba(162, 219, 115, 0.3)',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(240, 255, 230, 0.6) 100%)'
          }}
        >
          <h2 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            Llevamos
          </h2>
          
          <div style={{ 
            fontSize: daysWithoutAccidents >= 1000 ? '7rem' : '8.5rem', 
            fontWeight: '800', 
            color: '#15803d', 
            lineHeight: '1',
            textShadow: '0px 4px 20px rgba(34, 197, 94, 0.3)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {daysWithoutAccidents.toLocaleString("es-CO")}
          </div>
          
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', marginTop: '1rem', fontWeight: '700' }}>
            DÍAS SIN ACCIDENTES
          </h2>
          
          {isPereira && (
            <span style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#166534', fontWeight: '700', backgroundColor: '#dcfce7', padding: '0.2rem 0.75rem', borderRadius: '12px' }}>
              ✓ Desde el 08 de Enero de 2020
            </span>
          )}
        </div>

        {/* Contenedor Principal del Gran Número SIF */}
        <div 
          className="glass-panel" 
          style={{ 
            width: '100%', 
            padding: '3.5rem 2rem', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(45, 212, 191, 0.15)',
            border: '2px solid rgba(45, 212, 191, 0.3)',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(230, 255, 250, 0.6) 100%)'
          }}
        >
          <h2 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            Llevamos
          </h2>
          
          <div style={{ 
            fontSize: daysWithoutSif >= 1000 ? '7rem' : '8.5rem', 
            fontWeight: '800', 
            color: '#0f766e', 
            lineHeight: '1',
            textShadow: '0px 4px 20px rgba(45, 212, 191, 0.4)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {daysWithoutSif.toLocaleString("es-CO")}
          </div>
          
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', marginTop: '1rem', fontWeight: '700' }}>
            DÍAS SIN SIF POTENCIAL
          </h2>

          {isPereira && (
            <span style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#0f766e', fontWeight: '700', backgroundColor: '#ccfbf1', padding: '0.2rem 0.75rem', borderRadius: '12px' }}>
              ✓ Desde el 10 de Agosto de 2026
            </span>
          )}
        </div>
        
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', marginTop: '2.5rem' }}>

        {/* Selector de Fechas */}
        <div className="glass-panel" style={{ width: '100%', maxWidth: '650px', padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary)' }}>Configuración de Fechas de Eventos</h3>

          {/* Aviso especial CD Pereira */}
          {isPereira && (
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#166534', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔒</span>
                <div>
                  <strong>CD Pereira:</strong> Fechas base fijadas manualmente.
                  <div style={{ fontSize: '0.78rem', color: '#15803d' }}>
                    Accidente: <strong>08-01-2020</strong> | SIF Potencial: <strong>10-08-2026</strong>. Solo tú puedes modificarlas manualmente.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.25rem' }}>
                {lastAccidentDate !== FIXED_PEREIRA_DATE && (
                  <button
                    onClick={() => handleAccidentDateChange(FIXED_PEREIRA_DATE)}
                    style={{ background: '#00205b', color: '#fcd116', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ↺ Restablecer Accidente (08-01-2020)
                  </button>
                )}
                {lastSifDate !== FIXED_PEREIRA_SIF_DATE && (
                  <button
                    onClick={() => handleSifDateChange(FIXED_PEREIRA_SIF_DATE)}
                    style={{ background: '#00205b', color: '#fcd116', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}
                  >
                    ↺ Restablecer SIF (10-08-2026)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Campo Accidente */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <label htmlFor="accident-date" style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem' }}>
              ¿Cuándo ocurrió el último accidente?
            </label>
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              {isPereira ? "Guardado manual persistente para CD Pereira (08-01-2020)." : "Al cambiar la fecha, el contador se actualizará automáticamente."}
            </p>
          </div>
          
          {/* Campo SIF Potencial */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <label htmlFor="sif-date" style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '1rem' }}>
              ¿Cuándo ocurrió el último SIF potencial?
            </label>
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              {isPereira ? "Guardado manual persistente para CD Pereira (10-08-2026)." : "Al cambiar la fecha, el contador se actualizará automáticamente."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
