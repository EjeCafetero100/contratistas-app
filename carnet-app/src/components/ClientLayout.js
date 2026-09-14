"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCity } from '@/context/CityContext';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCity, clearCity } = useCity();

  // Ocultar el panel en rutas públicas como los carnets escaneados
  const isPublicRoute = pathname?.startsWith('/carnet/') || pathname?.startsWith('/scan/');

  if (isPublicRoute) {
    return <main>{children}</main>;
  }

  // En la pantalla de inicio principal (`/`), mostrar vista a pantalla completa sin sidebar
  const isHomePage = pathname === '/';

  const handleReturnHome = () => {
    clearCity();
    router.push('/');
  };

  if (isHomePage) {
    return (
      <div className="home-layout-full">
        <main className="main-content-full">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Panel Lateral */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-badge">SafeTogether</span>
            <h2>AB InBev</h2>
          </div>
          
          {/* Botón de Inicio en la Barra Lateral */}
          <button onClick={handleReturnHome} className="sidebar-home-btn">
            <span>🏠</span> VOLVER AL INICIO
          </button>

          {selectedCity && (
            <div className="sidebar-city-info">
              <span className="city-label">CENTRO DE DISTRIBUCIÓN</span>
              <span className="city-value">📍 {selectedCity}</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <Link href="/dashboard" className={`sidebar-link ${pathname === '/dashboard' ? 'active' : ''}`}>
            📋 Panel de Control
          </Link>
          <Link href="/register" className={`sidebar-link ${pathname === '/register' ? 'active' : ''}`}>
            ➕ Añadir Persona
          </Link>
          <Link href="/historial" className={`sidebar-link ${pathname === '/historial' ? 'active' : ''}`}>
            📜 Historial Ingresos
          </Link>
          <Link href="/no-grato" className={`sidebar-link ${pathname === '/no-grato' ? 'active' : ''}`} style={{ color: '#ef4444' }}>
            🚫 Personal No Grato
          </Link>
          <Link href="/control-documental" className={`sidebar-link ${pathname === '/control-documental' ? 'active' : ''}`}>
            📂 Control Documental ABI
          </Link>
          <Link href="/botiquin" className={`sidebar-link ${pathname?.startsWith('/botiquin') && !pathname?.startsWith('/botiquin-2') ? 'active' : ''}`}>
            🚑 Botiquín
          </Link>
          <Link href="/botiquin-2" className={`sidebar-link ${pathname?.startsWith('/botiquin-2') ? 'active' : ''}`}>
            🚑 Botiquín 2
          </Link>
          <Link href="/calculadora-accidentes" className={`sidebar-link ${pathname?.startsWith('/calculadora-accidentes') ? 'active' : ''}`}>
            ⏱️ Calculadora Accidentes
          </Link>
          <Link href="/calculadora" className={`sidebar-link ${pathname === '/calculadora' ? 'active' : ''}`}>
            🗓️ Calculadora de Días
          </Link>
          <Link href="/inspecciones" className={`sidebar-link ${pathname?.startsWith('/inspecciones') ? 'active' : ''}`}>
            📝 Inspecciones Mensuales
          </Link>
          <Link href="/extintores" className={`sidebar-link ${pathname?.startsWith('/extintores') ? 'active' : ''}`}>
            🧯 Extintores
          </Link>
          <Link href="/extintores2" className={`sidebar-link ${pathname?.startsWith('/extintores2') ? 'active' : ''}`}>
            🧯 Extintores 2
          </Link>
          <Link href="/credit-360" className={`sidebar-link ${pathname?.startsWith('/credit-360') ? 'active' : ''}`}>
            📈 Credit 360
          </Link>
          <Link href="/dashboard-excel" className={`sidebar-link ${pathname?.startsWith('/dashboard-excel') ? 'active' : ''}`}>
            📊 Dashboard Dinámico Excel
          </Link>
          <Link href="/kpis" className={`sidebar-link ${pathname?.startsWith('/kpis') ? 'active' : ''}`} style={{ borderTop: '1px solid rgba(252, 209, 22, 0.2)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
            📊 Indicadores (KPIs)
          </Link>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="main-content">
        {/* Barra Superior con botón Volver al Inicio e indicador de Sede */}
        <header className="top-nav-bar">
          <div className="top-nav-left">
            <button onClick={handleReturnHome} className="btn-top-home">
              <span>🏠</span> INICIO / CAMBIAR SEDE
            </button>

            {selectedCity ? (
              <span className="top-city-badge">
                📍 Centro de Distribución: <strong>{selectedCity.toUpperCase()}</strong>
              </span>
            ) : (
              <span className="top-city-badge badge-warning-city">
                ⚠️ Sin CD Seleccionado
              </span>
            )}
          </div>

          <div className="top-nav-right">
            <span className="safe-together-pill">
              🛡️ SafeTogether
            </span>
          </div>
        </header>

        <div className="page-content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
