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

  return (
    <ProfileSelector>
      {(profile) => {
        
        // Force CD filter if user is an operator
        const currentCDFilter = profile.role === 'admin' ? selectedCD : profile.cd;

        // Apply filters
        let filteredKpis = kpis;
        if (currentCDFilter !== 'Todos') filteredKpis = filteredKpis.filter(k => k.cd === currentCDFilter);
        if (selectedResp !== 'Todos') filteredKpis = filteredKpis.filter(k => k.responsable === selectedResp);

        // Calculate values for each KPI
        const dashboardData = filteredKpis.map(kpi => {
          const kpiDataThisMonth = data.filter(d => 
            d.kpi_id === kpi.id && 
            d.anio === selectedYear && 
            d.mes === selectedMonth
          );

          // Calculate MTD
          let mtd = 0;
          if (kpiDataThisMonth.length > 0) {
            const sum = kpiDataThisMonth.reduce((acc, curr) => acc + Number(curr.valor), 0);
            mtd = kpi.agregacion === 'PROMEDIO' ? sum / kpiDataThisMonth.length : sum;
          }

          // Evaluate traffic light based on monthly target
          let isGood = false;
          let isWarning = false;
          let color = '#ef4444'; // Red
          let icon = '🔴';
          
          const meta = Number(kpi.meta_mensual);
          const val = Number(mtd);
          const comp = kpi.comparador;

          if (comp === '>') isGood = val > meta;
          else if (comp === '<') isGood = val < meta;
          else if (comp === '>=') isGood = val >= meta;
          else if (comp === '<=') isGood = val <= meta;

          // Simple warning logic (within 10% of the goal)
          const diffPct = meta === 0 ? 0 : Math.abs((val - meta) / meta);
          if (!isGood && diffPct <= 0.1) {
            isWarning = true;
          }

          if (isGood) {
            color = '#10b981'; // Green
            icon = '🟢';
          } else if (isWarning) {
            color = '#f59e0b'; // Yellow
            icon = '🟡';
          }

          // Format for chart (week 1 to 5)
          const chartData = [1,2,3,4,5].map(w => {
            const row = kpiDataThisMonth.find(d => d.semana === w);
            return { name: `Sem ${w}`, valor: row ? Number(row.valor) : 0 };
          });

          return { ...kpi, mtd, color, icon, chartData };
        });

        // Unique responsibles for the dropdown
        const responsibles = [...new Set(kpis.map(k => k.responsable))];

        return (
          <div className="container" style={{ maxWidth: '1200px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1>📊 Panel de Indicadores (KPIs)</h1>
                <p style={{ color: 'var(--text-muted)' }}>Módulo de seguimiento y cumplimiento</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link href="/kpis/ingreso" className="btn" style={{ background: 'white', color: 'black', border: '1px solid #cbd5e1' }}>
                  📝 Ingresar Valor Semanal
                </Link>
                {profile.role === 'admin' && (
                  <Link href="/kpis/admin" className="btn btn-primary">
                    ⚙️ Administrar KPIs
                  </Link>
                )}
              </div>
            </header>

            {/* Filtros */}
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
                  <option value={1}>Enero</option>
                  <option value={2}>Febrero</option>
                  <option value={3}>Marzo</option>
                  <option value={4}>Abril</option>
                  <option value={5}>Mayo</option>
                  <option value={6}>Junio</option>
                  <option value={7}>Julio</option>
                  <option value={8}>Agosto</option>
                  <option value={9}>Septiembre</option>
                  <option value={10}>Octubre</option>
                  <option value={11}>Noviembre</option>
                  <option value={12}>Diciembre</option>
                </select>
              </div>
            </div>

            {loading ? (
              <p>Cargando KPIs...</p>
            ) : dashboardData.length === 0 ? (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <h3>No hay KPIs configurados</h3>
                <p style={{ color: 'var(--text-muted)' }}>Ajusta los filtros o pide al Administrador que cree un nuevo indicador.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {dashboardData.map(kpi => (
                  <div key={kpi.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>
                          {kpi.cd} • {kpi.responsable}
                        </span>
                        <h3 style={{ margin: '0.5rem 0' }}>{kpi.nombre}</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Meta mensual: {kpi.comparador} {kpi.meta_mensual} {kpi.unidad}</p>
                      </div>
                      <div style={{ fontSize: '1.5rem' }}>{kpi.icon}</div>
                    </div>
                    
                    <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: kpi.color }}>
                        {kpi.mtd.toFixed(1)}
                      </span>
                      <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{kpi.unidad}</span>
                    </div>

                    <div style={{ height: '150px', width: '100%', marginTop: 'auto' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={kpi.chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line type="monotone" dataKey="valor" stroke={kpi.color} strokeWidth={3} dot={{ r: 4, fill: kpi.color, strokeWidth: 0 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </ProfileSelector>
  );
}
