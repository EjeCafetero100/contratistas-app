"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCity } from "@/context/CityContext";

const INDUCTION_CARDS = [
  {
    id: "conductores",
    title: "INDUCCIÓN DE CONDUCTORES",
    badge: "📍 BARRANCABERMEJA",
    categoryBadge: "🚚 CONDUCTORES",
    description: "Consulta y gestiona las inducciones dirigidas a conductores.",
    buttonText: "INGRESAR A INDUCCIÓN DE CONDUCTORES",
    route: "/barrancabermeja/inducciones/conductores",
    icon: (
      <svg className="cd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2.5" />
        <line x1="12" y1="3" x2="12" y2="9.5" />
        <line x1="4.5" y1="16.5" x2="9.8" y2="13.5" />
        <line x1="19.5" y1="16.5" x2="14.2" y2="13.5" />
      </svg>
    )
  },
  {
    id: "glp",
    title: "INDUCCIÓN DE GLP",
    badge: "📍 BARRANCABERMEJA",
    categoryBadge: "🔥 GLP",
    description: "Consulta y gestiona las inducciones relacionadas con GLP.",
    buttonText: "INGRESAR A INDUCCIÓN DE GLP",
    route: "/barrancabermeja/inducciones/glp",
    icon: (
      <svg className="cd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 8h10a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-9a2 2 0 0 1 2-2z" />
        <path d="M9 8V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
        <line x1="8" y1="2.5" x2="16" y2="2.5" />
        <path d="M12 11.5c1.4 1.3 1.8 2.2 1.8 3.3a1.8 1.8 0 0 1-3.6 0c0-1.1.4-2 1.8-3.3z" />
      </svg>
    )
  },
  {
    id: "distoyota",
    title: "INDUCCIÓN DE DISTOYOTA",
    badge: "📍 BARRANCABERMEJA",
    categoryBadge: "🚜 DISTOYOTA",
    description: "Consulta y gestiona las inducciones de Distoyota.",
    buttonText: "INGRESAR A INDUCCIÓN DE DISTOYOTA",
    route: "/barrancabermeja/inducciones/distoyota",
    icon: (
      <svg className="cd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="18" r="2" />
        <circle cx="15" cy="18" r="2" />
        <path d="M8 18h5" />
        <path d="M3.5 15.5V8a1.5 1.5 0 0 1 1.5-1.5h5l3 4.5v5" />
        <line x1="19" y1="4" x2="19" y2="18" strokeWidth="2.2" />
        <line x1="17" y1="18" x2="22" y2="18" strokeWidth="2.2" />
        <rect x="17" y="10.5" width="4" height="4" rx="0.5" />
      </svg>
    )
  },
  {
    id: "contratistas",
    title: "INDUCCIÓN DE CONTRATISTAS",
    badge: "📍 BARRANCABERMEJA",
    categoryBadge: "👷 CONTRATISTAS",
    description: "Consulta y gestiona las inducciones dirigidas a contratistas.",
    buttonText: "INGRESAR A INDUCCIÓN DE CONTRATISTAS",
    route: "/barrancabermeja/inducciones/contratistas",
    icon: (
      <svg className="cd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 18h20" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 18V12a8 8 0 0 1 16 0v6" />
        <path d="M9 12V7a3 3 0 0 1 6 0v5" />
        <circle cx="12" cy="15" r="1.5" />
      </svg>
    )
  },
  {
    id: "visitantes",
    title: "INDUCCIÓN DE VISITANTES",
    badge: "📍 BARRANCABERMEJA",
    categoryBadge: "🪪 VISITANTES",
    description: "Consulta y gestiona las inducciones dirigidas a visitantes.",
    buttonText: "INGRESAR A INDUCCIÓN DE VISITANTES",
    route: "/barrancabermeja/inducciones/visitantes",
    icon: (
      <svg className="cd-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="16" rx="3" />
        <path d="M9 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        <circle cx="12" cy="10.5" r="2.5" />
        <path d="M7.5 17.5c0-1.8 2-3 4.5-3s4.5 1.2 4.5 3" />
        <line x1="10" y1="5" x2="14" y2="5" />
      </svg>
    )
  }
];

export default function BarrancabermejaInduccionesPage() {
  const router = useRouter();
  const { selectCity } = useCity();

  useEffect(() => {
    selectCity("Barrancabermeja");
  }, [selectCity]);

  const handleCardClick = (route) => {
    router.push(route);
  };

  return (
    <div className="inducciones-barranca-portal">
      <div className="inducciones-barranca-container">
        {/* Barra Superior con Navegación Corporativa */}
        <div className="inducciones-top-nav">
          <Link href="/dashboard" className="btn-inducciones-back">
            <span>←</span> VOLVER AL PANEL DE BARRANCABERMEJA
          </Link>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              background: "rgba(252, 209, 22, 0.2)",
              border: "1px solid rgba(252, 209, 22, 0.6)",
              color: "#fcd116",
              padding: "0.4rem 1rem",
              borderRadius: 9999,
              fontSize: "0.85rem",
              fontWeight: 800,
              letterSpacing: "0.04em"
            }}>
              📍 BARRANCABERMEJA • SANTANDER
            </span>

            <Link href="/" className="btn-inducciones-back" style={{ padding: "0.4rem 0.9rem" }}>
              <span>🏠</span> INICIO
            </Link>
          </div>
        </div>

        {/* Hero Header Corporativo AB InBev / SafeTogether */}
        <header className="inducciones-hero">
          <div className="inducciones-badge-barranca">
            <span className="safe-shield">🛡️</span>
            <span className="safe-text">AB InBev | SafeTogether • Barrancabermeja</span>
          </div>

          <h1 className="inducciones-main-title">
            INDUCCIONES
          </h1>

          <p className="inducciones-main-subtitle">
            Centro de Distribución Barrancabermeja. Selecciona el tipo de inducción que deseas consultar o gestionar.
          </p>
        </header>

        {/* Cuadrícula de 5 Tarjetas (3 en la primera fila, 2 en la segunda centradas) */}
        <div className="inducciones-grid-3-2">
          {INDUCTION_CARDS.map((card) => (
            <div
              key={card.id}
              className="cd-card induccion-card-item"
              onClick={() => handleCardClick(card.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(card.route);
                }
              }}
            >
              <div className="cd-card-header">
                <div className="cd-icon-wrapper">
                  {card.icon}
                  <span className="cd-location-badge">
                    {card.categoryBadge}
                  </span>
                </div>

                <h2 className="cd-card-title">
                  {card.title}
                </h2>

                <p className="cd-card-desc">
                  {card.description}
                </p>
              </div>

              <div className="cd-card-footer">
                <button
                  className="btn-cd-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(card.route);
                  }}
                >
                  {card.buttonText}
                  <span className="arrow-icon">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Corporativo */}
        <footer className="home-footer">
          <p>© 2026 AB InBev / SafeTogether — Sede Barrancabermeja • Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
