// Forzar zona horaria Argentina
process.env.TZ = 'America/Argentina/Buenos_Aires';

import "dotenv/config";
import express from "express";
import cors from "cors";
import * as mascotas from "./controllers/mascotas.js";
import * as horarios from "./controllers/horarios.js";
import * as usuarios from "./controllers/usuarios.js";
import * as planes from "./controllers/planes.js";
import * as eventos from "./controllers/eventos.js";


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

// Rutas Planes
app.post("/db/plan", planes.GuardarPlanDB);
app.get("/db/plan/:id", planes.ObtenerPlanDB);             
app.get("/db/mismascotas/:id", planes.MisMascotasDB);  
app.get("/db/planes", planes.Listar);  

// Rutas Planes extra (además de las tuyas)
app.get("/db/plan/ultimo/:userId", planes.UltimoPlanDeUsuario);
app.post("/db/plan/:id/activar", planes.Activar);
app.post("/db/plan/:id/desactivar", planes.Desactivar);
app.post("/db/plan/:id/sync", planes.RegistrarSync);


// Rutas Usuarios
app.get("/usuarios", usuarios.Listar)
app.get("/usuarios/:id", usuarios.Obtener)
app.post("/usuarios", usuarios.Crear)
app.put("/usuarios/:id", usuarios.Actualizar)
app.delete("/usuarios/:id", usuarios.Eliminar)
app.post("/login", usuarios.Login)

app.post("/eventos", eventos.Crear);                        
app.get("/mascotas/:id/eventos", eventos.Listar);           
app.get("/mascotas/:id/ticks", eventos.TicksDelDia);        


// Iniciar servidor
let puerto = 3000;
app.listen(puerto, () => console.log(`Servidor corriendo en puerto ${puerto}`));
