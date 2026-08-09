import { createHash, type Hash } from 'node:crypto';

export interface DecodedFrame { bytes: Buffer; parseStatus: 'candidate' | 'oversized'; totalBytes: number; sha256: string }

export class FrameDecoder {
  private parts: Buffer[] = [];
  private retainedBytes = 0;
  private totalBytes = 0;
  private hash: Hash = createHash('sha256');
  constructor(private readonly maxBytes: number) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('Frame limit must be a positive safe integer');
  }

  private accept(segment: Buffer): void {
    this.hash.update(segment);
    this.totalBytes += segment.length;
    const remaining = Math.max(0, this.maxBytes + 1 - this.retainedBytes);
    if (remaining) {
      const retained = Buffer.from(segment.subarray(0, remaining));
      this.parts.push(retained);
      this.retainedBytes += retained.length;
    }
  }

  private finish(): DecodedFrame {
    const result = {
      bytes: Buffer.concat(this.parts, this.retainedBytes),
      parseStatus: this.totalBytes > this.maxBytes ? 'oversized' as const : 'candidate' as const,
      totalBytes: this.totalBytes,
      sha256: this.hash.digest('hex'),
    };
    this.parts = []; this.retainedBytes = 0; this.totalBytes = 0; this.hash = createHash('sha256');
    return result;
  }

  push(chunk: Buffer): DecodedFrame[] {
    const out: DecodedFrame[] = [];
    let offset = 0;
    while (offset < chunk.length) {
      const newline = chunk.indexOf(0x0a, offset);
      const end = newline >= 0 ? newline + 1 : chunk.length;
      this.accept(chunk.subarray(offset, end));
      offset = end;
      if (newline >= 0) out.push(this.finish());
    }
    return out;
  }

  end(): DecodedFrame[] {
    return this.totalBytes ? [this.finish()] : [];
  }
}
