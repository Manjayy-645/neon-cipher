/* 200% layout-equivalent reflow (720x500 CSS pixels at DPR2), not native tab zoom. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base=process.env.BASE_URL || 'http://localhost:3000';
assert(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const output=process.env.UX_EVIDENCE_DIR || '/tmp/neon-cipher-accessibility';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 let context, browser;
 try {
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  context=await browser.newContext({viewport:{width:720,height:500},deviceScaleFactor:2,reducedMotion:'reduce'});
  await context.addInitScript(()=>localStorage.setItem('nc.onboarding.v1',JSON.stringify({state:{step:'done',skipped:true,callsign:'QA_DECKER',seen:{},crackedNodes:{}},version:0})));
  const page=context.pages()[0] || await context.newPage();page.setDefaultTimeout(30000);
  await page.goto(base+'/terminal/tutorial-soda',{waitUntil:'domcontentloaded'});
  await page.getByTestId('terminal-header').waitFor();
  assert(await page.evaluate(()=>innerWidth===720 && devicePixelRatio===2 && matchMedia('(prefers-reduced-motion: reduce)').matches));
  const help=page.getByRole('button',{name:'Open Clue Legend',exact:true});
  await help.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Clue Legend',exact:true});await dialog.waitFor();
  const done=dialog.getByRole('button',{name:'GOT IT',exact:true});
  await done.scrollIntoViewIfNeeded();
  assert(await done.evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom<=innerHeight && r.top>=0;}));
  for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await dialog.evaluate(el=>el.matches(':modal') && (el.contains(document.activeElement) || document.activeElement===document.body)), 'No background control may gain focus; Chromium may focus the document between native wrap cycles');}
  await page.screenshot({path:path.join(output,'legend-200-percent.png')});
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  assert(await help.evaluate(el=>document.activeElement===el));
  await page.goto(base+'/map',{waitUntil:'domcontentloaded'});
  await page.getByTestId('nav-item-map').waitFor();
  const skip=page.getByRole('link',{name:'Skip to game content'});
  await skip.focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'game-content');
  await page.getByTestId('target-directory').selectOption('n1');
  const breach=page.getByTestId('jack-in-button');await breach.scrollIntoViewIfNeeded();
  assert(await breach.evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom<=innerHeight && r.top>=0;}));
  await page.screenshot({path:path.join(output,'city-target-200-percent.png')});
  await page.getByRole('button',{name:'Open settings',exact:true}).click();
  const settings=page.getByRole('dialog',{name:'Settings configuration'});
  await settings.getByRole('button',{name:/shape.only/i}).click();
  const preview=settings.getByTestId('settings-clue-preview');
  for(const shape of ['pan','pot','miss']) assert.equal(await preview.locator(`[data-clue="${shape}"]`).count(),1);
  assert(await preview.locator('[data-clue="pan"]').evaluate(el=>getComputedStyle(el).backgroundColor!=='rgba(0, 0, 0, 0)'));
  await page.screenshot({path:path.join(output,'settings-200-percent.png')});
  console.log('PASS 200% layout-equivalent reflow (720x500 CSS pixels, DPR2), reduced motion, native Tab/Escape/focus return, skip link, visible actions and shape-only clues');
 } finally {if(context) await context.close();if(browser) await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
