'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const child=require('child_process');
const root=path.resolve(__dirname,'..');
const preview=path.join(root,'_render_preview/gold-app-pwa/full');
const archive=path.join(root,'gold-app 17 apr 15-19 adimin icon.zip');
const knownLeakedHashes=new Set([
 '00fd8da4d7b4e8ab88c25abbc77b03425d7bbfe31ee8b601e594b2b1e3db4b9c',
 '52708809b145444ea53677a1fcc8aba045e376bbf94a39e79757d566bc05e0c4',
 'db2e5be9236365efe1614c38538b120e7be72a74fb3e74af6ceb817bdea5982a'
]);
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function assert(condition,message){if(!condition)throw new Error(message);}
function leaked(text){
 const candidates=text.match(/[A-Za-z0-9_.-]{20,80}/g)||[];
 return candidates.some(value=>knownLeakedHashes.has(sha(value)));
}
function knownSecretPattern(text){
 return /BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|gh[pousr]_[A-Za-z0-9_]{20,}|sk_(?:live|test)_[A-Za-z0-9]{16,}|eyJ[A-Za-z0-9_-]{10,}[.][A-Za-z0-9_-]{10,}[.][A-Za-z0-9_-]{10,}/.test(text);
}

const jsDir=path.join(preview,'_expo/static/js/web');
const bundles=fs.readdirSync(jsDir).filter(name=>name.endsWith('.js'));
const entries=bundles.filter(name=>/^entry-[a-f0-9]+[.]js$/.test(name));
assert(entries.length===1,'Expected exactly one current entry bundle; found '+entries.length);
assert(bundles.length<=10,'Unexpected JavaScript accumulation; found '+bundles.length+' files');
assert(!fs.readdirSync(jsDir).some(name=>name.endsWith('.map')),'A production source map is publicly deployable');
for(const name of bundles){
 const bundle=fs.readFileSync(path.join(jsDir,name),'utf8');
 assert(!leaked(bundle),'A previously exposed provider key remains in '+name);
 assert(!knownSecretPattern(bundle),'A known secret/token pattern remains in '+name);
 assert(!/www[.]goldapi[.]io|x-access-token/i.test(bundle),'The User bundle still contacts an upstream provider directly: '+name);
}

const archiveText=child.execFileSync('unzip',['-p',archive],{maxBuffer:64*1024*1024}).toString('utf8');
assert(!leaked(archiveText),'A previously exposed provider key remains in the source archive');
assert(!knownSecretPattern(archiveText),'A known secret/token pattern remains in the source archive');
assert(!/www[.]goldapi[.]io|x-access-token/i.test(archiveText),'Direct upstream-provider access remains in the source archive');

const html=[];
function collect(dir){for(const name of fs.readdirSync(dir)){const file=path.join(dir,name),stat=fs.statSync(file);if(stat.isDirectory())collect(file);else if(name.endsWith('.html'))html.push(file);}}
collect(preview);
const fxSource=fs.readFileSync(path.join(root,'apps/user/overrides/web/euro-reference.ts'),'utf8');
const fxAddress=fxSource.match(/const FX_URL='([^']+)'/);
assert(fxAddress,'Reviewed User FX source missing');
const fxOrigin=new URL(fxAddress[1]).origin;
for(const file of html){
 const page=fs.readFileSync(file,'utf8');
 assert(page.includes('http-equiv="Content-Security-Policy"'),'Missing CSP meta in '+path.relative(root,file));
 assert(page.includes('name="referrer" content="no-referrer"'),'Missing referrer policy in '+path.relative(root,file));
 const policy=page.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
 const connect=policy?.split(';').map(v=>v.trim()).find(v=>v.startsWith('connect-src '))?.split(/\s+/).slice(1)||[];
 assert(connect.includes(fxOrigin),'Current EUR FX endpoint is blocked by published CSP: '+path.relative(root,file));
 assert(!connect.some(v=>v.includes('*')||v==='https:'||v==='http:'),'Unrestricted CSP network source in '+path.relative(root,file));
}
for(const obsolete of ['oauth/callback.html','forgot-password.html','dev/theme-lab.html'])
 assert(!fs.existsSync(path.join(preview,obsolete)),'Obsolete route remains deployable: '+obsolete);
console.log('iPhone frontend security audit passed: clean current bundles, no known leaked keys, CSP present, obsolete routes removed.');
