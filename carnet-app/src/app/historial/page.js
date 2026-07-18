"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Historial() {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/ingresos')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else if (Array.isArray(data)) {
          setIngresos(data);
        } else {
          setError("Error de formato de datos");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Error de conexión");
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Historial de Ingresos</h1>
          <p style={{ color: 'var(--text-muted)' }}>Registro de escaneos de código QR</p>
        </div>
        <Link href="/" className="btn btn-secondary" style={{ background: '#e2e8f0', color: 'var(--primary)' }}>
          Volver al Panel de Control
        </Link>
      </header>

      <div className="glass-panel">
        
        {loading ? (
          <p>Cargando historial...</p>
        ) : error ? (
          <p style={{ color: 'var(--danger)' }}>{error}</p>
        ) : ingresos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay ingresos registrados aún.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Empresa</th>
                  <th>Tipo</th>
                  <th>Estado de Acceso</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map(ingreso => (
                  <tr key={ingreso.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(ingreso.timestamp).toLocaleString()}</td>
                    <td style={{ fontWeight: 500 }}>{ingreso.nombre}</td>
                    <td>{ingreso.cedula}</td>
                    <td>{ingreso.empresa}</td>
                    <td>{ingreso.tipo}</td>
                    <td>
                      <span className={`badge ${ingreso.ingreso_status === 'Autorizado' ? 'badge-success' : 'badge-danger'}`}>
                        {ingreso.ingreso_status}
                      </span>
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
