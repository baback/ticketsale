# Troubleshooting Guide

## Common Issues and Solutions

### 🚫 Email Not Received

#### Symptoms
- Payment successful but no email
- Webhook processed but email missing
- User complains about no confirmation

#### Solutions

1. **Check Resend API Key**
   ```bash
   supabase secrets list | grep RESEND
   ```
   If missing, set it:
   ```bash
   supabase secrets set RESEND_API_KEY="re_your_key"
   ```

2. **Check Webhook Logs**
   ```bash
   supabase functions logs stripe-webhook
   ```
   Look for:
   - "Email sent successfully" ✅
   - "Resend error" ❌
   - Error messages

3. **Verify Email Address**
   - Check user's email is correct
   - Check spam/junk folder
   - Verify domain in Resend dashboard

4. **Test Resend API Directly**
   ```bash
   curl -X POST https://api.resend.com/emails \
     -H "Authorization: Bearer re_your_key" \
     -H "Content-Type: application/json" \
     -d '{"from":"test@yourdomain.com","to":"your@email.com","subject":"Test","html":"<p>Test</p>"}'
   ```

---

### 📄 PDF Not Generated

#### Symptoms
- Email received but no PDF attachment
- PDF generation error in logs
- Blank or corrupted PDF

#### Solutions

1. **Check PDFShift API Key**
   ```bash
   supabase secrets list | grep PDFSHIFT
   ```

2. **Verify PDFShift Credits**
   - Log into PDFShift dashboard
   - Check remaining credits
   - Add more credits if needed

3. **Check Webhook Logs**
   ```bash
   supabase functions logs stripe-webhook | grep -i pdf
   ```
   Look for:
   - "PDF generated successfully" ✅
   - "PDFShift error" ❌
   - API error messages

4. **Test PDFShift API**
   ```bash
   curl -X POST https://api.pdfshift.io/v3/convert/pdf \
     -u "api:your_api_key" \
     -H "Content-Type: application/json" \
     -d '{"source":"<h1>Test</h1>"}' \
     --output test.pdf
   ```

---

### 🎫 Tickets Not Showing in Dashboard

#### Symptoms
- Payment successful but no tickets in dashboard
- Dashboard shows "0 tickets"
- Order exists but tickets missing

#### Solutions

1. **Check Order Status**
   ```sql
   SELECT id, status, user_id 
   FROM orders 
   WHERE id = 'order_id_here';
   ```
   Status should be "completed"

2. **Check Tickets Created**
   ```sql
   SELECT * FROM tickets 
   WHERE order_id = 'order_id_here';
   ```
   Should return ticket records

3. **Check User ID Match**
   ```sql
   SELECT o.user_id as order_user, t.user_id as ticket_user
   FROM orders o
   LEFT JOIN tickets t ON t.order_id = o.id
   WHERE o.id = 'order_id_here';
   ```
   User IDs should match

4. **Refresh Dashboard**
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
   - Clear browser cache
   - Log out and log back in

---

### 🔲 QR Codes Not Displaying

#### Symptoms
- Tickets show but QR code is blank
- QR code shows broken image icon
- QR code is too small/large

#### Solutions

1. **Check QR Code Data**
   ```sql
   SELECT ticket_number, 
          LENGTH(qr_code) as qr_length,
          SUBSTRING(qr_code, 1, 50) as qr_preview
   FROM tickets 
   WHERE id = 'ticket_id_here';
   ```
   Should start with "data:image/png;base64,"

2. **Verify Trigger Function**
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgname LIKE '%qr%';
   ```
   QR generation trigger should exist

3. **Regenerate QR Code**
   ```sql
   UPDATE tickets 
   SET qr_code = NULL 
   WHERE id = 'ticket_id_here';
   -- Trigger will regenerate on next update
   UPDATE tickets 
   SET updated_at = NOW() 
   WHERE id = 'ticket_id_here';
   ```

4. **Check Browser Console**
   - Open DevTools (F12)
   - Look for image loading errors
   - Check CSP (Content Security Policy) issues

---

### 💳 Payment Successful But Order Pending

#### Symptoms
- Stripe shows payment succeeded
- Order status still "pending"
- No tickets generated

#### Solutions

1. **Check Webhook Delivery**
   - Go to Stripe Dashboard → Webhooks
   - Find the webhook event
   - Check delivery status
   - Look for error messages

2. **Manually Trigger Webhook**
   ```bash
   stripe trigger checkout.session.completed
   ```

3. **Check Webhook URL**
   - Verify URL in Stripe dashboard
   - Should end with `/stripe-webhook`
   - Should use HTTPS

4. **Manually Complete Order**
   ```sql
   -- Update order status
   UPDATE orders 
   SET status = 'completed',
       stripe_payment_intent_id = 'pi_xxxxx'
   WHERE id = 'order_id_here';
   
   -- Create tickets manually
   INSERT INTO tickets (order_id, order_item_id, ticket_type_id, event_id, user_id, status)
   SELECT 
     oi.order_id,
     oi.id,
     oi.ticket_type_id,
     o.event_id,
     o.user_id,
     'valid'
   FROM order_items oi
   JOIN orders o ON o.id = oi.order_id
   WHERE oi.order_id = 'order_id_here';
   ```

---

### 🔐 Webhook Signature Verification Failed

#### Symptoms
- Webhook returns 400 error
- "Signature verification failed" in logs
- Stripe shows webhook failed

#### Solutions

1. **Check Webhook Secret**
   ```bash
   supabase secrets list | grep STRIPE_WEBHOOK
   ```

2. **Get Correct Secret**
   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook
   - Click "Reveal" next to signing secret
   - Copy the secret (starts with `whsec_`)

3. **Update Secret**
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
   ```

