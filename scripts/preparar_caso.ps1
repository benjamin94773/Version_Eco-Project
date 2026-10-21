param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Caso
)

$rootDir = (Get-Item $PSScriptRoot).Parent.FullName
if (-not (Test-Path "$rootDir\database\01_schema_version_eco.sql")) {
    $rootDir = (Get-Location).Path
}

$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psqlPath)) {
    $found = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($found) { $psqlPath = $found.Source }
    else {
        $anyPsql = Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Filter "psql.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($anyPsql) { $psqlPath = $anyPsql.FullName }
        else { throw "No se encontro psql.exe en el sistema." }
    }
}

$id = $Caso.Trim().ToUpper()

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PREPARADOR DE ESCENARIOS DE PRUEBA: $id" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

function Execute-Sql($sql) {
    & $psqlPath -U postgres -h localhost -p 5432 -d version_eco_db -c $sql | Out-Null
}

function Set-Stocks($a, $b, $c, $invCentral = 0) {
    $sql = @"
    UPDATE materia_prima SET cantidad_disponible = $a WHERE nombre = 'Aloe vera';
    UPDATE materia_prima SET cantidad_disponible = $b WHERE nombre = 'Aceite de coco';
    UPDATE materia_prima SET cantidad_disponible = $c WHERE nombre = 'Romero';
    UPDATE inventario_central SET cantidad_actual = $invCentral 
    WHERE producto_id = (SELECT id FROM producto WHERE nombre = 'Champú vegano');
"@
    Execute-Sql $sql
}

function Set-SedesStock($central, $sedeA = 0, $sedeB = 0) {
    $sql = @"
    UPDATE inventario_central SET cantidad_actual = $central 
    WHERE producto_id = (SELECT id FROM producto WHERE nombre = 'Champú vegano');

    INSERT INTO inventario_sede (sede_id, producto_id, cantidad_actual)
    SELECT s.id, p.id, $sedeA
    FROM sede s, producto p
    WHERE s.nombre = 'Sede A' AND p.nombre = 'Champú vegano'
    ON CONFLICT (sede_id, producto_id) DO UPDATE SET cantidad_actual = $sedeA;

    INSERT INTO inventario_sede (sede_id, producto_id, cantidad_actual)
    SELECT s.id, p.id, $sedeB
    FROM sede s, producto p
    WHERE s.nombre = 'Sede B' AND p.nombre = 'Champú vegano'
    ON CONFLICT (sede_id, producto_id) DO UPDATE SET cantidad_actual = $sedeB;
"@
    Execute-Sql $sql
}

