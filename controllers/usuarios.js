import { query } from "../db.js"
import bcrypt from "bcryptjs"
import { z } from "zod"

const UsuarioSchema = z.object({
  nombre: z.string(),
  email: z.string().email(),
  password: z.string(),
  rol: z.string().optional()
})

const UsuarioUpdateSchema = UsuarioSchema.partial()

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})


export const Listar = async (req, res) => {
  let r = await query("select id,nombre,email,fecha_registro,rol from usuarios order by id asc")
  res.json(r.rows)
}

export const Obtener = async (req, res) => {
  let r = await query("select id,nombre,email,fecha_registro,rol from usuarios where id=$1", [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: "No encontrado" })
  res.json(r.rows[0])
}

export const Crear = async (req, res) => {
  try {
    let { nombre, email, password, rol } = UsuarioSchema.parse(req.body)
    let hash = await bcrypt.hash(password, 10)
    let r = await query(
      "insert into usuarios(nombre,email,password,rol) values($1,$2,$3,coalesce($4,'usuario')) returning id,nombre,email,fecha_registro,rol",
      [nombre, email, hash, rol]
    )
    res.status(201).json(r.rows[0])
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    throw e
  }
}

export const Actualizar = async (req, res) => {
  try {
    let { nombre, email, password, rol } = UsuarioUpdateSchema.parse(req.body)
    let pass = null
    if (password && password.length > 0) pass = await bcrypt.hash(password, 10)
    let r = await query(
      "update usuarios set nombre=coalesce($2,nombre), email=coalesce($3,email), password=coalesce($4,password), rol=coalesce($5,rol) where id=$1 returning id,nombre,email,fecha_registro,rol",
      [req.params.id, nombre, email, pass, rol]
    )
    if (!r.rowCount) return res.status(404).json({ error: "No encontrado" })
    res.json(r.rows[0])
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    throw e
  }
}

export const Eliminar = async (req, res) => {
  let r = await query("delete from usuarios where id=$1", [req.params.id])
  if (!r.rowCount) return res.status(404).json({ error: "No encontrado" })
  res.status(204).end()
}

export const Login = async (req, res) => {
  try {
    let { email, password } = LoginSchema.parse(req.body)
    let r = await query("select * from usuarios where email=$1", [email])
    if (!r.rowCount) return res.status(401).json({ error: "Credenciales" })
    let u = r.rows[0]
    let ok = await bcrypt.compare(password, u.password)
    if (!ok) return res.status(401).json({ error: "Credenciales" })
    res.json({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors })
    throw e
  }
}
