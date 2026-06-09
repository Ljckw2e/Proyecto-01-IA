/**
 * SokobanViz.jsx
 * ==============
 * Panel interactivo para resolver Sokoban mediante búsqueda informada (A*).
 */

import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = "http://127.0.0.1:8000";

// ──────────────────────────────────────────────
// Estilos base y configuración de celdas
// ──────────────────────────────────────────────

const CELL_BASE = {
  W: { bg: "#4A4A4A", label: "🧱", text: "#fff" }, // Pared
  T: { bg: "#FFE0B2", label: "🎯", text: "#000" }, // Objetivo
  F: { bg: "#F5F5F5", label: "",   text: "#000" }, // Piso vacío
};

// ✨ Aquí está el objeto S que faltaba para los contenedores de logs y tarjetas
const S = {
  card: {
    background: "#fff",
    border: "1px solid #E0DED6",
    borderRadius: 10,
    padding: "14px 16px",
  }
};

// ──────────────────────────────────────────────
// Componente Principal
// ──────────────────────────────────────────────

export default function SokobanViz() {
  const [algorithm, setAlgorithm] = useState("astar");
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [isEditing, setIsEditing] = useState(true);
  const [gridMap, setGridMap] = useState([
    ['P', 'F', 'F', 'F', 'F'],
    ['F', 'W', 'B', 'F', 'F'],
    ['F', 'F', 'F', 'T', 'F'],
    ['F', 'F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F', 'F']
  ]);

  const [data, setData] = useState(null);
  const [stepIdx, setStepIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const intervalRef = useRef(null);
  const currentStep = data?.steps[stepIdx] ?? null;
  const totalSteps = data?.steps?.length ?? 0;

  // Re-calcular mapa base al cambiar dimensiones
  useEffect(() => {
    const nuevoMapa = Array(rows).fill(null).map((_, r) =>
      Array(cols).fill(null).map((_, c) => {
        if (r === 0 && c === 0) return 'P'; // Jugador fijo al inicio
        if (r === 2 && c === 3) return 'T'; // Objetivo base
        if (r === 1 && c === 2) return 'B'; // Caja base
        return 'F';
      })
    );
    setGridMap(nuevoMapa);
    setStepIdx(-1);
    setData(null);
  }, [rows, cols]);

  // Animación por intervalos
  useEffect(() => {
    if (!running || totalSteps <= 0) { 
      clearInterval(intervalRef.current); 
      return; 
    }
    intervalRef.current = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= totalSteps - 1) { 
          setRunning(false); 
          return prev; 
        }
        return prev + 1;
      });
    }, speed);
    return () => clearInterval(intervalRef.current);
  }, [running, speed, totalSteps]);

  const fetchSteps = useCallback(async (algo, mapaActual) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algorithm: algo, rows, cols, grid: mapaActual })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setStepIdx(-1);
      return json;
    } catch (e) {
      setError("Error en el A*: Revisa la conexión con Python o que el mapa no esté bloqueado.");
      return null;
    } finally { setLoading(false); }
  }, [rows, cols]);

  const handleRun = async () => {
    if (isEditing) {
      setIsEditing(false);
      const res = await fetchSteps(algorithm, gridMap);
      if (res?.steps?.length > 0) setRunning(true);
    } else {
      if (stepIdx >= totalSteps - 1) setStepIdx(-1);
      setRunning(true);
    }
  };

  // Renderizar qué objeto se dibuja según el paso actual de la búsqueda
  const renderCellContent = (row, col, cellBaseType) => {
    const posFlat = row * cols + col;
    
    if (currentStep) {
      const isPlayer = currentStep.current_player === posFlat;
      const isBox = currentStep.current_boxes.includes(posFlat);
      const isTarget = cellBaseType === 'T' || gridMap[row][col] === 'X';

      if (isPlayer) return "👷";
      if (isBox && isTarget) return "🟢"; // Caja sobre objetivo con éxito
      if (isBox) return "📦";
      if (isTarget) return "🎯";
      return "";
    }

    if (cellBaseType === 'P') return "👷";
    if (cellBaseType === 'B') return "📦";
    return CELL_BASE[cellBaseType]?.label ?? "";
  };

  return (
    <div style={{ 
      display: "flex", 
      gap: "24px", 
      maxWidth: "1200px", 
      margin: "0 auto",
      padding: "20px",
      fontFamily: "system-ui, sans-serif"
    }}>

      {/* 📋 1. BARRA LATERAL IZQUIERDA: CONFIGURACIÓN Y HERRAMIENTAS */}
      <div style={{ 
        width: "280px", 
        display: "flex", 
        flexDirection: "column", 
        gap: "20px",
        background: "#f8f9fa",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #e9ecef"
      }}>
        <h3 style={{ margin: "0 0 10px 0", color: "#333", borderBottom: "2px solid #ddd", paddingBottom: "8px" }}>
          ⚙️ Configuración
        </h3>

        {/* Selector de Algoritmo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#666" }}>ALGORITMO</span>
          <button style={{ padding: "10px", background: "#534AB7", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold" }}>
            A* (Distancia Manhattan)
          </button>
        </div>

        {/* Dimensiones del mapa */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#666" }}>DIMENSIONES</span>
          <div style={{ display: "flex", gap: "10px" }}>
            <label style={{ fontSize: "13px", color: "#333" }}>Filas: <input type="number" min="3" max="8" value={rows} onChange={(e) => setRows(Number(e.target.value))} style={{ width: "50px", padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }} disabled={!isEditing} /></label>
            <label style={{ fontSize: "13px", color: "#333" }}>Cols: <input type="number" min="3" max="8" value={cols} onChange={(e) => setCols(Number(e.target.value))} style={{ width: "50px", padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }} disabled={!isEditing} /></label>
          </div>
        </div>

        {/* Botón de Modo Edición */}
        <button 
          onClick={() => { setIsEditing(true); setData(null); setStepIdx(-1); }} 
          style={{ padding: "10px", background: isEditing ? "#EEEDFE" : "#fff", color: "#534AB7", border: "1px solid #C4C0F0", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
        >
          {isEditing ? "✏️ Diseñando..." : "🛠️ Volver a Diseñar"}
        </button>

        {/* Leyenda de colores */}
        <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #eee", paddingTop: "15px" }}>
          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#888" }}>LEYENDA</span>
          {[
            ["#4A4A4A", "🧱 Pared"],
            ["#FFE0B2", "🎯 Objetivo"],
            ["#F5F5F5", "📦 Caja suelta"],
            ["#F5F5F5", "🟢 Caja en Meta"],
            ["#F5F5F5", "👷 Jugador"]
          ].map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#444" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: color, border: "1px solid #ddd" }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* 🎮 2. ÁREA CENTRAL: EL TABLERO Y SU REPRODUCTOR */}
      <div style={{ 
        flex: "1", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        gap: "24px" 
      }}>
        
        {/* Error de backend */}
        {error && (
          <div style={{ background: "#FEF2F2", color: "#991B1B", padding: "12px", borderRadius: "8px", fontSize: "13px", border: "1px solid #FCA5A5" }}>
            ⚠ {error}
          </div>
        )}

        {/* El mapa de Sokoban */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: `repeat(${cols}, 70px)`, 
          gap: "6px", 
          background: "#E0DED6", 
          padding: "10px", 
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)"
        }}>
          {gridMap.flat().map((cell, pos) => {
            const r = Math.floor(pos / cols), c = pos % cols;
            const content = renderCellContent(r, c, cell);
            let bg = CELL_BASE[cell]?.bg ?? "#F5F5F5";
            if (cell === 'P' || cell === 'B') bg = "#F5F5F5";

            return (
              <div
                key={pos}
                onClick={() => {
                  if (!isEditing) return;
                  if (cell === 'P') return;
                  
                  const nuevoMapa = [...gridMap.map(rowArr => [...rowArr])];
                  if (cell === 'F') nuevoMapa[r][c] = 'W';
                  else if (cell === 'W') nuevoMapa[r][c] = 'B';
                  else if (cell === 'B') nuevoMapa[r][c] = 'T';
                  else nuevoMapa[r][c] = 'F';
                  setGridMap(nuevoMapa);
                }}
                style={{
                  width: "70px", height: "70px", background: bg, display: "flex", justifyContent: "center", alignItems: "center",
                  fontSize: "26px", cursor: isEditing ? "pointer" : "default", borderRadius: "8px",
                  transition: "all 0.2s", border: "1px solid rgba(0,0,0,0.05)"
                }}
              >
                {content}
              </div>
            );
          })}
        </div>

        {/* Controles del Reproductor */}
        <div style={{ display: "flex", gap: "10px", background: "#333", padding: "10px 20px", borderRadius: "30px" }}>
          <button onClick={handleRun} disabled={loading} style={{ padding: "8px 16px", background: "#4CAF50", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
            {loading ? "Calculando..." : "▶ Ejecutar A*"}
          </button>
          <button onClick={() => setRunning(false)} style={{ padding: "8px 16px", background: "#f44336", color: "white", border: "none", borderRadius: "20px", cursor: "pointer" }}>
            ⏸ Pausar
          </button>
          <button onClick={() => { setRunning(false); setStepIdx(-1); }} style={{ padding: "8px 16px", background: "#555", color: "white", border: "none", borderRadius: "20px", cursor: "pointer" }}>
            ↺ Reiniciar
          </button>
        </div>
      </div>

      {/* 🪵 3. BARRA LATERAL DERECHA: LOGS Y MÉTRICAS */}
      <div style={{ 
        width: "320px", 
        display: "flex", 
        flexDirection: "column", 
        gap: "14px" 
      }}>
        <div style={{ ...S.card, background: "#1E1E1E", color: "#fff", border: "none" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#81d4fa", fontSize: "13px", letterSpacing: "1px" }}>
            LOGS DE EXPANSIÓN A*
          </h4>
          <div style={{ height: "350px", overflowY: "auto", fontFamily: "monospace", fontSize: "12px", lineHeight: "1.8", color: "#ddd" }}>
            {stepIdx < 0 ? (
              <span style={{ color: "#666" }}>Diseña el mapa y presiona Ejecutar...</span>
            ) : (
              data?.steps?.slice(0, stepIdx + 1).map((s, i) => (
                <div key={i} style={{ marginBottom: "6px", color: i === stepIdx ? "#fff" : "#777", fontWeight: i === stepIdx ? "bold" : "normal" }}>
                  [{s.step}] {s.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}