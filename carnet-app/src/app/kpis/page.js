"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfileSelector from '@/components/ProfileSelector';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

export default function KPIDashboard() {
  const [kpis, setKpis] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCD, setSelectedCD] = useState('Todos');
  const [selectedResp, setSelectedResp] = useState('Todos');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Modals state
  const [editModal, setEditModal] = useState(null); // { kpi: {}, existingData: {}, weekToEdit: number }
  const [historyModal, setHistoryModal] = useState(null); // { kpi: {}, logs: [] }
  const [expandedChart, setExpandedChart] = useState(null); // { kpi: {} }

  // Form State
  const [formValor, setFormValor] = useState('');
  const [formSemana, setFormSemana] = useState(1);
  const [formObs, setFormObs] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/kpis').then(r => r.json()),
      fetch('/api/kpis/data').then(r => r.json())
    ]).then(([kpiDefs, kpiData]) => {
      setKpis(kpiDefs);
      setData(kpiData);
      setLoading(false);
    });
  }, []);

  const openEditModal = (kpi) => {
    setEditModal({ kpi });
    setFormSemana(1);
    setFormValor('');
    setFormObs('');
  };

  const loadHistory = async (kpi) => {
    try {
      const res = await fetch(`/api/kpis/history?kpi_id=${kpi.id}&anio=${selectedYear}&mes=${selectedMonth}`);
      const logs = await res.json();
      setHistoryModal({ kpi, logs });
    } catch (e) {
      alert('Error cargando historial');
    }
  };

  const handleSaveData = async (e, profile) => {
    e.preventDefault();
    
    // Ver si ya existe
    const existing = data.find(d => d.kpi_id === editModal.kpi.id && d.anio === selectedYear && d.mes === selectedMonth && d.semana === Number(formSemana));
    
    if (existing) {
      const confirm = window.confirm(`Ya existe un registro de ${existing.valor} para la Semana ${formSemana}. ¿Desea reemplazar este valor?`);
      if (!confirm) return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/kpis/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpi_id: editModal.kpi.id,
          anio: selectedYear,
          mes: selectedMonth,
          semana: Number(formSemana),
          valor: Number(formValor),
          observaciones: formObs,
          usuario: profile.role === 'admin' ? 'Administrador' : `Operador ${profile.cd}`
        })
      });
      if (res.ok) {
        const savedData = await res.json();
        setData(prev => {
          const idx = prev.findIndex(d => d.kpi_id === editModal.kpi.id && d.anio === selectedYear && d.mes === selectedMonth && d.semana === Number(formSemana));
          if (idx >= 0) {
            const newData = [...prev];
            newData[idx] = savedData;
            return newData;
          }
          return [...prev, savedData];
        });
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
          const kpiDataThisMonth = data.filter(d => 
            d.kpi_id === kpi.id && d.anio === selectedYear && d.mes === selectedMonth
          );

          let mtd = 0;
          if (kpiDataThisMonth.length > 0) {
            const sum = kpiDataThisMonth.reduce((acc, curr) => acc + Number(curr.valor), 0);
            mtd = kpi.agregacion === 'PROMEDIO' ? sum / kpiDataThisMonth.length : sum;
          }

          let isGood = false;
          let isWarning = false;
          let color = '#ef4444';
          let icon = '🔴';
          
          const meta = Number(kpi.meta_mensual);
          const val = Number(mtd);
          const comp = kpi.comparador;

          if (comp === '>') isGood = val > meta;
          else if (comp === '<') isGood = val < meta;
          else if (comp === '>=') isGood = val >= meta;
          else if (comp === '<=') isGood = val <= meta;

          const diffPct = meta === 0 ? 0 : Math.abs((val - meta) / meta);
          if (!isGood && diffPct <= 0.1) isWarning = true;

          if (isGood) { color = '#10b981'; icon = '🟢'; }
          else if (isWarning) { color = '#f59e0b'; icon = '🟡'; }

          const chartData = [1,2,3,4,5].map(w => {
            const row = kpiDataThisMonth.find(d => d.semana === w);
            return { name: `Sem ${w}`, valor: row ? Number(row.valor) : 0 };
          });

          return { ...kpi, mtd, color, icon, chartData };
        });

        const responsibles = [...new Set(kpis.map(k => k.responsable))];

        return (
          <div className="container" style={{ maxWidth: '1200px', position: 'relative' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1>📊 Panel de Indicadores (KPIs)</h1>
                <p style={{ color: 'var(--text-muted)' }}>Dashboard Corporativo Multi-CD</p>
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
                <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
                  <label>Centro de Distribución</label>
                  <select value={selectedCD} onChange={e => setSelectedCD(e.target.value)}>
                    <option value="Todos">Todos los CD</option>
                    <option value="Pereira">Pereira</option>
                    <option value="Armenia">Armenia</option>
                    <option value="Barrancabermeja">Barrancabermeja</option>
                  </select>
                </div>
              )}
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
                <label>Responsable</label>
                <select value={selectedResp} onChange={e => setSelectedResp(e.target.value)}>
                  <option value="Todos">Todos</option>
                  {responsibles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '100px' }}>
                <label>Año</label>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                <label>Mes</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {loading ? <p>Cargando KPIs...</p> : dashboardData.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <h3>No hay KPIs configurados</h3>
                <p style={{ color: 'var(--text-muted)' }}>Ajusta los filtros o pide al Administrador que cree un nuevo indicador.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {dashboardData.map(kpi => (
                  <div key={kpi.id} className="kpi-card glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', position: 'relative' }}>
                    
                    {/* Hover Menu (CSS based) */}
                    <div className="kpi-menu-container" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                      <button className="kpi-menu-trigger" style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        ⋮
                      </button>
                      <div className="kpi-dropdown glass-panel">
                        {profile.role !== 'admin' && (
                          <button onClick={() => openEditModal(kpi)}>➕ Registrar / Editar Dato</button>
                        )}
                        <button onClick={() => loadHistory(kpi)}>📊 Ver Historial</button>
                        <button onClick={() => setExpandedChart(kpi)}>📈 Ver Gráfico Ampliado</button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '2rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>
                          {kpi.cd} • {kpi.responsable}
                        </span>
                        <h3 style={{ margin: '0.5rem 0' }}>{kpi.nombre}</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Meta mensual: {kpi.comparador} {kpi.meta_mensual} {kpi.unidad}</p>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: kpi.color }}>
                        {kpi.mtd.toFixed(1)}
                      </span>
                      <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{kpi.unidad}</span>
                      <div style={{ marginLeft: 'auto', fontSize: '1.5rem' }}>{kpi.icon}</div>
                    </div>

                    <div style={{ height: '150px', width: '100%', marginTop: 'auto', cursor: 'pointer' }} onClick={() => setExpandedChart(kpi)}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={kpi.chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="valor" stroke={kpi.color} strokeWidth={3} dot={{ r: 4, fill: kpi.color, strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MODALS */}

            {/* Modal: Editar/Registrar */}
            {editModal && (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
                  <h3>✏️ Registrar / Editar Indicador</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{editModal.kpi.nombre} ({editModal.kpi.cd})</p>
                  
                  <form onSubmit={(e) => handleSaveData(e, profile)}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Año</label>
                        <input type="text" disabled value={selectedYear} />
                      </div>
                      <div className="form-group">
                        <label>Mes</label>
                        <input type="text" disabled value={selectedMonth} />
                      </div>
                      <div className="form-group">
                        <label>Semana</label>
                        <select required value={formSemana} onChange={e => {
                          const w = Number(e.target.value);
                          setFormSemana(w);
                          const existing = data.find(d => d.kpi_id === editModal.kpi.id && d.anio === selectedYear && d.mes === selectedMonth && d.semana === w);
                          setFormValor(existing ? existing.valor : '');
                        }}>
                          {[1,2,3,4,5].map(w => <option key={w} value={w}>Semana {w}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
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
                  <p style={{ color: 'var(--text-muted)' }}>{historyModal.kpi.nombre} ({selectedYear}-{selectedMonth})</p>
                  
                  {historyModal.logs.length === 0 ? (
                    <p>No hay registros de historial para este mes.</p>
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

            {/* Modal: Gráfico Ampliado */}
            {expandedChart && (
              <div className="modal-overlay">
                <div className="modal-content glass-panel" style={{ maxWidth: '900px', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>📈 Tendencia: {expandedChart.nombre}</h3>
                    <button className="btn" onClick={() => setExpandedChart(null)}>Cerrar</button>
                  </div>
                  <div style={{ height: '400px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={expandedChart.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="valor" stroke={expandedChart.color || 'var(--primary)'} strokeWidth={4} dot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

          </div>
        );
      }}
    </ProfileSelector>
  );
}
