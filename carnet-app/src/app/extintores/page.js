"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Inicializar Supabase cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ExtintoresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [extintoresList, setExtintoresList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // UUID del registro en BD, si es null es Crear
  
  const [formData, setFormData] = useState({
    id_extintor: "",
    ubicacion: "",
    tipo: "",
    capacidad: "",
    fecha_vencimiento: "",
    observaciones: ""
  });

  const getStatus = (fechaString) => {
    if (!fechaString) return { days: 0, colorClass: "badge-success", text: "Óptimo", colorCode: "#10b981" };
    const today = new Date();
    // Normalizar a UTC para evitar desfases de huso horario con fechas YYYY-MM-DD
    const fechaVencimiento = new Date(fechaString + 'T00:00:00Z'); 
    
    // Calcula usando UTC
    const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const utcVenc = Date.UTC(fechaVencimiento.getUTCFullYear(), fechaVencimiento.getUTCMonth(), fechaVencimiento.getUTCDate());
    
    const diffDays = Math.floor((utcVenc - utcToday) / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return { days: diffDays, colorClass: "badge-danger", text: "Crítico", colorCode: "#ef4444" };
    } else if (diffDays >= 30 && diffDays <= 60) {
      return { days: diffDays, colorClass: "badge-warning", text: "Atención", colorCode: "#f59e0b" };
    } else {
      return { days: diffDays, colorClass: "badge-success", text: "Óptimo", colorCode: "#10b981" };
    }
  };

  const loadExtintores = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('extintores').select('*').order('fecha_vencimiento', { ascending: true });
    if (error) {
      console.error("Error cargando extintores:", error);
    } else {
      setExtintoresList(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadExtintores();
  }, []);

  const filteredData = extintoresList.filter(item => 
    (item.ubicacion || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.id_extintor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.tipo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        id_extintor: item.id_extintor || "",
        ubicacion: item.ubicacion || "",
        tipo: item.tipo || "",
        capacidad: item.capacidad || "",
        fecha_vencimiento: item.fecha_vencimiento || "",
        observaciones: item.observaciones || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        id_extintor: "",
        ubicacion: "",
        tipo: "PQS",
        capacidad: "10 lbs",
        fecha_vencimiento: "",
        observaciones: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId) {
      // Update
      const { error } = await supabase
        .from('extintores')
        .update(formData)
        .eq('id', editingId);
      
      if (error) alert("Error actualizando: " + error.message);
      else {
        handleCloseModal();
        loadExtintores();
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('extintores')
        .insert([formData]);
      
      if (error) alert("Error creando: " + error.message);
      else {
        handleCloseModal();
        loadExtintores();
      }
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este extintor?")) {
      const { error } = await supabase.from('extintores').delete().eq('id', id);
      if (error) alert("Error eliminando: " + error.message);
      else loadExtintores();
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Módulo de Extintores</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de inventario oficial conectado a Supabase</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>➕</span> Añadir Extintor
        </button>
      </header>

      {/* Tarjetas de Resumen (Semáforo) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ borderLeft: '4px solid #ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Crítico (&lt; 30 días)</h3>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>
            {extintoresList.filter(d => getStatus(d.fecha_vencimiento).text === "Crítico").length}
          </span>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Atención (30-60 días)</h3>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {extintoresList.filter(d => getStatus(d.fecha_vencimiento).text === "Atención").length}
          </span>
        </div>
        <div className="glass-panel" style={{ borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Óptimo (&gt; 60 días)</h3>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {extintoresList.filter(d => getStatus(d.fecha_vencimiento).text === "Óptimo").length}
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
                <th>Próxima Recarga</th>
                <th>Días Restantes</th>
                <th>Estado</th>
                <th>Observaciones</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Cargando inventario...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No hay extintores registrados. Haz clic en "Añadir Extintor" para comenzar.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => {
                  const status = getStatus(item.fecha_vencimiento);
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{item.id_extintor}</td>
                      <td style={{ fontWeight: 500 }}>{item.ubicacion}</td>
                      <td>{item.tipo}</td>
                      <td>{item.capacidad}</td>
                      <td>
                        {item.fecha_vencimiento ? new Date(item.fecha_vencimiento + 'T00:00:00Z').toLocaleDateString('es-CO', { 
                          day: '2-digit', month: 'short', year: 'numeric' 
                        }) : '-'}
                      </td>
                      <td>
                        <strong style={{ color: status.colorCode }}>
                          {status.days} {status.days === 1 || status.days === -1 ? 'día' : 'días'}
                        </strong>
                      </td>
                      <td>
                        <span className={`badge ${status.colorClass}`}>
                          {status.text === 'Crítico' ? '🔴 ' : status.text === 'Atención' ? '🟡 ' : '🟢 '}
                          {status.text}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '200px' }}>
                        {item.observaciones || '-'}
                      </td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenModal(item)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', background: '#e2e8f0', color: '#1e293b' }}>
                          ✏️ Editar
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', border: 'none' }}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--primary)' }}>
              {editingId ? '✏️ Editar Extintor' : '➕ Nuevo Extintor'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>ID / Código del Extintor</label>
                  <input type="text" required value={formData.id_extintor} onChange={e => setFormData({...formData, id_extintor: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Ubicación</label>
                  <input type="text" required value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Tipo (Ej. PQS, CO2, Solagua)</label>
                  <input type="text" required value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Capacidad (Ej. 10 lbs)</label>
                  <input type="text" required value={formData.capacidad} onChange={e => setFormData({...formData, capacidad: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                  <label>Fecha de Vencimiento / Próxima Recarga</label>
                  <input type="date" required value={formData.fecha_vencimiento} onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                  <label>Observaciones Adicionales</label>
                  <textarea rows="2" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', background: '#f1f5f9', color: '#475569', border: 'none' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>💾 Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
