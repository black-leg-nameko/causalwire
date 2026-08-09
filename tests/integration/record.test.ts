import { afterEach,describe,expect,it } from 'vitest';
import { mkdtempSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable,Writable } from 'node:stream';
import { recordChild } from '../../src/capture/child-process-wrapper.js';
import { analyzeJournal } from '../../src/normalize/pipeline.js';

const dirs:string[]=[];
afterEach(()=>{for(const dir of dirs.splice(0))rmSync(dir,{recursive:true,force:true});});
const sink=()=>{const chunks:Buffer[]=[];return {stream:new Writable({write(chunk,_enc,done){chunks.push(Buffer.from(chunk));done();}}),bytes:()=>Buffer.concat(chunks)};};

describe('stdio wrapper',()=>{
  it('forwards bytes exactly and captures matching graph',async()=>{
    const dir=mkdtempSync(join(tmpdir(),'cw bytes '));dirs.push(dir);
    const payload=Buffer.from('{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"inventory.lookup"}}\r\n');
    const response=Buffer.from('{"jsonrpc":"2.0","id":1,"result":{"available":true}}\r\n');
    const output=sink();const errors=sink();
    const child=`const chunks=[];process.stdin.on('data',c=>chunks.push(c));process.stdin.on('end',()=>{const got=Buffer.concat(chunks);if(got.toString()!==${JSON.stringify(payload.toString())})process.exit(31);process.stdout.write(${JSON.stringify(response.toString())},()=>process.exit(0))})`;
    const result=await recordChild({command:process.execPath,args:['-e',child],out:join(dir,'run.jsonl'),input:Readable.from([payload]),output:output.stream,errorOutput:errors.stream,quiet:true});
    expect(result.exitCode).toBe(0);expect(output.bytes().equals(response)).toBe(true);expect(result.frameCount).toBe(2);
    const graph=await analyzeJournal(result.journalPath);expect(graph.edges.some((e)=>e.kind==='responds_to'&&e.status==='ok')).toBe(true);
  });
  it('propagates a non-zero child exit',async()=>{const dir=mkdtempSync(join(tmpdir(),'cw-exit-'));dirs.push(dir);const result=await recordChild({command:process.execPath,args:['-e','process.exit(23)'],out:join(dir,'exit.jsonl'),input:Readable.from([]),output:sink().stream,errorOutput:sink().stream,quiet:true});expect(result.exitCode).toBe(23);expect(readFileSync(result.journalPath,'utf8')).toContain('"exit_code":23');});
  it('keeps correlation identical for off and full',async()=>{const graphs=[];for(const content of ['off','full'] as const){const dir=mkdtempSync(join(tmpdir(),`cw-${content}-`));dirs.push(dir);const payload=Buffer.from('{"jsonrpc":"2.0","id":"sensitive-id","method":"tools/call","params":{"name":"catalog.lookup"}}\n');const result=await recordChild({command:process.execPath,args:['-e',`process.stdin.on('data',c=>process.stdout.write(c))`],out:join(dir,'run.jsonl'),content,input:Readable.from([payload]),output:sink().stream,errorOutput:sink().stream,quiet:true});graphs.push(await analyzeJournal(result.journalPath));}expect(graphs[0].edges.map((e)=>e.status)).toEqual(graphs[1].edges.map((e)=>e.status));expect(JSON.stringify(graphs[0])).not.toContain('sensitive-id');});
});
