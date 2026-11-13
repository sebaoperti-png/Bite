// Landing "A note from the kitchen": appears after the cookie choice (never on top of it), fits the screen, "Got it" closes
// it for good. Run `npx vite preview --port 4173` first, or SITE=https://bitetable.de.
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); let fail=0;
for (const [vp,lang] of [['1440x900','en'],['1009x630','de'],['390x844','en'],['390x844','de']]) { const [W,H]=vp.split('x').map(Number);
const ctx=await b.newContext({viewport:{width:W,height:H}}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto(`${process.env.SITE||'http://localhost:4173'}/?lang=${lang}`,{waitUntil:'networkidle'});
await p.waitForTimeout(4500);
const noteBeforeCookie = await p.locator('.kn').count();
await p.getByRole('button',{name:/Reject non-essential|Nur notwendige/}).first().click().catch(()=>{});
await p.waitForTimeout(3500);
const shown = await p.locator('.kn').count();
const box = shown ? await p.locator('.kn').boundingBox() : null;
await p.screenshot({path:`/tmp/note-${vp}-${lang}.png`});
const inView = box && box.x>=0 && box.y>=0 && box.x+box.width<=W && box.y+box.height<=H;
await p.locator('.kn-ok').click().catch(()=>{}); await p.waitForTimeout(600);
const after = await p.locator('.kn').count();
await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(5000);
const again = await p.locator('.kn').count();
const ok = noteBeforeCookie===0 && shown===1 && inView && after===0 && again===0 && errs.length===0;
if(!ok) fail++;
console.log(vp, lang, ok?'ok':'FAIL', {noteBeforeCookie, shown, inView, after, again, errs});
await ctx.close(); }
await b.close(); process.exit(fail?1:0); })();
