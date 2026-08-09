import { SpanStatusCode } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BasicTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import type { GraphV1 } from '../schema/graph-v1.js';

export interface OtlpOptions { endpoint?: string; endpointIsTracesUrl?: boolean; serviceName?: string; headers?: Record<string,string>; timeoutMillis?: number }
export interface ExportResult { spans: number; events: number; links: number }
export interface OtlpJson { resource: Record<string,string>; spans: Array<{name:string;attributes:Record<string,string|number|boolean>;status:'OK'|'ERROR';durationMs?:number;syntheticEnd:boolean;events:Array<{name:string}>;links:Array<{kind:string;sourceSeqs:number[]}>}> }

export function mapOtlp(graph:GraphV1,serviceName='mcp-server'):OtlpJson{
  const requests=graph.nodes.filter((n)=>n.kind==='rpc_request'&&!n.synthetic);return {resource:{'service.name':serviceName,'causalwire.run.id':graph.run.id,'causalwire.mapping.id':graph.mapping.id},spans:requests.map((n)=>{const correlations=graph.edges.filter((e)=>e.from===n.id&&e.causal);const relatedNodes=new Set([n.id,...correlations.map((e)=>e.to)]);return {name:`jsonrpc ${n.method??'request'}`,attributes:{'rpc.system':'jsonrpc','rpc.method':n.method??'unknown',...(n.toolName?{'mcp.tool.name':n.toolName}:{}),'mcp.protocol.version':n.protocolVersion,'causalwire.run.id':graph.run.id,'causalwire.source.seq':n.sourceSeq,'causalwire.mapping.id':graph.mapping.id,'causalwire.request.bytes':n.bytes,'causalwire.status':n.status},status:n.status==='ok'?'OK':'ERROR',durationMs:n.durationMs,syntheticEnd:['pending','stuck','missing'].includes(n.status),events:graph.diagnostics.filter((d)=>relatedNodes.has(d.nodeId)).map((d)=>({name:`causalwire.${d.code.toLowerCase()}`})),links:correlations.map((e)=>({kind:e.kind,sourceSeqs:e.sourceSeqs}))};})};
}

export async function toOtlp(graph:GraphV1,options:OtlpOptions):Promise<ExportResult>{
  if(!options.endpoint)throw Object.assign(new Error('OTLP endpoint is required. Set OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318'),{exitCode:78});
  let endpoint:URL;try{endpoint=new URL(options.endpoint)}catch{throw Object.assign(new Error('OTLP endpoint must be a valid http:// or https:// URL'),{exitCode:78});}
  if(!['http:','https:'].includes(endpoint.protocol)||endpoint.username||endpoint.password||endpoint.hash)throw Object.assign(new Error('OTLP endpoint must use HTTP(S) without embedded credentials or fragments'),{exitCode:78});
  if(!options.endpointIsTracesUrl)endpoint.pathname=`${endpoint.pathname.replace(/\/$/,'')}/v1/traces`;
  const timeoutMillis=options.timeoutMillis??10_000;if(!Number.isFinite(timeoutMillis)||timeoutMillis<=0||timeoutMillis>300_000)throw Object.assign(new Error('OTLP timeout must be between 1 and 300000 milliseconds'),{exitCode:78});
  const model=mapOtlp(graph,options.serviceName);if(!model.spans.length)return {spans:0,events:0,links:0};
  const exporter=new OTLPTraceExporter({url:endpoint.toString(),headers:options.headers,timeoutMillis});
  const processor=new SimpleSpanProcessor(exporter);const provider=new BasicTracerProvider({resource:resourceFromAttributes({[ATTR_SERVICE_NAME]:options.serviceName??'mcp-server','causalwire.run.id':graph.run.id,'causalwire.mapping.id':graph.mapping.id}),spanProcessors:[processor]});const tracer=provider.getTracer('causalwire','0.1.0');
  for(const item of model.spans){const span=tracer.startSpan(item.name,{attributes:item.attributes});for(const event of item.events)span.addEvent(event.name);span.setStatus({code:item.status==='OK'?SpanStatusCode.OK:SpanStatusCode.ERROR});span.end();}
  try{await provider.forceFlush();await provider.shutdown();}catch{throw Object.assign(new Error('OTLP export failed or timed out'),{exitCode:69});}
  return {spans:model.spans.length,events:model.spans.reduce((n,s)=>n+s.events.length,0),links:model.spans.reduce((n,s)=>n+s.links.length,0)};
}
