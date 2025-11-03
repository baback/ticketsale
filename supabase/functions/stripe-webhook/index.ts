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

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 })
  }

  try {
    const body = await req.text()
    
    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )

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

    // TODO: Send confirmation email with tickets
    console.log('Order processing complete for:', orderId)

  } catch (error) {
    console.error('Error handling checkout complete:', error)
    throw error
  }
}
