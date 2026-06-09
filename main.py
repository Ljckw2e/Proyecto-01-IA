# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import deque
from typing import List
import heapq

app = FastAPI()

# Configuración de CORS: Permite que Astro se comunique con Python en local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En desarrollo local permite peticiones desde cualquier puerto
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo para recibir el mapa dinámico desde el Frontend
class GridConfig(BaseModel):
    algorithm: str
    rows: int
    cols: int
    grid: List[List[str]] # Matriz enviada desde React

def resolver_bfs_real(grid, rows, cols):
    # Encontrar posiciones de Inicio (S) y Meta (G) en la matriz
    start_flat = 0
    goal_flat = (rows * cols) - 1
    
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 'S': start_flat = r * cols + c
            if grid[r][c] == 'G': goal_flat = r * cols + c

    # Inicializar estructuras del BFS
    queue = deque([start_flat])
    parent = {start_flat: None}
    visited_set = set([start_flat])
    
    steps_history = []
    step_counter = 1
    found = False

    while queue:
        # 1. El nodo actual que vamos a expandir
        current = queue.popleft()
        curr_r, curr_c = current // cols, current % cols

        # Registrar el estado actual para la animación de React
        frontier_list = list(queue)
        visited_list = list(visited_set)
        
        steps_history.append({
            "step": step_counter,
            "current": current,
            "frontier": frontier_list,
            "visited": visited_list,
            "message": f"Evaluando celda [{curr_r},{curr_c}]",
            "found": False
        })
        step_counter += 1

        # Si llegamos a la meta, detenemos la búsqueda
        if current == goal_flat:
            found = True
            break

        # 2. Explorar vecinos (Arriba, Abajo, Izquierda, Derecha)
        direcciones = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        for dr, dc in direcciones:
            nr, nc = curr_r + dr, curr_c + dc
            
            # Verificar límites de la cuadrícula
            if 0 <= nr < rows and 0 <= nc < cols:
                # Verificar que no sea un agujero/pared (H)
                if grid[nr][nc] != 'H':
                    neighbor_flat = nr * cols + nc
                    if neighbor_flat not in visited_set:
                        visited_set.add(neighbor_flat)
                        parent[neighbor_flat] = current
                        queue.append(neighbor_flat)

    # 3. Reconstruir el camino solución si se encontró el éxito
    solution_path = []
    if found:
        curr = goal_flat
        while curr is not None:
            solution_path.append(curr)
            curr = parent[curr]
        solution_path.reverse()
        
        # Marcar el último paso con la solución final
        steps_history[-1]["found"] = True
        steps_history[-1]["solution_path"] = solution_path
        steps_history[-1]["message"] = "¡Meta encontrada! Trazando camino óptimo."
    else:
        if steps_history:
            steps_history[-1]["message"] = "No existe un camino posible para resolver el laberinto."

    return steps_history

# Representación de elementos de Sokoban:
# 'W' = Pared (Wall), 'P' = Jugador (Player), 'B' = Caja (Box), 'T' = Objetivo (Target), 
# 'X' = Caja sobre Objetivo, 'F' = Piso vacío

def calcular_distancia_manhattan(pos1, pos2, cols):
    r1, c1 = pos1 // cols, pos1 % cols
    r2, c2 = pos2 // cols, pos2 % cols
    return abs(r1 - r2) + abs(c1 - c2)

def heuristica_sokoban(box_positions, target_positions, cols):
    """Suma de las distancias Manhattan de cada caja al objetivo más cercano"""
    total_h = 0
    for box in box_positions:
        if box in target_positions:
            continue
        distancias = [calcular_distancia_manhattan(box, t, cols) for t in target_positions]
        total_h += min(distancias) if distancias else 0
    return total_h

