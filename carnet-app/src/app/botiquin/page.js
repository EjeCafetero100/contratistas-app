"use client";

import { useState } from "react";

// Función auxiliar para sumar días a una fecha
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Generar datos inventados con fechas de vencimiento variables
const today = new Date();
const mockData = [
  { id: 1, elemento: "Gasas estériles", cantidad: "10 unidades", fechaVencimiento: addDays(today, 15) }, // Rojo (<30)
  { id: 2, elemento: "Esparadrapo 4*5yd", cantidad: "1 unidad", fechaVencimiento: addDays(today, 45) }, // Amarillo (30-60)
  { id: 3, elemento: "Algodón 25g", cantidad: "1 paquete", fechaVencimiento: addDays(today, 120) }, // Verde (>60)
  { id: 4, elemento: "Bajalenguas", cantidad: "20 unidades", fechaVencimiento: addDays(today, 5) }, // Rojo (<30)
  { id: 5, elemento: "Guantes de látex", cantidad: "1 caja", fechaVencimiento: addDays(today, 35) }, // Amarillo (30-60)
  { id: 6, elemento: "Venda elástica 2*5", cantidad: "2 unidades", fechaVencimiento: addDays(today, 95) }, // Verde (>60)
  { id: 7, elemento: "Solución salina 500ml", cantidad: "1 unidad", fechaVencimiento: addDays(today, 55) }, // Amarillo (30-60)
  { id: 8, elemento: "Yodopovidona 120 ml", cantidad: "1 unidad", fechaVencimiento: addDays(today, 25) }, // Rojo (<30)
  { id: 9, elemento: "Alcohol 350ml", cantidad: "1 unidad", fechaVencimiento: addDays(today, 200) }, // Verde (>60)
  { id: 10, elemento: "Tapabocas", cantidad: "10 unidades", fechaVencimiento: addDays(today, 80) }, // Verde (>60)
];

export default function BotiquinPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatus = (fechaVencimiento) => {
    const today = new Date();
    const diffTime = fechaVencimiento.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return { days: diffDays, colorClass: "badge-danger", text: "Crítico", colorCode: "#ef4444" };
    } else if (diffDays >= 30 && diffDays <= 60) {
      return { days: diffDays, colorClass: "badge-warning", text: "Atención", colorCode: "#f59e0b" };
    } else {
      return { days: diffDays, colorClass: "badge-success", text: "Óptimo", colorCode: "#10b981" };
    }
  };

  const filteredData = mockData.filter(item => 
    item.elemento.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar por fecha de vencimiento (los más próximos a vencer primero)
  const sortedData = [...filteredData].sort((a, b) => a.fechaVencimiento - b.fechaVencimiento);

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Módulo de Botiquín</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de inventario y fechas de vencimiento (Datos de Prueba)</p>
        </div>
      </header>

      {/* Tarjetas de Resumen (Semáforo) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ borderLeft: '4px solid #ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Crítico (&lt; 30 días)</h3>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>
            {mockData.filter(d => getStatus(d.fechaVencimiento).text === "Crítico").length}
          </span>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Atención (30-60 días)</h3>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {mockData.filter(d => getStatus(d.fechaVencimiento).text === "Atención").length}
          </span>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Óptimo (&gt; 60 días)</h3>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {mockData.filter(d => getStatus(d.fechaVencimiento).text === "Óptimo").length}
          </span>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Elementos del Botiquín</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Buscar elemento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '250px' }}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Elemento</th>
                <th>Cantidad</th>
                <th>Fecha Vencimiento</th>
                <th>Días Restantes</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(item => {
                const status = getStatus(item.fechaVencimiento);
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.elemento}</td>
                    <td>{item.cantidad}</td>
                    <td>
                      {item.fechaVencimiento.toLocaleDateString('es-CO', { 
                        day: '2-digit', month: 'short', year: 'numeric' 
                      })}
                    </td>
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
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No se encontraron elementos.
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
