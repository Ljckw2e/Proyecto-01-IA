import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = "http://127.0.0.1:8000"; 

const S = {
  card: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "14px 16px" },
  btn: (active = false, primary = false) => ({
    padding: "8px 18px", borderRadius: 8, border: primary ? "none" : "1px solid #333",
    background: primary ? "#534AB7" : active ? "#262626" : "transparent",
    color: "#fff", fontWeight: active || primary ? 600 : 400, fontSize: 13, cursor: "pointer", transition: "all .15s",
  }),
  label: { fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase" },
  statVal: { fontSize: 22, fontWeight: 600, color: "#81d4fa" },
};

export default function QueensViz() {
  const [numQueens, setNumQueens] = useState(8);
  const [isEditing, setIsEditing] = useState(true);
  
  // Estado del usuario: un arreglo donde el índice es la columna y el valor es la fila
  const [userState, setUserState] = useState(Array(8).fill(-1)); 
  
  const [data, setData] = useState(null);
  const [stepIdx, setStepIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const intervalRef = useRef(null);
  const logRef = useRef(null);

  const currentStep = data?.steps[stepIdx] ?? null;
  const totalSteps = data?.steps?.length ?? 0;
  
  // Si estamos en animación usamos el estado de Python, si no, el del usuario
  const queenPositions = !isEditing && currentStep ? currentStep.state : userState;

  // Contar cuántas reinas ha puesto el usuario
  const queensPlaced = userState.filter(pos => pos !== -1).length;

  const fetchQueensHC = useCallback(async (mapaInicial) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/queens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num_queens: numQueens, initial_state: mapaInicial })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setStepIdx(0);
      return json;
    } catch (e) {
      setError("Error conectando con el servidor Python.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [numQueens]);

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

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [stepIdx]);

  const handleTileClick = (row, col) => {
    if (!isEditing) return;
    const nuevoEstado = [...userState];
    // Si da clic donde ya había una reina, la quita. Si no, la pone/mueve en esa columna
    nuevoEstado[col] = nuevoEstado[col] === row ? -1 : row;
    setUserState(nuevoEstado);
  };

  const handleRun = async () => {
    if (isEditing) {
      if (queensPlaced < numQueens) {
        setError(`Por favor coloca las ${numQueens} reinas antes de ejecutar.`);
        return;
      }
      setIsEditing(false);
      const res = await fetchQueensHC(userState);
      if (res && res.steps.length > 0) setRunning(true);
    } else {
      setRunning(true);
    }
  };

  const handleReset = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setStepIdx(-1);
    setData(null);
    setIsEditing(true);
  };

  const handleClearBoard = () => {
    handleReset();
    setUserState(Array(numQueens).fill(-1));
  };

  // Reajustar tablero si cambia N
  useEffect(() => {
    setUserState(Array(numQueens).fill(-1));
    handleReset();
  }, [numQueens]);

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
      
      {/* SECCIÓN IZQUIERDA: Tablero */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13, justify_content: "space-between" }}>
          <label>Dimensiones (N): 
            <input type="number" min="4" max="10" value={numQueens} 
                   onChange={(e) => setNumQueens(Number(e.target.value))} 
                   disabled={!isEditing}
                   style={{ width: 50, padding: "4px 8px", marginLeft: 8, background: "#222", border: "1px solid #444", color: "#fff", borderRadius: 4 }} />
          </label>
          <span style={{ color: "#888" }}>
            {isEditing ? `Colocadas: ${queensPlaced} / ${numQueens}` : "Modo Animación"}
          </span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${numQueens}, minmax(40px, 55px))`,
          gap: 2,
          background: "#2a2a2a",
          padding: 6,
          borderRadius: 8,
        }}>
          {Array(numQueens).fill(null).map((_, row) => 
            Array(numQueens).fill(null).map((_, col) => {
              const isDark = (row + col) % 2 === 1;
              const hasQueen = queenPositions[col] === row;
              // Resaltar la columna que se está optimizando de izquierda a derecha en este paso
              const isCurrentCol = currentStep?.current_column === col;

              return (
                <div 
                  key={`${row}-${col}`} 
                  onClick={() => handleTileClick(row, col)}
                  style={{
                    aspectRatio: "1",
                    background: isCurrentCol 
                      ? "#1E3A8A" 
                      : (isDark ? "#4B382A" : "#8B7355"),
                    border: isCurrentCol ? "2px solid #3B82F6" : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: numQueens > 8 ? "1.5rem" : "2rem",
                    borderRadius: 2,
                    cursor: isEditing ? "pointer" : "default",
                    userSelect: "none"
                  }}
                >
                  {hasQueen ? "👑" : ""}
                </div>
              );
            })
          )}
        </div>

        {/* Controles */}
        <div style={{ display: "flex", gap: 8 }}>
          {isEditing ? (
            <button style={S.btn(false, true)} onClick={handleRun} disabled={queensPlaced < numQueens || loading}>
              ▶ Ejecutar Búsqueda
            </button>
          ) : !running ? (
            <button style={S.btn(false, true)} onClick={handleRun}>▶ Reanudar</button>
          ) : (
            <button style={S.btn(false, true)} onClick={() => setRunning(false)}>⏸ Pausar</button>
          )}
          <button style={S.btn()} onClick={() => setStepIdx(p => Math.min(p + 1, totalSteps - 1))} disabled={running || isEditing || stepIdx >= totalSteps - 1}>Paso →</button>
          <button style={S.btn()} onClick={handleReset}>✍ Rediseñar</button>
          <button style={S.btn()} onClick={handleClearBoard} disabled={!isEditing}>Limpiar</button>
        </div>
      </div>

      {/* SECCIÓN DERECHA: Datos del algoritmo */}
      <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
        {error && <div style={{ ...S.card, background: "#FEF2F2", color: "#991B1B" }}>⚠ {error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <div style={S.card}>
            <div style={S.label}>Paso / Movimiento</div>
            <div style={S.statVal}>{stepIdx < 0 ? "—" : `${stepIdx} / ${totalSteps - 1}`}</div>
          </div>
          <div style={{ ...S.card, background: currentStep?.attacks === 0 ? "#143A28" : "#1a1a1a" }}>
            <div style={S.label}>Conflictos (Ataques)</div>
            <div style={{ ...S.statVal, color: currentStep?.attacks === 0 ? "#5DCAA5" : "#EF9F27" }}>{currentStep ? currentStep.attacks : "—"}</div>
          </div>
        </div>

        <div style={{ ...S.card, background: "#1E1B4B", borderColor: "#312E81", fontSize: 13, color: "#C7D2FE" }}>
          <strong>Hill Climbing — Escaneo Horizontal</strong><br />
          {isEditing 
            ? "¡Diseña el escenario! Haz clic en las casillas para acomodar exactamente una reina por columna."
            : "Python está optimizando de izquierda a derecha. Se analiza la columna marcada en azul para mover su reina a la fila con menor conflicto en esa franja."}
        </div>

        {/* Log */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={S.label}>Historial de Escaneo</div>
          <div ref={logRef} style={{ height: 160, overflowY: "auto", ...S.card, fontFamily: "monospace", fontSize: 12, background: "#111" }}>
            {isEditing ? (
              <span style={{ color: "#555" }}>Esperando que posiciones las reinas en el tablero...</span>
            ) : stepIdx < 0 ? (
              <span style={{ color: "#555" }}>Cargando datos...</span>
            ) : (
              data?.steps?.slice(0, stepIdx + 1).map((s, i) => (
                <div key={i} style={{ color: i === stepIdx ? "#fff" : "#555", fontWeight: i === stepIdx ? 600 : 400 }}>
                  [{s.step}] {s.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Estado de salida */}
        {data && stepIdx === totalSteps - 1 && (
          <div style={{
            ...S.card, 
            background: data.success ? "#064E3B" : "#7F1D1D", color: data.success ? "#A7F3D0" : "#FEE2E2", borderColor: data.success ? "#047857" : "#991B1B"
          }}>
            <strong>{data.success ? "✓ Meta Alcanzada" : "✗ Fin del Escaneo (Máximo Local)"}</strong>
            <br />El proceso horizontal terminó con {currentStep?.attacks} ataques.
          </div>
        )}
      </div>
    </div>
  );
}