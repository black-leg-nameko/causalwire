# AIエージェント観測性 OSS — Opportunity Thesis

- 評価日: 2026-08-10 (Asia/Tokyo)
- Gate: **Gate A 通過**（2026-08-10、ユーザー承認: `GO + causalwire`）
- 採択案: **`protocol-native causal flight recorder`**
- 確定名: **`causalwire`**
- 需要合成点: **3.94/5**（12-factor、80点満点中63点）
- OSSスター可能性: **52/60**（技術調査の別rubric。需要点と混ぜない）
- 信頼度: **中高**。標準・複数競合のIssueによる技術ギャップの証拠は強いが、「protocol wire recorderへ実際に乗り換える」という直接需要と支払い実績は未検証。

## 0. 前提・証拠境界

### 明示する前提

- global / English-first、初期市場は北米・欧州を中心とする。日本語の独立した需要証拠は弱いため、日本市場をwedgeにしない。
- solo founder、小さな協力者を含めてもMVPは1–3週間、90日以内に収益シグナル、paid acquisitionなし。
- 初期配信はGitHub、Show HN、Product Hunt、OTel/MCP/A2AのGitHubコミュニティ。Reddit/Xは許可された公式API/connectorで需要証拠を取れていないため、初期仮説の根拠にしない。
- founder fitは、実装者のprotocol/OTel/TypeScript経験が入力にないため**全候補 `null`**。技術的buildabilityをfounder fitの代理にしない。
- `venture-context.yaml` はない。価格、法人規模、90日期限は上記default assumptionsに基づく暫定値。

### 入力レポート

- 需要・ペイン（workspace-only source: `research/ai-agent-observability/demand-pain.md`）: E1–E20、需要rubric、既存workaround。
- 競合・スター（workspace-only source: `research/ai-agent-observability/competition-stars.md`）: incumbents、若い競合、GitHub Trending 2026-08-10 snapshot。
- 技術wedge（workspace-only source: `research/ai-agent-observability/technical-wedges.md`）: MCP/A2A/OTelの仕様ギャップ、技術実現性、OSS star rubric。

これら3件はVenture Studioの横断調査入力であり、この独立公開リポジトリには同梱しない。公開向けの製品claimはREADMEと保存済み再現レポートだけを根拠にする。

主張は原則として上記レポートの一次情報リンクへ遡れる。支払い意思、転換率、90日導入数は**予測ではなく検証対象**である。

## 1. 見かけ上の矛盾の解消

`competition-stars.md` の **generic local flight recorder = HOLD** と、`technical-wedges.md` の **Protocol Flight Recorder = 52/60** は同じ案ではない。

| 比較軸 | Generic local recorder（HOLD） | Protocol-native causal recorder（推薦） |
|---|---|---|
| 捕捉対象 | Claude Code/Codex等のharness履歴、hooks、OTLP | MCP stdio/HTTP・A2A JSON-RPCの**wire境界** |
| 主要価値 | local保存、viewer、replay、cost | protocol versionを保持したraw capture → task/handoff/toolの因果Link →任意backendへOTLP export |
| 既存供給 | MLflow、agents-observe、AgentLens、ax、AgentReplayが近い | MCP近接repoは調査時11★/22★規模、A2AとMCPをつなぐ標準telemetryはopen issue |
| 壊れやすさへの答え | harness adapterを追う | raw envelopeを不変保存し、versioned mappingを差し替える |
| moat候補 | adapter数とUI。模倣されやすい | protocol fixture/conformance corpus、causal schema、version compatibility matrix |
| 同一rubric再採点 | **3.75/5**、competition 1 | **3.94/5**、competition 4 |

つまり、`local` や `flight recorder` という表面語ではなく、**観測境界とデータモデルが差**である。推薦案がharness history viewerへ広がった時点でHOLD案へ退化する。

## 2. 全候補の同一rubric比較

評価は `market-demand-intelligence` の12-factor（各1–5）。`pain_severity`、`willingness_to_pay`、`distribution_fit`、`buildability` を2倍、合計80点を16で割る。証拠なしのfounder fitは合成点に入れない。`time_to_first_signal` は補助指標で、合成点には入れない。

略号: Pain=痛み、Freq=頻度、Urg=緊急性、WTP=支払意思、Work=workaroundの痛さ、Diss=代替不満、Buyer=buyer明確性、Dist=配信適合、Build=1–3週実装、Comp=競争空白、Market=市場、Expand=拡張性。

