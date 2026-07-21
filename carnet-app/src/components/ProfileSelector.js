"use client";

import { useState, useEffect } from 'react';

export default function ProfileSelector({ children }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('kpi_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  const handleSelect = (role, cd = null) => {
    let p = { role, cd };
    if (role === 'admin') {
      const pwd = prompt('Ingrese clave de Administrador (admin123):');
      if (pwd !== 'admin123') {
        alert('Clave incorrecta');
        return;
      }
    }
    localStorage.setItem('kpi_profile', JSON.stringify(p));
    setProfile(p);
  };

  const handleLogout = () => {
    localStorage.removeItem('kpi_profile');
    setProfile(null);
  };

  if (isLoading) return <div>Cargando perfil...</div>;

  if (!profile) {
    return (
      <div className="container" style={{ maxWidth: '600px', textAlign: 'center', paddingTop: '4rem' }}>
        <h2>Acceso al Módulo de KPIs</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Por favor selecciona tu perfil para continuar.</p>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <button className="btn" onClick={() => handleSelect('user', 'Pereira')} style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            Operador - 📍 Pereira
          </button>
          <button className="btn" onClick={() => handleSelect('user', 'Armenia')} style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            Operador - 📍 Armenia
          </button>
          <button className="btn" onClick={() => handleSelect('user', 'Barrancabermeja')} style={{ padding: '1rem', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
            Operador - 📍 Barrancabermeja
          </button>
          <button className="btn btn-primary" onClick={() => handleSelect('admin')} style={{ padding: '1rem', marginTop: '1rem' }}>
            👨‍💼 Administrador Nacional (Todos los CD)
          </button>
        </div>
      </div>
    );
  }

  // Pass profile as prop to child component
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Sesión actual: <strong>{profile.role === 'admin' ? 'Administrador' : `Operador ${profile.cd}`}</strong>
          </span>
          <button onClick={handleLogout} style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cambiar Perfil
          </button>
        </div>
      </div>
      {children(profile)}
    </div>
  );
}
