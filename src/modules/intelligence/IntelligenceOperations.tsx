import {useEffect,useState} from 'react';
import {getAuthHeaders} from '../../services/apiClient';

const API=import.meta.env.VITE_API_URL||'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';
type View='finance'|'operations'|'units';
type Metric={key:string;title:string;unit:string;definition:string;value:number|null;previous:number|null;reference:string;change:{delta:number|null;percent:number|null;reason:string|null}};
type Source={status:string;included_units?:number;metrics:Metric[]};
type Payload={period:{start:string;end:string;previousStart:string;previousEnd:string;comparison:string};updated_at:string;sources:Record<string,Source>;units:Array<{id:string;name:string;sources:Record<string,Source>}>;finance_details?:{categories:Array<{type:string;category:string;amount_cents:number;records:number}>;categories_has_more?:boolean};notes:string[];errors:string[]};
const labels:Record<string,string>={finance:'Tesouraria',events:'Eventos',store:'Loja',stock:'Estoque',teams:'Equipes e escalas',kids:'Kids'};
const destinations:Record<string,string>={finance:'financial_treasury',events:'eventos',store:'pdv_pedidos',stock:'pdv_estoque',teams:'escalas',kids:'kids_relatorios'};
const format=(value:number|null,unit:string)=>value===null?'—':unit==='BRL_CENTS'?new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value/100):new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(value);
const day=(value:string)=>new Date(value+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC'});
const previousDay=(value:string)=>new Date(Date.parse(value+'T12:00:00Z')-86400000).toISOString().slice(0,10);
function Change({metric}:{metric:Metric}){const c=metric.change;return <span>{metric.reference==='current_state'?'Posição atual · sem comparação histórica':c.delta===null?'Sem base comparável':c.reason==='signed_balance'?`Variação: ${format(c.delta,metric.unit)} · saldo com sinal, sem percentual`:c.percent===null?`Variação: ${format(c.delta,metric.unit)} · base anterior zero`:`${c.percent>0?'+':''}${c.percent.toLocaleString('pt-BR',{maximumFractionDigits:1})}% · ${format(c.delta,metric.unit)}`}</span>;}

export default function IntelligenceOperations({view,organizationId,campusId,period,onNavigate,canNavigate}:{view:View;organizationId:string;campusId:string;period:string;onNavigate:(tab:string)=>void;canNavigate:(tab:string)=>boolean}){
 const [data,setData]=useState<Payload|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[refresh,setRefresh]=useState(0),[source,setSource]=useState('events'),[indicator,setIndicator]=useState('');
 const context=`${view}:${organizationId}:${campusId}:${period}:${refresh}`,[loaded,setLoaded]=useState('');
 useEffect(()=>{const abort=new AbortController();setData(null);setLoaded('');setError('');setLoading(true);
  void(async()=>{try{const headers=await getAuthHeaders({'x-organization-id':organizationId});if(abort.signal.aborted)return;
   const params=new URLSearchParams({organization_id:organizationId,campus_id:campusId,period});const response=await fetch(`${API}/intelligence/${view}?${params}`,{headers,signal:abort.signal});const payload=await response.json();
   if(!response.ok)throw Error(payload.message||'Não foi possível consultar esta visão.');
   if(!payload.period||!payload.sources||!Array.isArray(payload.units)||!Array.isArray(payload.notes))throw Error('Resposta de gestão inválida.');
   if(!abort.signal.aborted){setData(payload);setLoaded(context);}
  }catch(e){if(!abort.signal.aborted)setError((e as Error).message);}finally{if(!abort.signal.aborted)setLoading(false);}})();return()=>abort.abort();
 },[context]);
 const current=loaded===context?data:null;
 const available=current?Object.entries(current.sources).filter(([,s])=>s.status!=='not_available'):[];
 const sections=available.filter(([key])=>key!=='finance');
 const selected=sections.some(([key])=>key===source)?source:sections[0]?.[0];
 const choices=available.flatMap(([key,s])=>s.metrics.map(metric=>({key:`${key}:${metric.key}`,source:key,metric})));
 const chosen=choices.find(m=>m.key===indicator)||choices[0];
 function sourcePanel(key:string){const block=current!.sources[key];if(!block||block.status==='not_available')return <div className="intelligence-empty">Esta fonte não está disponível nos módulos e unidades do seu acesso.</div>;
  return <section className="intelligence-operation-source" aria-label={labels[key]}>
   <div className="intelligence-section-heading"><div><span className="intelligence-eyebrow">Fonte operacional</span><h2>{labels[key]}</h2><p>{block.included_units??0} unidade(s) com esta fonte habilitada.</p></div>{canNavigate(destinations[key])&&<button type="button" className="intelligence-text-button" onClick={()=>onNavigate(destinations[key])}>Abrir registros de origem →</button>}</div>
   {block.status==='error'?<div className="intelligence-error" role="alert"><strong>Fonte temporariamente indisponível</strong><p>Os valores desta fonte não foram substituídos por zero. As demais fontes continuam disponíveis.</p><button type="button" className="intelligence-button" onClick={()=>setRefresh(v=>v+1)}>Consultar novamente</button></div>:<div className="intelligence-metrics">{block.metrics.map(m=><article className="intelligence-metric" key={m.key} data-metric={m.key}><span>{m.title}</span><strong className="intelligence-value">{format(m.value,m.unit)}</strong><small>{m.reference==='current_state'?'Posição atual':'Registros da janela selecionada'}</small><p className="intelligence-change"><Change metric={m}/></p><details><summary>Entender este indicador</summary><p>{m.definition}</p><p>Anterior: {format(m.previous,m.unit)}.</p></details></article>)}</div>}
  </section>;
 }
 return <div className="intelligence-operations">
  {loading&&<div className="intelligence-loading" role="status"><span className="intelligence-spinner"/>Consultando as fontes autorizadas de gestão…</div>}
  {error&&<div className="intelligence-error" role="alert"><strong>Não foi possível atualizar esta visão</strong><p>{error}</p><button type="button" className="intelligence-button" onClick={()=>setRefresh(v=>v+1)}>Tentar novamente</button></div>}
  {current&&<>
   <div className="intelligence-period"><div><strong>{day(current.period.start)} a {day(previousDay(current.period.end))}</strong><span>Comparado com {day(current.period.previousStart)} a {day(previousDay(current.period.previousEnd))} · {current.period.comparison}</span></div><small>Atualizado em {new Date(current.updated_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · Brasília</small></div>
   {view==='finance'&&<>
    <div className="intelligence-guidance"><strong>Resultado dos lançamentos da tesouraria</strong><p>Valores pagos usam a data de pagamento informada. Pendentes e cancelados ficam separados. A fonte ainda não distingue estornos ou transferências internas de forma estruturada; os valores exigem conferência na tesouraria.</p><p>Vendas da loja e inscrições de eventos não são adicionadas novamente a estes totais.</p></div>
    {sourcePanel('finance')}
    {current.sources.finance?.status==='available'&&<section className="intelligence-panel"><h3>Composição por categoria</h3><p>Lançamentos pagos da janela atual. Valores em reais, sem nomes de contribuintes.</p>{current.finance_details?.categories.length?<div className="intelligence-table-wrap"><table><thead><tr><th>Tipo</th><th>Categoria</th><th>Valor</th><th>Registros</th></tr></thead><tbody>{current.finance_details.categories.map((r,i)=><tr key={i}><td>{r.type==='INCOME'?'Receita':'Despesa'}</td><th scope="row">{r.category}</th><td>{format(r.amount_cents,'BRL_CENTS')}</td><td>{r.records}</td></tr>)}</tbody></table></div>:<p>Nenhum lançamento pago elegível nesta janela.</p>}{current.finance_details?.categories_has_more&&<p>Mostrando as 20 maiores categorias. Os indicadores acima incluem todas; consulte a tesouraria para a composição completa.</p>}</section>}
   </>}
   {view==='operations'&&<>
    <div className="intelligence-guidance"><strong>Cada operação com sua própria referência</strong><p>Eventos seguem a data informada da edição; loja segue pagamento com data conhecida; escalas seguem a data do serviço. Estoque e ocupação Kids em aberto são posições atuais.</p></div>
    {sections.length?<><nav className="intelligence-source-tabs" aria-label="Fontes de operação">{sections.map(([key])=><button type="button" key={key} className="intelligence-button" aria-pressed={selected===key} onClick={()=>setSource(key)}>{labels[key]}{current.sources[key].status==='error'?' · indisponível':''}</button>)}</nav>{sourcePanel(selected)}</>:<div className="intelligence-empty">Nenhuma fonte operacional está habilitada para as unidades e módulos deste acesso.</div>}
   </>}
   {view==='units'&&<>
    <div className="intelligence-section-heading"><div><span className="intelligence-eyebrow">Consolidado autorizado</span><h2>Gestão por unidade</h2><p>Unidades em ordem alfabética. O consolidado inclui somente as fontes habilitadas em cada unidade.</p></div></div>
    {chosen?<><label className="intelligence-field intelligence-unit-indicator">Indicador para comparar<select value={chosen.key} onChange={e=>setIndicator(e.target.value)}>{choices.map(c=><option key={c.key} value={c.key}>{labels[c.source]} · {c.metric.title}</option>)}</select></label>
     <div className="intelligence-guidance"><strong>{chosen.metric.title} · consolidado: {current.sources[chosen.source].status==='error'?'Fonte indisponível':format(chosen.metric.value,chosen.metric.unit)}</strong><p>{chosen.metric.definition}</p><p>Uma fonte indisponível ou não contratada é apresentada com seu estado; posição atual não recebe comparação retroativa.</p></div>
     <section className="intelligence-panel"><div className="intelligence-table-wrap"><table aria-label="Indicadores por unidade"><thead><tr><th>Unidade</th><th>Atual</th><th>Anterior</th><th>Variação / cobertura</th></tr></thead><tbody>{current.units.map(unit=>{const block=unit.sources[chosen.source],m=block?.metrics.find(m=>m.key===chosen.metric.key);return <tr key={unit.id}><th scope="row">{unit.name}</th><td>{block?.status==='available'&&m?format(m.value,m.unit):'—'}</td><td>{block?.status==='available'&&m?format(m.previous,m.unit):'—'}</td><td>{block?.status==='error'?'Fonte indisponível':block?.status!=='available'?'Não habilitado neste acesso/unidade':m?<Change metric={m}/>:''}</td></tr>;})}</tbody></table></div></section>
    </>:<div className="intelligence-empty">Sem fontes elegíveis para consolidar neste acesso.</div>}
   </>}
   <section className="intelligence-panel"><details><summary>Fontes, cobertura e limites desta visão</summary><ul>{current.notes.map(note=><li key={note}>{note}</li>)}</ul></details></section>
  </>}
 </div>;
}
