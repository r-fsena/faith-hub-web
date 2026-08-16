import React, { useState, useEffect } from 'react';

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

interface OrganizationSelectorProps {
  onSelectOrg: (org: Organization) => void;
  onSignOut: () => void;
  userName: string;
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);

const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ onSelectOrg, onSignOut, userName }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Master Users State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'MASTER_ADMIN'
  });

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    cnpj: '',
    plan: 'PRO',
    primary_color: '#0f766e',
    secondary_color: '#14b8a6',
    status: 'ACTIVE'
  });

  useEffect(() => {
    // Garante que o Portal Master use SEMPRE a identidade visual oficial da plataforma SaaS
    document.documentElement.style.setProperty('--accent-primary', '#0f766e');
    document.documentElement.style.setProperty('--accent-primary-gradient', 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)');
    document.documentElement.style.setProperty('--accent-primary-light', '#f0fdfa');
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/organizations`);
      if (res.ok) {
        const json = await res.json();
        setOrganizations(json.data || []);
      }
    } catch (e) {
      console.error('Erro ao buscar organizações:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      return alert('Preencha o nome e o slug da organização.');
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          name: '',
          slug: '',
          cnpj: '',
          plan: 'PRO',
          primary_color: '#0f766e',
          secondary_color: '#14b8a6',
          status: 'ACTIVE'
        });
        fetchOrganizations();
        alert('Nova rede/organização criada com sucesso!');
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao criar organização: ' + (err.error || 'Falha na requisição'));
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMasterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email) {
      return alert('Preencha o nome e o e-mail do usuário master.');
    }

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
        alert(`Usuário Master criado com sucesso!\nUm e-mail de acesso e ativação de senha provisória foi enviado para ${userFormData.email}.`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao criar usuário master: ' + (err.error || err.message || 'Falha na requisição'));
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setSavingUser(false);
    }
  };

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-main)',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header Bar (Matching App Design System) */}
      <header className="topbar" style={{ position: 'sticky', top: 0, zIndex: 40, padding: '16px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="sidebar-logo">
            <SparklesIcon />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text-main)' }}>
                Faith-Hub
              </span>
              <span className="sidebar-brand-badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                MASTER ADMIN
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Painel de Gestão Multi-Redes & Denominações
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="user-mini-card" style={{ background: '#ffffff', padding: '6px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="user-avatar-circle">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{userName}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Administrador Master</span>
              </div>
            </div>
          </div>

          <button
            onClick={onSignOut}
            title="Encerrar Sessão"
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              background: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              fontSize: '0.80rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOutIcon /> Sair
          </button>
        </div>
      </header>

      {/* Main Hub Body */}
      <main style={{
        flex: 1,
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px'
      }}>
        {/* Hub Header Hero Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0369a1 100%)',
          borderRadius: '16px',
          padding: '32px 36px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          boxShadow: '0 8px 24px rgba(15, 118, 110, 0.2)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              <ShieldIcon /> Hub de Acesso Master
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
              Selecione a Rede / Igreja para Gerenciar
            </h1>
            <p style={{ opacity: 0.85, fontSize: '0.90rem', margin: '6px 0 0 0', maxWidth: '640px', lineHeight: '1.5' }}>
              Como Administrador Master, acesse o painel administrativo de qualquer igreja cliente ou cadastre uma nova denominação no ecossistema.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsUserModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                padding: '12px 20px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.15s ease',
                backdropFilter: 'blur(8px)'
              }}
            >
              <UserPlusIcon /> Novo Usuário Master
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: '#ffffff',
                color: '#0f766e',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.15s ease'
              }}
            >
              <PlusIcon /> Nova Organização / Rede
            </button>
          </div>
        </div>

        {/* Search Pill Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div className="search-pill" style={{ maxWidth: '520px', background: '#ffffff', border: '1px solid var(--panel-border)' }}>
            <SearchIcon />
            <input
              type="text"
              placeholder="Buscar por nome da igreja, slug ou CNPJ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Limpar
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Total: <strong>{filteredOrgs.length}</strong> organização(ões)
          </div>
        </div>

        {/* Grid de Organizações */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
            Carregando redes e igrejas cadastradas...
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="portal-card" style={{
            padding: '64px 24px',
            textAlign: 'center'
          }}>
            <BuildingIcon />
            <h3 style={{ color: 'var(--text-main)', marginTop: '16px', fontSize: '1.2rem' }}>Nenhuma organização encontrada</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.90rem', maxWidth: '420px', margin: '8px auto 20px auto' }}>
              {searchTerm ? 'Nenhuma rede corresponde aos termos da busca.' : 'Clique no botão acima para cadastrar a primeira igreja cliente do sistema.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
              style={{ padding: '10px 20px', borderRadius: '8px' }}
            >
              Criar Nova Rede
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '24px'
          }}>
            {filteredOrgs.map(org => {
              const primaryColor = org.primary_color || '#0f766e';
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
                    border: '1px solid var(--panel-border)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {/* Top Accent Line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${primaryColor} 0%, ${org.secondary_color || '#14b8a6'} 100%)`
                  }} />

                  <div>
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background: primaryColor,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          boxShadow: `0 4px 12px ${primaryColor}30`
                        }}>
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                            {org.name}
                          </h2>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            app: <strong>{org.slug}.faithhubs.com</strong>
                          </span>
                        </div>
                      </div>

                      <span style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.70rem',
                        fontWeight: 800
                      }}>
                        {org.plan || 'PRO'}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      background: '#f8fafc',
                      padding: '14px',
                      borderRadius: '10px',
                      marginBottom: '20px',
                      border: '1px solid var(--panel-border)'
                    }}>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          {org.total_campuses ?? 1}
                        </div>
                        <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Campi / Filiais
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                          {org.total_members ?? 0}
                        </div>
                        <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Membros Ativos
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impersonate Button */}
                  <button
                    onClick={() => onSelectOrg(org)}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '11px 16px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    Acessar Painel da Igreja <ArrowRightIcon />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Criar Nova Organização */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="portal-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '520px',
            margin: 0,
            padding: '28px'
          }}>
            <div className="card-header-row" style={{ marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>Cadastrar Nova Organização / Rede</h3>
                <span className="card-subtitle">Adicione um novo cliente / denominação ao SaaS</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.6rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleCreateOrg} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Nome Oficial da Igreja / Ministério *</label>
                <input
                  type="text"
                  placeholder="Ex: Igreja Batista Central"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    name: e.target.value,
                    slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
                  }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Slug PWA / Subdomínio *</label>
                  <input
                    type="text"
                    placeholder="batistacentral"
                    value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Plano Contratado</label>
                  <select
                    value={formData.plan}
                    onChange={e => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: '#ffffff'
                    }}
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Cor Primária do PWA</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={e => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      style={{ width: '38px', height: '38px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={e => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--panel-border)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>CNPJ (Opcional)</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={e => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', background: '#f1f5f9', color: 'var(--text-main)', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{ padding: '10px 22px', borderRadius: '8px', fontWeight: 700 }}
                >
                  {saving ? 'Salvando...' : 'Criar e Ativar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Criar Novo Usuário Master */}
      {isUserModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="portal-card animate-fade-in" style={{
            width: '100%',
            maxWidth: '500px',
            margin: 0,
            padding: '28px'
          }}>
            <div className="card-header-row" style={{ marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldIcon />
                  <h3 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>Criar Usuário Master</h3>
                </div>
                <span className="card-subtitle" style={{ marginTop: '4px', display: 'block' }}>
                  Acesso administrativo global para gerenciar todas as redes e congregações
                </span>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.6rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleCreateMasterUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: Rafael Sena"
                  value={userFormData.name}
                  onChange={e => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>E-mail de Acesso *</label>
                <input
                  type="email"
                  placeholder="admin@faithhub.com"
                  value={userFormData.email}
                  onChange={e => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>WhatsApp / Telefone (Opcional)</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={userFormData.phone}
                  onChange={e => setUserFormData(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--panel-border)'
                  }}
                />
              </div>

              <div style={{
                background: '#f0fdfa',
                border: '1px solid #99f6e4',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '0.80rem',
                color: '#0f766e',
                lineHeight: 1.4
              }}>
                ℹ️ <strong>Permissão Global:</strong> O usuário receberá um e-mail do sistema com as credenciais iniciais e terá permissão de visualizar e alternar entre quaisquer organizações cadastradas.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', background: '#f1f5f9', color: 'var(--text-main)', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="btn-primary"
                  style={{ padding: '10px 22px', borderRadius: '8px', fontWeight: 700 }}
                >
                  {savingUser ? 'Enviando Convite...' : 'Criar e Convidar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationSelector;
