import type { Diagnostic, GraphNode, GraphV1 } from '../schema/graph-v1.js';
import { escapeHtml } from './shared.js';
import { evidenceStyles } from './html-styles.js';

const titleCase = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const kindLabel = (kind: GraphNode['kind']) => kind.replace('rpc_', '').replaceAll('_', ' ');
const nodeIdentifier = (node: GraphNode) => node.toolName ?? node.method ?? node.id;

function renderSignal(graph: GraphV1, wire: GraphNode[]): string {
  const first = graph.firstBreak;
  const diagnostic = graph.diagnostics.find((item) => item.code === first?.diagnosticCode && item.sourceSeq === first?.sourceSeq);
  const node = graph.nodes.find((item) => item.id === first?.nodeId);
  if (first && diagnostic && node) {
    return `<article class="signal break" aria-labelledby="signal-title">
      <div class="signal-head"><span class="signal-label">First break · ${escapeHtml(diagnostic.code)}</span><span class="signal-seq">SOURCE SEQ ${first.sourceSeq}</span></div>
      <h2 id="signal-title">${escapeHtml(titleCase(diagnostic.name))}</h2>
      <p class="signal-message">${escapeHtml(diagnostic.message)}</p>
      <dl class="signal-details">
        <div><dt>Affected evidence</dt><dd>${escapeHtml(nodeIdentifier(node))}</dd></div>
        <div><dt>Observed state</dt><dd>${escapeHtml(node.status.toUpperCase())}</dd></div>
        <div><dt>Mapping</dt><dd>${escapeHtml(graph.mapping.id)}</dd></div>
      </dl>
    </article>`;
  }
  if (wire.length) {
    return `<article class="signal healthy" aria-labelledby="signal-title">
      <div class="signal-head"><span class="signal-label">No defined break</span><span class="signal-seq">${wire.length} OBSERVED FRAMES</span></div>
      <h2 id="signal-title">Correlation completed cleanly</h2>
      <p class="signal-message">Causalwire found no deterministic protocol break in the captured evidence.</p>
      <dl class="signal-details">
        <div><dt>Diagnostics</dt><dd>0 FINDINGS</dd></div>
        <div><dt>Capture</dt><dd>${graph.run.captureComplete ? 'COMPLETE' : 'INCOMPLETE'}</dd></div>
        <div><dt>Mapping</dt><dd>${escapeHtml(graph.mapping.id)}</dd></div>
      </dl>
    </article>`;
  }
  return `<article class="signal neutral" aria-labelledby="signal-title">
    <div class="signal-head"><span class="signal-label">Awaiting evidence</span><span class="signal-seq">0 OBSERVED FRAMES</span></div>
    <h2 id="signal-title">Nothing to analyze yet</h2>
    <p class="signal-message">The journal is valid, but it only contains lifecycle records. Record an MCP stdio server to create a causal sequence.</p>
    <dl class="signal-details">
      <div><dt>Diagnostics</dt><dd>0 FINDINGS</dd></div>
      <div><dt>Capture</dt><dd>${graph.run.captureComplete ? 'COMPLETE' : 'INCOMPLETE'}</dd></div>
      <div><dt>Next command</dt><dd>causalwire record -- &lt;server&gt;</dd></div>
    </dl>
  </article>`;
}

function renderSummary(graph: GraphV1, wire: GraphNode[]): string {
  const requests = wire.filter((node) => node.kind === 'rpc_request').length;
  const capture = graph.run.captureComplete ? 'COMPLETE' : 'INCOMPLETE';
  return `<aside class="summary" aria-labelledby="summary-title">
    <div class="summary-head"><span>Run integrity</span><h2 id="summary-title">Evidence summary</h2></div>
    <div class="metrics">
      <div class="metric"><span>Frames</span><strong>${wire.length}</strong></div>
      <div class="metric"><span>Requests</span><strong>${requests}</strong></div>
      <div class="metric"><span>Findings</span><strong>${graph.diagnostics.length}</strong></div>
      <div class="metric"><span>Capture</span><strong class="${graph.run.captureComplete ? 'complete' : 'incomplete'}">${capture}</strong></div>
    </div>
  </aside>`;
}

function renderNode(node: GraphNode, firstNodeId: string | undefined): string {
  const first = node.id === firstNodeId;
  const identifier = nodeIdentifier(node);
  const secondary = node.toolName && node.method ? node.method : node.protocolVersion;
  return `<article class="node${node.synthetic ? ' synthetic' : ''}${first ? ' first' : ''}" aria-label="${escapeHtml(`${kindLabel(node.kind)} sequence ${node.sourceSeq}, ${node.status}`)}">
    <div class="node-top"><span class="node-kind">${escapeHtml(kindLabel(node.kind))}</span><span class="node-shape" aria-hidden="true">${node.synthetic ? '◇' : '●'}</span></div>
    <div class="node-main"><code>${escapeHtml(identifier)}</code><span class="node-method">${escapeHtml(secondary)}</span></div>
    <div class="node-foot"><span>SEQ ${node.sourceSeq}</span><span class="status ${escapeHtml(node.status)}">${escapeHtml(node.status)}</span></div>
  </article>`;
}

