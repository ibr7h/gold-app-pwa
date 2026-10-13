#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=path.join(root,'_render_preview/gold-app-pwa/full');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=JSON.parse(read('_render_preview/gold-app-pwa/full/version.json'));
assert(/^full-\d+\.\d+\.\d+-\d{8}$/.test(json.version),'Release must have semver and date');
const stamp=json.version.slice(5),semver=stamp.split('-')[0];
assert.equal(json.displayVersion,'v'+semver);
assert(read('apps/user/overrides/web/app-version.ts').includes("APP_VERSION = '"+semver+"'"));
const updater=read('_render_preview/gold-app-pwa/full/pwa-update.js');
assert(updater.includes("const CURRENT = '"+json.version+"'"));
assert(updater.includes('loadedEntryPath()'),'Updater must inspect the actually loaded Expo bundle');
assert(!updater.includes('MutationObserver(syncAccountVersion)'),'Deceptive version-label rewrite remains in updater');
assert(updater.includes("addEventListener('dhahabi:user-check-update'"),'Update button event missing');
assert(updater.includes('version.json?t='),'Update check cache bypass missing');
assert(updater.includes('loadedEntryPath() !== data.entry'),'Updater does not compare loaded bundle to release manifest');
assert(typeof json.entry==='string' && /^\/gold-app-pwa\/full\/_expo\/static\/js\/web\/entry-[a-f0-9]+\.js$/.test(json.entry),'Release manifest does not identify bundle');
const entryFile=path.join(root,'_render_preview',json.entry.replace(/^\/gold-app-pwa\//,''));
assert(fs.existsSync(entryFile),'Announced compiled JS bundle missing');
assert(fs.readFileSync(entryFile,'utf8').includes(semver),'Compiled JS does not contain the displayed app version');
new vm.Script(updater);
const sw=read('_render_preview/gold-app-pwa/full/sw.js');
assert(sw.includes("const VERSION = '"+stamp+"'"));
assert(sw.includes("'/version.json'") && sw.includes("'/pwa-update.js'") &&
  sw.includes("url.pathname.endsWith(path)") && sw.includes("cache:'no-store'"),
  'SW version and bootstrap network bypass missing');
assert(sw.includes("url.pathname.includes('/_expo/static/')"),'Compiled assets must never be served cache-first');
new vm.Script(sw);
let count=0;
function check(dir){
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(e.isDirectory()){if(['assets','_expo','node_modules'].includes(e.name))continue;check(path.join(dir,e.name));continue;}
  if(!e.name.endsWith('.html'))continue;
  const html=fs.readFileSync(path.join(dir,e.name),'utf8');
  for(const file of ['iphone-preview-lock.css','iphone-preview-lock.js','pwa-update.js']){
   if(html.includes(file+'?v='))assert(html.includes(file+'?v='+stamp),'Outdated '+file+' in '+e.name);
  }
  if(html.includes('iphone-preview-lock.js')){
   assert(html.includes(json.entry),'HTML entry is not the announced bundle');
   count++;
  }
 }
}
check(base);
assert(count>=25,'Too few HTML entrypoints validated: '+count);
console.log('PASS version '+semver+' synchronized in '+count+' iPhone pages and PWA cache');
