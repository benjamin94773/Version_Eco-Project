-- ==============================================================================
-- DATOS DEMO PARA VERSION-ECO
-- ==============================================================================

-- 1. Sedes
INSERT INTO sede (nombre, direccion, telefono) VALUES
('Sede A', 'Calle 100 # 15-20, Bogota', '601-5550101'),
('Sede B', 'Carrera 7 # 53-40, Bogota', '601-5550102'),
('Sede Medellin - Poblado', 'Cra 43A # 5A-113, Medellin', '604-5550103')
ON CONFLICT DO NOTHING;

-- 2. Materias Primas para Pruebas del Plan
INSERT INTO materia_prima (nombre, unidad_medida, cantidad_disponible, nivel_minimo, activo) VALUES
('Aloe vera', 'kg', 10, 1, TRUE),
('Aceite de coco', 'kg', 7, 1, TRUE),
('Romero', 'kg', 6, 1, TRUE),
('Sal', 'kg', 5, 1, TRUE),
('Tensioactivo SCI (Sodium Cocoyl Isethionate)', 'g', 10000, 2000, TRUE),
('Arcilla Blanca (Caolin)', 'g', 8000, 1500, TRUE),
('Oxido de Zinc no nano', 'g', 5000, 1000, TRUE),
('Vitamina E (Tocoferol)', 'ml', 800, 200, TRUE)
ON CONFLICT DO NOTHING;

-- 3. Productos Terminados
INSERT INTO producto (nombre, descripcion, activo) VALUES
('Champú vegano', 'Producto oficial para ejecución de la suite de 31 casos de prueba', TRUE),
('Champu Solido de Romero y Aloe (80g)', 'Champu natural vegano sin sulfatos fortalecedor capilar', TRUE),
('Desodorante Natural en Crema (50g)', 'Formula sin aluminio con manteca de karite y aceite de coco', TRUE)
ON CONFLICT DO NOTHING;

-- 4. Fórmulas (Bill of Materials)
-- Fórmula de 'Champú vegano': A=Aloe vera (0.5 kg), B=Aceite de coco (0.2 kg), C=Romero (0.1 kg)
INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 0.5
FROM producto p, materia_prima mp
WHERE p.nombre = 'Champú vegano' AND mp.nombre = 'Aloe vera'
ON CONFLICT DO NOTHING;

INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 0.2
FROM producto p, materia_prima mp
WHERE p.nombre = 'Champú vegano' AND mp.nombre = 'Aceite de coco'
ON CONFLICT DO NOTHING;

INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 0.1
FROM producto p, materia_prima mp
WHERE p.nombre = 'Champú vegano' AND mp.nombre = 'Romero'
ON CONFLICT DO NOTHING;

-- 4. Fórmulas (Bill of Materials)
-- Champú Sólido: Tensioactivo SCI (50g), Romero (5ml), Aloe Vera (15ml), Arcilla Blanca (10g)
INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 50
FROM producto p, materia_prima mp
WHERE p.nombre = 'Champu Solido de Romero y Aloe (80g)' AND mp.nombre = 'Tensioactivo SCI (Sodium Cocoyl Isethionate)'
ON CONFLICT DO NOTHING;

INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 5
FROM producto p, materia_prima mp
WHERE p.nombre = 'Champu Solido de Romero y Aloe (80g)' AND mp.nombre = 'Aceite Esencial de Romero'
ON CONFLICT DO NOTHING;

INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 15
FROM producto p, materia_prima mp
WHERE p.nombre = 'Champu Solido de Romero y Aloe (80g)' AND mp.nombre = 'Extracto de Aloe Vera'
ON CONFLICT DO NOTHING;

INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 10
FROM producto p, materia_prima mp
WHERE p.nombre = 'Champu Solido de Romero y Aloe (80g)' AND mp.nombre = 'Arcilla Blanca (Caolin)'
ON CONFLICT DO NOTHING;

-- Desodorante Natural: Manteca Karite (20g), Aceite de Coco (15g), Bicarbonato (10g), Almidon Maiz (5g)
INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 20
FROM producto p, materia_prima mp
WHERE p.nombre = 'Desodorante Natural en Crema (50g)' AND mp.nombre = 'Manteca de Karite'
ON CONFLICT DO NOTHING;

INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 15
FROM producto p, materia_prima mp
WHERE p.nombre = 'Desodorante Natural en Crema (50g)' AND mp.nombre = 'Aceite de Coco Organico'
ON CONFLICT DO NOTHING;

INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 10
FROM producto p, materia_prima mp
WHERE p.nombre = 'Desodorante Natural en Crema (50g)' AND mp.nombre = 'Bicarbonato de Sodio Grado Cosmetico'
ON CONFLICT DO NOTHING;

INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 5
FROM producto p, materia_prima mp
WHERE p.nombre = 'Desodorante Natural en Crema (50g)' AND mp.nombre = 'Almidon de Maiz'
ON CONFLICT DO NOTHING;

-- Protector Solar: Oxido de Zinc (25g), Aceite de Coco (40g), Manteca Karite (30g), Vitamina E (5ml)
INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 25
FROM producto p, materia_prima mp
WHERE p.nombre = 'Protector Solar Mineral FPS 50 (100ml)' AND mp.nombre = 'Oxido de Zinc no nano'
ON CONFLICT DO NOTHING;

INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 40
FROM producto p, materia_prima mp
WHERE p.nombre = 'Protector Solar Mineral FPS 50 (100ml)' AND mp.nombre = 'Aceite de Coco Organico'
ON CONFLICT DO NOTHING;

INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 30
FROM producto p, materia_prima mp
WHERE p.nombre = 'Protector Solar Mineral FPS 50 (100ml)' AND mp.nombre = 'Manteca de Karite'
ON CONFLICT DO NOTHING;

INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
SELECT p.id, mp.id, 5
FROM producto p, materia_prima mp
WHERE p.nombre = 'Protector Solar Mineral FPS 50 (100ml)' AND mp.nombre = 'Vitamina E (Tocoferol)'
ON CONFLICT DO NOTHING;

-- 5. Inicializar inventario central en 0 para cada producto
INSERT INTO inventario_central (producto_id, cantidad_actual)
SELECT id, 0 FROM producto
ON CONFLICT (producto_id) DO NOTHING;
