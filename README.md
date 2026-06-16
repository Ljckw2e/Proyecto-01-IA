# Proyecto Final - Algoritmos de busqueda 🚀

Este es el repositorio del proyecto final de la materia de Inteligencia Artificial. Esta es una plataforma web asíncrona que permite vizualisar los diferentes algoritmos de busqueda. El proyecto está construido utilizando **Astro**  e integrado con **React** para componentes interactivos y dinámicos.

---

## 🛠️ Tecnologías Utilizadas

* **Framework Principal:** [Astro](https://astro.build/) (Configurado en modo Server-Side Rendering - SSR)
* **Librería de Interfaz:** [React](https://react.dev/) (Integrado en islas de interactividad)
* **Estilos Visuales:** [Inline Styles](CSS Nativo mediante Estilos en Línea)

**Lenguaje:** [Python 3](https://www.python.org/) (ideal para el procesamiento y manipulación de estructuras de datos complejas).
* **Framework API:** [FastAPI](https://fastapi.tiangolo.com/) / [Flask] (encargado de exponer los endpoints que procesan las matrices de los entornos).
* **Algoritmos Implementados:** * **Búsqueda No Informada:** BFS (Breadth-First Search) y DFS (Depth-First Search) para la resolución de Frozen Lake.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu equipo:

* **Node.js:** Versión `18.x` o superior recomendada.
* **Gestor de paquetes:** `pnpm` (puedes instalarlo con `npm install -g pnpm` si aún no lo tienes).

---

## 🚀 Instalación y Configuración

Sigue estos pasos para clonar el proyecto e instalar las dependencias correctamente:

### 1. Clonar el repositorio e ingresar a la carpeta
```bash
git https://github.com/Ljckw2e/Proyecto-01-IA
cd [Tu-ruta]
```

### 2. Instala dependencias
Instala todos los modulos definidos en el `package.json` usando `pnpm`:
```bash
pnpm install
```


## 3. Ejecución en Entorno de Desarrollo
Para iniciar un servidor de desarrollo local de Astro, ejecute el siguiente comando:
```bash
npm run dev
```
Por defecto, Astro intentará levantar el entorno en el puerto `4321` .
Si requieres forzar a Astro a correr específicamente en otro puerto utiliza:
```bash
npm dev --port [####]
```


## 📁 Estructura principal del proyecto
```text
ORBITAL-ORBIT/
├── 📁 public/
├── 📁 src/
│   ├── 📁 components/
│   │   └── 📁 Tableros/
│   │       ├── 📄 FrozenLake.astro
│   │       ├── 📄 FrozenLakeViz.jsx
│   │       ├── 📄 Sokoban.astro
│   │       └── 📄 SokobanViz.jsx
├── 📄 iniciar_proyecto.bat    <-- Script de automatización (Windows)
├── 📄 main.py                 <-- API Backend (FastAPI / Flask)
├── 📄 package.json            <-- Configuración de Astro
└── 📄 README.md


## Documentación de ASTRO
Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
