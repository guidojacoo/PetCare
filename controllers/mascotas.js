import { query } from "../db.js";

export const Listar = async (req, res) => {
  let r = await query("SELECT * FROM mascotas ORDER BY creado_en DESC");
  res.json(r.rows);
};

export const Obtener = async (req, res) => {
  let r = await query("SELECT * FROM mascotas WHERE id=$1", [req.params.id]);
  if (!r.rowCount) return res.status(404).json({ error: "No encontrada" });
  res.json(r.rows[0]);
};

export const Crear = async (req, res) => {
  let { nombre, sexo, raza, peso_kg, fecha_nacimiento, usuario_id, kcal_100g } = req.body;
  let r = await query(
    "INSERT INTO mascotas(nombre, sexo, raza, peso_kg, fecha_nacimiento, usuario_id, kcal_100g) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
    [nombre, sexo, raza, peso_kg, fecha_nacimiento || null, usuario_id, kcal_100g || null]
  );
  res.status(201).json(r.rows[0]);
};

export const Actualizar = async (req, res) => {
  let { nombre, sexo, raza, peso_kg, fecha_nacimiento, kcal_100g } = req.body;
  let r = await query(
    `UPDATE mascotas 
     SET nombre = COALESCE($2,nombre),
         sexo = COALESCE($3,sexo),
         raza = COALESCE($4,raza),
         peso_kg = COALESCE($5,peso_kg),
         fecha_nacimiento = COALESCE($6,fecha_nacimiento),
         kcal_100g = COALESCE($7,kcal_100g)
     WHERE id=$1 RETURNING *`,
    [req.params.id, nombre, sexo, raza, peso_kg, fecha_nacimiento || null, kcal_100g || null]
  );
  if (!r.rowCount) return res.status(404).json({ error: "No encontrada" });
  res.json(r.rows[0]);
};

export const Eliminar = async (req, res) => {
  let id = req.params.id;
  let r = await query("DELETE FROM mascotas WHERE id=$1", [id]);
  if (!r.rowCount) return res.status(404).json({ error: "No encontrada" });
  res.status(204).end();
};

export const HorariosDeMascota = async (req, res) => {
  let r = await query(
    "SELECT * FROM horarios WHERE mascota_id=$1 ORDER BY hora_local ASC",
    [req.params.id]
  );
  res.json(r.rows);
};

export const ListarPorUsuario = async (req, res) => {
  let r = await query(
    "SELECT * FROM mascotas WHERE usuario_id = $1 ORDER BY creado_en DESC",
    [req.params.usuario_id || req.params.id || req.query.usuario_id]
  );
  res.json(r.rows);
};

export const RegistrarPeso = async (req, res) => {
  const id = Number(req.params.id);
  const { peso_kg } = req.body || {};
  if (!Number.isFinite(peso_kg))
    return res.status(400).json({ error: "peso_kg requerido" });

  const r = await query(
    "INSERT INTO mascota_pesos (mascota_id, peso_kg) VALUES ($1,$2) RETURNING id, mascota_id, peso_kg, registrado_en",
    [id, peso_kg]
  );
  res.status(201).json(r.rows[0]);
};

export const Stats = async (req, res) => {
  const id = Number(req.params.id);
  const days = Number(req.query.days || 7);
  try {
    const pesosR = await query(
      "SELECT registrado_en::date AS fecha, peso_kg FROM mascota_pesos WHERE mascota_id=$1 ORDER BY registrado_en",
      [id]
    );

    const comidasR = await query(
      `WITH dias AS (
         SELECT generate_series(current_date - $2::int + 1, current_date, '1 day')::date AS dia
       )
       SELECT d.dia,
         COALESCE(cp.planificadas,0) AS planificadas,
         COALESCE(ev.realizadas,0) AS realizadas,
         COALESCE(ag.cantidad,0)   AS agua
       FROM dias d
       LEFT JOIN LATERAL (
         SELECT COUNT(*) planificadas
         FROM comidas_programadas
         WHERE mascota_id=$1 AND dia_semana = extract(isodow from d.dia)
       ) cp ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) realizadas
         FROM feed_eventos
         WHERE mascota_id=$1 AND accion='comida' AND estado='ok' AND created_at::date = d.dia
       ) ev ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) cantidad
         FROM feed_eventos
         WHERE mascota_id=$1 AND accion='agua' AND estado='ok' AND created_at::date = d.dia
       ) ag ON true
       ORDER BY d.dia`,
      [id, days]
    );

    res.json({
      pesos: pesosR.rows,
      comidas: comidasR.rows.map(r => ({
        fecha: r.dia,
        planificadas: r.planificadas,
        realizadas: r.realizadas
      })),
      agua: comidasR.rows.map(r => ({
        fecha: r.dia,
        eventos: r.agua
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
};
