"use client";

import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";

const CHART_COLORS = [
  "#00205b", "#fcd116", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#f59e0b", "#06b6d4", "#64748b"
];

export default function ExcelDashboardPage() {
  // Workbook & Data State
  const [fileInfo, setFileInfo] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Samples State
  const [sampleFiles, setSampleFiles] = useState([]);
  const [loadingSample, setLoadingSample] = useState("");

  // Chart Configuration State
  const [xAxisCol, setXAxisCol] = useState("");
  const [yAxisCol, setYAxisCol] = useState("");
  const [aggregateMode, setAggregateMode] = useState("count"); // 'count' | 'sum' | 'avg'
  const [chartType, setChartType] = useState("bar"); // 'bar' | 'line' | 'area' | 'horizontal_bar'
  const [pieCol, setPieCol] = useState("");

  // Table & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCol, setFilterCol] = useState("");
  const [filterVal, setFilterVal] = useState("");
  const [sortCol, setSortCol] = useState("");
  const [sortDir, setSortDir] = useState("asc"); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'charts' | 'table' | 'columns'

  // Fetch available server sample files
  useEffect(() => {
    fetch("/api/excel-samples")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSampleFiles(data);
      })
      .catch((err) => console.error("Error cargando muestras:", err));
  }, []);

  // Parse Excel file from ArrayBuffer
  const processArrayBuffer = (buffer, name) => {
    try {
      setLoading(true);
      setErrorMsg("");
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      
      if (wb.SheetNames.length > 0) {
        const firstSheet = wb.SheetNames[0];
        setActiveSheet(firstSheet);
        loadSheetData(wb, firstSheet);
      }
      setFileInfo({ name, size: `${(buffer.byteLength / 1024).toFixed(1)} KB` });
    } catch (err) {
      console.error("Error al procesar el archivo Excel:", err);
      setErrorMsg("Error al leer el archivo. Asegúrate de que sea un Excel (.xlsx, .xls) o CSV válido.");
    } finally {
      setLoading(false);
    }
  };

  // Load data from specific sheet
  const loadSheetData = (wb, sheetName) => {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return;

    // Convert sheet to JSON rows
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (json.length === 0) {
      setRawData([]);
      setHeaders([]);
      return;
    }

    // Extract headers
    const cols = Object.keys(json[0]);
    setHeaders(cols);
    setRawData(json);

    // Auto select chart default columns
    const numericCols = cols.filter((c) =>
      json.some((row) => typeof row[c] === "number" || (!isNaN(Number(row[c])) && row[c] !== ""))
    );
    const categoryCols = cols.filter((c) => !numericCols.includes(c));

    const defaultX = categoryCols.length > 0 ? categoryCols[0] : cols[0];
    const defaultY = numericCols.length > 0 ? numericCols[0] : "";

    setXAxisCol(defaultX);
    setPieCol(defaultX);
    setYAxisCol(defaultY);
    if (defaultY) setAggregateMode("sum");
    else setAggregateMode("count");
    setCurrentPage(1);
  };

  // Change sheet
  const handleSheetChange = (sheetName) => {
    setActiveSheet(sheetName);
    if (workbook) {
      loadSheetData(workbook, sheetName);
    }
  };

  // File Upload Handlers
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target.result;
      processArrayBuffer(buffer, file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  // Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target.result;
      processArrayBuffer(buffer, file.name);
    };
    reader.readAsArrayBuffer(file);
  };

  // Load Sample File
  const handleLoadSample = async (sample) => {
    try {
      setLoadingSample(sample.id);
      setErrorMsg("");
      const res = await fetch(`/api/excel-samples?file=${sample.fileName}`);
      if (!res.ok) throw new Error("No se pudo obtener el archivo de muestra");
      const buffer = await res.arrayBuffer();
      processArrayBuffer(buffer, sample.fileName);
    } catch (err) {
      setErrorMsg(`Error cargando muestra ${sample.name}: ${err.message}`);
    } finally {
      setLoadingSample("");
    }
  };

  // Column Analysis & Types
  const columnAnalysis = useMemo(() => {
    if (!rawData.length || !headers.length) return [];

    return headers.map((col) => {
      let numCount = 0;
      let stringCount = 0;
      let emptyCount = 0;
      let sum = 0;
      let min = Infinity;
      let max = -Infinity;
      const uniqueValues = new Set();

      rawData.forEach((row) => {
        const val = row[col];
        if (val === "" || val === null || val === undefined) {
          emptyCount++;
        } else {
          uniqueValues.add(String(val));
          const num = Number(val);
          if (!isNaN(num) && typeof val !== "boolean") {
            numCount++;
            sum += num;
            if (num < min) min = num;
            if (num > max) max = num;
          } else {
            stringCount++;
          }
        }
      });

      const isNumeric = numCount > stringCount && numCount > 0;
      const avg = isNumeric && numCount > 0 ? sum / numCount : null;

      return {
        name: col,
        type: isNumeric ? "Número" : "Texto / Categoría",
        emptyCount,
        uniqueCount: uniqueValues.size,
        sum: isNumeric ? sum : null,
        min: isNumeric && min !== Infinity ? min : null,
        max: isNumeric && max !== -Infinity ? max : null,
        avg: isNumeric ? avg : null,
        samples: Array.from(uniqueValues).slice(0, 4).join(", ")
      };
    });
  }, [rawData, headers]);

  // Derived Filtered Data
  const filteredData = useMemo(() => {
    return rawData.filter((row) => {
      // Global search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesGlobal = headers.some((h) =>
          String(row[h] ?? "").toLowerCase().includes(term)
        );
        if (!matchesGlobal) return false;
      }
      // Specific column filter
      if (filterCol && filterVal) {
        const cellVal = String(row[filterCol] ?? "").toLowerCase();
        if (!cellVal.includes(filterVal.toLowerCase())) return false;
      }
      return true;
    });
  }, [rawData, headers, searchTerm, filterCol, filterVal]);

  // Sorted Data for Table
  const sortedData = useMemo(() => {
    if (!sortCol) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortCol] ?? "";
      const valB = b[sortCol] ?? "";

      const numA = Number(valA);
      const numB = Number(valB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === "asc" ? numA - numB : numB - numA;
      }
      return sortDir === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortCol, sortDir]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

  // Chart Data Generation
  const mainChartData = useMemo(() => {
    if (!xAxisCol || !filteredData.length) return [];

    const map = new Map();

    filteredData.forEach((row) => {
      let key = String(row[xAxisCol] ?? "Sin Dato").trim();
      if (!key) key = "(Vacío)";

      if (!map.has(key)) {
        map.set(key, { count: 0, sum: 0, values: [] });
      }

      const item = map.get(key);
      item.count += 1;

      if (yAxisCol) {
        const val = Number(row[yAxisCol]);
        if (!isNaN(val)) {
          item.sum += val;
          item.values.push(val);
        }
      }
    });

    const result = Array.from(map.entries()).map(([label, item]) => {
      let val = item.count;
      if (aggregateMode === "sum") val = item.sum;
      if (aggregateMode === "avg") val = item.values.length ? item.sum / item.values.length : 0;

      return {
        name: label.length > 20 ? label.slice(0, 18) + "..." : label,
        fullName: label,
        valor: Number(val.toFixed(2)),
        conteo: item.count
      };
    });

    // Sort by value descending and limit to top 20
    return result.sort((a, b) => b.valor - a.valor).slice(0, 20);
  }, [filteredData, xAxisCol, yAxisCol, aggregateMode]);

  // Pie Chart Data Generation
  const pieChartData = useMemo(() => {
    if (!pieCol || !filteredData.length) return [];
    const map = new Map();

    filteredData.forEach((row) => {
      let key = String(row[pieCol] ?? "Sin Dato").trim();
      if (!key) key = "(Vacío)";
      map.set(key, (map.get(key) || 0) + 1);
    });

    const total = filteredData.length;
    const sorted = Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        percent: ((value / total) * 100).toFixed(1)
      }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length > 7) {
      const top = sorted.slice(0, 6);
      const rest = sorted.slice(6).reduce((acc, curr) => acc + curr.value, 0);
      top.push({
        name: "Otros",
        value: rest,
        percent: ((rest / total) * 100).toFixed(1)
      });
      return top;
    }
    return sorted;
  }, [filteredData, pieCol]);

  // Export Filtered View to CSV
  const handleExportCSV = () => {
    if (!filteredData.length) return;
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeSheet || "Datos");
    XLSX.writeFile(wb, `Analisis_${activeSheet || "Excel"}.xlsx`);
  };

  const numericColumnsList = columnAnalysis.filter((c) => c.type === "Número");
  const categoryColumnsList = columnAnalysis.filter((c) => c.type !== "Número");

  return (
    <div className="container" style={{ maxWidth: "1400px" }}>
      {/* Header */}
      <header style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1>📊 Dashboard Dinámico & Analizador Excel</h1>
            <p style={{ color: "var(--text-muted)" }}>
              Carga tu archivo Excel o selecciona una muestra para analizar tus datos con gráficos interactivos.
            </p>
          </div>
          {rawData.length > 0 && (
            <button onClick={handleExportCSV} className="btn btn-primary" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              📥 Exportar Excel Filtrado
            </button>
          )}
        </div>
      </header>

      {/* Section 1: Upload & Preset Muestras */}
      <div className="glass-panel" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>📁 Cargar Datos o Elegir Muestra</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: "2px dashed var(--primary)",
              borderRadius: "12px",
              padding: "2rem 1.5rem",
              textAlign: "center",
              background: "rgba(0, 32, 91, 0.02)",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onClick={() => document.getElementById("excel-file-input")?.click()}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📤</div>
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", color: "var(--primary)" }}>
              Arrastra tu archivo Excel aquí o haz clic
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
              Soporta formatos .xlsx, .xls, .csv
            </p>
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <h4 style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              ⚡ O PROBAR CON ARCHIVOS EXISTENTES EN EL SISTEMA:
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {sampleFiles.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Cargando muestras...</p>
              ) : (
                sampleFiles.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleLoadSample(sample)}
                    disabled={loadingSample === sample.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justify: "space-between",
                      padding: "0.75rem 1rem",
                      background: fileInfo?.name === sample.fileName ? "var(--primary)" : "#ffffff",
                      color: fileInfo?.name === sample.fileName ? "#ffffff" : "var(--primary)",
                      border: "1px solid var(--surface-border)",
                      borderRadius: "8px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s"
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontSize: "1.2rem" }}>{sample.icon}</span>
                      <span>
                        {sample.name} <br />
                        <small style={{ opacity: 0.8, fontWeight: "normal" }}>{sample.category}</small>
                      </span>
                    </span>
                    <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                      {loadingSample === sample.id ? "Cargando..." : sample.sizeMB}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div style={{ marginTop: "1rem", padding: "1rem", background: "#fee2e2", color: "#991b1b", borderRadius: "8px" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Active File Info & Sheet Selector */}
        {fileInfo && (
          <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--surface-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "bold" }}>ARCHIVO ACTIVO:</span>
                <h3 style={{ margin: "0.2rem 0", fontSize: "1.2rem" }}>
                  📄 {fileInfo.name} <small style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>({fileInfo.size})</small>
                </h3>
              </div>

              {/* Sheet Navigation Pills */}
              {sheetNames.length > 1 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-muted)" }}>HOJAS:</span>
                  {sheetNames.map((sheet) => (
                    <button
                      key={sheet}
                      onClick={() => handleSheetChange(sheet)}
                      style={{
                        padding: "0.4rem 0.9rem",
                        borderRadius: "20px",
                        border: "1px solid var(--primary)",
                        background: activeSheet === sheet ? "var(--primary)" : "transparent",
                        color: activeSheet === sheet ? "#ffffff" : "var(--primary)",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        cursor: "pointer"
                      }}
                    >
                      📋 {sheet}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem" }}>
          <h2>⏳ Procesando datos del Excel...</h2>
        </div>
      ) : rawData.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <h3>📌 Ningún archivo cargado aún</h3>
          <p style={{ color: "var(--text-muted)", maxWidth: "500px", margin: "0.5rem auto 1.5rem auto" }}>
            Sube un archivo de Excel arriba o selecciona una de las muestras preexistentes (como Credit 360 o Botiquín Pereira) para generar el dashboard en vivo.
          </p>
        </div>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "2px solid var(--surface-border)", paddingBottom: "0.5rem" }}>
            <button
              onClick={() => setActiveTab("overview")}
              className="btn"
              style={{
                background: activeTab === "overview" ? "var(--primary)" : "transparent",
                color: activeTab === "overview" ? "#ffffff" : "var(--text-main)",
                borderRadius: "8px 8px 0 0"
              }}
            >
              📈 Resumen & KPIs
            </button>
            <button
              onClick={() => setActiveTab("charts")}
              className="btn"
              style={{
                background: activeTab === "charts" ? "var(--primary)" : "transparent",
                color: activeTab === "charts" ? "#ffffff" : "var(--text-main)",
                borderRadius: "8px 8px 0 0"
              }}
            >
              📊 Gráficos Personalizados
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className="btn"
              style={{
                background: activeTab === "table" ? "var(--primary)" : "transparent",
                color: activeTab === "table" ? "#ffffff" : "var(--text-main)",
                borderRadius: "8px 8px 0 0"
              }}
            >
              🔍 Explorador de Datos ({filteredData.length})
            </button>
            <button
              onClick={() => setActiveTab("columns")}
              className="btn"
              style={{
                background: activeTab === "columns" ? "var(--primary)" : "transparent",
                color: activeTab === "columns" ? "#ffffff" : "var(--text-main)",
                borderRadius: "8px 8px 0 0"
              }}
            >
              ⚙️ Análisis de Columnas ({headers.length})
            </button>
          </div>

          {/* TAB 1: OVERVIEW & KPIS */}
          {activeTab === "overview" && (
            <div>
              {/* KPI Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                <div className="glass-panel" style={{ padding: "1.25rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-muted)" }}>TOTAL REGISTROS</span>
                  <h2 style={{ fontSize: "2.2rem", margin: "0.25rem 0 0 0" }}>{rawData.length.toLocaleString()}</h2>
                  <small style={{ color: "var(--success)" }}>Filas procesadas</small>
                </div>

                <div className="glass-panel" style={{ padding: "1.25rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-muted)" }}>TOTAL COLUMNAS</span>
                  <h2 style={{ fontSize: "2.2rem", margin: "0.25rem 0 0 0" }}>{headers.length}</h2>
                  <small style={{ color: "var(--primary)" }}>Atributos detectados</small>
                </div>

                <div className="glass-panel" style={{ padding: "1.25rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-muted)" }}>COLUMNAS NUMÉRICAS</span>
                  <h2 style={{ fontSize: "2.2rem", margin: "0.25rem 0 0 0" }}>{numericColumnsList.length}</h2>
                  <small style={{ color: "var(--text-muted)" }}>Métricas sumables</small>
                </div>

                <div className="glass-panel" style={{ padding: "1.25rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-muted)" }}>COLUMNAS DE TEXTO</span>
                  <h2 style={{ fontSize: "2.2rem", margin: "0.25rem 0 0 0" }}>{categoryColumnsList.length}</h2>
                  <small style={{ color: "var(--text-muted)" }}>Categorías de análisis</small>
                </div>
              </div>

              {/* Quick Metrics Summary Cards for Top Numeric Columns */}
              {numericColumnsList.length > 0 && (
                <div className="glass-panel" style={{ marginBottom: "1.5rem" }}>
                  <h3>📐 Resumen Estadístico de Columnas Numéricas</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                    {numericColumnsList.slice(0, 6).map((col) => (
                      <div key={col.name} style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid var(--surface-border)" }}>
                        <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "var(--primary)" }}>{col.name}</h4>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                          <span>Suma Total:</span>
                          <strong>{col.sum?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                          <span>Promedio:</span>
                          <strong>{col.avg?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                          <span>Mín / Máx:</span>
                          <span>{col.min?.toLocaleString()} - {col.max?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Quick Chart */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "1.5rem" }}>
                <div className="glass-panel">
                  <h3>📊 Top Categorías por Frecuencia ({xAxisCol})</h3>
                  <div style={{ width: "100%", height: 350, marginTop: "1rem" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mainChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-25} textAnchor="end" height={60} interval={0} fontSize={11} />
                        <YAxis />
                        <Tooltip formatter={(val) => [val.toLocaleString(), aggregateMode.toUpperCase()]} labelFormatter={(name) => `Categoría: ${name}`} />
                        <Bar dataKey="valor" fill="#00205b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {pieChartData.length > 0 && (
                  <div className="glass-panel">
                    <h3>🍩 Distribución Porcentual ({pieCol})</h3>
                    <div style={{ width: "100%", height: 350, marginTop: "1rem" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            innerRadius={40}
                            label={(entry) => `${entry.name} (${entry.percent}%)`}
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => [val, "Cantidad"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMIZABLE CHARTS */}
          {activeTab === "charts" && (
            <div className="glass-panel">
              <h2>🎛️ Constructor de Gráficos Interactivos</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                Selecciona las variables y el tipo de gráfico para explorar correlaciones en tu Excel.
              </p>

              {/* Controls Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem", background: "#f8fafc", padding: "1.25rem", borderRadius: "8px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Eje X (Agrupar por)</label>
                  <select value={xAxisCol} onChange={(e) => setXAxisCol(e.target.value)}>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Métrica (Cálculo Y)</label>
                  <select value={aggregateMode} onChange={(e) => setAggregateMode(e.target.value)}>
                    <option value="count">Conteo de Registros</option>
                    <option value="sum">Suma de Valores</option>
                    <option value="avg">Promedio de Valores</option>
                  </select>
                </div>

                {aggregateMode !== "count" && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Columna Valor (Eje Y)</label>
                    <select value={yAxisCol} onChange={(e) => setYAxisCol(e.target.value)}>
                      <option value="">Selecciona columna...</option>
                      {numericColumnsList.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label>Tipo de Gráfico</label>
                  <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                    <option value="bar">📊 Barras Verticales</option>
                    <option value="horizontal_bar">📶 Barras Horizontales</option>
                    <option value="line">📈 Líneas / Tendencia</option>
                    <option value="area">🌊 Área Suavizada</option>
                  </select>
                </div>
              </div>

              {/* Render Selected Dynamic Chart */}
              <div style={{ width: "100%", height: 450, marginTop: "1rem" }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "line" ? (
                    <LineChart data={mainChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip formatter={(v) => [v.toLocaleString(), aggregateMode]} />
                      <Legend />
                      <Line type="monotone" dataKey="valor" stroke="#00205b" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  ) : chartType === "area" ? (
                    <AreaChart data={mainChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} />
                      <YAxis />
                      <Tooltip formatter={(v) => [v.toLocaleString(), aggregateMode]} />
                      <Area type="monotone" dataKey="valor" stroke="#00205b" fill="#fcd116" fillOpacity={0.6} />
                    </AreaChart>
                  ) : chartType === "horizontal_bar" ? (
                    <BarChart data={mainChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} fontSize={11} />
                      <Tooltip formatter={(v) => [v.toLocaleString(), aggregateMode]} />
                      <Bar dataKey="valor" fill="#fcd116" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={mainChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-25} textAnchor="end" height={70} interval={0} fontSize={11} />
                      <YAxis />
                      <Tooltip formatter={(v) => [v.toLocaleString(), aggregateMode]} labelFormatter={(name) => `Grupo: ${name}`} />
                      <Bar dataKey="valor" fill="#00205b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* TAB 3: DATA EXPLORER TABLE */}
          {activeTab === "table" && (
            <div className="glass-panel">
              {/* Search & Filter Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flex: 1, minWidth: "250px" }}>
                  <span>🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar en todo el Excel..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Column Filter */}
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <select value={filterCol} onChange={(e) => setFilterCol(e.target.value)} style={{ width: "160px" }}>
                    <option value="">Filtrar por columna...</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  {filterCol && (
                    <input
                      type="text"
                      placeholder={`Valor en ${filterCol}...`}
                      value={filterVal}
                      onChange={(e) => setFilterVal(e.target.value)}
                      style={{ width: "160px" }}
                    />
                  )}
                </div>

                {/* Page size */}
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <label style={{ margin: 0 }}>Mostrar:</label>
                  <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ width: "80px" }}>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="table-container" style={{ maxHeight: "600px", overflowY: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>#</th>
                      {headers.map((h) => (
                        <th
                          key={h}
                          onClick={() => {
                            if (sortCol === h) setSortDir(sortDir === "asc" ? "desc" : "asc");
                            else {
                              setSortCol(h);
                              setSortDir("asc");
                            }
                          }}
                          style={{ cursor: "pointer", whiteSpace: "nowrap" }}
                        >
                          {h} {sortCol === h ? (sortDir === "asc" ? "▲" : "▼") : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        {headers.map((h) => (
                          <td key={h} style={{ fontSize: "0.9rem" }}>
                            {row[h] !== undefined && row[h] !== null ? String(row[h]) : "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Mostrando {paginatedData.length} de {filteredData.length} registros filtrados
                </span>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="btn"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                  >
                    ◀ Anterior
                  </button>
                  <span style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="btn"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                  >
                    Siguiente ▶
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COLUMNS ANALYSIS */}
          {activeTab === "columns" && (
            <div className="glass-panel">
              <h2>⚙️ Estructura y Resumen Estadístico de Columnas</h2>
              <div className="table-container" style={{ marginTop: "1rem" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Columna</th>
                      <th>Tipo Detectado</th>
                      <th>Valores Únicos</th>
                      <th>Registros Vacíos</th>
                      <th>Suma Total</th>
                      <th>Promedio</th>
                      <th>Muestras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columnAnalysis.map((col) => (
                      <tr key={col.name}>
                        <td style={{ fontWeight: "bold" }}>{col.name}</td>
                        <td>
                          <span className={`badge ${col.type === "Número" ? "badge-success" : "badge-warning"}`}>
                            {col.type}
                          </span>
                        </td>
                        <td>{col.uniqueCount}</td>
                        <td>{col.emptyCount > 0 ? <span style={{ color: "#ef4444" }}>{col.emptyCount}</span> : "0"}</td>
                        <td>{col.sum !== null ? col.sum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"}</td>
                        <td>{col.avg !== null ? col.avg.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"}</td>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "250px" }}>{col.samples}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
