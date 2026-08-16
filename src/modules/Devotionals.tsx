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

type DevotionalData = {
  id: string;
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
};

export const Devotionals = () => {
  const [devotionals, setDevotionals] = useState<DevotionalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessPrompt, setShowSuccessPrompt] = useState(false);
  const [successStatus, setSuccessStatus] = useState<'DRAFT' | 'PUBLISHED' | null>(null);

  const defaultForm = () => ({
    id: '', available_date: new Date().toISOString().split('T')[0],
    title: '', source_type: 'LOCAL', source_name: '', suggested_song_title: '', suggested_song_youtube_id: '',
    central_text: '', context_text: '', prayer_indication: '', pastoral_author_name: '', 
    pastoral_author_role: '', pastoral_author_avatar: '', pastoral_comment: ''
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

  const loadDevotionals = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/devotionals`, { headers });
      if (res.ok) {
        setDevotionals(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDevotionals(); }, []);

  const openNewModal = () => {
    setFormData(defaultForm());
    setShowSuccessPrompt(false);
    setActiveModalTab('editor');
    setShowModal(true);
  };

  const openEditModal = (d: DevotionalData) => {
    setFormData(d);
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
      const payload = { ...formData, status: desiredStatus };

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

  return (
    <div className="members-container animate-fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <div className="card-header-row" style={{ paddingBottom: 20, borderBottom: '1px solid var(--panel-border)', marginBottom: 24 }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.4rem' }}>Devocionais e Palavra Diária</h1>
          <p className="card-subtitle">Café com Deus, Pão Diário e reflexões oficiais publicadas no app dos membros.</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <PlusIcon /> Adicionar Devocional
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Carregando devocionais...</div>
      ) : devotionals.length === 0 ? (
        <div className="empty-state">
          <BookOpenIcon />
          <h3>Nenhum devocional publicado</h3>
          <p>Clique em Adicionar Devocional para redigir a primeira palavra inspiracional.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {devotionals.map((dev) => {
            const parsedDate = new Date(dev.available_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            return (
              <div key={dev.id} className="portal-card" onClick={() => openEditModal(dev)} style={{ padding: 22, cursor: 'pointer', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.80rem', color: 'var(--accent-primary)', fontWeight: 800, letterSpacing: '0.04em' }}>{parsedDate}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {dev.status === 'DRAFT' ? (
                      <span className="status-badge pending">RASCUNHO</span>
                    ) : (
                      <span className="status-badge excellent">PUBLICADO</span>
                    )}
                    <button 
                      className="action-circle-btn" 
                      style={{ width: 28, height: 28, color: 'var(--danger)' }} 
                      onClick={(e) => handleDelete(dev.id, e)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8, lineHeight: 1.3 }}>{dev.title}</h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                  {dev.context_text}
                </p>
                
                <div style={{ padding: '6px 12px', background: '#f8fafc', borderRadius: 8, display: 'inline-block', fontSize: '0.76rem', color: 'var(--text-secondary)', border: '1px solid var(--panel-border)' }}>
                  Fonte: <strong style={{ color: 'var(--text-main)' }}>{dev.source_type === 'LOCAL' ? 'Igreja / Base' : dev.source_name}</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL STUDIO (2-Column Horizontal Split Architecture)
          ======================================================== */}
      {showModal && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="modal-studio-container" style={{ maxWidth: 1060 }} onClick={e => e.stopPropagation()}>
            
            {showSuccessPrompt ? (
               <div style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', overflowY: 'auto' }}>
                 <div style={{ background: successStatus === 'PUBLISHED' ? '#ecfdf5' : '#fffbeb', color: successStatus === 'PUBLISHED' ? '#059669' : '#d97706', width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                   <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                 </div>
                 <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 10 }}>
                   {successStatus === 'PUBLISHED' ? 'Publicado no App com Sucesso!' : 'Rascunho Salvo'}
                 </h2>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 32, maxWidth: 480 }}>
                   {successStatus === 'PUBLISHED' 
                     ? 'O devocional foi sincronizado e o App de todos os membros consumirá a nova mensagem inspiracional.'
                     : 'Seu texto foi salvo de forma privada e permanecerá invisível no App até sua publicação definitiva.'}
                 </p>

                 <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                   <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                     Voltar à Área de Gestão
                   </button>
                   <button type="button" className="btn-primary" onClick={() => { setShowSuccessPrompt(false); setSuccessStatus(null); setFormData(defaultForm()); setActiveModalTab('editor'); }}>
                     + Redigir Próximo Devocional
                   </button>
                 </div>
               </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="modal-studio-header">
                  <div className="modal-studio-header-left">
                    <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-orange-bg)', color: 'var(--pastel-orange-text)' }}>
                      <BookOpenIcon />
                    </div>
                    <div>
                      <h2 className="modal-studio-title">
                        {formData.id ? 'Editar Devocional' : 'Novo Devocional Diário'}
                      </h2>
                      <p className="modal-studio-subtitle">
                        Escreva a reflexão, indique música de louvor e adicione comentários pastorais.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Tabs Segmented */}
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                            <label className="form-label-modern">Origem do Conteúdo</label>
                            <select 
                              className="select-modern"
                              value={formData.source_type} 
                              onChange={e => setFormData({...formData, source_type: e.target.value})}
                            >
                              <option value="LOCAL">Autoral (Escrito pela sua Igreja)</option>
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
              </>
            )}

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
                <img src={data.pastoral_author_avatar} alt="pr" style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} />
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
