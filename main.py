# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import deque
from typing import List
from collections import deque
import heapq
import itertools

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
            if grid[r][c] == "S":
                start_flat = r * cols + c
            if grid[r][c] == "G":
                goal_flat = r * cols + c

    queue = deque([start_flat])
    parent = {start_flat: None}
    visited_set = set([start_flat])
    steps_history = []
    step_counter = 1
    found = False

    while queue:
        current = queue.popleft()
        curr_r, curr_c = current // cols, current % cols
        steps_history.append(
            {
                "step": step_counter,
                "current": current,
                "frontier": list(queue),
                "visited": list(visited_set),
                "message": f"Evaluando celda [{curr_r},{curr_c}]",
                "found": False,
            }
        )
        step_counter += 1

        if current == goal_flat:
            found = True
            break

        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nr, nc = curr_r + dr, curr_c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "H":
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
        if steps_history:
            steps_history[-1]["message"] = "No existe un camino posible."
    return steps_history


# =====================================================================
# MÓDULO 2: SOKOBAN (A*)
# =====================================================================
MOVIMIENTOS = {
    "U": (-1, 0),
    "D": (1, 0),
    "L": (0, -1),
    "R": (0, 1),
}

DIRECCIONES = tuple(MOVIMIENTOS.items())
INFINITO = 10**9


def leer_tablero_sokoban(grid, rows, cols):
    jugador = None
    cajas = set()
    objetivos = set()
    pisos = set()
    muros = set()

    for r in range(rows):
        for c in range(cols):
            celda = grid[r][c]
            posicion = (r, c)

            if celda == "W":
                muros.add(posicion)
                continue

            pisos.add(posicion)

            if celda in {"P", "M"}:
                jugador = posicion
            if celda in {"B", "X"}:
                cajas.add(posicion)
            if celda in {"T", "M", "X"}:
                objetivos.add(posicion)

    return jugador, frozenset(cajas), frozenset(objetivos), pisos, muros


def posiciones_alcanzables(jugador, cajas, pisos, guardar_padres=False):
    cola = deque([jugador])
    visitados = {jugador}
    padres = {jugador: None} if guardar_padres else None

    while cola:
        r, c = cola.popleft()

        for _, (dr, dc) in DIRECCIONES:
            siguiente = (r + dr, c + dc)

            if siguiente not in pisos or siguiente in cajas or siguiente in visitados:
                continue

            visitados.add(siguiente)
            cola.append(siguiente)

            if guardar_padres:
                padres[siguiente] = (r, c)

    return visitados, padres


def clave_estado(jugador, cajas, pisos):
    alcanzables, _ = posiciones_alcanzables(jugador, cajas, pisos)
    return min(alcanzables), cajas


def distancias_inversas(objetivos, pisos):
    distancias = []
    casillas_validas = set()

    for objetivo in objetivos:
        distancia = {objetivo: 0}
        cola = deque([objetivo])

        while cola:
            r, c = cola.popleft()

            for _, (dr, dc) in DIRECCIONES:
                caja_anterior = (r - dr, c - dc)
                posicion_jugador = (r - 2 * dr, c - 2 * dc)

                if (
                    caja_anterior in pisos
                    and posicion_jugador in pisos
                    and caja_anterior not in distancia
                ):
                    distancia[caja_anterior] = distancia[(r, c)] + 1
                    cola.append(caja_anterior)

        distancias.append(distancia)
        casillas_validas.update(distancia)

    return distancias, casillas_validas


