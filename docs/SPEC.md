# causalwire MVP — Product / Implementation Spec

- Date: 2026-08-10 (Asia/Tokyo)
- Status: draft for builder handoff（Gate Aは通過済み）
- Input: [THESIS.md](./THESIS.md)
- Product surface: English-first OSS CLI / TypeScript library
- License target: Apache-2.0

## このMVPで検証する仮説

MCP server を運用する AI platform engineer は、framework-native trace だけでは request/response の欠落や相関破損を短時間で特定できず、**1コマンドで MCP stdio の wire traffic を記録し、最初に壊れた causal edge を10秒以内に示し、既存 OTLP backend へ送れる local-first tool**を導入する。

MVPの技術的成立条件は次の2つである。

1. 定義済みの20件以上の seeded/consented-real failure corpus で、ground truth と一致する「最初の causal break」の code と位置を **80%以上**自動特定する。
2. default の `content=off` capture で、direct pass-through baselineに対する追加exchange latencyが、規定benchmarkの **p95で5ms以下**である。

市場仮説の成立条件は THESIS の T+7 criteria（200 qualified viewsから10 installs、10 interview中5件のfailing trace提供、3件のOTLP export希望）で別途判定する。MVPはその検証に必要な artifact と opt-in usage evidence を生成する。

## スコープ外（v2以降）

- A2A live proxy、A2A JSON-RPC capture/normalization
- MCP Streamable HTTP proxy、remote MCP transport
- OpenAI-compatibleを含むLLM HTTP proxy
- hermetic replay、cassette生成、network/side-effect virtualization
- runaway loop/budget fuse、requestの遮断・改変・policy enforcement
- cloud backend、hosted viewer、共有URL、team account、auth、RBAC、長期retention
- autonomous LLM root-cause analysis、semantic diagnosis
- 完全PII/secret redaction、encrypted content vault。「安全にredact済み」とは主張しない
- generic agent observability dashboard、eval、cost analytics、framework/harness adapters
- SQLiteや外部DB。MVPのjournalはappend-only JSONLのみ
- full-screen TUI。MVPはnon-interactive CLI viewとself-contained HTML/SVG exportを提供する
- process/filesystem/environmentの再現、child processのsandboxing
- MCP serverの正しさ・安全性の保証。causalwireは観測し、trafficを許可/拒否しない

## 1. 前提と決定

| 項目 | MVPの決定 |
|---|---|
| 対象ユーザー | 英語圏、10–200人規模のAI-native企業でMCP serverとincident responseを所有するAI platform/staff engineer |
| 実装期間 | soloまたは小チーム、1–3週間 |
| Runtime | Node.js 20 / 22 / 24、TypeScript、ESM |
| OS | Linux、macOS、Windows。CIで3 OSを検証 |
| Package | npm package `causalwire`、bin名 `causalwire`。registry衝突時のみ `@causalwire/cli`へfallback |
| Package manager | pnpm。published packageはnpm/npxで利用可能にする |
| UI | English-first CLI + self-contained static HTML/SVG。ブラウザappは作らない |
| Storage | local append-only JSONL。既定 `.causalwire/runs/<UTC timestamp>-<run id>.jsonl` |
| Config | config file不要。zero-config defaults + CLI flags +標準OTel環境変数 |
| Capture | MCP stdio child-process wrapperのみ。双方向byte streamを変更せずteeする |
| Privacy | `content=off`が既定。full wire contentは明示 `--content full` のみ |
| Telemetry | network telemetryは常時off。任意のlocal usage logのみopt-in |

`venture-context.yaml`、既存code、確定launch deadlineはない。価格・cloud機能は本仕様に含めない。ユーザー向け文言、help、error、fixture名は英語とし、開発者向け仕様は本書の日本語を正とする。

## 2. Problem、job、value

### Problem

MCPのtransportが動いていても、response欠落、ID相関の破損、重複in-flight ID、孤立notificationなどにより、agent→toolの因果関係がtrace backendで見えない。現状はtimestampやframework固有metadataを人手で突き合わせる。さらにOTel GenAI/MCP conventionsは変化中であり、derived spanだけ保存すると将来のmappingで再解析できない。

### Core job-to-be-done

> “My MCP tool call failed or hung. Without changing the server SDK or sending payloads to a new backend, show me the first protocol correlation that broke, and let me export the evidence to my existing OTLP backend.”

### Value boundary

- causalwireが断定するのは、wire上の明示的correlatorから検証できる因果だけである。
- timestamp順だけを理由にparent/childを捏造しない。
- `content=off`時もmethod、hashed request ID、tool name、status、duration、size、hash、schema fingerprint、protocol versionで診断する。
- “lossless”は (a) child/clientへ転送するbytesを変更しないこと、(b) `content=full`時のjournalがframe bytesを保持することを指す。default journalがpayloadをlossless保存する、という意味ではない。

## 3. Goals、success metrics、guardrails

### Primary activation metric

インストール後、ユーザーが24時間以内に `record` で1件以上のrequest/response exchangeをcaptureし、`inspect`または`export html`でanalysisを完了すること。計測は自動送信せず、opt-in local usage logまたは明示的なuser researchで確認する。

### MVP product goals

1. Node.js導入済み環境で、README冒頭の `npx -y causalwire@latest demo` により60秒以内に価値を体験できる。
2. package install済みの標準開発機で、`causalwire demo`開始から10秒以内にfirst breakをCLI表示し、HTMLを生成する。
3. `causalwire record -- <child command>` の1コマンドでchild MCP serverを起動し、stdin/stdoutを透過転送してjournalへappendする。
4. raw captureとversioned derived graphを分離し、同じjournalを新しいnormalizerで再生成できる。
5. first causal break精度80%以上、default capture overhead p95 5ms以下を再現可能なtest/benchmarkで示す。
6. local graphをself-contained HTML/SVGおよびOTLPへexportし、独自backendを要求しない。

### Guardrails

- wrapperのlog/statusは必ず`stderr`へ出す。MCP channelである`stdout`へ1 byteも混入させない。
- childとの間を流れるbytesの順序・内容を変更しない。
- capture/export errorによって通信を意図的に遮断しない。ただしchild起動前にjournalを作れなければchildを起動せず失敗する。
- full contentをnetworkへ自動送信しない。OTLP exportでもpayload contentは既定で含めない。
- hashはredactionや匿名化ではない旨をhelpとdocsへ明記する。

## 4. Persona

### Primary: AI platform / staff engineer

