import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const tarball=resolve('artifacts/package/causalwire-0.1.0.tgz');
const work=mkdtempSync(join(tmpdir(),'causalwire-pack-smoke-'));
const transcript=[];
function run(args,input){const command=['exec','--yes',`--package=${tarball}`,'--','causalwire',...args];const started=performance.now();const result=spawnSync('npm',command,{cwd:work,input,encoding:'utf8'});const durationMs=performance.now()-started;transcript.push(`$ npm ${command.join(' ')}\n[exit ${result.status}; ${durationMs.toFixed(1)}ms]\n${result.stdout}${result.stderr}`);if(result.status!==0)throw new Error(`Smoke command failed: causalwire ${args.join(' ')}`);return durationMs;}
const quickstartMs=run(['demo','--out-dir','demo']);
run(['inspect',resolve('fixtures/demo/stuck-tool.jsonl')]);
run(['export',resolve('fixtures/demo/stuck-tool.jsonl'),'--format','html','--out','evidence.html']);
run(['export',resolve('fixtures/demo/stuck-tool.jsonl'),'--format','svg','--out','evidence.svg']);
run(['export',resolve('fixtures/demo/stuck-tool.jsonl'),'--format','otlp-json','--out','evidence.otlp.json']);
run(['record','--out','record.jsonl','--','node','-e','process.stdin.on("data",c=>{const x=JSON.parse(c);process.stdout.write(JSON.stringify({jsonrpc:"2.0",id:x.id,result:{ok:true}})+"\\n")})'],'{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"smoke.lookup"}}\n');
run(['inspect','record.jsonl','--format','dag']);
mkdirSync('artifacts/logs',{recursive:true});mkdirSync('artifacts/package-smoke',{recursive:true});writeFileSync('artifacts/logs/tarball-smoke.log',transcript.join('\n'));
for(const file of ['evidence.html','evidence.svg','evidence.otlp.json','record.jsonl'])copyFileSync(join(work,file),join('artifacts/package-smoke',file));
const privacyMarker='cw_privacy_fixture_value';const occurrences=['evidence.html','evidence.svg','evidence.otlp.json','record.jsonl'].reduce((count,file)=>count+(readFileSync(join(work,file),'utf8').split(privacyMarker).length-1),0);writeFileSync('artifacts/package-smoke/result.json',JSON.stringify({tarball,commands:7,allExitZero:true,quickstartMs,quickstartUnder60Seconds:quickstartMs<60_000,privacyMarkerOccurrences:occurrences},null,2)+'\n');rmSync(work,{recursive:true,force:true});console.log(`Tarball smoke PASS: 7 commands, quickstart ${quickstartMs.toFixed(1)}ms, privacy marker occurrences ${occurrences}`);if(quickstartMs>=60_000)process.exitCode=1;
