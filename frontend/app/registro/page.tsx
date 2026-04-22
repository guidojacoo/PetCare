'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setUser } from '@/lib/session'
import { API } from '@/lib/api'

export default function RegistroPage() {
  const router = useRouter()
  const [nombre,   setNombre]   = useState('')
  const [email,    setEmail]    = useState('')
  const [pass,     setPass]     = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [ok,       setOk]       = useState('')
  const [loading,  setLoading]  = useState(false)

  function validate() {
    if (!nombre.trim()) { setError('Completá tu nombre'); return false }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Email inválido'); return false }
    if (!pass) { setError('Ingresá una contraseña'); return false }
    if (pass.length < 6) { setError('Mínimo 6 caracteres'); return false }
    if (!confirm) { setError('Repetí tu contraseña'); return false }
    if (confirm !== pass) { setError('Las contraseñas no coinciden'); return false }
    return true
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setOk('')
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), email, password: pass, rol: 'usuario' }),
      })
      const d = await res.json()
      if (!res.ok) { setError(d?.error || 'No se pudo registrar'); return }
      setUser({ id: d.id, nombre: d.nombre, email: d.email, rol: d.rol })
      setOk('¡Cuenta creada! Vamos a crear tu mascota…')
      setTimeout(() => router.push('/mascota'), 800)
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

      <section className="flex flex-col px-5 pb-8 gap-1">
        <h2 className="text-xl font-bold mt-2" style={{ color: 'var(--text)' }}>Crear cuenta en PetCare</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--secondary)' }}>
            Iniciar sesión
          </Link>
        </p>

        <form onSubmit={handleRegister} className="flex flex-col gap-1 mt-3">
          <label className="pc-label" htmlFor="nombre">Nombre*</label>
          <input id="nombre" type="text" className="pc-input" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} />

          <label className="pc-label" htmlFor="email">Mail*</label>
          <input id="email" type="email" className="pc-input" placeholder="ejemplo@mail.com" value={email} onChange={e => setEmail(e.target.value)} />

          <label className="pc-label" htmlFor="pass">Contraseña*</label>
          <input id="pass" type="password" className="pc-input" placeholder="********" value={pass} onChange={e => setPass(e.target.value)} />

          <label className="pc-label" htmlFor="confirm">Confirmar contraseña*</label>
          <input id="confirm" type="password" className="pc-input" placeholder="********" value={confirm} onChange={e => setConfirm(e.target.value)} />

          {error && <p className="text-sm mt-1 font-medium" style={{ color: 'var(--bad)' }}>{error}</p>}
          {ok    && <p className="text-sm mt-1 font-medium" style={{ color: 'var(--good)' }}>{ok}</p>}

          <button type="submit" className="pc-btn pc-btn-accent pc-btn-full mt-5" disabled={loading}>
            {loading ? 'Registrando…' : 'Registrarse'}
          </button>
        </form>
      </section>
    </main>
  )
}
