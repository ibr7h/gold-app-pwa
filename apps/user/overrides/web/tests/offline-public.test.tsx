import React from 'react';
// The archived app has react-dom but no @types/react-dom dev dependency.
const {renderToStaticMarkup}=require('react-dom/server') as {renderToStaticMarkup:(element:React.ReactNode)=>string};
import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {PUBLIC_MARKET_CACHE,parsePublicMarketSnapshot,readPublicMarketSnapshot,savePublicMarketSnapshot} from '../public-market-cache';
import OfflineWorkspace from '../OfflineWorkspace';
vi.mock('../i18n',()=>({useLanguage:()=>({language:'en',direction:'ltr'}),activeLocale:()=> 'en-US'}));
const memory=new Map<string,string>();
const row=()=>({currency:'SAR',karat:24,buyPrice:'481.9719',sellPrice:'482.0001',timestamp:new Date(Date.now()-1000).toISOString()});
describe('public-only offline tools and price snapshots',()=>{
 beforeEach(()=>{memory.clear();vi.stubGlobal('window',{localStorage:{getItem:(k:string)=>memory.get(k)||null,setItem:(k:string,v:string)=>memory.set(k,v)}});});
 afterEach(()=>vi.unstubAllGlobals());
 it('stores real observations and their timestamps, not fabricated zero prices',()=>{
  savePublicMarketSnapshot([row()]);
  expect(readPublicMarketSnapshot()?.rows[0].buyPrice).toBe('481.9719');
  expect(readPublicMarketSnapshot()?.rows[0].timestamp).toBeTruthy();
 });
 it('whitelists public fields and never persists caller-supplied private data',()=>{
  savePublicMarketSnapshot([{...row(),accessToken:'must-not-be-stored',email:'private@example.invalid',portfolioId:'private-wallet'} as any]);
  expect(memory.get(PUBLIC_MARKET_CACHE)).not.toMatch(/accessToken|email|portfolioId|must-not-be-stored/);
 });
 it('preserves distinctly timestamped EUR observations when only SAR/USD refresh',()=>{
  savePublicMarketSnapshot([{...row(),currency:'EUR',buyPrice:'120'}]);
  savePublicMarketSnapshot([row()]);
  expect(readPublicMarketSnapshot()?.rows.map(r=>r.currency)).toEqual(['SAR','EUR']);
 });
 it('rejects corrupted, duplicate and future observations',()=>{
  const now=Date.now();
  for(const rows of [[{...row(),buyPrice:'0'}],[row(),row()],[{...row(),timestamp:new Date(now+600000).toISOString()}]])
   expect(parsePublicMarketSnapshot({version:1,savedAt:now,rows},now)).toBeNull();
  memory.set(PUBLIC_MARKET_CACHE,'not-json');
  expect(readPublicMarketSnapshot()).toBeNull();
 });
 it('a storage/quota failure does not break online pricing',()=>{
  vi.stubGlobal('window',{localStorage:{getItem:()=>null,setItem:()=>{throw Error('quota');}}});
  expect(()=>savePublicMarketSnapshot([row()])).not.toThrow();
 });
 it('renders offline tools with no login/API operation and explicitly non-live quotes',()=>{
  savePublicMarketSnapshot([row()]);
  const fetcher=vi.fn(()=>{throw Error('Offline UI must not request account data');});
  vi.stubGlobal('fetch',fetcher);
  const html=renderToStaticMarkup(<OfflineWorkspace online={false} onReturn={()=>{}}/>);
  expect(html).toContain('Offline mode');
  expect(html).toContain('Prices are not live');
  expect(html).toContain('481');
  expect(html).toContain('Tax (%)');
  expect(html).not.toContain('private-wallet');
  expect(fetcher).not.toHaveBeenCalled();
 });
 it('without any saved price, manual calculator remains available and no price is invented',()=>{
  const html=renderToStaticMarkup(<OfflineWorkspace online={false} onReturn={()=>{}}/>);
  expect(html).toContain('No saved quote');
  expect(html).toContain('Enter another price');
 });
});
