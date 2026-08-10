export const evidenceStyles = `
:root {
  --primary: #d97706;
  --primary-hi: #f59e0b;
  --primary-focus: #b45309;
  --primary-soft: #2a1b07;
  --ink: #f7f8f8;
  --muted: #d0d6e0;
  --subtle: #8a8f98;
  --tertiary: #62666d;
  --canvas: #010102;
  --surface-1: #0f1011;
  --surface-2: #141516;
  --surface-3: #18191a;
  --hairline: #23252a;
  --hairline-strong: #34343a;
  --success: #27a644;
  --error: #ef4444;
}

* { box-sizing: border-box; }
html { background: var(--canvas); color: var(--ink); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-synthesis: none; }
body { margin: 0; min-width: 320px; background: var(--canvas); -webkit-font-smoothing: antialiased; }
code, .mono { font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace; }
.skip { position: absolute; left: -9999px; }
.skip:focus { left: 16px; top: 16px; z-index: 10; padding: 12px 16px; border-radius: 6px; background: var(--primary); color: var(--ink); outline: 2px solid var(--ink); }
.wrap { width: min(1120px, calc(100% - 64px)); margin: 0 auto; padding: 32px 0 64px; }

.masthead { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--hairline); }
.identity { display: flex; align-items: center; min-width: 0; gap: 12px; }
.mark { display: grid; place-items: center; flex: 0 0 28px; width: 28px; height: 28px; border: 1px solid var(--primary); border-radius: 8px; color: var(--primary-hi); font: 600 15px/1 ui-monospace, monospace; }
.brand { color: var(--ink); font: 600 13px/1.2 ui-monospace, monospace; letter-spacing: .12em; text-transform: uppercase; }
.artifact-label { margin-top: 4px; color: var(--subtle); font-size: 12px; }
.state-pills { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; }
.pill { display: inline-flex; flex: 0 0 auto; align-items: center; min-height: 30px; gap: 7px; padding: 6px 10px; border: 1px solid var(--hairline-strong); border-radius: 999px; color: var(--muted); font: 500 11px/1 ui-monospace, monospace; letter-spacing: .04em; text-transform: uppercase; white-space: nowrap; }
.pill::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--tertiary); }
.pill.complete::before { background: var(--success); }
.pill.incomplete::before, .pill.full::before { background: var(--error); }

.hero { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 32px; padding: 56px 0 32px; }
.eyebrow { margin: 0 0 12px; color: var(--primary-hi); font: 600 11px/1.2 ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; }
h1 { max-width: 760px; margin: 0; font-size: clamp(36px, 5vw, 52px); font-weight: 600; line-height: 1.04; letter-spacing: -1.7px; }
.hero-copy { max-width: 720px; margin: 16px 0 0; color: var(--muted); font-size: 16px; line-height: 1.55; }
.run-ref { min-width: 0; max-width: 340px; text-align: right; color: var(--subtle); font: 12px/1.6 ui-monospace, monospace; overflow-wrap: anywhere; }
.run-ref span { display: block; color: var(--tertiary); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; }

.overview { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(280px, .75fr); gap: 16px; align-items: stretch; }
.signal { position: relative; min-height: 236px; padding: 28px 28px 24px 32px; overflow: hidden; border: 1px solid var(--hairline-strong); border-radius: 12px; background: var(--surface-1); }
.signal.break { background: var(--primary-soft); box-shadow: inset 3px 0 0 var(--primary); }
.signal.healthy { box-shadow: inset 3px 0 0 var(--success); }
.signal.neutral { box-shadow: inset 3px 0 0 var(--hairline-strong); }
.signal-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.signal-label { color: var(--primary-hi); font: 600 11px/1.2 ui-monospace, monospace; letter-spacing: .13em; text-transform: uppercase; }
.signal.healthy .signal-label { color: var(--success); }
.signal.neutral .signal-label { color: var(--subtle); }
.signal-seq { color: var(--subtle); font: 11px/1.2 ui-monospace, monospace; }
.signal h2 { margin: 28px 0 10px; font-size: 28px; font-weight: 550; line-height: 1.16; letter-spacing: -.6px; }
.signal-message { max-width: 640px; min-height: 48px; margin: 0; color: var(--muted); font-size: 15px; line-height: 1.55; }
.signal-details { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin: 28px 0 0; padding-top: 20px; border-top: 1px solid var(--hairline-strong); }
.signal-details div { min-width: 0; }
.signal-details dt { margin-bottom: 7px; color: var(--subtle); font: 10px/1.2 ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; }
.signal-details dd { margin: 0; color: var(--ink); font: 12px/1.45 ui-monospace, monospace; overflow-wrap: anywhere; }

.summary { border: 1px solid var(--hairline); border-radius: 12px; background: var(--surface-1); overflow: hidden; }
.summary-head { padding: 20px 20px 16px; border-bottom: 1px solid var(--hairline); }
.summary-head span { color: var(--subtle); font: 10px/1.2 ui-monospace, monospace; letter-spacing: .12em; text-transform: uppercase; }
.summary-head h2 { margin: 6px 0 0; font-size: 16px; font-weight: 550; }
.metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.metric { min-width: 0; padding: 18px 20px; border-right: 1px solid var(--hairline); border-bottom: 1px solid var(--hairline); }
.metric:nth-child(2n) { border-right: 0; }
.metric:nth-last-child(-n + 2) { border-bottom: 0; }
.metric span { display: block; color: var(--subtle); font: 10px/1.2 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
.metric strong { display: block; margin-top: 8px; color: var(--ink); font: 500 18px/1.2 ui-monospace, monospace; overflow-wrap: anywhere; }
.metric strong.complete { color: var(--success); }
.metric strong.incomplete { color: var(--error); }

.evidence-section { margin-top: 48px; }
.section-heading { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 12px; align-items: start; margin-bottom: 16px; }
.section-index { padding-top: 5px; color: var(--tertiary); font: 11px/1 ui-monospace, monospace; }
.section-heading h2 { margin: 0; font-size: 22px; font-weight: 550; line-height: 1.25; letter-spacing: -.35px; }
.section-heading p { margin: 5px 0 0; color: var(--subtle); font-size: 13px; line-height: 1.5; }
.panel { border: 1px solid var(--hairline); border-radius: 12px; background: var(--surface-1); overflow: hidden; }

.graph-scroll { overflow-x: auto; padding: 28px 24px 26px; scrollbar-color: var(--hairline-strong) var(--surface-1); }
.graph-scroll:focus-visible { outline: 2px solid var(--primary-focus); outline-offset: 3px; }
.graph-flow { display: flex; align-items: stretch; width: max-content; min-width: 100%; }
.node { display: flex; flex: 0 0 196px; min-height: 148px; flex-direction: column; padding: 16px; border: 1px solid var(--hairline-strong); border-radius: 10px; background: var(--surface-2); }
.node.synthetic { border-style: dashed; }
.node.first { border: 2px solid var(--primary); padding: 15px; background: var(--primary-soft); }
.node-top, .node-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.node-kind { color: var(--subtle); font: 10px/1.2 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
.node-shape { color: var(--tertiary); font-size: 12px; }
.node-main { margin: 22px 0 auto; }
.node-main code { display: block; color: var(--ink); font: 500 13px/1.45 ui-monospace, monospace; overflow-wrap: anywhere; }
.node-method { display: block; margin-top: 5px; color: var(--subtle); font: 10px/1.4 ui-monospace, monospace; overflow-wrap: anywhere; }
.node-foot { margin-top: 20px; color: var(--subtle); font: 10px/1.2 ui-monospace, monospace; text-transform: uppercase; }
.status { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); }
.status::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--tertiary); }
.status.ok::before { background: var(--success); }
.status.error::before, .status.invalid::before, .status.missing::before, .status.orphan::before { background: var(--error); }
.status.stuck::before, .status.pending::before { background: var(--primary); }
.node.first .status { color: var(--primary-hi); }
.connector { position: relative; display: flex; flex: 0 0 52px; align-items: center; justify-content: center; }
.connector::before { content: ""; width: 100%; border-top: 1px dashed var(--hairline-strong); }
.connector::after { content: ""; position: absolute; right: 0; width: 5px; height: 5px; border-top: 1px solid var(--tertiary); border-right: 1px solid var(--tertiary); transform: rotate(45deg); }
.connector.broken::before { border-top: 3px dashed var(--primary); }
.connector.broken::after { width: 6px; height: 6px; border-color: var(--primary); border-width: 2px; }
.connector em { position: absolute; top: 17px; color: var(--primary-hi); font: 600 9px/1 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
.graph-foot { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; padding: 14px 24px; border-top: 1px solid var(--hairline); color: var(--subtle); font-size: 11px; }
.legend { display: flex; flex-wrap: wrap; gap: 16px; }
.legend span { display: inline-flex; align-items: center; gap: 7px; }
.legend i { width: 16px; border-top: 1px solid var(--hairline-strong); }
.legend .broken { border-top: 3px dashed var(--primary); }
.legend .synthetic { width: 13px; height: 9px; border: 1px dashed var(--tertiary); border-radius: 2px; }
.scroll-hint { display: none; }

.empty { display: grid; min-height: 248px; place-items: center; padding: 40px 24px; text-align: center; }
.empty-mark { display: grid; place-items: center; width: 42px; height: 42px; margin: 0 auto 18px; border: 1px dashed var(--hairline-strong); border-radius: 50%; color: var(--subtle); font: 16px/1 ui-monospace, monospace; }
.empty h3 { margin: 0; font-size: 20px; font-weight: 550; }
.empty p { max-width: 560px; margin: 8px auto 18px; color: var(--subtle); font-size: 14px; line-height: 1.5; }
.command { display: inline-block; max-width: 100%; padding: 10px 12px; border: 1px solid var(--hairline); border-radius: 6px; background: var(--surface-2); color: var(--muted); font: 12px/1.4 ui-monospace, monospace; overflow-wrap: anywhere; }

.finding-list { margin: 0; padding: 0; list-style: none; }
.finding { display: grid; grid-template-columns: 76px minmax(0, 1fr) auto; gap: 20px; align-items: start; padding: 20px 24px; border-bottom: 1px solid var(--hairline); }
.finding:last-child { border-bottom: 0; }
.finding-code { display: inline-flex; width: fit-content; padding: 5px 7px; border: 1px solid var(--primary); border-radius: 4px; color: var(--primary-hi); font: 600 11px/1 ui-monospace, monospace; }
.finding-copy h3 { margin: 0; color: var(--ink); font-size: 14px; font-weight: 550; }
.finding-copy p { margin: 5px 0 0; color: var(--muted); font-size: 13px; line-height: 1.5; }
.finding-meta { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
.finding-meta span { padding: 5px 7px; border: 1px solid var(--hairline); border-radius: 4px; color: var(--subtle); font: 10px/1 ui-monospace, monospace; text-transform: uppercase; }
.finding-meta .error { color: var(--error); }
.finding-empty { display: flex; align-items: center; gap: 12px; padding: 24px; color: var(--muted); font-size: 13px; }
.finding-empty i { width: 8px; height: 8px; border-radius: 50%; background: var(--success); }

.provenance { display: flex; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--hairline); color: var(--tertiary); font-size: 11px; line-height: 1.5; }
.provenance strong { color: var(--subtle); font-weight: 500; }

@media (max-width: 768px) {
  .wrap { width: min(100% - 32px, 1120px); padding-top: 20px; }
  .masthead { align-items: flex-start; }
  .state-pills { max-width: 180px; }
  .hero { display: block; padding: 40px 0 24px; }
  .run-ref { max-width: none; margin-top: 20px; text-align: left; }
  .overview { grid-template-columns: 1fr; }
  .signal { min-height: 0; }
  .summary { grid-row: 2; }
  .evidence-section { margin-top: 40px; }
  .scroll-hint { display: inline; }
  .finding { grid-template-columns: 68px minmax(0, 1fr); }
  .finding-meta { grid-column: 2; justify-content: flex-start; }
}

@media (max-width: 480px) {
  .masthead { display: block; }
  .state-pills { justify-content: flex-start; max-width: none; margin-top: 16px; }
  .hero { padding-top: 36px; }
  h1 { font-size: 34px; letter-spacing: -1.1px; }
  .hero-copy { font-size: 14px; }
  .signal { padding: 22px 20px 20px 23px; }
  .signal-head { align-items: flex-start; }
  .signal h2 { margin-top: 22px; font-size: 23px; }
  .signal-details { grid-template-columns: 1fr 1fr; gap: 16px; }
  .signal-details div:last-child { grid-column: 1 / -1; }
  .summary-head { padding: 17px 16px 14px; }
  .metric { padding: 15px 16px; }
  .metric strong { font-size: 16px; }
  .section-heading { grid-template-columns: 28px minmax(0, 1fr); }
  .graph-scroll { padding: 20px 16px 22px; }
  .node { flex-basis: 184px; }
  .connector { flex-basis: 40px; }
  .graph-foot { padding: 12px 16px; }
  .finding { display: block; padding: 18px 16px; }
  .finding-copy { margin-top: 14px; }
  .finding-meta { justify-content: flex-start; margin-top: 14px; }
  .provenance { display: block; }
  .provenance span { display: block; margin-top: 6px; }
}

@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto; } }
`;
