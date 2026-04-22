import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PetCare',
  description: 'Una forma inteligente de cuidar a tu mascota',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
