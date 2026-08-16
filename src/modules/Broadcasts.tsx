import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css';

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

type BroadcastData = {
  id: string;
  title: string;
  description: string;
  observation: string;
  youtube_url: string;
  is_available: boolean;
  scheduled_for: string;
};

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState<BroadcastData[]>([]);
  const [defaultBroadcast, setDefaultBroadcast] = useState<BroadcastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<BroadcastData>({
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

  const loadBroadcasts = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/broadcasts`, { headers });
      if (res.ok) {
        const data = await res.json();
        const all: BroadcastData[] = data.data || [];
        const def = all.find(b => b.id === 'default') || null;
        const customs = all.filter(b => b.id !== 'default');
        setDefaultBroadcast(def);
        setBroadcasts(customs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/broadcasts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        loadBroadcasts();
      } else {
        alert("Erro ao salvar transmissão");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente remover esta transmissão?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/broadcasts/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        loadBroadcasts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setFormData({ id: '', title: '', description: '', observation: '', youtube_url: '', is_available: false, scheduled_for: '' });
    setShowModal(true);
  };

  const openEditModal = (b: BroadcastData) => {
    setFormData({ ...b, scheduled_for: b.scheduled_for ? new Date(b.scheduled_for).toISOString().slice(0, 16) : '' });
    setShowModal(true);
  };

  const openDefaultModal = () => {
    if (defaultBroadcast) {
      setFormData(defaultBroadcast);
      setShowModal(true);
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
      {/* Header */}
      <div className="card-header-row" style={{ paddingBottom: 20, borderBottom: '1px solid var(--panel-border)', marginBottom: 24 }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.4rem' }}>Central de Cultos e Transmissões</h1>
          <p className="card-subtitle">Gerencie o canal primário de streaming do app e programe cultos ao vivo.</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <PlusIcon /> Novo Agendamento
        </button>
      </div>

      <div className="b-layout">
        {/* Lado Esquerdo: Configuração do Evento Fixo 24Hrs */}
        <aside className="b-layout-sidebar">
          <div className="portal-card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="status-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
                CANAL / BASE 24HRS
              </span>
              <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
                <VideoIcon />
              </div>
            </div>
            
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
              Canal de Transmissão Local
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 18, lineHeight: 1.4 }}>
              O aplicativo mobile exibirá este conteúdo 24hrs sempre que nenhum evento especial estiver ocorrendo.
            </p>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid var(--panel-border)', marginBottom: 18 }}>
              {defaultBroadcast?.youtube_url ? (
                <>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.04em' }}>EM EXIBIÇÃO NO APP AGORA</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {defaultBroadcast.title}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Nenhum vídeo base fornecido. Configure para manter o app ativo.
                </div>
              )}
            </div>

            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={openDefaultModal}>
              Configurar Base Principal
            </button>
          </div>
        </aside>

        {/* Lado Direito: Mural de Eventos Futuros / Ao vivo */}
        <main className="b-layout-main">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Próximas Transmissões</h3>
            <span className="notice-badge">
              {broadcasts.length} AGENDAMENTO(S) NA FILA
            </span>
          </div>

          <div className="broadcast-mural">
            {loading ? (
              <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando transmissões...</div>
            ) : broadcasts.length === 0 ? (
              <div className="empty-state">
                <VideoIcon />
                <h3>Nenhuma transmissão agendada</h3>
                <p>Clique em Novo Agendamento para programar o primeiro culto ao vivo.</p>
              </div>
            ) : (
              broadcasts.map((b) => (
                <div key={b.id} className="portal-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => openEditModal(b)}>
                  <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', background: '#f8fafc' }}>
                    <span className={`status-badge ${b.is_available ? 'excellent' : 'pending'}`}>
                      {b.is_available ? "● AO VIVO NO APP" : "AGENDADO / EM ESPERA"}
                    </span>
                    <button 
                      className="action-circle-btn" 
                      style={{ width: 30, height: 30, color: 'var(--danger)' }} 
                      onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>{b.title}</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>{b.description || 'Sem descrição'}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <ClockIcon />
                      <span>{b.scheduled_for ? new Date(b.scheduled_for).toLocaleString('pt-BR') : 'Horário a definir'}</span>
                    </div>

                    {b.observation && (
                      <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 12, border: '1px solid var(--panel-border)' }}>
                        <strong>Anotação da Produção:</strong> {b.observation}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
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
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-rose-bg)', color: 'var(--pastel-rose-text)' }}>
                  <VideoIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">
                    {formData.id === 'default' ? 'Configurar Canal Base 24h' : formData.id ? 'Editar Transmissão' : 'Agendar Nova Transmissão'}
                  </h2>
                  <p className="modal-studio-subtitle">
                    Configure os links do YouTube, horários de início e visibilidade no aplicativo.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setShowModal(false)} title="Fechar">
                &times;
              </button>
            </div>

            {/* Modal Body - 2 Column Grid */}
            <form id="broadcast-studio-form" onSubmit={handleSave} className="modal-studio-body">
              <div className="modal-studio-grid">
                
                {/* LEFT COLUMN: Informações & Pauta (60%) */}
                <div className="modal-studio-column">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Título do Culto / Evento *</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                      placeholder="Ex: Culto de Celebração - Pr. Marcelo" 
                      required 
                    />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Link / URL da Transmissão no YouTube *</label>
                    <input 
                      type="url" 
                      className="input-modern"
                      value={formData.youtube_url} 
                      onChange={e => setFormData({...formData, youtube_url: e.target.value})} 
                      placeholder="https://www.youtube.com/watch?v=..." 
                      required 
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Insira o link da Live ao vivo ou link do vídeo que ficará disponível.
                    </span>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Data e Hora Agendada</label>
                    {formData.id === 'default' ? (
                      <input 
                        type="text" 
                        className="input-modern"
                        value="Permanente / 24hrs Ativo" 
                        disabled 
                        style={{ background: '#f1f5f9', color: 'var(--text-muted)', cursor: 'not-allowed' }} 
                      />
                    ) : (
                      <input 
                        type="datetime-local" 
                        className="input-modern"
                        value={formData.scheduled_for} 
                        onChange={e => setFormData({...formData, scheduled_for: e.target.value})} 
                      />
                    )}
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Descrição para os Membros no App</label>
                    <textarea 
                      rows={2} 
                      className="textarea-modern"
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      placeholder="Resumo do tema do culto ou pauta..."
                    />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Observações da Equipe de Produção (Interno)</label>
                    <textarea 
                      rows={2} 
                      className="textarea-modern"
                      value={formData.observation} 
                      onChange={e => setFormData({...formData, observation: e.target.value})} 
                      placeholder="Pauta técnica, ordem de câmeras, equipe de áudio..."
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Disponibilidade & Live Preview (40%) */}
                <div className="modal-studio-column">
                  
                  {/* Toggle: Disponibilidade Imediata */}
                  <div className="toggle-card-modern">
                    <div className="toggle-card-info">
                      <div className="toggle-card-title">
                        <span style={{ color: '#059669' }}>🔴</span> Disponível no App Agora
                      </div>
                      <div className="toggle-card-desc">
                        O player ao vivo será exibido com destaque máximo na home
                      </div>
                    </div>
                    <label className="switch-control">
                      <input 
                        type="checkbox" 
                        checked={formData.is_available} 
                        onChange={e => setFormData({...formData, is_available: e.target.checked})} 
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>

                  {/* Live Streaming Preview Card */}
                  <div style={{ background: '#0f172a', color: '#ffffff', padding: 18, borderRadius: 16, border: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.70rem', fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: formData.is_available ? '#dc2626' : '#475569', textTransform: 'uppercase' }}>
                        {formData.is_available ? '● TRANSMITINDO' : 'AGENDADO'}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Faith-Hub Live</span>
                    </div>

                    <div style={{ width: '100%', height: '110px', background: '#1e293b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', marginBottom: 12 }}>
                      <VideoIcon />
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '0.90rem', marginBottom: 4 }}>
                      {formData.title || 'Título do Culto'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      {formData.scheduled_for ? new Date(formData.scheduled_for).toLocaleString('pt-BR') : 'Horário da Transmissão'}
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
                form="broadcast-studio-form" 
                className="btn-primary" 
                disabled={saving}
              >
                {saving ? 'Salvando...' : formData.id === 'default' ? 'Salvar Configuração' : formData.id ? 'Atualizar Transmissão' : 'Agendar & Publicar'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
