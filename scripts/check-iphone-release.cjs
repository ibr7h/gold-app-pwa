#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=path.join(root,'_render_preview/gold-app-pwa/full');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=JSON.parse(read('_render_preview/gold-app-pwa/full/version.json'));
assert(/^full-[a-f0-9]{8,40}$/.test(json.version),'Legacy version must remain compatible with old iPhone installs');
assert.equal(json.releaseVersion,json.version,'Legacy and broken semantic clients need hex compatibility metadata');
const semanticRelease=json.semanticReleaseVersion||json.releaseVersion||json.version;
assert(/^full-\d+\.\d+\.\d+-\d{8}$/.test(semanticRelease),'Semantic release must have semver and date');
const stamp=semanticRelease.slice(5),semver=stamp.split('-')[0];
assert.equal(json.displayVersion,'v'+semver);
assert(read('apps/user/overrides/web/app-version.ts').includes("APP_VERSION = '"+semver+"'"));
const updater=read('_render_preview/gold-app-pwa/full/pwa-update.js');
assert(updater.includes("const CURRENT = '"+semanticRelease+"'"));
assert(updater.includes('data?.semanticReleaseVersion || data?.releaseVersion || data?.version'),
 'Modern updater must prefer the semantic release while retaining legacy compatibility');
const validationLine=updater.split('\n').find(line=>line.includes("typeof requested !== 'string'"));
assert(validationLine,'Published updater must validate version syntax');
const literal=validationLine.match(/!\/(\^full-\(\?:.+\)\$)\/\.test\(requested\)/);
assert(literal,'Published updater version parser not found');
const validVersion=new RegExp(literal[1]);
assert(validVersion.test(semanticRelease),'Published updater must accept the published semantic version');
assert(validVersion.test(json.version),'Published updater must recognize legacy hex version');
assert(!validVersion.test('full-1x9x99-20261013'),'Malformed semantic version should be rejected');
assert(updater.includes('watchAccountVersion()'),'Profile version display is not dynamic');
assert(updater.includes("addEventListener('dhahabi:user-check-update'"),'Update button event missing');
assert(updater.includes('version.json?t='),'Update check cache bypass missing');
new vm.Script(updater);
const sw=read('_render_preview/gold-app-pwa/full/sw.js');
assert(sw.includes("const VERSION = '"+stamp+"'"));
assert(sw.includes("'/version.json'") && sw.includes("'/pwa-update.js'") &&
  sw.includes("url.pathname.endsWith(path)") && sw.includes("cache:'no-store'"),
  'SW version and bootstrap network bypass missing');
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
