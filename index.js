// Forzar zona horaria Argentina
process.env.TZ = 'America/Argentina/Buenos_Aires';

import express from "express";
import cors from "cors";
import * as mascotas from "./controllers/mascotas.js";
import * as horarios from "./controllers/horarios.js";

let app = express();
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => res.json({ ok: true, api: "PetCare" }));

// Rutas Mascotas
app.get("/mascotas", mascotas.listar)
app.get("/mascotas/:id", mascotas.obtener)
app.post("/mascotas", mascotas.crear)
app.put("/mascotas/:id", mascotas.actualizar)
app.delete("/mascotas/:id", mascotas.eliminar)
app.get("/mascotas/:id/horarios", mascotas.horariosDeMascota)

// Rutas Horarios
app.get("/horarios", horarios.listar)
app.post("/horarios", horarios.crear)
app.put("/horarios/:id", horarios.actualizar)
app.delete("/horarios/:id", horarios.eliminar)

// Iniciar servidor
let puerto = 3000;
app.listen(puerto, () => console.log(`Servidor corriendo en puerto ${puerto}`));
