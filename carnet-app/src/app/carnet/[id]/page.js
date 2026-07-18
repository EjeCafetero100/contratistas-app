import db from '@/database/db';
import QRCode from 'qrcode';
import Link from 'next/link';
import PrintButton from './PrintButton';
import { calculateValidity } from '@/app/utils/validity';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CarnetPage({ params }) {
  const { id } = await params;
  
  // Fetch user directly from Supabase since this is a Server Component
  const { data: userData, error } = await db
    .from('personal')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !userData) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h2>Usuario no encontrado</h2>
        <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Volver al Inicio</Link>
      </div>
    );
  }

  // Mapear userData de Supabase a user para mantener compatibilidad
  const user = {
    id: userData.id,
    fecha: userData.fecha,
    nombre: userData.nombre,
    cedula: userData.cedula,
    empresa: userData.empresa,
    tipo: userData.cargo,
    induccion360: userData.induccion_safety_360,
    fechaInduccion360: userData.fecha_induccion_360,
    induccionEspecifica: userData.induccion_especifica,
    fechaInduccionEspecifica: userData.fecha_induccion_especifica,
    ss: userData.seguridad_social_vigente,
    fechaSeguridadSocial: userData.fecha_seguridad_social,
    foto: userData.foto,
    estado: userData.estado
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://contratistas-app.vercel.app';
  const qrData = `${baseUrl}/scan/${user.id}`;
  
  const qrCodeDataUri = await QRCode.toDataURL(qrData, {
    color: {
      dark: '#0f172a',  // Blue-gray dark
      light: '#ffffff'
    },
    width: 200,
    margin: 1
  });

  // Default avatar mapping
  const roleType = user.tipo ? user.tipo.toLowerCase() : 'trabajador';
  const defaultAvatar = `/avatars/${roleType}.png`;
  const avatarSrc = (user.foto && user.foto !== 'null' && user.foto.trim() !== '') ? user.foto : defaultAvatar;

  const s360ValidityObj = calculateValidity(user.fechaInduccion360, 6);
  const isSafety360Valid = user.induccion360 === 'Con certificado' && s360ValidityObj.status === 'Vigente';
  const safety360Text = user.induccion360 === 'Con certificado' ? 'Con certificado' : 'Sin certificado';

  const especificaValidity = calculateValidity(user.fechaInduccionEspecifica, 6, user.induccionEspecifica || 'N/A');
  const ssValidity = calculateValidity(user.fechaSeguridadSocial, 1, user.ss || 'N/A');

  const isAuthorized = 
    isSafety360Valid && 
    especificaValidity.status === 'Vigente' && 
    ssValidity.status === 'Vigente';

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Link href="/" style={{ alignSelf: 'flex-start', marginBottom: '2rem' }}>&larr; Volver al Inicio</Link>
      
      {/* Contenedor del Carnet */}
      <div 
        id="carnet-node"
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
            <img src={avatarSrc} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase' }}>{user.nombre}</h2>
          
          <div style={{
            background: isAuthorized ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '8px',
            fontWeight: 'bold',
            marginBottom: '1.5rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.9rem'
          }}>
            {isAuthorized ? '✓ AUTORIZADO PARA INGRESAR' : '❌ NO AUTORIZADO'}
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
            <p><strong>Safety 360:</strong> <span className={isSafety360Valid ? 'badge badge-success' : 'badge badge-danger'}>{safety360Text}</span> {user.induccion360 === 'Con certificado' && s360ValidityObj.date ? `(Vence: ${s360ValidityObj.date})` : ''}</p>
            <p><strong>Ind. Específica:</strong> <span className={especificaValidity.status === 'Vencida' ? 'badge badge-danger' : ''}>{especificaValidity.status}</span> {especificaValidity.date ? `(${especificaValidity.date})` : ''}</p>
            <p><strong>S. Social:</strong> <span className={ssValidity.status === 'Vencida' ? 'badge badge-danger' : ''}>{ssValidity.status}</span> {ssValidity.date ? `(${ssValidity.date})` : ''}</p>
            
            
            {/* Estado removido según solicitud */}
          </div>

          {/* Código QR */}
          <div style={{ background: '#fff', padding: '0.5rem', display: 'inline-block' }}>
            <img src={qrCodeDataUri} alt="Código QR" style={{ display: 'block' }} />
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
      
      <PrintButton />

      {/* Media query for print inside style tag */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: none; }
          .container > *:not(.carnet-card) { display: none !important; }
          .carnet-card { 
            box-shadow: none !important; 
            border: 1px solid #ccc !important; 
            margin: 0 auto;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
        }
      `}} />
    </div>
  );
}