| 順位 | 候補 | Pain | Freq | Urg | WTP | Work | Diss | Buyer | Dist | Build | Comp | Market | Expand | 合成 | 信頼度 | First signal |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| 1 | `agent-spend-ledger` | 4 | 5 | 5 | 4 | 5 | 4 | 4 | 5 | 4 | **2** | 5 | 4 | **4.25** | 中 | 4 |
| 2 | `runaway-fuse` | 5 | **3** | 5 | 4 | 4 | 4 | 4 | 5 | **3** | **3** | 4 | 4 | **4.06** | 高 | 4 |
| 2 | `semconv-bridge` | 4 | 4 | 4 | **3** | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 5 | **4.06** | 高 | 4 |
| 2 | `privacy-gateway` | 5 | 4 | 4 | 4 | **3** | 4 | 4 | 4 | 4 | **3** | 4 | 5 | **4.06** | 中高 | 4 |
| 5 | **protocol-native causal flight recorder** | 4 | 4 | 4 | **3** | 4 | 4 | 4 | 5 | **3** | 4 | 4 | 5 | **3.94** | 中高 | **5** |
| 6 | `multi-agent-causal-debugger` | 4 | 5 | 4 | **3** | 5 | 4 | 4 | 5 | **2** | **3** | 4 | 5 | **3.88** | 中高 | 4 |
| 7 | `semantic-regression-radar` | 4 | 4 | 4 | **3** | 5 | 4 | 4 | 4 | **3** | **3** | **3** | 5 | **3.75** | 中 | 3 |
| 7 | generic local recorder/replay | 4 | 5 | 4 | **3** | 4 | **3** | 4 | 5 | **3** | **1** | 5 | 4 | **3.75** | 高 | 4 |
| 9 | `protocol-vcr` | 4 | **3** | **3** | **3** | 4 | **3** | 4 | 5 | **2** | **1** | 4 | 4 | **3.38** | 中高 | 3 |

### 点数の根拠（各候補・各factor）

1. **Spend ledger:** Pain 4=all-in費用不明で最適化不能（E11）、Freq 5=agent利用ごと、Urg 5=現行業務の具体的訴え、WTP 4=複数tool/APIへ既に支出、Work 5=bill/log/dashboard手突合、Diss 4=個別dashboardがsource of truthにならない、Buyer 4=EM/FinOps、Dist 5=GitHub/HNに集中、Build 4=3 adapter+git帰属、Comp 2=AgentReplay/Renue/各vendor、Market 5=coding-agent team全般、Expand 4=ROI/routing/budget。ただし主な直接証拠がE11一件で、4.25を高確信と扱わない。
2. **Runaway fuse:** Pain 5=数千calls/数千ドル級incident、Freq 3=重大だが日常頻度の証拠なし、Urg 5=deployment前capの明示ask、WTP 4=損失回避は金額化可能、Work 4=`max_iter`等がvalid long taskも切る、Diss 4=observabilityは事後、Buyer 4=AI platform/SRE、Dist 5=OpenAI/CrewAI/MCP層、Build 3=proxy+streaming accounting、Comp 3=LoopHalter/security gateway近接、Market 4=tool-using agents、Expand 4=policy/adapters。
3. **Semconv bridge:** 各点はworkspace横断の需要調査C1を再利用。E3/E5がPain/Urg/Diss、collector ecosystemがDist、専用processorの部分供給E4がCompを支える。WTP 3と標準安定後の価値縮小が弱点。
4. **Privacy gateway:** 各点はworkspace横断の需要調査C2を再利用。E2/E8/E9がPain/Urg、E6/E7/E10がWork/Diss/Compを支える。完全redactionを保証できず、汎用redactor/AI gatewayが近い。
5. **Protocol recorder:** Pain 4=flat/inconsistent traceとcausal link欠落（E1、OTel #309/#437）、Freq 4=run/仕様更新ごと、Urg 4=2026-08時点のMCP/A2A alignment issue、WTP 3=購入証拠なし、Work 4=SDK/timestamp/独自metadata、Diss 4=複数incumbentでcontext/subagent不具合、Buyer 4=protocol/platform engineer、Dist 5=MCP/A2A/OTel/GitHub、Build 3=MCP-onlyは可だがA2A同時実装不可、Comp 4=protocol-near supplyが小さい、Market 4=MCP/A2A developer、Expand 5=VCR/fuse/doctor/privacyへ同じkernelで伸びる。
6. **Multi-agent causal debugger:** Pain 4=handoff起点が見えない、Freq 5=multi-agent runごと、Urg 4=4つの独立projectでopen issue、WTP 3=単独analyzerの購入証拠なし、Work 5=timestamp/manual graph inspection、Diss 4=trace treeとtask graphの不一致、Buyer 4=multi-agent platform engineer、Dist 5=視覚demo、Build 2=正確なdistributed causality+UIが1–3週を超える、Comp 3=incumbentがgraph追加可能、Market 4=multi-agent限定、Expand 5=schema/test corpus/incident analysis。
7. **Semantic regression radar:** Pain 4=agent劣化を見逃す、Freq 4=weekly/releaseごと、Urg 4=手動weekly比較とopen RFC、WTP 3=支払証拠不足、Work 5=多数traceを手比較、Diss 4=pairwise diffは原因帰属しない、Buyer 4=production AI owner、Dist 4=benchmark/reportが必要、Build 3=offline analyzerは可、Comp 3=LangSmith/incumbent eval、Market 3=十分な履歴を持つproduction teamのみ、Expand 5=detectors/CI/alerts。
8. **Generic recorder:** Pain/Freq/Urgはdebug需要で高い一方、WTP 3、Diss 3、Build 3。MLflow、AgentReplay、agents-observe、AgentLens、axが供給しComp 1。local/replay/costだけでは差にならない。これはworkspace横断の需要調査C5と競合調査C3の結論を統合した。
9. **Protocol VCR:** Pain 4=非決定的failure、Freq/Urg/WTP 3=反復頻度・支払証拠が限定、Work 4=real calls/side effects、Diss 3=既存replayも強い、Buyer 4=agent CI owner、Dist 5=zero-cost CI demo、Build 2=stream/concurrency/side effect、Comp 1=Shepherd/llm-space/Tracely、Market 4、Expand 4。単独では遅く、recorderのphase 2に限る。

