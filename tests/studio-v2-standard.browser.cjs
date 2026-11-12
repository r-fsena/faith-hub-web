const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { spawn } = require('child_process'), puppeteer = require('puppeteer-core');
const root = path.resolve(__dirname, '..'), port = 5241, origin = `http://127.0.0.1:${port}`, api = 'https://studio-standard-api.example.test', prefix = '.studio-standard-test', out = process.env.STUDIO_V2_SCREENSHOTS || '/tmp/faith-studio-v2-20261110';
const files = ['html', 'tsx', 'auth.ts', 'config.mjs'].map(ext => path.join(root, `${prefix}.${ext}`));
let browser, server, page; const errors = [], results = [], delay = ms => new Promise(r => setTimeout(r, ms));
async function respond(req, data) { return req.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(data) }); }
(async () => {
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(files[0], `<html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><div id="root"></div><script type="module" src="/${prefix}.tsx"></script></body></html>`);
  fs.writeFileSync(files[1], "import React from 'react';import{createRoot}from'react-dom/client';import App from './src/App';createRoot(document.getElementById('root')!).render(<App/>);");
  fs.writeFileSync(files[2], `export async function getCurrentUser(){return{username:'test-user',signInDetails:{loginId:'fixture@example.test'}}}export async function fetchUserAttributes(){return{email:'fixture@example.test'}}export async function fetchAuthSession(){return{tokens:{idToken:{toString:()=> 'isolated-test'}}}}export async function signOut(){}export async function signIn(){return{}}export async function signInWithRedirect(){}export async function confirmSignIn(){return{}}`);
  fs.writeFileSync(files[3], `import{defineConfig}from'vite';import react from'@vitejs/plugin-react';export default defineConfig({plugins:[react()],server:{hmr:false,watch:null},resolve:{alias:{'aws-amplify/auth':${JSON.stringify(files[2])}}}});`);
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort', '--config', files[3]], { cwd: root, env: { ...process.env, VITE_API_URL: api }, stdio: 'ignore' });
  for (let i = 0; i < 100; i++) { try { if ((await fetch(origin)).ok) break; } catch {} await delay(100); }
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, pipe: true, timeout: 60000 });
  const cases = [
    { role: 'ADMIN', org: 'org-alpha', query: '?studio=v1&tab=people_workspace&campanha=preservada', tab: 'people_workspace', flag: false },
    { role: 'PASTOR', org: 'org-beta', query: '?studio=v2&tab=people_workspace', tab: 'people_workspace', flag: true, mobile: true },
    { role: 'LEADER', org: 'org-gamma', query: '?studio=v1', tab: 'membros', savedTab: 'membros', flag: false },
    { role: 'TREASURER', org: 'org-delta', query: '?studio=v1&tab=finance_workspace', tab: 'finance_workspace', flag: false, mobile: true },
    { role: 'SUPERADMIN', org: 'org-master-test', query: '?studio=v1&tab=dashboard', tab: 'dashboard', flag: false },
    { role: 'MEMBER', org: 'org-members', query: '?studio=v1', tab: 'dashboard', flag: false, mobile: true },
    { role: 'VOLUNTEER', org: 'org-volunteers', query: '?studio=v2', tab: 'dashboard', flag: false },
    { role: 'ADMIN', org: 'org-new', query: '?tab=people_workspace', tab: 'people_workspace', missingFlag: true }
  ];
  for (const scenario of cases) {
    const context = await browser.createBrowserContext(); page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
    await page.setViewport({ width: scenario.mobile ? 390 : 1440, height: 1000 });
    await page.evaluateOnNewDocument(s => { localStorage.setItem('faithhub_studio_version', 'v1'); localStorage.setItem('faithhub_studio_last_tab', s.savedTab || 'dashboard'); localStorage.setItem('faithhub_active_org', JSON.stringify({ id: s.org, name: 'Igreja de teste', slug: 'teste', status: 'ACTIVE', plan: 'GESTAO' })); }, scenario);
    await page.setRequestInterception(true); page.on('request', req => {
      const url = new URL(req.url()); if (url.origin === origin || url.protocol === 'data:') return req.continue(); if (url.origin !== api) return req.abort();
      if (req.method() === 'OPTIONS') return respond(req, {});
      let data = { data: [] };
      if (url.pathname === '/members/me') data = { data: { id: 'test-user', name: 'Pessoa de teste', email: 'fixture@example.test', role: scenario.role, organization_id: scenario.org } };
      else if (url.pathname === `/organizations/${scenario.org}`) data = { id: scenario.org, name: 'Igreja de teste', slug: 'teste', status: 'ACTIVE', plan: 'GESTAO', primary_color: '#0f766e' };
      else if (url.pathname === '/feature-flags') data = { flags: { ...(!scenario.missingFlag && { 'studio.context_navigation_v2': scenario.flag }), 'members.module_enabled': true, 'visitors.module_enabled': true, 'financial.module_enabled': true, 'financial.cashflow_ledger': true, 'kids.module_enabled': false, 'secretariat.module_enabled': false, 'intelligence.overview': false, 'pastoral.module_enabled': false, 'cell_groups.module_enabled': false, 'prayers.module_enabled': false, 'events.module_enabled': false, 'pdv.module_enabled': false, 'ministries.module_enabled': false, 'volunteers.module_enabled': false, 'broadcasts.module_enabled': false, 'studies.module_enabled': false, 'devotionals.module_enabled': false, 'bible.module_enabled': false, 'studio.guided_onboarding': false, 'studio.global_search': false, 'studio.personalized_navigation': false }, configs: { 'studio.context_navigation_v2': { default_version: 'v1' } } };
      else if (['/cell-groups', '/pdv/orders'].includes(url.pathname)) data = [];
      else if (url.pathname === '/broadcasts/active') data = null;
      return respond(req, data);
    });
    await page.goto(origin + '/' + path.basename(files[0]) + scenario.query);
    await page.waitForSelector('[data-studio-version="v2"]');
    await page.waitForFunction(() => !new URL(location.href).searchParams.has('studio'));
    assert.equal(new URL(page.url()).searchParams.get('tab'), scenario.tab);
    assert.equal(await page.$('.studio-v2-pilot,.studio-v2-status'), null);
    assert(!(await page.$eval('body', e => e.innerText)).includes('Usar versão atual'));
    if (scenario.tab === 'people_workspace' || scenario.tab === 'membros') {
      await page.waitForSelector('.studio-v2-context');
      const tabs = await page.$$eval('#studio-v2-section-select option', els => els.map(e => e.value));
      assert.deepEqual(tabs, ['people_workspace', 'membros', 'visitantes']);
    }
    if (['MEMBER', 'VOLUNTEER', 'LEADER', 'TREASURER'].includes(scenario.role)) assert(!(await page.$eval('aside', e => e.innerText)).includes('Administração'));
    assert(!(await page.$eval('aside', e => e.innerText)).includes('Ministério Infantil'));
    if (scenario.org === 'org-alpha') {
      assert.equal(new URL(page.url()).searchParams.get('campanha'), 'preservada');
      // Navigate through the real select control and browser history.
      await page.select('#studio-v2-section-select', 'membros');
      await page.waitForFunction(() => new URL(location.href).searchParams.get('tab') === 'membros');
      await page.click('.studio-v2-back');
      await page.waitForFunction(() => new URL(location.href).searchParams.get('tab') === 'people_workspace');
      await page.goBack(); await page.waitForFunction(() => document.querySelector('#studio-v2-section-select')?.value === 'membros');
      await page.goForward(); await page.waitForFunction(() => document.querySelector('#studio-v2-section-select')?.value === 'people_workspace');
      await page.evaluate(() => { const url = new URL(location.href); url.searchParams.set('studio', 'v1'); url.searchParams.set('tab', 'membros'); history.pushState({ studioVersion: 'v1' }, '', url); dispatchEvent(new PopStateEvent('popstate')); });
      await page.waitForFunction(() => !new URL(location.href).searchParams.has('studio') && document.querySelector('#studio-v2-section-select')?.value === 'membros');
      await page.reload(); await page.waitForSelector('[data-studio-version="v2"]'); await page.waitForSelector('.studio-v2-context');
      await delay(400); await page.screenshot({ path: path.join(out, 'standard-desktop.png') });
    }
    if (scenario.role === 'PASTOR') await delay(400);
    if (scenario.role === 'PASTOR') await page.screenshot({ path: path.join(out, 'standard-mobile.png') });
    results.push({ ...scenario, version: 'v2', legacySelectorRemoved: true, noPilotSwitch: true, permissionsPreserved: true });
    console.log('PASS Studio standard', scenario.role, scenario.org); await context.close(); page = null;
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify({ cases: results, browserHistoryAndReload: true, legacyPreferenceIgnored: true, moduleAndRoleGatesPreserved: true, realMemberWrites: 0, errors }, null, 2));
})().catch(async e => { console.error(e); console.error(errors); if (page) console.error((await page.$eval('body', e => e.innerText).catch(() => '')).slice(-1600)); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (server) server.kill(); for (const f of files) fs.rmSync(f, { force: true }); });
