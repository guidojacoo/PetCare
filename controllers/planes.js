import { query } from "../db.js";

export const Listar = async (req, res) => {
  let r = await query("SELECT * FROM dispensador_config");
  res.json(r.rows);
};

export const GuardarPlanDB = async (req, res) => {
  let { mascota_id, secondsOpen, weekplan } = req.body;
  if (!mascota_id || !Array.isArray(weekplan) || weekplan.length !== 7) {
    return res.status(400).json({ error: "payload invalido" });
  }

  let gramos = Math.round((parseFloat(secondsOpen || 0)) * 10);
  if (!gramos || gramos <= 0) {
    return res.status(400).json({ error: "gramos invalidos" });
  }

  // dias activos en formato 1234567
  let dias = "";
  for (let i = 0; i < 7; i++) {
    if (Array.isArray(weekplan[i]) && weekplan[i].length > 0) dias += String(i + 1);
  }

  // insert config
  await query(
    `INSERT INTO dispensador_config(mascota_id, dias_activos, actualizado_en)
     VALUES($1,$2,now())
     ON CONFLICT (mascota_id)
     DO UPDATE SET dias_activos=EXCLUDED.dias_activos, actualizado_en=now()`,
    [mascota_id, dias]
  );

  // reescribir horarios de la mascota
  await query("DELETE FROM comidas_programadas WHERE mascota_id=$1", [mascota_id]);

  for (let i = 0; i < 7; i++) {
    let d = i + 1;
    let arr = weekplan[i] || [];
    for (let j = 0; j < arr.length; j++) {
      let hora = arr[j];
      await query(
        `INSERT INTO comidas_programadas(mascota_id, dia_semana, hora_local, gramos)
         VALUES($1,$2,$3,$4)
         ON CONFLICT (mascota_id, dia_semana, hora_local)
         DO UPDATE SET gramos=EXCLUDED.gramos`,
        [mascota_id, d, hora, gramos]
      );
    }
  }

  res.json({ ok: true, mascota_id, dias_activos: dias });
};

export const ObtenerPlanDB = async (req, res) => {
  let mascota_id = req.params.id ? parseInt(req.params.id, 10) : parseInt(req.query.mascota_id || 0, 10);
  if (!mascota_id) return res.status(400).json({ error: "mascota invalida" });

  let cfg = await query("SELECT dias_activos FROM dispensador_config WHERE mascota_id=$1", [mascota_id]);
  let dias_activos = cfg.rowCount ? cfg.rows[0].dias_activos : "";

  let out = [[], [], [], [], [], [], []];
  let r = await query(
    "SELECT dia_semana, to_char(hora_local,'HH24:MI') AS h FROM comidas_programadas WHERE mascota_id=$1 ORDER BY dia_semana, hora_local",
    [mascota_id]
  );
  for (let k = 0; k < r.rows.length; k++) {
    out[r.rows[k].dia_semana - 1].push(r.rows[k].h);
  }

  res.json({ diasActivos: dias_activos, weekplan: out });
};

export const MisMascotasDB = async (req, res) => {
  let id = req.params.id ? parseInt(req.params.id, 10) : parseInt(req.query.id || 0, 10);
  if (!id) return res.json([]);
  let r = await query("SELECT id, nombre FROM mascotas WHERE usuario_id=$1 ORDER BY creado_en DESC", [id]);
  res.json(r.rows);
};
