"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileSelector from '@/components/ProfileSelector';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

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
  // Sometimes Dec 31 falls in week 1 of next year, filter it if we want, but it's okay.
  return Array.from(weeks).sort((a, b) => a - b);
}

export default function KPIDashboard() {
  const [kpis, setKpis] = useState([]);
  const [targets, setTargets] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCD, setSelectedCD] = useState('Todos');
  const [selectedResp, setSelectedResp] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1); // 1-12

  // Modals state
  const [editModal, setEditModal] = useState(null); // { kpi, semana }

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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch targets for Month and the Weeks of this month
      const mesName = meses.find(m => m.num === selectedMes).name;
      
      const [kpiDefs, targetsData, kpiData] = await Promise.all([
        fetch('/api/kpis').then(r => r.json()),
        // In a real app we'd fetch all targets and filter, or use a better query.
        // We'll fetch ALL targets for this year and filter in JS to avoid N+1 fetches.
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
  };

  const openEditModal = (kpi, semana) => {
    setEditModal({ kpi, semana });
    const existing = data.find(d => d.kpi_id === kpi.id && d.anio === selectedYear && d.semana === semana);
    setFormValor(existing ? existing.valor : '');
    setFormObs(existing ? existing.observacion || '' : '');
  };

  const handleSaveData = async (e, profile) => {
    e.preventDefault();
    const existing = data.find(d => d.kpi_id === editModal.kpi.id && d.anio === selectedYear && d.semana === editModal.semana);
    
    if (existing && existing.valor === Number(formValor) && existing.observacion === formObs) {
      setEditModal(null); // No changes
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
    if (val === null || val === undefined || meta === undefined) return ''; // no color
    let meetsMeta = false;
    let breaksDisparador = false;
    if (comp === '>' || comp === '>=') {
      meetsMeta = comp === '>=' ? val >= meta : val > meta;
      breaksDisparador = comp === '>=' ? val < disp : val <= disp;
    } else {
      meetsMeta = comp === '<=' ? val <= meta : val < meta;
      breaksDisparador = comp === '<=' ? val > disp : val >= disp;
    }
    
    if (meetsMeta) return '#10b981'; // Green
    if (breaksDisparador) return '#3b82f6'; // Blue
    return '#ef4444'; // Red
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

        return (
          <div className="container" style={{ maxWidth: '1400px', position: 'relative' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1>📊 Tablero de Gestión (Matriz)</h1>
                <p style={{ color: 'var(--text-muted)' }}>Análisis del mes de {mesName} {selectedYear}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
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

            {loading ? <p>Cargando matriz...</p> : filteredKpis.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <h3>No hay KPIs para mostrar</h3>
              </div>
            ) : (
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
                      <th style={{ padding: '0.75rem', background: '#1e293b' }}>Meta Men</th>
                      <th style={{ padding: '0.75rem', background: '#1e293b' }}>Disp-Men</th>
                      <th style={{ padding: '0.75rem' }}>MTD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKpis.map(kpi => {
                      // We find the monthly target
                      const tgtMen = targets.find(t => t.kpi_id === kpi.id && t.tipo_periodo === 'Mes' && t.periodo === mesName) || {};
                      
                      // Find first weekly target to display in the header column as representative
                      const tgtSemRep = targets.find(t => t.kpi_id === kpi.id && t.tipo_periodo === 'Semana' && weeksOfSelectedMonth.includes(Number(t.periodo))) || {};

                      const weekData = [];
                      const chartData = [];
                      let sum = 0;
                      let count = 0;

                      weeksOfSelectedMonth.forEach(w => {
                        const rec = data.find(d => d.kpi_id === kpi.id && d.anio === selectedYear && d.semana === w);
                        const tgtSem = targets.find(t => t.kpi_id === kpi.id && t.tipo_periodo === 'Semana' && t.periodo === String(w)) || tgtSemRep;
                        
                        const val = rec ? Number(rec.valor) : null;
                        if (val !== null) {
                          sum += val;
                          count++;
                          chartData.push({ name: `sem ${w}`, val });
                        }

                        let color = '';
                        if (val !== null && tgtSem.meta !== undefined) {
                          color = getCellColor(val, tgtSem.meta, tgtSem.disparador, kpi.comparador);
                        }

                        weekData.push({ semana: w, valor: val, color });
                      });

                      const mtdVal = count > 0 ? (kpi.agregacion === 'PROMEDIO' ? sum / count : sum) : null;
                      let mtdColor = '';
                      if (mtdVal !== null && tgtMen.meta !== undefined) {
                        mtdColor = getCellColor(mtdVal, tgtMen.meta, tgtMen.disparador, kpi.comparador);
                      }

                      return (
                        <tr key={kpi.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                          <td style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{kpi.cd} - {kpi.responsable}</div>
                            {kpi.nombre}
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{kpi.unidad}</td>
                          
                          <td style={{ padding: '0.75rem', background: '#f8fafc', color: '#3b82f6' }}>{tgtSemRep.disparador ?? '-'}</td>
                          <td style={{ padding: '0.75rem', background: '#f8fafc', color: '#10b981' }}>{tgtSemRep.meta ?? '-'}</td>

                          {/* Semanas */}
                          {weekData.map(wd => (
                            <td 
                              key={wd.semana} 
                              onClick={() => openEditModal(kpi, wd.semana)}
                              style={{ 
                                padding: '0.75rem', 
                                cursor: 'pointer',
                                color: wd.color || 'inherit',
                                fontWeight: wd.color ? 'bold' : 'normal'
                              }}
                              className="editable-cell"
                              title="Clic para editar"
                            >
                              {wd.valor !== null ? (kpi.unidad === '%' ? wd.valor + '%' : wd.valor) : '-'}
                            </td>
                          ))}

                          {/* Sparkline */}
                          <td style={{ padding: '0.75rem', width: '80px' }}>
                            {chartData.length > 0 ? (
                              <ResponsiveContainer width="100%" height={30}>
                                <LineChart data={chartData}>
                                  <Line type="monotone" dataKey="val" stroke="#64748b" strokeWidth={2} dot={false} />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : '-'}
                          </td>

                          <td style={{ padding: '0.75rem', background: '#f8fafc', color: '#10b981' }}>{tgtMen.meta ?? '-'}</td>
                          <td style={{ padding: '0.75rem', background: '#f8fafc', color: '#3b82f6' }}>{tgtMen.disparador ?? '-'}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 'bold', color: mtdColor || 'inherit' }}>
                            {mtdVal !== null ? (kpi.unidad === '%' ? mtdVal.toFixed(1) + '%' : mtdVal.toFixed(1)) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
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
