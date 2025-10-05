import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

Deno.serve(async (req: Request) => {
  try {
    const { email, token, type } = await req.json();
    
    // Generate confirmation URL
    const confirmUrl = `${Deno.env.get('SITE_URL')}/auth/confirm?token=${token}&type=signup`;
    
    // Read the HTML template
    const template = getConfirmEmailTemplate(confirmUrl);
    
    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'ticketsale.ca <noreply@ticketsale.ca>',
        to: [email],
        subject: 'Confirm your email - ticketsale.ca',
        html: template,
      }),
    });

    const data = await res.json();
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: res.ok ? 200 : 400,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

function getConfirmEmailTemplate(confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
