# Event Analytics Guide

## Overview
The analytics page provides comprehensive insights into event performance, sales, and attendee behavior.

## Current Features (Using Supabase Data)

### 1. Key Metrics Dashboard
- **Total Revenue**: Sum of all completed orders
- **Tickets Sold**: Total number of tickets purchased
- **Total Orders**: Number of completed transactions
- **Check-ins**: Attendance tracking (tickets scanned at event)

### 2. Visual Analytics
- **Sales Timeline Chart**: Revenue trends over time (line chart)
- **Ticket Type Breakdown**: Distribution of sales by ticket type (doughnut chart)

### 3. Detailed Reports
- **Recent Orders Table**: Last 10 orders with customer info, amount, status
- **Ticket Types Performance**: Individual performance of each ticket tier
  - Sold vs available
  - Revenue per type
  - Percentage sold

### 4. Real-time Updates
- Refresh button to reload latest data
- Automatic calculation of metrics

## Future Enhancements

### Option 1: Cloudflare Web Analytics (Recommended)
**Pros:**
- Free and privacy-friendly
- No cookies required
- GDPR compliant
- Lightweight (< 5KB)
- Shows page views, unique visitors, referrers

**Implementation:**
1. Add Cloudflare Web Analytics beacon to event pages
2. Track individual event page views
3. Display in analytics dashboard

**Additional Metrics:**
- Page views per event
- Unique visitors
- Traffic sources (social, direct, referral)
- Geographic distribution
- Device breakdown (mobile/desktop)

### Option 2: Custom Page View Tracking
Create a simple `page_views` table in Supabase:

```sql
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  viewed_at TIMESTAMP DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT
);
```

**Pros:**
- Full control over data
- Can track custom events
- No third-party dependencies

**Cons:**
- Requires more development
- Need to handle privacy/GDPR
- More database load

### Option 3: Google Analytics 4
**Pros:**
- Comprehensive analytics
- Advanced features (funnels, cohorts)
- Integration with Google Ads

**Cons:**
- Privacy concerns
- Cookie consent required
- More complex setup
- Heavier script

## Recommended Approach

**Phase 1 (Current):** ✅
- Sales and ticket analytics from Supabase
- Order tracking
- Revenue metrics

**Phase 2 (Next):**
- Add Cloudflare Web Analytics for page views
- Track event page visits
- Monitor traffic sources

**Phase 3 (Future):**
- Conversion funnel (views → clicks → purchases)
- Email campaign tracking
- Social media ROI
- A/B testing for event pages

## Implementation: Cloudflare Web Analytics

### Step 1: Enable in Cloudflare Dashboard
1. Go to Cloudflare Dashboard
2. Select your domain
3. Navigate to Analytics > Web Analytics
4. Create a new site
5. Copy the beacon token

### Step 2: Add to Event Pages
Add to `events/index.html` and individual event pages:

```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "YOUR_TOKEN_HERE"}'></script>
```

### Step 3: Track Custom Events
```javascript
// Track event page view
if (window.cloudflare && window.cloudflare.track) {
  window.cloudflare.track('event_view', {
    event_id: eventId,
    event_name: eventTitle
  });
}
```

### Step 4: Fetch Analytics via API
Use Cloudflare GraphQL API to fetch analytics data and display in dashboard.

## Additional Metrics to Consider

### Engagement Metrics
- Time on event page
- Scroll depth
- Click-through rate to checkout
- Cart abandonment rate

### Marketing Metrics
- Conversion rate (views to purchases)
- Cost per acquisition (if running ads)
- ROI per marketing channel
- Promo code usage

### Attendee Insights
- Check-in times (peak arrival)
- No-show rate
- Repeat attendees
- Average group size

### Financial Metrics
- Net revenue (after fees)
- Refund rate
- Average transaction value
- Revenue per ticket type

## Data Export
Consider adding export functionality:
- CSV export of orders
- PDF reports
- Email scheduled reports
- API access for third-party tools

## Privacy Considerations
- Anonymize customer data in analytics
- Comply with GDPR/CCPA
- Clear data retention policies
- User consent for tracking
- Option to opt-out of analytics
