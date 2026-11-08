// Actual Studio App v1/v2; all API/auth traffic is synthetic and isolated.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),assert=require('node:assert/strict'),puppeteer=require('puppeteer-core');
const root=path.resolve(__dirname,'..'),port=Number(process.env.OPERATION_TEST_PORT||5203),origin=`http://127.0.0.1:${port}`,prefix='.operation-app-test';
const files=['html','tsx','auth.ts','config.mjs'].map(ext=>path.join(root,`${prefix}.${ext}`));
const output='/tmp/faith-intelligence-operations/screens';let server,browser,page,log='';const errors=[];
const period={start:'2026-11-01',end:'2026-11-07',previousStart:'2026-10-01',previousEnd:'2026-10-07',comparison:'MTD',timezone:'America/Sao_Paulo'};
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 fs.writeFileSync(files[0],`<html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div><script type="module" src="/${prefix}.tsx"></script></body></html>`);
 fs.writeFileSync(files[1],"import React from 'react';import{createRoot}from'react-dom/client';import App from './src/App';createRoot(document.getElementById('root')!).render(<App/>);");
 fs.writeFileSync(files[2],`export async function getCurrentUser(){return{username:'test-user',userId:'test-user',signInDetails:{loginId:'pessoa@example.test'}};}export async function fetchUserAttributes(){return{email:'pessoa@example.test'};}export async function fetchAuthSession(){return{tokens:{idToken:{toString:()=> 'isolated-journey-test'}}};}export async function signOut(){}export async function signIn(){return{};}export async function signInWithRedirect(){}export async function confirmSignIn(){return{};}`);
 fs.writeFileSync(files[3],`import{defineConfig}from'vite';import react from'@vitejs/plugin-react';export default defineConfig({plugins:[react()],server:{hmr:false,watch:null},resolve:{alias:{'aws-amplify/auth':${JSON.stringify(files[2])}}}});`);
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort','--config',files[3]],{cwd:root,stdio:'pipe',env:{...process.env,VITE_API_URL:'https://operation-api.example.test'}});
 server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
 for(let i=0;i<100;i++){if(server.exitCode!==null)throw Error('Fresh test server failed: '+log);if(log.includes('ready in')){try{if((await fetch(origin)).ok)break;}catch{}}if(i===99)throw Error('Server readiness timeout');await new Promise(r=>setTimeout(r,150));}
 browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 for(const version of ['v1','v2']){
  const context=await browser.createBrowserContext();page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));await page.setViewport({width:1440,height:1000});
  const visitor={id:'visitor-test',name:'Visitante de Homologação',first_visit_date:'2026-11-01',stage:'NEW',campus_id:'campus-test',assigned_cell_id:'cell-test',journey_version:3,baseline_known:0};
  const actions=[],goals=[],writes=[];let failFinance=false,profileRole='ADMIN';const reads=[];
  const flags={'intelligence.finance':true,'intelligence.operations':true,'intelligence.multicampus':true,'system.multicampus_enabled':true,'financial.module_enabled':true,'financial.cashflow_ledger':true,'events.module_enabled':true,'pdv.module_enabled':true,'pdv.stock_inventory':true,'kids.module_enabled':true,'kids.reports_export':true,'ministries.module_enabled':true,'volunteers.module_enabled':true,'intelligence.overview':true,'intelligence.activation':true,'intelligence.member_journey':true,'intelligence.actions':true,'intelligence.goals':true,'members.module_enabled':true,'visitors.module_enabled':true,'cell_groups.module_enabled':true,'studio.context_navigation_v2':true,'studio.guided_onboarding':false,'studio.global_search':false,'studio.personalized_navigation':false};
  const metric=(key,title,value,unit='count',snapshot=false)=>({key,title,value,unit,previous:snapshot?null:10,reference:snapshot?'current_state':'selected_period',definition:'Definição verificável da fonte',change:{delta:snapshot?null:value-10,percent:snapshot||value<0?null:10,reason:value<0?'signed_balance':null}});
  const blocks={finance:{status:'available',included_units:1,metrics:[metric('income','Receitas pagas',10001,'BRL_CENTS'),metric('result','Resultado registrado',-5000,'BRL_CENTS')]},events:{status:'available',included_units:1,metrics:[metric('tickets','Inscrições válidas',12)]},store:{status:'available',included_units:1,metrics:[metric('sales','Vendas pagas',3000,'BRL_CENTS')]},stock:{status:'available',included_units:1,metrics:[metric('low_stock','Saldos abaixo do mínimo',2,'count',true)]},teams:{status:'available',included_units:1,metrics:[metric('uncovered_slots','Vagas sem aceite',3)]},kids:{status:'available',included_units:1,metrics:[metric('kids_open','Check-ins Kids em aberto',2,'count',true)]}};
  const payload=view=>({view,period,updated_at:'2026-11-08T15:00:00Z',sources:blocks,units:[{id:'campus-test',name:'Sede de Teste',sources:blocks},{id:'campus-disabled',name:'Unidade sem fonte',sources:Object.fromEntries(Object.entries(blocks).map(([k,v])=>[k,{...v,status:'not_available',metrics:v.metrics.map(m=>({...m,value:null,previous:null}))}]))}],finance_details:{categories:[{type:'INCOME',category:'Categoria sintética',amount_cents:10001,records:2}]},notes:['Sem dados nominais de crianças.'],errors:[]});
  await page.setRequestInterception(true);page.on('request',request=>{try{
   const url=new URL(request.url());if(url.origin===origin||url.protocol==='data:')return void request.continue();if(url.hostname!=='operation-api.example.test')return void request.abort();
   const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,authorization,x-organization-id','Access-Control-Allow-Methods':'GET,OPTIONS'};
   if(request.method()==='OPTIONS')return void request.respond({status:204,headers});
   let data={data:[]},status=200;
   if(url.pathname==='/members/me')data={data:{id:'test-user',name:'Responsável de Teste',email:'pessoa@example.test',role:profileRole,organization_id:'org_test',campus_id:'campus-test',campus_ids:['all']}};
   else if(url.pathname==='/organizations/org_test')data={id:'org_test',name:'Comunidade Horizonte',slug:'teste',status:'ACTIVE',plan:'GESTAO',primary_color:'#0f766e'};
   else if(url.pathname==='/feature-flags')data={flags,configs:{'studio.context_navigation_v2':{default_version:version}}};
   else if(url.pathname==='/campuses')data=[{id:'campus-test',name:'Sede de Teste',status:'ACTIVE',organization_id:'org_test'}];
   else if(['/cell-groups','/pdv/orders'].includes(url.pathname))data=[];
   else if(url.pathname==='/broadcasts/active')data=null;
   else if(url.pathname.startsWith('/intelligence/')){
    assert.equal(request.method(),'GET','New intelligence views must be read-only');reads.push(url.pathname);
    assert.equal(url.searchParams.get('organization_id'),'org_test');assert.equal(request.headers().authorization,'Bearer isolated-journey-test');assert.ok(['all','campus-test'].includes(url.searchParams.get('campus_id')));
    if(url.pathname.endsWith('/overview'))data={period,updated_at:'2026-11-08T15:00:00Z',scope:{leader_groups_only:false},metrics:[],usage:{daily:[],modules:[]},insights:[],quality:{errors:[],notes:[]}};
    else data=payload(url.pathname.split('/').at(-1));
    if(failFinance&&url.pathname.endsWith('/finance')){status=503;data={message:'Fonte indisponível para teste.'};}
   }
   void request.respond({status,contentType:'application/json',headers,body:JSON.stringify(data)}).catch(()=>{});
  }catch(e){errors.push(e.message);void request.abort().catch(()=>{});}});
  const click=async selector=>{const e=await page.waitForSelector(selector,{visible:true});await e.click();};
  const tab=async label=>{const h=await page.evaluateHandle(label=>[...document.querySelectorAll('.intelligence-toolbar nav button')].find(b=>b.textContent===label),label);assert.ok(h.asElement(),'Expected tab '+label);await h.asElement().click();await h.dispose();};
  await page.goto(`${origin}/${prefix}.html?studio=${version}&tab=intelligence`,{waitUntil:'domcontentloaded'});await page.waitForSelector('.intelligence-toolbar');
  await tab('Finanças');await page.waitForSelector('.intelligence-operations [data-metric=income]');
  assert.ok(await page.$eval('.intelligence-operations [data-metric=income]',e=>e.textContent.includes('100,01')));await new Promise(r=>setTimeout(r,450));await page.screenshot({path:`${output}/finance-${version}.png`});
  await tab('Operação');await page.waitForSelector('.intelligence-source-tabs');await click('.intelligence-source-tabs button:last-child');await page.waitForSelector('[data-metric=kids_open]');assert.ok(await page.$eval('[data-metric=kids_open]',e=>e.textContent.includes('Posição atual')));
  await tab('Unidades');await page.waitForSelector('table[aria-label="Indicadores por unidade"]');assert.ok(await page.$eval('.intelligence-operations',e=>e.textContent.includes('Não habilitado neste acesso/unidade')));
  await page.setViewport({width:390,height:844});await new Promise(r=>setTimeout(r,450));await page.screenshot({path:`${output}/units-${version}-mobile.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  failFinance=true;await tab('Finanças');await page.waitForSelector('.intelligence-operations .intelligence-error');assert.equal(await page.$('.intelligence-operations [data-metric=income]'),null);failFinance=false;await click('.intelligence-operations .intelligence-error button');await page.waitForSelector('.intelligence-operations [data-metric=income]');
  profileRole='TREASURER';reads.length=0;await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.intelligence-operations [data-metric=income]');assert.deepEqual(await page.$$eval('.intelligence-toolbar nav button',buttons=>buttons.map(b=>b.textContent)),['Finanças','Unidades']);assert.ok(!reads.includes('/intelligence/overview'));
  profileRole='LEADER';await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('.intelligence-toolbar');const tabs=await page.$$eval('.intelligence-toolbar nav button',buttons=>buttons.map(b=>b.textContent));assert.ok(!tabs.some(t=>['Finanças','Operação','Unidades'].includes(t)));
  await context.close();page=null;
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,versions:['Studio v1','Studio v2'],checks:['financial amounts in reais','operational source navigation','unit disabled-source states','mobile overflow','source error clears stale values','treasury has only finance/units and no pastoral fetch','leader visibility','tenant and auth headers','read-only requests']}));
})().catch(async e=>{console.error(e.stack);console.error(log.slice(-1000));if(page){console.error((await page.evaluate(()=>document.body.innerText)).slice(-2500));await page.screenshot({path:`${output}/failure.png`});}process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();for(const file of files)fs.rmSync(file,{force:true});});
