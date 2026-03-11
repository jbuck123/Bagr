import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const DEFAULT_BAG_SIZE = 12

export function useBag() {
  const { user } = useAuth()
  const [bag, setBag] = useState(() =>
    Array(DEFAULT_BAG_SIZE).fill(null).map(() => ({
      discId: null,
      photo: null,
      plastic: null,
      color: null,
      link: null
    }))
  )
  const [bagId, setBagId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  // Load user's bag from Supabase
  const loadBag = useCallback(async (isMountedRef) => {
    if (!supabase || !user) {
      setLoading(false)
      return
    }

    setLoading(true)

    // Timeout fallback in case Supabase hangs
    const timeoutId = setTimeout(() => {
      if (isMountedRef?.current !== false) {
        console.warn('[useBag] Load timed out after 5s')
        setLoading(false)
      }
    }, 5000)

    try {
      // Get user's bag
      const { data: bagData, error: bagError } = await supabase
        .from('bags')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (isMountedRef && !isMountedRef.current) {
        clearTimeout(timeoutId)
        return
      }

      if (bagError) {
        console.error('[useBag] Error loading bag:', bagError)
        clearTimeout(timeoutId)
        setLoading(false)
        return
      }

      setBagId(bagData.id)

      // Get bag discs
      const { data: discsData, error: discsError } = await supabase
        .from('bag_discs')
        .select('*')
        .eq('bag_id', bagData.id)
        .order('slot_index')

      if (isMountedRef && !isMountedRef.current) return

      if (discsError) {
        console.error('[useBag] Error loading discs:', discsError)
        setLoading(false)
        return
      }

      // Convert to bag array format
      const maxSlot = discsData.length > 0
        ? Math.max(...discsData.map(d => d.slot_index), DEFAULT_BAG_SIZE - 1)
        : DEFAULT_BAG_SIZE - 1

      const newBag = Array(maxSlot + 1).fill(null).map(() => ({
        discId: null,
        photo: null,
        plastic: null,
        color: null,
        link: null
      }))

      discsData.forEach(disc => {
        if (disc.slot_index < newBag.length) {
          newBag[disc.slot_index] = {
            discId: disc.disc_id,
            photo: disc.photo,
            plastic: disc.plastic,
            color: disc.color,
            link: disc.shop_link
          }
        } else {
          console.warn('[useBag] Disc slot_index out of bounds:', disc.slot_index, '>=', newBag.length)
        }
      })

      setBag(newBag)
      clearTimeout(timeoutId)
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') return
      console.error('Error loading bag:', error)
    } finally {
      if (!isMountedRef || isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [user])

  // Load bag when user changes
  useEffect(() => {
    const isMountedRef = { current: true }

    if (user) {
      loadBag(isMountedRef)
    } else {
      // Reset to empty bag when logged out
      setBag(Array(DEFAULT_BAG_SIZE).fill(null).map(() => ({
        discId: null,
        photo: null,
        plastic: null,
        color: null,
        link: null
      })))
      setBagId(null)
      setLoading(false)
    }

    return () => {
      isMountedRef.current = false
    }
  }, [user, loadBag])

  // Save a single slot to Supabase
  const saveSlot = useCallback(async (slotIndex, slotData) => {
    if (!supabase || !bagId) return

    setSaving(true)
    setSaveError(null)
    try {
      const { discId, photo, plastic, color, link } = slotData

      if (discId === null && !photo && !plastic && !color && !link) {
        // Delete the slot if it's empty
        const { error } = await supabase
          .from('bag_discs')
          .delete()
          .eq('bag_id', bagId)
          .eq('slot_index', slotIndex)
        if (error) {
          console.error('Error deleting slot:', error)
          setSaveError('Failed to save changes')
        }
      } else {
        // Upsert the slot
        const { error } = await supabase
          .from('bag_discs')
          .upsert({
            bag_id: bagId,
            slot_index: slotIndex,
            disc_id: discId,
            photo: photo,
            plastic: plastic,
            color: color,
            shop_link: link
          }, {
            onConflict: 'bag_id,slot_index'
          })
        if (error) {
          console.error('Error saving slot:', error)
          setSaveError('Failed to save changes')
        }
      }
    } catch (error) {
      console.error('Error saving slot:', error)
      setSaveError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }, [bagId])

  // Update a slot locally and save to DB
  const updateSlot = useCallback((slotIndex, updates) => {
    setBag(prev => {
      const newBag = [...prev]
      newBag[slotIndex] = {
        ...newBag[slotIndex],
        ...updates
      }

      // Save to Supabase
      if (user && bagId) {
        saveSlot(slotIndex, newBag[slotIndex])
      }

      return newBag
    })
  }, [user, bagId, saveSlot])

  // Set a disc in a slot
  const setDisc = useCallback((slotIndex, discId, photo = null) => {
    setBag(prev => {
      const newBag = [...prev]
      newBag[slotIndex] = {
        discId,
        photo: photo !== null ? photo : prev[slotIndex]?.photo || null,
        plastic: prev[slotIndex]?.plastic || null,
        color: prev[slotIndex]?.color || null,
        link: prev[slotIndex]?.link || null
      }

      // Save to Supabase
      if (user && bagId) {
        saveSlot(slotIndex, newBag[slotIndex])
      }

      return newBag
    })
  }, [user, bagId, saveSlot])

  // Remove a disc from a slot
  const removeDisc = useCallback((slotIndex) => {
    const emptySlot = {
      discId: null,
      photo: null,
      plastic: null,
      color: null,
      link: null
    }

    setBag(prev => {
      const newBag = [...prev]
      newBag[slotIndex] = emptySlot

      // Save to Supabase
      if (user && bagId) {
        saveSlot(slotIndex, emptySlot)
      }

      return newBag
    })
  }, [user, bagId, saveSlot])

  // Add a slot to the bag
  const addSlot = useCallback(() => {
    setBag(prev => [...prev, {
      discId: null,
      photo: null,
      plastic: null,
      color: null,
      link: null
    }])
  }, [])

  // Remove the last slot (if empty)
  const removeSlot = useCallback(() => {
    setBag(prev => {
      if (prev.length <= DEFAULT_BAG_SIZE) return prev
      const lastSlot = prev[prev.length - 1]
      if (lastSlot.discId === null) {
        return prev.slice(0, -1)
      }
      return prev
    })
  }, [])

  // Clear the entire bag
  const clearBag = useCallback(async () => {
    const emptyBag = Array(DEFAULT_BAG_SIZE).fill(null).map(() => ({
      discId: null,
      photo: null,
      plastic: null,
      color: null,
      link: null
    }))

    setBag(emptyBag)

    // Clear in Supabase
    if (supabase && bagId) {
      await supabase
        .from('bag_discs')
        .delete()
        .eq('bag_id', bagId)
    }
  }, [bagId])

  return {
    bag,
    bagId,
    loading,
    saving,
    saveError,
    updateSlot,
    setDisc,
    removeDisc,
    addSlot,
    removeSlot,
    clearBag,
    refreshBag: () => loadBag()
  }
}

// Hook for loading any user's public bag
export function usePublicBag(userId) {
  const [bag, setBag] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadPublicBag() {
      if (!supabase || !userId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Timeout fallback in case Supabase hangs
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn('[usePublicBag] Load timed out after 5s')
          setError('Request timed out')
          setLoading(false)
        }
      }, 5000)

      try {
        // Get user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!isMounted) {
          clearTimeout(timeoutId)
          return
        }

        if (profileError) {
          clearTimeout(timeoutId)
          setError('User not found')
          setLoading(false)
          return
        }

        setProfile(profileData)

        // Get user's bag
        const { data: bagData, error: bagError } = await supabase
          .from('bags')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (!isMounted) return

        if (bagError) {
          setError('Bag not found')
          setLoading(false)
          return
        }

        // Get bag discs
        const { data: discsData, error: discsError } = await supabase
          .from('bag_discs')
          .select('*')
          .eq('bag_id', bagData.id)
          .order('slot_index')

        if (!isMounted) return

        if (discsError) {
          console.error('Error loading discs:', discsError)
        }

        // Convert to bag array format
        const maxSlot = discsData && discsData.length > 0
          ? Math.max(...discsData.map(d => d.slot_index), DEFAULT_BAG_SIZE - 1)
          : DEFAULT_BAG_SIZE - 1

        const newBag = Array(maxSlot + 1).fill(null).map(() => ({
          discId: null,
          photo: null,
          plastic: null,
          color: null,
          link: null
        }))

        if (discsData) {
          discsData.forEach(disc => {
            if (disc.slot_index < newBag.length) {
              newBag[disc.slot_index] = {
                discId: disc.disc_id,
                photo: disc.photo,
                plastic: disc.plastic,
                color: disc.color,
                link: disc.shop_link
              }
            }
          })
        }

        setBag(newBag)
        clearTimeout(timeoutId)
      } catch (err) {
        clearTimeout(timeoutId)
        if (err.name === 'AbortError') return
        if (isMounted) {
          setError('Failed to load bag')
        }
        console.error(err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadPublicBag()

    return () => {
      isMounted = false
    }
  }, [userId])

  return { bag, profile, loading, error }
}
