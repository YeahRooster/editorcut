@echo off
title Editorcut - Servidor Local
echo ========================================================
echo          Iniciando Editorcut (Modo Local)
echo ========================================================
echo.
cd /d "%~dp0"
echo Abriendo navegador en http://localhost:5173 ...
start "" "http://localhost:5173"
echo.
echo Ejecutando servidor local...
call npm run dev
pause
