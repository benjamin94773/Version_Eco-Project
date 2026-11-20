import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/version_eco_db';

export const pool = new pg.Pool({
  connectionString,
  allowExitOnIdle: true
});

/**
 * Restablece la base de datos a un estado limpio y determinista para cada prueba.
 */
export async function resetBaseline({
  stockA = 10,
  stockB = 7,
  stockC = 6,
  invCentral = 0,
  sedeAStock = 0,
  sedeBStock = 0,
  includeAceite = true,
  includeFormula = true
} = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      TRUNCATE TABLE
        produccion_consumo,
        produccion,
        inventario_movimiento,
        inventario_sede,
        inventario_central,
        detalle_formula,
        materia_prima_historial,
        materia_prima,
        producto,
        sede
      RESTART IDENTITY CASCADE;
    `);

    const sedeARes = await client.query(
      `INSERT INTO sede (nombre, direccion, telefono)
       VALUES ('Sede A', 'Calle 100 # 15-20', '601-5550101') RETURNING id`
    );
    const sedeBRes = await client.query(
      `INSERT INTO sede (nombre, direccion, telefono)
       VALUES ('Sede B', 'Carrera 7 # 53-40', '601-5550102') RETURNING id`
    );

    const mpARes = await client.query(
      `INSERT INTO materia_prima (nombre, unidad_medida, cantidad_disponible, nivel_minimo, activo)
       VALUES ('Aloe vera', 'kg', $1, 1, TRUE) RETURNING id`,
      [stockA]
    );

    let mpBId = null;
    if (includeAceite) {
      const mpBRes = await client.query(
        `INSERT INTO materia_prima (nombre, unidad_medida, cantidad_disponible, nivel_minimo, activo)
         VALUES ('Aceite de coco', 'lt', $1, 1, TRUE) RETURNING id`,
        [stockB]
      );
      mpBId = mpBRes.rows[0].id;
    }

    const mpCRes = await client.query(
      `INSERT INTO materia_prima (nombre, unidad_medida, cantidad_disponible, nivel_minimo, activo)
       VALUES ('Romero', 'kg', $1, 1, TRUE) RETURNING id`,
      [stockC]
    );

    const prodRes = await client.query(
      `INSERT INTO producto (nombre, descripcion, activo)
       VALUES ('Champú vegano', 'Producto base de pruebas funcionales', TRUE) RETURNING id`
    );
    const prodId = prodRes.rows[0].id;

    if (includeFormula && mpBId) {
      await client.query(
        `INSERT INTO detalle_formula (producto_id, materia_prima_id, cantidad_requerida)
         VALUES ($1, $2, 0.5), ($1, $3, 0.2), ($1, $4, 0.1)`,
        [prodId, mpARes.rows[0].id, mpBId, mpCRes.rows[0].id]
      );
    }

    await client.query(
      `INSERT INTO inventario_central (producto_id, cantidad_actual) VALUES ($1, $2)`,
      [prodId, invCentral]
    );

    if (sedeAStock > 0) {
      await client.query(
        `INSERT INTO inventario_sede (sede_id, producto_id, cantidad_actual, cantidad_minima)
         VALUES ($1, $2, $3, 0)`,
        [sedeARes.rows[0].id, prodId, sedeAStock]
      );
    }

    if (sedeBStock > 0) {
      await client.query(
        `INSERT INTO inventario_sede (sede_id, producto_id, cantidad_actual, cantidad_minima)
         VALUES ($1, $2, $3, 0)`,
        [sedeBRes.rows[0].id, prodId, sedeBStock]
      );
    }

    await client.query('COMMIT');
    return {
      prodId,
      sedeAId: sedeARes.rows[0].id,
      sedeBId: sedeBRes.rows[0].id,
      mpAId: mpARes.rows[0].id,
      mpBId,
      mpCId: mpCRes.rows[0].id
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getStocksSnapshot() {
  const mpRes = await pool.query(
    `SELECT nombre, cantidad_disponible::float AS cantidad FROM materia_prima ORDER BY id`
  );
  const centralRes = await pool.query(
    `SELECT p.nombre, ic.cantidad_actual::float AS cantidad
     FROM inventario_central ic JOIN producto p ON p.id = ic.producto_id`
  );
  const sedeRes = await pool.query(
    `SELECT s.nombre AS sede, p.nombre AS producto, i.cantidad_actual::float AS cantidad
     FROM inventario_sede i
     JOIN sede s ON s.id = i.sede_id
     JOIN producto p ON p.id = i.producto_id`
  );
  return {
    materias: Object.fromEntries(mpRes.rows.map((r) => [r.nombre, r.cantidad])),
    central: Object.fromEntries(centralRes.rows.map((r) => [r.nombre, r.cantidad])),
    sedes: Object.fromEntries(sedeRes.rows.map((r) => [r.sede, r.cantidad]))
  };
}
