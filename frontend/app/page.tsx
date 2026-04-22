'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'
import { getUser, clearUser, type User } from '@/lib/session'
import { tieneMascotas } from '@/lib/api'

export default function LandingPage() {
  const router = useRouter()
  const [sessionUser, setSessionUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const u = getUser()
    if (u?.id) {
      setSessionUser(u)
      setShowModal(true)
    }
  }, [])

  async function handleContinue() {
    if (!sessionUser) return
    setShowModal(false)
    const hay = await tieneMascotas(sessionUser.id)
    router.push(hay ? '/principal' : '/mascota')
  }

  function handleOtherAccount() {
    clearUser()
    setShowModal(false)
    router.push('/login')
  }

  const nombre = sessionUser?.nombre || sessionUser?.name || sessionUser?.email?.split('@')[0] || 'usuario'

  return (
    <>
      <ThemeToggle />

      <main className="phone gap-5 px-[18px] py-5" style={{ background: 'var(--bg)' }}>
        {/* Hero */}
        <header className="text-center mt-1">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>PetCare</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Una forma inteligente de cuidar a tu mascota
          </p>
        </header>

        {/* Stage con blobs y logo */}
        <section
          className="relative flex-1 min-h-[260px] rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--ring)',
            boxShadow: '0 10px 20px rgba(15,23,42,0.08), inset 0 0 0 1px rgba(255,255,255,0.40)',
          }}
        >
          {/* Blobs animados */}
          <div className="blob animate-float1" style={{ width:220, height:220, background:'radial-gradient(closest-side,#bfe0ff,transparent 70%)', left:-40, top:-30 }} />
          <div className="blob animate-float2" style={{ width:260, height:260, background:'radial-gradient(closest-side,#c9f7ff,transparent 70%)', right:-50, bottom:-40 }} />
          <div className="blob animate-float3" style={{ width:180, height:180, background:'radial-gradient(closest-side,#fff1b8,transparent 70%)', left:'40%', top:'55%' }} />

          {/* Logo ring */}
          <div
            className="relative z-10 rounded-full overflow-hidden flex items-center justify-center"
            style={{ width:180, height:180, background:'#f5f5f5', border:'2px solid var(--ring)', boxShadow:'0 8px 18px rgba(15,23,42,.15)' }}
          >
            <Image src="/imagenes/descarga.png" alt="Logo PetCare" width={158} height={158} style={{ objectFit:'contain' }} priority />
          </div>
        </section>

        {/* Botones */}
        <div className="flex flex-col gap-3">
          <a href="/login" className="pc-btn pc-btn-accent pc-btn-full text-center">Iniciar sesión</a>
          <a href="/registro" className="pc-btn text-center" style={{ background:'var(--secondary)', color:'#071e2c' }}>Crear cuenta</a>
        </div>
      </main>

      {/* Modal sesión detectada */}
      {showModal && (
        <div
          className="fixed inset-0 z-[1200] grid place-items-center"
          style={{ background: 'rgba(15,23,42,0.55)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="pc-modal w-[min(360px,90vw)]">
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>
              ¿Querés seguir con esta cuenta?
            </h3>
            <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
              Sesión detectada: {nombre}
            </p>
            <div className="flex gap-3 justify-center">
              <button className="pc-btn pc-btn-danger flex-1" onClick={handleOtherAccount}>
                Usar otra cuenta
              </button>
              <button className="pc-btn pc-btn-accent flex-1" onClick={handleContinue}>
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
