export const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function fetchJSON<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string })?.error || `HTTP ${res.status}`)
  return data as T
}

export interface Mascota {
  id: number
  usuario_id: number
  nombre: string
  sexo?: string
  raza?: string
  peso_kg?: number
  fecha_nacimiento?: string
  kcal_100g?: number
  edad_meses?: number
  actividad?: string
  castrado?: boolean | string
}

export async function tieneMascotas(userId: number): Promise<boolean> {
  try {
    const data = await fetchJSON<Mascota[]>(`/usuarios/${userId}/mascotas`)
    return Array.isArray(data) && data.length > 0
  } catch {
    try {
      const all = await fetchJSON<Mascota[]>('/mascotas')
      return Array.isArray(all) && all.some(m => Number(m.usuario_id) === Number(userId))
    } catch { return false }
  }
}