- MCP serverをstaging/productionで運用する。
- incident時にrequest IDやtool名を複数logから手相関している。
- Jaeger、Tempo、Phoenix、Langfuse等、OTLPを受ける既存backendを持つか、local debuggingだけを望む。
- server SDKにinstrumentationを追加できない、または追加したくない。

### Secondary: MCP server maintainer

- protocol version更新時にfixture/conformance regressionを調べたい。
- downstream userから秘密を除いたjournal/HTMLを受け取りたい。

### Not a target in MVP

non-technical end user、LLM prompt analyst、FinOps、security enforcement owner、A2A-only developer、web dashboard administrator。

## 5. Core flows

### Flow A — 60-second first-run / 10-second demo

```bash
npx -y causalwire@latest demo
```

1. Bundled `stuck-tool` fixtureを読み込む。network、Docker、API key、MCP serverは不要。
2. CLIが `FIRST BREAK D004 stuck_request`、method、tool、request node、elapsedを英語で表示する。
3. `.causalwire/demo/stuck-tool.html` と `.svg` を生成する。
4. TTYかつCIでない場合のみ、open方法を表示する。browserを自動起動しない。
5. install/download時間を含むquickstart目標は60秒、install済みcommand実行は10秒以内とする。

### Flow B — Real capture

```bash
causalwire record -- node ./dist/server.js
```

1. causalwireは出力directoryとjournalを安全に作成する。
2. `--`以降をshell経由で文字列評価せず、executable + argvとしてspawnする。
3. parent stdin bytesをchild stdinへ、child stdout bytesをparent stdoutへ即時転送する。同じchunksをshadow parserへ送る。
4. protocol frameごとにpolicy-filtered `wire` record、response相関時に`exchange` recordをjournalへappendする。
5. child stderrはparent stderrへそのまま転送する。内容はjournalへ保存しない。
6. child終了、signal、またはparent EOF時にbufferをflushし、journal pathとsummaryをstderrへ表示する。
7. child exit code/signalを規定どおり返す。

### Flow C — Diagnose and share

```bash
causalwire inspect .causalwire/runs/<run>.jsonl
causalwire export .causalwire/runs/<run>.jsonl --format html --out incident.html
causalwire export .causalwire/runs/<run>.jsonl --format svg --out incident.svg
```

`inspect`はjournalをvalidate→normalize→diagnoseし、summary、first break、compact DAGをstdoutへ出す。HTML/SVGは同じ`GraphV1`を入力にするため、CLIと表示内容が食い違わない。

### Flow D — Existing backend export

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
  causalwire export .causalwire/runs/<run>.jsonl --format otlp
```

normalizerがspan/event/linkへ変換し、OTLP/HTTP protobufで送る。endpoint/headers/TLSは標準OpenTelemetry環境変数を優先し、secret-bearing header値をlog/journalへ出さない。

## 6. CLI contract

### Global contract

```text
causalwire <command> [options]

Global options:
  --help
  --version
  --color auto|always|never       default: auto; NO_COLOR is honored
  --quiet                         suppress causalwire status, never child stderr
  --usage-log <path>              opt-in local-only product event JSONL
```

- CI/non-TTYではspinner、ANSI、Unicode line artを使わずstable textを出す。
- path、request ID、hash、tool nameをerror telemetryへ送らない。そもそもnetwork telemetryはない。
- stdinをjournal pathとして読む機能はMVPでは提供しない。`-`は予約し、usage errorにする。

### `demo`

```text
causalwire demo [--scenario stuck-tool|orphan-result|duplicate-id]
                [--out-dir <dir>] [--format cli|html|svg|all]
```

- default: `stuck-tool`, output dir `.causalwire/demo`, format `all`。
- 同名fileはatomic overwrite（temporary siblingへwrite後rename）してよい。demo artifactはjournalではない。
- `--scenario`不正時はusage error。

### `record`

```text
causalwire record [--out <journal.jsonl>]
                  [--content off|full]
                  [--protocol-version <version>]
                  [--request-timeout <duration>]
                  [--max-frame-bytes <bytes>]
                  [--max-journal-mb <MiB>]
                  -- <executable> [args...]
```

Defaults:

- `--out .causalwire/runs/<YYYYMMDDTHHMMSS.sssZ>-<8-char run id>.jsonl`
- `--content off`
- protocol version `auto`;観測できなければ`unknown`のままにする
- request timeout `30s`（live stuck表示用。closed runでは未応答をmissing扱い）
- max frame `16MiB`
- max journal `512MiB`

`--content full`はTTYでwarningをstderrへ出すがpromptはしないためautomationを止めない。`CAUSALWIRE_CONTENT=full`のような環境変数による暗黙opt-inは禁止する。

### `inspect`

```text
causalwire inspect <journal.jsonl>
                   [--mapping mcp-jsonrpc@1]
                   [--request-timeout <duration>]
                   [--format summary|dag|json]
                   [--fail-on none|warning|error]
```

- default format `summary`、default fail-on `none`。
- `json`は`GraphV1`をstdoutへ出す。進捗とwarningはstderr。
- `--fail-on warning|error`はCI向け。diagnostic severityが閾値以上ならexit 1。

### `export`

```text
causalwire export <journal.jsonl>
                   --format html|svg|otlp|otlp-json
                   [--out <path>]
                   [--mapping mcp-jsonrpc@1]
                   [--service-name <name>]
