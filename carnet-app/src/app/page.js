"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Panel de Control</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de Personal y Visitantes</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/historial" className="btn btn-secondary" style={{ background: '#e2e8f0', color: 'var(--primary)' }}>
            Historial de Ingresos
          </Link>
          <Link href="/register" className="btn btn-primary">
            + Añadir Persona
          </Link>
        </div>
      </header>

      <div className="glass-panel">
        <h2>Personal Registrado</h2>
        
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
                {users.map(user => (
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
