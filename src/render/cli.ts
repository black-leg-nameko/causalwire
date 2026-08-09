import type { GraphV1 } from '../schema/graph-v1.js';
import { middleEllipsis, stripControls } from './shared.js';

export function renderCli(graph:GraphV1,format:'summary'|'dag'|'json'='summary'):string{
  if(format==='json')return `${JSON.stringify(graph,null,2)}\n`;
  const wire=graph.nodes.filter((n)=>!n.synthetic&&n.kind!=='run');const requests=wire.filter((n)=>n.kind==='rpc_request');const responses=wire.filter((n)=>n.kind==='rpc_response');
  const lines=[`CAUSALWIRE · ${stripControls(graph.run.id)}`,`Capture: ${graph.run.captureComplete?'complete':'incomplete'} · content=${graph.run.contentPolicy} · mapping=${graph.mapping.id}`,`Frames: ${wire.length} · requests: ${requests.length} · responses: ${responses.length} · diagnostics: ${graph.diagnostics.length}`];
  if(!wire.length)lines.push('No JSON-RPC exchanges found. Record a server with: causalwire record -- <server command>');
  else if(graph.firstBreak){const d=graph.diagnostics.find((item)=>item.code===graph.firstBreak?.diagnosticCode&&item.sourceSeq===graph.firstBreak.sourceSeq);const n=graph.nodes.find((item)=>item.id===graph.firstBreak?.nodeId);lines.push('',`! FIRST BREAK ${graph.firstBreak.diagnosticCode} ${d?.name??''}`,`  seq ${graph.firstBreak.sourceSeq} · ${middleEllipsis(n?.method??n?.toolName??graph.firstBreak.nodeId)}`,`  ${d?.message??''}`);}
  else lines.push('','✓ No causal break detected.');
  if(format==='dag'){lines.push('','DAG');for(const n of graph.nodes.filter((n)=>n.kind!=='run').slice(0,100))lines.push(`${String(n.sourceSeq).padStart(5)}  ${n.synthetic?'◇':'●'} ${n.kind.padEnd(16)} ${n.status.padEnd(8)} ${middleEllipsis(n.method??n.toolName??n.id,44)}`);if(graph.nodes.length>101)lines.push(`… ${graph.nodes.length-101} more nodes; use --format json`);}
  return `${lines.join('\n')}\n`;
}
