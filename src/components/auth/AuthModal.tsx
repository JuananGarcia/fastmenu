'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AuthModalProps {
  onClose: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('sending')
    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/`
        : undefined

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>

        {status === 'sent' ? (
          <div className="auth-modal__success">
            <span className="auth-modal__success-icon">✉️</span>
            <h2>Revisa tu correo</h2>
            <p>
              Hemos enviado un enlace mágico a <strong>{email}</strong>.
              Si ya tienes cuenta, al hacer clic cargamos tus menús guardados.
              Si eres nuevo, quedarás suscrito al instante.
            </p>
            <button className="btn btn--primary" onClick={onClose}>
              Entendido
            </button>
          </div>
        ) : (
          <>
            <div className="auth-modal__header">
              <span className="auth-modal__icon">📧</span>
              <h2>Accede o suscríbete</h2>
              <p>
                Introduce tu correo. Si ya tienes menús guardados los cargaremos
                automáticamente. Si eres nuevo, te suscribimos al instante.
                Sin contraseñas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-modal__form">
              <label htmlFor="auth-email" className="auth-modal__label">
                Correo electrónico
              </label>
              <input
                id="auth-email"
                type="email"
                className="auth-modal__input"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />

              {status === 'error' && (
                <p className="auth-modal__error">{errorMsg}</p>
              )}

              <button
                type="submit"
                className="btn btn--primary auth-modal__submit"
                disabled={status === 'sending' || !email.trim()}
              >
                {status === 'sending' ? 'Enviando…' : '✉️ Enviar enlace mágico'}
              </button>
            </form>

            <p className="auth-modal__disclaimer">
              Solo usamos tu correo para identificarte. Sin spam, sin contraseñas.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
