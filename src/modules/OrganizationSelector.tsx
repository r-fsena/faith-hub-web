import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  const [activeTab, setActiveTab] = useState<'orgs' | 'proposals' | 'subscriptions' | 'master_users'>('orgs');
  
  // Organizations State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgFormData, setOrgFormData] = useState({
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
    notes: ''
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
  }, []);

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

  const handleCreateOrg = async (e: React.FormEvent) => {
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
      }
    } catch (e) {
      alert('Erro ao criar organização');
    } finally {
      setSavingOrg(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProposal(true);
    try {
      const res = await fetch(`${API_URL}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...proposalForm,
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
          notes: ''
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: 'inherit' }}>
      
      {/* Top Header do SaaS Command Center */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--panel-border)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--accent-primary-gradient)',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                  Faith-Hub
                </h1>
                <span style={{
                  background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                  color: '#ffffff',
                  fontSize: '0.70rem',
                  fontWeight: 900,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em'
                }}>
                  MASTER COMMAND CENTER
                </span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Gestão Global de Redes, Propostas Comerciais & Recorrência Asaas
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', display: 'none', md: 'block' } as any}>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)' }}>{userName || 'Super Administrador'}</div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>● Acesso Global Ativo</div>
            </div>

            <button
              onClick={onSignOut}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.80rem', borderRadius: '10px' }}
            >
              Sair
            </button>
          </div>

        </div>

        {/* Executive KPI Bar */}
        <div style={{ background: '#f8fafc', borderTop: '1px solid var(--panel-border)', padding: '12px 24px' }}>
          <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            
            <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '10px 14px' }}>
              <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>🏛️ Igrejas Ativas</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>{organizations.length}</div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '10px 14px' }}>
              <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>💵 MRR Ativo (Asaas)</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
                R$ {Number(proposalStats.active_mrr || (organizations.length * 297)).toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '10px 14px' }}>
              <div style={{ fontSize: '0.70rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>⏳ Pipeline de Propostas</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0284c7', marginTop: '2px' }}>
                R$ {Number(proposalStats.pipeline_mrr || 0).toFixed(2).replace('.', ',')}
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '12px', padding: '10px 14px' }}>
              <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>🎯 Taxa de Conversão</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', marginTop: '2px' }}>
                {proposalStats.conversion_rate || 0}%
              </div>
            </div>

          </div>
        </div>

        {/* Master Navigation Tabs */}
        <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
          {[
            { id: 'orgs', label: `🏛️ Redes & Igrejas Ativas (${organizations.length})` },
            { id: 'proposals', label: `📊 Funil de Propostas (${proposals.length})` },
            { id: 'subscriptions', label: `💳 Assinaturas Asaas (${subscriptions.length})` },
            { id: 'master_users', label: '🛡️ Equipe Master' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 18px',
                border: 'none',
                borderBottom: activeTab === tab.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                background: 'transparent',
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.84rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1360px', margin: '0 auto', padding: '28px 24px' }}>
        
        {/* ========================================================
            TAB 1: REDES & IGREJAS ATIVAS
            ======================================================== */}
        {activeTab === 'orgs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div className="search-box-modern" style={{ width: '360px', margin: 0 }}>
                <input
                  type="text"
                  placeholder="Buscar por nome da igreja, slug ou CNPJ..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                onClick={() => setIsOrgModalOpen(true)}
                className="btn-primary"
                style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.84rem' }}
              >
                + Nova Organização / Rede
              </button>
            </div>

            {/* Grid de Igrejas */}
            {loadingOrgs ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Carregando igrejas...</div>
            ) : filteredOrgs.length === 0 ? (
              <div className="portal-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
                <h3>Nenhuma organização encontrada</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>Crie uma nova rede ou emita uma proposta comercial.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {filteredOrgs.map(org => (
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
                      border: '1px solid var(--panel-border)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${org.primary_color || '#0f766e'} 0%, ${org.secondary_color || '#14b8a6'} 100%)` }} />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: org.primary_color || '#0f766e', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{org.name}</h2>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>app: <strong>app.faithhubs.com/{org.slug}</strong></span>
                          </div>
                        </div>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontSize: '0.70rem', fontWeight: 800 }}>{org.plan || 'PRO'}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '16px', border: '1px solid var(--panel-border)' }}>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{org.total_campuses ?? 1}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Campi / Filiais</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>Ativa</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status do SaaS</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => onSelectOrg(org)}
                        className="btn-primary"
                        style={{ flex: 1, padding: '10px', fontSize: '0.84rem', borderRadius: '10px' }}
                      >
                        Acessar Studio ➔
                      </button>
                      <a
                        href={`https://app.faithhubs.com/${org.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{ padding: '10px 14px', fontSize: '0.84rem', borderRadius: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                      >
                        📱 App
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: FUNIL DE PROPOSTAS COMERCIAIS
            ======================================================== */}
        {activeTab === 'proposals' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              
              {/* Filtros de Status */}
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
                className="btn-primary"
                style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.84rem' }}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
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

        {/* ========================================================
            TAB 3: ASSINATURAS & FATURAMENTO ASAAS
            ======================================================== */}
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

        {/* ========================================================
            TAB 4: EQUIPE MASTER
            ======================================================== */}
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
                className="btn-primary"
                style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.84rem' }}
              >
                + Novo Usuário Master
              </button>
            </div>

            <div className="portal-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-primary-gradient)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
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
            {/* Modal Header */}
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

            {/* Modal Form */}
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
                    Plano
                  </label>
                  <select
                    value={proposalForm.plan_tier}
                    onChange={e => setProposalForm({ ...proposalForm, plan_tier: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.86rem', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }}
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>
                    Mensalidade (R$) *
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
          MODAL: NOVA ORGANIZAÇÃO MANUAL (PORTAL)
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
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Nova Rede / Denominação</h3>
              <button
                type="button"
                onClick={() => setIsOrgModalOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrg} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Nome da Igreja *</label>
                <input type="text" value={orgFormData.name} onChange={e => setOrgFormData({ ...orgFormData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-') })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#0f172a' }}>Slug do PWA (app.faithhubs.com/slug)</label>
                <input type="text" value={orgFormData.slug} onChange={e => setOrgFormData({ ...orgFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', boxSizing: 'border-box' }} required />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsOrgModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#334155', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={savingOrg} style={{ flex: 2, padding: '12px', borderRadius: '12px', fontWeight: 800, background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', color: '#ffffff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)' }}>
                  {savingOrg ? 'Criando...' : 'Criar Igreja'}
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
