'use client'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('petcare_theme')
    const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('petcare_theme', next ? 'dark' : 'light')
  }

  return (
    <div className="theme-switch fixed top-3 left-3 z-50">
      <input
        id="theme-switch"
        type="checkbox"
        checked={dark}
        onChange={toggle}
        aria-label="Cambiar tema"
      />
      <label className="theme-toggle" htmlFor="theme-switch">
        <span className="sky" />
        <span className="sun" />
        <span className="moon" />
        <span className="cloud c1" />
        <span className="cloud c2" />
        <span className="stars" />
      </label>
    </div>
  )
}
