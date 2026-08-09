export type DiagnosticSeverity = 'warning' | 'error';
export interface Diagnostic {
  code: string;
  name: string;
  severity: DiagnosticSeverity;
  sourceSeq: number;
  nodeId: string;
  message: string;
}
export interface GraphNode {
  id: string;
  kind: 'run' | 'rpc_request' | 'rpc_response' | 'rpc_notification' | 'unknown_frame';
  sourceSeq: number;
  synthetic: boolean;
  method?: string;
  toolName?: string;
  status: 'pending' | 'ok' | 'error' | 'stuck' | 'missing' | 'orphan' | 'invalid';
  durationMs?: number;
  bytes: number;
  protocolVersion: string;
}
export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  kind: 'responds_to' | 'progress_for' | 'cancels' | 'sequence';
  causal: boolean;
  confidence: 'explicit' | 'derived';
  sourceSeqs: number[];
  status: 'ok' | 'broken';
}
export interface GraphV1 {
  schema: 'causalwire.graph/v1';
  run: { id: string; startedAt: string; endedAt?: string; captureComplete: boolean; contentPolicy: 'off' | 'full' };
  mapping: { id: string; generatedAt: string };
  nodes: GraphNode[];
  edges: GraphEdge[];
  diagnostics: Diagnostic[];
  firstBreak?: { diagnosticCode: string; nodeId: string; sourceSeq: number };
}

export interface NormalizerPack {
  id: string;
  graphSchema: 'causalwire.graph/v1';
  supports(input: import('./journal-v1.js').JournalHeader): { supported: boolean; reason?: string };
  normalize(records: AsyncIterable<import('./journal-v1.js').JournalRecord>): Promise<GraphV1>;
}

export interface DiagnosticDetector {
  id: string;
  detect(graph: GraphV1): Diagnostic[];
}

export interface GraphRenderer { render(graph: GraphV1): string }
export interface OtlpMapper { map(graph: GraphV1, serviceName?: string): unknown }
