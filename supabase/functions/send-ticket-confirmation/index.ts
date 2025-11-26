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

    // Get order details with event and tickets
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        events (
          title,
          start_date,
          location,
          venue_name
        )
      `)
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Get tickets for this order
    const { data: tickets, error: ticketsError } = await supabaseClient
      .from('tickets')
      .select(`
        *,
        ticket_types (name, price)
      `)
      .eq('order_id', order_id)

    if (ticketsError || !tickets || tickets.length === 0) {
      throw new Error('No tickets found for this order')
    }

    // Format event date
    const eventDate = new Date(order.events.start_date)
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Format total amount
    const totalAmount = order.total_amount === 0 
      ? 'FREE (Invitation)' 
      : `$${parseFloat(order.total_amount).toFixed(2)} CAD`

    // Get ticket type name
    const ticketTypeName = tickets[0].ticket_types?.name || 'General Admission'

    // Load email template
    const templateResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/email-templates/ticket-confirmation.html`
    )
    
    let emailHtml = await templateResponse.text()
    
    // If template not found in storage, use inline template
    if (!emailHtml || emailHtml.includes('not found')) {
      emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #171717; border-radius: 24px; padding: 40px;">
    <h2 style="color: #22c55e;">Your Tickets Are Ready!</h2>
    <p>Thanks for accepting the invitation! Your tickets are confirmed.</p>
    <div style="background-color: #262626; border-radius: 12px; padding: 24px; margin: 20px 0;">
      <h3>Order Details</h3>
      <p><strong>Order Number:</strong> ${order.id.substring(0, 8)}</p>
      <p><strong>Event:</strong> ${order.events.title}</p>
      <p><strong>Date & Time:</strong> ${formattedDate}</p>
      <p><strong>Location:</strong> ${order.events.venue_name || order.events.location}</p>
      <p><strong>Tickets:</strong> ${tickets.length} × ${ticketTypeName}</p>
      <p><strong>Total:</strong> ${totalAmount}</p>
    </div>
    <p>View your tickets in your dashboard: <a href="${Deno.env.get('SUPABASE_URL').replace('supabase.co', 'ticketsale.ca')}/dashboard/mytickets">My Tickets</a></p>
  </div>
</body>
</html>`
    } else {
      // Replace template variables
      emailHtml = emailHtml
        .replace(/{{ORDER_NUMBER}}/g, order.id.substring(0, 8))
        .replace(/{{EVENT_NAME}}/g, order.events.title)
        .replace(/{{EVENT_DATE}}/g, formattedDate)
        .replace(/{{EVENT_LOCATION}}/g, order.events.venue_name || order.events.location)
        .replace(/{{TICKET_COUNT}}/g, tickets.length.toString())
        .replace(/{{TICKET_TYPE}}/g, ticketTypeName)
        .replace(/{{TOTAL_AMOUNT}}/g, totalAmount)
        .replace(/{{DASHBOARD_URL}}/g, `${Deno.env.get('SUPABASE_URL').replace('supabase.co', 'ticketsale.ca')}/dashboard/mytickets`)
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ticketsale.ca <noreply@ticketsale.ca>',
        to: [order.customer_email],
        subject: `Your Tickets for ${order.events.title}`,
        html: emailHtml,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Resend API error:', errorData)
      throw new Error(`Failed to send email: ${errorData}`)
    }

    const emailData = await emailResponse.json()
    console.log('Email sent successfully:', emailData)

    return new Response(
      JSON.stringify({ success: true, email_id: emailData.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending ticket confirmation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
