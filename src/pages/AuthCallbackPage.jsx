import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    // Wait for auth to finish loading, then redirect
    if (!loading) {
      navigate(user ? '/my-bag' : '/login', { replace: true })
      return
    }

    // Fallback timeout in case auth hangs
    const timer = setTimeout(() => {
      navigate('/my-bag', { replace: true })
    }, 5000)

    return () => clearTimeout(timer)
  }, [user, loading, navigate])

  return (
    <div className="auth-callback-page">
      <div className="loading-spinner"></div>
      <p>Completing sign in...</p>
    </div>
  )
}
