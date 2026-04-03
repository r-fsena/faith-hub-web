import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css'; // reaproveitamos a UI dos cards e modais

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
    lots: [{ name: 'Lote 1 (Promocional)', price: 0, total_capacity: 50 }]
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
    setFormData({ id: '', type: 0, title: '', description: '', image_url: '', video_url: '', start_date: today, end_date: today, location: '', status: 'PUBLISHED', is_featured: false, lots: [{ name: 'Lote 1', price: 0, total_capacity: 100 }] });
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
      lots: s.lots || []
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    // Simular upload de fato para nosso bucket (via s3 signed URL do backend)
    try {
       const headers = await getAuthHeaders();
       const res = await fetch(`${API_URL}/upload-url?contentType=${encodeURIComponent(file.type)}&prefix=events`, { headers });
       const { uploadUrl, url } = await res.json();

       await fetch(uploadUrl, {
         method: 'PUT',
         headers: { 'Content-Type': file.type },
         body: file
       });

       setFormData({ ...formData, image_url: url });
    } catch(err) {
       console.error("Erro no upload", err);
       alert("Erro ao realizar upload. Conecte com AWS S3 real.");
    }
  };

  const addLot = () => {
    setFormData({ ...formData, lots: [...formData.lots, { name: '', price: 0, total_capacity: 50 }] });
  };

  const formatDate = (ds: string) => {
    if (!ds) return '';
    const d = new Date(ds);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div className="broadcasts-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, paddingBottom: 24, borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Eventos, Cursos e Trilhas</h1>
          <p className="page-subtitle">Configure eventos de igreja, workshops e bilheterias nativamente integradas ao App.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary flex-center" onClick={generateMock} style={{ padding: '12px 20px', fontSize: '0.9rem' }}>
            Usar Teste Mock
          </button>
          <button className="btn-primary flex-center" onClick={openNewModal} style={{ padding: '12px 20px', fontSize: '0.9rem', backgroundColor: '#5bc3bb', color: '#111' }}>
            <PlusIcon /> Nova Inscrição
          </button>
        </div>
      </div>

      <div className="broadcast-mural">
        {loading ? (
          <div className="loading-state">Carregando eventos...</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <CalendarIcon />
            <h3>Nenhum Evento Disponível.</h3>
            <p>Comece a vender e gerenciar passagens e turmas de cursos no aplicativo.</p>
          </div>
        ) : (
          events.map((ev) => {
            const isCourse = ev.type === 1;
            const typeBg = isCourse ? '#0a7ea4' : '#FF9500';

            return (
              <div key={ev.id} className="broadcast-card card" onClick={() => openEditModal(ev)}>
                <div style={{ width: '100%', height: 160, backgroundColor: '#2c3444', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                   {ev.image_url && <img src={ev.image_url} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
                   <div style={{ position: 'absolute', top: 12, left: 12, background: typeBg, color: '#FFF', padding: '4px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>
                      {isCourse ? 'CURSO' : 'EVENTO'}
                   </div>
                   {ev.is_featured === 1 && (
                     <div style={{ position: 'absolute', top: 12, left: 80, background: '#FFD700', color: '#111', padding: '4px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>
                        🌟 DESTAQUE
                     </div>
                   )}
                   <button className="icon-btn danger-hover" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', color: '#FFF' }} onClick={(e) => handleDelete(ev.id, e)}>
                     <TrashIcon />
                   </button>
                </div>
                
                <div className="card-body" style={{ padding: 20 }}>
                  <h3 className="b-title">{ev.title}</h3>
                  <p className="b-desc" style={{ marginBottom: 12 }} title={ev.description}>{ev.description.substring(0,60)}...</p>
                  
                  <div className="b-meta" style={{ flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                    <div className="meta-item">📍 {ev.location || 'Local não definido'}</div>
                    <div className="meta-item">🗓️ {formatDate(ev.start_date)} até {formatDate(ev.end_date)}</div>
                    <div className="meta-item" style={{ color: '#5bc3bb', fontWeight: 600 }}>🎟️ {ev.lots?.length || 0} Lotes Castrados</div>
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
              <h3>{formData.id ? 'Editar Informações' : 'Criar Evento ou Curso'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form className="modal-body" onSubmit={handleSave}>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Tipo de Organização *</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: parseInt(e.target.value)})}>
                    <option value={0}>Evento / Retiro / Conferência</option>
                    <option value={1}>Curso / Trilha Prática</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Título / Nome *</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Imersão Liderança..." required />
                </div>
              </div>
              
              <div className="form-group">
                <label>Descrição e Marketing (Venda) *</label>
                <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Escreva o pitch de venda desse evento que vai aparecer no app." required></textarea>
              </div>

              <div className="form-group">
                <label>Localização Física / Digital *</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ex: Sítio / Campus / Zoom" required />
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Início</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required/>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Término</label>
                  <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} required/>
                </div>
              </div>

              <div className="form-group">
                <label>Foto de Capa (Upload) *</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
                {formData.image_url && <a href={formData.image_url} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '13px', color: '#5bc3bb', marginTop: 6, fontWeight: 700 }}>Ver Imagem Salva</a>}
              </div>

              <div className="form-group">
                <label>URL Vídeo Promocional (YouTube/Opcional)</label>
                <input type="url" value={formData.video_url} onChange={e => setFormData({...formData, video_url: e.target.value})} placeholder="https://youtube.com/..." />
              </div>

              <hr style={{ margin: '20px 0', borderColor: 'var(--border-color)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                 <h4 style={{ margin: 0 }}>Gerenciar Lotes / Capacidade</h4>
                 <button type="button" onClick={addLot} className="btn-secondary flex-center" style={{ padding: '6px 12px', fontSize: '0.8rem' }}><PlusIcon /> Add Lote</button>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.03)', padding: 12, borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 16 }}>
                 {formData.lots.map((lot, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: idx < formData.lots.length - 1 ? 12 : 0 }}>
                       <div style={{ flex: 2 }}>
                          <label>Nome do Lote</label>
                          <input type="text" value={lot.name} onChange={e => {
                            const newLots = [...formData.lots];
                            newLots[idx].name = e.target.value;
                            setFormData({ ...formData, lots: newLots });
                          }} placeholder="Ex: 1º Lote" required/>
                       </div>
                       <div style={{ flex: 1 }}>
                          <label>Preço (R$)</label>
                          <input type="number" step="0.01" value={lot.price} onChange={e => {
                            const newLots = [...formData.lots];
                            newLots[idx].price = parseFloat(e.target.value);
                            setFormData({ ...formData, lots: newLots });
                          }} required/>
                       </div>
                       <div style={{ flex: 1 }}>
                          <label>Qtd. Vagas</label>
                          <input type="number" value={lot.total_capacity} onChange={e => {
                            const newLots = [...formData.lots];
                            newLots[idx].total_capacity = parseInt(e.target.value);
                            setFormData({ ...formData, lots: newLots });
                          }} required/>
                       </div>
                       {formData.lots.length > 1 && (
                         <button type="button" className="icon-btn danger-hover" style={{ marginTop: 24 }} onClick={() => {
                            const newLots = [...formData.lots];
                            newLots.splice(idx, 1);
                            setFormData({ ...formData, lots: newLots });
                         }}>
                            <TrashIcon />
                         </button>
                       )}
                    </div>
                 ))}
              </div>

              <div className="form-group checkbox-group" style={{ marginTop: 12 }}>
                <label className="toggle-label" style={{ marginBottom: 16 }}>
                  <input type="checkbox" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} />
                  <span className="toggle-text" style={{ color: '#FF9500', fontWeight: 'bold' }}>🌟 Destacar na Tela Inicial do App?</span>
                </label>
                
                <label className="toggle-label">
                  <input type="checkbox" checked={formData.status === 'PUBLISHED'} onChange={e => setFormData({...formData, status: e.target.checked ? 'PUBLISHED' : 'DRAFT'})} />
                  <span className="toggle-text">Publicado e Vísivel no App?</span>
                </label>
              </div>
              
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 12 }}>
                <b>Nota:</b> Após a criação, você deve gerenciar os Lotes e Capacidades caso haja cobrança integrada.
              </small>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Publicando...' : (formData.id ? 'Salvar Alterações' : 'Criar e Publicar')}
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
