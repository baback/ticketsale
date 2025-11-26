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
            <svg width="180" height="20" viewBox="0 0 433 47" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.25872 3.48535C8.45986 2.59539 9.96562 2.21848 11.4443 2.43848H55.8896C57.3682 2.65852 58.857 3.73049 59.747 4.93164C60.637 6.13283 61.0129 7.6385 60.7929 9.11719L59.1337 20.2676C57.6551 20.0476 56.1493 20.4245 54.9482 21.3145C53.7472 22.2044 52.9485 23.5351 52.7284 25.0137C52.5084 26.4923 52.8853 27.998 53.7753 29.1992C54.6653 30.4003 55.9959 31.1989 57.4745 31.4189L55.8154 42.5693C55.5953 44.0479 54.7967 45.3786 53.5956 46.2686C52.3944 47.1586 50.8888 47.5355 49.4101 47.3154H4.96477C3.48608 47.0954 1.99735 46.0235 1.10735 44.8223C0.217404 43.6211 -0.158589 42.1154 0.0614515 40.6367L1.72063 29.4863C3.19928 29.7063 4.70502 29.3294 5.90618 28.4395C7.10721 27.5495 7.90588 26.2188 8.1259 24.7402C8.34591 23.2616 7.969 21.7558 7.07903 20.5547C6.18904 19.3537 4.85838 18.555 3.37981 18.335L5.03899 7.18457C5.25902 5.70601 6.0577 4.37535 7.25872 3.48535ZM282.819 11.1826C284.486 11.1826 286.114 11.3796 287.705 11.7734C289.311 12.1673 290.728 12.8185 291.955 13.7275C293.197 14.6215 294.107 15.8413 294.683 17.3867C295.273 18.9322 295.372 20.8644 294.978 23.1826L291.092 46.5459H283.183L284.001 41.75H283.728C283.077 42.7197 282.228 43.6291 281.183 44.4775C280.137 45.3109 278.894 45.9848 277.455 46.5C276.016 46.9999 274.387 47.25 272.569 47.25C270.357 47.25 268.432 46.8562 266.796 46.0684C265.16 45.2654 263.955 44.0838 263.183 42.5234C262.425 40.9628 262.235 39.0379 262.614 36.75C262.948 34.7806 263.584 33.152 264.523 31.8643C265.478 30.5764 266.645 29.5462 268.023 28.7734C269.417 27.9856 270.933 27.3939 272.569 27C274.221 26.6061 275.902 26.3185 277.614 26.1367C279.705 25.9246 281.395 25.7277 282.683 25.5459C283.986 25.3641 284.963 25.0912 285.614 24.7275C286.266 24.3488 286.659 23.7727 286.796 23V22.8643C287.069 21.1522 286.797 19.8261 285.978 18.8867C285.16 17.9473 283.796 17.4775 281.887 17.4775C279.887 17.4776 278.205 17.9172 276.842 18.7959C275.478 19.6746 274.485 20.7123 273.864 21.9092L266.41 20.8184C267.349 18.6973 268.637 16.9242 270.273 15.5C271.91 14.0607 273.796 12.9855 275.933 12.2734C278.084 11.5462 280.38 11.1826 282.819 11.1826Z" fill="white"/>
            </svg>
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
