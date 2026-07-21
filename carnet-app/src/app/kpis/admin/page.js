"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProfileSelector from '@/components/ProfileSelector';

export default function AdminKPIs() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    cd: 'Pereira',
    responsable: '',
    nombre: '',
    unidad: '%',
    meta_semanal: '',
    meta_mensual: '',
    comparador: '>=',
    agregacion: 'SUMA'
  });

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          meta_semanal: Number(formData.meta_semanal),
          meta_mensual: Number(formData.meta_mensual)
        })
      });
      if (res.ok) {
        alert('KPI Creado exitosamente');
        setFormData({ ...formData, nombre: '', responsable: '', meta_semanal: '', meta_mensual: '' });
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch (err) {
      alert('Error de red');
    } finally {
      setLoading(false);
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
          <div className="container" style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <Link href="/kpis" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                &larr; Volver al Dashboard
              </Link>
            </div>

            <div className="glass-panel">
              <h2 style={{ marginBottom: '0.5rem' }}>⚙️ Administración de Indicadores</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Crea nuevos KPIs. Estarán disponibles automáticamente en el CD seleccionado.</p>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  
                  <div className="form-group">
                    <label>Centro de Distribución (CD)</label>
                    <select name="cd" required value={formData.cd} onChange={handleChange}>
                      <option value="Pereira">Pereira</option>
                      <option value="Armenia">Armenia</option>
                      <option value="Barrancabermeja">Barrancabermeja</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Responsable (Ej: UC, OL, ABI...)</label>
                    <input type="text" name="responsable" required value={formData.responsable} onChange={handleChange} placeholder="Ej: UC" />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Nombre del Indicador (KPI)</label>
                    <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} placeholder="Ej: % Vehículos Despachados a Tiempo" />
                  </div>

                  <div className="form-group">
                    <label>Unidad de Medida</label>
                    <input type="text" name="unidad" required value={formData.unidad} onChange={handleChange} placeholder="Ej: %, Cajas, $, Días" />
                  </div>

                  <div className="form-group">
                    <label>Comparador de Éxito</label>
                    <select name="comparador" required value={formData.comparador} onChange={handleChange}>
                      <option value=">">Mayor que (>)</option>
                      <option value=">=">Mayor o igual (>=)</option>
                      <option value="<">Menor que (<)</option>
                      <option value="<=">Menor o igual (<=)</option>
                    </select>
                    <small style={{ color: 'var(--text-muted)' }}>Define qué significa cumplir la meta (Ej: Accidentes deben ser menores a la meta).</small>
                  </div>

                  <div className="form-group">
                    <label>Comportamiento Mensual (MTD)</label>
                    <select name="agregacion" required value={formData.agregacion} onChange={handleChange}>
                      <option value="SUMA">Suma de las semanas (Ej: Volumen Total)</option>
                      <option value="PROMEDIO">Promedio de las semanas (Ej: % Eficiencia)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Meta Semanal Esperada</label>
                    <input type="number" step="any" name="meta_semanal" required value={formData.meta_semanal} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label>Meta Mensual Esperada (MTD)</label>
                    <input type="number" step="any" name="meta_mensual" required value={formData.meta_mensual} onChange={handleChange} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }} disabled={loading}>
                  {loading ? 'Guardando...' : 'Crear Nuevo Indicador'}
                </button>
              </form>
            </div>
          </div>
        );
      }}
    </ProfileSelector>
  );
}