function renderGraph(graph: GraphV1): string {
  const visible = graph.nodes.filter((node) => node.kind !== 'run').slice(0, 100);
  if (!visible.length) {
    return `<div class="panel empty"><div><div class="empty-mark" aria-hidden="true">◇</div><h3>No JSON-RPC exchanges found</h3><p>This journal contains lifecycle records only. Capture an MCP server to create causal evidence.</p><code class="command">causalwire record -- &lt;server command&gt;</code></div></div>`;
  }
  const flow = visible.map((node, index) => {
    const connector = index === 0 ? '' : `<span class="connector${node.id === graph.firstBreak?.nodeId ? ' broken' : ''}" aria-hidden="true">${node.id === graph.firstBreak?.nodeId ? '<em>break</em>' : ''}</span>`;
    return `${connector}${renderNode(node, graph.firstBreak?.nodeId)}`;
  }).join('');
  const hidden = graph.nodes.filter((node) => node.kind !== 'run').length - visible.length;
  return `<div class="panel">
    <div class="graph-scroll" tabindex="0" aria-label="Causal sequence. Scroll horizontally to inspect all nodes."><div class="graph-flow">${flow}</div></div>
    <div class="graph-foot"><div class="legend"><span><i></i>Observed</span><span><i class="broken"></i>First broken edge</span><span><i class="synthetic"></i>Synthetic endpoint</span></div><span class="scroll-hint">Scroll horizontally →</span>${hidden > 0 ? `<span>${hidden} more nodes available in JSON export</span>` : ''}</div>
  </div>`;
}

function renderFinding(diagnostic: Diagnostic): string {
  return `<li class="finding">
    <span class="finding-code">${escapeHtml(diagnostic.code)}</span>
    <div class="finding-copy"><h3>${escapeHtml(titleCase(diagnostic.name))}</h3><p>${escapeHtml(diagnostic.message)}</p></div>
    <div class="finding-meta"><span class="${escapeHtml(diagnostic.severity)}">${escapeHtml(diagnostic.severity)}</span><span>SEQ ${diagnostic.sourceSeq}</span></div>
  </li>`;
}

function renderDiagnostics(graph: GraphV1): string {
  if (!graph.diagnostics.length) return '<div class="panel finding-empty"><i aria-hidden="true"></i><span>No deterministic protocol findings in this journal.</span></div>';
  return `<div class="panel"><ol class="finding-list">${graph.diagnostics.map(renderFinding).join('')}</ol></div>`;
}

export function renderHtml(graph: GraphV1): string {
  const wire = graph.nodes.filter((node) => !node.synthetic && node.kind !== 'run');
  const hasBreak = Boolean(graph.firstBreak);
  const heroTitle = hasBreak ? 'First break isolated.' : wire.length ? 'No protocol break detected.' : 'Ready for causal evidence.';
  const heroCopy = hasBreak
    ? 'The earliest wire-verifiable correlation failure is surfaced before downstream symptoms.'
    : wire.length ? 'The captured sequence contains no defined correlation failure.' : 'Record MCP stdio once, then inspect the same local evidence across CLI, HTML, SVG, and OTLP.';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
  <title>Causalwire · ${escapeHtml(graph.run.id)}</title>
  <style>${evidenceStyles}</style>
</head>
<body>
  <a class="skip" href="#main">Skip to evidence</a>
  <main id="main" class="wrap">
    <header class="masthead">
      <div class="identity"><span class="mark" aria-hidden="true">⌁</span><div><div class="brand">causalwire</div><div class="artifact-label">Local protocol evidence</div></div></div>
      <div class="state-pills"><span class="pill ${graph.run.captureComplete ? 'complete' : 'incomplete'}">Capture ${graph.run.captureComplete ? 'complete' : 'incomplete'}</span><span class="pill ${graph.run.contentPolicy === 'full' ? 'full' : ''}">Content ${escapeHtml(graph.run.contentPolicy)}</span></div>
    </header>

    <section class="hero" aria-labelledby="page-title">
      <div><p class="eyebrow">Incident analysis · deterministic</p><h1 id="page-title">${heroTitle}</h1><p class="hero-copy">${heroCopy}</p></div>
      <div class="run-ref"><span>Run / mapping</span>${escapeHtml(graph.run.id)}<br>${escapeHtml(graph.mapping.id)}</div>
    </section>

    <section class="overview" aria-label="Incident overview">${renderSignal(graph, wire)}${renderSummary(graph, wire)}</section>

    <section class="evidence-section" aria-labelledby="graph-title">
      <div class="section-heading"><span class="section-index">01</span><div><h2 id="graph-title">Causal sequence</h2><p>Explicit JSON-RPC correlation. Connectors preserve observed chronology; amber marks the first defined break.</p></div></div>
      ${renderGraph(graph)}
    </section>

    <section class="evidence-section" aria-labelledby="diagnostics-title">
      <div class="section-heading"><span class="section-index">02</span><div><h2 id="diagnostics-title">Deterministic findings</h2><p>Protocol findings ordered by source sequence, without semantic root-cause claims.</p></div></div>
      ${renderDiagnostics(graph)}
    </section>

    <footer class="provenance"><strong>Generated locally by causalwire</strong><span>Metadata only · Hashes are not redaction · No scripts, fonts, analytics, or network dependencies</span></footer>
  </main>
</body>
</html>`;
}
