# Analytics Tracking Flow - How It Works

## 📊 Data Sources Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ANALYTICS DASHBOARD                       │
│         /dashboard/organizer/events/analytics/?id=123        │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
                    ┌─────────┴─────────┐
                    │  Fetches data from │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   EXISTING   │    │     NEW      │    │     NEW      │
│    TABLES    │    │    TABLES    │    │   TRACKING   │
└──────────────┘    └──────────────┘    └──────────────┘
```

## 1️⃣ Sales Analytics (Already Working ✅)

### Data Source: Existing Supabase Tables

```javascript
// In event-analytics.js (line 50-70)

// Fetch orders
const { data: orders } = await supabase
  .from('orders')
  .select('*, order_items(*, ticket_types(name))')
  .eq('event_id', eventId)
  .in('status', ['paid', 'completed']);

// Fetch tickets
const { data: tickets } = await supabase
  .from('tickets')
  .select('*, ticket_types(name, price)')
  .eq('event_id', eventId);

// Fetch ticket types
const { data: ticketTypes } = await supabase
  .from('ticket_types')
  .select('*')
  .eq('event_id', eventId);
```

### What You Get:
- ✅ Total Revenue (from `orders.total_amount`)
- ✅ Tickets Sold (count of `tickets`)
- ✅ Total Orders (count of `orders`)
- ✅ Check-ins (from `tickets.checked_in_at`)
- ✅ Sales Timeline (from `orders.created_at`)
- ✅ Ticket Type Breakdown (from `ticket_types`)

## 2️⃣ Page View Analytics (New - Now Active 🔧)

### Data Source: New `page_views` Table

```
USER JOURNEY:
┌─────────────────────────────────────────────────────────┐
│ 1. User visits event page                               │
│    /events/?event=summer-festival-2025-abc-def-ghi-jkl  │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 2. page-tracking.js runs automatically                  │
│    - Generates session ID                               │
│    - Detects device (mobile/desktop/tablet)             │
│    - Captures browser (Chrome/Safari/Firefox)           │
│    - Gets referrer (where they came from)               │
│    - Parses UTM parameters (marketing campaigns)        │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Data saved to Supabase                               │
│    INSERT INTO page_views (                             │
│      event_id,                                          │
│      session_id,                                        │
│      device_type,                                       │
│      browser,                                           │
│      referrer,                                          │
│      utm_source,                                        │
│      utm_medium,                                        │
│      utm_campaign                                       │
│    )                                                    │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Analytics dashboard fetches and displays             │
│    - Total page views                                   │
│    - Unique visitors                                    │
│    - Traffic sources                                    │
│    - Device breakdown                                   │
│    - Top referrers                                      │
└─────────────────────────────────────────────────────────┘
```

### Tracking Code Location:

**File:** `src/scripts/page-tracking.js` (lines 60-80)
```javascript
async function trackPageView(eventId) {
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
  
  await window.supabase.from('page_views').insert(data);
}
```

**Loaded on:** `/events/index.html` (line 138)
```html
<script src="../src/scripts/page-tracking.js"></script>
```

## 3️⃣ Conversion Tracking (New - Now Active 🔧)

### Data Source: New `conversion_events` Table

```
CONVERSION FUNNEL:
┌─────────────────────────────────────────────────────────┐
│ Step 1: VIEW EVENT PAGE                                 │
│ Tracked: Automatically when page loads                  │
│ Event Type: 'view'                                      │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: START CHECKOUT                                  │
│ Tracked: When user clicks "Proceed to Checkout"        │
│ Event Type: 'checkout_start'                           │
│ File: src/scripts/checkout.js (line 265)               │
└─────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: COMPLETE PURCHASE                               │
│ Tracked: On checkout success page                      │
│ Event Type: 'purchase'                                 │
│ File: src/scripts/checkout-success.js (line 48)        │
└─────────────────────────────────────────────────────────┘
```

### Tracking Code:

**Checkout Start** (`src/scripts/checkout.js`):
```javascript
// Track checkout start
if (window.eventTracking) {
  window.eventTracking.trackConversion(eventId, 'checkout_start', {
    ticket_count: totalQuantity,
    subtotal: totals.subtotal
  });
}
```

**Purchase Complete** (`src/scripts/checkout-success.js`):
```javascript
// Track purchase conversion
if (window.eventTracking && order.event_id) {
  window.eventTracking.trackConversion(order.event_id, 'purchase', {
    order_id: order.id,
    amount: order.total_amount,
    ticket_count: order.order_items?.reduce((sum, item) => sum + item.quantity, 0)
  });
}
```

## 🎯 What Gets Tracked

### Automatic Tracking (No Code Needed):
1. ✅ **Page Views** - Every time someone visits an event page
2. ✅ **Device Type** - Mobile, tablet, or desktop
3. ✅ **Browser** - Chrome, Safari, Firefox, etc.
4. ✅ **Referrer** - Where they came from
5. ✅ **Session ID** - Unique per visitor session
6. ✅ **Checkout Starts** - When user proceeds to checkout
7. ✅ **Purchases** - When order is completed

### Marketing Campaign Tracking:
Add UTM parameters to your links:
```
https://ticketsale.ca/events/?event=summer-fest-abc-def&utm_source=facebook&utm_medium=ad&utm_campaign=summer2025
```

Tracked automatically:
- `utm_source` → facebook
- `utm_medium` → ad
- `utm_campaign` → summer2025

## 📈 How to View Analytics

1. **Go to organizer dashboard**
2. **Click on an event**
3. **Click "Analytics" button**
4. **See all metrics:**
   - Sales data (revenue, tickets, orders)
   - Traffic data (views, visitors, sources)
   - Device breakdown
   - Conversion funnel
   - Top referrers

## 🧪 Testing the Tracking

### Test Page View Tracking:
```bash
# 1. Visit an event page
https://ticketsale.ca/events/?event=your-event-slug

