import type { JournalRecord } from '../schema/journal-v1.js';

export interface MatchedExchange { request: JournalRecord; response: JournalRecord }

export class LiveCorrelator {
  private inflight = new Map<string, JournalRecord>();
  accept(record: JournalRecord): MatchedExchange | undefined {
    const rpc = record.rpc as Record<string, any> | undefined;
    if (!rpc?.id_hash) return;
    if (rpc.type === 'request') {
      this.inflight.set(`${record.direction}:${rpc.id_hash}`, record);
      return;
    }
    if (rpc.type === 'response') {
      const opposite = record.direction === 'client_to_server' ? 'server_to_client' : 'client_to_server';
      const key = `${opposite}:${rpc.id_hash}`;
      const request = this.inflight.get(key);
      if (request) { this.inflight.delete(key); return { request, response: record }; }
    }
  }
}
