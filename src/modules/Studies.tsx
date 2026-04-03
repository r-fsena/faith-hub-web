import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css'; // reaproveitamos a UI dos cards e modais

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);
const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type Study = {
  id: string;
  title: string;
  description: string;
  content_type: 'VIDEO' | 'PDF' | 'TEXT';
  link: string;
  date_published: string;
  status: string;
  target_group_id: string | null;
  target_group_name?: string;
  content_text?: string;
};

export default function Studies() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [groups, setGroups] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<{
    id: string;
    title: string;
    description: string;
    content_type: 'VIDEO' | 'PDF' | 'TEXT';
    link: string;
    date_published: string;
    status: string;
    target_group_id: string;
    content_text: string;
  }>({
    id: '',
    title: '',
    description: '',
    content_type: 'VIDEO',
    link: '',
    date_published: new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    target_group_id: '',
    content_text: ''
  });

  useEffect(() => {
    loadStudies();
    loadGroups();
  }, []);

  const getAuthHeaders = async () => {
    const session = await fetchAuthSession();
    return {
      'Authorization': `Bearer ${session.tokens?.idToken?.toString()}`,
      'Content-Type': 'application/json'
    };
  };

  const loadGroups = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/cell-groups`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadStudies = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/studies`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStudies(data);
      } else {
        setStudies([
          { id: '1', title: 'Os Frutos do Espírito', description: 'Parte 1 - O Amor e a Alegria.', content_type: 'VIDEO', link: 'https://youtube.com', date_published: '2026-03-22', status: 'ACTIVE', target_group_id: null },
          { id: '2', title: 'Vencendo a Ansiedade', description: 'Como lidar com o mal do século pela ótica cristã.', content_type: 'PDF', link: 'https://drive.google.com/doc', date_published: '2026-03-15', status: 'INACTIVE', target_group_id: null }
        ]);
      }
    } catch (err) {
      console.error(err);
      setStudies([
        { id: '1', title: 'Os Frutos do Espírito', description: 'Parte 1 - O Amor e a Alegria. Guia principal para o mês abordando os primeiros frutos essenciais.', content_type: 'VIDEO', link: 'https://youtube.com', date_published: '2026-03-22', status: 'ACTIVE', target_group_id: null },
        { id: '2', title: 'Vencendo a Ansiedade', description: 'Como lidar com o mal do século pela ótica cristã.', content_type: 'PDF', link: 'https://drive.google.com/doc', date_published: '2026-03-15', status: 'INACTIVE', target_group_id: null }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const bodyPayload = { ...formData, target_group_id: formData.target_group_id || null };
      
      const res = await fetch(`${API_URL}/studies`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });
      
      if (res.ok) {
        setShowModal(false);
        loadStudies();
      } else {
        alert("Criando através do Mock visual (Backend desconectado temporariamente)");
        const newStudy: Study = {
          ...formData,
          id: formData.id || String(Date.now()),
          content_type: formData.content_type as any,
          target_group_id: formData.target_group_id || null,
          target_group_name: groups.find(g => g.id === formData.target_group_id)?.name
        };
        if (formData.id) setStudies(studies.map(s => s.id === formData.id ? newStudy : s));
        else setStudies([newStudy, ...studies]);
        setShowModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Remover este estudo da plataforma?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/studies/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
         loadStudies();
      } else {
         alert("Deletando mock...");
         setStudies(studies.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setFormData({ id: '', title: '', description: '', content_type: 'VIDEO', link: '', date_published: new Date().toISOString().split('T')[0], status: 'ACTIVE', target_group_id: '', content_text: '' });
    setShowModal(true);
  };

  const openEditModal = (s: Study) => {
    setFormData({
      id: s.id,
      title: s.title,
      description: s.description,
      content_type: s.content_type,
      link: s.link || '',
      date_published: s.date_published || '',
      status: s.status || 'ACTIVE',
      target_group_id: s.target_group_id || '',
      content_text: s.content_text || ''
    });
    setShowModal(true);
  };

  const getTypeStyle = (type: string) => {
    switch(type) {
      case 'VIDEO': return { bg: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', label: 'VÍDEO' };
      case 'PDF': return { bg: 'rgba(52, 199, 89, 0.1)', color: '#34C759', label: 'ARQUIVO PDF' };
      default: return { bg: 'rgba(91, 195, 187, 0.1)', color: '#5bc3bb', label: 'TEXTO' };
    }
  };

  return (
    <div className="broadcasts-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, paddingBottom: 24, borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Estudos e Material de Célula</h1>
          <p className="page-subtitle">Forneça roteiros (PDF ou Vídeo) contendo a "Palavra da Semana" para a liderança.</p>
        </div>
        <button className="btn-primary flex-center" onClick={openNewModal} style={{ padding: '12px 20px', fontSize: '0.9rem' }}>
          <PlusIcon /> Novo Estudo
        </button>
      </div>

      <div className="broadcast-mural">
        {loading ? (
          <div className="loading-state">Carregando estudos...</div>
        ) : studies.length === 0 ? (
          <div className="empty-state">
            <FileTextIcon />
            <h3>Nenhum estudo cadastrado.</h3>
            <p>Clique em Novo Estudo para disponibilizar a primeira lição.</p>
          </div>
        ) : (
          studies.map((s) => {
            const typeStyle = getTypeStyle(s.content_type);
            return (
              <div key={s.id} className="broadcast-card card" onClick={() => openEditModal(s)}>
                <div className="card-top">
                  <div className={`status-badge ${s.status === 'ACTIVE' ? 'live' : 'scheduled'}`}>
                    {s.status === 'ACTIVE' ? "DISPONÍVEL" : "RASCUNHO"}
                  </div>
                  
                  <div className="status-badge" style={{ background: typeStyle.bg, color: typeStyle.color, marginLeft: 8, fontWeight: 800 }}>
                     {s.content_type === 'VIDEO' ? <VideoIcon /> : <FileTextIcon />}
                     <span style={{ marginLeft: 4 }}>{typeStyle.label}</span>
                  </div>

                  <button className="icon-btn danger-hover" style={{ marginLeft: 'auto' }} onClick={(e) => handleDelete(s.id, e)}>
                    <TrashIcon />
                  </button>
                </div>

                <div className="card-body">
                  <h3 className="b-title">{s.title}</h3>
                  <p className="b-desc" style={{ marginBottom: 12 }}>{s.description || 'Sem resumo disponível.'}</p>
                  
                  <div className="b-meta" style={{ flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                    <div className="meta-item">📍 Restrito para: <strong>{s.target_group_name || 'Geral (Todos os Grupos)'}</strong></div>
                    <div className="meta-item">🗓️ Liberação: {s.date_published.split('-').reverse().join('/')}</div>
                    {s.link && <div className="meta-item" style={{ color: '#5bc3bb', fontWeight: 600 }}>🔗 Link Anexado</div>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && createPortal(
        <div className="modal-overlay animate-fade-in">
          <div className="modal-container scrollable-modal" style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <h3>{formData.id ? 'Editar Estudo' : 'Cadastrar Estudo / Lição'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form className="modal-body" onSubmit={handleSave}>
              <div className="form-group">
                <label>Título do Estudo / Série *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: A armadura de Deus - Lição 3" required />
              </div>
              
              <div className="form-group">
                <label>Resumo Rápido para a Liderança *</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Do que se trata esse estudo e qual o foco da reunião?" required></textarea>
              </div>

              <div className="form-group">
                <label>Público Alvo / Restrição de Célula</label>
                <select value={formData.target_group_id} onChange={e => setFormData({...formData, target_group_id: e.target.value})}>
                  <option value="">Geral (Todas as Células e Membros)</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-muted)' }}>Mantenha "Geral" para um estudo aplicado a todos.</small>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tipo de Mídia Central</label>
                  <select value={formData.content_type} onChange={e => setFormData({...formData, content_type: e.target.value as 'TEXT' | 'PDF' | 'VIDEO'})}>
                    <option value="TEXT">Desboço em Texto / Blog</option>
                    <option value="PDF">Arquivo PDF Roteiro</option>
                    <option value="VIDEO">Vídeo de Ensino (YouTube / Vimeo)</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Data de Utilização / Culto</label>
                  <input type="date" value={formData.date_published} onChange={e => setFormData({...formData, date_published: e.target.value})} required/>
                </div>
              </div>

              {(formData.content_type === 'PDF' || formData.content_type === 'VIDEO') && (
                <div className="form-group animate-fade-in">
                  <label>Link Externo da Mídia * {formData.content_type === 'PDF' ? '(Google Drive, OneDrive)' : '(YouTube, Vimeo)'}</label>
                  <input type="url" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="https://..." required={true} />
                </div>
              )}

              {formData.content_type === 'TEXT' && (
                <div className="form-group animate-fade-in" style={{ marginTop: 12 }}>
                  <label>Esboço do Estudo (Texto Completo) *</label>
                  <textarea rows={8} value={formData.content_text} onChange={e => setFormData({...formData, content_text: e.target.value})} placeholder="Escreva ou cole aqui todo o roteiro do Estudo..." required></textarea>
                </div>
              )}

              <div className="form-group checkbox-group" style={{ marginTop: 12 }}>
                <label className="toggle-label">
                  <input type="checkbox" checked={formData.status === 'ACTIVE'} onChange={e => setFormData({...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE'})} />
                  <span className="toggle-text">Estudo Visível para a Igreja (Ativo)?</span>
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Publicando...' : 'Salvar Estudo e Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
