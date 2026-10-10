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
assert(updater.includes('watchAccountVersion()'),'Profile version display is not dynamic');
assert(updater.includes("addEventListener('dhahabi:user-check-update'"),'Update button event missing');
assert(updater.includes('version.json?t='),'Update check cache bypass missing');
new vm.Script(updater);
const sw=read('_render_preview/gold-app-pwa/full/sw.js');
assert(sw.includes("const VERSION = '"+stamp+"'"));
assert(sw.includes("url.pathname.endsWith('/version.json')"),'SW version bypass missing');
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
  if(html.includes('iphone-preview-lock.js'))count++;
 }
}
check(base);
assert(count>=25,'Too few HTML entrypoints validated: '+count);
console.log('PASS version '+semver+' synchronized in '+count+' iPhone pages and PWA cache');
