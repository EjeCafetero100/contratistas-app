"use client";

import { useState, useEffect } from "react";

export default function CalculadoraAccidentes() {
  // Fecha por defecto: 21 días atrás (para que cuadre con la imagen de ejemplo inicialmente)
  const [lastAccidentDate, setLastAccidentDate] = useState(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() - 21);
    return defaultDate.toISOString().split('T')[0];
  });
  
  const [daysWithoutAccidents, setDaysWithoutAccidents] = useState(0);

  useEffect(() => {
    if (!lastAccidentDate) return;
    
    // Convertir la fecha seleccionada a objeto Date (considerando zona horaria local para evitar saltos de día)
    const [year, month, day] = lastAccidentDate.split('-').map(Number);
    const lastDateObj = new Date(year, month - 1, day);
    
    // Fecha actual
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche para cálculo exacto de días enteros
    
    // Calcular diferencia en milisegundos
    const diffTime = today.getTime() - lastDateObj.getTime();
    
    // Convertir a días (si la fecha es futura, se muestra 0)
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    setDaysWithoutAccidents(diffDays);
  }, [lastAccidentDate]);

  return (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏱️ Calculadora de Accidentes</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Seguimiento de nuestro compromiso con la Seguridad y Salud en el Trabajo
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
        
        {/* Contenedor Principal del Gran Número */}
        <div 
          className="glass-panel" 
          style={{ 
            width: '100%', 
            maxWidth: '600px', 
            padding: '4rem 2rem', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(162, 219, 115, 0.15)',
            border: '2px solid rgba(162, 219, 115, 0.3)',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(240, 255, 230, 0.6) 100%)'
          }}
        >
          <h2 style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '1.2rem', marginBottom: '1rem' }}>
            Llevamos
          </h2>
          
          <div style={{ 
            fontSize: '9rem', 
            fontWeight: '800', 
            color: '#a2db73', // El color verde pastel de la imagen proporcionada
            lineHeight: '1',
            textShadow: '0px 4px 20px rgba(162, 219, 115, 0.4)',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {daysWithoutAccidents.toFixed(1)}
          </div>
          
          <h2 style={{ color: 'var(--text-main)', fontSize: '2rem', marginTop: '1rem', fontWeight: '700' }}>
            DÍAS SIN ACCIDENTES
          </h2>
        </div>

        {/* Selector de Fecha */}
        <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Configuración de Fecha</h3>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <label htmlFor="accident-date" style={{ fontWeight: '600', color: 'var(--text-main)' }}>
              ¿Cuándo ocurrió el último accidente?
            </label>
            <input 
              id="accident-date"
              type="date" 
              value={lastAccidentDate}
              onChange={(e) => setLastAccidentDate(e.target.value)}
              style={{ 
                padding: '1rem 1.5rem', 
                fontSize: '1.2rem', 
                borderRadius: '12px', 
                border: '2px solid #e2e8f0',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'var(--text-main)',
                backgroundColor: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                width: '100%',
                maxWidth: '300px'
              }}
            />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Al cambiar la fecha, el contador se actualizará automáticamente.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
