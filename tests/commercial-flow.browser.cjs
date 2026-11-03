// Isolated browser regression: every external request is intercepted; no tenant or commercial data is written.
const { readFileSync, writeFileSync, rmSync, mkdirSync } = require('node:fs');
const { spawn } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.COMMERCIAL_TEST_PORT || 5179);
const origin = `http://127.0.0.1:${port}`;
const html = path.join(root, `.commercial-smoke-${port}.html`);
const entry = path.join(root, `.commercial-smoke-${port}.tsx`);
const output = process.env.COMMERCIAL_SCREENSHOTS || '/tmp/faith-hub-commercial';
const exportsModule = { exports: {} };
new Function('module', 'exports', ts.transpile(readFileSync(path.join(root, 'src/components/commercial/planPresentation.ts'), 'utf8'), { module: ts.ModuleKind.CommonJS }))(exportsModule, exportsModule.exports);
const { toggleEntitlement } = exportsModule.exports;
const sampleFlags = Object.fromEntries(['members.module_enabled','members.digital_card','cell_groups.module_enabled','cell_groups.attendance_reports','studies.module_enabled','bible.module_enabled','prayers.module_enabled','financial.module_enabled','financial.online_pix_giving','financial.cashflow_ledger','financial.dre_reports','financial.advanced_reports','visitors.module_enabled','pastoral.module_enabled','ministries.module_enabled','volunteers.module_enabled','kids.module_enabled','kids.secure_checkout_validation','secretariat.module_enabled','secretariat.documents','secretariat.document_pdf','secretariat.public_verification','secretariat.template_editor','events.module_enabled','pdv.module_enabled','system.multicampus_enabled','system.custom_theme_colors','system.plan_entitlements'].map(key => [key, true]));
assert.equal(toggleEntitlement(sampleFlags, 'ministries.module_enabled', false)['volunteers.module_enabled'], false);
assert.equal(toggleEntitlement({ ...sampleFlags, 'ministries.module_enabled': false }, 'volunteers.module_enabled', true)['ministries.module_enabled'], true);
assert.equal(toggleEntitlement(sampleFlags, 'secretariat.documents', false)['secretariat.document_pdf'], false);
assert.equal(toggleEntitlement(sampleFlags, 'financial.cashflow_ledger', false)['financial.dre_reports'], false);
assert.equal(toggleEntitlement(sampleFlags, 'financial.module_enabled', false)['financial.cashflow_ledger'], false);
assert.equal(sampleFlags['financial.cashflow_ledger'], true, 'toggling must not mutate the loaded catalogue');
let plans = ['Conectar', 'Cuidar', 'Gestão', 'Enterprise'].map((name, index) => ({
  id: ['CONECTAR','CUIDAR','GESTAO','ENTERPRISE_2026'][index], name,
  description: ['Sua comunidade conectada durante a semana.', 'Mais organização para cuidar de cada pessoa.', 'Sua igreja e suas unidades em uma gestão integrada.', 'Capacidade, unidades e serviços definidos em proposta.'][index],
  monthly_price: [99,249,399,null][index], yearly_price: null, max_members: [300,700,1500,null][index], max_campuses: [1,1,5,null][index],
  is_popular: index === 1, badge_text: index === 1 ? 'Recomendado' : null, requires_proposal: index === 3, status: 'ACTIVE',
  features: ['Aplicativo com identidade da igreja', 'Membros e comunidade', 'Módulos conforme o plano contratado'],
  entitlements: Object.fromEntries(Object.entries(sampleFlags).map(([key,value]) => [key, index >= 2 || (!key.startsWith('secretariat.') && !['financial.cashflow_ledger','financial.dre_reports','financial.advanced_reports','events.module_enabled','pdv.module_enabled','system.multicampus_enabled'].includes(key) && (index >= 1 || !['visitors.','pastoral.','ministries.','volunteers.','kids.'].some(prefix => key.startsWith(prefix)))) ? value : false]))
}));
let saved, proposal, failSave = false, browser, server, page;
const errors = [];
async function clickText(page, text, selector = 'button') {
  const handle = await page.waitForFunction((text, selector) => [...document.querySelectorAll(selector)].find(element => element.textContent.trim().replace(/\s+/g, ' ') === text), {}, text, selector);
  await handle.asElement().click(); await handle.dispose();
}
async function fill(page, label, value) {
  const handle = await page.waitForFunction(label => [...document.querySelectorAll('label')].find(element => element.querySelector('span')?.textContent === label)?.querySelector('input'), {}, label);
  await handle.asElement().click({ clickCount: 3 }); await page.keyboard.press('Backspace'); await handle.asElement().type(value); await handle.dispose();
}
async function shot(page, name) { await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: !await page.$('[role=dialog]') }); }
(async () => {
  mkdirSync(output, { recursive: true });
  writeFileSync(html, `<html lang="pt-BR"><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><div id="root"></div><script type="module" src="/.commercial-smoke-${port}.tsx"></script></body></html>`);
  writeFileSync(entry, "import React from 'react';import {createRoot} from 'react-dom/client';import './src/index.css';import {OrganizationSelector} from './src/modules/OrganizationSelector';createRoot(document.getElementById('root')!).render(<OrganizationSelector userName=\"Teste Master\" onSelectOrg={()=>{}} onSignOut={()=>{}} />);");
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { cwd: root, stdio: 'pipe', env: { ...process.env, VITE_API_URL: 'https://commercial-api.example.test' } });
  let serverLog = ''; server.stderr.on('data', data => { serverLog += data; });
  for (let attempt = 0; attempt < 60; attempt++) { try { if ((await fetch(origin)).ok) break; } catch {} if (server.exitCode !== null) throw Error(serverLog); await new Promise(resolve => setTimeout(resolve, 200)); }
  browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  page = await browser.newPage(); page.setDefaultTimeout(60000); await page.setViewport({ width: 1600, height: 1050 });
  page.on('pageerror', error => {errors.push(error.message); console.error('Page error:', error.message);});
  page.on('dialog', dialog => dialog.accept());
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin === origin || request.url().startsWith('data:')) return void request.continue();
    if (!url.pathname.match(/saas-plans|organizations|proposals|saas-subscriptions|members/)) return void request.abort();
    let body = {}, status = 200;
    if (url.pathname.endsWith('/saas-plans')) {
      if (request.method() === 'POST') {
        if (failSave) { status = 401; body = { message: 'Unauthorized' }; }
        else { saved = JSON.parse(request.postData()); plans = plans.some(plan => plan.id === saved.id) ? plans.map(plan => plan.id === saved.id ? saved : plan) : [...plans, saved]; body = { success: true }; }
      } else body = plans;
    } else if (url.pathname.endsWith('/proposals')) {
      if (request.method() === 'POST') { proposal = JSON.parse(request.postData()); body = { proposal: { id: 'smoke', token: 'smoke', proposal_url: 'https://example.test/proposta/smoke' } }; }
      else body = { proposals: [], stats: { active_mrr: 0 } };
    } else if (url.pathname.endsWith('/saas-subscriptions')) body = [];
    else body = { data: [] };
    void request.respond({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, authorization, x-organization-id', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' }, body: JSON.stringify(body) });
  });
  await page.goto(`${origin}/.commercial-smoke-${port}.html`, {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => document.querySelector('aside nav button'));
  await page.$$eval('aside nav button', buttons => buttons.find(button => button.textContent.includes('Planos & Preços')).click());
  await page.waitForSelector('.cp-plan-card');
  assert.equal(await page.$$eval('.cp-plan-card', cards => cards.length), 4);
  assert.equal(await page.$eval('header', header => header.textContent.includes('MRR')), false);
  await shot(page, 'catalogo-desktop');
  await clickText(page, 'Comparar módulos'); await page.waitForSelector('.cp-comparison'); await shot(page, 'comparacao-desktop'); await clickText(page, 'Planos 4');
  await page.click('.cp-plan-card .cp-button-secondary'); await page.waitForSelector('[role=dialog]');
  await shot(page, 'editor-desktop');
  await fill(page, 'Nome do plano', 'Conectar atualizado');
  await clickText(page, 'Módulos incluídos');
  await page.type('input[type=search]', 'Kids');
  await page.waitForSelector('.cp-module-group[open]');
  const child = await page.waitForFunction(() => [...document.querySelectorAll('.cp-option-row')].find(element => element.textContent.includes('Conferência de retirada'))?.querySelector('input'));
  await child.asElement().click();
  await clickText(page, 'Apresentação'); await page.type('input[aria-label="Benefício 1"]', ' · editado');
  await clickText(page, 'Salvar alterações'); await page.waitForSelector('[role=status]');
  assert.equal(saved.name, 'Conectar atualizado'); assert.equal(saved.entitlements['kids.module_enabled'], true); assert.equal(saved.entitlements['kids.secure_checkout_validation'], true); assert.equal(saved.entitlements['system.plan_entitlements'], sampleFlags['system.plan_entitlements']);
  assert.ok(saved.features[0].endsWith(' · editado'));
  // Failed authenticated saves must keep all edited values for recovery.
  await page.click('.cp-plan-card .cp-button-secondary'); await fill(page, 'Nome do plano', 'Rascunho preservado'); failSave = true;
  await clickText(page, 'Salvar alterações'); await page.waitForSelector('.commercial-dialog [role=alert]');
  assert.equal(await page.$eval('.commercial-dialog input[data-autofocus]', input => input.value), 'Rascunho preservado');
  failSave = false; await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('[role=dialog]'));
  // Start from Cuidar and verify prefilled values, review and success link.
  await page.click('.cp-plan-card:nth-child(2) .cp-button-primary'); await fill(page, 'Nome da igreja', 'Igreja de Teste'); await fill(page, 'Responsável pela contratação', 'Pessoa de Teste'); await fill(page, 'E-mail do responsável', 'pessoa@example.test');
  await clickText(page, 'Continuar');
  assert.equal(await page.$eval('select', input => input.value), 'CUIDAR');
  const amount = await page.$eval('.cp-composer input[type=number]', input => input.value); assert.equal(amount, '249');
  await shot(page, 'proposta-desktop'); await clickText(page, 'Continuar'); await shot(page, 'revisao-desktop'); await clickText(page, 'Gerar link da proposta'); await page.waitForSelector('.cp-proposal-success');
  assert.equal(proposal.plan_tier, 'CUIDAR'); assert.equal(proposal.max_members, '700'); assert.equal(proposal.max_campuses, '1');
  assert.equal(await page.$eval('input[aria-label="Link de contratação"]', input => input.value), 'https://example.test/proposta/smoke'); await clickText(page, 'Concluir');
  // Create from a model, preserving the copied entitlement matrix.
  await clickText(page, 'Novo plano'); await fill(page, 'Nome do plano', 'Plano Especial'); await clickText(page, 'Criar plano'); await page.waitForSelector('[role=status]');
  assert.equal(saved.id, 'PLANO_ESPECIAL'); assert.equal(saved.entitlements['kids.secure_checkout_validation'], true);
  // Narrow viewport: catalogue, comparison, editor and proposal remain contained.
  await page.setViewport({ width: 390, height: 844 }); await shot(page, 'catalogo-mobile');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'mobile catalogue must not overflow');
  await page.click('.cp-plan-card .cp-button-secondary'); await page.waitForSelector('[role=dialog]'); await shot(page, 'editor-mobile');
  assert.ok(await page.$eval('.cp-dialog-footer', element => element.getBoundingClientRect().bottom <= window.innerHeight), 'mobile save action must remain visible');
  await page.$eval('[aria-label="Fechar editor"]', element => element.focus()); await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
  await page.waitForFunction(() => document.activeElement.closest('[role=dialog]'));
  assert.ok(await page.evaluate(() => Boolean(document.activeElement.closest('[role=dialog]'))), 'tab navigation must remain in the dialog');
  await page.keyboard.press('Escape'); await clickText(page, 'Comparar módulos');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'comparison scroll must stay inside its container');
  await shot(page, 'comparacao-mobile'); await clickText(page, 'Planos 5');
  await page.click('.cp-plan-card:nth-child(2) .cp-button-primary'); await shot(page, 'proposta-mobile');
  assert.ok(await page.$eval('.cp-dialog-footer', element => element.getBoundingClientRect().bottom <= window.innerHeight));
  await page.keyboard.press('Escape');
  await page.click('.cp-plan-card:nth-child(4) .cp-button-primary');
  await fill(page, 'Nome da igreja', 'Igreja Enterprise'); await fill(page, 'Responsável pela contratação', 'Responsável'); await fill(page, 'E-mail do responsável', 'enterprise@example.test');
  await clickText(page, 'Continuar'); await clickText(page, 'Continuar');
  await page.waitForSelector('.commercial-dialog [role=alert]');
  assert.equal(await page.$eval('.cp-composer input[type=number]', element => element.value), '', 'Enterprise must require a negotiated price');
  assert.deepEqual(errors, []);
  console.log('PASS: Enterprise negotiation validation; dependencies; catalogue; comparison; authenticated editor save + failure recovery; create from template; proposal prefill/review/link; mobile containment; keyboard focus.');
  console.log(`Screenshots: ${output}`);
})().catch(async error => { console.error(error); if(page) { console.log(await page.evaluate(() => document.body.innerText)); await shot(page, 'failure'); } process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close(); if (server) server.kill(); rmSync(html, { force: true }); rmSync(entry, { force: true });
});
