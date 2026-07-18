"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { calculateValidity } from "@/app/utils/validity";
import Link from "next/link";

export default function ScanPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState(null); // 'Autorizado' or 'No Autorizado'
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    async function processScan() {
      try {
        // Fetch user data
        const res = await fetch(`/api/users/${id}`, { cache: 'no-store' });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}: Error al obtener usuario`);
        }
        const data = await res.json();
        
        if (!isMounted) return;
        setUser(data);

        // Calculate validity
        const s360ValidityObj = calculateValidity(data.fechaInduccion360, 6);
        const isSafety360Valid = data.induccion360 === 'Con certificado' && s360ValidityObj.status === 'Vigente';

        const especificaValidity = calculateValidity(data.fechaInduccionEspecifica, 6, data.induccionEspecifica || 'N/A');
        const ssValidity = calculateValidity(data.fechaSeguridadSocial, 1, data.ss || 'N/A');

        const isAuthorized = 
          isSafety360Valid && 
          especificaValidity.status === 'Vigente' && 
          ssValidity.status === 'Vigente';

        const statusStr = isAuthorized ? 'Autorizado' : 'No Autorizado';
        setAuthStatus(statusStr);

        // Log entry asynchronously
        await fetch('/api/ingresos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: data.id, status: statusStr })
        });

      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    processScan();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fa' }}>
        <h2>Procesando escaneo...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8f9fa', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>❌ Error</h2>
        <p>{error}</p>
        <Link href="/" style={{ marginTop: '2rem' }}>Volver al Inicio</Link>
      </div>
    );
  }

  const isAuth = authStatus === 'Autorizado';
  const bgColor = isAuth ? '#10b981' : '#ef4444'; // Green : Red

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f0f4f8', minHeight: '100vh', padding: '2rem 1rem' }}>
      
      {/* Contenedor del Carnet */}
      <div 
        className="carnet-card" 
        style={{
          width: '350px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '2px solid var(--primary)',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 32, 91, 0.15)',
          position: 'relative'
        }}
      >
        {/* Cabecera del carnet */}
        <div style={{
          background: 'var(--primary)',
          padding: '1.5rem',
          textAlign: 'center',
          color: '#ffffff',
          fontWeight: '900',
          fontSize: '1.2rem',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          borderBottom: '4px solid var(--secondary)'
        }}>
          Control de Acceso
        </div>

        <div style={{ padding: '2rem', textAlign: 'center' }}>
          {/* Foto del usuario */}
          <div style={{
            width: '130px',
            height: '130px',
            borderRadius: '50%',
            background: '#f4f4f4',
            margin: '0 auto 1.5rem auto',
            overflow: 'hidden',
            border: '4px solid var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}>
            <img 
              src={(user.foto && user.foto !== 'null' && user.foto.trim() !== '') ? user.foto : `/avatars/${user.tipo ? user.tipo.toLowerCase() : 'trabajador'}.png`} 
              alt="Foto de perfil" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>

          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase' }}>{user.nombre}</h2>
          
          <div style={{
            background: isAuth ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.9rem'
          }}>
            {isAuth ? '✓ AUTORIZADO PARA INGRESAR' : '❌ NO AUTORIZADO'}
          </div>
          
          <div style={{ 
            background: '#f8f9fa', 
            padding: '1rem', 
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            textAlign: 'left',
            marginBottom: '1.5rem',
            fontSize: '0.8rem',
            color: 'var(--primary)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem'
          }}>
            <p style={{ gridColumn: '1 / -1' }}><strong>CC:</strong> {user.cedula}</p>
            <p style={{ gridColumn: '1 / -1' }}><strong>Empresa:</strong> {user.empresa}</p>
            <p><strong>Tipo:</strong> {user.tipo}</p>
            <p><strong>Fecha Reg:</strong> {user.fecha}</p>
            
            <p><strong>Safety 360:</strong> <span className={isSafety360Valid ? 'badge badge-success' : 'badge badge-danger'}>{user.induccion360 === 'Con certificado' ? 'Con certificado' : 'Sin certificado'}</span> {user.induccion360 === 'Con certificado' && s360ValidityObj.date ? `(Vence: ${s360ValidityObj.date})` : ''}</p>
            <p><strong>Ind. Específica:</strong> <span className={calculateValidity(user.fechaInduccionEspecifica, 6, user.induccionEspecifica || 'N/A').status === 'Vencida' ? 'badge badge-danger' : ''}>{calculateValidity(user.fechaInduccionEspecifica, 6, user.induccionEspecifica || 'N/A').status}</span> {calculateValidity(user.fechaInduccionEspecifica, 6, user.induccionEspecifica || 'N/A').date ? `(${calculateValidity(user.fechaInduccionEspecifica, 6, user.induccionEspecifica || 'N/A').date})` : ''}</p>
            <p><strong>S. Social:</strong> <span className={calculateValidity(user.fechaSeguridadSocial, 1, user.ss || 'N/A').status === 'Vencida' ? 'badge badge-danger' : ''}>{calculateValidity(user.fechaSeguridadSocial, 1, user.ss || 'N/A').status}</span> {calculateValidity(user.fechaSeguridadSocial, 1, user.ss || 'N/A').date ? `(${calculateValidity(user.fechaSeguridadSocial, 1, user.ss || 'N/A').date})` : ''}</p>
          </div>
        </div>

        {/* Pie del carnet */}
        <div style={{
          background: 'var(--primary)',
          padding: '1rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#ffffff',
          fontWeight: '600',
          letterSpacing: '1px'
        }}>
          USO PERSONAL E INTRANSFERIBLE
        </div>
      </div>
    </div>
  );
}
