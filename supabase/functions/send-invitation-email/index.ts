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
    const { invitation_id } = await req.json()

    if (!invitation_id) {
      throw new Error('Invitation ID is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get invitation details
    const { data: invitation, error: invError } = await supabaseClient
      .from('event_invitations')
      .select(`
        *,
        events (*),
        ticket_types (name, price),
        users!event_invitations_organizer_id_fkey (full_name, email)
      `)
      .eq('id', invitation_id)
      .single()

    if (invError || !invitation) {
      throw new Error('Invitation not found')
    }

    const event = invitation.events
    const ticketType = invitation.ticket_types
    const organizer = invitation.users

    // Format event date
    const eventDate = new Date(event.event_date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const organizerName = organizer?.full_name || organizer?.email?.split('@')[0] || 'Event Organizer'
    const inviteUrl = `${Deno.env.get('SITE_URL') || 'https://ticketsale.ca'}/invite/?id=${invitation.invitation_token}`

    // Prepare email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #000000;">You're Invited!</h1>
              <p style="margin: 10px 0 0; font-size: 16px; color: #666666;">${organizerName} has invited you to an event</p>
            </td>
          </tr>
          ${event.image_url ? `
          <tr>
            <td style="padding: 0 40px;">
              <img src="${event.image_url}" alt="${event.title}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 12px; display: block;">
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: bold; color: #000000;">${event.title}</h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-size: 16px; color: #333333;">
                    📅 ${eventDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-size: 16px; color: #333333;">
                    📍 ${event.location}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-size: 16px; color: #333333;">
                    🎟️ ${invitation.quantity}x ${ticketType?.name || 'Ticket'}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="${inviteUrl}" style="display: inline-block; padding: 16px 48px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: 600;">
                RSVP Now
              </a>
              <p style="margin: 20px 0 0; font-size: 14px; color: #999999;">
                Or copy this link: ${inviteUrl}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 14px; color: #666666;">
                This invitation was sent by ${organizerName} via ticketsale.ca
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      throw new Error('Email service not configured')
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ticketsale.ca <noreply@ticketsale.ca>',
        to: [invitation.invitee_email],
        subject: `You're invited to ${event.title}!`,
        html: emailHtml
      })
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('Resend API error:', errorText)
      throw new Error(`Failed to send email: ${errorText}`)
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation email sent successfully',
        email_id: emailResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending invitation email:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send invitation email'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
