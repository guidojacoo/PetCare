'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Modal from '@/components/Modal'
import { getUser } from '@/lib/session'
import { API } from '@/lib/api'

type Sexo = 'Macho' | 'Hembra' | null

interface DatosMascota {
  usuario_id: number | null
  nombre: string
  sexo: Sexo
  peso_kg: number | null
  raza: string
  fecha_nacimiento: string
  kcal_100g: number | null
}

export default function MascotaPage() {
  const router = useRouter()
  const [step, setStep]   = useState(1)
  const [modal, setModal] = useState('')
  const [datos, setDatos] = useState<DatosMascota>({
    usuario_id: null, nombre: '', sexo: null,
    peso_kg: null, raza: '', fecha_nacimiento: '', kcal_100g: null,
  })

  /* ── Auth ── */
  useEffect(() => {
    const u = getUser()
    if (!u?.id) { router.replace('/login'); return }
    setDatos(d => ({ ...d, usuario_id: u.id }))
  }, [router])

  function showMsg(msg: string) { setModal(msg) }
  function req(cond: boolean, msg: string) { if (!cond) { showMsg(msg); return false } return true }

  /* ── Paso 1: nombre ── */
  function step1Next() {
    if (!req(datos.nombre.trim().length >= 2, 'Ingresá un nombre válido')) return
    setStep(2)
  }

  /* ── Paso 2: sexo ── */
  function step2Next() {
    if (!req(!!datos.sexo, 'Elegí un sexo')) return
    setStep(3)
  }

  /* ── Paso 3: peso ── */
  function step3Next() {
    if (!req((datos.peso_kg ?? 0) > 0, 'Ingresá un peso válido')) return
    setStep(4)
  }

  /* ── Paso 4: raza ── */
  function step4Next() {
    if (!req(datos.raza.trim().length >= 2, 'Ingresá una raza')) return
    setStep(5)
  }

  /* ── Paso 5: fecha → paso 6 ── */
  function step5Next() {
    const { fecha_nacimiento } = datos
    if (fecha_nacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(fecha_nacimiento)) { showMsg('Fecha inválida'); return }
    if (!req(!!datos.usuario_id, 'Usuario no válido')) return
    if (!req(!!datos.nombre,     'Falta un nombre'))   return
    if (!req(!!datos.sexo,       'Falta un sexo'))     return
    if (!req((datos.peso_kg ?? 0) > 0, 'Falta un peso')) return
    if (!req(!!datos.raza,       'Falta una raza'))    return
    setStep(6)
  }

  /* ── Paso 6: kcal → guardar ── */
  async function finish() {
    const kcal = datos.kcal_100g ?? 0
    if (!req(!isNaN(kcal), 'Ingresá calorías por 100g')) return
    if (!req(kcal >= 200 && kcal <= 600, 'Calorías fuera de rango (200-600)')) return

    try {
      const body = {
        usuario_id:       datos.usuario_id,
        nombre:           datos.nombre,
        sexo:             datos.sexo,
        raza:             datos.raza,
        peso_kg:          datos.peso_kg,
        fecha_nacimiento: datos.fecha_nacimiento || null,
        kcal_100g:        datos.kcal_100g,
      }
      const res = await fetch(`${API}/mascotas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const m = await res.json()
      if (!res.ok || !m?.id) throw new Error(m?.error || 'No se pudo crear la mascota')
      showMsg('¡Mascota creada con éxito!')
      setTimeout(() => router.push('/principal'), 1000)
    } catch (e: unknown) {
      showMsg('Error al guardar: ' + (e instanceof Error ? e.message : 'desconocido'))
    }
  }

  return (
    <main className="phone" style={{ background: 'var(--bg)' }}>
      <header className="pc-topbar justify-center">
        <h1 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>Crear Mascota</h1>
      </header>

      <section className="px-5 pb-8">

        {/* ─── Paso 1: Nombre ─── */}
        <div className={`step ${step === 1 ? 'active' : ''}`}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>¿Cómo se llama tu perro?</h2>
          <input
            type="text" className="pc-input"
            placeholder="Ej: Firulais"
            value={datos.nombre}
            onChange={e => setDatos(d => ({ ...d, nombre: e.target.value }))}
          />
          <button className="pc-btn pc-btn-accent pc-btn-full" onClick={step1Next}>Siguiente</button>
        </div>

        {/* ─── Paso 2: Sexo ─── */}
        <div className={`step ${step === 2 ? 'active' : ''}`}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Sexo</h2>
          <div className="grid grid-cols-2 gap-4">
            {(['Macho', 'Hembra'] as const).map(s => (
              <figure
                key={s}
                className={`sexo-card ${datos.sexo === s ? 'active' : ''}`}
                onClick={() => setDatos(d => ({ ...d, sexo: s }))}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDatos(d => ({ ...d, sexo: s })) } }}
                tabIndex={0} role="button" aria-label={s} aria-pressed={datos.sexo === s}
              >
                <Image
                  src={s === 'Macho' ? '/imagenes/perro_macho_sin_texto_sin_fondo.png' : '/imagenes/perra_hembra_sin_texto_sin_fondo.png'}
                  alt={s} width={80} height={80} style={{ objectFit: 'contain' }}
                />
                <figcaption>
                  <span className={`chip ${datos.sexo === s ? 'active' : ''}`}>{s}</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <button className="pc-btn pc-btn-accent pc-btn-full" onClick={step2Next}>Siguiente</button>
        </div>

        {/* ─── Paso 3: Peso ─── */}
        <div className={`step ${step === 3 ? 'active' : ''}`}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Peso en kilogramos</h2>
          <input
            type="number" className="pc-input"
            placeholder="Ej: 15"
            value={datos.peso_kg ?? ''}
            onChange={e => setDatos(d => ({ ...d, peso_kg: e.target.value ? parseFloat(e.target.value) : null }))}
          />
          <button className="pc-btn pc-btn-accent pc-btn-full" onClick={step3Next}>Siguiente</button>
        </div>

        {/* ─── Paso 4: Raza ─── */}
        <div className={`step ${step === 4 ? 'active' : ''}`}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Raza</h2>
          <input
            type="text" className="pc-input"
            placeholder="Ej: Labrador"
            value={datos.raza}
            onChange={e => setDatos(d => ({ ...d, raza: e.target.value }))}
          />
          <button className="pc-btn pc-btn-accent pc-btn-full" onClick={step4Next}>Siguiente</button>
        </div>

        {/* ─── Paso 5: Fecha ─── */}
        <div className={`step ${step === 5 ? 'active' : ''}`}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Fecha de Nacimiento</h2>
          <input
            type="date" className="pc-input"
            value={datos.fecha_nacimiento}
            onChange={e => setDatos(d => ({ ...d, fecha_nacimiento: e.target.value }))}
          />
          <button className="pc-btn pc-btn-accent pc-btn-full" onClick={step5Next}>Siguiente</button>
        </div>

        {/* ─── Paso 6: Kcal ─── */}
        <div className={`step ${step === 6 ? 'active' : ''}`}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>¿Cuántas calorías tiene el alimento?</h2>
          <label className="pc-label" htmlFor="kcal">Kcal por cada 100 g (dato en el paquete)</label>
          <input
            id="kcal" type="number" className="pc-input"
            placeholder="Ej: 350" min={200} max={600}
            value={datos.kcal_100g ?? ''}
            onChange={e => setDatos(d => ({ ...d, kcal_100g: e.target.value ? parseInt(e.target.value) : null }))}
          />
          <button className="pc-btn pc-btn-accent pc-btn-full" onClick={finish}>Finalizar</button>
        </div>

      </section>

      {/* Indicador de paso */}
      <div className="flex justify-center gap-2 pb-6">
        {[1,2,3,4,5,6].map(n => (
          <div
            key={n}
            className="rounded-full transition-all duration-300"
            style={{
              width: step === n ? 20 : 8,
              height: 8,
              background: step === n ? 'var(--accent)' : 'var(--ring)',
            }}
          />
        ))}
      </div>

      {modal && <Modal message={modal} onClose={() => setModal('')} />}
    </main>
  )
}
