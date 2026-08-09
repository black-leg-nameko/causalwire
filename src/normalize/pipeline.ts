import { createReadStream, statSync } from 'node:fs';
import { DEFAULTS, JournalRecordSchema, JOURNAL_SCHEMA, type JournalRecord } from '../schema/journal-v1.js';
import type { DiagnosticDetector, GraphV1, NormalizerPack } from '../schema/graph-v1.js';
import { normalizeMcp, mcpJsonRpcV1 } from './mcp-jsonrpc-v1.js';
import { applyDetectors } from '../diagnose/detectors.js';

export async function* readJournal(path: string): AsyncIterable<JournalRecord> {
  if (path === '-') throw new Error('stdin journal input is reserved and not supported');
  const size=statSync(path).size;if(size>DEFAULTS.maxJournalBytes)throw new Error(`Journal exceeds ${DEFAULTS.maxJournalBytes} byte read limit`);
  let buffer=Buffer.alloc(0);let lineNumber=0;let recordCount=0;
  const parse=(line:Buffer):JournalRecord|undefined=>{if(line.length>DEFAULTS.maxJournalLineBytes)throw new Error(`Journal line exceeds ${DEFAULTS.maxJournalLineBytes} byte limit`);let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(line).replace(/\r$/,'');}catch{throw new Error(`Invalid UTF-8 in journal line ${lineNumber}`);}if(!text.trim())return;let value;try{value=JSON.parse(text)}catch{throw new Error(`Corrupt journal line ${lineNumber}`)}if(value.schema!==JOURNAL_SCHEMA)throw new Error(`Unsupported journal schema at line ${lineNumber}: ${String(value.schema)}`);const parsed=JournalRecordSchema.safeParse(value);if(!parsed.success)throw new Error(`Invalid journal record at line ${lineNumber}`);recordCount++;if(recordCount>DEFAULTS.maxJournalRecords)throw new Error(`Journal exceeds ${DEFAULTS.maxJournalRecords} record limit`);return parsed.data as JournalRecord;};
  for await(const raw of createReadStream(path)){const chunk=Buffer.isBuffer(raw)?raw:Buffer.from(raw);buffer=Buffer.concat([buffer,chunk]);let newline:number;while((newline=buffer.indexOf(0x0a))>=0){lineNumber++;const line=buffer.subarray(0,newline);buffer=buffer.subarray(newline+1);const parsed=parse(line);if(parsed)yield parsed;}if(buffer.length>DEFAULTS.maxJournalLineBytes)throw new Error(`Journal line exceeds ${DEFAULTS.maxJournalLineBytes} byte limit`);}
  // A non-newline-terminated tail is intentionally ignored as crash residue.
}

export interface AnalyzeOptions { mapping?: string; requestTimeoutMs?: number; normalizer?: NormalizerPack; detectors?: DiagnosticDetector[] }
export async function analyzeJournal(path:string,options:AnalyzeOptions={}):Promise<GraphV1>{
  const normalizer=options.normalizer??mcpJsonRpcV1;if(normalizer.id!==(options.mapping??'mcp-jsonrpc@1')&&!options.normalizer)throw new Error(`Unsupported mapping: ${options.mapping}`);
  const graph=normalizer===mcpJsonRpcV1?await normalizeMcp(readJournal(path),options.requestTimeoutMs):await normalizer.normalize(readJournal(path));return applyDetectors(graph,options.detectors);
}
