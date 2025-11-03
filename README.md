<!-- @format -->

# ticketsale.ca

A minimal, artistic ticket sales platform for event organizers who want to sell out their events.

## 🎉 Ticket System Status: READY TO GO!

✅ All systems operational | ✅ APIs configured | ✅ Ready to test

**[Start Testing Now →](TEST_NOW.md)** | [View Documentation →](READY_TO_GO.md)

## Features

- 🎨 Monochrome dark/light theme with artistic design
- ⚡ Built with vanilla JavaScript, HTML, and Tailwind CSS v3.4
- 🎫 Complete ticket sales system with Stripe integration
- 📧 Automatic email delivery with PDF tickets
- 📱 Fully responsive design
- 🔐 Secure authentication with Supabase
- 📊 Dashboard for buyers and organizers

## Tech Stack

- Vanilla JavaScript
- HTML5
- Tailwind CSS v3.4
- http-server for local development

## Getting Started

### Prerequisites

Make sure you have Node.js installed on your system.

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

This will:

- Compile Tailwind CSS and watch for changes
- Start the local server at https://localhost:7070
- Auto-reload on file changes

### Available Scripts

- `npm run dev` - Start development server with Tailwind watch mode
- `npm run build:css` - Build Tailwind CSS for production

## Ticket System

The platform includes a complete ticket sales system with:
- 💳 Stripe payment processing
- 🎫 Automatic ticket generation with QR codes
- 📄 PDF ticket generation using PDFShift
- 📧 Email delivery using Resend
- 📱 Mobile-friendly ticket viewing in dashboard

### Quick Setup

1. **Get Resend API Key**
   ```bash
   # Sign up at https://resend.com/ and get your API key
   export RESEND_API_KEY="re_your_key_here"
   bash setup-secrets.sh
   ```

2. **Test the System**
   - Go to an event page
   - Click "Buy Tickets"
   - Use test card: `4242 4242 4242 4242`
   - Check your email for tickets!

### Documentation

- 📖 **[Quick Start Guide](QUICK_START.md)** - Get started in 5 minutes
- 🔧 **[Setup Guide](TICKET_SYSTEM_SETUP.md)** - Complete configuration instructions
- 📋 **[Implementation Summary](IMPLEMENTATION_SUMMARY.md)** - Technical details
- 📧 **[Email Templates](email-templates/README.md)** - Email design documentation
- `npm run watch:css` - Watch Tailwind CSS changes only
- `npm run serve` - Start HTTP server only

## Project Structure

```
ticketsale/
├── src/
│   ├── scripts/
│   │   ├── app.js         # Homepage JavaScript
│   │   └── organizer.js   # Organizer page JavaScript
│   └── styles/
│       ├── input.css      # Tailwind source file
│       └── output.css     # Compiled CSS (generated)
├── organizer/
│   └── index.html         # Organizer landing page
├── index.html             # Main homepage (event listings)
├── tailwind.config.js     # Tailwind configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Development

The site runs in dark mode by default. Use the theme toggle button in the navigation to switch between light and dark modes.

## License

© 2025 ticketsale.ca
