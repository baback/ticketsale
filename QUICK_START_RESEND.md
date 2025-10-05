# Quick Start: Resend Email Integration

## What You Get

✅ Custom branded confirmation emails  
✅ Welcome emails after signup  
✅ All emails sent via Resend (not Supabase)  
✅ Your existing HTML templates  

## 3-Step Setup

### Step 1: Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain `ticketsale.ca` (or use their test domain for now)
3. Create an API key
4. Copy the key (starts with `re_`)

### Step 2: Configure & Deploy

```bash
# Set your Resend API key
supabase secrets set RESEND_API_KEY=re_your_key_here

# Set your site URL
supabase secrets set SITE_URL=https://ticketsale.ca

# Deploy the Edge Function
supabase functions deploy auth-hook
```

### Step 3: Configure Supabase Dashboard

1. Go to **Authentication → Email Templates**
2. **Disable** or **clear** all built-in templates:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

3. Go to **Authentication → Hooks**
4. Enable **Send Email** hook
5. Set URL to: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/auth-hook`
6. Add header: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

## Test It

```bash
# Sign up a test user
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/signup' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"password123"}'
```

Check your email! You should receive:
1. Confirmation email (with your custom template)
2. After confirming → Welcome email

## What Happens

1. User signs up → Supabase triggers `user.created` event
2. Edge Function receives event → Sends confirmation email via Resend
3. User clicks confirm link → Supabase triggers `user.confirmed` event  
4. Edge Function receives event → Sends welcome email via Resend

## Monitoring

- **Resend Dashboard**: See all sent emails, delivery status
- **Supabase Logs**: Edge Function → Logs tab
- **Test emails**: Use your own email first!

## Cost

- **Resend**: 3,000 emails/month FREE, then $0.001/email
- **Supabase**: 500K function calls/month FREE
- **Total**: Essentially free for most apps

## Customization

Edit templates in `supabase/functions/auth-hook/index.ts`:
- `getConfirmEmailTemplate()` - Confirmation email
- `getWelcomeEmailTemplate()` - Welcome email

Then redeploy:
```bash
supabase functions deploy auth-hook
```

## Troubleshooting

**Emails not sending?**
- Check Resend API key is set: `supabase secrets list`
- Check Edge Function logs in Supabase Dashboard
- Verify domain in Resend (or use test domain)

**Confirmation link not working?**
- Verify SITE_URL is correct
- Check you have `/auth/confirm` route handling

**Welcome email not sending?**
- Check Auth Hooks are enabled in Dashboard
- Verify the hook URL is correct
- Check Edge Function logs

## Next Steps

Add more email types:
- Password reset
- Email change
- Magic link
- Custom transactional emails

All using the same pattern! 🎉
