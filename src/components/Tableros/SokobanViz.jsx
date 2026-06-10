import { useState, useEffect, useRef, useCallback } from "react";

const CELL_BASE = {
  W: { bg: "#475569", label: "🧱" }, 
  T: { bg: "#ffedd5", label: "🎯" }, 
  F: { bg: "#f1f5f9", label: "" },   
};

// 🗺️ NIVELES REDISEÑADOS CON MAYOR DIFICULTAD
const PRESET_LEVELS = {
  1: {
    name: "Nivel 1: El Pasillo",
    rows: 5, cols: 7,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['W', 'P', 'F', 'B', 'F', 'T', 'W'],
      ['W', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W']
    ]
  },
  2: {
    name: "Nivel 2: Gestión de Almacen",
    rows: 7, cols: 8,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'T', 'F', 'F', 'W', 'F', 'F', 'W'],
      ['W', 'T', 'B', 'F', 'F', 'B', 'F', 'W'],
      ['W', 'W', 'F', 'W', 'W', 'F', 'F', 'W'],
      ['W', 'F', 'F', 'F', 'B', 'F', 'F', 'W'],
      ['W', 'F', 'P', 'F', 'T', 'F', 'F', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W']
    ]
  },
  3: {
    name: "Nivel 3: El Laberinto de Cajas",
    rows: 8, cols: 9,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'F', 'F', 'F', 'F', 'W', 'T', 'T', 'W'],
      ['W', 'F', 'B', 'F', 'F', 'W', 'T', 'T', 'W'],
      ['W', 'W', 'W', 'F', 'B', 'F', 'F', 'F', 'W'],
      ['W', 'F', 'F', 'F', 'P', 'F', 'W', 'F', 'W'],
      ['W', 'F', 'B', 'F', 'B', 'F', 'W', 'F', 'W'],
      ['W', 'F', 'F', 'F', 'F', 'F', 'F', 'F', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W', 'W', 'W']
    ]
  }
};

