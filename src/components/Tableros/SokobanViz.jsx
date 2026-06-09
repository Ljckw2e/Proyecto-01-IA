import { useState, useEffect, useRef, useCallback } from "react";

const CELL_BASE = {
  W: { bg: "#475569", label: "🧱" }, // Pared
  T: { bg: "#ffedd5", label: "🎯" }, // Objetivo (Target)
  F: { bg: "#f1f5f9", label: "" },   // Piso vacío
};

// 🗺️ DISEÑO FIJO DE LOS 3 NIVELES DE MATHS IS FUN
const PRESET_LEVELS = {
  1: {
    name: "Nivel 1: Introducción",
    rows: 5, cols: 6,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'P', 'F', 'F', 'T', 'W'],
      ['W', 'F', 'B', 'F', 'F', 'W'],
      ['W', 'F', 'F', 'F', 'F', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W']
    ]
  },
  2: {
    name: "Nivel 2: Clásico Almacén",
    rows: 6, cols: 6,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'T', 'W', 'F', 'F', 'W'],
      ['W', 'F', 'B', 'B', 'T', 'W'],
      ['W', 'F', 'W', 'F', 'F', 'W'],
      ['W', 'P', 'F', 'F', 'F', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W']
    ]
  },
  3: {
    name: "Nivel 3: Desafío de Bloques",
    rows: 6, cols: 7,
    grid: [
      ['W', 'W', 'W', 'W', 'W', 'W', 'W'],
      ['W', 'T', 'F', 'F', 'F', 'T', 'W'],
      ['W', 'F', 'W', 'B', 'W', 'F', 'W'],
      ['W', 'F', 'B', 'P', 'B', 'F', 'W'],
      ['W', 'T', 'F', 'F', 'F', 'T', 'W'],
      ['W', 'W', 'W', 'W', 'W', 'W', 'W']
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

  // ✨ Referencia para controlar el auto-scroll horizontal de la cinta de pasos
  const logContainerRef = useRef(null);

  // Cargar nivel seleccionado limpiando estados anteriores
  const cargarNivel = (lvlNum) => {
    const lvl = PRESET_LEVELS[lvlNum];
    setCurrentLevel(lvlNum);
    setRows(lvl.rows);
    setCols(lvl.cols);
    setGridMap(lvl.grid.map(row => [...row]));
    setGameWon(false);
    setManualLogs([`Nivel ${lvlNum} cargado. Usa las flechas o WASD para moverte.`]);
  };

  // Auto-scroll horizontal hacia la derecha cada vez que se agrega un paso
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollLeft = logContainerRef.current.scrollWidth;
    }
  }, [manualLogs]);

  // Motor de movimiento y empujes
  const moverJugador = useCallback((dr, dc) => {
    if (gameWon) return;

    setGridMap((prevMap) => {
      const nuevoMapa = prevMap.map(row => [...row]);
      
      let pr = -1, pc = -1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (nuevoMapa[r][c] === 'P' || nuevoMapa[r][c] === 'M') {
            pr = r; pc = c; break;
          }
        }
      }

      if (pr === -1) return prevMap;

      const tr = pr + dr;
      const tc = pc + dc;

      if (!(0 <= tr && tr < rows && 0 <= tc && tc < cols)) return prevMap;

      const celdaDestino = nuevoMapa[tr][tc];
      if (celdaDestino === 'W') return prevMap;

      const origenEraMeta = nuevoMapa[pr][pc] === 'M';

      const colocarJugador = (r, c) => {
        if (nuevoMapa[r][c] === 'T' || nuevoMapa[r][c] === 'X') {
          nuevoMapa[r][c] = 'M';
        } else {
          nuevoMapa[r][c] = 'P';
        }
      };

      if (celdaDestino === 'F' || celdaDestino === 'T') {
        nuevoMapa[pr][pc] = origenEraMeta ? 'T' : 'F';
        colocarJugador(tr, tc);
        setManualLogs(prev => [...prev, `Jugador avanzo a [${tr}, ${tc}]`]);
        return nuevoMapa;
      }

      if (celdaDestino === 'B' || celdaDestino === 'X') {
        const dR = tr + dr;
        const dC = tc + dc;

        if (!(0 <= dR && dR < rows && 0 <= dC && dC < cols)) return prevMap;

        const celdaDetras = nuevoMapa[dR][dC];

        if (celdaDetras === 'F' || celdaDetras === 'T') {
          const destinoCajaEsMeta = celdaDetras === 'T';
          const cajaEmpujadaEstabaEnMeta = celdaDestino === 'X';

          nuevoMapa[dR][dC] = destinoCajaEsMeta ? 'X' : 'B';
          nuevoMapa[pr][pc] = origenEraMeta ? 'T' : 'F';
          nuevoMapa[tr][tc] = cajaEmpujadaEstabaEnMeta ? 'M' : 'P';

          setManualLogs(prev => [...prev, `Caja empujada hacia [${dR}, ${dC}]`]);

          let victoria = true;
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
              if (nuevoMapa[i][j] === 'B') victoria = false;
            }
          }
          if (victoria) {
            setGameWon(true);
            setManualLogs(prev => [...prev, "Nivel completado con exito. ¡Excelente!"]);
          }

          return nuevoMapa;
        }
      }

      return prevMap;
    });
  }, [rows, cols, gameWon]);

  // Capturador de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"].includes(e.key)) {
        e.preventDefault(); 
      }
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
    <div style={{ 
      display: "flex", 
      flexDirection: "column", // ✨ Cambiado a dirección de columna principal
      gap: "24px", 
      width: "100%",
      maxWidth: "1400px", 
      margin: "0 auto",
      boxSizing: "border-box"
    }}>

      {/* 🏙️ SECCIÓN SUPERIOR: PANEL IZQUIERDO + TABLERO */}
      <div style={{ display: "flex", gap: "24px", width: "100%", alignItems: "flex-start" }}>
        
        {/* 📋 COLUMNA 1: PANEL DE SELECCIÓN */}
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
          <h3 style={{ margin: "0", color: "#1e293b", fontSize: "17px", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" }}>
            Selección de Niveles
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", letterSpacing: "0.5px" }}>SELECCIONA UN RETO</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {[1, 2, 3].map((num) => (
                <button 
                  key={num}
                  onClick={() => cargarNivel(num)}
                  style={{ 
                    flex: 1, padding: "10px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer",
                    background: currentLevel === num ? "#534AB7" : "#f1f5f9",
                    color: currentLevel === num ? "#fff" : "#64748b",
                    transition: "all 0.2s"
                  }}
                >
                  Lvl {num}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>LEYENDA DE OBJETOS</span>
            {[
              ["#475569", "🧱 Muro / Pared"],
              ["#ffedd5", "🎯 Meta de depósito"],
              ["#f1f5f9", "📦 Caja de Madera"],
              ["#bbf7d0", "🟢 Caja bien colocada"],
              ["#f1f5f9", "👷 Operario / Jugador"]
            ].map(([color, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#334155" }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "4px", background: color, border: "1px solid #cbd5e1" }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* 🎮 COLUMNA 2: TABLERO ARCADE CENTRAL (Ocupa todo el resto del espacio superior) */}
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
          gap: "20px"
        }}>
          
          <div style={{ fontWeight: "bold", color: "#1e293b", fontSize: "16px" }}>
            {PRESET_LEVELS[currentLevel].name}
          </div>

          {gameWon && (
            <div style={{ background: "#dcfce7", color: "#15803d", padding: "10px 24px", borderRadius: "30px", fontWeight: "bold", fontSize: "14px" }}>
              🏆 ¡Increíble! Has solucionado el mapa a la perfección
            </div>
          )}

          {/* El mapa cuadriculado */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: `repeat(${cols}, 75px)`, 
            gap: "8px", 
            background: "#cbd5e1", 
            padding: "12px", 
            borderRadius: "14px",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.08)"
          }}>
            {gridMap.flat().map((cell, pos) => {
              const r = Math.floor(pos / cols);
              const c = pos % cols;
              const content = renderCellContent(r, c, cell);
              
              let bg = CELL_BASE[cell]?.bg ?? "#f1f5f9";
              if (cell === 'P' || cell === 'B' || cell === 'M' || cell === 'X') bg = "#f1f5f9";
              if (cell === 'M' || cell === 'X') bg = "#ffedd5"; 
              if (cell === 'X') bg = "#bbf7d0"; 

              return (
                <div
                  key={pos}
                  style={{
                    width: "75px", height: "75px", background: bg, display: "flex", 
                    flexDirection: "column", justifyContent: "center", alignItems: "center", 
                    fontSize: "26px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.04)"
                  }}
                >
                  <span>{content}</span>
                  <span style={{ fontSize: "8px", opacity: 0.3, marginTop: "2px", color: "#000" }}>{`[${r},${c}]`}</span>
                </div>
              );
            })}
          </div>

          {/* Barra de Controles */}
          <div style={{ display: "flex", gap: "8px", background: "#1e293b", padding: "8px 16px", borderRadius: "30px" }}>
            <button 
              onClick={() => cargarNivel(currentLevel)} 
              style={{ 
                padding: "8px 18px", background: "#64748b", color: "white", 
                border: "none", borderRadius: "20px", fontWeight: "bold", cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              ↺ Reiniciar Nivel
            </button>
          </div>
        </div>

      </div>

      {/* 🪵 🎚️ SECCIÓN INFERIOR: CINTA DE HISTORIAL HORIZONTAL */}
      <div style={{ 
        width: "100%", 
        background: "#ffffff", 
        padding: "20px 24px", 
        borderRadius: "16px", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        boxSizing: "border-box"
      }}>
        <h4 style={{ margin: "0", color: "#1e293b", fontSize: "14px", fontWeight: "700", letterSpacing: "0.5px" }}>
          HISTORIAL DE MOVIMIENTOS (TIMELINE)
        </h4>
        
        {/* Contenedor horizontal elástico con barra de desplazamiento */}
        <div 
          ref={logContainerRef}
          style={{ 
            display: "flex", 
            flexDirection: "row", // ✨ Elementos alineados de izquierda a derecha
            overflowX: "auto",    // ✨ Scroll puramente horizontal
            gap: "12px", 
            padding: "8px 4px", 
            background: "#f8fafc", 
            borderRadius: "10px", 
            border: "1px solid #e2e8f0",
            scrollBehavior: "smooth"
          }}
        >
          {manualLogs.map((log, i) => {
            const esUltimoPaso = i === manualLogs.length - 1;
            return (
              <div 
                key={i} 
                style={{ 
                  // Tarjetas con ancho fijo para que se enfilen horizontalmente en la cinta
                  flex: "0 0 auto", 
                  minWidth: "170px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  textAlign: "center",
                  border: esUltimoPaso ? "1px solid #C4C0F0" : "1px solid #e2e8f0",
                  background: esUltimoPaso ? "#EEEDFE" : "#ffffff", 
                  color: esUltimoPaso ? "#534AB7" : "#475569", 
                  fontWeight: esUltimoPaso ? "600" : "400",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                  transition: "all 0.15s"
                }}
              >
                {log}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}