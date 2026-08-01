"use client";

import { useState } from "react";

export default function InspeccionesPage() {
  const [tipoElemento, setTipoElemento] = useState("Extintor");
  const [identificador, setIdentificador] = useState("");
  const [mes, setMes] = useState("Agosto");
  
  // Estas son las preguntas "dummy". El usuario las enviará luego para actualizarlas.
  const [respuestas, setRespuestas] = useState({
    q1: "Sí",
    q2: "Sí",
    q3: "No aplica",
  });

  const [comentarios, setComentarios] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Inspección guardada con éxito para el ${tipoElemento} ${identificador} en el mes de ${mes}.`);
    // Aquí en el futuro se guardaría en base de datos.
    setIdentificador("");
    setComentarios("");
  };

  const handleRespuestaChange = (qId, val) => {
    setRespuestas({ ...respuestas, [qId]: val });
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>📝 Inspecciones Mensuales</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Módulo de pre-lanzamiento. Por favor, <strong>envíame las preguntas reales</strong> para añadirlas a este formulario.
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
              <select value={tipoElemento} onChange={(e) => setTipoElemento(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <option value="Extintor">🧯 Extintor</option>
                <option value="Botiquin">🚑 Botiquín</option>
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

          <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Lista de Chequeo (Ejemplo)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Pregunta 1 */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>1. ¿El elemento está libre de obstáculos y es de fácil acceso?</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label><input type="radio" name="q1" checked={respuestas.q1 === 'Sí'} onChange={() => handleRespuestaChange('q1', 'Sí')} /> Sí</label>
                <label><input type="radio" name="q1" checked={respuestas.q1 === 'No'} onChange={() => handleRespuestaChange('q1', 'No')} /> No</label>
                <label><input type="radio" name="q1" checked={respuestas.q1 === 'No aplica'} onChange={() => handleRespuestaChange('q1', 'No aplica')} /> N/A</label>
              </div>
            </div>

            {/* Pregunta 2 */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>2. ¿El manómetro (si aplica) se encuentra en zona verde / óptima?</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label><input type="radio" name="q2" checked={respuestas.q2 === 'Sí'} onChange={() => handleRespuestaChange('q2', 'Sí')} /> Sí</label>
                <label><input type="radio" name="q2" checked={respuestas.q2 === 'No'} onChange={() => handleRespuestaChange('q2', 'No')} /> No</label>
                <label><input type="radio" name="q2" checked={respuestas.q2 === 'No aplica'} onChange={() => handleRespuestaChange('q2', 'No aplica')} /> N/A</label>
              </div>
            </div>

            {/* Pregunta 3 */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>3. ¿La señalización es visible y el equipo está limpio?</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label><input type="radio" name="q3" checked={respuestas.q3 === 'Sí'} onChange={() => handleRespuestaChange('q3', 'Sí')} /> Sí</label>
                <label><input type="radio" name="q3" checked={respuestas.q3 === 'No'} onChange={() => handleRespuestaChange('q3', 'No')} /> No</label>
                <label><input type="radio" name="q3" checked={respuestas.q3 === 'No aplica'} onChange={() => handleRespuestaChange('q3', 'No aplica')} /> N/A</label>
              </div>
            </div>

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
