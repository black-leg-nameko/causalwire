import { DEFAULTS, type JournalHeader, type JournalRecord } from '../schema/journal-v1.js';
import type { Diagnostic, GraphEdge, GraphNode, GraphV1, NormalizerPack } from '../schema/graph-v1.js';
import { selectFirstBreak } from '../diagnose/first-break.js';

const names: Record<string,string> = { D001:'malformed_frame', D002:'duplicate_inflight_id', D003:'orphan_response', D004:'stuck_request', D005:'missing_response', D006:'orphan_progress', D007:'protocol_version_conflict', D008:'protocol_version_unknown', D009:'capture_truncated', D010:'tool_error' };
const message: Record<string,string> = { D001:'Frame is not a valid JSON-RPC object.', D002:'Request ID is already in flight in this direction.', D003:'Response has no matching request in the opposite direction.', D004:'Request exceeded the live analysis timeout.', D005:'Run ended before a matching response arrived.', D006:'Progress notification has no explicit matching request.', D009:'Capture is incomplete.', D010:'The matched JSON-RPC response contains an application error.' };
const diag = (code: string, sourceSeq: number, nodeId: string, severity: 'warning'|'error' = code === 'D006' ? 'warning' : 'error'): Diagnostic => ({ code, name: names[code], severity, sourceSeq, nodeId, message: message[code] ?? names[code] });

