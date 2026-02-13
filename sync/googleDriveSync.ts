import { google } from "googleapis";
import { Notice } from "obsidian";
import type { App } from "obsidian";

export interface SyncFile {
	path: string;
	name: string;
	content: string;
	mtime: number;
	size?: number;
}

export class GoogleDriveSync {
	private oauth2Client: any;
	private drive: any;
	private accessToken: string;
	private refreshToken: string;
	private folderId: string;
	private clientId: string;
	private clientSecret: string;
	private vault: App["vault"];

	constructor(settings: any, vault: App["vault"]) {
		this.vault = vault;
		this.accessToken = settings.accessToken;
		this.refreshToken = settings.refreshToken;
		this.folderId = settings.folderId || "root";
		this.clientId = settings.clientId || "";
		this.clientSecret = settings.clientSecret || "";

		// Initialize OAuth2 client (redirect not used for device flow)
		this.oauth2Client = new google.auth.OAuth2(
			this.clientId || "placeholder",
			this.clientSecret || "placeholder",
			"urn:ietf:wg:oauth:2.0:oob"
		);

		if (this.accessToken) {
			this.oauth2Client.setCredentials({
				access_token: this.accessToken,
				refresh_token: this.refreshToken,
			});
			this.drive = google.drive({ version: "v3", auth: this.oauth2Client });
		}
	}

	async authenticate(): Promise<{ accessToken: string; refreshToken: string }> {
		if (!this.clientId || !this.clientSecret) {
			throw new Error("Set Client ID and Client Secret in settings before authenticating.");
		}

		const scope = "https://www.googleapis.com/auth/drive.file";
		const deviceParams = new URLSearchParams({
			client_id: this.clientId,
			scope,
		});

		const deviceResp = await fetch("https://oauth2.googleapis.com/device/code", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: deviceParams.toString(),
		});

		if (!deviceResp.ok) {
			throw new Error("Failed to start device authorization.");
		}

		const deviceData = await deviceResp.json();
		const { device_code, user_code, verification_url, interval = 5 } = deviceData;

		new Notice(
			`Open ${verification_url}\nEnter code: ${user_code}\nKeep this window open; polling for completion...`,
			30000
		);

		// Poll token endpoint until authorized
		const pollParams = () =>
			new URLSearchParams({
				client_id: this.clientId,
				client_secret: this.clientSecret,
				device_code,
				grant_type: "urn:ietf:params:oauth:grant-type:device_code",
			});

		const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
		let currentInterval = interval * 1000;

