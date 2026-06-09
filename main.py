# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import deque
from typing import List

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

@app.post("/api/search")
def buscar_algoritmo(config: GridConfig):
    steps = resolver_bfs_real(config.grid, config.rows, config.cols)
    return {
        "grid": config.grid,
        "cols": config.cols,
        "steps": steps
    }