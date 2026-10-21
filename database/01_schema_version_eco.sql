-- ==============================================================================
-- SISTEMA DE GESTION DE INVENTARIO Y PRODUCCION - VERSION-ECO
-- Esquema completo de Base de Datos PostgreSQL
-- ==============================================================================

-- 1. TABLAS PRINCIPALES

CREATE TABLE IF NOT EXISTS materia_prima (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL,
    cantidad_disponible NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (cantidad_disponible >= 0),
    nivel_minimo NUMERIC(12, 3) NOT NULL DEFAULT 0 CHECK (nivel_minimo >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITHOUT TIME ZONE NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_materia_prima_nombre 
ON materia_prima (LOWER(TRIM(nombre))) 
WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS materia_prima_historial (
    id SERIAL PRIMARY KEY,
    materia_prima_id INT NOT NULL REFERENCES materia_prima(id) ON DELETE CASCADE,
    nombre_anterior VARCHAR(150),
    unidad_medida_anterior VARCHAR(20),
    cantidad_anterior NUMERIC(12, 3),
    nivel_minimo_anterior NUMERIC(12, 3),
    fecha_cambio TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITHOUT TIME ZONE NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_producto_nombre 
ON producto (LOWER(TRIM(nombre))) 
WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS detalle_formula (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    materia_prima_id INT NOT NULL REFERENCES materia_prima(id) ON DELETE RESTRICT,
    cantidad_requerida NUMERIC(12, 3) NOT NULL CHECK (cantidad_requerida > 0),
    UNIQUE(producto_id, materia_prima_id)
);

CREATE TABLE IF NOT EXISTS sede (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    direccion VARCHAR(200),
    telefono VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sede_nombre 
ON sede (LOWER(TRIM(nombre)));

CREATE TABLE IF NOT EXISTS inventario_central (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL UNIQUE REFERENCES producto(id) ON DELETE CASCADE,
    cantidad_actual NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cantidad_actual >= 0),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventario_sede (
    id SERIAL PRIMARY KEY,
    sede_id INT NOT NULL REFERENCES sede(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    cantidad_actual NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cantidad_actual >= 0),
    cantidad_minima NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cantidad_minima >= 0),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(sede_id, producto_id)
);

CREATE TABLE IF NOT EXISTS inventario_movimiento (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    sede_id INT NULL REFERENCES sede(id) ON DELETE SET NULL,
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('PRODUCCION', 'AJUSTE_MANUAL', 'VENTA_MANUAL', 'TRASLADO_ENTRADA', 'TRASLADO_SALIDA', 'DISTRIBUCION_ENTRADA', 'DISTRIBUCION_SALIDA')),
    cantidad_delta NUMERIC(12, 2) NOT NULL,
    referencia TEXT
);

CREATE TABLE IF NOT EXISTS produccion (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    sede_id INT NULL REFERENCES sede(id) ON DELETE SET NULL,
    producto_id INT NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    cantidad_producida NUMERIC(12, 2) NOT NULL CHECK (cantidad_producida > 0),
    observacion TEXT
);

CREATE TABLE IF NOT EXISTS produccion_consumo (
    id SERIAL PRIMARY KEY,
    produccion_id INT NOT NULL REFERENCES produccion(id) ON DELETE CASCADE,
    materia_prima_id INT NOT NULL REFERENCES materia_prima(id) ON DELETE RESTRICT,
    cantidad_consumida NUMERIC(12, 3) NOT NULL CHECK (cantidad_consumida > 0)
);

-- ==============================================================================
-- 2. TRIGGERS Y FUNCIONES DE AUDITORIA
-- ==============================================================================

CREATE OR REPLACE FUNCTION fn_trg_materia_prima_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.nombre IS DISTINCT FROM NEW.nombre) OR 
       (OLD.unidad_medida IS DISTINCT FROM NEW.unidad_medida) OR 
       (OLD.cantidad_disponible IS DISTINCT FROM NEW.cantidad_disponible) OR 
       (OLD.nivel_minimo IS DISTINCT FROM NEW.nivel_minimo) THEN
       
        INSERT INTO materia_prima_historial (
            materia_prima_id,
            nombre_anterior,
            unidad_medida_anterior,
            cantidad_anterior,
            nivel_minimo_anterior,
            fecha_cambio
        ) VALUES (
            OLD.id,
            OLD.nombre,
            OLD.unidad_medida,
            OLD.cantidad_disponible,
            OLD.nivel_minimo,
            NOW()
        );
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_materia_prima_historial ON materia_prima;
CREATE TRIGGER trg_materia_prima_historial
BEFORE UPDATE ON materia_prima
FOR EACH ROW
EXECUTE FUNCTION fn_trg_materia_prima_audit();

-- ==============================================================================
-- 3. VISTAS
-- ==============================================================================

DROP VIEW IF EXISTS vw_inventario_central CASCADE;
CREATE VIEW vw_inventario_central AS
SELECT 
    ic.id,
    ic.producto_id,
    p.nombre AS producto,
    ic.cantidad_actual,
    ic.updated_at
FROM inventario_central ic
JOIN producto p ON p.id = ic.producto_id;

DROP VIEW IF EXISTS vw_alertas_materia_prima_baja CASCADE;
CREATE VIEW vw_alertas_materia_prima_baja AS
SELECT 
    mp.id,
    mp.nombre,
    mp.unidad_medida,
    mp.cantidad_disponible,
    mp.nivel_minimo,
    (mp.nivel_minimo - mp.cantidad_disponible) AS diferencia
FROM materia_prima mp
WHERE mp.activo = TRUE 
  AND mp.cantidad_disponible <= mp.nivel_minimo;

DROP VIEW IF EXISTS vw_alertas_producto_sede_bajo CASCADE;
CREATE VIEW vw_alertas_producto_sede_bajo AS
SELECT 
    i.id,
    p.nombre AS producto,
    s.nombre AS sede,
    i.cantidad_actual,
    i.cantidad_minima,
    (i.cantidad_minima - i.cantidad_actual) AS diferencia
FROM inventario_sede i
JOIN producto p ON p.id = i.producto_id
JOIN sede s ON s.id = i.sede_id
WHERE p.activo = TRUE 
  AND i.cantidad_actual <= i.cantidad_minima;

-- ==============================================================================
-- 4. PROCEDIMIENTOS ALMACENADOS / FUNCIONES DE NEGOCIO
-- ==============================================================================

-- Registro de Producción con Consumo Automático
CREATE OR REPLACE FUNCTION fn_registrar_produccion(
    p_producto_id INT,
    p_cantidad_producida NUMERIC,
    p_observacion TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_produccion_id INT;
    v_detalle RECORD;
    v_requerido NUMERIC;
    v_stock_actual NUMERIC;
    v_materia_nombre VARCHAR;
BEGIN
    IF p_cantidad_producida <= 0 THEN
        RAISE EXCEPTION 'La cantidad producida debe ser mayor a cero' USING ERRCODE = 'P0001';
    END IF;

    -- Validar que el producto existe y está activo
    IF NOT EXISTS (SELECT 1 FROM producto WHERE id = p_producto_id AND activo = TRUE) THEN
        RAISE EXCEPTION 'El producto indicado no existe o se encuentra inactivo' USING ERRCODE = 'P0001';
    END IF;

    -- Validar que el producto tenga fórmula configurada
    IF NOT EXISTS (SELECT 1 FROM detalle_formula WHERE producto_id = p_producto_id) THEN
        RAISE EXCEPTION 'El producto no tiene una formula configurada' USING ERRCODE = 'P0001';
    END IF;

    -- 1. Validar stock de cada materia prima requerida
    FOR v_detalle IN
        SELECT df.materia_prima_id, df.cantidad_requerida, mp.nombre, mp.cantidad_disponible
        FROM detalle_formula df
        JOIN materia_prima mp ON mp.id = df.materia_prima_id
        WHERE df.producto_id = p_producto_id
    LOOP
        v_requerido := v_detalle.cantidad_requerida * p_cantidad_producida;
        IF v_detalle.cantidad_disponible < v_requerido THEN
            RAISE EXCEPTION 'Stock insuficiente para la materia prima "%" (Disponible: %, Requerido: %)',
                v_detalle.nombre, v_detalle.cantidad_disponible, v_requerido USING ERRCODE = 'P0001';
        END IF;
    END LOOP;

    -- 2. Registrar la orden de producción
    INSERT INTO produccion (producto_id, cantidad_producida, observacion, fecha)
    VALUES (p_producto_id, p_cantidad_producida, p_observacion, NOW())
    RETURNING id INTO v_produccion_id;

    -- 3. Descontar materias primas y registrar consumo
    FOR v_detalle IN
        SELECT df.materia_prima_id, df.cantidad_requerida
        FROM detalle_formula df
        WHERE df.producto_id = p_producto_id
    LOOP
        v_requerido := v_detalle.cantidad_requerida * p_cantidad_producida;

        UPDATE materia_prima
        SET cantidad_disponible = cantidad_disponible - v_requerido,
            updated_at = NOW()
        WHERE id = v_detalle.materia_prima_id;

        INSERT INTO produccion_consumo (produccion_id, materia_prima_id, cantidad_consumida)
        VALUES (v_produccion_id, v_detalle.materia_prima_id, v_requerido);
    END LOOP;

    -- 4. Incrementar inventario central del producto terminado
    INSERT INTO inventario_central (producto_id, cantidad_actual, updated_at)
    VALUES (p_producto_id, p_cantidad_producida, NOW())
    ON CONFLICT (producto_id) 
    DO UPDATE SET 
        cantidad_actual = inventario_central.cantidad_actual + EXCLUDED.cantidad_actual,
        updated_at = NOW();

    -- 5. Registrar movimiento de inventario central
    INSERT INTO inventario_movimiento (sede_id, producto_id, tipo, cantidad_delta, referencia)
    VALUES (NULL, p_producto_id, 'PRODUCCION', p_cantidad_producida, COALESCE(p_observacion, 'Registro de produccion'));

    RETURN v_produccion_id;
END;
$$ LANGUAGE plpgsql;

-- Distribución desde Inventario Central hacia Sedes
CREATE OR REPLACE FUNCTION fn_distribuir_desde_central(
    p_producto_id INT,
    p_sede_id INT,
    p_cantidad NUMERIC,
    p_referencia TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_stock_central NUMERIC;
BEGIN
    IF p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad a distribuir debe ser mayor a cero' USING ERRCODE = 'P0001';
    END IF;

    -- Validar existencia de sede
    IF NOT EXISTS (SELECT 1 FROM sede WHERE id = p_sede_id) THEN
        RAISE EXCEPTION 'La sede especificada no existe' USING ERRCODE = 'P0001';
    END IF;

    -- Verificar stock en inventario central
    SELECT COALESCE(cantidad_actual, 0) INTO v_stock_central
    FROM inventario_central
    WHERE producto_id = p_producto_id;

    IF v_stock_central IS NULL OR v_stock_central < p_cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente en inventario central (Disponible: %, Solicitado: %)',
            COALESCE(v_stock_central, 0), p_cantidad USING ERRCODE = 'P0001';
    END IF;

    -- Descontar de inventario central
    UPDATE inventario_central
    SET cantidad_actual = cantidad_actual - p_cantidad,
        updated_at = NOW()
    WHERE producto_id = p_producto_id;

    -- Registrar salida de inventario central
    INSERT INTO inventario_movimiento (sede_id, producto_id, tipo, cantidad_delta, referencia)
    VALUES (NULL, p_producto_id, 'DISTRIBUCION_SALIDA', -p_cantidad, COALESCE(p_referencia, 'Envio a sede'));

    -- Aumentar en inventario de la sede
    INSERT INTO inventario_sede (sede_id, producto_id, cantidad_actual, cantidad_minima, updated_at)
    VALUES (p_sede_id, p_producto_id, p_cantidad, 0, NOW())
    ON CONFLICT (sede_id, producto_id)
    DO UPDATE SET 
        cantidad_actual = inventario_sede.cantidad_actual + EXCLUDED.cantidad_actual,
        updated_at = NOW();

    -- Registrar entrada en la sede
    INSERT INTO inventario_movimiento (sede_id, producto_id, tipo, cantidad_delta, referencia)
    VALUES (p_sede_id, p_producto_id, 'DISTRIBUCION_ENTRADA', p_cantidad, COALESCE(p_referencia, 'Recepcion desde central'));

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
