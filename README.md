# Obsidian Sync

Sync your Obsidian vault to Google Drive with auto-sync and conflict handling. Desktop and mobile supported.

## What’s included
- Built JS bundle (`main.js`), `manifest.json`, `styles.css`
- Prebuilt release zip: obsidian-sync-v1.0.0.zip (see GitHub Releases)

## Install (manual sideload)
1) Download obsidian-sync-v1.0.0.zip from the [v1.0.0 release](https://github.com/haseebullahkhan/obsidian-sync/releases/tag/v1.0.0).
2) Extract; you’ll get a folder named `obsidian-sync` containing `main.js`, `manifest.json`, and `styles.css`. Place that folder at `.obsidian/plugins/` in your vault.
3) In Obsidian: Settings → Community plugins → Enable **Obsidian Sync**.
4) In plugin settings, paste your Google **Client ID** and **Client Secret** (Desktop app client).
5) Click **Authenticate**. A code + verification URL appears; open the URL in your browser, enter the code, and wait for the plugin to finish. Then run **Sync Now** once.

## Build or repackage (for devs)
- Install deps: `npm install`
- Build: `npm run build`
- Package with folder root (PowerShell):
	- `Remove-Item -Recurse -Force obsidian-sync -ErrorAction SilentlyContinue; mkdir obsidian-sync` 
	- `Copy-Item main.js,manifest.json,styles.css -Destination obsidian-sync`
	- `Compress-Archive -Path obsidian-sync -DestinationPath obsidian-sync-v1.0.0.zip -Force`
- Package with folder root (bash):
	- `rm -rf obsidian-sync && mkdir obsidian-sync`
	- `cp main.js manifest.json styles.css obsidian-sync/`
	- `zip -r obsidian-sync-v1.0.0.zip obsidian-sync`

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
	- Application type: **Desktop app** (Google auto-assigns a loopback redirect; no extra URLs needed).
	- Download the JSON or note the **Client ID** and **Client Secret**; keep them private.
5) In Obsidian plugin settings, paste the Client ID and Client Secret.
6) Click **Authenticate**. You’ll get a verification URL and code. Open the URL in a browser, enter the code, and keep Obsidian open while the plugin finishes the device flow. Tokens are stored locally.

## Notes
- Keep secrets private; never commit client IDs/secrets.
- First sync of a large vault can take time.
- Conflict policy options: manual (default), prefer local, or prefer remote.

## Support
Issues/feedback: [GitHub](https://github.com/haseebullahkhan/obsidian-sync)
