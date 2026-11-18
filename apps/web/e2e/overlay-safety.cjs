/* Run against local mock API only. See docs/UX_PR1.md for setup. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const baseURL = process.env.BASE_URL || 'http://localhost:3000';
assert(['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Use a local mock server, never production.');
const output = process.env.OVERLAY_EVIDENCE_DIR || '/tmp/neon-cipher-overlay-evidence';
fs.mkdirSync(output, { recursive: true });
const viewports = process.env.OVERLAY_VIEWPORTS
  ? process.env.OVERLAY_VIEWPORTS.split(',').map((size) => { const [width, height] = size.split('x').map(Number); return { width, height }; })
  : [
  { width: 360, height: 740 }, { width: 390, height: 844 },
  { width: 844, height: 390 }, { width: 1366, height: 768 },
  { width: 1440, height: 1000 },
];

async function assertHitTarget(locator) {
  await locator.scrollIntoViewIfNeeded();
  assert(await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth && (el === hit || el.contains(hit));
  }), 'Action must be inside the viewport and win real hit testing.');
}
async function assertModalOwnership(page, name) {
  const dialog = page.getByRole('dialog', { name, exact: true });
  await dialog.waitFor();
  assert(await dialog.evaluate((el) => el.matches(':modal')), 'Must own the native top layer.');
  assert.equal(await page.getByTestId('pending-quest-notification').count(), 0);
  const ownsFocus = () => dialog.evaluate((el) => el.contains(document.activeElement) || document.activeElement === document.body);
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); assert(await ownsFocus(), 'Tab escaped into background content.'); }
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Shift+Tab'); assert(await ownsFocus(), 'Reverse Tab escaped into background content.'); }
  const navLink = page.locator('nav a').first();
  if (await navLink.count()) {
    await navLink.evaluate((el) => el.focus());
    assert(await ownsFocus(), 'Background navigation accepted focus while modal.');
  }
  return dialog;
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const results = [];
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, reducedMotion: process.env.REDUCED_MOTION || 'reduce' });
      await context.addInitScript(() => localStorage.setItem('nc.onboarding.v1', JSON.stringify({ state: { step: 'done', skipped: true, callsign: 'QA_DECKER', seen: {}, crackedNodes: {} }, version: 0 })));
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      const size = `${viewport.width}x${viewport.height}`;
      const purchaseRequests = [];
      page.on('request', (request) => { if (/wallet\/purchase/.test(request.url())) purchaseRequests.push(request.url()); });
      for (const flow of ['legend', 'purchase', 'loadout', 'briefing', 'market-loadout', 'settings', 'coop']) {
        const routes = { legend: '/terminal/tutorial-soda', purchase: '/market?unlocked=true&view=shop', loadout: '/rig', briefing: '/comms', 'market-loadout': '/market?unlocked=true&view=shop', settings: '/map', coop: '/comms' };
        await page.goto(baseURL + routes[flow], { waitUntil: 'domcontentloaded' });
        if (flow !== 'legend') await page.getByTestId('nav-item-comms').waitFor();
        if (flow === 'legend') {
          const trigger = page.getByRole('button', { name: 'Open Clue Legend', exact: true });
          await trigger.click();
          const dialog = await assertModalOwnership(page, 'Clue Legend');
          const done = dialog.getByRole('button', { name: /^got it$/i });
          await assertHitTarget(done);
          await page.screenshot({ path: path.join(output, `after-${flow}-${size}.png`) });
          await page.setViewportSize({ width: 844, height: 390 });
          await assertHitTarget(done);
          await page.setViewportSize(viewport);
          await done.click();
          assert(await trigger.evaluate((el) => document.activeElement === el), 'Legend did not restore focus.');
          await trigger.click(); await page.keyboard.press('Escape');
          await page.waitForFunction(() => document.querySelectorAll('dialog[open]').length === 0);
          assert.equal(await page.getByRole('dialog').count(), 0);
        } else if (flow === 'purchase') {
          const trigger = page.getByRole('button', { name: /^buy$/i }).first();
          await trigger.click();
          const dialog = await assertModalOwnership(page, 'Confirm Transaction');
          const cancel = dialog.getByRole('button', { name: /^cancel$/i });
          const confirm = dialog.getByRole('button', { name: /^confirm purchase$/i });
          await assertHitTarget(cancel); await assertHitTarget(confirm);
          await page.screenshot({ path: path.join(output, `after-${flow}-${size}.png`) });
          await cancel.click();
          assert(await trigger.evaluate((el) => document.activeElement === el), 'Purchase cancel did not restore focus.');
          assert.equal(purchaseRequests.length, 0, 'Cancel must never call purchase API.');
          await trigger.click(); await page.keyboard.press('Escape');
          await page.waitForFunction(() => document.querySelectorAll('dialog[open]').length === 0);
          assert.equal(await page.getByRole('dialog').count(), 0);
        } else if (flow === 'loadout' || flow === 'market-loadout') {
          const trigger = flow === 'loadout' ? page.getByRole('button', { name: /manage intrusion loadout/i }) : page.getByRole('button', { name: 'Manage equipped breach tools', exact: true });
          await trigger.click();
          const dialog = await assertModalOwnership(page, flow === 'loadout' ? 'LOADOUT SELECTOR' : 'Equip Breach Tools');
          const done = dialog.getByRole('button', { name: flow === 'loadout' ? /^confirm loadout$/i : /^done$/i });
          await assertHitTarget(done);
          await page.screenshot({ path: path.join(output, `after-${flow}-${size}.png`) });
          await done.click();
          assert(await trigger.evaluate((el) => document.activeElement === el), 'Loadout did not restore focus.');
        } else if (flow === 'briefing') {
          await page.getByTestId('chapter-card-chapter-1').click();
          assert.equal(await page.getByTestId('pending-quest-notification').count(), 0);
          const accept = page.getByRole('button', { name: /^accept assignment$/i });
          await assertHitTarget(accept);
          await page.screenshot({ path: path.join(output, `after-${flow}-${size}.png`) });
          await accept.click();
          await page.waitForURL('**/map');
        } else if (flow === 'settings') {
          await page.getByRole('button', { name: 'Open settings', exact: true }).click();
          const settings = await assertModalOwnership(page, 'Settings configuration');
          await settings.getByRole('button', { name: /reset campaign progress/i }).click();
          const reset = await assertModalOwnership(page, 'RESET CAMPAIGN?');
          await assertHitTarget(reset.getByRole('button', { name: /^cancel$/i }));
          await page.screenshot({ path: path.join(output, `after-${flow}-${size}.png`) });
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => document.querySelectorAll('dialog[open]').length === 1);
          assert.equal(await page.getByRole('dialog').count(), 1, 'Escape closed both nested and parent dialogs.');
          await assertHitTarget(settings.getByRole('button', { name: 'Close settings', exact: true }));
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => document.querySelectorAll('dialog[open]').length === 0);
          assert.equal(await page.getByRole('dialog').count(), 0);
        } else {
          await page.getByTestId('tab-coop').click();
          await page.getByTestId('jack-in-heist-button').waitFor();
          assert.equal(await page.getByTestId('pending-quest-notification').count(), 0, 'Co-op must exclude unrelated reminders.');
          await page.getByTestId('jack-in-heist-button').click();
          await page.getByTestId('stage1-submit-button').waitFor();
          assert.equal(await page.getByTestId('pending-quest-notification').count(), 0);
          await page.getByRole('button', { name: 'Leave practice', exact: true }).click();
          const leave = page.getByRole('dialog', { name: /leave/i });
          await leave.getByRole('button', { name: /leave practice/i }).click();
          await page.getByTestId('tab-campaign').waitFor();
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Unintended document horizontal scrolling.');
        results.push({ viewport: size, flow, result: 'passed' });
        console.log('PASS', size, flow);
      }
      await context.close();
    }
  } finally {
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
