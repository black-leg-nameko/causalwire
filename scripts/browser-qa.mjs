import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderHtml } from '../dist/public-api.js';

mkdirSync('artifacts/screenshots',{recursive:true});
mkdirSync('artifacts/demo',{recursive:true});
mkdirSync('artifacts/reports',{recursive:true});
const emptyGraph={schema:'causalwire.graph/v1',run:{id:'empty_first_run',startedAt:'2026-08-10T00:00:00.000Z',captureComplete:true,contentPolicy:'off'},mapping:{id:'mcp-jsonrpc@1',generatedAt:'2026-08-10T00:00:00.001Z'},nodes:[{id:'run:empty_first_run',kind:'run',sourceSeq:0,synthetic:false,status:'ok',bytes:0,protocolVersion:'unknown'}],edges:[],diagnostics:[]};
writeFileSync('artifacts/demo/empty.html',renderHtml(emptyGraph));
const browser=await chromium.launch({headless:true});
const cases=[
  {name:'evidence-success',path:'artifacts/demo/stuck-tool.html',width:1280,height:900},
  {name:'evidence-success',path:'artifacts/demo/stuck-tool.html',width:768,height:900},
  {name:'evidence-success',path:'artifacts/demo/stuck-tool.html',width:375,height:812},
  {name:'evidence-success',path:'artifacts/demo/stuck-tool.html',width:320,height:720},
  {name:'evidence-empty',path:'artifacts/demo/empty.html',width:1280,height:900},
  {name:'evidence-empty',path:'artifacts/demo/empty.html',width:375,height:812},
  {name:'evidence-empty',path:'artifacts/demo/empty.html',width:320,height:720},
  {name:'svg-success',path:'artifacts/demo/stuck-tool.svg',width:1280,height:500},
];
const results=[];
for(const item of cases){
  const page=await browser.newPage({viewport:{width:item.width,height:item.height}});const consoleErrors=[];const failedRequests=[];
  page.on('console',(message)=>{if(message.type()==='error')consoleErrors.push(message.text());});page.on('requestfailed',(request)=>failedRequests.push(`${request.method()} ${request.url()}`));
  await page.goto(pathToFileURL(resolve(item.path)).href,{waitUntil:'load'});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`artifacts/screenshots/${item.name}-${item.width}.png`,fullPage:false,timeout:120_000,animations:'disabled'});
  const metrics=await page.evaluate(()=>{const text=document.body?.textContent??document.documentElement.textContent??'';return {title:document.title,scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth,scrollX:window.scrollX,scrollY:window.scrollY,bodyText:text.slice(0,300),firstBreak:/first break/i.test(text),empty:text.includes('No JSON-RPC exchanges found')};});
  const expectedBreak=item.name==='evidence-success';const expectedEmpty=item.name==='evidence-empty';
  results.push({...item,...metrics,consoleErrors,failedRequests,pass:metrics.scrollWidth<=metrics.innerWidth&&consoleErrors.length===0&&failedRequests.length===0&&(!expectedBreak||metrics.firstBreak)&&(!expectedEmpty||metrics.empty)});await page.close();
}
const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto(pathToFileURL(resolve('artifacts/demo/stuck-tool.html')).href);await page.screenshot({path:'artifacts/demo/demo-frame-1.png',timeout:120_000,animations:'disabled'});await page.locator('#diagnostics-title').scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/demo/demo-frame-2.png',timeout:120_000,animations:'disabled'});await page.close();await browser.close();
const report={generatedAt:new Date().toISOString(),browser:'Playwright Chromium',cases:results,pass:results.every((item)=>item.pass)};writeFileSync('artifacts/reports/browser-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
