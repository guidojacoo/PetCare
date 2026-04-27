import { query } from "../db.js";

export const Listar = async (req, res) => {
  try {
    const r = await query("SELECT * FROM horarios ORDER BY hora_local ASC");
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar horarios" });
  }
};

export const Crear = async (req, res) => {
  try {
    const { mascota_id, hora_local, gramos, dias } = req.body;
    const r = await query(
      "INSERT INTO horarios(mascota_id,hora_local,gramos,dias) VALUES($1,$2,$3,$4) RETURNING *",
      [mascota_id, hora_local, gramos, dias]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear horario" });
  }
};

export const Actualizar = async (req, res) => {
  try {
    const { hora_local, gramos, dias, activo } = req.body;
    const r = await query(
      "UPDATE horarios SET hora_local=$2,gramos=$3,dias=$4,activo=COALESCE($5,activo) WHERE id=$1 RETURNING *",
      [req.params.id, hora_local, gramos, dias, activo]
    );
    if (!r.rowCount) return res.status(404).json({ error: "No encontrado" });
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar horario" });
  }
};

export const Eliminar = async (req, res) => {
  try {
    const r = await query("DELETE FROM horarios WHERE id=$1", [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ error: "No encontrado" });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar horario" });
  }
};
