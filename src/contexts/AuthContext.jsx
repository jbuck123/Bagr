import { createContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile data
  const fetchProfile = useCallback(async (userId) => {
    if (!supabase) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data)
    }
    return data
  }, [])

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    let isMounted = true
    let resolved = false

    // Timeout fallback in case getSession hangs
    const timeout = setTimeout(() => {
      if (!resolved && isMounted) {
        setLoading(false)
      }
    }, 3000)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolved = true
      clearTimeout(timeout)
      if (!isMounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    }).catch((err) => {
      resolved = true
      clearTimeout(timeout)
      if (!isMounted) return
      if (err.name !== 'AbortError') {
        console.error('Error getting session:', err)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  // Auth methods
  const signUp = async (email, password) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  const signIn = async (email, password) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signInWithOAuth = async (provider) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  }

  const signOut = async () => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`
    })
    return { data, error }
  }

  const updatePassword = async (newPassword) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }

  const updateProfile = async (updates) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    if (!user) return { error: new Error('Not authenticated') }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) {
      setProfile(data)
    }
    return { data, error }
  }

  const uploadAvatar = async (file) => {
    if (!supabase) return { error: new Error('Supabase not configured') }
    if (!user) return { error: new Error('Not authenticated') }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/avatar.${fileExt}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) return { error: uploadError }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Update profile with avatar URL
    const { data, error } = await updateProfile({
      avatar_url: `${publicUrl}?t=${Date.now()}`
    })

    return { data, error }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
    refreshProfile: () => user && fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
