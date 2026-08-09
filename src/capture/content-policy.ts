import { createHash } from 'node:crypto';
import type { ProtocolInfo } from '../schema/journal-v1.js';

const allowedKeys = new Set(['jsonrpc','id','method','params','result','error','code','message','data','name','arguments','_meta','progressToken','requestId','protocolVersion']);
const sha = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
const safeText = (value: string, max = 256) => [...value].filter((char) => { const code=char.charCodeAt(0); return code>31&&!(code>=127&&code<=159)&&!(code>=0x202a&&code<=0x202e)&&!(code>=0x2066&&code<=0x2069); }).join('').slice(0, max);

export function canonicalIdHash(id: string | number, salt: Buffer): string {
  return `sha256:${sha(Buffer.concat([salt, Buffer.from(JSON.stringify([typeof id, id]))]))}`;
}

function shape(value: unknown, salt: Buffer, depth = 0): unknown {
  if (depth > 100) return 'depth-limit';
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    const bucket = value.length === 0 ? '0' : value.length === 1 ? '1' : value.length <= 10 ? '2-10' : value.length <= 100 ? '11-100' : '101+';
    return { array: [...new Set(value.map((item) => typeof item))].sort(), length: bucket };
  }
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([key, child]) => [allowedKeys.has(key) ? key : `key_sha256:${sha(Buffer.concat([salt, Buffer.from(key)]))}`, shape(child, salt, depth + 1)]));
  }
  return typeof value;
}

export interface FrameMetadata {
  frame: Record<string, unknown>;
  rpc: Record<string, unknown>;
  protocol: ProtocolInfo;
}

export function inspectFrame(bytes: Buffer, content: 'off' | 'full', salt: Buffer, protocol: ProtocolInfo, oversized?: { bytes: number; sha256: string }): FrameMetadata {
  const frame: Record<string, unknown> = { bytes: oversized?.bytes ?? bytes.length, sha256: oversized?.sha256 ?? sha(bytes), encoding: 'utf8', parse_status: 'ok' };
  if (oversized) {
    frame.parse_status = 'oversized';
    return { frame, rpc: { type: 'unknown' }, protocol };
  }
  if (content === 'full') frame.raw_b64 = bytes.toString('base64');
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim(); }
  catch { frame.parse_status = 'invalid_utf8'; return { frame, rpc: { type: 'unknown' }, protocol }; }
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch { frame.parse_status = 'malformed_json'; return { frame, rpc: { type: 'unknown' }, protocol }; }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    frame.parse_status = 'non_object'; return { frame, rpc: { type: 'unknown' }, protocol };
  }
  frame.schema_fingerprint = `sha256:${sha(JSON.stringify(shape(parsed, salt)))}`;
  const obj = parsed as Record<string, any>;
  if (obj.jsonrpc !== '2.0') { frame.parse_status = 'invalid_jsonrpc'; return { frame, rpc: { type: 'unknown' }, protocol }; }
  const validId = typeof obj.id === 'string' || (typeof obj.id === 'number' && Number.isSafeInteger(obj.id));
  let type = 'unknown';
  if (typeof obj.method === 'string' && validId) type = 'request';
  else if (typeof obj.method === 'string' && obj.id === undefined) type = 'notification';
  else if ((Object.hasOwn(obj, 'result') || Object.hasOwn(obj, 'error')) && validId) type = 'response';
  else frame.parse_status = 'invalid_jsonrpc';
  const rpc: Record<string, unknown> = { type };
  if (validId) { rpc.id_type = typeof obj.id; rpc.id_hash = canonicalIdHash(obj.id, salt); }
  if (typeof obj.method === 'string') rpc.method = safeText(obj.method);
  if (obj.method === 'tools/call' && typeof obj.params?.name === 'string') rpc.tool_name = safeText(obj.params.name);
  if (type === 'response') {
    rpc.status = Object.hasOwn(obj, 'error') ? 'error' : 'ok';
    if (obj.error && (typeof obj.error.code === 'number' || typeof obj.error.code === 'string')) rpc.error_code = obj.error.code;
  }
  const token = obj.params?._meta?.progressToken ?? obj.params?.progressToken ?? obj.params?.requestId;
  if (typeof token === 'string' || typeof token === 'number') rpc.progress_token_hash = canonicalIdHash(token, salt);
  return { frame, rpc, protocol };
}

export { safeText };
