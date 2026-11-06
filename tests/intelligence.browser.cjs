const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),assert=require('node:assert/strict'),puppeteer=require('puppeteer-core');
const root=path.resolve(__dirname,'..'),port=Number(process.env.INTELLIGENCE_TEST_PORT||5192),origin=`http://127.0.0.1:${port}`,prefix='.intelligence-test';
const files=['html','tsx','auth.ts','config.mjs'].map(extension=>path.join(root,`${prefix}.${extension}`));
let server,browser,page,log='';const errors=[];
const fixture=period=>({period:period==='last_month'?{start:'2026-10-01',end:'2026-11-01',previousStart:'2026-09-01',previousEnd:'2026-10-01',comparison:'MoM · meses encerrados',timezone:'America/Sao_Paulo'}:{start:'2026-11-01',end:'2026-11-06',previousStart:'2026-10-01',previousEnd:'2026-10-06',comparison:'MTD · mesmos dias completos',timezone:'America/Sao_Paulo'},updated_at:'2026-11-06T15:00:00Z',scope:{leader_groups_only:false,restricted_campuses:null},metrics:[
  {key:'registered_members',title:'Base cadastral ativa',definition:'Pessoas únicas com cadastro ativo hoje.',tab:'membros',status:'available',value:184,previous:null,reference:'current_state',coverage:'current_register',change:{delta:null,percent:null,reason:'no_comparable_baseline'}},
  {key:'participants',title:'Participantes registrados',definition:'Pessoas com presença confirmada nos registros do período.',tab:'celulas',status:'available',value:68,previous:60,reference:'selected_period',coverage:'registered_records',change:{delta:8,percent:13.3,reason:null}},
  {key:'new_visitors',title:'Visitantes no período',definition:'Primeira visita informada no período.',tab:'visitantes',status:'available',value:12,previous:10,reference:'selected_period',coverage:'registered_records',change:{delta:2,percent:20,reason:null}},
  {key:'digital_active',title:'Pessoas ativas no PWA',definition:'Adultos que autorizaram a coleta.',tab:'intelligence',status:'available',value:42,previous:35,reference:'selected_period',coverage:'authorized_sample',change:{delta:7,percent:20,reason:null}},
  {key:'content_reach',title:'Alcance de conteúdo',definition:'Pessoas ou navegadores nos registros de conteúdo.',tab:'content_workspace',status:'insufficient_sample',value:null,previous:null,reference:'selected_period',coverage:'legacy_and_authorized_events',sample_suppressed:true,change:{delta:null,percent:null,reason:'no_comparable_baseline'}},
  {key:'meetings',title:'Encontros registrados',definition:'Encontros informados na plataforma.',tab:'celulas',status:'available',value:18,previous:20,reference:'selected_period',coverage:'registered_records',change:{delta:-2,percent:-10,reason:null}},
],insights:[{key:'visitors_waiting',title:'Revise a fila de acolhimento',description:'Confira os contatos registrados antes de encaminhar uma ação.',tab:'visitantes',action:'Abrir acolhimento'}],usage:{modules:[{module:'home',people:42,interactions:160,sessions:73,suppressed:false},{module:'cells',people:28,interactions:91,sessions:39,suppressed:false}],daily:[{day:'2026-11-01',people:24,suppressed:false},{day:'2026-11-02',people:31,suppressed:false},{day:'2026-11-03',people:null,suppressed:true}]},quality:{collection_enabled:true,measurement_started_at:'2026-09-01T15:00:00Z',last_event_at:'2026-11-05T20:00:00Z',last_processed_at:'2026-11-05T20:01:00Z',eligible_adults:100,authorized_adults:60,minimum_sample:10,retention_days:90,errors:[],notes:['Uso digital representa uma amostra autorizada.','Ausência de registro não comprova ausência de uso.']}});
(async()=>{
 fs.mkdirSync('/tmp/faith-intelligence/screens',{recursive:true});
 fs.writeFileSync(files[0],`<html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body><div id="root"></div><script type="module" src="/${prefix}.tsx"></script></body></html>`);
 fs.writeFileSync(files[1],"import React from 'react';import{createRoot}from'react-dom/client';import App from './src/App';createRoot(document.getElementById('root')!).render(<App/>);");
 fs.writeFileSync(files[2],`export async function getCurrentUser(){return{username:'test-user',userId:'test-user',signInDetails:{loginId:'pessoa@example.test'}};}export async function fetchUserAttributes(){return{email:'pessoa@example.test'};}export async function fetchAuthSession(){return{tokens:{idToken:{toString:()=> 'isolated-test'}}};}export async function signOut(){}export async function signIn(){return{};}export async function signInWithRedirect(){}export async function confirmSignIn(){return{};}`);
 fs.writeFileSync(files[3],`import{defineConfig}from'vite';import react from'@vitejs/plugin-react';export default defineConfig({plugins:[react()],server:{hmr:false,watch:null},resolve:{alias:{'aws-amplify/auth':${JSON.stringify(files[2])}}}});`);
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort','--config',files[3]],{cwd:root,stdio:'pipe',env:{...process.env,VITE_API_URL:'https://intelligence-api.example.test'}});
 server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
 for(let i=0;i<90;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(resolve=>setTimeout(resolve,150));}
 browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 for(const version of ['v1','v2']){
  const context=await browser.createBrowserContext();page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',error=>errors.push(error.message));await page.setViewport({width:1440,height:1000});
  let fail=false;const overviewRequests=[];let writes=0;
  await page.setRequestInterception(true);page.on('request',request=>{
   const url=new URL(request.url());if(url.origin===origin||url.protocol==='data:')return void request.continue();if(url.hostname!=='intelligence-api.example.test')return void request.abort();
   if(request.method()==='OPTIONS')return void request.respond({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,authorization,x-organization-id','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'}});
   let body={data:[]},status=200;
   if(url.pathname==='/members/me')body={data:{id:'test-user',name:'Pessoa de Teste',email:'pessoa@example.test',role:'ADMIN',organization_id:'org_test'}};
   else if(url.pathname==='/organizations/org_test')body={id:'org_test',name:'Comunidade Horizonte',slug:'teste',status:'ACTIVE',plan:'GESTAO',primary_color:'#0f766e'};
   else if(url.pathname==='/feature-flags')body={flags:{'intelligence.overview':true,'studio.context_navigation_v2':true,'studio.guided_onboarding':false,'studio.global_search':false,'studio.personalized_navigation':false,'members.module_enabled':true,'cell_groups.module_enabled':true,'visitors.module_enabled':true},configs:{'studio.context_navigation_v2':{default_version:version}}};
   else if(['/cell-groups','/pdv/orders'].includes(url.pathname))body=[];
   else if(url.pathname==='/broadcasts/active')body=null;
   else if(url.pathname==='/intelligence/overview'){
    assert.equal(url.searchParams.get('organization_id'),'org_test');assert.equal(request.headers().authorization,'Bearer isolated-test');overviewRequests.push(url.searchParams.get('period'));
    body=fixture(url.searchParams.get('period'));if(fail){status=503;body={message:'Fonte temporariamente indisponível.'};}
   }
   if(request.method()==='POST')writes++;
   void request.respond({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type,authorization,x-organization-id','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS'},body:JSON.stringify(body)}).catch(()=>{});
  });
  await page.goto(`${origin}/${prefix}.html?studio=${version}&tab=intelligence`,{waitUntil:'domcontentloaded'});await page.waitForSelector('.intelligence-metric');
  assert.equal((await page.$$('.intelligence-metric')).length,6);assert.equal(await page.$eval('[data-metric=content_reach] .intelligence-value',el=>el.textContent),'—');
  assert.ok(await page.$$eval('aside button',buttons=>buttons.some(button=>button.textContent.includes('Inteligência'))));
  if(version==='v2')await page.waitForSelector('.studio-v2-context');
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.intelligence-module')).opacity==='1');
  await page.screenshot({path:`/tmp/faith-intelligence/screens/studio-${version}-desktop.png`});
  await page.$eval('[data-metric=registered_members] summary',el=>el.click());assert.ok(await page.$eval('[data-metric=registered_members]',el=>el.textContent.includes('Posição atual')));
  await page.select('.intelligence-filters select','last_month');await page.waitForFunction(()=>document.querySelector('.intelligence-period')?.textContent.includes('MoM'));
  await page.$$eval('.intelligence-toolbar nav button',buttons=>buttons.find(button=>button.textContent==='Uso do PWA').click());await page.waitForSelector('.intelligence-module table');
  assert.equal((await page.$$('.intelligence-module tbody tr')).length,2);
  await page.setViewport({width:390,height:844});await page.screenshot({path:`/tmp/faith-intelligence/screens/studio-${version}-mobile.png`});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.$$eval('.intelligence-toolbar nav button',buttons=>buttons.find(button=>button.textContent==='Qualidade e definições').click());await page.waitForSelector('.intelligence-quality-grid');
  assert.ok(await page.$eval('.intelligence-quality-grid',el=>el.textContent.includes('100')));
  const qualityButton=await page.$('.intelligence-toolbar nav button:last-child');await qualityButton.focus();await page.keyboard.press('Enter');
  fail=true;await page.$eval('.intelligence-filters>button',button=>button.click());await page.waitForSelector('.intelligence-error');assert.equal(await page.$('.intelligence-metric'),null);
  fail=false;await page.$eval('.intelligence-error button',button=>button.click());await page.waitForSelector('.intelligence-quality-grid');
  assert.ok(overviewRequests.includes('last_month'));assert.equal(writes,0,'Reading intelligence must not create operational actions');
  await context.close();page=null;
 }
 assert.deepEqual(errors,[]);console.log('PASS Studio v1/v2 actual App navigation, six metrics, sample protection, MoM filters, source definitions, mobile, keyboard, error recovery and read-only behavior.');
})().catch(async error=>{console.error(error);console.error(log.slice(-1800));if(page){console.error((await page.evaluate(()=>document.body.innerText)).slice(-1800));await page.screenshot({path:'/tmp/faith-intelligence/screens/studio-failure.png'});}process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.kill();for(const file of files)fs.rmSync(file,{force:true});});
