# Obsidian Sync

A powerful bidirectional sync plugin for Obsidian that keeps your vault in sync with Google Drive. Features automatic syncing, conflict resolution, and cross-platform support for macOS, Windows, and iOS.

## Features

- ✅ **Bidirectional Sync**: Sync your vault to Google Drive and pull changes back
- ✅ **Automatic Sync**: Set automatic sync intervals (default: every 5 minutes)
- ✅ **Conflict Resolution**: Multiple strategies to handle conflicting changes:
  - Manual review (default)
  - Prefer local changes
  - Prefer remote changes
- ✅ **Cross-Platform**: Works on Windows, macOS, and iOS
- ✅ **Real-time Monitoring**: Automatically syncs on file create, modify, delete, and rename
- ✅ **Selective Syncing**: Control which files and folders to sync
- ✅ **Sync History**: Track sync operations and view status

## Installation

### Prerequisites

- Node.js 16+ and npm
- Git
- Obsidian (v0.15.0+)
- Google Account with Google Drive access

### Setup

1. Clone this repository:
```bash
git clone https://github.com/yourusername/obsidian-sync.git
cd obsidian-sync
```

2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

4. Copy the plugin to your vault's plugins folder:
```bash
# On Windows
copy *.js YOUR_VAULT_PATH\.obsidian\plugins\obsidian-sync\

# On macOS/Linux
cp *.js YOUR_VAULT_PATH/.obsidian/plugins/obsidian-sync/
cp manifest.json YOUR_VAULT_PATH/.obsidian/plugins/obsidian-sync/
cp styles.css YOUR_VAULT_PATH/.obsidian/plugins/obsidian-sync/
```

5. Enable the plugin in Obsidian:
   - Open Obsidian Settings
   - Go to Community Plugins
   - Enable "Obsidian Sync"

## Configuration

### Google Drive Setup

1. Create a new folder in Google Drive for your vault backups
2. Go to [Google Cloud Console](https://console.cloud.google.com)
3. Create a new project
4. Enable the Google Drive API
5. Create OAuth 2.0 credentials (Desktop application)
6. Download the credentials JSON file
7. Set environment variables:
   ```bash
   set GOOGLE_CLIENT_ID=your_client_id
   set GOOGLE_CLIENT_SECRET=your_client_secret
   set GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
   ```

### Plugin Settings

Once installed, configure the plugin:

1. **Authenticate**: Click "Authenticate" to connect with Google Drive
2. **Auto-sync**: Enable/disable automatic syncing
3. **Sync Interval**: Set how often to sync (in seconds, minimum 60)
4. **Conflict Resolution**:
   - `Manual review`: Review conflicts before resolving
   - `Prefer local`: Always use local changes
   - `Prefer remote`: Always use remote changes
5. **Sync Folder**: Select which Google Drive folder to sync with

## Usage

### Commands

The plugin adds several commands you can access via the Command Palette (Ctrl+P / Cmd+P):

- **Authenticate with Google Drive**: Set up or refresh authentication
- **Sync vault with Google Drive now**: Manually trigger a sync
- **View sync status**: Check current sync status and last sync time

### Ribbon Icon

Click the cloud sync icon in the left sidebar to manually trigger a sync.

### Automatic Syncing

Once authenticated and auto-sync is enabled, the plugin will:
- Automatically sync every 5 minutes (configurable)
- Sync whenever you create, modify, delete, or rename a file
- Detect and handle conflicts based on your settings

## Conflict Resolution

When conflicts occur (same file changed in both locations):

### Manual Review (Recommended for important documents)
1. You'll be notified of conflicts
2. Open the conflict report in settings
3. Choose which version to keep
4. Conflicts are marked in the file with comments

### Prefer Local
Automatically uses your local version if both sides change

### Prefer Remote
Automatically uses the remote (Google Drive) version if both sides change

## Cross-Platform Considerations

### Windows
- Native support
- Uses Windows-compatible paths
- Works with Windows File Explorer

### macOS
- Native support
- Respects macOS file permissions
- Optimized for .obsidian folder

### iOS
- Requires Obsidian Mobile
- ICloud Drive integration available
- May require manual setup for Google Drive access

## Troubleshooting

### Authentication Issues

**Problem**: "Failed to authenticate"
- Solution: Check your Google Client ID and Secret are correct
- Solution: Ensure you've enabled Google Drive API in Google Cloud Console

### Sync Fails

**Problem**: "Sync failed: Not authenticated"
- Solution: Click "Authenticate" in settings again

**Problem**: "Files not syncing"
- Solution: Check if auto-sync is enabled
- Solution: Verify the Google Drive folder ID is correct
- Solution: Check internet connection

### Conflicts Not Resolving

**Problem**: "Found conflicts" notification appears frequently
- Solution: Change conflict resolution strategy to "Prefer local" or "Prefer remote"
- Solution: Manually review and resolve conflicts in settings

### Performance Issues

**Problem**: Plugin slows down Obsidian
- Solution: Increase sync interval (Settings > Sync interval)
- Solution: Disable auto-sync and use manual sync (Settings > Auto-sync)
- Solution: Exclude large folders from syncing

## Development

### Building from Source

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development build: `npm run dev`
4. The plugin will rebuild automatically as you make changes

### Project Structure

```
.
├── main.ts              # Main plugin file
├── manifest.json        # Plugin metadata
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── esbuild.config.mjs   # Build configuration
└── sync/
    ├── googleDriveSync.ts    # Google Drive API wrapper
    ├── conflictResolver.ts   # Conflict handling logic
    └── syncState.ts          # Sync state management
```

### Testing

Create a separate Obsidian vault for testing:
1. Create a test vault in Obsidian
2. Enable the plugin in that vault
3. Test sync functionality with non-critical files

## Security

- Tokens are stored securely in Obsidian's local storage
- OAuth2 authentication means you don't share your password
- All sync operations use Google Drive's standard encryption
- No data is sent to third-party servers

## Limitations

- Requires internet connection to sync
- Large vaults (100k+ files) may take time to sync
- iOS support requires additional configuration
- Binary files (images, PDFs) are synced but not optimized

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, visit the [GitHub repository](https://github.com/yourusername/obsidian-sync).

## Changelog

### Version 1.0.0
- Initial release
- Bidirectional sync
- Automatic sync with configurable intervals
- Conflict resolution strategies
- Cross-platform support
