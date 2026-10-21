-- Limpieza de datos de prueba QA (creados por api_smoke_tests.ps1)
DELETE FROM produccion_consumo WHERE produccion_id IN (SELECT id FROM produccion WHERE observacion LIKE 'QA_%');
DELETE FROM produccion WHERE observacion LIKE 'QA_%';
DELETE FROM inventario_movimiento WHERE referencia LIKE 'QA_%';
DELETE FROM inventario_sede WHERE sede_id IN (SELECT id FROM sede WHERE nombre LIKE 'QA_%');
DELETE FROM inventario_central WHERE producto_id IN (SELECT id FROM producto WHERE nombre LIKE 'QA_%');
DELETE FROM detalle_formula WHERE producto_id IN (SELECT id FROM producto WHERE nombre LIKE 'QA_%');
DELETE FROM materia_prima_historial WHERE materia_prima_id IN (SELECT id FROM materia_prima WHERE nombre LIKE 'QA_%');
DELETE FROM materia_prima WHERE nombre LIKE 'QA_%';
DELETE FROM producto WHERE nombre LIKE 'QA_%';
DELETE FROM sede WHERE nombre LIKE 'QA_%';
