import { useState } from "react";

const API_URL = "http://127.0.0.1:8000";

const S = {
  card: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "14px 16px" },
  btn: {
    padding: "8px 18px", borderRadius: 8, border: "1px solid #333",
    background: "#534AB7", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
  },
  label: { fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase" },
  statVal: { fontSize: 22, fontWeight: 600, color: "#81d4fa" },
};

export default function TicTacToeViz() {
  const [board, setBoard] = useState(Array(9).fill(""));
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState(["El juego ha iniciado. Tu juegas como X."]);
  const [cellScores, setCellScores] = useState({});
  const [winner, setWinner] = useState(null); // 'X', 'O', 'Empate' o null

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

  const realizarTurnoIA = async (tableroActual) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/gato`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board: tableroActual })
      });
      if (!res.ok) throw new Error("Error en la API");
      const data = await res.json();

      const nuevoTablero = [...tableroActual];
      if (data.best_move !== -1) {
        nuevoTablero[data.best_move] = "O";
        setBoard(nuevoTablero);
        setCellScores(data.scores);
        setLogs(prev => [...prev, data.message]);

        const campoGanador = verificarGanadorLocal(nuevoTablero);
        if (campoGanador) setWinner(campoGanador);
      }
    } catch (e) {
      setLogs(prev => [...prev, "⚠ Error de conexión con el resolvedor Minimax."]);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = async (index) => {
    if (board[index] !== "" || loading || winner) return;

    // 1. Turno del Jugador (X)
    const tableroConX = [...board];
    tableroConX[index] = "X";
    setBoard(tableroConX);
    setLogs(prev => [...prev, `Jugador colocó X en la casilla ${index}.`]);

    const campoGanador = verificarGanadorLocal(tableroConX);
    if (campoGanador) {
      setWinner(campoGanador);
      return;
    }

    // 2. Turno inmediato de la IA (O)
    await realizarTurnoIA(tableroConX);
  };

  const reiniciarJuego = () => {
    setBoard(Array(9).fill(""));
    setCellScores({});
    setWinner(null);
    setLogs(["Tablero reiniciado. Coloca tu X."]);
  };

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
      
      {/* CUADRÍCULA DEL TABLERO */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 100px)",
          gap: 6,
          background: "#2a2a2a",
          padding: 8,
          borderRadius: 12
        }}>
          {board.map((cell, idx) => {
            const score = cellScores[idx];
            return (
              <div
                key={idx}
                onClick={() => handleCellClick(idx)}
                style={{
                  width: 100, height: 100, background: "#111", borderRadius: 8,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  fontSize: "2.2rem", fontWeight: "bold", color: cell === "X" ? "#81d4fa" : "#EF9F27",
                  cursor: cell === "" && !winner && !loading ? "pointer" : "default",
                  position: "relative", userSelect: "none"
                }}
              >
                {cell}
                {/* Mostrar el mini-peso heurístico calculado por Minimax */}
                {cell === "" && score !== undefined && (
                  <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 10, color: score > 0 ? "#5DCAA5" : score < 0 ? "#FCA5A5" : "#888" }}>
                    v: {score}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <button style={S.btn} onClick={reiniciarJuego}>↺ Reiniciar Partida</button>
      </div>

      {/* DETALLES Y LOGS DE BÚSQUEDA */}
      <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          <div style={S.card}>
            <div style={S.label}>Tu Rol</div>
            <div style={{ ...S.statVal, color: "#81d4fa" }}>Humano (X)</div>
          </div>
          <div style={S.card}>
            <div style={S.label}>Rival</div>
            <div style={{ ...S.statVal, color: "#EF9F27" }}>Minimax (O)</div>
          </div>
        </div>

        <div style={{ ...S.card, background: "#1E1B4B", borderColor: "#312E81", fontSize: 13, color: "#C7D2FE", lineHeight: 1.6 }}>
          <strong>Minimax — Búsqueda Adversaria</strong><br />
          Explora todo el árbol de juego de manera recursiva simulando los turnos alternos. Maximiza el beneficio de la IA y asume que el jugador elegirá siempre la opción que más la perjudique (Minimizar).
        </div>

        {/* Historial en tiempo real */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={S.label}>Árbol de Decisiones (Consola)</div>
          <div style={{ height: 130, overflowY: "auto", ...S.card, fontFamily: "monospace", fontSize: 12, background: "#111", color: "#aaa" }}>
            {logs.map((log, i) => (
              <div key={i} style={{ color: i === logs.length - 1 ? "#fff" : "#777" }}>
                › {log}
              </div>
            ))}
          </div>
        </div>

        {/* Banner de Estado Final */}
        {winner && (
          <div style={{
            ...S.card,
            background: winner === "O" ? "#7F1D1D" : winner === "X" ? "#064E3B" : "#262626",
            color: winner === "O" ? "#FEE2E2" : winner === "X" ? "#A7F3D0" : "#fff",
            textAlign: "center"
          }}>
            <strong>
              {winner === "O" ? "✗ ¡La IA ha ganado! Minimax es perfecto." :
               winner === "X" ? "✓ ¡Increíble! Ganaste al algoritmo." : "⚖ ¡Empate perfecto!"}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}