#!/bin/bash
# Installation script for Obsidian Sync plugin on macOS/Linux

set -e

echo "🚀 Obsidian Sync Plugin Installation"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "   Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Check if in correct directory
if [ ! -f "manifest.json" ]; then
    echo "❌ manifest.json not found. Please run this script from the plugin directory."
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building plugin..."
npm run build

echo ""
echo "✅ Build complete!"

# Get vault path from user
echo ""
echo "📁 Plugin Installation"
echo "--------------------"
read -p "Enter your Obsidian vault path (e.g., /Users/username/Documents/MyVault): " VAULT_PATH

# Normalize path
VAULT_PATH="${VAULT_PATH/#\~/$HOME}"

if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ Vault path does not exist: $VAULT_PATH"
    exit 1
fi

PLUGIN_PATH="$VAULT_PATH/.obsidian/plugins/obsidian-sync"

# Create plugin directory if it doesn't exist
mkdir -p "$PLUGIN_PATH"

# Copy plugin files
echo ""
echo "📋 Copying plugin files..."
cp main.js "$PLUGIN_PATH/"
cp manifest.json "$PLUGIN_PATH/"
cp styles.css "$PLUGIN_PATH/"

echo "✅ Plugin files copied to: $PLUGIN_PATH"

echo ""
echo "🔐 Google Drive Setup"
echo "-------------------"
echo "Next, you need to set up Google Drive API access:"
echo ""
echo "1. Visit https://console.cloud.google.com"
echo "2. Create a new project"
echo "3. Enable Google Drive API"
echo "4. Create OAuth 2.0 credentials (Desktop application)"
echo "5. Download the JSON credentials file"
echo ""
echo "Copy the credentials and create a .env file:"
echo "  cp .env.example .env"
echo "  # Edit .env with your credentials"
echo ""

read -p "Have you set up Google Drive API credentials? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your GOOGLE_CLIENT_ID: " CLIENT_ID
    read -p "Enter your GOOGLE_CLIENT_SECRET: " CLIENT_SECRET
    
    cat > .env << EOF
GOOGLE_CLIENT_ID=$CLIENT_ID
GOOGLE_CLIENT_SECRET=$CLIENT_SECRET
GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
EOF
    
    echo "✅ .env file created"
fi

echo ""
echo "🎉 Installation Complete!"
echo "=========================="
echo ""
echo "Next steps:"
echo "1. Open Obsidian"
echo "2. Settings → Community Plugins → Turn on community plugins"
echo "3. Find 'Obsidian Sync' and enable it"
echo "4. Click 'Authenticate' in plugin settings"
echo "5. Authorize the plugin to access Google Drive"
echo "6. Start syncing!"
echo ""
echo "For more help, see README.md and GOOGLE_DRIVE_SETUP.md"
