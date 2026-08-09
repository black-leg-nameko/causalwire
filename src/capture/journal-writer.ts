import { constants, mkdirSync, openSync, writeSync, closeSync, fdatasyncSync, lstatSync } from 'node:fs';
import { dirname } from 'node:path';
import type { JournalRecord } from '../schema/journal-v1.js';

export class JournalWriter {
  private fd: number;
  private bytes = 0;
  private closed = false;
  constructor(readonly path: string, private readonly maxBytes: number, private readonly writeOperation: typeof writeSync = writeSync) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    try { if (lstatSync(path).isSymbolicLink()) throw new Error('Refusing symlink journal target'); } catch (error: any) { if (error.code !== 'ENOENT') throw error; }
    this.fd = openSync(path, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
  }
  append(record: JournalRecord, reserveBytes = 0): void {
    if (this.closed) throw new Error('Journal is closed');
    const line = `${JSON.stringify(record)}\n`;
    const size = Buffer.byteLength(line);
    if (this.bytes + size + reserveBytes > this.maxBytes) throw Object.assign(new Error('Journal size limit reached'), { code: 'EFBIG' });
    this.writeOperation(this.fd, line);
    this.bytes += size;
  }
  close(): void {
    if (this.closed) return;
    try { fdatasyncSync(this.fd); } catch { /* best effort */ }
    closeSync(this.fd); this.closed = true;
  }
}
