export interface Conflict {
	path: string;
	local: any;
	remote: any;
}

export class ConflictResolver {
	resolveByTimestamp(local: any, remote: any): any {
		if (local.mtime > remote.mtime) {
			return { winner: "local", content: local.content };
		} else if (remote.mtime > local.mtime) {
			return { winner: "remote", content: remote.content };
		}
		// If timestamps are equal, prefer local
		return { winner: "local", content: local.content };
	}

	resolveBySize(local: any, remote: any): any {
		// Prefer the newer version based on content similarity
		if (local.size > remote.size) {
			return { winner: "local", content: local.content };
		}
		return { winner: "remote", content: remote.content };
	}

	mergeContent(local: string, remote: string): string {
		// Simple merge strategy: mark both versions
		const timestamp = new Date().toISOString();
		return `<!-- CONFLICT DETECTED on ${timestamp} -->
<!-- LOCAL VERSION -->
${local}
<!-- END LOCAL VERSION -->

<!-- REMOTE VERSION -->
${remote}
<!-- END REMOTE VERSION -->

<!-- Please resolve this conflict manually and delete the markers -->
`;
	}

	async detectConflicts(
		localFiles: Map<string, any>,
		remoteFiles: Map<string, any>
	): Promise<Conflict[]> {
		const conflicts: Conflict[] = [];

		for (const [path, localFile] of localFiles) {
			const remoteFile = remoteFiles.get(path);
			if (remoteFile && localFile.mtime !== remoteFile.mtime) {
				// Check if content is different
				if (localFile.content !== remoteFile.content) {
					conflicts.push({
						path,
						local: localFile,
						remote: remoteFile,
					});
				}
			}
		}

		return conflicts;
	}

	getConflictSummary(conflict: Conflict): string {
		const localDate = new Date(conflict.local.mtime).toLocaleString();
		const remoteDate = new Date(conflict.remote.mtime).toLocaleString();
		return `Conflict in ${conflict.path}:\nLocal modified: ${localDate}\nRemote modified: ${remoteDate}`;
	}
}
