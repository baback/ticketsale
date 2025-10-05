#!/bin/bash

# Deploy script for ticketsale.ca

echo "🚀 Deploying ticketsale.ca..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "📦 Install it with: brew install gh"
    echo "🔑 Then authenticate with: gh auth login"
    exit 1
fi

# Create GitHub repository
echo "📦 Creating GitHub repository..."
gh repo create ticketsale --public --source=. --remote=origin --description="Modern ticket sales platform with dark mode and beautiful UI"

# Push to GitHub
echo "⬆️  Pushing to GitHub..."
git push -u origin main

echo "✅ Successfully pushed to GitHub!"
echo "🌐 Repository: https://github.com/$(gh api user --jq .login)/ticketsale"
echo ""
echo "📋 Next steps for Cloudflare Pages:"
echo "1. Go to https://dash.cloudflare.com/"
echo "2. Click 'Workers & Pages' → 'Create application' → 'Pages'"
echo "3. Connect to Git and select 'ticketsale' repository"
echo "4. Build settings:"
echo "   - Build command: npm run build:css"
echo "   - Build output directory: /"
echo "5. Click 'Save and Deploy'"
