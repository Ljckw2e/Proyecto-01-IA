import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = "http://127.0.0.1:8000"; 

export default function QueensViz() {
  const [numQueens, setNumQueens] = useState(8);
  const [isEditing, setIsEditing] = useState(true);
  const [userState, setUserState] = useState(Array(8).fill(-1)); 
  
  const [data, setData] = useState(null);
  const [stepIdx, setStepIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [speed] = useState(700); 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const intervalRef = useRef(null);

  const currentStep = data?.steps[stepIdx] ?? null;
  const totalSteps = data?.steps?.length ?? 0;
  
  const queenPositions = !isEditing && currentStep ? currentStep.state : userState;
  const queensPlaced = userState.filter(pos => pos !== -1).length;
  const activeConflicts = currentStep?.conflicts ?? [];

  const fetchQueensHC = useCallback(async (mapaInicial) => {
    setLoading(true);
    setError("");
    setRunning(false); 
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
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= totalSteps - 1) {
          setRunning(false); 
          clearInterval(intervalRef.current); 
          return prev; 
        }
        return prev + 1;
      });
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, speed, totalSteps]);

  const handleTileClick = (row, col) => {
    if (!isEditing) return;
    const nuevoEstado = [...userState];
    nuevoEstado[col] = nuevoEstado[col] === row ? -1 : row;
    setUserState(nuevoEstado);
  };

  const handleCalculate = async () => {
    if (queensPlaced < numQueens) {
      setError(`Por favor coloca las ${numQueens} reinas antes de ejecutar.`);
      return;
    }
    setIsEditing(false);
    await fetchQueensHC(userState);
  };

  const handleBackToDesign = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStepIdx(-1);
    setData(null);
    setIsEditing(true);
  };

  const handleClearAll = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStepIdx(-1);
    setData(null);
    setUserState(Array(numQueens).fill(-1));
    setIsEditing(true);
  };

  useEffect(() => {
    setUserState(Array(numQueens).fill(-1));
    setRunning(false);
    setStepIdx(-1);
    setData(null);
    setIsEditing(true);
  }, [numQueens]);

  const maxAttacksInRun = data?.steps ? Math.max(...data.steps.map(s => s.attacks), 1) : 1;
  const discoveredSteps = data?.steps ? data.steps.slice(0, stepIdx + 1) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", maxWidth: "1000px", margin: "0 auto", boxSizing: "border-box" }}>
      
      {/* SECCIÓN SUPERIOR: TABLERO IZQUIERDA Y BITÁCORA DERECHA */}
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
        
        {/* COLUMNA IZQUIERDA: TABLERO */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", fontSize: "13px", justifyContent: "space-between" }}>
            <label style={{ color: "#334155", fontWeight: "600" }}>N-Reinas: 
              <input type="number" min="4" max="10" value={numQueens} 
                     onChange={(e) => setNumQueens(Number(e.target.value))} 
                     disabled={!isEditing}
                     style={{ width: "50px", padding: "4px 8px", marginLeft: "8px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#334155", borderRadius: "4px", fontWeight: "bold" }} />
            </label>
            <span style={{ color: "#64748b", fontWeight: "500" }}>
              {isEditing ? `Acomodadas: ${queensPlaced} / ${numQueens}` : "Modo Análisis"}
            </span>
          </div>

          {/* Cuadrícula Tablero */}
          <div style={{
            display: "grid", gridTemplateColumns: `repeat(${numQueens}, minmax(40px, 55px))`, gap: "2px", background: "#94a3b8", padding: "6px", borderRadius: "8px",
          }}>
            {Array(numQueens).fill(null).map((_, row) => 
              Array(numQueens).fill(null).map((_, col) => {
                const isDark = (row + col) % 2 === 1;
                const hasQueen = queenPositions[col] === row;
                const isInConflict = hasQueen && activeConflicts.includes(col);
                const isMovedCol = currentStep?.chosen_column === col;

                let tileBg = isDark ? "#000000" : "#ffffff";
                let tileBorder = "none";
                if (isInConflict) { tileBg = "#7F1D1D"; tileBorder = "2.3px solid #EF4444"; }
                else if (isMovedCol) { tileBg = "#1E3A8A"; tileBorder = "2.3px solid #3B82F6"; }

                return (
                  <div 
                    key={`${row}-${col}`} onClick={() => handleTileClick(row, col)}
                    style={{
                      aspectRatio: "1", background: tileBg, border: tileBorder,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: numQueens > 8 ? "1.5rem" : "2rem", borderRadius: "2px",
                      cursor: isEditing ? "pointer" : "default", userSelect: "none", boxSizing: "border-box"
                    }}
                  >
                    {hasQueen ? "👑" : ""}
                  </div>
                );
              })
            )}
          </div>

          {/* BOTONERA EN MORADO */}
          <div style={{ display: "flex", gap: "8px", background: "#1e293b", padding: "8px 16px", borderRadius: "30px", flexWrap: "wrap", maxWidth: "460px" }}>
            {isEditing ? (
              <>
                <button onClick={handleCalculate} disabled={loading} style={{ padding: "8px 18px", background: "#534AB7", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
                  {loading ? "Calculando..." : "▶ Calcular Hill Climbing"}
                </button>
                <button onClick={handleClearAll} style={{ padding: "8px 18px", background: "#64748b", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
                  🧹 Limpiar Todo
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setRunning(!running)} disabled={stepIdx >= totalSteps - 1} style={{ padding: "8px 18px", background: "#534AB7", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
                  {running ? "⏸ Pausar Animación" : "▶ Iniciar Animación"}
                </button>
                <button onClick={() => setStepIdx(p => Math.max(p - 1, 0))} disabled={running || stepIdx <= 0} style={{ padding: "8px 18px", background: "#64748b", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", opacity: (running || stepIdx <= 0) ? 0.5 : 1 }}>
                  ← Atrás
                </button>
                <button onClick={() => setStepIdx(p => Math.min(p + 1, totalSteps - 1))} disabled={running || stepIdx >= totalSteps - 1} style={{ padding: "8px 18px", background: "#64748b", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", opacity: (running || stepIdx >= totalSteps - 1) ? 0.5 : 1 }}>
                  Paso →
                </button>
                <button onClick={handleBackToDesign} disabled={running} style={{ padding: "8px 18px", background: "#cbd5e1", color: "#334155", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
                  ✍ Reajustar
                </button>
                <button onClick={handleClearAll} disabled={running} style={{ padding: "8px 18px", background: "#f87171", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
                  Anular
                </button>
              </>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: LOGS Y METRICAS */}
        <div style={{ flex: "1", minWidth: "280px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {error && <div style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "14px 16px", borderRadius: "16px", color: "#991b1b", fontSize: "13px" }}>⚠ {error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Movimiento Actual</span>
              <span style={{ fontSize: "22px", fontWeight: "600", color: "#534AB7", marginTop: "4px" }}>{stepIdx < 0 ? "—" : `${stepIdx} / ${totalSteps - 1}`}</span>
            </div>
            <div style={{ background: currentStep?.attacks === 0 ? "#dcfce7" : "#ffffff", padding: "14px 16px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", transition: "all 0.2s" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Ataques Totales</span>
              <span style={{ fontSize: "22px", fontWeight: "600", color: currentStep?.attacks === 0 ? "#15803d" : "#ef4444", marginTop: "4px" }}>{currentStep ? currentStep.attacks : "—"}</span>
            </div>
          </div>

          {data && stepIdx === totalSteps - 1 && (
            <div style={{ display: "flex", flexDirection: "column", background: data.success ? "#dcfce7" : "#fee2e2", padding: "14px 16px", borderRadius: "16px", border: data.success ? "1px solid #bbf7d0" : "1px solid #fecaca", color: data.success ? "#15803d" : "#991b1b", fontWeight: "bold", fontSize: "14px" }}>
              {data.success ? "✓ Meta alcanzada con 0 ataques mutuos." : "✗ Paro por Máximo Local (No hay mejoras posibles)."}
            </div>
          )}

          {/* BITÁCORA DE CAMBIOS */}
          <div style={{ display: "flex", flexDirection: "column", flex: "1" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "4px", textTransform: "uppercase" }}>Bitácora Secuencial de Cambios</span>
            <div style={{ background: "#ffffff", padding: "14px 16px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", maxHeight: "180px", overflowY: "auto", fontFamily: "monospace", fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {!isEditing && discoveredSteps.length > 0 ? (
                discoveredSteps.map((s, idx) => {
                  const esUltimoLog = idx === discoveredSteps.length - 1;
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        color: esUltimoLog ? "#534AB7" : "#64748b", 
                        fontWeight: esUltimoLog ? "bold" : "normal",
                        background: esUltimoLog ? "#EEEDFE" : "transparent",
                        padding: "4px 6px", borderRadius: "4px", transition: "all 0.15s"
                      }}
                    >
                      {esUltimoLog ? "➔" : "•"} [{s.step}] {s.message}
                    </div>
                  );
                })
              ) : (
                <span style={{ color: "#94a3b8" }}>Coloca tu escenario base y corre el cálculo...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: GRÁFICA Y TABLA COMPLETA SIN SCROLL */}
      {!isEditing && data?.steps && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "12px" }}>
          
          {/* GRÁFICA HEURÍSTICA */}
          <div style={{ width: "100%", background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>📊 Comportamiento Heurístico (Descenso de Conflictos)</span>
            <div style={{ display: "flex", alignItems: "flex-end", height: "140px", gap: "6px", background: "#f8fafc", padding: "20px 15px 15px 15px", borderRadius: "12px", border: "1px solid #e2e8f0", marginTop: "8px" }}>
              {data.steps.map((s, idx) => {
                const isRevealed = idx <= stepIdx;
                const heightPercentage = isRevealed ? (s.attacks / maxAttacksInRun) * 100 : 0;
                const isCurrentBar = idx === stepIdx;
                return (
                  <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "10px", color: isCurrentBar ? "#534AB7" : "#64748b", fontWeight: isCurrentBar ? "bold" : "normal", marginBottom: "2px" }}>
                      {isRevealed ? s.attacks : ""}
                    </span>
                    <div style={{ 
                      width: "100%", height: `${isRevealed ? Math.max(heightPercentage, 5) : 0}%`, 
                      background: isCurrentBar ? "#534AB7" : s.attacks === 0 ? "#10b981" : "#cbd5e1", 
                      borderRadius: "4px 4px 0 0", transition: "all 0.2s"
                    }} />
                    <span style={{ fontSize: "10px", color: isCurrentBar ? "#1e293b" : "#94a3b8", marginTop: "4px" }}>M{s.step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLA DE AUDITORÍA INTEGRAL IMPRESA */}
          <div style={{ width: "100%", background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "14px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>📋 Registro de Tránsito en Tiempo Real (Matriz de Solución)</span>
            <div style={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", width: "120px", textAlign: "left", color: "#475569" }}>Identificador</th>
                    <th style={{ padding: "12px 16px", width: "160px", textAlign: "left", color: "#475569" }}>Modificación</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#475569" }}>Vector de Estado [Y]</th>
                    <th style={{ padding: "12px 16px", width: "120px", textAlign: "center", color: "#475569" }}>Conflictos (F)</th>
                  </tr>
                </thead>
                <tbody>
                  {discoveredSteps.map((s, i) => {
                    const esUltimo = i === discoveredSteps.length - 1;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: esUltimo ? "#EEEDFE" : "transparent", color: esUltimo ? "#534AB7" : "#334155", fontWeight: esUltimo ? "600" : "400", transition: "all 0.15s" }}>
                        <td style={{ padding: "10px 16px", fontFamily: "monospace" }}>STEP_{String(s.step).padStart(3, '0')}</td>
                        <td style={{ padding: "10px 16px" }}>{s.chosen_column === -1 ? "Escenario Inicial" : `Mover Columna ${s.chosen_column}`}</td>
                        <td style={{ padding: "10px 16px", fontFamily: "monospace", letterSpacing: "0.5px" }}>[{s.state.join(", ")}]</td>
                        <td style={{ padding: "10px 16px", textAlign: "center", fontWeight: "bold", color: s.attacks === 0 ? "#10b981" : esUltimo ? "#534AB7" : "#475569" }}>{s.attacks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}