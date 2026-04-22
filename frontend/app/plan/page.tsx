'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'
import { getUser } from '@/lib/session'
import { API, type Mascota } from '@/lib/api'

type DayKey = 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'
const DAY_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const DAY_KEYS: DayKey[] = ['mon','tue','wed','thu','fri','sat','sun']
const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

function buildESP(ip: string, port: string, path: string) {
  if (!ip) throw new Error('Falta IP del ESP32')
  return `http://${ip}:${port}${path}`
}

export default function PlanPage() {
  const router = useRouter()
  const [modal, setModal] = useState('')

  // Conexión
  const [ip,   setIp]   = useState('')
  const [port, setPort] = useState('8080')

  // Plan
  const [grams,  setGrams]  = useState('')
  const [water,  setWater]  = useState('600')
  const [hopper, setHopper] = useState('')
  const [mode,   setMode]   = useState<'repeat_week'|'per_day'>('repeat_week')
  const [resp,   setResp]   = useState('')

  // Repeat week
  const [dayplan,    setDayplan]    = useState<string[]>([])
  const [timeAll,    setTimeAll]    = useState('')

  // Per day
  const [weekplan,   setWeekplan]   = useState<Record<DayKey,string[]>>({ mon:[],tue:[],wed:[],thu:[],fri:[],sat:[],sun:[] })
  const [curDay,     setCurDay]     = useState(0)
  const [timeDay,    setTimeDay]    = useState('')

  // Calibración
  const [calibOpen,    setCalibOpen]    = useState(false)
  const [calibMeasured,setCalibMeasured]= useState('')
  const [calibHint,    setCalibHint]    = useState('Aún sin calibrar: se asume 10 g/s.')
  const [secPreview,   setSecPreview]   = useState('—')
  const userGPS = useRef<number|null>(null)
  const calibSec = useRef(1)

  // IA modal
  const [iaOpen,    setIaOpen]    = useState(false)
  const [mascotas,  setMascotas]  = useState<Mascota[]>([])
  const [iaPeso,    setIaPeso]    = useState('')
  const [iaEdad,    setIaEdad]    = useState('')
  const [iaKcal,    setIaKcal]    = useState('360')
  const [iaAct,     setIaAct]     = useState<'baja'|'media'|'alta'>('media')
  const [iaCas,     setIaCas]     = useState<'si'|'no'>('no')
  const [iaHint,    setIaHint]    = useState('')
  const [iaResult,  setIaResult]  = useState('')

  /* ── Auth + init ── */
  useEffect(() => {
    const u = getUser()
    if (!u?.id) { router.replace('/login'); return }
    setIp(localStorage.getItem('petcare_ip') || '')
    setPort(localStorage.getItem('petcare_port') || '8080')
    setHopper(localStorage.getItem('petcare_hopper') || '')
    initCalib(u.id)
    initPlan(u.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function effectiveGPS() { return (userGPS.current && userGPS.current > 0) ? userGPS.current : 10 }

  function refreshPreview(g?: string) {
    const v = parseFloat(g ?? grams)
    if (v > 0) setSecPreview(`${(v / effectiveGPS()).toFixed(2)} s`)
    else setSecPreview('—')
  }

  async function initCalib(userId: number) {
    try {
      const localRaw = localStorage.getItem(`petcare_cal_gps_${userId}`)
      const local = Number(localRaw)
      if (local > 0) { userGPS.current = local; setCalibHint(`Calibrado: ${local.toFixed(2)} g/s`); setCalibMeasured(local.toFixed(2)) }
      const r = await fetch(buildESP(localStorage.getItem('petcare_ip')||'', localStorage.getItem('petcare_port')||'8080', `/calibration?user=${userId}`))
      if (r.ok) {
        const j = await r.json()
        if (j?.ok && j.gps > 0) {
          userGPS.current = j.gps
          setCalibHint(`Calibrado: ${j.gps.toFixed(2)} g/s`)
          setCalibMeasured(j.gps.toFixed(2))
        }
      }
    } catch {}
    refreshPreview()
  }

  async function initPlan(userId: number) {
    // agua
    try {
      const r = await fetch(buildESP(localStorage.getItem('petcare_ip')||'', localStorage.getItem('petcare_port')||'8080', `/water?user=${userId}`))
      if (r.ok) { const j = await r.json(); if (j?.ok && j.ml > 0) setWater(String(Math.round(j.ml))) }
    } catch {}
    const local = localStorage.getItem(`petcare_water_ml_${userId}`)
    if (local) setWater(String(Math.round(Number(local))))
    // plan
    try {
      const r2 = await fetch(`${BACKEND}/db/planes/${userId}`)
      if (r2.ok) {
        const j = await r2.json()
        if (j?.ok && j.data) { applyPlan(j.data); return }
      }
    } catch {}
    const cached = localStorage.getItem(`petcare_plan_cache_${userId}`)
    if (cached) { try { applyPlan(JSON.parse(cached)) } catch {} }
  }

  function applyPlan(doc: Record<string,unknown>) {
    if (doc.gramsPerMeal) setGrams(String(doc.gramsPerMeal))
    if (doc.hopper) { setHopper(String(doc.hopper)); localStorage.setItem('petcare_hopper', String(doc.hopper)) }
    if (doc.water_ml_per_meal) setWater(String(Math.round(Number(doc.water_ml_per_meal))))
    if (doc.mode) setMode(doc.mode as 'repeat_week'|'per_day')
    if (doc.mode === 'repeat_week' && Array.isArray(doc.dayplan)) setDayplan([...doc.dayplan as string[]])
    if (doc.mode === 'per_day' && doc.weekplan && typeof doc.weekplan === 'object') {
      const wp = doc.weekplan as Record<DayKey,string[]>
      setWeekplan({ mon:[...(wp.mon||[])], tue:[...(wp.tue||[])], wed:[...(wp.wed||[])], thu:[...(wp.thu||[])], fri:[...(wp.fri||[])], sat:[...(wp.sat||[])], sun:[...(wp.sun||[])] })
    }
    refreshPreview(String(doc.gramsPerMeal||''))
  }

  /* ── Repeat week ── */
  function addTimeAll() {
    if (!timeAll || !/^\d{2}:\d{2}$/.test(timeAll)) return
    setDayplan(d => [...new Set([...d, timeAll])].sort())
    setTimeAll('')
  }
  function removeTimeAll(t: string) { setDayplan(d => d.filter(x => x !== t)) }

  /* ── Per day ── */
  function addTimeDay() {
    if (!timeDay || !/^\d{2}:\d{2}$/.test(timeDay)) return
    const k = DAY_KEYS[curDay]
    setWeekplan(w => ({ ...w, [k]: [...new Set([...w[k], timeDay])].sort() }))
    setTimeDay('')
  }
  function removeTimeDay(t: string) {
    const k = DAY_KEYS[curDay]
    setWeekplan(w => ({ ...w, [k]: w[k].filter(x => x !== t) }))
  }

  /* ── Enviar plan ── */
  async function submitPlan(e: React.FormEvent) {
    e.preventDefault()
    const g = parseInt(grams, 10)
    if (!g || g <= 0) { setResp('Gramos inválidos.'); return }
    const wml = Number(water)
    if (isNaN(wml) || wml < 0) { setResp('Agua (ml) inválida.'); return }
    const secondsOpen = g / effectiveGPS()
    const u = getUser()
    let payload: Record<string,unknown> = { userId: u?.id || null, mode, secondsOpen, water_ml_per_meal: wml }
    if (mode === 'repeat_week') {
      if (!dayplan.length) { setResp('Agregá al menos un horario.'); return }
      payload.dayplan = [...dayplan]
    } else {
      const wp = DAY_KEYS.map(k => weekplan[k])
      if (!wp.some(a => a.length)) { setResp('Cargá al menos un horario en algún día.'); return }
      payload.weekplan = wp
    }
    setResp('Enviando plan…')
    try {
      const res = await fetch(buildESP(ip, port, '/setPlan'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      const msg = await res.text()
      setResp(res.ok ? `Plan enviado. ${msg}` : `Error ${res.status}: ${msg}`)
      if (res.ok && u?.id) {
        localStorage.setItem('petcare_grams_per_meal', String(g))
        localStorage.setItem(`petcare_water_ml_${u.id}`, String(Math.round(wml)))
        const planDoc = { version:2, updatedAt:new Date().toISOString(), userId:u.id, gramsPerMeal:g, hopper:hopper?Number(hopper):null, mode, secondsOpen, water_ml_per_meal:wml, dayplan:mode==='repeat_week'?[...dayplan]:[], weekplan:mode==='per_day'?weekplan:null }
        localStorage.setItem(`petcare_plan_cache_${u.id}`, JSON.stringify(planDoc))
        fetch(`${BACKEND}/db/planes/${u.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(planDoc) }).catch(()=>{})
        fetch(`${BACKEND}/db/plan`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ plan:payload, gramsPerMeal:g, hopper:hopper?Number(hopper):null, esp:{ip,port} }) }).catch(()=>{})
      }
    } catch (err: unknown) { setResp(`No se pudo conectar: ${err instanceof Error ? err.message : ''}`) }
  }

  /* ── Calibración ── */
  async function openServo1s() {
    setCalibHint('Abriendo servo 1s...')
    try {
      const r = await fetch(buildESP(ip, port, '/calibration/open?sec=1'))
      const msg = await r.text()
      setCalibHint(r.ok ? 'Listo. Pesá lo que cayó y guardá el valor.' : `Error: ${msg}`)
      calibSec.current = 1
    } catch (e: unknown) { setCalibHint(`No se pudo conectar: ${e instanceof Error ? e.message : ''}`) }
  }

  async function saveCalib() {
    const u = getUser()
    if (!u?.id) { router.push('/login'); return }
    const g = Number(calibMeasured)
    if (!g || g <= 0) { setCalibHint('Ingresá los gramos medidos (número > 0).'); return }
    const gps = g / calibSec.current
    userGPS.current = gps
    localStorage.setItem(`petcare_cal_gps_${u.id}`, String(gps))
    try {
      const r = await fetch(buildESP(ip, port, '/calibration'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:u.id, gps }) })
      setCalibHint(r.ok ? `Calibrado ✔ (en ESP): ${gps.toFixed(2)} g/s` : `Guardado local: ${gps.toFixed(2)} g/s`)
    } catch { setCalibHint(`Guardado local: ${gps.toFixed(2)} g/s`) }
    refreshPreview()
  }

  /* ── IA ── */
  async function openIA() {
    const u = getUser()
    if (!u?.id) { router.push('/login'); return }
    setIaHint(''); setIaResult(''); setIaOpen(true)
    try {
      const r = await fetch(`${BACKEND}/mascotas`)
      const all: Mascota[] = await r.json()
      setMascotas(Array.isArray(all) ? all.filter(m => m.usuario_id === u.id) : [])
    } catch { setMascotas([]) }
  }

  function fillFromMascota(m: Mascota) {
    if (m.peso_kg != null) setIaPeso(String(m.peso_kg))
    if (m.edad_meses != null) setIaEdad(String(Math.round(m.edad_meses)))
    else if (m.fecha_nacimiento) {
      const d = new Date(m.fecha_nacimiento), now = new Date()
      setIaEdad(String(Math.max(0, (now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth()))))
    }
    if (m.kcal_100g != null) setIaKcal(String(m.kcal_100g))
    if (m.actividad) setIaAct(m.actividad.toLowerCase() as 'baja'|'media'|'alta')
    if (m.castrado != null) setIaCas((m.castrado===true||String(m.castrado).toLowerCase()==='si')?'si':'no')
  }

  async function calcIA() {
    setIaHint('Calculando...')
    try {
      const res = await fetch(`${BACKEND}/api/v1/racion_ml`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ peso_kg:Math.max(0.5,Math.min(90,Number(iaPeso||0))), edad_meses:Math.max(0,Math.min(240,Number(iaEdad||0))), kcal_100g:Math.max(250,Math.min(500,Number(iaKcal||360))), actividad:iaAct, castrado:iaCas })
      })
      const j = await res.json()
      if (!res.ok || !j?.ok) throw new Error(j?.error || `http ${res.status}`)
      const gd = Number(j.data?.gramos_dia), gpc = Number(j.data?.gramos_por_comida)
      if (!isFinite(gpc)) throw new Error('resultado inválido')
      setGrams(String(Math.round(gpc)))
      setIaResult(`Sugerencia IA: ${Math.round(gd)} g/día → ${Math.round(gpc)} g en 2 raciones`)
      setIaHint('')
      refreshPreview(String(Math.round(gpc)))
      setTimeout(() => setIaOpen(false), 700)
    } catch (e: unknown) { setIaHint(`No se pudo calcular: ${e instanceof Error ? e.message : ''}`) }
  }

  /* ── Recordar plan ── */
  async function rememberPlan() {
    const u = getUser()
    if (!u?.id) { router.push('/login'); return }
    setResp('Buscando tu último plan…')
    try {
      const r = await fetch(`${BACKEND}/db/planes/${u.id}`)
      if (r.ok) { const j = await r.json(); if (j?.ok && j.data) { applyPlan(j.data); setResp('Plan recordado.'); return } }
    } catch {}
    const cached = localStorage.getItem(`petcare_plan_cache_${u.id}`)
    if (cached) { try { applyPlan(JSON.parse(cached)); setResp('Plan recordado (caché local).'); return } catch {} }
    setResp('No encontré un plan previo.')
  }

  const saveConn = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('petcare_ip', ip); localStorage.setItem('petcare_port', port)
    setResp('Conexión guardada.')
  }

  return (
    <main className="phone" style={{ background: 'var(--bg)' }}>
      <header className="pc-topbar">
        <button style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text)', fontSize:20 }} onClick={() => router.back()}>←</button>
        <span className="font-bold" style={{ color:'var(--text)' }}>Plan de Comidas</span>
        <span />
      </header>

      <div className="flex flex-col px-4 pb-8 gap-4">

        {/* Conexión */}
        <form className="pc-card flex flex-col gap-2" onSubmit={saveConn}>
          <h2 className="font-bold" style={{ color:'var(--text)' }}>Conexión</h2>
          <label className="pc-label">IP</label>
          <input type="text" className="pc-input" placeholder="172.20.10.5" value={ip} onChange={e => setIp(e.target.value)} required />
          <label className="pc-label">Puerto</label>
          <input type="number" className="pc-input" value={port} onChange={e => setPort(e.target.value)} min={1} max={65535} required />
          <div className="flex gap-2 mt-2">
            <button type="submit" className="pc-btn pc-btn-primary flex-1">Guardar conexión</button>
            <button type="button" className="pc-btn pc-btn-secondary flex-1" onClick={() => router.push('/historial')}>Ver tabla</button>
          </div>
        </form>

        {/* Calibración */}
        <div className="pc-card flex flex-col gap-2">
          <h2 className="font-bold" style={{ color:'var(--text)' }}>Calibrar máquina</h2>
          <button type="button" className="pc-btn pc-btn-secondary pc-btn-full" onClick={() => setCalibOpen(o => !o)}>
            {calibOpen ? 'Cerrar calibración' : 'Abrir panel de calibración'}
          </button>
          {calibOpen && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="pc-subtle">Abrí el servo 1 s, pesá lo que cayó y guardá el valor (gramos).</p>
              <div className="flex gap-2">
                <button type="button" className="pc-btn pc-btn-secondary" onClick={openServo1s}>Abrir 1 s</button>
                <input type="number" className="pc-input flex-1" placeholder="gramos medidos" value={calibMeasured} onChange={e => setCalibMeasured(e.target.value)} />
                <button type="button" className="pc-btn pc-btn-primary" onClick={saveCalib}>Guardar</button>
              </div>
              <p className="pc-subtle">{calibHint}</p>
              <div className="flex items-center gap-2">
                <span className="pc-subtle">Tardaremos por comida:</span>
                <strong style={{ color:'var(--text)' }}>{secPreview}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Plan */}
        <form className="pc-card flex flex-col gap-2" onSubmit={submitPlan}>
          <h2 className="font-bold" style={{ color:'var(--text)' }}>Configurar plan</h2>
          <p className="pc-subtle">Armá el plan, mirá la vista previa y cuando estés listo envialo.</p>

          <label className="pc-label">Gramos por comida</label>
          <div className="flex gap-2">
            <input type="number" className="pc-input flex-1" min={10} step={5} placeholder="Ej: 40" value={grams} onChange={e => { setGrams(e.target.value); refreshPreview(e.target.value) }} required />
            <button type="button" className="pc-btn pc-btn-secondary" onClick={openIA}>Calcular con IA</button>
          </div>
          {iaResult && <p className="pc-subtle">{iaResult}</p>}

          <label className="pc-label">Agua por comida (ml)</label>
          <input type="number" className="pc-input" min={0} step={50} placeholder="Ej: 600" value={water} onChange={e => setWater(e.target.value)} />
          <p className="pc-subtle">Por defecto: 600 ml (bomba ~25 ml/s).</p>

          <label className="pc-label">Almacén — comida disponible</label>
          <input type="number" className="pc-input" min={0} step={10} placeholder="Ej: 1000" value={hopper} onChange={e => { setHopper(e.target.value); localStorage.setItem('petcare_hopper', e.target.value) }} />

          <label className="pc-label">Modo de plan</label>
          <select className="pc-input" value={mode} onChange={e => setMode(e.target.value as 'repeat_week'|'per_day')}>
            <option value="repeat_week">Repetir toda la semana</option>
            <option value="per_day">Por día</option>
          </select>

          {/* Repeat week */}
          {mode === 'repeat_week' && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="pc-subtle">Agregá uno o más horarios</p>
              <div className="flex gap-2">
                <input type="time" className="pc-input flex-1" value={timeAll} onChange={e => setTimeAll(e.target.value)} />
                <button type="button" className="pc-btn pc-btn-primary" onClick={addTimeAll}>Agregar</button>
                <button type="button" className="pc-btn pc-btn-ghost" onClick={() => setDayplan([])}>Limpiar</button>
              </div>
              <div className="overflow-auto rounded-xl" style={{ border:'1px solid var(--ring)' }}>
                <table className="plan-table w-full">
                  <thead><tr><th>#</th><th>Hora</th><th>Acción</th></tr></thead>
                  <tbody>
                    {dayplan.map((t,i) => (
                      <tr key={t}>
                        <td>{i+1}</td><td>{t}</td>
                        <td><button type="button" className="pc-btn pc-btn-danger text-xs py-1 px-2" onClick={() => removeTimeAll(t)}>Quitar</button></td>
                      </tr>
                    ))}
                    {!dayplan.length && <tr><td colSpan={3} className="pc-subtle text-center py-3">Sin horarios</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Per day */}
          {mode === 'per_day' && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2 justify-between">
                <button type="button" className="pc-btn pc-btn-ghost text-sm py-1 px-2" onClick={() => setCurDay(d => (d+6)%7)}>← Anterior</button>
                <span className="font-bold" style={{ color:'var(--text)' }}>{DAY_NAMES[curDay]}</span>
                <button type="button" className="pc-btn pc-btn-ghost text-sm py-1 px-2" onClick={() => setCurDay(d => (d+1)%7)}>Siguiente →</button>
              </div>
              <div className="flex gap-2">
                <input type="time" className="pc-input flex-1" value={timeDay} onChange={e => setTimeDay(e.target.value)} />
                <button type="button" className="pc-btn pc-btn-primary" onClick={addTimeDay}>Agregar</button>
                <button type="button" className="pc-btn pc-btn-ghost" onClick={() => { const k=DAY_KEYS[curDay]; setWeekplan(w => ({ ...w, [k]:[] })) }}>Limpiar</button>
              </div>
              <div className="overflow-auto rounded-xl" style={{ border:'1px solid var(--ring)' }}>
                <table className="plan-table w-full">
                  <thead><tr><th>#</th><th>Hora</th><th>Acción</th></tr></thead>
                  <tbody>
                    {weekplan[DAY_KEYS[curDay]].map((t,i) => (
                      <tr key={t}><td>{i+1}</td><td>{t}</td><td><button type="button" className="pc-btn pc-btn-danger text-xs py-1 px-2" onClick={() => removeTimeDay(t)}>Quitar</button></td></tr>
                    ))}
                    {!weekplan[DAY_KEYS[curDay]].length && <tr><td colSpan={3} className="pc-subtle text-center py-3">Sin horarios</td></tr>}
                  </tbody>
                </table>
              </div>
              {/* Vista previa semanal */}
              <h3 className="pc-subtle font-semibold mt-2">Vista previa semanal</h3>
              <div className="overflow-auto rounded-xl" style={{ border:'1px solid var(--ring)' }}>
                <table className="plan-table w-full">
                  <thead><tr><th>Día</th><th>Horarios</th></tr></thead>
                  <tbody>
                    {DAY_KEYS.map((k,i) => (
                      <tr key={k}><td>{DAY_NAMES[i]}</td><td className="pc-subtle">{weekplan[k].join(', ') || '— sin horarios —'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button type="button" className="pc-btn pc-btn-secondary pc-btn-full mt-2" onClick={rememberPlan}>Recordar mi plan</button>
          <button type="submit" className="pc-btn pc-btn-primary pc-btn-full mt-1">Enviar plan</button>
        </form>

        {resp && <p className="pc-card pc-subtle">{resp}</p>}
      </div>

      {/* Modal IA */}
      {iaOpen && (
        <div className="pc-overlay" onClick={() => setIaOpen(false)}>
          <div className="pc-modal w-[95vw] max-w-md text-left overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-base" style={{ color:'var(--text)' }}>Herramienta IA para raciones</h2>
              <button className="pc-btn pc-btn-ghost text-sm py-1 px-2" onClick={() => setIaOpen(false)}>✕</button>
            </div>
            <h3 className="font-semibold text-sm mb-2" style={{ color:'var(--text)' }}>Mis mascotas</h3>
            {mascotas.length === 0 ? <p className="pc-subtle mb-3">No tenés mascotas.</p> : (
              <div className="flex flex-col gap-2 mb-3">
                {mascotas.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background:'var(--surface-2)', border:'1px solid var(--ring)' }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color:'var(--text)' }}>{m.nombre}</p>
                      <p className="text-xs" style={{ color:'var(--muted)' }}>{m.raza} {m.peso_kg ? `• ${m.peso_kg}kg` : ''}</p>
                    </div>
                    <button className="pc-btn pc-btn-primary text-sm py-1 px-3" onClick={() => fillFromMascota(m)}>Seleccionar</button>
                  </div>
                ))}
              </div>
            )}
            <hr style={{ borderColor:'var(--ring)', margin:'12px 0' }} />
            <h3 className="font-semibold text-sm mb-2" style={{ color:'var(--text)' }}>Otra mascota</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="pc-label">Peso (kg)</label><input type="number" className="pc-input" min={0.5} step={0.1} placeholder="ej: 12" value={iaPeso} onChange={e => setIaPeso(e.target.value)} /></div>
              <div><label className="pc-label">Edad (meses)</label><input type="number" className="pc-input" min={0} step={1} placeholder="ej: 24" value={iaEdad} onChange={e => setIaEdad(e.target.value)} /></div>
              <div><label className="pc-label">kcal por 100 g</label><input type="number" className="pc-input" min={250} max={500} step={10} placeholder="ej: 360" value={iaKcal} onChange={e => setIaKcal(e.target.value)} /></div>
              <div><label className="pc-label">Actividad</label>
                <select className="pc-input" value={iaAct} onChange={e => setIaAct(e.target.value as 'baja'|'media'|'alta')}>
                  <option value="baja">baja</option><option value="media">media</option><option value="alta">alta</option>
                </select>
              </div>
              <div><label className="pc-label">Castrado</label>
                <select className="pc-input" value={iaCas} onChange={e => setIaCas(e.target.value as 'si'|'no')}>
                  <option value="no">no</option><option value="si">si</option>
                </select>
              </div>
              <div className="flex items-end"><button type="button" className="pc-btn pc-btn-primary pc-btn-full" onClick={calcIA}>Calcular ración</button></div>
            </div>
            {iaHint && <p className="pc-subtle mt-2">{iaHint}</p>}
          </div>
        </div>
      )}

      {modal && <Modal message={modal} onClose={() => setModal('')} />}
    </main>
  )
}
