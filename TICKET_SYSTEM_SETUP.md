# Ticket System Setup Guide

## Overview
The ticket system is now fully implemented with:
- ✅ Stripe payment processing
- ✅ Automatic ticket generation with QR codes
- ✅ PDF generation using PDFShift
- ✅ Email delivery using Resend
- ✅ Dashboard ticket viewing and management

## Required API Keys

### 1. PDFShift API Key
- Sign up at: https://pdfshift.io/
- Get your API key from the dashboard
- Already added to Supabase secrets as `PDFSHIFT_API_KEY`

### 2. Resend API Key
- Sign up at: https://resend.com/
- Get your API key from the dashboard
- Verify your sending domain (or use their test domain)
- Add to Supabase secrets:
  ```bash
  export RESEND_API_KEY="re_xxxxx"
  bash setup-secrets.sh
  ```

### 3. Stripe Keys (Already Configured)
- `STRIPE_SECRET_KEY` - For server-side operations
- `STRIPE_PUBLISHABLE_KEY` - For client-side checkout
- `STRIPE_WEBHOOK_SECRET` - For webhook verification

## Setup Steps

### 1. Configure Resend
```bash
# Set your Resend API key
export RESEND_API_KEY="re_your_key_here"

# Run the setup script
bash setup-secrets.sh
```

### 2. Configure Email Domain (Optional but Recommended)
In Resend dashboard:
1. Add your domain (e.g., ticketsale.ca)
2. Add DNS records for verification
3. Update the webhook function if using a custom domain:
   - Change `from: 'ticketsale.ca <tickets@ticketsale.ca>'`
   - To your verified domain

### 3. Test the Flow
1. Create a test event in your database
2. Go to the event page and click "Buy Tickets"
3. Complete checkout with Stripe test card: `4242 4242 4242 4242`
4. Check your email for the ticket PDF
5. View tickets in the dashboard

## How It Works

### Payment Flow
1. User clicks "Buy Tickets" → Creates order in database
2. Redirects to Stripe Checkout
3. After payment → Stripe sends webhook to `/stripe-webhook`
4. Webhook processes payment and generates tickets

### Ticket Generation
1. Webhook receives `checkout.session.completed` event
2. Updates order status to "completed"
3. Creates ticket records with unique QR codes
4. Generates PDF using PDFShift API
5. Sends email with PDF attachment using Resend

### Email Template
The email includes:
- Order confirmation with details
- Event information (name, date, location)
- Ticket count and type
- PDF attachment with all tickets
- Link to dashboard for re-downloading

### PDF Ticket Design
Each ticket includes:
- Event name and details
- Unique QR code for entry
- Ticket number
- Ticket type
- Important entry information
- Professional dark-themed design

## Dashboard Features

### Ticket Viewing
- Lists all completed orders with tickets
- Shows event details and ticket count
- "View Tickets" button opens modal with:
  - Individual ticket details
  - QR codes for each ticket
  - Print functionality
  - Ticket status (valid/used/cancelled)

### Ticket Status
- `valid` - Ready to use (green badge)
- `used` - Already scanned at entry (gray badge)
- `cancelled` - Refunded or cancelled (red badge)

## Troubleshooting

### Emails Not Sending
1. Check Resend API key is set: `supabase secrets list`
2. Verify domain in Resend dashboard
3. Check webhook logs: `supabase functions logs stripe-webhook`
4. Test Resend API directly in their dashboard

### PDF Not Generating
1. Check PDFShift API key is set
2. Verify PDFShift account has credits
3. Check webhook logs for PDF generation errors
4. Test PDFShift API with a simple HTML

### QR Codes Not Showing
1. Verify database trigger is creating QR codes
2. Check `tickets` table has `qr_code` column populated
3. Ensure QR code generation function is working

### Webhook Not Firing
1. Verify webhook URL in Stripe dashboard
2. Check webhook secret matches: `STRIPE_WEBHOOK_SECRET`
3. Test webhook with Stripe CLI:
   ```bash
   stripe listen --forward-to your-function-url
   stripe trigger checkout.session.completed
   ```

## File Structure

```
email-templates/
├── ticket-confirmation.html    # Email template
└── ticket-pdf-template.html    # PDF template (embedded in webhook)

supabase/functions/
├── stripe-webhook/
│   └── index.ts                # Handles payments, generates PDFs, sends emails
└── create-checkout-session/
    └── index.ts                # Creates Stripe checkout

src/scripts/
├── dashboard.js                # Main dashboard logic
├── dashboard-tickets.js        # Enhanced ticket viewing
└── checkout.js                 # Checkout flow

setup-secrets.sh                # Helper script for setting secrets
```

## Next Steps

### Recommended Enhancements
1. **Ticket Transfer** - Allow users to transfer tickets to others
2. **Refund System** - Handle refunds and ticket cancellation
3. **Ticket Scanner App** - Mobile app for organizers to scan QR codes
4. **Email Customization** - Per-event email templates
5. **Bulk Download** - Download all tickets for an event
6. **Calendar Integration** - Add to calendar button in emails

### Production Checklist
- [ ] Configure custom email domain in Resend
- [ ] Set up proper error monitoring
- [ ] Add rate limiting to webhook
- [ ] Test with real payment amounts
- [ ] Configure backup email service
- [ ] Set up PDF generation fallback
- [ ] Add webhook retry logic
- [ ] Monitor PDFShift usage/credits

## Support

For issues or questions:
- Check Supabase function logs
- Review Stripe webhook events
- Test APIs individually
- Contact support@ticketsale.ca
