import {useEffect,useRef,useState} from 'react';
import {getAuthHeaders} from '../../services/apiClient';
import './intelligence.css';
const API=import.meta.env.VITE_API_URL||'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';
type Option={id:string;name:string;phone_suffix?:string};
type Details={cells_enabled?:boolean;visitor:{id:string;name:string;stage:string;journey_version:number;linked_member_id:string|null};cells:Option[];members:Option[];history:Array<{kind:string;stage:string;occurred_at:string}>};
const labels:Record<string,string>={REGISTERED:'Visita cadastrada',CONTACT_RECORDED:'Contato registrado',REFERRED:'Encaminhamento registrado',CELL_LINK_CONFIRMED:'Vínculo confirmado',ATTENDANCE_CONFIRMED:'Presença verificada',INTEGRATION_CONFIRMED:'Integração confirmada',ARCHIVED:'Jornada arquivada',STAGE_CHANGED:'Etapa revisada'};
export default function WelcomeJourneyDialog({organizationId,campusId,visitorId,initialOperation='CONTACTED_24H',onClose,onSaved}:{organizationId:string;campusId:string;visitorId:string;initialOperation?:string;onClose:()=>void;onSaved:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),[data,setData]=useState<Details|null>(null),[operation,setOperation]=useState(initialOperation),[cell,setCell]=useState(''),[member,setMember]=useState(''),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[reload,setReload]=useState(0);
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close();},[]);
 useEffect(()=>{const abort=new AbortController();setLoading(true);setError('');void(async()=>{try{
  const headers=await getAuthHeaders({'x-organization-id':organizationId});if(abort.signal.aborted)return;
  const params=new URLSearchParams({organization_id:organizationId,campus_id:campusId,search:query});
  const response=await fetch(`${API}/intelligence/welcome/visitors/${encodeURIComponent(visitorId)}/options?${params}`,{headers,signal:abort.signal});const payload=await response.json();
  if(!response.ok)throw Error(payload.message||'Não foi possível consultar a jornada.');
  if(!abort.signal.aborted){setData(payload);setMember(previous=>previous||payload.visitor.linked_member_id||'');setOperation(previous=>payload.visitor.stage==='ARCHIVED'&&!['NEW','ARCHIVED'].includes(previous)?'NEW':previous);}
 }catch(e){if(!abort.signal.aborted)setError((e as Error).message);}finally{if(!abort.signal.aborted)setLoading(false);}})();return()=>abort.abort();},[organizationId,campusId,visitorId,query,reload]);
 async function save(e:React.FormEvent){e.preventDefault();if(!data||busy)return;setBusy(true);setError('');try{
  const headers=await getAuthHeaders({'x-organization-id':organizationId});
  const body={organization_id:organizationId,campus_id:campusId,expected_version:data.visitor.journey_version,
   operation:operation==='refer'?'refer':operation==='link'?'link':'stage',stage:operation,cell_group_id:cell||undefined,member_id:member||undefined};
  const response=await fetch(`${API}/intelligence/welcome/visitors/${encodeURIComponent(visitorId)}`,{method:'POST',headers,body:JSON.stringify(body)});const payload=await response.json();
  if(!response.ok)throw Error(payload.message||'Não foi possível salvar a jornada.');onSaved();onClose();
 }catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <dialog className="intelligence-dialog" ref={dialog} aria-labelledby="welcome-dialog-title" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
  <form onSubmit={save}><header><div><span className="intelligence-eyebrow">Acolhimento</span><h2 id="welcome-dialog-title">{data?.visitor.name||'Revisar jornada'}</h2></div><button type="button" className="intelligence-button" disabled={busy} onClick={onClose} aria-label="Fechar jornada">Fechar</button></header>
  {loading&&<p role="status">Conferindo a jornada e os vínculos permitidos…</p>}
  {error&&<div className="intelligence-error" role="alert">{error}<button type="button" className="intelligence-button" disabled={busy} onClick={()=>setReload(n=>n+1)}>Recarregar dados</button></div>}
  {data&&<><label>O que deseja registrar?<select value={operation} disabled={busy} onChange={e=>setOperation(e.target.value)}>
   {data.visitor.stage!=='ARCHIVED'&&<><option value="CONTACTED_24H">Contato realizado</option>{data.cells_enabled!==false&&<><option value="refer">Encaminhamento para célula</option><option value="link">Vínculo confirmado no cadastro</option><option value="ATTENDING_CELL">Presença verificada na célula</option><option value="INTEGRATED_MEMBER">Integração confirmada</option></>}</>}<option value="ARCHIVED">Arquivar jornada</option>
   {data.visitor.stage==='ARCHIVED'&&<option value="NEW">Retomar acolhimento</option>}
  </select></label>
  {operation==='refer'&&<label>Célula da mesma unidade<select value={cell} required disabled={busy} onChange={e=>setCell(e.target.value)}><option value="">Selecione uma célula</option>{data.cells.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
  {['link','ATTENDING_CELL','INTEGRATED_MEMBER'].includes(operation)&&<>
   <p>O cadastro precisa estar ativo e vinculado à célula e unidade do visitante. Para confirmar presença ou integração, é necessário ter uma presença lançada desde a primeira visita.</p>
   <div className="intelligence-search-row"><label>Buscar cadastro na célula<input value={search} maxLength={100} disabled={busy} onChange={e=>setSearch(e.target.value)}/></label><button type="button" className="intelligence-button" disabled={busy||loading} onClick={()=>setQuery(search.trim())}>Buscar</button></div>
   <label>Cadastro vinculado<select required value={member} disabled={busy} onChange={e=>setMember(e.target.value)}><option value="">Selecione o cadastro</option>{data.visitor.linked_member_id&&!data.members.some(m=>m.id===data.visitor.linked_member_id)&&<option value={data.visitor.linked_member_id}>Cadastro já vinculado</option>}{data.members.map(m=><option key={m.id} value={m.id}>{m.name} · {m.phone_suffix?`telefone final ${m.phone_suffix}`:m.id.slice(-6)}</option>)}</select></label>
   {!data.members.length&&!data.visitor.linked_member_id&&<p role="status">Nenhum cadastro elegível foi encontrado. Confira o vínculo no módulo de membros. A lista mostra até 30 resultados por busca.</p>}
  </>}
  <p className="intelligence-guidance">Este registro não envia mensagens. Datas de marcos novos são registradas agora; a presença é conferida nos encontros existentes. Um encaminhamento não confirma participação.</p>
  <details><summary>Histórico de acompanhamento</summary>{data.history.length?<ol>{data.history.map((item,index)=><li key={index}>{labels[item.kind]||'Etapa atualizada'} · {new Date(item.occurred_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</li>)}</ol>:<p>Não há marcos anteriores verificáveis nesta medição. A etapa atual não foi transformada em histórico retroativo.</p>}</details>
  <footer><button type="button" className="intelligence-button" disabled={busy} onClick={onClose}>Cancelar</button><button className="intelligence-button intelligence-primary" disabled={busy||loading}>{busy?'Salvando…':'Salvar acompanhamento'}</button></footer></>}
  </form>
 </dialog>;
}
