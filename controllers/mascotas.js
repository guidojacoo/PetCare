import { query } from "../db.js";

export const listar = async (req, res) => {
    let r = await query("SELECT * FROM mascotas ORDER BY creado_en DESC");
    res.json(r.rows);
};

export const crear = async (req, res) => {
    let { nombre, especie, raza, peso_kg, fecha_nacimiento } = req.body;
    let r = await query(
        "INSERT INTO mascotas(nombre,especie,raza,peso_kg,fecha_nacimiento) VALUES($1,$2,$3,$4,$5) RETURNING *",
        [nombre, especie, raza, peso_kg, fecha_nacimiento]
    );
    res.status(201).json(r.rows[0]);
};

export const eliminar = async (req, res) => {
    let r = await query("DELETE FROM mascotas WHERE id=$1", [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ error: "no encontrada" });
    res.status(204).end();
};
