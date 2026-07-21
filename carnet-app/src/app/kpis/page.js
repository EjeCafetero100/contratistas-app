"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileSelector from '@/components/ProfileSelector';
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// Helper to get ISO weeks for a given month/year
function getWeeksInMonth(year, month) {
  const weeks = new Set();
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    weeks.add(weekNo);
    date.setDate(date.getDate() + 1);
  }
  return Array.from(weeks).sort((a, b) => a - b);
}

export default function KPIDashboard() {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'matrix'
  const [kpis, setKpis] = useState([]);
  const [targets, setTargets] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCD, setSelectedCD] = useState('Todos');
  const [selectedResp, setSelectedResp] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);

  // Modals state
  const [editModal, setEditModal] = useState(null); // { kpi, semana }
  const [historyModal, setHistoryModal] = useState(null);

  // Form State
  const [formValor, setFormValor] = useState('');
  const [formObs, setFormObs] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const meses = [
    { num: 1, name: 'Enero' }, { num: 2, name: 'Febrero' }, { num: 3, name: 'Marzo' },
    { num: 4, name: 'Abril' }, { num: 5, name: 'Mayo' }, { num: 6, name: 'Junio' },
    { num: 7, name: 'Julio' }, { num: 8, name: 'Agosto' }, { num: 9, name: 'Septiembre' },
    { num: 10, name: 'Octubre' }, { num: 11, name: 'Noviembre' }, { num: 12, name: 'Diciembre' }
  ];

  const weeksOfSelectedMonth = getWeeksInMonth(selectedYear, selectedMes);

  useEffect(() => {
    fetchData();
  }, [selectedYear, selectedMes]);

  async function fetchData() {
    setLoading(true);
    try {
      const [kpiDefs, targetsData, kpiData] = await Promise.all([
        fetch('/api/kpis').then(r => r.json()),
        fetch(`/api/kpis/targets?anio=${selectedYear}`).then(r => r.json()),
        fetch(`/api/kpis/data?anio=${selectedYear}`).then(r => r.json())
      ]);

      setKpis(kpiDefs);
      setTargets(targetsData);
      setData(kpiData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const openEditModal = (kpi, semana) => {
    setEditModal({ kpi, semana });
    const existing = data.find(d => d.kpi_id === kpi.id && d.anio === selectedYear && d.semana === semana);
    setFormValor(existing ? existing.valor : '');
    setFormObs(existing ? existing.observacion || '' : '');
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
    const existing = data.find(d => d.kpi_id === editModal.kpi.id && d.anio === selectedYear && d.semana === editModal.semana);
    
    if (existing && existing.valor === Number(formValor) && existing.observacion === formObs) {
      setEditModal(null);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/kpis/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpi_id: editModal.kpi.id,
          anio: selectedYear,
          mes: selectedMes,
          semana: editModal.semana,
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

  const getCellColor = (val, meta, disp, comp) => {
    if (val === null || val === undefined || meta === undefined) return '';
    let meetsMeta = false;
    let breaksDisparador = false;
    if (comp === '>' || comp === '>=') {
      meetsMeta = comp === '>=' ? val >= meta : val > meta;
      breaksDisparador = comp === '>=' ? val < disp : val <= disp;
    } else {
      meetsMeta = comp === '<=' ? val <= meta : val < meta;
      breaksDisparador = comp === '<=' ? val > disp : val >= disp;
    }
    if (meetsMeta) return '#10b981';
    if (breaksDisparador) return '#3b82f6';
    return '#ef4444';
  };

  const getStateText = (color) => {
    if (color === '#10b981') return '🟢 Cumple';
    if (color === '#3b82f6') return '🔵 Crítico';
    if (color === '#ef4444') return '🔴 Atención';
    return '⚪ Sin Dato';
  };

  return (
    <ProfileSelector>
      {(profile) => {
        const currentCDFilter = profile.role === 'admin' ? selectedCD : profile.cd;

        let filteredKpis = kpis;
        if (currentCDFilter !== 'Todos') filteredKpis = filteredKpis.filter(k => k.cd === currentCDFilter);
        if (selectedResp !== 'Todos') filteredKpis = filteredKpis.filter(k => k.responsable === selectedResp);

        const responsibles = [...new Set(kpis.map(k => k.responsable))];
        const mesName = meses.find(m => m.num === selectedMes).name;

        // Render Matrix
        const renderMatrix = () => (
          <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="matrix-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead style={{ background: '#0f172a', color: 'white' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', minWidth: '200px' }}>KPI</th>
                  <th style={{ padding: '0.75rem' }}>UM</th>
                  <th style={{ padding: '0.75rem', background: '#1e293b' }}>Disp Sem</th>
                  <th style={{ padding: '0.75rem', background: '#1e293b' }}>Meta Sem</th>
                  {weeksOfSelectedMonth.map(w => (
                    <th key={w} style={{ padding: '0.75rem', minWidth: '60px' }}>sem {w}</th>
                  ))}
                  <th style={{ padding: '0.75rem' }}>Gráfico</th>
                  <th style={{ padding: '0.75rem' }}>MTD</th>
                </tr>
              </thead>
              <tbody>
                {filteredKpis.map(kpi => {
                  const tgtSemRep = targets.find(t => t.kpi_id === kpi.id && t.tipo_periodo === 'Semana' && weeksOfSelectedMonth.includes(Number(t.periodo))) || {};
                  
                  const weekData = [];
                  const chartData = [];
                  let sum = 0; let count = 0;

                  weeksOfSelectedMonth.forEach(w => {
                    const rec = data.find(d => d.kpi_id === kpi.id && d.anio === selectedYear && d.semana === w);
                    const tgtSem = targets.find(t => t.kpi_id === kpi.id && t.tipo_periodo === 'Semana' && t.periodo === String(w)) || tgtSemRep;
                    const val = rec ? Number(rec.valor) : null;
                    
                    if (val !== null) {
                      sum += val; count++; chartData.push({ name: `s${w}`, val });
                    }
                    const color = val !== null && tgtSem.meta !== undefined ? getCellColor(val, tgtSem.meta, tgtSem.disparador, kpi.comparador) : '';
                    weekData.push({ semana: w, valor: val, color });
                  });

                  const mtdVal = count > 0 ? (kpi.agregacion === 'PROMEDIO' ? sum / count : sum) : null;
                  const mtdColor = mtdVal !== null && tgtSemRep.meta !== undefined ? getCellColor(mtdVal, tgtSemRep.meta, tgtSemRep.disparador, kpi.comparador) : '';

                  return (
                    <tr key={kpi.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                      <td style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpi.cd} - {kpi.responsable}</div>
                        {kpi.nombre}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{kpi.unidad}</td>
                      <td style={{ padding: '0.75rem', background: '#f8fafc', color: '#3b82f6' }}>{tgtSemRep.disparador ?? '-'}</td>
                      <td style={{ padding: '0.75rem', background: '#f8fafc', color: '#10b981' }}>{tgtSemRep.meta ?? '-'}</td>
                      {weekData.map(wd => (
                        <td key={wd.semana} onClick={() => openEditModal(kpi, wd.semana)}
                            style={{ padding: '0.75rem', cursor: 'pointer', color: wd.color || 'inherit', fontWeight: wd.color ? 'bold' : 'normal' }}
                            className="editable-cell" title="Clic para editar">
                          {wd.valor !== null ? (kpi.unidad === '%' ? wd.valor + '%' : wd.valor) : '-'}
                        </td>
                      ))}
                      <td style={{ padding: '0.75rem', width: '80px' }}>
                        {chartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={30}><LineChart data={chartData}><Line type="monotone" dataKey="val" stroke="#64748b" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
                        ) : '-'}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: mtdColor || 'inherit' }}>
                        {mtdVal !== null ? (kpi.unidad === '%' ? mtdVal.toFixed(1) + '%' : mtdVal.toFixed(1)) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

        // Render Cards
        const renderCards = () => (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {filteredKpis.map(kpi => {
              const anyWeeklyTgt = targets.find(t => t.kpi_id === kpi.id && t.tipo_periodo === 'Semana');
              const activeTgt = anyWeeklyTgt;
              
              let sum = 0; let count = 0;
              const chartData = [];
              weeksOfSelectedMonth.forEach(w => {
                const rec = data.find(d => d.kpi_id === kpi.id && d.anio === selectedYear && d.semana === w);
                if (rec) {
                  sum += Number(rec.valor); count++;
                  chartData.push({ name: `S${w}`, val: Number(rec.valor) });
                }
              });

              const mtdVal = count > 0 ? (kpi.agregacion === 'PROMEDIO' ? sum / count : sum) : null;
              const mtdColor = mtdVal !== null && activeTgt?.meta !== undefined ? getCellColor(mtdVal, activeTgt.meta, activeTgt.disparador, kpi.comparador) : '#94a3b8';
              
              return (
                <div key={kpi.id} className="kpi-card glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', position: 'relative' }}>
                  
                  {/* Menu */}
                  <div className="kpi-menu-container" style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 50 }}>
                    <button className="kpi-menu-trigger" style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      ⋮
                    </button>
                    <div className="kpi-dropdown glass-panel">
                      {profile.role !== 'admin' && (
                        <div style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ingresar Dato de Semana:</div>
                      )}
                      {profile.role !== 'admin' && weeksOfSelectedMonth.map(w => (
                        <button key={w} onClick={() => openEditModal(kpi, w)}>Semana {w}</button>
                      ))}
                      <hr style={{ margin: '0.5rem 0', borderColor: 'var(--surface-border)' }} />
                      <button onClick={() => loadHistory(kpi)}>📊 Ver Historial de Cambios</button>
                    </div>
                  </div>

                  {/* Header */}
                  <div style={{ paddingRight: '2rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {kpi.cd} • {kpi.responsable}
                    </span>
                    <h3 style={{ margin: '0.5rem 0 1rem 0' }}>{kpi.nombre}</h3>
                  </div>

                  {/* Big Number MTD */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '3.5rem', fontWeight: '900', color: mtdColor, lineHeight: 1 }}>
                      {mtdVal !== null ? (kpi.unidad === '%' ? mtdVal.toFixed(1) : mtdVal.toFixed(1)) : '-'}
                    </span>
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{kpi.unidad}</span>
                  </div>
                  
                  {/* Status Text */}
                  <div style={{ fontWeight: '600', color: mtdColor, marginTop: '0.5rem', fontSize: '1.1rem' }}>
                    {getStateText(mtdColor)}
                  </div>

                  {/* Target Info */}
                  <div style={{ background: 'var(--surface-bg)', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', border: '1px solid var(--surface-border)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Límites Semanales
                    </h4>
                    {activeTgt ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                        <div><span style={{ color: '#10b981' }}>🟢 Meta:</span> <strong>{kpi.comparador} {activeTgt.meta}</strong></div>
                        <div><span style={{ color: '#3b82f6' }}>🔵 Disparador:</span> <strong>{activeTgt.disparador}</strong></div>
                      </div>
                    ) : (
                      <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>⚠️ Falta Configurar Metas</span>
                    )}
                  </div>

                  {/* Tendencia Semanal (Detalle de Semanas) */}
                  <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Desglose Semanal (Clic para ingresar)</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      {weeksOfSelectedMonth.map(w => {
                        const rec = data.find(d => d.kpi_id === kpi.id && d.anio === selectedYear && d.semana === w);
                        // Default to any weekly target if specific weekly target is not found
                        const tgtSemRep = targets.find(t => t.kpi_id === kpi.id && t.tipo_periodo === 'Semana' && weeksOfSelectedMonth.includes(Number(t.periodo))) || anyWeeklyTgt || {};
                        const tgtSem = targets.find(t => t.kpi_id === kpi.id && t.tipo_periodo === 'Semana' && t.periodo === String(w)) || tgtSemRep;
                        
                        const val = rec ? Number(rec.valor) : null;
                        const color = val !== null && tgtSem.meta !== undefined ? getCellColor(val, tgtSem.meta, tgtSem.disparador, kpi.comparador) : '';
                        
                        return (
                          <div 
                            key={w} 
                            onClick={() => openEditModal(kpi, w)}
                            className="weekly-btn"
                            title={`Registrar Semana ${w}`}
                            style={{ 
                              display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1,
                              background: 'var(--surface-bg)', padding: '0.5rem 0', borderRadius: '6px',
                              border: '1px solid var(--surface-border)', cursor: 'pointer'
                            }}
                          >
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>S{w}</span>
                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: color || 'var(--text-muted)' }}>
                              {val !== null ? val : <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>➕</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        );

        return (
          <div className="container" style={{ maxWidth: '1400px', position: 'relative' }}>
            
            {/* Header & Toggle */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1>📊 Tablero de Gestión</h1>
                <p style={{ color: 'var(--text-muted)' }}>Análisis del mes de {mesName} {selectedYear}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                
                {/* Vista Toggle */}
                <div style={{ display: 'flex', background: 'var(--surface-bg)', border: '1px solid var(--surface-border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setViewMode('cards')}
                    style={{ padding: '0.5rem 1rem', border: 'none', background: viewMode === 'cards' ? 'var(--primary)' : 'transparent', color: viewMode === 'cards' ? 'white' : 'var(--text)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    🗂️ Tarjetas
                  </button>
                  <button 
                    onClick={() => setViewMode('matrix')}
                    style={{ padding: '0.5rem 1rem', border: 'none', background: viewMode === 'matrix' ? 'var(--primary)' : 'transparent', color: viewMode === 'matrix' ? 'white' : 'var(--text)', cursor: 'pointer', fontWeight: 600 }}
                  >
                    📊 Matriz
                  </button>
                </div>

                {profile.role === 'admin' && (
                  <Link href="/kpis/admin" className="btn btn-primary">
                    ⚙️ Administrar Configuración
                  </Link>
                )}
              </div>
            </header>

            {/* Filters */}
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
                <label>📆 Mes</label>
                <select value={selectedMes} onChange={e => setSelectedMes(Number(e.target.value))}>
                  {meses.map(m => <option key={m.num} value={m.num}>{m.name}</option>)}
                </select>
              </div>
            </div>

            {loading ? <p>Cargando datos...</p> : filteredKpis.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <h3>No hay KPIs para mostrar</h3>
              </div>
            ) : (
              viewMode === 'matrix' ? renderMatrix() : renderCards()
            )}

            {/* Edit Data Modal */}
            {editModal && (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '400px' }}>
                  <h3>✏️ Ingreso Rápido</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    {editModal.kpi.nombre} <br/> Semana {editModal.semana} ({mesName} {selectedYear})
                  </p>
                  
                  <form onSubmit={(e) => handleSaveData(e, profile)}>
                    <div className="form-group">
                      <label>Valor obtenido ({editModal.kpi.unidad})</label>
                      <input type="number" step="any" required value={formValor} onChange={e => setFormValor(e.target.value)} autoFocus />
                    </div>
                    <div className="form-group">
                      <label>Observaciones (Opcional)</label>
                      <textarea rows="2" value={formObs} onChange={e => setFormObs(e.target.value)}></textarea>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn" onClick={() => setEditModal(null)}>Cancelar</button>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : '💾 Guardar'}
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

            <style jsx>{`
              .editable-cell:hover {
                background: #e2e8f0;
                outline: 2px solid var(--primary);
                border-radius: 4px;
              }
            `}</style>
          </div>
        );
      }}
    </ProfileSelector>
  );
}
