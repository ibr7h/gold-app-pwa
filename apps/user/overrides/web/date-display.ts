/** Display-only calendar preference for Dhahabi User.
 * ISO timestamps and purchase dates remain Gregorian in API/database.
 */
export type DisplayCalendar='gregorian'|'hijri';
export const DISPLAY_CALENDAR_KEY='dhahabi:user:display-calendar';

export function readDisplayCalendar():DisplayCalendar{
 try{
  return typeof window!=='undefined'&&window.localStorage.getItem(DISPLAY_CALENDAR_KEY)==='hijri'?'hijri':'gregorian';
 }catch{return 'gregorian';}
}
export function saveDisplayCalendar(calendar:DisplayCalendar):void{
 if(calendar!=='gregorian'&&calendar!=='hijri')return;
 try{if(typeof window!=='undefined')window.localStorage.setItem(DISPLAY_CALENDAR_KEY,calendar);}
 catch{/* Private browsing may disable persistent storage. */}
}
export function calendarLocale(locale:string,calendar:DisplayCalendar):string{
 const base=locale.replace(/-u-.*/i,'');
 return base+'-u-ca-'+(calendar==='hijri'?'islamic-umalqura':'gregory');
}
export function formatDisplayDate(value:string|number|Date,locale:string,calendar:DisplayCalendar,options:Intl.DateTimeFormatOptions={}):string{
 const date=value instanceof Date?value:new Date(value);
 if(!Number.isFinite(date.getTime()))return '—';
 const config:Intl.DateTimeFormatOptions={timeZone:'Asia/Riyadh',...options};
 try{return new Intl.DateTimeFormat(calendarLocale(locale,calendar),config).format(date);}
 catch{return new Intl.DateTimeFormat('en-US-u-ca-gregory',config).format(date);}
}
