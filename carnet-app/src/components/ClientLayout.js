"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCity } from '@/context/CityContext';

const DEFAULT_MENU_ITEMS = [
  { id: 'calculadora', label: 'Gestión de incidentes', icon: '🗓️', href: '/calculadora', matchPrefix: false, visible: true },
  { id: 'dashboard', label: 'Panel de Control', icon: '📋', href: '/dashboard', matchPrefix: false, visible: true },
  { id: 'register', label: 'Añadir Persona', icon: '➕', href: '/register', matchPrefix: false, visible: true },
  { id: 'historial', label: 'Historial Ingresos', icon: '📜', href: '/historial', matchPrefix: false, visible: true },
  { id: 'no-grato', label: 'Personal No Grato', icon: '🚫', href: '/no-grato', color: '#ef4444', matchPrefix: false, visible: true },
  { id: 'control-documental', label: 'Control Documental ABI', icon: '📂', href: '/control-documental', matchPrefix: false, visible: true },
  { id: 'botiquin', label: 'Botiquín', icon: '🚑', href: '/botiquin', matchPrefix: true, excludePrefix: '/botiquin-2', visible: true },
  { id: 'botiquin-2', label: 'Botiquín 2', icon: '🚑', href: '/botiquin-2', matchPrefix: true, visible: true },
  { id: 'calculadora-accidentes', label: 'Calculadora Accidentes', icon: '⏱️', href: '/calculadora-accidentes', matchPrefix: true, visible: true },
  { id: 'inspecciones', label: 'Inspecciones Mensuales', icon: '📝', href: '/inspecciones', matchPrefix: true, visible: true },
  { id: 'extintores', label: 'Extintores', icon: '🧯', href: '/extintores', matchPrefix: true, excludePrefix: '/extintores2', visible: true },
  { id: 'extintores2', label: 'Extintores 2', icon: '🧯', href: '/extintores2', matchPrefix: true, visible: true },
  { id: 'credit-360', label: 'Credit 360', icon: '📈', href: '/credit-360', matchPrefix: true, visible: true },
  { id: 'dashboard-excel', label: 'Dashboard Dinámico Excel', icon: '📊', href: '/dashboard-excel', matchPrefix: true, visible: true },
  { id: 'kpis', label: 'Indicadores (KPIs)', icon: '📊', href: '/kpis', matchPrefix: true, isSeparator: true, visible: true }
];

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedCity, clearCity } = useCity();

  // Menú configurable y reordenable
  const [menuItems, setMenuItems] = useState(DEFAULT_MENU_ITEMS);
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Cargar orden guardado en localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_custom_menu_order_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedIds = new Set(parsed.map(i => i.id));
          const merged = parsed
            .map(savedItem => {
              const def = DEFAULT_MENU_ITEMS.find(d => d.id === savedItem.id);
              if (!def) return null;
              return {
                ...def,
                ...savedItem,
                label: savedItem.label || def.label,
                visible: savedItem.visible !== undefined ? savedItem.visible : true
              };
            })
            .filter(Boolean);

          DEFAULT_MENU_ITEMS.forEach(def => {
            if (!savedIds.has(def.id)) {
              merged.push(def);
            }
          });

          setMenuItems(merged);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveItems = (newItems) => {
    setMenuItems(newItems);
    try {
      const toSave = newItems.map(({ id, label, visible }) => ({ id, label, visible }));
      localStorage.setItem('sidebar_custom_menu_order_v2', JSON.stringify(toSave));
    } catch (e) {
      console.error(e);
    }
  };

  const moveItem = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= menuItems.length) return;
    const updated = [...menuItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    saveItems(updated);
  };

  const toggleVisibility = (id) => {
    const updated = menuItems.map(item =>
      item.id === id ? { ...item, visible: !item.visible } : item
    );
    saveItems(updated);
  };

  const renameItem = (id, currentLabel) => {
    const newName = prompt('Ingresa el nuevo nombre para este botón:', currentLabel);
    if (newName && newName.trim()) {
      const updated = menuItems.map(item =>
        item.id === id ? { ...item, label: newName.trim() } : item
      );
      saveItems(updated);
    }
  };

  const resetMenu = () => {
    if (confirm('¿Deseas restablecer el panel al orden y nombres predeterminados?')) {
      saveItems(DEFAULT_MENU_ITEMS);
      localStorage.removeItem('sidebar_custom_menu_order_v2');
      setIsEditingMenu(false);
    }
  };

  // Drag & Drop
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== index && dragOverIndex !== index) {
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
      return;
    }
    const updated = [...menuItems];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setDraggedIndex(null);
    setDragOverIndex(null);
    saveItems(updated);
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

  // En modo normal, mostramos sólo los que no están ocultos. En modo edición, mostramos todos.
  const displayedItems = isEditingMenu ? menuItems : menuItems.filter(item => item.visible !== false);

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

        {/* Botón para activar/desactivar el modo de organizar panel */}
        <button
          onClick={() => setIsEditingMenu(!isEditingMenu)}
          className={`sidebar-customizer-btn ${isEditingMenu ? 'active' : ''}`}
          title="Personalizar orden y visibilidad del panel"
        >
          {isEditingMenu ? '✓ Finalizar Organización' : '⚙️ Organizar / Mover Panel'}
        </button>

        {/* Caja de instrucciones y controles rápidos en modo edición */}
        {isEditingMenu && (
          <div className="sidebar-edit-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#fcd116', fontSize: '0.72rem' }}>🛠️ Mover a tu gusto</strong>
              <button
                onClick={resetMenu}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.65rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ↺ Restablecer
              </button>
            </div>
            <p className="sidebar-edit-info">
              Arrastra con <strong>⋮⋮</strong> o usa <strong>⬆️ ⬇️</strong> para reordenar. Clic en <strong>👁️</strong> para ocultar/mostrar y <strong>✏️</strong> para renombrar.
            </p>
          </div>
        )}

        <nav className="sidebar-nav">
          {displayedItems.map((item) => {
            const actualIndex = menuItems.findIndex(i => i.id === item.id);
            const active = isItemActive(item);
            const isHidden = item.visible === false;
            const isDragging = draggedIndex === actualIndex;
            const isDragOver = dragOverIndex === actualIndex;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, actualIndex)}
                onDragOver={(e) => handleDragOver(e, actualIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, actualIndex)}
                className={`sidebar-item-container ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                style={{
                  opacity: isHidden ? 0.45 : 1,
                  background: isEditingMenu ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderTop: item.isSeparator && !isEditingMenu ? '1px solid rgba(252, 209, 22, 0.2)' : 'none',
                  marginTop: item.isSeparator && !isEditingMenu ? '0.5rem' : '0',
                  paddingTop: item.isSeparator && !isEditingMenu ? '0.5rem' : '0'
                }}
              >
                {/* Drag handle */}
                <span
                  className="sidebar-drag-handle"
                  title="Arrastra para mover de posición"
                >
                  ⋮⋮
                </span>

                {/* Enlace normal */}
                <div className="sidebar-item-link">
                  {isEditingMenu ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.6rem 0.5rem',
                        color: item.color || '#fcd116',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        textDecoration: isHidden ? 'line-through' : 'none'
                      }}
                    >
                      <span>{item.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`sidebar-link ${active ? 'active' : ''}`}
                      style={{ color: item.color || undefined, padding: '0.65rem 0.75rem' }}
                    >
                      <span style={{ marginRight: '0.4rem' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>

                {/* Controles de edición (flechas, ocultar, renombrar) */}
                {isEditingMenu && (
                  <div className="sidebar-item-actions">
                    <button
                      onClick={() => moveItem(actualIndex, -1)}
                      disabled={actualIndex === 0}
                      className="sidebar-action-btn"
                      title="Mover hacia arriba"
                      style={{ opacity: actualIndex === 0 ? 0.3 : 1 }}
                    >
                      ⬆️
                    </button>
                    <button
                      onClick={() => moveItem(actualIndex, 1)}
                      disabled={actualIndex === menuItems.length - 1}
                      className="sidebar-action-btn"
                      title="Mover hacia abajo"
                      style={{ opacity: actualIndex === menuItems.length - 1 ? 0.3 : 1 }}
                    >
                      ⬇️
                    </button>
                    <button
                      onClick={() => renameItem(item.id, item.label)}
                      className="sidebar-action-btn"
                      title="Cambiar nombre de este botón"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => toggleVisibility(item.id)}
                      className="sidebar-action-btn"
                      title={isHidden ? "Mostrar botón" : "Ocultar botón"}
                    >
                      {isHidden ? '🙈' : '👁️'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
