# causalwire launch plan

**Status:** launch-ready draft, not authorization to publish  
**Prepared:** 2026-08-10 (Asia/Tokyo)  
**Primary audience:** MCP server authors and AI-platform engineers in North America and Europe  
**Primary GitHub language:** TypeScript  
**Owner:** one named human maker; every external post and reply is sent manually by that person

This plan concentrates an honest, technically useful launch into one 48-hour window. It does not authorize creating a remote, pushing, publishing to npm, or posting anywhere. It never asks for votes, stars, likes, reposts, or coordinated engagement.

## 1. Launch decision and dates

### Recommended window

| Event | Target-market time | Asia/Tokyo | Purpose |
|---|---|---|---|
| Product Hunt day starts | Tue **2026-08-25 00:01 PDT** (`America/Los_Angeles`) | Tue **2026-08-25 16:01 JST** | Be available for the complete PH day; PH uses a Pacific-time daily cycle. |
| Show HN submission | Tue **2026-08-25 08:05 PDT** | Wed **2026-08-26 00:05 JST** | North-American workday start and European afternoon; the maker can answer for four hours. |
| X launch post | Tue **2026-08-25 08:30 PDT** | Wed **2026-08-26 00:30 JST** | Send the demo after the HN page is live; do not ask for votes. |
| LinkedIn post | Tue **2026-08-25 09:00 PDT** | Wed **2026-08-26 01:00 JST** | Reach platform and observability practitioners with a use-case-led post. |
| Existing opt-in newsletter | Tue **2026-08-25 09:30 PDT** | Wed **2026-08-26 01:30 JST** | Notify only subscribers who already opted in. |
| One rules-cleared Reddit post, or skip | Wed **2026-08-26 09:00 PDT** | Thu **2026-08-27 01:00 JST** | Reach one relevant community after its current rules are captured and satisfied. |
| 48-hour focus ends | Thu **2026-08-27 00:01 PDT** | Thu **2026-08-27 16:01 JST** | Stop launch broadcasting; keep answering genuine questions. |

