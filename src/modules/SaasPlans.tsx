import { useCallback, useEffect, useState } from 'react';
import { getAuthHeaders } from '../services/apiClient';
import { CommercialDialog, CommercialIcon } from '../components/commercial/CommercialDialog';
import { PlanEditor } from '../components/commercial/PlanEditor';
import { currency, groupKeys, includedGroups, LABELS, MODULE_GROUPS, planHighlights, quantity, type SaasPlan } from '../components/commercial/planPresentation';
import '../components/commercial/commercial.css';
export type { SaasPlan } from '../components/commercial/planPresentation';
const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

function errorMessage(data: { message?: string; error?: string }, status: number) {
  if (status === 401) return 'Sua sessão expirou. Entre novamente para salvar as alterações.';
  if (status === 403) return 'Esta ação exige uma conta com acesso Master.';
  const raw = data.message || data.error || '';
  if (raw.includes('DEPENDENCY')) return 'Revise os módulos selecionados: um recurso depende de outro módulo que foi desmarcado.';
  if (raw.includes('ENTITLEMENT')) return 'A matriz deste plano precisa ser atualizada. Recarregue o catálogo e tente novamente.';
  return raw || 'Não foi possível concluir a operação. Tente novamente.';
}
interface Props { onCreateProposal?: (plan: SaasPlan) => void; onPlansChange?: (plans: SaasPlan[]) => void; }
export function SaasPlans({ onCreateProposal, onPlansChange }: Props) {
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState<'cards' | 'compare'>('cards');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editor, setEditor] = useState<{ plan: SaasPlan; editing: boolean } | null>(null);
  const [details, setDetails] = useState<SaasPlan | null>(null);
  const [archiving, setArchiving] = useState(false);
  const notify = useCallback((next: SaasPlan[]) => { setPlans(next); onPlansChange?.(next.filter(plan => plan.status !== 'INACTIVE')); }, [onPlansChange]);
  const load = useCallback(async () => {
    const response = await fetch(`${API_URL}/saas-plans?include_legacy=true`, { headers: await getAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(errorMessage(data, response.status));
    if (!Array.isArray(data)) throw new Error('O catálogo retornou um formato inesperado. Tente recarregar.');
    notify(data.filter((plan: SaasPlan) => plan.entitlements && typeof plan.entitlements === 'object'));
  }, [notify]);
  useEffect(() => { let active = true; setLoading(true); void load().catch(err => { if (active) setError((err as Error).message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [load]);
  useEffect(() => { if (!success) return; const timer = window.setTimeout(() => setSuccess(''), 6000); return () => window.clearTimeout(timer); }, [success]);
  const refresh = () => { setError(''); setLoading(true); void load().catch(err => setError((err as Error).message)).finally(() => setLoading(false)); };
  async function save(plan: SaasPlan) {
    const response = await fetch(`${API_URL}/saas-plans`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(plan) });
    const data = await response.json();
    if (!response.ok) throw new Error(errorMessage(data, response.status));
    notify(plans.some(item => item.id === plan.id) ? plans.map(item => item.id === plan.id ? plan : item) : [...plans, plan]);
    setEditor(null); setSuccess(`${plan.name} salvo. O catálogo está pronto para novas propostas.`); setError('');
    void load().catch(() => setError('O plano foi salvo. Recarregue para conferir a versão mais recente do catálogo.'));
  }
  async function archive(plan: SaasPlan) {
    if (!window.confirm(`Retirar ${plan.name} das novas propostas? Os contratos existentes serão mantidos.`)) return;
    setArchiving(true); setError('');
    try {
      const response = await fetch(`${API_URL}/saas-plans/${encodeURIComponent(plan.id)}`, { method: 'DELETE', headers: await getAuthHeaders() });
      const data = await response.json(); if (!response.ok) throw new Error(errorMessage(data, response.status));
      notify(plans.map(item => item.id === plan.id ? { ...item, status: 'INACTIVE' } : item)); setDetails(null); setSuccess(`${plan.name} foi arquivado para novas propostas.`);
    } catch (err) { setError((err as Error).message); } finally { setArchiving(false); }
  }
  const visible = plans.filter(plan => includeArchived || plan.status !== 'INACTIVE');
  const activeCount = plans.filter(plan => plan.status !== 'INACTIVE').length;
  const defaultTemplate = plans.find(plan => plan.id === 'CONECTAR') || plans[0];
  const propose = (plan: SaasPlan) => { setDetails(null); onCreateProposal?.(plan); };
  const price = (plan: SaasPlan) => <>{plan.monthly_price === null ? <span className="cp-price-consult">Sob proposta</span> : <><span>{currency(plan.monthly_price)}</span><small>/mês</small></>}</>;
  return <section className="commercial-plans" aria-labelledby="cp-catalog-title">
    <div className="cp-catalog-heading"><div><span className="cp-eyebrow">CATÁLOGO COMERCIAL</span><h1 id="cp-catalog-title">Planos e preços Faith Hubs</h1><p>Compare os planos, ajuste a oferta e comece a contratação em um só lugar.</p></div><button type="button" className="cp-button cp-button-primary" disabled={!defaultTemplate || loading} onClick={() => setEditor({ plan: defaultTemplate, editing: false })}><CommercialIcon name="plus" />Novo plano</button></div>
    <div className="cp-catalog-toolbar"><div className="cp-view-switch" role="group" aria-label="Visualização do catálogo"><button type="button" aria-pressed={view === 'cards'} className={view === 'cards' ? 'is-active' : ''} onClick={() => setView('cards')}><CommercialIcon name="grid" />Planos <span>{activeCount}</span></button><button type="button" aria-pressed={view === 'compare'} className={view === 'compare' ? 'is-active' : ''} onClick={() => setView('compare')}><CommercialIcon name="compare" />Comparar módulos</button></div><label className="cp-archive-filter"><input type="checkbox" checked={includeArchived} onChange={event => setIncludeArchived(event.target.checked)} />Mostrar arquivados</label></div>
    {success && <div className="cp-feedback cp-feedback-success" role="status"><CommercialIcon name="check" /><span>{success}</span><button type="button" aria-label="Fechar mensagem" className="cp-icon-button" onClick={() => setSuccess('')}><CommercialIcon name="close" /></button></div>}
    {error && <div className="cp-feedback cp-feedback-error" role="alert"><span>{error}</span><button type="button" className="cp-text-button" onClick={refresh}>Recarregar</button></div>}
    {loading ? <div className="cp-plan-grid" aria-busy="true" aria-label="Carregando catálogo">{Array.from({ length: 4 }, (_, index) => <div key={index} className="cp-plan-skeleton"><span /><strong /><span /><span /></div>)}</div> : !visible.length ? <div className="cp-empty"><CommercialIcon name="grid" /><h2>{plans.length ? 'Nenhum plano ativo no momento' : 'O catálogo ainda está vazio'}</h2><p>{plans.length ? 'Mostre os arquivados para editar e disponibilizar uma oferta novamente.' : 'Cadastre a matriz inicial dos planos para começar.'}</p>{plans.length > 0 && <button type="button" className="cp-button cp-button-secondary" onClick={() => setIncludeArchived(true)}>Ver planos arquivados</button>}</div> : view === 'cards' ? <div className="cp-plan-grid">{visible.map((plan, index) => <article key={plan.id} className={`cp-plan-card ${plan.is_popular ? 'is-featured' : ''} ${plan.status === 'INACTIVE' ? 'is-archived' : ''}`} aria-label={`Plano ${plan.name}`}>
      <div className="cp-plan-card-top"><span className={`cp-tier-symbol cp-tier-${index % 4}`}><CommercialIcon name={plan.requires_proposal ? 'building' : index === 0 ? 'users' : 'grid'} /></span>{plan.status === 'INACTIVE' ? <span className="cp-badge cp-badge-neutral">Arquivado</span> : plan.badge_text ? <span className="cp-badge">{plan.badge_text}</span> : <span className="cp-plan-type">{plan.requires_proposal ? 'Oferta personalizada' : 'Assinatura mensal'}</span>}</div>
      <div className="cp-plan-identity"><h2>{plan.name}</h2><p>{plan.description}</p></div><div className="cp-plan-price">{price(plan)}</div>
      <div className="cp-plan-capacity"><div><CommercialIcon name="users" /><span><strong>{plan.max_members === null ? 'A definir' : quantity(plan.max_members)}</strong><small>membros no total</small></span></div><div><CommercialIcon name="building" /><span><strong>{plan.max_campuses === null ? 'A definir' : `${plan.max_campuses} ${plan.max_campuses === 1 ? 'unidade' : 'unidades'}`}</strong><small>incluindo a sede</small></span></div></div>
      <div className="cp-plan-scope"><span className="cp-list-caption">DESTAQUES DO PLANO</span><ul>{planHighlights(plan).map(group => <li key={group.key}><CommercialIcon name="check" /><span>{group.name}</span></li>)}</ul><button type="button" className="cp-text-button" onClick={() => setDetails(plan)}>Ver todos os módulos<CommercialIcon name="arrow" /></button></div>
      <footer className="cp-card-actions"><button type="button" className="cp-button cp-button-secondary" onClick={() => setEditor({ plan, editing: true })}><CommercialIcon name="edit" />Editar plano</button><button type="button" className="cp-button cp-button-primary" disabled={!onCreateProposal || plan.status === 'INACTIVE'} onClick={() => propose(plan)}>Gerar proposta<CommercialIcon name="arrow" /></button></footer>
    </article>)}</div> : <div className="cp-comparison-wrap" tabIndex={0} role="region" aria-label="Comparação de módulos dos planos"><table className="cp-comparison"><caption className="cp-visually-hidden">Módulos incluídos em cada plano comercial</caption><thead><tr><th scope="col">Encontre a oferta certa<small>Os limites são da organização.</small></th>{visible.map(plan => <th scope="col" key={plan.id}><span className="cp-comparison-name">{plan.name}</span><span className="cp-comparison-price">{price(plan)}</span><button type="button" className="cp-text-button" onClick={() => setEditor({ plan, editing: true })}>Editar plano<CommercialIcon name="edit" /></button></th>)}</tr></thead><tbody><tr><th scope="row">Membros ativos no total</th>{visible.map(plan => <td key={plan.id}>{plan.max_members === null ? 'Sob proposta' : quantity(plan.max_members)}</td>)}</tr><tr><th scope="row">Unidades, incluindo a sede</th>{visible.map(plan => <td key={plan.id}>{plan.max_campuses === null ? 'Sob proposta' : plan.max_campuses}</td>)}</tr>{MODULE_GROUPS.map(group => <tr key={group.key}><th scope="row">{group.name}</th>{visible.map(plan => { const count = groupKeys(group, plan.entitlements || {}).filter(key => plan.entitlements?.[key]).length; return <td key={plan.id}>{count ? <span className="cp-comparison-included"><CommercialIcon name="check" />{count} {count === 1 ? 'recurso' : 'recursos'}</span> : <span className="cp-comparison-excluded" aria-label="Não incluído">—</span>}</td>; })}</tr>)}</tbody><tfoot><tr><th scope="row">Próximo passo</th>{visible.map(plan => <td key={plan.id}><button type="button" className="cp-button cp-button-primary" disabled={!onCreateProposal || plan.status === 'INACTIVE'} onClick={() => propose(plan)}>Gerar proposta</button></td>)}</tr></tfoot></table></div>}
    <div className="cp-catalog-notes"><p><CommercialIcon name="check" /><span><strong>Condições preservadas.</strong> Mudanças no catálogo valem para novas propostas. Contratos emitidos mantêm o que foi acordado.</span></p><details><summary>Capacidade, teste e implantação<CommercialIcon name="chevron" /></summary><div><p>Os membros ativos são somados entre as unidades. A capacidade não tem uma cota fixa por unidade.</p><p>O teste assistido utiliza Cuidar por 14 dias, uma unidade e até 300 membros. O prazo começa com o ambiente pronto e os acessos entregues, sem cartão ou cobrança automática.</p><p>Configuração assistida, migração e treinamentos adicionais são definidos na proposta de serviços.</p></div></details></div>
    {editor && <PlanEditor key={`${editor.plan.id}-${editor.editing}`} plan={editor.plan} editing={editor.editing} templates={plans} onClose={() => setEditor(null)} onSave={save} />}
    {details && <CommercialDialog titleId="cp-details-title" onClose={() => { if (!archiving) setDetails(null); }} className="cp-details"><header className="cp-dialog-header"><div><span className="cp-eyebrow">CONHEÇA A OFERTA</span><h2 id="cp-details-title">{details.name}</h2><p>{details.description}</p></div><button type="button" className="cp-icon-button" aria-label="Fechar detalhes" disabled={archiving} onClick={() => setDetails(null)}><CommercialIcon name="close" /></button></header><div className="cp-details-body"><div className="cp-details-summary"><div className="cp-plan-price">{price(details)}</div><p>{details.max_members === null ? 'Capacidade a definir na proposta' : `Até ${quantity(details.max_members)} membros ativos na organização`} · {details.max_campuses === null ? 'Unidades sob proposta' : `${details.max_campuses} unidade(s), incluindo a sede`}</p>{details.yearly_price !== null && <small>Anuidade definida: {currency(details.yearly_price)}</small>}</div>{error && <div className="cp-feedback cp-feedback-error" role="alert">{error}</div>}<h3>Recursos por área</h3><div className="cp-details-modules">{includedGroups(details).map(group => <section key={group.key}><h4><CommercialIcon name="check" />{group.name}</h4><ul>{groupKeys(group, details.entitlements || {}).filter(key => details.entitlements?.[key]).map(key => <li key={key}>{LABELS[key] || 'Recurso complementar'}</li>)}</ul></section>)}</div><details className="cp-advanced"><summary>Textos usados na proposta</summary><ul className="cp-proposal-benefits">{details.features?.map((feature, index) => <li key={index}>{feature}</li>)}</ul></details></div><footer className="cp-dialog-footer"><div className="cp-detail-management"><button type="button" className="cp-text-button" disabled={archiving} onClick={() => { setEditor({ plan: details, editing: false }); setDetails(null); }}><CommercialIcon name="copy" />Duplicar</button>{details.status !== 'INACTIVE' && <button type="button" className="cp-text-button cp-text-danger" disabled={archiving} onClick={() => void archive(details)}>{archiving ? 'Arquivando…' : 'Arquivar'}</button>}</div><div><button type="button" className="cp-button cp-button-secondary" disabled={archiving} onClick={() => { setEditor({ plan: details, editing: true }); setDetails(null); }}><CommercialIcon name="edit" />Editar plano</button><button type="button" className="cp-button cp-button-primary" disabled={archiving || !onCreateProposal || details.status === 'INACTIVE'} onClick={() => propose(details)}>Gerar proposta<CommercialIcon name="arrow" /></button></div></footer></CommercialDialog>}
  </section>;
}
