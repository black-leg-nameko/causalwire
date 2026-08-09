import { z } from 'zod';

export const JOURNAL_SCHEMA = 'causalwire.journal/v1' as const;
export const GRAPH_SCHEMA = 'causalwire.graph/v1' as const;
export const DEFAULTS = Object.freeze({
  content: 'off' as const,
  mapping: 'mcp-jsonrpc@1',
  requestTimeoutMs: 30_000,
  maxFrameBytes: 16 * 1024 * 1024,
    maxJournalBytes: 512 * 1024 * 1024,
    maxJournalLineBytes: 32 * 1024 * 1024,
    maxJournalRecords: 100_100,
    maxGraphNodes: 100_000,
});

const common = {
  schema: z.literal(JOURNAL_SCHEMA),
  run_id: z.string().min(1).max(256),
  seq: z.number().int().nonnegative().safe(),
  kind: z.string().min(1).max(64),
  ts_wall: z.string().min(1).max(128),
  ts_mono_ns: z.string().regex(/^\d{1,40}$/),
};

export const JournalRecordSchema = z.object(common).passthrough();
export type JournalRecord = z.infer<typeof JournalRecordSchema> & Record<string, any>;

export interface JournalHeader extends JournalRecord {
  kind: 'run_start';
  content_policy: 'off' | 'full';
}

export interface ProtocolInfo {
  name: 'mcp';
  transport: 'stdio';
  version: string;
  version_source: 'cli' | 'wire' | 'unknown';
}

export function protocolInfo(version = 'unknown', source: ProtocolInfo['version_source'] = 'unknown'): ProtocolInfo {
  return { name: 'mcp', transport: 'stdio', version, version_source: source };
}
