# Ticket System Flow Diagram

## Complete Purchase & Delivery Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                                 │
└─────────────────────────────────────────────────────────────────────┘

1. BROWSE EVENTS
   │
   ├─> User visits ticketsale.ca
   ├─> Views event listings
   └─> Clicks on event to see details

2. SELECT TICKETS
   │
   ├─> Views event page with ticket types
   ├─> Selects quantity and ticket type
   └─> Clicks "Buy Tickets"

3. CHECKOUT
   │
   ├─> Frontend calls create-checkout-session
   ├─> Order created in database (status: pending)
   ├─> Redirected to Stripe Checkout
   └─> Enters payment details

4. PAYMENT
   │
   ├─> Stripe processes payment
   ├─> Payment successful
   └─> Redirected to success page

5. TICKET GENERATION (Automatic)
   │
   ├─> Stripe sends webhook to stripe-webhook function
   ├─> Webhook verifies payment
   ├─> Updates order status to "completed"
   ├─> Creates ticket records with QR codes
   ├─> Generates PDF with PDFShift
   ├─> Sends email with Resend
   └─> User receives email with PDF

6. VIEW TICKETS
   │
   ├─> User logs into dashboard
   ├─> Views "My Tickets" section
   ├─> Clicks "View Tickets" on order
   ├─> Modal shows all tickets with QR codes
   └─> Can print or save tickets

┌─────────────────────────────────────────────────────────────────────┐
│                      TECHNICAL FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────>│ Checkout │────>│  Stripe  │────>│ Webhook  │
│  (Web)   │     │ Function │     │ Checkout │     │ Function │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                  │                │
     │                │                  │                │
     v                v                  v                v
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Database │     │ Database │     │ Database │     │ Database │
│ (Order)  │     │ (Order)  │     │ (Payment)│     │ (Tickets)│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                         │
                                                         │
                                                         v
                                                    ┌──────────┐
                                                    │ PDFShift │
                                                    │   API    │
                                                    └──────────┘
                                                         │
                                                         │
                                                         v
                                                    ┌──────────┐
                                                    │  Resend  │
                                                    │   API    │
                                                    └──────────┘
                                                         │
                                                         │
                                                         v
                                                    ┌──────────┐
                                                    │   User   │
                                                    │  Email   │
                                                    └──────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘

events
  │
  ├─> ticket_types (General, VIP, etc.)
  │
  └─> orders
       │
       ├─> order_items (links to ticket_types)
       │
       └─> tickets (individual tickets with QR codes)

┌─────────────────────────────────────────────────────────────────────┐
│                      WEBHOOK PROCESSING                              │
└─────────────────────────────────────────────────────────────────────┘

Stripe Webhook Event: checkout.session.completed
│
├─> 1. Verify webhook signature
│
├─> 2. Get order from database
│
├─> 3. Update order status to "completed"
│
├─> 4. Create tickets
│    ├─> Generate unique ticket numbers
│    ├─> Generate QR codes (data URLs)
│    └─> Set status to "valid"
│
├─> 5. Generate PDF
│    ├─> Build HTML for each ticket
│    ├─> Combine into single HTML document
│    ├─> Call PDFShift API
│    └─> Receive PDF binary
│
├─> 6. Send Email
│    ├─> Build email HTML from template
│    ├─> Replace placeholders with order data
│    ├─> Attach PDF
│    ├─> Call Resend API
│    └─> Email delivered to user
│
└─> 7. Log success and return 200 OK

┌─────────────────────────────────────────────────────────────────────┐
│                      DASHBOARD FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘

User Dashboard
│
├─> Load Orders
│    ├─> Query orders table (status: completed)
│    ├─> Join with events, order_items, tickets
│    └─> Display order cards
│
├─> View Tickets (Click)
│    ├─> Query specific order with all tickets
│    ├─> Create modal overlay
│    ├─> Display each ticket with:
│    │    ├─> Event details
│    │    ├─> Ticket number
│    │    ├─> QR code image
│    │    └─> Status badge
│    └─> Show print button
│
└─> Print Tickets
     ├─> Trigger browser print dialog
     └─> Print-optimized layout

┌─────────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                                  │
└─────────────────────────────────────────────────────────────────────┘

Payment Failed
├─> User sees error on Stripe Checkout
├─> Order remains in "pending" status
└─> User can retry payment

Webhook Failed
├─> Stripe retries webhook automatically
├─> Logs error in function logs
└─> Manual intervention may be needed

PDF Generation Failed
├─> Error logged but webhook continues
├─> Email sent without PDF
└─> User can contact support

Email Failed
├─> Error logged but webhook continues
├─> Tickets still created in database
└─> User can view tickets in dashboard

┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY MEASURES                               │
└─────────────────────────────────────────────────────────────────────┘

1. Webhook Signature Verification
   └─> Ensures webhook is from Stripe

2. Row Level Security (RLS)
   └─> Users can only see their own tickets

3. Unique Ticket Numbers
   └─> Prevents ticket duplication

4. QR Code Validation
   └─> Each QR code is unique and verifiable

5. Status Tracking
   └─> Prevents ticket reuse (valid → used)

┌─────────────────────────────────────────────────────────────────────┐
│                      MONITORING POINTS                               │
└─────────────────────────────────────────────────────────────────────┘

1. Checkout Success Rate
   └─> Track successful vs failed checkouts

2. Webhook Processing Time
   └─> Monitor webhook execution duration

3. PDF Generation Success
   └─> Track PDFShift API success rate

4. Email Delivery Rate
   └─> Monitor Resend API success rate

5. Ticket View Rate
   └─> Track dashboard ticket views

6. Error Rates
   └─> Monitor all error logs

┌─────────────────────────────────────────────────────────────────────┐
│                      SCALABILITY NOTES                               │
└─────────────────────────────────────────────────────────────────────┘

Current Setup:
- Handles ~100 concurrent checkouts
- PDF generation: ~2-3 seconds per order
- Email delivery: ~1 second per email
- Database: Supabase (scales automatically)

For High Volume:
- Add queue system for PDF generation
- Batch email sending
- CDN for ticket PDFs
- Caching for event data
- Load balancing for Edge Functions

┌─────────────────────────────────────────────────────────────────────┐
│                      FUTURE ENHANCEMENTS                             │
└─────────────────────────────────────────────────────────────────────┘

1. Ticket Transfer
   └─> Allow users to transfer tickets to others

2. Refund System
   └─> Handle refunds and ticket cancellation

3. Scanner App
   └─> Mobile app for organizers to scan QR codes

4. Waitlist
   └─> Notify users when tickets become available

5. Seat Selection
   └─> Interactive seat map for venues

6. Group Bookings
   └─> Special pricing for group purchases

7. Analytics Dashboard
   └─> Sales reports for organizers

8. Multi-Currency
   └─> Support for different currencies
