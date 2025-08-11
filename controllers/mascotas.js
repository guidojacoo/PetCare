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
    let { nombre, especie, raza, peso_kg, fecha_nacimiento } = req.body;
    let r = await query(
        "INSERT INTO mascotas(nombre,especie,raza,peso_kg,fecha_nacimiento) VALUES($1,$2,$3,$4,$5) RETURNING *",
        [nombre, especie, raza, peso_kg, fecha_nacimiento]
    );
    res.status(201).json(r.rows[0]);
};

export const Actualizar = async (req, res) => {
    let { nombre, especie, raza, peso_kg, fecha_nacimiento } = req.body;
    let r = await query(
        "UPDATE mascotas SET nombre=$2,especie=$3,raza=$4,peso_kg=$5,fecha_nacimiento=$6 WHERE id=$1 RETURNING *",
        [req.params.id, nombre, especie, raza, peso_kg, fecha_nacimiento]
    );
    if (!r.rowCount) return res.status(404).json({ error: "No encontrada" });
    res.json(r.rows[0]);
};

export const Eliminar = async (req, res) => {
    let r = await query("DELETE FROM mascotas WHERE id=$1", [req.params.id]);
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
