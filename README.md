# Obsidian Sync

Sync your Obsidian vault to Google Drive with auto-sync and conflict handling. Desktop and mobile supported.

## What’s included
- Built JS bundle (`main.js`), `manifest.json`, `styles.css`
- Prebuilt release zip: obsidian-sync-v1.0.0.zip (see GitHub Releases)

## Install (manual sideload)
1) Download obsidian-sync-v1.0.0.zip from the [v1.0.0 release](https://github.com/haseebullahkhan/obsidian-sync/releases/tag/v1.0.0).
2) Extract to your vault at `.obsidian/plugins/obsidian-sync/` so the folder contains `main.js`, `manifest.json`, and `styles.css`.
3) In Obsidian: Settings → Community plugins → Enable **Obsidian Sync**.
4) Open the plugin settings and click **Authenticate** to link Google Drive, then run **Sync Now** once.

## Build or repackage (for devs)
- Install deps: `npm install`
- Build: `npm run build`
- Package zip (PowerShell): `Compress-Archive -LiteralPath main.js,manifest.json,styles.css -DestinationPath obsidian-sync-v1.0.0.zip -Force`
- Package zip (bash): `zip -r obsidian-sync-v1.0.0.zip main.js manifest.json styles.css`

## Commands
- Authenticate with Google Drive
- Sync vault with Google Drive now
- View sync status

## Google OAuth setup (desktop flow)
1) Go to Google Cloud Console → create/select a project.
2) Enable **Google Drive API**.
3) Configure OAuth consent screen
	- User type: External (quickest for testing) or Internal if your org allows.
	- App info: Name and support email.
	- Scopes: add `https://www.googleapis.com/auth/drive.file`.
	- Test users: add the Google accounts that will authenticate.
4) Create OAuth client credentials
	- Navigation: **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
	- Application type: **Desktop app**.
	- Download the JSON or note the **Client ID** and **Client Secret**; keep them private.
5) In Obsidian, open plugin settings and click **Authenticate**. Complete the browser flow using the desktop client you created. After success, the plugin stores access/refresh tokens locally.

## Notes
- Keep secrets private; never commit client IDs/secrets.
- First sync of a large vault can take time.
- Conflict policy options: manual (default), prefer local, or prefer remote.

## Support
Issues/feedback: [GitHub](https://github.com/haseebullahkhan/obsidian-sync)
