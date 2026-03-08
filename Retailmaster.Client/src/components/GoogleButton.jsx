import { useEffect, useRef } from 'react'

/**
 * Renders the official Google "Sign in with Google" button.
 * Uses Google Identity Services (GSI) — loaded via script tag in index.html.
 *
 * Props:
 *   onToken(idToken: string) — called when user successfully signs in with Google
 *   text  — button text variant: 'signin_with' | 'signup_with' | 'continue_with'
 *   width — button width in px (default: auto-detects container width)
 */
export default function GoogleButton({ onToken, text = 'signin_with', width }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || !window.google || !containerRef.current) return

    const render = (w) => {
      // GSI requires the container to be empty before re-rendering
      containerRef.current.innerHTML = ''

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) onToken(response.credential)
        },
      })

      window.google.accounts.id.renderButton(containerRef.current, {
        type:           'standard',
        theme:          'outline',
        size:           'large',
        text,
        shape:          'rectangular',
        width:          w,
        logo_alignment: 'center',
      })
    }

    // Use provided width or measure the container
    if (width) {
      render(width)
      return
    }

    // Auto-size: render at current container width, then watch for changes
    render(containerRef.current.offsetWidth)

    const observer = new ResizeObserver((entries) => {
      const newWidth = Math.floor(entries[0].contentRect.width)
      if (newWidth > 0) render(newWidth)
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [onToken, text, width])

  return <div ref={containerRef} className="w-full" />
}