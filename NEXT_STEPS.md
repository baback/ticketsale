# Next Steps - PDF Storage

## ✅ Completed
1. Order details page fixed and working
2. Storage bucket created (`ticket-pdfs`)
3. Database column added (`ticket_pdf_url`)

## 🔄 Remaining Tasks

### 1. Update Webhook Function

In `supabase/functions/stripe-webhook/index.ts`, after PDF generation:

```typescript
// After generating PDF (around line 300)
const pdfBuffer = await pdfResponse.arrayBuffer()

// Upload to Supabase Storage
const fileName = `${order.id}.pdf`
const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
  .from('ticket-pdfs')
  .upload(fileName, pdfBuffer, {
    contentType: 'application/pdf',
    cacheControl: '3600',
    upsert: true
  })

if (uploadError) {
  console.error('PDF upload error:', uploadError)
} else {
  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('ticket-pdfs')
    .getPublicUrl(fileName)
  
  // Save URL to database
  await supabaseAdmin
    .from('orders')
    .update({ ticket_pdf_url: publicUrl })
    .eq('id', order.id)
  
  console.log('PDF uploaded:', publicUrl)
}
```

### 2. Update Email Template

Change from PDF attachment to links:

```typescript
// In getEmailTemplate function, add PDF link parameter
function getEmailTemplate(
  orderNumber: string,
  eventName: string,
  eventDate: string,
  eventLocation: string,
  ticketCount: string,
  ticketType: string,
  totalAmount: string,
  dashboardUrl: string,
  pdfUrl: string,  // ADD THIS
  orderId: string   // ADD THIS
): string {
```

In email HTML, replace attachment section with:

```html
<div class="p-6 space-y-4">
  <a href="${dashboardUrl}/mytickets/order/?id=${orderId}" 
     style="display: block; padding: 16px; background-color: #000; color: #fff; text-decoration: none; border-radius: 12px; text-align: center; font-weight: 600;">
    View Your Tickets
  </a>
  
  ${pdfUrl ? `
  <a href="${pdfUrl}" 
     style="display: block; padding: 16px; border: 1px solid #262626; color: #fff; text-decoration: none; border-radius: 12px; text-align: center; font-weight: 600;">
    Download PDF
  </a>
  ` : ''}
</div>
```

### 3. Update Resend Call

Remove attachment, pass new parameters:

```typescript
const emailTemplate = getEmailTemplate(
  orderNumber,
  event.title,  // Changed from event.name
  eventDate,
  event.location,  // Changed from event.venue
  tickets.length.toString(),
  ticketType,
  totalAmount,
  dashboardUrl,
  publicUrl,  // ADD THIS
  order.id    // ADD THIS
)

// Remove attachments array from Resend call
const emailResponse = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${resendApiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'ticketsale.ca <tickets@ticketsale.ca>',
    to: [user.user.email],
    subject: `Your Tickets for ${event.title}`,
    html: emailTemplate,
    // REMOVE: attachments: [...]
  }),
})
```

### 4. Deploy

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
git add -A
git commit -m "feat: Store PDFs in Supabase Storage and send links in email"
git push origin main
```

## Testing

1. Make a test purchase
2. Check webhook logs for PDF upload success
3. Verify PDF URL is saved in orders table
4. Check email has links (not attachment)
5. Click "View Your Tickets" link
6. Click "Download PDF" button on order page
7. Verify PDF downloads correctly

## Benefits

- ✅ Faster email delivery (no 2MB attachment)
- ✅ Users can re-download anytime
- ✅ Reduced email server load
- ✅ Better user experience
- ✅ Persistent storage
