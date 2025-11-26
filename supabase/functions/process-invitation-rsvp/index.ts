import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    const { invitation_token, action } = await req.json()

    if (!invitation_token || action !== 'accept') {
      throw new Error('Invalid request')
    }

    // Get invitation
    const { data: invitation, error: invError } = await supabaseClient
      .from('event_invitations')
      .select(`
        *,
        events (*),
        ticket_types (*)
      `)
      .eq('invitation_token', invitation_token)
      .eq('status', 'invited')
      .single()

    if (invError || !invitation) {
      throw new Error('Invitation not found or already processed')
    }

    // Check/Create user account
    let userId: string

    const { data: existingUser } = await supabaseClient.auth.admin.listUsers()
    const userExists = existingUser?.users?.find(u => u.email === invitation.invitee_email)

    if (userExists) {
      userId = userExists.id
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabaseClient.auth.admin.createUser({
        email: invitation.invitee_email,
        email_confirm: true,
        user_metadata: {
          full_name: invitation.invitee_name,
          created_via: 'invitation'
        }
      })

      if (userError || !newUser.user) {
        throw new Error('Failed to create user account')
      }

      userId = newUser.user.id

      // Create user profile
      await supabaseClient
        .from('users')
        .insert({
          id: userId,
          email: invitation.invitee_email,
          full_name: invitation.invitee_name,
          role: 'buyer'
        })
    }

    // Create order
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        event_id: invitation.event_id,
        user_id: userId,
        email: invitation.invitee_email,
        total: 0.00,
        subtotal: 0.00,
        fees: 0.00,
        status: 'completed',
        payment_method: 'invitation',
        payment_intent_id: null
      })
      .select()
      .single()

    if (orderError || !order) {
      throw new Error('Failed to create order')
    }

    // Generate tickets
    const tickets = []
    for (let i = 0; i < invitation.quantity; i++) {
      const qrCode = `${order.id}-${invitation.ticket_type_id}-${Date.now()}-${Math.random().toString(36).substring(7)}`
      
      tickets.push({
        order_id: order.id,
        event_id: invitation.event_id,
        ticket_type_id: invitation.ticket_type_id,
        user_id: userId,
        attendee_name: invitation.invitee_name,
        attendee_email: invitation.invitee_email,
        qr_code: qrCode,
        status: 'valid',
        checked_in: false
      })
    }

    const { error: ticketsError } = await supabaseClient
      .from('tickets')
      .insert(tickets)

    if (ticketsError) {
      throw new Error('Failed to generate tickets')
    }

    // Update ticket type availability
    const { error: updateError } = await supabaseClient
      .from('ticket_types')
      .update({
        available: invitation.ticket_types.available - invitation.quantity
      })
      .eq('id', invitation.ticket_type_id)

    if (updateError) {
      console.error('Failed to update ticket availability:', updateError)
    }

    // Update invitation status
    await supabaseClient
      .from('event_invitations')
      .update({
        status: 'accepted',
        order_id: order.id,
        responded_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    // TODO: Send ticket confirmation email
    // You can call your email service here

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        message: 'Invitation accepted successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error processing invitation:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process invitation'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
