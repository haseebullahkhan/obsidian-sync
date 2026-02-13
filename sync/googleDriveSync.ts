import { google } from "googleapis";
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
	private vault: App["vault"];

	constructor(settings: any, vault: App["vault"]) {
		this.vault = vault;
		this.accessToken = settings.accessToken;
		this.refreshToken = settings.refreshToken;
		this.folderId = settings.folderId;

		// Initialize OAuth2 client
		const env = typeof process !== "undefined" ? process.env : undefined;
		this.oauth2Client = new google.auth.OAuth2(
			env?.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID.apps.googleusercontent.com",
			env?.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
			env?.GOOGLE_REDIRECT_URI || "urn:ietf:wg:oauth:2.0:oob"
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
		const authUrl = this.oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: [
				"https://www.googleapis.com/auth/drive",
				"https://www.googleapis.com/auth/drive.file",
			],
		});

		console.log("Please visit this URL to authorize the application:");
		console.log(authUrl);

		// For browser environment, we would open the URL
		// For now, we'll throw an error with the URL
		throw new Error(
			`Please visit this URL to authorize: ${authUrl}\n\nAfter authorization, you'll get a code. Use that code to complete authentication.`
		);
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
