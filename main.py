# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import deque
from typing import List
import heapq

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GridConfig(BaseModel):
    algorithm: str
    rows: int
    cols: int
    grid: List[List[str]]

class QueensConfig(BaseModel):
    num_queens: int
    initial_state: List[int]

class GatoConfig(BaseModel):
    board: List[str]

# =====================================================================
# MÓDULO 1: FROZEN LAKE (BFS)
# =====================================================================
def resolver_bfs_real(grid, rows, cols):
    start_flat, goal_flat = 0, (rows * cols) - 1
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 'S': start_flat = r * cols + c
            if grid[r][c] == 'G': goal_flat = r * cols + c

    queue = deque([start_flat])
    parent = {start_flat: None}
    visited_set = set([start_flat])
    steps_history = []
    step_counter = 1
    found = False

    while queue:
        current = queue.popleft()
        curr_r, curr_c = current // cols, current % cols
        steps_history.append({
            "step": step_counter,
            "current": current,
            "frontier": list(queue),
            "visited": list(visited_set),
            "message": f"Evaluando celda [{curr_r},{curr_c}]",
            "found": False
        })
        step_counter += 1

        if current == goal_flat:
            found = True
            break

        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = curr_r + dr, curr_c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != 'H':
                neighbor_flat = nr * cols + nc
                if neighbor_flat not in visited_set:
                    visited_set.add(neighbor_flat)
                    parent[neighbor_flat] = current
                    queue.append(neighbor_flat)

    if found:
        path = []
        curr = goal_flat
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
        path.reverse()
        steps_history[-1]["found"] = True
        steps_history[-1]["solution_path"] = path
        steps_history[-1]["message"] = "¡Meta encontrada! Trazando camino óptimo."
    else:
        if steps_history: steps_history[-1]["message"] = "No existe un camino posible."
    return steps_history

