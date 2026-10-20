import fs from 'node:fs';
import path from 'node:path';
import { spawn,execFileSync } from 'node:child_process';
import zlib from 'node:zlib';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import chromium from '@sparticuz/chromium';
import { chromium as playwright } from 'playwright';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(process.env.COACHFLOW_REPO||path.join(here,'..'));
const out=path.resolve(process.env.COACHFLOW_QA_OUTPUT||path.join(here,'results'));
fs.mkdirSync(out,{recursive:true});
const logFile=path.join(out,'run.log');
for(const method of ['log','error']) {const original=console[method];console[method]=(...args)=>{fs.appendFileSync(logFile,args.join(' ')+'\n');original(...args);};}
if(!fs.existsSync('/tmp/coachflow-chromium')){
 const bin=new URL('./node_modules/@sparticuz/chromium/bin/',import.meta.url);
 fs.writeFileSync('/tmp/coachflow-chromium',zlib.brotliDecompressSync(fs.readFileSync(new URL('chromium.br',bin))),{mode:0o700});
 for(const name of ['fonts','swiftshader']){const target=name==='fonts'?'/tmp/fonts':'/tmp';fs.mkdirSync(target,{recursive:true});execFileSync('tar',['xf','-','--no-same-owner','--no-same-permissions','-C',target],{input:zlib.brotliDecompressSync(fs.readFileSync(new URL(name+'.tar.br',bin)))});}
}
const db=await PGlite.create();
const migrations=path.join(root,'back/prisma/migrations');
for(const name of fs.readdirSync(migrations).sort()) {
  const sql=path.join(migrations,name,'migration.sql');
  if(fs.existsSync(sql)) await db.exec(fs.readFileSync(sql,'utf8'));
}
const socket=new PGLiteSocketServer({db,port:54329,host:'127.0.0.1'});
await socket.start();
console.log('DATABASE_READY: 12 migrations, isolated PGlite');
const children=[];
function start(name,args,cwd,env={}) {
  const log=fs.openSync(path.join(out,name+'.log'),'w');
  const child=spawn(process.execPath,args,{cwd,env:{...process.env,...env},stdio:['ignore',log,log]});
  children.push(child); child.on('exit',code=>console.log(name+' EXIT '+code));return child;
}
start('backend',['dist/src/main.js'],root+'/back',{
  DATABASE_URL:'postgresql://postgres:postgres@127.0.0.1:54329/postgres?connection_limit=1',
  JWT_SECRET:'coachflow-isolated-qa-only-20261016',JWT_EXPIRES_IN:'1d',NODE_ENV:'test',PORT:'4301',CORS_ORIGIN:'http://127.0.0.1:4300'
});
start('frontend',['node_modules/next/dist/bin/next','dev','-p','4300','-H','127.0.0.1'],root+'/front',{
  NEXT_PUBLIC_API_URL:'http://127.0.0.1:4301/api',NEXT_TELEMETRY_DISABLED:'1'
});
async function ready(url) {
  for(let i=0;i<120;i++) {try {const res=await fetch(url);if(res.ok)return;}catch{} await new Promise(r=>setTimeout(r,500));}
  throw new Error('Not ready '+url);
}
await ready('http://127.0.0.1:4301/api');
await ready('http://127.0.0.1:4300/login');
const browser=await playwright.launch({executablePath:'/tmp/coachflow-chromium',args:chromium.args.filter(a=>!a.includes('disable-web-security')&&!a.includes('allow-running-insecure-content')&&a!=='--single-process'),headless:true});
const qa={root,out,db,browser,base:'http://127.0.0.1:4300',apiBase:'http://127.0.0.1:4301/api',results:[]};
console.log('READY '+await browser.version());
let closing=false;
async function close(code=0){if(closing)return;closing=true;for(const child of children)child.kill();await browser.close();await socket.stop();await db.close();process.exit(code);}
process.on('SIGINT',()=>close(130));process.on('SIGTERM',()=>close(143));
const all=process.argv.includes('--all');
const demo=process.argv.includes('--demo');
const names=demo?['seed','dashboard-seed']:['seed','player-management','match-flow','roster-responsive','periods-history','dashboard','dashboard-states','dashboard-accessibility','final-check'];
const scripts=all||demo?names.map(s=>path.join(here,s+'.mjs')):readline.createInterface({input:process.stdin});
for await(const line of scripts) {
  if(!line.trim())continue;
  if(line.trim()==='exit'){await close();break;}
  try {await (await import(path.resolve(line.trim())+'?t='+Date.now())).default(qa);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(qa.results,null,2));console.log('SCRIPT_PASS '+line.trim());}
  catch(e){console.error('SCRIPT_FAIL '+e.stack);if(qa.page){await qa.page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});fs.writeFileSync(path.join(out,'failure.txt'),await qa.page.locator('body').innerText().catch(()=>''));}if(all||demo)await close(1);}
}
if(all)await close();
if(demo){await qa.context.tracing.stop();console.log('DEMO_READY http://127.0.0.1:4300/login | coach.qa@example.com | CoachFlowQA2026! | équipe Seniors Démo | Ctrl+C pour arrêter');}
