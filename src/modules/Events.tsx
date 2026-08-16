import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css';

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);
const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

type EventData = {
  id: string;
  type: number; // 0 = Evento, 1 = Curso
  title: string;
  description: string;
  image_url: string;
  video_url: string | null;
  start_date: string;
  end_date: string;
  location: string;
  status: string;
  is_featured?: number;
  lots?: any[];
};

export default function Events() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    id: string;
    type: number;
    title: string;
    description: string;
    image_url: string;
    video_url: string;
    start_date: string;
    end_date: string;
    location: string;
    status: string;
    is_featured: boolean;
    lots: { id?: string, name: string, price: number, total_capacity: number }[];
  }>({
    id: '',
    type: 0,
    title: '',
    description: '',
    image_url: '',
    video_url: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    location: '',
    status: 'PUBLISHED',
    is_featured: false,
    lots: [{ name: '1º Lote Geral', price: 0, total_capacity: 100 }]
  });

  useEffect(() => {
    loadEvents();
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

  const loadEvents = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/events`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateMock = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/events/mock`, { method: 'POST', headers });
      loadEvents();
    } catch(err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const payload = { ...formData, type: Number(formData.type) };
      
      const res = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowModal(false);
        loadEvents();
      } else {
        alert("Erro ao salvar Evento");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Remover permanentemente este evento/curso e todos os seus lotes?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/events/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
         loadEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ 
      id: '', 
      type: 0, 
      title: '', 
      description: '', 
      image_url: '', 
      video_url: '', 
      start_date: today, 
      end_date: today, 
      location: '', 
      status: 'PUBLISHED', 
      is_featured: false, 
      lots: [{ name: '1º Lote Geral', price: 0, total_capacity: 100 }] 
    });
    setShowModal(true);
  };

  const openEditModal = (s: any) => {
    setFormData({
      id: s.id,
      type: s.type || 0,
      title: s.title,
      description: s.description,
      image_url: s.image_url || '',
      video_url: s.video_url || '',
      start_date: s.start_date ? new Date(s.start_date).toISOString().split('T')[0] : '',
      end_date: s.end_date ? new Date(s.end_date).toISOString().split('T')[0] : '',
      location: s.location || '',
      status: s.status || 'PUBLISHED',
      is_featured: !!s.is_featured,
      lots: s.lots?.length ? s.lots : [{ name: '1º Lote Geral', price: 0, total_capacity: 100 }]
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    try {
       const headers = await getAuthHeaders();
       const res = await fetch(`${API_URL}/upload-url?contentType=${encodeURIComponent(file.type)}&prefix=events`, { headers });
       const { uploadUrl, url } = await res.json();

       await fetch(uploadUrl, {
         method: 'PUT',
         headers: { 'Content-Type': file.type },
         body: file
       });

       setFormData(prev => ({ ...prev, image_url: url }));
    } catch(err) {
       console.error("Erro no upload", err);
       alert("Erro ao realizar upload da imagem.");
    } finally {
       setUploadingImage(false);
    }
  };

  const addLot = () => {
    const lotNumber = formData.lots.length + 1;
    setFormData({ 
      ...formData, 
      lots: [...formData.lots, { name: `${lotNumber}º Lote`, price: 0, total_capacity: 50 }] 
    });
  };

  const formatDate = (ds: string) => {
    if (!ds) return '';
    const d = new Date(ds);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="broadcasts-container animate-fade-in">
      {/* Top Page Header */}
      <div className="card-header-row" style={{ paddingBottom: 20, borderBottom: '1px solid var(--panel-border)', marginBottom: 24 }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.4rem' }}>Eventos, Cursos e Trilhas</h1>
          <p className="card-subtitle">Configure eventos da igreja, conferências, retiros e workshops integrados ao App.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={generateMock}>
            Carregar Dados Mock
          </button>
          <button className="btn-primary" onClick={openNewModal}>
            <PlusIcon /> Criar Evento ou Curso
          </button>
        </div>
      </div>

      {/* Events Mural */}
      <div className="broadcast-mural">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando eventos e cursos...
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <CalendarIcon />
            <h3>Nenhum Evento ou Curso Cadastrado</h3>
            <p>Clique em "Criar Evento ou Curso" para começar a divulgar para a sua comunidade.</p>
          </div>
        ) : (
          events.map((ev) => {
            const isCourse = ev.type === 1;
            const typeLabel = isCourse ? 'CURSO / TRILHA' : 'EVENTO / RETIRO';
            const typeClass = isCourse ? 'good' : 'excellent';

            return (
              <div key={ev.id} className="portal-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => openEditModal(ev)}>
                <div style={{ width: '100%', height: 180, backgroundColor: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                   {ev.image_url ? (
                     <img src={ev.image_url} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                   ) : (
                     <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                       <ImageIcon />
                     </div>
                   )}
                   <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                     <span className={`status-badge ${typeClass}`}>
                        {typeLabel}
                     </span>
                     {ev.is_featured === 1 && (
                       <span className="status-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                          🌟 DESTAQUE
                       </span>
                     )}
                   </div>
                   <button 
                     className="action-circle-btn" 
                     style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, background: 'rgba(255,255,255,0.9)' }} 
                     onClick={(e) => handleDelete(ev.id, e)}
                     title="Excluir"
                   >
                     <TrashIcon />
                   </button>
                </div>
                
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>{ev.title}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.4 }} title={ev.description}>
                    {ev.description ? ev.description.substring(0, 80) + '...' : 'Sem descrição'}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <div>📍 <strong>Local:</strong> {ev.location || 'Local a definir'}</div>
                    <div>🗓️ <strong>Período:</strong> {formatDate(ev.start_date)} até {formatDate(ev.end_date)}</div>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 700, marginTop: 4 }}>
                      🎟️ {ev.lots?.length || 0} Lote(s) de Capacidade
                    </div>
                  </div>
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
                <div className="modal-studio-header-icon">
                  <CalendarIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">
                    {formData.id ? 'Editar Evento ou Curso' : 'Criar Evento ou Curso'}
                  </h2>
                  <p className="modal-studio-subtitle">
                    Configure os detalhes, lotes de ingressos e visual de publicação no aplicativo mobile.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setShowModal(false)} title="Fechar">
                &times;
              </button>
            </div>

            {/* Modal Body - 2 Column Grid */}
            <form id="event-studio-form" onSubmit={handleSave} className="modal-studio-body">
              <div className="modal-studio-grid">
                
                {/* LEFT COLUMN: Informações Principais & Lotes (60%) */}
                <div className="modal-studio-column">
                  
                  {/* Segmented Type Selector */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">Tipo de Organização *</label>
                    <div className="segmented-control">
                      <div 
                        className={`segmented-btn ${formData.type === 0 ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, type: 0 })}
                      >
                        🗓️ Evento / Retiro / Conferência
                      </div>
                      <div 
                        className={`segmented-btn ${formData.type === 1 ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, type: 1 })}
                      >
                        🎓 Curso / Trilha Prática
                      </div>
                    </div>
                  </div>

                  {/* Title Input */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">Título / Nome Oficial *</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                      placeholder="Ex: Imersão Liderança 2026, Retiro de Casais..." 
                      required 
                    />
                  </div>

                  {/* Description / Pitch */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">
                      <span>Descrição e Pitch de Marketing *</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Exibido no App</span>
                    </label>
                    <textarea 
                      rows={3} 
                      className="textarea-modern"
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      placeholder="Escreva um resumo atrativo sobre o propósito do evento, palestrantes e o que está incluso..." 
                      required 
                    />
                  </div>

                  {/* Dates & Location 3-Column Sub-grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 12 }}>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Data Início</label>
                      <input 
                        type="date" 
                        className="input-modern"
                        value={formData.start_date} 
                        onChange={e => setFormData({...formData, start_date: e.target.value})} 
                        required
                      />
                    </div>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Data Término</label>
                      <input 
                        type="date" 
                        className="input-modern"
                        value={formData.end_date} 
                        onChange={e => setFormData({...formData, end_date: e.target.value})} 
                        required
                      />
                    </div>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Localização *</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        value={formData.location} 
                        onChange={e => setFormData({...formData, location: e.target.value})} 
                        placeholder="Ex: Templo Central / Zoom" 
                        required 
                      />
                    </div>
                  </div>

                  {/* Lots / Capacity Management Section */}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.90rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          Gerenciar Lotes & Capacidade
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Defina os ingressos, preços e vagas disponíveis
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={addLot} 
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        <PlusIcon /> Adicionar Lote
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {formData.lots.map((lot, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '2fr 1fr 1fr auto', 
                            gap: 10, 
                            alignItems: 'center',
                            padding: '10px 14px',
                            background: '#f8fafc',
                            borderRadius: '12px',
                            border: '1px solid var(--panel-border)'
                          }}
                        >
                          <div>
                            <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>Nome do Lote</label>
                            <input 
                              type="text" 
                              className="input-modern"
                              style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                              value={lot.name} 
                              onChange={e => {
                                const newLots = [...formData.lots];
                                newLots[idx].name = e.target.value;
                                setFormData({ ...formData, lots: newLots });
                              }} 
                              placeholder="Ex: 1º Lote" 
                              required
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>Preço (R$)</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              className="input-modern"
                              style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                              value={lot.price} 
                              onChange={e => {
                                const newLots = [...formData.lots];
                                newLots[idx].price = parseFloat(e.target.value) || 0;
                                setFormData({ ...formData, lots: newLots });
                              }} 
                              required
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>Vagas</label>
                            <input 
                              type="number" 
                              className="input-modern"
                              style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                              value={lot.total_capacity} 
                              onChange={e => {
                                const newLots = [...formData.lots];
                                newLots[idx].total_capacity = parseInt(e.target.value) || 0;
                                setFormData({ ...formData, lots: newLots });
                              }} 
                              required
                            />
                          </div>

                          <div style={{ paddingTop: 16 }}>
                            {formData.lots.length > 1 && (
                              <button 
                                type="button" 
                                className="action-circle-btn" 
                                style={{ width: 32, height: 32, color: 'var(--danger)' }} 
                                onClick={() => {
                                  const newLots = [...formData.lots];
                                  newLots.splice(idx, 1);
                                  setFormData({ ...formData, lots: newLots });
                                }}
                                title="Remover lote"
                              >
                                <TrashIcon />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Mídia, Preview & Publicação (40%) */}
                <div className="modal-studio-column">
                  
                  {/* Photo Dropzone Box */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">
                      <span>Foto de Capa Principal *</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Proporção 16:9</span>
                    </label>

                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleImageUpload} 
                    />

                    <div 
                      className="dropzone-box" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingImage ? (
                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                          Fazendo upload da imagem...
                        </div>
                      ) : formData.image_url ? (
                        <>
                          <img src={formData.image_url} alt="Preview da Capa" className="dropzone-preview-img" />
                          <div className="dropzone-overlay-btn">
                            📷 Clique para Alterar Imagem
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '16px 8px' }}>
                          <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
                            <ImageIcon />
                          </div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
                            Clique para Selecionar Imagem
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            PNG, JPG ou WEBP até 5MB
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Video URL Input */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">URL Vídeo Promocional (YouTube)</label>
                    <input 
                      type="url" 
                      className="input-modern"
                      value={formData.video_url} 
                      onChange={e => setFormData({...formData, video_url: e.target.value})} 
                      placeholder="https://youtube.com/watch?v=..." 
                    />
                  </div>

                  {/* Publication & Spotlight Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                    
                    {/* Toggle: Destacar no App */}
                    <div className="toggle-card-modern">
                      <div className="toggle-card-info">
                        <div className="toggle-card-title">
                          <span style={{ color: '#d97706' }}>🌟</span> Destacar no Início do App
                        </div>
                        <div className="toggle-card-desc">
                          Ficará fixado no carrossel de topo para todos os membros
                        </div>
                      </div>
                      <label className="switch-control">
                        <input 
                          type="checkbox" 
                          checked={formData.is_featured} 
                          onChange={e => setFormData({...formData, is_featured: e.target.checked})} 
                        />
                        <span className="switch-slider"></span>
                      </label>
                    </div>

                    {/* Toggle: Publicado e Visível */}
                    <div className="toggle-card-modern">
                      <div className="toggle-card-info">
                        <div className="toggle-card-title">
                          <span style={{ color: '#059669' }}>👁️</span> Publicado & Disponível
                        </div>
                        <div className="toggle-card-desc">
                          Visível imediatamente para inscrições no app
                        </div>
                      </div>
                      <label className="switch-control">
                        <input 
                          type="checkbox" 
                          checked={formData.status === 'PUBLISHED'} 
                          onChange={e => setFormData({...formData, status: e.target.checked ? 'PUBLISHED' : 'DRAFT'})} 
                        />
                        <span className="switch-slider"></span>
                      </label>
                    </div>
                  </div>

                  {/* Mobile Preview Live Card */}
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 16, border: '1px solid var(--panel-border)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.04em' }}>
                      📱 Live Preview no App
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 2 }}>
                      {formData.title || 'Título do Evento'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      📍 {formData.location || 'Localização'} • {formData.lots?.[0] ? `A partir de R$ ${formData.lots[0].price.toFixed(2)}` : 'Gratuito'}
                    </div>
                  </div>

                </div>
              </div>
            </form>

            {/* Modal Studio Footer */}
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
                form="event-studio-form" 
                className="btn-primary" 
                disabled={saving}
              >
                {saving ? 'Publicando no App...' : (formData.id ? 'Salvar Alterações' : 'Salvar & Publicar no App')}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
