import { useState, useEffect, useRef } from "react";

const API_URL = "http://127.0.0.1:8000";

export default function TicTacToeViz() {
  const [gameMode, setGameMode] = useState("vs_ia"); 
  const [board, setBoard] = useState(Array(9).fill(""));
  const [turn, setTurn] = useState("MIN (X)"); 
  const [loading, setLoading] = useState(false);
  const [cellScores, setCellScores] = useState({});
  const [winner, setWinner] = useState(null); 
  const [iaThinking, setIaThinking] = useState(""); 
  const [historicoArbol, setHistoricoArbol] = useState([]);

  useEffect(() => {
    if (gameMode === "humano_asistido" && board.every(c => c === "") && !winner) {
      actualizarAsistente(board, "MIN (X)");
    }
  }, [gameMode]);

  useEffect(() => {
    reiniciarEntornoBase();
  }, []);

  const reiniciarEntornoBase = () => {
    setHistoricoArbol([
      {
        turno: 0,
        jugadorQueDecidio: "MIN (X)",
        valorRaiz: 0,
        accionElegida: "Inicio",
        opcionesDisponibles: [] 
      }
    ]);
  };

  const verificarGanadorLocal = (b) => {
    const lineas = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let l of lineas) {
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) {
        return b[l[0]];
      }
    }
    if (!b.includes("")) return "Empate";
    return null;
  };

  const consultarMinimax = async (tableroActual) => {
    try {
      const res = await fetch(`${API_URL}/api/gato`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: tableroActual })
      });
      if (!res.ok) throw new Error("Error en la API");
      return await res.json();
    } catch (e) {
      console.error("Error conectando con Minimax:", e);
      return null;
    }
  };

  const realizarTurnoIA = async (tableroConX) => {
    setLoading(true);
    setIaThinking("ANALIZANDO:\nMAX (O) esta aplicando Backtracking recursivo sobre los estados sucesores de la raiz.");
    
    const data = await consultarMinimax(tableroConX);
    
    if (data && data.best_move !== -1) {
      setTimeout(() => {
        const nuevoTablero = [...tableroConX];
        nuevoTablero[data.best_move] = "O";
        setBoard(nuevoTablero);
        setCellScores(data.scores);
        
        const valorElegido = data.scores[data.best_move];
        
        const ramasEvaluadas = Object.keys(data.scores).map(key => ({
          casilla: key,
          val: data.scores[key]
        }));

        setHistoricoArbol(prev => [...prev, {
          turno: prev.length,
          jugadorQueDecidio: "MAX (O)",
          valorRaiz: valorElegido,
          accionElegida: `C_${data.best_move}`,
          opcionesDisponibles: ramasEvaluadas
        }]);

        interpretarPensamiento(data.best_move, data.scores);

        const campoGanador = verificarGanadorLocal(nuevoTablero);
        if (campoGanador) setWinner(campoGanador);
        else setTurn("MIN (X)");
        
        setLoading(false);
      }, 600);
    } else {
      setLoading(false);
    }
  };

  const actualizarAsistente = async (tableroBase, proximoJugador) => {
    setLoading(true);
    const data = await consultarMinimax(tableroBase);
    if (data) {
      setCellScores(data.scores);
    }
    setLoading(false);
  };

  const interpretarPensamiento = (movimiento, puntuaciones) => {
    const valorElegido = puntuaciones[movimiento];
    let explicacion = `Decisiones de la IA:\n`;
    explicacion += `MAX (O) selecciono la casilla C_${movimiento} aplicando un criterio de maximizacion pura con v = (${valorElegido}).\n\n`;
    
    if (valorElegido > 0) {
      explicacion += `-> Diagnostico: Estrategia de MAXIMIZACIÓN. MAX detecto un camino libre para ganar (+10).`;
    } else if (valorElegido < 0) {
      explicacion += `-> Diagnostico: DEFENSA. MIN forzo la reduccion de la utilidad.`;
    } else {
      explicacion += `-> Diagnostico: EQUILIBRIO. Ambos agentes juegan sin ningún camino ganador (v = 0).`;
    }
    setIaThinking(explicacion);
  };

  const handleCellClick = async (index) => {
    if (board[index] !== "" || loading || winner) return;

    const jugadorActual = turn.includes("MIN") ? "X" : "O";
    const etiquetaJugador = turn.includes("MIN") ? "MIN (X)" : "MAX (O)";
    
    const nuevoTablero = [...board];
    nuevoTablero[index] = jugadorActual;
    setBoard(nuevoTablero);
    
    const utilAnterior = cellScores[index] !== undefined ? cellScores[index] : 0;

    const ramasOpcionesHumano = Object.keys(cellScores).map(key => ({
      casilla: key,
      val: cellScores[key]
    }));

    setHistoricoArbol(prev => [...prev, {
      turno: prev.length,
      jugadorQueDecidio: etiquetaJugador,
      valorRaiz: utilAnterior,
      accionElegida: `C_${index}`,
      opcionesDisponibles: ramasOpcionesHumano
    }]);

    const campoGanador = verificarGanadorLocal(nuevoTablero);
    if (campoGanador) {
      setWinner(campoGanador);
      setCellScores({}); 
      return;
    }

    if (gameMode === "vs_ia") {
      setTurn("MAX (O)");
      await realizarTurnoIA(nuevoTablero);
    } else {
      const siguienteTurnoLabel = jugadorActual === "X" ? "MAX (O)" : "MIN (X)";
      setTurn(siguienteTurnoLabel);
      await actualizarAsistente(nuevoTablero, siguienteTurnoLabel);
    }
  };

  const cambiarModo = (modo) => {
    setGameMode(modo);
    setBoard(Array(9).fill(""));
    setCellScores({});
    setWinner(null);
    setIaThinking("");
    setTurn("MIN (X)");
    reiniciarEntornoBase();
  };

  const reiniciarJuego = () => {
    setBoard(Array(9).fill(""));
    setCellScores({});
    setWinner(null);
    setIaThinking("");
    setTurn("MIN (X)");
    reiniciarEntornoBase();
    if (gameMode === "humano_asistido") {
      actualizarAsistente(Array(9).fill(""), "MIN (X)");
    }
  };

  // Manejo de estilos dinamicos de la caja en base al modo y turno
  const esDecisionIA = gameMode === "vs_ia" && iaThinking.includes("MAX (O) selecciono");
  const esTurnoApoyado = gameMode === "humano_asistido" && turn === "MAX (O)"; 

  let boxBg = "#f8fafc";
  let boxBorder = "1px solid #e2e8f0";
  let boxColor = "#334155";
  let textContent = iaThinking || "Construyendo el arbol de juego recursivo... Esperando transiciones en el espacio de estados.";

  if (loading) {
    boxBg = "#EEEDFE";
    boxBorder = "1px solid #534AB7";
    boxColor = "#534AB7";
    textContent = "[Procesando Espacio de Estados...]";
  } else if (gameMode === "vs_ia" && esDecisionIA) {
    boxBg = "#f0fdf4";
    boxBorder = "1px solid #10b981";
    boxColor = "#14532d";
  } else if (gameMode === "humano_asistido" && !winner) {
    if (esTurnoApoyado) {
      boxBg = "#f0fdf4";
      boxBorder = "1px solid #10b981";
      boxColor = "#14532d";
      textContent = "[Estrategia con Soporte Algoritmico Activo]";
    } else {
      boxBg = "#fee2e2";
      boxBorder = "1px solid #ef4444";
      boxColor = "#991b1b";
      textContent = "[Estrategia sin Soporte Algoritmico Activo]";
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", maxWidth: "1200px", margin: "0 auto", boxSizing: "border-box" }}>
      
      {/* SECCIÓN SUPERIOR ALINEADA */}
      <div style={{ display: "flex", gap: "24px", width: "100%", alignItems: "stretch", flexWrap: "wrap" }}>
        
        {/* PANEL DE CONTROL */}
        <div style={{ width: "280px", background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <h3 style={{ margin: "0 0 12px 0", color: "#1e293b", fontSize: "16px", borderBottom: "2px solid #f1f5f9", paddingBottom: "8px", fontWeight: "bold" }}>
              Arbol de Busqueda
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>MODELO DE TRANSICION</span>
              <button 
                onClick={() => cambiarModo("vs_ia")}
                disabled={loading}
                style={{ 
                  padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "12px",
                  background: gameMode === "vs_ia" ? "#534AB7" : "#f1f5f9", color: gameMode === "vs_ia" ? "#fff" : "#64748b", transition: "all 0.15s", opacity: loading ? 0.6 : 1
                }}
              >
                Enfrentar a MAX (IA)
              </button>
              <button 
                onClick={() => cambiarModo("humano_asistido")}
                disabled={loading}
                style={{ 
                  padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "12px",
                  background: gameMode === "humano_asistido" ? "#534AB7" : "#f1f5f9", color: gameMode === "humano_asistido" ? "#fff" : "#64748b", transition: "all 0.15s", opacity: loading ? 0.6 : 1
                }}
              >
                Modo Humano Asistido
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "12px", fontSize: "12px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b" }}>ROLES DEL MODELO</span>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Oponente MIN:</span>
              <span style={{ fontWeight: "bold", color: "#2563eb" }}>Ficha X (Humano)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Agente MAX:</span>
              <span style={{ fontWeight: "bold", color: "#ea580c" }}>Ficha O (Algoritmo)</span>
            </div>
          </div>
        </div>

        {/* TABLERO */}
        <div style={{ flex: "1", minWidth: "320px", background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "14px" }}>
            {winner ? "Prueba Terminal Detectada" : `Turno de ${turn}`}
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 95px)", gap: "4px", background: "#94a3b8", padding: "6px", borderRadius: "12px"
          }}>
            {board.map((cell, idx) => {
              const score = cellScores[idx];
              return (
                <div
                  key={idx} onClick={() => handleCellClick(idx)}
                  style={{
                    width: "95px", height: "95px", background: "#e2e4d4",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    fontSize: "2.2rem", fontWeight: "bold", color: cell === "X" ? "#2563eb" : "#ea580c",
                    cursor: cell === "" && !winner && !loading ? "pointer" : "default",
                    position: "relative", userSelect: "none", boxSizing: "border-box"
                  }}
                >
                  <span style={{ position: "absolute", top: "4px", left: "6px", fontSize: "10px", fontWeight: "700", color: "#94a3b8" }}>
                    C_{idx}
                  </span>

                  {cell}
                  
                  {cell === "" && score !== undefined && !winner && (
                    <span style={{ 
                      position: "absolute", bottom: "4px", right: "6px", fontSize: "10px", fontWeight: "bold",
                      color: score > 0 ? "#10b981" : score < 0 ? "#ef4444" : "#64748b" 
                    }}>
                      v = {score}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={reiniciarJuego} disabled={loading} style={{ padding: "8px 18px", background: "#64748b", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", fontSize: "12px", opacity: loading ? 0.6 : 1 }}>
            Limpiar Entorno
          </button>
        </div>

        {/* PROCESO COGNITIVO - PANEL DINÁMICO RECONFIGURADO */}
        <div style={{ width: "320px", background: "#ffffff", padding: "20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>FLUJO OPERACIONAL DE DECISION</span>
          <div style={{ 
            flex: 1, 
            background: boxBg, 
            border: boxBorder, 
            padding: "12px", borderRadius: "12px", 
            fontSize: "12px", 
            color: boxColor, 
            fontFamily: "sans-serif", whiteSpace: "pre-line", lineHeight: "1.4", minHeight: "150px",
            transition: "all 0.2s",
            fontWeight: (gameMode === "humano_asistido" || loading) ? "bold" : "normal"
          }}>
            {textContent}
          </div>
        </div>

      </div>

      {/* BANNER DE FIN DE JUEGO */}
      {winner && (
        <div style={{ background: winner === "Empate" ? "#f1f5f9" : winner === "X" ? "#dcfce7" : "#fee2e2", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
          <strong style={{ color: winner === "Empate" ? "#475569" : winner === "X" ? "#15803d" : "#991b1b", fontSize: "14px" }}>
            {winner === "Empate" ? "Prueba Terminal: Nodo terminal neutro (v = 0). Asignacion de suma cero exitosa." : `Prueba Terminal: El espacio de estados se resolvio a favor del nodo (${winner === "X" ? "MIN" : "MAX"}).`}
          </strong>
        </div>
      )}

      {/* ÁRBOL DE DECISIONES CRONOLÓGICO CRECIENTE */}
      <div style={{ width: "100%", background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
          Arbol de Juego 
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
          {historicoArbol.map((nodo, index) => (
            <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", position: "relative" }}>
              
              {index > 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "bold", background: "#fff", padding: "2px 8px", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                    Accion elegida: {nodo.accionElegida}
                  </div>
                  <div style={{ width: "2px", height: "20px", borderLeft: "2px dashed #cbd5e1" }} />
                </div>
              )}

              <div style={{ background: nodo.jugadorQueDecidio.includes("MAX") ? "#ea580c" : "#2563eb", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", fontSize: "12px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", textAlign: "center", zIndex: 2 }}>
                <div style={{ fontSize: "9px", opacity: 0.85 }}>RAIZ EN TURNO {nodo.turno} ({nodo.jugadorQueDecidio})</div>
                v = {nodo.valorRaiz}
              </div>

              {nodo.opcionesDisponibles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                  <div style={{ width: "60%", height: "12px", borderLeft: "2px solid #e2e8f0", borderRight: "2px solid #e2e8f0", borderTop: "2px solid #e2e8f0", marginTop: "8px" }} />
                  
                  <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap", marginTop: "-4px" }}>
                    {nodo.opcionesDisponibles.map((hijo, hIdx) => {
                      const esLaElegida = nodo.accionElegida === `C_${hijo.casilla}`;
                      return (
                        <div key={hIdx} style={{ background: esLaElegida ? "#f0fdf4" : "#ffffff", border: esLaElegida ? "2px solid #22c55e" : "1px solid #cbd5e1", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                          <span style={{ fontSize: "9px", color: "#64748b" }}>Hijo {hijo.casilla}</span>
                          <span style={{ fontWeight: "bold", color: hijo.val > 0 ? "#10b981" : hijo.val < 0 ? "#ef4444" : "#475569" }}>v = {hijo.val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}