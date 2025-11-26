import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { order_id } = await req.json()

    if (!order_id) {
      throw new Error('Order ID is required')
    }

    console.log('Generating PDF for order:', order_id)

    // Get order with items
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Get event details
    const { data: event } = await supabaseClient
      .from('events')
      .select('*')
      .eq('id', order.event_id)
      .single()

    if (!event) {
      throw new Error('Event not found')
    }

    // Get tickets
    const { data: tickets } = await supabaseClient
      .from('tickets')
      .select(`
        *,
        ticket_types (name, price)
      `)
      .eq('order_id', order_id)

    if (!tickets || tickets.length === 0) {
      throw new Error('No tickets found')
    }

    // Generate ticket HTML
    const ticketsHtml = tickets.map(ticket => {
      const ticketType = ticket.ticket_types

      const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })

      // Build location string with address if available
      let locationText = event.venue_name || event.location || 'TBA'
      if (event.address && event.address !== event.venue_name && event.address !== event.location) {
        locationText = event.address
      } else if (event.venue_name && event.location && event.venue_name !== event.location) {
        locationText = `${event.venue_name}, ${event.location}`
      }

      return `
        <div class="ticket">
          <div class="ticket-header">
            <img src="https://ticketsale.ca/src/img/logo/full-white.png" alt="ticketsale.ca" style="width: 180px; height: auto;" />
          </div>
          <div class="ticket-body">
            <h1 class="event-name">${event.title}</h1>
            <p class="event-subtitle">${event.venue_name || event.location || 'Venue TBA'}</p>
            
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
                <div class="detail-value">${locationText}</div>
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
              <div class="ticket-number">${ticket.ticket_number || ticket.qr_code}</div>
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
        .ticket-number { font-size: 12px; color: #737373; font-family: 'Courier New', monospace; word-break: break-all; }
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
      throw new Error('PDFSHIFT_API_KEY not configured')
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
    const fileName = `${order.id}.pdf`
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('ticket-pdfs')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('PDF upload error:', uploadError)
      throw new Error(`Failed to upload PDF: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('ticket-pdfs')
      .getPublicUrl(fileName)
    
    // Save URL to database
    await supabaseClient
      .from('orders')
      .update({ ticket_pdf_url: publicUrl })
      .eq('id', order.id)
    
    console.log('PDF uploaded and URL saved:', publicUrl)

    return new Response(
      JSON.stringify({ success: true, pdf_url: publicUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error generating PDF:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
