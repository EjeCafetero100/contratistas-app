"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCity } from "@/context/CityContext";
import Link from "next/link";
import {
  MAIN_INDUCTION_CARDS,
  DRIVER_INDUCTION_CARDS,
  INDUCTION_MODULE_DETAILS
} from "./induccionesConfig";
import { InduccionIcon } from "./InduccionIcons";

export default function InduccionesPage() {
  const router = useRouter();
  const { selectedCity, selectCity } = useCity();

  // Vistas disponibles:
  // - 'portal': Tablero principal de 4 tarjetas
  // - 'subpanel-conductores': Subpanel con T1, T2, T4, MKP
  // - 't1', 't2', 't4', 'mkp', 'distoyota', 'contratistas', 'glp': Contenido de inducción específica
  // - 'historial': Historial consolidado de certificados emitidos
  const [currentView, setCurrentView] = useState("portal");

  // Datos de inducciones
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSede, setFilterSede] = useState("Todas");
  const [filterTipo, setFilterTipo] = useState("Todos");

  // Modal de Certificado
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Estado del Formulario de Registro
  const [formData, setFormData] = useState({
    documento: "",
    nombre: "",
    empresa: "",
    placa: "",
    sede: selectedCity || "Armenia",
    observaciones: ""
  });

  // Estado de respuestas del Test interactivo
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Mantener sincronizada la sede en el formulario cuando cambie en CityContext
  useEffect(() => {
    if (selectedCity) {
      setFormData((prev) => ({ ...prev, sede: selectedCity }));
    }
    if (selectedCity === "Barrancabermeja") {
      router.push("/barrancabermeja/inducciones");
    }
  }, [selectedCity, router]);

  // Cargar inducciones desde la API
  const fetchRecords = async () => {
    try {
      setLoadingRecords(true);
      const res = await fetch("/api/inducciones", { cache: "no-store" });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar inducciones:", err);
    } finally {
      setLoadingRecords(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Navegar hacia una inducción específica
  const handleOpenInduction = (targetView) => {
    setCurrentView(targetView);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setErrorMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Manejo de respuestas del cuestionario
  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  // Envío y evaluación del registro de inducción
  const handleSubmitInduccion = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const moduleData = INDUCTION_MODULE_DETAILS[currentView];
    if (!moduleData) return;

    // Verificar que todas las preguntas hayan sido respondidas
    const unanswered = moduleData.quiz.some(
      (_, idx) => quizAnswers[idx] === undefined
    );
    if (unanswered) {
      setErrorMessage("Por favor responde todas las preguntas de la evaluación para continuar.");
      return;
    }

    // Calcular puntaje
    let correctCount = 0;
    moduleData.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / moduleData.quiz.length) * 100);

    if (score < 66) {
      setErrorMessage(
        `Calificación obtenida: ${score}%. Debe alcanzar al menos el 66% para aprobar la inducción. Repase las normas e inténtelo de nuevo.`
      );
      setQuizSubmitted(true);
      return;
    }

    try {
      const payload = {
        ...formData,
        categoria: moduleData.category,
        tipo_induccion: moduleData.shortName,
        placa: moduleData.requiresPlaca ? (formData.placa || "N/A") : "N/A",
        sede: formData.sede || selectedCity || "Armenia",
        calificacion: score,
        estado: "Aprobado"
      };

      const res = await fetch("/api/inducciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedCertificate(data.record);
        fetchRecords();
        // Limpiar formulario
        setFormData({
          documento: "",
          nombre: "",
          empresa: "",
          placa: "",
          sede: selectedCity || "Armenia",
          observaciones: ""
        });
        setQuizAnswers({});
        setQuizSubmitted(false);
      } else {
        setErrorMessage("Error al guardar registro: " + (data.error || "No se pudo completar el registro."));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error de conexión al registrar la inducción.");
    }
  };

  // Filtrar registros en el historial
  const filteredRecords = records.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (item.nombre || "").toLowerCase().includes(term) ||
      (item.documento || "").includes(term) ||
      (item.empresa || "").toLowerCase().includes(term) ||
      (item.placa || "").toLowerCase().includes(term);

    const matchesSede = filterSede === "Todas" || item.sede === filterSede;
    const matchesTipo = filterTipo === "Todos" || (item.tipo_induccion || "").includes(filterTipo);

    return matchesSearch && matchesSede && matchesTipo;
  });

  // Determinar si la vista actual corresponde a un módulo individual
  const activeModuleDetail = INDUCTION_MODULE_DETAILS[currentView];

  return (
    <div className="home-layout-full" style={{ minHeight: "100vh" }}>

      {/* =========================================================================
          VISTA 1: TABLERO DE INDUCCIONES (PANEL PRINCIPAL DE 4 TARJETAS)
         ========================================================================= */}
      {currentView === "portal" && (
        <div className="home-portal-container" style={{ minHeight: "auto", paddingTop: "2.5rem", paddingBottom: "3rem" }}>
          {/* Hero Header con Franja Azul Intensa de Alto Impacto */}
          <header className="home-hero" style={{ marginBottom: "2.5rem" }}>
            <div className="home-hero-badge">
              <span className="safe-shield">🛡️</span>
              <span className="safe-text">AB InBev | SafeTogether</span>
            </div>

            {/* Franja Azul Intensa Detrás del Título */}
            <div>
              <div className="inducciones-title-banner">
                <h1 className="home-title" style={{ margin: 0, fontSize: "2.6rem" }}>
                  TABLERO DE INDUCCIONES
                </h1>
              </div>
            </div>

            <p className="home-subtitle" style={{ fontSize: "1.25rem", marginTop: "0.5rem" }}>
              Selecciona el tipo de inducción que deseas consultar.
            </p>

            {selectedCity && (
              <div style={{ marginTop: "1rem" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "rgba(252, 209, 22, 0.15)",
                  color: "#fcd116",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  padding: "0.35rem 1rem",
                  borderRadius: 9999,
                  border: "1px solid rgba(252, 209, 22, 0.4)"
                }}>
                  📍 CENTRO DE DISTRIBUCIÓN ACTIVO: <strong>{selectedCity.toUpperCase()}</strong>
                </span>
              </div>
            )}
          </header>

          {/* Banner de Acceso a Inducciones Barrancabermeja */}
          <div style={{
            background: "linear-gradient(135deg, #00205b 0%, #001233 100%)",
            border: "2px solid #fcd116",
            borderRadius: "16px",
            padding: "1.25rem 2rem",
            marginBottom: "2.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            boxShadow: "0 8px 25px rgba(0, 32, 91, 0.5)"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "1.4rem" }}>📍</span>
                <strong style={{ color: "#fcd116", fontSize: "1.15rem", textTransform: "uppercase" }}>
                  MÓDULO INDUCCIONES — BARRANCABERMEJA
                </strong>
              </div>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.92rem" }}>
                Accede al tablero con las 5 inducciones oficiales (Conductores, GLP, Distoyota, Contratistas y Visitantes).
              </p>
            </div>
            <button
              onClick={() => {
                selectCity("Barrancabermeja");
                router.push("/barrancabermeja/inducciones");
              }}
              style={{
                background: "#fcd116",
                color: "#00205b",
                fontWeight: 800,
                padding: "0.75rem 1.6rem",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                boxShadow: "0 4px 15px rgba(252, 209, 22, 0.4)",
                fontSize: "0.95rem"
              }}
            >
              IR A INDUCCIONES BARRANCABERMEJA →
            </button>
          </div>

          {/* Grid de 4 Tarjetas en Cuadrícula 2x2 con Imágenes Profesionales */}
          <div className="inducciones-grid-2x2">
            {MAIN_INDUCTION_CARDS.map((card) => (
              <div
                key={card.id}
                className="induccion-card-feature"
                onClick={() => handleOpenInduction(card.targetView)}
              >
                {/* Contenedor de Imagen con Overlay y Badges */}
                <div className="induccion-card-image-box">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="induccion-card-hero-img"
                    loading="lazy"
                  />
                  <div className="induccion-card-image-gradient" />

                  {/* Badge de Categoría Flotante */}
                  <div className="induccion-card-badge-floating">
                    <span className="badge-pulse-dot" />
                    <span>{card.categoryIcon || "🛡️"}</span>
                    <span>{card.badge}</span>
                  </div>

                  {/* Círculo con Ícono Representativo */}
                  <div className="induccion-card-icon-pill" title={card.shortTitle}>
                    <InduccionIcon type={card.iconType} size={26} color="#00205b" />
                  </div>
                </div>

                {/* Contenido de la Tarjeta */}
                <div className="induccion-card-content">
                  <div>
                    <h2 className="induccion-card-title-lg">
                      {card.title}
                    </h2>
                    <p className="induccion-card-desc-lg">
                      {card.description}
                    </p>
                  </div>

                  {/* Botón Amarillo Grande INGRESAR → */}
                  <div style={{ marginTop: "auto" }}>
                    <button
                      className="induccion-feature-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInduction(card.targetView);
                      }}
                    >
                      <span>{card.buttonText || "INGRESAR"}</span>
                      <span className="arrow-icon">→</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Panel Resumen de Indicadores de Certificación */}
          <div style={{
            background: "rgba(0, 32, 91, 0.6)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(252, 209, 22, 0.25)",
            borderRadius: 16,
            padding: "1.5rem 2rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.5rem",
            textAlign: "center"
          }}>
            <div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fcd116", lineHeight: 1 }}>
                {records.length}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.3rem", fontWeight: 600 }}>
                Total Inducciones Registradas
              </div>
            </div>

            <div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>
                {records.filter((r) => r.categoria === "conductores").length}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.3rem", fontWeight: 600 }}>
                Conductores Certificados (T1/T2/T4/Mkp)
              </div>
            </div>

            <div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#38bdf8", lineHeight: 1 }}>
                {records.filter((r) => r.categoria === "contratistas").length}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.3rem", fontWeight: 600 }}>
                Contratistas & Especialistas (Distoyota/GLP)
              </div>
            </div>

            <div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fcd116", lineHeight: 1 }}>
                365 Días
              </div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.3rem", fontWeight: 600 }}>
                Vigencia Oficial SafeTogether
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 2: SUBPANEL DE CONDUCTORES (T1, T2, T4, MKP)
         ========================================================================= */}
      {currentView === "subpanel-conductores" && (
        <div className="home-portal-container" style={{ minHeight: "auto", paddingTop: "2rem", paddingBottom: "3rem" }}>
          {/* Botón Visible para Volver a Inducciones */}
          <div>
            <button
              onClick={() => handleOpenInduction("portal")}
              className="induccion-btn-back"
            >
              <span>←</span> VOLVER A INDUCCIONES
            </button>
          </div>

          {/* Hero Header Subpanel con Franja Azul Intensa */}
          <header className="home-hero" style={{ marginBottom: "2.5rem" }}>
            <div className="home-hero-badge">
              <span className="safe-shield">🚛</span>
              <span className="safe-text">FLOTA DE TRANSPORTE & DISTRIBUCIÓN</span>
            </div>

            <div>
              <div className="inducciones-title-banner">
                <h1 className="home-title" style={{ margin: 0, fontSize: "2.5rem" }}>
                  INDUCCIONES DE CONDUCTORES
                </h1>
              </div>
            </div>

            <p className="home-subtitle" style={{ fontSize: "1.25rem", marginTop: "0.5rem" }}>
              Selecciona el tipo de inducción que deseas consultar.
            </p>
          </header>

          {/* 4 Tarjetas de Conductores en Una Sola Fila en Computador */}
          <div className="inducciones-grid-4">
            {DRIVER_INDUCTION_CARDS.map((driverCard) => (
              <div key={driverCard.id} className="induccion-card">
                <div>
                  <div className="cd-icon-wrapper">
                    <div style={{
                      width: 54,
                      height: 54,
                      background: "#f1f5f9",
                      borderRadius: 14,
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <InduccionIcon type={driverCard.iconType} size={30} color="#00205b" />
                    </div>

                    <span className="cd-location-badge" style={{
                      background: "rgba(252, 209, 22, 0.25)",
                      color: "#00205b",
                      border: "1px solid rgba(252, 209, 22, 0.8)",
                      fontSize: "0.72rem",
                      fontWeight: 800
                    }}>
                      🟡 {driverCard.badge}
                    </span>
                  </div>

                  <h2 className="cd-card-title" style={{ fontSize: "1.55rem", minHeight: "3.2rem", display: "flex", alignItems: "center" }}>
                    {driverCard.title}
                  </h2>

                  <div style={{
                    fontSize: "0.8rem",
                    fontWeight: 800,
                    color: "#00205b",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase"
                  }}>
                    {driverCard.subtitle}
                  </div>

                  <p className="cd-card-desc" style={{ minHeight: "4.5rem" }}>
                    {driverCard.description}
                  </p>
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                  <button
                    className="btn-cd-action"
                    onClick={() => handleOpenInduction(driverCard.targetView)}
                  >
                    <span>{driverCard.buttonText}</span>
                    <span className="arrow-icon">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mensaje de Apoyo Operacional */}
          <div style={{
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: 12,
            padding: "1rem 1.5rem",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            textAlign: "center",
            color: "#cbd5e1",
            fontSize: "0.9rem"
          }}>
            ℹ️ Todo conductor debe contar con inducción aprobada y carnet vigente para autorización de cargue o salida a ruta en <strong>Armenia</strong>, <strong>Pereira</strong> o <strong>Barrancabermeja</strong>.
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 3: CONTENIDO DE CADA INDUCCIÓN ESPECÍFICA (TEMARIO + EVALUACIÓN)
         ========================================================================= */}
      {activeModuleDetail && (
        <div style={{ maxWidth: 1280, width: "95%", margin: "2rem auto 3rem auto" }}>
          {/* Botones de Retorno */}
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {activeModuleDetail.category === "conductores" ? (
              <button
                onClick={() => handleOpenInduction("subpanel-conductores")}
                className="induccion-btn-back"
                style={{ margin: 0 }}
              >
                <span>←</span> VOLVER A CONDUCTORES
              </button>
            ) : (
              <button
                onClick={() => handleOpenInduction("portal")}
                className="induccion-btn-back"
                style={{ margin: 0 }}
              >
                <span>←</span> VOLVER A INDUCCIONES
              </button>
            )}

            <button
              onClick={() => handleOpenInduction("portal")}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                color: "#cbd5e1",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "0.6rem 1.2rem",
                borderRadius: 9999,
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              🏛️ Panel Principal
            </button>
          </div>

          {/* Encabezado del Módulo con Franja Azul */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#fcd116",
              color: "#00205b",
              fontWeight: 900,
              fontSize: "0.8rem",
              padding: "0.3rem 0.9rem",
              borderRadius: 9999,
              marginBottom: "0.75rem",
              textTransform: "uppercase"
            }}>
              <span>🛡️</span> {activeModuleDetail.tag}
            </div>

            <div className="inducciones-title-banner" style={{ display: "block" }}>
              <h1 style={{ margin: 0, fontSize: "2rem", color: "#ffffff", fontWeight: 900 }}>
                {activeModuleDetail.fullTitle}
              </h1>
            </div>

            <p style={{ color: "#cbd5e1", fontSize: "1.05rem", margin: "0.5rem 0 0 0" }}>
              {activeModuleDetail.summary}
            </p>
          </div>

          {/* Grid de 2 Columnas: Temario Normativo + Formulario y Test */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
            gap: "1.75rem",
            alignItems: "start"
          }}>
            {/* Columna Izquierda: Protocolos y Reglas de Seguridad */}
            <div style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: "2rem",
              color: "#00205b",
              boxShadow: "0 12px 35px rgba(0,0,0,0.3)",
              borderTop: "6px solid #00205b"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <span style={{
                  background: "#00205b",
                  color: "#fcd116",
                  fontWeight: 900,
                  fontSize: "0.8rem",
                  padding: "0.35rem 0.85rem",
                  borderRadius: 8,
                  textTransform: "uppercase"
                }}>
                  REGLAS OBLIGATORIAS SAFETOGETHER
                </span>
                <span style={{ fontSize: "1.6rem" }}>🛡️</span>
              </div>

              <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#00205b", marginBottom: "1rem" }}>
                📋 Protocolos Mandatorios de Operación:
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {activeModuleDetail.rules.map((rule, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      background: "#f8fafc",
                      padding: "0.85rem 1rem",
                      borderRadius: 10,
                      borderLeft: "4px solid #fcd116",
                      fontSize: "0.9rem",
                      lineHeight: 1.45
                    }}
                  >
                    <span style={{
                      color: "#15803d",
                      fontWeight: 900,
                      background: "#dcfce7",
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "0.8rem"
                    }}>
                      ✓
                    </span>
                    <span style={{ color: "#1e293b", fontWeight: 500 }}>{rule}</span>
                  </div>
                ))}
              </div>

              {/* Advertencia Crítica */}
              <div style={{
                marginTop: "1.5rem",
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: 12,
                padding: "1rem 1.25rem",
                color: "#991b1b",
                fontSize: "0.88rem",
                display: "flex",
                gap: "0.75rem",
                alignItems: "flex-start"
              }}>
                <span style={{ fontSize: "1.3rem" }}>⚠️</span>
                <div>
                  <strong style={{ display: "block", marginBottom: "0.2rem" }}>Aviso de Cumplimiento Crítico:</strong>
                  {activeModuleDetail.warningNotice}
                </div>
              </div>
            </div>

            {/* Columna Derecha: Formulario de Registro y Cuestionario */}
            <div style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: "2rem",
              color: "#00205b",
              boxShadow: "0 12px 35px rgba(0,0,0,0.3)",
              borderTop: "6px solid #fcd116"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#00205b", margin: 0 }}>
                    📝 Registro y Evaluación Digital
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Diligencia tus datos para expedir tu certificado oficial
                  </span>
                </div>
                <span style={{ fontSize: "1.6rem" }}>🎓</span>
              </div>

              {errorMessage && (
                <div style={{
                  background: "#fee2e2",
                  color: "#b91c1c",
                  border: "1px solid #f87171",
                  borderRadius: 10,
                  padding: "0.75rem 1rem",
                  fontSize: "0.85rem",
                  marginBottom: "1.2rem",
                  fontWeight: 600
                }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmitInduccion}>
                {/* Datos Personales */}
                <div style={{ display: "grid", gridTemplateColumns: activeModuleDetail.requiresPlaca ? "1fr 1fr" : "1fr", gap: "0.8rem", marginBottom: "0.8rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, marginBottom: "0.3rem", color: "#00205b" }}>
                      Cédula / Documento de Identidad *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 1094827102"
                      value={formData.documento}
                      onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>

                  {activeModuleDetail.requiresPlaca && (
                    <div>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, marginBottom: "0.3rem", color: "#00205b" }}>
                        Placa del Vehículo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: TKR-482"
                        value={formData.placa}
                        onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                        style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: "0.8rem" }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, marginBottom: "0.3rem", color: "#00205b" }}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombres y Apellidos"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "0.8rem", marginBottom: "1.25rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, marginBottom: "0.3rem", color: "#00205b" }}>
                      Empresa / Entidad *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Empresa transportadora o contratista"
                      value={formData.empresa}
                      onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 800, marginBottom: "0.3rem", color: "#00205b" }}>
                      Centro de Distribución *
                    </label>
                    <select
                      value={formData.sede}
                      onChange={(e) => setFormData({ ...formData, sede: e.target.value })}
                      style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "#ffffff" }}
                    >
                      <option value="Armenia">Armenia</option>
                      <option value="Pereira">Pereira</option>
                      <option value="Barrancabermeja">Barrancabermeja</option>
                    </select>
                  </div>
                </div>

                {/* Preguntas de Evaluación */}
                <div style={{
                  background: "#f8fafc",
                  padding: "1.2rem",
                  borderRadius: 14,
                  border: "1px solid #e2e8f0",
                  marginBottom: "1.5rem"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#00205b", margin: 0 }}>
                      ❓ Cuestionario de Conocimientos (Mínimo 66%):
                    </h4>
                    <span style={{ fontSize: "0.75rem", background: "#fcd116", color: "#00205b", fontWeight: 900, padding: "0.2rem 0.5rem", borderRadius: 4 }}>
                      3 Preguntas
                    </span>
                  </div>

                  {activeModuleDetail.quiz.map((qItem, qIdx) => (
                    <div key={qIdx} style={{ marginBottom: "1.2rem" }}>
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.45rem", color: "#1e293b" }}>
                        {qIdx + 1}. {qItem.question}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        {qItem.options.map((optionText, optIdx) => {
                          const isSelected = quizAnswers[qIdx] === optIdx;
                          return (
                            <label
                              key={optIdx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.6rem",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                padding: "0.45rem 0.75rem",
                                borderRadius: 8,
                                border: isSelected ? "1.5px solid #00205b" : "1px solid #e2e8f0",
                                background: isSelected ? "#e2e8f0" : "#ffffff",
                                transition: "all 0.15s"
                              }}
                            >
                              <input
                                type="radio"
                                name={`quiz-question-${qIdx}`}
                                checked={isSelected}
                                onChange={() => handleAnswerSelect(qIdx, optIdx)}
                                required
                              />
                              <span style={{ color: "#1e293b", fontWeight: isSelected ? 700 : 500 }}>
                                {optionText}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botón de Enviar */}
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    background: "#fcd116",
                    color: "#00205b",
                    fontWeight: 900,
                    fontSize: "1.05rem",
                    padding: "1rem",
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(252, 209, 22, 0.4)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.6rem"
                  }}
                >
                  <span>🎓</span>
                  <span>Completar Inducción y Expedir Carnet</span>
                  <span>→</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 4: HISTORIAL CONSOLIDADO DE CERTIFICADOS
         ========================================================================= */}
      {currentView === "historial" && (
        <div style={{ maxWidth: 1320, width: "95%", margin: "2rem auto 3rem auto" }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: "2rem",
            color: "#00205b",
            boxShadow: "0 12px 40px rgba(0,0,0,0.3)"
          }}>
            {/* Header del Historial */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.9rem", fontWeight: 900, margin: 0, color: "#00205b" }}>
                  📜 Historial Consolidado de Inducciones y Carnets
                </h2>
                <p style={{ color: "#64748b", margin: "0.3rem 0 0 0", fontSize: "0.95rem" }}>
                  Registro digital unificado para Centros de Distribución <strong>Armenia</strong>, <strong>Pereira</strong> y <strong>Barrancabermeja</strong>.
                </p>
              </div>

              <button
                onClick={() => handleOpenInduction("portal")}
                style={{
                  background: "#f1f5f9",
                  color: "#00205b",
                  border: "1px solid #cbd5e1",
                  padding: "0.6rem 1.25rem",
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                ← Volver al Tablero
              </button>
            </div>

            {/* Filtros de Búsqueda */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
              background: "#f8fafc",
              padding: "1.25rem",
              borderRadius: 14,
              border: "1px solid #e2e8f0"
            }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#475569", marginBottom: "0.3rem" }}>
                  🔍 BUSCAR POR DOCUMENTO, NOMBRE O PLACA
                </label>
                <input
                  type="text"
                  placeholder="Escribe para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#475569", marginBottom: "0.3rem" }}>
                  🏢 FILTRAR POR SEDE
                </label>
                <select
                  value={filterSede}
                  onChange={(e) => setFilterSede(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "#ffffff" }}
                >
                  <option value="Todas">Todas las Sedes</option>
                  <option value="Armenia">Armenia</option>
                  <option value="Pereira">Pereira</option>
                  <option value="Barrancabermeja">Barrancabermeja</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "#475569", marginBottom: "0.3rem" }}>
                  🎓 TIPO DE INDUCCIÓN
                </label>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: "0.9rem", background: "#ffffff" }}
                >
                  <option value="Todos">Todos los Tipos</option>
                  <option value="T1">T1 - Primario</option>
                  <option value="T2">T2 - Secundario</option>
                  <option value="T4">T4 - Terceros</option>
                  <option value="Mkp">Mkp - Marketplace</option>
                  <option value="Distoyota">Distoyota</option>
                  <option value="GLP">GLP</option>
                  <option value="Contratistas">Contratistas y Visitantes</option>
                </select>
              </div>
            </div>

            {/* Tabla de Registros */}
            {loadingRecords ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                Cargando historial oficial de inducciones...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                No se encontraron registros que coincidan con los filtros seleccionados.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#00205b", color: "#ffffff" }}>
                      <th style={{ padding: "0.85rem", borderRadius: "10px 0 0 0" }}>Documento</th>
                      <th style={{ padding: "0.85rem" }}>Nombre Completo</th>
                      <th style={{ padding: "0.85rem" }}>Empresa</th>
                      <th style={{ padding: "0.85rem" }}>Tipo Inducción</th>
                      <th style={{ padding: "0.85rem" }}>Placa</th>
                      <th style={{ padding: "0.85rem" }}>Sede</th>
                      <th style={{ padding: "0.85rem" }}>Fecha Emisión</th>
                      <th style={{ padding: "0.85rem" }}>Vigencia</th>
                      <th style={{ padding: "0.85rem" }}>Estado</th>
                      <th style={{ padding: "0.85rem", borderRadius: "0 10px 0 0", textAlign: "center" }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((item, idx) => (
                      <tr key={item.id || idx} style={{ borderBottom: "1px solid #e2e8f0", background: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                        <td style={{ padding: "0.85rem", fontWeight: 700 }}>{item.documento}</td>
                        <td style={{ padding: "0.85rem", fontWeight: 600 }}>{item.nombre}</td>
                        <td style={{ padding: "0.85rem", color: "#475569" }}>{item.empresa}</td>
                        <td style={{ padding: "0.85rem" }}>
                          <span style={{
                            background: item.tipo_induccion?.includes("T1") || item.tipo_induccion?.includes("T2") ? "#e0f2fe" : "#fef9c3",
                            color: "#00205b",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.55rem",
                            borderRadius: 6
                          }}>
                            {item.tipo_induccion}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem", fontWeight: 700 }}>{item.placa || "N/A"}</td>
                        <td style={{ padding: "0.85rem" }}>📍 {item.sede}</td>
                        <td style={{ padding: "0.85rem", color: "#64748b" }}>{item.fecha_induccion}</td>
                        <td style={{ padding: "0.85rem", color: "#15803d", fontWeight: 700 }}>{item.fecha_vencimiento}</td>
                        <td style={{ padding: "0.85rem" }}>
                          <span style={{
                            background: "#dcfce7",
                            color: "#166534",
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            padding: "0.25rem 0.65rem",
                            borderRadius: 9999
                          }}>
                            ✓ {item.estado || "Aprobado"} ({item.calificacion}%)
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem", textAlign: "center" }}>
                          <button
                            onClick={() => setSelectedCertificate(item)}
                            style={{
                              background: "#fcd116",
                              color: "#00205b",
                              border: "none",
                              padding: "0.4rem 0.85rem",
                              borderRadius: 6,
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem"
                            }}
                          >
                            <span>📜</span> Ver Carnet
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL OFICIAL DE CERTIFICADO / CARNET DIGITAL
         ========================================================================= */}
      {selectedCertificate && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.78)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 22,
            maxWidth: 540,
            width: "100%",
            overflow: "hidden",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
            border: "4px solid #fcd116",
            color: "#00205b"
          }}>
            {/* Header del Certificado */}
            <div style={{
              background: "#00205b",
              color: "#ffffff",
              padding: "1.4rem 1.6rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "3px solid #fcd116"
            }}>
              <div>
                <span style={{ fontSize: "0.75rem", letterSpacing: "0.08em", color: "#fcd116", fontWeight: 800, textTransform: "uppercase" }}>
                  CERTIFICACIÓN OFICIAL DE SEGURIDAD
                </span>
                <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: "#ffffff" }}>
                  AB InBev | SafeTogether
                </h3>
              </div>
              <button
                onClick={() => setSelectedCertificate(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ffffff",
                  fontSize: "1.6rem",
                  cursor: "pointer",
                  fontWeight: 900,
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Carnet */}
            <div style={{ padding: "1.75rem" }}>
              <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "#dcfce7",
                  color: "#166534",
                  fontWeight: 900,
                  fontSize: "0.85rem",
                  padding: "0.4rem 1.1rem",
                  borderRadius: 9999,
                  marginBottom: "0.8rem"
                }}>
                  ✓ INDUCCIÓN VIGENTE Y AUTORIZADA
                </div>
                <h2 style={{ fontSize: "1.55rem", fontWeight: 900, margin: 0, color: "#00205b" }}>
                  {selectedCertificate.nombre}
                </h2>
                <div style={{ fontSize: "1rem", color: "#64748b", fontWeight: 700, marginTop: "0.25rem" }}>
                  Cédula: <strong>{selectedCertificate.documento}</strong>
                </div>
              </div>

              <div style={{
                background: "#f8fafc",
                borderRadius: 14,
                padding: "1.2rem",
                border: "1px solid #e2e8f0",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.9rem",
                fontSize: "0.85rem",
                marginBottom: "1.25rem"
              }}>
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>Módulo Inducción:</span>
                  <strong style={{ color: "#00205b", fontSize: "0.92rem" }}>{selectedCertificate.tipo_induccion}</strong>
                </div>

                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>Placa Asignada:</span>
                  <strong style={{ color: "#00205b", fontSize: "0.92rem" }}>{selectedCertificate.placa || "N/A"}</strong>
                </div>

                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>Empresa / Transportadora:</span>
                  <strong style={{ color: "#00205b" }}>{selectedCertificate.empresa}</strong>
                </div>

                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>Centro de Distribución:</span>
                  <strong style={{ color: "#00205b" }}>📍 {selectedCertificate.sede}</strong>
                </div>

                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>Fecha Realización:</span>
                  <strong style={{ color: "#00205b" }}>{selectedCertificate.fecha_induccion}</strong>
                </div>

                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>Válido Hasta:</span>
                  <strong style={{ color: "#15803d" }}>{selectedCertificate.fecha_vencimiento}</strong>
                </div>
              </div>

              {/* Sello y Código QR de Portería */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.85rem 1.2rem",
                background: "#f1f5f9",
                borderRadius: 12,
                border: "1px solid #cbd5e1"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    background: "#00205b",
                    color: "#fcd116",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    fontWeight: 900,
                    fontSize: "0.8rem",
                    letterSpacing: "0.05em"
                  }}>
                    QR
                  </div>
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#00205b" }}>
                      REGISTRO: {selectedCertificate.id}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      Válido para ingreso en portería AB InBev
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block", fontWeight: 700 }}>Aprobación:</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#15803d" }}>
                    {selectedCertificate.calificacion || 100}%
                  </span>
                </div>
              </div>

              {/* Acciones del Carnet */}
              <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    flex: 1,
                    background: "#fcd116",
                    color: "#00205b",
                    fontWeight: 900,
                    padding: "0.85rem",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem"
                  }}
                >
                  <span>🖨️</span> Imprimir Carnet
                </button>

                <button
                  onClick={() => setSelectedCertificate(null)}
                  style={{
                    background: "#e2e8f0",
                    color: "#334155",
                    fontWeight: 700,
                    padding: "0.85rem 1.5rem",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem"
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer corporativo */}
      <footer className="home-footer" style={{ marginTop: "auto", borderTopColor: "rgba(255,255,255,0.1)" }}>
        <p>© 2026 AB InBev / SafeTogether — Módulo Oficial de Inducciones (Armenia • Pereira • Barrancabermeja).</p>
      </footer>
    </div>
  );
}
