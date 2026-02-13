import {
	Plugin,
	PluginSettingTab,
	Setting,
	Notice,
	normalizePath,
} from "obsidian";
import type {
	App,
	TFile,
	TFolder,
	ButtonComponent,
	ToggleComponent,
	TextComponent,
	DropdownComponent,
} from "obsidian";
import { GoogleDriveSync, type SyncFile } from "./sync/googleDriveSync";
import { ConflictResolver } from "./sync/conflictResolver";
import { SyncState } from "./sync/syncState";

interface GoogleDriveSyncSettings {
	accessToken: string;
	refreshToken: string;
	folderId: string;
	autoSync: boolean;
	syncInterval: number;
	conflictResolution: "local" | "remote" | "manual";
	lastSyncTime: number;
}

const DEFAULT_SETTINGS: GoogleDriveSyncSettings = {
	accessToken: "",
	refreshToken: "",
	folderId: "",
	autoSync: true,
	syncInterval: 5 * 60 * 1000, // 5 minutes
	conflictResolution: "manual",
	lastSyncTime: 0,
};

export default class GoogleDriveSyncPlugin extends Plugin {
	settings!: GoogleDriveSyncSettings;
	googleDriveSync!: GoogleDriveSync;
	conflictResolver!: ConflictResolver;
	syncState!: SyncState;
	syncInterval: ReturnType<typeof setInterval> | null = null;

