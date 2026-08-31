import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getAuthHeaders, authFetch } from '../services/apiClient';

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

interface PrayerItem {
  id: string;
  user_id?: string;
  author: string;
  author_name?: string;
  author_phone?: string | null;
  is_anonymous: boolean;
  category: string;
  privacy: 'PUBLIC' | 'CONFIDENTIAL';
  content: string;
  praying_count: number;
  status: 'APPROVED' | 'PENDING' | 'ARCHIVED';
  pastoral_response?: string | null;
  pastoral_responded_by?: string | null;
  pastoral_responded_at?: string | null;
  testimony_text?: string | null;
  testimony_at?: string | null;
  organization_id?: string;
  campus_id?: string;
  created_at: string;
  time_ago: string;
}

interface PastoralPrayersProps {
  selectedCampusId?: string;
  selectedOrganization?: any;
}

export const PastoralPrayers: React.FC<PastoralPrayersProps> = ({
  selectedCampusId,
  selectedOrganization
}) => {
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [privacyFilter, setPrivacyFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal Resposta Pastoral
  const [selectedPrayerForResponse, setSelectedPrayerForResponse] = useState<PrayerItem | null>(null);
  const [pastoralMessage, setPastoralMessage] = useState<string>('');
  const [pastorName, setPastorName] = useState<string>('');
  const [savingResponse, setSavingResponse] = useState<boolean>(false);

  const orgId = selectedOrganization?.id || 'org_default';

  useEffect(() => {
    loadPrayers();
  }, [orgId, selectedCampusId]);

  const getAuthHeaders = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      };
    } catch {
      return { 'Content-Type': 'application/json' };
    }
  };

  const loadPrayers = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      let url = `${API_URL}/prayers?organization_id=${orgId}`;
      if (selectedCampusId && selectedCampusId !== 'all') {
        url += `&campus_id=${selectedCampusId}`;
      }

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setPrayers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Erro ao carregar orações pastorais:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponseModal = (prayer: PrayerItem) => {
    setSelectedPrayerForResponse(prayer);
    setPastoralMessage(prayer.pastoral_response || '');
    setPastorName(prayer.pastoral_responded_by || 'Pastoreio');
  };

  const handleSavePastoralResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrayerForResponse || !pastoralMessage.trim() || savingResponse) return;

    setSavingResponse(true);
    try {
      const res = await authFetch(`${API_URL}/prayers/${selectedPrayerForResponse.id}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          pastoral_response: pastoralMessage.trim(),
          pastoral_name: pastorName.trim() || 'Corpo Pastoral'
        })
      });

      if (res.ok) {
        setPrayers(prev => prev.map(p => {
          if (p.id === selectedPrayerForResponse.id) {
            return {
              ...p,
              pastoral_response: pastoralMessage.trim(),
              pastoral_responded_by: pastorName.trim() || 'Corpo Pastoral',
              pastoral_responded_at: new Date().toISOString()
            };
          }
          return p;
        }));
        setSelectedPrayerForResponse(null);
        alert('✓ Resposta pastoral salva e disponibilizada imediatamente no PWA do membro!');
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(`Erro ao salvar resposta pastoral: ${errJson.message || 'Verifique suas permissões.'}`);
      }
    } catch (err: any) {
      console.error('Erro salvando resposta:', err);
      alert('Erro de conexão ao salvar resposta.');
    } finally {
      setSavingResponse(false);
    }
  };

  const handleDeletePrayer = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este pedido de oração do mural?')) return;

    try {
      const res = await authFetch(`${API_URL}/prayers/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setPrayers(prev => prev.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error('Erro ao excluir oração:', e);
    }
  };

  // Filtros
  const filteredPrayers = prayers.filter(p => {
    if (privacyFilter === 'CONFIDENTIAL' && p.privacy !== 'CONFIDENTIAL') return false;
    if (privacyFilter === 'PUBLIC' && p.privacy !== 'PUBLIC') return false;
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const matchAuthor = (p.author || '').toLowerCase().includes(query);
      const matchContent = (p.content || '').toLowerCase().includes(query);
      const matchCat = (p.category || '').toLowerCase().includes(query);
      return matchAuthor || matchContent || matchCat;
    }
    return true;
  });

  const totalConfidential = prayers.filter(p => p.privacy === 'CONFIDENTIAL').length;
  const totalTestimonies = prayers.filter(p => Boolean(p.testimony_text)).length;
  const totalIntercessions = prayers.reduce((acc, p) => acc + Number(p.praying_count || 0), 0);

  return (
    <div className="members-container animate-fade-in" style={{ paddingBottom: '60px' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <HeartIcon />
            </div>
            <div>
              <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.4px' }}>
                Mural de Orações & Intercessão Pastoral
              </h1>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                Acompanhamento e acolhimento pastoral de pedidos de oração da <strong>{selectedOrganization?.name || 'Igreja'}</strong>.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={loadPrayers}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem' }}
        >
          🔄 Atualizar Pedidos
        </button>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Total Pedidos */}
        <div className="portal-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Total de Pedidos
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#7c3aed', marginTop: '6px' }}>
            {prayers.length}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Cadastrados no aplicativo da igreja
          </div>
        </div>

        {/* Card 2: Confidenciais Pastorais */}
        <div className="portal-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #e11d48' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            🔒 Pedidos Confidenciais
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#e11d48', marginTop: '6px' }}>
            {totalConfidential}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Visíveis apenas ao Corpo Pastoral
          </div>
        </div>

        {/* Card 3: Intercessões Registradas */}
        <div className="portal-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            Clamores / Intercessões
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
            {totalIntercessions}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Irmãos que clicaram em "Estou Orando"
          </div>
        </div>

        {/* Card 4: Testemunhos de Vitória */}
        <div className="portal-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            ✨ Testemunhos & Milagres
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#f59e0b', marginTop: '6px' }}>
            {totalTestimonies}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Orações respondidas pelo Senhor
          </div>
        </div>

      </div>

      {/* FILTROS E BUSCA */}
      <div className="portal-card" style={{ padding: '18px 22px', borderRadius: 'var(--radius-md)', marginBottom: '22px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            className="input-modern"
            placeholder="Buscar por membro, motivo ou palavra-chave..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="select-modern"
          style={{ width: 'auto' }}
          value={privacyFilter}
          onChange={e => setPrivacyFilter(e.target.value)}
        >
          <option value="ALL">Todas as Privacidades</option>
          <option value="PUBLIC">🌍 Apenas Públicas</option>
          <option value="CONFIDENTIAL">🔒 Apenas Confidenciais (Pastorais)</option>
        </select>

        <select
          className="select-modern"
          style={{ width: 'auto' }}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="ALL">Todas as Categorias</option>
          <option value="Família">👨‍👩‍👧‍👦 Família</option>
          <option value="Saúde">🩺 Saúde</option>
          <option value="Finanças">💼 Finanças</option>
          <option value="Espiritual">🕊️ Espiritual</option>
          <option value="Gratidão">✨ Gratidão</option>
          <option value="Outros">🙏 Outros</option>
        </select>
      </div>

      {/* GRID DE PEDIDOS */}
      {loading && prayers.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--accent-primary)', fontWeight: 700 }}>
          Carregando pedidos de oração...
        </div>
      ) : filteredPrayers.length === 0 ? (
        <div className="portal-card" style={{ padding: '56px', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
          <div style={{ color: '#7c3aed', marginBottom: '10px' }}><HeartIcon /></div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
            Nenhum pedido de oração encontrado
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Tente alterar os filtros ou a unidade selecionada no topo.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
          {filteredPrayers.map(item => (
            <div
              key={item.id}
              className="portal-card"
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: item.privacy === 'CONFIDENTIAL' ? '4px solid #e11d48' : '4px solid #7c3aed'
              }}
            >
              <div>
                {/* Header do Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {item.author}
                      </strong>
                      {item.is_anonymous && (
                        <span style={{ fontSize: '0.66rem', background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          Anônimo no Mural
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {item.time_ago} • {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {item.privacy === 'CONFIDENTIAL' ? (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '999px', background: '#ffe4e6', color: '#e11d48', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <LockIcon /> Confidencial
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '999px', background: '#eff6ff', color: '#2563eb' }}>
                        🌍 Público
                      </span>
                    )}
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: '999px', background: '#f5f3ff', color: '#7c3aed' }}>
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Conteúdo do Pedido */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--panel-border)', fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.5, marginBottom: '12px' }}>
                  "{item.content}"
                </div>

                {/* Resposta Pastoral Existente */}
                {item.pastoral_response && (
                  <div style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid #ddd6fe', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6d28d9', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageIcon /> Resposta Pastoral enviada ({item.pastoral_responded_by || 'Corpo Pastoral'}):
                    </div>
                    <div style={{ fontSize: '0.80rem', color: '#4c1d95', lineHeight: 1.4 }}>
                      {item.pastoral_response}
                    </div>
                  </div>
                )}

                {/* Testemunho Alcançado */}
                {item.testimony_text && (
                  <div style={{ background: '#ecfdf5', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <SparklesIcon /> Testemunho de Vitória / Milagre:
                    </div>
                    <div style={{ fontSize: '0.80rem', color: '#065f46', lineHeight: 1.4 }}>
                      {item.testimony_text}
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé e Ações */}
              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  👥 <strong>{item.praying_count}</strong> {item.praying_count === 1 ? 'irmão orando' : 'irmãos intercedendo'}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* WhatsApp Pastoral */}
                  {item.author_phone && (
                    <a
                      href={`https://wa.me/55${item.author_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`A paz do Senhor ${item.author}, aqui é da equipe pastoral da igreja. Vimos o seu pedido de oração e queremos caminhar junto com você.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.74rem', color: '#059669', borderColor: '#a7f3d0', background: '#ecfdf5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                      title="Chamar no WhatsApp Pastoral"
                    >
                      <PhoneIcon /> WhatsApp
                    </a>
                  )}

                  {/* Responder Pastoralmente */}
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.74rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => handleOpenResponseModal(item)}
                  >
                    <MessageIcon /> {item.pastoral_response ? 'Editar Resposta' : 'Responder'}
                  </button>

                  {/* Excluir */}
                  <button
                    type="button"
                    onClick={() => handleDeletePrayer(item.id)}
                    style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
                    title="Excluir pedido do mural"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          MODAL RESPOSTA PASTORAL
          ======================================================== */}
      {selectedPrayerForResponse && createPortal(
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1200 }} onClick={() => setSelectedPrayerForResponse(null)}>
          <div className="modal-studio-container" style={{ maxWidth: '560px', width: '92%' }} onClick={e => e.stopPropagation()}>
            
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <MessageIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title" style={{ fontSize: '1.20rem', margin: 0 }}>
                    Resposta / Acolhimento Pastoral
                  </h2>
                  <p className="modal-studio-subtitle" style={{ margin: '2px 0 0 0' }}>
                    Para o membro: <strong>{selectedPrayerForResponse.author}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-circle"
                onClick={() => setSelectedPrayerForResponse(null)}
                title="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePastoralResponse}>
              <div className="modal-studio-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--panel-border)', fontSize: '0.84rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: 1.4 }}>
                  "{selectedPrayerForResponse.content}"
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Assinatura Pastoral (Quem está respondendo) *
                  </label>
                  <input
                    type="text"
                    className="input-modern"
                    value={pastorName}
                    onChange={e => setPastorName(e.target.value)}
                    placeholder="Ex: Pr. Rafael / Equipe de Intercessão"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Palavra de Bênção / Oração Pastoral *
                  </label>
                  <textarea
                    rows={5}
                    className="input-modern"
                    value={pastoralMessage}
                    onChange={e => setPastoralMessage(e.target.value)}
                    placeholder="Escreva uma palavra bíblica de encorajamento, consolo, oração e cuidado para este irmão..."
                    style={{ resize: 'vertical' }}
                    required
                  />
                </div>
              </div>

              <div className="modal-studio-footer" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSelectedPrayerForResponse(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={savingResponse}
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
                >
                  {savingResponse ? 'Salvando...' : '✓ Salvar e Enviar ao Membro'}
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