switch -Regex ($id) {
    "F3-CP-01" {
        Set-Stocks 10.0 7.0 6.0 0
        Write-Host "Precondicion F3-CP-01 lista:" -ForegroundColor Green
        Write-Host "  - Aloe vera (A)   : 10.0 kg" -ForegroundColor White
        Write-Host "  - Aceite coco (B) : 7.0 kg" -ForegroundColor White
        Write-Host "  - Romero (C)      : 6.0 kg" -ForegroundColor White
        Write-Host "  - Inventario Champu: 0 unid" -ForegroundColor White
        Write-Host "`n>> PASO MANUAL: Ve a http://localhost:5173/produccion, elige 'Champú vegano', pon Cantidad: 10 y pulsa 'Registrar Producción'." -ForegroundColor Yellow
    }
    "F3-CP-02" {
        Set-Stocks 17.5 5.0 2.5 0
        Write-Host "Precondicion F3-CP-02 lista:" -ForegroundColor Green
        Write-Host "  - Aloe vera (A)   : 17.5 kg" -ForegroundColor White
        Write-Host "  - Aceite coco (B) : 5.0 kg" -ForegroundColor White
        Write-Host "  - Romero (C)      : 2.5 kg" -ForegroundColor White
        Write-Host "  - Inventario Champu: 0 unid" -ForegroundColor White
        Write-Host "`n>> PASO MANUAL: Ve a http://localhost:5173/produccion, elige 'Champú vegano', pon Cantidad: 25 y pulsa 'Registrar Producción'." -ForegroundColor Yellow
        Write-Host "   (Verás que produce 25, A queda en 5.0 y B y C quedan en 0 activando alerta roja)." -ForegroundColor Gray
    }
    "F3-CP-03" {
        Set-Stocks 5.5 0.15 0.05 0
        Write-Host "Precondicion F3-CP-03 lista: A=5.5, B=0.15, C=0.05 (Insuficiente B y C)" -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Pon Cantidad: 1 y pulsa 'Registrar'. Debe salir error de insumos insuficientes." -ForegroundColor Yellow
    }
    "F3-CP-04" {
        Set-Stocks 5.0 2.0 0.95 0
        Write-Host "Precondicion F3-CP-04 lista: A=5.0, B=2.0, C=0.95 (Falta C)" -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Pon Cantidad: 10 y pulsa 'Registrar'. Debe rechazar por falta de C." -ForegroundColor Yellow
    }
    "F3-CP-05" {
        Set-Stocks 12.5 4.95 7.5 0
        Write-Host "Precondicion F3-CP-05 lista: A=12.5, B=4.95, C=7.5 (Falta B)" -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Pon Cantidad: 25 y pulsa 'Registrar'. Debe rechazar por falta de B." -ForegroundColor Yellow
    }
    "F3-CP-06" {
        Set-Stocks 0.5 5.2 0.1 0
        Write-Host "Precondicion F3-CP-06 lista: A=0.5, B=5.2, C=0.1" -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Pon Cantidad: 1 y pulsa 'Registrar'. A y C quedan en 0 con alerta roja." -ForegroundColor Yellow
    }
    "F3-CP-07" {
        Set-Stocks 4.95 1.95 1.0 0
        Write-Host "Precondicion F3-CP-07 lista: A=4.95, B=1.95, C=1.0" -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Pon Cantidad: 10 y pulsa 'Registrar'. Rechazo por falta de A y B." -ForegroundColor Yellow
    }
    "F3-CP-08" {
        Set-Stocks 12.45 10.0 2.45 0
        Write-Host "Precondicion F3-CP-08 lista: A=12.45, B=10.0, C=2.45" -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Pon Cantidad: 25 y pulsa 'Registrar'. Rechazo por falta de A y C." -ForegroundColor Yellow
    }
    "F3-CP-09" {
        Set-Stocks 0.45 0.2 5.1 0
        Write-Host "Precondicion F3-CP-09 lista: A=0.45, B=0.2, C=5.1" -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Pon Cantidad: 1 y pulsa 'Registrar'. Rechazo por falta de A." -ForegroundColor Yellow
    }
    "F3-CP-(10|11|12)" {
        Set-Stocks 10.0 7.0 6.0 0
        Write-Host "Precondicion F3-CP-10/11/12 lista con stock suficiente." -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Prueba con Cantidad: 0 (CP-10), -5 (CP-11) o 2.5 (CP-12). Deben ser bloqueadas." -ForegroundColor Yellow
    }
    "F4-CP-01" {
        Set-SedesStock 20 0 0
        Write-Host "Precondicion F4-CP-01 lista: Central=20, Sede A=0." -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Ve a http://localhost:5173/distribucion, traslada 5 a Sede A. Central queda en 15, Sede A en 5." -ForegroundColor Yellow
    }
    "F4-CP-02" {
        Set-SedesStock 20 0 0
        Write-Host "Precondicion F4-CP-02 lista: Central=20, Sede A=0." -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Traslada 20 a Sede A (límite). Central queda en 0, Sede A en 20." -ForegroundColor Yellow
    }
    "F4-CP-03" {
        Set-SedesStock 20 0 0
        Write-Host "Precondicion F4-CP-03 lista: Central=20, Sede A=0." -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Intenta trasladar 21 a Sede A. Debe salir alerta de stock insuficiente." -ForegroundColor Yellow
    }
    "F4-CP-05" {
        Set-SedesStock 17 0 3
        Write-Host "Precondicion F4-CP-05 lista: Central=17, Sede B=3 (traslado previo de 3)." -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Traslada 4 a Sede B. Central queda en 13, Sede B en 7 acumulado." -ForegroundColor Yellow
    }
    "F4-CP-(04|06|07)" {
        Set-SedesStock 20 0 0
        Write-Host "Precondicion F4 lista: Central=20, Sede A=0." -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Prueba traslados de 2.5 (CP-04), 0 (CP-06) o -5 (CP-07). Bloqueados." -ForegroundColor Yellow
    }
    "F1-CP-03" {
        Write-Host "Precondicion F1-CP-03 lista: Existe 'Aloe vera'." -ForegroundColor Green
        Write-Host "`n>> PASO MANUAL: Ve a Materias Primas y crea con nombre 'aloe vera ' (minúsculas y espacio). Verás que el sistema lo deja pasar (DEF-01)." -ForegroundColor Red
    }
    default {
        Set-Stocks 10.0 7.0 6.0 20
        Set-SedesStock 20 0 0
        Write-Host "Escenario base restaurado: A=10, B=7, C=6, Inv Central=20." -ForegroundColor Green
    }
}
