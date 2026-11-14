import {getAuthHeaders} from './apiClient';
const API=import.meta.env.VITE_API_URL||'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';
export type Scope={organizationId:string;campusId:string};
export async function intelligenceRequest(scope:Scope,path:string,options:{method?:string;body?:Record<string,unknown>;signal?:AbortSignal;params?:Record<string,string>}={}){
 const headers=await getAuthHeaders({'x-organization-id':scope.organizationId});
 if(options.signal?.aborted)throw new DOMException('Cancelado','AbortError');
 const params=new URLSearchParams({...options.params,organization_id:scope.organizationId,campus_id:scope.campusId});
 const response=await fetch(`${API}${path}${path.includes('?')?'&':'?'}${params}`,{headers,method:options.method||'GET',signal:options.signal,...(options.body?{body:JSON.stringify({...options.body,organization_id:scope.organizationId,campus_id:scope.campusId})}:{})});
 const result=await response.json();if(!response.ok)throw Error(result.message||result.error||'Não foi possível concluir. Atualize os dados e tente novamente.');return result;
}
export const brl=(cents:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
export const localToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function inputCents(value:string){if(!/^\d+([.,]\d{1,2})?$/.test(value))throw Error('Informe um valor como 1250,50, sem separador de milhar.');const [a,b='']=value.replace(',','.').split('.'),n=Number(a)*100+Number(b.padEnd(2,'0'));if(!Number.isSafeInteger(n)||n<=0||n>9999999999)throw Error('Confira o valor informado.');return n;}
export async function intelligenceFile(scope:Scope,path:string,format:'pdf'|'csv',signal?:AbortSignal){
 const headers=await getAuthHeaders({'x-organization-id':scope.organizationId});const response=await fetch(`${API}${path}?${new URLSearchParams({organization_id:scope.organizationId,campus_id:scope.campusId,format})}`,{headers,signal});
 if(!response.ok){const error=await response.json();throw Error(error.message||'Arquivo indisponível. Confira suas permissões e a validade do relatório.');}
 const blob=await response.blob();if(signal?.aborted)throw new DOMException('Cancelado','AbortError');return blob;
}
