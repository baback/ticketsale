# Simple Resend Email Setup

## What it does
1. User signs up → Confirmation email via Resend
2. User clicks confirm → Welcome email via Resend

## Setup (3 steps)

### 1. Get Resend API key
- Sign up at resend.com
- Get your API key (starts with `re_`)

### 2. Deploy
```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase functions deploy auth-hook
```

### 3. Configure Supabase Dashboard
- Go to **Authentication → Hooks**
- Enable **Send Email** hook  
- URL: `https://YOUR_PROJECT.supabase.co/functions/v1/auth-hook`
- Header: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

- Go to **Authentication → Email Templates**
- Disable all built-in templates

## Test
Sign up a user and check your email!

That's it.