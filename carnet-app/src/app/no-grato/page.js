"use client";

import { useEffect, useState } from "react";

export default function NoGratoPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    motivo: "",
    cd: ""
  });
  const [adding, setAdding] = useState(false);

  const [searchCedula, setSearchCedula] = useState("");
  const [searchResult, setSearchResult] = useState(null);

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchCedula.trim()) return;
    
    const found = records.find(r => r.cedula === searchCedula.trim());
    if (found) {
      setSearchResult({ status: 'NO GRATO', motivo: found.motivo, nombre: found.nombre, cd: found.cd });
    } else {
      setSearchResult({ status: 'GRATO' });
    }
  };

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
        setFormData({ cedula: "", nombre: "", motivo: "", cd: "" });
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

  const handleQuitarBloqueo = async (id, nombre) => {
    if (confirm(`¿Estás seguro de que deseas quitar el bloqueo a ${nombre}?`)) {
      try {
        const res = await fetch(`/api/no-grato/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setRecords(records.filter(r => r.id !== id));
        } else {
          alert("Error al quitar bloqueo");
        }
      } catch (err) {
        alert("Error de conexión");
      }
    }
  };

  const handleHardDelete = async (id) => {
    if (confirm(`¿Está seguro de eliminar este registro? Esta acción no se puede deshacer.`)) {
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

  const toggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      const pwd = prompt("Ingrese contraseña de administrador para habilitar eliminación de registros:");
      if (pwd === "admin123") {
        setIsAdmin(true);
      } else if (pwd) {
        alert("Contraseña incorrecta");
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
        <button 
          onClick={toggleAdmin} 
          className={`btn ${isAdmin ? 'btn-danger' : 'btn-primary'}`}
          style={{ backgroundColor: isAdmin ? '#ef4444' : '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
        >
          {isAdmin ? '🔒 Salir Modo Admin' : '🔓 Modo Admin'}
        </button>
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
              <label>Centro de Distribución (CD)</label>
              <input type="text" name="cd" value={formData.cd} onChange={handleChange} required placeholder="Ej. CD Bogotá" />
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

        {/* Columna Derecha: Buscador y Tabla */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Buscador */}
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔍 Validar Cédula
            </h2>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <input 
                type="text" 
                placeholder="Ingrese cédula a buscar..." 
                value={searchCedula}
                onChange={(e) => {
                  setSearchCedula(e.target.value);
                  setSearchResult(null); // limpiar al escribir
                }}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <button type="submit" className="btn btn-primary">
                Buscar
              </button>
            </form>

            {searchResult && (
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1rem', 
                borderRadius: '8px', 
                background: searchResult.status === 'GRATO' ? '#ecfdf5' : '#fef2f2',
                border: `2px solid ${searchResult.status === 'GRATO' ? '#10b981' : '#ef4444'}`
              }}>
                {searchResult.status === 'GRATO' ? (
                  <div style={{ color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>✓</span> ESTA PERSONA ES GRATA (No está en la lista negra)
                  </div>
                ) : (
                  <div style={{ color: '#ef4444' }}>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>❌</span> ESTA PERSONA ES NO GRATA
                    </div>
                    <p style={{ margin: '0.5rem 0 0 2rem' }}><strong>Nombre:</strong> {searchResult.nombre}</p>
                    <p style={{ margin: '0.2rem 0 0 2rem' }}><strong>CD:</strong> {searchResult.cd || 'N/A'}</p>
                    <p style={{ margin: '0.2rem 0 0 2rem' }}><strong>Motivo:</strong> {searchResult.motivo}</p>
                  </div>
                )}
              </div>
            )}
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
                    <th>CD</th>
                    <th>Motivo</th>
                    <th>Fecha Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.cedula}</td>
                      <td>{r.nombre}</td>
                      <td>{r.cd || 'N/A'}</td>
                      <td>{r.motivo}</td>
                      <td>{new Date(r.fecha_registro).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <button 
                            onClick={() => handleQuitarBloqueo(r.id, r.nombre)} 
                            style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: '500', cursor: 'pointer', padding: 0 }}
                          >
                            Quitar Bloqueo
                          </button>
                          
                          {isAdmin && (
                            <button 
                              onClick={() => handleHardDelete(r.id)} 
                              style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '500', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              🗑️ Eliminar
                            </button>
                          )}
                        </div>
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
    </div>
  );
}
