import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export interface SaasPlan {
  id: string;
  name: string;
  description?: string;
  monthly_price: number;
  yearly_price: number;
  badge_text?: string;
  is_popular?: boolean;
  max_members?: number;
  max_campuses?: number;
  features?: string[];
  status?: string;
}

export const SaasPlans: React.FC = () => {
  const [plans, setPlans] = useState<SaasPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaasPlan | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    monthly_price: '297',
    yearly_price: '2970',
    badge_text: '',
    is_popular: false,
    max_members: '1500',
    max_campuses: '3',
    featuresText: `Aplicativo PWA Mobile Whitelabel Personalizado\nPortal Administrativo Web Studio Multi-usuário\nMódulo Completo de Células & Redes (com Painel do Líder)\nBíblia Sagrada Offline Integrada\nCantina & Loja com PDV Mobile e Pagamentos PIX\nCentral de Transmissões e Cultos ao Vivo\nEmissão de Ingressos com Scanner QR Code para Eventos\nHospedagem e Infraestrutura Serverless na AWS inclusa\nSuporte Técnico Dedicado`
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/saas-plans`);
      if (res.ok) {
        const json = await res.json();
        setPlans(json || []);
      }
    } catch (e) {
      console.error('Erro ao carregar planos:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan?: SaasPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        monthly_price: String(plan.monthly_price),
        yearly_price: String(plan.yearly_price),
        badge_text: plan.badge_text || '',
        is_popular: Boolean(plan.is_popular),
        max_members: String(plan.max_members || 0),
        max_campuses: String(plan.max_campuses || 1),
        featuresText: (plan.features || []).join('\n')
      });
    } else {
      setEditingPlan(null);
      setFormData({
        id: '',
        name: '',
        description: '',
        monthly_price: '297',
        yearly_price: '2970',
        badge_text: '',
        is_popular: false,
        max_members: '1500',
        max_campuses: '3',
        featuresText: `Aplicativo PWA Mobile Whitelabel Personalizado\nPortal Administrativo Web Studio Multi-usuário\nMódulo Completo de Células & Redes (com Painel do Líder)\nBíblia Sagrada Offline Integrada\nCantina & Loja com PDV Mobile e Pagamentos PIX\nCentral de Transmissões e Cultos ao Vivo\nEmissão de Ingressos com Scanner QR Code para Eventos\nHospedagem e Infraestrutura Serverless na AWS inclusa\nSuporte Técnico Dedicado`
      });
    }
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const featuresArray = formData.featuresText
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const res = await fetch(`${API_URL}/saas-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id || undefined,
          name: formData.name,
          description: formData.description,
          monthly_price: Number(formData.monthly_price),
          yearly_price: Number(formData.yearly_price),
          badge_text: formData.badge_text || null,
          is_popular: formData.is_popular,
          max_members: Number(formData.max_members),
          max_campuses: Number(formData.max_campuses),
          features: featuresArray,
          status: 'ACTIVE'
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchPlans();
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao salvar plano');
      }
    } catch (e) {
      alert('Erro ao conectar na API');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm(`Deseja realmente excluir o plano "${planId}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/saas-plans/${planId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchPlans();
      }
    } catch (e) {
      alert('Erro ao excluir plano');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            💎 Planos & Preços SaaS do Faith-Hub
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Configure os planos de assinatura disponíveis para emissão de propostas comerciais.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          style={{
            background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.86rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)'
          }}
        >
          + Novo Plano SaaS
        </button>
      </div>

      {/* Grid de Planos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Carregando planos...</div>
      ) : plans.length === 0 ? (
        <div className="portal-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💎</div>
          <h3>Nenhum plano configurado</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>Clique no botão acima para criar o primeiro plano.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
          {plans.map(plan => (
            <div
              key={plan.id}
              style={{
                background: '#ffffff',
                border: plan.is_popular ? '2px solid #0f766e' : '1px solid var(--panel-border)',
                borderRadius: '24px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: plan.is_popular ? '0 12px 32px rgba(15, 118, 110, 0.15)' : '0 4px 20px rgba(0,0,0,0.04)',
                transform: plan.is_popular ? 'scale(1.02)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Badge Popular */}
              {plan.badge_text && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '24px',
                  background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                  color: '#ffffff',
                  fontSize: '0.70rem',
                  fontWeight: 900,
                  padding: '4px 12px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 10px rgba(15, 118, 110, 0.3)'
                }}>
                  {plan.badge_text}
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                      {plan.name}
                    </h3>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ID: {plan.id}</span>
                  </div>
                </div>

                {plan.description && (
                  <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', margin: '8px 0 16px 0', lineHeight: 1.4 }}>
                    {plan.description}
                  </p>
                )}

                {/* Preço */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid var(--panel-border)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '0.90rem', fontWeight: 700, color: 'var(--text-main)' }}>R$</span>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-primary)', lineHeight: 1 }}>
                      {Number(plan.monthly_price).toFixed(2).replace('.', ',')}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>/mês</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Anual: <strong>R$ {Number(plan.yearly_price || (plan.monthly_price * 10)).toFixed(2).replace('.', ',')}</strong>/ano
                  </div>
                </div>

                {/* Limites */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  <div style={{ background: '#f1f5f9', padding: '8px 10px', borderRadius: '8px' }}>
                    👥 <strong>{plan.max_members && plan.max_members > 0 ? `${plan.max_members} membros` : 'Membros Ilimitados'}</strong>
                  </div>
                  <div style={{ background: '#f1f5f9', padding: '8px 10px', borderRadius: '8px' }}>
                    🏛️ <strong>{plan.max_campuses && plan.max_campuses > 1 ? `Até ${plan.max_campuses} Unidades` : 'Sede Única'}</strong>
                  </div>
                </div>

                {/* Recursos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {(plan.features || []).map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.78rem', color: '#475569' }}>
                      <span style={{ color: '#059669', fontWeight: 900 }}>✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)' }}>
                <button
                  type="button"
                  onClick={() => handleOpenModal(plan)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--panel-border)', background: '#f8fafc', color: 'var(--text-main)', fontWeight: 800, fontSize: '0.80rem', cursor: 'pointer' }}
                >
                  ✏️ Editar Plano
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePlan(plan.id)}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 800, fontSize: '0.80rem', cursor: 'pointer' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          MODAL: CRIAR / EDITAR PLANO SAAS (PORTAL)
          ======================================================== */}
      {isModalOpen && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '20px',
            margin: 0,
            boxSizing: 'border-box'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              borderRadius: '24px',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
              margin: 'auto',
              color: '#0f172a'
            }}
          >
            <div style={{ padding: '22px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  {editingPlan ? `Editar Plano: ${editingPlan.name}` : 'Novo Plano SaaS'}
                </h3>
                <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  Configure os valores e recursos que serão carregados nas propostas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Nome do Plano *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Pro, Enterprise..." style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Badge de Destaque</label>
                  <input type="text" value={formData.badge_text} onChange={e => setFormData({ ...formData, badge_text: e.target.value })} placeholder="Ex: Mais Popular" style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Descrição Breve</label>
                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: O plano mais completo para igrejas em crescimento." style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Mensalidade (R$) *</label>
                  <input type="number" value={formData.monthly_price} onChange={e => setFormData({ ...formData, monthly_price: e.target.value, yearly_price: String(Number(e.target.value) * 10) })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Anuidade (R$)</label>
                  <input type="number" value={formData.yearly_price} onChange={e => setFormData({ ...formData, yearly_price: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Limite de Membros (0 = Ilimitado)</label>
                  <input type="number" value={formData.max_members} onChange={e => setFormData({ ...formData, max_members: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Limite de Unidades / Campi</label>
                  <input type="number" value={formData.max_campuses} onChange={e => setFormData({ ...formData, max_campuses: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                  Recursos & Módulos Inclusos (1 por linha)
                </label>
                <textarea
                  rows={6}
                  value={formData.featuresText}
                  onChange={e => setFormData({ ...formData, featuresText: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#334155', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: '12px', fontWeight: 800, background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', color: '#ffffff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)' }}>
                  {saving ? 'Salvando...' : 'Salvar Plano SaaS'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SaasPlans;
