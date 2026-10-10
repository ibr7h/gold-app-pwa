import {formatTwo} from './price-display';
import React,{useMemo,useState} from 'react';
import {Portfolio,Purchase,KARATS,CURRENCIES,localDate,purchaseQuote} from './model';

const decimal=(v:string|number|undefined|null)=>v===undefined||v===null?'':String(v);
const n=(v:string)=>v.trim()?Number(v):0;
const text=(v:unknown)=>typeof v==='string'?v:'';

export default function PurchaseFormFields({portfolios,purchase}:{portfolios:Portfolio[];purchase?:Purchase}){
 const details=purchase?.invoiceDetails||{};
 const [mode,setMode]=useState<'inclusive'|'itemized'>(details.pricingMode==='itemized'?'itemized':'inclusive');
 const [weight,setWeight]=useState(decimal(purchase?.weightGrams));
 const [invoiceTotal,setInvoiceTotal]=useState(decimal(purchase?.totalPrice));
 const [goldUnitPrice,setGoldUnitPrice]=useState(decimal(details.goldUnitPrice??(details.pricingMode==='itemized'?purchase?.unitPrice:undefined)));
 const [makingCharge,setMakingCharge]=useState(decimal(details.makingCharge??'0'));
 const [stonePrice,setStonePrice]=useState(decimal(details.stonePrice??'0'));
 const [vatMode,setVatMode]=useState<'rate'|'manual'>(details.vatAmount!==undefined&&details.vatRate===0&&details.vatAmount>0?'manual':'rate');
 const [vatRate,setVatRate]=useState(decimal(details.vatRate??'0'));
 const [vatAmount,setVatAmount]=useState(decimal(details.vatAmount??'0'));
 const [grossWeight,setGrossWeight]=useState(decimal(details.grossWeightGrams));
 const [stoneWeight,setStoneWeight]=useState(decimal(details.stoneWeightGrams));
 const quote=useMemo(()=>purchaseQuote({mode,weight:n(weight),invoiceTotal:n(invoiceTotal),goldUnitPrice:n(goldUnitPrice),
  makingCharge:n(makingCharge),stonePrice:n(stonePrice),vatRate:n(vatRate),vatAmount:n(vatAmount),manualVat:vatMode==='manual'}),
  [mode,weight,invoiceTotal,goldUnitPrice,makingCharge,stonePrice,vatRate,vatAmount,vatMode]);
 const stoneRatio=n(grossWeight)>0?(n(stoneWeight)/n(grossWeight))*100:0;
 const num=(value:number|null|undefined)=>value===null||value===undefined?'غير محدد':formatTwo(value);
 const [sellerName,setSellerName]=useState(text(details.sellerName));
 const [invoiceNumber,setInvoiceNumber]=useState(text(details.invoiceNumber));
 const [desc,setDesc]=useState(text(details.itemDescription));
 const missing=[!sellerName?'اسم المتجر':null,!invoiceNumber?'رقم الفاتورة':null,!desc?'وصف المشغول':null].filter(Boolean);
 return <div className="gold-purchase-form" dir="rtl">
  <label>المحفظة
   <select name="portfolioId" defaultValue={purchase?.portfolioId||portfolios[0]?.id} required>
    {portfolios.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
   </select>
  </label>
  <div className="form-grid">
   <label>العيار
    <select name="karat" defaultValue={purchase?.karat||21} required>
     {(KARATS.includes(purchase?.karat||0)?KARATS:[purchase?.karat||21,...KARATS]).filter((k,i,a)=>a.indexOf(k)===i).map(k=><option key={k} value={k}>عيار {k}</option>)}
    </select>
   </label>
   <label>العملة
    <select name="currency" defaultValue={purchase?.currency||'SAR'} required>
     {(CURRENCIES.includes(purchase?.currency||'')?CURRENCIES:[purchase?.currency||'SAR',...CURRENCIES]).filter((v,i,a)=>a.indexOf(v)===i).map(c=><option key={c} value={c}>{c}</option>)}
    </select>
   </label>
   <label>الوزن الصافي (جم)
    <input name="weightGrams" type="number" min="0.0001" max="99999999" step="any" inputMode="decimal" required value={weight} onChange={e=>setWeight(e.target.value)} placeholder="مثال: 5.250"/>
   </label>
   <label>التاريخ
    <input name="purchasedAt" type="date" required max={localDate()} defaultValue={purchase?.purchasedAt?.slice(0,10)||localDate()}/>
   </label>
  </div>
  <fieldset className="gold-purchase-fieldset">
   <legend>حساب السعر</legend>
   <div className="gold-purchase-mode">
    <label><input type="radio" name="pricingMode" checked={mode==='inclusive'} value="inclusive" onChange={()=>setMode('inclusive')}/> شامل التكاليف</label>
    <label><input type="radio" name="pricingMode" checked={mode==='itemized'} value="itemized" onChange={()=>setMode('itemized')}/> تفصيل السعر</label>
   </div>
   {mode==='inclusive'?<>
    <label>المبلغ المدفوع
     <input type="number" name="invoiceTotal" min="0.0001" step="any" inputMode="decimal" required value={invoiceTotal} onChange={e=>setInvoiceTotal(e.target.value)} placeholder="المبلغ النهائي المدفوع"/>
    </label>
    <p className="fine">سنسجل الإجمالي كما دفعته تمامًا، ونحسب التكلفة الفعلية لكل جرام. لا نضيف مصنعية أو ضريبة مرة أخرى.</p>
   </>:<>
    <div className="form-grid">
     <label>سعر الجرام
      <input name="goldUnitPrice" type="number" min="0.0001" step="any" inputMode="decimal" required value={goldUnitPrice} onChange={e=>setGoldUnitPrice(e.target.value)}/>
     </label>
     <label>المصنعية
      <input name="makingCharge" type="number" min="0" step="any" inputMode="decimal" value={makingCharge} onChange={e=>setMakingCharge(e.target.value)}/>
     </label>
     <label>قيمة الأحجار
      <input name="stonePrice" type="number" min="0" step="any" inputMode="decimal" value={stonePrice} onChange={e=>setStonePrice(e.target.value)}/>
     </label>
     <label>طريقة الضريبة
      <select name="vatMode" value={vatMode} onChange={e=>setVatMode(e.target.value as 'rate'|'manual')}>
       <option value="rate">بنسبة مئوية</option><option value="manual">إدخال مبلغ الضريبة يدويًا</option>
      </select>
     </label>
     {vatMode==='rate'?<label>نسبة الضريبة (%)
      <select name="vatRate" value={vatRate} onChange={e=>setVatRate(e.target.value)}>
       <option value="0">0% — لا تطبق/صفرية بحسب الفاتورة</option>
       <option value="15">15% — إذا كانت المعاملة خاضعة لها</option>
       {!['0','15'].includes(vatRate)&&<option value={vatRate}>{vatRate}%</option>}
      </select>
     </label>:<label>قيمة الضريبة
      <input name="vatAmount" type="number" min="0" step="any" inputMode="decimal" value={vatAmount} onChange={e=>setVatAmount(e.target.value)}/>
     </label>}
    </div>
    <p className="fine">تحقق من طريقة تطبيق الضريبة في فاتورتك. السلع الاستثمارية المؤهلة قد تختلف ضريبتها عن المشغولات؛ لا يفترض التطبيق نسبة موحدة.</p>
   </>}
   <div className="gold-purchase-estimate" aria-live="polite">
    <div><span>الإجمالي المسجل</span><strong>{quote?num(quote.total):'أدخل الوزن والسعر'}</strong></div>
    <div><span>تكلفة الجرام</span><strong>{quote?num(quote.effectiveUnitPrice):'غير متاح'}</strong></div>
    {mode==='itemized'&&quote&&<div className="gold-breakdown-note">قيمة الذهب: {num(quote.metalSubtotal)} · إضافات: {num(quote.fees)} · ضريبة: {num(quote.vat)}</div>}
   </div>
  </fieldset>
  <details className="gold-purchase-details" open={Boolean(purchase)}>
   <summary>بيانات الفاتورة <small>اختياري</small></summary>
   <div className="form-grid">
    <label>اسم المتجر
     <input name="sellerName" maxLength={150} value={sellerName} onChange={e=>setSellerName(e.target.value)} placeholder="الاسم التجاري"/>
    </label>
    <label>عنوان المحل
     <input name="sellerAddress" maxLength={250} defaultValue={text(details.sellerAddress)} placeholder="عنوان المتجر كما يظهر في الفاتورة"/>
    </label>
    <label>اسم المشتري
     <input name="buyerName" maxLength={120} defaultValue={text(details.buyerName)} placeholder="اسم المشتري إن وجد"/>
    </label>
    <label>رقم الفاتورة
     <input name="invoiceNumber" maxLength={120} value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)}/>
    </label>
    <label>السجل التجاري
     <input name="sellerCommercialRegistration" maxLength={60} defaultValue={text(details.sellerCommercialRegistration)}/>
    </label>
    <label>هاتف المتجر
     <input name="sellerPhone" type="tel" maxLength={40} defaultValue={text(details.sellerPhone)}/>
    </label>
    <label>حالة المشغول
     <select name="itemCondition" defaultValue={details.itemCondition||''}>
      <option value="">غير محدد</option><option value="new">جديد</option><option value="used">مستعمل</option>
     </select>
    </label>
    <label>الدمغة
     <input name="hallmark" maxLength={120} defaultValue={text(details.hallmark)} placeholder="الدمغة كما تظهر على القطعة"/>
    </label>
    <label>علامة الصانع
     <input name="manufacturerMark" maxLength={120} defaultValue={text(details.manufacturerMark)}/>
    </label>
    <label>وزن القطعة (جم)
     <input name="grossWeightGrams" type="number" min="0" step="any" inputMode="decimal" value={grossWeight} onChange={e=>setGrossWeight(e.target.value)}/>
    </label>
    <label>وزن الأحجار (جم)
     <input name="stoneWeightGrams" type="number" min="0" step="any" inputMode="decimal" value={stoneWeight} onChange={e=>setStoneWeight(e.target.value)}/>
    </label>
   </div>
   <label>وصف القطعة
    <textarea name="itemDescription" rows={2} maxLength={500} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="مثال: سوار ذهب عيار 21 ..."/>
   </label>
   {n(stoneWeight)>0&&<p className={stoneRatio>5?'gold-purchase-stone-warning':'fine'} role="status">
    وزن الأحجار {num(stoneRatio)}% من الوزن الإجمالي. {stoneRatio>5?'يتجاوز 5%؛ تأكد من بيان وزن المعدن الثمين والأحجار كلٍّ على حدة في الفاتورة.':'تحقق من فصل وزن الذهب الصافي عن الأحجار في بيانات الفاتورة.'}
   </p>}
   <details className="gold-stones-more">
    <summary>تفاصيل الأحجار</summary>
    <div className="form-grid">
     <label>اسم الحجر<input name="stoneName" maxLength={120} defaultValue={text(details.stoneName)}/></label>
     <label>نوع الحجر<input name="stoneKind" maxLength={100} defaultValue={text(details.stoneKind)}/></label>
     <label>لون الحجر<input name="stoneColor" maxLength={100} defaultValue={text(details.stoneColor)}/></label>
     <label>شكل الحجر<input name="stoneShape" maxLength={100} defaultValue={text(details.stoneShape)}/></label>
     <label>درجة النقاء/الجودة<input name="stoneQuality" maxLength={150} defaultValue={text(details.stoneQuality)}/></label>
     <label>نوع القطع/التشطيب<input name="stoneCut" maxLength={100} defaultValue={text(details.stoneCut)}/></label>
    </div>
    <label>العيوب إن وجدت<input name="stoneDefects" maxLength={300} defaultValue={text(details.stoneDefects)}/></label>
    <label>سلامة الحجر من الخدش أو الكسر<input name="stoneSafety" maxLength={300} defaultValue={text(details.stoneSafety)}/></label>
   </details>
   {missing.length>0&&<p className="gold-purchase-completeness">لإكمال توثيق الفاتورة يُستحسن إضافة: {missing.join('، ')}. هذه البيانات اختيارية لتسجيل مشترياتك السابقة.</p>}
   <p className="fine">هذه بيانات مرجعية أدخلتها أنت؛ لا تعني توثيق الفاتورة رسميًا. احتفظ بصورة الفاتورة الأصلية.</p>
  </details>
 </div>;
}
