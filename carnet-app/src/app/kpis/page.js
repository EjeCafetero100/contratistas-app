"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileSelector from '@/components/ProfileSelector';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function KPIDashboard() {
  const [kpis, setKpis] = useState([]);
  const [targets, setTargets] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCD, setSelectedCD] = useState('Todos');
  const [selectedResp, setSelectedResp] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTipo, setSelectedTipo] = useState('Mes');
  const [selectedPeriodo, setSelectedPeriodo] = useState('Julio');

  // Modals state
  const [editModal, setEditModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);

  // Form State
  const [formValor, setFormValor] = useState('');
  const [formSemana, setFormSemana] = useState(1);
  const [formObs, setFormObs] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mesesNum = { 'Enero':1, 'Febrero':2, 'Marzo':3, 'Abril':4, 'Mayo':5, 'Junio':6, 'Julio':7, 'Agosto':8, 'Septiembre':9, 'Octubre':10, 'Noviembre':11, 'Diciembre':12 };
  const semanas = Array.from({length: 53}, (_, i) => (i + 1).toString());
  const periodosDisponibles = selectedTipo === 'Mes' ? meses : semanas;

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedTipo, selectedPeriodo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // If Month, we need data for all weeks in that month. If Week, we need data just for that week.
      let dataUrl = '/api/kpis/data';
      if (selectedTipo === 'Mes') {
        dataUrl += `?anio=${selectedYear}&mes=${mesesNum[selectedPeriodo]}`;
      } else {
        // Technically our GET /api/kpis/data doesn't filter by semana yet, so we fetch all and filter in JS.
        // Actually, let's just fetch all data and filter in JS to keep it simple, or update the endpoint.
        dataUrl += `?anio=${selectedYear}`;
      }

      const [kpiDefs, targetData, kpiData] = await Promise.all([
        fetch('/api/kpis').then(r => r.json()),
        fetch(`/api/kpis/targets?anio=${selectedYear}&tipo_periodo=${selectedTipo}&periodo=${selectedPeriodo}`).then(r => r.json()),
        fetch(dataUrl).then(r => r.json())
      ]);

      setKpis(kpiDefs);
      setTargets(targetData);
      setData(kpiData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (kpi) => {
    setEditModal({ kpi });
    if (selectedTipo === 'Semana') {
      setFormSemana(Number(selectedPeriodo));
      const existing = data.find(d => d.kpi_id === kpi.id && d.anio === selectedYear && d.semana === Number(selectedPeriodo));
      setFormValor(existing ? existing.valor : '');
    } else {
      setFormSemana(1);
      setFormValor('');
    }
    setFormObs('');
  };

  const loadHistory = async (kpi) => {
    try {
      const res = await fetch(`/api/kpis/history?kpi_id=${kpi.id}&anio=${selectedYear}`);
      const logs = await res.json();
      setHistoryModal({ kpi, logs });
    } catch (e) {
      alert('Error cargando historial');
    }
  };

  const handleSaveData = async (e, profile) => {
    e.preventDefault();
    
    // El mes a usar depende del modal. Si es una semana específica, requerimos adivinar el mes o forzarlo.
    // Para simplificar: le pedimos el mes en el formulario también, o usamos el mes actual de la vista si es Mes.
    let targetMes = selectedTipo === 'Mes' ? mesesNum[selectedPeriodo] : new Date().getMonth() + 1;

    const existing = data.find(d => d.kpi_id === editModal.kpi.id && d.anio === selectedYear && d.semana === Number(formSemana));
    
    if (existing) {
      const confirm = window.confirm(`Ya existe un registro de ${existing.valor} para la Semana ${formSemana}. ¿Desea reemplazar este valor?`);
      if (!confirm) return;
      targetMes = existing.mes; // Keep original month if editing
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/kpis/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpi_id: editModal.kpi.id,
          anio: selectedYear,
          mes: targetMes,
          semana: Number(formSemana),
          valor: Number(formValor),
          observaciones: formObs,
          usuario: profile.role === 'admin' ? 'Administrador' : `Operador ${profile.cd}`
        })
      });
      if (res.ok) {
        fetchData();
        setEditModal(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProfileSelector>
      {(profile) => {
        const currentCDFilter = profile.role === 'admin' ? selectedCD : profile.cd;

        let filteredKpis = kpis;
        if (currentCDFilter !== 'Todos') filteredKpis = filteredKpis.filter(k => k.cd === currentCDFilter);
        if (selectedResp !== 'Todos') filteredKpis = filteredKpis.filter(k => k.responsable === selectedResp);

        const dashboardData = filteredKpis.map(kpi => {
          let kpiDataPeriod = [];
          if (selectedTipo === 'Mes') {
            kpiDataPeriod = data.filter(d => d.kpi_id === kpi.id && d.anio === selectedYear && d.mes === mesesNum[selectedPeriodo]);
          } else {
            kpiDataPeriod = data.filter(d => d.kpi_id === kpi.id && d.anio === selectedYear && d.semana === Number(selectedPeriodo));
          }

          let mtd = 0;
          if (kpiDataPeriod.length > 0) {
            const sum = kpiDataPeriod.reduce((acc, curr) => acc + Number(curr.valor), 0);
            mtd = kpi.agregacion === 'PROMEDIO' ? sum / kpiDataPeriod.length : sum;
          }

          const target = targets.find(t => t.kpi_id === kpi.id);
          
          let color = '#94a3b8'; // Gris por defecto si no hay meta
          let icon = '⚪';
          let state = 'Sin Meta';

          if (target) {
            const val = Number(mtd);
            const comp = target.comparador;
            const meta = Number(target.meta);
            const disp = Number(target.disparador);

            let meetsMeta = false;
            let breaksDisparador = false;

            if (comp === '>' || comp === '>=') {
              meetsMeta = comp === '>=' ? val >= meta : val > meta;
              breaksDisparador = comp === '>=' ? val < disp : val <= disp;
            } else {
              meetsMeta = comp === '<=' ? val <= meta : val < meta;
              breaksDisparador = comp === '<=' ? val > disp : val >= disp;
            }

            color = '#ef4444'; // Rojo (In between)
            icon = '🔴';
            state = 'Atención';

            if (meetsMeta) {
              color = '#10b981'; // Verde
              icon = '🟢';
              state = 'Cumple';
            } else if (breaksDisparador) {
              color = '#3b82f6'; // Azul (Crítico)
              icon = '🔵';
              state = 'Crítico';
            } 
          }

          return { ...kpi, mtd, color, icon, state, target };
        });

        const responsibles = [...new Set(kpis.map(k => k.responsable))];

        return (
          <div className="container" style={{ maxWidth: '1200px', position: 'relative' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1>📊 Panel de Indicadores (KPIs)</h1>
                <p style={{ color: 'var(--text-muted)' }}>Análisis de {selectedTipo}: {selectedPeriodo} del {selectedYear}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {profile.role === 'admin' && (
                  <Link href="/kpis/admin" className="btn btn-primary">
                    ⚙️ Administrar KPIs
                  </Link>
                )}
              </div>
            </header>

            <div className="glass-panel" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {profile.role === 'admin' && (
                <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                  <label>📍 CD</label>
                  <select value={selectedCD} onChange={e => setSelectedCD(e.target.value)}>
                    <option value="Todos">Todos</option>
                    <option value="Pereira">Pereira</option>
                    <option value="Armenia">Armenia</option>
                    <option value="Barrancabermeja">Barrancabermeja</option>
                  </select>
                </div>
              )}
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '100px' }}>
                <label>👤 Responsable</label>
                <select value={selectedResp} onChange={e => setSelectedResp(e.target.value)}>
                  <option value="Todos">Todos</option>
                  {responsibles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '100px' }}>
                <label>📅 Año</label>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '120px' }}>
                <label>📊 Tipo de Período</label>
                <select value={selectedTipo} onChange={e => {
                  setSelectedTipo(e.target.value);
                  setSelectedPeriodo(e.target.value === 'Mes' ? 'Julio' : '1');
                }}>
                  <option value="Mes">Mes</option>
                  <option value="Semana">Semana</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '120px' }}>
                <label>📆 Período</label>
                <select value={selectedPeriodo} onChange={e => setSelectedPeriodo(e.target.value)}>
                  {periodosDisponibles.map(p => <option key={p} value={p}>{selectedTipo === 'Semana' ? `Semana ${p}` : p}</option>)}
                </select>
              </div>
            </div>

            {loading ? <p>Cargando KPIs...</p> : dashboardData.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <h3>No hay KPIs configurados</h3>
                <p style={{ color: 'var(--text-muted)' }}>Ajusta los filtros o pide al Administrador que cree un nuevo indicador.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {dashboardData.map(kpi => (
                  <div key={kpi.id} className="kpi-card glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', position: 'relative' }}>
                    
                    {/* Hover Menu (CSS based) */}
                    <div className="kpi-menu-container" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 50 }}>
                      <button className="kpi-menu-trigger" style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        ⋮
                      </button>
                      <div className="kpi-dropdown glass-panel">
                        {profile.role !== 'admin' && (
                          <button onClick={() => openEditModal(kpi)}>➕ Registrar Dato</button>
                        )}
                        <button onClick={() => loadHistory(kpi)}>📊 Ver Historial de Datos</button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '2rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>
                          {kpi.cd} • {kpi.responsable}
                        </span>
                        <h3 style={{ margin: '0.5rem 0', minHeight: '3rem' }}>{kpi.nombre}</h3>
                        
                        {kpi.target ? (
                           <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                             Meta: {kpi.target.comparador} {kpi.target.meta} {kpi.unidad}
                           </p>
                        ) : (
                           <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger)' }}>
                             Falta Configurar Meta
                           </p>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '3rem', fontWeight: '900', color: kpi.color, lineHeight: 1 }}>
                        {kpi.mtd.toFixed(1)}
                      </span>
                      <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{kpi.unidad}</span>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{kpi.icon}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: kpi.color }}>{kpi.state}</span>
                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* Modal: Editar/Registrar Dato */}
            {editModal && (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
                  <h3>✏️ Registrar Dato</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{editModal.kpi.nombre} ({editModal.kpi.cd})</p>
                  
                  <form onSubmit={(e) => handleSaveData(e, profile)}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Ingreso para: {selectedTipo} {selectedPeriodo}</label>
                      </div>
                      
                      {selectedTipo === 'Mes' && (
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                          <label>Semana Específica</label>
                          <select required value={formSemana} onChange={e => {
                            const w = Number(e.target.value);
                            setFormSemana(w);
                            // Target month lookup based on period name could be complex here. 
                            // Simplified for the UI since they only enter per week anyway
                            const existing = data.find(d => d.kpi_id === editModal.kpi.id && d.anio === selectedYear && d.mes === mesesNum[selectedPeriodo] && d.semana === w);
                            setFormValor(existing ? existing.valor : '');
                          }}>
                            {[1,2,3,4,5].map(w => <option key={w} value={w}>Semana {w}</option>)}
                          </select>
                        </div>
                      )}

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Valor obtenido ({editModal.kpi.unidad})</label>
                        <input type="number" step="any" required value={formValor} onChange={e => setFormValor(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Observaciones (Opcional)</label>
                        <textarea rows="3" value={formObs} onChange={e => setFormObs(e.target.value)} placeholder="Motivo de la desviación, detalles..."></textarea>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn" onClick={() => setEditModal(null)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : '💾 Guardar Dato'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Historial */}
            {historyModal && (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>📊 Historial de Trazabilidad</h3>
                    <button className="btn" onClick={() => setHistoryModal(null)}>Cerrar</button>
                  </div>
                  <p style={{ color: 'var(--text-muted)' }}>{historyModal.kpi.nombre}</p>
                  
                  {historyModal.logs.length === 0 ? (
                    <p>No hay registros de historial para este año.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '0.5rem' }}>Fecha</th>
                          <th style={{ padding: '0.5rem' }}>Semana</th>
                          <th style={{ padding: '0.5rem' }}>Usuario</th>
                          <th style={{ padding: '0.5rem' }}>Anterior</th>
                          <th style={{ padding: '0.5rem' }}>Nuevo</th>
                          <th style={{ padding: '0.5rem' }}>Observación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyModal.logs.map(log => (
                          <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{new Date(log.created_at).toLocaleString()}</td>
                            <td style={{ padding: '0.5rem' }}>{log.semana}</td>
                            <td style={{ padding: '0.5rem' }}>{log.usuario}</td>
                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{log.valor_anterior ?? '-'}</td>
                            <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{log.valor_nuevo}</td>
                            <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>{log.observacion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

          </div>
        );
      }}
    </ProfileSelector>
  );
}
