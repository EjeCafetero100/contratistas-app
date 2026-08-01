"use client";

import { useState } from "react";

const preguntasExtintores = [
  "El extintor cuenta con la señalización la cual indica el tipo de extintor, clase de fuego y forma de emplearlo",
  "La aguja del manómetro del extintor se encuentra en la mitad indicando una presión normal dentro del extintor",
  "La manguera del extintor se encuentra en buenas condiciones (si la tiene)",
  "La boquilla del extintor o la punta de la manguera se encuentran limpios (sin restos de agente extintor ni obstrucciones)",
  "El extintor presenta pin de seguridad",
  "La etiqueta del cilindro del extintor se encuentra en buen estado (clara, identificable, sin deterioro)",
  "La pintura del extintor se encuentra en buen estado (sin peladuras)",
  "El extintor se encuentra libre de obstáculos",
  "El acceso al extintor se encuentra libre de obstáculos",
  "El extintor está instalado de forma segura, ya sea colgado mediante soporte fijo o ubicado sobre una base de piso que le brinda soporte y estabilidad",
  "La palanca de accionamiento se encuentra fija asegurada por el pin de seguridad",
  "La palanca fija se encuentra en buenas condiciones (sin bordes o puntas peligrosas y asegurada)",
  "El extintor presenta anillo de garantía",
  "El extintor se encuentra libre de objetos colgados sobre él o ubicados frente a este que obstruyan su acceso o visibilidad",
  "La tarjeta de revisión mensual se encuentra actualizada de acuerdo al mes de revisión",
  "El extintor se encuentra vigente y dentro de la fecha de recarga establecida",
  "El personal se encuentra capacitado y entrenado para el uso del extintor"
];

const preguntasBotiquin = [
  "El botiquín está ubicado en un lugar visible y de fácil acceso",
  "Los elementos del botiquín están vigentes (no vencidos)",
  "El botiquín cuenta con inventario actualizado",
  "El botiquín está limpio y en buenas condiciones",
  "Se cuenta con camilla rígida y dotación anexa en buen estado"
];

export default function InspeccionesPage() {
  const [tipoElemento, setTipoElemento] = useState("Extintor");
  const [identificador, setIdentificador] = useState("");
  const [mes, setMes] = useState("Agosto");
  
  const [respuestas, setRespuestas] = useState({});
  const [comentarios, setComentarios] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Inspección guardada con éxito para el ${tipoElemento} ${identificador} en el mes de ${mes}.`);
    setIdentificador("");
    setComentarios("");
    setRespuestas({});
  };

  const handleRespuestaChange = (qIndex, val) => {
    setRespuestas({ ...respuestas, [qIndex]: val });
  };

  const preguntasActuales = tipoElemento === "Extintor" ? preguntasExtintores : preguntasBotiquin;

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>📝 Inspecciones Mensuales</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Registro de inspecciones de equipos de emergencia.
        </p>
      </header>

      <div className="glass-panel">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label>Mes de Inspección</label>
              <select value={mes} onChange={(e) => setMes(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <option value="Enero">Enero</option>
                <option value="Febrero">Febrero</option>
                <option value="Marzo">Marzo</option>
                <option value="Abril">Abril</option>
                <option value="Mayo">Mayo</option>
                <option value="Junio">Junio</option>
                <option value="Julio">Julio</option>
                <option value="Agosto">Agosto</option>
                <option value="Septiembre">Septiembre</option>
                <option value="Octubre">Octubre</option>
                <option value="Noviembre">Noviembre</option>
                <option value="Diciembre">Diciembre</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label>Tipo de Elemento</label>
              <select value={tipoElemento} onChange={(e) => { setTipoElemento(e.target.value); setRespuestas({}); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <option value="Extintor">🧯 Extintores</option>
                <option value="Botiquin">🚑 Botiquines</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
              <label>Identificador o Ubicación (Ej: EXT-001, Botiquín Pasillo)</label>
              <input 
                type="text" 
                required 
                value={identificador} 
                onChange={(e) => setIdentificador(e.target.value)} 
                placeholder="Escribe el ID..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid #e2e8f0', margin: '2rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--primary)', margin: 0 }}>Condición a Observar</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>C=Cumple | NC=No Cumple | NA=No Aplica</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {preguntasActuales.map((pregunta, index) => (
              <div key={index} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontWeight: 500, margin: 0, fontSize: '0.95rem' }}>
                  {index + 1}. {pregunta}
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <input type="radio" name={`q${index}`} required checked={respuestas[index] === 'C'} onChange={() => handleRespuestaChange(index, 'C')} /> 
                    <span style={{ fontWeight: respuestas[index] === 'C' ? 'bold' : 'normal', color: respuestas[index] === 'C' ? '#10b981' : 'inherit' }}>C</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <input type="radio" name={`q${index}`} required checked={respuestas[index] === 'NC'} onChange={() => handleRespuestaChange(index, 'NC')} /> 
                    <span style={{ fontWeight: respuestas[index] === 'NC' ? 'bold' : 'normal', color: respuestas[index] === 'NC' ? '#ef4444' : 'inherit' }}>NC</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <input type="radio" name={`q${index}`} required checked={respuestas[index] === 'NA'} onChange={() => handleRespuestaChange(index, 'NA')} /> 
                    <span style={{ fontWeight: respuestas[index] === 'NA' ? 'bold' : 'normal', color: respuestas[index] === 'NA' ? '#64748b' : 'inherit' }}>NA</span>
                  </label>
                </div>
              </div>
            ))}

          </div>

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <label>Comentarios / Observaciones Finales</label>
            <textarea 
              rows="3" 
              value={comentarios} 
              onChange={(e) => setComentarios(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical' }}
              placeholder="Escribe aquí cualquier hallazgo..."
            ></textarea>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
              💾 Guardar Inspección
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
