/** Keep the iPhone User workspace inside the visible area while editing a field.
 * iOS Safari/WebKit can shrink visualViewport without resizing the layout viewport.
 * This observes DOM state instead of using React state, avoiding expensive app renders
 * for each keyboard animation frame.
 */
export interface IphoneViewportSample {
 layoutHeight:number;
 visualHeight:number;
 offsetTop:number;
 scale:number;
 hasEditableFocus:boolean;
}
export interface IphoneViewportState {keyboardOpen:boolean;visibleHeight:number;offsetTop:number}
export function measureIphoneViewport(s:IphoneViewportSample):IphoneViewportState {
 const height=Math.max(1,Number.isFinite(s.visualHeight)?s.visualHeight:s.layoutHeight);
 const top=Math.max(0,Number.isFinite(s.offsetTop)?s.offsetTop:0);
 const difference=Math.max(0,s.layoutHeight-height-top);
 const threshold=Math.max(130,s.layoutHeight*0.18);
 const keyboardOpen=s.hasEditableFocus&&s.scale<=1.05&&difference>threshold;
 return {keyboardOpen,visibleHeight:height,offsetTop:top};
}
export function installIphoneViewportObserver(root:HTMLElement):()=>void {
 if(typeof window==='undefined'||typeof document==='undefined'||!window.visualViewport||
  typeof CSS==='undefined'||!CSS.supports('-webkit-touch-callout','none')||
  !window.matchMedia('(max-width: 800px) and (pointer: coarse)').matches)return ()=>{};
 const viewport=window.visualViewport;
 let frame=0;
 let disposed=false;
 const update=()=>{
  frame=0;
  if(disposed)return;
  const focused=document.activeElement;
  const hasEditableFocus=!!focused&&(focused.matches('input,textarea,select,[contenteditable="true"],[role="textbox"]'));
  const sample=measureIphoneViewport({
   layoutHeight:window.innerHeight,visualHeight:viewport.height,
   offsetTop:viewport.offsetTop,scale:viewport.scale,hasEditableFocus,
  });
  if(sample.keyboardOpen){
   root.dataset.iphoneKeyboard='open';
   root.style.setProperty('--iphone-visible-height',sample.visibleHeight+'px');
   root.style.setProperty('--iphone-viewport-offset-top',sample.offsetTop+'px');
  }else{
   delete root.dataset.iphoneKeyboard;
   root.style.removeProperty('--iphone-visible-height');
   root.style.removeProperty('--iphone-viewport-offset-top');
  }
 };
 const schedule=()=>{if(!frame)frame=window.requestAnimationFrame(update);};
 viewport.addEventListener('resize',schedule);
 viewport.addEventListener('scroll',schedule);
 window.addEventListener('resize',schedule);
 window.addEventListener('focusin',schedule,true);
 window.addEventListener('focusout',schedule,true);
 schedule();
 return ()=>{
  disposed=true;
  if(frame)window.cancelAnimationFrame(frame);
  viewport.removeEventListener('resize',schedule);
  viewport.removeEventListener('scroll',schedule);
  window.removeEventListener('resize',schedule);
  window.removeEventListener('focusin',schedule,true);
  window.removeEventListener('focusout',schedule,true);
  delete root.dataset.iphoneKeyboard;
  root.style.removeProperty('--iphone-visible-height');
  root.style.removeProperty('--iphone-viewport-offset-top');
 };
}
