'use client'
import { useEffect } from 'react'

interface ModalProps {
  message: string
  onClose: () => void
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
}

export default function Modal({ message, onClose, confirmLabel, cancelLabel, onConfirm }: ModalProps) {
  const isConfirm = !!onConfirm

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="pc-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="pc-modal" onClick={e => e.stopPropagation()}>
        <p className="font-extrabold text-lg mb-5" style={{ color: 'var(--text)' }}>{message}</p>
        <div className="flex gap-3 justify-center">
          {isConfirm && (
            <button className="pc-btn pc-btn-ghost" onClick={onClose}>
              {cancelLabel ?? 'Cancelar'}
            </button>
          )}
          <button
            className={isConfirm ? 'pc-btn pc-btn-danger' : 'pc-btn pc-btn-ghost'}
            onClick={isConfirm ? onConfirm : onClose}
          >
            {isConfirm ? (confirmLabel ?? 'Eliminar') : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
