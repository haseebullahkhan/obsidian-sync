# Copilot Instructions

This file contains workspace-specific instructions for working with the Obsidian Sync plugin project.

## Project Overview

- **Type**: Obsidian Plugin
- **Language**: TypeScript
- **Framework**: Obsidian API v0.15.0+
- **Purpose**: Bidirectional Google Drive sync with conflict resolution
- **Platforms**: Windows, macOS, iOS

## Development Setup

1. **Install Node.js**: Required Node.js 16+ and npm
2. **Install Dependencies**: Run `npm install`
3. **Build**: Run `npm run build` (or `npm run dev` for watch mode)
4. **Deploy**: Copy main.js, manifest.json, and styles.css to plugin folder

## Project Structure

- `main.ts` - Main plugin entry point with settings and commands
- `sync/googleDriveSync.ts` - Google Drive API integration
- `sync/conflictResolver.ts` - Conflict detection and resolution logic
- `sync/syncState.ts` - Sync state management and history
- `README.md` - Full documentation
- `GOOGLE_DRIVE_SETUP.md` - Google Drive OAuth2 setup guide
- `IOS_SETUP.md` - iOS-specific configuration
- `GETTING_STARTED.md` - Quick start guide

## Key Features

- Bidirectional vault sync with Google Drive
- Automatic sync with configurable intervals
- Multiple conflict resolution strategies
- Real-time file monitoring
- Cross-platform support
- Secure OAuth2 authentication

## Build System

- **Build Tool**: esbuild
- **TypeScript**: v4.7.4
- **Watch Mode**: `npm run dev`
- **Production Build**: `npm run build`

## Configuration

### Environment Variables
- `GOOGLE_CLIENT_ID` - OAuth2 Client ID
- `GOOGLE_CLIENT_SECRET` - OAuth2 Client Secret
- `GOOGLE_REDIRECT_URI` - OAuth2 Redirect URI (default: urn:ietf:wg:oauth:2.0:oob)

### Obsidian Plugin Settings
- Auto-sync enabled/disabled
- Sync interval (in seconds)
- Conflict resolution strategy (manual/local/remote)
- Folder ID for Google Drive

## Development Workflow

1. **Feature Development**
   - Make changes in TypeScript files
   - Use `npm run dev` for auto-rebuild
   - Reload plugin in Obsidian (Ctrl+P → Reload app)

2. **Testing**
   - Use a separate test vault
   - Test on Windows, macOS, and iOS if possible
   - Test conflict scenarios manually

3. **Building for Release**
   - Run `npm run build` for production build
   - Test the compiled main.js
   - Tag version in git for CI/CD

## Common Tasks

### Adding a Command
1. Add to `addCommand()` in main.ts
2. Implement callback function
3. Reload plugin to test

### Changing Settings
1. Update `GoogleDriveSyncSettings` interface
2. Update `DEFAULT_SETTINGS` object
3. Add UI in `GoogleDriveSyncSettingTab.display()`

### Modifying Sync Logic
1. Edit `sync/googleDriveSync.ts` for Drive API
2. Edit `sync/conflictResolver.ts` for conflict handling
3. Edit `sync/syncState.ts` for state management

## Testing Checklist

- [ ] Builds without errors (`npm run build`)
- [ ] Plugin loads in Obsidian
- [ ] Settings tab displays correctly
- [ ] Authentication flow works
- [ ] Manual sync completes
- [ ] Auto-sync triggers on timer
- [ ] File changes sync automatically
- [ ] Conflicts are detected
- [ ] Works on Windows
- [ ] Works on macOS
- [ ] Works on iOS (if applicable)

## Debugging

1. **Enable Console**: Ctrl+P → Toggle developer tools
2. **Check Logs**: Open browser console (F12)
3. **Reload Plugin**: Ctrl+P → Reload app
4. **Clear Cache**: Restart Obsidian

## Documentation

- `README.md` - Full user documentation
- `GETTING_STARTED.md` - Quick start guide
- `GOOGLE_DRIVE_SETUP.md` - OAuth2 setup
- `IOS_SETUP.md` - iOS configuration

## Dependencies

### Main Dependencies
- `obsidian` - Obsidian API
- `googleapis` - Google API client
- `google-auth-library` - Google Auth

### Dev Dependencies
- `typescript` - TypeScript compiler
- `esbuild` - Build tool
- `@types/node` - Node.js types
- `builtin-modules` - Built-in module list

## Release Process

1. Update version in manifest.json
2. Update CHANGELOG
3. Commit changes
4. Tag commit: `git tag v1.0.0`
5. Push: `git push --tags`
6. GitHub Actions builds and releases automatically

## Troubleshooting

### Module not found errors
- Run `npm install`
- Check tsconfig.json baseUrl

### Build fails
- Clear node_modules: `rm -rf node_modules`
- Reinstall: `npm install`
- Try production build: `npm run build`

### Plugin not loading
- Check manifest.json is valid JSON
- Verify files are in correct plugin folder
- Reload Obsidian completely
- Check browser console for errors

## Resources

- [Obsidian Plugin Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [Obsidian API Docs](https://docs.obsidian.md/Plugins/Reference/TypeScript+API)
- [Google Drive API Docs](https://developers.google.com/drive/api)
- [OAuth2 Guide](https://developers.google.com/identity/protocols/oauth2)

## Questions or Issues?

- Check the documentation files in this project
- Review GitHub issues and discussions
- Test with minimal changes first
- Use console logging for debugging
