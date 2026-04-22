export interface User {
  id: number
  nombre?: string
  name?: string
  email: string
  rol?: string
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const a = localStorage.getItem('petcare_user')
    if (a) { const u = JSON.parse(a); if (u?.id) return u }
    const b = localStorage.getItem('usuario')
    if (b) { const u = JSON.parse(b); if (u?.id) { localStorage.setItem('petcare_user', b); return u } }
    return null
  } catch { return null }
}

export function setUser(u: User) {
  const json = JSON.stringify(u)
  localStorage.setItem('petcare_user', json)
  localStorage.setItem('usuario', json)
}

export function clearUser() {
  localStorage.removeItem('petcare_user')
  localStorage.removeItem('usuario')
}

export function getUserInitial(u: User | null): string {
  if (!u) return 'U'
  const name = u.nombre || u.name || u.email?.split('@')[0] || ''
  return name.trim().charAt(0).toLocaleUpperCase('es-AR') || 'U'
}
