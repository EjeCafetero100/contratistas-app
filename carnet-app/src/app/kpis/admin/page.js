"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileSelector from '@/components/ProfileSelector';

export default function AdminKPIs() {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form for New KPI
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    cd: 'Pereira',
    responsable: '',
    nombre: '',
    unidad: '%',
    meta_mensual: '',
    disparador: '',
    comparador: '>=',
    agregacion: 'SUMA'
  });

  // Modal for Edit KPI
  const [editModal, setEditModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/kpis')
      .then(r => r.json())
      .then(data => {
        setKpis(data);
        setLoading(false);
      });
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          meta_mensual: Number(formData.meta_mensual),
          meta_semanal: Number(formData.meta_mensual),
          disparador: Number(formData.disparador)
        })
      });
      if (res.ok) {
        const newKpi = await res.json();
        setKpis([...kpis, newKpi]);
        alert('KPI Creado exitosamente');
        setIsCreating(false);
      }
    } catch (err) {
      alert('Error de red');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/kpis', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModal.id,
          meta_mensual: Number(editModal.meta_mensual),
          disparador: Number(editModal.disparador),
          comparador: editModal.comparador,
          usuario: 'Administrador Nacional'
        })
      });
      if (res.ok) {
        const updatedKpi = await res.json();
        setKpis(prev => prev.map(k => k.id === updatedKpi.id ? updatedKpi : k));
        setEditModal(null);
      }
    } catch (err) {
      alert('Error guardando configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProfileSelector>
      {(profile) => {
        if (profile.role !== 'admin') {
          return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '3rem' }}>
              <h2>Acceso Denegado</h2>
              <p>Solo el Administrador Nacional puede acceder a esta área.</p>
              <Link href="/kpis" className="btn btn-primary" style={{ marginTop: '1rem' }}>Volver al Dashboard</Link>
            </div>
          );
        }

        return (
          <div className="container" style={{ maxWidth: '1200px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <Link href="/kpis" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                &larr; Volver al Dashboard
              </Link>
            </div>

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1>⚙️ Administración de KPIs</h1>
                <p style={{ color: 'var(--text-muted)' }}>Configuración global, metas, disparadores y reglas de color.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsCreating(!isCreating)}>
                {isCreating ? 'Cancelar' : '➕ Crear Nuevo KPI'}
              </button>
            </header>

            {isCreating && (
              <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                <h3>Crear Nuevo Indicador</h3>
                <form onSubmit={handleCreate}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Centro de Distribución</label>
                      <select required value={formData.cd} onChange={e => setFormData({...formData, cd: e.target.value})}>
                        <option value="Pereira">Pereira</option>
                        <option value="Armenia">Armenia</option>
                        <option value="Barrancabermeja">Barrancabermeja</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Responsable</label>
                      <input type="text" required value={formData.responsable} onChange={e => setFormData({...formData, responsable: e.target.value})} placeholder="Ej: UC" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Nombre del Indicador</label>
                      <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Comparador (Éxito)</label>
                      <select required value={formData.comparador} onChange={e => setFormData({...formData, comparador: e.target.value})}>
                        <option value=">">Mayor que ({'>'})</option>
                        <option value=">=">Mayor o igual ({'>='})</option>
                        <option value="<">Menor que ({'<'})</option>
                        <option value="<=">Menor o igual ({'<='})</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Unidad de Medida</label>
                      <input type="text" required value={formData.unidad} onChange={e => setFormData({...formData, unidad: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Meta (Verde 🟢)</label>
                      <input type="number" step="any" required value={formData.meta_mensual} onChange={e => setFormData({...formData, meta_mensual: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Disparador (Azul 🔵)</label>
                      <input type="number" step="any" required value={formData.disparador} onChange={e => setFormData({...formData, disparador: e.target.value})} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} disabled={isSaving}>
                    Guardar KPI
                  </button>
                </form>
              </div>
            )}

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                <h3 style={{ margin: 0 }}>Tabla Maestra de Configuración</h3>
              </div>
              
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                {loading ? (
                  <p style={{ padding: '2rem' }}>Cargando datos...</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>CD</th>
                        <th>Resp.</th>
                        <th>Indicador</th>
                        <th>UM</th>
                        <th>Comp.</th>
                        <th>Meta 🟢</th>
                        <th>Disp. 🔵</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.map(k => (
                        <tr key={k.id}>
                          <td><span className="badge" style={{ background: '#e2e8f0' }}>{k.cd}</span></td>
                          <td>{k.responsable}</td>
                          <td style={{ fontWeight: 600 }}>{k.nombre}</td>
                          <td>{k.unidad}</td>
                          <td style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{k.comparador}</td>
                          <td style={{ color: '#10b981', fontWeight: 'bold' }}>{k.meta_mensual}</td>
                          <td style={{ color: '#3b82f6', fontWeight: 'bold' }}>{k.disparador}</td>
                          <td>
                            <button className="btn" style={{ padding: '0.4rem 0.8rem', background: 'var(--surface-border)' }} onClick={() => setEditModal(k)}>
                              ✏️ Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Modal Editar */}
            {editModal && (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
                  <h3>✏️ Configuración Rápida</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{editModal.nombre}</p>
                  
                  <form onSubmit={handleEdit}>
                    <div className="form-group">
                      <label>Comparador</label>
                      <select required value={editModal.comparador} onChange={e => setEditModal({...editModal, comparador: e.target.value})}>
                        <option value=">">Mayor que ({'>'})</option>
                        <option value=">=">Mayor o igual ({'>='})</option>
                        <option value="<">Menor que ({'<'})</option>
                        <option value="<=">Menor o igual ({'<='})</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Meta (Verde 🟢)</label>
                      <input type="number" step="any" required value={editModal.meta_mensual} onChange={e => setEditModal({...editModal, meta_mensual: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Disparador (Azul 🔵)</label>
                      <input type="number" step="any" required value={editModal.disparador ?? editModal.meta_mensual} onChange={e => setEditModal({...editModal, disparador: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn" onClick={() => setEditModal(null)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>Actualizar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        );
      }}
    </ProfileSelector>
  );
}