`agent-trace-compiler` はmulti-agent causal debuggerのUIなしprocessor形、`private-context-receipts` はprivacy gatewayのcontent mode、SemConv linterはbridgeの`doctor`として評価済み。generic dashboardは既存大手への正面参入なので候補外KILL。この統合でレポート内の案を取りこぼしていない。

### なぜ最高点のSpend ledgerを推薦しないか

合成点は需要強度を測り、証拠幅やstar conversionを十分に罰しない。Spend ledgerの4.25はE11中心の狭い直接証拠に依存し、競争空白2、単なるusage dashboardへ退化するリスクが高い。一方protocol recorderは合成3.94でも、別rubricで52/60、first signal 5、competition 4、共通kernelからcausal debugger/doctor/VCR/privacyへ拡張できる。**点数差0.31より、証拠の独立性・競争構造・配信可能な10秒demoを優先する**判断である。

## 3. 推薦する事業仮説 — Protocol-native causal flight recorder

### Pain

MCP/A2Aをまたぐagent runでは、transportは通ってもtask、tool、handoff、resumeの因果がOTel/backendで壊れ、platform engineerがtimestampとframework固有tagで事故原因を手相関している。MCP 2026-07-28と既存OTel conventionの不一致、A2A telemetry、LLM→tool causal linkが同時に未解決である。

### Persona（狭く定義）

英語圏のAI-native企業（エンジニア10–200人）で、MCP server/toolをstagingまたはproduction運用し、Jaeger/Tempo/Phoenix/Langfuse等のOTLP backendとincident responseを所有するAI platform engineer / staff engineer。初期buyerはHead of PlatformまたはAI Engineering Manager。

### Wedge

> **One commandでMCP stdioのwire trafficをlosslessに記録し、最初に壊れたcausal edgeを示して、任意のOTLP backendへportableに送る。**

勝つ軸はUIの豪華さではなく、(1) SDKを入れられないremote toolもwireで見える、(2) protocol version付きrawを残してmappingを再生成できる、(3)親子spanを捏造せずOTel Link/explicit edgeにする、の3点。MVPでは特に「最初のbroken edgeを5分探索から10秒へ」を一つの約束にする。