		while (true) {
			await wait(currentInterval);

			const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: pollParams().toString(),
			});

			const tokenData = await tokenResp.json();

			if (tokenResp.ok) {
				this.accessToken = tokenData.access_token;
				this.refreshToken = tokenData.refresh_token;

				this.oauth2Client.setCredentials({
					access_token: this.accessToken,
					refresh_token: this.refreshToken,
				});
				this.drive = google.drive({ version: "v3", auth: this.oauth2Client });

				new Notice("Google Drive authenticated.");
				return {
					accessToken: this.accessToken,
					refreshToken: this.refreshToken,
				};
			}

			if (tokenData.error === "authorization_pending") {
				continue;
			}

			if (tokenData.error === "slow_down") {
				currentInterval += 2000;
				continue;
			}

			throw new Error(tokenData.error_description || "Authorization failed.");
		}
	}

	async handleAuthorizationCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
		try {
			const { tokens } = await this.oauth2Client.getToken(code);
			this.accessToken = tokens.access_token;
			this.refreshToken = tokens.refresh_token;

			this.oauth2Client.setCredentials(tokens);
			this.drive = google.drive({ version: "v3", auth: this.oauth2Client });

			return {
				accessToken: this.accessToken,
				refreshToken: this.refreshToken,
			};
		} catch (error) {
			console.error("Error getting tokens:", error);
			throw error;
		}
	}

	setTokens(accessToken: string, refreshToken: string) {
		this.accessToken = accessToken;
		this.refreshToken = refreshToken;
		this.oauth2Client.setCredentials({
			access_token: accessToken,
			refresh_token: refreshToken,
		});
		this.drive = google.drive({ version: "v3", auth: this.oauth2Client });
	}

	setFolderId(folderId: string) {
		this.folderId = folderId || "root";
	}

	setClientCredentials(clientId: string, clientSecret: string) {
		this.clientId = clientId || "";
		this.clientSecret = clientSecret || "";
		this.oauth2Client = new google.auth.OAuth2(
			this.clientId || "placeholder",
			this.clientSecret || "placeholder",
			"urn:ietf:wg:oauth:2.0:oob"
		);
		if (this.accessToken) {
			this.oauth2Client.setCredentials({
				access_token: this.accessToken,
				refresh_token: this.refreshToken,
			});
			this.drive = google.drive({ version: "v3", auth: this.oauth2Client });
		}
	}

	async listFiles(): Promise<SyncFile[]> {
		if (!this.drive) {
			throw new Error("Not authenticated with Google Drive");
		}

		try {
			const files = [];
			let pageToken = "";

			do {
				const response = await this.drive.files.list({
					q: `'${this.folderId}' in parents and trashed = false`,
					fields:
						"files(id, name, mimeType, modifiedTime, size, webContentLink)",
					pageSize: 1000,
					pageToken: pageToken,
				});

				const driveFiles = response.data.files || [];

				for (const file of driveFiles) {
					if (file.mimeType !== "application/vnd.google-apps.folder") {
						const content = await this.downloadFileContent(file.id);
						files.push({
							path: file.name,
							name: file.name,
							content: content,
							mtime: new Date(file.modifiedTime).getTime(),
							size: parseInt(file.size),
						});
					}
				}

				pageToken = response.data.nextPageToken;
			} while (pageToken);

			return files;
		} catch (error) {
			console.error("Error listing files:", error);
			throw error;
		}
	}

	async uploadFile(file: SyncFile): Promise<void> {
		if (!this.drive) {
			throw new Error("Not authenticated with Google Drive");
		}

		try {
			// Check if file exists
			const existingFile = await this.findFileByPath(file.path);

			if (existingFile) {
				// Update existing file
				await this.drive.files.update({
					fileId: existingFile.id,
					media: {
						mimeType: this.getMimeType(file.name),
						body: file.content,
					},
				});
				console.log(`Updated file on Google Drive: ${file.path}`);
			} else {
				// Create new file
				await this.drive.files.create({
					requestBody: {
						name: file.path,
						parents: [this.folderId],
						mimeType: this.getMimeType(file.name),
					},
					media: {
						mimeType: this.getMimeType(file.name),
						body: file.content,
					},
					fields: "id",
				});
				console.log(`Created file on Google Drive: ${file.path}`);
			}
		} catch (error) {
			console.error(`Error uploading file ${file.path}:`, error);
			throw error;
		}
	}

	async downloadFile(file: SyncFile): Promise<void> {
		if (!this.drive) {
			throw new Error("Not authenticated with Google Drive");
		}

		try {
			// Create or update the file in the vault
			await this.vault.adapter.write(file.path, file.content);
			console.log(`Downloaded file from Google Drive: ${file.path}`);
		} catch (error) {
			console.error(`Error downloading file ${file.path}:`, error);
			throw error;
		}
	}

	async deleteFile(path: string): Promise<void> {
		if (!this.drive) {
			throw new Error("Not authenticated with Google Drive");
		}

		try {
			const file = await this.findFileByPath(path);
			if (file) {
				await this.drive.files.delete({
					fileId: file.id,
				});
				console.log(`Deleted file from Google Drive: ${path}`);
			}
		} catch (error) {
			console.error(`Error deleting file ${path}:`, error);
			throw error;
		}
	}

	async renameFile(oldPath: string, newPath: string): Promise<void> {
		if (!this.drive) {
			throw new Error("Not authenticated with Google Drive");
		}

		try {
			const file = await this.findFileByPath(oldPath);
			if (file) {
				await this.drive.files.update({
					fileId: file.id,
					requestBody: {
						name: newPath,
					},
				});
				console.log(`Renamed file on Google Drive: ${oldPath} -> ${newPath}`);
			}
		} catch (error) {
			console.error(`Error renaming file:`, error);
			throw error;
		}
	}

	private async findFileByPath(path: string): Promise<any> {
		try {
			const response = await this.drive.files.list({
				q: `'${this.folderId}' in parents and name = '${path}' and trashed = false`,
				fields: "files(id, name)",
				pageSize: 1,
			});

			const files = response.data.files || [];
			return files.length > 0 ? files[0] : null;
		} catch (error) {
			console.error("Error finding file:", error);
			return null;
		}
	}

	private async downloadFileContent(fileId: string): Promise<string> {
		try {
			const response = await this.drive.files.get({
				fileId: fileId,
				alt: "media",
			});
			return response.data;
		} catch (error) {
			console.error("Error downloading file content:", error);
			return "";
		}
	}

	private getMimeType(filename: string): string {
		const ext = filename.split(".").pop()?.toLowerCase();
		const mimeTypes: { [key: string]: string } = {
			md: "text/markdown",
			txt: "text/plain",
			json: "application/json",
			yaml: "application/x-yaml",
			yml: "application/x-yaml",
			pdf: "application/pdf",
			png: "image/png",
			jpg: "image/jpeg",
			jpeg: "image/jpeg",
			gif: "image/gif",
		};
		return mimeTypes[ext || ""] || "application/octet-stream";
	}
}
