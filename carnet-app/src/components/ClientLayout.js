"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCity } from '@/context/CityContext';

const BASE_MENU_ITEMS = [
  { id: 'calculadora', label: 'Gestión de incidentes', icon: '🗓️', href: '/calculadora', matchPrefix: false },
  { id: 'dashboard', label: 'Panel de Control', icon: '📋', href: '/dashboard', matchPrefix: false },
  { id: 'register', label: 'Añadir Persona', icon: '➕', href: '/register', matchPrefix: false },
  { id: 'historial', label: 'Historial Ingresos', icon: '📜', href: '/historial', matchPrefix: false },
  { id: 'no-grato', label: 'Personal No Grato', icon: '🚫', href: '/no-grato', color: '#ef4444', matchPrefix: false },
  { id: 'control-documental', label: 'Control Documental ABI', icon: '📂', href: '/control-documental', matchPrefix: false },
  { id: 'botiquin', label: 'Botiquín', icon: '🚑', href: '/botiquin', matchPrefix: true, excludePrefix: '/botiquin-2' },
  { id: 'botiquin-2', label: 'Botiquín 2', icon: '🚑', href: '/botiquin-2', matchPrefix: true },
  { id: 'calculadora-accidentes', label: 'Calculadora Accidentes', icon: '⏱️', href: '/calculadora-accidentes', matchPrefix: true },
  { id: 'inspecciones', label: 'Inspecciones Mensuales', icon: '📝', href: '/inspecciones', matchPrefix: true },
  { id: 'extintores', label: 'Extintores', icon: '🧯', href: '/extintores', matchPrefix: true, excludePrefix: '/extintores2' },
  { id: 'extintores2', label: 'Extintores 2', icon: '🧯', href: '/extintores2', matchPrefix: true },
  { id: 'credit-360', label: 'Credit 360', icon: '📈', href: '/credit-360', matchPrefix: true },
  { id: 'dashboard-excel', label: 'Dashboard Dinámico Excel', icon: '📊', href: '/dashboard-excel', matchPrefix: true },
  { id: 'kpis', label: 'Indicadores (KPIs)', icon: '📊', href: '/kpis', matchPrefix: true, isSeparator: true }
];

// Configuración inicial por sede (Armenia, Pereira, Barrancabermeja)
const getInitialOrderForCity = (cityName) => {
  const city = (cityName || '').toLowerCase();
  const list = [...BASE_MENU_ITEMS];

  if (city === 'pereira') {
    // Para Pereira: Gestión de incidentes en la parte superior
    const idx = list.findIndex(i => i.id === 'calculadora');
    if (idx > -1) {
      const [item] = list.splice(idx, 1);
      list.unshift(item);
    }
  } else if (city === 'armenia') {
    // Para Armenia: Control Documental y Panel de Control primero
    const idx = list.findIndex(i => i.id === 'control-documental');
    if (idx > -1) {
      const [item] = list.splice(idx, 1);
      list.splice(1, 0, item);
    }
  } else if (city === 'barrancabermeja') {
    // Para Barrancabermeja: Personal No Grato y Panel primero
    const idx = list.findIndex(i => i.id === 'no-grato');
    if (idx > -1) {
      const [item] = list.splice(idx, 1);
      list.splice(1, 0, item);
    }
  }

  return list;
};

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCity, clearCity } = useCity();
  const cityKey = selectedCity ? selectedCity.toLowerCase() : 'general';

  const [menuItems, setMenuItems] = useState(() => getInitialOrderForCity(selectedCity));
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const isDraggingRef = useRef(false);

  // Cargar orden personalizado según la sede (Armenia, Pereira o Barrancabermeja)
  useEffect(() => {
    try {
      const storageKey = `sidebar_drag_order_${cityKey}`;
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
          setMenuItems(ordered);
          return;
        }
      }
      setMenuItems(getInitialOrderForCity(selectedCity));
    } catch (e) {
      setMenuItems(getInitialOrderForCity(selectedCity));
    }
  }, [selectedCity, cityKey]);

  // Guardar orden de arrastre en localStorage para la sede actual
  const saveOrder = (newItems) => {
    setMenuItems(newItems);
    try {
      const storageKey = `sidebar_drag_order_${cityKey}`;
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
    if (confirm(`¿Restablecer el orden del panel para ${selectedCity || 'esta sede'}?`)) {
      try {
        localStorage.removeItem(`sidebar_drag_order_${cityKey}`);
      } catch (e) {}
      setMenuItems(getInitialOrderForCity(selectedCity));
    }
  };

  const isItemActive = (item) => {
    if (!pathname) return false;
    if (item.excludePrefix && pathname.startsWith(item.excludePrefix)) return false;
    if (item.matchPrefix) return pathname.startsWith(item.href);
    return pathname === item.href;
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

          {selectedCity && (
            <div className="sidebar-city-info">
              <span className="city-label">CENTRO DE DISTRIBUCIÓN</span>
              <span className="city-value">📍 {selectedCity}</span>
            </div>
          )}
        </div>

        {/* Lista de navegación 100% de arrastre directo */}
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const active = isItemActive(item);
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;

            return (
              <div
                key={item.id}
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
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                    style={{ color: item.color || undefined, padding: '0.65rem 0.75rem' }}
                  >
                    <span style={{ marginRight: '0.45rem' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </div>
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
