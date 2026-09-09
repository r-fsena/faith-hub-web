import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Members.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const BookOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

type DevotionalData = {
  id: string;
  organization_id?: string;
  campus_id?: string | null;
  available_date: string;
  title: string;
  source_type: string;
  source_name: string;
  suggested_song_title: string;
  suggested_song_youtube_id: string;
  central_text: string;
  context_text: string;
  prayer_indication: string;
  pastoral_author_name?: string;
  pastoral_author_role?: string;
  pastoral_author_avatar?: string;
  pastoral_comment?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  notify_members?: boolean;
  created_at?: string;
  updated_at?: string;
};

export interface DevotionalsProps {
  selectedCampusId?: string;
  selectedOrganization?: any;
}

export const Devotionals: React.FC<DevotionalsProps> = ({ selectedCampusId = 'all', selectedOrganization }) => {
  const [devotionals, setDevotionals] = useState<DevotionalData[]>([]);
  const [campuses, setCampuses] = useState<{ id: string; name: string; is_headquarters?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessPrompt, setShowSuccessPrompt] = useState(false);
  const [successStatus, setSuccessStatus] = useState<'DRAFT' | 'PUBLISHED' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const orgId = selectedOrganization?.id || 'org_default';
  const churchName = selectedOrganization?.name || 'Igreja';

  const defaultForm = () => ({
    id: '',
    organization_id: orgId,
    campus_id: selectedCampusId !== 'all' ? selectedCampusId : '',
    available_date: new Date().toISOString().split('T')[0],
    title: '',
    source_type: 'LOCAL',
    source_name: '',
    suggested_song_title: '',
    suggested_song_youtube_id: '',
    central_text: '',
    context_text: '',
    prayer_indication: '',
    pastoral_author_name: selectedOrganization?.name ? `Pastoral • ${selectedOrganization.name}` : '', 
    pastoral_author_role: 'Pastor Titular',
    pastoral_author_avatar: '',
    pastoral_comment: '',
    notify_members: false
  });

  const [formData, setFormData] = useState<DevotionalData>(defaultForm());

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    } catch {
      return { 'Content-Type': 'application/json' };
    }
  };

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/campuses?organization_id=${encodeURIComponent(orgId)}`, { headers });
        if (res.ok) {
          const json = await res.json();
          setCampuses(json.data || []);
        }
      } catch (e) {
        console.error('Erro ao buscar campi:', e);
      }
    };
    fetchCampuses();
  }, [orgId]);

  const loadDevotionals = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      params.append('admin', 'true');
      if (orgId) params.append('organization_id', orgId);
      if (selectedCampusId && selectedCampusId !== 'all') params.append('campus_id', selectedCampusId);
      const res = await fetch(`${API_URL}/devotionals?${params.toString()}`, { headers });
      if (res.ok) {
        setDevotionals(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevotionals();
  }, [orgId, selectedCampusId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateOnly = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC'
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleStatus = async (dev: DevotionalData, e: React.MouseEvent) => {
    e.stopPropagation();
    const isPublished = dev.status === 'PUBLISHED';
    const newStatus: 'DRAFT' | 'PUBLISHED' = isPublished ? 'DRAFT' : 'PUBLISHED';
    setTogglingId(dev.id);

    // Atualização otimista
    setDevotionals(prev => prev.map(item => item.id === dev.id ? { ...item, status: newStatus } : item));

    try {
      const headers = await getAuthHeaders();
      let avDate = dev.available_date;
      if (avDate && avDate.includes('T')) {
        avDate = avDate.split('T')[0];
      }
      const payload = {
        ...dev,
        available_date: avDate,
        organization_id: dev.organization_id || orgId,
        campus_id: dev.campus_id || null,
        status: newStatus
      };

      const res = await fetch(`${API_URL}/devotionals`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        setDevotionals(prev => prev.map(item => item.id === dev.id ? { ...item, status: dev.status } : item));
        alert("Não foi possível alterar a situação do devocional.");
      } else {
        loadDevotionals();
      }
    } catch (err) {
      console.error(err);
      setDevotionals(prev => prev.map(item => item.id === dev.id ? { ...item, status: dev.status } : item));
      alert("Erro de conexão ao alterar status.");
    } finally {
      setTogglingId(null);
    }
  };

  const openNewModal = () => {
    setFormData(defaultForm());
    setShowSuccessPrompt(false);
    setActiveModalTab('editor');
    setShowModal(true);
  };

  const openEditModal = (d: DevotionalData) => {
    let avDate = d.available_date;
    if (avDate && avDate.includes('T')) {
      avDate = avDate.split('T')[0];
    }
    setFormData({
      id: d.id,
      organization_id: d.organization_id || orgId,
      campus_id: d.campus_id || '',
      available_date: avDate || new Date().toISOString().split('T')[0],
      title: d.title || '',
      source_type: d.source_type || 'LOCAL',
      source_name: d.source_name || '',
      suggested_song_title: d.suggested_song_title || '',
      suggested_song_youtube_id: d.suggested_song_youtube_id || '',
      central_text: d.central_text || '',
      context_text: d.context_text || '',
      prayer_indication: d.prayer_indication || '',
      pastoral_author_name: d.pastoral_author_name || (selectedOrganization?.name ? `Pastoral • ${selectedOrganization.name}` : ''),
      pastoral_author_role: d.pastoral_author_role || 'Pastor Titular',
      pastoral_author_avatar: d.pastoral_author_avatar || '',
      pastoral_comment: d.pastoral_comment || '',
      status: d.status || 'DRAFT',
      notify_members: !!d.notify_members
    });
    setShowSuccessPrompt(false);
    setActiveModalTab('editor');
    setShowModal(true);
  };

  const handleSave = async (desiredStatus: 'DRAFT' | 'PUBLISHED') => {
    if (!formData.available_date || !formData.title || !formData.central_text || !formData.context_text) {
      alert("⚠️ Você precisa preencher pelo menos: Data, Título, Texto Central Bíblico e Contexto!");
      setActiveModalTab('editor');
      return;
    }

    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();
      const payload = {
        ...formData,
        organization_id: orgId,
        campus_id: formData.campus_id && formData.campus_id !== 'all' ? formData.campus_id : null,
        status: desiredStatus
      };

      const res = await fetch(`${API_URL}/devotionals`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSuccessStatus(desiredStatus);
        setShowSuccessPrompt(true);
        loadDevotionals();
      } else {
        alert("Erro no servidor ao salvar o devocional.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com a Base de Dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Remover este devocional permanentemente?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/devotionals/${id}`, { method: 'DELETE', headers });
      if (res.ok) loadDevotionals();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDevotionals = devotionals.filter(dev => {
    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'PUBLISHED' ? dev.status === 'PUBLISHED' :
      dev.status === 'DRAFT';

    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesStatus;

    const matchesTerm = 
      (dev.id && dev.id.toLowerCase().includes(term)) ||
      (dev.title && dev.title.toLowerCase().includes(term)) ||
      (dev.source_name && dev.source_name.toLowerCase().includes(term)) ||
      (dev.central_text && dev.central_text.toLowerCase().includes(term)) ||
      (dev.pastoral_author_name && dev.pastoral_author_name.toLowerCase().includes(term));

    return matchesStatus && matchesTerm;
  });

  const publishedCount = devotionals.filter(d => d.status === 'PUBLISHED').length;
  const draftCount = devotionals.filter(d => d.status === 'DRAFT').length;

  return (
    <div className="members-container animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <div className="card-header-row" style={{ paddingBottom: 20, borderBottom: '1px solid var(--panel-border)', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="card-title" style={{ fontSize: '1.4rem', margin: 0 }}>
              Devocionais e Palavra Diária • {churchName}
            </h1>
            <span style={{ fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
              {devotionals.length} cadastrados
            </span>
          </div>
          <p className="card-subtitle" style={{ margin: 0 }}>
            Gerenciamento completo das reflexões e leituras diárias no app dos membros da <strong>{churchName}</strong>.
          </p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <PlusIcon /> Adicionar Devocional
        </button>
      </div>

      {/* Toolbar / Filtros */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 14, 
        marginBottom: 20, 
        background: 'var(--panel-bg, #ffffff)', 
        padding: '12px 18px', 
        borderRadius: 14, 
        border: '1px solid var(--panel-border, #e2e8f0)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: 460 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>
            <SearchIcon />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por título, ID, passagem bíblica ou autor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 38px',
              borderRadius: 10,
              border: '1px solid var(--panel-border, #cbd5e1)',
              background: '#f8fafc',
              fontSize: '0.88rem',
              color: 'var(--text-main)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Filter Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: statusFilter === 'ALL' ? 'var(--accent-primary, #0f766e)' : 'var(--panel-border, #e2e8f0)',
              background: statusFilter === 'ALL' ? 'rgba(15, 118, 110, 0.1)' : 'transparent',
              color: statusFilter === 'ALL' ? 'var(--accent-primary, #0f766e)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Todos ({devotionals.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PUBLISHED')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: statusFilter === 'PUBLISHED' ? '#10b981' : 'var(--panel-border, #e2e8f0)',
              background: statusFilter === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: statusFilter === 'PUBLISHED' ? '#059669' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            ● Publicados ({publishedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('DRAFT')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: statusFilter === 'DRAFT' ? '#f59e0b' : 'var(--panel-border, #e2e8f0)',
              background: statusFilter === 'DRAFT' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
              color: statusFilter === 'DRAFT' ? '#d97706' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            ○ Rascunhos / Inativos ({draftCount})
          </button>
        </div>
      </div>

      {/* Dica de interação */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 8, 
        fontSize: '0.80rem', 
        color: 'var(--text-muted)', 
        marginBottom: 12,
        paddingLeft: 4 
      }}>
        <span>💡 <em>Dica: Clique sobre qualquer linha da tabela para abrir o modal e editar o devocional.</em></span>
      </div>

      {/* Tabela de Devocionais */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Carregando devocionais...</div>
      ) : filteredDevotionals.length === 0 ? (
        <div className="empty-state" style={{ background: 'var(--panel-bg, #ffffff)', borderRadius: 16, border: '1px solid var(--panel-border)', padding: 48 }}>
          <BookOpenIcon />
          <h3>{searchTerm || statusFilter !== 'ALL' ? 'Nenhum devocional encontrado para os filtros' : `Nenhum devocional publicado para ${churchName}`}</h3>
          <p>{searchTerm || statusFilter !== 'ALL' ? 'Tente limpar a busca ou mudar o filtro de status.' : 'Clique em Adicionar Devocional para redigir a primeira palavra inspiracional desta congregação.'}</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--panel-bg, #ffffff)',
          borderRadius: 16,
          border: '1px solid var(--panel-border, #e2e8f0)',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 920 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--panel-border, #e2e8f0)' }}>
                  <th style={{ padding: '14px 18px', fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: 110 }}>
                    ID
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Título & Conteúdo
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: 130 }}>
                    Status
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }}>
                    Data Criação
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: 140 }}>
                    Data Atualização
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: 130 }}>
                    Publicado
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: 130, textAlign: 'center' }}>
                    Ativar / Desativar
                  </th>
                  <th style={{ padding: '14px 18px', fontSize: '0.76rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: 90, textAlign: 'center' }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDevotionals.map((dev) => {
                  const isPublished = dev.status === 'PUBLISHED';
                  const shortId = dev.id ? dev.id.substring(0, 8) : '---';
                  const isCopied = copiedId === dev.id;
                  const isToggling = togglingId === dev.id;

                  return (
                    <tr 
                      key={dev.id} 
                      onClick={() => openEditModal(dev)}
                      title="Clique para editar este devocional"
                      style={{ 
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        borderBottom: '1px solid var(--panel-border, #f1f5f9)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* ID */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(dev.id, e)}
                          title={`Copiar ID completo: ${dev.id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            padding: '4px 8px',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            cursor: 'pointer'
                          }}
                        >
                          {isCopied ? (
                            <>
                              <span style={{ color: '#059669', display: 'flex' }}><CheckIcon /></span>
                              <span style={{ color: '#059669', fontWeight: 700 }}>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <span style={{ display: 'flex' }}><CopyIcon /></span>
                              <span>#{shortId}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Título & Conteúdo */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: 4, lineHeight: 1.3 }}>
                          {dev.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            📖 {dev.source_name || 'Passagem Bíblica'}
                          </span>
                          {dev.pastoral_author_name && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                              • {dev.pastoral_author_name}
                            </span>
                          )}
                          {dev.campus_id ? (
                            <span style={{ fontSize: '0.68rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                              📍 {campuses.find(c => c.id === dev.campus_id)?.name || 'Filial'}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>
                              🌐 Todas as Filiais
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        {isPublished ? (
                          <span className="status-badge excellent" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            ● PUBLICADO
                          </span>
                        ) : (
                          <span className="status-badge pending" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            ○ RASCUNHO
                          </span>
                        )}
                      </td>

                      {/* Data Criação */}
                      <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(dev.created_at)}
                      </td>

                      {/* Data Atualização */}
                      <td style={{ padding: '14px 18px', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(dev.updated_at || dev.created_at)}
                      </td>

                      {/* Publicado (Data Disponível) */}
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isPublished ? 'var(--accent-primary, #0f766e)' : 'var(--text-muted)' }}>
                          📅 {formatDateOnly(dev.available_date)}
                        </span>
                      </td>

                      {/* Flag Desativar / Ativar */}
                      <td style={{ padding: '14px 18px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div 
                          onClick={(e) => handleToggleStatus(dev, e)}
                          title={isPublished ? "Clique para desativar este devocional" : "Clique para ativar/publicar este devocional"}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 10px',
                            borderRadius: 20,
                            background: isPublished ? 'rgba(16, 185, 129, 0.1)' : '#f1f5f9',
                            border: `1px solid ${isPublished ? 'rgba(16, 185, 129, 0.3)' : '#e2e8f0'}`,
                            cursor: isToggling ? 'wait' : 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Toggle Switch */}
                          <div style={{
                            width: 32,
                            height: 18,
                            borderRadius: 18,
                            background: isPublished ? '#10b981' : '#cbd5e1',
                            position: 'relative',
                            transition: 'background 0.2s ease',
                            display: 'inline-block'
                          }}>
                            <div style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: '#ffffff',
                              position: 'absolute',
                              top: 2,
                              left: isPublished ? 16 : 2,
                              transition: 'left 0.2s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                          </div>

                          {/* Label */}
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            color: isPublished ? '#059669' : '#64748b' 
                          }}>
                            {isToggling ? 'Salvando...' : isPublished ? 'Ativo' : 'Desativado'}
                          </span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td style={{ padding: '14px 18px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className="action-circle-btn"
                            title="Editar devocional"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(dev);
                            }}
                            style={{ width: 30, height: 30, color: 'var(--accent-primary, #0f766e)' }}
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            className="action-circle-btn"
                            title="Excluir devocional"
                            onClick={(e) => handleDelete(dev.id, e)}
                            style={{ width: 30, height: 30, color: 'var(--danger, #ef4444)' }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL STUDIO (2-Column Horizontal Split Architecture)
          ======================================================== */}
      {showModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-studio-container animate-scale-up" onClick={e => e.stopPropagation()}>
            
            {/* Top Bar Header */}
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'rgba(15, 118, 110, 0.1)', color: 'var(--accent-primary, #0f766e)' }}>
                  <BookOpenIcon />
                </div>
                <div>
                  <div className="modal-studio-title">
                    {formData.id ? 'Editar Devocional Diário' : `Novo Devocional Diário • ${churchName}`}
                  </div>
                  <div className="modal-studio-subtitle">
                    Alinhe a reflexão, a palavra bíblica e o louvor para o dia da congregação.
                  </div>
                </div>
              </div>

              {/* Segmented Control & Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="segmented-control">
                  <div 
                    className={`segmented-btn ${activeModalTab === 'editor' ? 'active' : ''}`}
                    onClick={() => setActiveModalTab('editor')}
                  >
                    ✍️ Redação & Campos
                  </div>
                  <div 
                    className={`segmented-btn ${activeModalTab === 'preview' ? 'active' : ''}`}
                    onClick={() => setActiveModalTab('preview')}
                  >
                    📱 Visualização no App
                  </div>
                </div>

                <button className="modal-close-circle" onClick={() => setShowModal(false)} title="Fechar">
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-studio-body">
              {activeModalTab === 'editor' && (
                <div className="modal-studio-grid">
                  
                  {/* Left Column (60%) */}
                  <div className="modal-studio-column">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
                      <div className="form-group-modern">
                        <label className="form-label-modern">Data da Leitura *</label>
                        <input 
                          type="date" 
                          className="input-modern"
                          value={formData.available_date} 
                          onChange={e => setFormData({...formData, available_date: e.target.value})} 
                        />
                      </div>
                      <div className="form-group-modern">
                        <label className="form-label-modern">Unidade / Filial</label>
                        <select 
                          className="select-modern"
                          value={formData.campus_id || 'all'} 
                          onChange={e => setFormData({...formData, campus_id: e.target.value === 'all' ? '' : e.target.value})}
                        >
                          <option value="all">Todas as Filiais (Geral)</option>
                          {campuses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.is_headquarters ? `👑 ${c.name} (Sede)` : c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group-modern">
                        <label className="form-label-modern">Origem do Conteúdo</label>
                        <select 
                          className="select-modern"
                          value={formData.source_type || 'LOCAL'} 
                          onChange={e => setFormData({...formData, source_type: e.target.value})}
                        >
                          <option value="LOCAL">Autoral (Sua Igreja)</option>
                          <option value="BIBLE">Passagem Bíblica / Estudo</option>
                          <option value="GLOBAL">Global (Redes externas)</option>
                        </select>
                      </div>
                    </div>

                        <div className="form-group-modern">
                          <label className="form-label-modern">Título da Mensagem do Dia *</label>
                          <input 
                            type="text" 
                            className="input-modern"
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                            placeholder="Ex: O Cuidado de Deus em Tempos Difíceis..." 
                          />
                        </div>

                        {formData.source_type === 'GLOBAL' && (
                          <div className="form-group-modern">
                            <label className="form-label-modern">Nome do Autor / Ministério</label>
                            <input 
                              type="text" 
                              className="input-modern"
                              value={formData.source_name} 
                              onChange={e => setFormData({...formData, source_name: e.target.value})} 
                              placeholder="Ex: Ministério Pão Diário" 
                            />
                          </div>
                        )}

                        <div className="form-group-modern">
                          <label className="form-label-modern">Trecho Bíblico Central * (Destaque)</label>
                          <textarea 
                            rows={2} 
                            className="textarea-modern"
                            value={formData.central_text} 
                            onChange={e => setFormData({...formData, central_text: e.target.value})} 
                            placeholder="O Senhor é o meu pastor, nada me faltará... Salmos 23:1" 
                          />
                        </div>

                        <div className="form-group-modern">
                          <label className="form-label-modern">O Contexto e o Ensino Completo *</label>
                          <textarea 
                            rows={6} 
                            className="textarea-modern"
                            value={formData.context_text} 
                            onChange={e => setFormData({...formData, context_text: e.target.value})} 
                            placeholder="Escreva a partilha do ensinamento aqui..." 
                          />
                        </div>

                        <div className="form-group-modern">
                          <label className="form-label-modern">Diretriz de Oração</label>
                          <textarea 
                            rows={2} 
                            className="textarea-modern"
                            value={formData.prayer_indication} 
                            onChange={e => setFormData({...formData, prayer_indication: e.target.value})} 
                            placeholder="Pai, neste dia eu clamo por paz e sabedoria..." 
                          />
                        </div>
                      </div>

                      {/* Right Column (40%) */}
                      <div className="modal-studio-column">
                        
                        {/* Louvor / Música Card */}
                        <div style={{ background: '#f8fafc', padding: 18, borderRadius: 16, border: '1px solid var(--panel-border)' }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            🎵 Música de Louvor (YouTube)
                          </div>
                          <div className="form-group-modern" style={{ marginBottom: 10 }}>
                            <label className="form-label-modern">Nome do Hino / Banda</label>
                            <input 
                              type="text" 
                              className="input-modern"
                              value={formData.suggested_song_title} 
                              onChange={e => setFormData({...formData, suggested_song_title: e.target.value})} 
                              placeholder="Ex: Morada - É Tudo Sobre Você" 
                            />
                          </div>
                          <div className="form-group-modern">
                            <label className="form-label-modern">ID do YouTube (V=ID)</label>
                            <input 
                              type="text" 
                              className="input-modern"
                              value={formData.suggested_song_youtube_id} 
                              onChange={e => setFormData({...formData, suggested_song_youtube_id: e.target.value})} 
                              placeholder="Ex: jfKfPfyJRdk" 
                            />
                          </div>
                        </div>

                        {/* Voz Pastoral Local */}
                        <div style={{ background: '#f0fdfa', padding: 18, borderRadius: 16, border: '1px solid var(--pastel-green-border)' }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            💬 Comentário da Liderança Pastoral
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                            <div className="form-group-modern">
                              <label className="form-label-modern">Nome do Líder</label>
                              <input 
                                type="text" 
                                className="input-modern"
                                value={formData.pastoral_author_name} 
                                onChange={e => setFormData({...formData, pastoral_author_name: e.target.value})} 
                              />
                            </div>
                            <div className="form-group-modern">
                              <label className="form-label-modern">Cargo</label>
                              <input 
                                type="text" 
                                className="input-modern"
                                value={formData.pastoral_author_role} 
                                onChange={e => setFormData({...formData, pastoral_author_role: e.target.value})} 
                              />
                            </div>
                          </div>
                          <div className="form-group-modern">
                            <label className="form-label-modern">Conexão com a Igreja Local</label>
                            <textarea 
                              rows={3} 
                              className="textarea-modern"
                              value={formData.pastoral_comment} 
                              onChange={e => setFormData({...formData, pastoral_comment: e.target.value})} 
                              placeholder="Igreja, nesta semana vamos aplicar esse princípio nas células..." 
                            />
                          </div>
                        </div>

                      </div>

                      {/* Flag de Notificação no App */}
                      <div style={{
                        background: formData.notify_members ? 'rgba(15, 118, 110, 0.06)' : 'var(--bg-card, #ffffff)',
                        border: formData.notify_members ? '1.5px solid var(--accent-primary, #0f766e)' : '1px solid var(--panel-border, #e2e8f0)',
                        borderRadius: 14,
                        padding: '14px 18px',
                        marginTop: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: formData.notify_members ? 'var(--accent-primary, #0f766e)' : 'var(--bg-main, #f1f5f9)',
                            color: formData.notify_members ? '#ffffff' : 'var(--text-muted, #64748b)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem'
                          }}>
                            🔔
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                              Notificar membros no App
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {formData.notify_members 
                                ? 'Ativo: Ao publicar, os membros da congregação receberão um alerta do devocional no app.' 
                                : 'Inativo: O devocional ficará disponível no app sem gerar alerta ativo.'}
                            </div>
                          </div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, margin: 0, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={!!formData.notify_members}
                            onChange={e => setFormData({ ...formData, notify_members: e.target.checked })}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: formData.notify_members ? 'var(--accent-primary, #0f766e)' : '#cbd5e1',
                            transition: '0.3s',
                            borderRadius: 24
                          }}>
                            <span style={{
                              position: 'absolute',
                              height: 18, width: 18,
                              left: formData.notify_members ? 23 : 3,
                              bottom: 3,
                              backgroundColor: 'white',
                              transition: '0.3s',
                              borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                          </span>
                        </label>
                      </div>

                    </div>
                  )}

                  {activeModalTab === 'preview' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
                      <TextPreviewMobile data={formData} />
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="modal-studio-footer">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={() => setShowModal(false)}
                    disabled={isSaving}
                  >
                    Descartar
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleSave('DRAFT')} 
                    className="btn-secondary" 
                    disabled={isSaving} 
                    style={{ color: 'var(--warning)' }}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleSave('PUBLISHED')} 
                    className="btn-primary" 
                    disabled={isSaving}
                  >
                    {isSaving ? 'Publicando...' : 'Aprovar & Publicar no App'}
                  </button>
                </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// --- MOBILE PREVIEW COMPONENT ---
const TextPreviewMobile = ({ data }: { data: DevotionalData }) => {
  return (
    <div style={{ width: 340, height: 640, flexShrink: 0, background: '#ffffff', borderRadius: '36px', border: '8px solid #1e293b', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(15,23,42,0.15)', position: 'relative' }}>
      {/* Notch */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 110, height: 20, background: '#1e293b', borderBottomLeftRadius: 14, borderBottomRightRadius: 14, zIndex: 10 }}></div>
      
      {/* Header */}
      <div style={{ height: 64, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-end', padding: '0 20px 12px 20px', flexShrink: 0 }}>
        <h4 style={{ color: '#1e293b', margin: 0, fontSize: '1rem', fontWeight: 800 }}>Devocional Diário</h4>
      </div>
      
      {/* App Content */}
      <div style={{ flex: 1, padding: 18, overflowY: 'auto' }}>
        <div style={{ color: '#0f766e', fontWeight: 800, fontSize: '0.74rem', marginBottom: 8 }}>
          {data.available_date} • {data.source_type === 'LOCAL' ? 'Igreja Local' : (data.source_name || 'Global')}
        </div>
        <h1 style={{ color: '#1e293b', fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.25, marginBottom: 16, letterSpacing: '-0.3px' }}>
          {data.title || 'Título da Palavra'}
        </h1>
        
        {data.suggested_song_title && (
          <div style={{ padding: 10, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, background: '#0f766e', borderRadius: '50%', flexShrink: 0 }}></div>
            <div style={{ fontSize: '0.74rem', color: '#1e293b', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.suggested_song_title}</div>
          </div>
        )}

        {data.central_text && (
           <div style={{ background: '#f0fdfa', border: '1px solid #a7f3d0', padding: 14, borderRadius: 12, marginBottom: 16 }}>
             <p style={{ color: '#0f766e', fontStyle: 'italic', fontWeight: 600, fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
               "{data.central_text}"
             </p>
           </div>
        )}

        <div style={{ color: '#475569', fontSize: '0.84rem', lineHeight: 1.6, marginBottom: 16 }}>
          {data.context_text ? data.context_text.split('\n').map((para, i) => <p key={i} style={{ marginBottom: 10 }}>{para}</p>) : <p style={{ opacity: 0.5 }}>O contexto do ensino aparecerá aqui...</p>}
        </div>

        {data.pastoral_comment && (
           <div style={{ background: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
             <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                {data.pastoral_author_avatar ? (
                  <img src={data.pastoral_author_avatar} alt="pr" style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: 16, background: '#0f766e', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, fontSize: '0.85rem' }}>
                    ✝️
                  </div>
                )}
                <div>
                  <div style={{ color: '#1e293b', fontWeight: 700, fontSize: '0.80rem' }}>{data.pastoral_author_name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.70rem' }}>{data.pastoral_author_role}</div>
                </div>
             </div>
             <p style={{ color: '#334155', margin: 0, fontSize: '0.78rem', lineHeight: 1.4 }}>
               "{data.pastoral_comment}"
             </p>
           </div>
        )}
      </div>
    </div>
  );
};
