// index.js (server)
process.env.TZ = 'America/Argentina/Buenos_Aires';

import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import * as mascotas from "./controllers/mascotas.js";
import * as horarios from "./controllers/horarios.js";
import * as usuarios from "./controllers/usuarios.js";
import * as planes from "./controllers/planes.js";
import * as eventos from "./controllers/eventos.js";
import planesFilesRouter from "./routes/planes.js";


let app = express();
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => res.json({ ok: true, api: "PetCare" }));

// Rutas Mascotas
app.get("/mascotas", mascotas.Listar);
app.get("/mascotas/:id", mascotas.Obtener);
app.post("/mascotas", mascotas.Crear);
app.put("/mascotas/:id", mascotas.Actualizar);
app.delete("/mascotas/:id", mascotas.Eliminar);
app.get("/mascotas/:id/horarios", mascotas.HorariosDeMascota);

// NUEVA: mascotas de un usuario (para decidir flujo post-login)
app.get("/usuarios/:id/mascotas", mascotas.ListarPorUsuario);

app.use(planesFilesRouter);


// Rutas Planes
app.post("/db/plan", planes.GuardarPlanDB);
app.get("/db/plan/:id", planes.ObtenerPlanDB);
app.get("/db/mismascotas/:id", planes.MisMascotasDB);
app.get("/db/planes", planes.Listar);

// Rutas Planes extra
app.get("/db/plan/ultimo/:userId", planes.UltimoPlanDeUsuario);
app.post("/db/plan/:id/activar", planes.Activar);
app.post("/db/plan/:id/desactivar", planes.Desactivar);
app.post("/db/plan/:id/sync", planes.RegistrarSync);

// Rutas Usuarios
app.get("/usuarios", usuarios.Listar);
app.get("/usuarios/:id", usuarios.Obtener);
app.post("/usuarios", usuarios.Crear);
app.put("/usuarios/:id", usuarios.Actualizar);
app.delete("/usuarios/:id", usuarios.Eliminar);
app.post("/login", usuarios.Login);

// Eventos
app.post("/eventos", eventos.Crear);
app.get("/mascotas/:id/eventos", eventos.Listar);
app.get("/mascotas/:id/ticks", eventos.TicksDelDia);

// ML: ración
const M = JSON.parse(fs.readFileSync("./ml/racion_model_es.json","utf8"));

function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)) }
function clasificarTamanio(p){ if(p<10) return "mini"; if(p<25) return "mediana"; return "grande" }

app.post("/api/v1/racion_ml", (req,res)=>{
  try{
    const p = req.body || {}
    const peso_kg   = clamp(Number(p.peso_kg||0), 0.5, 90)
    const edad_meses= clamp(Number(p.edad_meses||0), 0, 240)
    const kcal_100g = clamp(Number(p.kcal_100g||360), 250, 500)

    const tamanio = String(p.tamanio||"").toLowerCase().trim() || clasificarTamanio(peso_kg)
    const actividad = String(p.actividad||"media").toLowerCase().trim()
    const castrado  = String(p.castrado||"no").toLowerCase().trim()

    const feats = {
      peso_kg, edad_meses, kcal_100g,
      tamanio_grande: 0, tamanio_mediana: 0, tamanio_mini: 0,
      actividad_alta: 0, actividad_baja: 0, actividad_media: 0,
      castrado_no: 0, castrado_si: 0
    }
    if (tamanio==="mini") feats.tamanio_mini=1
    else if (tamanio==="mediana") feats.tamanio_mediana=1
    else feats.tamanio_grande=1

    if (actividad==="alta") feats.actividad_alta=1
    else if (actividad==="baja") feats.actividad_baja=1
    else feats.actividad_media=1

    if (castrado==="si") feats.castrado_si=1; else feats.castrado_no=1

    let y = M.intercept
    for (let i=0;i<M.features.length;i++){
      const f = M.features[i]
      y += (Number(feats[f]||0) * M.coef[i])
    }
    const gramos_dia = Math.max(50, Math.round(y))
    const tomas = edad_meses < 12 ? 3 : 2
    const gramos_por_comida = Math.max(10, Math.round(gramos_dia / tomas))

    return res.json({ ok:true, data:{ gramos_dia, tomas, gramos_por_comida } })
  }catch(e){
    return res.status(500).json({ ok:false, error:"server", detail:String(e?.message||e) })
  }
})

// Iniciar servidor
let puerto = 3000;
app.listen(puerto, () => console.log(`Servidor corriendo en puerto ${puerto}`));
