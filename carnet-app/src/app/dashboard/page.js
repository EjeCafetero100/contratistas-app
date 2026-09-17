"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCity } from "@/context/CityContext";

export default function DashboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedCity } = useCity();

  useEffect(() => {
    fetch('/api/users', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setUsers(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id, nombre) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${nombre}?`)) {
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setUsers(users.filter(u => u.id !== id));
        } else {
          alert("Error al eliminar");
        }
      } catch (err) {
        alert("Error de red al eliminar");
      }
    }
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h1 style={{ margin: 0 }}>Panel de Control</h1>
            {selectedCity && (
              <span className="city-badge-header">
                📍 {selectedCity.toUpperCase()}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            Gestión de Personal y Visitantes {selectedCity ? `— Centro de Distribución ${selectedCity}` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href={selectedCity === 'Barrancabermeja' ? '/barrancabermeja/inducciones' : '/induccion'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#fcd116',
              color: '#00205b',
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.9rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(252, 209, 22, 0.3)'
            }}
          >
            <span>🎓</span> INDUCCIONES {selectedCity ? selectedCity.toUpperCase() : ''}
          </Link>

          {selectedCity === 'Pereira' && (
            <Link
              href="/calculadora"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#00205b',
                color: '#fcd116',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                fontWeight: '800',
                fontSize: '0.9rem',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0, 32, 91, 0.2)'
              }}
            >
              <span>🗓️</span> GESTIÓN DE INCIDENTES
            </Link>
          )}
        </div>
      </header>

      {selectedCity === 'Barrancabermeja' && (
        <div style={{
          background: 'linear-gradient(135deg, #00205b 0%, #001233 100%)',
          border: '2px solid #fcd116',
          borderRadius: '16px',
          padding: '1.25rem 1.75rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 25px rgba(0, 32, 91, 0.25)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🎓</span>
              <h3 style={{ margin: 0, color: '#fcd116', fontSize: '1.2rem' }}>MÓDULO DE INDUCCIONES — BARRANCABERMEJA</h3>
            </div>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.9rem' }}>
              Accede al tablero oficial con las 5 inducciones (Conductores, GLP, Distoyota, Contratistas y Visitantes).
            </p>
          </div>
          <Link
            href="/barrancabermeja/inducciones"
            style={{
              background: '#fcd116',
              color: '#00205b',
              fontWeight: 800,
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem'
            }}
          >
            INGRESAR A INDUCCIONES BARRANCABERMEJA →
          </Link>
        </div>
      )}

      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ margin: 0 }}>Personal Registrado</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Buscar por cédula o nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '250px' }}
            />
          </div>
        </div>
        
        {loading ? (
          <p>Cargando datos...</p>
        ) : users.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay personas registradas aún.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Empresa</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(u => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return String(u.cedula).toLowerCase().includes(term) || String(u.nombre).toLowerCase().includes(term);
                  })
                  .map(user => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 500 }}>{user.nombre}</td>
                    <td>{user.cedula}</td>
                    <td>{user.empresa}</td>
                    <td>{user.tipo}</td>
                    <td>
                      <span className={`badge ${user.estado === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                        {user.estado || 'Activo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Link href={`/carnet/${user.id}`} style={{ color: 'var(--primary)', fontWeight: '500' }}>
                          Ver Carnet
                        </Link>
                        <Link href={`/edit/${user.id}`} style={{ color: '#f59e0b', fontWeight: '500' }}>
                          Editar
                        </Link>
                        <button 
                          onClick={() => handleDelete(user.id, user.nombre)} 
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '500', cursor: 'pointer', padding: 0, fontSize: 'inherit', fontFamily: 'inherit' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
