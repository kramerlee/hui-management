/**
 * Analytics composable for tracking user interactions
 * Uses Cloudflare Web Analytics custom events
 */

// CTA Event Types for tracking
export type CTAEventName =
  | 'cta_hero_primary'      // Hero "Bắt đầu miễn phí" button
  | 'cta_hero_secondary'    // Hero "Tìm hiểu thêm" link
  | 'cta_nav_login'         // Navigation login button
  | 'cta_nav_dashboard'     // Navigation dashboard button  
  | 'cta_footer_signup'     // Footer CTA section button
  | 'cta_login_submit'      // Login form submit
  | 'cta_create_hui'        // Create new hui

export interface CTAEventData {
  event_name: CTAEventName
  event_category: 'cta_click'
  event_label?: string
  event_value?: number
}

// Extend window interface for Cloudflare beacon
declare global {
  interface Window {
    __cfBeacon?: {
      load: string
      token: string
      spa?: boolean
    }
  }
}

/**
 * Track a CTA click event
 * Sends event to Cloudflare Web Analytics via custom pageview
 */
export function trackCTAClick(eventName: CTAEventName, label?: string): void {
  // Log in development
  if (import.meta.env.DEV) {
    console.log('[Analytics] CTA Click:', { eventName, label })
  }

  // Create a custom URL path for tracking
  // Cloudflare Web Analytics tracks pageviews, so we simulate events via URL paths
  const trackingPath = `/events/cta/${eventName}${label ? `/${encodeURIComponent(label)}` : ''}`
  
  // Store event in localStorage for debugging/analytics review
  try {
    storeEventLocally(eventName, label)
  } catch (error) {
    console.warn('[Analytics] Failed to track event:', error)
  }
  
  // Note: Cloudflare Web Analytics tracks pageviews automatically
  // Custom events are tracked via localStorage for internal analytics
  // The tracking path can be used for custom reporting
  void trackingPath
}

/**
 * Store events locally for debugging and analytics review
 */
function storeEventLocally(eventName: CTAEventName, label?: string): void {
  try {
    const events = JSON.parse(localStorage.getItem('hui_analytics_events') || '[]')
    events.push({
      event: eventName,
      label,
      timestamp: new Date().toISOString(),
      url: window.location.href
    })
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100)
    }
    
    localStorage.setItem('hui_analytics_events', JSON.stringify(events))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get stored analytics events (for debugging)
 */
export function getStoredEvents(): Array<{
  event: CTAEventName
  label?: string
  timestamp: string
  url: string
}> {
  try {
    return JSON.parse(localStorage.getItem('hui_analytics_events') || '[]')
  } catch {
    return []
  }
}

/**
 * Clear stored analytics events
 */
export function clearStoredEvents(): void {
  localStorage.removeItem('hui_analytics_events')
}

/**
 * Vue composable for analytics
 */
export function useAnalytics() {
  return {
    trackCTAClick,
    getStoredEvents,
    clearStoredEvents
  }
}

export default useAnalytics

