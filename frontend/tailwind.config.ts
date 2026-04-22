import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'pc-bg':       'var(--bg)',
        'pc-surface':  'var(--surface)',
        'pc-surface2': 'var(--surface-2)',
        'pc-text':     'var(--text)',
        'pc-muted':    'var(--muted)',
        'pc-accent':   'var(--accent)',
        'pc-press':    'var(--accent-press)',
        'pc-secondary':'var(--secondary)',
        'pc-ring':     'var(--ring)',
        'pc-good':     'var(--good)',
        'pc-pending':  'var(--pending)',
        'pc-bad':      'var(--bad)',
      },
      maxWidth: { phone: '420px' },
      keyframes: {
        float1: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(20px,10px) scale(1.08)' },
        },
        float2: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(-18px,-12px) scale(1.05)' },
        },
        float3: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(-12px,16px) scale(1.07)' },
        },
      },
      animation: {
        float1: 'float1 12s ease-in-out infinite',
        float2: 'float2 14s ease-in-out infinite',
        float3: 'float3 16s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
