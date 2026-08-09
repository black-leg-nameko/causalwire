import type { Diagnostic } from '../schema/graph-v1.js';

const candidates = new Set(['D001','D002','D003','D004','D005','D006','D009']);
export function selectFirstBreak(diagnostics: Diagnostic[]): Diagnostic | undefined {
  return diagnostics.filter((d) => candidates.has(d.code)).sort((a,b) => a.sourceSeq - b.sourceSeq || a.code.localeCompare(b.code))[0];
}
