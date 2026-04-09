import type { Metadata } from 'next'
import './globals.css'
import { AppHeader } from '@/components/auth/AppHeader'

export const metadata: Metadata = {
  title: 'FastMenu — Tu menú semanal inteligente',
  description: 'Genera menús semanales personalizados basados en tus preferencias de salud, intolerancias y cocina favorita.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppHeader />
        <main className="app-main">{children}</main>
        <footer className="app-footer">
          <p>© 2025 FastMenu · Menús personalizados para cada semana</p>
        </footer>
      </body>
    </html>
  )
}
