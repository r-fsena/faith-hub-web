import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export interface Campus {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  is_headquarters: boolean | number;
  pastor_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  status: string;
  total_members?: number;
  total_cells?: number;
  created_at?: string;
}

const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>
);

const CrownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
);

export const Campuses: React.FC = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    is_headquarters: false,
    pastor_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/campuses`);
      if (res.ok) {
        const json = await res.json();
        setCampuses(json.data || []);
      }
    } catch (e) {
      console.error('Erro ao carregar campi:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCampus(null);
    setFormData({
      name: '',
      slug: '',
      is_headquarters: campuses.length === 0,
      pastor_name: '',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      neighborhood: '',
      city: '',
      state: '',
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Campus) => {
    setEditingCampus(c);
    setFormData({
      name: c.name,
      slug: c.slug,
      is_headquarters: Boolean(c.is_headquarters),
      pastor_name: c.pastor_name || '',
      phone: c.phone || '',
      whatsapp: c.whatsapp || '',
      email: c.email || '',
      address: c.address || '',
      neighborhood: c.neighborhood || '',
      city: c.city || '',
      state: c.state || '',
      status: c.status || 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: editingCampus ? prev.slug : val.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      return alert('Preencha o nome e o identificador (slug) da unidade.');
    }

    setSaving(true);
    try {
      const payload = {
        id: editingCampus ? editingCampus.id : undefined,
        ...formData
      };

      const res = await fetch(`${API_URL}/campuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCampuses();
        window.dispatchEvent(new CustomEvent('campuses-updated'));
        alert(editingCampus ? 'Unidade atualizada com sucesso!' : 'Nova unidade criada com sucesso!');
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao salvar unidade: ' + (err.error || 'Falha na requisição'));
      }
    } catch (err: any) {
      alert('Erro de conexão: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (campus: Campus) => {
    if (Boolean(campus.is_headquarters)) {
      return alert('A Sede Principal não pode ser excluída.');
    }

    if (!confirm(`Tem certeza que deseja excluir a unidade "${campus.name}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/campuses/${campus.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCampuses();
        window.dispatchEvent(new CustomEvent('campuses-updated'));
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Erro ao excluir: ' + (err.error || 'Falha na requisição'));
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner & Action */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0369a1 100%)',
        borderRadius: '16px',
        padding: '28px 32px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 24px rgba(15, 118, 110, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BuildingIcon />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9, fontWeight: 700 }}>
              Estrutura Organizacional & Franquias
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0 0 0' }}>
              Gestão de Unidades & Campi da Igreja
            </h2>
            <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '4px' }}>
              Cadastre suas filiais, defina a Sede Principal e gerencie a liderança de cada congregação.
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{
            background: '#ffffff',
            color: '#0f766e',
            border: 'none',
            padding: '12px 22px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.90rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          <PlusIcon /> Nova Unidade / Campus
        </button>
      </div>

      {/* Grid de Unidades */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando unidades da igreja...
        </div>
      ) : campuses.length === 0 ? (
        <div className="portal-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <BuildingIcon />
          <h3 style={{ marginTop: '12px', color: 'var(--text-main)' }}>Nenhuma unidade encontrada</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.90rem' }}>
            Clique em "Nova Unidade" para cadastrar sua Sede ou filiais.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {campuses.map(campus => {
            const isHQ = Boolean(campus.is_headquarters);
            return (
              <div 
                key={campus.id} 
                className="portal-card" 
                style={{ 
                  margin: 0, 
                  padding: '24px', 
                  position: 'relative',
                  border: isHQ ? '2px solid #0f766e' : '1px solid var(--panel-border)',
                  boxShadow: isHQ ? '0 8px 20px rgba(15, 118, 110, 0.08)' : 'var(--shadow-sm)'
                }}
              >
                {/* Badge Sede */}
                {isHQ && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <CrownIcon /> SEDE PRINCIPAL
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isHQ ? 'var(--accent-primary-gradient)' : '#f1f5f9',
                    color: isHQ ? '#ffffff' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800
                  }}>
                    {campus.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {campus.name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      slug: <strong>{campus.slug}</strong>
                    </span>
                  </div>
                </div>

                {/* Info List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '16px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPinIcon />
                    <span>{campus.city ? `${campus.city} - ${campus.state || 'UF'}` : 'Endereço não informado'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UsersIcon />
                    <span>Pastor: <strong>{campus.pastor_name || 'A definir'}</strong></span>
                  </div>
                  {campus.whatsapp && (
                    <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>
                      WhatsApp: {campus.whatsapp}
                    </div>
                  )}
                </div>

                {/* KPIs da Unidade */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  background: '#f8fafc',
                  padding: '12px',
                  borderRadius: '10px',
                  marginBottom: '16px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      {campus.total_members || 0}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Membros
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                      {campus.total_cells || 0}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Células
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--panel-border)', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleOpenEditModal(campus)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: '#f1f5f9',
                      color: 'var(--text-main)',
                      fontSize: '0.80rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <EditIcon /> Editar
                  </button>
                  {!isHQ && (
                    <button
                      onClick={() => handleDelete(campus)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        fontSize: '0.80rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                      title="Excluir Campus"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar / Editar Unidade */}
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
          <div className="portal-card animate-fade-in" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', margin: 0 }}>
            <div className="card-header-row" style={{ marginBottom: '20px' }}>
              <div>
                <h2 className="card-title" style={{ fontSize: '1.25rem' }}>
                  {editingCampus ? 'Editar Unidade / Campus' : 'Cadastrar Nova Unidade'}
                </h2>
                <span className="card-subtitle">
                  Configure os dados da congregação
                </span>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Nome da Unidade / Campus *</label>
                <input
                  type="text"
                  placeholder="Ex: Campus Alphaville, Sede Central..."
                  value={formData.name}
                  onChange={e => handleNameChange(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Slug / Identificador *</label>
                  <input
                    type="text"
                    placeholder="alphaville"
                    value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Pastor Local / Responsável</label>
                  <input
                    type="text"
                    placeholder="Pr. João Silva"
                    value={formData.pastor_name}
                    onChange={e => setFormData(prev => ({ ...prev, pastor_name: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>WhatsApp da Recepção</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={formData.whatsapp}
                    onChange={e => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>E-mail de Contato</label>
                  <input
                    type="email"
                    placeholder="alphaville@igreja.com"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Endereço Completo</label>
                <input
                  type="text"
                  placeholder="Av. das Nações, 1000 - Centro"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Cidade</label>
                  <input
                    type="text"
                    placeholder="São Paulo"
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Estado (UF)</label>
                  <input
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    value={formData.state}
                    onChange={e => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--panel-border)' }}
                  />
                </div>
              </div>

              {/* Checkbox Sede Principal */}
              <div style={{
                background: '#f8fafc',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid var(--panel-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <input
                  type="checkbox"
                  id="is_hq_check"
                  checked={formData.is_headquarters}
                  onChange={e => setFormData(prev => ({ ...prev, is_headquarters: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#0f766e' }}
                />
                <label htmlFor="is_hq_check" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>
                  Definir como Sede Principal (Matriz) da Organização
                </label>
              </div>

              {/* Botões */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', background: '#f1f5f9', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                  style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: 700 }}
                >
                  {saving ? 'Salvando...' : editingCampus ? 'Atualizar Unidade' : 'Criar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Campuses;
