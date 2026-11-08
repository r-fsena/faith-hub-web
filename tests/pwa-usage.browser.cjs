const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),assert=require('node:assert/strict'),puppeteer=require('puppeteer-core');
const root=path.resolve(__dirname,'../../faith-hub-pwa'),port=Number(process.env.PWA_USAGE_TEST_PORT||5195),origin=`http://127.0.0.1:${port}`,prefix='.usage-app-test';
const files=['html','tsx','auth.ts','config.mjs'].map(extension=>path.join(root,`${prefix}.${extension}`));
let server,browser,page,log='';const errors=[];
(async()=>{
 fs.mkdirSync('/tmp/faith-intelligence/screens',{recursive:true});
 fs.writeFileSync(files[0],`<html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div><script type="module" src="/${prefix}.tsx"></script></body></html>`);
 fs.writeFileSync(files[1],"import React from 'react';import{createRoot}from'react-dom/client';import './src/index.css';import App from './src/App';createRoot(document.getElementById('root')!).render(<App/>);");
 fs.writeFileSync(files[2],`export async function getCurrentUser(){return{username:'test-user',userId:'test-user',signInDetails:{loginId:'pessoa@example.test'}};}export async function fetchUserAttributes(){return{email:'pessoa@example.test',name:'Pessoa de Teste',birthdate:'1990-04-15'};}export async function fetchAuthSession(){return{tokens:{idToken:{toString:()=> 'header.'+btoa(JSON.stringify({sub:'test-user'}))+'.signature'}}};}export async function signOut(){}export async function signIn(){return{};}export async function signInWithRedirect(){}export async function confirmSignIn(){return{};}export async function signUp(){return{};}export async function confirmSignUp(){return{};}export async function resetPassword(){return{};}export async function confirmResetPassword(){return{};}export async function updateUserAttributes(){return{};}`);
 fs.writeFileSync(files[3],`import{defineConfig}from'vite';import react from'@vitejs/plugin-react';export default defineConfig({plugins:[react()],server:{hmr:false,watch:null},resolve:{alias:{'aws-amplify/auth':${JSON.stringify(files[2])}}}});`);
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort','--config',files[3]],{cwd:root,stdio:'pipe',env:{...process.env,VITE_API_URL:'https://usage-api.example.test'}});
 server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
 for(let i=0;i<90;i++){
  if(server.exitCode!==null)throw Error('Test server did not start: '+log);
  if(log.includes('ready in')){try{if((await fetch(origin)).ok)break;}catch{}}
  if(i===89)throw Error('Test server readiness timed out');
  await new Promise(resolve=>setTimeout(resolve,150));
 }
 browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 for(const version of ['v1','v2']){
  const context=await browser.createBrowserContext();page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',error=>errors.push(error.message));await page.setViewport({width:390,height:844});
  let allowed=false,revision=0,failWithdrawal=false;const batches=[],choices=[];
  await page.setRequestInterception(true);page.on('request',request=>{
   const url=new URL(request.url());if(url.origin===origin||url.protocol==='data:')return void request.continue();if(url.hostname!=='usage-api.example.test')return void request.abort();
   const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,authorization,x-organization-id','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'};
   if(request.method()==='OPTIONS')return void request.respond({status:204,headers});
   let body=[],status=200;
   if(url.pathname==='/church-settings')body={organization_id:'org_test',church_name:'Comunidade Horizonte',slogan:'Uma comunidade conectada',primary_color:'#0f766e',secondary_color:'#14b8a6',theme_mode:'LIGHT',welcome_screen_config:{enabled:false},pwa_slug:'teste'};
   else if(url.pathname==='/feature-flags')body={flags:{'intelligence.usage_collection':true,'pwa.v2_experience':version==='v2','cell_groups.module_enabled':true,'devotionals.module_enabled':true,'members.digital_card':false,'kids.module_enabled':false,'pdv.module_enabled':false,'events.module_enabled':false,'volunteers.module_enabled':false,'ministries.module_enabled':false,'content.analytics_dashboard':true,'system.saas_pwa_customization':false}};
   else if(url.pathname==='/campuses')body=[{id:'campus_sede',name:'Sede'}];
   else if(url.pathname==='/members/me')body={data:{id:'test-user',name:'Pessoa de Teste',email:'pessoa@example.test',role:'MEMBER',status:'ACTIVE',organization_id:'org_test',campus_id:'campus_sede',birth_date:'1990-04-15'}};
   else if(url.pathname==='/broadcasts/active'||url.pathname==='/devotionals/today')body=null;
   else if(url.pathname==='/intelligence/me/usage'){
    if(request.method()==='POST'){
      const data=JSON.parse(request.postData());choices.push(data);
      if(failWithdrawal&&!data.allowed){status=503;body={message:'Servidor temporariamente indisponível.'};}
      else{assert.equal(data.expected_revision,revision);allowed=data.allowed;revision++;}
    }
    if(status===200)body={eligible:true,allowed,revision,policy_version:'2026-11-06.v1',collection_enabled:true};
   }else if(url.pathname==='/intelligence/events'){
    assert.ok(allowed,'No events may be collected before authorization');const data=JSON.parse(request.postData());assert.equal(data.organization_id,'org_test');batches.push(data);status=202;body={accepted:true,count:data.events.length};
   }
   void request.respond({status,contentType:'application/json',headers,body:JSON.stringify(body)}).catch(()=>{});
  });
  const openTab=async(label)=>{
    assert.ok(await page.evaluate(label=>{const button=[...document.querySelectorAll('nav button')].find(button=>button.textContent.trim()===label);if(!button)return false;button.click();return true;},label),label);
  };
  await page.goto(`${origin}/${prefix}.html?v=${version==='v1'?'1':'2'}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>[...document.querySelectorAll('nav button')].some(button=>button.textContent.trim()==='Perfil'));
  await openTab('Perfil');await page.waitForSelector('.usage-privacy-choice');assert.equal(batches.length,0);
  assert.equal(await page.$eval('.usage-privacy-primary',button=>button.disabled),true);
  await new Promise(resolve=>setTimeout(resolve,650));
  await page.$eval('.usage-privacy',el=>el.scrollIntoView({block:'start',behavior:'instant'}));
  await page.screenshot({path:`/tmp/faith-intelligence/screens/pwa-${version}-privacy.png`});
  await page.click('.usage-privacy-choice input');
  if(version==='v2'){
    await page.$$eval('.v2-segment-btn',buttons=>buttons.find(button=>button.textContent.trim()==='Escuro').click());
    await page.waitForFunction(()=>document.documentElement.classList.contains('dark-theme')||document.documentElement.classList.contains('dark'));
    await page.$eval('.usage-privacy',el=>el.scrollIntoView({block:'start',behavior:'instant'}));
    await page.screenshot({path:'/tmp/faith-intelligence/screens/pwa-v2-privacy-dark.png'});
  }
  const accepted=page.waitForResponse(response=>response.url().endsWith('/intelligence/events')&&response.status()===202,{timeout:12000});
  await page.click('.usage-privacy-primary');await accepted;
  assert.equal(choices[0].allowed,true);assert.ok(batches.flatMap(batch=>batch.events).every(event=>event.version===version));
  await page.setOfflineMode(true);await openTab('Início');
  await page.waitForFunction(()=>Object.keys(localStorage).some(key=>key.startsWith('faithhub_usage_v1:')));
  const before=batches.length;await new Promise(resolve=>setTimeout(resolve,3200));assert.equal(batches.length,before);
  const restored=page.waitForResponse(response=>response.url().endsWith('/intelligence/events')&&response.status()===202,{timeout:12000});await page.setOfflineMode(false);await restored;assert.ok(batches.length>before);
  await openTab('Perfil');await page.waitForSelector('.usage-privacy-secondary');
  failWithdrawal=true;await page.click('.usage-privacy-secondary');await page.waitForFunction(()=>document.querySelector('.usage-privacy')?.textContent.includes('Concluir desativação'));
  const stopped=batches.length;await openTab('Início');await new Promise(resolve=>setTimeout(resolve,3300));assert.equal(batches.length,stopped,'Failed withdrawal must still stop local capture');
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>[...document.querySelectorAll('nav button')].some(button=>button.textContent.trim()==='Perfil'));await openTab('Perfil');
  await page.waitForFunction(()=>document.querySelector('.usage-privacy')?.textContent.includes('Concluir desativação'));
  failWithdrawal=false;await page.click('.usage-privacy-secondary');await page.waitForFunction(()=>document.querySelector('.usage-privacy')?.textContent.includes('Compartilhamento desativado'));
  assert.equal(allowed,false);assert.equal(choices.at(-1).allowed,false);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  // Even with a stored granted preference, demo navigation must never create production usage.
  allowed=true;revision++;const demoBefore=batches.length;
  await page.goto(`${origin}/${prefix}.html?demo=true&v=${version==='v1'?'1':'2'}`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>[...document.querySelectorAll('nav button')].some(button=>button.textContent.trim()==='Perfil'));
  await openTab('Perfil');await new Promise(resolve=>setTimeout(resolve,3300));assert.equal(batches.length,demoBefore,'Demonstration traffic must stay out of real measurement');
  await context.close();page=null;
 }
 assert.deepEqual(errors,[]);console.log('PASS actual PWA v1/v2: no capture before consent, explicit opt-in, shared privacy UI, real screen events, offline queue/retry, local stop on failed withdrawal, persistence across reload server confirmation, and exclusion of demo traffic.');
})().catch(async error=>{console.error(error);console.error(log.slice(-1800));if(page){console.error((await page.evaluate(()=>document.body.innerText)).slice(-2200));await page.screenshot({path:'/tmp/faith-intelligence/screens/pwa-failure.png'});}process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();for(const file of files)fs.rmSync(file,{force:true});});
