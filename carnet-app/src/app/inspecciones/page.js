"use client";

import { useState } from "react";
import { extintoresMockData } from "../../data/extintores";

const preguntasExtintores = [
  "Señalización (tipo, clase, uso)",
  "Manómetro en verde / presión normal",
  "Manguera en buenas condiciones",
  "Boquilla limpia sin obstrucciones",
  "Pin de seguridad presente",
  "Etiqueta del cilindro en buen estado",
  "Pintura en buen estado (sin peladuras)",
  "Extintor libre de obstáculos",
  "Acceso libre de obstáculos",
  "Instalado de forma segura (soporte fijo o base)",
  "Palanca fija asegurada por pin",
  "Palanca en buenas condiciones (sin bordes)",
  "Anillo de garantía presente",
  "Sin objetos colgados o que obstruyan visibilidad",
  "Tarjeta de revisión mensual actualizada",
  "Vigente / dentro de fecha de recarga",
  "Personal capacitado para uso"
];

const preguntasBotiquin = [
  "Ubicación visible y accesible",
  "Elementos vigentes (no vencidos)",
  "Inventario actualizado",
  "Limpio y en buenas condiciones",
  "Camilla y dotación en buen estado"
];

export default function InspeccionesPage() {
  const [tipoElemento, setTipoElemento] = useState("Extintor");
  const [mes, setMes] = useState("Agosto");
  
  // Estado para guardar las respuestas de la matriz.
  // Forma: { "EXT-001": { q0: "C", q1: "NC", obs: "ok" }, ... }
  const [respuestasMatrix, setRespuestasMatrix] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Inspecciones del mes de ${mes} guardadas con éxito.`);
    // Aquí se enviaría a la DB
  };

  const handleRespuestaChange = (itemId, field, val) => {
    setRespuestasMatrix(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: val
      }
    }));
  };

  const preguntasActuales = tipoElemento === "Extintor" ? preguntasExtintores : preguntasBotiquin;
  const itemsActuales = tipoElemento === "Extintor" ? extintoresMockData : []; // Aquí se cargarían botiquines reales luego

  return (
    <div className="container" style={{ maxWidth: '100%', padding: '0 2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>📝 Matriz de Inspecciones Mensuales</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Registro masivo de inspecciones. Marca Cumple (C), No Cumple (NC) o No Aplica (NA).
        </p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
            <label>Mes a evaluar</label>
            <select value={mes} onChange={(e) => setMes(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
            <label>Tipo de Equipo</label>
            <select value={tipoElemento} onChange={(e) => { setTipoElemento(e.target.value); setRespuestasMatrix({}); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <option value="Extintor">🧯 Extintores</option>
              <option value="Botiquin">🚑 Botiquines</option>
            </select>
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end' }}>
             <button onClick={handleSubmit} className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
              💾 Guardar Mes completo
            </button>
          </div>
        </div>

        {itemsActuales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            No hay elementos registrados para este tipo.
          </div>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <table style={{ minWidth: '1500px', width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: 'white' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', position: 'sticky', left: 0, background: '#0f172a', zIndex: 2, minWidth: '100px' }}>ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', position: 'sticky', left: '100px', background: '#0f172a', zIndex: 2, minWidth: '200px' }}>Ubicación</th>
                  
                  {preguntasActuales.map((p, i) => (
                    <th key={i} style={{ padding: '1rem 0.5rem', minWidth: '80px', textAlign: 'center' }} title={p}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.2rem', color: '#38bdf8' }}>P{i+1}</span>
                      </div>
                    </th>
                  ))}
                  <th style={{ padding: '1rem', minWidth: '200px' }}>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {itemsActuales.map((item, rowIndex) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    
                    <td style={{ padding: '0.5rem 1rem', fontWeight: 600, position: 'sticky', left: 0, background: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc', zIndex: 1, borderRight: '1px solid #e2e8f0' }}>
                      {item.id}
                    </td>
                    <td style={{ padding: '0.5rem 1rem', position: 'sticky', left: '100px', background: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc', zIndex: 1, borderRight: '2px solid #cbd5e1' }}>
                      <div style={{ fontWeight: 500 }}>{item.ubicacion}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.tipo} - {item.capacidad}</div>
                    </td>

                    {preguntasActuales.map((p, i) => {
                      const val = respuestasMatrix[item.id]?.[`q${i}`] || "";
                      return (
                        <td key={i} style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                          <select 
                            value={val}
                            onChange={(e) => handleRespuestaChange(item.id, `q${i}`, e.target.value)}
                            style={{ 
                              padding: '0.4rem', 
                              borderRadius: '4px', 
                              border: '1px solid #cbd5e1', 
                              background: val === 'C' ? '#d1fae5' : val === 'NC' ? '#fee2e2' : val === 'NA' ? '#f1f5f9' : 'white',
                              color: val === 'C' ? '#065f46' : val === 'NC' ? '#991b1b' : 'var(--text-main)',
                              fontWeight: val ? 'bold' : 'normal',
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            <option value="">-</option>
                            <option value="C">C</option>
                            <option value="NC">NC</option>
                            <option value="NA">NA</option>
                          </select>
                        </td>
                      );
                    })}

                    <td style={{ padding: '0.5rem' }}>
                       <input 
                          type="text" 
                          placeholder="Observaciones..."
                          value={respuestasMatrix[item.id]?.obs || ""}
                          onChange={(e) => handleRespuestaChange(item.id, 'obs', e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        />
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div style={{ marginTop: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
          <strong>Leyenda de Preguntas (Extintores):</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.5rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
             {preguntasActuales.map((p, i) => (
                <div key={i}><strong>P{i+1}:</strong> {p}</div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