```

- HTML/SVGで`--out`省略時はjournal basenameに`.html`/`.svg`を付ける。
- OTLPは標準の `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`, `OTEL_EXPORTER_OTLP_TIMEOUT`, certificate系環境変数を利用する。CLI flagでheader secretを受けない。
- `otlp-json`はnetwork送信せず、検証用JSONを`--out`またはstdoutへ出す。
- OTLP endpoint未設定時はOpenTelemetry標準defaultを使わず、明示的なconfig errorにする。意図しないnetwork接続を避ける。

### Exit codes

| Code | 意味 |
|---:|---|
| 0 | command成功 / `inspect --fail-on none` |
| 1 | `inspect --fail-on`のdiagnostic threshold到達 |
| 2 | input journalのvalidation/parse error、または部分的にしか解析できないstrict operation |
| 64 | CLI usage error |
| 69 | OTLP endpoint unreachable / export unavailable |
| 70 | unexpected internal error |
| 74 | journal/output I/O errorまたはcapture incomplete |
| 78 | invalid mapping/configuration |

`record`はchildが起動した後はchildの0–255 exit codeを優先して返す。signal終了はPOSIXで`128 + signal number`、WindowsではNodeが得た終了code、codeがなければ1。childが0でもjournalが途中で書けなくなった場合は74。child non-zeroかつcapture errorの場合はchild codeを返し、stderrとfinal `process_exit` recordにcapture degradationを併記する。

## 7. Wire capture contract

### Transport/framing

- 対象はUTF-8、newline-delimited JSON-RPC 2.0のMCP stdio。
- proxy pathはbytesを受け取ったら先にforwardし、別のshadow bufferでLF frameを組み立てる。解析完了を待ってforwardしない。
- LFおよびCRLFを受理し、hashはdelimiterを含む実際のframe bytesに対して計算する。
- EOF時のunterminated bytes、invalid UTF-8、malformed JSON、non-object JSON、oversized frameも変更せずforwardする。journalにはcontent-free metadataとdiagnosticを残す。
- parent→childを`client_to_server`、child→parentを`server_to_client`と呼ぶ。MCPのserver-initiated requestもあるため、request方向を固定しない。
- backpressureはNode streamの`write()`/`drain`に従い、順序を保つ。parser側の遅延がproxyを無制限にblockしないようbounded queueを使う。

### Lifecycle

- journal作成後に`run_start`を最初のrecordとしてappendし、その後childをspawnする。
- SIGINT/SIGTERMは一度目をchildへforwardし、最大2秒flush待機する。二度目は即時終了。
- parent stdin EOFはchild stdinをendする。child stdout EOFはparent stdoutをendする。
- child stderrはstreamingでparent stderrへ渡し、journalにはsize/hashも含めて保存しない。
- flush policyは最大100msまたは64 recordsの早い方。正常終了時はfdatasync相当をbest effortで行う。process crash/power lossでは末尾100ms相当を失い得ることをdocumentする。
- journal size上限到達前に`capture_truncated`をappendし、以後のtrafficはforwardするがrecordしない。終了時はcapture incompleteとして扱う。

### Correlation

JSON-RPC request keyは `(origin_direction, canonical_id_hash)` である。canonical IDはJSONのnumberまたはstringのみを受け、typeを含むcanonical JSONへrun-local saltを加えてSHA-256する。`1`と`"1"`は異なる。

- request: `method`あり、`id`あり
- notification: `method`あり、`id`なし
- response: `result`または`error`あり、`id`あり
- responseは反対方向のin-flight requestにのみmatchする
- 同一keyのrequestが未完了の間に再登場したら`duplicate_inflight_id`
- responseにrequestがなければ`orphan_response`
- timeout中は`stuck_request`、run終了時の未応答は`missing_response`
- explicit tokenを持つprogress/cancellation notificationだけを元requestへlinkする。method timestampだけによるlinkは禁止

### Protocol version

各recordは次を持つ。

- `protocol.name`: 常に`mcp`
- `protocol.transport`: 常に`stdio`
- `protocol.version`: explicit CLI、wire上で明示されたversion、または`unknown`
- `protocol.version_source`: `cli|wire|unknown`

precedenceはCLI > wire。複数のwire versionが矛盾したら値を上書きせず`protocol_version_conflict`を診断する。versionをdateやpackage releaseから推測しない。unknown versionでもgeneric JSON-RPC capture/diagnosisは継続し、version-specific mappingのみwarning付きでskipする。

## 8. Content policy and privacy

### `off`（default）

保存を許可する値:

- JSON-RPC method（最大256 UTF-8 bytes。超過はtruncate + hash）
- tool name: `tools/call.params.name`のみ（最大256 bytes）
- request IDのrun-local salted hashとoriginal JSON type。plaintext IDは保存しない
- error code。error message/dataは保存しない
- status、duration、direction、timestamps、byte size、frame SHA-256
- top-level/structural schema fingerprint（field name、JSON type、collection length bucketのtree。scalar valueは含めない）
- negotiated/explicit protocol version

保存しない値:

- `params`、`result`、`error.message`、`error.data`、prompt、tool arguments/results、resource contents
- child argv全文、environment、cwd絶対path、child stderr
- raw frame bytes

tool/method名、サイズ、hashも機密metadataになり得る。`content=off`はPII-free保証ではない。schema fingerprintではobject key自体が機密になり得るため、標準allowlist外のkeyはplaintext保存せずhash化する。

### `full`（explicit opt-in）

- `wire.raw_b64`へdelimiterを含むframe bytesをbase64保存する。
- metadata fieldsも同時に保存する。
- journal headerの`content_policy`を`full`とし、HTML/SVGへraw contentを表示しない。MVP viewerはmetadata-onlyである。
- file permissionをPOSIX `0600`で作成する。Windowsはcurrent userのみを目標にACLを設定し、失敗時は明示warningを出す。
- full journalの共有前に利用者が別tool/processでreview/redactする必要がある。causalwireは完全redactionを提供しない。

### Hashing

- algorithmはSHA-256、hex lowercase。
- `frame_sha256`はexact frame bytesに対するhash。
- ID correlation用hashはrunごとの暗号学的random 128-bit saltを用いる。salt自体はjournal headerに保存しないため、run間linkabilityを作らない。
- hash一致はcontent同一性の補助であり、安全な匿名化とは主張しない。

## 9. Append-only JSONL schema (`causalwire.journal/v1`)

### General rules

- 1 line = 1 JSON object、UTF-8、LF終端。
- file内の既存bytesを更新・削除しない。新recordはappendのみ。
- 全record共通required fields: `schema`, `run_id`, `seq`, `kind`, `ts_wall`, `ts_mono_ns`。
- `seq`は0から始まる安全整数で、file内でstrictly increasing。
- `ts_wall`はRFC3339 UTC、`ts_mono_ns`はrun startからのdecimal string nanoseconds。
- unknown fieldはreaderが保持/無視できる。unknown `schema` majorはfail、minor/additive fieldはaccept。
- partial末尾lineはwarningとして無視し、それ以前を解析可能にする。中間line破損はexit 2だが、`inspect --format json`では取得できたdiagnosticもstderrへ返す。

### Record kinds

#### `run_start`

```json
{"schema":"causalwire.journal/v1","run_id":"cw_01...","seq":0,"kind":"run_start","ts_wall":"2026-08-10T00:00:00.000Z","ts_mono_ns":"0","content_policy":"off","recorder_version":"0.1.0","platform":"linux","node_version":"22.0.0","protocol":{"name":"mcp","transport":"stdio","version":"unknown","version_source":"unknown"},"command":{"executable_basename":"node"}}
```

Absolute command path、argv、cwd、envは保存しない。

#### `wire`

```json
{"schema":"causalwire.journal/v1","run_id":"cw_01...","seq":1,"kind":"wire","ts_wall":"2026-08-10T00:00:00.010Z","ts_mono_ns":"10000000","direction":"client_to_server","frame":{"bytes":91,"sha256":"<64 hex>","encoding":"utf8","parse_status":"ok","schema_fingerprint":"sha256:<64 hex>"},"rpc":{"type":"request","id_type":"number","id_hash":"sha256:<64 hex>","method":"tools/call","tool_name":"inventory.lookup"},"protocol":{"name":"mcp","transport":"stdio","version":"unknown","version_source":"unknown"}}
```

`rpc.type`は`request|response|notification|unknown`。responseには`status: ok|error`、error時のみnumeric/string `error_code`。`content=full`時のみ`frame.raw_b64`を追加する。

#### `exchange`

responseをmatchした時点でappendするderived-in-journal summaryである。source `wire` recordsを変更しない。

```json
{"schema":"causalwire.journal/v1","run_id":"cw_01...","seq":3,"kind":"exchange","ts_wall":"2026-08-10T00:00:00.060Z","ts_mono_ns":"60000000","request_seq":1,"response_seq":2,"id_hash":"sha256:<64 hex>","method":"tools/call","tool_name":"inventory.lookup","status":"ok","duration_ms":50.0,"request_bytes":91,"response_bytes":210,"request_sha256":"<64 hex>","response_sha256":"<64 hex>"}
```

normalizerはexchange recordをcacheとして利用できるが、wireから再計算して不整合をdiagnoseする。mapping version変更でjournalを書き換えない。

#### `capture_diagnostic`

capture時にしか分からないframing/backpressure/storage問題をappendする。

Required: `code`, `severity`, `at_seq`（該当frameがなければnull）, `message_key`。payload excerptは禁止。

#### `run_end`

Required: child `exit_code`/`signal`（spawn失敗時は両方null）、counts、`capture_complete`、`dropped_record_count`、`duration_ms`。spawn失敗時のみsanitized `spawn_error_class`を持てる。必ず最後を目標にするが、recorder crash journalでは存在しなくてよい。

### Schema fingerprint

canonical treeはkeyをlexicographic sortし、値をtype tokenへ置換する。standard allowlist key（`jsonrpc,id,method,params,result,error,code,message,data,name,arguments,_meta,progressToken,requestId,protocolVersion`）以外はrun-local saltを使う`key_sha256:<hash>`とする。arrayは要素typeの集合とlength bucket (`0`,`1`,`2-10`,`11-100`,`101+`)だけを持つ。canonical tree JSONのSHA-256をfingerprintとする。

## 10. Versioned normalizer and causal graph

### Mapping pack

MVP built-in IDは`mcp-jsonrpc@1`。pack metadata:

```ts
interface NormalizerPack {
  id: "mcp-jsonrpc@1" | string;
  graphSchema: "causalwire.graph/v1";
  supports(input: JournalHeader): { supported: boolean; reason?: string };
  normalize(records: AsyncIterable<JournalRecord>): Promise<GraphV1>;
}
```

- generic JSON-RPC correlationはprotocol version `unknown`でも動く。
- version-specific method semanticsは明示的にsupport matrixへ登録する。
- unknown fieldsを捨てず、source journalの`seq`参照をgraph nodeへ保持する。
- pack変更でraw journalをmigrationしない。
- external packのCLI dynamic loadingはMVP外。public TypeScript APIでpackを渡せることをextension pointとする。

### `causalwire.graph/v1`

```ts
type GraphV1 = {
  schema: "causalwire.graph/v1";
  run: { id: string; startedAt: string; endedAt?: string; captureComplete: boolean };
  mapping: { id: string; generatedAt: string };
  nodes: GraphNode[];
  edges: GraphEdge[];
  diagnostics: Diagnostic[];
  firstBreak?: { diagnosticCode: string; nodeId: string; sourceSeq: number };
};

