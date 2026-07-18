"use client";

import { useEffect, useState } from "react";

export default function NoGratoPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    motivo: ""
  });
  const [adding, setAdding] = useState(false);

  const fetchRecords = () => {
    setLoading(true);
    fetch('/api/no-grato')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setRecords(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch('/api/no-grato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setFormData({ cedula: "", nombre: "", motivo: "" });
        fetchRecords();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${nombre} de la lista negra?`)) {
      try {
        const res = await fetch(`/api/no-grato/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setRecords(records.filter(r => r.id !== id));
        } else {
          alert("Error al eliminar");
        }
      } catch (err) {
        alert("Error de conexión");
      }
    }
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'var(--danger)' }}>Personal No Grato</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de accesos denegados</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Formulario */}
        <div className="glass-panel" style={{ border: '2px solid var(--danger)' }}>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--danger)' }}>Añadir a Lista Negra</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Cédula</label>
              <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Motivo del Bloqueo</label>
              <input type="text" name="motivo" value={formData.motivo} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)', color: 'white', width: '100%', marginTop: '1rem' }} disabled={adding}>
              {adding ? 'Añadiendo...' : 'Bloquear Acceso'}
            </button>
          </form>
        </div>

        {/* Tabla */}
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.25rem' }}>Personal Restringido</h2>
          
          {loading ? (
            <p>Cargando datos...</p>
          ) : error ? (
            <p style={{ color: 'var(--danger)' }}>{error}</p>
          ) : records.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No hay personas en la lista negra.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Cédula</th>
                    <th>Nombre</th>
                    <th>Motivo</th>
                    <th>Fecha Registro</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.cedula}</td>
                      <td>{r.nombre}</td>
                      <td>{r.motivo}</td>
                      <td>{new Date(r.fecha_registro).toLocaleDateString()}</td>
                      <td>
                        <button 
                          onClick={() => handleDelete(r.id, r.nombre)} 
                          style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: '500', cursor: 'pointer', padding: 0 }}
                        >
                          Quitar Bloqueo
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
    </div>
  );
}
