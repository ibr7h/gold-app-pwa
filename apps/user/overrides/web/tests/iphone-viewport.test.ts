import {describe,expect,it} from 'vitest';
import {measureIphoneViewport} from '../iphone-viewport';

describe('iPhone visual viewport and keyboard detection',()=>{
 it('keeps bottom navigation visible when keyboard is absent',()=>{
  expect(measureIphoneViewport({layoutHeight:844,visualHeight:835,offsetTop:0,scale:1,hasEditableFocus:true}).keyboardOpen).toBe(false);
 });
 it('hides bottom navigation only when the keyboard actually reduces visible height',()=>{
  expect(measureIphoneViewport({layoutHeight:844,visualHeight:495,offsetTop:0,scale:1,hasEditableFocus:true})).toEqual({
   keyboardOpen:true,visibleHeight:495,offsetTop:0
  });
  expect(measureIphoneViewport({layoutHeight:844,visualHeight:495,offsetTop:0,scale:1,hasEditableFocus:false}).keyboardOpen).toBe(false);
 });
 it('ignores Safari address bar expansion and small viewport shifts',()=>{
  expect(measureIphoneViewport({layoutHeight:844,visualHeight:743,offsetTop:0,scale:1,hasEditableFocus:true}).keyboardOpen).toBe(false);
 });
 it('preserves user pinch zoom without treating it as a keyboard',()=>{
  expect(measureIphoneViewport({layoutHeight:844,visualHeight:440,offsetTop:0,scale:2,hasEditableFocus:true}).keyboardOpen).toBe(false);
 });
 it('handles visual viewport vertical offset and invalid measurements',()=>{
  expect(measureIphoneViewport({layoutHeight:844,visualHeight:480,offsetTop:18,scale:1,hasEditableFocus:true})).toEqual({
   keyboardOpen:true,visibleHeight:480,offsetTop:18
  });
  const r=measureIphoneViewport({layoutHeight:844,visualHeight:NaN,offsetTop:NaN,scale:1,hasEditableFocus:false});
  expect(r).toEqual({keyboardOpen:false,visibleHeight:844,offsetTop:0});
 });
});
