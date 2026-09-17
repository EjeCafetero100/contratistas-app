"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCity } from "@/context/CityContext";

export default function InduccionPlaceholder({
  title,
  shortName,
  icon,
  badgeText = "INDUCCIÓN OFICIAL • BARRANCABERMEJA",
  description = "Este dashboard se encuentra actualmente en fase de preparación y arquitectura. Próximamente estará disponible para la gestión integral de registros, validación documental y reportes de la sede Barrancabermeja."
}) {
  const { selectCity } = useCity();

  // Asegurar que la sede activa sea Barrancabermeja
  useEffect(() => {
    selectCity("Barrancabermeja");
  }, [selectCity]);

  return (
    <div className="inducciones-barranca-portal">
      <div className="inducciones-barranca-container">
        {/* Barra Superior con Navegación */}
        <div className="inducciones-top-nav">
          <Link href="/barrancabermeja/inducciones" className="btn-inducciones-back">
            <span>←</span> VOLVER A INDUCCIONES BARRANCABERMEJA
          </Link>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
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
              📍 BARRANCABERMEJA
            </span>

            <Link href="/" className="btn-inducciones-back" style={{ padding: "0.4rem 0.9rem" }}>
              <span>🏠</span> INICIO
            </Link>
          </div>
        </div>

        {/* Tarjeta Central Provisional */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="induccion-placeholder-card">
            {/* Badge Superior */}
            <div className="induccion-placeholder-badge">
              <span>⏳</span> PRÓXIMAMENTE • EN PREPARACIÓN
            </div>

            {/* Ícono Lineal Grande */}
            <div style={{
              width: 80,
              height: 80,
              background: "#f1f5f9",
              borderRadius: 20,
              border: "2px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.75rem auto",
              color: "#00205b",
              boxShadow: "0 8px 20px rgba(0, 32, 91, 0.08)"
            }}>
              {icon}
            </div>

            {/* Título Principal */}
            <h1 style={{
              fontSize: "2.1rem",
              fontWeight: 900,
              color: "#00205b",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              marginBottom: "1rem",
              lineHeight: 1.2
            }}>
              {title}
            </h1>

            {/* Mensaje Solicitado: Dashboard de [nombre de la inducción] — Próximamente */}
            <div style={{
              background: "rgba(0, 32, 91, 0.04)",
              border: "1px dashed rgba(0, 32, 91, 0.25)",
              borderRadius: 14,
              padding: "1.25rem 1.5rem",
              marginBottom: "1.75rem"
            }}>
              <p style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: "#00205b",
                margin: 0
              }}>
                Dashboard de {shortName || title} — Próximamente.
              </p>
            </div>

            <p style={{
              fontSize: "0.95rem",
              color: "#64748b",
              lineHeight: 1.6,
              maxWidth: 540,
              margin: "0 auto 2.5rem auto"
            }}>
              {description}
            </p>

            {/* Acciones de Retorno */}
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link
                href="/barrancabermeja/inducciones"
                className="btn-cd-action"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  padding: "0.9rem 2rem",
                  fontSize: "0.95rem",
                  textDecoration: "none"
                }}
              >
                <span>←</span> VOLVER AL MENÚ DE INDUCCIONES
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Corporativo */}
        <footer className="home-footer" style={{ marginTop: "2rem" }}>
          <p>© 2026 AB InBev / SafeTogether — Sede Barrancabermeja • Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
