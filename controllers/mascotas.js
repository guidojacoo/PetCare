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
  let { nombre, sexo, raza, peso_kg, fecha_nacimiento, usuario_id } = req.body;
  let r = await query(
    "INSERT INTO mascotas(nombre, sexo, raza, peso_kg, fecha_nacimiento, usuario_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
    [nombre, sexo, raza, peso_kg, fecha_nacimiento, usuario_id]
  );
  res.status(201).json(r.rows[0]);
};

export const Actualizar = async (req, res) => {
  let { nombre, sexo, raza, peso_kg, fecha_nacimiento } = req.body;
  let r = await query(
    `UPDATE mascotas 
     SET nombre = COALESCE($2,nombre),
         sexo = COALESCE($3,sexo),
         raza = COALESCE($4,raza),
         peso_kg = COALESCE($5,peso_kg),
         fecha_nacimiento = COALESCE($6,fecha_nacimiento)
     WHERE id=$1 RETURNING *`,
    [req.params.id, nombre, sexo, raza, peso_kg, fecha_nacimiento]
  );
  if (!r.rowCount) return res.status(404).json({ error: "No encontrada" });
  res.json(r.rows[0]);
};

export const Eliminar = async (req, res) => {
  let id = req.params.id;
  await query("DELETE FROM horarios WHERE mascota_id=$1", [id]);
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
