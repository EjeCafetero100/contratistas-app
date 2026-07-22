"use client";

import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

export default function Credit360Page() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [selectedUnit, setSelectedUnit] = useState('Todas');
  const [selectedYear, setSelectedYear] = useState('Todos');
  const [selectedMonth, setSelectedMonth] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Read as JSON
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        // Parse custom headers
        const headers = jsonData[0];
        const rows = jsonData.slice(1).filter(r => r && r.length > 0);

        // Map data to objects based on known column names
        const getColIdx = (name) => headers.findIndex(h => typeof h === 'string' && h.includes(name));
        
        const idxUnidad = getColIdx('Unidad');
        const idxClasificacion = getColIdx('Clasificación de incidentes');
        const idxCategoria = getColIdx('Categoría del incidente');
        const idxFecha = getColIdx('Fecha en que ocurrió el incidente');
        const idxNombre = getColIdx('Nombre');
        const idxCargo = getColIdx('Cargo');
        const idxDesc = getColIdx('Descripción del incidente');

        // Excel date to JS date
        const excelDateToJSDate = (excelDate) => {
          if (!excelDate || isNaN(excelDate)) return new Date();
          return new Date((excelDate - (25567 + 2)) * 86400 * 1000); // Excel bug correction
        };

        const parsedData = rows.map((row, i) => {
          const dateVal = row[idxFecha];
          const jsDate = excelDateToJSDate(dateVal);

          return {
            id: i,
            unidad: row[idxUnidad] || 'Desconocida',
            clasificacion: row[idxClasificacion] || 'Sin Clasificar',
            categoria: row[idxCategoria] || 'Desconocida',
            fecha: jsDate,
            fechaStr: jsDate.toLocaleDateString('es-CO'),
            mesAño: `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, '0')}`,
            nombre: row[idxNombre] || 'N/A',
            cargo: row[idxCargo] || 'N/A',
            descripcion: row[idxDesc] || 'Sin descripción'
          };
        });

        setData(parsedData);
      } catch (err) {
        console.error(err);
        setError('Error al procesar el archivo Excel. Asegúrate de que tenga el formato correcto.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Auto-cargar archivo desde la carpeta public
  useEffect(() => {
    const loadDefaultExcel = async () => {
      setLoading(true);
      try {
        const response = await fetch('/credit-360.xlsx');
        if (!response.ok) throw new Error('No se encontró el archivo por defecto');
        
        const arrayBuffer = await response.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const headers = jsonData[0];
        const rows = jsonData.slice(1).filter(r => r && r.length > 0);

        const getColIdx = (name) => headers.findIndex(h => typeof h === 'string' && h.includes(name));
        
        const idxUnidad = getColIdx('Unidad');
        const idxClasificacion = getColIdx('Clasificación de incidentes');
        const idxCategoria = getColIdx('Categoría del incidente');
        const idxFecha = getColIdx('Fecha en que ocurrió el incidente');
        const idxNombre = getColIdx('Nombre');
        const idxCargo = getColIdx('Cargo');
        const idxDesc = getColIdx('Descripción del incidente');

        const excelDateToJSDate = (excelDate) => {
          if (!excelDate || isNaN(excelDate)) return new Date();
          return new Date((excelDate - (25567 + 2)) * 86400 * 1000); 
        };

        const parsedData = rows.map((row, i) => {
          const dateVal = row[idxFecha];
          const jsDate = excelDateToJSDate(dateVal);

          return {
            id: i,
            unidad: row[idxUnidad] || 'Desconocida',
            clasificacion: row[idxClasificacion] || 'Sin Clasificar',
            categoria: row[idxCategoria] || 'Desconocida',
            fecha: jsDate,
            fechaStr: jsDate.toLocaleDateString('es-CO'),
            mesAño: `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, '0')}`,
            nombre: row[idxNombre] || 'N/A',
            cargo: row[idxCargo] || 'N/A',
            descripcion: row[idxDesc] || 'Sin descripción'
          };
        });

        setData(parsedData);
      } catch (err) {
        console.log('No default excel found or error parsing:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDefaultExcel();
  }, []);

  // --- Derived Data for Charts ---
  const filteredData = useMemo(() => {
    let result = data;
    if (selectedUnit !== 'Todas') {
      result = result.filter(d => d.unidad === selectedUnit);
    }
    if (selectedYear !== 'Todos') {
      result = result.filter(d => d.fecha.getFullYear().toString() === selectedYear.toString());
    }
    if (selectedMonth !== 'Todos') {
      result = result.filter(d => (d.fecha.getMonth() + 1).toString() === selectedMonth.toString());
    }
    if (searchTerm) {
      result = result.filter(d => 
        d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.clasificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [data, selectedUnit, selectedYear, selectedMonth, searchTerm]);

  // KPIs
  const totalIncidents = filteredData.length;
  
  // Data for Charts
  const unitsData = useMemo(() => {
    const counts = {};
    filteredData.forEach(d => {
      counts[d.unidad] = (counts[d.unidad] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
  }, [filteredData]);

  const classData = useMemo(() => {
    const counts = {};
    filteredData.forEach(d => {
      counts[d.clasificacion] = (counts[d.clasificacion] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredData]);

  const timelineData = useMemo(() => {
    const counts = {};
    filteredData.forEach(d => {
      counts[d.mesAño] = (counts[d.mesAño] || 0) + 1;
    });
    // Sort chronologically
    return Object.entries(counts).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  const uniqueUnits = useMemo(() => ['Todas', ...new Set(data.map(d => d.unidad))], [data]);
  
  const uniqueYears = useMemo(() => {
    const years = new Set(data.map(d => d.fecha.getFullYear()));
    return ['Todos', ...Array.from(years).sort((a,b) => b-a)];
  }, [data]);

  const uniqueMonths = useMemo(() => {
    const months = new Set(data.map(d => d.fecha.getMonth() + 1));
    return ['Todos', ...Array.from(months).sort((a,b) => a-b)];
  }, [data]);

  const COLORS = ['#00205b', '#fcd116', '#ef4444', '#10b981', '#3b82f6', '#f97316', '#8b5cf6'];

  return (
    <div className="container" style={{ maxWidth: '1400px' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>📈 Dashboard Credit 360</h1>
          <p style={{ color: 'var(--text-muted)' }}>Análisis de incidentes de seguridad e higiene</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📥 Cargar Excel</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </header>

      {error && (
        <div className="badge-danger" style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: 'var(--primary)' }}>Procesando archivo...</h2>
        </div>
      )}

      {!loading && data.length === 0 && !error && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>📊</span>
          <h2>Aún no hay datos para mostrar</h2>
          <p style={{ color: 'var(--text-muted)' }}>Por favor, carga el archivo "credit 360.xlsx" para visualizar el dashboard interactivo.</p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <>
          {/* Controles de Filtro */}
          <div className="glass-panel" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, minWidth: '150px', flex: 1 }}>
              <label>📍 Filtrar por Unidad (CD)</label>
              <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                {uniqueUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '120px', flex: 1 }}>
              <label>📅 Año</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '120px', flex: 1 }}>
              <label>📆 Mes</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                {uniqueMonths.map(m => (
                  <option key={m} value={m}>
                    {m === 'Todos' ? 'Todos' : new Date(2000, m - 1, 1).toLocaleString('es-CO', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '250px', flex: 1 }}>
              <label>🔍 Buscar Incidente (Nombre, Categoría...)</label>
              <input 
                type="text" 
                placeholder="Escribe para buscar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tarjetas KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ borderLeft: '4px solid var(--primary)' }}>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Incidentes</h3>
              <p style={{ fontSize: '3rem', fontWeight: '800', margin: '0.5rem 0', color: 'var(--primary)' }}>{totalIncidents}</p>
            </div>
            <div className="glass-panel" style={{ borderLeft: '4px solid var(--secondary)' }}>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Unidad más afectada</h3>
              <p style={{ fontSize: '1.8rem', fontWeight: '700', margin: '1rem 0 0.5rem 0', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {unitsData.length > 0 ? unitsData[0].name : 'N/A'}
              </p>
              {unitsData.length > 0 && <span className="badge badge-warning">{unitsData[0].count} reportes</span>}
            </div>
            <div className="glass-panel" style={{ borderLeft: '4px solid #ef4444' }}>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Clasificación Principal</h3>
              <p style={{ fontSize: '1.4rem', fontWeight: '700', margin: '1rem 0 0.5rem 0', color: 'var(--text-main)', lineHeight: 1.2 }}>
                {classData.length > 0 ? classData[0].name : 'N/A'}
              </p>
            </div>
          </div>

          {/* Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            
            {/* Gráfico de Barras: Unidades */}
            <div className="glass-panel" style={{ minHeight: '400px' }}>
              <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>📍 Incidentes por Unidad</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={unitsData.slice(0, 10)} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip cursor={{ fill: 'rgba(0,32,91,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Cantidad" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico Circular: Clasificación */}
            <div className="glass-panel" style={{ minHeight: '400px' }}>
              <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>🚨 Clasificación de Incidentes</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={classData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {classData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Línea: Tendencia */}
            <div className="glass-panel" style={{ minHeight: '400px', gridColumn: '1 / -1' }}>
              <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>📅 Tendencia de Incidentes a lo Largo del Tiempo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="count" stroke="var(--secondary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} name="Incidentes" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla de Datos */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1.5rem' }}>📋 Detalle de Reportes ({filteredData.length})</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Unidad</th>
                    <th>Clasificación</th>
                    <th>Categoría</th>
                    <th>Afectado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 100).map((item) => (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{item.fechaStr}</td>
                      <td><strong>{item.unidad}</strong></td>
                      <td>
                        <span className={`badge ${item.clasificacion.includes('Sin Lesión') ? 'badge-success' : 'badge-danger'}`}>
                          {item.clasificacion}
                        </span>
                      </td>
                      <td>{item.categoria}</td>
                      <td>{item.nombre} <br/><small style={{ color: 'var(--text-muted)' }}>{item.cargo}</small></td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No hay resultados para tu búsqueda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredData.length > 100 && (
              <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-muted)' }}>
                Se muestran solo los primeros 100 registros. Usa los filtros para ver otros específicos.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
