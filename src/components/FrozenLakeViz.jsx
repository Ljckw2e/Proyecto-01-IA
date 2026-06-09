/**
 * FrozenLakeViz.jsx
 * =================
 * Componente React que consume la API Python y visualiza paso a paso
 * la ejecución de BFS o DFS sobre el Frozen Lake dinámico.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ──────────────────────────────────────────────
// Constantes y helpers
// ──────────────────────────────────────────────

const API_URL = "http://127.0.0.1:8000"; 

/** Apariencia de cada tipo de celda en estado neutro */
const CELL_BASE = {
  S: { bg: "#1D9E75", label: "S",  text: "#fff" },
  G: { bg: "#EF9F27", label: "G",  text: "#412402" },
  H: { bg: "#185FA5", label: "✕",  text: "#fff" },
  F: { bg: "#DDE9F6", label: "",   text: "#185FA5" },
};

/** Colores de estado durante la búsqueda */
const STATE_COLOR = {
  current:  "#D85A30",  // nodo que se está expandiendo ahora
  path:     "#5DCAA5",  // celdas del camino solución
  frontier: "#AFA9EC",  // en la cola/pila
  visited:  "#CECBF6",  // ya explorado
};

/**
 * Decide el color de fondo de una celda dada la información del paso actual.
 */
function cellBg(cellType, pos, step) {
  if (!step) return CELL_BASE[cellType]?.bg ?? CELL_BASE.F.bg;

  const { current, visited = [], frontier = [], solution_path } = step;

  if (solution_path?.includes(pos)) return STATE_COLOR.path;
  if (pos === current)               return STATE_COLOR.current;
  if (frontier.includes(pos))        return STATE_COLOR.frontier;
  if (visited.includes(pos))         return STATE_COLOR.visited;

  return CELL_BASE[cellType]?.bg ?? CELL_BASE.F.bg;
}

