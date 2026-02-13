# Obsidian Sync

Sync your Obsidian vault to Google Drive with auto-sync and basic conflict handling. Works on desktop and mobile.

## Install (manual sideload)
1) Build is already included (main.js in repo). To rebuild yourself: `npm install && npm run build`.
2) Use the packaged zip (obsidian-sync-1.0.0.zip) or copy `main.js`, `manifest.json`, and `styles.css` into your vault at `.obsidian/plugins/obsidian-sync/`.
3) In Obsidian: Settings → Community plugins → Enable “Obsidian Sync”.
4) Open the plugin settings and click **Authenticate** to link Google Drive.

## Package for distribution
- Build artifacts: `npm run build` (main.js).
- Create zip: `Compress-Archive -LiteralPath main.js,manifest.json,styles.css -DestinationPath obsidian-sync-1.0.0.zip -Force` (PowerShell) or `zip -r obsidian-sync-1.0.0.zip main.js manifest.json styles.css`.
- BRAT/side-load: point to the repo root (with built files) or to the zip in a GitHub release.

## Commands
- Authenticate with Google Drive
- Sync vault with Google Drive now
- View sync status

## How to get Google credentials (OAuth)
1) Go to Google Cloud Console → create (or pick) a project.
2) Enable **Google Drive API**.
3) Create **OAuth 2.0 Client ID** → Application type: **Desktop app**.
4) Copy the **Client ID** and **Client Secret**. Keep them private.
5) In Obsidian plugin settings, click **Authenticate** and complete the OAuth flow using these values.

## Notes
- Keep `.env` local; never commit secrets.
- Requires internet; large vaults may take time on first sync.
- Conflict policy: manual (default), prefer local, or prefer remote.

## Support
Issues/feedback: [GitHub](https://github.com/haseebullahkhan/obsidian-sync)
