"use client";

import { useState } from "react";
import { extintoresData } from "./db";

export default function Extintores2Page() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatus = (fechaVencimientoStr) => {
    // Parseamos la fecha (YYYY-MM-DD) asumiendo medianoche local para evitar desfases
    const [year, month, day] = fechaVencimientoStr.split('-');
    const fechaVencimiento = new Date(year, month - 1, day);
    
    // Obtenemos la fecha de hoy normalizada a la medianoche
    const today = new Date();
    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = fechaVencimiento.getTime() - todayNormalized.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Regla solicitada:
    // Rojo si es menos de 30 días
    // Amarillo si está entre 30 y 90 días (se ajustó el 60 a 90 para cubrir el vacío hasta el verde)
    // Verde si tiene más de 90 días
    if (diffDays < 30) {
      return { days: diffDays, colorClass: "badge-danger", text: "Crítico", colorCode: "#ef4444" };
    } else if (diffDays >= 30 && diffDays <= 90) {
      return { days: diffDays, colorClass: "badge-warning", text: "Atención", colorCode: "#f59e0b" };
    } else {
      return { days: diffDays, colorClass: "badge-success", text: "Óptimo", colorCode: "#10b981" };
    }
  };

  const filteredData = extintoresData.filter(item => 
    item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar por fecha de vencimiento (los más próximos a vencer primero)
  const sortedData = [...filteredData].sort((a, b) => {
    return new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento);
  });

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Módulo de Extintores 2</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de inventario con nueva regla de colores (Verde &gt; 90, Amarillo 30-90, Rojo &lt; 30)</p>
        </div>
      </header>

      {/* Tarjetas de Resumen (Semáforo) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ borderLeft: '4px solid #ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Rojo (&lt; 30 días)</h3>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>
            {extintoresData.filter(d => getStatus(d.fechaVencimiento).text === "Crítico").length}
          </span>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Amarillo (30-90 días)</h3>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {extintoresData.filter(d => getStatus(d.fechaVencimiento).text === "Atención").length}
          </span>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Verde (&gt; 90 días)</h3>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {extintoresData.filter(d => getStatus(d.fechaVencimiento).text === "Óptimo").length}
          </span>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Inventario de Extintores</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por ubicación, tipo o ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '300px' }}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID Extintor</th>
                <th>Ubicación</th>
                <th>Tipo</th>
                <th>Capacidad</th>
                <th>Vencimiento</th>
                <th>Días Restantes</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(item => {
                const status = getStatus(item.fechaVencimiento);
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.id}</td>
                    <td style={{ fontWeight: 500 }}>{item.ubicacion}</td>
                    <td>{item.tipo}</td>
                    <td>{item.capacidad}</td>
                    <td>{item.fechaVencimiento}</td>
                    <td>
                      <strong style={{ color: status.colorCode }}>
                        {status.days} {status.days === 1 ? 'día' : 'días'}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${status.colorClass}`}>
                        {status.text === 'Crítico' ? '🔴 ' : status.text === 'Atención' ? '🟡 ' : '🟢 '}
                        {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No se encontraron extintores con ese criterio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
