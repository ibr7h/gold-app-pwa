#!/usr/bin/env node
'use strict';
// Each new iPhone User code release advances its visible semantic version.
// Rebuilding an unchanged git commit does not create a new application release.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=path.join(root,'_render_preview/gold-app-pwa/full');
const src=path.join(root,'apps/user/overrides/web/app-version.ts');
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s,'utf8');
const current=read(src),m=current.match(/export const APP_VERSION = '(\d+)\.(\d+)\.(\d+)';/);
if(!m)throw Error('Source semantic version missing');
const next=[+m[1],+m[2],+m[3]+1].join('.');
const parts=new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Riyadh'}).formatToParts(new Date());
const d=Object.fromEntries(parts.map(p=>[p.type,p.value]));
const date=d.year+d.month+d.day,token=next+'-'+date,version='full-'+token;
const swPath=path.join(base,'sw.js'),clientPath=path.join(base,'pwa-update.js');
let sw=read(swPath),client=read(clientPath);
if(!/const VERSION = '[^']+';/.test(sw)||!/const CURRENT = 'full-[^']+';/.test(client)||!client.includes('watchAccountVersion()'))throw Error('Release scripts not ready');
let count=0;
function stamp(folder){
 for(const e of fs.readdirSync(folder,{withFileTypes:true})){
  if(e.isDirectory()){if(['_expo','assets','node_modules'].includes(e.name))continue;stamp(path.join(folder,e.name));continue;}
  if(!e.name.endsWith('.html'))continue;
  const f=path.join(folder,e.name),old=read(f);
  const fresh=old.replace(/((?:iphone-preview-lock\.(?:css|js)|user-update-locales\.js|pwa-update\.js)\?v=)[A-Za-z0-9.-]+/g,'$1'+token);
  if(fresh!==old){write(f,fresh);count++;}
 }
}
stamp(base);
if(count<20)throw Error('Not all preview HTML entrypoints stamped: '+count);
client=client.replace(/const CURRENT = 'full-[^']+';/,"const CURRENT = '"+version+"';");
sw=sw.replace(/const VERSION = '[^']+';/,"const VERSION = '"+token+"';");
write(src,current.replace(m[0],"export const APP_VERSION = '"+next+"';"));
write(clientPath,client);
write(swPath,sw);
write(path.join(base,'version.json'),JSON.stringify({version,displayVersion:'v'+next,releasedAt:date,force:true},null,2)+'\n');
console.log('Prepared iPhone User '+version+' on '+count+' preview pages');
