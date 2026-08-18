import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SaasPlans, type SaasPlan } from './SaasPlans';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  plan: string;
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  status: string;
  total_campuses?: number;
  total_members?: number;
  created_at?: string;
}

export interface Proposal {
  id: string;
  token: string;
  church_name: string;
  cnpj_cpf?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  plan_tier: string;
  billing_cycle: string;
  monthly_amount: number;
  setup_fee: number;
  suggested_slug?: string;
  status: string;
  features_included?: string[];
  proposal_url?: string;
  created_at?: string;
  discount_type?: string;
  discount_value?: number;
  discount_duration_months?: number;
  first_cycle_amount?: number;
  notes_commercial?: string;
}

export interface Subscription {
  id: string;
  organization_id?: string;
  org_name?: string;
  church_name?: string;
  status: string;
  value: number;
  cycle: string;
  billing_type: string;
  next_due_date?: string;
  payment_link?: string;
}

interface OrganizationSelectorProps {
  onSelectOrg: (org: Organization) => void;
  onSignOut: () => void;
  userName: string;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ onSelectOrg, onSignOut, userName }) => {
  const [activeTab, setActiveTab] = useState<'orgs' | 'proposals' | 'subscriptions' | 'plans' | 'master_users'>('orgs');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Organizations State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [openMenuOrgId, setOpenMenuOrgId] = useState<string | null>(null);
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [orgFormData, setOrgFormData] = useState<{
    id?: string;
    name: string;
    slug: string;
    cnpj: string;
    plan: string;
    primary_color: string;
    secondary_color: string;
    status: string;
  }>({
    name: '',
    slug: '',
    cnpj: '',
    plan: 'PRO',
    primary_color: '#0f766e',
    secondary_color: '#14b8a6',
    status: 'ACTIVE'
  });

  // Proposals Funnel State
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [proposalStats, setProposalStats] = useState<any>({
    total_proposals: 0,
    active_mrr: 0,
    pipeline_mrr: 0,
    conversion_rate: 0,
    funnel: { total: 0, sent: 0, viewed: 0, accepted: 0, paid: 0 }
  });
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalFilter, setProposalFilter] = useState('ALL');
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [savingProposal, setSavingProposal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Dynamic Plans State
  const [availablePlans, setAvailablePlans] = useState<SaasPlan[]>([]);
  
  // New Proposal Form
  const [proposalForm, setProposalForm] = useState({
    church_name: '',
    cnpj_cpf: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    plan_tier: 'PRO',
    billing_cycle: 'MONTHLY',
    monthly_amount: '297',
    setup_fee: '0',
    suggested_slug: '',
    expires_days: '15',
    notes: '',
    discount_type: 'NONE',
    discount_value: '100',
    discount_duration_months: '6',
    notes_commercial: ''
  });

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Master Users State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'MASTER_ADMIN'
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', '#0f766e');
    document.documentElement.style.setProperty('--accent-primary-gradient', 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)');
    document.documentElement.style.setProperty('--accent-primary-light', '#f0fdfa');
    
    fetchOrganizations();
    fetchProposals();
    fetchSubscriptions();
    fetchAvailablePlans();

    // Fecha o menu de 3 pontinhos ao clicar em qualquer lugar da tela
    const handleClickOutside = () => setOpenMenuOrgId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchAvailablePlans = async () => {
    try {
      const res = await fetch(`${API_URL}/saas-plans`);
      if (res.ok) {
        const json = await res.json();
        setAvailablePlans(json || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const res = await fetch(`${API_URL}/organizations`);
      if (res.ok) {
        const json = await res.json();
        setOrganizations(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrgs(false);
    }
  };

  const fetchProposals = async () => {
    setLoadingProposals(true);
    try {
      const res = await fetch(`${API_URL}/proposals`);
      if (res.ok) {
        const json = await res.json();
        setProposals(json.proposals || []);
        if (json.stats) setProposalStats(json.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProposals(false);
    }
  };

  const fetchSubscriptions = async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch(`${API_URL}/saas-subscriptions`);
      if (res.ok) {
        const json = await res.json();
        setSubscriptions(json || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleToggleOrgStatus = async (org: Organization) => {
    const isCurrentlyInactive = (org.status || '').toUpperCase() === 'INACTIVE';
    const newStatus = isCurrentlyInactive ? 'ACTIVE' : 'INACTIVE';
    
    const confirmMessage = isCurrentlyInactive
      ? `Deseja REATIVAR o ambiente da "${org.name}"?\n\n• O acesso ao Studio e ao App PWA dos membros será reestabelecido imediatamente com todos os dados mantidos.`
      : `Deseja INATIVAR o ambiente da "${org.name}"?\n\n• O acesso ao Studio e ao App PWA dos membros será bloqueado temporariamente.\n• Todos os dados permanecerão salvos com segurança para reativação futura.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`${API_URL}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: org.id, status: newStatus })
      });
      if (res.ok) {
        setOrganizations(prev => prev.map(o => o.id === org.id ? { ...o, status: newStatus } : o));
        alert(`✓ Ambiente da "${org.name}" foi ${newStatus === 'ACTIVE' ? 'reativado' : 'inativado'} com sucesso!`);
      } else {
        alert('Erro ao atualizar status do ambiente.');
      }
    } catch (e) {
      alert('Erro ao conectar ao servidor.');
    }
  };

  const handleEditOrg = (org: Organization) => {
    setEditingOrgId(org.id);
    setOrgFormData({
      id: org.id,
      name: org.name,
      slug: org.slug,
      cnpj: org.cnpj || '',
      plan: org.plan || 'PRO',
      primary_color: org.primary_color || '#0f766e',
      secondary_color: org.secondary_color || '#14b8a6',
      status: org.status || 'ACTIVE'
    });
    setIsOrgModalOpen(true);
  };

  const handleOpenNewOrgModal = () => {
    setEditingOrgId(null);
    setOrgFormData({
      name: '',
      slug: '',
      cnpj: '',
      plan: 'PRO',
      primary_color: '#0f766e',
      secondary_color: '#14b8a6',
      status: 'ACTIVE'
    });
    setIsOrgModalOpen(true);
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      const res = await fetch(`${API_URL}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgFormData)
      });
      if (res.ok) {
        setIsOrgModalOpen(false);
        setEditingOrgId(null);
        setOrgFormData({
          name: '',
          slug: '',
          cnpj: '',
          plan: 'PRO',
          primary_color: '#0f766e',
          secondary_color: '#14b8a6',
          status: 'ACTIVE'
        });
        fetchOrganizations();
        alert('✓ Dados da congregação salvos com sucesso!');
      } else {
        const err = await res.json();
        alert(`Erro ao salvar organização: ${err.error || err.message}`);
      }
    } catch (e) {
      alert('Erro ao salvar organização');
    } finally {
      setSavingOrg(false);
    }
  };

  const handlePlanChangeInProposal = (planId: string) => {
    const selected = availablePlans.find(p => p.id === planId);
    if (selected) {
      setProposalForm(prev => ({
        ...prev,
        plan_tier: planId,
        monthly_amount: String(selected.monthly_price)
      }));
    } else {
      setProposalForm(prev => ({ ...prev, plan_tier: planId }));
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProposal(true);
    try {
      const selectedPlan = availablePlans.find(p => p.id === proposalForm.plan_tier);
      const res = await fetch(`${API_URL}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...proposalForm,
          discount_value: Number(proposalForm.discount_value || 0),
          discount_duration_months: Number(proposalForm.discount_duration_months || 0),
          features_included: selectedPlan?.features || undefined,
          created_by: userName
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsProposalModalOpen(false);
        setProposalForm({
          church_name: '',
          cnpj_cpf: '',
          contact_name: '',
          contact_email: '',
          contact_phone: '',
          plan_tier: 'PRO',
          billing_cycle: 'MONTHLY',
          monthly_amount: '297',
          setup_fee: '0',
          suggested_slug: '',
          expires_days: '15',
          notes: '',
          discount_type: 'NONE',
          discount_value: '100',
          discount_duration_months: '6',
          notes_commercial: ''
        });
        fetchProposals();
        alert(`✓ Proposta comercial gerada com sucesso!\nLink: ${data.proposal.proposal_url}`);
      }
    } catch (e) {
      alert('Erro ao criar proposta comercial');
    } finally {
      setSavingProposal(false);
    }
  };

  const handleSimulatePayment = async (proposalId: string) => {
    if (!confirm('Deseja simular o pagamento desta proposta e disparar o provisionamento automático na AWS?')) return;
    try {
      const res = await fetch(`${API_URL}/proposals/${proposalId}/simulate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`🎉 Sucesso! Ambiente provisionado na AWS!\n- Organização: ${data.result?.church_name}\n- PWA: ${data.result?.pwa_url}`);
        fetchProposals();
        fetchOrganizations();
        fetchSubscriptions();
      } else {
        alert(data.message || 'Erro na simulação');
      }
    } catch (e) {
      alert('Erro ao conectar na API');
    }
  };

  const handleCreateMasterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    try {
      const res = await fetch(`${API_URL}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userFormData.name,
          email: userFormData.email,
          phone: userFormData.phone,
          role: 'MASTER_ADMIN',
          organization_id: 'org_master',
          campus_id: 'campus_sede',
          invitedBy: userName
        })
      });

      if (res.ok) {
        setIsUserModalOpen(false);
        setUserFormData({ name: '', email: '', phone: '', role: 'MASTER_ADMIN' });
        alert(`✓ Usuário Master criado com sucesso! Um e-mail com a senha provisória foi enviado para ${userFormData.email}.`);
      } else {
        const err = await res.json();
        alert(`Erro ao criar usuário master: ${err.error || err.message}`);
      }
    } catch (e) {
      alert('Erro ao conectar no servidor.');
    } finally {
      setSavingUser(false);
    }
  };

  const filteredOrgs = organizations.filter(o =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.cnpj && o.cnpj.includes(searchTerm))
  );

  const filteredProposals = proposals.filter(p => {
    if (proposalFilter === 'ALL') return true;
    return (p.status || '').toUpperCase() === proposalFilter;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: 'inherit', position: 'relative' }}>
      
      {/* Mobile Drawer Backdrop */}
      <div 
        className={`sidebar-backdrop ${isMobileNavOpen ? 'active' : ''}`}
        onClick={() => setIsMobileNavOpen(false)}
      />

      {/* ========================================================
          SIDEBAR MASTER (ESTILO WEB STUDIO)
          ======================================================== */}
      <aside 
        className={`sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}
        style={{
          width: '260px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid var(--panel-border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          {/* Top Brand Logo */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.25rem',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)'
            }}>
              ✝
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                  Faith-Hub
                </h1>
                <span style={{
                  background: 'rgba(15, 118, 110, 0.1)',
                  color: '#0f766e',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  letterSpacing: '0.04em'
                }}>
                  MASTER
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                SaaS Command Center
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'orgs', label: 'Redes & Igrejas', icon: '🏛️', count: organizations.length },
              { id: 'proposals', label: 'Funil de Propostas', icon: '📊', count: proposals.length },
              { id: 'subscriptions', label: 'Assinaturas Asaas', icon: '💳', count: subscriptions.length },
              { id: 'plans', label: 'Planos & Preços', icon: '💎', count: availablePlans.length },
              { id: 'master_users', label: 'Equipe Master', icon: '🛡️', count: null }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsMobileNavOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--accent-primary-light)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab.id ? 800 : 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
                {tab.count !== null && (
                  <span style={{
                    background: activeTab === tab.id ? 'var(--accent-primary)' : '#f1f5f9',
                    color: activeTab === tab.id ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* User Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--panel-border)', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0f766e', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.90rem' }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                  {userName}
                </div>
                <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 700 }}>● Master Global</span>
              </div>
            </div>
            <button
              onClick={onSignOut}
              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, padding: '6px' }}
              title="Encerrar Sessão"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================
          MAIN CONTENT AREA
          ======================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Top Executive KPI Bar */}
        <header style={{ background: '#ffffff', borderBottom: '1px solid var(--panel-border)', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <button 
              type="button" 
              className="hamburger-btn" 
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              title="Abrir Menu Lateral"
              aria-label="Abrir Menu"
            >
              ☰
            </button>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              {activeTab === 'orgs' && 'Redes & Igrejas Ativas'}
              {activeTab === 'proposals' && 'Funil de Propostas Comerciais'}
              {activeTab === 'subscriptions' && 'Assinaturas & Faturamento Asaas'}
              {activeTab === 'plans' && 'Planos & Preços SaaS'}
              {activeTab === 'master_users' && 'Equipe Master Global'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
            
            <div style={{ background: '#f8fafc', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '12px 16px' }}>
              <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>🏛️ Igrejas Ativas</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>{organizations.length}</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '12px 16px' }}>
              <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>💵 MRR Ativo (Asaas)</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
                R$ {Number(proposalStats.active_mrr || (organizations.length * 297)).toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '12px 16px' }}>
              <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>⏳ Pipeline em Propostas</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>
                R$ {Number(proposalStats.pipeline_mrr || 0).toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '12px 16px' }}>
              <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>🎯 Taxa de Conversão</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                {proposalStats.conversion_rate || 0}%
              </div>
            </div>

          </div>
        </header>

        {/* Tab Content */}
        <main style={{ padding: '32px', flex: 1 }}>
          
          {/* TAB 1: REDES & IGREJAS ATIVAS */}
          {activeTab === 'orgs' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div className="search-box-modern" style={{ width: '360px', margin: 0 }}>
                  <input
                    type="text"
                    placeholder="Buscar por nome da igreja, slug ou CNPJ..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleOpenNewOrgModal}
                  style={{
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)'
                  }}
                >
                  + Nova Rede / Denominação
                </button>
              </div>

              {loadingOrgs ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Carregando congregações...</div>
              ) : filteredOrgs.length === 0 ? (
                <div className="portal-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <h3>Nenhuma congregação encontrada</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>Crie uma nova rede ou emita uma proposta comercial.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))', gap: '20px' }}>
                  {filteredOrgs.map(org => {
                    const isInactive = (org.status || '').toUpperCase() === 'INACTIVE';

                    return (
                      <div
                        key={org.id}
                        className="portal-card animate-fade-in"
                        style={{
                          margin: 0,
                          padding: '24px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          border: isInactive ? '1.5px dashed #cbd5e1' : '1px solid var(--panel-border)',
                          background: isInactive ? '#f8fafc' : '#ffffff',
                          boxShadow: 'var(--shadow-sm)',
                          opacity: isInactive ? 0.9 : 1,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Accent Top Line */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '4px',
                          background: isInactive
                            ? 'linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%)'
                            : `linear-gradient(90deg, ${org.primary_color || '#0f766e'} 0%, ${org.secondary_color || '#14b8a6'} 100%)`
                        }} />

                        <div>
                          {/* Header with Avatar, Name, Plan and 3-Dots Menu */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                              <div style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: isInactive ? '#64748b' : (org.primary_color || '#0f766e'),
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                flexShrink: 0,
                                filter: isInactive ? 'grayscale(1)' : 'none'
                              }}>
                                {org.name.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: isInactive ? '#64748b' : 'var(--text-main)', margin: 0 }}>
                                    {org.name}
                                  </h2>
                                </div>
                                <span style={{ fontSize: '0.74rem', color: isInactive ? '#94a3b8' : 'var(--text-muted)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  app: <strong>app.faithhubs.com/{org.slug}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Plan Badge + 3-Dots Menu Button */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              {isInactive ? (
                                <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 7px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800 }}>
                                  🚫 INATIVO
                                </span>
                              ) : (
                                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontSize: '0.70rem', fontWeight: 800 }}>
                                  {org.plan || 'PRO'}
                                </span>
                              )}

                              {/* 3-DOTS (⋮) MENU */}
                              <div style={{ position: 'relative' }}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuOrgId(openMenuOrgId === org.id ? null : org.id);
                                  }}
                                  style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    background: openMenuOrgId === org.id ? '#f1f5f9' : '#ffffff',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    fontWeight: 900,
                                    lineHeight: 1
                                  }}
                                  title="Opções do Ambiente"
                                >
                                  ⋮
                                </button>

                                {openMenuOrgId === org.id && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      top: '36px',
                                      right: 0,
                                      background: '#ffffff',
                                      borderRadius: '14px',
                                      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.15)',
                                      border: '1px solid #e2e8f0',
                                      padding: '6px',
                                      zIndex: 100,
                                      width: '210px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '2px'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleEditOrg(org);
                                        setOpenMenuOrgId(null);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '9px 12px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#1e293b',
                                        fontSize: '0.80rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        textAlign: 'left'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      ✏️ Editar Dados da Igreja
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleToggleOrgStatus(org);
                                        setOpenMenuOrgId(null);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '9px 12px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: isInactive ? '#059669' : '#dc2626',
                                        fontSize: '0.80rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        textAlign: 'left'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = isInactive ? '#ecfdf5' : '#fef2f2'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      {isInactive ? '🟢 Reativar Ambiente' : '🚫 Inativar Ambiente'}
                                    </button>

                                    <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(`https://app.faithhubs.com/${org.slug}`);
                                        alert(`✓ Link do PWA copiado: https://app.faithhubs.com/${org.slug}`);
                                        setOpenMenuOrgId(null);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '9px 12px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#475569',
                                        fontSize: '0.80rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        textAlign: 'left'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                      📱 Copiar Link do PWA
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Metrics Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px',
                            background: isInactive ? '#f1f5f9' : '#f8fafc',
                            padding: '12px',
                            borderRadius: '10px',
                            marginBottom: '16px',
                            border: '1px solid var(--panel-border)'
                          }}>
                            <div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isInactive ? '#64748b' : 'var(--text-main)' }}>
                                {org.total_campuses ?? 1}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                Campi / Filiais
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isInactive ? '#dc2626' : '#059669' }}>
                                {isInactive ? 'Inativo' : 'Ativa'}
                              </div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                Status do SaaS
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => onSelectOrg(org)}
                            className={isInactive ? "btn-secondary" : "btn-primary"}
                            style={{
                              flex: 1,
                              padding: '10px',
                              fontSize: '0.84rem',
                              borderRadius: '10px',
                              background: isInactive ? '#e2e8f0' : undefined,
                              color: isInactive ? '#475569' : undefined,
                              fontWeight: 800
                            }}
                          >
                            {isInactive ? 'Acessar (Inativo) ➔' : 'Acessar Studio ➔'}
                          </button>
                          <a
                            href={`https://app.faithhubs.com/${org.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-secondary"
                            style={{
                              padding: '10px 14px',
                              fontSize: '0.84rem',
                              borderRadius: '10px',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: isInactive ? 0.5 : 1
                            }}
                          >
                            📱 App
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FUNIL DE PROPOSTAS */}
          {activeTab === 'proposals' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
                  {[
                    { id: 'ALL', label: 'Todas' },
                    { id: 'SENT', label: 'Enviadas' },
                    { id: 'VIEWED', label: 'Visualizadas' },
                    { id: 'ACCEPTED', label: 'Aceitas' },
                    { id: 'PAID', label: 'Pagas & Ativas' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setProposalFilter(f.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: proposalFilter === f.id ? '#ffffff' : 'transparent',
                        color: proposalFilter === f.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        cursor: 'pointer'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsProposalModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)'
                  }}
                >
                  + Nova Proposta Comercial
                </button>
              </div>

              {loadingProposals ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Carregando propostas...</div>
              ) : filteredProposals.length === 0 ? (
                <div className="portal-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📄</div>
                  <h3>Nenhuma proposta comercial encontrada</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>Clique no botão acima para emitir a primeira proposta personalizada.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
                  {filteredProposals.map(prop => {
                    const statusColors: any = {
                      SENT: { bg: '#fef3c7', text: '#d97706', label: 'Enviada' },
                      VIEWED: { bg: '#e0f2fe', text: '#0284c7', label: '👀 Visualizada pelo Pastor' },
                      ACCEPTED: { bg: '#fef9c3', text: '#ca8a04', label: '✍️ Aceita (Aguardando Pagto)' },
                      PAID: { bg: '#ecfdf5', text: '#059669', label: '✓ Paga & Provisionada' },
                      CANCELLED: { bg: '#fee2e2', text: '#dc2626', label: 'Cancelada' }
                    };
                    const badge = statusColors[prop.status] || { bg: '#f1f5f9', text: '#64748b', label: prop.status };

                    return (
                      <div key={prop.id} className="portal-card animate-fade-in" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--panel-border)' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>{prop.church_name}</h3>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Responsável: {prop.contact_name}</span>
                            </div>
                            <span style={{ background: badge.bg, color: badge.text, padding: '4px 9px', borderRadius: '8px', fontSize: '0.70rem', fontWeight: 800 }}>
                              {badge.label}
                            </span>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--panel-border)', margin: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Mensalidade Acordada</span>
                              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-primary)' }}>
                                R$ {Number(prop.monthly_amount).toFixed(2).replace('.', ',')}<span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>/mês</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Plano</span>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)' }}>{prop.plan_tier}</div>
                            </div>
                          </div>

                          {/* Discount Badge if any */}
                          {prop.discount_type && prop.discount_type !== 'NONE' && (
                            <div style={{
                              background: prop.discount_type === 'FIRST_FREE' ? '#ecfdf5' : '#eff6ff',
                              border: prop.discount_type === 'FIRST_FREE' ? '1px solid #a7f3d0' : '1px solid #bfdbfe',
                              color: prop.discount_type === 'FIRST_FREE' ? '#065f46' : '#1e40af',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              {prop.discount_type === 'FIRST_FREE' && '🎁 1ª Mensalidade 100% Gratuita (Carência 30d)'}
                              {prop.discount_type === 'RECURRING_MONTHS_DISCOUNT' && `⏳ Desconto de R$ ${prop.discount_value}/mês por ${prop.discount_duration_months} meses`}
                              {prop.discount_type === 'FIRST_MONTH_DISCOUNT' && `🏷️ Desconto de R$ ${prop.discount_value} na 1ª mensalidade`}
                              {prop.discount_type === 'PERMANENT_DISCOUNT' && `💎 Desconto de R$ ${prop.discount_value}/mês permanente`}
                            </div>
                          )}

                          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '16px' }}>
                            <div>✉️ {prop.contact_email}</div>
                            {prop.contact_phone && <div>📱 {prop.contact_phone}</div>}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(prop.proposal_url || `https://studio.faithhubs.com/?proposta=${prop.token}`);
                                setCopiedToken(prop.token);
                                setTimeout(() => setCopiedToken(null), 3000);
                              }}
                              className="btn-secondary"
                              style={{ flex: 1, padding: '8px', fontSize: '0.78rem', borderRadius: '8px' }}
                            >
                              {copiedToken === prop.token ? '✓ Link Copiado!' : '📋 Copiar Link'}
                            </button>

                            {prop.contact_phone && (
                              <a
                                href={`https://wa.me/${prop.contact_phone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(prop.contact_name)}!%20Segue%20a%20sua%20proposta%20exclusiva%20para%20o%20aplicativo%20da%20${encodeURIComponent(prop.church_name)}:%20${encodeURIComponent(prop.proposal_url || '')}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                💬 WhatsApp
                              </a>
                            )}

                            <a
                              href={prop.proposal_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary"
                              style={{ padding: '8px 10px', fontSize: '0.78rem', borderRadius: '8px', textDecoration: 'none' }}
                            >
                              👁️
                            </a>
                          </div>

                          {prop.status !== 'PAID' && (
                            <button
                              type="button"
                              onClick={() => handleSimulatePayment(prop.id)}
                              style={{ background: '#f0fdf4', color: '#16a34a', border: '1px dashed #86efac', padding: '8px', borderRadius: '8px', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer' }}
                            >
                              ⚡ Simular Pagamento & Ativar Agora (Teste)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSINATURAS ASAAS */}
          {activeTab === 'subscriptions' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  💳 Assinaturas Recorrentes Asaas
                </h2>
                <p style={{ fontSize: '0.80rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Controle de pagamentos mensais, vencimentos e status financeiro das igrejas clientes.
                </p>
              </div>

              {loadingSubs ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Carregando assinaturas...</div>
              ) : subscriptions.length === 0 ? (
                <div className="portal-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>💳</div>
                  <h3>Nenhuma assinatura ativa registrada</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>As assinaturas serão listadas aqui conforme as propostas forem pagas pelo Asaas.</p>
                </div>
              ) : (
                <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--panel-border)', color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '14px 18px' }}>Igreja / Organização</th>
                        <th style={{ padding: '14px 18px' }}>Valor Recorrente</th>
                        <th style={{ padding: '14px 18px' }}>Ciclo</th>
                        <th style={{ padding: '14px 18px' }}>Status</th>
                        <th style={{ padding: '14px 18px' }}>Próximo Vencimento</th>
                        <th style={{ padding: '14px 18px', textAlign: 'right' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map(sub => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                          <td style={{ padding: '16px 18px', fontWeight: 800, color: 'var(--text-main)' }}>
                            {sub.church_name || sub.org_name || 'Igreja Cliente'}
                          </td>
                          <td style={{ padding: '16px 18px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                            R$ {Number(sub.value || 297).toFixed(2).replace('.', ',')}
                          </td>
                          <td style={{ padding: '16px 18px', color: 'var(--text-secondary)' }}>
                            {sub.cycle === 'YEARLY' ? 'Anual' : 'Mensal'}
                          </td>
                          <td style={{ padding: '16px 18px' }}>
                            <span style={{ background: sub.status === 'ACTIVE' ? '#ecfdf5' : '#fef2f2', color: sub.status === 'ACTIVE' ? '#059669' : '#dc2626', padding: '4px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                              {sub.status === 'ACTIVE' ? '✓ Em Dia' : '● Atrasado'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 18px', color: 'var(--text-secondary)' }}>
                            {sub.next_due_date ? new Date(sub.next_due_date).toLocaleDateString('pt-BR') : 'Próximo mês'}
                          </td>
                          <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => alert(`Assinatura Asaas ID: ${sub.id}\nStatus: ${sub.status}`)}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.76rem', borderRadius: '8px' }}
                            >
                              Detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PLANOS & PREÇOS SAAS */}
          {activeTab === 'plans' && (
            <SaasPlans />
          )}

          {/* TAB 5: EQUIPE MASTER */}
          {activeTab === 'master_users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    🛡️ Usuários com Acesso Master Global
                  </h2>
                  <p style={{ fontSize: '0.80rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Superusuários que têm permissão de criar propostas, alternar entre igrejas e gerenciar o ecossistema.
                  </p>
                </div>

                <button
                  onClick={() => setIsUserModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)'
                  }}
                >
                  + Novo Usuário Master
                </button>
              </div>

              <div className="portal-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                    👑
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-main)' }}>{userName || 'Super Admin'}</div>
                    <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700 }}>● MASTER_ADMIN (Permissão Total)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================
          MODAL: NOVA PROPOSTA COMERCIAL (PORTAL)
          ======================================================== */}
      {isProposalModalOpen && createPortal(
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
            if (e.target === e.currentTarget) setIsProposalModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '620px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900 }}>
                  📄
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    Nova Proposta Comercial SaaS
                  </h3>
                  <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Emita a proposta e envie o link de contratação para o pastor.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProposalModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProposal} style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                  Nome da Igreja / Denominação *
                </label>
                <input
                  type="text"
                  value={proposalForm.church_name}
                  onChange={e => setProposalForm({ ...proposalForm, church_name: e.target.value })}
                  placeholder="Ex: Igreja Batista da Aliança"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                    Nome do Pastor / Responsável *
                  </label>
                  <input
                    type="text"
                    value={proposalForm.contact_name}
                    onChange={e => setProposalForm({ ...proposalForm, contact_name: e.target.value })}
                    placeholder="Ex: Pr. Carlos Eduardo"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                    CNPJ / CPF
                  </label>
                  <input
                    type="text"
                    value={proposalForm.cnpj_cpf}
                    onChange={e => setProposalForm({ ...proposalForm, cnpj_cpf: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                    E-mail do Pastor (Login de Acesso) *
                  </label>
                  <input
                    type="email"
                    value={proposalForm.contact_email}
                    onChange={e => setProposalForm({ ...proposalForm, contact_email: e.target.value })}
                    placeholder="pastor@igreja.com.br"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                    WhatsApp de Contato
                  </label>
                  <input
                    type="text"
                    value={proposalForm.contact_phone}
                    onChange={e => setProposalForm({ ...proposalForm, contact_phone: e.target.value })}
                    placeholder="48999999999"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                    Plano Configurado
                  </label>
                  <select
                    value={proposalForm.plan_tier}
                    onChange={e => handlePlanChangeInProposal(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                  >
                    {availablePlans.length > 0 ? (
                      availablePlans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (R$ {Number(p.monthly_price).toFixed(0)}/mês)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="STARTER">Starter</option>
                        <option value="PRO">Pro</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                    Mensalidade Padrão (R$) *
                  </label>
                  <input
                    type="number"
                    value={proposalForm.monthly_amount}
                    onChange={e => setProposalForm({ ...proposalForm, monthly_amount: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                    Ciclo
                  </label>
                  <select
                    value={proposalForm.billing_cycle}
                    onChange={e => setProposalForm({ ...proposalForm, billing_cycle: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                  >
                    <option value="MONTHLY">Mensal</option>
                    <option value="YEARLY">Anual</option>
                  </select>
                </div>
              </div>

              {/* Commercial Conditions & Discounts Section */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1rem' }}>🏷️</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Condição Comercial Especial & Desconto</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: proposalForm.discount_type === 'RECURRING_MONTHS_DISCOUNT' ? '1.2fr 1fr 1fr' : (proposalForm.discount_type === 'FIRST_MONTH_DISCOUNT' || proposalForm.discount_type === 'PERMANENT_DISCOUNT') ? '1.2fr 1fr' : '1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px', color: '#64748b' }}>Regra de Desconto</label>
                    <select
                      value={proposalForm.discount_type}
                      onChange={e => setProposalForm({ ...proposalForm, discount_type: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                    >
                      <option value="NONE">Sem desconto (Preço Cheio Padrão)</option>
                      <option value="FIRST_FREE">🎁 1ª Mensalidade Grátis (30 Dias Carência)</option>
                      <option value="FIRST_MONTH_DISCOUNT">🏷️ Desconto na 1ª Mensalidade</option>
                      <option value="RECURRING_MONTHS_DISCOUNT">⏳ Desconto Temporário por N Meses</option>
                      <option value="PERMANENT_DISCOUNT">💎 Desconto Permanente</option>
                    </select>
                  </div>

                  {(proposalForm.discount_type === 'FIRST_MONTH_DISCOUNT' || proposalForm.discount_type === 'RECURRING_MONTHS_DISCOUNT' || proposalForm.discount_type === 'PERMANENT_DISCOUNT') && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px', color: '#64748b' }}>Valor do Desconto (R$)</label>
                      <input
                        type="number"
                        value={proposalForm.discount_value}
                        onChange={e => setProposalForm({ ...proposalForm, discount_value: e.target.value })}
                        placeholder="Ex: 100"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}

                  {proposalForm.discount_type === 'RECURRING_MONTHS_DISCOUNT' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px', color: '#64748b' }}>Duração em Meses</label>
                      <select
                        value={proposalForm.discount_duration_months}
                        onChange={e => setProposalForm({ ...proposalForm, discount_duration_months: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                      >
                        <option value="2">2 meses</option>
                        <option value="3">3 meses</option>
                        <option value="6">6 meses</option>
                        <option value="12">12 meses (1 ano)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Preview Box */}
                {proposalForm.discount_type === 'FIRST_FREE' && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 12px', borderRadius: '10px', fontSize: '0.76rem', color: '#065f46', fontWeight: 700 }}>
                    🎁 <strong>Oferta Ativa:</strong> 1º Mês <strong>R$ 0,00</strong> (Provisionamento Imediato no Aceite). A partir do 2º mês: <strong>R$ {Number(proposalForm.monthly_amount).toFixed(2).replace('.', ',')}/mês</strong>.
                  </div>
                )}

                {proposalForm.discount_type === 'RECURRING_MONTHS_DISCOUNT' && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 12px', borderRadius: '10px', fontSize: '0.76rem', color: '#1e40af', fontWeight: 700 }}>
                    ⏳ <strong>Oferta Ativa:</strong> Meses 1 a {proposalForm.discount_duration_months}: <strong>R$ {Math.max(0, Number(proposalForm.monthly_amount) - Number(proposalForm.discount_value)).toFixed(2).replace('.', ',')}/mês</strong>. A partir do mês {Number(proposalForm.discount_duration_months) + 1}: <strong>R$ {Number(proposalForm.monthly_amount).toFixed(2).replace('.', ',')}/mês</strong>.
                  </div>
                )}

                {proposalForm.discount_type === 'FIRST_MONTH_DISCOUNT' && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 12px', borderRadius: '10px', fontSize: '0.76rem', color: '#1e40af', fontWeight: 700 }}>
                    🏷️ <strong>Oferta Ativa:</strong> 1º Mês: <strong>R$ {Math.max(0, Number(proposalForm.monthly_amount) - Number(proposalForm.discount_value)).toFixed(2).replace('.', ',')}</strong>. A partir do 2º mês: <strong>R$ {Number(proposalForm.monthly_amount).toFixed(2).replace('.', ',')}/mês</strong>.
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: 700, border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#334155', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProposal}
                  style={{ flex: 2, padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.90rem', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', color: '#ffffff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)' }}
                >
                  {savingProposal ? 'Gerando Proposta...' : '🚀 Gerar Proposta & Criar Link'}
                </button>
              </div>

            </form>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: NOVO USUÁRIO MASTER (PORTAL)
          ======================================================== */}
      {isUserModalOpen && createPortal(
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
            if (e.target === e.currentTarget) setIsUserModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '480px',
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
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>🛡️ Novo Usuário Master</h3>
                <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0 0' }}>Convidar administrador com privilégios globais.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMasterUser} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Nome Completo *</label>
                <input type="text" value={userFormData.name} onChange={e => setUserFormData({ ...userFormData, name: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>E-mail de Acesso *</label>
                <input type="email" value={userFormData.email} onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>WhatsApp</label>
                <input type="text" value={userFormData.phone} onChange={e => setUserFormData({ ...userFormData, phone: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsUserModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#334155', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={savingUser} style={{ flex: 2, padding: '12px', borderRadius: '12px', fontWeight: 800, background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', color: '#ffffff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)' }}>
                  {savingUser ? 'Enviando...' : '🛡️ Enviar Convite Master'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: ORGANIZAÇÃO (CRIAR OU EDITAR DADOS)
          ======================================================== */}
      {isOrgModalOpen && createPortal(
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
            if (e.target === e.currentTarget) setIsOrgModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '520px',
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
                  {editingOrgId ? '✏️ Editar Dados da Igreja' : '🏛️ Nova Rede / Denominação'}
                </h3>
                <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0 0' }}>
                  {editingOrgId ? 'Atualize as informações, cores institucionais e status do ambiente.' : 'Cadastre uma nova congregação e libere o acesso ao ecossistema.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrgModalOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrg} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Nome da Igreja *</label>
                <input
                  type="text"
                  value={orgFormData.name}
                  onChange={e => setOrgFormData({
                    ...orgFormData,
                    name: e.target.value,
                    slug: editingOrgId ? orgFormData.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')
                  })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Slug do PWA (URL) *</label>
                  <input
                    type="text"
                    value={orgFormData.slug}
                    onChange={e => setOrgFormData({ ...orgFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Plano Contratado</label>
                  <select
                    value={orgFormData.plan}
                    onChange={e => setOrgFormData({ ...orgFormData, plan: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box', fontWeight: 700 }}
                  >
                    <option value="START">START</option>
                    <option value="PRO">PRO</option>
                    <option value="KINGDOM">KINGDOM</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>CNPJ (Opcional)</label>
                  <input
                    type="text"
                    value={orgFormData.cnpj}
                    onChange={e => setOrgFormData({ ...orgFormData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Status do Ambiente</label>
                  <select
                    value={orgFormData.status}
                    onChange={e => setOrgFormData({ ...orgFormData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      background: orgFormData.status === 'INACTIVE' ? '#fef2f2' : '#f0fdf4',
                      color: orgFormData.status === 'INACTIVE' ? '#b91c1c' : '#15803d',
                      boxSizing: 'border-box',
                      fontWeight: 800
                    }}
                  >
                    <option value="ACTIVE">🟢 ATIVO (Liberado)</option>
                    <option value="INACTIVE">🚫 INATIVO (Suspenso)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Cor Primária</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={orgFormData.primary_color}
                      onChange={e => setOrgFormData({ ...orgFormData, primary_color: e.target.value })}
                      style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: 0 }}
                    />
                    <input
                      type="text"
                      value={orgFormData.primary_color}
                      onChange={e => setOrgFormData({ ...orgFormData, primary_color: e.target.value })}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Cor Secundária</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={orgFormData.secondary_color}
                      onChange={e => setOrgFormData({ ...orgFormData, secondary_color: e.target.value })}
                      style={{ width: '40px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: 0 }}
                    />
                    <input
                      type="text"
                      value={orgFormData.secondary_color}
                      onChange={e => setOrgFormData({ ...orgFormData, secondary_color: e.target.value })}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsOrgModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#334155', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button
                  type="submit"
                  disabled={savingOrg}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)'
                  }}
                >
                  {savingOrg ? 'Salvando...' : (editingOrgId ? 'Salvar Alterações' : 'Criar Igreja')}
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

export default OrganizationSelector;