type GraphNode = {
  id: string; // deterministic: run:<id>, wire:<seq>, exchange:<request-seq>
  kind: "run" | "rpc_request" | "rpc_response" | "rpc_notification" | "unknown_frame";
  sourceSeq: number;
  synthetic: boolean; // true only for an expected-but-missing correlation endpoint
  method?: string;
  toolName?: string;
  status: "pending" | "ok" | "error" | "stuck" | "missing" | "orphan" | "invalid";
  durationMs?: number;
  bytes: number;
  protocolVersion: string;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: "responds_to" | "progress_for" | "cancels" | "sequence";
  causal: boolean; // sequence is always false
  confidence: "explicit" | "derived";
  sourceSeqs: number[];
  status: "ok" | "broken";
};
```

edgeは常に原因側/先行側から結果側/後続側へ向ける。`responds_to`はrequest→response、`progress_for`はrequest→progress notification、`cancels`はrequest→cancellation notificationである。missing/stuck responseにはsynthetic response node、orphan response/progressにはsynthetic request nodeを作り、対応edgeを`broken`にする。duplicate in-flight IDには2件目requestからsynthetic ambiguous response nodeへのbroken edgeを作り、実responseを推測でpairしない。synthetic nodeの`sourceSeq`はdiagnostic locationと同じ値、`bytes`は0とする。

`sequence` edgeはvisual order用で、`causal=false`かつaccuracy算定に含めない。全edgeはsource sequenceが非減少になるよう構築し、GraphV1はDAGでなければnormalization errorとする。MCP wireからagent identity、LLM decision、business taskを推論してnodeを作らない。

### Deterministic diagnostic rules

| Code | Severity | 条件 | Break location |
|---|---|---|---|
| D001 `malformed_frame` | error | frameがUTF-8 JSON object/JSON-RPC shapeでない | 当該wire seq |
| D002 `duplicate_inflight_id` | error | 同一origin+ID hashの未完了requestが再出現 | 2件目request seq |
| D003 `orphan_response` | error | 反対方向にmatching requestがないresponse | response seq |
| D004 `stuck_request` | error | live runでtimeoutを超えた未応答request | request seq |
| D005 `missing_response` | error | 明示的な`run_end`があるclosed runに未応答requestが残る | request seq |
| D006 `orphan_progress` | warning | explicit progress/request tokenが既知requestへmatchしない | notification seq |
| D007 `protocol_version_conflict` | warning | explicit/wire versionが矛盾 | 後発version seq |
| D008 `protocol_version_unknown` | warning | version-specific mappingが必要だがversion不明 | run start |
| D009 `capture_truncated` | error | frame/journal limitまたはwriter failureでcapture不完全 | 最初の欠落直前seq |
| D010 `tool_error` | error | matched JSON-RPC error response | response seq。edge自体はbrokenにしない |

`firstBreak`はD001–D006/D009のうち、最小source seqを選び、tieはcode番号順とする。D010はapplication failureでありcausal breakではないためfirstBreak候補外。run終了後は同じrequestにD004とD005を重複表示せずD005へ確定する。

## 11. Renderers and OTLP mapping

### CLI renderer

- summary: run ID、capture policy、frame/exchange/error/stuck counts、protocol version、mapping ID、first break。
- DAG: chronological nodesを最大100件表示し、超過時は件数と`--format json`案内を表示する。
- first breakは色だけに依存せず `FIRST BREAK` label、code、symbolで示す。
- terminal width 40–200 columnsに対応し、long method/toolはmiddle ellipsis + full hashを表示する。

### HTML/SVG

- single-file、network requestなし、external font/script/CDNなし。
- HTMLはinline SVG、summary、diagnostic table、legendを含む。JSなしでも全情報を読める。
- `<`, `>`, `&`, quotesをescapeし、raw/full contentを埋め込まない。
- HTMLはCSP `default-src 'none'; img-src data:; style-src 'unsafe-inline'`を設定する。
- first breakは赤色だけでなく太線、warning icon、text labelを併用する。
- 320px幅からdesktopまで横scroll/折返しで情報を失わない。SVGにはaccessible `<title>`/`<desc>`を含む。
- 同じGraphV1から生成したCLI/HTML/SVGでfirstBreak code/nodeが一致する。

### OTLP

- protocol requestごとに短いspanを生成し、responseで終了する。未応答はanalysis時点でerror statusとsynthetic end timeを持つが、`causalwire.synthetic_end=true`を付ける。
- attribute allowlist: `rpc.system=jsonrpc`, `rpc.method`, `mcp.tool.name`, `mcp.protocol.version`, `causalwire.run.id`, `causalwire.source.seq`, `causalwire.mapping.id`, request/response sizes、status、duration。
- plaintext request ID、payload、hash、absolute pathはOTLPへ出さない。
- explicit response/progress/cancel correlationはspan link/eventで表現する。時間順だけのrelationをparent-childにしない。
- rootは1本の巨大なdurable spanにせず、run summaryをresource attributes/eventで表現する。
- export failureでjournalを変更しない。retryはOpenTelemetry SDK既定のbounded policyを使い、timeout後は69。
- `service.name` defaultはchild executable basenameをsanitizeした値。`--service-name`でoverrideできる。

## 12. User stories and acceptance criteria

### US-1: One-command transparent capture

AI platform engineerとして、server codeを変更せずMCP stdioをcaptureしたい。

- Given Node.jsと正常なMCP fixture serverがある、When `causalwire record -- node fixture.js` を実行する、Then childが起動し双方向JSON-RPCがbyte-for-byte同一かつ同順序で相手へ届く。
- Given concurrent IDsとserver-initiated requestがある、When trafficをcaptureする、Then origin directionを含むkeyで正しいresponseだけがpairになる。
- Given childがexit 23、When runが終わる、Then journalがflushされCLIも23を返す。
- Given child commandが存在しない、When recordする、Then exit 74、actionable English errorを返し、`run_start`とspawn failureを含むvalid closed journalを残す。protocol `wire` recordは0件である。
- Given record中にSIGINT、When一度送る、Then childへforwardし最大2秒flushする。二度目では即時終了する。

### US-2: Privacy-safe default journal

運用担当として、payloadを保存せず相関に必要なmetadataだけ残したい。

- Given prompt、email、API tokenを含むparams/result/error、When default captureする、Thenそれらのliteral valueはjournal、CLI、HTML、SVG、OTLP、usage logのどこにも出ない。
- Given string request ID、When default captureする、Thenplaintext IDはなくrun-local salted hashでrequest/responseがpairになる。
- Given `--content full`なし、When environment variableにfull相当値を置く、Thenfull captureへ切り替わらない。
- Given `--content full`、When captureする、Thenexact frame bytesがbase64保存され、stderrにprivacy warningが出る。
- Given custom schema keyにsecret文字列がある、When fingerprintを作る、Thennon-allowlist keyはplaintext保存されない。

### US-3: Append-only, re-normalizable evidence

maintainerとして、標準変更後も元journalからgraphを再生成したい。

- Given同一journal、When同一mapping packで2回normalizeする、Then`generatedAt`以外のGraphV1はbyte-stable canonical JSONになる。
- Givenunknown additive fields、Whenreaderが読む、Thenfieldを理由に失敗せずknown dataを解析する。
- Givenunsupported major schema、Wheninspectする、Thenexit 2でsupport範囲を表示する。
- Givennormalizer/exportを実行、Thenjournal fileのmtime/size/contentは変わらない。
- Given末尾のpartial line、Wheninspectする、Then完全なpreceding recordsを解析しcapture incomplete warningを返す。

### US-4: First causal break diagnosis

incident responderとして、最初に壊れたprotocol correlationを10秒以内に知りたい。

- Given bundled `stuck-tool`（`run_end`なし、timeoutを超えるtimestampを持つ）、Whendemo/inspectする、ThenD004とrequest nodeをfirst breakとして表示する。
- Givenorphan response、Wheninspectする、ThenD003とresponse seqを示す。
- Givenduplicate in-flight ID、Wheninspectする、ThenD002と2件目request seqを示し、曖昧なresponse edgeを作らない。
- GivenJSON-RPC error response、Wheninspectする、Thenexchangeはerror、edgeはmatched、D010を表示しcausal breakとは誤称しない。
- Given20件以上のground-truth corpus、Whenbenchmarkする、Thenfirst breakのcode+source seq exact matchが80%以上。

### US-5: Shareable static evidence

maintainerとして、backendなしでincident graphを共有したい。

- Givenvalid journal、WhenHTML/SVG exportする、Thenself-contained fileが生成されnetwork accessなしで開ける。
- Givenmethod/toolにHTML injection文字列、Whenexportする、Thenmarkup/scriptとして実行されずtextとして表示される。
- Givenfirst break、WhenCLI/HTML/SVGを比較する、Thencodeとnodeが一致し色覚なしでも識別できる。
- Givenzero exchanges、Whenexportする、Thenempty-state artifactを生成し、fake graphを表示しない。

### US-6: Portable OTLP export

platform engineerとして、既存backendへcausalwire evidenceを送信したい。

- Givenlocal OTLP test collector、When`export --format otlp`する、Thenrequest spans、status、duration、explicit links/eventsが受信される。
- Givencontent=full journal、WhenOTLP exportする、Thenpayload/raw bytes/hash/plain request IDはexportされない。
- Givenendpoint未設定、WhenOTLP exportする、Thennetwork接続せずexit 78で設定例を示す。
- Givenendpointがtimeout、Whenexportする、Thenbounded timeout後exit 69、secret header値をlogしない。
- Given`otlp-json`、Whenexportする、Thennetworkなしで同等mappingを検査できる。

### US-7: OSS extension without forking core

contributorとして、新protocol versionのmapping/detector/exporterを追加したい。

- Givenpublic API、Whencustom `NormalizerPack`をprogrammatically渡す、Thencore journal writerを変更せずGraphV1を生成できる。
- Givennew diagnostic detector、Whenregistered pipelineで実行する、Thenstable code/severity/sourceSeqをGraphV1へ追加できる。
- Givenfixture + expected graph、Whenconformance commandを実行する、Thenthird-party packを同じcontractで検証できる。
- CLI dynamic plugin loading、remote code install、private registryはMVP外である。

## 13. CLI states

| Surface | Loading/running | Empty/first-run | Error/degraded | Success |
|---|---|---|---|---|
| `demo` | stderrに`Analyzing seeded failure…`（TTYのみspinner） | bundled fixture欠落はinternal error。fake fallbackは作らない | scenario不正64、write error74 | first break + HTML/SVG path |
| `record` | stderrにjournal path、frame/exchange counter。stdoutはprotocol専用 | childがprotocol frameを出さず終了したら`No MCP frames captured`、exitはchild準拠 | malformed frameはpass-through+diagnostic、writer degradedはwarning、最終74条件あり | counts、duration、journal pathをstderr |
| `inspect` | 大fileでは10k recordsごとにstderr進捗（TTYのみ） | header/run eventsのみなら`No JSON-RPC exchanges found`、exit 0 | unsupported schema/corrupt middle lineは2、partial tailはwarning | summary/graph + first breakまたは`No causal break detected` |
| HTML/SVG export | temp fileへのrender中status |明示empty-state artifact | parse/render/write error 2/74、partial artifactは残さない | atomic rename後pathとsize |
| OTLP export | batch progressをstderr | span 0件ならnetwork送信せず`Nothing to export`、exit 0 | config 78、timeout/unreachable 69、server rejectは69 | sent span/event/link counts |

`record`にloading UIは存在しない。child開始を遅延させるspinnerやinteractive promptを置かない。

## 14. Edge cases

### Stream / protocol

- 1 frameが複数chunksに分割、複数framesが1 chunkに結合
- CRLF、final LFなし、blank line、leading/trailing whitespace
- invalid UTF-8、malformed JSON、JSON array/scalar、missing `jsonrpc`, `id:null`, boolean/object ID
- 16MiBちょうど、上限超過、非常に長いmethod/tool名、deeply nested JSON
- request/responseが高速に交差、server-initiated request、同じIDを両方向で同時利用
- numeric `1`とstring `"1"`、large/unsafe integer ID、duplicate in-flight ID、ID再利用（response完了後は可）
- notification flood、unknown method、unknown protocol version、version conflict
- response前にchild crash、timeout後にlate response、run_endなしのcrash journal

### Process / filesystem

- executable path/argvにspace・Unicode、Windows `.cmd` resolution、shell metacharacters（shell評価しない）
- child spawn error、non-zero exit、signal、parent stdin early EOF、broken pipe
- output directory不存在、read-only、disk full、symlink target、journal size cap
- concurrent runsのfilename collision（exclusive create + random run id）
- HTML/SVG output既存、atomic rename失敗、Windows file lock
- very large journalはstream parseし、全raw recordsをmemoryへ保持しない。Graph node上限はMVP 100k、超過はactionable error（将来pagination）

### Privacy / security

- params/result/errorにAPI key、email、Unicode confusable、HTML/JS payload
- custom object key自体にsecret
- malicious terminal escape in method/tool（control characters除去/escape）
- zip bombは扱わないが、deep nesting/max frameでparser resource exhaustionを防ぐ
- OTLP header secretがerror object/stack traceに混入しない
- untrusted external normalizerはMVP CLIからloadしない

## 15. Demo data and conformance corpus

### Bundled 10-second scenarios

実在ユーザーdataやlorem ipsumを使わず、架空のe-commerce MCP flowを合成する。

| Scenario | Story | Ground truth | Expected visual |
|---|---|---|---|
| `stuck-tool` | checkout clientが`inventory.lookup`を呼ぶがserver responseがなく、後続event時点でtimeoutを超える | request seq 3、D004（static live-style fixture、`run_end`なし） | request nodeからstuck responseへ太いbroken edge |
| `orphan-result` | `shipping.quote`のresponse IDに対応requestがない | response seq 5、D003 | orphan responseを左端で警告 |
| `duplicate-id` | `tax.calculate`と`discount.apply`が同じin-flight IDを再利用 | second request seq 4、D002 | 2件目をfirst break、responseを誤pairしない |

fixtureのfull payloadはすべてsyntheticで、`example.com` domain、test token形式、架空IDのみを使う。スクリーンショットはdefault-off journalから生成し、payloadを見せない。

### Accuracy corpus

- 最低20 cases、5 fault family（malformed frame、duplicate ID、orphan response、missing/stuck response、orphan progress）を各4件以上。
- concurrency、bidirectional request、late response、valid JSON-RPC errorをnegative/control casesに含める。
- `fixtures/manifest.json`にcase ID、fixture path、expected first diagnostic code、expected source seq、expected node ID、protocol version、content policyを記載する。
- accuracy = exact match cases / ground-truth failure cases。control caseを分母に水増ししない。
- real user tracesはsecret除去と明示同意済みのみ別private benchmarkで利用し、repositoryへ無断commitしない。
- target >=80%。case変更でground truthをtest resultに合わせて書き換える場合はreviewで根拠を要求する。

## 16. Instrumentation and privacy

MVPは外部analytics endpointを持たず、network telemetryを送らない。`--usage-log <path>`を指定したrunだけ、次のproduct eventsを別のlocal append-only JSONLへ書く。

| Event | Trigger | Allowed properties |
|---|---|---|
| `demo_completed` | demo artifact生成 | version、scenario enum、duration bucket、success |
| `capture_started` | child spawn成功 | version、OS、Node major、content policy enum |
| `capture_completed` | run終了 | duration bucket、frame/exchange count bucket、capture complete、child success boolean |
| `analysis_completed` | inspect完了 | count buckets、first-break code enum、duration bucket |
| `export_completed` | html/svg/otlp完了 | format enum、count bucket、success、error class enum |

禁止property: payload、method/tool名、ID/hash、file path、command/argv、endpoint、header、exact timestamp、run ID。usage logは自動uploadしない。`telemetry`という曖昧な表現ではなくhelpに“local usage log”と表示する。

Activation判定は`capture_completed(exchange_count>0)`と、その24時間以内の`analysis_completed`の組合せ。T+7のinstallはnpm/package download、明示survey、consented usage logのいずれかで重複を説明して集計する。

## 17. Architecture and module boundaries

```text
parent stdin ──> stdio proxy ──> child stdin
                     │
