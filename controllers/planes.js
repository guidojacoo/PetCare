// controllers/planes.js
import { query } from "../db.js";
import { z } from "zod";

const time = z.string().regex(/^\d{2}:\d{2}$/);

const PlanSchema = z.object({
  mode: z.enum(['repeat_week', 'per_day']),
  secondsOpen: z.number().positive(),
  dayplan: z.array(time).optional(),
  weekplan: z.array(z.array(time)).optional()
}).superRefine((data, ctx) => {
  if (data.mode === 'repeat_week') {
    if (!data.dayplan || data.dayplan.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'dayplan requerido para repeat_week', path: ['dayplan'] });
    }
  } else if (data.mode === 'per_day') {
    if (!data.weekplan || data.weekplan.length !== 7) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'weekplan inválido para per_day', path: ['weekplan'] });
    }
  }
});

const GuardarPlanSchema = z.object({
  userId: z.number(),
  plan: PlanSchema,
  gramsPerMeal: z.number().positive(),
  hopper: z.number().nullable().optional(),
  esp: z.object({ ip: z.string(), port: z.string() }).optional()
});

const RegistrarSyncSchema = z.object({
  userId: z.number(),
  ok: z.boolean(),
  message: z.string().optional(),
  esp: z.object({ ip: z.string(), port: z.string() }).optional()
});

/**
 * POST /db/plan
 * Body esperado:
 * {
 *   userId: number,
 *   plan: { mode: 'repeat_week'|'per_day', secondsOpen: number, dayplan?: string[], weekplan?: string[][] },
 *   gramsPerMeal: number,
 *   hopper: number|null,
 *   esp: { ip: string, port: string }
 * }
 */
export const GuardarPlanDB = async (req, res) => {
  try {
    const { userId, plan, gramsPerMeal, hopper, esp } = GuardarPlanSchema.parse(req.body);
    const mode = plan.mode;
    const secondsOpen = plan.secondsOpen;
    const dayplan = mode === 'repeat_week' ? plan.dayplan : null;
    const weekplan = mode === 'per_day' ? plan.weekplan : null;

    const r = await query(
      `INSERT INTO planes (user_id, mode, seconds_open, dayplan, weekplan, grams_per_meal, hopper_g, esp)
       VALUES ($1,$2,$3,$4::time[],$5::jsonb,$6,$7,$8::jsonb)
       RETURNING id, user_id, mode, seconds_open, grams_per_meal, hopper_g, esp, created_at`,
      [
        userId,
        mode,
        secondsOpen,
        dayplan,
        weekplan ? JSON.stringify(weekplan) : null,
        gramsPerMeal,
        Number.isFinite(hopper) ? hopper : null,
        esp ? JSON.stringify(esp) : null
      ]
    );

    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error("GuardarPlanDB error:", err);
    res.status(500).json({ error: "Error al guardar el plan" });
  }
};

/**
 * GET /db/plan/:id
 * Devuelve el doc completo del plan (incluye dayplan/weekplan)
 */
export const ObtenerPlanDB = async (req, res) => {
  try {
    const r = await query(
      `SELECT id, user_id, mode, seconds_open, dayplan, weekplan, grams_per_meal, hopper_g, esp, is_active, created_at, updated_at
       FROM planes
       WHERE id = $1`,
      [req.params.id]
    );
    if (!r.rowCount) return res.status(404).json({ error: "No encontrado" });
    res.json(r.rows[0]);
  } catch (err) {
    console.error("ObtenerPlanDB error:", err);
    res.status(500).json({ error: "Error al obtener el plan" });
  }
};

/**
 * GET /db/planes
 * Lista planes (los más nuevos primero)
 * Opcional: ?userId=123 para filtrar por usuario
 */
export const Listar = async (req, res) => {
  try {
    const { userId } = req.query || {};
    let r;
    if (userId) {
      r = await query(
        `SELECT id, user_id, mode, seconds_open, grams_per_meal, hopper_g, is_active, created_at
         FROM planes
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );
    } else {
      r = await query(
        `SELECT id, user_id, mode, seconds_open, grams_per_meal, hopper_g, is_active, created_at
         FROM planes
         ORDER BY created_at DESC
         LIMIT 100`
      );
    }
    res.json(r.rows);
  } catch (err) {
    console.error("Listar planes error:", err);
    res.status(500).json({ error: "Error al listar planes" });
  }
};

/**
 * GET /db/plan/ultimo/:userId
 * Devuelve el último plan activo de un usuario
 */
export const UltimoPlanDeUsuario = async (req, res) => {
  try {
    const r = await query(
      `SELECT p.*,
              s.ok          AS last_sync_ok,
              s.message     AS last_sync_message,
              s.created_at  AS last_synced_at
       FROM planes p
       LEFT JOIN LATERAL (
         SELECT ok, message, created_at
         FROM plan_syncs
         WHERE plan_id = p.id
         ORDER BY created_at DESC
         LIMIT 1
       ) s ON TRUE
       WHERE p.user_id = $1 AND p.is_active = TRUE
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [req.params.userId]
    );
    if (!r.rowCount) return res.status(404).json({ error: "El usuario no tiene planes" });
    res.json(r.rows[0]);
  } catch (err) {
    console.error("UltimoPlanDeUsuario error:", err);
    res.status(500).json({ error: "Error al buscar el último plan" });
  }
};



export const Activar = async (req, res) => {
  try {
    const r = await query(`UPDATE planes SET is_active = TRUE WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ error: "No encontrado" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al activar" });
  }
};

export const Desactivar = async (req, res) => {
  try {
    const r = await query(`UPDATE planes SET is_active = FALSE WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ error: "No encontrado" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al desactivar" });
  }
};

/**
 * (Opcional) GET /db/mismascotas/:id
 * Dejé la firma vacía por si ya la tenías; acá no la necesitamos para planes.
 */
export const MisMascotasDB = async (_req, res) => {
  res.json([]);
};

// POST /db/plan/:id/sync
// Body: { userId: number, ok: boolean, message?: string, esp?: {ip, port} }
export const RegistrarSync = async (req, res) => {
  try {
    const planId = Number(req.params.id);
    const { userId, ok, message, esp } = RegistrarSyncSchema.parse(req.body);
    if (!Number.isFinite(planId)) {
      return res.status(400).json({ error: "planId inválido" });
    }
    const r = await query(
      `INSERT INTO plan_syncs (plan_id, user_id, ok, message, esp)
       VALUES ($1,$2,$3,$4,$5::jsonb)
       RETURNING id, created_at`,
      [planId, userId, ok, message || null, esp ? JSON.stringify(esp) : null]
    );
    res.status(201).json({ ok: true, id: r.rows[0].id, created_at: r.rows[0].created_at });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    console.error("RegistrarSync error:", err);
    res.status(500).json({ error: "Error al registrar sincronización" });
  }
};
