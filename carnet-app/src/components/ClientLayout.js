"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCity } from '@/context/CityContext';

const BASE_MENU_ITEMS = [
  { id: 'calculadora', label: 'Gestión de incidentes', icon: '🗓️', href: '/calculadora', matchPrefix: false },
  { id: 'calculadora-accidentes', label: 'Calculadora Accidentes', icon: '⏱️', href: '/calculadora-accidentes', matchPrefix: true },
  { id: 'no-grato', label: 'Personal No Grato', icon: '🚫', href: '/no-grato', color: '#ef4444', matchPrefix: false },
  { id: 'dashboard', label: 'Panel de Control', icon: '📋', href: '/dashboard', matchPrefix: false },
  { id: 'induccion', label: 'INDUCCIONES', icon: '🎓', href: '/barrancabermeja/inducciones', matchPrefix: true },
  { id: 'register', label: 'Añadir Persona', icon: '➕', href: '/register', matchPrefix: false },
  { id: 'historial', label: 'Historial Ingresos', icon: '📜', href: '/historial', matchPrefix: false },
  { id: 'control-documental', label: 'Control Documental ABI', icon: '📂', href: '/control-documental', matchPrefix: false },
  { id: 'botiquin', label: 'Botiquín', icon: '🚑', href: '/botiquin', matchPrefix: true, excludePrefix: '/botiquin-2' },
  { id: 'botiquin-2', label: 'Botiquín 2', icon: '🚑', href: '/botiquin-2', matchPrefix: true },
  { id: 'inspecciones', label: 'Inspecciones Mensuales', icon: '📝', href: '/inspecciones', matchPrefix: true },
  { id: 'extintores', label: 'Extintores', icon: '🧯', href: '/extintores', matchPrefix: true, excludePrefix: '/extintores2' },
  { id: 'extintores2', label: 'Extintores 2', icon: '🧯', href: '/extintores2', matchPrefix: true },
  { id: 'credit-360', label: 'Credit 360', icon: '📈', href: '/credit-360', matchPrefix: true },
  { id: 'telemetria', label: 'Telemetría', icon: '📡', href: '/telemetria', matchPrefix: true },
  { id: 'regreso-seguro', label: 'Regreso Seguro a Casa', icon: '🏡', href: '/regreso-seguro', matchPrefix: true },
  { id: 'herramientas-manuales', label: 'Inspección de Herramientas Manuales', icon: '🛠️', href: '/herramientas-manuales', matchPrefix: true },
  { id: 'dashboard-excel', label: 'Dashboard Dinámico Excel', icon: '📊', href: '/dashboard-excel', matchPrefix: true },
  { id: 'kpis', label: 'Indicadores (KPIs)', icon: '📊', href: '/kpis', matchPrefix: true, isSeparator: true }
];

