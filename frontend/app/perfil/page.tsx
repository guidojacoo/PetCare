'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import Modal from '@/components/Modal'
import PasswordInput from '@/components/PasswordInput'
import { getUser, setUser, clearUser, type User } from '@/lib/session'
import { API, type Mascota } from '@/lib/api'

interface ModalState { msg: string; isConfirm: boolean; onConfirm?: () => void }

export default function PerfilPage() {
  const router = useRouter()

  const [user,       setUserState]  = useState<User | null>(null)
  const [mascotas,   setMascotas]   = useState<Mascota[]>([])
  const [modal,      setModal]      = useState<ModalState | null>(null)
  const [editOpen,   setEditOpen]   = useState(false)
  const [editEmail,  setEditEmail]  = useState('')
  const [editPass,   setEditPass]   = useState('')
  const [editPass2,  setEditPass2]  = useState('')

  // Editor de mascota
  const [editorOpen,    setEditorOpen]    = useState(false)
  const [editMascota,   setEditMascota]   = useState<Partial<Mascota>>({})

  const showMsg    = (msg: string) => setModal({ msg, isConfirm: false })
  const showConfirm = (msg: string, onConfirm: () => void) => setModal({ msg, isConfirm: true, onConfirm })

  /* ── Auth ── */
  useEffect(() => {
    const u = getUser()
    if (!u?.id) { router.replace('/login'); return }
    setUserState(u)
    setEditEmail(u.email || '')
    loadUser(u.id)
    loadMascotas(u.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadUser(id: number) {
    try {
      const res = await fetch(`${API}/usuarios/${id}`)
      const d   = await res.json()
      if (!res.ok) return
      setUserState(u => u ? { ...u, nombre: d.nombre, email: d.email } : u)
      setEditEmail(d.email || '')
    } catch {}
  }

  const loadMascotas = useCallback(async (id: number) => {
    try {
      const res = await fetch(`${API}/usuarios/${id}/mascotas`)
      const d   = await res.json()
      if (!res.ok) return
      setMascotas(Array.isArray(d) ? d : [])
    } catch {}
  }, [])

  /* ── Editar perfil ── */
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!editEmail) { showMsg('Ingresá un email válido'); return }
    if ((editPass && !editPass2) || (!editPass && editPass2)) { showMsg('Completá ambas contraseñas'); return }
    if (editPass && editPass2 && editPass !== editPass2) { showMsg('Las contraseñas no coinciden'); return }

    const body: Record<string, string> = { email: editEmail }
    if (editPass) body.password = editPass

    try {
      const res = await fetch(`${API}/usuarios/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Error')
      setUser({ ...user, email: d.email || editEmail })
      setUserState(u => u ? { ...u, email: d.email || editEmail } : u)
      setEditPass(''); setEditPass2('')
      setEditOpen(false)
      showMsg('Perfil actualizado')
    } catch { showMsg('No se pudo actualizar el perfil') }
  }

  /* ── Editor mascota ── */
  function openEditor(m: Mascota) {
    setEditMascota({
      id:               m.id,
      nombre:           m.nombre,
      sexo:             m.sexo || '',
      raza:             m.raza || '',
      peso_kg:          m.peso_kg,
      fecha_nacimiento: m.fecha_nacimiento ? String(m.fecha_nacimiento).slice(0, 10) : '',
    })
    setEditorOpen(true)
  }

  async function saveMascota(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !editMascota.id) return
    try {
      const res = await fetch(`${API}/mascotas/${editMascota.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:           editMascota.nombre || null,
          sexo:             editMascota.sexo   || null,
          raza:             editMascota.raza   || null,
          peso_kg:          editMascota.peso_kg ?? null,
          fecha_nacimiento: editMascota.fecha_nacimiento || null,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Error')
      showMsg('Mascota actualizada')
      setEditorOpen(false)
      loadMascotas(user.id)
    } catch { showMsg('No se pudo actualizar la mascota') }
  }

  async function deleteMascota() {
    if (!user || !editMascota.id) return
    showConfirm('¿Seguro que querés borrar esta mascota?', async () => {
      try {
        const res = await fetch(`${API}/mascotas/${editMascota.id}`, { method: 'DELETE' })
        if (!res.ok && res.status !== 204) throw new Error()
        setEditorOpen(false)
        loadMascotas(user.id)
      } catch { showMsg('No se pudo borrar la mascota') }
    })
  }

  const nombre = user?.nombre || user?.name || user?.email?.split('@')[0] || ''

  return (
    <>
      <ThemeToggle />
      <main className="phone" style={{ background: 'var(--bg)' }}>

        {/* Topbar */}
        <header className="pc-topbar">
          <button className="text-xl" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)' }} onClick={() => router.back()}>←</button>
          <span style={{ color: 'var(--text)' }}>Perfil</span>
          <span />
        </header>

        <section className="flex flex-col px-4 pb-8 gap-4">

          {/* Tarjeta usuario */}
          <div className="pc-card flex items-center gap-4">
            <div className="text-4xl">🐶</div>
            <div>
              <h2 className="font-bold text-base" style={{ color: 'var(--text)' }}>{nombre}</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{user?.email}</p>
            </div>
          </div>

          {/* Mis mascotas */}
          <div className="pc-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>Mis mascotas</h3>
              <button className="pc-btn pc-btn-ghost text-sm py-1 px-3" onClick={() => router.push('/mascota')}>+ Nueva</button>
            </div>
            {mascotas.length === 0 ? (
              <p className="pc-subtle">No tenés mascotas.</p>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--ring)' }}>
                {mascotas.map(m => {
                  const meta = [m.sexo, m.raza, m.peso_kg ? `${m.peso_kg} kg` : null].filter(Boolean).join(' • ')
                  return (
                    <li key={m.id} className="pet-item">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{m.nombre}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{meta}</p>
                      </div>
                      <button className="pc-btn pc-btn-ghost text-sm py-1 px-3" onClick={() => openEditor(m)}>✎ Editar</button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Editor mascota */}
          {editorOpen && (
            <div className="pc-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold" style={{ color: 'var(--text)' }}>Editar mascota</h3>
                <button className="pc-btn pc-btn-ghost text-sm py-1 px-3" onClick={() => setEditorOpen(false)}>Cerrar</button>
              </div>
              <form onSubmit={saveMascota} className="flex flex-col gap-1">
                <label className="pc-label">Nombre</label>
                <input type="text" className="pc-input" value={editMascota.nombre || ''} onChange={e => setEditMascota(m => ({ ...m, nombre: e.target.value }))} />
                <label className="pc-label">Sexo</label>
                <select className="pc-input" value={editMascota.sexo || ''} onChange={e => setEditMascota(m => ({ ...m, sexo: e.target.value }))}>
                  <option value="">(No especificar)</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
                <label className="pc-label">Raza</label>
                <input type="text" className="pc-input" value={editMascota.raza || ''} onChange={e => setEditMascota(m => ({ ...m, raza: e.target.value }))} />
                <label className="pc-label">Peso (kg)</label>
                <input type="number" step="0.1" min="0" className="pc-input" value={editMascota.peso_kg ?? ''} onChange={e => setEditMascota(m => ({ ...m, peso_kg: e.target.value ? Number(e.target.value) : undefined }))} />
                <label className="pc-label">Fecha de nacimiento</label>
                <input type="date" className="pc-input" value={editMascota.fecha_nacimiento || ''} onChange={e => setEditMascota(m => ({ ...m, fecha_nacimiento: e.target.value }))} />
                <div className="flex gap-3 mt-4">
                  <button type="submit" className="pc-btn pc-btn-orange flex-1">Guardar</button>
                  <button type="button" className="pc-btn pc-btn-danger flex-1" onClick={deleteMascota}>Borrar</button>
                </div>
              </form>
            </div>
          )}

          {/* Editar perfil */}
          <div className="pc-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>Editar perfil</h3>
              <button className="pc-btn pc-btn-ghost text-sm py-1 px-3" onClick={() => setEditOpen(o => !o)}>
                {editOpen ? 'Cerrar' : 'Editar'}
              </button>
            </div>
            {editOpen && (
              <form onSubmit={saveProfile} className="flex flex-col gap-1">
                <label className="pc-label" htmlFor="edit-email">Nuevo email</label>
                <input id="edit-email" type="email" className="pc-input" placeholder="nuevo@mail.com" value={editEmail} onChange={e => setEditEmail(e.target.value)} />

                <label className="pc-label">Nueva contraseña</label>
                <PasswordInput id="edit-pass" value={editPass} onChange={setEditPass} placeholder="(opcional)" />

                <label className="pc-label">Confirmar contraseña</label>
                <PasswordInput id="edit-pass2" value={editPass2} onChange={setEditPass2} placeholder="(opcional)" />

                <div className="flex gap-3 mt-4">
                  <button type="button" className="pc-btn pc-btn-ghost flex-1" onClick={() => { clearUser(); router.push('/login') }}>
                    Cerrar sesión
                  </button>
                  <button type="submit" className="pc-btn pc-btn-orange flex-1">Guardar cambios</button>
                </div>
              </form>
            )}
            {!editOpen && (
              <button className="pc-btn pc-btn-ghost pc-btn-full" onClick={() => { clearUser(); router.push('/login') }}>
                Cerrar sesión
              </button>
            )}
          </div>

        </section>
      </main>

      {modal && (
        <Modal
          message={modal.msg}
          onClose={() => setModal(null)}
          onConfirm={modal.isConfirm ? modal.onConfirm : undefined}
        />
      )}
    </>
  )
}