child stdout ─> stdio proxy ──> parent stdout
                     │ copy; never blocks forwarding on semantic parse
                     v
 frame decoder -> content policy -> append-only journal
                                      │
                                      v
                      versioned normalizer -> GraphV1
                                      │
                         ┌────────────┼────────────┐
                         v            v            v
                      CLI text    HTML/SVG       OTLP
```

### Required source layout

```text
src/
  cli.ts
  public-api.ts
  capture/
    child-process-wrapper.ts
    frame-decoder.ts
    correlator.ts
    content-policy.ts
    journal-writer.ts
  schema/
    journal-v1.ts
    graph-v1.ts
  normalize/
    pipeline.ts
    mcp-jsonrpc-v1.ts
  diagnose/
    detectors.ts
    first-break.ts
  render/
    cli.ts
    html.ts
    svg.ts
  export/
    otlp.ts
  usage/
    local-usage-log.ts
fixtures/
  demo/
  conformance/
  manifest.json
tests/
  unit/
  integration/
  e2e/
  security/
bench/
  capture-overhead.ts
```

### Public API

```ts
export type { JournalRecord, GraphV1, Diagnostic, NormalizerPack };
export function recordChild(options: RecordChildOptions): Promise<RecordResult>;
export function readJournal(path: string): AsyncIterable<JournalRecord>;
export function analyzeJournal(path: string, options?: AnalyzeOptions): Promise<GraphV1>;
export function renderHtml(graph: GraphV1, options?: RenderOptions): string;
export function renderSvg(graph: GraphV1, options?: RenderOptions): string;
export function toOtlp(graph: GraphV1, options: OtlpOptions): Promise<ExportResult>;
```

CLI optionsは同名API optionへ1:1 mappingする。CLIだけのdefaultとAPI defaultを別実装にせず、shared options resolverを使う。

### Dependency decisions

- CLI parsing: `commander`
- Runtime schema validation: `zod`
- Tests: `vitest`
- Build: `tsup`、declaration files生成、source maps含む
- OTel: official `@opentelemetry/api`, SDK/exporter packages。vendor SDKは入れない
- HTML/SVG graph rendering: repository-owned deterministic renderer。browser/runtime graph libraryは追加しない
- SQLite、React、Electron、Docker、native addonは使わない

## 18. Performance, reliability, and security requirements

### Capture benchmark

`pnpm bench:capture`はdirect pass-through baselineとcausalwire `content=off`を同一echo fixture、同一machine、交互runで比較する。

- 200 warmup + 2,000 measured request/response exchanges
- deterministic payload mix: 80% 1KiB、15% 16KiB、5% 256KiB
- request IDsは最大100 concurrent、両方向trafficを含む
- local SSD、release build、debug log/usage log off
- request送信からecho response受信までのexchange latencyを測る。fixtureは受信bytesを即時echoし、LLM/tool/network時間を含まない
- 5 runsのcombined distributionを出し、hardware、OS、Node version、commitをrecordする
- incremental overheadはpayload/concurrency bucketごとに `p95(causalwire) - p95(direct baseline)` で算出し、全bucketの最大値をreportする
- pass: incremental overhead p95 <=5ms、causalwire absolute p99とbaseline p99の差 <=10ms、byte mismatch 0、dropped/reordered frame 0
- Linuxをrelease gate、macOS/Windowsをregression gateとする。ただし3 OSのいずれかでp95 >5msなら既知制約として隠さずreleaseをblockする

full modeは同じcorrectness testを通すが5ms SLO対象外。結果を別掲する。

### Resource bounds

- shadow parser buffer最大`max-frame-bytes + delimiter`。
- writer queue最大64 recordsまたは8MiB。超過時はtransportを止めずcapture degradedへ移行する。
- journal parseはstreaming。100k graph node超過時はmemory exhaustion前にexit 2。
- HTML/SVG出力は100k nodeを受けず、10k超でsummary-only + error guidance。silent truncationしない。

### Security

- `spawn(..., { shell: false })`。command stringをshell再解釈しない。
- journal/outputはexclusive create、symlinkをfollowしない。明示`--out`既存時はfailし、上書きflagは提供しない（demo artifactのみatomic overwrite可）。
- terminal/HTML/SVG escapingをcentralizeし、control sequencesを除去する。
- JSON nesting depth 100を上限とし、超過はmetadata diagnosticのみ。
- stack traceはdebug build/explicit `DEBUG=causalwire:*`以外で出さず、secret env/headerをsanitizeする。
- dependency lockfile、npm provenance/SBOM、security reviewはrepo hardening phaseで必須。本MVP実装時も`pnpm audit`結果を記録する。
- causalwire自体はuntrusted childをsandboxしない。ユーザー権限でchildが実行されることをhelpへ明記する。

## 19. Test strategy

### Unit

- chunk/frame境界、CRLF、unterminated/invalid/oversized frame
- JSON-RPC shape classification、canonical ID hashing、bidirectional correlation
- content off leak tests（secret sentinelが全artifactに0件）
- schema fingerprint allowlist/non-allowlist behavior
- each diagnostic rule、tie-break、late response、timeout→missing transition
- GraphV1 deterministic output、HTML/SVG/terminal escaping
- OTLP attribute allowlist、secret header redaction

### Integration

- fixture MCP client ↔ wrapper ↔ child serverのbyte-for-byte transcript比較
- 100 concurrent IDs、server-initiated request、child stderr pass-through
- signal/exit propagation、disk full/read-only/symlink、journal cap degradation
- content off/full journalsをvalidateし、same graph correlationになること
- local official-compatible OTLP test receiverでspan/event/link assertion

### End-to-end

- Linux/macOS/Windows × Node 20/22/24 matrix
- `npm pack` artifactをclean temp directoryへinstallし、`demo`, `record`, `inspect`, `export`を実行
- quickstart 60秒はfresh package installを含めて計測（network download varianceを別記）。demo logic 10秒はpackage install済みで計測
- non-TTY/CI snapshot、`NO_COLOR`、narrow terminal、Unicode/path spaces

### Conformance / quality gates

- 20+ failure corpusでexact first-break accuracy >=80%
- capture overhead benchmark p95 <=5ms
- content-off secret sentinel leak 0
- forwarded byte mismatch/reorder/drop 0
- HTML injection/security corpusでscript execution 0
- all supported OS/Node test matrix green

## 20. Verification commands

Builderは次をpackage scriptsとして実装し、README/CIと一致させる。

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm test:conformance
pnpm test:security
pnpm bench:capture
pnpm build
pnpm pack
```