// Configuración inicial por sede (Armenia, Pereira, Barrancabermeja)
const getInitialOrderForCity = (cityName) => {
  const city = (cityName || '').toLowerCase();
  const list = [...BASE_MENU_ITEMS];

  if (city === 'pereira') {
    // Para Pereira: Gestión de incidentes en la parte superior
    const cIdx = list.findIndex(i => i.id === 'calculadora');
    if (cIdx > -1) {
      const [cItem] = list.splice(cIdx, 1);
      list.unshift(cItem);
    }
  } else if (city === 'armenia') {
    // Para Armenia: Control Documental y Panel de Control primero
    const cIdx = list.findIndex(i => i.id === 'control-documental');
    if (cIdx > -1) {
      const [item] = list.splice(cIdx, 1);
      list.unshift(item);
    }
  } else if (city === 'barrancabermeja') {
    // Para Barrancabermeja: INDUCCIONES en la parte superior, seguido de Regreso Seguro a Casa, Herramientas Manuales y Telemetría
    const indIdx = list.findIndex(i => i.id === 'induccion');
    if (indIdx > -1) {
      const [indItem] = list.splice(indIdx, 1);
      list.unshift(indItem);
    }
    const rIdx = list.findIndex(i => i.id === 'regreso-seguro');
    if (rIdx > -1) {
      const [rItem] = list.splice(rIdx, 1);
      list.splice(1, 0, rItem);
    }
    const hIdx = list.findIndex(i => i.id === 'herramientas-manuales');
    if (hIdx > -1) {
      const [hItem] = list.splice(hIdx, 1);
      list.splice(2, 0, hItem);
    }
    const tIdx = list.findIndex(i => i.id === 'telemetria');
    if (tIdx > -1) {
      const [tItem] = list.splice(tIdx, 1);
      list.splice(3, 0, tItem);
    }
  }

  return list;
};

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCity, selectCity, clearCity } = useCity();

  // Determinar la sede efectiva inmediatamente (si la ruta es /barrancabermeja, la sede es Barrancabermeja)
  const isBarrancaRoute = pathname?.startsWith('/barrancabermeja');
  const effectiveCity = isBarrancaRoute ? 'Barrancabermeja' : (selectedCity || 'Pereira');
  const cityKey = effectiveCity.toLowerCase();

  // Sincronizar automáticamente la sede en CityContext si se navega a /barrancabermeja
  useEffect(() => {
    if (isBarrancaRoute && selectedCity !== 'Barrancabermeja') {
      selectCity('Barrancabermeja');
    }
  }, [isBarrancaRoute, selectedCity, selectCity]);

  const [menuItems, setMenuItems] = useState(() => getInitialOrderForCity(effectiveCity));
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const isDraggingRef = useRef(false);
  const [isInduccionesOpen, setIsInduccionesOpen] = useState(false);
  const [isHerramientasOpen, setIsHerramientasOpen] = useState(false);

  // Auto-abrir submenús si la ruta corresponde
  useEffect(() => {
    if (pathname?.startsWith('/herramientas-manuales')) {
      setIsHerramientasOpen(true);
    }
    if (pathname?.startsWith('/barrancabermeja/inducciones') || pathname?.startsWith('/inducciones')) {
      setIsInduccionesOpen(true);
    }
  }, [pathname]);

  // Cargar orden personalizado según la sede (Armenia, Pereira o Barrancabermeja) usando versión v5 para incorporar Inspección de Herramientas
  useEffect(() => {
    try {
      const storageKey = `sidebar_drag_order_v5_${cityKey}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedIds = JSON.parse(saved);
        if (Array.isArray(savedIds) && savedIds.length > 0) {
          const ordered = [];
          savedIds.forEach(id => {
            const found = BASE_MENU_ITEMS.find(item => item.id === id);
            if (found) ordered.push(found);
          });
          BASE_MENU_ITEMS.forEach(item => {
            if (!ordered.some(o => o.id === item.id)) {
              ordered.push(item);
            }
          });

          // Asegurar que INDUCCIONES esté en la primera posición para Barrancabermeja
          const indPos = ordered.findIndex(i => i.id === 'induccion');
          if (cityKey === 'barrancabermeja') {
            if (indPos === -1) {
              const indItem = BASE_MENU_ITEMS.find(i => i.id === 'induccion');
              if (indItem) ordered.unshift(indItem);
            } else if (indPos !== 0) {
              const [indItem] = ordered.splice(indPos, 1);
              ordered.unshift(indItem);
            }
          } else {
            const dashPos = ordered.findIndex(i => i.id === 'dashboard');
            const targetPos = dashPos > -1 ? dashPos + 1 : 4;
            if (indPos === -1) {
              const indItem = BASE_MENU_ITEMS.find(i => i.id === 'induccion');
              if (indItem) ordered.splice(targetPos, 0, indItem);
            } else if (indPos !== targetPos) {
              const [indItem] = ordered.splice(indPos, 1);
              ordered.splice(targetPos, 0, indItem);
            }
          }

          // eslint-disable-next-line react-hooks/set-state-in-effect
          setMenuItems(ordered);
          return;
        }
      }
      setMenuItems(getInitialOrderForCity(effectiveCity));
    } catch (e) {
      setMenuItems(getInitialOrderForCity(effectiveCity));
    }
  }, [effectiveCity, cityKey]);

  // Guardar orden de arrastre en localStorage para la sede actual
  const saveOrder = (newItems) => {
    setMenuItems(newItems);
    try {
      const storageKey = `sidebar_drag_order_v5_${cityKey}`;
      const ids = newItems.map(i => i.id);
      localStorage.setItem(storageKey, JSON.stringify(ids));
    } catch (e) {
      console.error(e);
    }
  };

  // Manejadores Drag & Drop directo
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    isDraggingRef.current = true;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setTimeout(() => { isDraggingRef.current = false; }, 80);
      return;
    }
    const updated = [...menuItems];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setDraggedIndex(null);
    setDragOverIndex(null);
    saveOrder(updated);
    setTimeout(() => { isDraggingRef.current = false; }, 80);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTimeout(() => { isDraggingRef.current = false; }, 80);
  };

  const handleLinkClick = (e) => {
    if (isDraggingRef.current) {
      e.preventDefault();
    }
  };

  const resetCityOrder = () => {
    if (confirm(`¿Restablecer el orden del panel para ${effectiveCity || 'esta sede'}?`)) {
      try {
        localStorage.removeItem(`sidebar_drag_order_${cityKey}`);
        localStorage.removeItem(`sidebar_drag_order_v3_${cityKey}`);
        localStorage.removeItem(`sidebar_drag_order_v4_${cityKey}`);
        localStorage.removeItem(`sidebar_drag_order_v5_${cityKey}`);
      } catch (e) {}
      setMenuItems(getInitialOrderForCity(effectiveCity));
    }
  };

  const isItemActive = (item) => {
    if (!pathname) return false;
    if (item.id === 'induccion') {
      if (pathname?.startsWith('/barrancabermeja/inducciones')) return true;
      if (pathname?.startsWith('/inducciones')) return true;
      if (pathname === '/induccion') return true;
    }
    if (item.id === 'regreso-seguro') {
      if (pathname?.startsWith('/regreso-seguro')) return true;
      if (pathname?.startsWith('/barrancabermeja/regreso-seguro')) return true;
    }
    if (item.id === 'herramientas-manuales') {
      if (pathname?.startsWith('/herramientas-manuales')) return true;
    }
    if (item.excludePrefix && pathname.startsWith(item.excludePrefix)) return false;
    if (item.matchPrefix) return pathname.startsWith(item.href);
    return pathname === item.href;
  };

  const getItemHref = (item) => {
    if (item.id === 'induccion') {
      return '/barrancabermeja/inducciones';
    }
    if (item.id === 'herramientas-manuales') {
      return '/herramientas-manuales';
    }
    return item.href;
  };

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

          <div className="sidebar-city-info">
            <span className="city-label">CENTRO DE DISTRIBUCIÓN</span>
            <span className="city-value">📍 {selectedCity || 'SELECCIONA'}</span>
            <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem' }}>
              {[
                { name: 'Armenia', short: 'ARM', route: '/dashboard' },
                { name: 'Pereira', short: 'PER', route: '/calculadora' },
                { name: 'Barrancabermeja', short: 'BARR', route: '/barrancabermeja/inducciones' }
              ].map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    selectCity(c.name);
                    router.push(c.route);
                  }}
                  style={{
                    background: selectedCity === c.name ? '#fcd116' : 'rgba(255,255,255,0.12)',
                    color: selectedCity === c.name ? '#00205b' : '#ffffff',
                    border: selectedCity === c.name ? '1px solid #fcd116' : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.45rem',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                    transition: 'all 0.15s ease'
                  }}
                  title={`Cambiar sede a ${c.name}`}
                >
                  {c.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de navegación 100% de arrastre directo */}
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const active = isItemActive(item);
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <div key={item.id}>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`sidebar-item-container ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                  style={{
                    borderTop: item.isSeparator ? '1px solid rgba(252, 209, 22, 0.2)' : 'none',
                    marginTop: item.isSeparator ? '0.4rem' : '0',
                    paddingTop: item.isSeparator ? '0.4rem' : '0'
                  }}
                  title="Arrastra para mover a tu gusto"
                >
                  {/* Agarrador visual para arrastrar */}
                  <span className="sidebar-drag-handle" title="Arrastra hacia arriba o abajo">
                    ⋮⋮
                  </span>

                  {/* Enlace */}
                  <div className="sidebar-item-link">
                    <Link
                      href={getItemHref(item)}
                      onClick={(e) => {
                        handleLinkClick(e);
                        if (item.id === 'induccion') {
                          setIsInduccionesOpen(prev => !prev);
                        }
                        if (item.id === 'herramientas-manuales') {
                          setIsHerramientasOpen(prev => !prev);
                        }
                      }}
                      className={`sidebar-link ${active ? 'active' : ''}`}
                      style={{
                        color: item.color || undefined,
                        padding: '0.65rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '0.45rem' }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.id === 'induccion' && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            marginLeft: 'auto',
                            transition: 'transform 0.25s ease',
                            transform: isInduccionesOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                            opacity: 0.85
                          }}
                        >
                          ▼
                        </span>
                      )}
                      {item.id === 'herramientas-manuales' && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            marginLeft: 'auto',
                            transition: 'transform 0.25s ease',
                            transform: isHerramientasOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                            opacity: 0.85
                          }}
                        >
                          ▼
                        </span>
                      )}
                    </Link>
                  </div>
                </div>

                {/* Submódulos de Inducciones en el panel izquierdo (desplegables) */}
                {item.id === 'induccion' && isInduccionesOpen && (
                  <div style={{
                    margin: '0.3rem 0 0.5rem 1.6rem',
                    paddingLeft: '0.65rem',
                    borderLeft: '2px solid rgba(252, 209, 22, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}>
                    {[
                      { label: 'Conductores', href: '/barrancabermeja/inducciones/conductores', icon: '🚚' },
                      { label: 'GLP', href: '/barrancabermeja/inducciones/glp', icon: '🔥' },
                      { label: 'Distoyota', href: '/barrancabermeja/inducciones/distoyota', icon: '🚜' },
                      { label: 'Contratistas', href: '/barrancabermeja/inducciones/contratistas', icon: '👷' },
                      { label: 'Visitantes', href: '/barrancabermeja/inducciones/visitantes', icon: '🪪' }
                    ].map(sub => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={handleLinkClick}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: isSubActive ? 800 : 600,
                            color: isSubActive ? '#00205b' : 'rgba(255, 255, 255, 0.85)',
                            background: isSubActive ? '#fcd116' : 'transparent',
                            textDecoration: 'none',
                            boxShadow: isSubActive ? '0 2px 8px rgba(252, 209, 22, 0.35)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{sub.icon}</span>
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Submódulos de Inspección de Herramientas Manuales en el panel izquierdo (desplegables) */}
                {item.id === 'herramientas-manuales' && isHerramientasOpen && (
                  <div style={{
                    margin: '0.3rem 0 0.5rem 1.6rem',
                    paddingLeft: '0.65rem',
                    borderLeft: '2px solid rgba(252, 209, 22, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}>
                    {[
                      { label: 'Carretillas OL', href: '/herramientas-manuales/carretillas-ol', icon: '🛒' },
                      { label: 'Estibadores OL', href: '/herramientas-manuales/estibadores-ol', icon: '📦' },
                      { label: 'Carretillas UC', href: '/herramientas-manuales/carretillas-uc', icon: '⚙️' }
                    ].map(sub => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={handleLinkClick}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.35rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: isSubActive ? 800 : 600,
                            color: isSubActive ? '#00205b' : 'rgba(255, 255, 255, 0.85)',
                            background: isSubActive ? '#fcd116' : 'transparent',
                            textDecoration: 'none',
                            boxShadow: isSubActive ? '0 2px 8px rgba(252, 209, 22, 0.35)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{sub.icon}</span>
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Opción rápida para restablecer el orden de la sede actual */}
          <button
            onClick={resetCityOrder}
            className="sidebar-reset-link"
            title="Restablecer orden predeterminado"
          >
            ↺ Restablecer orden de {selectedCity || 'la sede'}
          </button>
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
