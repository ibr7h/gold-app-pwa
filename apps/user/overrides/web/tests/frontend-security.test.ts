import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {describe,expect,it} from 'vitest';

const read=(path:string)=>readFileSync(join(process.cwd(),path),'utf8');
function sourceFiles(root:string):string[]{
 return readdirSync(root).flatMap(name=>{
  const path=join(root,name),stat=statSync(path);
  return stat.isDirectory()?(name==='tests'?[]:sourceFiles(path)):/\.(?:ts|tsx|js|jsx)$/.test(name)?[path]:[];
 });
}

describe('User frontend security boundaries',()=>{
 it('keeps upstream provider credentials and key storage out of the User PWA',()=>{
  const context=read('contexts/ApiKeyContext.tsx'),service=read('services/GoldApiService.ts');
  expect(context).not.toMatch(/AsyncStorage|x-(?:access)-token|goldapi[.]io/i);
  expect(service).not.toMatch(/x-(?:access)-token|goldapi[.]io/i);
  expect(service).toContain('gold-app-api-u8dl.onrender.com');
 });
 it('does not introduce raw HTML execution sinks in reviewed User overrides',()=>{
  const files=['app','contexts','services','web']
   .flatMap(directory=>sourceFiles(join(process.cwd(),directory)));
  const source=files.map(file=>readFileSync(file,'utf8')).join('\n');
  expect(source).not.toMatch(/dangerouslySetInnerHTML|insertAdjacentHTML|document[.]write|\beval\s*\(|new Function\s*\(/);
 });
 it('uses a versioned, bounded PIN work factor and preserves legacy migration',()=>{
  const vault=read('web/session-vault.ts');
  expect(vault).toContain('const PIN_ITERATIONS=600000');
  expect(vault).toContain('iterations?:number');
  expect(vault).toContain('LEGACY_PIN_ITERATIONS');
  expect(vault).toContain('Number(value)>1000000');
 });
});
