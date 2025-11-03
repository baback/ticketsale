# Email Templates

## Available Templates

### 1. ticket-confirmation.html
**Purpose:** Sent after successful ticket purchase  
**Trigger:** Stripe webhook `checkout.session.completed`  
**Attachments:** PDF with all tickets  

**Placeholders:**
- `{{ORDER_NUMBER}}` - Order ID (first 8 chars)
- `{{EVENT_NAME}}` - Event title
- `{{EVENT_DATE}}` - Formatted event date/time
- `{{EVENT_LOCATION}}` - Event location/venue
- `{{TICKET_COUNT}}` - Number of tickets
- `{{TICKET_TYPE}}` - Ticket type name
- `{{TOTAL_AMOUNT}}` - Total paid amount
- `{{DASHBOARD_URL}}` - Link to user dashboard

**Design:** Dark theme with green success icon, order details card, and important info callout

### 2. ticket-pdf-template.html
**Purpose:** PDF ticket design (embedded in webhook function)  
**Generated:** By PDFShift API  
**Contains:** Individual tickets with QR codes  

**Features:**
- Professional dark gradient design
- Event details grid
- Large QR code for scanning
- Unique ticket number
- Important entry information
- Print-optimized layout

### 3. confirm-email.html
**Purpose:** Email verification  
**Trigger:** User signup  
**Design:** Dark theme with checkmark icon

### 4. password-reset.html
**Purpose:** Password reset requests  
**Trigger:** User requests password reset  
**Design:** Dark theme with lock icon

## Design System

### Colors
- Background: `#0a0a0a` (dark)
- Card: `#171717` (neutral-900)
- Border: `#262626` (neutral-800)
- Text Primary: `#ffffff` (white)
- Text Secondary: `#a3a3a3` (neutral-400)
- Success: `#22c55e` (green-500)
- Info: `#3b82f6` (blue-500)

### Typography
- Font: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- Heading: 28px, bold, -0.5px letter-spacing
- Body: 16px, regular, 24px line-height
- Small: 13-14px

### Components
- **Cards:** Rounded 24px, border, shadow
- **Buttons:** Rounded full (pill), white bg, black text
- **Badges:** Rounded full, colored backgrounds
- **Icons:** 64px circles with colored backgrounds

## Testing Templates

### Local Testing
1. Open HTML file in browser
2. Replace placeholders with test data
3. Check responsive design (mobile/desktop)

### Email Client Testing
Use services like:
- Litmus
- Email on Acid
- Mail Tester

### Inline CSS
All styles are inline for maximum email client compatibility.

## Customization

### Per-Event Branding
To customize emails per event:
1. Add `email_template` field to events table
2. Store custom HTML in database
3. Modify webhook to use custom template if available

### Multi-Language
To support multiple languages:
1. Create language-specific templates
2. Store user language preference
3. Select template based on user language

## Best Practices

1. **Keep it Simple:** Email clients have limited CSS support
2. **Inline Styles:** Always use inline styles
3. **Test Everywhere:** Test in Gmail, Outlook, Apple Mail, etc.
4. **Mobile First:** Most emails are opened on mobile
5. **Alt Text:** Always include alt text for images
6. **Plain Text:** Consider adding plain text versions
7. **Unsubscribe:** Add unsubscribe link for marketing emails

## Troubleshooting

### Images Not Loading
- Use absolute URLs for images
- Host images on CDN
- Include alt text

### Layout Broken
- Use tables for layout (email standard)
- Avoid flexbox/grid
- Test in Outlook

### Fonts Not Working
- Use web-safe fonts
- Provide fallbacks
- System fonts work best

## Resources

- [Can I Email](https://www.caniemail.com/) - CSS support in email clients
- [Really Good Emails](https://reallygoodemails.com/) - Email design inspiration
- [Litmus](https://www.litmus.com/) - Email testing platform