def costo_asignacion_minima(matriz):
    """Costo mínimo para asignar una caja distinta a cada objetivo."""
    n = len(matriz)
    u = [0] * (n + 1)
    v = [0] * (n + 1)
    p = [0] * (n + 1)
    camino = [0] * (n + 1)

    for i in range(1, n + 1):
        p[0] = i
        columna_actual = 0
        minimo = [INFINITO] * (n + 1)
        usado = [False] * (n + 1)

        while True:
            usado[columna_actual] = True
            fila_actual = p[columna_actual]
            delta = INFINITO
            siguiente_columna = 0

            for columna in range(1, n + 1):
                if usado[columna]:
                    continue

                valor = (
                    matriz[fila_actual - 1][columna - 1] - u[fila_actual] - v[columna]
                )

                if valor < minimo[columna]:
                    minimo[columna] = valor
                    camino[columna] = columna_actual

                if minimo[columna] < delta:
                    delta = minimo[columna]
                    siguiente_columna = columna

            if delta >= INFINITO:
                return INFINITO

            for columna in range(n + 1):
                if usado[columna]:
                    u[p[columna]] += delta
                    v[columna] -= delta
                else:
                    minimo[columna] -= delta

            columna_actual = siguiente_columna
            if p[columna_actual] == 0:
                break

        while True:
            columna_anterior = camino[columna_actual]
            p[columna_actual] = p[columna_anterior]
            columna_actual = columna_anterior

            if columna_actual == 0:
                break

    asignacion = [-1] * n
    for columna in range(1, n + 1):
        asignacion[p[columna] - 1] = columna - 1

    costo = 0
    for fila, columna in enumerate(asignacion):
        valor = matriz[fila][columna]
        if valor >= INFINITO:
            return INFINITO
        costo += valor

    return costo


def crear_heuristica(distancias):
    cache = {}

    def heuristica(cajas):
        if cajas in cache:
            return cache[cajas]

        matriz = [
            [distancia.get(caja, INFINITO) for distancia in distancias]
            for caja in cajas
        ]
        resultado = costo_asignacion_minima(matriz)
        cache[cajas] = resultado
        return resultado

    return heuristica


def bloqueo_dos_por_dos(cajas, objetivos, muros, caja_movida):
    r, c = caja_movida

    for inicio_r in (r - 1, r):
        for inicio_c in (c - 1, c):
            bloque = {
                (inicio_r, inicio_c),
                (inicio_r + 1, inicio_c),
                (inicio_r, inicio_c + 1),
                (inicio_r + 1, inicio_c + 1),
            }

            if all(pos in cajas or pos in muros for pos in bloque):
                if any(pos in cajas and pos not in objetivos for pos in bloque):
                    return True

    return False


def camino_hasta(origen, destino, cajas, pisos):
    _, padres = posiciones_alcanzables(origen, cajas, pisos, guardar_padres=True)

    if destino not in padres:
        return None

    posiciones = []
    actual = destino

    while actual != origen:
        posiciones.append(actual)
        actual = padres[actual]

    posiciones.reverse()
    movimientos = []
    anterior = origen

    for posicion in posiciones:
        diferencia = (posicion[0] - anterior[0], posicion[1] - anterior[1])

        for letra, direccion in DIRECCIONES:
            if direccion == diferencia:
                movimientos.append(letra)
                break

        anterior = posicion

    return movimientos


def reconstruir_movimientos(
    clave_final,
    clave_inicial,
    padres,
    acciones,
    jugador_inicial,
    cajas_iniciales,
    pisos,
):
    cadena = []
    actual = clave_final

    while actual != clave_inicial:
        cadena.append(actual)
        actual = padres[actual]

    cadena.reverse()
    jugador = jugador_inicial
    cajas = cajas_iniciales
    movimientos = []

    for clave in cadena:
        caja, letra = acciones[clave]
        dr, dc = MOVIMIENTOS[letra]
        posicion_empuje = (caja[0] - dr, caja[1] - dc)
        camino = camino_hasta(jugador, posicion_empuje, cajas, pisos)

        if camino is None:
            return None

        movimientos.extend(camino)
        movimientos.append(letra)

        destino = (caja[0] + dr, caja[1] + dc)
        nuevas_cajas = set(cajas)
        nuevas_cajas.remove(caja)
        nuevas_cajas.add(destino)

        cajas = frozenset(nuevas_cajas)
        jugador = caja

    return "".join(movimientos)


