# Page View Tracking Setup Guide

## ✅ What's Implemented

### Database Tables
1. **`page_views`** - Tracks every page visit
   - Event ID
   - Session ID (unique per visitor session)
   - Referrer (where they came from)
   - UTM parameters (marketing campaigns)
   - Device type (mobile/tablet/desktop)
   - Browser
   - Timestamp

2. **`conversion_events`** - Tracks user actions
   - View event page
   - Add to cart
   - Start checkout
   - Complete purchase

### Tracking Script
- **`page-tracking.js`** - Automatically tracks page views
- Privacy-friendly (no cookies, session-based)
- Captures device, browser, referrer
- Parses UTM parameters for campaign tracking

### Analytics Dashboard
New sections added to `/dashboard/organizer/events/analytics/`:
- **Traffic Overview**: Total views, unique visitors, conversion rate
- **Traffic Sources**: Where visitors come from (UTM sources)
- **Device Types**: Mobile vs Desktop vs Tablet breakdown
- **Top Referrers**: External sites sending traffic
- **Conversion Funnel**: Views → Checkout → Purchase

## 🚀 How It Works

### Automatic Tracking
When someone visits an event page (`/events/?id=EVENT_ID`):
1. Script generates/retrieves session ID
2. Detects device type and browser
3. Captures referrer URL
4. Parses UTM parameters from URL
5. Saves to `page_views` table

### Manual Tracking (Optional)
You can track custom events:

```javascript
// Track a conversion event
window.eventTracking.trackConversion(eventId, 'add_to_cart', {
  ticket_type: 'VIP',
  quantity: 2
});

// Track checkout start
window.eventTracking.trackConversion(eventId, 'checkout_start');

// Track purchase
window.eventTracking.trackConversion(eventId, 'purchase', {
  order_id: orderId,
  amount: 99.99
});
```

## 📊 Marketing Campaign Tracking

### UTM Parameters
Add these to your marketing links:

```
https://ticketsale.ca/events/?id=EVENT_ID&utm_source=facebook&utm_medium=social&utm_campaign=summer2025
```

**Parameters:**
- `utm_source`: Where traffic comes from (facebook, instagram, email, google)
- `utm_medium`: Marketing medium (social, email, cpc, banner)
- `utm_campaign`: Campaign name (summer2025, launch, promo)

### Examples:

**Facebook Ad:**
```
?utm_source=facebook&utm_medium=cpc&utm_campaign=summer_festival
```

**Instagram Story:**
```
?utm_source=instagram&utm_medium=story&utm_campaign=influencer_promo
```

**Email Newsletter:**
```
?utm_source=newsletter&utm_medium=email&utm_campaign=weekly_digest
```

**Twitter Post:**
```
?utm_source=twitter&utm_medium=social&utm_campaign=launch_announcement
```

## 🔒 Privacy & Compliance

### What We Track:
- ✅ Page views (anonymous)
- ✅ Session IDs (temporary, no personal data)
- ✅ Device type & browser
- ✅ Referrer URLs
- ✅ UTM parameters

### What We DON'T Track:
- ❌ No cookies
- ❌ No personal information
- ❌ No cross-site tracking
- ❌ No IP addresses stored (can be added if needed)
- ❌ No fingerprinting

### GDPR/CCPA Compliant:
- Session-based (clears on browser close)
- No persistent identifiers
- Anonymous by default
- Can be disabled per user if needed

## 📈 Metrics Available

### Traffic Metrics
- Total page views
- Unique visitors (by session)
- Views over time
- Peak traffic times

### Source Metrics
- Direct traffic
- Referral sources
- Social media breakdown
- Campaign performance (UTM)

### Device Metrics
- Mobile vs Desktop vs Tablet
- Browser distribution
- Device trends over time

### Conversion Metrics
- View-to-purchase rate
- Checkout abandonment
- Funnel drop-off points
- Average time to purchase

## 🎯 Next Steps

### Phase 1 (Current): ✅
- Basic page view tracking
- Device & browser detection
- Referrer tracking
- UTM parameter parsing

### Phase 2 (Recommended):
1. **Add tracking to checkout page**
   ```javascript
   // In checkout.js
   window.eventTracking.trackConversion(eventId, 'checkout_start');
   ```

2. **Track successful purchases**
   ```javascript
   // In checkout-success.js
   window.eventTracking.trackConversion(eventId, 'purchase', {
     order_id: orderId,
     amount: totalAmount
   });
   ```

3. **Add geographic tracking** (optional)
   - Use Cloudflare Workers to capture country/city
   - Or integrate with IP geolocation API

### Phase 3 (Advanced):
- Heatmaps (where users click)
- Scroll depth tracking
- Time on page
- Exit intent tracking
- A/B testing framework

## 🛠️ Testing

### Test Page View Tracking:
1. Visit an event page: `/events/?id=EVENT_ID`
2. Check Supabase `page_views` table
3. Should see new row with session_id, device_type, etc.

### Test UTM Tracking:
1. Visit: `/events/?id=EVENT_ID&utm_source=test&utm_campaign=demo`
2. Check `page_views` table
3. Should see utm_source='test', utm_campaign='demo'

### Test Analytics Dashboard:
1. Go to `/dashboard/organizer/events/analytics/?id=EVENT_ID`
2. Should see traffic stats populated
3. Check device breakdown, referrers, etc.

## 🔧 Troubleshooting

### No data showing?
- Check if tracking script is loaded: `console.log(window.eventTracking)`
- Verify Supabase connection
- Check browser console for errors
- Ensure RLS policies allow inserts

### Conversion funnel empty?
- Conversion events need to be manually triggered
- Add tracking calls to checkout and success pages
- Or wait for organic traffic to generate data

### Device stats not showing?
- User agent detection might fail on some browsers
- Check `device_type` column in database
- Verify tracking script is running

## 📝 Database Queries

### Get total views for an event:
```sql
SELECT COUNT(*) FROM page_views WHERE event_id = 'EVENT_ID';
```

### Get unique visitors:
```sql
SELECT COUNT(DISTINCT session_id) FROM page_views WHERE event_id = 'EVENT_ID';
```

### Get traffic sources:
```sql
SELECT utm_source, COUNT(*) as views 
FROM page_views 
WHERE event_id = 'EVENT_ID' 
GROUP BY utm_source 
ORDER BY views DESC;
```

### Get conversion rate:
```sql
SELECT 
  COUNT(DISTINCT CASE WHEN event_type = 'view' THEN session_id END) as views,
  COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN session_id END) as purchases,
  (COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN session_id END)::float / 
   COUNT(DISTINCT CASE WHEN event_type = 'view' THEN session_id END) * 100) as conversion_rate
FROM conversion_events
WHERE event_id = 'EVENT_ID';
```
