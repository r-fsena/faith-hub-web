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

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({ onSelectOrg, onSignOut, userName }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
        const json = await res.json();
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

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      color: '#f8fafc',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Master Bar */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '18px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.2rem',
            boxShadow: '0 4px 14px rgba(15, 118, 110, 0.4)'
          }}>
            FH
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.3px', color: '#ffffff' }}>
                Faith-Hub
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.68rem',
                fontWeight: 800,
                border: '1px solid rgba(52, 211, 153, 0.3)'
              }}>
                MASTER ADMIN
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Painel de Gestão Multi-Redes & Denominações
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#38bdf8'
            }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>{userName}</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Administrador Master</span>
            </div>
          </div>

          <button
            onClick={onSignOut}
            title="Encerrar Sessão"
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: '0.80rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
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
        padding: '48px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        {/* Hub Header Section */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#14b8a6', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              <ShieldIcon /> Hub de Acesso Master
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: '#ffffff' }}>
              Selecione a Rede / Igreja para Gerenciar
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '8px 0 0 0', maxWidth: '640px' }}>
              Como Administrador Master, você pode impersonalizar e acessar o painel de qualquer igreja ou cadastrar uma nova denominação no ecossistema.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '14px 24px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(15, 118, 110, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <PlusIcon /> Nova Organização / Rede
          </button>
        </div>

        {/* Search Bar & Filters */}
        <div style={{
          background: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Buscar por nome da igreja, slug ou CNPJ..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.95rem',
              width: '100%'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Limpar
            </button>
          )}
        </div>

        {/* Grid de Organizações */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #334155', borderTopColor: '#14b8a6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
            Carregando redes e igrejas cadastradas...
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div style={{
            background: '#1e293b',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '64px 24px',
            textAlign: 'center'
          }}>
            <BuildingIcon />
            <h3 style={{ color: '#ffffff', marginTop: '16px', fontSize: '1.2rem' }}>Nenhuma organização encontrada</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.90rem', maxWidth: '420px', margin: '8px auto 20px auto' }}>
              {searchTerm ? 'Nenhuma rede corresponde aos termos da busca.' : 'Clique no botão acima para cadastrar a primeira igreja cliente do sistema.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: '#0f766e',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
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
                  style={{
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Top Color Accent Line */}
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
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: primaryColor,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          boxShadow: `0 4px 12px ${primaryColor}40`
                        }}>
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                            {org.name}
                          </h2>
                          <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            app: <strong style={{ color: '#94a3b8' }}>{org.slug}.faithhubs.com</strong>
                          </span>
                        </div>
                      </div>

                      <span style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.70rem',
                        fontWeight: 800,
                        border: '1px solid rgba(56, 189, 248, 0.25)'
                      }}>
                        {org.plan || 'PRO'}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      padding: '14px',
                      borderRadius: '10px',
                      marginBottom: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.04)'
                    }}>
                      <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                          {org.total_campuses ?? 1}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                          Campi / Filiais
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                          {org.total_members ?? 0}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                          Membros Ativos
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Impersonate Button */}
                  <button
                    onClick={() => onSelectOrg(org)}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
                      transition: 'all 0.15s ease'
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
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '18px',
            padding: '28px',
            width: '100%',
            maxWidth: '520px',
            color: '#ffffff',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Cadastrar Nova Organização / Rede</h3>
                <span style={{ fontSize: '0.80rem', color: '#94a3b8' }}>Adicione um novo cliente / denominação ao SaaS</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.6rem', cursor: 'pointer' }}>×</button>
            </div>

            <form onSubmit={handleCreateOrg} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>Nome Oficial da Igreja / Ministério *</label>
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
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#ffffff'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>Slug PWA / Subdomínio *</label>
                  <input
                    type="text"
                    placeholder="batistacentral"
                    value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>Plano Contratado</label>
                  <select
                    value={formData.plan}
                    onChange={e => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff'
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
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>Cor Primária do PWA</label>
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
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#ffffff', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#cbd5e1' }}>CNPJ (Opcional)</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={e => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', background: '#334155', color: '#ffffff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {saving ? 'Salvando...' : 'Criar e Ativar'}
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
