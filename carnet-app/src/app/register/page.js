"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    nombre: "",
    cedula: "",
    empresa: "",
    tipo: "Trabajador",
    induccion360: "Sin certificado",
    fechaInduccion360: "",
    induccionEspecifica: "Vigente",
    fechaInduccionEspecifica: "",
    ss: "Vigente",
    fechaSeguridadSocial: "",
    estado: "Activo"
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/carnet/${data.id}`);
      } else {
        alert("Error: " + data.error);
        setLoading(false);
      }
    } catch (err) {
      alert("Error saving data");
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '2rem' }}>&larr; Volver al Inicio</Link>
      
      <div className="glass-panel">
        <h2 style={{ marginBottom: '2rem' }}>Registrar Nueva Persona</h2>
        <form onSubmit={handleSubmit}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label>Tipo de Persona</label>
              <select name="tipo" value={formData.tipo} onChange={handleChange}>
                <option value="Trabajador">Trabajador</option>
                <option value="Contratista">Contratista</option>
                <option value="Visitante">Visitante</option>
                <option value="Proveedor">Proveedor</option>
                <option value="Conductor">Conductor</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nombre Completo</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej: Juan Pérez" />
            </div>

            <div className="form-group">
              <label>Cédula</label>
              <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Empresa</label>
              <input type="text" name="empresa" value={formData.empresa} onChange={handleChange} required />
            </div>



            <div className="form-group">
              <label>Inducción Safety 360</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select name="induccion360" value={formData.induccion360} onChange={handleChange} style={{ flex: 1 }}>
                  <option value="Con certificado">Con certificado</option>
                  <option value="Sin certificado">Sin certificado</option>
                </select>
                {formData.induccion360 === "Con certificado" && (
                  <input type="date" name="fechaInduccion360" value={formData.fechaInduccion360} onChange={handleChange} style={{ flex: 1 }} title="Fecha de expedición Safety 360" />
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Inducción Específica (Fecha realización)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select name="induccionEspecifica" value={formData.induccionEspecifica} onChange={handleChange} style={{ flex: 1 }}>
                  <option value="Vigente">Vigente</option>
                  <option value="Vencida">Vencida</option>
                </select>
                <input type="date" name="fechaInduccionEspecifica" value={formData.fechaInduccionEspecifica} onChange={handleChange} style={{ flex: 1 }} />
              </div>
            </div>



            <div className="form-group">
              <label>Seguridad Social (Fecha de pago)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select name="ss" value={formData.ss} onChange={handleChange} style={{ flex: 1 }}>
                  <option value="Vigente">Vigente</option>
                  <option value="Vencida">Vencida</option>
                </select>
                <input type="date" name="fechaSeguridadSocial" value={formData.fechaSeguridadSocial} onChange={handleChange} style={{ flex: 1 }} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar y Generar Carnet'}
          </button>
        </form>
      </div>
    </div>
  );
}
