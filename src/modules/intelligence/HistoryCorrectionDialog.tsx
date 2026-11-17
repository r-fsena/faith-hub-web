import {useEffect,useRef,useState} from 'react';
import {intelligenceRequest} from '../../services/intelligenceApi';
import type {Scope} from '../../services/intelligenceApi';
type Row=Record<string,any>;
const when=(s:string)=>new Date(s).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'});
const localValue=(s:string)=>{
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(s)).map(p=>[p.type,p.value]));
 return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
};
// Covered dates are modern dates in Brasília (UTC-03). Preserve the server's
// microseconds verbatim unless the operator explicitly edits the wall time.
const instant=(v:string)=>new Date(`${v}-03:00`).toISOString();
function state(r:Row,prefix:string,options:Row){
 if(prefix==='before'&&['BASELINE','CREATED'].includes(r.kind)||prefix==='after'&&r.kind==='REMOVED')return 'Sem cadastro';
 const raw=r[`${prefix}_status`],campus=r[`${prefix}_campus_id`],cell=r[`${prefix}_cell_id`];
 const labels:Record<string,string>={ACTIVE:'Ativo',ATIVO:'Ativo',INACTIVE:'Inativo',INATIVO:'Inativo',PENDING:'Pendente',PENDENTE:'Pendente'};
 return [labels[String(raw).toUpperCase()]||raw||'Sem estado',options.campuses.find((c:Row)=>c.id===campus)?.name||(campus?`Unidade …${campus.slice(-8)}`:'Sede padrão'),options.cells.find((c:Row)=>c.id===cell)?.name||(cell?`Célula …${cell.slice(-8)}`:'Sem célula')].join(' · ');
}
export default function HistoryCorrectionDialog({scope,eventId,onClose,onSaved}:{scope:Scope;eventId:string;onClose:()=>void;onSaved:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),[data,setData]=useState<Row|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[page,setPage]=useState(0);
 const initialized=useRef(false),[requestId]=useState(()=>crypto.randomUUID()),[effective,setEffective]=useState(''),[status,setStatus]=useState(''),[campus,setCampus]=useState(''),[cell,setCell]=useState(''),[reason,setReason]=useState(''),[review,setReview]=useState(false);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 useEffect(()=>{const abort=new AbortController();setLoading(true);setError('');void intelligenceRequest(scope,`/intelligence/history/${eventId}/corrections`,{params:{page:String(page)},signal:abort.signal}).then(r=>{
  if(abort.signal.aborted)return;
  // Paging revisions must not silently advance the optimistic version beneath
  // an existing draft. A concurrent correction is rejected on save instead.
  setData(previous=>previous?{...previous,revisions:r.revisions,has_more:r.has_more,page:r.page}:r);
  if(!initialized.current){initialized.current=true;setEffective(localValue(r.event.occurred_at));setStatus(r.event.after_status||'');setCampus(r.event.after_campus_id||'');setCell(r.event.after_cell_id||'');}
 }).catch(e=>{if(!abort.signal.aborted)setError(e.message);}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});return()=>abort.abort();},[scope.organizationId,scope.campusId,eventId,page]);
 async function save(e:React.FormEvent){e.preventDefault();if(!data||busy)return;if(!review){setReview(true);return;}setBusy(true);setError('');try{
  const h=data.event;await intelligenceRequest(scope,`/intelligence/history/${eventId}/corrections`,{method:'POST',body:{request_id:requestId,generation:h.generation,expected_version:Number(h.correction_version),expected_revision:data.revision,
   effective_at:effective===localValue(h.occurred_at)?h.occurred_at:instant(effective),after_status:h.kind==='REMOVED'?null:status,after_campus_id:h.kind==='REMOVED'?null:campus||null,after_cell_id:h.kind==='REMOVED'?null:cell||null,reason}});
  onSaved();
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 const h=data?.event,editable=!!h&&data?.correction_allowed===true;
 return <dialog ref={dialog} className="foundation-dialog" aria-labelledby="history-correction-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}><form onSubmit={save}>
  <header><h2 id="history-correction-title">Revisão histórica</h2><button type="button" className="intelligence-button" disabled={busy} onClick={onClose}>Fechar</button></header>
  {error&&<div className="intelligence-error" role="alert">{error}<p>Em conflito de versão, feche esta janela e atualize o histórico antes de revisar novamente.</p></div>}
  {loading&&<p role="status">Consultando observação e revisões preservadas…</p>}
  {data&&!loading&&<>
   <section className="intelligence-guidance"><strong>Observação original preservada</strong><p>Registrada em {when(data.original.occurred_at)}.</p><p>Antes: {state(data.original,'before',data)}</p><p>Depois: {state(data.original,'after',data)}</p><p>Versão deste registro: {Number(h!.correction_version)}. Revisão dos indicadores: {data.revision}.</p></section>
   <p>A revisão corrige a vigência e o estado históricos. Ela preserva o cadastro atual e suas permissões. Datas anteriores à cobertura e inversão da ordem dos fatos são recusadas.</p>
   {editable?<><fieldset disabled={busy||review}>
    <label>Data e horário efetivos · Brasília<input autoFocus type="datetime-local" step="1" required max={localValue(h!.observed_at)} value={effective} onChange={e=>setEffective(e.target.value)}/></label>
    {h!.kind!=='REMOVED'&&<>
     <label>Situação histórica<select required value={status} onChange={e=>setStatus(e.target.value)}>{[...new Set([status,'ACTIVE','INACTIVE','PENDING'])].filter(Boolean).map(s=><option key={s} value={s}>{({ACTIVE:'Ativo',INACTIVE:'Inativo',PENDING:'Pendente'} as Record<string,string>)[s]||s}</option>)}</select></label>
     <label>Unidade histórica<select value={campus} onChange={e=>{setCampus(e.target.value);setCell('');}}><option value="" disabled={h!.after_campus_id!==null}>Sede padrão · registro legado</option>{campus&&!data.campuses.some((c:Row)=>c.id===campus)&&<option value={campus}>Referência histórica …{campus.slice(-8)}</option>}{data.campuses.map((c:Row)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
     {data.campuses_truncated&&<p>A lista de unidades está limitada às primeiras 200 referências.</p>}
     <label>Célula histórica<select value={cell} onChange={e=>setCell(e.target.value)}><option value="">Sem célula</option>{cell&&!data.cells.some((c:Row)=>c.id===cell)&&<option value={cell}>Referência histórica …{cell.slice(-8)}</option>}{data.cells.filter((c:Row)=>c.campus_id===(campus||'campus_sede')).map((c:Row)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
     {data.cells_truncated&&<p>A lista de células está limitada às primeiras 500 referências. Uma referência histórica preservada continua disponível.</p>}
    </>}
    <label>Justificativa da correção<textarea required minLength={10} maxLength={500} rows={3} value={reason} onChange={e=>setReason(e.target.value)}/></label>
   </fieldset>
   {review&&<section className="intelligence-guidance" aria-live="polite"><strong>Conferir antes de registrar</strong><p>Vigência: {effective.replace('T',' ')} · Brasília.</p>{h!.kind!=='REMOVED'&&<p>{status} · {data.campuses.find((c:Row)=>c.id===campus)?.name||'Sede padrão'} · {data.cells.find((c:Row)=>c.id===cell)?.name||(cell?'Referência histórica':'Sem célula')}.</p>}<p>Motivo: {reason}</p><p>Os indicadores históricos e a elegibilidade dos encontros serão recalculados na próxima consulta. Relatórios já gerados preservam sua revisão.</p></section>}
   <footer><button type="button" className="intelligence-button" disabled={busy} onClick={()=>review?setReview(false):onClose()}>{review?'Voltar à edição':'Cancelar'}</button><button className="intelligence-button intelligence-primary" disabled={busy}>{busy?'Registrando…':review?'Confirmar revisão histórica':'Conferir revisão'}</button></footer></>:<p>{h!.kind==='BASELINE'?'A linha de base é imutável. Ela registra apenas a posição observada na ativação.':'A cobertura deste registro não está ativa para novas correções. As observações e revisões anteriores permanecem preservadas.'}</p>}
   <section className="intelligence-panel"><h3>Revisões preservadas</h3>{!data.revisions.length?<p>Nenhuma correção registrada.</p>:data.revisions.map((r:Row)=><article key={r.id}><strong>Versão {r.event_version} · revisão {r.revision}</strong><p>Registrada em {when(r.recorded_at)} · vigência em {when(r.effective_at)}.</p><p>{state({...r,kind:h!.kind},'after',data)}</p><p>Justificativa: {r.reason}</p></article>)}<div className="intelligence-inline-actions"><button type="button" className="intelligence-button" disabled={!page||busy} onClick={()=>{setReview(false);setPage(p=>p-1);}}>Anteriores</button><span>Página {page+1}</span><button type="button" className="intelligence-button" disabled={!data.has_more||busy} onClick={()=>{setReview(false);setPage(p=>p+1);}}>Mais revisões</button></div></section>
  </>}
 </form></dialog>;
}
