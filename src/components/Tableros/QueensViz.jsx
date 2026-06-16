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
  th: { padding: "10px", textAlign: "left", borderBottom: "1px solid #333", color: "#888", fontSize: 12, fontWeight: 600 },
  td: { padding: "10px", borderBottom: "1px solid #222", fontSize: 13, color: "#fff" }
};

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

  // CONTROLADOR DE ANIMACIÓN CORREGIDO (STOP AL FINAL ESTRICTO)
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= totalSteps - 1) {
          setRunning(false); // Apagamos el reloj de inmediato
          clearInterval(intervalRef.current); // Limpiamos el hilo de ejecución
          return prev; // Mantenemos el último índice sin mover nada
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1000, margin: "0 auto" }}>
      
      {/* SECCIÓN SUPERIOR: TABLERO Y LOGS DE AUDITORÍA */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        
        {/* TABLERO */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 13, justifyContent: "space-between" }}>
            <label>N-Reinas: 
              <input type="number" min="4" max="10" value={numQueens} 
                     onChange={(e) => setNumQueens(Number(e.target.value))} 
                     disabled={!isEditing}
                     style={{ width: 50, padding: "4px 8px", marginLeft: 8, background: "#222", border: "1px solid #444", color: "#fff", borderRadius: 4 }} />
            </label>
            <span style={{ color: "#888" }}>
              {isEditing ? `Acomodadas: ${queensPlaced} / ${numQueens}` : "Modo Análisis"}
            </span>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: `repeat(${numQueens}, minmax(40px, 55px))`, gap: 2, background: "#2a2a2a", padding: 6, borderRadius: 8,
          }}>
            {Array(numQueens).fill(null).map((_, row) => 
              Array(numQueens).fill(null).map((_, col) => {
                const isDark = (row + col) % 2 === 1;
                const hasQueen = queenPositions[col] === row;
                const isInConflict = hasQueen && activeConflicts.includes(col);
                const isMovedCol = currentStep?.chosen_column === col;

                return (
                  <div 
                    key={`${row}-${col}`} onClick={() => handleTileClick(row, col)}
                    style={{
                      aspectRatio: "1",
                      background: isInConflict ? "#7F1D1D" : isMovedCol ? "#1E3A8A" : (isDark ? "#4B382A" : "#8B7355"),
                      border: isInConflict ? "2.3px solid #EF4444" : isMovedCol ? "2.3px solid #3B82F6" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: numQueens > 8 ? "1.5rem" : "2rem", borderRadius: 2,
                      cursor: isEditing ? "pointer" : "default", userSelect: "none"
                    }}
                  >
                    {hasQueen ? "👑" : ""}
                  </div>
                );
              })
            )}
          </div>

          {/* BOTONERA */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 450 }}>
            {isEditing ? (
              <>
                <button style={S.btn(false, true)} onClick={handleCalculate} disabled={loading}>
                  {loading ? "Calculando..." : "▶ Calcular Hill Climbing"}
                </button>
                <button style={S.btn()} onClick={handleClearAll}>
                  Base Limpia
                </button>
              </>
            ) : (
              <>
                {!running ? (
                  <button style={S.btn(false, true)} onClick={() => setRunning(true)} disabled={stepIdx >= totalSteps - 1}>
                    ▶ Iniciar Animación
                  </button>
                ) : (
                  <button style={S.btn(false, false)} onClick={() => setRunning(false)}>
                    ⏸ Pausar Animación
                  </button>
                )}
                
                <button style={S.btn()} onClick={() => setStepIdx(p => Math.max(p - 1, 0))} disabled={running || stepIdx <= 0}>
                  ← Atrás
                </button>
                <button style={S.btn()} onClick={() => setStepIdx(p => Math.min(p + 1, totalSteps - 1))} disabled={running || stepIdx >= totalSteps - 1}>
                  Paso →
                </button>
                
                <button style={S.btn()} onClick={handleBackToDesign} disabled={running}>
                  ✍ Reajustar
                </button>
                <button style={S.btn()} onClick={handleClearAll} disabled={running}>
                  🧹 Borrar Todo
                </button>
              </>
            )}
          </div>
        </div>

        {/* LOGS DE AUDITORÍA */}
        <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
          {error && <div style={{ ...S.card, background: "#FEF2F2", color: "#991B1B" }}>⚠ {error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            <div style={S.card}><div style={S.label}>Movimiento Actual</div><div style={S.statVal}>{stepIdx < 0 ? "—" : `${stepIdx} / ${totalSteps - 1}`}</div></div>
            <div style={{ ...S.card, background: currentStep?.attacks === 0 ? "#143A28" : "#1a1a1a" }}><div style={S.label}>Ataques Totales</div><div style={{ ...S.statVal, color: currentStep?.attacks === 0 ? "#5DCAA5" : "#EF9F27" }}>{currentStep ? currentStep.attacks : "—"}</div></div>
          </div>

          {data && stepIdx === totalSteps - 1 && (
            <div style={{ ...S.card, background: data.success ? "#064E3B" : "#7F1D1D", color: data.success ? "#A7F3D0" : "#FEE2E2", borderColor: data.success ? "#047857" : "#991B1B", fontWeight: "bold" }}>
              {data.success ? "✓ Meta alcanzada con 0 ataques mutuos." : "✗ Paro por Máximo Local (No hay mejoras posibles)."}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={S.label}>Bitácora Secuencial de Cambios</div>
            <div style={{ ...S.card, background: "#111", maxHeight: 180, overflowY: "auto", fontFamily: "monospace", fontSize: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {!isEditing && discoveredSteps.length > 0 ? (
                discoveredSteps.map((s, idx) => {
                  const isLastDiscovered = idx === discoveredSteps.length - 1;
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        color: isLastDiscovered ? "#5DCAA5" : "#555", 
                        fontWeight: isLastDiscovered ? "bold" : "normal",
                        background: isLastDiscovered ? "rgba(93, 202, 165, 0.08)" : "transparent",
                        padding: "4px 6px",
                        borderRadius: 4,
                        transition: "all 0.15s"
                      }}
                    >
                      {isLastDiscovered ? "➔" : "•"} [{s.step}] {s.message}
                    </div>
                  );
                })
              ) : (
                <span style={{ color: "#444" }}>Coloca tu escenario base y corre el cálculo...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: GRÁFICA Y TABLA */}
      {!isEditing && data?.steps && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 12 }}>
          
          {/* GRÁFICA INTERACTIVA */}
          <div style={{ ...S.card }}>
            <div style={S.label}>Evolución de la Heurística (Descenso de Conflictos)</div>
            <div style={{ display: "flex", alignItems: "flex-end", height: 140, gap: 4, background: "#111", padding: "20px 10px 10px 10px", borderRadius: 8, border: "1px solid #222", position: "relative", marginTop: 8 }}>
              {data.steps.map((s, idx) => {
                const isRevealed = idx <= stepIdx;
                const heightPercentage = isRevealed ? (s.attacks / maxAttacksInRun) * 100 : 0;
                const isCurrentBar = idx === stepIdx;
                return (
                  <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 9, color: isCurrentBar ? "#81d4fa" : "#555", fontWeight: isCurrentBar ? "bold" : "normal" }}>
                      {isRevealed ? s.attacks : ""}
                    </span>
                    <div style={{ 
                      width: "100%", 
                      height: `${isRevealed ? Math.max(heightPercentage, 4) : 0}%`, 
                      background: isCurrentBar ? "#81d4fa" : s.attacks === 0 ? "#5DCAA5" : "#332C74", 
                      borderRadius: "3px 3px 0 0", 
                      transition: "all 0.15s",
                      opacity: isRevealed ? 1 : 0.1
                    }} />
                    <span style={{ fontSize: 9, color: isCurrentBar ? "#fff" : "#444", marginTop: 4 }}>M{s.step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TABLA DINÁMICA */}
          <div style={{ ...S.card }}>
            <div style={S.label}>Historial Analítico Dinámico (Matriz de Transición)</div>
            <div style={{ background: "#111", borderRadius: 8, border: "1px solid #222", marginTop: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={S.th}>Mov</th>
                    <th style={S.th}>Columna Modificada</th>
                    <th style={S.th}>Vector de Estado [Y]</th>
                    <th style={S.th}>Conflictos (F)</th>
                  </tr>
                </thead>
                <tbody>
                  {discoveredSteps.map((s, idx) => {
                    const isLastRow = idx === discoveredSteps.length - 1;
                    return (
                      <tr key={idx} style={{ background: isLastRow ? "rgba(81, 212, 250, 0.12)" : "transparent", transition: "all 0.15s" }}>
                        <td style={{ ...S.td, color: isLastRow ? "#81d4fa" : "#fff", fontWeight: isLastRow ? "bold" : "normal" }}>
                          {s.step === 0 ? "Inicial" : `M${s.step}`}
                        </td>
                        <td style={S.td}>
                          {s.chosen_column === -1 ? "Ninguna" : `Columna ${s.chosen_column}`}
                        </td>
                        <td style={{ ...S.td, fontFamily: "monospace", color: isLastRow ? "#fff" : "#aaa" }}>
                          [{s.state.join(", ")}]
                        </td>
                        <td style={{ ...S.td, fontWeight: "bold", color: s.attacks === 0 ? "#5DCAA5" : "#EF9F27" }}>
                          {s.attacks}
                        </td>
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