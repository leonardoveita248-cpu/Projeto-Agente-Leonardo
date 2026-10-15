@echo off
title Leonardo Veita - AI Food & Drink Concierge
echo ========================================================
echo    Iniciando Leonardo Veita - AI Concierge (Azure)
echo ========================================================
echo.

if not exist ".venv\Scripts\python.exe" (
    echo [ERRO] Ambiente virtual .venv nao encontrado!
    pause
    exit /b
)

echo Abrindo o navegador em http://localhost:8000...
start http://localhost:8000

echo Iniciando servidor FastAPI...
.venv\Scripts\python.exe server.py
pause
