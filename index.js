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
app.get("/mascotas", mascotas.Listar)
app.get("/mascotas/:id", mascotas.Obtener)
app.post("/mascotas", mascotas.Crear)
app.put("/mascotas/:id", mascotas.Actualizar)
app.delete("/mascotas/:id", mascotas.Eliminar)
app.get("/mascotas/:id/horarios", mascotas.HorariosDeMascota)

// Rutas Horarios
app.get("/horarios", horarios.Listar)
app.post("/horarios", horarios.Crear)
app.put("/horarios/:id", horarios.Actualizar)
app.delete("/horarios/:id", horarios.Eliminar)

// Rutas Usuarios

// Iniciar servidor
let puerto = 3000;
app.listen(puerto, () => console.log(`Servidor corriendo en puerto ${puerto}`));
