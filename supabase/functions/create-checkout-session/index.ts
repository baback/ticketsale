import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting checkout session creation...')
    console.log('Stripe key exists:', !!Deno.env.get('STRIPE_SECRET_KEY'))
    
    // Create client for auth verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    // Create service role client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Unauthorized')
    }

    console.log('User authenticated:', user.id)

    // Get request body
    const { eventId, ticketSelections } = await req.json()
    console.log('Request data:', { eventId, ticketSelections })

    if (!eventId || !ticketSelections || Object.keys(ticketSelections).length === 0) {
      throw new Error('Missing required fields')
    }

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*, ticket_types(*)')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error('Event fetch error:', eventError)
      throw new Error('Event not found')
    }

    // Calculate totals and prepare line items
    const lineItems: any[] = []
    let subtotal = 0

    for (const [ticketTypeId, quantity] of Object.entries(ticketSelections)) {
      const ticketType = event.ticket_types.find((t: any) => t.id === ticketTypeId)
      
      if (!ticketType) {
        throw new Error(`Ticket type ${ticketTypeId} not found`)
      }

      if (ticketType.available < quantity) {
        throw new Error(`Not enough tickets available for ${ticketType.name}`)
      }

      const amount = ticketType.price * (quantity as number)
      subtotal += amount

      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: `${event.title} - ${ticketType.name}`,
            description: ticketType.description || undefined,
            images: event.image_url ? [event.image_url] : undefined,
          },
          unit_amount: Math.round(ticketType.price * 100), // Convert to cents
        },
        quantity: quantity as number,
      })
    }

    // Add service fee (10%)
    const serviceFee = subtotal * 0.10
    lineItems.push({
      price_data: {
        currency: 'cad',
        product_data: {
          name: 'Service Fee',
          description: 'Platform service fee',
        },
        unit_amount: Math.round(serviceFee * 100),
      },
      quantity: 1,
    })

    const total = subtotal + serviceFee

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    // Create order in database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: user.id,
        event_id: eventId,
        status: 'pending',
        subtotal: subtotal,
        service_fee: serviceFee,
        total: total,
        total_amount: total,
        currency: 'cad',
        customer_email: profile?.email || user.email,
        customer_name: profile?.full_name,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      throw new Error(`Failed to create order: ${orderError?.message || 'Unknown error'}`)
    }

    // Create order items
    for (const [ticketTypeId, quantity] of Object.entries(ticketSelections)) {
      const ticketType = event.ticket_types.find((t: any) => t.id === ticketTypeId)
      const unitPrice = ticketType.price
      const itemSubtotal = unitPrice * (quantity as number)

      await supabaseAdmin
        .from('order_items')
        .insert({
          order_id: order.id,
          ticket_type_id: ticketTypeId,
          quantity: quantity as number,
          unit_price: unitPrice,
          subtotal: itemSubtotal,
        })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/checkout/?event=${eventId}`,
      customer_email: profile?.email || user.email,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        event_id: eventId,
      },
    })

    // Update order with Stripe session ID
    await supabaseAdmin
      .from('orders')
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq('id', order.id)

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
