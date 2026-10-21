param(
    [Parameter(Mandatory=$false)]
    [string]$DbPassword = "",
    [Parameter(Mandatory=$false)]
    [string]$DbUser = "postgres",
    [Parameter(Mandatory=$false)]
    [string]$DbHost = "localhost",
    [Parameter(Mandatory=$false)]
    [int]$DbPort = 5432,
    [Parameter(Mandatory=$false)]
    [string]$DbName = "version_eco_db"
)

$ErrorActionPreference = "Stop"
$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
if (-not (Test-Path "$rootDir\database\01_schema_version_eco.sql")) {
    $rootDir = (Get-Location).Path
}

$schemaPath = Join-Path $rootDir "database\01_schema_version_eco.sql"
$seedPath   = Join-Path $rootDir "database\02_seed_demo.sql"
$envPath    = Join-Path $rootDir "backend\.env"

$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    $found = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($found) { $psqlPath = $found.Source }
    else { throw "No se encontro psql.exe en el sistema." }
}

if (-not [string]::IsNullOrWhiteSpace($DbPassword)) {
    $env:PGPASSWORD = $DbPassword
}

Write-Host ">>> Verificando conexion con PostgreSQL ($DbUser@${DbHost}:${DbPort})..." -ForegroundColor Cyan
try {
    $test = & $psqlPath -U $DbUser -h $DbHost -p $DbPort -d postgres -t -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo conectar a PostgreSQL: $test"
    }
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
}

Write-Host ">>> Creando o reiniciando base de datos '$DbName'..." -ForegroundColor Cyan
$dbExists = & $psqlPath -U $DbUser -h $DbHost -p $DbPort -d postgres -t -A -c "SELECT 1 FROM pg_database WHERE datname='$DbName';"
if ($dbExists -ne "1") {
    & $psqlPath -U $DbUser -h $DbHost -p $DbPort -d postgres -c "CREATE DATABASE $DbName;"
    Write-Host "Base de datos '$DbName' creada con exito." -ForegroundColor Green
} else {
    Write-Host "Base de datos '$DbName' existente detectada. Reiniciando esquema a limpio..." -ForegroundColor Yellow
    & $psqlPath -U $DbUser -h $DbHost -p $DbPort -d $DbName -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
}

Write-Host ">>> Ejecutando esquema ($schemaPath)..." -ForegroundColor Cyan
& $psqlPath -U $DbUser -h $DbHost -p $DbPort -d $DbName -f $schemaPath

Write-Host ">>> Cargando datos DEMO iniciales ($seedPath)..." -ForegroundColor Cyan
& $psqlPath -U $DbUser -h $DbHost -p $DbPort -d $DbName -f $seedPath

Write-Host ">>> Configurando $envPath..." -ForegroundColor Cyan
$encodedPassword = [System.Uri]::EscapeDataString($DbPassword)
$databaseUrl = "postgres://${DbUser}:${encodedPassword}@${DbHost}:${DbPort}/${DbName}"
if ([string]::IsNullOrWhiteSpace($DbPassword)) {
    $databaseUrl = "postgres://${DbUser}@${DbHost}:${DbPort}/${DbName}"
}

$backendEnvContent = @"
PORT=4000
DATABASE_URL=$databaseUrl
"@
Set-Content -Path $envPath -Value $backendEnvContent -Encoding UTF8

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  BASE DE DATOS CONFIGURADA Y LISTA PARA USO LOCAL" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "DATABASE_URL: $databaseUrl"
