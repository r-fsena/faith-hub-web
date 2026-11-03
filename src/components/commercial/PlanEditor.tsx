import { useId, useRef, useState } from 'react';
import { CommercialDialog, CommercialIcon } from './CommercialDialog';
import { currency, groupKeys, includedGroups, LABELS, MODULE_GROUPS, quantity, toggleEntitlement, UNAVAILABLE, type SaasPlan } from './planPresentation';

interface Draft {
  id: string; name: string; description: string; monthly_price: string; yearly_price: string;
  max_members: string; max_campuses: string; badge_text: string; is_popular: boolean;
  requires_proposal: boolean; features: string[]; entitlements: Record<string, boolean>; status: string;
}
function draftOf(plan: SaasPlan, editing: boolean): Draft {
  const text = (value: number | null | undefined) => value == null ? '' : String(value);
  return { id: editing ? plan.id : '', name: editing ? plan.name : '', description: plan.description || '',
    monthly_price: text(plan.monthly_price), yearly_price: text(plan.yearly_price), max_members: text(plan.max_members), max_campuses: text(plan.max_campuses),
    badge_text: editing ? plan.badge_text || '' : '', is_popular: editing && Boolean(plan.is_popular), requires_proposal: Boolean(plan.requires_proposal),
    features: [...(plan.features || [])], entitlements: { ...plan.entitlements }, status: editing ? plan.status || 'ACTIVE' : 'ACTIVE' };
}
const tabs = [{ id: 'basics', label: 'Dados e valores' }, { id: 'modules', label: 'Módulos incluídos' }, { id: 'presentation', label: 'Apresentação' }] as const;
export function PlanEditor({ plan, editing, templates, onClose, onSave }: {
  plan: SaasPlan; editing: boolean; templates: SaasPlan[]; onClose: () => void; onSave: (plan: SaasPlan) => Promise<void>;
}) {
  const uid = useId();
  const [draft, setDraft] = useState(() => draftOf(plan, editing));
  const initial = useRef(JSON.stringify(draft));
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('basics');
  const [sourceId, setSourceId] = useState(plan.id);
  const [idTouched, setIdTouched] = useState(editing);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');
  const dirty = JSON.stringify(draft) !== initial.current;
  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(previous => ({ ...previous, [key]: value }));
  const close = () => { if (!saving && (!dirty || window.confirm('Descartar as alterações que ainda não foram salvas?'))) onClose(); };
  const numberOrNull = (value: string) => value.trim() === '' ? null : Number(value);
  const preview: SaasPlan = { ...draft, monthly_price: numberOrNull(draft.monthly_price), yearly_price: numberOrNull(draft.yearly_price), max_members: numberOrNull(draft.max_members), max_campuses: numberOrNull(draft.max_campuses) };
  const setFlag = (key: string, enabled: boolean) => change('entitlements', toggleEntitlement(draft.entitlements, key, enabled));
  async function save(event: React.FormEvent) {
    event.preventDefault(); setError('');
    let message = '';
    if (!draft.name.trim() || !draft.id.trim()) message = 'Informe o nome e o identificador do plano.';
    else if (!editing && templates.some(template => template.id === draft.id)) message = 'Já existe um plano com este identificador. Use um nome ou identificador diferente.';
    else if (!/^[A-Z0-9_]{1,50}$/.test(draft.id)) message = 'Use até 50 letras sem acento, números ou sublinhado no identificador.';
    else if ((!draft.requires_proposal && (!preview.monthly_price || !preview.max_members || !preview.max_campuses)) ||
      [preview.monthly_price, preview.yearly_price].some(value => value !== null && (!Number.isFinite(value) || value <= 0)) ||
      [preview.max_members, preview.max_campuses].some(value => value !== null && (!Number.isInteger(value) || value <= 0))) message = 'Informe valores e capacidades positivos. Em planos sob proposta, você pode deixar esses campos em aberto.';
    else if (preview.max_campuses && preview.max_campuses > 1 && !draft.entitlements['system.multicampus_enabled']) message = 'Inclua a gestão de várias unidades na aba Módulos ou ajuste a capacidade para uma unidade.';
    if (message) { setTab('basics'); setError(message); return; }
    setSaving(true);
    try { await onSave({ ...preview, name: draft.name.trim(), description: draft.description.trim(), features: draft.features.map(value => value.trim()).filter(Boolean) }); }
    catch (err) { setError((err as Error).message); }
    finally { setSaving(false); }
  }
  const field = (key: 'name' | 'id' | 'description' | 'monthly_price' | 'yearly_price' | 'max_members' | 'max_campuses' | 'badge_text', label: string, options: { type?: string; hint?: string; placeholder?: string } = {}) => <label className="cp-field" htmlFor={`${uid}-${key}`}>
    <span>{label}</span><input id={`${uid}-${key}`} data-autofocus={key === 'name' ? true : undefined} type={options.type || 'text'} min={options.type === 'number' ? key.includes('price') ? '.01' : '1' : undefined} step={options.type === 'number' ? key.includes('price') ? '.01' : '1' : undefined}
      value={draft[key]} disabled={saving || (key === 'id' && editing)} placeholder={options.placeholder}
      onChange={event => { const value = event.target.value;
        if (key === 'id') { setIdTouched(true); change('id', value.toUpperCase().replace(/[^A-Z0-9_]/g, '_')); }
        else if (key === 'name') setDraft(previous => ({ ...previous, name: value, ...(!idTouched ? { id: value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9_]/g, '_').slice(0, 50) } : {}) }));
        else change(key, value);
      }} />{options.hint && <small>{options.hint}</small>}</label>;
  return <CommercialDialog titleId={`${uid}-title`} onClose={close} className="cp-editor">
    <header className="cp-dialog-header"><div><span className="cp-eyebrow">CATÁLOGO COMERCIAL</span><h2 id={`${uid}-title`}>{editing ? `Editar ${plan.name}` : 'Criar um novo plano'}</h2><p>Organize a oferta que será usada nas próximas propostas.</p></div><button className="cp-icon-button" type="button" aria-label="Fechar editor" onClick={close} disabled={saving}><CommercialIcon name="close" /></button></header>
    <form noValidate onSubmit={save} className="cp-editor-form">
      <div className="cp-editor-layout">
        <div className="cp-editor-main">
          <nav className="cp-tabs" aria-label="Seções do editor">{tabs.map(item => <button type="button" key={item.id} className={tab === item.id ? 'is-active' : ''} aria-current={tab === item.id ? 'step' : undefined} onClick={() => { setTab(item.id); setError(''); }}>{item.label}</button>)}</nav>
          <div className="cp-editor-content">
            {tab === 'basics' && <>
              {!editing && <label className="cp-field"><span>Partir de um modelo</span><select value={sourceId} disabled={saving} onChange={event => { const source = templates.find(item => item.id === event.target.value); if (!source) return; setSourceId(source.id); setDraft(previous => ({ ...draftOf(source, false), name: previous.name, id: previous.id })); }}>
                {templates.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select><small>Importa os valores, a capacidade e os módulos. O nome do novo plano é mantido.</small></label>}
              <section className="cp-form-section"><div className="cp-section-title"><span className="cp-step-number">1</span><div><h3>Identidade da oferta</h3><p>Como o plano aparece no catálogo e na proposta.</p></div></div>
                {field('name', 'Nome do plano', { placeholder: 'Ex.: Conectar' })}
                {field('description', 'Descrição curta', { placeholder: 'Uma frase sobre a proposta deste plano.' })}
                <details className="cp-advanced"><summary>Identificação interna</summary>{field('id', 'Identificador', { hint: editing ? 'O identificador é preservado para manter os vínculos existentes.' : 'Gerado pelo nome. Use um identificador novo para uma oferta diferente.' })}</details>
              </section>
              <section className="cp-form-section"><div className="cp-section-title"><span className="cp-step-number">2</span><div><h3>Valores e capacidade</h3><p>A mensalidade e os limites pertencem à organização.</p></div></div>
                <label className="cp-option-row"><input type="checkbox" checked={draft.requires_proposal} disabled={saving} onChange={event => change('requires_proposal', event.target.checked)} /><span><strong>Oferta sob proposta</strong><small>Permite definir preço e capacidade na negociação com a igreja.</small></span></label>
                <div className="cp-form-grid">{field('monthly_price', 'Mensalidade · R$', { type: 'number', placeholder: draft.requires_proposal ? 'A definir na proposta' : '99,00' })}{field('max_members', 'Membros ativos no total', { type: 'number', placeholder: draft.requires_proposal ? 'A definir' : '300' })}{field('max_campuses', 'Unidades, incluindo a sede', { type: 'number', placeholder: draft.requires_proposal ? 'A definir' : '1' })}</div>
                <details className="cp-advanced"><summary>Configurar uma oferta anual</summary>{field('yearly_price', 'Anuidade · R$', { type: 'number', hint: 'Preencha somente quando houver uma condição anual definida. Nenhum desconto é calculado automaticamente.' })}</details>
              </section>
              <label className="cp-option-row"><input type="checkbox" checked={draft.status === 'ACTIVE'} disabled={saving} onChange={event => change('status', event.target.checked ? 'ACTIVE' : 'INACTIVE')} /><span><strong>Disponível para novas propostas</strong><small>O catálogo pode ser alterado sem modificar os contratos já emitidos.</small></span></label>
            </>}
            {tab === 'modules' && <>
              <div className="cp-section-title"><div><h3>O que faz parte deste plano</h3><p>Selecione os recursos por área. As dependências entre módulos são ajustadas ao selecionar.</p></div></div>
              <label className="cp-field cp-search"><span className="cp-visually-hidden">Buscar módulo ou recurso</span><input type="search" placeholder="Buscar módulo ou recurso…" value={moduleSearch} onChange={event => setModuleSearch(event.target.value)} /></label>
              <div className="cp-module-editor">{MODULE_GROUPS.map(group => {
                const keys = groupKeys(group, draft.entitlements); const term = moduleSearch.trim().toLocaleLowerCase('pt-BR');
                if (term && !`${group.name} ${keys.map(key => LABELS[key] || key).join(' ')}`.toLocaleLowerCase('pt-BR').includes(term)) return null;
                const count = keys.filter(key => draft.entitlements[key]).length;
                return <details key={group.key} className="cp-module-group" open={term ? true : undefined}><summary><span><strong>{group.name}</strong><small>{group.description}</small></span><span className={`cp-count ${count ? 'is-included' : ''}`}>{count ? `${count} incluídos` : 'Não incluído'}</span><CommercialIcon name="chevron" /></summary>
                  <div className="cp-module-options">{keys.map(key => <label key={key} className={`cp-option-row ${UNAVAILABLE.has(key) ? 'is-unavailable' : ''}`}><input type="checkbox" checked={Boolean(draft.entitlements[key])} disabled={saving || UNAVAILABLE.has(key)} onChange={event => setFlag(key, event.target.checked)} /><span><strong>{LABELS[key] || 'Recurso complementar'}</strong>{UNAVAILABLE.has(key) && <small>Disponibilidade sujeita à validação da integração.</small>}</span></label>)}</div>
                </details>;
              })}</div>
            </>}
            {tab === 'presentation' && <>
              <section className="cp-form-section"><div className="cp-section-title"><div><h3>Destaque no catálogo</h3><p>Uma indicação editorial para ajudar na escolha.</p></div></div>
                {field('badge_text', 'Selo do plano', { placeholder: 'Ex.: Recomendado' })}
                <label className="cp-option-row"><input type="checkbox" checked={draft.is_popular} disabled={saving} onChange={event => change('is_popular', event.target.checked)} /><span><strong>Destacar visualmente este plano</strong><small>Use uma recomendação, sem presumir dados de popularidade.</small></span></label>
              </section>
              <section className="cp-form-section"><div className="cp-section-title"><div><h3>Benefícios na proposta</h3><p>Edite os textos e a ordem da apresentação. O acesso é definido na aba de módulos.</p></div></div>
                <ol className="cp-benefit-editor">{draft.features.map((feature, index) => <li key={index}><span className="cp-benefit-number">{index + 1}</span><input aria-label={`Benefício ${index + 1}`} value={feature} disabled={saving} onChange={event => change('features', draft.features.map((item, at) => at === index ? event.target.value : item))} /><button type="button" className="cp-icon-button" aria-label={`Mover benefício ${index + 1} para cima`} disabled={saving || index === 0} onClick={() => { const next = [...draft.features]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; change('features', next); }}>↑</button><button type="button" className="cp-icon-button" aria-label={`Remover benefício ${index + 1}`} disabled={saving} onClick={() => change('features', draft.features.filter((_, at) => at !== index))}><CommercialIcon name="close" /></button></li>)}</ol>
                <button type="button" className="cp-button cp-button-secondary" disabled={saving} onClick={() => change('features', [...draft.features, ''])}><CommercialIcon name="plus" />Adicionar benefício</button>
              </section>
            </>}
            {error && <div className="cp-feedback cp-feedback-error" role="alert">{error}</div>}
          </div>
        </div>
        <aside className="cp-editor-preview"><span className="cp-eyebrow">PRÉVIA DO PLANO</span><div className="cp-preview-card">{draft.badge_text && <span className="cp-badge">{draft.badge_text}</span>}<h3>{draft.name || 'Nome do plano'}</h3><p>{draft.description || 'Uma oferta para a realidade da igreja.'}</p><div className="cp-preview-price">{preview.monthly_price == null ? 'Sob proposta' : currency(preview.monthly_price)}{preview.monthly_price !== null && <small>/mês</small>}</div><div className="cp-preview-limits"><span>{preview.max_members ? `${quantity(preview.max_members)} membros no total` : 'Membros a definir'}</span><span>{preview.max_campuses ? `${preview.max_campuses} unidade(s)` : 'Unidades a definir'}</span></div><strong className="cp-preview-caption">{includedGroups(preview).length} áreas com recursos incluídos</strong><ul className="cp-preview-benefits">{draft.features.filter(Boolean).slice(0, 3).map((feature, index) => <li key={index}><CommercialIcon name="check" />{feature}</li>)}</ul></div><p className="cp-preview-note">As alterações serão usadas nas novas propostas. Os contratos existentes mantêm as condições acordadas.</p></aside>
      </div>
      <footer className="cp-dialog-footer"><span className="cp-save-status">{dirty ? 'Alterações ainda não salvas' : 'Nenhuma alteração pendente'}</span><div><button type="button" className="cp-button cp-button-secondary" disabled={saving} onClick={close}>Cancelar</button><button type="submit" className="cp-button cp-button-primary" disabled={saving || (editing && !dirty)}>{saving ? 'Salvando…' : editing ? 'Salvar alterações' : 'Criar plano'}</button></div></footer>
    </form>
  </CommercialDialog>;
}
