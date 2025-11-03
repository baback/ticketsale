# Quick Start Guide - Ticket System

## 🚀 Get Started in 5 Minutes

### Step 1: Get Resend API Key (2 minutes)
1. Go to https://resend.com/
2. Sign up for free account
3. Go to API Keys section
4. Create new API key
5. Copy the key (starts with `re_`)

### Step 2: Configure Secrets (1 minute)
```bash
# Set your Resend API key
export RESEND_API_KEY="re_your_key_here"

# Run setup script
bash setup-secrets.sh
```

### Step 3: Test the System (2 minutes)
1. Go to your event page
2. Click "Buy Tickets"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Check your email! 📧

## ✅ That's It!

Your ticket system is now live and ready to:
- ✨ Accept payments
- 🎫 Generate tickets automatically
- 📄 Create beautiful PDFs
- 📧 Send confirmation emails
- 👀 Display tickets in dashboard

## 📚 Need More Help?

- **Full Setup Guide:** See `TICKET_SYSTEM_SETUP.md`
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`
- **Email Templates:** See `email-templates/README.md`

## 🎨 Customization

### Change Email Sender
Edit `supabase/functions/stripe-webhook/index.ts`:
```typescript
from: 'Your Brand <tickets@yourdomain.com>'
```

### Customize Email Template
Edit the `getEmailTemplate()` function in the webhook.

### Modify PDF Design
Edit the PDF template HTML in the webhook's `pdfTemplate` variable.

## 🐛 Troubleshooting

### Email Not Received?
```bash
# Check webhook logs
supabase functions logs stripe-webhook

# Look for "Email sent successfully"
```

### PDF Not Generated?
- Verify PDFSHIFT_API_KEY is set
- Check PDFShift account has credits
- Review webhook logs for errors

### Tickets Not Showing in Dashboard?
- Verify order status is "completed"
- Check tickets were created in database
- Refresh the dashboard page

## 💡 Pro Tips

1. **Test Mode:** Use Stripe test cards for testing
2. **Email Domain:** Verify your domain in Resend for better deliverability
3. **Monitor Logs:** Keep an eye on webhook logs during testing
4. **Mobile Testing:** Test email and dashboard on mobile devices

## 🎯 Next Steps

Once everything works:
1. ✅ Test with real payment (small amount)
2. ✅ Verify email deliverability
3. ✅ Test QR code scanning
4. ✅ Go live and start selling! 🎉

---

**Questions?** Check the full documentation or contact support.