### Smallest MVP（1–3週間）

- TypeScript製child-process wrapperで**MCP stdioのみ**を双方向teeし、request ID、method、tool、error、duration、protocol versionをappend-only SQLite/JSONLへ保存。
- contentはdefault-off。hash/size/schema metadataだけを既定にし、full captureは明示opt-in。
- versioned mapping packでOTel span/event/linkを生成し、OTLP export。
- local TUI + static HTML/SVGでtask→tool causal DAG、stuck request、最初のmissing/broken edgeを表示。
- 3つのseeded failuresとbefore/after GIF、fixture/conformance testを同梱。

**Non-goals:** A2A live proxy、LLM HTTP proxy、hermetic replay、autonomous LLM root-cause analysis、cloud backend、完全PII redaction、runaway停止、全framework adapter。A2A JSON-RPCはMVPの成功後にphase 2とし、「all protocols」を初版で約束しない。

### 競合との差別化とmoat

| 競合群 | 既存の強み | 正面衝突しない差 |
|---|---|---|
| Langfuse/Opik/Phoenix/MLflow | storage、trace UI、eval、integration、community | backendを置換せず、wire captureとcausal OTLPを供給 |
| OpenLLMetry/OpenInference | SDK instrumentation | SDK外のremote process/toolとprotocol-version driftを捕捉 |
| agents-observe/AgentLens/AgentReplay | harness history、local replay/cost | harnessではなくMCP/A2A wire contractとportable causal links |
| heimdall-mcp/mcp-trace-js | MCP proxy/middleware | current-version fixtures、raw/derived分離、A2Aへのdurable task lineage |

12か月のmoat仮説は、UIやfirst moverではなく、**実装横断fixture corpus、protocol-version compatibility matrix、open causal schema、壊れたtraceのconformance benchmark、upstream標準への継続参加**。adapter PRが増えるほど品質とdistributionが複利化する。ただし大手が同じwire層を取り込めるためmoatは現時点で「中」であり、独占的とは主張しない。

### Riskiest assumption

MCP/A2A開発者が、framework-native traceで十分とは考えず、protocol wire recorderを障害対応と継続運用のcritical pathへ入れること。これが偽なら、技術的に空いていても市場がない。

### Cheapest test（T+7以内、実装前Gate A後）

3日でMCP stdio wrapper + static HTML waterfallだけを作り、公開Issueでprotocol/causality問題を報告した10人へ、文脈を明示した低量の個別依頼を行う。3つのseeded failure demoも公開する。

成功条件は **10人中5人が自分のfailing traceを提供、3人がOTLP exportを希望、合計200 qualified viewsから10 installs**。失敗traceはsecretを除去し、明示同意の範囲だけ保存する。

### DistributionとM0到達根拠

- **Show HN:** “Wireshark for MCP — find the broken agent→tool handoff in 10 seconds.” は問題・対象・結果が一文で伝わる。静的なcollectorではなく、12秒のbroken-edge GIFと再現fixtureが主資産。
- **Product Hunt:** visual debuggerとone-command demoは適合するが、深いinfraはHNより不利。PH 1位は独立に保証できず、実利用demo、changelog、透明な比較だけで勝負する。
- **GitHub:** MCP/A2A/OTelのissue participants、SDK maintainers、TypeScript developerが既にGitHubへ集中し、upstream discussionとadapter PRが誠実なdistributionになる。vote/star依頼、fake engagement、spamは行わない。
- **波の証拠:** 若いreplay/visualization repoは調査時にlifetime 30–45★/day級、harness-specific swarm visualizerは1.5k★。protocol recorder自体の需要を直接証明はしないが、agent-debuggingのvisual demoがstarへ変換し得る補助証拠になる。

想定言語カテゴリは**TypeScript**。憲章の目標は言語別150–400★/週、全言語400–600★/週。推薦案は全言語tailも狙うため、launch week **450–600★、64–86★/day**を内部目標にする。2026-08-10 snapshotはall-language tail 188、TypeScript tail 41だったが中央値はall 2,018.5、TS 713.5で、掲載も1位も保証しない。launch前14日間、all/TypeScript/Pythonのmin・p25・medianを毎日再計測し、目標を校正する。