export async function normalizeMcp(records: AsyncIterable<JournalRecord>, requestTimeoutMs: number = DEFAULTS.requestTimeoutMs): Promise<GraphV1> {
  const all: JournalRecord[] = []; for await (const record of records) {
    const base={schema:record.schema,run_id:record.run_id,seq:record.seq,kind:record.kind,ts_wall:record.ts_wall,ts_mono_ns:record.ts_mono_ns};
    if(record.kind==='run_start')all.push({...base,content_policy:record.content_policy,protocol:record.protocol});
    else if(record.kind==='run_end')all.push({...base,capture_complete:record.capture_complete});
    else if(record.kind==='wire')all.push({...base,direction:record.direction,frame:record.frame&&{bytes:record.frame.bytes,parse_status:record.frame.parse_status},rpc:record.rpc&&{type:record.rpc.type,id_hash:record.rpc.id_hash,method:record.rpc.method,tool_name:record.rpc.tool_name,status:record.rpc.status,progress_token_hash:record.rpc.progress_token_hash},protocol:record.protocol&&{version:record.protocol.version}});
    else if(record.kind==='capture_truncated'||record.kind==='capture_diagnostic')all.push({...base,code:record.code,at_seq:record.at_seq});
    else all.push(base);
  }
  const header = all.find((r) => r.kind === 'run_start') as JournalHeader | undefined;
  if (!header) throw new Error('Journal has no run_start record');
  if(header.content_policy!=='off'&&header.content_policy!=='full')throw new Error('Journal run_start has an invalid content policy');
  const runEnd = all.find((r) => r.kind === 'run_end');
  const nodes: GraphNode[] = [{ id:`run:${header.run_id}`, kind:'run', sourceSeq:header.seq, synthetic:false, status:runEnd ? 'ok':'pending', bytes:0, protocolVersion:header.protocol?.version ?? 'unknown' }];
  const edges: GraphEdge[] = []; const diagnostics: Diagnostic[] = [];
  const inflight = new Map<string, { record: JournalRecord; node: GraphNode }>();
  const ambiguous = new Set<string>();
  const knownIds = new Map<string, { record: JournalRecord; node: GraphNode }>();
  const newestNs = all.reduce((max,r) => { try { const n=BigInt(r.ts_mono_ns); return n>max?n:max; } catch { return max; } }, 0n);
  for (const record of all.filter((r) => r.kind === 'wire').sort((a,b) => a.seq-b.seq)) {
    if (nodes.length >= DEFAULTS.maxGraphNodes) throw new Error(`Graph exceeds ${DEFAULTS.maxGraphNodes} node limit`);
    const rpc = record.rpc ?? {}; const frame = record.frame ?? {}; const proto = typeof record.protocol?.version==='string'?record.protocol.version.slice(0,128):'unknown';
    const kind: GraphNode['kind'] = rpc.type === 'request' ? 'rpc_request' : rpc.type === 'response' ? 'rpc_response' : rpc.type === 'notification' ? 'rpc_notification' : 'unknown_frame';
    const boundedText=(value:unknown)=>typeof value==='string'?value.slice(0,256):undefined;const rawBytes=Number(frame.bytes??0);const node: GraphNode = { id:`wire:${record.seq}`, kind, sourceSeq:record.seq, synthetic:false, method:boundedText(rpc.method), toolName:boundedText(rpc.tool_name), status: rpc.type === 'response' ? (rpc.status === 'error' ? 'error':'ok') : rpc.type === 'unknown' ? 'invalid':'pending', bytes:Number.isSafeInteger(rawBytes)&&rawBytes>=0?rawBytes:0, protocolVersion:proto };
    nodes.push(node);
    if (frame.parse_status !== 'ok' || rpc.type === 'unknown') { diagnostics.push(diag('D001', record.seq, node.id)); node.status='invalid'; continue; }
    const hash = rpc.id_hash as string | undefined;
    if (rpc.type === 'request' && hash) {
      const key = `${record.direction}:${hash}`;
      if (inflight.has(key)) {
        ambiguous.add(key);
        diagnostics.push(diag('D002', record.seq, node.id)); node.status='error';
        const synthetic: GraphNode = { id:`synthetic:ambiguous:${record.seq}`, kind:'rpc_response', sourceSeq:record.seq, synthetic:true, status:'missing', bytes:0, protocolVersion:proto };
        nodes.push(synthetic); edges.push({ id:`edge:duplicate:${record.seq}`, from:node.id, to:synthetic.id, kind:'responds_to', causal:true, confidence:'explicit', sourceSeqs:[record.seq], status:'broken' });
      } else { inflight.set(key,{record,node}); knownIds.set(hash,{record,node}); }
    } else if (rpc.type === 'response' && hash) {
      const opposite = record.direction === 'client_to_server' ? 'server_to_client':'client_to_server'; const key=`${opposite}:${hash}`; const request=inflight.get(key);
      if (!request) {
        diagnostics.push(diag('D003',record.seq,node.id)); node.status='orphan';
        const synthetic:GraphNode={id:`synthetic:request:${record.seq}`,kind:'rpc_request',sourceSeq:record.seq,synthetic:true,status:'orphan',bytes:0,protocolVersion:proto}; nodes.push(synthetic);
        edges.push({id:`edge:orphan:${record.seq}`,from:synthetic.id,to:node.id,kind:'responds_to',causal:true,confidence:'explicit',sourceSeqs:[record.seq],status:'broken'});
      } else {
        inflight.delete(key); request.node.status=rpc.status==='error'?'error':'ok';
        const durationMs=Number(BigInt(record.ts_mono_ns)-BigInt(request.record.ts_mono_ns))/1e6; request.node.durationMs=durationMs; node.durationMs=durationMs;
        edges.push({id:`edge:response:${request.record.seq}:${record.seq}`,from:request.node.id,to:node.id,kind:'responds_to',causal:true,confidence:'explicit',sourceSeqs:[request.record.seq,record.seq],status:'ok'});
        if(rpc.status==='error') diagnostics.push(diag('D010',record.seq,node.id));
      }
    } else if (rpc.type === 'notification' && rpc.progress_token_hash) {
      const request=knownIds.get(rpc.progress_token_hash);
      if(!request){ diagnostics.push(diag('D006',record.seq,node.id,'warning')); node.status='orphan'; const synthetic:GraphNode={id:`synthetic:progress:${record.seq}`,kind:'rpc_request',sourceSeq:record.seq,synthetic:true,status:'orphan',bytes:0,protocolVersion:proto}; nodes.push(synthetic); edges.push({id:`edge:progress:${record.seq}`,from:synthetic.id,to:node.id,kind:'progress_for',causal:true,confidence:'explicit',sourceSeqs:[record.seq],status:'broken'}); }
      else { node.status='ok'; edges.push({id:`edge:progress:${request.record.seq}:${record.seq}`,from:request.node.id,to:node.id,kind:'progress_for',causal:true,confidence:'explicit',sourceSeqs:[request.record.seq,record.seq],status:'ok'}); }
    } else if (rpc.type === 'notification') node.status='ok';
  }
  for (const [key,{record,node}] of inflight.entries()) {
    if(ambiguous.has(key)){node.status='error';continue;}
    const elapsed=Number(newestNs-BigInt(record.ts_mono_ns))/1e6; const code=runEnd?'D005':elapsed>=requestTimeoutMs?'D004':undefined;
    if(!code) continue; node.status=code==='D005'?'missing':'stuck'; diagnostics.push(diag(code,record.seq,node.id));
    const synthetic:GraphNode={id:`synthetic:response:${record.seq}`,kind:'rpc_response',sourceSeq:record.seq,synthetic:true,status:node.status,bytes:0,protocolVersion:node.protocolVersion}; nodes.push(synthetic);
    edges.push({id:`edge:missing:${record.seq}`,from:node.id,to:synthetic.id,kind:'responds_to',causal:true,confidence:'explicit',sourceSeqs:[record.seq],status:'broken'});
  }
  for(const record of all.filter((r)=>r.kind==='capture_truncated'||(r.kind==='capture_diagnostic'&&r.code==='D009'))) diagnostics.push(diag('D009',Number(record.at_seq??record.seq),`wire:${record.at_seq??record.seq}`));
  diagnostics.sort((a,b)=>a.sourceSeq-b.sourceSeq||a.code.localeCompare(b.code)); const first=selectFirstBreak(diagnostics);
  return { schema:'causalwire.graph/v1', run:{id:header.run_id,startedAt:header.ts_wall,endedAt:runEnd?.ts_wall,captureComplete:Boolean(runEnd?.capture_complete),contentPolicy:header.content_policy}, mapping:{id:'mcp-jsonrpc@1',generatedAt:new Date().toISOString()}, nodes:nodes.sort((a,b)=>a.sourceSeq-b.sourceSeq||a.id.localeCompare(b.id)), edges:edges.sort((a,b)=>Math.min(...a.sourceSeqs)-Math.min(...b.sourceSeqs)||a.id.localeCompare(b.id)), diagnostics, ...(first?{firstBreak:{diagnosticCode:first.code,nodeId:first.nodeId,sourceSeq:first.sourceSeq}}:{}) };
}

export const mcpJsonRpcV1: NormalizerPack = { id:'mcp-jsonrpc@1',graphSchema:'causalwire.graph/v1',supports:()=>({supported:true}),normalize:(records)=>normalizeMcp(records) };
