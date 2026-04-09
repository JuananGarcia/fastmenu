'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, claimAnonymousPlans } from '@/lib/supabase'
import { AuthModal } from './AuthModal'

interface AppHeaderProps {
  onAuthChange?: (user: User | null) => void
}

export function AppHeader({ onAuthChange }: AppHeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      onAuthChange?.(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const nextUser = session?.user ?? null
        setUser(nextUser)
        onAuthChange?.(nextUser)

        if (event === 'SIGNED_IN') {
          await claimAnonymousPlans()
          setShowModal(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [onAuthChange])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const shortEmail = user?.email
    ? user.email.length > 24
      ? user.email.slice(0, 21) + '…'
      : user.email
    : null

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <span className="app-header__logo">🥗 FastMenu</span>
            <p className="app-header__tagline">Tu menú semanal inteligente</p>
          </div>

          <div className="app-header__auth">
            {user ? (
              <div className="auth-user">
                <span className="auth-user__email" title={user.email}>
                  👤 {shortEmail}
                </span>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={handleSignOut}
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                className="btn btn--primary btn--sm"
                onClick={() => setShowModal(true)}
              >
                📧 Entrar / Suscribirse
              </button>
            )}
          </div>
        </div>
      </header>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  )
}
