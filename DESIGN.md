---
version: alpha
name: Causalwire Precision Dark
description: "A near-black evidence canvas for protocol incident response. Dense, technical, and calm, with amber reserved for the first broken causal edge."
colors:
  primary: "#d97706"
  on-primary: "#ffffff"
  primary-hover: "#f59e0b"
  primary-focus: "#b45309"
  ink: "#f7f8f8"
  ink-muted: "#d0d6e0"
  ink-subtle: "#8a8f98"
  ink-tertiary: "#62666d"
  canvas: "#010102"
  surface-1: "#0f1011"
  surface-2: "#141516"
  surface-3: "#18191a"
  hairline: "#23252a"
  hairline-strong: "#34343a"
  semantic-success: "#27a644"
  semantic-error: "#ef4444"
typography:
  display-md: { fontFamily: "Inter, system-ui, sans-serif", fontSize: 40px, fontWeight: 600, lineHeight: 1.15, letterSpacing: -1px }
  headline: { fontFamily: "Inter, system-ui, sans-serif", fontSize: 28px, fontWeight: 600, lineHeight: 1.2, letterSpacing: -0.6px }
  card-title: { fontFamily: "Inter, system-ui, sans-serif", fontSize: 22px, fontWeight: 500, lineHeight: 1.25, letterSpacing: -0.4px }
  body: { fontFamily: "Inter, system-ui, sans-serif", fontSize: 16px, fontWeight: 400, lineHeight: 1.5, letterSpacing: -0.05px }
  body-sm: { fontFamily: "Inter, system-ui, sans-serif", fontSize: 14px, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }
  caption: { fontFamily: "Inter, system-ui, sans-serif", fontSize: 12px, fontWeight: 400, lineHeight: 1.4, letterSpacing: 0 }
  mono: { fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: 13px, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0 }
rounded: { xs: 4px, sm: 6px, md: 8px, lg: 12px, xl: 16px, pill: 9999px }
spacing: { xxs: 4px, xs: 8px, sm: 12px, md: 16px, lg: 24px, xl: 32px, xxl: 48px, section: 96px }
---

# Causalwire evidence artifact design contract

## Surface hierarchy

- `canvas` is the page background; `surface-1` contains the incident summary and graph; `surface-2` contains diagnostics and legend.
- Use one-pixel `hairline` borders and 12px card radii. Do not use gradients, glass effects, decorative blobs, or drop-shadow stacks.
- The artifact is evidence, not a marketing dashboard: every panel must explain the run, causal graph, diagnostic, or legend.

## Color and state

- Amber `primary` is reserved for the first break label, its broken edge, focus states, and the brand wire mark.
- Success uses `semantic-success`; an ordinary diagnostic error uses `semantic-error`. Never rely on hue alone: pair all states with text, icons, and line style.
- Body copy uses `ink-muted`; metadata uses `ink-subtle`; titles use `ink`.

## Typography

- Use system sans for prose and system mono for protocol identifiers, sequence numbers, methods, codes, and counts.
- Titles use the compact headline/card-title scale. Evidence labels are uppercase 12px with modest tracking.
- Long methods and tool names wrap. Never shrink evidence text below 12px.

## Components

- Summary card: `surface-1`, 24px padding, four responsive metric cells.
- Diagnostic row: code badge, explicit severity text, message, and source sequence.
- Graph node: minimum 168px wide, 12px padding, status text plus shape/icon. Synthetic nodes use dashed borders.
- Broken edge: 3px amber stroke, dash pattern, and an adjacent `FIRST BREAK` label.
- Empty state: centered, concise explanation and the next `record` command; never invent graph nodes.
- Error state: actionable language without stack traces or secret-bearing values.

## Responsive rules

- At 1280px, content is capped at 1120px with 32px gutters.
- At 768px, metrics wrap to two columns and graph rows may scroll horizontally inside their panel.
- At 375px/320px, use 16px page padding, one-column metrics, wrapping metadata, and at least 44px interactive targets if controls are added.
- No information may depend on hover. HTML remains legible and complete with JavaScript disabled.

## Accessibility and safety

- HTML starts with a skip link and semantic `main`, `section`, table headings, and status text.
- SVG includes `<title>` and `<desc>`, `role="img"`, and an accessible label.
- All untrusted strings pass through centralized HTML/XML escaping. Raw frame content is never rendered.
- CSP allows no network or script execution. Fonts are local system fonts.

## Do / don't

- Do keep spacing on the 4/8/12/16/24/32/48 scale and repeat the same status vocabulary across CLI, HTML, and SVG.
- Do present capture completeness and content policy prominently.
- Don't use more than the single amber accent, hide failures behind color, or add unrelated marketing modules.
- Don't add live controls, analytics, external assets, or a browser runtime graph library.

## Adaptations

- Based on the `linear.app` precision-dark system from the local awesome-design-md collection.
- Rotated the lavender primary to amber (greater than a 40-degree hue shift) to establish a distinct causal-break signal.
- Replaced Linear Display/Text/Mono with system Inter-compatible sans and system monospace stacks so exported artifacts remain self-contained.
- Preserved the dark surface ladder, spacing scale, restrained hairlines, compact type hierarchy, component geometry, and responsive discipline; narrowed components to the static evidence surface defined by SPEC.
