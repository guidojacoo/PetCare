'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser, setUser } from '@/lib/session'
import { API, tieneMascotas } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]     = useState('')
  const [pass,  setPass]      = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const u = getUser()
    if (u?.id) {
      tieneMascotas(u.id).then(hay => router.replace(hay ? '/principal' : '/mascota'))
    }
  }, [router])

  function validate() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Ingresá un email válido'); return false }
    if (!pass) { setError('Ingresá tu contraseña'); return false }
    return true
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      })
      const d = await res.json()
      if (!res.ok) { setError('Usuario o contraseña incorrectos'); return }
      setUser(d)
      const hay = await tieneMascotas(d.id)
      router.push(hay ? '/principal' : '/mascota')
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="phone" style={{ background: 'var(--bg)' }}>
      <header className="pc-topbar justify-center">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>PetCare</h1>
      </header>

      <section className="flex flex-col px-5 pb-8 gap-2">
        <h2 className="text-xl font-bold mt-2" style={{ color: 'var(--text)' }}>Inicia sesión en PetCare</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          ¿Es tu primera vez?{' '}
          <Link href="/registro" className="font-semibold" style={{ color: 'var(--secondary)' }}>
            Regístrate
          </Link>
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-1 mt-3">
          <label className="pc-label" htmlFor="email">Mail*</label>
          <input
            id="email" type="email" className="pc-input"
            placeholder="ejemplo@mail.com"
            value={email} onChange={e => setEmail(e.target.value)}
          />

          <label className="pc-label" htmlFor="pass">Contraseña*</label>
          <input
            id="pass" type="password" className="pc-input"
            placeholder="********"
            value={pass} onChange={e => setPass(e.target.value)}
          />

          {error && <p className="text-sm mt-1 font-medium" style={{ color: 'var(--bad)' }}>{error}</p>}

          <button type="submit" className="pc-btn pc-btn-accent pc-btn-full mt-5" disabled={loading}>
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>
      </section>
    </main>
  )
}
