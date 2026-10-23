# Backup and restore design

Status: implementation approved in the maintainer conversation on 2026-10-22.

## User contract

Export all four data categories into a portable, versioned JSON file. Selecting a file only validates and previews it. Restore replaces the complete dataset only after explicit confirmation. Invalid files, stale previews and failed writes must leave the previous dataset intact. All processing stays in the browser; downloaded files contain private, unencrypted records.

This first version supports full replacement, not merging. Current records do not carry enough revision information to infer which conflicting imported value is newer. No accounts, cloud upload, tracking or new dependencies are required.

## Storage and compatibility

The four original `osc:*` keys remain readable and are never deleted or rewritten during migration. Before the first successful edit or restore, the application reads those legacy records without writing anything. A successful write creates a versioned canonical snapshot at `osc:state`. One `localStorage.setItem` is the commit point for all four data categories.

The snapshot carries a schema version, an opaque revision, a restore generation and a fingerprint of the retained legacy values. All new-version edits and restores use the same Web Lock. Ordinary functional edits reread the latest state inside that lock. Restore requires the exact revision shown in its preview. A restored generation rejects edits queued from an older view.

Old application windows cannot participate in the new lock. Changes to legacy keys after migration are detected and block further writes while preserving both copies. Close old application windows before upgrading; automatic reconciliation with old code is not promised. Unsupported schema versions and unreadable data are preserved and block editing. Browsers without the secure-context APIs needed for coordinated writes are read-only; export remains available when data can be read.

The snapshot is a local commit mechanism, not an independent backup. Clearing website data can remove every local copy. Users must keep exported files outside browser storage. Migrating retains originals and therefore needs extra space; a quota error must not delete them to make room.

## Backup format and import boundary

The file has an application marker, format version 1, export timestamp and `data` containing entries, places, partner and settings. Storage revisions and legacy fingerprints are never imported from a file. Limit files to 2 MiB before reading; validate nested structures, calendar dates, enum values, timestamps and unique place IDs. Unknown versions and properties are rejected rather than silently discarded. Text stays text; no HTML or commands are executed.

The current legacy storage is treated as the migration source, not as an invented historical export format. Versioned file fixtures document the public interchange format for future releases.

## Interface

Add a data section to Settings using existing components and theme tokens. Export downloads a file. Import shows incoming and existing record counts, date range and the replacement consequence. An explicit acknowledgement enables restore; cancellation writes nothing. Errors and completion are announced accessibly. File-reading races must not revive a cancelled or superseded preview. Recoverability controls must remain reachable when ordinary editing is blocked.

## Verification

- A complete fictional dataset round-trips into a fresh browser context.
- File selection, preview and cancellation cause no storage writes.
- Corrupt, oversized, unknown-version and invalid-data files are rejected.
- Injected failure at the snapshot commit leaves original bytes unchanged, including after reload.
- Legacy records remain readable and are retained after a successful migration.
- Concurrent edits preserve both changes; an edit after preview prevents stale restore.
- Restore-generation checks reject pending edits from an older view.
- Changes made by old application code are detected without deleting either dataset.
- Production offline navigation, storage and backup/restore continue working.
- Settings controls work at a narrow viewport and with keyboard navigation.

Run `npm run check` and report observed results. Browser tests do not establish iOS hardware behavior or guarantee recovery after disk failure, user deletion or a lost backup file.

## Implementation order

1. Write and run failing format and browser tests.
2. Implement strict format parsing and summary functions.
3. Implement the snapshot store, lock coordination and React provider integration.
4. Add settings export, preview and confirmation controls.
5. Run the targeted failure/concurrency checks, then the full repository check.
6. Update both READMEs and the maintenance/security documentation with verified behavior and limits.