const S = {
  card: {
    background: "#fff",
    border: "1px solid #E0DED6",
    borderRadius: 10,
    padding: "14px 16px",
  },
  btn: (active = false, primary = false) => ({
    padding: "8px 18px",
    borderRadius: 8,
    border: primary ? "none" : "1px solid #D0CEC6",
    background: primary ? "#534AB7" : active ? "#EEEDFE" : "transparent",
    color:  primary ? "#fff" : active ? "#534AB7" : "#444",
    fontWeight: active || primary ? 600 : 400,
    fontSize: 13,
    cursor: "pointer",
    transition: "opacity .15s",
  }),
  label: { fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase" },
  statVal: { fontSize: 22, fontWeight: 600, color: "#2C2C2A" },
};

// ──────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────

export default function FrozenLakeViz() {
  const [algorithm, setAlgorithm]   = useState("bfs");
  const [rows, setRows]             = useState(4);
  const [cols, setCols]             = useState(4);
  const [isEditing, setIsEditing]   = useState(true); 
  const [gridMap, setGridMap]       = useState([
    ['S', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'F'],
    ['F', 'F', 'F', 'G']
  ]);
  
  const [data, setData]             = useState(null);
  const [stepIdx, setStepIdx]       = useState(-1);
  const [running, setRunning]       = useState(false);
  const [speed, setSpeed]           = useState(600);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  const intervalRef = useRef(null);
  const logRef      = useRef(null);

  const currentStep = data?.steps[stepIdx] ?? null;
  const totalSteps  = data?.steps?.length   ?? 0;

  // ── Fetch pasos desde la API Corregido ──────────────────────────────────
  const fetchSteps = useCallback(async (algo, mapaActual) => {
    setLoading(true);
    setError("");
    try {
      // ✨ Corregido: Ahora llama a fetch nativo y apunta a la URL correcta
      const res = await fetch(`${API_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          algorithm: algo,
          rows: rows,
          cols: cols,
          grid: mapaActual
        })
      });

      if (!res.ok) {
        const errDetail = await res.json().catch(() => ({}));
        console.error("Error devuelto por FastAPI:", errDetail);
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      setData(json);
      setStepIdx(-1);
      return json; // Retorna el json para sincronizar la animación
    } catch (e) {
      console.error("Detalle del error en petición:", e);
      setError("Error conectando con el servidor Python o mapa sin solución.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [rows, cols]);

  // Regenerar el mapa limpio al cambiar dimensiones
  useEffect(() => {
    const nuevoMapa = Array(rows).fill(null).map((_, r) => 
      Array(cols).fill(null).map((_, c) => {
        if (r === 0 && c === 0) return 'S'; 
        if (r === rows - 1 && c === cols - 1) return 'G'; 
        return 'F'; 
      })
    );
    setGridMap(nuevoMapa);
    handleReset();
    setData(null);
  }, [rows, cols]);

  // ✨ Corregido: Se eliminó el useEffect intruso que cargaba automáticamente al inicio

  // Auto-scroll del log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [stepIdx]);

  // ── Animación automática ─────────────────────────────────────────────────
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

  // ── Controles Corregidos con Async/Await ─────────────────────────────────
  const handleRun = async () => {
    if (isEditing) {
      setIsEditing(false);
      // Esperamos la respuesta real de Python antes de lanzar la animación
      const resultado = await fetchSteps(algorithm, gridMap);
      if (resultado && resultado.steps && resultado.steps.length > 0) {
        setRunning(true);
      }
    } else {
      if (stepIdx >= totalSteps - 1) setStepIdx(-1);
      setRunning(true);
    }
  };

  const handlePause = () => setRunning(false);

  const handleStep = () => {
    setRunning(false);
    setStepIdx((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const handleReset = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setStepIdx(-1);
  };

  const handleAlgo = (algo) => {
    if (algo === algorithm) return;
    handleReset();
    setAlgorithm(algo);
  };

  return (
    <div style={{ display: "flex", gap: 24, maxWidth: 900, flexWrap: "wrap" }}>

      {/* ══ COLUMNA IZQUIERDA: cuadrícula + controles ══ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Selector de algoritmo */}
        <div style={{ display: "flex", gap: 8 }}>
          {["bfs", "dfs"].map((algo) => (
            <button key={algo} style={S.btn(algorithm === algo)} onClick={() => handleAlgo(algo)}>
              {algo.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Cuadrícula Dinámica */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
  
          {/* Controles de tamaño del tablero */}
          <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13 }}>
            <label>Filas: <input type="number" min="3" max="10" value={rows} onChange={(e) => setRows(Number(e.target.value))} style={{ width: 50, padding: 4 }} disabled={!isEditing} /></label>
            <label>Columnas: <input type="number" min="3" max="10" value={cols} onChange={(e) => setCols(Number(e.target.value))} style={{ width: 50, padding: 4 }} disabled={!isEditing} /></label>
            <button style={S.btn(isEditing)} onClick={() => { handleReset(); setIsEditing(true); setData(null); }}>✏️ Diseñar Laberinto</button>
          </div>

          {/* Renderizado de la matriz */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 80px)`,
            gap: 5,
          }}>
            {gridMap.flat().map((cell, pos) => {
              const row = Math.floor(pos / cols), col = pos % cols;
              const base = CELL_BASE[cell] ?? CELL_BASE.F;
              const bg   = cellBg(cell, pos, currentStep);
              const isCurrent = currentStep?.current === pos;
              const isPath    = currentStep?.solution_path?.includes(pos);

              return (
                <div
                  key={pos}
                  onClick={() => {
                    if (!isEditing) return;
                    if (cell === 'S' || cell === 'G') return; 
                    
                    const nuevoMapa = [...gridMap.map(r => [...r])];
                    nuevoMapa[row][col] = cell === 'F' ? 'H' : 'F';
                    setGridMap(nuevoMapa);
                  }}
                  style={{
                    width: 80, height: 80,
                    background: bg,
                    borderRadius: 9,
                    border: isCurrent ? "2.5px solid #D85A30" : isPath ? "2.5px solid #1D9E75" : "1px solid rgba(0,0,0,0.07)",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    cursor: isEditing ? "pointer" : "default",
                    userSelect: "none",
                    transform: isEditing && cell !== 'S' && cell !== 'G' ? "scale(0.98)" : "none"
                  }}
                >
                  <span style={{ fontSize: 26, fontWeight: 700, color: base.text, lineHeight: 1 }}>
                    {base.label}
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(0,0,0,0.3)", marginTop: 4 }}>
                    [{row},{col}]
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controles de reproducción */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!running
            ? <button style={S.btn(false, true)} onClick={handleRun} disabled={loading}>▶ Ejecutar</button>
            : <button style={S.btn(false, true)} onClick={handlePause}>⏸ Pausar</button>
          }
          <button style={S.btn()} onClick={handleStep}
            disabled={running || !data || stepIdx >= totalSteps - 1}>
            Paso →
          </button>
          <button style={S.btn()} onClick={handleReset}>↺ Reiniciar</button>
        </div>

        {/* Control de velocidad */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#666" }}>
          <span>Velocidad</span>
          <input
            type="range" min={100} max={1200} step={100}
            value={1300 - speed}
            onChange={(e) => setSpeed(1300 - Number(e.target.value))}
            style={{ width: 100 }}
          />
          <span style={{ width: 44, color: "#333" }}>
            {speed <= 300 ? "Rápido" : speed <= 700 ? "Normal" : "Lento"}
          </span>
        </div>

        {/* Leyenda */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px" }}>
          {[
            ["#1D9E75", "Inicio (S)"],
            ["#EF9F27", "Meta (G)"],
            ["#185FA5", "Hoyo (H)"],
            [STATE_COLOR.current,  "Expandiendo"],
            [STATE_COLOR.visited,  "Visitado"],
            [STATE_COLOR.frontier, "Frontera"],
            [STATE_COLOR.path,     "Camino"],
          ].map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555" }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color, border: "1px solid rgba(0,0,0,0.1)" }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ══ COLUMNA DERECHA: stats + info + log ══ */}
      <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Error */}
        {error && (
          <div style={{ ...S.card, background: "#FEF2F2", borderColor: "#FCA5A5", color: "#991B1B", fontSize: 13, lineHeight: 1.6 }}>
            ⚠ {error}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            ["Paso",      stepIdx < 0 ? "—" : `${stepIdx + 1} / ${totalSteps}`],
            ["Visitados", currentStep?.visited?.length ?? "—"],
            ["Frontera",  currentStep?.frontier?.length ?? "—"],
          ].map(([label, val]) => (
            <div key={label} style={{ ...S.card, textAlign: "center" }}>
              <div style={S.label}>{label}</div>
              <div style={S.statVal}>{val}</div>
            </div>
          ))}
        </div>

        {/* Info del algoritmo */}
        <div style={{ ...S.card, background: "#EEEDFE", borderColor: "#C4C0F0", fontSize: 13, lineHeight: 1.7, color: "#3C3489" }}>
          {algorithm === "bfs" ? (
            <>
              <strong>BFS — Búsqueda en Anchura</strong><br />
              Estructura: <em>Cola FIFO</em> (deque). Expande nivel a nivel.<br />
              ✓ Completo · ✓ Óptimo (sin weights) · T: O(b<sup>d</sup>) · S: O(b<sup>d</sup>)
            </>
          ) : (
            <>
              <strong>DFS — Búsqueda en Profundidad</strong><br />
              Estructura: <em>Pila LIFO</em>. Se hunde por una rama antes de retroceder.<br />
              ✓ Completo (con visitados) · ✗ No óptimo · T: O(b<sup>m</sup>) · S: O(b·m)
            </>
          )}
        </div>

        {/* Log de pasos */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ ...S.label, marginBottom: 6 }}>Log de pasos</div>
          <div
            ref={logRef}
            style={{
              height: 220,
              overflowY: "auto",
              ...S.card,
              fontFamily: "ui-monospace, monospace",
              fontSize: 12,
              lineHeight: 1.9,
              color: "#555",
            }}
          >
            {stepIdx < 0 ? (
              <span style={{ color: "#bbb" }}>Presiona "Ejecutar" para comenzar…</span>
            ) : (
              data?.steps?.slice(0, stepIdx + 1).map((s, i) => (
                <div
                  key={i}
                  style={{
                    color:      i === stepIdx ? "#2C2C2A" : "#999",
                    fontWeight: i === stepIdx ? 600 : 400,
                  }}
                >
                  [{String(s.step).padStart(2, "0")}] {s.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Camino solución */}
        {currentStep?.found && currentStep?.solution_path && (
          <div style={{ ...S.card, background: "#E1F5EE", borderColor: "#9FE1CB", fontSize: 13, color: "#04342C", lineHeight: 1.8 }}>
            <strong>✓ Solución encontrada</strong><br />
            {currentStep.solution_path.map((n, i) => {
              const r = Math.floor(n / cols), c = n % cols;
              return (
                <span key={i}>
                  [{r},{c}]{i < currentStep.solution_path.length - 1 ? " → " : ""}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}