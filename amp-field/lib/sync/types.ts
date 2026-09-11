/**
 * Shared shape for locally editable records (§60).
 *
 * Phase 0 only defines the contract — the queue itself lands with the first
 * offline-capable feature in Phase 1.
 */

export const SYNC_STATUSES = ['local_only', 'syncing', 'synced', 'failed'] as const;

export type SyncStatus = (typeof SYNC_STATUSES)[number];

export type SyncMetadata = {
  /** Stable client-generated identifier, present before the server sees it. */
  readonly localId: string;
  /** Server identifier, null until the record has been accepted. */
  readonly serverId: string | null;
  readonly syncStatus: SyncStatus;
  /** ISO timestamp of the last local edit. */
  readonly lastLocalChange: string;
  /** ISO timestamp of the last successful server round-trip. */
  readonly lastServerSync: string | null;
};
