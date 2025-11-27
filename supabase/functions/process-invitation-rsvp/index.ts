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

    // Search for existing user by email
    const { data: existingUsers, error: listError } = await supabaseClient.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      throw new Error('Failed to check existing users')
    }

    const userExists = existingUsers?.users?.find(u => u.email === invitation.invitee_email)

    if (userExists) {
      console.log('User already exists:', userExists.id)
      userId = userExists.id
    } else {
      console.log('Creating new user for:', invitation.invitee_email)
      
      // Create new user with a random password
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
      
      const { data: newUser, error: userError } = await supabaseClient.auth.admin.createUser({
        email: invitation.invitee_email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: invitation.invitee_name,
          created_via: 'invitation'
        }
      })

      if (userError) {
        console.error('Error creating user:', userError)
        throw new Error(`Failed to create user account: ${userError.message}`)
      }

      if (!newUser.user) {
        throw new Error('User creation returned no user object')
      }

      userId = newUser.user.id
      console.log('New user created:', userId)

      // Create user profile
      const { error: profileError } = await supabaseClient
        .from('users')
        .insert({
          id: userId,
          email: invitation.invitee_email,
          full_name: invitation.invitee_name,
          role: 'buyer'
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        // Don't throw - user is created, profile is optional
      }
    }

    // Create order (using service role to bypass RLS)
    console.log('Creating order for user:', userId)
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        event_id: invitation.event_id,
        user_id: userId,
        customer_email: invitation.invitee_email,
        customer_name: invitation.invitee_name,
        total_amount: 0.00,
        subtotal: 0.00,
        service_fee: 0.00,
        discount_amount: 0.00,
        total: 0.00,
        status: 'completed',
        payment_intent_id: 'invitation-' + invitation.invitation_token,
        currency: 'cad'
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      throw new Error(`Failed to create order: ${orderError.message || JSON.stringify(orderError)}`)
    }

    if (!order) {
      throw new Error('Order creation returned no data')
    }

    console.log('Order created successfully:', order.id)

    // Generate tickets (let database trigger generate qr_code and ticket_number)
    const tickets = []
    for (let i = 0; i < invitation.quantity; i++) {
      tickets.push({
        order_id: order.id,
        event_id: invitation.event_id,
        ticket_type_id: invitation.ticket_type_id,
        user_id: userId,
        status: 'valid'
      })
    }

    const { error: ticketsError } = await supabaseClient
      .from('tickets')
      .insert(tickets)

    if (ticketsError) {
      console.error('Ticket creation error:', ticketsError)
      throw new Error(`Failed to generate tickets: ${ticketsError.message || JSON.stringify(ticketsError)}`)
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

    // Generate PDF for tickets
    try {
      const pdfResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-ticket-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ order_id: order.id })
        }
      )

      if (!pdfResponse.ok) {
        console.error('Failed to generate PDF:', await pdfResponse.text())
      } else {
        console.log('PDF generated successfully')
      }
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError)
      // Don't fail the whole process if PDF generation fails
    }

    // Send ticket confirmation email
    try {
      const emailResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-ticket-confirmation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({ order_id: order.id })
        }
      )

      if (!emailResponse.ok) {
        console.error('Failed to send ticket confirmation email:', await emailResponse.text())
      } else {
        console.log('Ticket confirmation email sent successfully')
      }
    } catch (emailError) {
      console.error('Error sending ticket confirmation email:', emailError)
      // Don't fail the whole process if email fails
    }

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
