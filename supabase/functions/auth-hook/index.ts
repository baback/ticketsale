import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SITE_URL = Deno.env.get('SITE_URL') || 'https://ticketsale.ca';

Deno.serve(async (req: Request) => {
  try {
    const { event, user } = await req.json();
    
    if (event === 'user.created') {
      // Send confirmation email
      await sendEmail(user.email, 'Confirm your email - ticketsale.ca', getConfirmEmailTemplate());
    } else if (event === 'user.confirmed') {
      // Send welcome email  
      await sendEmail(user.email, 'Welcome to ticketsale.ca', getWelcomeEmailTemplate());
    }
    
    return new Response('OK');
  } catch (error) {
    console.error('Error:', error);
    return new Response('OK'); // Always return OK so signup doesn't fail
  }
});

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'ticketsale.ca <noreply@ticketsale.ca>',
      to: [to],
      subject,
      html,
    }),
  });
}

function getConfirmEmailTemplate(): string {
  // Note: {{ .ConfirmationURL }} will be replaced by Supabase
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email - ticketsale.ca</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #171717; border-radius: 24px; border: 1px solid #262626; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <svg width="150" height="16" viewBox="0 0 433 47" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.25872 3.48535C8.45986 2.59539 9.96562 2.21848 11.4443 2.43848H55.8896C57.3682 2.65852 58.857 3.73049 59.747 4.93164C60.637 6.13283 61.0129 7.6385 60.7929 9.11719L59.1337 20.2676C57.6551 20.0476 56.1493 20.4245 54.9482 21.3145C53.7472 22.2044 52.9485 23.5351 52.7284 25.0137C52.5084 26.4923 52.8853 27.998 53.7753 29.1992C54.6653 30.4003 55.9959 31.1989 57.4745 31.4189L55.8154 42.5693C55.5953 44.0479 54.7967 45.3786 53.5956 46.2686C52.3944 47.1586 50.8888 47.5355 49.4101 47.3154H4.96477C3.48608 47.0954 1.99735 46.0235 1.10735 44.8223C0.217404 43.6211 -0.158589 42.1154 0.0614515 40.6367L1.72063 29.4863C3.19928 29.7063 4.70502 29.3294 5.90618 28.4395C7.10721 27.5495 7.90588 26.2188 8.1259 24.7402C8.34591 23.2616 7.969 21.7558 7.07903 20.5547C6.18904 19.3537 4.85838 18.555 3.37981 18.335L5.03899 7.18457C5.25902 5.70601 6.0577 4.37535 7.25872 3.48535ZM282.819 11.1826C284.486 11.1826 286.114 11.3796 287.705 11.7734C289.311 12.1673 290.728 12.8185 291.955 13.7275C293.197 14.6215 294.107 15.8413 294.683 17.3867C295.273 18.9322 295.372 20.8644 294.978 23.1826L291.092 46.5459H283.183L284.001 41.75H283.728C283.077 42.7197 282.228 43.6291 281.183 44.4775C280.137 45.3109 278.894 45.9848 277.455 46.5C276.016 46.9999 274.387 47.25 272.569 47.25C270.357 47.25 268.432 46.8562 266.796 46.0684C265.16 45.2654 263.955 44.0838 263.183 42.5234C262.425 40.9628 262.235 39.0379 262.614 36.75C262.948 34.7806 263.584 33.152 264.523 31.8643C265.478 30.5764 266.645 29.5462 268.023 28.7734C269.417 27.9856 270.933 27.3939 272.569 27C274.221 26.6061 275.902 26.3185 277.614 26.1367C279.705 25.9246 281.395 25.7277 282.683 25.5459C283.986 25.3641 284.963 25.0912 285.614 24.7275C286.266 24.3488 286.659 23.7727 286.796 23V22.8643C287.069 21.1522 286.797 19.8261 285.978 18.8867C285.16 17.9473 283.796 17.4775 281.887 17.4775C279.887 17.4776 278.205 17.9172 276.842 18.7959C275.478 19.6746 274.485 20.7123 273.864 21.9092L266.41 20.8184C267.349 18.6973 268.637 16.9242 270.273 15.5C271.91 14.0607 273.796 12.9855 275.933 12.2734C278.084 11.5462 280.38 11.1826 282.819 11.1826Z" fill="white"/>
                            </svg>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px; text-align: center;">
                            <div style="width: 64px; height: 64px; background-color: #262626; border-radius: 50%; display: inline-block; text-align: center; line-height: 64px; margin: 0 auto;">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" stroke-width="2" style="vertical-align: middle;">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 30px 40px; text-align: center;">
                            <h2 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Confirm Your Email</h2>
                            <p style="margin: 0; font-size: 16px; line-height: 24px; color: #a3a3a3;">
                                Click the button below to confirm your email address and complete your registration.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 40px 40px; text-align: center;">
                            <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background-color: #ffffff; color: #000000; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 15px; letter-spacing: -0.2px;">
                                Confirm Email
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="border-top: 1px solid #262626;"></div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px 40px 40px; text-align: center;">
                            <p style="margin: 0 0 12px 0; font-size: 13px; color: #a3a3a3;">
                                Or copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #737373; word-break: break-all;">
                                {{ .ConfirmationURL }}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #0a0a0a; text-align: center; border-top: 1px solid #262626;">
                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #a3a3a3;">
                                If you didn't create an account, you can safely ignore this email.
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
</html>`;
}

function getWelcomeEmailTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ticketsale.ca</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #171717; border-radius: 24px; border: 1px solid #262626; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <svg width="150" height="16" viewBox="0 0 433 47" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.25872 3.48535C8.45986 2.59539 9.96562 2.21848 11.4443 2.43848H55.8896C57.3682 2.65852 58.857 3.73049 59.747 4.93164C60.637 6.13283 61.0129 7.6385 60.7929 9.11719L59.1337 20.2676C57.6551 20.0476 56.1493 20.4245 54.9482 21.3145C53.7472 22.2044 52.9485 23.5351 52.7284 25.0137C52.5084 26.4923 52.8853 27.998 53.7753 29.1992C54.6653 30.4003 55.9959 31.1989 57.4745 31.4189L55.8154 42.5693C55.5953 44.0479 54.7967 45.3786 53.5956 46.2686C52.3944 47.1586 50.8888 47.5355 49.4101 47.3154H4.96477C3.48608 47.0954 1.99735 46.0235 1.10735 44.8223C0.217404 43.6211 -0.158589 42.1154 0.0614515 40.6367L1.72063 29.4863C3.19928 29.7063 4.70502 29.3294 5.90618 28.4395C7.10721 27.5495 7.90588 26.2188 8.1259 24.7402C8.34591 23.2616 7.969 21.7558 7.07903 20.5547C6.18904 19.3537 4.85838 18.555 3.37981 18.335L5.03899 7.18457C5.25902 5.70601 6.0577 4.37535 7.25872 3.48535ZM282.819 11.1826C284.486 11.1826 286.114 11.3796 287.705 11.7734C289.311 12.1673 290.728 12.8185 291.955 13.7275C293.197 14.6215 294.107 15.8413 294.683 17.3867C295.273 18.9322 295.372 20.8644 294.978 23.1826L291.092 46.5459H283.183L284.001 41.75H283.728C283.077 42.7197 282.228 43.6291 281.183 44.4775C280.137 45.3109 278.894 45.9848 277.455 46.5C276.016 46.9999 274.387 47.25 272.569 47.25C270.357 47.25 268.432 46.8562 266.796 46.0684C265.16 45.2654 263.955 44.0838 263.183 42.5234C262.425 40.9628 262.235 39.0379 262.614 36.75C262.948 34.7806 263.584 33.152 264.523 31.8643C265.478 30.5764 266.645 29.5462 268.023 28.7734C269.417 27.9856 270.933 27.3939 272.569 27C274.221 26.6061 275.902 26.3185 277.614 26.1367C279.705 25.9246 281.395 25.7277 282.683 25.5459C283.986 25.3641 284.963 25.0912 285.614 24.7275C286.266 24.3488 286.659 23.7727 286.796 23V22.8643C287.069 21.1522 286.797 19.8261 285.978 18.8867C285.16 17.9473 283.796 17.4775 281.887 17.4775C279.887 17.4776 278.205 17.9172 276.842 18.7959C275.478 19.6746 274.485 20.7123 273.864 21.9092L266.41 20.8184C267.349 18.6973 268.637 16.9242 270.273 15.5C271.91 14.0607 273.796 12.9855 275.933 12.2734C278.084 11.5462 280.38 11.1826 282.819 11.1826Z" fill="white"/>
                            </svg>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px; text-align: center;">
                            <div style="width: 64px; height: 64px; background-color: #262626; border-radius: 50%; display: inline-block; text-align: center; line-height: 64px; margin: 0 auto;">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" stroke-width="2" style="vertical-align: middle;">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 30px 40px; text-align: center;">
                            <h2 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">Welcome to ticketsale.ca</h2>
                            <p style="margin: 0; font-size: 16px; line-height: 24px; color: #a3a3a3;">
                                Your account is ready. Start discovering and booking amazing events.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 40px 40px; text-align: center;">
                            <a href="${SITE_URL}/events" style="display: inline-block; padding: 16px 32px; background-color: #ffffff; color: #000000; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 15px; letter-spacing: -0.2px;">
                                Browse Events
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px; background-color: #0a0a0a; text-align: center; border-top: 1px solid #262626;">
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
</html>`;
}