チャネル適合の判定は **HN=強、GitHub Trending=強、PH=中**。入力調査には過去のPH/HN順位やview→star転換率がなく、PH/HN 1位を確率付きで予測する根拠はない。したがって「1位に届く」は保証ではなく、(a) one-command、(b) visually obviousなcausal failure、(c) current protocol change、(d) backendを敵にしない、というlaunch条件が揃った時のstretch targetである。T+7 validationを通らなければ、順位を狙うlaunch自体を行わない。

### 本番利用10社への筋道

| 期限 | 実利用マイルストーン | 誰が業務で使うか |
|---|---|---|
| T+7 | 10件のreal/seeded trace、3 design partners | MCP SDK/server maintainer、AI platform engineer |
| T+30 | 外部3組織がstagingで7日継続、2種backendへOTLP export | on-call前のinstrumentation/incident triage |
| T+60 | 6組織がproduction read-only capture、うち3組織が週1回以上incident export | platform/SREが障害原因のhandoff特定に利用 |
| T+90 | **10組織がproductionで30日継続**、月20件以上の実incidentで利用 | Head of Platform配下の標準debug path |

最初の10社は、causality関連Issue参加者、MCP server vendor、OTel backend integratorから3+3+4社を狙う仮説。SDK/provider固有のイベントをcollectorへ寄せ、既存backendを置換しないため、導入稟議を小さくする。production利用はstarではなく、30日継続、実trace件数、incident export、再利用率を匿名集計または顧客確認で数える。

### マネタイズ経路と課金境界（暫定）

- **OSS / Apache-2.0を維持:** local recorder、SQLite/JSONL、TUI、raw schema、current MCP adapter、OTLP export、conformance fixtures。安全性とinteropに必要な機能を有料化しない。
- **Cloud:** team incident bundle、共有URL、長期retention、cross-run search、Slack/GitHub連携、hosted compatibility reportsを **$99/team/month（5 seats、1M events）** で検証。超過はevent量ではなくretention/storage中心にし、debugのためのcaptureを抑制しない。
- **Enterprise open-core:** SSO/RBAC、監査ログ、fleet policy、private adapter registry、managed self-host upgradesを **$12k/yearから**。protocol capture・export自体は閉じない。
- **Sponsor:** protocol/backend vendorがadapter/fixture維持をスポンサーする経路。ただし初期の主課金仮説にはせず、Cloud/Enterpriseで支払意思を検証する。

90日収益シグナルは、Cloud betaの有料2社またはEnterprise design-partner LOI 2社。価格は市場事実ではなく、buyer interviewで上下させる初期仮説。

### Kill criteria

| 期限 | 撤退・pivot条件 | 判定 |
|---|---|---|
| T+7 | 200 qualified viewsでinstall <10、または10 interview中failing trace提供 <5、または70%以上が「SDK traceで十分」 | **standalone recorderをkill**。bridge/upstream contributionへ縮小 |
| T+21 | 20 seeded/real failuresで最初のcausal break自動特定 <80%、capture overhead p95 >5ms、またはcontent-offで必要相関が復元不能 | 技術仮説をkill |
| T+30 post-launch | 週150★未満**かつ**外部staging利用3組織未満。スターだけ低い場合はkillしない | distribution/wedgeをpivot |
| T+60 | 次の2つ以上が未達: production read-only 6組織、2 backendへのexport、外部issue reporter 10人 | standalone productを再評価 |
| T+90 | production継続10組織または有料/LOI 2社のどちらも未達で、かつ実incident <20件/月・外部contributor <5・community <100のうち2つ以上が未達 | **venture thesisをkillまたはrunaway fuse/semconv bridgeへpivot** |

起業ゲートの長期目標（issues 100+、外部contributors 50、community 500–1,000、利用指標MoM 10%+、ARR $100k+）は別途追跡する。スター10kでも本番利用が伸びなければ起業判断をしない。

## 4. 他候補を待つ理由と1週間以内のテスト

