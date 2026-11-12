// Legacy v1 and v2 links must use the standard Studio shell. Auth and APIs are isolated mocks.
const { readFileSync, writeFileSync, rmSync, mkdirSync } = require('node:fs');
const { spawn } = require('node:child_process');
const path = require('node:path');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');
const root = path.resolve(__dirname, '..');
const port = Number(process.env.STUDIO_SESSION_TEST_PORT || 5186);
const origin = `http://127.0.0.1:${port}`;
const prefix = `.session-smoke-${port}`;
const files = ['html', 'tsx', 'auth.ts', 'config.mjs'].map(extension => path.join(root, `${prefix}.${extension}`));
const output = process.env.STUDIO_SESSION_SCREENSHOTS || '/tmp/faith-hub-sign-out';
let server, browser, page;
let serverLog='';
const errors = [];
(async () => {
  mkdirSync(output, { recursive: true });
  writeFileSync(files[0], `<html lang="pt-BR"><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><div id="root"></div><script type="module" src="/${prefix}.tsx"></script></body></html>`);
  writeFileSync(files[1], "import React from 'react';import {createRoot} from 'react-dom/client';import App from './src/App';createRoot(document.getElementById('root')!).render(<App/>);");
  writeFileSync(files[2], `
    import { Hub } from 'aws-amplify/utils';
    export async function getCurrentUser() { if (sessionStorage.getItem('mockSignedOut')) throw Error('No session'); return {username:'test-user',signInDetails:{loginId:'pessoa@example.test'}}; }
    export async function fetchUserAttributes() { return {email:'pessoa@example.test'}; }
    export async function fetchAuthSession() { return {tokens:{idToken:{toString:()=> 'isolated-test'}}}; }
    export async function signOut() {
      window.__signOutCalls = (window.__signOutCalls || 0) + 1;
      if (window.__holdSignOut) await new Promise(resolve => { window.__finishSignOut = resolve; });
      if (window.__failSignOut) throw Error('Mock sign-out failure');
      sessionStorage.setItem('mockSignedOut', 'true');
      if (window.__emitSignOut) { Hub.dispatch('auth', {event:'signedOut'}); await new Promise(resolve=>{window.__finishAfterEvent=resolve;}); }
    }
    export async function signIn() { return {}; }
    export async function signInWithRedirect() {}
    export async function confirmSignIn() { return {}; }
  `);
  writeFileSync(files[3], `import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({plugins:[react()],server:{hmr:false,watch:null},resolve:{alias:{'aws-amplify/auth':${JSON.stringify(files[2])}}}});`);
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host','127.0.0.1','--port',String(port),'--strictPort','--config',files[3]], {cwd:root,stdio:'pipe',env:{...process.env,VITE_API_URL:'https://session-api.example.test'}});
  server.stderr.on('data', data => {serverLog += data;}); server.stdout.on('data', data=>{serverLog+=data;});
  for(let at=0;at<60;at++){try {if((await fetch(origin)).ok)break;}catch{} if(server.exitCode!==null)throw Error(serverLog);await new Promise(resolve=>setTimeout(resolve,200));}
  browser = await puppeteer.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,pipe:true,timeout:60000});
  for(const test of [
    {version:'v1',role:'PASTOR',action:'avatar'},
    {version:'v1',role:'LEADER',action:'footer',mobile:true},
    {version:'v2',role:'ADMIN',action:'footer'},
    {version:'v2',role:'TREASURER',action:'avatar',mobile:true},
    {version:'v2',role:'VOLUNTEER',action:'avatar',authEvent:true},
    {version:'v1',role:'MEMBER',action:'avatar'},
    {version:'v1',role:'LEADER',action:'avatar',failure:true},
    {version:'v2',role:'MEMBER',action:'footer',mobile:true,failure:true}
  ]) {
    const context = await browser.createBrowserContext();
    page = await context.newPage();page.setDefaultTimeout(60000);
    await page.setViewport({width:test.mobile?390:1440,height:test.mobile?844:1000});
    page.on('pageerror', error=>errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request=>{
      const url=new URL(request.url());
      if(url.origin===origin || url.protocol==='data:')return void request.continue();
      if(url.hostname!=='session-api.example.test')return void request.abort();
      let body={data:[]};
      if(url.pathname==='/members/me')body={data:{id:'test-user',name:'Pessoa de Teste',email:'pessoa@example.test',role:test.role,organization_id:'org_test'}};
      else if(url.pathname==='/organizations/org_test')body={id:'org_test',name:'Igreja de Teste',slug:'teste',status:'ACTIVE',plan:'GESTAO',primary_color:'#0f766e'};
      else if(url.pathname==='/feature-flags')body={flags:{'studio.context_navigation_v2':true,'studio.guided_onboarding':false,'studio.global_search':false,'studio.personalized_navigation':false},configs:{'studio.context_navigation_v2':{default_version:test.version}}};
      else if(['/cell-groups','/pdv/orders'].includes(url.pathname))body=[];
      else if(url.pathname==='/broadcasts/active')body=null;
      void request.respond({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,authorization,x-organization-id','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'},body:JSON.stringify(body)});
    });
    await page.goto(`${origin}/${prefix}.html?studio=${test.version}`,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.studio-account-trigger');
    await page.waitForSelector('[data-studio-version="v2"]');
    assert.equal(await page.$('.studio-v2-status,.studio-v2-pilot'),null);
    assert.ok(await page.$('aside .studio-sign-out'), 'Every non-master role must have the footer action');
    assert.equal(await page.evaluate(()=>localStorage.getItem('faithhub_active_org')!==null),true);
    await page.click('.studio-account-trigger');await page.waitForSelector('.studio-account-panel');
    assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('studio-sign-out')),true);
    await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.studio-account-panel'));
    assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('studio-account-trigger')),true);
    if(test.action==='avatar')await page.click('.studio-account-trigger');
    else if(test.mobile){await page.click('button[aria-label="Abrir Menu"]');await page.waitForSelector('aside.mobile-open');await page.waitForFunction(()=>getComputedStyle(document.querySelector('aside.mobile-open')).transform==='matrix(1, 0, 0, 1, 0, 0)');}
    const selector=test.action==='avatar'?'.studio-account-panel .studio-sign-out':'aside .studio-sign-out';
    await page.screenshot({path:path.join(output,`${test.version}-${test.role}-${test.action}.png`)});
    await page.evaluate(test=>{window.__holdSignOut=true;window.__failSignOut=Boolean(test.failure);window.__emitSignOut=Boolean(test.authEvent);},test);
    await page.click(selector);
    await page.waitForFunction(()=>window.__signOutCalls===1);
    assert.equal(await page.$$eval('.studio-sign-out', buttons=>buttons.every(button=>button.disabled)),true);
    await page.$eval(selector,button=>button.click());assert.equal(await page.evaluate(()=>window.__signOutCalls),1,'Repeated clicks must not issue another sign-out');
    await page.evaluate(()=>window.__finishSignOut());
    if(test.failure){
      await page.waitForSelector('.studio-sign-out-error');
      assert.equal(await page.evaluate(()=>localStorage.getItem('faithhub_active_org')!==null),true,'A failed sign-out must keep its tenant context');
      assert.ok(await page.$('.studio-account-trigger'));
      await page.evaluate(()=>{window.__holdSignOut=false;window.__failSignOut=false;});
      await page.click(selector);
    }
    await page.waitForFunction(()=>!document.querySelector('.studio-account-trigger') && document.querySelector('input[type=password]'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('faithhub_active_org')),null);
    if(test.authEvent) await page.evaluate(()=>window.__finishAfterEvent());
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('input[type=password]');
    assert.equal(await page.$('.studio-account-trigger'),null,'Reload must remain at login after logout');
    assert.equal(await page.evaluate(()=>window.__signOutCalls||0),0,'Reload must not automatically call sign-out again');
    await context.close(); page=null;
    console.log(`PASS ${test.version} ${test.role} ${test.mobile?'mobile':'desktop'} ${test.action}${test.failure?' failure + retry':''}`);
  }
  assert.deepEqual(errors,[]);console.log('PASS: legacy/current links on standard v2, all non-master roles, both entry points, keyboard, pending guard, failure recovery, tenant cleanup and login after reload.');
})().catch(async error=>{console.error(error);console.error(serverLog.slice(-6000));if(page){console.log(await page.evaluate(()=>({scrollX,rect:document.querySelector('aside')?.getBoundingClientRect().toJSON(),transform:document.querySelector('aside')&&getComputedStyle(document.querySelector('aside')).transform})));console.log((await page.evaluate(()=>document.body.innerText)).slice(-2000));await page.screenshot({path:path.join(output,'failure.png')});}process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();for(const file of files)rmSync(file,{force:true});});
