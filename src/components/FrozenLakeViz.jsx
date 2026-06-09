import { useState, useEffect, useRef } from "react";

const API_URL = "http://127.0.0.1:8000";

// Colores unificados para los estados de búsqueda
const STATE_COLOR = {
  current:  "#D85A30",  // Naranja para el nodo expandiéndose ahora
  path:     "#4CAF50",  // Verde para el camino óptimo final
  frontier: "#AFA9EC",  // Morado para los nodos en la cola (Frontera)
  visited:  "#CECBF6",  // Azul/Violeta para los ya explorados
};

export default function FrozenLakeViz() {
  const [algorithm, setAlgorithm] = useState("bfs"); // ✨ ¡Revivido!
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [isEditing, setIsEditing] = useState(true);
  const [gridMap, setGridMap] = useState([
    ['S', 'F', 'F', 'F'],
    ['F', 'H', 'F', 'H'],
    ['F', 'F', 'F', 'H'],
    ['H', 'F', 'F', 'G']
  ]);

  const [data, setData] = useState(null);
  const [stepIdx, setStepIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(400);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const intervalRef = useRef(null);
  const totalSteps = data?.steps?.length ?? 0;

  useEffect(() => {
    const nuevoMapa = Array(rows).fill(null).map((_, r) =>
      Array(cols).fill(null).map((_, c) => {
        if (r === 0 && c === 0) return 'S';
        if (r === rows - 1 && c === cols - 1) return 'G';
        return 'F';
      })
    );
    setGridMap(nuevoMapa);
    setStepIdx(-1);
    setData(null);
  }, [rows, cols]);

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

  const handleRun = async () => {
    if (isEditing) {
      setIsEditing(false);
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/api/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ algorithm, rows, cols, grid: gridMap })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
        setStepIdx(0);
        if (json?.steps?.length > 0) setRunning(true);
      } catch (e) {
        setError("Error: Revisa la conexión con el servidor Python.");
        setIsEditing(true);
      } finally { 
        setLoading(false);
      }
    } else {
      if (stepIdx >= totalSteps - 1) setStepIdx(0);
      setRunning(true);
    }
  };

  const currentStep = data?.steps[stepIdx] ?? null;

  return (
    <div style={{ 
      display: "flex", 
      gap: "30px", 
      width: "100%",
      maxWidth: "1400px", 
      margin: "0 auto",
      boxSizing: "border-box"
    }}>

      {/* 📋 COLUMNA 1: CONFIGURACIÓN */}
      <div style={{ 
        width: "300px", 
        background: "#ffffff", 
        padding: "24px", 
        borderRadius: "16px", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        
        {/* ✨ NUEVO ACOMODO: El Selector de Algoritmo ahora está arriba del todo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "18px", fontWeight: "700", color: "#326ab8", letterSpacing: "0.5px" }}>ALGORITMO DE BÚSQUEDA</span>
          <div style={{ display: "flex", gap: "6px" }}>
            {["bfs", "dfs"].map((algo) => (
              <button 
                key={algo}
                onClick={() => { if (isEditing) setAlgorithm(algo); }}
                style={{ 
                  flex: 1, padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", 
                  cursor: isEditing ? "pointer" : "not-allowed",
                  background: algorithm === algo ? "#534AB7" : "#f1f5f9",
                  color: algorithm === algo ? "#fff" : "#64748b",
                  opacity: !isEditing && algorithm !== algo ? 0.5 : 1,
                  transition: "all 0.2s"
                }}
              >
                {algo.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <h3 style={{ margin: "10px 0 0 0", color: "#1e293b", fontSize: "18px", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" }}>
          Configuración del tablero
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>DIMENSIONES</span>
          <div style={{ display: "flex", gap: "10px" }}>
            <label style={{ fontSize: "13px", color: "#1e293b", flex: 1 }}>Filas: <input type="number" min="3" max="8" value={rows} onChange={(e) => setRows(Number(e.target.value))} style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }} disabled={!isEditing} /></label>
            <label style={{ fontSize: "13px", color: "#1e293b", flex: 1 }}>Columnas: <input type="number" min="3" max="8" value={cols} onChange={(e) => setCols(Number(e.target.value))} style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }} disabled={!isEditing} /></label>
          </div>
        </div>

        <button 
          onClick={() => { setIsEditing(true); setData(null); setStepIdx(-1); setRunning(false); }} 
          style={{ padding: "10px", background: isEditing ? "#EEEDFE" : "#fff", color: "#534AB7", border: "1px solid #C4C0F0", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
        >
          {isEditing ? "Modo: Diseñando" : "Volver a Diseñar"}
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>LEYENDA</span>
          {[
            ["#2196F3", "Hoyo (H)"],
            [STATE_COLOR.current, "Expandiendo"],
            [STATE_COLOR.frontier, "Frontera (Cola/Pila)"],
            [STATE_COLOR.visited, "Ya Visitado"],
            [STATE_COLOR.path, "Camino Solución"],
          ].map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#334155" }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: color, border: "1px solid #e2e8f0" }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* 🎮 COLUMNA 2: TABLERO CENTRAL */}
      <div style={{ 
        flex: "2", 
        background: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        gap: "24px" 
      }}>
        {error && (
          <div style={{ background: "#FEF2F2", color: "#991B1B", padding: "12px", borderRadius: "8px", fontSize: "13px", border: "1px solid #FCA5A5" }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: `repeat(${cols}, 75px)`, 
          gap: "8px", 
          background: "#cbd5e1", 
          padding: "12px", 
          borderRadius: "14px"
        }}>
          {gridMap.flat().map((cell, pos) => {
            const r = Math.floor(pos / cols);
            const c = pos % cols;
            
            let cellBg = "#f1f5f9"; 
            let cellText = "";

            if (cell === 'S') { cellBg = "#e2e8f0"; cellText = "S"; }
            else if (cell === 'G') { cellBg = "#FF9800"; cellText = "G"; }
            else if (cell === 'H') { cellBg = "#2196F3"; cellText = "✕"; }

            if (currentStep) {
              if (currentStep.solution_path && currentStep.solution_path.includes(pos)) {
                cellBg = STATE_COLOR.path; 
                cellText = cell === 'G' ? "G" : "✔";
              } else if (currentStep.current === pos) {
                cellBg = STATE_COLOR.current; 
                cellText = (
                  <img src="/hacker.png" 
                    alt="Hacker Icon" 
                    style={{ 
                      width: "45px", 
                      height: "45px", 
                      objectFit: "contain"
                    }} 
                  />
                );
              } else if (currentStep.frontier && currentStep.frontier.includes(pos)) {
                cellBg = STATE_COLOR.frontier;
              } else if (currentStep.visited && currentStep.visited.includes(pos)) {
                cellBg = STATE_COLOR.visited;
              }
            } else {
              if (cell === 'S') cellBg = "#4CAF50";
            }

            return (
              <div
                key={pos}
                onClick={() => {
                  if (!isEditing) return;
                  if (cell === 'S' || cell === 'G') return;

                  const nuevoMapa = [...gridMap.map(rowArr => [...rowArr])];
                  nuevoMapa[r][c] = cell === 'F' ? 'H' : 'F';
                  setGridMap(nuevoMapa);
                }}
                style={{
                  width: "75px", height: "75px", background: cellBg, display: "flex", 
                  flexDirection: "column", justifyContent: "center", alignItems: "center", 
                  borderRadius: "8px", fontWeight: "bold", fontSize: "16px",
                  color: cellBg === "#f1f5f9" ? "#64748b" : "#fff",
                  cursor: isEditing && cell !== 'S' && cell !== 'G' ? "pointer" : "default",
                  border: "1px solid rgba(0,0,0,0.05)", transition: "all 0.15s"
                }}
              >
                <span>{cellText}</span>
                <span style={{ fontSize: "9px", opacity: 0.4, marginTop: "2px", color: "#000" }}>{`[${r},${c}]`}</span>
              </div>
            );
          })}
        </div>

        {/* Controles multimedia optimizados estilo reproductor */}
        <div style={{ display: "flex", gap: "8px", background: "#1e293b", padding: "8px 16px", borderRadius: "30px" }}>
          {running ? (
            <button 
              onClick={() => setRunning(false)} 
              style={{ 
                padding: "8px 18px", background: "#ef4444", color: "white", 
                border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              ⏸ Pausar
            </button>
          ) : (
            <button 
              onClick={handleRun} 
              disabled={loading} 
              style={{ 
                padding: "8px 18px", background: "#10b981", color: "white", 
                border: "none", borderRadius: "20px", fontWeight: "bold", 
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
            >
              {loading ? "Calculando..." : "▶ Ejecutar"}
            </button>
          )}

          <button 
            onClick={() => { setRunning(false); setStepIdx(-1); }} 
            style={{ 
              padding: "8px 18px", background: "#64748b", color: "white", 
              border: "none", borderRadius: "20px", cursor: "pointer" 
            }}
          >
            ↺ Reiniciar
          </button>
        </div>
      </div>

      {/* 🪵 COLUMNA 3: PANEL DE LOGS */}
      <div style={{ 
        flex: "1.2", 
        background: "#ffffff", 
        padding: "24px", 
        borderRadius: "16px", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column"
      }}>
        <h4 style={{ margin: "0 0 14px 0", color: "#1e293b", fontSize: "14px", fontWeight: "700", letterSpacing: "0.5px" }}>
          LÓGICA DE PASOS ({algorithm.toUpperCase()})
        </h4>
        <div style={{ flex: 1, minHeight: "350px", overflowY: "auto", background: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontFamily: "monospace", fontSize: "12px", color: "#334155" }}>
          {stepIdx < 0 ? (
            <span style={{ color: "#94a3b8" }}>Presiona "Ejecutar" para comenzar...</span>
          ) : (
            data?.steps?.slice(0, stepIdx + 1).map((s, i) => (
              <div key={i} style={{ marginBottom: "6px", color: i === stepIdx ? "#534AB7" : "#64748b", fontWeight: i === stepIdx ? "bold" : "normal" }}>
                [{s.step}] {s.message}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}