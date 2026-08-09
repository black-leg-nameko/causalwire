import type { Diagnostic, DiagnosticDetector, GraphV1 } from '../schema/graph-v1.js';

export function applyDetectors(graph: GraphV1, detectors: DiagnosticDetector[] = []): GraphV1 {
  const added: Diagnostic[] = detectors.flatMap((detector) => detector.detect(graph));
  return { ...graph, diagnostics: [...graph.diagnostics, ...added].sort((a,b) => a.sourceSeq - b.sourceSeq || a.code.localeCompare(b.code)) };
}