Release candidate smoke:

```bash
npx --yes ./causalwire-<version>.tgz demo
npx --yes ./causalwire-<version>.tgz inspect fixtures/demo/stuck-tool.jsonl
npx --yes ./causalwire-<version>.tgz export fixtures/demo/stuck-tool.jsonl --format html --out /tmp/causalwire-demo.html
```

Windows smokeでは`/tmp`をOS temp directoryへ置換する。OTLP testはCIでephemeral local receiverを起動し、external service/API keyへ依存しない。

## 21. OSS requirements

### 60-second quickstart

README first viewportに次の順で置く。

1. one-line pitch: “A local flight recorder for MCP: capture stdio, find the first broken causal edge, export to OpenTelemetry.”
2. 10-second demo GIF（default-off fixtureから生成）
3. `npx -y causalwire@latest demo`
4. real usage `causalwire record -- <server command>`
5. privacy warning: content off default、hashはredactionでない

API key、Docker、signup、config file、backendをquickstartに要求しない。

### CLI/API consistency

- CLI flag名とpublic API propertyはkebab-case↔camelCase以外同義。
- journal/graph schema、diagnostic code、default timeout/limitsはsingle sourceから生成する。
- CLI、HTML、SVG、OTLPのstatus/first breakは同じGraphV1を参照する。
- semver前のschemaにもmajor versionを付け、breaking schema変更をsilentにしない。

