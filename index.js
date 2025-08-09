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
app.get("/mascotas", mascotas.listar);
app.post("/mascotas", mascotas.crear);
app.delete("/mascotas/:id", mascotas.eliminar);

// Rutas Horarios
app.get("/horarios", horarios.listar);
app.post("/horarios", horarios.crear);

// Iniciar servidor
let puerto = 3000;
app.listen(puerto, () => console.log(`Servidor corriendo en puerto ${puerto}`));
