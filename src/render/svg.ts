import type { GraphNode, GraphV1 } from '../schema/graph-v1.js';
import { escapeHtml, middleEllipsis } from './shared.js';

const identifier = (node: GraphNode) => node.toolName ?? node.method ?? node.id;
const kind = (node: GraphNode) => node.kind.replace('rpc_', '').replaceAll('_', ' ').toUpperCase();

export function renderSvg(graph: GraphV1): string {
  const visible = graph.nodes.filter((node) => node.kind !== 'run').slice(0, 12);
  const width = Math.max(820, visible.length * 216 + 56);
  const first = graph.firstBreak;
  const firstDiagnostic = graph.diagnostics.find((item) => item.code === first?.diagnosticCode && item.sourceSeq === first?.sourceSeq);
  const nodeY = first ? 202 : 142;
  const height = first ? 386 : 326;
  const nodes = visible.map((node, index) => {
    const x = 28 + index * 216;
    const broken = node.id === first?.nodeId;
    const secondary = node.toolName && node.method ? node.method : node.protocolVersion;
    return `<g transform="translate(${x} ${nodeY})" role="group" aria-label="${escapeHtml(`${kind(node)} sequence ${node.sourceSeq}, ${node.status}`)}">
      <rect class="node${node.synthetic ? ' synthetic' : ''}${broken ? ' first' : ''}" width="184" height="116" rx="10"/>
      <text class="kicker" x="16" y="24">${escapeHtml(kind(node))}</text>
      <text class="shape" x="168" y="24" text-anchor="end">${node.synthetic ? '◇' : '●'}</text>
      <text class="identifier" x="16" y="55">${escapeHtml(middleEllipsis(identifier(node), 22))}</text>
      <text class="secondary" x="16" y="75">${escapeHtml(middleEllipsis(secondary, 26))}</text>
      <circle class="status-dot ${escapeHtml(node.status)}" cx="19" cy="96" r="3"/>
      <text class="status-text${broken ? ' first-text' : ''}" x="28" y="100">${escapeHtml(node.status.toUpperCase())}</text>
      <text class="seq" x="168" y="100" text-anchor="end">SEQ ${node.sourceSeq}</text>
    </g>`;
  }).join('');
  const connectors = visible.slice(1).map((node, index) => {
    const broken = node.id === first?.nodeId;
    const x1 = 28 + index * 216 + 184;
    const x2 = 28 + (index + 1) * 216;
    const y = nodeY + 58;
    return `<g aria-hidden="true"><path class="connector${broken ? ' broken' : ''}" d="M ${x1} ${y} H ${x2}" marker-end="url(#${broken ? 'arrow-break' : 'arrow'})"/>${broken ? `<text class="break-edge-label" x="${(x1 + x2) / 2}" y="${y - 13}" text-anchor="middle">BREAK</text>` : ''}</g>`;
  }).join('');
  const empty = visible.length ? '' : `<g transform="translate(28 136)"><rect class="empty-card" width="${width - 56}" height="116" rx="12"/><circle class="empty-ring" cx="40" cy="40" r="15"/><text class="empty-mark" x="40" y="45" text-anchor="middle">◇</text><text class="empty-title" x="70" y="36">No JSON-RPC exchanges found</text><text class="empty-copy" x="70" y="60">Record an MCP stdio server to create a causal sequence.</text><rect class="command-bg" x="70" y="75" width="322" height="26" rx="5"/><text class="command" x="82" y="93">causalwire record -- &lt;server command&gt;</text></g>`;
  const signal = first ? `<g transform="translate(28 122)"><rect class="signal" width="${width - 56}" height="58" rx="9"/><rect class="signal-rail" width="3" height="58" rx="1.5"/><text class="signal-label" x="18" y="23">FIRST BREAK · ${escapeHtml(first.diagnosticCode)} · SOURCE SEQ ${first.sourceSeq}</text><text class="signal-copy" x="18" y="44">${escapeHtml(middleEllipsis(firstDiagnostic?.message ?? '', 100))}</text></g>` : '';
  const title = first ? 'First break isolated.' : visible.length ? 'No protocol break detected.' : 'Ready for causal evidence.';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="cw-title cw-desc">
  <title id="cw-title">Causalwire evidence for ${escapeHtml(graph.run.id)}</title>
  <desc id="cw-desc">${first ? `First causal break ${escapeHtml(first.diagnosticCode)} at source sequence ${first.sourceSeq}.` : 'No causal break detected.'} Metadata-only MCP causal sequence.</desc>
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#62666d"/></marker>
    <marker id="arrow-break" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#d97706"/></marker>
    <style>
      .canvas{fill:#010102}.rule{stroke:#23252a}.mark{fill:#0f1011;stroke:#d97706}.mark-text{fill:#f59e0b;font:600 14px ui-monospace,monospace}.brand{fill:#f7f8f8;font:600 12px ui-monospace,monospace;letter-spacing:1.4px}.artifact{fill:#8a8f98;font:11px system-ui,sans-serif}.title{fill:#f7f8f8;font:600 28px system-ui,sans-serif;letter-spacing:-.5px}.meta{fill:#8a8f98;font:11px ui-monospace,monospace}.pill{fill:#0f1011;stroke:#34343a}.pill-text{fill:#d0d6e0;font:10px ui-monospace,monospace}.pill-dot{fill:#27a644}.pill-dot.incomplete{fill:#ef4444}.signal{fill:#2a1b07;stroke:#34343a}.signal-rail{fill:#d97706}.signal-label,.break-edge-label{fill:#f59e0b;font:600 10px ui-monospace,monospace;letter-spacing:.8px}.signal-copy{fill:#d0d6e0;font:12px system-ui,sans-serif}.node{fill:#141516;stroke:#34343a}.node.synthetic{stroke:#62666d;stroke-dasharray:6 5}.node.first{fill:#2a1b07;stroke:#d97706;stroke-width:2}.kicker,.seq{fill:#8a8f98;font:10px ui-monospace,monospace;letter-spacing:.5px}.shape{fill:#62666d;font:11px system-ui,sans-serif}.identifier{fill:#f7f8f8;font:500 13px ui-monospace,monospace}.secondary{fill:#8a8f98;font:10px ui-monospace,monospace}.status-dot{fill:#62666d}.status-dot.ok{fill:#27a644}.status-dot.error,.status-dot.invalid,.status-dot.missing,.status-dot.orphan{fill:#ef4444}.status-dot.stuck,.status-dot.pending{fill:#d97706}.status-text{fill:#d0d6e0;font:10px system-ui,sans-serif}.first-text{fill:#f59e0b}.connector{fill:none;stroke:#34343a;stroke-dasharray:3 5}.connector.broken{stroke:#d97706;stroke-width:3}.empty-card{fill:#0f1011;stroke:#23252a}.empty-ring{fill:none;stroke:#34343a;stroke-dasharray:3 3}.empty-mark{fill:#8a8f98;font:14px ui-monospace,monospace}.empty-title{fill:#f7f8f8;font:550 17px system-ui,sans-serif}.empty-copy{fill:#8a8f98;font:12px system-ui,sans-serif}.command-bg{fill:#141516;stroke:#23252a}.command{fill:#d0d6e0;font:10px ui-monospace,monospace}.footer{fill:#62666d;font:10px system-ui,sans-serif}
    </style>
  </defs>
  <rect class="canvas" width="100%" height="100%"/>
  <g transform="translate(28 24)"><rect class="mark" width="26" height="26" rx="7"/><text class="mark-text" x="13" y="18" text-anchor="middle">⌁</text><text class="brand" x="38" y="11">CAUSALWIRE</text><text class="artifact" x="38" y="26">Local protocol evidence</text></g>
  <text class="title" x="28" y="91">${title}</text>
  <text class="meta" x="${width - 28}" y="87" text-anchor="end">${escapeHtml(middleEllipsis(graph.run.id, 28))} · ${escapeHtml(graph.mapping.id)}</text>
  <line class="rule" x1="28" y1="106" x2="${width - 28}" y2="106"/>
  ${signal}${connectors}${nodes}${empty}
  <text class="footer" x="28" y="${height - 22}">Generated locally · Metadata only · Hashes are not redaction</text>
  <g transform="translate(${width - 238} ${height - 36})"><rect class="pill" width="210" height="24" rx="12"/><circle class="pill-dot${graph.run.captureComplete ? '' : ' incomplete'}" cx="13" cy="12" r="3"/><text class="pill-text" x="23" y="15">CAPTURE ${graph.run.captureComplete ? 'COMPLETE' : 'INCOMPLETE'} · CONTENT ${escapeHtml(graph.run.contentPolicy.toUpperCase())}</text></g>
</svg>`;
}