4. **Redeploy Function**
   ```bash
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```

---

### 🐌 Slow PDF Generation

#### Symptoms
- Email takes long time to arrive
- Webhook timeout errors
- Users complain about delays

#### Solutions

1. **Check PDFShift Response Time**
   - Look at webhook logs for timing
   - PDFShift should respond in 2-3 seconds

2. **Optimize PDF Template**
   - Reduce image sizes
   - Simplify HTML structure
   - Remove unnecessary CSS

3. **Consider Async Processing**
   - Move PDF generation to queue
   - Send email immediately
   - Attach PDF later

4. **Monitor PDFShift Status**
   - Check PDFShift status page
   - Verify API is operational

---

### 📱 Mobile Display Issues

#### Symptoms
- Tickets don't display well on mobile
- QR codes too small
- Layout broken on phone

#### Solutions

1. **Check Viewport Meta Tag**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

2. **Test Responsive Design**
   - Use browser DevTools
   - Test on actual devices
   - Check different screen sizes

3. **Verify Tailwind Classes**
   - Use responsive prefixes (sm:, md:, lg:)
   - Test flex/grid layouts
   - Check text sizes

4. **QR Code Size**
   - Ensure minimum 150×150px on mobile
   - Use responsive sizing
   - Test scanning from phone

---

### 🔄 Database Connection Issues

#### Symptoms
- "Failed to load tickets" error
- Dashboard won't load
- Timeout errors

#### Solutions

1. **Check Supabase Status**
   - Visit status.supabase.com
   - Check for outages

2. **Verify Connection**
   ```javascript
   const { data, error } = await supabase
     .from('tickets')
     .select('count')
     .limit(1);
   console.log({ data, error });
   ```

3. **Check RLS Policies**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'tickets';
   ```

4. **Test Auth**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Session:', session);
   ```

---

### 🎨 Styling Issues

#### Symptoms
- Dark mode not working
- Colors look wrong
- Layout broken

#### Solutions

1. **Check Tailwind Build**
   ```bash
   npm run build:css
   ```

2. **Verify Theme Toggle**
   ```javascript
   console.log(localStorage.getItem('theme'));
   console.log(document.documentElement.classList.contains('dark'));
   ```

3. **Clear Browser Cache**
   - Hard refresh
   - Clear cache and reload
   - Try incognito mode

4. **Check CSS Loading**
   - Open DevTools Network tab
   - Verify CSS file loads
   - Check for 404 errors

---

## 🔍 Debugging Tools

### Webhook Logs
```bash
# Recent logs
supabase functions logs stripe-webhook

# Errors only
supabase functions logs stripe-webhook --level error

# Real-time
supabase functions logs stripe-webhook --follow

# Specific time range
supabase functions logs stripe-webhook --since 1h
```

### Database Queries
```sql
-- Check recent orders
SELECT * FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Check tickets for order
SELECT t.*, tt.name as ticket_type
FROM tickets t
JOIN ticket_types tt ON tt.id = t.ticket_type_id
WHERE t.order_id = 'order_id_here';

-- Check order with all details
SELECT 
  o.*,
  e.name as event_name,
  json_agg(t.*) as tickets
FROM orders o
JOIN events e ON e.id = o.event_id
LEFT JOIN tickets t ON t.order_id = o.id
WHERE o.id = 'order_id_here'
GROUP BY o.id, e.name;
```

### Stripe CLI
```bash
# Listen to webhooks locally
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test event
stripe trigger checkout.session.completed

# View recent events
stripe events list --limit 10
```

### Browser Console
```javascript
// Check Supabase connection
console.log('Supabase:', window.supabase);

// Check auth
supabase.auth.getSession().then(console.log);

// Test query
supabase.from('tickets').select('count').then(console.log);
```

---

## 📞 Getting Help

### Before Asking for Help

1. **Check logs** - Most issues show up in logs
2. **Search documentation** - Check all docs files
3. **Test in isolation** - Isolate the problem
4. **Gather information** - Collect error messages, logs, screenshots

### Information to Provide

- Error messages (full text)
- Webhook logs
- Order ID
- User ID
- Steps to reproduce
- Expected vs actual behavior
- Browser/device information

### Support Channels

- GitHub Issues
- Supabase Discord
- Stripe Support
- Email: support@ticketsale.ca

---

## 🛠️ Maintenance Tasks

### Regular Checks

- [ ] Monitor webhook success rate
- [ ] Check email delivery rate
- [ ] Verify PDF generation
- [ ] Review error logs
- [ ] Check API usage/credits
- [ ] Test complete flow weekly

### Monthly Tasks

- [ ] Review and optimize database
- [ ] Update dependencies
- [ ] Check security updates
- [ ] Review error patterns
- [ ] Optimize performance
- [ ] Update documentation

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Active
