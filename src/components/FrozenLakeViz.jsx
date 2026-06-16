import { useState, useEffect, useRef } from "react";

const API_URL = "http://127.0.0.1:8000";

// Colores unificados para los estados de búsqueda
const STATE_COLOR = {
  current:  "#D85A30",  // Naranja --> nodo expandiéndose ahora
  path:     "#4CAF50",  // Verde --> el camino óptimo final
  frontier: "#AFA9EC",  // Morado --> nodos en la cola (Frontera)
  visited:  "#CECBF6",  // Azul/Violeta --> ya explorados
};

export default function FrozenLakeViz() {
  const [algorithm, setAlgorithm] = useState("bfs");
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(4);
  const [isEditing, setIsEditing] = useState(true);
  const [editTool, setEditTool] = useState("H"); 

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
  // ✨ Referencia para el auto-scroll vertical del contenedor de la tabla
  const tableContainerRef = useRef(null); 
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

  // ✨ Auto-scroll vertical automático para la tabla cuando avanza la animación
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [stepIdx]);

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
      flexDirection: "column",
      gap: "24px", 
      width: "100%",
      maxWidth: "1400px", 
      margin: "0 auto",
      boxSizing: "border-box"
    }}>

      {/* 🏙️ SECCIÓN SUPERIOR: CONFIGURACIÓN + TABLERO INTERACTIVO */}
      <div style={{ display: "flex", gap: "30px", width: "100%", alignItems: "flex-start" }}>
        
        {/*COLUMNA 1: CONFIGURACIÓN */}
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
          
          {/* Selector de Algoritmo */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>ALGORITMO DE BÚSQUEDA</span>
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

          {/* Dimensiones */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>DIMENSIONES</span>
            <div style={{ display: "flex", gap: "10px" }}>
              <label style={{ fontSize: "13px", color: "#1e293b", flex: 1 }}>
                Filas: <input type="number" min="3" max="8" value={rows} onChange={(e) => setRows(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1"}}
                disabled={!isEditing} />
                </label>
              <label style={{ fontSize: "13px", color: "#1e293b", flex: 1 }}>
                Columnas: <input type="number" min="3" max="8" value={cols} onChange={(e) => setCols(Number(e.target.value))}
                style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                disabled={!isEditing} />
                </label>
            </div>
          </div>

          {/* Brochas de Diseño */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>HERRAMIENTA DE DISEÑO</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { id: "H", label: "Hoyo (X)", color: "#2196F3" },
                { id: "S", label: "Inicio (S)", color: "#4CAF50" },
                { id: "G", label: "Meta (G)", color: "#FF9800" }
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setEditTool(tool.id)}
                  disabled={!isEditing}
                  style={{
                    flex: 1, padding: "8px 4px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "bold", 
                    cursor: isEditing ? "pointer" : "not-allowed",
                    background: editTool === tool.id ? tool.color : "#f1f5f9",
                    color: editTool === tool.id ? "#fff" : "#64748b",
                    transition: "all 0.15s"
                  }}
                >
                  {tool.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => { setIsEditing(true); setData(null); setStepIdx(-1); setRunning(false); }} 
            style={{ padding: "10px", background: isEditing ? "#EEEDFE" : "#fff", color: "#534AB7", border: "1px solid #C4C0F0", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
          >
            {isEditing ? "Modo: Diseñando" : "Volver a Diseñar"}
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>LEYENDA DE EJECUCIÓN</span>
            {[
              [STATE_COLOR.current, "Posición del Agente"],
              [STATE_COLOR.frontier, "Frontera (Cola/Pila)"],
              [STATE_COLOR.visited, "Casilla Analizada"],
              [STATE_COLOR.path, "Camino Solución"],
            ].map(([color, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#334155" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: color, border: "1px solid #e2e8f0" }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* 🎮 COLUMNA 2: TABLERO CENTRAL (Se expande horizontalmente al máximo) */}
        <div style={{ 
          flex: "1", 
          background: "#ffffff",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "flex-start",
          gap: "24px" 
        }}>
          {error && <div style={{ background: "#FEF2F2", color: "#991B1B", padding: "12px", borderRadius: "8px", fontSize: "13px" }}>⚠ {error}</div>}

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

              if (cell === 'S') { cellBg = "#4CAF50"; cellText = "S"; }
              else if (cell === 'G') { cellBg = "#FF9800"; cellText = "G"; }
              else if (cell === 'H') { cellBg = "#2196F3"; cellText = "✕"; }

              if (currentStep) {
                if (currentStep.solution_path && currentStep.solution_path.includes(pos)) {
                  cellBg = STATE_COLOR.path; 
                  cellText = cell === 'G' ? "G" : "✔";
                } else if (currentStep.current === pos) {
                  cellBg = STATE_COLOR.current; 
                  cellText = <img src="/hacker.png" alt="Hacker" style={{ width: "45px", height: "45px", objectFit: "contain" }} />;
                } else if (currentStep.frontier && currentStep.frontier.includes(pos)) {
                  cellBg = STATE_COLOR.frontier;
                } else if (currentStep.visited && currentStep.visited.includes(pos)) {
                  cellBg = STATE_COLOR.visited;
                }
              }

              return (
                <div
                  key={pos}
                  onClick={() => {
                    if (!isEditing) return;
                    const nuevoMapa = [...gridMap.map(rowArr => [...rowArr])];
                    const valorActual = nuevoMapa[r][c];

                    if (editTool === "H") {
                      if (valorActual === 'S' || valorActual === 'G') return;
                      nuevoMapa[r][c] = valorActual === 'F' ? 'H' : 'F';
                    } else if (editTool === "S") {
                      if (valorActual === 'G') return;
                      for (let i = 0; i < rows; i++) {
                        for (let j = 0; j < cols; j++) { if (nuevoMapa[i][j] === 'S') nuevoMapa[i][j] = 'F'; }
                      }
                      nuevoMapa[r][c] = 'S';
                    } else if (editTool === "G") {
                      if (valorActual === 'S') return;
                      for (let i = 0; i < rows; i++) {
                        for (let j = 0; j < cols; j++) { if (nuevoMapa[i][j] === 'G') nuevoMapa[i][j] = 'F'; }
                      }
                      nuevoMapa[r][c] = 'G';
                    }
                    setGridMap(nuevoMapa);
                  }}
                  style={{
                    width: "75px", height: "75px", background: cellBg, display: "flex", 
                    flexDirection: "column", justifyContent: "center", alignItems: "center", 
                    borderRadius: "8px", fontWeight: "bold", fontSize: "16px",
                    cursor: isEditing ? "pointer" : "default",
                    border: "1px solid rgba(0,0,0,0.05)", transition: "all 0.15s"
                  }}
                >
                  <span>{cellText}</span>
                  <span style={{ fontSize: "9px", opacity: 0.4, marginTop: "2px", color: "#000" }}>{`[${r},${c}]`}</span>
                </div>
              );
            })}
          </div>

          {/* Un solo botón para Play/Pause */}
          <div style={{ display: "flex", gap: "8px", background: "#1e293b", padding: "8px 16px", borderRadius: "30px" }}>
            {running ? (
              <button onClick={() => setRunning(false)} style={{ padding: "8px 18px", background: "#ef4444", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>⏸ Pausar</button>
            ) : (
              <button onClick={handleRun} disabled={loading} style={{ padding: "8px 18px", background: "#10b981", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
                {loading ? "Calculando..." : "▶ Ejecutar"}
              </button>
            )}
            <button onClick={() => { setRunning(false); setStepIdx(-1); }} style={{ padding: "8px 18px", background: "#64748b", color: "white", border: "none", borderRadius: "20px", cursor: "pointer" }}>↺ Reiniciar</button>
          </div>
        </div>

      </div>

      {/* 🪵 📊 SECCIÓN INFERIOR: TABLA DE PASOS COMPLETA */}
      <div style={{ 
        width: "100%", 
        background: "#ffffff", 
        padding: "24px", 
        borderRadius: "16px", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        boxSizing: "border-box"
      }}>
        <h4 style={{ margin: "0", color: "#1e293b", fontSize: "14px", fontWeight: "700", letterSpacing: "0.5px" }}>
          TABLA DE SEGUIMIENTO E INSPECCIÓN DE ESTADOS ({algorithm.toUpperCase()})
        </h4>
        
        {/* Contenedor vertical de la tabla con altura fija para scroll */}
        <div 
          ref={tableContainerRef}
          style={{ 
            maxHeight: "260px", 
            overflowY: "auto", 
            borderRadius: "8px", 
            border: "1px solid #e2e8f0" 
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontFamily: "system-ui, sans-serif" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0, zIndex: 1 }}>
                <th style={{ padding: "12px 16px", width: "100px", color: "#475569", fontWeight: "700" }}>Paso</th>
                <th style={{ padding: "12px 16px", color: "#475569", fontWeight: "700" }}>Descripción del Estado Evaluado</th>
              </tr>
            </thead>
            <tbody>
              {stepIdx < 0 ? (
                <tr>
                  <td colSpan="2" style={{ padding: "20px", textAlgin: "center", color: "#94a3b8", fontStyle: "italic", textAlign: "center" }}>
                    Aquí aparecerán los pasos de la ejecución una vez que inicies el algoritmo. Cada fila representa un estado evaluado, mostrando su posición en la secuencia y una breve descripción de lo que ocurre en ese paso.
                  </td>
                </tr>
              ) : (
                data?.steps?.slice(0, stepIdx + 1).map((s, i) => {
                  const esUltimoPaso = i === stepIdx;
                  return (
                    <tr 
                      key={i} 
                      style={{ 
                        borderBottom: "1px solid #f1f5f9",
                        background: esUltimoPaso ? "#EEEDFE" : "transparent",
                        color: esUltimoPaso ? "#534AB7" : "#334155",
                        fontWeight: esUltimoPaso ? "600" : "400",
                        transition: "all 0.15s"
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>
                        #{String(s.step).padStart(2, "0")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {s.message}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}