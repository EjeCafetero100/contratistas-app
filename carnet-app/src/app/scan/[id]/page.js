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
        const res = await fetch(`/api/users/${id}`);
        if (!res.ok) {
          throw new Error('Usuario no encontrado');
        }
        const data = await res.json();
        
        if (!isMounted) return;
        setUser(data);

        // Calculate validity
        const safety360Validity = data.induccion360 === 'Con certificado' 
          ? calculateValidity(data.fechaInduccion360, 6) 
          : { status: data.induccion360 || 'Sin certificado', date: null };

        const especificaValidity = calculateValidity(data.fechaInduccionEspecifica, 6, data.induccionEspecifica || 'N/A');
        const ssValidity = calculateValidity(data.fechaSeguridadSocial, 1, data.ss || 'N/A');

        const isAuthorized = 
          safety360Validity.status === 'Vigente' && 
          especificaValidity.status === 'Vigente' && 
          ssValidity.status === 'Vigente' &&
          data.estado === 'Activo';

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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: bgColor,
      color: '#ffffff',
      padding: '2rem',
      textAlign: 'center'
    }}>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '3rem 2rem',
        borderRadius: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '400px',
        width: '100%',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          {isAuth ? '✅' : '❌'}
        </div>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '2rem', letterSpacing: '2px' }}>
          {isAuth ? 'ACCESO AUTORIZADO' : 'ACCESO DENEGADO'}
        </h1>

        <div style={{ 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          background: '#fff', 
          margin: '0 auto 1.5rem auto',
          overflow: 'hidden',
          border: '4px solid rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img 
            src={user.foto || `/avatars/${user.tipo ? user.tipo.toLowerCase() : 'trabajador'}.png`} 
            alt="Foto de perfil" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>{user.nombre}</h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '0.2rem' }}>CC: {user.cedula}</p>
        <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>{user.empresa} - {user.tipo}</p>

        {!isAuth && (
          <div style={{ marginTop: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
            Documentación vencida o incompleta.
          </div>
        )}

      </div>

      <Link href="/" style={{ marginTop: '3rem', color: '#fff', textDecoration: 'underline', opacity: 0.8 }}>
        Volver al Panel de Control
      </Link>
    </div>
  );
}
