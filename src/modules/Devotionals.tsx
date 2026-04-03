import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Members.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
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
    central_text: '', context_text: '', prayer_indication: '', pastoral_author_name: 'Pr. Rafael Sena', 
    pastoral_author_role: 'Pastor Presidente', pastoral_author_avatar: 'https://i.pravatar.cc/150?img=11', pastoral_comment: ''
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
    // Validação Manual Robusta
    if (!formData.available_date || !formData.title || !formData.central_text || !formData.context_text) {
      alert("⚠️ Você precisa preencher pelo menos: Data, Título, Texto Central Bíblico e Contexto!");
      setActiveModalTab('editor'); // Puxa de volta para a aba de Redação automaticamente
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
        alert("Erro no servidor ao salvar o devocional. Verifique sua conexão.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com a Base de Dados Serverless.");
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
    <div className="members-container animate-fade-in" style={{ padding: '0 40px' }}>
      <div className="header-actions" style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Devocionais Mensais</h2>
          <p style={{ color: '#888', marginTop: 8 }}>Café com Deus, Pão Diário e Textos Oficiais para a Igreja.</p>
        </div>
        <button className="primary-btn" onClick={openNewModal} style={{ height: 'fit-content' }}>
          <PlusIcon /> Adicionar Dia
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Carregando Devocionais...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {devotionals.map((dev) => {
            const parsedDate = new Date(dev.available_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            return (
              <div key={dev.id} className="broadcast-card card" onClick={() => openEditModal(dev)} style={{ padding: 24, cursor: 'pointer', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: '0.85rem', color: '#0a7ea4', fontWeight: 800, letterSpacing: 1 }}>{parsedDate}</div>
                  {dev.status === 'DRAFT' && <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700 }}>RASCUNHO</span>}
                  {(!dev.status || dev.status === 'PUBLISHED') && <span style={{ background: 'var(--success)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700 }}>PUBLICAÇÃO OFICIAL</span>}
                </div>
                <h3 style={{ fontSize: '1.2rem', margin: '0 0 12px 0', lineHeight: 1.3 }}>{dev.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: 20, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {dev.context_text}
                </p>
                <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'inline-block', fontSize: '0.8rem' }}>
                  Fonte: <strong>{dev.source_type === 'LOCAL' ? 'Igreja / Base' : dev.source_name}</strong>
                </div>

                <button className="icon-btn danger-hover" style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', color: '#FFF' }} onClick={(e) => handleDelete(dev.id, e)}>
                  <TrashIcon />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content" style={{ position: 'absolute', top: '40px', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '1000px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', padding: 0, background: 'var(--panel-bg)', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
            
            {showSuccessPrompt ? (
               <div style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', overflowY: 'auto' }}>
                 <div style={{ background: successStatus === 'PUBLISHED' ? 'var(--success)' : '#f59e0b', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                   {successStatus === 'PUBLISHED' ? (
                     <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                   ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                   )}
                 </div>
                 <h2 style={{ fontSize: '2.5rem', marginBottom: 16 }}>
                   {successStatus === 'PUBLISHED' ? 'Publicado com Sucesso!' : 'Rascunho Salvo'}
                 </h2>
                 <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: 40, maxWidth: 500 }}>
                   {successStatus === 'PUBLISHED' 
                     ? 'O devocional foi sincronizado na nuvem e o App de todos os membros consumirá sua nova atualização.'
                     : 'Seu texto foi salvo de forma privada. O devocional permanecerá invisível no App até sua publicação definitiva.'}
                 </p>

                 <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                   <button type="button" className="secondary-btn" onClick={() => setShowModal(false)} style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                     Voltar à Área de Gestão
                   </button>
                   <button type="button" className="primary-btn" onClick={() => { setShowSuccessPrompt(false); setSuccessStatus(null); setFormData(defaultForm()); setActiveModalTab('editor'); }} style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                     + Agendar Próximo Texto
                   </button>
                 </div>
               </div>
            ) : (
              <>
                <div className="modal-header" style={{ position: 'relative', padding: '20px 24px 0 24px', borderBottom: '1px solid var(--border-color)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Absolute X button moved to top right corner */}
                  <button type="button" className="icon-btn danger-hover" style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} onClick={() => setShowModal(false)}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{formData.id ? 'Editar Devocional' : 'Novo Devocional Diário'}</h2>
                  </div>
                  
                  {/* MODAL TABS */}
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <button type="button" onClick={() => setActiveModalTab('editor')} style={{ paddingBottom: 12, borderBottom: activeModalTab === 'editor' ? '3px solid #0a7ea4' : '3px solid transparent', color: activeModalTab === 'editor' ? '#FFF' : 'var(--text-muted)', fontWeight: activeModalTab === 'editor' ? 700 : 500, fontSize: '0.95rem', transition: 'all 0.2s' }}>
                      Página de Redação
                    </button>
                    <button type="button" onClick={() => setActiveModalTab('preview')} style={{ paddingBottom: 12, borderBottom: activeModalTab === 'preview' ? '3px solid #0a7ea4' : '3px solid transparent', color: activeModalTab === 'preview' ? '#FFF' : 'var(--text-muted)', fontWeight: activeModalTab === 'preview' ? 700 : 500, fontSize: '0.95rem', transition: 'all 0.2s' }}>
                      Visualização (App Mobile)
                    </button>
                  </div>
                </div>

                {/* MODAL BODY (Strictly Scrollable Inner Area) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                  
                  {activeModalTab === 'editor' && (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
                      <div className="modal-form" style={{ padding: 0, border: 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                           <div className="form-group">
                             <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Data da Leitura</label>
                             <input type="date" value={formData.available_date} onChange={e => setFormData({...formData, available_date: e.target.value})} style={{ padding: 14, fontSize: '1rem' }} />
                           </div>
                           <div className="form-group">
                             <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Origem do Conteúdo</label>
                             <select value={formData.source_type} onChange={e => setFormData({...formData, source_type: e.target.value})} style={{ padding: 14, fontSize: '1rem' }}>
                               <option value="LOCAL">Autoral (Escrito pela sua Igreja)</option>
                               <option value="GLOBAL">Global (Redes externas)</option>
                             </select>
                           </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 24 }}>
                          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Título da Mensagem do Dia</label>
                          <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: O Cuidado de Deus em Tempos Difíceis..." style={{ padding: 14, fontSize: '1rem' }} />
                        </div>

                        {formData.source_type === 'GLOBAL' && (
                          <div className="form-group" style={{ marginTop: 24 }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nome do Autor ou Ministério</label>
                            <input type="text" value={formData.source_name} onChange={e => setFormData({...formData, source_name: e.target.value})} placeholder="Ex: Ministério Pão Diário" style={{ padding: 14, fontSize: '1rem' }} />
                          </div>
                        )}

                        <div className="form-group" style={{ marginTop: 24 }}>
                          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Trecho Bíblico Chave (Em Itálico para o App)</label>
                          <textarea rows={3} value={formData.central_text} onChange={e => setFormData({...formData, central_text: e.target.value})} placeholder="O Senhor é o meu pastor, nada me faltará... Salmos 23:1" style={{ padding: 14, fontSize: '1rem', lineHeight: 1.5 }}></textarea>
                        </div>

                        <div className="form-group" style={{ marginTop: 24 }}>
                          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>O Contexto e O Ensino Completo</label>
                          <textarea rows={8} value={formData.context_text} onChange={e => setFormData({...formData, context_text: e.target.value})} placeholder="Inicie a partilha do ensinamento aqui. Você pode quebrar linhas normalmente. O aplicativo organizará seu texto..." style={{ padding: 14, fontSize: '1rem', lineHeight: 1.5 }}></textarea>
                        </div>

                        <div className="form-group" style={{ marginTop: 24 }}>
                          <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Indicação de Oração (Diretriz)</label>
                          <textarea rows={3} value={formData.prayer_indication} onChange={e => setFormData({...formData, prayer_indication: e.target.value})} placeholder="Pai, neste dia eu clamo por..." style={{ padding: 14, fontSize: '1rem', lineHeight: 1.5 }}></textarea>
                        </div>

                        {/* Additional Panels */}
                        <div style={{ marginTop: 32, padding: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a4b1c5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                             <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#FFF' }}>Música Inspirativa do Youtube (Opcional)</h4>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="form-group">
                              <label style={{ fontSize: '0.85rem' }}>Banda / Título do Clipe</label>
                              <input type="text" value={formData.suggested_song_title} onChange={e => setFormData({...formData, suggested_song_title: e.target.value})} placeholder="Ex: Morada - É Tudo Sobre Você" style={{ padding: 12 }}/>
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: '0.85rem' }}>ID do Youtube (V=123)</label>
                              <input type="text" value={formData.suggested_song_youtube_id} onChange={e => setFormData({...formData, suggested_song_youtube_id: e.target.value})} placeholder="Ex: jfKfPfyJRdk" style={{ padding: 12 }} />
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: 24, padding: 24, background: 'rgba(10, 126, 164, 0.05)', borderRadius: 16, border: '1px solid #0a7ea4' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a7ea4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                             <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0a7ea4' }}>Voz Local Presencial (De Líder em Líder)</h4>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
                            <div className="form-group">
                              <label style={{ fontSize: '0.85rem' }}>Nome da Liderança</label>
                              <input type="text" value={formData.pastoral_author_name} onChange={e => setFormData({...formData, pastoral_author_name: e.target.value})} style={{ padding: 12 }}/>
                            </div>
                            <div className="form-group">
                              <label style={{ fontSize: '0.85rem' }}>Seu Ministério ou Cargo</label>
                              <input type="text" value={formData.pastoral_author_role} onChange={e => setFormData({...formData, pastoral_author_role: e.target.value})} style={{ padding: 12 }} />
                            </div>
                          </div>
                          <div className="form-group">
                            <label style={{ fontSize: '0.85rem' }}>Como esse Devocional se conecta com a realidade da sua congregação local hoje?</label>
                            <textarea rows={4} value={formData.pastoral_comment} onChange={e => setFormData({...formData, pastoral_comment: e.target.value})} placeholder="Igreja, nesta semana temos batido nessa tecla nas células..." style={{ padding: 12, lineHeight: 1.5 }}></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeModalTab === 'preview' && (
                    <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
                      <TextPreviewMobile data={formData} />
                    </div>
                  )}

                </div>
              </>
            )}

            {/* MODAL FOOTER - ABSOLUTELY PINNED */}
            {!showSuccessPrompt && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', background: 'var(--panel-bg)', flexShrink: 0 }}>
                {activeModalTab === 'editor' && <span style={{ marginRight: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Preencha os campos e salve sua versão.</span>}
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)} disabled={isSaving} style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                  Descartar e Fechar
                </button>
                <div style={{ paddingLeft: 16, borderLeft: '1px solid var(--border-color)', display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => handleSave('DRAFT')} className="secondary-btn" disabled={isSaving} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 24px', fontSize: '0.95rem', fontWeight: 600 }}>
                    {isSaving ? 'Salvando...' : 'Salvar como Rascunho'}
                  </button>
                  <button type="button" onClick={() => handleSave('PUBLISHED')} className="primary-btn" disabled={isSaving} style={{ background: '#0a7ea4', padding: '10px 24px', fontSize: '0.95rem', fontWeight: 600 }}>
                    {isSaving ? 'Aplicando ao Banco...' : 'Aprovar e Publicar Texto'}
                  </button>
                </div>
              </div>
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
    <div style={{ width: 340, height: 680, flexShrink: 0, background: '#1a2130', borderRadius: '40px', border: '8px solid #333', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative' }}>
      {/* Notch fake */}
      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 25, background: '#333', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }}></div>
      
      {/* Header falso */}
      <div style={{ height: 80, borderBottom: '1px solid #404c60', display: 'flex', alignItems: 'flex-end', padding: '0 20px 16px 20px', flexShrink: 0 }}>
        <h4 style={{ color: '#FFF', margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Devocional Diário</h4>
      </div>
      
      {/* Tela do App */}
      <div style={{ flex: 1, padding: 20, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ color: '#0a7ea4', fontWeight: 800, fontSize: '0.8rem', marginBottom: 12 }}>
          {data.available_date} • {data.source_type === 'LOCAL' ? 'Igreja Local' : (data.source_name || 'Global')}
        </div>
        <h1 style={{ color: '#FFF', fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 24, letterSpacing: '-0.5px' }}>
          {data.title || 'Título da Palavra'}
        </h1>
        
        {data.suggested_song_title && (
          <div style={{ padding: 12, border: '1px solid #404c60', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, background: '#0a7ea4', borderRadius: '50%', marginRight: 12, flexShrink: 0 }}></div>
            <div style={{ fontSize: '0.8rem', color: '#FFF', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.suggested_song_title}</div>
          </div>
        )}

        {data.central_text && (
           <div style={{ background: '#0a7ea4', padding: 20, borderRadius: 16, marginBottom: 24 }}>
             <p style={{ color: '#FFF', fontStyle: 'italic', fontWeight: 600, fontSize: '1.1rem', margin: 0, lineHeight: 1.5 }}>
               "{data.central_text}"
             </p>
           </div>
        )}

        <div style={{ color: '#FFF', fontSize: '1rem', lineHeight: 1.6, marginBottom: 24, opacity: 0.9 }}>
          {data.context_text ? data.context_text.split('\n').map((para, i) => <p key={i} style={{ marginBottom: 16 }}>{para}</p>) : <p style={{ opacity: 0.5 }}>O contexto do ensino aparecerá aqui...</p>}
        </div>

        {data.pastoral_comment && (
           <div style={{ background: '#2c3444', padding: 16, borderRadius: 16, marginBottom: 24, border: '1px solid #404c60' }}>
             <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <img src={data.pastoral_author_avatar} alt="pr" style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                <div>
                  <div style={{ color: '#FFF', fontWeight: 700, fontSize: '0.9rem' }}>{data.pastoral_author_name}</div>
                  <div style={{ color: '#9BA1A6', fontSize: '0.75rem' }}>{data.pastoral_author_role}</div>
                </div>
             </div>
             <p style={{ color: '#FFF', margin: 0, fontSize: '0.9rem', lineHeight: 1.5, opacity: 0.9 }}>
               "{data.pastoral_comment}"
             </p>
           </div>
        )}
      </div>
    </div>
  );
};
