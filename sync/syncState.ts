export type SyncStatus = "idle" | "syncing" | "error" | "paused";

export interface SyncStatusInfo {
	status: SyncStatus;
	error?: string;
	lastSync?: number;
	filesChanged?: number;
}

export class SyncState {
	private status: SyncStatus = "idle";
	private error: string | undefined;
	private conflicts: any[] = [];
	private syncHistory: SyncStatusInfo[] = [];

	getStatus(): SyncStatus {
		return this.status;
	}

	setStatus(status: SyncStatus, error?: string) {
		this.status = status;
		this.error = error;

		const info: SyncStatusInfo = {
			status,
			error,
			lastSync: Date.now(),
		};

		this.syncHistory.push(info);
		// Keep only last 50 sync records
		if (this.syncHistory.length > 50) {
			this.syncHistory.shift();
		}
	}

	getError(): string | undefined {
		return this.error;
	}

	setConflicts(conflicts: any[]) {
		this.conflicts = conflicts;
	}

	getConflicts(): any[] {
		return this.conflicts;
	}

	getSyncHistory(): SyncStatusInfo[] {
		return this.syncHistory;
	}

	clearHistory() {
		this.syncHistory = [];
		this.conflicts = [];
	}

	getLastSyncInfo(): SyncStatusInfo | undefined {
		return this.syncHistory[this.syncHistory.length - 1];
	}
}
