# PDF Storage Implementation Plan

## ✅ Completed

1. **Database Schema**
   - Added `ticket_pdf_url` column to orders table
   - Migration applied successfully

2. **Order Details Page**
   - Created `/mytickets/order/` page
   - Shows order summary, tickets with QR codes
   - Download PDF button (when URL exists)
   - Print functionality

3. **Dashboard Update**
   - Changed from modal to page navigation
   - Links to `/mytickets/order/?id={orderId}`

## 🔄 Next Steps

### Update Webhook to Store PDF

The webhook needs to:

1. **Generate PDF** (already done)
2. **Upload to Supabase Storage**
   ```typescript
   const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
     .from('ticket-pdfs')
     .upload(`${order.id}.pdf`, pdfBuffer, {
       contentType: 'application/pdf',
       cacheControl: '3600',
       upsert: false
     });
   ```

3. **Get Public URL**
   ```typescript
   const { data: { publicUrl } } = supabaseAdmin.storage
     .from('ticket-pdfs')
     .getPublicUrl(`${order.id}.pdf`);
   ```

4. **Save URL to Database**
   ```typescript
   await supabaseAdmin
     .from('orders')
     .update({ ticket_pdf_url: publicUrl })
     .eq('id', order.id);
   ```

5. **Update Email Template**
   - Instead of PDF attachment
   - Send link to order details page
   - Include direct PDF download link

### Create Storage Bucket

Run in Supabase SQL Editor:
```sql
-- Create storage bucket for ticket PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-pdfs', 'ticket-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policy
CREATE POLICY "Users can view their own ticket PDFs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ticket-pdfs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Benefits

1. **Faster Email Delivery** - No large PDF attachment
2. **Better UX** - Users can re-download anytime
3. **Reduced Email Size** - Just links, not files
4. **Persistent Storage** - PDFs don't expire
5. **Bandwidth Savings** - PDF generated once, accessed many times

## Email Template Update

Instead of:
```html
<p>Your tickets are attached to this email as a PDF.</p>
```

Use:
```html
<p>Your tickets are ready! View and download them here:</p>
<a href="https://ticketsale.ca/mytickets/order/?id={orderId}">View My Tickets</a>

<p>Or download PDF directly:</p>
<a href="{pdfUrl}">Download PDF</a>
```

## Testing Checklist

- [ ] Create storage bucket
- [ ] Update webhook to upload PDF
- [ ] Test PDF generation and upload
- [ ] Verify PDF URL is saved
- [ ] Test email with links
- [ ] Test order details page with PDF
- [ ] Test download button
- [ ] Verify RLS policies work

## File Locations

- Order details page: `/mytickets/order/index.html`
- Order details script: `/src/scripts/order-details.js`
- Webhook function: `/supabase/functions/stripe-webhook/index.ts`
- Migration: `/supabase/migrations/20250103_add_pdf_url_to_orders.sql`
