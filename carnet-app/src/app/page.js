"use client";

import { useCity } from "@/context/CityContext";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { selectCity } = useCity();
  const router = useRouter();

  const handleSelectCity = (cityName) => {
    selectCity(cityName);
    if (cityName === "Pereira") {
      router.push("/calculadora");
    } else if (cityName === "Barrancabermeja") {
      router.push("/barrancabermeja/inducciones");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="home-portal-container">
      {/* Hero Header Corporativo AB InBev / SafeTogether */}
      <header className="home-hero">
        <div className="home-hero-badge">
          <span className="safe-shield">🛡️</span>
          <span className="safe-text">AB InBev | SafeTogether</span>
        </div>
        
        <h1 className="home-title">
          TABLERO DE SEGURIDAD Y GESTIÓN OPERACIONAL
        </h1>
        
        <p className="home-subtitle">
          Selecciona el centro de distribución que deseas consultar.
        </p>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <button 
            onClick={() => router.push('/barrancabermeja/inducciones')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              backgroundColor: '#fcd116',
              color: '#00205b',
              fontWeight: 800,
              fontSize: '0.95rem',
              padding: '0.75rem 1.6rem',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(252, 209, 22, 0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            <span>🎓</span> MÓDULO DE INDUCCIONES <span style={{ fontWeight: 900, marginLeft: '0.3rem' }}>→</span>
          </button>
        </div>
      </header>

      {/* Grid de Centros de Distribución */}
      <div className="cd-grid-container">
        {/* Tarjeta ARMENIA */}
        <div 
          className="cd-card cd-card-armenia"
          onClick={() => handleSelectCity("Armenia")}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectCity("Armenia");
            }
          }}
        >
          <div className="cd-card-header">
            <div className="cd-icon-wrapper">
              <svg className="cd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 18h6v-4H9v4z" />
                <circle cx="12" cy="9" r="1.5" />
              </svg>
              <span className="cd-location-badge">📍 ARMENIA</span>
            </div>
            <h2 className="cd-card-title">ARMENIA</h2>
            <p className="cd-card-desc">
              Centro de Distribución Armenia • Eje Cafetero. Accede al control documental, gestión de contratistas e indicadores operativos.
            </p>
          </div>
          
          <div className="cd-card-footer">
            <button 
              className="btn-cd-action"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectCity("Armenia");
              }}
            >
              INGRESAR A ARMENIA
              <span className="arrow-icon">→</span>
            </button>
          </div>
        </div>

        {/* Tarjeta PEREIRA */}
        <div 
          className="cd-card cd-card-pereira"
          onClick={() => handleSelectCity("Pereira")}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectCity("Pereira");
            }
          }}
        >
          <div className="cd-card-header">
            <div className="cd-icon-wrapper">
              <svg className="cd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M19 21V10l-7-5-7 5v11" />
                <path d="M9 14h6v7H9v-7z" />
                <path d="M9 9h.01M15 9h.01" />
              </svg>
              <span className="cd-location-badge">📍 PEREIRA</span>
            </div>
            <h2 className="cd-card-title">PEREIRA</h2>
            <p className="cd-card-desc">
              Centro de Distribución Pereira • Eje Cafetero. Gestión de incidentes, consulta de inspecciones, inventario de botiquines, extintores y KPIs.
            </p>
          </div>
          
          <div className="cd-card-footer">
            <button 
              className="btn-cd-action"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectCity("Pereira");
              }}
            >
              INGRESAR A PEREIRA
              <span className="arrow-icon">→</span>
            </button>
          </div>
        </div>

        {/* Tarjeta BARRANCABERMEJA */}
        <div 
          className="cd-card cd-card-barrancabermeja"
          onClick={() => handleSelectCity("Barrancabermeja")}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectCity("Barrancabermeja");
            }
          }}
        >
          <div className="cd-card-header">
            <div className="cd-icon-wrapper">
              <svg className="cd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M4 21V9l8-6 8 6v12" />
                <path d="M9 17h6v4H9v-4z" />
                <circle cx="12" cy="11" r="2" />
              </svg>
              <span className="cd-location-badge">📍 BARRANCABERMEJA</span>
            </div>
            <h2 className="cd-card-title">BARRANCABERMEJA</h2>
            <p className="cd-card-desc">
              Centro de Distribución Barrancabermeja • Santander. Acceso directo al nuevo portal de Inducciones y módulos operativos.
            </p>
          </div>
          
          <div className="cd-card-footer">
            <button 
              className="btn-cd-action"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectCity("Barrancabermeja");
              }}
            >
              INGRESAR A BARRANCABERMEJA
              <span className="arrow-icon">→</span>
            </button>
            <div style={{ marginTop: '0.65rem', textAlign: 'center' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectCity("Barrancabermeja");
                  router.push("/barrancabermeja/inducciones");
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00205b',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '0.2rem'
                }}
              >
                🎓 Ir a Inducciones Barrancabermeja →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer corporativo de respaldo */}
      <footer className="home-footer">
        <p>© 2026 AB InBev / SafeTogether — Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
