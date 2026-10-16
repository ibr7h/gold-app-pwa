/** User-only quote sharing. Render a deterministic, local PNG; never send prices or identity to a QR service. */
export type QuoteLanguage='ar'|'en'|'fr';
export type ShareFormat='post'|'story';
export interface ShareQuote {
 language:QuoteLanguage;
 currency:string;
 karat:number;
 weight:number;
 unitPrice:number;
 basePrice:number|null;
 priceSource:'market'|'manual';
 raw:number;
 fees:number;
 tax:number;
 total:number;
 words:string;
 generatedAt:string;
}
const site='https://app.dhahabk.com';
const text={
 ar:{title:'تفاصيل السعر المقدر',subtitle:'تقدير استرشادي — ليست فاتورة ضريبية',brand:'ذَهَبْك',tagline:'المنصة الموثوقة لأسعار الذهب والمجوهرات',purity:'العيار',unit:'سعر الجرام المعتمد في الحساب',base:'سعر الجرام الأساسي',manual:'سعر مُدخل يدويًا',market:'السعر المرجعي',weight:'الوزن',grams:'جرام',metal:'قيمة الذهب',fees:'إجمالي المصنعية',tax:'الضريبة المدخلة',total:'الإجمالي النهائي',words:'الإجمالي كتابة',footer:'حُسب عبر منصة ذَهَبْك للذهب والمجوهرات',disclaimer:'القيمة استرشادية، وقد يختلف السعر الفعلي.',date:'تاريخ التقدير',only:'عيار'},
 en:{title:'Estimated gold price',subtitle:'Indicative estimate — not a tax invoice',brand:'DHAHABK',tagline:'Gold & jewelry price information',purity:'Purity',unit:'Price per gram used',base:'Reference price per gram',manual:'Manually entered',market:'Reference quote',weight:'Weight',grams:'g',metal:'Gold value',fees:'Total workmanship',tax:'Entered tax amount',total:'Estimated total',words:'Total in words',footer:'Calculated with Dhahabk',disclaimer:'Indicative only. Actual seller prices may vary.',date:'Estimate date',only:'K'},
 fr:{title:'Détail du prix estimé',subtitle:'Estimation indicative — non fiscale',brand:'DHAHABK',tagline:'Cours de l’or et des bijoux',purity:'Carats',unit:'Prix au gramme retenu',base:'Prix de référence au gramme',manual:'Saisie manuelle',market:'Prix indicatif',weight:'Poids',grams:'g',metal:'Valeur de l’or',fees:'Total de la façon',tax:'Taxe saisie',total:'Total estimé',words:'Montant en lettres',footer:'Calculé avec Dhahabk',disclaimer:'Prix indicatif susceptible de varier en boutique.',date:'Date du calcul',only:'carats'},
} as const;
const langLocale={ar:'ar-SA',en:'en-US',fr:'fr-FR'};
function fmt(n:number,lang:QuoteLanguage):string {
 return new Intl.NumberFormat(langLocale[lang],{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
}
function amount(n:number,quote:ShareQuote):string {return fmt(n,quote.language)+' '+quote.currency;}
function labels(quote:ShareQuote):Array<[string,string]> {
 const t=text[quote.language];
 return [
  [t.purity,quote.language==='ar'?'عيار '+quote.karat:quote.karat+' '+t.only],
  [t.unit,amount(quote.unitPrice,quote)],
  [t.base,quote.basePrice===null?'—':amount(quote.basePrice,quote)],
  [t.weight,fmt(quote.weight,quote.language)+' '+t.grams],
  [t.metal,amount(quote.raw,quote)],
  [t.fees,amount(quote.fees,quote)],
  [t.tax,amount(quote.tax,quote)],
 ];
}
export function quoteShareText(quote:ShareQuote):string {
 const t=text[quote.language];
 const date=new Date(quote.generatedAt).toLocaleDateString(langLocale[quote.language]);
 const rows=labels(quote).map(([key,value])=>key+': '+value);
 const source=' ('+(quote.priceSource==='manual'?t.manual:t.market)+')';
 rows[1]+=source;
 return [
  t.brand+' — '+t.title, t.subtitle, t.date+': '+date,
  '--------------------------------', ...rows, '--------------------------------',
  t.total+': '+amount(quote.total,quote),
  t.words+': '+quote.words,
  '--------------------------------',t.footer,site
 ].join('\n');
}
// QR code for the constant URL https://app.dhahabk.com, error correction M, including four quiet-zone modules.
// Each row is a 33-bit hexadecimal bitset. Encoded offline so generating the image requires no third-party service.
const qrRows=[
 '000000000','000000000','000000000','000000000','01fcec7f0',
 '010549410','0175625d0','0175b95d0','0174a95d0','0104f8410',
 '01fd557f0','000104000','0105d8ce0','01591ebe0','015d7f6b0',
 '0118f0490','00adb3610','019103a20','01573a7b0','0120a16d0',
 '011cadf40','000119100','01fc61510','010457120','01745ff70',
 '01748d430','0174f40d0','010425b10','01fd5d890','000000000',
 '000000000','000000000','000000000'
];
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string|CanvasGradient,stroke?:string){
 ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
 ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
 ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
 ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function write(ctx:CanvasRenderingContext2D,s:string,x:number,y:number,size:number,color:string,weight=600,align:CanvasTextAlign='right',limit=860) {
 ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';
 let fontSize=size;
 do {ctx.font=weight+' '+fontSize+'px Tahoma, Arial, sans-serif'; if(ctx.measureText(s).width<=limit||fontSize<=19)break;fontSize-=2;}while(fontSize>19);
 ctx.fillText(s,x,y);
}
function wrap(ctx:CanvasRenderingContext2D,s:string,maxWidth:number,size:number):string[] {
 ctx.font='600 '+size+'px Tahoma, Arial, sans-serif';
 const words=s.split(/\s+/), lines:string[]=[];let line='';
 for(const word of words){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word;}else line=next;}
 if(line)lines.push(line);
 return lines;
}
function drawQr(ctx:CanvasRenderingContext2D,x:number,y:number,side:number){
 rounded(ctx,x-6,y-6,side+12,side+12,10,'#FFFFFF','#D4AF37');
 const cell=side/33;ctx.fillStyle='#061B32';
 for(let row=0;row<33;row++){
  const packed=parseInt(qrRows[row],16);
  for(let col=0;col<33;col++)if(Math.floor(packed/Math.pow(2,32-col))%2===1)
   ctx.fillRect(Math.round(x+col*cell),Math.round(y+row*cell),
    Math.ceil(cell+0.2),Math.ceil(cell+0.2));
 }
}
/** Pure bitmap rendering from the same snapshot the app uses for text and totals. */
export async function quoteShareBlob(quote:ShareQuote,format:ShareFormat):Promise<Blob>{
 if(!Number.isFinite(quote.total)||quote.total<0)throw new Error('Invalid quote');
 if(typeof document==='undefined')throw new Error('Browser required');
 const story=format==='story',w=1080,h=story?1920:1350;
 if('fonts' in document)await document.fonts.ready;
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unsupported');
 const t=text[quote.language],rtl=quote.language==='ar';
 const navy='#061B32',navyDeep='#031322',gold='#C5A021',lightGold='#E8C864',ink='#112A44';
 const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,navy);bg.addColorStop(1,navyDeep);
 ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 rounded(ctx,30,30,w-60,h-60,34,'#071E36','#C5A021');
 ctx.beginPath();ctx.arc(w/2,story?155:100,63,0,Math.PI*2);ctx.fillStyle='#D5AD37';ctx.fill();ctx.strokeStyle='#F6E6A0';ctx.stroke();
 write(ctx,rtl?'ذ':'D',w/2,story?150:98,74,navyDeep,800,'center',140);
 const positions=story?{brand:270,title:360,sub:422,card:495,head:542,start:625,row:83,total:1250,words:1420,footer:1620,disclaimer:1815}:{brand:185,title:253,sub:303,card:343,head:384,start:454,row:62,total:923,words:1050,footer:1184,disclaimer:1289};
 ctx.direction=rtl?'rtl':'ltr';
 write(ctx,t.brand,w/2,positions.brand,52,lightGold,800,'center');
 write(ctx,t.title,w/2,positions.title,53,'#FFFFFF',800,'center');
 write(ctx,t.subtitle,w/2,positions.sub,25,'#C2D0E3',500,'center');
 const rows=labels(quote);
 const cardEnd=positions.start+rows.length*positions.row+12;
 rounded(ctx,57,positions.card,966,cardEnd-positions.card+12,28,'#FAFAF8',gold);
 ctx.direction=rtl?'rtl':'ltr';
 write(ctx,t.date+': '+new Date(quote.generatedAt).toLocaleDateString(langLocale[quote.language]),965,positions.head,26,ink,600,rtl?'right':'right',880);
 rows.forEach(([label,value],i)=>{
  const y=positions.start+i*positions.row;
  if(i>0){ctx.strokeStyle='#E0E5E7';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(87,y-positions.row/2);ctx.lineTo(996,y-positions.row/2);ctx.stroke();}
  write(ctx,label,973,y,story?32:29,ink,i===4?700:600,'right',560);
  write(ctx,value,93,y,story?33:30,i===4?'#9A7217':ink,700,'left',380);
 });
 const totalHeight=story?140:112;
 const gradient=ctx.createLinearGradient(55,0,1025,0);gradient.addColorStop(0,'#C5A021');gradient.addColorStop(.6,'#F2D66F');gradient.addColorStop(1,'#CAA02B');
 rounded(ctx,57,positions.total,966,totalHeight,25,gradient);
 write(ctx,t.total,972,positions.total+totalHeight/2,40,navyDeep,800,'right',480);
 write(ctx,amount(quote.total,quote),92,positions.total+totalHeight/2,story?57:47,navyDeep,800,'left',540);
 const wordHeight=story?145:115;
 rounded(ctx,57,positions.words,966,wordHeight,22,'#FCF8EF');
 write(ctx,t.words,971,positions.words+30,26,'#8B681C',700,'right',860);
 const wrapSize=story?28:23,wordLines=wrap(ctx,quote.words,852,wrapSize).slice(0,3);
 wordLines.forEach((line,i)=>write(ctx,line,971,positions.words+70+i*31,wrapSize,ink,650,'right',852));
 const footerH=story?180:120;
 rounded(ctx,57,positions.footer,966,footerH,22,'#102D4B','#8C721C');
 const qrSize=story?147:91;
 drawQr(ctx,85,positions.footer+(footerH-qrSize)/2,qrSize);
 write(ctx,t.footer,975,positions.footer+(story?52:38),story?30:26,'#FFFFFF',700,'right',715);
 write(ctx,site,975,positions.footer+(story?111:84),story?35:28,lightGold,700,'right',700);
 write(ctx,t.disclaimer,w/2,positions.disclaimer,story?25:20,'#B8C9DA',500,'center',950);
 return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Unable to create PNG')),'image/png'));
}
export async function shareQuotePng(quote:ShareQuote,format:ShareFormat,download=false):Promise<'shared'|'downloaded'|'cancelled'> {
 const blob=await quoteShareBlob(quote,format),name='dhahabk-quote-'+format+'.png';
 const file=new File([blob],name,{type:'image/png'});
 if(!download&&typeof navigator!=='undefined'&&navigator.canShare?.({files:[file]})&&navigator.share){
  try{await navigator.share({files:[file],title:text[quote.language].title});return 'shared';}
  catch(error){if(error instanceof DOMException&&error.name==='AbortError')return 'cancelled';}
 }
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;link.style.display='none';document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 return 'downloaded';
}
