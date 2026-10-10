/** Normalize registration mobiles before client-side validation.
 * Saudi 05XXXXXXXX and 9665XXXXXXXX are canonicalized to +9665XXXXXXXX;
 * international E.164 numbers pass through without inventing ownership checks.
 */
export function normalizeRegistrationPhone(input:string):string|null{
 const compact=input.trim().replace(/[\s()\-]/g,'');
 // Also allow Arabic-Indic digits commonly entered with Arabic iOS keyboards.
 const western=compact.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x0660))
                      .replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x06F0));
 let e164=western;
 if(/^05\d{8}$/.test(western))e164='+966'+western.slice(1);
 else if(/^9665\d{8}$/.test(western))e164='+'+western;
 if(!/^\+[1-9]\d{7,14}$/.test(e164))return null;
 // Saudi mobiles must have the correct country code and mobile digits.
 if(e164.startsWith('+966')&&!/^\+9665\d{8}$/.test(e164))return null;
 return e164;
}
