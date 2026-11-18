/* Local UX acceptance checks; never runs against a hosted game. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://localhost:3000';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
const output = process.env.UX_EVIDENCE_DIR || '/tmp/neon-cipher-redesign';
fs.mkdirSync(output, { recursive: true });
const sizes = process.env.UX_VIEWPORTS ? process.env.UX_VIEWPORTS.split(',').map(s => s.split('x').map(Number)) : [[360,740],[390,844],[844,390],[1366,768],[1440,1000]];
const results = [];
async function hit(locator) {
  await locator.scrollIntoViewIfNeeded();
  assert(await locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return r.width >= 43 && r.height >= 43 && r.top >= 0 && r.bottom <= innerHeight + 1 && (el === top || el.contains(top));
  }), 'Control must be a visible 44px hit target');
}
(async () => {
 const browser = await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
 try { for (const [width,height] of sizes) {
  const context = await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  await context.addInitScript(() => localStorage.setItem('nc.onboarding.v1', JSON.stringify({state:{step:'done',skipped:true,callsign:'QA_DECKER',seen:{},crackedNodes:{}},version:0})));
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  const size = `${width}x${height}`;
  async function go(route) { await page.goto(base+route,{waitUntil:'domcontentloaded'}); }
  async function capture(name) {
   assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: document overflow`);
   await page.evaluate(() => document.fonts.ready.then(() => true));
   await page.screenshot({path:path.join(output,`${name}-${size}.png`)});
   results.push({size,screen:name,result:'passed'}); console.log('PASS',size,name);
  }
  await go('/map');
  const directory = page.getByTestId('target-directory'); await directory.waitFor();
  await page.getByTestId('nav-item-map').waitFor();
  await page.locator('[data-map-ready="true"]').waitFor();
  assert.equal(await page.getByRole('navigation',{name:'Main Navigation'}).locator('a').count(),5);
  await capture('city');
  await directory.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await page.getByText('Low Meridian',{exact:true}).click();
  await directory.selectOption('n1');
  await page.getByTestId('node-sheet').waitFor();
  await hit(page.getByTestId('jack-in-button'));
  assert(await page.getByTestId('jack-in-button').evaluate(el => {
    const swatch=document.createElement('span'); swatch.style.backgroundColor='var(--accent)'; el.parentElement.append(swatch);
    const expected=getComputedStyle(swatch).backgroundColor; swatch.remove();
    return getComputedStyle(el).backgroundColor===expected;
  }), 'Primary action must retain the accent fill defined by the paper tokens');
  assert.equal(await page.getByTestId('pending-quest-notification').count(),0);
  await capture('city-target');
  if(width>=1024) {
   const canvas = await page.getByTestId('city-map-canvas').boundingBox();
   const dossier = await page.getByRole('complementary',{name:'Target dossier'}).boundingBox();
   assert(canvas.width > 500 && dossier.x >= canvas.x + canvas.width - 1,'Desktop map must have separate canvas and dossier');
  }
  await go('/terminal/tutorial-soda');
  const header = page.getByTestId('terminal-header'); await header.waitFor();
  const help = page.getByRole('button',{name:'Open Clue Legend',exact:true});
  await hit(help); await hit(page.getByTestId('terminal-pause-button'));
  const title = await header.getByRole('heading').boundingBox();
  const pause = await page.getByTestId('terminal-pause-button').boundingBox();
  assert(title.y + title.height <= pause.y || title.x + title.width <= pause.x || pause.x + pause.width <= title.x,'Title overlaps controls');
  assert.equal(await page.getByRole('navigation',{name:'Main Navigation'}).count(),0);
  await capture('terminal');
  await help.click(); const legend=page.getByRole('dialog',{name:'Clue Legend',exact:true});
  await hit(legend.getByRole('button',{name:'GOT IT',exact:true})); await page.keyboard.press('Escape');
  await page.keyboard.press('1'); await page.keyboard.press('2'); await page.keyboard.press('3');
  await page.getByRole('group',{name:'Digit entry, 3 of 3 digits filled'}).waitFor();
  await hit(page.getByTestId('keypad-submit'));
  const response = page.waitForResponse(r => /\/api\/mock\/guess$/.test(r.url()) && r.request().method()==='POST');
  await page.keyboard.press('Enter'); const feedback=await (await response).json();
  assert.equal(typeof feedback.pans,'number'); assert.equal(typeof feedback.pots,'number');
  if(feedback.status!=='won') await page.getByRole('group',{name:'Digit entry, 0 of 3 digits filled'}).waitFor();
  await capture('terminal-probe');
  await go('/duel'); await page.getByTestId('tab-1v1-duel').click();
  await page.getByRole('heading',{name:'DUEL PROGRESSION LOCKED'}).waitFor();
  assert.match(await page.locator('body').innerText(),/Human matchmaking.*unavailable/i);
  await capture('battle-locked');
  await go('/comms?chapter=chapter-3');
  const accept=page.getByRole('button',{name:/accept assignment/i}); await accept.waitFor();
  assert(await accept.isDisabled(),'Deep link must preserve chapter gate'); await capture('mission-requirement');
  await go('/comms'); await page.getByTestId('chapter-card-chapter-1').click();
  await page.getByRole('button',{name:/accept assignment/i}).waitFor(); await capture('mission-briefing');
  await go('/coop'); const start=page.getByTestId('jack-in-heist-button'); await start.waitFor();
  assert.match(await page.locator('body').innerText(),/Practice with Nix \(AI\)/); await capture('coop-preflight');
  await start.click(); await page.getByTestId('stage1-submit-button').waitFor();
  await hit(page.getByTestId('stage1-submit-button')); await capture('coop-console');
  await page.getByTestId('stage1-guess-input').fill('123'); await page.getByTestId('stage1-submit-button').click();
  if(width<1024) await page.getByRole('button',{name:'Partner & clues',exact:true}).click();
  await page.getByRole('region',{name:'Actual probe results'}).waitFor();
  await page.getByRole('region',{name:'Actual probe results'}).getByText('123',{exact:false}).waitFor();
  await capture('coop-probe');
  await page.getByRole('button',{name:'Leave practice',exact:true}).click();
  const leave=page.getByRole('dialog',{name:/leave/i}); await leave.waitFor();
  await leave.getByRole('button',{name:/keep playing|stay|cancel/i}).click();
  assert.equal(await page.getByRole('dialog').count(),0);
  await go('/rig'); await page.getByRole('button',{name:/manage intrusion loadout/i}).waitFor(); await capture('rig');
  await go('/market?unlocked=true&view=shop'); const buy=page.getByRole('button',{name:/^buy$/i}).first(); await buy.waitFor();
  await capture('market');
  let purchases=0; const watch=req=>{if(/wallet\/purchase/.test(req.url())) purchases++;}; page.on('request',watch);
  await buy.click(); const purchase=page.getByRole('dialog',{name:'Confirm Transaction'}); await purchase.waitFor();
  await hit(purchase.getByRole('button',{name:/^cancel$/i})); await capture('purchase');
  await purchase.getByRole('button',{name:/^cancel$/i}).click(); assert.equal(purchases,0); page.off('request',watch);
  await page.getByRole('button',{name:'Open decker profile',exact:true}).click();
  await page.locator('#profile-section').waitFor({state:'attached'});
  assert.equal(await page.getByRole('navigation',{name:'Main Navigation'}).locator('[aria-current]').count(),0);
  await page.getByRole('heading',{name:'QA_DECKER',exact:true}).waitFor();
  await capture('profile');
  async function section(value,name) {
   if(width<1024) await page.locator('#profile-section').selectOption(value);
   else await page.getByRole('navigation',{name:'Profile sections'}).getByRole('button',{name:new RegExp(name,'i')}).click();
  }
  await section('skills','skills'); await capture('profile-skills');
  await section('daily','daily'); assert.match(await page.locator('body').innerText(),/simulation/i); await capture('daily-preview');
  await section('extras','archive'); assert.match(await page.locator('body').innerText(),/sample/i); await capture('archive-preview');
  await page.getByRole('button',{name:'Open settings',exact:true}).click();
  const settings=page.getByRole('dialog',{name:'Settings configuration'}); await settings.waitFor();
  await settings.getByRole('button',{name:/shape.only/i}).click();
  assert.equal(await settings.locator('[data-clue-mode="shape-only"]').count(),1);
  await capture('settings'); await page.keyboard.press('Escape');
  await page.getByRole('link',{name:'Back to previous screen'}).click(); await page.waitForURL('**/market');
  await context.close();
 }} finally {fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2)); await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