### Extension points

- `NormalizerPack`: protocol/version mapping
- `DiagnosticDetector`: GraphV1へdeterministic diagnostic追加
- `GraphRenderer`: GraphV1→artifact（programmatic API）
- `OtlpMapper`: GraphV1→OTel model
- fixture manifest/conformance harness: contributorがnew versionをPRで追加

MVPではCLIからarbitrary package/pathを動的loadしない。拡張はTypeScript APIまたはcoreへのPRで行う。

## 22. Definition of done / release acceptance

MVPは以下をすべて満たした時だけ実装完了とする。

- `demo`, `record`, `inspect`, `export html|svg|otlp|otlp-json`がpublished tarball相当から動く
- zero-config demoが60秒以内、installed demoが10秒以内
- MCP stdio双方向bytesの一致、concurrency、exit/signal propagationのintegration testsがgreen
- append-only JournalV1、GraphV1、mapping pack、diagnostic codeが本仕様どおりfixtureで固定
- default content-offのsecret sentinel leak 0、fullは明示flagのみ
- seeded failure first-break exact accuracy >=80%（20 cases以上、report保存）
- default capture overhead p95 <=5ms（規定条件、hardware/commit付きreport保存）
- CLI/HTML/SVGのempty/loading/error/success状態が検証済み
- HTML/SVGがself-contained、injection-safe、accessible label付き
- OTLP local receiver testが成功し、payload/plain ID/hashがexportされない
- Linux/macOS/Windows × supported Node matrixがgreen
- READMEに60-second quickstart、privacy boundary、non-goals、benchmark reproductionを記載
- license、contributing、security policy等のrepo hardeningは次phaseで整備可能だが、package license fieldはApache-2.0にする

