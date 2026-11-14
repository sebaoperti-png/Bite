// Landing "House rules" (Safety): tap the glass, plate, cutlery and placemat to set the table; at 4/4 the cloche and the
// safety receipt appear. Checks five screen sizes (incl. a laptop with a browser side panel), no overflow, no errors.
// Run `npx vite preview --port 4173` first, or SITE=https://bitetable.de. LANG2=de for German.
const { chromium } = require('playwright');
(async()=>{ const b=await chromium.launch(); let fail=0;
// Phones (≤640px) get LandingMobile, where safety is a story card, so the interactive table is tested from 641px up.
for (const vp of (process.env.VPS||'1009x630,1440x900,1280x720,900x700').split(',')) { const [W,H]=vp.split('x').map(Number);
const ctx=await b.newContext({viewport:{width:W,height:H}}); await ctx.addInitScript(()=>{try{localStorage.setItem('bite_cookie_consent',JSON.stringify({necessary:true,functional:false,analytics:false,marketing:false,ts:Date.now()}));sessionStorage.setItem('bite_intro_seen','1');localStorage.setItem('bite_kitchen_note','2026-11-14');}catch(e){}});
const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto((process.env.SITE||'http://localhost:4173')+'/?lang='+(process.env.LANG2||'en'),{waitUntil:'networkidle'}); await p.waitForTimeout(800);
await p.locator('#safety .sh-title').scrollIntoViewIfNeeded(); await p.evaluate(()=>scrollBy(0,-80)); await p.waitForTimeout(900);
const over=await p.evaluate(()=>{ const r=[...document.querySelectorAll('#safety .sh-sticky > *')].map(e=>e.getBoundingClientRect()); return Math.max(...r.map(x=>x.right))-innerWidth; });
const secH = await p.evaluate(()=>document.querySelector('#safety').offsetHeight);
await p.screenshot({path:`/tmp/safety-${vp}-a.png`});
await p.locator('#safety .tb').scrollIntoViewIfNeeded(); await p.locator('.tb-hot').nth(2).click(); await p.waitForTimeout(700);
await p.locator('.tb-hot').nth(0).click(); await p.waitForTimeout(700);
await p.locator('.sh-right').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
await p.screenshot({path:`/tmp/safety-${vp}-b.png`});
const two = await p.locator('#safety').innerText();
await p.getByRole('button',{name:/Set the table for me|Deck den Tisch/}).count() || 0;
for (const i of [1,3]) { await p.locator('#safety .tb').scrollIntoViewIfNeeded(); await p.locator('.tb-hot').nth(i).click(); }
await p.waitForTimeout(3800);
await p.locator('#safety .tb').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
await p.screenshot({path:`/tmp/safety-${vp}-c.png`});
const sealed = await p.locator('.tb.sealed').count(), receipt=await p.locator('.sh-receipt').count();
const ok = over<=1 && sealed===1 && receipt===1 && errs.length===0 && /2 of 4|2 von 4/.test(two);
if(!ok) fail++;
console.log(vp, ok?'ok':'FAIL', 'overflow', Math.round(over), 'section h', secH, 'sealed', sealed, 'receipt', receipt, 'errs', errs);
await ctx.close(); }
await b.close(); process.exit(fail?1:0); })();
