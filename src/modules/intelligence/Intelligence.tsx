import {useEffect,useMemo,useRef,useState} from 'react';
import {getAuthHeaders} from '../../services/apiClient';
import {useFeatureFlags} from '../../context/FeatureFlagContext';
import {destinationFor} from '../../components/StudioCommandPalette';
import './intelligence.css';
import IntelligenceJourneys from './IntelligenceJourneys';
import IntelligenceOperations from './IntelligenceOperations';
import IntelligenceHistory from './IntelligenceHistory';
import '../financial/foundations.css';

const API=import.meta.env.VITE_API_URL||'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';
const MODULE_LABELS:Record<string,string>={home:'Início',profile:'Perfil',welcome:'Boas-vindas',auth:'Entrada',devotionals:'Palavra e estudos',cells:'Células',bible:'Bíblia',prayers:'Orações',events:'Eventos',store:'Loja',giving:'Contribuições',volunteers:'Escalas'};
type View='overview'|'usage'|'quality'|'activation'|'community'|'actions'|'goals'|'finance'|'operations'|'units'|'history';
interface Metric{key:string;title:string;definition:string;tab:string|null;status:string;value:number|null;previous:number|null;reference:string;coverage:string;sample_suppressed?:boolean;change:{delta:number|null;percent:number|null;reason:string|null};}
interface Overview{
  period:{start:string;end:string;previousStart:string;previousEnd:string;comparison:string;timezone:string};updated_at:string;
  scope:{leader_groups_only:boolean;restricted_campuses:string[]|null};metrics:Metric[];
  insights:Array<{key:string;title:string;description:string;tab:string|null;action?:string}>;
  usage:{modules:Array<{module:string;people:number|null;interactions:number|null;sessions:number|null;suppressed:boolean}>;daily:Array<{day:string;people:number|null;suppressed:boolean}>};
  quality:{collection_enabled:boolean;measurement_started_at:string|null;last_event_at:string|null;last_processed_at:string|null;eligible_adults:number|null;authorized_adults:number|null;minimum_sample:number;retention_days:number;errors:string[];notes:string[];usage_comparison_status?:string;measured_units?:number;expected_units?:number};
}
const number=(value:number|null)=>value===null?'—':new Intl.NumberFormat('pt-BR').format(value);
const date=(value:string)=>new Date(value+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC'});
const lastDay=(value:string)=>new Date(Date.parse(value+'T12:00:00Z')-86400000).toISOString().slice(0,10);
const time=(value:string|null)=>value?new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Ainda sem registro';
const statusLabel=(metric:Metric)=>metric.status==='error'?'Fonte temporariamente indisponível':metric.status==='not_available'?'Não disponível neste escopo':metric.status==='not_measured'?'Medição em formação':metric.status==='insufficient_sample'?'Amostra protegida':metric.reference==='current_state'?'Posição atual do cadastro':metric.coverage==='partial'?'Cobertura parcial do período':'Registros do período';

export default function Intelligence({organizationId,organizationName,campusId,role,onNavigate}:{organizationId:string;organizationName:string;campusId:string;role:string;onNavigate:(tab:string)=>void}){
  const {isFeatureEnabled,isLoading:flagsLoading}=useFeatureFlags();
  const enabled=isFeatureEnabled('intelligence.overview',false),canView=['SUPERADMIN','PASTOR','ADMIN','TREASURER','LEADER'].includes(role);
  const [view,setView]=useState<View>(role==='TREASURER'?'finance':'overview'),[period,setPeriod]=useState('month'),[refresh,setRefresh]=useState(0);
  const [data,setData]=useState<Overview|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const request=useRef(0),scope=`${organizationId}:${campusId}:${role}:${period}`,[loadedScope,setLoadedScope]=useState('');
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{
    if(flagsLoading||!enabled||!canView||role==='TREASURER'){setData(null);setLoading(false);return;}
    const controller=new AbortController(),id=++request.current;
    setData(null);setLoadedScope('');setLoading(true);setError('');
    void(async()=>{
      try{
        const headers=await getAuthHeaders({'x-organization-id':organizationId});
        if(controller.signal.aborted)return;
        const params=new URLSearchParams({organization_id:organizationId,campus_id:campusId,period});
        const response=await fetch(`${API}/intelligence/overview?${params}`,{headers,signal:controller.signal});
        const payload=await response.json();
        if(!response.ok)throw Error(payload.message||'Não foi possível atualizar a inteligência.');
        if(!Array.isArray(payload.metrics)||!payload.quality||!payload.period)throw Error('Resposta de indicadores inválida.');
        if(id===request.current&&!controller.signal.aborted){setData(payload);setLoadedScope(scope);}
      }catch(e){if(!controller.signal.aborted&&id===request.current)setError((e as Error).message);}
      finally{if(!controller.signal.aborted&&id===request.current)setLoading(false);}
    })();
    return()=>controller.abort();
  },[scope,refresh,enabled,flagsLoading,canView]);
  const current=data&&loadedScope===scope?data:null;
  const journeyView=['activation','community','actions','goals'].includes(view);
  const managementView=['finance','operations','units'].includes(view),externalView=journeyView||managementView||view==='history';
  const managementViews=([['finance','Finanças','intelligence.finance','financial.cashflow_ledger'],['operations','Operação','intelligence.operations',null],['units','Unidades','intelligence.multicampus','system.multicampus_enabled']] as const).filter(([key,,flag,parent])=>['SUPERADMIN','PASTOR','ADMIN','TREASURER'].includes(role)&&(key!=='operations'||role!=='TREASURER')&&isFeatureEnabled(flag,false)&&(!parent||isFeatureEnabled(parent,false))&&(key!=='finance'||isFeatureEnabled('financial.module_enabled',false)));
  const extraViews=([
    ['history','Histórico','intelligence.history','members.module_enabled'],
    ['activation','Ativação','intelligence.activation','members.module_enabled'],
    ['community','Comunidade','intelligence.member_journey','visitors.module_enabled'],
    ['actions','Ações','intelligence.actions',null],
    ['goals','Metas','intelligence.goals',null],
  ] as const).filter(([, ,flag,parent])=>role!=='TREASURER'&&isFeatureEnabled(flag,false)&&(!parent||isFeatureEnabled(parent,false)));
  useEffect(()=>{if((journeyView||view==='history')&&!extraViews.some(([key])=>key===view))setView('overview');},[view,extraViews.map(([key])=>key).join(':')]);
  useEffect(()=>{if(managementView&&!managementViews.some(([key])=>key===view))setView(role==='TREASURER'?'finance':'overview');},[view,managementViews.map(([key])=>key).join(':'),role]);
  const maxDaily=useMemo(()=>Math.max(1,...(current?.usage.daily||[]).map(day=>day.people||0)),[current]);
  function permitted(tab:string|null){
    if(!tab)return false;if(tab==='intelligence')return true;
    if(role==='LEADER'&&['membros','visitantes'].includes(tab))return false;
    const destination=destinationFor(tab);
    return !!destination&&(!destination.roles||destination.roles.includes(role))&&(!destination.featureFlag||isFeatureEnabled(destination.featureFlag,false));
  }
  function navigate(tab:string|null){if(tab==='intelligence'){setView('usage');heading.current?.focus();}else if(tab&&permitted(tab))onNavigate(tab);}
  if(flagsLoading)return <p role="status">Carregando permissões…</p>;
  if(!enabled||!canView)return <div className="intelligence-empty" role="status">Inteligência não está disponível para seu perfil ou para esta igreja.</div>;
  return <section className="intelligence-module animate-fade-in" aria-labelledby="intelligence-title">
    <header className="intelligence-hero">
      <div><span className="intelligence-eyebrow">Conhecer. Acompanhar. Decidir.</span><h1 id="intelligence-title" tabIndex={-1} ref={heading}>Inteligência</h1><p>Entenda o que mudou e encontre o próximo passo para sua igreja.</p></div>
      <div className="intelligence-context"><span>Contexto atual</span><strong>{organizationName}</strong><small>{campusId==='all'?'Consolidado das unidades permitidas':'Unidade selecionada no topo'}{current?.scope.leader_groups_only?' · somente seus grupos':''}</small></div>
    </header>
    <div className="intelligence-toolbar">
      <nav aria-label="Visões de inteligência">
        {([...(role==='TREASURER'?[]:([['overview','Resumo executivo'],['usage','Uso do PWA']] as const)),...extraViews.map(([key,label])=>[key,label] as const),...managementViews.map(([key,label])=>[key,label] as const),...(role==='TREASURER'?[]:[['quality','Qualidade e definições'] as const])]).map(([key,label])=><button type="button" key={key} aria-pressed={view===key} className={view===key?'is-active':''} onClick={()=>setView(key)}>{label}</button>)}
      </nav>
      <div className="intelligence-filters">{!['actions','goals'].includes(view)&&<label>Período<select value={period} onChange={e=>setPeriod(e.target.value)}>
        <option value="month">Mês atual · dias completos</option><option value="last_month">Último mês encerrado</option><option value="7d">Últimos 7 dias completos</option><option value="30d">Últimos 30 dias completos</option>
      </select></label>}<button type="button" className="intelligence-button" disabled={loading&&!externalView} onClick={()=>setRefresh(value=>value+1)}>{loading&&!externalView?'Atualizando…':'Atualizar'}</button></div>
    </div>
    {!externalView&&error&&<div className="intelligence-error" role="alert"><strong>Não foi possível atualizar os indicadores</strong><p>{error}</p><button type="button" className="intelligence-button" onClick={()=>setRefresh(value=>value+1)}>Tentar novamente</button></div>}
    {!externalView&&loading&&<div className="intelligence-loading" role="status"><span className="intelligence-spinner"/>Conferindo os dados do escopo selecionado…</div>}
    {managementView&&managementViews.some(([key])=>key===view)&&<IntelligenceOperations key={`${organizationId}:${campusId}:${role}:${view}:${refresh}`} view={view as 'finance'|'operations'|'units'} organizationId={organizationId} campusId={campusId} period={period} onNavigate={onNavigate} canNavigate={permitted}/>}
    {role==='TREASURER'&&!managementViews.length&&<div className="intelligence-empty">A inteligência financeira não está habilitada neste plano ou unidade.</div>}
    {view==='history'&&extraViews.some(([key])=>key==='history')&&<IntelligenceHistory key={`${organizationId}:${campusId}:${role}:${period}:${refresh}`} organizationId={organizationId} campusId={campusId} period={period}/>}
    {journeyView&&<IntelligenceJourneys key={`${organizationId}:${campusId}:${role}:${view}:${refresh}`} view={view as 'activation'|'community'|'actions'|'goals'} organizationId={organizationId} campusId={campusId} role={role} period={period} onNavigate={onNavigate} onSelectView={target=>{setView(target);heading.current?.focus();}}/>}
    {!externalView&&current&&<>
      <div className="intelligence-period" role="status"><div><strong>{date(current.period.start)} a {date(lastDay(current.period.end))}</strong><span>Comparado com {date(current.period.previousStart)} a {date(lastDay(current.period.previousEnd))} · {current.period.comparison}</span></div><small>Atualizado em {time(current.updated_at)} · Brasília</small></div>
      {view==='overview'&&<>
        <div className="intelligence-section-heading"><div><span className="intelligence-eyebrow">Visão executiva</span><h2>Os números e seu contexto</h2></div><button type="button" className="intelligence-text-button" onClick={()=>setView('quality')}>Como os indicadores são medidos</button></div>
        <div className="intelligence-metrics">{current.metrics.map(metric=><article className="intelligence-metric" key={metric.key} data-metric={metric.key}>
          <span>{metric.title}</span><strong className="intelligence-value">{number(metric.value)}</strong><small className="intelligence-metric-state">{statusLabel(metric)}</small>
          <p className="intelligence-change">{metric.change.percent!==null?<><b>{metric.change.percent>0?'+':''}{metric.change.percent.toLocaleString('pt-BR',{maximumFractionDigits:1})}%</b> · {metric.change.delta!>0?'+':''}{number(metric.change.delta)} em relação ao anterior</>:metric.change.reason==='new_occurrence'?'Nova ocorrência · sem base percentual':metric.change.reason==='zero_baseline'?'Sem variação registrada · base zero':metric.sample_suppressed?'Contagens comportamentais abaixo de 10 pessoas são protegidas.':'Sem base comparável para este indicador.'}</p>
          <details><summary>Entender este indicador</summary><p>{metric.definition}</p><p>Anterior: {number(metric.previous)}. {metric.reference==='current_state'?'A posição cadastral atual não é comparada retroativamente.':'A comparação considera os registros disponíveis, não a ausência presumida de atividade.'}</p></details>
          {permitted(metric.tab)&&<button type="button" className="intelligence-text-button" onClick={()=>navigate(metric.tab)}>{metric.tab==='intelligence'?'Ver uso do PWA':'Ver registros de origem'} <span aria-hidden="true">→</span></button>}
        </article>)}</div>
        <div className="intelligence-section-heading"><div><span className="intelligence-eyebrow">Próximos passos</span><h2>O que merece sua atenção</h2></div></div>
        <div className="intelligence-insights">{current.insights.length?current.insights.map(insight=><article className="intelligence-insight" key={insight.key}><span className="intelligence-insight-icon" aria-hidden="true">↗</span><div><h3>{insight.title}</h3><p>{insight.description}</p>{permitted(insight.tab)&&<button type="button" className="intelligence-text-button" onClick={()=>navigate(insight.tab)}>{insight.action||'Ver detalhes'} →</button>}</div></article>):<div className="intelligence-empty"><strong>Nenhuma pendência automática nesta janela</strong><p>Continue conferindo os registros e as rotinas da igreja. Este resumo não substitui o acompanhamento das equipes.</p></div>}</div>
      </>}
      {view==='usage'&&<>
        <div className="intelligence-section-heading"><div><span className="intelligence-eyebrow">Experiência digital</span><h2>Como o PWA está sendo utilizado</h2></div></div>
        <div className="intelligence-guidance"><strong>{current.quality.collection_enabled?'Medição opcional para membros adultos':'Coleta digital pausada'}</strong><p>As duas versões do PWA usam a mesma medição. Só entram as interações de adultos que autorizaram a coleta no Perfil. Equipe administrativa não entra nestas contagens de membros. Pessoas distintas não devem ser somadas entre dias ou módulos.</p><p>Os comparativos consideram dias completos. Para conferir as interações recebidas hoje, veja o horário da última interação em Qualidade e definições.</p></div>
        {!current.quality.measurement_started_at?<div className="intelligence-empty"><strong>Estamos formando a base de uso</strong><p>Depois das primeiras autorizações e interações, esta visão mostrará os módulos utilizados. O histórico começa no recebimento dos dados; não há preenchimento retroativo.</p></div>:!current.usage.modules.length?<div className="intelligence-empty"><strong>Sem série exibível neste período</strong><p>A janela pode estar sem interações ou com uma amostra protegida. Confira a cobertura na aba Qualidade e definições.</p></div>:<>
          <section className="intelligence-panel" aria-labelledby="intelligence-daily"><h3 id="intelligence-daily">Pessoas distintas por dia</h3><p>Somente dias com registros recebidos. Dias sem medição não são preenchidos como zero.</p><div className="intelligence-chart" role="img" aria-label="Atividade diária de membros adultos que autorizaram a coleta">{current.usage.daily.map(point=><div className="intelligence-chart-column" key={point.day} title={`${date(point.day)}: ${point.suppressed?'amostra protegida':number(point.people)+' pessoas'}`}><span style={{height:`${point.people?Math.max(4,point.people/maxDaily*100):4}%`}} className={point.suppressed?'is-suppressed':''}/><small>{point.day.slice(8)}</small></div>)}</div></section>
          <section className="intelligence-panel"><h3>Módulos utilizados</h3><div className="intelligence-table-wrap"><table><thead><tr><th>Módulo</th><th>Pessoas distintas</th><th>Interações</th><th>Sessões com uso</th></tr></thead><tbody>{current.usage.modules.map(module=><tr key={module.module}><th scope="row">{MODULE_LABELS[module.module]||module.module}</th><td>{module.suppressed?'Amostra protegida':number(module.people)}</td><td>{number(module.interactions)}</td><td>{number(module.sessions)}</td></tr>)}</tbody></table></div><p>Uma sessão termina após 30 minutos sem interação. Uma mesma pessoa ou sessão pode aparecer em vários módulos.</p></section>
        </>}
      </>}
      {view==='quality'&&<>
        <div className="intelligence-section-heading"><div><span className="intelligence-eyebrow">Confiança nos dados</span><h2>Saiba o que já pode ser interpretado</h2></div></div>
        <div className="intelligence-quality-grid"><article className="intelligence-panel"><h3>Cobertura da medição digital</h3><dl><dt>Coleta nesta igreja</dt><dd>{current.quality.collection_enabled?'Habilitada · depende da autorização do membro':'Pausada'}</dd><dt>Primeira interação recebida</dt><dd>{time(current.quality.measurement_started_at)}</dd><dt>Última interação registrada</dt><dd>{time(current.quality.last_event_at)}</dd><dt>Último processamento</dt><dd>{time(current.quality.last_processed_at)}</dd><dt>Comparação do uso digital</dt><dd>{current.quality.usage_comparison_status==='ready'?'Janela comparável disponível':current.quality.usage_comparison_status==='restricted_group_scope'?'Registros dos seus grupos · sem comparação digital consolidada':current.quality.usage_comparison_status==='paused'?'Coleta pausada':'Aguardando janela equivalente e cobertura das unidades'}</dd>{!current.scope.leader_groups_only&&<><dt>Unidades com medição iniciada</dt><dd>{number(current.quality.measured_units??null)} de {number(current.quality.expected_units??null)} no escopo</dd></>}<dt>Adultos elegíveis no cadastro</dt><dd>{current.quality.eligible_adults===null?'Contagem protegida ou sem base':number(current.quality.eligible_adults)}</dd><dt>Autorizações registradas</dt><dd>{current.quality.authorized_adults===null?'Contagem protegida ou sem base':number(current.quality.authorized_adults)}</dd></dl></article><article className="intelligence-panel"><h3>Como ler os números</h3><ul>{current.quality.notes.map(note=><li key={note}>{note}</li>)}</ul><p>Interações comportamentais vinculadas a esta autorização são mantidas por até {current.quality.retention_days} dias. Os registros operacionais seguem suas próprias políticas.</p></article></div>
        {current.quality.errors.length>0&&<div className="intelligence-error" role="alert"><strong>Algumas fontes precisam de nova consulta</strong><p>Os indicadores indisponíveis não foram apresentados como zero.</p><button type="button" className="intelligence-button" onClick={()=>setRefresh(value=>value+1)}>Consultar novamente</button></div>}
        <section className="intelligence-panel"><h3>Definições dos indicadores</h3>{current.metrics.map(metric=><details key={metric.key}><summary>{metric.title}</summary><p>{metric.definition}</p><p>{statusLabel(metric)}. A base cadastral mede posição atual; os demais cartões usam o período selecionado quando houver cobertura.</p></details>)}</section>
      </>}
    </>}
  </section>;
}
