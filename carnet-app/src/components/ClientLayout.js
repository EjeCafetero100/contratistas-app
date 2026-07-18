"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Ocultar el panel en rutas públicas como los carnets escaneados
  const isPublicRoute = pathname?.startsWith('/carnet/') || pathname?.startsWith('/scan/');

  if (isPublicRoute) {
    return <main>{children}</main>;
  }

  return (
    <div className="app-layout">
      {/* Panel Lateral */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Contratistas</h2>
        </div>
        <nav className="sidebar-nav">
          <Link href="/" className={`sidebar-link ${pathname === '/' ? 'active' : ''}`}>
            Panel de Control
          </Link>
          <Link href="/register" className={`sidebar-link ${pathname === '/register' ? 'active' : ''}`}>
            Añadir Persona
          </Link>
          <Link href="/historial" className={`sidebar-link ${pathname === '/historial' ? 'active' : ''}`}>
            Historial Ingresos
          </Link>
          <Link href="/no-grato" className={`sidebar-link ${pathname === '/no-grato' ? 'active' : ''}`} style={{ color: 'var(--danger)' }}>
            Personal No Grato
          </Link>
          {/* Espacio para futuros módulos */}
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
