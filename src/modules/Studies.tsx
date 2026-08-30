import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css';

const FileTextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

type Study = {
  id: string;
  title: string;
  description: string;
  content_type: 'TEXT' | 'PDF' | 'VIDEO';
  link: string | null;
  date_published: string;
  status: string;
  target_group_id: string | null;
  target_group_name?: string;
  content_text?: string;
};

interface StudiesProps {
  selectedCampusId?: string;
  selectedOrganization?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
}

type Group = {
  id: string;
  name: string;
  leader_name?: string;
  network?: string;
  campus_name?: string;
};

export default function Studies({ selectedCampusId, selectedOrganization }: StudiesProps) {
  const [studies, setStudies] = useState<Study[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<{
    id: string;
    title: string;
    description: string;
    content_type: 'TEXT' | 'PDF' | 'VIDEO';
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
  }, [selectedCampusId, selectedOrganization]);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (token) {
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      }
      return { 'Content-Type': 'application/json' };
    } catch {
      return { 'Content-Type': 'application/json' };
    }
  };

  const loadStudies = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId && selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const res = await fetch(`${API_URL}/studies?organization_id=${orgId}${campusParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStudies(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error('Erro ao carregar estudos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId && selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const res = await fetch(`${API_URL}/cell-groups?organization_id=${orgId}${campusParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error('Erro ao carregar células para estudos:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const payload = {
        ...formData,
        target_group_id: formData.target_group_id || null,
        organization_id: selectedOrganization?.id || 'org_default',
        campus_id: selectedCampusId && selectedCampusId !== 'all' ? selectedCampusId : undefined
      };
      const res = await fetch(`${API_URL}/studies`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        loadStudies();
      } else {
        alert("Erro ao salvar estudo.");
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
      case 'VIDEO': return { bg: '#fef2f2', color: '#dc2626', label: 'VÍDEO' };
      case 'PDF': return { bg: '#ecfdf5', color: '#059669', label: 'ARQUIVO PDF' };
      default: return { bg: '#eff6ff', color: '#2563eb', label: 'TEXTO' };
    }
  };

  return (
    <div className="broadcasts-container animate-fade-in">
      {/* Header */}
      <div className="card-header-row" style={{ paddingBottom: 20, borderBottom: '1px solid var(--panel-border)', marginBottom: 24 }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.4rem' }}>Estudos e Material de Célula</h1>
          <p className="card-subtitle">Forneça roteiros (PDF, Vídeo ou Texto) com a "Palavra da Semana" para toda a liderança.</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <PlusIcon /> Novo Estudo
        </button>
      </div>

      <div className="broadcast-mural">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando estudos...</div>
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
              <div key={s.id} className="portal-card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => openEditModal(s)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span className={`status-badge ${s.status === 'ACTIVE' ? 'excellent' : 'pending'}`}>
                      {s.status === 'ACTIVE' ? "DISPONÍVEL" : "RASCUNHO"}
                    </span>
                    <span className="status-badge" style={{ background: typeStyle.bg, color: typeStyle.color, fontWeight: 800 }}>
                      {typeStyle.label}
                    </span>
                  </div>

                  <button 
                    className="action-circle-btn" 
                    style={{ width: 30, height: 30, color: 'var(--danger)' }} 
                    onClick={(e) => handleDelete(s.id, e)}
                  >
                    <TrashIcon />
                  </button>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>{s.title}</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>{s.description || 'Sem resumo disponível.'}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: 12, borderTop: '1px solid var(--panel-border)' }}>
                  <div>📍 <strong>Público:</strong> {s.target_group_name || 'Geral (Todas as Células)'}</div>
                  <div>🗓️ <strong>Liberação:</strong> {s.date_published.split('-').reverse().join('/')}</div>
                  {s.link && <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>🔗 Link de Mídia Anexado</div>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          MODAL STUDIO (2-Column Horizontal Split Architecture)
          ======================================================== */}
      {showModal && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="modal-studio-container" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-purple-bg)', color: 'var(--pastel-purple-text)' }}>
                  <FileTextIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">
                    {formData.id ? 'Editar Estudo de Célula' : 'Cadastrar Novo Estudo de Célula'}
                  </h2>
                  <p className="modal-studio-subtitle">
                    Disponibilize materiais, roteiros e vídeos para os líderes guiarem suas reuniões semanais.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setShowModal(false)} title="Fechar">
                &times;
              </button>
            </div>

            {/* Modal Body - 2 Column Grid */}
            <form id="study-studio-form" onSubmit={handleSave} className="modal-studio-body">
              <div className="modal-studio-grid">
                
                {/* LEFT COLUMN: Conteúdo & Mídia (60%) */}
                <div className="modal-studio-column">
                  
                  {/* Segmented Media Selector */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">Formato da Lição *</label>
                    <div className="segmented-control">
                      <div 
                        className={`segmented-btn ${formData.content_type === 'TEXT' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, content_type: 'TEXT' })}
                      >
                        📄 Texto / Esboço
                      </div>
                      <div 
                        className={`segmented-btn ${formData.content_type === 'PDF' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, content_type: 'PDF' })}
                      >
                        📕 Arquivo PDF
                      </div>
                      <div 
                        className={`segmented-btn ${formData.content_type === 'VIDEO' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, content_type: 'VIDEO' })}
                      >
                        🎥 Vídeo YouTube
                      </div>
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Título da Lição / Série *</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                      placeholder="Ex: A Armadura de Deus - Lição 3" 
                      required 
                    />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Resumo Rápido para a Liderança *</label>
                    <textarea 
                      rows={2} 
                      className="textarea-modern"
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      placeholder="Qual o objetivo central desta lição e o que enfatizar?" 
                      required
                    />
                  </div>

                  {(formData.content_type === 'PDF' || formData.content_type === 'VIDEO') && (
                    <div className="form-group-modern">
                      <label className="form-label-modern">
                        Link Externo da Mídia * {formData.content_type === 'PDF' ? '(Google Drive, Dropbox)' : '(YouTube, Vimeo)'}
                      </label>
                      <input 
                        type="url" 
                        className="input-modern"
                        value={formData.link} 
                        onChange={e => setFormData({...formData, link: e.target.value})} 
                        placeholder="https://..." 
                        required
                      />
                    </div>
                  )}

                  {formData.content_type === 'TEXT' && (
                    <div className="form-group-modern">
                      <label className="form-label-modern">Esboço Completo do Estudo (Texto) *</label>
                      <textarea 
                        rows={6} 
                        className="textarea-modern"
                        value={formData.content_text} 
                        onChange={e => setFormData({...formData, content_text: e.target.value})} 
                        placeholder="Cole aqui todo o roteiro, versículos chave e perguntas para discussão..." 
                        required
                      />
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Público, Data & Visibilidade (40%) */}
                <div className="modal-studio-column">
                  
                  <div className="form-group-modern">
                    <label className="form-label-modern">Público / Célula Específica</label>
                    <select 
                      className="select-modern"
                      value={formData.target_group_id} 
                      onChange={e => setFormData({...formData, target_group_id: e.target.value})}
                    >
                      <option value="">🌐 Geral (Todas as Células e Membros)</option>
                      {groups.length > 0 ? (
                        <optgroup label="Células & Pequenos Grupos Ativos">
                          {groups.map(g => (
                            <option key={g.id} value={g.id}>
                              👥 {g.name} {g.leader_name ? `• Líder: ${g.leader_name}` : ''} {g.network ? `(${g.network})` : ''}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        <option disabled value="">Nenhuma célula cadastrada neste campus/organização</option>
                      )}
                    </select>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Deixe "Geral" para disponibilizar para todo o ministério ou selecione a célula/rede desejada.
                    </span>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Data de Liberação / Aplicação</label>
                    <input 
                      type="date" 
                      className="input-modern"
                      value={formData.date_published} 
                      onChange={e => setFormData({...formData, date_published: e.target.value})} 
                      required
                    />
                  </div>

                  {/* Toggle: Visibilidade */}
                  <div className="toggle-card-modern" style={{ marginTop: 8 }}>
                    <div className="toggle-card-info">
                      <div className="toggle-card-title">
                        <span style={{ color: '#059669' }}>👁️</span> Estudo Ativo no App
                      </div>
                      <div className="toggle-card-desc">
                        Ficará visível imediatamente para os líderes
                      </div>
                    </div>
                    <label className="switch-control">
                      <input 
                        type="checkbox" 
                        checked={formData.status === 'ACTIVE'} 
                        onChange={e => setFormData({...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE'})} 
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>

                  {/* Live Preview Box */}
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid var(--panel-border)' }}>
                    <div style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Preview para os Líderes
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.90rem', color: 'var(--text-main)', marginBottom: 4 }}>
                      {formData.title || 'Título do Estudo'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Formato: <strong>{formData.content_type}</strong> • Para: <strong>{groups.find(g => g.id === formData.target_group_id)?.name || 'Geral'}</strong>
                    </div>
                  </div>

                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="modal-studio-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="study-studio-form" 
                className="btn-primary" 
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar & Publicar Estudo'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
