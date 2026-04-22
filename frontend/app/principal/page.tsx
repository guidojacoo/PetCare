'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getUser, getUserInitial } from '@/lib/session'

const CTRL_IP = '172.20.10.10'
const CAM_IP  = '172.20.10.5'
const STREAM_URL = `http://${CAM_IP}:81/stream`
const SERVO_URL  = `http://${CTRL_IP}:8080/servo`
const BUZZER_URL = `http://${CTRL_IP}:8080/buzzer`
const STATUS_URL = `http://${CTRL_IP}:8080/status`

export default function PrincipalPage() {
  const router = useRouter()
  const [initial, setInitial] = useState('U')
  const [camOn,   setCamOn]   = useState(false)
  const [camLocked, setCamLocked] = useState(false)
  const [toast,   setToast]   = useState('')
  const [toastOn, setToastOn] = useState(true)
  const [toastVisible, setToastVisible] = useState(false)

  const imgRef        = useRef<HTMLImageElement>(null)
  const toastTimer    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const manualLockEnd = useRef(0)

  /* ── Auth ── */
  useEffect(() => {
    const u = getUser()
    if (!u?.id) { router.replace('/'); return }
    setInitial(getUserInitial(u))
  }, [router])

  /* ── Status polling ── */
  useEffect(() => {
    async function poll() {
      try {
        const r = await fetch(STATUS_URL)
        if (!r.ok) return
        const st = await r.json()
        const manual = Date.now() < manualLockEnd.current
        const plan   = !!st?.eat_waiting
        setCamLocked(manual || plan)
      } catch {}
    }
    poll()
    const id = setInterval(poll, 1200)
    return () => clearInterval(id)
  }, [])

  /* ── Helpers ── */
  function showToast(text: string, on: boolean, ms = 2500) {
    setToast(text); setToastOn(on); setToastVisible(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), ms)
  }

  function lockFor(ms: number) {
    manualLockEnd.current = Date.now() + ms
    setCamLocked(true)
    setTimeout(() => {
      if (Date.now() >= manualLockEnd.current) setCamLocked(false)
    }, ms + 100)
  }

  function startStream() {
    if (camLocked || !imgRef.current) return
    imgRef.current.src = STREAM_URL
    imgRef.current.style.display = 'block'
    setCamOn(true)
  }

  function stopStream() {
    if (!imgRef.current) return
    imgRef.current.style.display = 'none'
    imgRef.current.removeAttribute('src')
    setCamOn(false)
  }

  async function handleServo() {
    lockFor(4000)
    stopStream()
    fetch(SERVO_URL).catch(() => {})
  }

  async function handleBuzzer() {
    lockFor(3000)
    stopStream()
    fetch(BUZZER_URL, { method: 'POST' }).catch(() => {})
    showToast('Bocina Activada', true)
  }

  function toggleCam() {
    if (camLocked) return
    camOn ? stopStream() : startStream()
  }

  /* ── Stop stream on hide ── */
  useEffect(() => {
    const hide = () => stopStream()
    window.addEventListener('pagehide', hide)
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopStream() })
    return () => window.removeEventListener('pagehide', hide)
  }, [])

  return (
    <main className="phone" style={{ background: 'var(--bg)' }}>
      {/* Topbar */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => router.push('/perfil')}
          className="p-1 rounded-lg"
          aria-label="Configuración"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <Image src="/Fotos/configuracion.png" alt="Configuración" width={40} height={40} />
        </button>
        <div className="dot-user" title={`Usuario: ${initial}`}>{initial}</div>
      </header>

      {/* Cámara */}
      <section
        className="mx-4 rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ minHeight: 220, background: 'var(--surface)', border: '1px solid var(--ring)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          id="camara-stream"
          alt="Cámara en vivo"
          style={{ display: 'none' }}
        />
        {!camOn && (
          <p className="pc-subtle text-center px-4">Cámara apagada</p>
        )}
      </section>

      {/* Toast */}
      <div className={`mic-toast mx-4 ${toastVisible ? 'show' : ''} ${!toastOn ? 'off' : ''}`}>
        {toast}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-around px-6 py-4 mt-2">
        {/* Bocina */}
        <button className="fab" onClick={handleBuzzer} aria-label="Bocina">
          <Image src="/imagenes/sonido.png" alt="Bocina" width={40} height={40} />
        </button>

        {/* Servo */}
        <button className="fab" onClick={handleServo} aria-label="Darle comida">
          <Image src="/Fotos/PataDePerro.png" alt="Pata" width={40} height={50} />
        </button>

        {/* Plan */}
        <button className="fab" onClick={() => router.push('/plan')} aria-label="Plan de comidas">
          <Image src="/Fotos/Notas.png" alt="Plan" width={40} height={40} />
        </button>

        {/* Cámara toggle */}
        <button
          className={`fab ${camLocked ? 'disabled' : ''}`}
          onClick={toggleCam}
          aria-label="Encender/apagar cámara"
          title={camLocked ? 'Cámara deshabilitada por acción/plan' : 'Encender/apagar cámara'}
        >
          <Image
            src="/imagenes/prendido.png"
            alt="Cámara"
            width={40}
            height={40}
            style={{ opacity: camOn ? 1 : 0.5 }}
          />
        </button>
      </div>
    </main>
  )
}
