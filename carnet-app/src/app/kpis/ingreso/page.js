"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProfileSelector from '@/components/ProfileSelector';

export default function CaptureKPI() {
  const router = useRouter();
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form State
  const [selectedCD, setSelectedCD] = useState('');
  const [selectedResp, setSelectedResp] = useState('');
  const [selectedKpiId, setSelectedKpiId] = useState('');
  
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [semana, setSemana] = useState(1);
  const [valor, setValor] = useState('');

  useEffect(() => {
    fetch('/api/kpis').then(r => r.json()).then(data => {
      setKpis(data);
      setFetching(false);
    });
  }, []);

  return (
    <ProfileSelector>
      {(profile) => {
        // Enforce CD for operators
        const currentCD = profile.role === 'admin' ? selectedCD : profile.cd;
        
        // Dynamic filtering for dropdowns
        const availableKpis = kpis.filter(k => k.cd === currentCD);
        const availableResps = [...new Set(availableKpis.map(k => k.responsable))];
        const finalKpis = availableKpis.filter(k => k.responsable === selectedResp);

        const handleSubmit = async (e) => {
          e.preventDefault();
          if (!selectedKpiId || valor === '') return;
          
          setLoading(true);
          try {
            const res = await fetch('/api/kpis/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                kpi_id: selectedKpiId,
                anio,
                mes,
                semana: Number(semana),
                valor: Number(valor)
              })
            });
            if (res.ok) {
              alert('Valor registrado correctamente');
              setValor('');
            } else {
              const data = await res.json();
              alert('Error: ' + data.error);
            }
          } catch (err) {
            alert('Error de red');
          } finally {
            setLoading(false);
          }
        };

        return (
          <div className="container" style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <Link href="/kpis" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                &larr; Volver al Dashboard
              </Link>
            </div>

            <div className="glass-panel">
              <h2 style={{ marginBottom: '0.5rem' }}>Captura de Indicadores</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Ingresa los resultados semanales de tu operación.</p>

              {fetching ? <p>Cargando configuraciones...</p> : (
                <form onSubmit={handleSubmit}>
                  
                  {profile.role === 'admin' && (
                    <div className="form-group">
                      <label>Centro de Distribución</label>
                      <select required value={selectedCD} onChange={e => { setSelectedCD(e.target.value); setSelectedResp(''); setSelectedKpiId(''); }}>
                        <option value="" disabled>Seleccione un CD</option>
                        <option value="Pereira">Pereira</option>
                        <option value="Armenia">Armenia</option>
                        <option value="Barrancabermeja">Barrancabermeja</option>
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Responsable / Área</label>
                    <select required value={selectedResp} onChange={e => { setSelectedResp(e.target.value); setSelectedKpiId(''); }}>
                      <option value="" disabled>Seleccione Responsable</option>
                      {availableResps.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Indicador (KPI)</label>
                    <select required value={selectedKpiId} onChange={e => setSelectedKpiId(e.target.value)}>
                      <option value="" disabled>Seleccione KPI</option>
                      {finalKpis.map(k => <option key={k.id} value={k.id}>{k.nombre} ({k.unidad})</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Año</label>
                      <input type="number" required value={anio} onChange={e => setAnio(Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Mes</label>
                      <select required value={mes} onChange={e => setMes(Number(e.target.value))}>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Semana</label>
                      <select required value={semana} onChange={e => setSemana(Number(e.target.value))}>
                        {[1,2,3,4,5].map(s => <option key={s} value={s}>Semana {s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Valor Obtenido</label>
                    <input 
                      type="number" 
                      step="any"
                      required 
                      value={valor} 
                      onChange={e => setValor(e.target.value)} 
                      placeholder="Ej: 95.5"
                      style={{ fontSize: '1.5rem', padding: '1rem' }}
                    />
                    {selectedKpiId && (
                      <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                        Meta semanal esperada: {finalKpis.find(k => k.id === selectedKpiId)?.meta_semanal}
                      </small>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem' }} disabled={loading}>
                    {loading ? 'Guardando...' : '💾 Guardar Valor Semanal'}
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      }}
    </ProfileSelector>
  );
}
