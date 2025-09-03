// controllers/planes.js
import { query } from "../db.js";

/**
 * POST /db/plan
 * body: {
 *   plan: { mode, secondsOpen, dayplan? | weekplan? },
 *   gramsPerMeal: number,
 *   hopper: number|null,
 *   esp: { ip, port }
 * }
 */
export const GuardarPlanDB = async (req, res) => {
  try {
    const { plan, gramsPerMeal, hopper, esp } = req.body || {};
    if (!plan || typeof plan !== "object")
      return res.status(400).json({ error: "plan inválido" });
    if (!Number.isFinite(gramsPerMeal) || gramsPerMeal <= 0)
      return res.status(400).json({ error: "gramsPerMeal inválido" });

    const sql = `
      INSERT INTO planes_comida (plan, grams_per_meal, hopper_g, esp_ip, esp_port)
      VALUES ($1::jsonb, $2, $3, $4, $5)
      RETURNING id, created_at
    `;
    const vals = [
      JSON.stringify(plan),
      Math.round(gramsPerMeal),
      Number.isFinite(hopper) ? Math.round(hopper) : null,
      esp?.ip || null,
      esp?.port ? parseInt(esp.port, 10) : null,
    ];

    const { rows } = await query(sql, vals);
    res.status(201).json({ ok: true, id: rows[0].id, created_at: rows[0].created_at });
  } catch (e) {
    console.error("GuardarPlanDB", e);
    res.status(500).json({ error: "db_error" });
  }
};

/** GET /db/plan/:id */
export const ObtenerPlanDB = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, plan, grams_per_meal, hopper_g, esp_ip, esp_port, created_at
       FROM planes_comida WHERE id=$1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "No encontrado" });
    res.json(rows[0]);
  } catch (e) {
    console.error("ObtenerPlanDB", e);
    res.status(500).json({ error: "db_error" });
  }
};

/** GET /db/planes  (lista simple, últimos primero) */
export const Listar = async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, created_at, grams_per_meal, hopper_g, esp_ip, esp_port
       FROM planes_comida
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (e) {
    console.error("Listar planes", e);
    res.status(500).json({ error: "db_error" });
  }
};

/** GET /db/mismascotas/:id  (si querés devolver las mascotas del usuario)
 *  Ajustá nombres de tabla/relación según tu esquema real.
 *  Si no lo necesitás aún, podés dejarlo como TODO.
 */
export const MisMascotasDB = async (req, res) => {
  try {
    // ejemplo básico; cambialo a tu modelo real
    const { rows } = await query(
      `SELECT m.*
       FROM mascotas m
       WHERE m.usuario_id = $1
       ORDER BY m.id ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    console.error("MisMascotasDB", e);
    res.status(500).json({ error: "db_error" });
  }
};
