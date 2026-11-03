import { useId, useRef, useState } from 'react';
import { CommercialDialog, CommercialIcon } from './CommercialDialog';
import { currency, includedGroups, quantity, type SaasPlan } from './planPresentation';

export interface ProposalDraft {
  church_name: string; cnpj_cpf: string; contact_name: string; contact_email: string; contact_phone: string;
  plan_tier: string; billing_cycle: string; monthly_amount: string; max_members: string; max_campuses: string;
  setup_fee: string; suggested_slug: string; expires_days: string; notes: string; discount_type: string; discount_value: string;
  discount_duration_months: string; notes_commercial: string;
}
export interface CreatedProposal { id: string; token: string; proposal_url: string; }
function initialDraft(plan?: SaasPlan | null): ProposalDraft {
  const number = (value: number | null | undefined) => value == null ? '' : String(value);
  return { church_name: '', cnpj_cpf: '', contact_name: '', contact_email: '', contact_phone: '', plan_tier: plan?.id || '', billing_cycle: 'MONTHLY',
    monthly_amount: number(plan?.monthly_price), max_members: number(plan?.max_members), max_campuses: number(plan?.max_campuses), setup_fee: '0', suggested_slug: '', expires_days: '15', notes: '', discount_type: 'NONE', discount_value: '', discount_duration_months: '6', notes_commercial: '' };
}
export function ProposalComposer({ plans, initialPlan, onClose, onSubmit, onViewFunnel }: {
  plans: SaasPlan[]; initialPlan: SaasPlan | null; onClose: () => void;
  onSubmit: (draft: ProposalDraft) => Promise<CreatedProposal>; onViewFunnel: () => void;
}) {
  const uid = useId();
  const [draft, setDraft] = useState(() => initialDraft(initialPlan || plans.find(plan => plan.id === 'CONECTAR') || plans[0]));
  const initial = useRef(JSON.stringify(draft));
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<CreatedProposal | null>(null);
  const [copied, setCopied] = useState(false);
  const selected = plans.find(plan => plan.id === draft.plan_tier);
  const dirty = initial.current !== JSON.stringify(draft);
  const close = () => { if (!saving && (created || !dirty || window.confirm('Descartar os dados desta proposta? Ela ainda não foi gerada.'))) onClose(); };
  const change = (key: keyof ProposalDraft, value: string) => setDraft(previous => ({ ...previous, [key]: value }));
  const selectPlan = (id: string) => {
    const plan = plans.find(item => item.id === id); if (!plan) return;
    setDraft(previous => ({ ...previous, plan_tier: id, monthly_amount: plan.monthly_price === null ? '' : String(plan.monthly_price), max_members: plan.max_members === null ? '' : String(plan.max_members), max_campuses: plan.max_campuses === null ? '' : String(plan.max_campuses), billing_cycle: 'MONTHLY', discount_type: 'NONE', discount_value: '' }));
  };
  const base = Number(draft.monthly_amount) || 0;
  const discount = Number(draft.discount_value) || 0;
  const first = draft.discount_type === 'FIRST_FREE' ? 0 : draft.discount_type === 'NONE' ? base : Math.max(0, base - discount);
  const recurring = draft.discount_type === 'PERMANENT_DISCOUNT' ? first : base;
  const checkoutNeedsReview = Number(draft.setup_fee) > 0 || ['FIRST_MONTH_DISCOUNT', 'RECURRING_MONTHS_DISCOUNT'].includes(draft.discount_type);
  function validate(at: number) {
    if (at === 0) {
      if (!draft.church_name.trim() || !draft.contact_name.trim()) return 'Informe o nome da igreja e o responsável pela contratação.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.contact_email.trim())) return 'Informe um e-mail válido para o responsável.';
    }
    if (at === 1) {
      if (!selected) return 'Selecione um plano ativo do catálogo.';
      if (!(base > 0) || !Number.isFinite(base)) return 'Defina um valor positivo para a assinatura.';
      if (![draft.max_members, draft.max_campuses].every(value => Number.isInteger(Number(value)) && Number(value) > 0)) return 'Defina capacidades positivas para membros e unidades.';
      if (Number(draft.max_campuses) > 1 && !selected.entitlements?.['system.multicampus_enabled']) return 'Este plano permite uma unidade. Escolha uma oferta com gestão de várias unidades.';
      if (['CONECTAR', 'CUIDAR', 'GESTAO'].includes(selected.id) && (Number(draft.max_members) > 1500 || Number(draft.max_campuses) > 5)) return 'Acima de 1.500 membros ou cinco unidades, selecione Enterprise.';
      if (!Number.isFinite(Number(draft.setup_fee)) || Number(draft.setup_fee) < 0) return 'A implantação deve ter um valor válido, igual ou maior que zero.';
      if (!Number.isInteger(Number(draft.expires_days)) || Number(draft.expires_days) < 1) return 'Informe uma validade em dias, maior que zero.';
      if (draft.discount_type === 'RECURRING_MONTHS_DISCOUNT' && (!Number.isInteger(Number(draft.discount_duration_months)) || Number(draft.discount_duration_months) < 1)) return 'Informe uma duração positiva, em meses, para o desconto temporário.';
      if (draft.discount_type !== 'NONE' && draft.discount_type !== 'FIRST_FREE' && (!Number.isFinite(discount) || discount <= 0 || discount >= base)) return 'O desconto deve ser positivo e menor que o valor da assinatura.';
    }
    return '';
  }
  function next() { const message = validate(step); if (message) { setError(message); return; } setError(''); setStep(previous => Math.min(2, previous + 1)); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (saving || created) return;
    if (step < 2) { next(); return; }
    for (const at of [0, 1]) { const message = validate(at); if (message) { setStep(at); setError(message); return; } }
    setSaving(true); setError('');
    try { setCreated(await onSubmit({ ...draft, church_name: draft.church_name.trim(), contact_name: draft.contact_name.trim(), contact_email: draft.contact_email.trim() })); }
    catch (err) { setError((err as Error).message || 'Não foi possível gerar a proposta. Seus dados foram mantidos.'); }
    finally { setSaving(false); }
  }
  const field = (key: keyof ProposalDraft, label: string, type = 'text', hint?: string) => <label className="cp-field" htmlFor={`${uid}-${key}`}><span>{label}</span><input id={`${uid}-${key}`} data-autofocus={key === 'church_name' ? true : undefined} value={draft[key]} type={type} min={type === 'number' ? key === 'setup_fee' ? '0' : '1' : undefined} step={type === 'number' ? ['monthly_amount', 'setup_fee', 'discount_value'].includes(key) ? '.01' : '1' : undefined} disabled={saving} onChange={event => change(key, event.target.value)} />{hint && <small>{hint}</small>}</label>;
  const safeUrl = created && /^https?:\/\//.test(created.proposal_url) ? created.proposal_url : '';
  return <CommercialDialog titleId={`${uid}-title`} onClose={close} className="cp-composer">
    <header className="cp-dialog-header"><div><span className="cp-eyebrow">CONTRATAÇÃO</span><h2 id={`${uid}-title`}>{created ? 'Sua proposta está pronta' : 'Nova proposta comercial'}</h2><p>{created ? 'Copie o link e compartilhe com o responsável pela igreja.' : 'Da escolha do plano ao link de contratação, em três etapas.'}</p></div><button type="button" className="cp-icon-button" aria-label="Fechar proposta" disabled={saving} onClick={close}><CommercialIcon name="close" /></button></header>
    {created ? <><div className="cp-proposal-success"><span className="cp-success-symbol"><CommercialIcon name="check" /></span><h3>Pronta para {draft.church_name}</h3><p>{selected?.name} · {currency(recurring)} por {draft.billing_cycle === 'YEARLY' ? 'ano' : 'mês'}</p><label className="cp-field"><span>Link de contratação</span><div className="cp-copy-link"><input aria-label="Link de contratação" readOnly value={safeUrl} onFocus={event => event.target.select()} /><button type="button" className="cp-button cp-button-primary" disabled={!safeUrl} onClick={() => { void navigator.clipboard.writeText(safeUrl).then(() => setCopied(true)).catch(() => setError('Selecione o link para copiá-lo manualmente.')); }}><CommercialIcon name="copy" />{copied ? 'Copiado' : 'Copiar link'}</button></div></label><p className="cp-muted">A proposta está no funil para você acompanhar a contratação.</p>{error && <p role="alert" className="cp-feedback cp-feedback-error">{error}</p>}</div><footer className="cp-dialog-footer"><button type="button" className="cp-text-button" onClick={onViewFunnel}>Ver no funil<CommercialIcon name="arrow" /></button><div><button type="button" className="cp-button cp-button-secondary" onClick={onClose}>Concluir</button>{safeUrl && <a className="cp-button cp-button-primary" href={safeUrl} target="_blank" rel="noreferrer">Abrir proposta<CommercialIcon name="arrow" /></a>}</div></footer></> : <form noValidate onSubmit={submit} className="cp-editor-form">
      <ol className="cp-proposal-steps">{['Igreja e contato', 'Plano e condições', 'Revisar e gerar'].map((label, at) => <li key={label} className={step === at ? 'is-current' : step > at ? 'is-complete' : ''}><span>{step > at ? <CommercialIcon name="check" /> : at + 1}</span><strong>{label}</strong></li>)}</ol>
      <div className="cp-editor-layout"><div className="cp-editor-content cp-composer-content">
        {step === 0 && <><div className="cp-section-title"><div><h3>Quem vai contratar?</h3><p>Preencha os dados da igreja e de quem receberá a proposta.</p></div></div>{field('church_name', 'Nome da igreja')}
          <div className="cp-form-grid">{field('contact_name', 'Responsável pela contratação')}{field('contact_email', 'E-mail do responsável', 'email')}{field('contact_phone', 'WhatsApp', 'tel')}{field('cnpj_cpf', 'CPF ou CNPJ', 'text', 'Necessário para iniciar o pagamento online.')}</div></>}
        {step === 1 && <><div className="cp-section-title"><div><h3>A oferta para esta igreja</h3><p>O plano preenche os valores e os limites. Ajuste somente o que foi negociado.</p></div></div><label className="cp-field"><span>Plano do catálogo</span><select value={draft.plan_tier} disabled={saving} onChange={event => selectPlan(event.target.value)}><option value="" disabled>Selecione um plano</option>{plans.map(plan => <option value={plan.id} key={plan.id}>{plan.name} · {plan.monthly_price === null ? 'Sob proposta' : `${currency(plan.monthly_price)}/mês`}</option>)}</select></label>
          <div className="cp-form-grid">{field('monthly_amount', draft.billing_cycle === 'YEARLY' ? 'Valor anual negociado · R$' : 'Mensalidade negociada · R$', 'number')}<label className="cp-field"><span>Ciclo de cobrança</span><select value={draft.billing_cycle} disabled={saving} onChange={event => { const yearly = event.target.value === 'YEARLY'; setDraft(previous => ({ ...previous, billing_cycle: event.target.value, discount_type: 'NONE', discount_value: '', monthly_amount: String(yearly ? selected?.yearly_price || '' : selected?.monthly_price || '') })); }}><option value="MONTHLY">Mensal</option>{selected?.yearly_price != null && <option value="YEARLY">Anual contratado</option>}</select></label>{field('max_members', 'Membros ativos no total', 'number')}{field('max_campuses', 'Unidades, incluindo a sede', 'number')}</div><div className="cp-inline-note">A capacidade é compartilhada entre as unidades da organização.</div>
          <details className="cp-advanced"><summary>Implantação, validade e condições especiais</summary><div className="cp-form-grid">{field('setup_fee', 'Serviço de implantação · R$', 'number')}{field('expires_days', 'Validade da proposta · dias', 'number')}</div><label className="cp-field"><span>Condição comercial</span><select value={draft.discount_type} onChange={event => change('discount_type', event.target.value)}><option value="NONE">Preço negociado, sem desconto adicional</option>{draft.billing_cycle === 'MONTHLY' && <option value="FIRST_FREE">Primeira mensalidade gratuita · 30 dias</option>}<option value="PERMANENT_DISCOUNT">Desconto recorrente</option><option value="FIRST_MONTH_DISCOUNT">Desconto na primeira mensalidade</option><option value="RECURRING_MONTHS_DISCOUNT">Desconto temporário</option></select></label>{!['NONE', 'FIRST_FREE'].includes(draft.discount_type) && field('discount_value', 'Desconto por ciclo · R$', 'number')}{draft.discount_type === 'RECURRING_MONTHS_DISCOUNT' && field('discount_duration_months', 'Duração do desconto · meses', 'number')}{field('notes_commercial', 'Condições comerciais adicionais')}{field('suggested_slug', 'Endereço sugerido do aplicativo', 'text', 'Opcional. Será conferido na criação do ambiente.')}</details>
          {checkoutNeedsReview && <div className="cp-inline-note cp-inline-note-amber">Esta condição precisa de tratamento de cobrança antes do checkout recorrente. A implantação não é cobrada automaticamente junto com a assinatura.</div>}</>}
        {step === 2 && <><div className="cp-section-title"><div><h3>Confira antes de gerar</h3><p>O link será criado com estas condições e os módulos do plano selecionado.</p></div></div><section className="cp-review-block"><div><h4>Igreja e responsável</h4><button type="button" className="cp-text-button" onClick={() => { setStep(0); setError(''); }}>Editar<CommercialIcon name="edit" /></button></div><strong>{draft.church_name}</strong><p>{draft.contact_name} · {draft.contact_email}</p>{draft.contact_phone && <p>{draft.contact_phone}</p>}<small>{draft.cnpj_cpf ? `CPF/CNPJ: ${draft.cnpj_cpf}` : 'CPF/CNPJ pendente para o pagamento online.'}</small></section><section className="cp-review-block"><div><h4>Condições comerciais</h4><button type="button" className="cp-text-button" onClick={() => { setStep(1); setError(''); }}>Editar<CommercialIcon name="edit" /></button></div><dl className="cp-review-values"><div><dt>Plano</dt><dd>{selected?.name}</dd></div><div><dt>Primeiro ciclo</dt><dd>{currency(first)}</dd></div><div><dt>Recorrência</dt><dd>{currency(recurring)}/{draft.billing_cycle === 'YEARLY' ? 'ano' : 'mês'}</dd></div><div><dt>Capacidade total</dt><dd>{quantity(Number(draft.max_members))} membros · {draft.max_campuses} unidade(s)</dd></div><div><dt>Implantação</dt><dd>{Number(draft.setup_fee) > 0 ? `${currency(Number(draft.setup_fee))} · cobrança a combinar` : 'Sem valor de serviço nesta proposta'}</dd></div><div><dt>Validade</dt><dd>{draft.expires_days} dias</dd></div></dl>{draft.discount_type === 'FIRST_FREE' && <p className="cp-inline-note">Primeiro vencimento após 30 dias. A ativação do ambiente segue a confirmação do provedor.</p>}{draft.discount_type === 'RECURRING_MONTHS_DISCOUNT' && <p className="cp-inline-note">{currency(discount)} de desconto por ciclo durante {draft.discount_duration_months} meses.</p>}{draft.notes_commercial && <p>{draft.notes_commercial}</p>}{checkoutNeedsReview && <p className="cp-inline-note cp-inline-note-amber">Revise a forma de cobrança desta condição antes de encaminhar para pagamento recorrente.</p>}</section><label className="cp-field"><span>Observações para a proposta</span><textarea rows={3} value={draft.notes} onChange={event => change('notes', event.target.value)} placeholder="Informações complementares que a igreja precisa conhecer." /></label></>}
        {error && <div className="cp-feedback cp-feedback-error" role="alert">{error}</div>}
      </div><aside className="cp-editor-preview"><span className="cp-eyebrow">RESUMO DA OFERTA</span><div className="cp-preview-card"><h3>{selected?.name || 'Selecione um plano'}</h3><div className="cp-preview-price">{base > 0 ? currency(recurring) : 'A definir'}{base > 0 && <small>/{draft.billing_cycle === 'YEARLY' ? 'ano' : 'mês'}</small>}</div><div className="cp-preview-limits"><span>{Number(draft.max_members) > 0 ? `${quantity(Number(draft.max_members))} membros no total` : 'Membros a definir'}</span><span>{Number(draft.max_campuses) > 0 ? `${draft.max_campuses} unidade(s)` : 'Unidades a definir'}</span></div><strong className="cp-preview-caption">Incluído na contratação</strong><div className="cp-scope-chips">{selected && includedGroups(selected).map(group => <span key={group.key}>{group.name}</span>)}</div></div><p className="cp-preview-note">Os módulos vêm do catálogo. Editar textos ou valores da proposta não libera módulos adicionais.</p></aside></div>
      <footer className="cp-dialog-footer"><span className="cp-save-status">Etapa {step + 1} de 3</span><div><button type="button" className="cp-button cp-button-secondary" disabled={saving} onClick={step === 0 ? close : () => { setStep(previous => previous - 1); setError(''); }}>{step === 0 ? 'Cancelar' : 'Voltar'}</button><button type="submit" className="cp-button cp-button-primary" disabled={saving}>{saving ? 'Gerando proposta…' : step === 2 ? 'Gerar link da proposta' : 'Continuar'}<CommercialIcon name="arrow" /></button></div></footer>
    </form>}
  </CommercialDialog>;
}