The timing is an operational inference, not a ranking guarantee: Tuesday leaves Monday for a final release rehearsal, spans the Product Hunt day boundary, provides US/Europe overlap, and keeps the maker awake for the highest-context technical discussion. The staggered slots prevent the solo maker from abandoning one discussion to seed another. Product Hunt documents that its day refreshes at midnight Pacific; it does not promise a rank benefit from launching at that instant ([Getting started](https://help.producthunt.com/en/articles/2305333-getting-started), [How to post](https://help.producthunt.com/en/articles/479557-how-to-post-a-product)).

**Fallback:** Tue **2026-09-08**, using the same Pacific/JST slots. This follows the US Labor Day holiday on 2026-09-07 and gives two more weeks for external CI, package propagation, screenshots, or human-written comments. Postpone to the fallback if any hard gate below fails; do not launch an incomplete package to preserve a date.

### Honest goal, not a promise

- M0 objective: contend for the TypeScript weekly Trending page first, then the all-language page.
- Planning priors supplied by the venture charter: TypeScript/language category **150–400 stars/week** and **30–60/day**; all-language **400–600/week** and **80–150/day**.
- Working target until recalibrated: **300–450 stars in seven days**, including **100–150 in the first 24 hours**. These are internal measurement targets, never copy for outreach and never a reason to request stars.
- GitHub does not publish a stable Trending ranking formula or threshold. Treat every threshold as an observed planning estimate, not an official rule or claim. GitHub describes Trending only as what its community is excited about ([GitHub Trending](https://github.com/trending)).

## 2. Hard go/no-go gates

All boxes must be checked by **2026-08-24 12:00 PDT / 2026-08-25 04:00 JST**. The named human owner records a link or screenshot next to each external-state item.

- [ ] Repository is public under the intended organization, default branch is `main`, and the exact settings in [`launch/repo-settings-checklist.md`](../launch/repo-settings-checklist.md) are applied.
- [ ] Node 20/22/24 × Linux/macOS/Windows CI is green on the public commit, including the OS-child benchmark and packed-package smoke test.
- [ ] Security workflow, CodeQL, link check, dependency audit, and repository audit are green; Critical/High open findings remain zero.
- [ ] `causalwire@0.1.0` is available from the public npm registry with provenance and `npx -y causalwire@0.1.0 demo` works in a clean directory.
- [ ] README links, release notes, license, install command, demo GIF, social preview, issue forms, private security reporting, and the `v0.1.0` GitHub release are visible to a signed-out visitor.
- [ ] The social preview is uploaded and renders without cropping. GitHub recommends 1280×640 and a file under 1 MB; the prepared file is `artifacts/social/causalwire-social-preview.png` ([GitHub social preview documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview?apiVersion=2022-11-28)).
- [ ] Product Hunt profile, media, product URL, and scheduled draft have been manually previewed.
- [ ] The maker has independently written the Product Hunt maker comment and Show HN first comment from the factual briefs below. Do not paste AI-generated comment prose: Product Hunt disallows AI-generated comments, and HN asks users not to post generated or AI-edited comments ([PH commenting guidelines](https://help.producthunt.com/en/articles/10030102-commenting-guidelines), [HN guidelines](https://news.ycombinator.com/newsguidelines.html)).
- [ ] Reddit community rules have been retrieved through an authenticated official interface or user-provided export and recorded in §6. If not, Reddit is **skipped**, not guessed.
- [ ] One person is available to reproduce bugs, correct claims, and answer for four hours after Show HN; a second session is scheduled for the following European morning.

Gate C evidence and the public Node 20/22/24 × Linux/macOS/Windows matrix are green. GitHub source is public; npm publication and literal `@latest` smoke remain pending registry authentication.

## 3. Positioning and claim boundary

### One-line pitch

> A local flight recorder for MCP: capture stdio, find the first broken causal edge, and export the evidence to OpenTelemetry.

### Audience/problem/result

- **Who:** engineers operating or debugging MCP stdio servers.
- **Problem:** request/response and progress relationships are difficult to reconstruct from unrelated logs or backend traces.
- **Result:** wrap a child with one command, retain bounded local evidence, and identify the earliest defined JSON-RPC correlation break.
- **Why now:** MCP usage is growing while protocol-native debugging and portable evidence remain uneven; this is the thesis to validate, not an established market fact.

### Claims permitted at launch

- It wraps an MCP **stdio** child without modifying the child and forwards tested byte streams byte-exactly.
- Content capture is off by default; the journal still contains potentially sensitive metadata, hashes, sizes, method/tool names, and timing.
- It detects defined wire-verifiable JSON-RPC failures and reports the earliest such break.
- It creates terminal, standalone HTML/SVG, offline OTLP JSON, and explicitly configured OTLP/HTTP outputs from the same normalized graph.
- Local Linux/Node 22 evidence: 20/20 exact seeded conformance cases; 2.402 ms maximum incremental p95 shadow-path overhead; 4.207 ms child-process overhead; zero measured byte mismatch in their documented fixtures. Always link the benchmark conditions.
- No account, cloud backend, Docker, API key, or analytics connection is required for the demo.

### Claims prohibited or qualified

- Never call causalwire a sandbox, redactor, authenticated evidence store, semantic root-cause engine, or lossless recorder under every OS/storage failure.
- Never claim HTTP, A2A, replay, cloud storage, automatic remediation, or production readiness; these are non-goals or future work.
- Never generalize the local benchmark to remote MCP latency or unsupported hardware. Add cross-platform language only after the public matrix is green.
- “First break” means the earliest **defined protocol correlation break**, not the human cause of an incident.
- Full-content mode writes plaintext frames; hashes are not anonymization or redaction.
- Do not claim GitHub Trending, Product Hunt rank, Show HN rank, adoption, or customer outcomes before they happen.

## 4. Product Hunt package

Product Hunt requires a personal account, a working product, a clear listing, and a useful launch; its featuring guidance emphasizes live, useful, novel, well-crafted products ([How to post](https://help.producthunt.com/en/articles/479557-how-to-post-a-product), [Featuring guidelines](https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines)). Scheduling can be done up to 30 days ahead ([Scheduling guide](https://help.producthunt.com/en/articles/2724119-how-to-schedule-a-post)). Verify field limits in the live form before saving.

### Listing copy

**Name**  
`causalwire`

**Recommended tagline**  
`Find the first broken edge in MCP stdio`

**Alternatives**

1. `A local flight recorder for MCP failures` — clearest category; slightly less specific.
2. `Capture MCP stdio. Export causal evidence.` — concrete workflow; weaker outcome.
3. `Debug MCP request chains from the wire` — technically clear; less distinctive.

**Description**  
`causalwire wraps an MCP stdio server, forwards bytes unchanged, and writes a local content-off-by-default journal. It pinpoints defined JSON-RPC correlation breaks, renders CLI/HTML/SVG evidence, and exports metadata to your OTLP backend.`

**URL**  
The final public GitHub repository URL, not a waitlist or placeholder.

**Pricing**  
`Free · Open source (Apache-2.0)`

**Topic candidates**  
Developer Tools, Open Source, and Observability. Select only topics present and accurate in the live Product Hunt form.

### Media order

1. Thumbnail: a square, legible derivative of the prepared social visual; preview it at 64 px.
2. The real 8-second `causalwire demo` GIF; no simulated terminal output.
3. 1270×760 image: `FIRST BREAK D004` and the causal path, with the diagnostic definition visible.
4. 1270×760 image: terminal quickstart plus the generated HTML evidence.
5. 1270×760 image: “content off by default” boundary—metadata retained, payload content not retained.
6. 1270×760 image: architecture—client bytes → causalwire → child; bounded local journal → graph → HTML/SVG/OTLP.

Every image needs truthful alt text. Do not show unreleased HTTP/A2A/cloud UI. Product Hunt currently recommends a 240×240 thumbnail and a gallery around 1270×760; re-check the live form at T-2 ([How to post](https://help.producthunt.com/en/articles/479557-how-to-post-a-product)).

### Human-written maker comment brief — do not paste as a comment

Product Hunt comments must be written by the human maker, not generated or AI-edited. The maker should independently turn these verified facts into their own words:

- the triggering experience: protocol bytes existed but the first broken request/progress/response relationship was buried across logs;
- what shipped: MCP stdio wrapper, bounded content-off journal, deterministic GraphV1, HTML/SVG/OTLP outputs;
- the smallest reproduction: `npx -y causalwire@0.1.0 demo`;
- one honest metric with its local environment and link to the report;
- the privacy and sandbox boundaries;
- a specific question: “Which real MCP failure fixture or OS/process edge case should become the next conformance test?”

Write the final comment from a blank editor, compare it against the facts, then have a human reviewer remove hype. Do not mention rankings or request an upvote.

### Product Hunt #1 contention rationale and operations

- Start at the documented Pacific day boundary so the listing has the full day; this is availability strategy, not a ranking exploit.
- Lead with the real failure-to-evidence GIF and a 60-second runnable package. A live, immediately useful artifact aligns with PH featuring criteria better than a roadmap.
- Keep the maker present through the US morning. Answer substantive questions with reproduction steps, limitations, and links; do not post generic acknowledgements.
- Share the product page only in normal owned channels with descriptive copy. Product Hunt explicitly allows organic sharing but prohibits mass messaging, vote asks, incentives, and coordinated voting ([Sharing guidance](https://help.producthunt.com/en/articles/2690626-how-do-i-share-my-post), [Community guidelines](https://help.producthunt.com/en/articles/3615694-community-guidelines)).
- If the product is not featured or ranked, continue support and collect activation evidence. Do not relaunch, brigadier, or manufacture engagement.

### Product Hunt FAQ facts

| Question | Answer boundary |
|---|---|
| Does it replace Langfuse/Phoenix/Tempo? | No. It produces local evidence and optional OTLP output for an existing backend. |
| Does it record prompts and secrets? | Content is off by default, but metadata can still be sensitive. Full plaintext capture is explicit opt-in. |
| Does it alter MCP traffic? | The tested stdio path forwards bytes; capture failure prioritizes forwarding and reports incomplete evidence. Never promise perfect delivery under arbitrary host failure. |
| Does it find the root cause? | It identifies the earliest defined protocol correlation break, not semantic business root cause. |
| Is there a cloud service? | No. This release is local-only and Apache-2.0. |

## 5. Show HN package

HN requires a runnable product that people can try, preferably without signup, and a title beginning with `Show HN:`. It prohibits asking friends or others to upvote or comment ([Show HN guidance](https://news.ycombinator.com/showhn.html)). HN also asks for plain, non-promotional titles and prohibits generated or AI-edited comments ([HN guidelines](https://news.ycombinator.com/newsguidelines.html)).

### Title comparison

| Candidate | Clarity | Technical specificity | Hype risk | Decision |
|---|---:|---:|---:|---|
| **`Show HN: A local flight recorder for MCP stdio failures`** | High | High | Low | **Use this.** It names the category, protocol, transport, and problem without an unsupported outcome claim. |
| `Show HN: Find the first broken causal edge in MCP stdio` | Medium | High | Medium | Good README pitch, but “causal edge” needs explanation and “first” is easily overread as root cause. |
| `Show HN: Capture and inspect MCP stdio failures locally` | High | Medium | Low | Safest alternative, but it hides the differentiating correlation analysis. |
| `Show HN: causalwire – Wireshark for MCP` | High | Low | Medium | Do not use: the analogy implies packet-analysis scope and capabilities that the MVP does not have. |

Submit the public GitHub repository URL. The README is the landing page and must show the pitch, real GIF, 60-second command, license, and limitations without requiring an account.

### Human-written first-comment brief — this is the required “body,” not postable prose

HN policy means the maker must write the final first comment independently. It should cover, in this order:

1. **Problem in one personal sentence:** why timestamp-sorting logs failed for an MCP stdio request chain.
2. **Mechanism:** byte-forwarding wrapper, bounded JournalV1, versioned normalization, deterministic diagnostics, then HTML/SVG/OTLP.
3. **Try it:** the pinned `npx -y causalwire@0.1.0 demo` command and expected `FIRST BREAK D004` result.
4. **Evidence:** 20/20 seeded cases and the two local p95 measurements, each qualified by Linux/Node 22 and linked reports.
5. **Security boundaries:** unsandboxed child, content off by default but sensitive metadata remains, full content is plaintext opt-in.
6. **What it is not:** no HTTP/A2A/replay/cloud/semantic root-cause claim.
7. **Discussion prompts:** ask for failing MCP fixtures, Windows child/signal cases, and feedback on mapping evidence to existing OTLP backends.

The maker should disclose relevant assistance if they think readers would consider it material, but the actual comment and every reply must be their own writing. Never insert a call for votes, stars, or comments.

### Show HN #1 contention rationale and first four hours

- The recommended title optimizes comprehension rather than cleverness: unfamiliar name removed, familiar “flight recorder,” exact MCP stdio scope, concrete failure context.
- 08:05 PDT overlaps North-American morning and European afternoon. This is an inference for maker availability and discussion density; HN publishes no guaranteed best time.
- `T+0–15 min`: confirm link, install command, GIF, and package from a clean browser/machine; correct any factual mistake immediately.
- `T+15–120 min`: answer technical questions with source paths and reproduction commands. Prefer “I do not know; here is the boundary” to speculation.
- `T+2–4 h`: group repeated questions into README/FAQ improvements, but do not edit the HN title for hype or use off-platform coordination.
- `T+4–12 h`: one maker checks every 60–90 minutes. Acknowledge valid criticism and open real issues only with the reporter's consent.
- If flagged or absent from `shownew`, use the official HN contact path once with facts; do not repost automatically.

## 6. Reddit: rule-gated, one community, no cross-post blitz

### Verification state on 2026-08-10

An unauthenticated request to Reddit's official subreddit search/data endpoint returned HTTP 403. No authenticated Reddit connector, approved API credential, or user-provided subreddit rules export was available in this workspace. Therefore current subreddit-specific self-promotion rules, account-age/karma gates, flair, link restrictions, and moderator-approval requirements are **unverified**. Search-engine snippets or scraped subreddit pages are not an acceptable substitute.

No Reddit copy below is approved for posting. This is a deliberate safety gate, not a missing launch task.

### T-3 rule capture

The human owner must use Reddit's authenticated official UI/API or provide a direct export for each candidate. Record:

| Candidate | Why it may fit | Rules URL/export | Retrieved (UTC) | Self-promo/link rule | Flair/account gates | Moderator approval | Decision |
|---|---|---|---|---|---|---|---|
| `r/opensource` | Apache-2.0, local-first implementation and contributor surface | Pending | Pending | Pending | Pending | Pending | **Do not post** |
| `r/node` | child-process backpressure, signals, and Node 20/22/24 portability | Pending | Pending | Pending | Pending | Pending | **Do not post** |
| `r/typescript` | typed streaming parser and protocol normalization | Pending | Pending | Pending | Pending | Pending | **Do not post** |
| `r/modelcontextprotocol`, if it exists and is relevant | MCP-specific debugging fixture discussion | Pending | Pending | Pending | Pending | Pending | **Do not post** |

At T-3, choose **one** community only. Post only if the current rules explicitly permit the account, format, topic, and self-promotion ratio. If rules are ambiguous, ask moderators once through the official channel and wait. If no answer, skip. Never evade a filter, reuse identical copy, delete/repost for reach, coordinate votes, or post to multiple adjacent communities in the 48-hour window.

### Adaptation briefs after approval

These are inputs for a human-written, community-native post after rule review—not reusable promotional copy.

- **Open-source community:** lead with the Apache-2.0 implementation and an architectural tradeoff; show what contribution or independent review is wanted; link only if allowed.
- **Node community:** lead with the stdout backpressure/memory-DoS bug found during review, byte-exact regression, listener cleanup, and the green Windows/macOS/Linux CI matrix.
- **TypeScript community:** lead with bounded streaming JSONL/frame parsing and versioned schema/normalizer design; ask for API or type-level critique rather than stars.
- **MCP-specific community:** lead with one minimal stuck/orphan/duplicate-ID fixture and ask whether the diagnostic semantics match maintainers' real failures; make stdio-only scope prominent.

The post title and body must be rewritten for the selected community after its rules are captured. Answer comments there; do not funnel people to vote on HN or Product Hunt.

## 7. X, LinkedIn, and opt-in email

X prohibits platform manipulation, bulk/duplicative irrelevant posting, coordinated fake activity, and engagement spam ([Authenticity policy](https://help.x.com/en/rules-and-policies/authenticity)). LinkedIn requires true identity and authentic engagement and prohibits artificial engagement and spam ([Professional Community Policies](https://www.linkedin.com/legal/professional-community-policies)). Send once from the maker's normal account; do not use reply spam, auto-DMs, engagement pods, or synthetic accounts.

### X launch post

> MCP stdio failures can leave the bytes intact but the request chain hard to reconstruct.
>
> I built causalwire: a local, content-off-by-default flight recorder that finds the first defined JSON-RPC correlation break and exports the evidence to HTML/SVG or OTLP.
>
> 60-second demo: https://github.com/black-leg-nameko/causalwire

Attach the real demo GIF. The maker should adjust the first sentence to their actual experience and verify final character count in the live composer.

### Optional technical X thread

1. Launch post above.
2. “It sits between an MCP client and stdio child. Bytes keep moving; bounded shadow parsing writes a local JournalV1. The child is not sandboxed.” Include the architecture image.
3. “The useful unit is a protocol relationship, not another timestamp: duplicate in-flight ID, orphan response/progress, stuck request, version conflict, or incomplete capture.” Include the D004 image.
4. “The current evidence is local Linux/Node 22: 20/20 seeded conformance cases, with benchmark conditions in the repo. The public cross-platform matrix is a launch gate.” Link the report.
5. “I am looking for real, sanitized MCP failure fixtures and OS/process edge cases. Security reports go through the private policy in the repo.” This is a contribution request, not an engagement request.

### LinkedIn post

> Debugging an MCP stdio failure often starts with timestamps from several logs. That tells you what was nearby, not which request/progress/response relationship broke first.
>
> I built causalwire, an Apache-2.0 local flight recorder for MCP stdio. It wraps an existing child process, keeps content off by default, identifies defined JSON-RPC correlation breaks, and renders the same evidence as terminal output, standalone HTML/SVG, or OTLP metadata.
>
> The repository includes a 60-second demo, seeded conformance fixtures, benchmark conditions, security boundaries, and the failures found during its pre-release review. It is stdio-only today; it is not a sandbox, arbitrary redactor, replay system, or semantic root-cause engine.
>
> If you operate MCP servers, I would value examples of sanitized failure shapes or portability edge cases: https://github.com/black-leg-nameko/causalwire

Do not tag uninvolved people or companies. Respond in depth to real questions; do not ask colleagues to like or reshare.

### Existing opt-in email

**Subject A:** `causalwire: a local flight recorder for MCP stdio`  
**Subject B:** `Find the first broken MCP request edge from the wire`

Body structure: the problem in two sentences; one real GIF; pinned demo command; three claim-boundary bullets; GitHub link; reply invitation for sanitized fixtures. Send only to an existing, consented list. Do not buy, scrape, append, or cold-blast addresses.

## 8. Forty-eight-hour operating plan

| Time from PH start | Action | Owner evidence | Stop condition |
|---:|---|---|---|
| T−24 h | Freeze release candidate; run `corepack pnpm verify:release`; exercise public tarball on a clean Node 20/22/24 host where available. | CI links, release-verification log, package provenance | Any Critical/High, red CI job, broken install, or unverifiable package → fallback date. |
| T−12 h | Preview PH listing and GitHub as signed out; human-finalize PH/HN comments; capture Reddit rules or mark skipped. | Screenshots and rule table | Missing rule/asset/owner coverage → omit that channel. |
| T+00:00 | PH starts. Verify listing and answer genuine questions. | PH URL and issue notes | Incorrect install/claim → correct or unpublish listing if necessary. |
| T+08:04 | Submit Show HN title + GitHub URL. Human posts their independently written first comment. | HN item URL | Product cannot be tried → do not submit. |
| T+08:29 | X post with GIF. | Native post URL | No GIF/link preview → fix before sending. |
| T+08:59 | LinkedIn post. | Native post URL | Unverified claim → remove it. |
| T+09:29 | Opt-in email, if a real consented list exists. | Campaign record | No consent record → skip. |
| T+10–20 h | Respond, reproduce, correct docs, label real issues, thank reporters. | Issue links/changelog | Maker fatigue → stop new channel posts and protect response quality. |
| T+32:59 | One Reddit post only if §6 is fully approved. | Rule capture + post URL | Any rule ambiguity → skip. |
| T+48 h | End concentrated distribution; publish a short factual status only if there is useful evidence. | Metrics snapshot | Never turn a weak result into extra unsolicited posting. |

### Incident playbook

- **Install/demo broken:** acknowledge, pin or visibly publish workaround, stop new promotion, patch through reviewed release workflow, and update every affected listing.
- **Security report:** move details to the private channel in `SECURITY.md`, preserve evidence, do not debate exploit details publicly, and halt launch if impact may be High or Critical.
- **Misleading benchmark interpretation:** correct the post in place where possible and link the conditions; do not defend an overbroad claim.
- **Traffic without activation:** improve the first-run path and ask consenting users what failed. Do not compensate with more posting.
- **Harassment or low-quality debate:** apply platform rules, disengage, and preserve the Code of Conduct; do not mobilize supporters.

## 9. Trending calibration: T−14 through T−1

GitHub topics are public and should describe purpose, subject, and language; apply the nine accurate topics in the repository settings checklist, within GitHub's limit of 20 ([GitHub topics documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics?apiVersion=2022-11-28)). Generated artifacts and documentation are marked for Linguist so the primary source category accurately remains TypeScript; this is classification hygiene, not a ranking tactic.

At the same time daily—recommended **16:30 UTC / 09:30 PDT / 01:30 JST next day**—a human records the public daily and weekly pages for:

1. [all-language Trending](https://github.com/trending?since=daily) and [weekly](https://github.com/trending?since=weekly);
2. [TypeScript daily](https://github.com/trending/typescript?since=daily) and [weekly](https://github.com/trending/typescript?since=weekly).

Store a dated screenshot and a CSV row under an external launch-operations folder, not in the npm package. For positions 1–25 record rank, repository, displayed stars for the period, total stars, apparent age if known, and whether the item was already present yesterday. Do not automate around access controls or treat missing data as zero.

On T−3 calculate:

- TypeScript entry target = `max(150/week, 1.25 × median displayed weekly stars at positions 10–20)`;
- TypeScript first-day target = `max(30/day, 1.25 × median displayed daily stars at positions 10–20)`;
- all-language stretch target = `max(400/week, 1.25 × median displayed weekly stars at positions 10–20)`;
- operational capacity = how many real questions/issues one maker handled per hour in the dry run.

Use seven non-missing observations and publish the calculation internally. If the observed tail is materially above the venture priors, raise the internal target; never lower product quality or manufacture activity to chase it. If GitHub changes or removes the displayed values, report the method as unavailable.

Trending appearing may add an estimated **10–20 organic stars/day** according to the venture charter, but this is an internal heuristic, not GitHub documentation. Measure any lift against the previous 24-hour baseline and label it observational, not causal.

## 10. Two-week follow-through

| Day | Ship or learn | Distribution boundary | Decision signal |
|---:|---|---|---|
| 0–2 | Respond, reproduce, fix release-blocking defects, and capture first-run friction. | No new communities beyond the scheduled channels. | Installs, successful demos, qualified issues, sanitized fixture offers. |
| 3 | Publish a deep technical article: “Making a stdio recorder honor backpressure without retaining payloads.” Include the fixed High finding, tests, and limits. | Post once to the maker's normal channel; do not recycle it as duplicate community submissions. | Completion rate, qualified repository visits, external review. |
| 4–5 | Add consented, sanitized fixtures or portability tests. | Credit contributors only with permission. | Distinct fault families and OS coverage. |
| 7 | Release `v0.1.1` only if it contains verified fixes. Otherwise publish a factual week-one note instead of an empty release. | Normal release notes; no vote requests. | 7-day TypeScript velocity and activated installs. |
| 8–10 | Publish a conformance-corpus note comparing defined diagnostic semantics, not competitor marketing. | Share with relevant maintainers only where contextually useful. | Fixture contributions and mapping critique. |
| 11–13 | Prepare `v0.2` only if real evidence supports one scoped improvement, such as a current-version mapping or portability fix. | Do not expand into HTTP/A2A/cloud merely for launch content. | Repeat usage and real incident evidence. |
| 14 | Update `docs/RETRO.md`: keep/kill/pivot, actual velocity, usage, issue/contributor quality, and channel attribution uncertainty. | One honest follow-up; no “last chance” spam. | Thesis kill criteria below. |

The flywheel is useful work → credible update → renewed discovery, not repeated announcements. A Trending appearance is an input to measure, never proof of product-market fit.

## 11. Measurement and learning

Capture only native aggregate statistics and explicit user reports; causalwire itself has no network analytics. Avoid identity-level tracking.

| Funnel stage | Metric | Source | Launch interpretation |
|---|---|---|---|
| Discovery | unique repository visitors, referrers, PH/HN/X/LinkedIn native views | Platform-native aggregate dashboards | Directional; referrers and windows overlap. |
| Interest | README-to-install questions, package-page visits, stars/forks | GitHub/npm native data | Stars are attention, not activation. |
| Activation | successful demo reports or voluntary local usage-log export | Explicit user report only | Do not infer an install is a successful run. |
| Value | sanitized failing traces offered, first-break usefulness, OTLP requests | Issues/interviews with consent | Primary wedge evidence. |
| Retention | teams using the tool again after 7/14/30 days | Consented follow-up | More important than rank. |
| Community | external issue reporters and contributors | GitHub | Count genuine distinct people, not comment volume. |

Evaluate the thesis without moving goalposts:

- T+7: from 200 qualified views, fewer than 10 installs/confirmed trials, fewer than five failing-trace offers from ten interviews, or ≥70% saying SDK traces are sufficient → kill or narrow the standalone recorder.
- T+21: fewer than 80% exact first-break identification on 20 real/seeded failures, p95 capture overhead above 5 ms under the defined benchmark, or content-off evidence cannot restore needed correlations → kill the technical hypothesis.
- T+30: below 150 weekly stars **and** fewer than three external staging organizations → revisit distribution/wedge; stars alone never kill a product with real use.

## 12. Day-of checklist

### Before opening the window

- [ ] Run and archive `corepack pnpm verify:release` on the exact public release commit.
- [ ] Confirm 9-cell Node/OS CI, security, link, package smoke, and provenance evidence.
- [ ] Verify `npx -y causalwire@0.1.0 demo` in a clean directory and all README relative links signed out.
- [ ] Confirm npm tarball contains only the audited 16-file contract or explain a reviewed change.
- [ ] Re-scan secrets and dependency advisories; Critical/High open = 0.
- [ ] Re-check package name, repository URL, social preview, GitHub topics, About text, license, funding field, and private vulnerability reporting.
- [ ] Capture T−14 calibration and set final internal targets.
- [ ] Human-finalize PH/HN comments and spell out claim qualifiers.
- [ ] Record current rules for every platform; Reddit must show one approved community or “skipped.”
- [ ] Open a response log with owner, timestamp, issue, severity, action, and next update.

### During and after

- [ ] Verify every public link after posting; replace `@latest` references with the pinned version where reproducibility matters.
- [ ] Respond to breakage and security first, technical questions second, praise last.
- [ ] Record corrections visibly and propagate them across affected listings.
- [ ] Do not mention voting, rankings, “support,” signal boosting, or coordinated engagement.
- [ ] At 24 h and 48 h record native metrics and uncertainty; do not scrape unavailable data.
- [ ] At day 7 and day 14 update the retro and decide against predeclared criteria.

## 13. Source and evidence log

All platform rules below were rechecked on **2026-08-10**. Links are primary platform documentation. Platform forms and policies can change; the human owner reopens every source at T−3.

| Source | Launch question | Confidence / use |
|---|---|---|
| [HN Show guidance](https://news.ycombinator.com/showhn.html) | Is the project tryable, title-compliant, and free of vote solicitation? | High; official HN page. |
| [HN guidelines](https://news.ycombinator.com/newsguidelines.html) | Title tone, self-promotion, voting, and generated-comment rules | High; official HN page. |
| [PH how to post](https://help.producthunt.com/en/articles/479557-how-to-post-a-product) | Listing fields, personal account, media, daily cycle | High; official PH help. Recheck form dimensions/limits. |
| [PH featuring guidelines](https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines) | Live/useful/novel/craft criteria | High; official PH help, updated 2026-03-10. |
| [PH sharing guidance](https://help.producthunt.com/en/articles/2690626-how-do-i-share-my-post) | Organic sharing versus prohibited vote asks/mass outreach | High; official PH help. |
| [PH community guidelines](https://help.producthunt.com/en/articles/3615694-community-guidelines) | Bots, incentives, coordinated activity, identity | High; official PH help. |
| [PH commenting guidelines](https://help.producthunt.com/en/articles/10030102-commenting-guidelines) | Human-authored comments and authentic discussion | High; official PH help. |
| [PH scheduling](https://help.producthunt.com/en/articles/2724119-how-to-schedule-a-post) | Draft scheduling window | High; official PH help. |
| [GitHub Trending](https://github.com/trending) | Current public category observations | Medium; official dynamic page, but no official formula or stable threshold. |
| [GitHub topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics?apiVersion=2022-11-28) | Accurate public topic metadata | High; official docs. |
| [GitHub social preview](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview?apiVersion=2022-11-28) | Preview dimensions and size | High; official docs. |
| Reddit official data endpoint attempt | Subreddit discovery/rule access | High only for the observed HTTP 403. No subreddit rule conclusion was drawn. |
| [X authenticity policy](https://help.x.com/en/rules-and-policies/authenticity) | Spam, platform manipulation, coordinated/fake activity | High; official X policy. |
| [LinkedIn Professional Community Policies](https://www.linkedin.com/legal/professional-community-policies) | Identity, spam, and authentic engagement | High; official LinkedIn policy. |

## 14. Publication authority

The agent prepared repository files, audit evidence, and drafts only. A human must perform every public-state action: create/configure the GitHub remote, push, enable settings, publish the npm package, create the release, schedule Product Hunt, submit Show HN, and post to Reddit/X/LinkedIn/email. A launch-day checklist item is not authorization to execute it.
