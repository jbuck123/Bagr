import { supabase } from './supabase'

export async function trackEvent(eventType, data = {}) {
  if (!supabase) return

  try {
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('events').insert({
      event_type: eventType,
      user_id: user?.id || null,
      bag_owner_id: data.bagOwnerId || null,
      disc_id: data.discId || null,
      shop_url: data.shopUrl || null,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      metadata: data.metadata || {}
    })
  } catch (error) {
    // Silently fail - don't break UX for analytics
    console.error('Analytics error:', error)
  }
}

export const trackPageView = (metadata = {}) =>
  trackEvent('page_view', { metadata })

export const trackBagView = (bagOwnerId) =>
  trackEvent('bag_view', { bagOwnerId })

export const trackShopClick = (bagOwnerId, discId, shopUrl) =>
  trackEvent('shop_click', { bagOwnerId, discId, shopUrl })
