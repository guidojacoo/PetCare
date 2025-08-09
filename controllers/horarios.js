import { query } from "../db.js";

export const listar = async (req, res) => {
    let r = await query("SELECT * FROM horarios ORDER BY hora_local ASC");
    res.json(r.rows);
};

export const crear = async (req, res) => {
    let { mascota_id, hora_local, gramos, dias } = req.body;
    let r = await query(
        "INSERT INTO horarios(mascota_id,hora_local,gramos,dias) VALUES($1,$2,$3,$4) RETURNING *",
        [mascota_id, hora_local, gramos, dias]
    );
    res.status(201).json(r.rows[0]);
};
