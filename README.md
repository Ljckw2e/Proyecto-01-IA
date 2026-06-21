# Proyecto Final - Algoritmos de busqueda 🚀

Este es el repositorio del proyecto final de la materia de Inteligencia Artificial. Esta es una plataforma web asíncrona que permite vizualisar los diferentes algoritmos de busqueda. El proyecto está construido utilizando **Astro**  e integrado con **React** para componentes interactivos y dinámicos.

---

## 🛠️ Tecnologías Utilizadas

* **Framework Principal:** [Astro](https://astro.build/) (Configurado en modo Server-Side Rendering - SSR)
* **Librería de Interfaz:** [React](https://react.dev/) (Integrado en islas de interactividad)
* **Estilos Visuales:** [Inline Styles](CSS Nativo mediante Estilos en Línea)

* **Lenguaje:** [Python 3](https://www.python.org/) (ideal para el procesamiento y manipulación de estructuras de datos complejas).
* **Framework API:** [FastAPI](https://fastapi.tiangolo.com/) / [Flask] (encargado de exponer los endpoints que procesan las matrices de los entornos).
* **Algoritmos Implementados:** * **Búsqueda No Informada:** BFS (Breadth-First Search) y DFS (Depth-First Search) para la resolución de Frozen Lake.

---

## 📋 Requisitos Previos

Para simplificar el despliegue del entorno y evitar la ejecución manual de múltiples terminales, el proyecto cuenta con un script de automatización para Windows (.bat).

Especifica las versiones de software con las que garantizas que tu proyecto funciona perfectamente:
* **Node.js:** Versión v18 o superior.
* **Python:** Versión 3.10 o superior.
* **Navegador:** Optimizado para Google Chrome o Microsoft Edge.

* Tener instalado Node.js y las dependencias de Astro (npm install).
* Tener instalado Python junto con el servidor de la API (pip install fastapi uvicorn o las dependencias de tu proyecto).

## Instrucciones de Ejecución
* Localiza el archivo iniciar_proyecto.bat en la raíz del proyecto.
* Dale doble clic para ejecutarlo.
* El script abrirá automáticamente dos ventanas de comandos en paralelo:
    Una ventana levantando la API de Python en el puerto 8000.
    Otra ventana levantando el entorno local de desarrollo de Astro.
* Abre tu navegador e ingresa a la dirección local que te indique Astro (normalmente http://localhost:4321).

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
│   │       └── 📄 QueensViz.jsx
│   │       └── 📄 TicTacToeViz.jsx
├── 📄 iniciar_proyecto.bat    <-- Script de automatización (Windows)
├── 📄 main.py                 <-- API Backend (FastAPI / Flask)
├── 📄 package.json            <-- Configuración de Astro
└── 📄 README.md
```
---

## 👤 Autores y Créditos

Sección para poner tus datos académicos:
* **Alumnos:** 
               Baran Quiroz Jose David
               Jairo Andrey Arrollo García
               Laila Jocelyn Rodríguez Martínez
* **Institución:** Instituto Politécnico Nacional.

                   Escuela Superior de Cómputo.
* **Asignatura:** Inteligencia Artificial
* **Grupo:** 6CM1

## Documentación de ASTRO
Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
