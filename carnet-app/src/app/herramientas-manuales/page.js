"use client";

import Link from 'next/link';

export default function HerramientasManualesOverviewPage() {
  const modules = [
    {
      id: 'carretillas-ol',
      title: 'Carretillas OL',
      icon: '🛒',
      href: '/herramientas-manuales/carretillas-ol',
      desc: 'Inspección periódica de carretillas de carga y distribución para la operación OL.',
      color: '#0284c7'
    },
    {
      id: 'estibadores-ol',
      title: 'Estibadores OL',
      icon: '📦',
      href: '/herramientas-manuales/estibadores-ol',
      desc: 'Control y auditoría técnica de estibadores manuales, sistema hidráulico y rodadura.',
      color: '#f59e0b'
    },
    {
      id: 'carretillas-uc',
      title: 'Carretillas UC',
      icon: '⚙️',
      href: '/herramientas-manuales/carretillas-uc',
      desc: 'Seguimiento de operatividad, ergonomía y mantenimiento de carretillas UC.',
      color: '#10b981'
    }
  ];

  return (
    <div style={{ padding: '1.2rem', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #00205b 0%, #001233 100%)',
        color: '#ffffff',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0, 32, 91, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '1.8rem' }}>🛠️</span>
          <span style={{
            background: '#fcd116',
            color: '#00205b',
            fontWeight: 800,
            fontSize: '0.75rem',
            padding: '0.25rem 0.65rem',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            SafeTogether • AB InBev
          </span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 0.5rem 0' }}>
          HERRAMIENTAS MANUALES
        </h1>
        <p style={{ margin: 0, opacity: 0.85, fontSize: '0.95rem', maxWidth: '750px' }}>
          Módulo centralizado para el control preoperacional, auditorías de seguridad y registro de bases de datos de herramientas manuales de los centros de distribución.
        </p>
      </div>

      {/* Grid de los 3 Submódulos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {modules.map((m) => (
          <Link
            key={m.id}
            href={m.href}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.8rem',
              boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
              borderTop: `6px solid ${m.color}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>{m.icon}</div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#00205b', margin: '0 0 0.5rem 0' }}>
                  {m.title}
                </h2>
                <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                  {m.desc}
                </p>
              </div>

              <div style={{
                marginTop: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '1rem'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: m.color }}>
                  Abrir Dashboard
                </span>
                <span style={{ fontSize: '1rem', color: m.color, fontWeight: 900 }}>
                  →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Caja Informativa de Carga de Excel en Scratch */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '1.6rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.4rem' }}>📁</span>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#00205b' }}>
            Integración de Bases de Datos Excel desde Scratch
          </h3>
        </div>
        <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 1rem 0' }}>
          Cada submódulo cuenta con un detector automático que leerá tus archivos en cuanto los subas a la carpeta <code>scratch/</code> o los cargues directamente desde la interfaz web de cada dashboard.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem', fontSize: '0.82rem' }}>
          <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong>1. Carretillas OL:</strong> Guarda tu archivo como <code>carretillas_ol.xlsx</code>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong>2. Estibadores OL:</strong> Guarda tu archivo como <code>estibadores_ol.xlsx</code>
          </div>
          <div style={{ background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong>3. Carretillas UC:</strong> Guarda tu archivo como <code>carretillas_uc.xlsx</code>
          </div>
        </div>
      </div>
    </div>
  );
}
