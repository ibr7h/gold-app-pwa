#!/usr/bin/env node
'use strict';
// Two-phase User-only release: stamp APP_VERSION before compiling, then
// publish the exact entry JavaScript and same semantic version together.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=path.join(root,'_render_preview/gold-app-pwa/full');
const src=path.join(root,'apps/user/overrides/web/app-version.ts');
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s,'utf8');
const current=read(src),m=current.match(/export const APP_VERSION = '(\d+)\.(\d+)\.(\d+)';/);
if(!m)throw Error('Source semantic version missing');
const mode=process.argv[2];
if(mode==='--prepare'){
 const next=[+m[1],+m[2],+m[3]+1].join('.');
 write(src,current.replace(m[0],"export const APP_VERSION = '"+next+"';"));
 console.log('Prepared app source version v'+next+' BEFORE compiling');
 process.exit(0);
}
if(mode!=='--finalize')throw Error('Specify --prepare before Expo export and --finalize afterwards');
const semver=[+m[1],+m[2],+m[3]].join('.');
const parts=new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Riyadh'}).formatToParts(new Date());
const d=Object.fromEntries(parts.map(p=>[p.type,p.value]));
const date=d.year+d.month+d.day,token=semver+'-'+date,version='full-'+token;
const swPath=path.join(base,'sw.js'),clientPath=path.join(base,'pwa-update.js');
let sw=read(swPath),client=read(clientPath);
if(!/const VERSION = '[^']+';/.test(sw)||!/const CURRENT = 'full-[^']+';/.test(client)||!client.includes('loadedEntryPath()'))throw Error('Unverified release scripts');
const index=read(path.join(base,'index.html'));
const entryMatch=index.match(/data-entry="(\/gold-app-pwa\/full\/_expo\/static\/js\/web\/entry-[a-z0-9]+\.js)(?:\?[^"]*)?"/);
if(!entryMatch)throw Error('Compiled entry missing in published shell');
const entry=entryMatch[1],entryFile=path.join(base,entry.split('/').pop());
const bundlePath=path.join(base,'_expo/static/js/web',path.basename(entry));
if(!fs.existsSync(bundlePath))throw Error('Compiled entry does not exist: '+entry);
const compiled=read(bundlePath);
if(!compiled.includes(semver))throw Error('Compiled User JS does not carry the announced app version v'+semver);
let count=0;
function stamp(folder){
 for(const e of fs.readdirSync(folder,{withFileTypes:true})){
  if(e.isDirectory()){if(['_expo','assets','node_modules'].includes(e.name))continue;stamp(path.join(folder,e.name));continue;}
  if(!e.name.endsWith('.html'))continue;
  const file=path.join(folder,e.name),old=read(file);
  const fresh=old.replace(/((?:iphone-preview-lock\.(?:css|js)|user-update-locales\.js|pwa-update\.js)\?v=)[A-Za-z0-9.-]+/g,'$1'+token);
  if(!fresh.includes(entry))throw Error('Stale compiled JavaScript on route '+file);
  if(fresh!==old){write(file,fresh);count++;}
 }
}
stamp(base);
if(count<20)throw Error('Not all preview HTML entrypoints stamped: '+count);
client=client.replace(/const CURRENT = 'full-[^']+';/,"const CURRENT = '"+version+"';");
sw=sw.replace(/const VERSION = '[^']+';/,"const VERSION = '"+token+"';");
write(clientPath,client);
write(swPath,sw);
write(path.join(base,'version.json'),JSON.stringify({
 version,displayVersion:'v'+semver,releasedAt:date,entry,force:true
},null,2)+'\n');
console.log('Verified v'+semver+' bundled in '+path.basename(entry)+' and '+count+' preview pages');