export default function SokobanViz() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [rows, setRows] = useState(PRESET_LEVELS[1].rows);
  const [cols, setCols] = useState(PRESET_LEVELS[1].cols);
  const [gridMap, setGridMap] = useState(PRESET_LEVELS[1].grid);
  const [gameWon, setGameWon] = useState(false);
  const [manualLogs, setManualLogs] = useState([]);

  const tableContainerRef = useRef(null);

  const cargarNivel = (lvlNum) => {
    const lvl = PRESET_LEVELS[lvlNum];
    setCurrentLevel(lvlNum);
    setRows(lvl.rows);
    setCols(lvl.cols);
    setGridMap(lvl.grid.map(row => [...row]));
    setGameWon(false);
    setManualLogs([`Sistema iniciado. Reto #${lvlNum} cargado correctamente.`]);
  };

  // Auto-scroll para la tabla de abajo
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [manualLogs]);

  const moverJugador = useCallback((dr, dc) => {
    if (gameWon) return;

    setGridMap((prevMap) => {
      const nuevoMapa = prevMap.map(row => [...row]);
      let pr = -1, pc = -1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (nuevoMapa[r][c] === 'P' || nuevoMapa[r][c] === 'M') { pr = r; pc = c; break; }
        }
      }

      if (pr === -1) return prevMap;
      const tr = pr + dr, tc = pc + dc;
      if (!(0 <= tr && tr < rows && 0 <= tc && tc < cols)) return prevMap;

      const celdaDestino = nuevoMapa[tr][tc];
      if (celdaDestino === 'W') return prevMap;

      const origenEraMeta = nuevoMapa[pr][pc] === 'M';

      if (celdaDestino === 'F' || celdaDestino === 'T') {
        nuevoMapa[pr][pc] = origenEraMeta ? 'T' : 'F';
        nuevoMapa[tr][tc] = (celdaDestino === 'T') ? 'M' : 'P';
        setManualLogs(prev => [...prev, `Desplazamiento manual hacia coordenadas [${tr}, ${tc}]`]);
        return nuevoMapa;
      }

      if (celdaDestino === 'B' || celdaDestino === 'X') {
        const dR = tr + dr, dC = tc + dc;
        if (!(0 <= dR && dR < rows && 0 <= dC && dC < cols)) return prevMap;
        const celdaDetras = nuevoMapa[dR][dC];

        if (celdaDetras === 'F' || celdaDetras === 'T') {
          nuevoMapa[dR][dC] = (celdaDetras === 'T') ? 'X' : 'B';
          nuevoMapa[pr][pc] = origenEraMeta ? 'T' : 'F';
          nuevoMapa[tr][tc] = (celdaDestino === 'X') ? 'M' : 'P';
          setManualLogs(prev => [...prev, `Unidad de carga desplazada a posicion [${dR}, ${dC}]`]);

          let victoria = true;
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) { if (nuevoMapa[i][j] === 'B') victoria = false; }
          }
          if (victoria) { setGameWon(true); setManualLogs(prev => [...prev, "PROTOCOLOS CUMPLIDOS: Almacen optimizado con exito."]); }
          return nuevoMapa;
        }
      }
      return prevMap;
    });
  }, [rows, cols, gameWon]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) e.preventDefault(); 
      switch (e.key.toLowerCase()) {
        case "arrowup": case "w": moverJugador(-1, 0); break;
        case "arrowdown": case "s": moverJugador(1, 0); break;
        case "arrowleft": case "a": moverJugador(0, -1); break;
        case "arrowright": case "d": moverJugador(0, 1); break;
        default: break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moverJugador]);

  const renderCellContent = (row, col, cellBaseType) => {
    if (cellBaseType === 'P' || cellBaseType === 'M') return "👷";
    if (cellBaseType === 'B') return "📦";
    if (cellBaseType === 'X') return "🟢";
    return CELL_BASE[cellBaseType]?.label ?? "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>

      {/* SECCIÓN SUPERIOR */}
      <div style={{ display: "flex", gap: "30px", width: "100%", alignItems: "flex-start" }}>
        
        {/* PANEL LATERAL */}
        <div style={{ width: "300px", background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ margin: "0", color: "#1e293b", fontSize: "18px", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" }}>Selección de Niveles</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {[1, 2, 3].map((num) => (
              <button key={num} onClick={() => cargarNivel(num)} style={{ flex: "1 1 30%", padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", background: currentLevel === num ? "#534AB7" : "#f1f5f9", color: currentLevel === num ? "#fff" : "#64748b", transition: "all 0.2s" }}>Lvl {num}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>LEYENDA</span>
            {[ ["#475569", "🧱 Muro"], ["#ffedd5", "🎯 Meta"], ["#f1f5f9", "📦 Caja"], ["#bbf7d0", "🟢 Colocada"], ["#f1f5f9", "👷 Jugador"] ].map(([color, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#334155" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: color, border: "1px solid #cbd5e1" }} />{label}
              </div>
            ))}
          </div>
        </div>

        {/* TABLERO CENTRAL */}
        <div style={{ flex: "1", background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: "20px" }}>
          <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "16px" }}>{PRESET_LEVELS[currentLevel].name}</div>
          
          {gameWon && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", background: "#dcfce7", padding: "15px 30px", borderRadius: "16px", border: "1px solid #bbf7d0" }}>
              <span style={{ color: "#15803d", fontWeight: "bold" }}>🏆 ¡Nivel completado con éxito!</span>
              {currentLevel < 3 && (
                <button 
                  onClick={() => cargarNivel(currentLevel + 1)} 
                  style={{ padding: "8px 20px", background: "#15803d", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(21,128,61,0.3)" }}
                >
                  Siguiente Nivel →
                </button>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 65px)`, gap: "6px", background: "#cbd5e1", padding: "10px", borderRadius: "14px", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.08)" }}>
            {gridMap.flat().map((cell, pos) => {
              const r = Math.floor(pos / cols), c = pos % cols;
              let bg = CELL_BASE[cell]?.bg ?? "#f1f5f9";
              if (['P','B','M','X'].includes(cell)) bg = (cell === 'M') ? "#ffedd5" : (cell === 'X') ? "#bbf7d0" : "#f1f5f9";
              return (
                <div key={pos} style={{ width: "65px", height: "65px", background: bg, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontSize: "24px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.04)" }}>
                  {renderCellContent(r, c, cell)}
                  <span style={{ fontSize: "7px", opacity: 0.3, marginTop: "2px", color: "#000" }}>{`[${r},${c}]`}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "8px", background: "#1e293b", padding: "8px 16px", borderRadius: "30px" }}>
            <button onClick={() => cargarNivel(currentLevel)} style={{ padding: "8px 18px", background: "#64748b", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>↺ Reiniciar</button>
          </div>
        </div>
      </div>

      {/* TABLA DE PASOS INFERIOR */}
      <div style={{ width: "100%", background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "14px" }}>
        <h4 style={{ margin: "0", color: "#1e293b", fontSize: "14px", fontWeight: "700", letterSpacing: "0.5px" }}>📊 REGISTRO TÉCNICO DE ACTIVIDAD</h4>
        <div ref={tableContainerRef} style={{ maxHeight: "250px", overflowY: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0, zIndex: 1 }}>
                <th style={{ padding: "12px 16px", width: "100px", textAlign: "left", color: "#475569" }}>Evento</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#475569" }}>Descripción de la acción</th>
              </tr>
            </thead>
            <tbody>
              {manualLogs.map((log, i) => {
                const esUltimo = i === manualLogs.length - 1;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: esUltimo ? "#EEEDFE" : "transparent", color: esUltimo ? "#534AB7" : "#334155", fontWeight: esUltimo ? "600" : "400" }}>
                    <td style={{ padding: "10px 16px", fontFamily: "monospace" }}>ID_{String(i).padStart(3, '0')}</td>
                    <td style={{ padding: "10px 16px" }}>{log}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}