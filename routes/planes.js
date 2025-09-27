// routes/planes.js  (backend ESM)
import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// Carpeta donde se guardan los JSON de planes por usuario
const PLAN_DIR = path.join(process.cwd(), "data", "planes");

// Asegura que exista la carpeta
if (!fs.existsSync(PLAN_DIR)) {
  fs.mkdirSync(PLAN_DIR, { recursive: true });
}

// GET: devuelve el plan del usuario (o null si no existe)
router.get("/db/planes/:userId", (req, res) => {
  try {
    const file = path.join(PLAN_DIR, `${req.params.userId}.json`);
    if (!fs.existsSync(file)) return res.json({ ok: true, data: null });
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// PUT: guarda/actualiza el plan del usuario
router.put("/db/planes/:userId", express.json(), (req, res) => {
  try {
    const file = path.join(PLAN_DIR, `${req.params.userId}.json`);
    fs.writeFileSync(file, JSON.stringify(req.body || {}, null, 2), "utf8");
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// 👇 ESTA LÍNEA ES LA CLAVE PARA TU ERROR
export default router;
