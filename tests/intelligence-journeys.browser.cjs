// Actual Studio App v1/v2; all API/auth traffic is synthetic and isolated.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),assert=require('node:assert/strict'),puppeteer=require('puppeteer-core');
const root=path.resolve(__dirname,'..'),port=Number(process.env.JOURNEY_TEST_PORT||5201),origin=`http://127.0.0.1:${port}`,prefix='.journey-app-test';
const files=['html','tsx','auth.ts','config.mjs'].map(ext=>path.join(root,`${prefix}.${ext}`));
const output='/tmp/faith-intelligence-journeys/screens';let server,browser,page,log='';const errors=[];
const period={start:'2026-11-01',end:'2026-11-07',previousStart:'2026-10-01',previousEnd:'2026-10-07',comparison:'MTD',timezone:'America/Sao_Paulo'};
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 fs.writeFileSync(files[0],`<html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div><script type="module" src="/${prefix}.tsx"></script></body></html>`);
 fs.writeFileSync(files[1],"import React from 'react';import{createRoot}from'react-dom/client';import App from './src/App';createRoot(document.getElementById('root')!).render(<App/>);");
 fs.writeFileSync(files[2],`export async function getCurrentUser(){return{username:'test-user',userId:'test-user',signInDetails:{loginId:'pessoa@example.test'}};}export async function fetchUserAttributes(){return{email:'pessoa@example.test'};}export async function fetchAuthSession(){return{tokens:{idToken:{toString:()=> 'isolated-journey-test'}}};}export async function signOut(){}export async function signIn(){return{};}export async function signInWithRedirect(){}export async function confirmSignIn(){return{};}`);
 fs.writeFileSync(files[3],`import{defineConfig}from'vite';import react from'@vitejs/plugin-react';export default defineConfig({plugins:[react()],server:{hmr:false,watch:null},resolve:{alias:{'aws-amplify/auth':${JSON.stringify(files[2])}}}});`);
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort','--config',files[3]],{cwd:root,stdio:'pipe',env:{...process.env,VITE_API_URL:'https://journey-api.example.test'}});
 server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
 for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Fresh test server failed: '+log);if(log.includes('ready in')){try{if((await fetch(origin)).ok)break;}catch{}}if(i===99)throw Error('Server readiness timeout');await new Promise(r=>setTimeout(r,150));}
 browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 for(const version of ['v1','v2']){
  const context=await browser.createBrowserContext();page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1440,height:1000});
  const visitor={id:'visitor-test',name:'Visitante de Homologação',first_visit_date:'2026-11-01',stage:'NEW',campus_id:'campus-test',assigned_cell_id:'cell-test',journey_version:3,baseline_known:0};
  const actions=[],goals=[],writes=[];let failGoals=false,profileRole='ADMIN';
  const flags={'intelligence.overview':true,'intelligence.activation':true,'intelligence.member_journey':true,'intelligence.actions':true,'intelligence.goals':true,'members.module_enabled':true,'visitors.module_enabled':true,'cell_groups.module_enabled':true,'studio.context_navigation_v2':true,'studio.guided_onboarding':false,'studio.global_search':false,'studio.personalized_navigation':false};
  await page.setRequestInterception(true);page.on('request',request=>{
   try{const url=new URL(request.url());if(url.origin===origin||url.protocol==='data:')return void request.continue();if(url.hostname!=='journey-api.example.test')return void request.abort();
   const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,authorization,x-organization-id','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,OPTIONS'};
   if(request.method()==='OPTIONS')return void request.respond({status:204,headers});
   let data={data:[]},status=200;
   if(url.pathname==='/members/me')data={data:{id:'test-user',name:'Responsável de Teste',email:'pessoa@example.test',role:profileRole,organization_id:'org_test',campus_id:'campus-test',campus_ids:['all']}};
   else if(url.pathname==='/organizations/org_test')data={id:'org_test',name:'Comunidade Horizonte',slug:'teste',status:'ACTIVE',plan:'GESTAO',primary_color:'#0f766e'};
   else if(url.pathname==='/feature-flags')data={flags,configs:{'studio.context_navigation_v2':{default_version:version}}};
   else if(url.pathname==='/campuses')data=[{id:'campus-test',name:'Sede de Teste',status:'ACTIVE',organization_id:'org_test'}];
   else if(['/cell-groups','/pdv/orders'].includes(url.pathname))data=[];
   else if(url.pathname==='/broadcasts/active')data=null;
   else if(url.pathname.startsWith('/intelligence/')){
    const path=url.pathname.slice('/intelligence/'.length),body=request.postData()?JSON.parse(request.postData()):{};
    assert.equal(url.searchParams.get('organization_id')||body.organization_id,'org_test');assert.equal(request.headers().authorization,'Bearer isolated-journey-test');
    if(request.method()!=='GET'){assert.equal(body.organization_id,'org_test');assert.equal(body.campus_id,url.searchParams.get('campus_id')||body.campus_id);writes.push({path,body});}
    if(path==='overview')data={period,updated_at:'2026-11-07T15:00:00Z',scope:{leader_groups_only:false},metrics:[],usage:{daily:[],modules:[]},insights:[],quality:{errors:[],notes:[]}};
    else if(path==='activation')data={period,operations:{registered:24,invitation_requested:24,requests:26,failed_requests:2},cohorts:[{cohort:'2026-11',invited:24,authorized:null,measured_access:null,qualified_use:null,mature_return:null,returned:null,return_percent:null}],coverage:{started_at:'2026-11-07T10:00:00Z',collection_enabled:true},definitions:['Primeiro acesso medido não é primeiro login absoluto.']};
    else if(path==='community')data={period,cohorts:[{cohort:'2026-11',registered:12,unknown_history:8,mature:4,contacted:3,linked:2,attended:1,integrated:1,contact_percent:75}],waiting:[visitor],participation:[{week:'2026-W45',meetings:3,groups_recorded:2,participants:12}],groups_in_current_register:3,definitions:['Encaminhamento não confirma presença.']};
    else if(path==='welcome/visitors')data={visitors:[visitor],has_more:false};
    else if(path==='welcome/visitors/visitor-test/options')data={visitor,cells:[{id:'cell-test',name:'Célula de Teste'}],members:[{id:'member-test',name:'Cadastro de Teste'}],history:[]};
    else if(path==='welcome/visitors/visitor-test'&&request.method()==='POST'){assert.equal(body.expected_version,visitor.journey_version);visitor.journey_version++;visitor.stage=body.stage;data={...visitor};}
    else if(path==='options')data={campuses:[{id:'campus-test',name:'Sede de Teste'}],cells:[{id:'cell-test',name:'Célula de Teste',campus_id:'campus-test'}],owners:[{id:'test-user',name:'Responsável de Teste',role:'ADMIN',campus_id:'campus-test'}],metrics:{visitors_contacted:{label:'Visitantes com contato registrado',flag:'visitors.module_enabled'},registered_participants:{label:'Participantes registrados',flag:'cell_groups.module_enabled'}}};
    else if(path==='actions'&&request.method()==='POST'){const row={...body,id:'action-test',status:'NEW',owner_name:'Responsável de Teste',version:0,source_available:true};actions.push(row);data=row;}
    else if(path==='actions/action-test'&&request.method()==='PATCH'){assert.equal(body.expected_version,actions[0].version);Object.assign(actions[0],body,{version:actions[0].version+1});data=actions[0];}
    else if(path==='actions')data={actions,has_more:false};
    else if(path==='goals'&&request.method()==='POST'){assert.ok(body.request_id);goals.push({...body,id:'goal-test',version:0,status:'ACTIVE',owner_name:'Responsável de Teste',value:1,percent:50,source_status:'registered_records',metric_label:'Visitantes com contato registrado'});data=goals[0];}
    else if(path==='goals'){data={goals,has_more:false,definitions:['Progresso calculado na fonte.']};if(failGoals){status=503;data={message:'Fonte temporariamente indisponível.'};}}
    else if(path==='goals/goal-test'&&request.method()==='PATCH'){Object.assign(goals[0],body,{version:goals[0].version+1});data=goals[0];}
   }
   void request.respond({status,contentType:'application/json',headers,body:JSON.stringify(data)}).catch(()=>{});
   }catch(error){errors.push(error.message);void request.respond({status:500,contentType:'application/json',body:JSON.stringify({message:'Fixture assertion failed'})}).catch(()=>{});}
  });
  const click=async selector=>{const handle=await page.waitForSelector(selector,{visible:true});await handle.click();};
  const tab=async label=>{const handle=await page.evaluateHandle(label=>[...document.querySelectorAll('.intelligence-toolbar nav button')].find(b=>b.textContent===label),label);await handle.asElement().click();await handle.dispose();};
  const select=async(label,value)=>{await page.waitForFunction(label=>[...document.querySelectorAll('dialog label')].some(l=>l.firstChild?.textContent?.startsWith(label)&&l.querySelector('select')),{},label);const handle=await page.evaluateHandle(label=>[...document.querySelectorAll('dialog label')].find(l=>l.firstChild?.textContent?.startsWith(label))?.querySelector('select'),label);await handle.asElement().select(value);await handle.dispose();};
  await page.goto(`${origin}/${prefix}.html?studio=${version}&tab=intelligence`,{waitUntil:'domcontentloaded'});await page.waitForSelector('.intelligence-toolbar');
  await tab('Ativação');await page.waitForSelector('.intelligence-journeys table');assert.ok(await page.$eval('.intelligence-journeys',e=>e.textContent.includes('Primeiro acesso medido')));assert.equal(await page.$$eval('.intelligence-journeys tbody td',cells=>cells.filter(c=>c.textContent==='—').length),6);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.intelligence-module')).opacity==='1');await page.screenshot({path:`${output}/activation-${version}.png`});
  await tab('Comunidade');await page.waitForSelector('.intelligence-record-list button');await click('.intelligence-record-list button');await page.waitForSelector('dialog[open]');
  assert.ok(await page.$eval('dialog',e=>e.contains(document.activeElement)));await click('dialog footer button:last-child');await page.waitForFunction(()=>!document.querySelector('dialog[open]'));assert.equal(visitor.stage,'CONTACTED_24H');
  await page.screenshot({path:`${output}/community-${version}.png`});
  await tab('Ações');await page.waitForSelector('.intelligence-journeys .intelligence-section-heading button');await click('.intelligence-journeys .intelligence-section-heading button');await page.waitForSelector('dialog input[maxlength="140"]');
  await page.type('dialog input[maxlength="140"]','Revisar a rotina de acolhimento');await select('Unidade','campus-test');await click('dialog footer button:last-child');await page.waitForSelector('.intelligence-action-grid li');assert.equal(actions.length,1);assert.ok(await page.$eval('.intelligence-record-scope',e=>e.textContent.includes('Sede de Teste')));
  await click('.intelligence-action-grid .intelligence-button');await page.waitForSelector('dialog[open]');await select('Situação','IN_REVIEW');await click('dialog footer button:last-child');await page.waitForFunction(()=>!document.querySelector('dialog[open]'));assert.equal(actions[0].status,'IN_REVIEW');
  await page.setViewport({width:390,height:844});await page.screenshot({path:`${output}/actions-${version}-mobile.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await tab('Metas');await page.waitForSelector('.intelligence-journeys .intelligence-section-heading button');await click('.intelligence-journeys .intelligence-section-heading button');await page.waitForSelector('dialog input[maxlength="140"]');
  await page.type('dialog input[maxlength="140"]','Acompanhar contatos da semana');await select('Unidade','campus-test');
  await page.$eval('dialog input[type=number]',e=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'2');e.dispatchEvent(new Event('input',{bubbles:true}));});
  const dateEnd=new Date(Date.now()+7*86400000).toISOString().slice(0,10);await page.$$eval('dialog input[type=date]',(inputs,value)=>{const e=inputs[1];Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));},dateEnd);
  await click('dialog footer button:last-child');await page.waitForSelector('.intelligence-action-grid progress');assert.equal(goals[0].target_count,2);await page.screenshot({path:`${output}/goals-${version}-mobile.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  failGoals=true;await click('.intelligence-filters>button');await page.waitForSelector('.intelligence-journeys .intelligence-error');assert.equal(await page.$('.intelligence-action-grid progress'),null);
  failGoals=false;await click('.intelligence-journeys .intelligence-error button');await page.waitForSelector('.intelligence-action-grid progress');
  assert.ok(writes.some(w=>w.path==='welcome/visitors/visitor-test'));assert.ok(writes.some(w=>w.path==='actions'));assert.ok(writes.some(w=>w.path==='goals'));
  profileRole='Líder de Célula';await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.intelligence-toolbar');
  await tab('Comunidade');await page.waitForSelector('.intelligence-record-list');
  assert.equal(await page.$$eval('.intelligence-journeys button',buttons=>buttons.some(b=>b.textContent==='Cadastrar visitante')),false,'Legacy leader aliases must retain the restricted leader interface');
  await context.close();page=null;
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,versions:['Studio v1','Studio v2'],checks:['activation sample states','welcome evidence dialog and version','action creation and review','source-backed goal creation','error without false zero','keyboard modal focus','responsive layout','tenant headers and scoped mutations']}));
})().catch(async error=>{console.error(error.message);console.error(log.slice(-1000));if(page){console.error((await page.evaluate(()=>document.body.innerText)).slice(-2500));await page.screenshot({path:`${output}/failure.png`});}process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();for(const file of files)fs.rmSync(file,{force:true});});
