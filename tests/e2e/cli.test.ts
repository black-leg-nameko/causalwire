import { afterEach,describe,expect,it } from 'vitest';
import { execFileSync,spawnSync } from 'node:child_process';
import { mkdtempSync,readFileSync,rmSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';

const dirs:string[]=[];
afterEach(()=>{for(const d of dirs.splice(0))rmSync(d,{recursive:true,force:true});});
const tsx=resolve('node_modules/tsx/dist/cli.mjs');

describe('CLI states',()=>{
  it('runs the success demo and writes real artifacts',()=>{const dir=mkdtempSync(join(tmpdir(),'cw-e2e-'));dirs.push(dir);const result=spawnSync(process.execPath,[tsx,'src/cli.ts','demo','--out-dir',dir],{encoding:'utf8'});expect(result.status).toBe(0);expect(result.stdout).toContain('FIRST BREAK D004');expect(readFileSync(join(dir,'stuck-tool.html'),'utf8')).toContain('Causal graph');expect(readFileSync(join(dir,'stuck-tool.svg'),'utf8')).toContain('FIRST BREAK');});
  it('returns usage error for invalid scenario',()=>{const result=spawnSync(process.execPath,[tsx,'src/cli.ts','demo','--scenario','does-not-exist'],{encoding:'utf8'});expect(result.status).toBe(64);expect(result.stderr).toContain('Unknown scenario');});
  it('renders the empty state without fake nodes',()=>{const dir=mkdtempSync(join(tmpdir(),'cw-empty-'));dirs.push(dir);const journal=join(dir,'empty.jsonl');const common={schema:'causalwire.journal/v1',run_id:'empty_run'};writeFileSync(journal,`${JSON.stringify({...common,seq:0,kind:'run_start',ts_wall:'2026-08-10T00:00:00.000Z',ts_mono_ns:'0',content_policy:'off',protocol:{version:'unknown'}})}\n${JSON.stringify({...common,seq:1,kind:'run_end',ts_wall:'2026-08-10T00:00:00.001Z',ts_mono_ns:'1000000',capture_complete:true})}\n`);const out=join(dir,'empty.html');execFileSync(process.execPath,[tsx,'src/cli.ts','export',journal,'--format','html','--out',out]);const html=readFileSync(out,'utf8');expect(html).toContain('No JSON-RPC exchanges found');expect(html).not.toContain('wire:');});
});
