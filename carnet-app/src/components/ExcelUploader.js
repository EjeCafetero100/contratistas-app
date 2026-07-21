"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";

export default function ExcelUploader({ onUploadComplete }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const excelDateToJSDate = (serial) => {
    if (!serial) return null;
    if (typeof serial !== 'number') return String(serial);
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date = new Date(utc_value * 1000);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() + offset);
    return localDate.toISOString().split('T')[0];
  };

  const processExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Asumiendo que la fila 2 (índice 2) es la cabecera como en la plantilla original
        const data = XLSX.utils.sheet_to_json(ws, { range: 2, defval: null });
        
        if (data.length === 0) {
          throw new Error("El archivo Excel está vacío o no coincide con la plantilla esperada.");
        }

        const records = [];
        
        for (const row of data) {
          const keys = Object.keys(row);
          const cedulaKey = keys.find(k => k.trim().toUpperCase() === 'CÉDULA');
          const nombreKey = keys.find(k => k.trim().toUpperCase() === 'NOMBRE COMPLETO');
          
          if (!cedulaKey || !row[cedulaKey] || !nombreKey || !row[nombreKey]) {
            continue; // Skip invalid rows
          }

          const tipo = row['TIPO DE PERSONA'] || 'PROVEEDOR';
          const cargo = row['CARGO'] || tipo;
          
          records.push({
            fecha: excelDateToJSDate(row['FECHA AUTORIZACIÓN DE INGRESO']),
            nombre: String(row[nombreKey]).trim(),
            cedula: String(row[cedulaKey]).trim(),
            empresa: tipo,
            cargo: cargo,
            induccion360: row['\r\nInducción Safety 360'] || row['Inducción Safety 360'] || 'No Aplica',
            fechaInduccion360: excelDateToJSDate(row['Fecha']),
            induccionEspecifica: row['Inducción Específica'] || 'No Aplica',
            fechaInduccionEspecifica: excelDateToJSDate(row['(Fecha realización)']),
            ss: row['Seguridad Social'] || 'NO VIGENTE',
            fechaSeguridadSocial: excelDateToJSDate(row['FECHA SEGURIDAD SOCIAL']),
            estado: 'Activo'
          });
        }

        if (records.length === 0) {
          throw new Error("No se encontraron registros válidos para importar.");
        }

        const res = await fetch('/api/users/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records })
        });
        
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || "Error al subir datos a la base de datos.");

        setMessage(`✅ ¡Importación exitosa! Se insertaron ${result.inserted} registros nuevos y se omitieron ${result.duplicates} duplicados.`);
        if (onUploadComplete) onUploadComplete();
        if (fileInputRef.current) fileInputRef.current.value = "";
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Error al leer el archivo.");
      setLoading(false);
    };
    
    reader.readAsBinaryString(file);
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '2rem', border: '2px dashed #cbd5e1', background: '#f8fafc' }}>
      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📊 Importación Masiva (Excel)
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Sube un archivo .xlsx con el formato establecido para registrar múltiples personas a la vez. El sistema omitirá automáticamente las cédulas que ya existan.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          onChange={processExcel}
          disabled={loading}
          ref={fileInputRef}
          style={{ display: 'none' }}
          id="excel-upload"
        />
        <label 
          htmlFor="excel-upload" 
          className="btn btn-primary" 
          style={{ cursor: loading ? 'not-allowed' : 'pointer', background: '#10b981', color: 'white', border: 'none' }}
        >
          {loading ? 'Procesando archivo...' : '📁 Seleccionar Excel y Subir'}
        </label>
      </div>

      {message && <div style={{ marginTop: '1rem', padding: '1rem', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', border: '1px solid #10b981' }}>{message}</div>}
      {error && <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', border: '1px solid #ef4444' }}>❌ {error}</div>}
    </div>
  );
}