	async onload() {
		console.log("Loading Obsidian Sync plugin");

		// Load settings
		await this.loadSettings();

		// Initialize sync components
		this.syncState = new SyncState();
		this.googleDriveSync = new GoogleDriveSync(this.settings, this.app.vault);
		this.conflictResolver = new ConflictResolver();

		// Add command to authenticate
		this.addCommand({
			id: "authenticate-google-drive",
			name: "Authenticate with Google Drive",
			callback: () => this.authenticateWithGoogle(),
		});

		// Add command to sync now
		this.addCommand({
			id: "sync-vault-now",
			name: "Sync vault with Google Drive now",
			callback: () => this.syncNow(),
		});

		// Add command to view sync status
		this.addCommand({
			id: "view-sync-status",
			name: "View sync status",
			callback: () => this.viewSyncStatus(),
		});

		// Add ribbon icon for quick sync
		this.addRibbonIcon("cloud-sync", "Sync with Google Drive", () => {
			this.syncNow();
		});

		// Add settings tab
		this.addSettingTab(new GoogleDriveSyncSettingTab(this.app, this));

		// Start auto-sync if enabled
		if (this.settings.autoSync && this.settings.accessToken) {
			this.startAutoSync();
		}

		// Listen for file changes
		this.registerEvent(
			this.app.vault.on("create", (file: TFile) => {
				if (this.settings.autoSync) {
					this.syncFile(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("modify", (file: TFile) => {
				if (this.settings.autoSync) {
					this.syncFile(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("delete", (file: TFile) => {
				if (this.settings.autoSync) {
					this.deleteFileFromDrive(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on("rename", (file: TFile, oldPath: string) => {
				if (this.settings.autoSync) {
					this.renameFileOnDrive(file, oldPath);
				}
			})
		);
	}

	onunload() {
		console.log("Unloading Obsidian Sync plugin");
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async authenticateWithGoogle() {
		try {
			new Notice("Attempting to authenticate with Google Drive...");
			const { accessToken, refreshToken } = await this.googleDriveSync.authenticate();
			
			this.settings.accessToken = accessToken;
			this.settings.refreshToken = refreshToken;
			await this.saveSettings();

			new Notice("Successfully authenticated with Google Drive!");
			
			// Update Drive sync instance with new tokens
			this.googleDriveSync.setTokens(accessToken, refreshToken);
			
			// Start auto-sync if enabled
			if (this.settings.autoSync) {
				this.startAutoSync();
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error("Authentication failed:", error);
			new Notice(`Authentication failed: ${message}`);
		}
	}

	async syncNow() {
		if (!this.settings.accessToken) {
			new Notice("Please authenticate with Google Drive first!");
			return;
		}

		try {
			new Notice("Starting sync...");
			this.syncState.setStatus("syncing");

			// Get vault files
			const files = await this.getVaultFiles();

			// Compare with Google Drive
			const driveFiles = await this.googleDriveSync.listFiles();
			const { toUpload, toDownload, conflicts } = await this.compareFiles(files, driveFiles);

			// Handle conflicts
			if (conflicts.length > 0 && this.settings.conflictResolution === "manual") {
				new Notice(`Found ${conflicts.length} conflicts. Review in settings.`);
				this.syncState.setConflicts(conflicts);
				return;
			}

			// Upload local changes
			for (const file of toUpload) {
				await this.googleDriveSync.uploadFile(file);
			}

			// Download remote changes
			for (const file of toDownload) {
				await this.googleDriveSync.downloadFile(file);
			}

			// Handle conflicts automatically if configured
			if (conflicts.length > 0) {
				await this.resolveConflicts(conflicts);
			}

			this.settings.lastSyncTime = Date.now();
			await this.saveSettings();

			this.syncState.setStatus("idle");
			new Notice("Sync completed successfully!");
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error("Sync failed:", error);
			this.syncState.setStatus("error", message);
			new Notice(`Sync failed: ${message}`);
		}
	}

	async syncFile(file: TFile) {
		if (!this.settings.accessToken) return;

		try {
			const content = await this.app.vault.read(file);
			await this.googleDriveSync.uploadFile({
				path: file.path,
				name: file.name,
				content: content,
				mtime: file.stat.mtime,
			});
		} catch (error) {
			console.error(`Failed to sync file ${file.path}:`, error);
		}
	}

	async deleteFileFromDrive(file: TFile) {
		if (!this.settings.accessToken) return;

		try {
			await this.googleDriveSync.deleteFile(file.path);
		} catch (error) {
			console.error(`Failed to delete file ${file.path} from Google Drive:`, error);
		}
	}

	async renameFileOnDrive(file: TFile, oldPath: string) {
		if (!this.settings.accessToken) return;

		try {
			await this.googleDriveSync.renameFile(oldPath, file.path);
		} catch (error) {
			console.error(`Failed to rename file on Google Drive:`, error);
		}
	}

	async getVaultFiles(): Promise<SyncFile[]> {
		const files: SyncFile[] = [];
		const traverse = async (folder: TFolder) => {
			for (const entry of folder.children) {
				const maybeFile = entry as TFile & { stat?: { mtime: number; size: number } };
				if (maybeFile.stat && !maybeFile.path.startsWith(".obsidian")) {
					const content = await this.app.vault.read(maybeFile as unknown as TFile);
					files.push({
						path: maybeFile.path,
						name: maybeFile.name,
						content: content,
						mtime: maybeFile.stat.mtime,
						size: maybeFile.stat.size,
					});
				} else {
					await traverse(entry as TFolder);
				}
			}
		};
		await traverse(this.app.vault.getRoot() as unknown as TFolder);
		return files;
	}

	async compareFiles(localFiles: SyncFile[], remoteFiles: SyncFile[]) {
		const toUpload: SyncFile[] = [];
		const toDownload: SyncFile[] = [];
		const conflicts: Array<{ path: string; local: SyncFile; remote: SyncFile }> = [];

		const localMap = new Map(localFiles.map((f) => [f.path, f]));
		const remoteMap = new Map(remoteFiles.map((f) => [f.path, f]));

		// Find files to upload
		for (const [path, localFile] of localMap) {
			const remoteFile = remoteMap.get(path);
			if (!remoteFile) {
				toUpload.push(localFile);
			} else if (localFile.mtime > remoteFile.mtime) {
				if (this.settings.conflictResolution === "local") {
					toUpload.push(localFile);
				} else if (this.settings.conflictResolution === "manual") {
					conflicts.push({ path, local: localFile, remote: remoteFile });
				}
			}
		}

		// Find files to download
		for (const [path, remoteFile] of remoteMap) {
			const localFile = localMap.get(path);
			if (!localFile) {
				toDownload.push(remoteFile);
			} else if (remoteFile.mtime > localFile.mtime) {
				if (this.settings.conflictResolution === "remote") {
					toDownload.push(remoteFile);
				} else if (this.settings.conflictResolution === "manual") {
					conflicts.push({ path, local: localFile, remote: remoteFile });
				}
			}
		}

		return { toUpload, toDownload, conflicts };
	}

	async resolveConflicts(conflicts: Array<{ path: string; local: SyncFile; remote: SyncFile }>) {
		for (const conflict of conflicts) {
			const resolution = this.settings.conflictResolution;
			
			if (resolution === "local") {
				await this.googleDriveSync.uploadFile(conflict.local);
			} else if (resolution === "remote") {
				await this.googleDriveSync.downloadFile(conflict.remote);
			}
		}
	}

	viewSyncStatus() {
		const status = this.syncState.getStatus();
		const lastSync = new Date(this.settings.lastSyncTime).toLocaleString();
		new Notice(
			`Sync Status: ${status}\nLast sync: ${lastSync}\nAuto-sync: ${
				this.settings.autoSync ? "Enabled" : "Disabled"
			}`
		);
	}

	startAutoSync() {
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
		}

		this.syncInterval = setInterval(() => {
			this.syncNow();
		}, this.settings.syncInterval);

		console.log(`Auto-sync started with interval: ${this.settings.syncInterval}ms`);
	}

	stopAutoSync() {
		if (this.syncInterval) {
			clearInterval(this.syncInterval);
			this.syncInterval = null;
		}
	}
}

class GoogleDriveSyncSettingTab extends PluginSettingTab {
	plugin: GoogleDriveSyncPlugin;

	constructor(app: App, plugin: GoogleDriveSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Authenticate")
			.setDesc("Authenticate with Google Drive to enable syncing")
			.addButton((button: ButtonComponent) =>
				button
					.setButtonText("Authenticate")
					.setCta()
					.onClick(() => {
						this.plugin.authenticateWithGoogle();
					})
			);

		new Setting(containerEl)
			.setName("Auto-sync enabled")
			.setDesc("Automatically sync your vault with Google Drive")
			.addToggle((toggle: ToggleComponent) =>
				toggle.setValue(this.plugin.settings.autoSync).onChange(async (value: boolean) => {
					this.plugin.settings.autoSync = value;
					await this.plugin.saveSettings();

					if (value && this.plugin.settings.accessToken) {
						this.plugin.startAutoSync();
					} else {
						this.plugin.stopAutoSync();
					}
				})
			);

		new Setting(containerEl)
			.setName("Sync interval")
			.setDesc("Time in seconds between automatic syncs (minimum 60)")
			.addText((text: TextComponent) =>
				text
					.setPlaceholder("300")
					.setValue((this.plugin.settings.syncInterval / 1000).toString())
					.onChange(async (value: string) => {
						const seconds = parseInt(value, 10) * 1000;
						if (seconds >= 60000) {
							this.plugin.settings.syncInterval = seconds;
							await this.plugin.saveSettings();
							if (this.plugin.settings.autoSync) {
								this.plugin.startAutoSync();
							}
						}
					})
			);

		new Setting(containerEl)
			.setName("Conflict resolution")
			.setDesc("How to handle conflicting changes")
			.addDropdown((dropdown: DropdownComponent) =>
				dropdown
					.addOption("manual", "Manual review")
					.addOption("local", "Prefer local changes")
					.addOption("remote", "Prefer remote changes")
					.setValue(this.plugin.settings.conflictResolution)
					.onChange(async (value: string) => {
						const resolution = value as "manual" | "local" | "remote";
						this.plugin.settings.conflictResolution = resolution;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Sync now")
			.setDesc("Manually trigger a sync with Google Drive")
			.addButton((button: ButtonComponent) =>
				button
					.setButtonText("Sync Now")
					.onClick(() => {
						this.plugin.syncNow();
					})
			);

		new Setting(containerEl)
			.setName("Last sync")
			.setDesc(
				this.plugin.settings.lastSyncTime
					? new Date(this.plugin.settings.lastSyncTime).toLocaleString()
					: "Never"
			);
	}
}
