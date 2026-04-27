// controllers/eventos.js
import { query } from "../db.js";

/**
 * POST /eventos
 * Registra un evento (tick) de servo/sensor.
 * Espera body: {
 *   mascota_id:number, plan_id?:number, tipo:'servo'|'sensor',
 *   accion:'comida'|'agua', estado:'ok'|'fail',
 *   gramos?:number, fuente?:'plan'|'manual'|'api', detalle?:string, esp_id?:string,
 *   slot_hhmm?: 'HH:MM' // opcional, útil si querés un tick por franja
 * }
 */
export async function Crear(req, res) {
  try {
    const {
      mascota_id,
      plan_id = null,
      tipo,          // 'servo' | 'sensor'
      accion,        // 'comida' | 'agua'
      estado,        // 'ok' | 'fail'
      gramos = null,
      fuente = null, // 'plan' | 'manual' | 'api'
      detalle = null,
      esp_id = null,
      slot_hhmm = null
    } = req.body;

    if (!mascota_id || !tipo || !accion || !estado) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    const sql = `
      INSERT INTO feed_eventos
        (mascota_id, plan_id, tipo, accion, estado, gramos, fuente, detalle, esp_id, slot_hhmm)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *;
    `;
    const vals = [mascota_id, plan_id, tipo, accion, estado, gramos, fuente, detalle, esp_id, slot_hhmm];
    const { rows } = await query(sql, vals);

    res.json({ ok: true, evento: rows[0] });
  } catch (e) {
    // Si hay conflicto por uq_tick_por_slot_dia, devolvemos 200 igualmente con un hint
    if (e.code === '23505') {
      return res.json({ ok: true, duplicated: true, message: "Ya existe un tick OK para ese slot hoy." });
    }
    console.error(e);
    res.status(500).json({ error: "No se pudo registrar el evento" });
  }
}

/**
 * GET /mascotas/:id/eventos?limite=50
 * Devuelve eventos recientes para historial.
 */
export async function Listar(req, res) {
  try {
    const mascotaId = Number(req.params.id);
    const limite = Number(req.query.limite || 50);

    const sql = `
      SELECT id, created_at, tipo, accion, estado, gramos, fuente, detalle, plan_id, esp_id, slot_hhmm
      FROM feed_eventos
      WHERE mascota_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    const { rows } = await query(sql, [mascotaId, limite]);
    res.json({ ok: true, eventos: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudo listar eventos" });
  }
}

/**
 * GET /mascotas/:id/ticks?fecha=YYYY-MM-DD
 * Devuelve HH:MM (hora local AR) de todos los eventos 'comida' con estado 'ok' del día.
 * Útil para repintar los "ticks" al abrir la pantalla.
 */
export async function TicksDelDia(req, res) {
  try {
    const mascotaId = Number(req.params.id);
    const fecha = req.query.fecha || null; // si no viene, usa current_date AR

    // Nota: usamos la zona 'America/Argentina/Buenos_Aires' en SQL para el corte por día.
    // Devolvemos HH:MM en esa misma zona.
    const sql = `
      WITH ev AS (
        SELECT
          (created_at AT TIME ZONE 'America/Argentina/Buenos_Aires') AS ts_local
        FROM feed_eventos
        WHERE mascota_id = $1
          AND accion = 'comida'
          AND estado = 'ok'
          AND (
            CASE
              WHEN $2::date IS NULL
              THEN (created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
              ELSE (created_at AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = $2::date
            END
          )
        ORDER BY created_at ASC
      )
      SELECT to_char(ts_local, 'HH24:MI') AS hhmm
      FROM ev;
    `;

    const { rows } = await query(sql, [mascotaId, fecha]);
    res.json({ ok: true, fecha: fecha || null, ticks: rows.map(r => r.hhmm) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudieron obtener los ticks" });
  }
}
