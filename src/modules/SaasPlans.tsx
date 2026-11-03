import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAuthHeaders } from '../services/apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';
export interface SaasPlan {
  id: string; name: string; description?: string;
  monthly_price: number | null; yearly_price: number | null;
  badge_text?: string; is_popular?: boolean; requires_proposal?: boolean;
  max_members: number | null; max_campuses: number | null;
  features?: string[]; entitlements?: Record<string, boolean>; status?: string;
}
const blank = { id: '', name: '', description: '', monthly_price: '', yearly_price: '', max_members: '', max_campuses: '',
  badge_text: '', is_popular: false, requires_proposal: false, featuresText: '', entitlements: {} as Record<string, boolean> };
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const field = { display: 'grid', gap: 6, fontSize: '.82rem' };
const input = { padding: 10, border: '1px solid #cbd5e1', borderRadius: 8, width: '100%', boxSizing: 'border-box' as const };

export function SaasPlans() {
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(blank);
  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_URL}/saas-plans`, { headers: await getAuthHeaders() });
      if (!response.ok) throw new Error('Não foi possível carregar o catálogo de planos.');
      setPlans(await response.json());
    } catch (err) { setError((err as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  function applyTemplate(plan: SaasPlan, isEditing = false) {
    setEditing(isEditing);
    setForm({ id: isEditing ? plan.id : '', name: isEditing ? plan.name : '', description: plan.description || '',
      monthly_price: plan.monthly_price === null ? '' : String(plan.monthly_price),
      yearly_price: plan.yearly_price == null ? '' : String(plan.yearly_price),
      max_members: plan.max_members == null ? '' : String(plan.max_members), max_campuses: plan.max_campuses == null ? '' : String(plan.max_campuses),
      badge_text: plan.badge_text || '', is_popular: Boolean(plan.is_popular), requires_proposal: Boolean(plan.requires_proposal),
      featuresText: (plan.features || []).join('\n'), entitlements: { ...plan.entitlements } });
    setOpen(true);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    const numberOrNull = (value: string) => value === '' ? null : Number(value);
    try {
      const response = await fetch(`${API_URL}/saas-plans`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify({
        ...form, monthly_price: numberOrNull(form.monthly_price), yearly_price: numberOrNull(form.yearly_price),
        max_members: numberOrNull(form.max_members), max_campuses: numberOrNull(form.max_campuses),
        features: form.featuresText.split('\n').map(value => value.trim()).filter(Boolean), status: 'ACTIVE'
      }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Erro ao salvar plano.');
      setOpen(false); await load();
    } catch (err) { setError((err as Error).message); } finally { setSaving(false); }
  }
  async function archive(id: string) {
    if (!confirm('Arquivar este plano para novas propostas? Os contratos existentes serão preservados.')) return;
    try {
      const response = await fetch(`${API_URL}/saas-plans/${encodeURIComponent(id)}`, { method: 'DELETE', headers: await getAuthHeaders() });
      if (!response.ok) throw new Error('Não foi possível arquivar o plano.');
      await load();
    } catch (err) { setError((err as Error).message); }
  }
  const groups = Array.from(new Set(Object.keys(form.entitlements).map(key => key.split('.')[0])));
  return <section>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
      <div><h2>Planos & preços Faith Hubs</h2><p>Conectar, Cuidar, Gestão e Enterprise. Alterações no catálogo valem para novas propostas.</p></div>
      <button className="btn-primary" disabled={!plans.length} onClick={() => applyTemplate(plans.find(plan => plan.id === 'CONECTAR') || plans[0])}>Novo plano a partir de modelo</button>
    </div>
    <p>Mensalidade por organização. Membros ativos são somados entre as unidades, sem cota fixa por unidade. Capacidade é acompanhada com avisos, sem bloqueio automático.</p>
    <p>O teste assistido de 14 dias usa Cuidar, uma unidade e até 300 membros, sem cartão ou cobrança automática. Preparação e início dependem da entrega dos acessos.</p>
    {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
    {loading ? <p>Carregando planos…</p> : !plans.length ? <p>Nenhum plano comercial ativo foi cadastrado.</p> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
      {plans.map(plan => <article key={plan.id} className="portal-card" style={{ padding: 24, border: plan.is_popular ? '2px solid #0f766e' : undefined }}>
        {plan.badge_text && <span className="notice-badge">{plan.badge_text}</span>}
        <h3>{plan.name}</h3><p>{plan.description}</p>
        <strong style={{ fontSize: '1.8rem' }}>{plan.monthly_price === null ? 'Sob proposta' : `${money(plan.monthly_price)}/mês`}</strong>
        <p>{plan.yearly_price == null ? 'Anuidade não definida' : `${money(plan.yearly_price)}/ano`}</p>
        <p>{plan.max_members === null ? 'Membros conforme contratação' : `Até ${plan.max_members.toLocaleString('pt-BR')} membros ativos no total`}</p>
        <p>{plan.max_campuses === null ? 'Unidades conforme contratação' : plan.max_campuses === 1 ? '1 unidade' : `Até ${plan.max_campuses} unidades, incluindo a sede`}</p>
        <ul>{plan.features?.map(feature => <li key={feature}>{feature}</li>)}</ul>
        <p>{Object.values(plan.entitlements || {}).filter(Boolean).length} recursos habilitados na matriz do plano.</p>
        <div style={{ display: 'flex', gap: 12 }}><button onClick={() => applyTemplate(plan, true)}>Editar plano e módulos</button><button onClick={() => archive(plan.id)}>Arquivar</button></div>
      </article>)}
    </div>}
    {open && createPortal(<div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 2000, overflow: 'auto', padding: 24 }}>
      <form onSubmit={save} style={{ maxWidth: 900, margin: '0 auto', background: 'white', color: '#0f172a', padding: 24, borderRadius: 20, display: 'grid', gap: 18 }}>
        <h2>{editing ? 'Editar plano' : 'Novo plano'}</h2>
        <p>Os módulos abaixo controlam a liberação do ambiente. Textos de benefícios não concedem acesso. Contratos já emitidos mantêm sua matriz.</p>
        {!editing && <label style={field}>Usar matriz de<select style={input} defaultValue="CONECTAR" onChange={event => { const plan = plans.find(item => item.id === event.target.value); if (plan) applyTemplate(plan); }}>{plans.map(plan => <option value={plan.id} key={plan.id}>{plan.name}</option>)}</select></label>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <label style={field}>Identificador<input style={input} value={form.id} required disabled={editing} onChange={event => setForm({ ...form, id: event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') })} /></label>
          <label style={field}>Nome<input style={input} required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        </div>
        <label style={field}>Descrição<input style={input} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label>
        <label><input type="checkbox" checked={form.requires_proposal} onChange={event => setForm({ ...form, requires_proposal: event.target.checked })} /> Preço e capacidade definidos sob proposta</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <label style={field}>Mensalidade (R$)<input style={input} type="number" min="0.01" step="0.01" required={!form.requires_proposal} value={form.monthly_price} onChange={event => setForm({ ...form, monthly_price: event.target.value })} /></label>
          <label style={field}>Anuidade (opcional; sem cálculo automático)<input style={input} type="number" min="0.01" step="0.01" value={form.yearly_price} onChange={event => setForm({ ...form, yearly_price: event.target.value })} /></label>
          <label style={field}>Membros ativos no total<input style={input} type="number" min="1" step="1" required={!form.requires_proposal} value={form.max_members} onChange={event => setForm({ ...form, max_members: event.target.value })} /></label>
          <label style={field}>Unidades incluindo a sede<input style={input} type="number" min="1" step="1" required={!form.requires_proposal} value={form.max_campuses} onChange={event => setForm({ ...form, max_campuses: event.target.value })} /></label>
        </div>
        <label style={field}>Selo<input style={input} value={form.badge_text} onChange={event => setForm({ ...form, badge_text: event.target.value })} placeholder="Ex.: Recomendado" /></label>
        <label><input type="checkbox" checked={form.is_popular} onChange={event => setForm({ ...form, is_popular: event.target.checked })} /> Destacar este plano</label>
        <label style={field}>Benefícios comerciais (um por linha)<textarea style={input} rows={7} value={form.featuresText} onChange={event => setForm({ ...form, featuresText: event.target.value })} /></label>
        <h3>Matriz de funcionalidades contratadas</h3>
        {groups.map(group => <details key={group}><summary>{group} — {Object.entries(form.entitlements).filter(([key, enabled]) => key.startsWith(`${group}.`) && enabled).length} ativos</summary>
          <div style={{ display: 'grid', gap: 8, padding: 12 }}>{Object.entries(form.entitlements).filter(([key]) => key.startsWith(`${group}.`)).map(([key, enabled]) => <label key={key}><input type="checkbox" checked={enabled} disabled={key === 'system.plan_entitlements'} onChange={event => setForm({ ...form, entitlements: { ...form.entitlements, [key]: event.target.checked } })} /> {key}</label>)}</div>
        </details>)}
        {error && <p role="alert">{error}</p>}
        <div style={{ display: 'flex', gap: 12 }}><button className="btn-primary" disabled={saving} type="submit">{saving ? 'Salvando…' : 'Salvar plano'}</button><button type="button" onClick={() => setOpen(false)}>Cancelar</button></div>
      </form>
    </div>, document.body)}
  </section>;
}