# =====================================================================
# MÓDULO 2: SOKOBAN (A*)
# =====================================================================
def calcular_distancia_manhattan(pos1, pos2, cols):
    return abs(pos1 // cols - pos2 // cols) + abs(pos1 % cols - pos2 % cols)

def heuristica_sokoban(box_positions, target_positions, cols):
    total_h = 0
    for box in box_positions:
        if box in target_positions: continue
        distancias = [calcular_distancia_manhattan(box, t, cols) for t in target_positions]
        total_h += min(distancias) if distancias else 0
    return total_h

def resolver_sokoban_astar(grid, rows, cols):
    player_start = 0
    box_starts, targets, walls = [], set(), set()
    for r in range(rows):
        for c in range(cols):
            pos_flat = r * cols + c
            if grid[r][c] == 'W': walls.add(pos_flat)
            elif grid[r][c] == 'T': targets.add(pos_flat)
            elif grid[r][c] == 'P': player_start = pos_flat
            elif grid[r][c] == 'B': box_starts.append(pos_flat)
            elif grid[r][c] == 'X':
                targets.add(pos_flat)
                box_starts.append(pos_flat)

    box_starts = tuple(sorted(box_starts))
    estado_inicial = (player_start, box_starts)
    open_set = [(heuristica_sokoban(box_starts, targets, cols), 0, estado_inicial)]
    parent, g_score, visited_states = {estado_inicial: None}, {estado_inicial: 0}, set([estado_inicial])
    steps_history, step_counter, found, ultimo_estado = [], 1, False, None

    while open_set:
        f, g, estado_actual = heapq.heappop(open_set)
        player, boxes = estado_actual
        steps_history.append({
            "step": step_counter, "current_player": player, "current_boxes": list(boxes),
            "message": f"A* evaluando estado con F={f} (G={g}, H={f-g})", "found": False
        })
        step_counter += 1

        if set(boxes) == targets:
            found = True
            ultimo_estado = estado_actual
            break

        p_r, p_c = player // cols, player % cols
        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            np_r, np_c = p_r + dr, p_c + dc
            if 0 <= np_r < rows and 0 <= np_c < cols:
                next_player = np_r * cols + np_c
                if next_player in walls: continue
                next_boxes = list(boxes)
                if next_player in boxes:
                    nb_r, nb_c = np_r + dr, np_c + dc
                    if not (0 <= nb_r < rows and 0 <= nb_c < cols): continue
                    next_box_pos = nb_r * cols + nb_c
                    if next_box_pos in walls or next_box_pos in boxes: continue
                    idx = next_boxes.index(next_player)
                    next_boxes[idx] = next_box_pos
                
                nuevo_estado = (next_player, tuple(sorted(next_boxes)))
                if nuevo_estado not in visited_states:
                    visited_states.add(nuevo_estado)
                    parent[nuevo_estado] = estado_actual
                    g_score[nuevo_estado] = g + 1
                    f_score = g + 1 + heuristica_sokoban(nuevo_estado[1], targets, cols)
                    heapq.heappush(open_set, (f_score, g + 1, nuevo_estado))

    if found:
        path = []
        curr = ultimo_estado
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
        path.reverse()
        steps_history[-1]["found"] = True
        steps_history[-1]["solution_path"] = [{"player": p, "boxes": list(b)} for p, b in path]
        steps_history[-1]["message"] = "¡A* encontró la secuencia óptima!"
    return steps_history

# =====================================================================
# MÓDULO 3: BÚSQUEDA LOCAL — N REINAS (HILL CLIMBING REAL)
# =====================================================================
# Modifica la sección de las reinas en tu main.py para dejarlo así:

class QueensConfig(BaseModel):
    num_queens: int
    initial_state: List[int]

def obtener_conflictos_reinas(state):
    """Retorna el total de choques y la lista de columnas en conflicto."""
    n = len(state)
    columnas_en_conflicto = set()
    attacks = 0
    for i in range(n):
        if state[i] == -1: continue
        for j in range(i + 1, n):
            if state[j] == -1: continue
            if state[i] == state[j] or abs(state[i] - state[j]) == abs(i - j):
                attacks += 1
                columnas_en_conflicto.add(i)
                columnas_en_conflicto.add(j)
    return attacks, list(columnas_en_conflicto)

def resolver_queens_pure_hc(n, estado_inicial):
    current_state = list(estado_inicial)
    current_attacks, en_conflicto = obtener_conflictos_reinas(current_state)
    
    steps_history = []
    step_counter = 0
    
    steps_history.append({
        "step": step_counter,
        "state": list(current_state),
        "attacks": current_attacks,
        "conflicts": en_conflicto,
        "chosen_column": -1,
        "message": f"Configuración inicial cargada con {current_attacks} conflictos."
    })

    max_steps = 40
    
    while step_counter < max_steps and current_attacks > 0:
        best_neighbor = list(current_state)
        best_attacks = current_attacks
        chosen_col = -1
        
        # Evaluar todo el vecindario completo
        for col in range(n):
            original_row = current_state[col]
            for row in range(n):
                if row == original_row: continue
                
                vecino = list(current_state)
                vecino[col] = row
                vecino_attacks, _ = obtener_conflictos_reinas(vecino)
                
                if vecino_attacks < best_attacks:
                    best_attacks = vecino_attacks
                    best_neighbor = vecino
                    chosen_col = col
                    
        # Si no hay mejora, es un Máximo Local
        if best_attacks >= current_attacks:
            step_counter += 1
            steps_history.append({
                "step": step_counter, "state": list(current_state), "attacks": current_attacks,
                "conflicts": en_conflicto, "chosen_column": -1,
                "message": "Fin de la búsqueda: Se alcanzó un Máximo Local."
            })
            break
            
        current_state = best_neighbor
        current_attacks = best_attacks
        _, en_conflicto = obtener_conflictos_reinas(current_state)
        step_counter += 1
        
        steps_history.append({
            "step": step_counter,
            "state": list(current_state),
            "attacks": current_attacks,
            "conflicts": en_conflicto,
            "chosen_column": chosen_col,
            "message": f"Optimización: Reina de la columna {chosen_col} movida. Conflictos: {current_attacks}."
        })

    return steps_history, current_attacks == 0



# =====================================================================
# MÓDULO 4: BÚSQUEDA ADVERSARIA — GATO (MINIMAX)
# =====================================================================
def evaluar_tablero_gato(b):
    lineas = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for l in lineas:
        if b[l[0]] == b[l[1]] == b[l[2]] and b[l[0]] != "":
            return 10 if b[l[0]] == "O" else -10
    return 0

def minimax_gato(b, depth, is_max):
    score = evaluar_tablero_gato(b)
    if score == 10: return score - depth
    if score == -10: return score + depth
    if "" not in b: return 0

    if is_max:
        best = -1000
        for i in range(9):
            if b[i] == "":
                b[i] = "O"
                best = max(best, minimax_gato(b, depth + 1, False))
                b[i] = ""
        return best
    else:
        best = 1000
        for i in range(9):
            if b[i] == "":
                b[i] = "X"
                best = min(best, minimax_gato(b, depth + 1, True))
                b[i] = ""
        return best

# =====================================================================
# ENDPOINTS CENTRALES DE LA API
# =====================================================================
@app.post("/api/search")
def buscar_algoritmo(config: GridConfig):
    if config.algorithm in ['bfs', 'dfs']:
        steps = resolver_bfs_real(config.grid, config.rows, config.cols)
    elif config.algorithm in ['astar', 'greedy']:
        steps = resolver_sokoban_astar(config.grid, config.rows, config.cols)
    else:
        steps = []
    return {"grid": config.grid, "cols": config.cols, "steps": steps}

@app.post("/api/queens")
def buscar_reinas(config: QueensConfig):
    steps, success = resolver_queens_pure_hc(config.num_queens, config.initial_state)
    return {"success": success, "steps": steps}

@app.post("/api/gato")
def jugar_gato(config: GatoConfig):
    board = config.board
    best_val, best_move = -1000, -1
    casillas_evaluadas = {}
    for i in range(9):
        if board[i] == "":
            board[i] = "O"
            move_val = minimax_gato(board, 0, False)
            board[i] = ""
            casillas_evaluadas[i] = move_val
            if move_val > best_val:
                best_val = move_val
                best_move = i
    return {"best_move": best_move, "scores": casillas_evaluadas, "message": f"IA jugó en la casilla {best_move}."}