# 2. Check Supabase page_views table
SELECT * FROM page_views WHERE event_id = 'YOUR_EVENT_ID';

# Should see:
# - session_id
# - device_type (mobile/desktop/tablet)
# - browser (Chrome/Safari/etc)
# - referrer (if came from another site)
```

### Test UTM Tracking:
```bash
# 1. Visit with UTM parameters
https://ticketsale.ca/events/?event=your-event-slug&utm_source=test&utm_campaign=demo

# 2. Check database
SELECT utm_source, utm_campaign FROM page_views WHERE event_id = 'YOUR_EVENT_ID';

# Should see:
# utm_source: test
# utm_campaign: demo
```

### Test Conversion Tracking:
```bash
# 1. Complete a purchase
# 2. Check conversion_events table
SELECT event_type, COUNT(*) 
FROM conversion_events 
WHERE event_id = 'YOUR_EVENT_ID' 
GROUP BY event_type;

# Should see:
# view: X
# checkout_start: Y
# purchase: Z
```

## 🔍 Database Schema

### page_views table:
```sql
CREATE TABLE page_views (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  session_id TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT,
  browser TEXT,
  viewed_at TIMESTAMP
);
```

### conversion_events table:
```sql
CREATE TABLE conversion_events (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  session_id TEXT,
  event_type TEXT, -- 'view', 'checkout_start', 'purchase'
  order_id UUID REFERENCES orders(id),
  metadata JSONB,
  created_at TIMESTAMP
);
```

## 🚀 Summary

**Where tracking happens:**
1. ✅ Event page (`/events/`) → Page views tracked
2. ✅ Checkout page → Checkout start tracked
3. ✅ Success page → Purchase tracked

**Where data is stored:**
1. ✅ `page_views` table → Traffic data
2. ✅ `conversion_events` table → Funnel data
3. ✅ `orders` table → Sales data (existing)
4. ✅ `tickets` table → Ticket data (existing)

**Where you see it:**
1. ✅ Analytics dashboard → All metrics combined
