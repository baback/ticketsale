#!/bin/bash

# Setup script for Supabase secrets
# Run this after adding your API keys

echo "Setting up Supabase secrets..."

# Check if RESEND_API_KEY is provided
if [ -z "$RESEND_API_KEY" ]; then
  echo "Please set RESEND_API_KEY environment variable"
  echo "Example: export RESEND_API_KEY=re_xxxxx"
  exit 1
fi

# Set RESEND_API_KEY
echo "Setting RESEND_API_KEY..."
supabase secrets set RESEND_API_KEY="$RESEND_API_KEY"

# Set SITE_URL (update this to your actual domain)
echo "Setting SITE_URL..."
supabase secrets set SITE_URL="https://ticketsale.ca"

echo "✓ Secrets configured successfully!"
echo ""
echo "Note: PDFSHIFT_API_KEY should already be set in your Supabase dashboard"
echo "If not, run: supabase secrets set PDFSHIFT_API_KEY=your_key_here"