def buscar_sokoban(grid, rows, cols, algoritmo):
    jugador, cajas, objetivos, pisos, muros = leer_tablero_sokoban(grid, rows, cols)

    if jugador is None or not cajas or len(cajas) != len(objetivos):
        return None

    distancias, casillas_validas = distancias_inversas(objetivos, pisos)
    heuristica = crear_heuristica(distancias)
    h_inicial = heuristica(cajas)

    if h_inicial >= INFINITO:
        return None

    clave_inicial = clave_estado(jugador, cajas, pisos)
    estados = {clave_inicial: (jugador, cajas)}
    padres = {clave_inicial: None}
    acciones = {}
    costos = {clave_inicial: 0}
    cerrados = set()
    contador = itertools.count()

    frontera = [(h_inicial, h_inicial, 0, 0, next(contador), clave_inicial)]

    while frontera:
        _, _, _, g_insertado, _, clave = heapq.heappop(frontera)

        if g_insertado != costos.get(clave) or clave in cerrados:
            continue

        cerrados.add(clave)
        jugador_actual, cajas_actuales = estados[clave]

        if cajas_actuales == objetivos:
            return reconstruir_movimientos(
                clave,
                clave_inicial,
                padres,
                acciones,
                jugador,
                cajas,
                pisos,
            )

        alcanzables, _ = posiciones_alcanzables(jugador_actual, cajas_actuales, pisos)

        for caja in cajas_actuales:
            for letra, (dr, dc) in DIRECCIONES:
                posicion_empuje = (caja[0] - dr, caja[1] - dc)
                destino = (caja[0] + dr, caja[1] + dc)

                if posicion_empuje not in alcanzables:
                    continue
                if destino not in pisos or destino in cajas_actuales:
                    continue
                if destino not in objetivos and destino not in casillas_validas:
                    continue

                nuevas_cajas = set(cajas_actuales)
                nuevas_cajas.remove(caja)
                nuevas_cajas.add(destino)
                nuevas_cajas = frozenset(nuevas_cajas)

                if bloqueo_dos_por_dos(nuevas_cajas, objetivos, muros, destino):
                    continue

                nuevo_jugador = caja
                nueva_clave = clave_estado(nuevo_jugador, nuevas_cajas, pisos)
                nuevo_costo = g_insertado + 1

                if nuevo_costo >= costos.get(nueva_clave, INFINITO):
                    continue

                h = heuristica(nuevas_cajas)
                if h >= INFINITO:
                    continue

                costos[nueva_clave] = nuevo_costo
                estados[nueva_clave] = (nuevo_jugador, nuevas_cajas)
                padres[nueva_clave] = clave
                acciones[nueva_clave] = (caja, letra)
                cerrados.discard(nueva_clave)

                prioridad = h if algoritmo == "gbfs" else nuevo_costo + h
                heapq.heappush(
                    frontera,
                    (
                        prioridad,
                        h,
                        -nuevo_costo,
                        nuevo_costo,
                        next(contador),
                        nueva_clave,
                    ),
                )

    return None


def movimientos_a_pasos(grid, rows, cols, movimientos, algoritmo):
    jugador, cajas, objetivos, pisos, _ = leer_tablero_sokoban(grid, rows, cols)
    nombre = "GBFS" if algoritmo == "gbfs" else "A*"

    if jugador is None:
        return []

    pasos = [
        {
            "step": 0,
            "player": list(jugador),
            "boxes": [list(caja) for caja in sorted(cajas)],
            "message": f"Estado inicial de {nombre}.",
            "found": False,
        }
    ]

    for numero, letra in enumerate(movimientos, start=1):
        dr, dc = MOVIMIENTOS[letra]
        siguiente = (jugador[0] + dr, jugador[1] + dc)
        empujo = siguiente in cajas

        if siguiente not in pisos:
            return []

        nuevas_cajas = set(cajas)

        if empujo:
            destino = (siguiente[0] + dr, siguiente[1] + dc)

            if destino not in pisos or destino in cajas:
                return []

            nuevas_cajas.remove(siguiente)
            nuevas_cajas.add(destino)

        jugador = siguiente
        cajas = frozenset(nuevas_cajas)

        pasos.append(
            {
                "step": numero,
                "player": list(jugador),
                "boxes": [list(caja) for caja in sorted(cajas)],
                "message": (
                    f"{nombre}: empuje de caja."
                    if empujo
                    else f"{nombre}: movimiento del jugador."
                ),
                "found": False,
            }
        )

    solucionado = cajas == objetivos

    if pasos:
        pasos[-1]["found"] = solucionado
        pasos[-1]["message"] = (
            f"Meta alcanzada con {nombre}."
            if solucionado
            else f"La secuencia de {nombre} no completó el tablero."
        )

    return pasos if solucionado else []


