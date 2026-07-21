"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileSelector from '@/components/ProfileSelector';

export default function AdminKPIs() {
  const [kpis, setKpis] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Targets
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTipo, setSelectedTipo] = useState('Mes');
  const [selectedPeriodo, setSelectedPeriodo] = useState('Julio');

  // Modal for Edit Target
  const [editModal, setEditModal] = useState(null); // { kpi: {}, target: {} }
  const [isSaving, setIsSaving] = useState(false);

  // Copy Config Modal
  const [copyModal, setCopyModal] = useState(false);
  const [copyToYear, setCopyToYear] = useState(new Date().getFullYear());
  const [copyToTipo, setCopyToTipo] = useState('Mes');
  const [copyToPeriodo, setCopyToPeriodo] = useState('Agosto');

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedTipo, selectedPeriodo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, targetRes] = await Promise.all([
        fetch('/api/kpis'),
        fetch(`/api/kpis/targets?anio=${selectedYear}&tipo_periodo=${selectedTipo}&periodo=${selectedPeriodo}`)
      ]);
      const kpiData = await kpiRes.json();
      const targetData = await targetRes.json();
      
      setKpis(kpiData);
      setTargets(targetData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/kpis/targets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpi_id: editModal.kpi.id,
          anio: selectedYear,
          tipo_periodo: selectedTipo,
          periodo: selectedPeriodo,
          meta: Number(editModal.target.meta),
          disparador: Number(editModal.target.disparador),
          comparador: editModal.kpi.comparador
        })
      });
      if (res.ok) {
        const updatedTarget = await res.json();
        setTargets(prev => {
          const exists = prev.find(t => t.id === updatedTarget.id);
          if (exists) {
            return prev.map(t => t.id === updatedTarget.id ? updatedTarget : t);
          }
          return [...prev, updatedTarget];
        });
        setEditModal(null);
      }
    } catch (err) {
      alert('Error guardando configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/kpis/targets/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_anio: selectedYear,
          from_tipo: selectedTipo,
          from_periodo: selectedPeriodo,
          to_anio: copyToYear,
          to_tipo: copyToTipo,
          to_periodo: copyToPeriodo
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`¡Copiados ${data.copiedCount} indicadores exitosamente!`);
        setCopyModal(false);
        // Si copió a la vista actual, recargamos
        if (selectedYear === copyToYear && selectedTipo === copyToTipo && selectedPeriodo === copyToPeriodo) {
          fetchData();
        }
      } else {
        alert(data.message || 'Error al copiar');
      }
    } catch (err) {
      alert('Error de red');
    } finally {
      setIsSaving(false);
    }
  };

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const semanas = Array.from({length: 53}, (_, i) => (i + 1).toString());

  const periodosDisponibles = selectedTipo === 'Mes' ? meses : semanas;
  const copyPeriodosDisponibles = copyToTipo === 'Mes' ? meses : semanas;

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

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1>⚙️ Metas Dinámicas</h1>
                <p style={{ color: 'var(--text-muted)' }}>Configura metas y disparadores por Semana o Mes.</p>
              </div>
              
              {/* Filtros Globales */}
              <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Año</label>
                  <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Tipo Período</label>
                  <select value={selectedTipo} onChange={e => {
                    setSelectedTipo(e.target.value);
                    setSelectedPeriodo(e.target.value === 'Mes' ? 'Julio' : '1');
                  }}>
                    <option value="Mes">Mes</option>
                    <option value="Semana">Semana</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Período</label>
                  <select value={selectedPeriodo} onChange={e => setSelectedPeriodo(e.target.value)}>
                    {periodosDisponibles.map(p => <option key={p} value={p}>{selectedTipo === 'Semana' ? `Semana ${p}` : p}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary" style={{ padding: '0.75rem 1rem' }} onClick={() => setCopyModal(true)}>
                  📋 Copiar
                </button>
              </div>
            </header>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
                <h3 style={{ margin: 0 }}>Tabla de Configuración: {selectedTipo} {selectedPeriodo} ({selectedYear})</h3>
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
                        <th>KPI</th>
                        <th>Comp.</th>
                        <th>Meta 🟢</th>
                        <th>Disp. 🔵</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpis.map(k => {
                        const tgt = targets.find(t => t.kpi_id === k.id);
                        return (
                          <tr key={k.id}>
                            <td><span className="badge" style={{ background: '#e2e8f0' }}>{k.cd}</span></td>
                            <td>{k.responsable}</td>
                            <td style={{ fontWeight: 600 }}>{k.nombre}</td>
                            
                            {tgt ? (
                              <>
                                <td style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{k.comparador}</td>
                                <td style={{ color: '#10b981', fontWeight: 'bold' }}>{tgt.meta}</td>
                                <td style={{ color: '#3b82f6', fontWeight: 'bold' }}>{tgt.disparador}</td>
                                <td><span className="badge badge-success">Configurado</span></td>
                              </>
                            ) : (
                              <>
                                <td style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>{k.comparador}</td>
                                <td style={{ color: 'var(--text-muted)' }}>-</td>
                                <td style={{ color: 'var(--text-muted)' }}>-</td>
                                <td><span className="badge badge-danger">Sin Configurar</span></td>
                              </>
                            )}

                            <td>
                              <button className="btn" style={{ padding: '0.4rem 0.8rem', background: 'var(--surface-border)' }} onClick={() => setEditModal({
                                kpi: k,
                                target: tgt || { meta: 0, disparador: 0 }
                              })}>
                                ✏️ Editar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Modal Editar */}
            {editModal && (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
                  <h3>✏️ Configurar: {selectedTipo} {selectedPeriodo}</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{editModal.kpi.nombre} ({editModal.kpi.cd})</p>
                  
                  <form onSubmit={handleEdit}>
                    <div className="form-group">
                      <label>Meta (Verde 🟢) - {editModal.kpi.comparador}</label>
                      <input type="number" step="any" required value={editModal.target.meta} onChange={e => setEditModal({...editModal, target: {...editModal.target, meta: e.target.value}})} />
                    </div>
                    <div className="form-group">
                      <label>Disparador (Azul 🔵)</label>
                      <input type="number" step="any" required value={editModal.target.disparador} onChange={e => setEditModal({...editModal, target: {...editModal.target, disparador: e.target.value}})} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn" onClick={() => setEditModal(null)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>Guardar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Copiar */}
            {copyModal && (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
                  <h3>📋 Copiar Configuración</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Vas a copiar las metas de <strong>{selectedTipo} {selectedPeriodo} {selectedYear}</strong> hacia otro período.
                  </p>
                  
                  <form onSubmit={handleCopy}>
                    <div className="form-group">
                      <label>Copiar HACIA (Año)</label>
                      <select value={copyToYear} onChange={e => setCopyToYear(Number(e.target.value))}>
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                        <option value={2027}>2027</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Copiar HACIA (Tipo)</label>
                      <select value={copyToTipo} onChange={e => {
                        setCopyToTipo(e.target.value);
                        setCopyToPeriodo(e.target.value === 'Mes' ? 'Julio' : '1');
                      }}>
                        <option value="Mes">Mes</option>
                        <option value="Semana">Semana</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Copiar HACIA (Período)</label>
                      <select value={copyToPeriodo} onChange={e => setCopyToPeriodo(e.target.value)}>
                        {copyPeriodosDisponibles.map(p => <option key={p} value={p}>{copyToTipo === 'Semana' ? `Semana ${p}` : p}</option>)}
                      </select>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn" onClick={() => setCopyModal(false)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>Ejecutar Copia</button>
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