| 候補 | 最安テスト | Kill / wait条件 |
|---|---|---|
| Spend ledger | 3 repo×各agent 20 sessionsをbill/PRへ帰属 | 誤差>5%、自動帰属<80%、またはAgentReplay/Renueと同等ならkill。直接需要を10社中5社で再確認するまでWAIT |
| Runaway fuse | 6 seeded trajectories + 100 valid trajectories | loop停止が追加paid call 0–1回を超える、false positive >1%、p95 overhead >5msならkill。recorder kernel後の最有力pivot |
| Semconv bridge | 10公開fixtureを3 backendへ変換 | 実差分<5、upstream processorで代替、3/10未満しかCI利用を希望しなければkill。recorderの`doctor`に吸収 |
| Privacy gateway | 100合成nested payloadでgeneric processorと比較 | false negativeを説明不能、構造保持率95%未満、5社中3社未満がproduction gateと認識ならkill/feature化 |
| Multi-agent causal debugger | 3 seeded distributed failuresをread-only CLIで解析 | initiating handoff特定<3/3、manual inspectionより短縮<50%ならkill。MVPには重すぎるためrecorder上のphase 2 |
| Semantic radar | 10 seeded regressionsのprecision/recall benchmark | precision<80%またはbasic thresholds/manual reviewを超えないならkill |
| Protocol VCR | network-offで20 failed tracesをcassette再生 | 同一failure再現<90%、手修正median>5分ならkill。単独repoは作らない |
| Generic recorder | portable incident bundleへの10 interview | 7/10が既存toolで十分、または3 design partners未満ならkill。現状HOLD |

### 何がランキングを変えるか

- Spend ledgerについて独立した10社中5社以上がPR単位原価へ支払意思を示し、既存競合にない帰属精度80%以上を実証すれば、首位へ上げる。
- Runaway fuseが100 valid trajectoriesでfalse positive 0、複数frameworkで追加paid call 0–1を示せば、痛みの直接性から首位へ上げる。
- protocol recorderで10人中5人のtrace提供または200 qualified views→10 installsを満たせなければ、技術空白を需要と誤認したとして首位から外す。
- OTel/MCP/A2A upstreamがwire capture + causal link + version migrationを公式実装した場合、recorder単独はkillし、上流contributionまたはfuseへ移る。

## 5. プロダクト名候補と空き確認

GitHubはrepo名がglobal uniqueではないため、「空き」は (a) exact public repo名の衝突なし、(b)同名user/org handleが404、で確認した。domainはGoogle Registry `.dev` RDAPの404（未登録応答）を確認した。**これは商標調査でも予約保証でもない**。名前確定直前にregistrarと商標を再確認する。

| 推薦順 | 名前 | 発音・検索性 | GitHub確認（2026-08-10 JST） | Domain確認（2026-08-10 JST） |
|---:|---|---|---|---|
| **1** | **`causalwire`** | “causal wire”。因果+wire境界がそのまま伝わり、完全一致の競合software検索結果なし | [repo search](https://api.github.com/search/repositories?q=causalwire+in:name) exact 0、[handle](https://api.github.com/users/causalwire) 404 | [`causalwire.dev` RDAP](https://pubapi.registry.google/rdap/domain/causalwire.dev) 404 |
| 2 | `causalloom` | “causal loom”。複数protocolを編む比喩が明確で、完全一致の競合software検索結果なし | [search](https://api.github.com/search/repositories?q=causalloom+in:name) exact 0、[handle](https://api.github.com/users/causalloom) 404 | [`causalloom.dev` RDAP](https://pubapi.registry.google/rdap/domain/causalloom.dev) 404 |
| 3 | `causalspan` | “causal span”。OTel developerに意味が即時に伝わり、完全一致の競合software検索結果なし | [search](https://api.github.com/search/repositories?q=causalspan+in:name) exact 0、[handle](https://api.github.com/users/causalspan) 404 | [`causalspan.dev` RDAP](https://pubapi.registry.google/rdap/domain/causalspan.dev) 404 |
| 4 | `wirelineage` | “wire lineage”。機能明確で検索衝突がない。3候補よりやや長い | [search](https://api.github.com/search/repositories?q=wirelineage+in:name) exact 0、[handle](https://api.github.com/users/wirelineage) 404 | [`wirelineage.dev` RDAP](https://pubapi.registry.google/rdap/domain/wirelineage.dev) 404 |

**推薦名は `causalwire`。** 検索衝突が最も少なく、wedgeの二語（causal + wire）を短く保持する。名前確定まではdirectory/repository/domainを作らない。

## 6. Gate Aの決定

- **GO / NO-GO:** GO
- **確定名:** `causalwire`
- **決定日:** 2026-08-10

この決定に基づき、本書を `causalwire/docs/THESIS.md` に配置し、仕様策定フェーズへ進む。
