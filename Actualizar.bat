@echo off
title Editorcut - Actualizar en GitHub y Vercel
echo ========================================================
echo        Actualizando Editorcut a GitHub y Vercel
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/3] Detectando archivos modificados...
git add .

echo.
echo [2/3] Guardando cambios locales...
git commit -m "Actualizacion: %date% %time%" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Cambios guardados correctamente.
) else (
    echo No habia cambios nuevos locales para empaquetar.
)

echo.
echo [3/3] Subiendo cambios a GitHub (rama main)...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo             ^!ACTUALIZACION EXITOSA^!
    echo ========================================================
    echo Los cambios se enviaron a GitHub con exito.
    echo Vercel detectara la actualizacion y desplegara la web
    echo de forma automatica en 1 o 2 minutos.
) else (
    echo ========================================================
    echo             Aviso de sincronizacion
    echo ========================================================
    echo Si hubo algun problema al conectar con GitHub, verifica
    echo tu conexion a internet e intenta nuevamente.
)

echo.
pause
