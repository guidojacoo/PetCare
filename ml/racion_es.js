import fs from "fs"

const MODEL_PATH = process.env.RACION_MODEL_PATH || "racion_model_es.json"
let M
try {
  M = JSON.parse(fs.readFileSync(MODEL_PATH, "utf8"))
} catch (err) {
  console.error(`Error al cargar el modelo de ración (${MODEL_PATH}):`, err)
  throw err
}

export function predecirRacionES(features){
  let y = M.intercept
  for (let i=0;i<M.features.length;i++){
    const f = M.features[i]
    y += (Number(features[f]||0) * M.coef[i])
  }
  y = Math.round(y)
  if (!Number.isFinite(y)) y = 0
  if (y < 50) y = 50
  return y
}

export function featuresEsperadas(){ return M.features.slice() }
