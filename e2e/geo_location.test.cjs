// "Use my location" in the Where? picker: a real map with a you-are-here dot, the meals in the circle, clear words when
// nothing is near or the location is refused. Phone and desktop, English and German. Run `npx vite preview --port 4173` first
// (or SITE=https://bitetable.de).
const { chromium } = require('playwright');
const BASE = process.env.SITE || 'http://localhost:4173';
let pass=0, fail=0; const check=(c,m)=>{ if(c){pass++;console.log('ok  ',m)} else {fail++;console.log('FAIL',m)} };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  for (const [label, vp] of [["phone",{width:390,height:844}],["desktop",{width:1400,height:900}]])
  for (const [where, geo, grant] of [["Frankfurt",{latitude:50.1109,longitude:8.6821},true],["Aalen",{latitude:48.8376,longitude:10.093},true],["denied",null,false]])
  for (const lang of ["en","de"]) {
    if (lang==="de" && where!=="Frankfurt") continue;
    const ctx = await b.newContext({ viewport: vp, ...(geo?{geolocation:geo}:{}), permissions: grant?['geolocation']:[] });
    const p = await ctx.newPage(); const errs=[]; p.on('pageerror', e=>errs.push(e.message));
    await p.goto(BASE + `/bite.html?demo&lang=${lang}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
    if (label === 'phone') await p.locator('button', { hasText: lang==='de'?/Alle Städte/:/All cities/ }).first().click(); else await p.locator('.dh-resa-pick[data-pick=area]').click();
    await p.waitForTimeout(500);
    await p.locator('.lp-me').click(); await p.waitForTimeout(grant?1500:9500);
    const tag=`${label} ${where} ${lang}:`;
    if (!grant) {
      check(await p.locator('.lp-err').count()===1 && await p.locator('.lp-map').count()===0, `${tag} denied location shows a clear message, no map`);
    } else {
      await p.locator('.lp-map .mm canvas').waitFor({timeout:15000}).catch(()=>{});
      await p.waitForTimeout(4000);
      check(await p.locator('.lp-map .mm canvas').count()===1, `${tag} picker shows a real map`);
      const txt=(await p.locator('.lp-pick').innerText());
      check(txt.includes(lang==='de'?'In deiner Nähe':'Near you'), `${tag} says "Near you"`);
      const pins=await p.locator('.lp-map .mm-pin,.lp-map .mm-group').count(), empty=await p.locator('.lp-map .mm-empty').count();
      if (where==='Frankfurt') { await p.getByRole('radio',{name:'+50 km'}).click(); await p.waitForTimeout(2500); }
      const pins2=await p.locator('.lp-map .mm-pin,.lp-map .mm-group').count();
      check(where==='Aalen' ? (pins===0 && empty===1) : pins2>0, `${tag} pins ${pins}->${pins2}, empty note ${empty}`);
      const box = await p.locator('.lp-map').boundingBox();
      check(box && box.width>200 && box.height>=170, `${tag} map size ${box&&Math.round(box.width)}x${box&&Math.round(box.height)}`);
      const seen = await p.evaluate(() => { const r=document.querySelector('.lp-map').getBoundingClientRect(); const el=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return !!el && !!el.closest('.lp-map') && r.bottom <= innerHeight; });
      check(seen && await p.locator('.lp-map .mm-me').count()===1, `${tag} map is visible without scrolling, with a you-are-here dot`);
      await p.screenshot({ path: `/tmp/geo-${label}-${where}-${lang}.png` });
      await p.locator('.lp-done').click(); await p.waitForTimeout(400);
      const sum = await p.locator('body').innerText();
      check(sum.includes(lang==='de'?'In deiner Nähe ·':'Near you ·'), `${tag} search bar reads "Near you · +km"`);
    }
    check(errs.length===0, `${tag} no page errors ${errs.join('|')}`);
    await ctx.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
