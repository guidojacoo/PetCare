'use client'
import { useState } from 'react'

interface PasswordInputProps {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export default function PasswordInput({ id, value, onChange, placeholder = '********', className = '' }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="password-wrap">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`pc-input pr-10 ${className}`}
      />
      <button
        type="button"
        className={`toggle-pass ${show ? '' : 'off'}`}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setShow(v => !v)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path className="eye" d="M1 12s4.5-7 11-7 11 7 11 7-4.5 7-11 7S1 12 1 12Z" />
          <circle className="pupil" cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
          <path className="slash" d="M4 20L20 4" />
        </svg>
      </button>
    </div>
  )
}