def resolver_sokoban(grid, rows, cols, algoritmo):
    movimientos = buscar_sokoban(grid, rows, cols, algoritmo)

    if movimientos is not None:
        pasos = movimientos_a_pasos(grid, rows, cols, movimientos, algoritmo)
        if pasos:
            return pasos

    jugador, cajas, _, _, _ = leer_tablero_sokoban(grid, rows, cols)
    nombre = "GBFS" if algoritmo == "gbfs" else "A*"

    return [
        {
            "step": 0,
            "player": list(jugador) if jugador else [],
            "boxes": [list(caja) for caja in sorted(cajas)],
            "message": f"No se encontró una solución con {nombre}.",
            "found": False,
        }
    ]


def resolver_sokoban_gbfs(grid, rows, cols):
    return resolver_sokoban(grid, rows, cols, "gbfs")


def resolver_sokoban_astar_full(grid, rows, cols):
    return resolver_sokoban(grid, rows, cols, "astar")


# =====================================================================
# MÓDULO 3: BÚSQUEDA LOCAL — N REINAS (HILL CLIMBING REAL)
# =====================================================================


class QueensConfig(BaseModel):
    num_queens: int
    initial_state: List[int]


def obtener_conflictos_reinas(state):
    """Retorna el total de choques y la lista de columnas en conflicto."""
    n = len(state)
    columnas_en_conflicto = set()
    attacks = 0
    for i in range(n):
        if state[i] == -1:
            continue
        for j in range(i + 1, n):
            if state[j] == -1:
                continue
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

    steps_history.append(
        {
            "step": step_counter,
            "state": list(current_state),
            "attacks": current_attacks,
            "conflicts": en_conflicto,
            "chosen_column": -1,
            "message": f"Configuración inicial cargada con {current_attacks} conflictos.",
        }
    )

    max_steps = 40

    while step_counter < max_steps and current_attacks > 0:
        best_neighbor = list(current_state)
        best_attacks = current_attacks
        chosen_col = -1

        # Evaluar todo el vecindario completo
        for col in range(n):
            original_row = current_state[col]
            for row in range(n):
                if row == original_row:
                    continue

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
            steps_history.append(
                {
                    "step": step_counter,
                    "state": list(current_state),
                    "attacks": current_attacks,
                    "conflicts": en_conflicto,
                    "chosen_column": -1,
                    "message": "Fin de la búsqueda: Se alcanzó un Máximo Local.",
                }
            )
            break

        current_state = best_neighbor
        current_attacks = best_attacks
        _, en_conflicto = obtener_conflictos_reinas(current_state)
        step_counter += 1

        steps_history.append(
            {
                "step": step_counter,
                "state": list(current_state),
                "attacks": current_attacks,
                "conflicts": en_conflicto,
                "chosen_column": chosen_col,
                "message": f"Optimización: Reina de la columna {chosen_col} movida. Conflictos: {current_attacks}.",
            }
        )

    return steps_history, current_attacks == 0


# =====================================================================
# MÓDULO 4: BÚSQUEDA ADVERSARIA — GATO (MINIMAX)
# =====================================================================
def evaluar_tablero_gato(b):
    lineas = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ]
    for l in lineas:
        if b[l[0]] == b[l[1]] == b[l[2]] and b[l[0]] != "":
            return 10 if b[l[0]] == "O" else -10
    return 0


def minimax_gato(b, depth, is_max):
    score = evaluar_tablero_gato(b)
    if score == 10:
        return score - depth
    if score == -10:
        return score + depth
    if "" not in b:
        return 0

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
    if config.algorithm in ["bfs", "dfs"]:
        steps = resolver_bfs_real(config.grid, config.rows, config.cols)

    elif config.algorithm == "astar":
        steps = resolver_sokoban_astar_full(config.grid, config.rows, config.cols)

    elif config.algorithm == "greedy":
        steps = resolver_sokoban_gbfs(config.grid, config.rows, config.cols)
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
    return {
        "best_move": best_move,
        "scores": casillas_evaluadas,
        "message": f"IA jugó en la casilla {best_move}.",
    }
