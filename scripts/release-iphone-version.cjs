#!/usr/bin/env node
'use strict';
// Each new iPhone User code release advances its visible semantic version.
// Rebuilding an unchanged git commit does not create a new application release.
const fs=require('node:fs'),path=require('node:path');
const {buildOfflineWorker}=require('../apps/user/scripts/offline-assets.cjs');
const root=path.resolve(__dirname,'..'),base=path.join(root,'_render_preview/gold-app-pwa/full');
const src=path.join(root,'apps/user/overrides/web/app-version.ts');
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s,'utf8');
// Brand text only: preserve historic storage keys, URLs and the Arabic adjective «الذهبي».
const updateBrand=s=>s.replace(/Dhahabi/g,'Dhahabk').replace(/(?<!ال)ذهبي/g,'ذهبك');
const current=read(src),m=current.match(/export const APP_VERSION = '(\d+)\.(\d+)\.(\d+)';/);
if(!m)throw Error('Source semantic version missing');
const next=[+m[1],+m[2],+m[3]+1].join('.');
const parts=new Intl.DateTimeFormat('en-US',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Asia/Riyadh'}).formatToParts(new Date());
const d=Object.fromEntries(parts.map(p=>[p.type,p.value]));
const date=d.year+d.month+d.day,token=next+'-'+date,version='full-'+token;
// Compatibility bridge: iPhones installed before semantic versioning only
// recognize version.json.version as "full-<8-40 hex chars>". Keep that field
// valid for legacy clients; new clients prefer the semantic releaseVersion.
const releaseSha=(process.env.GITHUB_SHA||process.env.IPHONE_RELEASE_SHA||'').trim();
if(!/^[a-f0-9]{8,40}$/i.test(releaseSha))throw Error('Valid release SHA is required for legacy iPhone update migration');
const legacyVersion='full-'+releaseSha.slice(0,8).toLowerCase();
const swPath=path.join(base,'sw.js'),clientPath=path.join(base,'pwa-update.js');
// Always publish the reviewed worker source. Merely restamping an old deployed
// worker silently ignored source-level offline fixes in previous releases.
let sw=read(path.join(root,'apps/user/scripts/user-service-worker.js')),client=read(clientPath);
if(!/const VERSION = '[^']+';/.test(sw)||!/const CURRENT = 'full-[^']+';/.test(client)||!client.includes('watchAccountVersion()'))throw Error('Release scripts not ready');
let count=0;
function stamp(folder){
 for(const e of fs.readdirSync(folder,{withFileTypes:true})){
  if(e.isDirectory()){if(['_expo','assets','node_modules'].includes(e.name))continue;stamp(path.join(folder,e.name));continue;}
  if(!e.name.endsWith('.html'))continue;
  const f=path.join(folder,e.name),old=read(f);
  const fresh=updateBrand(old.replace(/((?:iphone-preview-lock\.(?:css|js)|user-update-locales\.js|pwa-update\.js|standalone-install-gate\.js)\?v=)[A-Za-z0-9.-]+/g,'$1'+token));
  if(fresh!==old){write(f,fresh);count++;}
 }
}
stamp(base);
if(count<20)throw Error('Not all preview HTML entrypoints stamped: '+count);
// The installed Home Screen name must match the reviewed User brand.
// Keep manifest id/start_url/scope/icons intact, preventing duplicate PWA installs.
for(const filename of ['manifest.webmanifest','manifest.json']){
 const filepath=path.join(base,filename);
 const manifest=JSON.parse(read(filepath));
 manifest.name='ذهبك';
 manifest.short_name='ذهبك';
 write(filepath,JSON.stringify(manifest,null,2)+'\n');
}
// The iPhone preview preserves its historic, version-patched updater script.
 // Patch that *published script*, not only apps/user/scripts/user-update-client.js,
 // so older iPhones can migrate through legacy hex metadata to semantic releases.
const oldDecision="if (data.version !== CURRENT) {";
const oldPrompt="showPrompt(data.version);";
const legacyDeclaration="const requested = data?.releaseVersion || data?.version;";
const modernDeclaration="const requested = data?.semanticReleaseVersion || data?.releaseVersion || data?.version;";
const versionValidator=
  "      if (typeof requested !== 'string' || !/^full-(?:[a-f0-9]{8,40}|\\d+\\.\\d+\\.\\d+-\\d{8})$/.test(requested)) throw new Error('version_invalid');";
// Builds start from either the original hex-only updater or the already
// released v1.9.62 semantic updater. Never require a one-time legacy marker.
if(client.includes(oldDecision)){
 if(!client.includes(oldPrompt))throw Error('Legacy updater missing notification call');
 client=client.replace(oldDecision,modernDeclaration+"\n"+versionValidator+"\n      if (requested !== CURRENT) {");
 client=client.replace(oldPrompt,'showPrompt(requested);');
}else if(client.includes(legacyDeclaration)){
 client=client.replace(legacyDeclaration,modernDeclaration);
}else if(!client.includes(modernDeclaration)){
 throw Error('Unknown published updater template; refusing unsafe release');
}
const validatorLine=/^[ \t]*if \(typeof requested !== 'string' \|\| !\/\^full-.*\)\$\/\.test\(requested\)\) throw new Error\('version_invalid'\);/m;
if(!validatorLine.test(client))throw Error('Updater semantic version validation missing');
client=client.replace(validatorLine,versionValidator);
client=client.replace(/const CURRENT = 'full-[^']+';/,"const CURRENT = '"+version+"';");
sw=buildOfflineWorker(base,sw,token);
write(src,current.replace(m[0],"export const APP_VERSION = '"+next+"';"));
// Preserve DhahabiUpdateLocale as the compatibility API consumed by old installed clients.
write(clientPath,client);
write(swPath,updateBrand(sw));
// Legacy iPhones have a broken double-escaped semantic regex; supplying the
// hex compatibility id here deliberately recovers their update dialog.
// New iPhones read semanticReleaseVersion first and compare true semantic ids.
write(path.join(base,'version.json'),JSON.stringify({
 version:legacyVersion,releaseVersion:legacyVersion,semanticReleaseVersion:version,
 displayVersion:'v'+next,releasedAt:date,force:true
},null,2)+'\n');
console.log('Prepared iPhone User '+version+' on '+count+' preview pages');
