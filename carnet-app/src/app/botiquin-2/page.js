"use client";

import { useState } from "react";

// Función auxiliar para sumar días a una fecha
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// Generar datos inventados con fechas de vencimiento variables
// Puedes modificar estos datos y agregar los insumos reales del Botiquín 2 aquí
const today = new Date();
const mockData = [
  { id: 1, nombre: "Gasa estéril 7.5x7.5", cantidad: 10, fechaVencimiento: addDays(today, 15) }, // Rojo (<30)
  { id: 2, nombre: "Alcohol antiséptico", cantidad: 2, fechaVencimiento: addDays(today, 45) }, // Amarillo (30-60)
  { id: 3, nombre: "Vendas elásticas 3x5", cantidad: 5, fechaVencimiento: addDays(today, 120) }, // Verde (>60)
  { id: 4, nombre: "Esparadrapo de tela", cantidad: 1, fechaVencimiento: addDays(today, 5) }, // Rojo (<30)
  { id: 5, nombre: "Tijeras punta roma", cantidad: 1, fechaVencimiento: addDays(today, 800) }, // Verde (>60)
  { id: 6, nombre: "Curitas", cantidad: 50, fechaVencimiento: addDays(today, 35) }, // Amarillo (30-60)
  { id: 7, nombre: "Suero fisiológico", cantidad: 3, fechaVencimiento: addDays(today, 95) }, // Verde (>60)
  { id: 8, nombre: "Yodopovidona", cantidad: 1, fechaVencimiento: addDays(today, 55) }, // Amarillo (30-60)
  { id: 9, nombre: "Guantes de látex", cantidad: 20, fechaVencimiento: addDays(today, 25) }, // Rojo (<30)
  { id: 10, nombre: "Termómetro digital", cantidad: 1, fechaVencimiento: addDays(today, 500) }, // Verde (>60)
];

export default function Botiquin2Page() {
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
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar por fecha de vencimiento (los más próximos a vencer primero)
  const sortedData = [...filteredData].sort((a, b) => a.fechaVencimiento - b.fechaVencimiento);

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Botiquín 2</h1>
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
          <h2 style={{ margin: 0 }}>Inventario</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Buscar elemento..." 
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
                <th>Elemento</th>
                <th>Cantidad</th>
                <th>Próximo Vencimiento</th>
                <th>Días Restantes</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map(item => {
                const status = getStatus(item.fechaVencimiento);
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.nombre}</td>
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
                    No se encontraron elementos con ese nombre.
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
