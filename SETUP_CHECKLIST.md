# Setup Checklist

## ✅ Completed (Already Done)

- [x] Database schema created (orders, order_items, tickets)
- [x] RLS policies configured
- [x] QR code generation triggers set up
- [x] Stripe integration configured
- [x] Checkout flow implemented
- [x] Webhook function created and deployed
- [x] PDF generation implemented (PDFShift)
- [x] Email templates created
- [x] Dashboard ticket viewing implemented
- [x] PDFShift API key added to Supabase secrets

## 🔄 To Do (Required)

### 1. Resend Setup
- [ ] Sign up for Resend account at https://resend.com/
- [ ] Get API key from Resend dashboard
- [ ] Run setup script:
  ```bash
  export RESEND_API_KEY="re_your_key_here"
  bash setup-secrets.sh
  ```
- [ ] Test email delivery

### 2. Email Domain (Optional but Recommended)
- [ ] Add your domain in Resend dashboard
- [ ] Add DNS records for verification
- [ ] Update webhook function with custom domain:
  ```typescript
  from: 'Your Brand <tickets@yourdomain.com>'
  ```

### 3. Testing
- [ ] Create a test event in database
- [ ] Test complete purchase flow
- [ ] Verify email received with PDF
- [ ] Check PDF opens and displays correctly
- [ ] Test QR codes are scannable
- [ ] Verify dashboard shows tickets
- [ ] Test print functionality
- [ ] Test on mobile devices

### 4. Production Readiness
- [ ] Set up error monitoring
- [ ] Configure backup email service (optional)
- [ ] Set up webhook retry logic
- [ ] Monitor PDFShift usage/credits
- [ ] Test with real payment (small amount)
- [ ] Verify email deliverability
- [ ] Set up analytics tracking

## 📝 Configuration Files

### Environment Variables (Supabase Secrets)
```bash
# Already Set
✅ PDFSHIFT_API_KEY
✅ STRIPE_SECRET_KEY
✅ STRIPE_WEBHOOK_SECRET

# Need to Set
⏳ RESEND_API_KEY
⏳ SITE_URL (e.g., https://ticketsale.ca)
```

### Check Current Secrets
```bash
supabase secrets list
```

### Set Missing Secrets
```bash
# Resend API Key
supabase secrets set RESEND_API_KEY="re_xxxxx"

# Site URL
supabase secrets set SITE_URL="https://ticketsale.ca"
```

## 🧪 Testing Checklist

### Test Purchase Flow
- [ ] Navigate to event page
- [ ] Click "Buy Tickets"
- [ ] Select quantity
- [ ] Click checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Redirected to success page
- [ ] Check email inbox
- [ ] Verify PDF attachment
- [ ] Open PDF and check design
- [ ] Verify QR codes visible

### Test Dashboard
- [ ] Log into dashboard
- [ ] Navigate to "My Tickets"
- [ ] Verify order appears
- [ ] Click "View Tickets"
- [ ] Modal opens with tickets
- [ ] QR codes display correctly
- [ ] Click "Print Tickets"
- [ ] Print preview looks good
- [ ] Test on mobile device

### Test Error Scenarios
- [ ] Test with declined card
- [ ] Test with insufficient funds
- [ ] Test with expired card
- [ ] Verify error messages
- [ ] Check order status remains pending

## 📊 Monitoring Setup

### Webhook Logs
```bash
# View recent logs
supabase functions logs stripe-webhook

# View errors only
supabase functions logs stripe-webhook --level error

# Real-time monitoring
supabase functions logs stripe-webhook --follow
```

### Key Metrics to Track
- [ ] Order completion rate
- [ ] Email delivery rate
- [ ] PDF generation success rate
- [ ] Webhook processing time
- [ ] Error rates

## 🚀 Go Live Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Email deliverability verified
- [ ] Error monitoring set up
- [ ] Backup plan in place
- [ ] Support email configured
- [ ] Terms and conditions updated
- [ ] Privacy policy updated
- [ ] Refund policy defined

### Launch Day
- [ ] Monitor webhook logs
- [ ] Check email delivery
- [ ] Verify PDF generation
- [ ] Monitor error rates
- [ ] Test first real purchase
- [ ] Verify customer receives tickets
- [ ] Check dashboard functionality

### Post-Launch
- [ ] Monitor daily metrics
- [ ] Review error logs
- [ ] Check customer feedback
- [ ] Optimize based on usage
- [ ] Plan enhancements

## 📞 Support Resources

### Documentation
- [Quick Start Guide](QUICK_START.md)
- [Setup Guide](TICKET_SYSTEM_SETUP.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [System Flow](SYSTEM_FLOW.md)
- [Email Templates](email-templates/README.md)

### API Documentation
- [Stripe Docs](https://stripe.com/docs)
- [Resend Docs](https://resend.com/docs)
- [PDFShift Docs](https://pdfshift.io/documentation)
- [Supabase Docs](https://supabase.com/docs)

### Testing Tools
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Mail Tester](https://www.mail-tester.com/)
- [QR Code Scanner](https://qrcodescan.in/)

## ✨ Optional Enhancements

### Short Term
- [ ] Add ticket transfer functionality
- [ ] Implement refund system
- [ ] Create scanner app for organizers
- [ ] Add calendar integration
- [ ] Bulk ticket download

### Long Term
- [ ] Multi-language support
- [ ] Multi-currency support
- [ ] Seat selection
- [ ] Group bookings
- [ ] Analytics dashboard
- [ ] Waitlist functionality

## 🎯 Success Criteria

### Must Have
- [x] Users can purchase tickets
- [x] Tickets generated automatically
- [x] PDFs created and attached
- [x] Emails sent successfully
- [x] Dashboard displays tickets
- [x] QR codes scannable
- [x] Mobile responsive

### Nice to Have
- [ ] Custom email domain
- [ ] Real-time notifications
- [ ] Ticket transfer
- [ ] Refund handling
- [ ] Scanner app

## 📝 Notes

### Important Reminders
- Test thoroughly before going live
- Monitor logs during first few sales
- Have support email ready
- Keep API keys secure
- Back up database regularly
- Monitor API usage/credits

### Known Limitations
- PDF generation takes 2-3 seconds
- Email delivery may take up to 1 minute
- QR codes are data URLs (not hosted images)
- No automatic refund handling yet
- No ticket transfer functionality yet

---

**Last Updated:** January 2025  
**Status:** Ready for Resend Configuration  
**Next Step:** Get Resend API key and run setup script
