@echo off
title Lanzador de Proyecto - ESCOM
echo ====================================================
echo   Levantando servidores para Frozen Lake y Sokoban
echo ====================================================

echo 1. Levantando API de Python (Puerto 8000)...
start cmd /k "uvicorn main:app --reload --port 8000"

echo 2. Levantando Servidor de Desarrollo Astro...
start cmd /k "npm run dev"

echo ====================================================
echo ¡Todo listo! No cierres las ventanas que se abrieron.
echo ====================================================
pause