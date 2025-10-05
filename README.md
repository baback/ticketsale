# ticketsale.ca

A minimal, artistic ticket sales platform for event organizers who want to sell out their events.

## Features

- 🎨 Monochrome dark/light theme with artistic design
- ⚡ Built with vanilla JavaScript, HTML, and Tailwind CSS v3.4
- 🎫 Event organizer focused platform
- 📱 Fully responsive design

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
