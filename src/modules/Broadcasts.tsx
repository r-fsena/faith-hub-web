import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css';

// Ícones básicos
const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type Broadcast = {
  id: string;
  title: string;
  description: string;
  observation: string;
  youtube_url: string;
  is_available: number | boolean;
  scheduled_for: string | null;
  created_at: string;
};

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [defaultBroadcast, setDefaultBroadcast] = useState<Broadcast | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    observation: '',
    youtube_url: '',
    is_available: false,
    scheduled_for: ''
  });

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const getAuthHeaders = async () => {
    const session = await fetchAuthSession();
    return {
      'Authorization': `Bearer ${session.tokens?.idToken?.toString()}`,
      'Content-Type': 'application/json'
    };
  };

  const loadBroadcasts = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/broadcasts`, { headers });
      if (res.ok) {
        const data: Broadcast[] = await res.json();
        
        // Separa o broadcast padrão (fallback) dos demais agendados
        const defaultItem = data.find(b => b.id === 'default');
        const others = data.filter(b => b.id !== 'default');
        
        setDefaultBroadcast(defaultItem || null);
        setBroadcasts(others);
      }
    } catch (err) {
      console.error("Erro ao puxar transmissões", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const payload = {
        ...formData,
        scheduled_for: formData.scheduled_for ? new Date(formData.scheduled_for).toISOString().slice(0, 19).replace('T', ' ') : null
      };

      const res = await fetch(`${API_URL}/broadcasts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowModal(false);
        loadBroadcasts();
      } else {
        alert("Erro ao salvar a transmissão.");
      }
    } catch (err) {
      console.error("Erro", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente apagar este agendamento?")) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/broadcasts/${id}`, { method: 'DELETE', headers });
      loadBroadcasts();
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setFormData({ id: '', title: '', description: '', observation: '', youtube_url: '', is_available: false, scheduled_for: '' });
    setShowModal(true);
  };

  const openEditModal = (b: Broadcast) => {
    let rawDate = '';
    if (b.id !== 'default' && b.scheduled_for) {
      const d = new Date(b.scheduled_for);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      rawDate = d.toISOString().slice(0, 16);
    }
    setFormData({
      id: b.id,
      title: b.title,
      description: b.description || '',
      observation: b.observation || '',
      youtube_url: b.youtube_url,
      is_available: !!b.is_available,
      scheduled_for: rawDate
    });
    setShowModal(true);
  };

  const openDefaultModal = () => {
    if (defaultBroadcast) {
      openEditModal(defaultBroadcast);
    } else {
      setFormData({ 
        id: 'default', 
        title: 'Canal Oficial Faith Hub (24h)', 
        description: 'Transmissão padrão selecionada para momentos sem eventos ao vivo.', 
        observation: '', 
        youtube_url: '', 
        is_available: true, 
        scheduled_for: '' 
      });
      setShowModal(true);
    }
  };

  return (
    <div className="broadcasts-container animate-fade-in">
      {/* App.tsx global page header replacement (to keep buttons aligned and clean out external hacks) */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, paddingBottom: 24, borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="page-title">Central de Cultos e Eventos Ao Vivo</h1>
          <p className="page-subtitle">Gerencie o canal primário do aplicativo e programe transmissões especiais.</p>
        </div>
        <button className="btn-primary flex-center" onClick={openNewModal} style={{ padding: '12px 20px', fontSize: '0.9rem' }}>
          <PlusIcon /> Novo Agendamento
        </button>
      </div>

      <div className="b-layout">
        {/* Lado Esquerdo: Configuração do Evento Fixo 24Hrs */}
        <aside className="b-layout-sidebar">
          <div className="broadcast-card" style={{ cursor: 'default', transform: 'none' }}>
            <div className="card-top" style={{ background: 'rgba(91, 195, 187, 0.05)' }}>
              <div className="status-badge" style={{ background: 'rgba(91, 195, 187, 0.15)', color: '#5bc3bb' }}>
                CANAL / BASE 24HRS
              </div>
              <div style={{ color: '#5bc3bb', display: 'flex', alignItems: 'center' }}>
                <VideoIcon />
              </div>
            </div>
            
            <div className="card-body">
              <h3 className="b-title" style={{ whiteSpace: 'normal', lineHeight: 1.3, marginBottom: '12px' }}>
                Canal de Transmissão Local
              </h3>
              <p className="b-desc" style={{ WebkitLineClamp: 'unset', marginBottom: '24px' }}>
                O aplicativo mobile exibirá este conteúdo 24hrs sempre que nenhum evento especial estiver ocorrendo.
              </p>

              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                {defaultBroadcast?.youtube_url ? (
                  <>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#5bc3bb', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>EM EXIBIÇÃO NO APP AGORA</div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {defaultBroadcast.title}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, fontStyle: 'italic' }}>
                    Nenhum vídeo base fornecido. A tela principal do App ficará vazia.
                  </div>
                )}
              </div>

              <button className="btn-secondary flex-center" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={openDefaultModal}>
                Configurar Base Principal
              </button>
            </div>
          </div>
        </aside>

        {/* Lado Direito: Mural de Eventos Futuros / Ao vivo */}
        <main className="b-layout-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Mural de Próximos Eventos</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, padding: '4px 12px', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              {broadcasts.length} AGENDAMENTO(S) NA FILA
            </div>
          </div>
          <div className="broadcast-mural">
            {loading ? (
          <div className="loading-state">Carregando transmissões...</div>
        ) : broadcasts.length === 0 ? (
          <div className="empty-state">
            <VideoIcon />
            <h3>Nenhuma transmissão agendada</h3>
            <p>Clique em Novo Agendamento para programar o primeiro culto.</p>
          </div>
        ) : (
          broadcasts.map((b) => (
            <div key={b.id} className={`broadcast-card card ${b.is_available ? 'active-broadcast' : ''}`}>
              <div className="card-top">
                <div className={`status-badge ${b.is_available ? 'live' : 'scheduled'}`}>
                  {b.is_available ? "Disponível (AO VIVO)" : "Agendado / Em Espera"}
                </div>
                <button className="icon-btn danger-hover" onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}>
                  <TrashIcon />
                </button>
              </div>

              <div className="card-body" onClick={() => openEditModal(b)}>
                <h3 className="b-title" title={b.title}>{b.title}</h3>
                <p className="b-desc">{b.description || 'Sem descrição'}</p>
                
                <div className="b-meta">
                  <div className="meta-item">
                    <ClockIcon />
                    <span>{b.scheduled_for ? new Date(b.scheduled_for).toLocaleString() : 'Sem data definida'}</span>
                  </div>
                </div>

                {b.observation && (
                  <div className="b-obs">
                    <strong>Anotação:</strong> {b.observation}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
          </div>
        </main>
      </div>

      {showModal && createPortal(
        <div className="modal-overlay animate-fade-in">
          <div className="modal-container scrollable-modal">
            <div className="modal-header">
              <h3>{formData.id === 'default' ? 'Configurar Padrão' : formData.id ? 'Editar Transmissão' : 'Agendar Nova Transmissão'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form className="modal-body" onSubmit={handleSave}>
              <div className="form-group">
                <label>Título do Evento *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Culto da Juventude" required />
              </div>
              
              <div className="form-group">
                <label>Link / Canal do YouTube *</label>
                <input type="url" value={formData.youtube_url} onChange={e => setFormData({...formData, youtube_url: e.target.value})} placeholder="https://www.youtube.com/watch?v=..." required />
                <small>Cole a URL do vídeo específico ou o link de Live do seu canal.</small>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1, opacity: formData.id === 'default' ? 0.6 : 1 }}>
                  <label>Data e Hora Agendada</label>
                  {formData.id === 'default' ? (
                    <input type="text" value="Permanente / 24hrs" disabled style={{ background: 'var(--bg-color)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
                  ) : (
                    <input type="datetime-local" value={formData.scheduled_for} onChange={e => setFormData({...formData, scheduled_for: e.target.value})} />
                  )}
                </div>
                
                <div className="form-group checkbox-group" style={{ flex: 1 }}>
                  <label className="toggle-label">
                    <input type="checkbox" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} />
                    <span className="toggle-text">Disponível no App Agora?</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Descrição para os membros (Resumo)</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="O que vai rolar neste evento..."></textarea>
              </div>

              <div className="form-group">
                <label>Observação Interna (Mural/Painel)</label>
                <textarea rows={2} value={formData.observation} onChange={e => setFormData({...formData, observation: e.target.value})} placeholder="Anotações para equipe de mídia ou pauta..."></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : formData.id === 'default' ? 'Salvar Configuração' : formData.id ? 'Atualizar Transmissão' : 'Agendar'}
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
