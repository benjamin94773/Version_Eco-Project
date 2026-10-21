Write-Host "Iniciando Version-Eco en local..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\backend'; Write-Host '--- BACKEND (Puerto 4000) ---' -ForegroundColor Green; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\frontend'; Write-Host '--- FRONTEND (Puerto 5173) ---' -ForegroundColor Cyan; npm run dev"

Write-Host "Ventanas de Backend y Frontend lanzadas con exito." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:4000/api" -ForegroundColor Yellow
