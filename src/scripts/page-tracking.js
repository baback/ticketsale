// Page View Tracking Script
// Privacy-friendly analytics for event pages

(function() {
  'use strict';
  
  // Generate or retrieve session ID
  function getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }
  
  // Detect device type
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }
  
  // Get browser name
  function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Other';
  }
  
  // Parse UTM parameters
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign')
    };
  }
  
  // Track page view
  async function trackPageView(eventId) {
    if (!eventId) return;
    
    const sessionId = getSessionId();
    const utmParams = getUTMParams();
    
    const data = {
      event_id: eventId,
      session_id: sessionId,
      referrer: document.referrer || null,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
      device_type: getDeviceType(),
      browser: getBrowser(),
      viewed_at: new Date().toISOString()
    };
    
    try {
      // Use Supabase client if available
      if (window.supabase) {
        await window.supabase
          .from('page_views')
          .insert(data);
      }
    } catch (error) {
      console.error('Tracking error:', error);
    }
  }
  
  // Track conversion event
  async function trackConversion(eventId, eventType, metadata = {}) {
    if (!eventId) return;
    
    const sessionId = getSessionId();
    
    const data = {
      event_id: eventId,
      session_id: sessionId,
      event_type: eventType,
      metadata: metadata,
      created_at: new Date().toISOString()
    };
    
    try {
      if (window.supabase) {
        await window.supabase
          .from('conversion_events')
          .insert(data);
      }
    } catch (error) {
      console.error('Conversion tracking error:', error);
    }
  }
  
  // Expose tracking functions globally
  window.eventTracking = {
    trackPageView,
    trackConversion,
    getSessionId
  };
  
  // Auto-track page view if event is in URL
  const urlParams = new URLSearchParams(window.location.search);
  let eventId = urlParams.get('id') || window.currentEventId;
  
  // Handle ?event=slug format (extract UUID from slug)
  if (!eventId && urlParams.has('event')) {
    const slug = urlParams.get('event');
    const parts = slug.split('-');
    if (parts.length >= 5) {
      eventId = parts.slice(-5).join('-');
    }
  }
  
  if (eventId && window.location.pathname.includes('/events/')) {
    // Wait for Supabase to be ready
    if (window.supabase) {
      trackPageView(eventId);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => trackPageView(eventId), 500);
      });
    }
  }
})();
