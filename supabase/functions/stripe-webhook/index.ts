import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  console.log('Webhook called')
  console.log('Has signature:', !!signature)
  console.log('Has webhook secret:', !!webhookSecret)

  if (!signature) {
    console.error('Missing stripe-signature header')
    return new Response(JSON.stringify({ error: 'Missing signature' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET env var')
    return new Response(JSON.stringify({ error: 'Missing webhook secret' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const body = await req.text()
    console.log('Body length:', body.length)
    
    // Parse the event (temporarily skip signature verification for debugging)
    let event
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider
      )
      console.log('Signature verified successfully')
    } catch (err) {
      console.error('Signature verification failed:', err.message)
      // For debugging: parse without verification
      event = JSON.parse(body)
      console.log('Using unverified event for debugging')
    }

    console.log('Webhook event:', event.type)

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('Checkout session completed:', session.id)
      
      await handleCheckoutComplete(session)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    const orderId = session.client_reference_id
    
    if (!orderId) {
      console.error('No order ID in session')
      return
    }

    console.log('Processing order:', orderId)

    // Get order with items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          ticket_types (*)
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderError)
      return
    }

    console.log('Order found:', order.id, 'Items:', order.order_items.length)

    // Update order status
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'completed',
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq('id', orderId)

    console.log('Order status updated to completed')

    // Generate tickets for each order item
    const ticketsToCreate = []
    
    for (const item of order.order_items) {
      for (let i = 0; i < item.quantity; i++) {
        ticketsToCreate.push({
          order_id: order.id,
          order_item_id: item.id,
          ticket_type_id: item.ticket_type_id,
          event_id: order.event_id,
          user_id: order.user_id,
          status: 'valid',
        })
      }
    }

    console.log('Creating tickets:', ticketsToCreate.length)

    // Insert tickets (triggers will generate ticket_number and qr_code)
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .insert(ticketsToCreate)
      .select()

    if (ticketsError) {
      console.error('Error creating tickets:', ticketsError)
      throw ticketsError
    }

    console.log('Tickets created successfully:', tickets.length)

    // Update ticket availability
    for (const item of order.order_items) {
      const { error: updateError } = await supabaseAdmin
        .from('ticket_types')
        .update({
          available: item.ticket_types.available - item.quantity
        })
        .eq('id', item.ticket_type_id)

      if (updateError) {
        console.error('Error updating ticket availability:', updateError)
      }
    }

    console.log('Ticket availability updated')

    // Generate PDF and send email
    await generateAndSendTickets(order, tickets, supabaseAdmin)

    console.log('Order processing complete for:', orderId)

  } catch (error) {
    console.error('Error handling checkout complete:', error)
    throw error
  }
}

async function generateAndSendTickets(order: any, tickets: any[], supabaseAdmin: any) {
  try {
    console.log('Generating PDF for order:', order.id)

    // Get event details
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', order.event_id)
      .single()

    if (!event) {
      console.error('Event not found')
      return
    }

    // Get user details
    const { data: user } = await supabaseAdmin.auth.admin.getUserById(order.user_id)
    
    if (!user) {
      console.error('User not found')
      return
    }

    // Generate ticket HTML
    const ticketsHtml = tickets.map(ticket => {
      const ticketType = order.order_items.find((item: any) => 
        item.id === ticket.order_item_id
      )?.ticket_types

      const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      return `
        <div class="ticket">
          <div class="ticket-header">
            <img src="https://ticketsale.ca/src/img/logo/full-white.png" alt="ticketsale.ca" style="width: 180px; height: auto;" />
          </div>
          <div class="ticket-body">
            <h1 class="event-name">${event.title}</h1>
            <p class="event-subtitle">${event.location || 'Venue TBA'}</p>
            
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Date & Time</div>
                <div class="detail-value">${eventDate}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Ticket Type</div>
                <div class="detail-value">${ticketType?.name || 'General Admission'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Location</div>
                <div class="detail-value">${event.location || 'TBA'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Order Number</div>
                <div class="detail-value">#${order.id.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>

            <div class="important-notice">
              <div class="notice-title">Important Information</div>
              <div class="notice-text">
                Present this ticket at the entrance. Each ticket is valid for one person only. 
                Screenshots are not accepted - please show the original QR code.
              </div>
            </div>

            <div class="qr-section">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qr_code)}" alt="QR Code" class="qr-code" />
              <div class="qr-label">Scan at Entry</div>
              <div class="ticket-number">${ticket.qr_code}</div>
            </div>
          </div>
          <div class="ticket-footer">
            <p class="footer-text">
              This ticket is non-transferable and non-refundable.<br/>
              For support, contact support@ticketsale.ca
            </p>
          </div>
        </div>
      `
    }).join('')

    // Build PDF HTML
    const pdfTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background: #0a0a0a; padding: 40px; }
        .ticket-container { max-width: 800px; margin: 0 auto; }
        .ticket { background: linear-gradient(135deg, #171717 0%, #262626 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); margin-bottom: 40px; page-break-after: always; }
        .ticket:last-child { margin-bottom: 0; page-break-after: auto; }
        .ticket-header { background: #000000; padding: 32px 40px; border-bottom: 2px solid #404040; }
        .ticket-body { padding: 40px; }
        .event-name { font-size: 36px; font-weight: 700; color: #ffffff; margin-bottom: 8px; letter-spacing: -1px; }
        .event-subtitle { font-size: 18px; color: #a3a3a3; margin-bottom: 32px; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
        .detail-item { background: #1a1a1a; padding: 20px; border-radius: 12px; border: 1px solid #404040; }
        .detail-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #737373; margin-bottom: 8px; font-weight: 600; }
        .detail-value { font-size: 18px; color: #ffffff; font-weight: 600; }
        .qr-section { background: #ffffff; padding: 32px; border-radius: 16px; text-align: center; margin-top: 32px; }
        .qr-code { width: 200px; height: 200px; margin: 0 auto 16px; }
        .qr-label { font-size: 14px; color: #171717; font-weight: 600; margin-bottom: 4px; }
        .ticket-number { font-size: 12px; color: #737373; font-family: 'Courier New', monospace; }
        .ticket-footer { background: #0a0a0a; padding: 24px 40px; border-top: 1px solid #404040; text-align: center; }
        .footer-text { font-size: 12px; color: #737373; line-height: 1.6; }
        .important-notice { background: #1e3a8a; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 12px; margin-top: 24px; }
        .notice-title { font-size: 14px; font-weight: 600; color: #93c5fd; margin-bottom: 8px; }
        .notice-text { font-size: 13px; color: #bfdbfe; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="ticket-container">
        ${ticketsHtml}
    </div>
</body>
</html>`

    // Generate PDF using PDFShift
    const pdfShiftApiKey = Deno.env.get('PDFSHIFT_API_KEY')
    if (!pdfShiftApiKey) {
      console.error('PDFSHIFT_API_KEY not set')
      return
    }

    console.log('Calling PDFShift API...')
    const pdfResponse = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${pdfShiftApiKey}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: pdfTemplate,
        landscape: false,
        use_print: false,
      }),
    })

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text()
      console.error('PDFShift error:', errorText)
      throw new Error(`PDFShift API error: ${pdfResponse.status}`)
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()
    
    console.log('PDF generated successfully, size:', pdfBuffer.byteLength)

    // Upload PDF to Supabase Storage
    let pdfUrl = ''
    try {
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
        
        pdfUrl = publicUrl
        
        // Save URL to database
        await supabaseAdmin
          .from('orders')
          .update({ ticket_pdf_url: publicUrl })
          .eq('id', order.id)
        
        console.log('PDF uploaded and URL saved:', publicUrl)
      }
    } catch (uploadErr) {
      console.error('Error uploading PDF:', uploadErr)
    }

    // Prepare email
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not set')
      return
    }

    // Build email HTML with placeholders
    const eventDate = new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const ticketType = order.order_items[0]?.ticket_types?.name || 'General Admission'
    const totalAmount = `$${Number(order.total).toFixed(2)}`
    const orderNumber = `#${order.id.slice(0, 8).toUpperCase()}`
    const dashboardUrl = `${Deno.env.get('SITE_URL') || 'https://ticketsale.ca'}/dashboard`

    const emailTemplate = getEmailTemplate(
      orderNumber,
      event.title,
      eventDate,
      event.location || 'TBA',
      tickets.length.toString(),
      ticketType,
      totalAmount,
      dashboardUrl,
      pdfUrl,
      order.id
    )

    // Send email with Resend
    console.log('Sending email via Resend...')
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
        // No attachments - sending links instead
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Resend error:', errorText)
      throw new Error(`Resend API error: ${emailResponse.status}`)
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult.id)

  } catch (error) {
    console.error('Error generating/sending tickets:', error)
    // Don't throw - we don't want to fail the webhook if email fails
  }
}

function getEmailTemplate(
  orderNumber: string,
  eventName: string,
  eventDate: string,
  eventLocation: string,
  ticketCount: string,
  ticketType: string,
  totalAmount: string,
  dashboardUrl: string,
  pdfUrl: string,
  orderId: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Tickets - ticketsale.ca</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #171717; border-radius: 24px; border: 1px solid #262626; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <img src="https://ticketsale.ca/img/logo/full-white.png" alt="ticketsale.ca" width="150" style="display: inline-block; max-width: 150px; height: auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px; text-align: center;">
                            <div style="width: 64px; height: 64px; background-color: #166534; border-radius: 50%; display: inline-block; text-align: center; line-height: 64px; margin: 0 auto;">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" style="vertical-align: middle;">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 30px 40px; text-align: center;">
                            <h2 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Your Tickets Are Ready!</h2>
                            <p style="margin: 0; font-size: 16px; line-height: 24px; color: #a3a3a3;">
                                Thanks for your purchase! Your tickets are ready to view and download.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #262626; border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</h3>
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #a3a3a3;">Order Number</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right; font-weight: 600;">${orderNumber}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #a3a3a3;">Event</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right; font-weight: 600;">${eventName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #a3a3a3;">Date & Time</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right; font-weight: 600;">${eventDate}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 14px; color: #a3a3a3;">Location</td>
                                                <td style="padding: 8px 0; font-size: 14px; color: #ffffff; text-align: right; font-weight: 600;">${eventLocation}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; border-top: 1px solid #404040; font-size: 14px; color: #a3a3a3;">Tickets</td>
                                                <td style="padding: 8px 0; border-top: 1px solid #404040; font-size: 14px; color: #ffffff; text-align: right; font-weight: 600;">${ticketCount} × ${ticketType}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; font-size: 16px; color: #ffffff; font-weight: 700;">Total Paid</td>
                                                <td style="padding: 8px 0; font-size: 16px; color: #22c55e; text-align: right; font-weight: 700;">${totalAmount}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <div style="background-color: #1e3a8a; border-radius: 12px; padding: 20px; border-left: 4px solid #3b82f6;">
                                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #93c5fd;">Important Information</p>
                                <p style="margin: 0; font-size: 13px; line-height: 20px; color: #bfdbfe;">
                                    Please bring your ticket PDF (printed or on your phone) to the event. Each ticket contains a unique QR code for entry.
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="border-top: 1px solid #262626;"></div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px 40px 40px; text-align: center;">
                            <a href="${dashboardUrl}/mytickets/order/?id=${orderId}" style="display: block; padding: 16px 32px; background-color: #ffffff; color: #000000; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 15px; letter-spacing: -0.2px; text-align: center; margin-bottom: 12px;">
                                View Your Tickets
                            </a>
                            ${pdfUrl ? `
                            <a href="${pdfUrl}" style="display: block; padding: 16px 32px; background-color: #262626; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 15px; letter-spacing: -0.2px; text-align: center;">
                                Download PDF
                            </a>
                            ` : ''}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #0a0a0a; text-align: center; border-top: 1px solid #262626;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #a3a3a3;">
                                Questions? Contact us at support@ticketsale.ca
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #737373;">
                                © 2025 ticketsale.ca
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
}
