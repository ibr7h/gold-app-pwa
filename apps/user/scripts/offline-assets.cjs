'use strict';
const fs=require('node:fs'),path=require('node:path');
const BASE='/gold-app-pwa/full/';
const assetExtension=/\.(?:js|css|png|jpe?g|svg|webp|ico|woff2?|ttf|otf)$/i;
function collectOfflineAssets(root){
 const files=new Set();
 const add=relative=>{
  const filename=path.resolve(root,relative);
  if(!filename.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(filename)||!fs.statSync(filename).isFile()||fs.statSync(filename).size===0)
   throw new Error('Missing offline boot asset: '+relative);
  files.add(BASE+relative.split(path.sep).join('/'));
 };
 const walk=(dir,staticOnly=false)=>{
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
   const filename=path.join(dir,entry.name);
   if(entry.isDirectory()){if(entry.name!=='.git')walk(filename,staticOnly);continue;}
   if(staticOnly&&assetExtension.test(entry.name))add(path.relative(root,filename));
   if(!staticOnly&&entry.name.endsWith('.html')){
    const html=fs.readFileSync(filename,'utf8');
    for(const match of html.matchAll(/\b(?:src|href|data-entry)=["']([^"']+)["']/g)){
     const url=new URL(match[1],'https://offline.invalid'+BASE+path.relative(root,filename));
     if(url.origin!=='https://offline.invalid'||!url.pathname.startsWith(BASE))continue;
     if(assetExtension.test(url.pathname)||/\/manifest\.(?:json|webmanifest)$/.test(url.pathname))
      add(decodeURIComponent(url.pathname.slice(BASE.length)));
    }
   }
  }
 };
 walk(root);
 walk(path.join(root,'_expo'),true);
 walk(path.join(root,'assets'),true);
 let total=0;
 for(const file of files)total+=fs.statSync(path.join(root,file.slice(BASE.length))).size;
 if(total>20*1024*1024)throw new Error('Offline precache exceeds the reviewed 20 MiB budget');
 if(!files.size)throw new Error('Empty offline boot manifest');
 return [...files].sort();
}
function buildOfflineWorker(root,source,version){
 if(!/^\d+\.\d+\.\d+-\d{8}$/.test(version))throw new Error('Invalid offline release version');
 if(!source.includes('const OFFLINE_ASSETS = [];'))throw new Error('Worker offline-manifest marker missing');
 const assets=collectOfflineAssets(root);
 return source.replace(/const VERSION = '[^']+';/,"const VERSION = '"+version+"';")
  .replace('const OFFLINE_ASSETS = [];','const OFFLINE_ASSETS = '+JSON.stringify(assets)+';');
}
module.exports={collectOfflineAssets,buildOfflineWorker};
if(require.main===module){
 const root=path.resolve(process.argv[2]);
 const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).semanticReleaseVersion?.replace(/^full-/,'');
 const source=fs.readFileSync(path.join(__dirname,'user-service-worker.js'),'utf8');
 fs.writeFileSync(path.join(root,'sw.js'),buildOfflineWorker(root,source,version));
 console.log('Prepared reviewed offline worker for '+version);
}
