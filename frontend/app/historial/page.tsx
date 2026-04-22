'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface MealRow { time: string; fed: boolean; eaten: boolean; water?: boolean }
interface StatusData {
  ok: boolean
  now?: { dayName: string; hhmm: string }
  lastFeed?: { dayName: string; hhmm: string; index: number; wday: number }
  secondsOpen?: number
  pumpOn?: boolean
  eat_waiting?: boolean
  today?: { plan: MealRow[] }
  mic?: { enabled: boolean; suspended: boolean; level: number; peak: number; thr: number }
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getUserId(): string | null {
  try { const u = JSON.parse(localStorage.getItem('petcare_user')||'null'); return u?.id ?? null } catch { return null }
}
function getMascotaId() { return Number(localStorage.getItem('petcare_mascota_id') || '0') || null }

export default function HistorialPage() {
  const router = useRouter()
  const [ip,   setIp]   = useState('')
  const [port, setPort] = useState('8080')
  const [msg,  setMsg]  = useState('—')
  const [now,  setNow]  = useState('—')
  const [last, setLast] = useState('—')
  const [rows, setRows] = useState<MealRow[]>([])
  const [micInfo,   setMicInfo]   = useState('Mic: —')
  const [micAlerts, setMicAlerts] = useState(0)
  const [micMin,    setMicMin]    = useState('15')
  const [micThr,    setMicThr]    = useState('80')
  const [stock,     setStock]     = useState<{ full:number; exact:number; left:number }|null>(null)

  const frontMicAlert = useRef(false)

  function url(path: string) {
    const i = (localStorage.getItem('petcare_ip') || ip || '').trim()
    const p = (localStorage.getItem('petcare_port') || port || '8080').trim()
    if (!i) throw new Error('Falta IP')
    return `http://${i}:${p}${path}`
  }

  // Mic alerts persisted per day per user
  function alertNs() { return `petcare_mic_day_state__${getUserId()||'anon'}` }
  function readAlertMap() { try { return JSON.parse(localStorage.getItem(alertNs())||'{}') } catch { return {} } }
  function writeAlertMap(m: Record<string,unknown>) { try { localStorage.setItem(alertNs(), JSON.stringify(m)) } catch {} }
  function getDayState() {
    const k = todayKey(); const map = readAlertMap()
    if (!map[k]) { map[k] = { t:0 }; writeAlertMap(map) }
    return map[k] as { t: number }
  }
  function incAlert() {
    const k = todayKey(); const map = readAlertMap()
    if (!map[k]) map[k] = { t:0 }
    ;(map[k] as { t:number }).t++
    writeAlertMap(map)
    setMicAlerts((map[k] as { t:number }).t)
  }

  // Ticks cache
  function tickKey() {
    const d = new Date(); const mid = getMascotaId() || 0
    return `petcare_ticks_${mid}_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }
  const ticksRef = useRef<{ setC: Set<string>; setE: Set<string>; setA: Set<string> }>({ setC:new Set(), setE:new Set(), setA:new Set() })

  function applyTicks(currentRows: MealRow[]) {
    const { setC, setE, setA } = ticksRef.current
    return currentRows.map(r => ({
      ...r,
      fed:   setC.has(r.time) || r.fed,
      eaten: setE.has(r.time) || r.eaten,
      water: setA.has(r.time) || setC.has(r.time) || r.water || r.fed,
    }))
  }

  async function repaintFromDB(currentRows: MealRow[]) {
    const mid = getMascotaId()
    if (!mid) return currentRows
    try {
      const q = (params: string) => fetch(`${BACKEND}/mascotas/${mid}/ticks${params}`).then(r => r.ok ? r.json() : { ok:false, ticks:[] }).catch(() => ({ ok:false, ticks:[] }))
      const [comida, eaten, agua] = await Promise.all([q('?accion=comida&tipo=servo'), q('?accion=comida&tipo=sensor'), q('?accion=agua&tipo=servo')])
      const norm = (arr: unknown[]) => (arr||[]).map((x:unknown) => typeof x==='string' ? x.trim() : (x && typeof (x as {hora:string}).hora==='string' ? (x as {hora:string}).hora.trim() : '')).filter(Boolean)
      ticksRef.current = { setC:new Set(norm(comida.ok?comida.ticks:[])), setE:new Set(norm(eaten.ok?eaten.ticks:[])), setA:new Set(norm(agua.ok?agua.ticks:[])) }
      try { localStorage.setItem(tickKey(), JSON.stringify({ comida:[...ticksRef.current.setC], eaten:[...ticksRef.current.setE], agua:[...ticksRef.current.setA] })) } catch {}
    } catch {}
    return applyTicks(currentRows)
  }

  function calcStock(plan: MealRow[]) {
    const grams  = parseFloat(localStorage.getItem('petcare_grams_per_meal')||'0')
    const hopper = parseFloat(localStorage.getItem('petcare_hopper')||'0')
    if (!grams || !hopper) return null
    const fed = plan.filter(p => p.fed).length
    const left = Math.max(0, hopper - fed * grams)
    return { full: Math.floor(left/grams), exact: left/grams, left }
  }

  const fetchStatus = useCallback(async () => {
    try {
      const uid = getUserId()
      const path = uid ? `/status?userId=${encodeURIComponent(uid)}` : '/status'
      const res = await fetch(url(path))
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const data: StatusData = await res.json()

      if (!data.ok) { setMsg('Sin datos'); setNow('—'); setLast('—'); return }

      const pump = data.pumpOn ? 'Bomba: ON' : 'Bomba: OFF'
      setNow(`${data.now?.dayName} ${data.now?.hhmm} | ${data.secondsOpen}s | ${pump}`)
      setLast(data.lastFeed && data.lastFeed.wday >= 0
        ? `${data.lastFeed.dayName} ${data.lastFeed.hhmm} (índice ${data.lastFeed.index})`
        : 'Aún no se registraron comidas hoy.')

      const plan = data.today?.plan || []
      let currentRows = [...plan]
      currentRows = await repaintFromDB(currentRows)
      setRows(currentRows)
      setStock(calcStock(currentRows))
      setMsg(data.eat_waiting ? 'Esperando detección de comido…' : 'OK')

      // Mic
      if (data.mic) {
        const m = data.mic
        const high = m.level >= m.thr || m.peak >= m.thr
        if (high && !frontMicAlert.current) { frontMicAlert.current = true; incAlert() }
        if (!high) frontMicAlert.current = false
        const st = getDayState()
        const estado = m.enabled ? (m.suspended ? 'ON (pausado)' : 'ON') : 'OFF'
        setMicInfo(`Mic: ${estado} • nivel=${m.level} pico=${m.peak} thr=${m.thr} • alertas=${st.t}`)
        setMicAlerts(st.t)
        if (high) setMsg('⚠ Ladrido alto detectado (≥ umbral)')
      } else {
        setMicInfo('Mic: —')
        setMicAlerts(getDayState().t)
      }
    } catch (e: unknown) {
      setMsg('Error: ' + (e instanceof Error ? e.message : ''))
      setMicAlerts(getDayState().t)
      // restaurar ticks desde caché
      try {
        const raw = localStorage.getItem(tickKey())
        if (raw) {
          const obj = JSON.parse(raw)
          ticksRef.current = { setC:new Set(obj.comida||[]), setE:new Set(obj.eaten||[]), setA:new Set(obj.agua||[]) }
          setRows(r => applyTicks(r))
        }
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ip, port])

  useEffect(() => {
    setIp(localStorage.getItem('petcare_ip') || '')
    setPort(localStorage.getItem('petcare_port') || '8080')
    setMicAlerts(getDayState().t)
    // carga ticks desde caché
    try {
      const raw = localStorage.getItem(tickKey())
      if (raw) { const obj = JSON.parse(raw); ticksRef.current = { setC:new Set(obj.comida||[]), setE:new Set(obj.eaten||[]), setA:new Set(obj.agua||[]) } }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 1000)
    return () => clearInterval(id)
  }, [fetchStatus])

  const saveConn = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('petcare_ip', ip); localStorage.setItem('petcare_port', port)
    setMsg('Conexión guardada.')
  }

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <div className="max-w-[980px] mx-auto">
        <div className="sticky top-0 z-10 px-4 py-4 text-center font-bold" style={{ background:'var(--surface)', borderBottom:'1px solid var(--ring)', color:'var(--text)' }}>
          Tabla de Comidas • PetCare
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-[380px_1fr]">

            {/* Conexión */}
            <div className="pc-card">
              <h2 className="font-bold mb-3" style={{ color:'var(--text)' }}>Conexión</h2>
              <form onSubmit={saveConn} className="flex flex-col gap-2">
                <label className="pc-label">IP del ESP32</label>
                <input type="text" className="pc-input" placeholder="172.20.10.5" value={ip} onChange={e => setIp(e.target.value)} required />
                <label className="pc-label">Puerto</label>
                <input type="number" className="pc-input" value={port} onChange={e => setPort(e.target.value)} required />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button type="submit" className="pc-btn pc-btn-primary">Guardar</button>
                  <button type="button" className="pc-btn pc-btn-secondary" onClick={fetchStatus}>Probar</button>
                  <button type="button" className="pc-btn pc-btn-ghost" onClick={() => router.push('/plan')}>← Plan</button>
                </div>
              </form>
            </div>

            {/* Estado */}
            <div className="pc-card">
              <h2 className="font-bold mb-3" style={{ color:'var(--text)' }}>Estado</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {[['Ahora', now], ['Última comida', last], ['Alertas hoy', String(micAlerts)]].map(([k,v]) => (
                  <div key={k} className="p-3 rounded-xl text-sm" style={{ background:'var(--surface-2)', border:'1px solid var(--ring)', color:'var(--text)' }}>
                    <span style={{ color:'var(--muted)' }}>{k}: </span>{v}
                  </div>
                ))}
              </div>
              <p className="text-sm mb-3" style={{ background:'var(--surface-2)', border:'1px solid var(--ring)', borderRadius:10, padding:'12px 14px', color:'var(--text)' }}>{msg}</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="pc-btn pc-btn-secondary" onClick={async () => {
                  try {
                    const m = Math.max(1, parseInt(micMin)||15), t = Math.max(10, Math.min(100, parseInt(micThr)||80))
                    const uid = getUserId()
                    const qs = uid ? `/mic/start?minutes=${m}&thr=${t}&userId=${encodeURIComponent(uid)}` : `/mic/start?minutes=${m}&thr=${t}`
                    await fetch(url(qs)); setMsg(`Mic encendido por ${m} min (umbral ${t}).`)
                  } catch (e: unknown) { setMsg('Error mic: '+(e instanceof Error?e.message:'')) }
                }}>Monitorear mic</button>
                <button className="pc-btn pc-btn-ghost" onClick={async () => {
                  try { await fetch(url('/mic/stop')); setMsg('Mic detenido.') } catch {}
                }}>Detener mic</button>
                <div>
                  <label className="pc-label">Minutos</label>
                  <input type="number" className="pc-input" min={1} value={micMin} onChange={e => setMicMin(e.target.value)} />
                </div>
                <div>
                  <label className="pc-label">Umbral (0-100)</label>
                  <input type="number" className="pc-input" min={10} max={100} value={micThr} onChange={e => setMicThr(e.target.value)} />
                </div>
              </div>
              <p className="pc-subtle mt-2">{micInfo}</p>
            </div>
          </div>

          {/* Panel stock */}
          {stock && stock.exact > 0 && (
            <div className="p-4 rounded-xl text-sm flex flex-wrap items-center justify-between gap-3" style={{ background:'var(--surface-2)', border:'1px solid var(--ring)', color:'var(--text)' }}>
              <div>
                <strong>Raciones restantes</strong> — completas: <strong>{stock.full}</strong> · exacto: {stock.exact.toFixed(2)} · queda: <strong>{Math.round(stock.left)} g</strong>
              </div>
              <p className="pc-subtle">Acordate de revisar el agua y la comida cada día.</p>
            </div>
          )}

          {/* Tabla */}
          <div className="pc-card">
            <h2 className="font-bold mb-3" style={{ color:'var(--text)' }}>Hoy</h2>
            <div className="overflow-auto rounded-xl" style={{ border:'1px solid var(--ring)' }}>
              <table className="plan-table" style={{ minWidth:520 }}>
                <thead>
                  <tr><th>#</th><th>Hora</th><th>Comida Entregada</th><th>Alimentado/Hidratado</th><th>Agua Entregada</th></tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 pc-subtle">Sin datos</td></tr>
                  )}
                  {rows.map((r,i) => (
                    <tr key={i}>
                      <td>{i+1}</td>
                      <td>{r.time}</td>
                      <td>{r.fed   ? '✅' : '❌'}</td>
                      <td>{r.eaten ? '✅' : '❌'}</td>
                      <td>{(r.water || r.fed) ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-4 flex-wrap mt-3">
              <span className="status-pill good"><span className="dot" />Comida entregada</span>
              <span className="status-pill bad"><span className="dot" />Comida no entregada</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
