import { useState, useEffect, useRef, useCallback } from "react";

// ──────────────────────────────────────────────
// CONFIGURACIÓN DE LOS 3 NIVELES REALES (IMÁGENES)
// ──────────────────────────────────────────────
const PRESET_LEVELS = {
  1: {
    name: "Nivel 1",
    rows: 10, cols: 14,
    grid: [
      ['W','W','W','W','W','W','W','W','W','W','W','W','F','F'],
      ['W','T','T','F','F','W','F','F','F','F','F','W','W','W'],
      ['W','T','T','F','F','W','F','B','F','F','B','F','F','W'],
      ['W','T','T','F','F','W','B','W','W','W','W','F','F','W'],
      ['W','T','T','F','F','F','F','P','F','W','W','F','F','W'],
      ['W','T','T','F','F','W','F','W','F','F','B','F','W','W'],
      ['W','W','W','W','W','W','F','W','W','B','F','B','F','W'],
      ['F','F','W','F','B','F','F','B','F','B','F','B','F','W'],
      ['F','F','W','F','F','F','F','W','F','F','F','F','F','W'],
      ['F','F','W','W','W','W','W','W','W','W','W','W','W','W']
    ]
  },
  2: {
    name: "Nivel 2",
    rows: 10, cols: 17,
    grid: [
      ['F','F','F','F','F','F','F','F','W','W','W','W','W','W','W','W','F'],
      ['F','F','F','F','F','F','F','F','W','F','F','F','F','F','P','W','F'],
      ['F','F','F','F','F','F','F','F','W','F','B','W','B','F','W','W','F'],
      ['F','F','F','F','F','F','F','F','W','F','B','F','F','B','W','F','F'],
      ['F','F','F','F','F','F','F','F','W','W','B','F','B','F','W','F','F'],
      ['W','W','W','W','W','W','W','W','W','F','B','F','W','F','W','W','W'],
      ['W','T','T','T','T','F','F','W','W','F','B','F','F','B','F','F','W'],
      ['W','W','T','T','T','F','F','F','F','B','F','F','B','F','F','F','W'],
      ['W','T','T','T','T','F','F','W','W','W','W','W','W','W','W','W','W'],
      ['W','W','W','W','W','W','W','W','F','F','F','F','F','F','F','F','F']
    ]
  },
  3: {
    name: "Nivel 3",
    rows: 11, cols: 12,
    grid: [
      ['W','W','W','W','W','W','F','F','W','W','W','F'],
      ['W','T','T','F','F','W','F','W','W','P','W','W'],
      ['W','T','T','F','F','W','W','W','F','F','F','W'],
      ['W','T','T','F','F','F','F','F','B','B','F','W'],
      ['W','T','T','F','F','W','F','W','F','B','F','W'],
      ['W','T','T','W','W','W','F','W','F','B','F','W'],
      ['W','W','W','W','F','B','F','W','B','F','F','W'],
      ['F','F','F','W','F','F','B','W','F','B','F','W'],
      ['F','F','F','W','F','B','F','F','B','F','F','W'],
      ['F','F','F','W','F','F','W','W','F','F','F','W'],
      ['F','F','F','W','W','W','W','W','W','W','W','W']
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
    setManualLogs([`Nivel ${lvlNum} cargado de forma correcta.`]);
  };

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = tableContainerRef.current.scrollHeight;
    }
  }, [manualLogs]);

  // Motor de física y lógica de movimiento manual
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
        setManualLogs(prev => [...prev, `Desplazamiento del operario a las coordenadas [${tr}, ${tc}]`]);
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
          setManualLogs(prev => [...prev, `Bloque de carga empujado hacia la posicion [${dR}, ${dC}]`]);

          let victoria = true;
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) { if (nuevoMapa[i][j] === 'B') victoria = false; }
          }
          if (victoria) { 
            setGameWon(true); 
            setManualLogs(prev => [...prev, "Estatus finalizado: Todas las cajas se encuentran en sus destinos."]); 
          }
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

  // ──────────────────────────────────────────────
  // RENDERIZADO VISUAL EXCLUSIVO CON CSS (SIN EMOJIS)
  // ──────────────────────────────────────────────
  const renderCellGraphic = (cellType) => {
    const boxXLine = {
      position: "absolute", width: "100%", height: "100%", top: 0, left: 0,
      backgroundImage: "linear-gradient(to top right, transparent calc(50% - 2px), #78350f calc(50% - 2px), #78350f calc(50% + 2px), transparent calc(50% + 2px)), linear-gradient(to top left, transparent calc(50% - 2px), #78350f calc(50% - 2px), #78350f calc(50% + 2px), transparent calc(50% + 2px))"
    };

    switch (cellType) {
      case 'W': // 🧱 Muro perimetral texturizado
        return (
          <div style={{ width: "100%", height: "100%", background: "#475569", border: "3px solid #334155", boxSizing: "border-box", boxShadow: "inset 0 0 10px rgba(0,0,0,0.4)" }} />
        );
      case 'B': // 📦 Caja de Madera Suelta
        return (
          <div style={{ width: "85%", height: "85%", background: "#f59e0b", border: "3px solid #78350f", borderRadius: "6px", position: "relative", boxShadow: "2px 2px 5px rgba(0,0,0,0.15)" }}>
            <div style={boxXLine} />
          </div>
        );
      case 'X': // 🟢 Caja Colocada con Éxito
        return (
          <div style={{ width: "85%", height: "85%", background: "#10b981", border: "3px solid #064e3b", borderRadius: "6px", position: "relative", boxShadow: "0 0 8px rgba(16,185,129,0.5)" }}>
            <div style={{ ...boxXLine, backgroundImage: "linear-gradient(to top right, transparent calc(50% - 2px), #064e3b calc(50% - 2px), #064e3b calc(50% + 2px), transparent calc(50% + 2px)), linear-gradient(to top left, transparent calc(50% - 2px), #064e3b calc(50% - 2px), #064e3b calc(50% + 2px), transparent calc(50% + 2px))" }} />
          </div>
        );
      case 'T': // 🎯 Objetivo / Meta Vacía
        return (
          <div style={{ width: "16px", height: "16px", background: "#f87171", borderRadius: "50%", border: "2px solid #b91c1c", boxShadow: "0 0 6px rgba(248,113,113,0.6)" }} />
        );
      case 'P': // 👷 Jugador sobre Suelo Común
      case 'M': // 👷 Jugador sobre un Objetivo
        return (
          <div style={{ width: "80%", height: "80%", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            {/* Cabello */}
            <div style={{ width: "24px", height: "12px", background: "#000", borderRadius: "6px 6px 0 0" }} />
            {/* Rostro */}
            <div style={{ width: "20px", height: "16px", background: "#fef08a", borderRadius: "0 0 4px 4px", border: "1px solid #eab308", marginTop: "-2px" }} />
            {/* Camisa */}
            <div style={{ width: "28px", height: "18px", background: "#cbd5e1", borderRadius: "4px 4px 0 0", border: "1px solid #94a3b8" }} />
            {/* Pantalón */}
            <div style={{ width: "24px", height: "14px", background: "#2563eb", borderRadius: "0 0 4px 4px" }} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>

      {/* SECCIÓN SUPERIOR: CONFIGURACIÓN + TABLERO INTERACTIVO */}
      <div style={{ display: "flex", gap: "30px", width: "100%", alignItems: "flex-start" }}>
        
        {/* COLUMNA 1: CONFIGURACIÓN */}
        <div style={{ width: "320px", background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ margin: "0", color: "#1e293b", fontSize: "18px", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" }}>
            Control de Misiones
          </h3>

          {/* Selector de Niveles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>SELECCIONA UN MAPA</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {[1, 2, 3].map((num) => (
                <button 
                  key={num} 
                  onClick={() => cargarNivel(num)} 
                  style={{ 
                    flex: 1, padding: "12px 10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer",
                    background: currentLevel === num ? "#534AB7" : "#f1f5f9",
                    color: currentLevel === num ? "#fff" : "#64748b",
                    transition: "all 0.2s"
                  }}
                >
                  Nivel {num}
                </button>
              ))}
            </div>
          </div>

          {/* Leyenda Técnica */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>INDICADORES GRÁFICOS</span>
            {[
              { type: 'W', label: "Bloque de Muro" },
              { type: 'T', label: "Zona de Depósito" },
              { type: 'B', label: "Unidad de Carga" },
              { type: 'X', label: "Carga Asegurada" },
              { type: 'P', label: "Operario Asignado" }
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", color: "#334155" }}>
                <div style={{ width: "36px", height: "36px", background: item.type === 'W' ? 'transparent' : "#e2e8f0", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {renderCellGraphic(item.type)}
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* COLUMNA 2: TABLERO ARCADE PRINCIPAL */}
        <div style={{ 
          flex: "1", background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: "20px" 
        }}>
          <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "16px" }}>{PRESET_LEVELS[currentLevel].name}</div>
          
          {gameWon && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", background: "#dcfce7", padding: "15px 35px", borderRadius: "16px", border: "1px solid #bbf7d0" }}>
              <span style={{ color: "#15803d", fontWeight: "bold" }}>Misión cumplida de manera exitosa</span>
              {currentLevel < 3 && (
                <button 
                  onClick={() => cargarNivel(currentLevel + 1)} 
                  style={{ padding: "10px 24px", background: "#15803d", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(21,128,61,0.25)" }}
                >
                  Siguiente Nivel →
                </button>
              )}
            </div>
          )}

          {/* Tablero dinámico auto-ajustado */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: `repeat(${cols}, 55px)`, 
            gap: "2px", 
            background: "#94a3b8", 
            padding: "8px", 
            borderRadius: "10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)"
          }}>
            {gridMap.flat().map((cell, pos) => {
              const r = Math.floor(pos / cols), c = pos % cols;
              
              // El suelo por defecto toma el color arenoso/beige de la captura
              let cellBg = "#e2e4d4"; 
              if (cell === 'W') cellBg = "#475569"; 

              return (
                <div 
                  key={pos} 
                  style={{ 
                    width: "55px", height: "55px", background: cellBg, 
                    display: "flex", alignItems: "center", justifyContent: "center", 
                    position: "relative" 
                  }}
                >
                  {renderCellGraphic(cell)}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "8px", background: "#1e293b", padding: "8px 16px", borderRadius: "30px" }}>
            <button onClick={() => cargarNivel(currentLevel)} style={{ padding: "8px 18px", background: "#64748b", color: "white", border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }}>
              ↺ Reiniciar Mapa
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: TABLA TÉCNICA DE AUDITORÍA */}
      <div style={{ width: "100%", background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "14px" }}>
        <h4 style={{ margin: "0", color: "#1e293b", fontSize: "14px", fontWeight: "700", letterSpacing: "0.5px" }}>
          📊 REGISTRO DE TRÁNSITO EN TIEMPO REAL
        </h4>
        <div ref={tableContainerRef} style={{ maxHeight: "220px", overflowY: "auto", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0, zIndex: 1 }}>
                <th style={{ padding: "12px 16px", width: "120px", textAlign: "left", color: "#475569" }}>Identificador</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#475569" }}>Descripción del Movimiento</th>
              </tr>
            </thead>
            <tbody>
              {manualLogs.map((log, i) => {
                const esUltimo = i === manualLogs.length - 1;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: esUltimo ? "#EEEDFE" : "transparent", color: esUltimo ? "#534AB7" : "#334155", fontWeight: esUltimo ? "600" : "400" }}>
                    <td style={{ padding: "10px 16px", fontFamily: "monospace" }}>MOV_{String(i).padStart(3, '0')}</td>
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