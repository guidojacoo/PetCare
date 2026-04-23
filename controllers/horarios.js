import { query } from "../db.js";
import { z } from "zod";

const HorarioSchema = z.object({
    mascota_id: z.number(),
    hora_local: z.string().regex(/^\d{2}:\d{2}$/),
    gramos: z.number(),
    dias: z.string()
});

const HorarioUpdateSchema = HorarioSchema.partial().extend({
    activo: z.boolean().optional()
});

export const Listar = async (req, res) => {
    let r = await query("SELECT * FROM horarios ORDER BY hora_local ASC");
    res.json(r.rows);
};

export const Crear = async (req, res) => {
    try {
        let { mascota_id, hora_local, gramos, dias } = HorarioSchema.parse(req.body);
        let r = await query(
            "INSERT INTO horarios(mascota_id,hora_local,gramos,dias) VALUES($1,$2,$3,$4) RETURNING *",
            [mascota_id, hora_local, gramos, dias]
        );
        res.status(201).json(r.rows[0]);
    } catch (e) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
        throw e;
    }
};

export const Actualizar = async (req, res) => {
    try {
        let { hora_local, gramos, dias, activo } = HorarioUpdateSchema.parse(req.body);
        let r = await query(
            "UPDATE horarios SET hora_local=$2,gramos=$3,dias=$4,activo=COALESCE($5,activo) WHERE id=$1 RETURNING *",
            [req.params.id, hora_local, gramos, dias, activo]
        );
        if (!r.rowCount) return res.status(404).json({ error: "No encontrado" });
        res.json(r.rows[0]);
    } catch (e) {
        if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
        throw e;
    }
};

export const Eliminar = async (req, res) => {
    let r = await query("DELETE FROM horarios WHERE id=$1", [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ error: "No encontrado" });
    res.status(204).end();
};