def resolver_sokoban_astar(grid, rows, cols):
    # 1. Extraer posiciones iniciales fijas y dinámicas
    player_start = 0
    box_starts = []
    targets = set()
    walls = set()

    for r in range(rows):
        for c in range(cols):
            pos_flat = r * cols + c
            val = grid[r][c]
            if val == 'W': walls.add(pos_flat)
            elif val == 'T': targets.add(pos_flat)
            elif val == 'P': player_start = pos_flat
            elif val == 'B': box_starts.append(pos_flat)
            elif val == 'X': 
                targets.add(pos_flat)
                box_starts.append(pos_flat)

    box_starts = tuple(sorted(box_starts))
    estado_inicial = (player_start, box_starts)

    # Cola de prioridad para A* -> Guarda tuplas: (f_score, g_score, estado_actual)
    # f_score = g_score + h_score
    h_inicial = heuristica_sokoban(box_starts, targets, cols)
    open_set = [(h_inicial, 0, estado_inicial)]
    
    parent = {estado_inicial: None}
    g_score = {estado_inicial: 0}
    visited_states = set([estado_inicial])

    steps_history = []
    step_counter = 1
    found = False
    ultimo_estado = None

    while open_set:
        f, g, estado_actual = heapq.heappop(open_set)
        player, boxes = estado_actual

        # Registrar este paso para que React lo dibuje
        steps_history.append({
            "step": step_counter,
            "current_player": player,
            "current_boxes": list(boxes),
            "message": f"A* evaluando estado con F={f} (G={g}, H={f-g})",
            "found": False
        })
        step_counter += 1

        # Condición de victoria: todas las cajas están en un objetivo
        if set(boxes) == targets:
            found = True
            ultimo_estado = estado_actual
            break

        p_r, p_c = player // cols, player % cols
        movimientos = [(-1, 0), (1, 0), (0, -1), (0, 1)] # Arriba, Abajo, Izquierda, Derecha

        for dr, dc in movimientos:
            np_r, np_c = p_r + dr, p_c + dc
            if not (0 <= np_r < rows and 0 <= np_c < cols): continue
            
            next_player = np_r * cols + np_c
            if next_player in walls: continue

            next_boxes = list(boxes)

            # ¿El jugador intenta empujar una caja?
            if next_player in boxes:
                # Calcular dónde terminaría la caja
                nb_r, nb_c = np_r + dr, np_c + dc
                if not (0 <= nb_r < rows and 0 <= nb_c < cols): continue
                
                next_box_pos = nb_r * cols + nb_c
                # No se puede empujar si hay una pared u otra caja ahí
                if next_box_pos in walls or next_box_pos in boxes: continue
                
                # Mover la caja en la lista
                idx = next_boxes.index(next_player)
                next_boxes[idx] = next_box_pos

            next_boxes_tuple = tuple(sorted(next_boxes))
            nuevo_estado = (next_player, next_boxes_tuple)

            if nuevo_estado not in visited_states:
                visited_states.add(nuevo_estado)
                parent[nuevo_estado] = estado_actual
                g_score[nuevo_estado] = g + 1
                f_score = g + 1 + heuristica_sokoban(next_boxes_tuple, targets, cols)
                heapq.heappush(open_set, (f_score, g + 1, nuevo_estado))

    # Reconstruir camino óptimo si hubo éxito
    if found:
        path = []
        curr = ultimo_estado
        while curr is not None:
            path.append(curr)
            curr = parent[curr]
        path.reverse()
        
        # Mapear el camino solución para enviarlo simplificado al frente
        sol_path_history = [{"player": p, "boxes": list(b)} for p, b in path]
        steps_history[-1]["found"] = True
        steps_history[-1]["solution_path"] = sol_path_history
        steps_history[-1]["message"] = "¡A* encontró la secuencia óptima de empujes!"
    else:
        if steps_history:
            steps_history[-1]["message"] = "No hay solución: las cajas quedaron bloqueadas."

    return steps_history

# Modifica tu endpoint POST en main.py para redirigir según el problema
@app.post("/api/search")
def buscar_algoritmo(config: GridConfig):
    if config.algorithm in ['bfs', 'dfs']:
        steps = resolver_bfs_real(config.grid, config.rows, config.cols)
    elif config.algorithm in ['astar', 'greedy']:
        steps = resolver_sokoban_astar(config.grid, config.rows, config.cols)
    else:
        steps = []
        
    return {
        "grid": config.grid,
        "cols": config.cols,
        "steps": steps
    }

@app.post("/api/search")
def buscar_algoritmo(config: GridConfig):
    steps = resolver_bfs_real(config.grid, config.rows, config.cols)
    return {
        "grid": config.grid,
        "cols": config.cols,
        "steps": steps
    }