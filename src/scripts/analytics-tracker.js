// Analytics Tracker - Client-side tracking for page views and conversions

class AnalyticsTracker {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.initialized = false;
  }

  // Get or create session ID
  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  // Generate unique ID
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Get device type
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // Get UTM parameters
  getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content')
    };
  }

  // Track page view
  async trackPageView(eventId = null) {
    if (!window.supabaseClient) {
      console.warn('Supabase client not initialized');
      return;
    }

    try {
      const utmParams = this.getUtmParams();
      
      const pageViewData = {
        session_id: this.sessionId,
        event_id: eventId,
        page_url: window.location.href,
        page_path: window.location.pathname,
        referrer: document.referrer || null,
        device_type: this.getDeviceType(),
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        ...utmParams
      };

      const { error } = await window.supabaseClient
        .from('page_views')
        .insert([pageViewData]);

      if (error) {
        console.error('Error tracking page view:', error);
      } else {
        console.log('Page view tracked:', pageViewData);
      }
    } catch (error) {
      console.error('Error in trackPageView:', error);
    }
  }

  // Track conversion event
  async trackConversion(eventId, eventType, metadata = {}) {
    if (!window.supabaseClient) {
      console.warn('Supabase client not initialized');
      return;
    }

    try {
      const conversionData = {
        session_id: this.sessionId,
        event_id: eventId,
        event_type: eventType, // 'view', 'checkout_start', 'purchase'
        metadata: metadata
      };

      const { error } = await window.supabaseClient
        .from('conversion_events')
        .insert([conversionData]);

      if (error) {
        console.error('Error tracking conversion:', error);
      } else {
        console.log('Conversion tracked:', conversionData);
      }
    } catch (error) {
      console.error('Error in trackConversion:', error);
    }
  }

  // Initialize tracking for event page
  initEventTracking(eventId) {
    if (this.initialized) return;
    this.initialized = true;

    // Track page view
    this.trackPageView(eventId);
    
    // Track event view conversion
    this.trackConversion(eventId, 'view');

    // Track clicks on "Get Tickets" button
    const getTicketsBtn = document.querySelector('a[href*="/checkout/"]');
    if (getTicketsBtn) {
      getTicketsBtn.addEventListener('click', () => {
        this.trackConversion(eventId, 'checkout_start');
      });
    }
  }

  // Initialize tracking for checkout page
  initCheckoutTracking(eventId) {
    if (this.initialized) return;
    this.initialized = true;

    // Track page view
    this.trackPageView(eventId);
    
    // Track checkout start
    this.trackConversion(eventId, 'checkout_start');
  }

  // Track purchase (call this on checkout success)
  async trackPurchase(eventId, orderId, amount) {
    await this.trackConversion(eventId, 'purchase', {
      order_id: orderId,
      amount: amount
    });
  }
}

// Create global instance
window.analyticsTracker = new AnalyticsTracker();
