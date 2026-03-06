import { useEffect, useRef } from 'react'

/**
 * Renders the official Google "Sign in with Google" button.
 * Uses Google Identity Services (GSI) — loaded via script tag in index.html.
 *
 * Props:
 *   onToken(idToken: string) — called when user successfully signs in with Google
 *   text  — button text variant: 'signin_with' | 'signup_with' | 'continue_with'
 *   width — button width in px (default 340)
 */
export default function GoogleButton({ onToken, text = 'signin_with', width = 340 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || !window.google) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) onToken(response.credential)
      },
    })

    window.google.accounts.id.renderButton(containerRef.current, {
      type:  'standard',
      theme: 'outline',
      size:  'large',
      text,
      shape: 'rectangular',
      width,
      logo_alignment: 'center',
    })
  }, [onToken, text, width])

  return <div ref={containerRef} />
}