Gate Bへ進むには、上記に加え実際のCLI実行log、demo HTML/SVG、10秒demoのscreen recording、benchmark/accuracy reportを残す。

## 23. Open questions with non-blocking defaults

| Question | MVP default |
|---|---|
| npm名`causalwire`がpublish時に使用可能か | 使用可能なら`causalwire`。衝突時のみ`@causalwire/cli`、binは常に`causalwire` |
| 最新MCP versionのversion-specific semanticsをどこまで含めるか | generic JSON-RPC correlationを必須とし、調査で確認済みのversionだけsupport matrixへ明示追加。unknownを推測しない |
| CLI live viewをrecord中に出すか | 出さない。stdout保全を優先し、stderr counterのみ。full-screen TUIはv2 |
| SQLiteを併設するか | しない。JSONLのみでaccuracy/速度を検証後に判断 |
| journal writer failure時にtrafficを止めるか | 止めない。fail-open forwarding、capture degraded、successful childならexit 74 |
| OTLPでrun root spanを作るか | giant root spanを作らずrequest spans + links/events + resource attrsを使う |
| external normalizer pluginをCLI loadするか | セキュリティ面からMVP外。public APIとfixture harnessのみ |
| usage analyticsを送信するか | 送信しない。明示`--usage-log`のlocal fileのみ |

## 24. Evidence and claim boundaries

- Product need、persona、wedge、kill criteriaは[THESIS.md](./THESIS.md)を正とする。
- OTel/MCP standardsは変化中であるため、release前にcurrent primary specificationsを再確認し、support matrixへretrieval dateを記載する。
- 「最初のcausal break」は本仕様のdeterministic protocol diagnosticを意味し、semantic/root-cause全般を意味しない。
- performance/accuracy値は実測後だけREADMEで達成済みと表現する。未測定の段階で保証・比較優位として宣伝しない。
- user-provided traceは明示同意、secret除去、retention合意なしにfixture、issue、demoへ転用しない。
