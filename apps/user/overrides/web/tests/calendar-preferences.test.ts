import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {DISPLAY_CALENDAR_KEY,calendarLocale,formatDisplayDate,readDisplayCalendar,saveDisplayCalendar} from '../date-display';
import {translateUiText} from '../i18n-messages';
const src=(path:string)=>readFileSync(fileURLToPath(new URL(path,import.meta.url).href),'utf8');

describe('User iPhone price copy and saved calendar preferences',()=>{
 it('is display-only with Gregorian default and support for Umm al-Qura Hijri',()=>{
  expect(DISPLAY_CALENDAR_KEY).toBe('dhahabi:user:display-calendar');
  expect(readDisplayCalendar()).toBe('gregorian');
  expect(calendarLocale('ar-SA','gregorian')).toBe('ar-SA-u-ca-gregory');
  expect(calendarLocale('ar-SA','hijri')).toBe('ar-SA-u-ca-islamic-umalqura');
  expect(calendarLocale('en-US','hijri')).toBe('en-US-u-ca-islamic-umalqura');
  expect(calendarLocale('fr-FR','gregorian')).toBe('fr-FR-u-ca-gregory');
  expect(()=>saveDisplayCalendar('hijri')).not.toThrow();
 });
 it('formats date in two calendars without changing stored ISO timestamps',()=>{
  const iso='2026-10-12T12:00:00Z';
  const greg=formatDisplayDate(iso,'ar-SA','gregorian',{year:'numeric',month:'long',day:'numeric'});
  const hijri=formatDisplayDate(iso,'ar-SA','hijri',{year:'numeric',month:'long',day:'numeric'});
  expect(greg).not.toBe(hijri);
  expect(greg.length).toBeGreaterThan(5);
  expect(hijri.length).toBeGreaterThan(5);
  expect(iso).toBe('2026-10-12T12:00:00Z');
  expect(formatDisplayDate('invalid','ar-SA','hijri')).toBe('—');
 });
 it('removes technical market-status and currency notes and replaces chart footer',()=>{
  const ws=src('../UserWorkspace.tsx'),chart=src('../PriceHistoryChart.tsx');
  expect(ws).not.toContain("!stale?'سعر محدّث من الخادم'");
  expect(ws).toContain("!stale?tr('آخر سعر متاح'):marketLabel");
  expect(ws).not.toContain('<small>تُطبّق على الرئيسية والحاسبة');
  expect(ws).not.toContain('<small>تحويل المبالغ المسجلة استرشادي');
  expect(chart).not.toContain('dh-trend-footnote');
  expect(chart).not.toContain('تم ضغط فترات إغلاق السوق بصريًا؛');
  expect(chart).not.toContain('يعرض الرسم تغير الأسعار المسجلة خلال الفترة المختارة، دون إضافة أسعار تقديرية.');
  expect(chart).not.toContain('بحد أقصى 200 سجل من الخادم');
  expect(chart).not.toContain('الخط يربط تحديثات فعلية، والمسافات الأفقية');
 });
 it('lets users choose Hijri/Gregorian, persists locally and updates chart and dates',()=>{
  const ws=src('../UserWorkspace.tsx'),chart=src('../PriceHistoryChart.tsx');
  expect(ws).toContain('useState<DisplayCalendar>(readDisplayCalendar)');
  expect(ws).toContain('useEffect(()=>saveDisplayCalendar(calendar),[calendar])');
  expect(ws).toContain("onClick={()=>setCalendar('gregorian')}");
  expect(ws).toContain("onClick={()=>setCalendar('hijri')}");
  expect(ws).toContain('calendar={calendar} compact');
  expect(ws).toContain('calendar={calendar} range={chartRange}');
  expect(ws).toContain('formatDisplayDate(p.purchasedAt,activeLocale(),calendar');
  expect(ws).toContain('dateTime(row.timestamp,calendar)');
  expect(chart).toContain('formatDisplayDate(ms,activeLocale(),calendar');
  expect(src('../NotificationSettings.tsx')).toContain('readDisplayCalendar()');
  // The stored payload and ISO model dates must never use display calendar conversion.
  expect(src('../model.ts')).not.toContain('readDisplayCalendar');
 });
 it('translates all new labels into English and French',()=>{
  for(const phrase of ['آخر سعر متاح','التقويم','نوع التاريخ','ميلادي','هجري']){
   expect(translateUiText(phrase,'en'),phrase).not.toMatch(/[\u0600-\u06FF]/);
   expect(translateUiText(phrase,'fr'),phrase).not.toMatch(/[\u0600-\u06FF]/);
  }
 });
});
