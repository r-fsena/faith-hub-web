import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css'; // reaproveitamos um pouco da UI do forms modular

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type CellGroup = {
  id: string;
  name: string;
  leader_id: string | null;
  leader_name?: string;
  description: string;
  address: string;
  neighborhood: string;
  meeting_day: string;
  meeting_time: string;
  whatsapp_contact: string;
  focus: string;
  status: string;
  pending_count?: number;
  pending_users?: {id: string, name: string, email: string, phone: string}[];
};

export default function CellGroups() {
  const [groups, setGroups] = useState<CellGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [activeCellForApproval, setActiveCellForApproval] = useState<CellGroup | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    leader_id: '',
    description: '',
    address: '',
    neighborhood: '',
    meeting_day: '',
    meeting_time: '',
    whatsapp_contact: '',
    focus: 'GERAL',
    status: 'ACTIVE'
  });

  useEffect(() => {
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
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/cell-groups`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (err) {
      console.error("Erro ao puxar células", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/cell-groups`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowModal(false);
        loadGroups();
      } else {
        alert("Erro ao salvar.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Remover esta Célula? Isto pode deixar membros órfãos de base.")) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/cell-groups/${id}`, { method: 'DELETE', headers });
      loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const openApprovals = async (c: CellGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
       const headers = await getAuthHeaders();
       const res = await fetch(`${API_URL}/cell-groups/${c.id}`, { headers });
       if (res.ok) {
         const fullGroup = await res.json();
         setActiveCellForApproval(fullGroup);
         setShowApprovals(true);
       }
    } catch (err) {
       console.error("Error opening approvals", err);
    }
  };

  const handleEvaluate = async (memberId: string, approved: boolean) => {
    if (!activeCellForApproval) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/cell-groups/${activeCellForApproval.id}/evaluate-request`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ memberId, approved })
      });
      // reload full view
      setShowApprovals(false);
      loadGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setFormData({ id: '', name: '', leader_id: '', description: '', address: '', neighborhood: '', meeting_day: '', meeting_time: '', whatsapp_contact: '', focus: 'GERAL', status: 'ACTIVE' });
    setShowModal(true);
  };

  const openEditModal = (c: CellGroup) => {
    setFormData({
      id: c.id,
      name: c.name,
      leader_id: c.leader_id || '',
      description: c.description || '',
      address: c.address || '',
      neighborhood: c.neighborhood || '',
      meeting_day: c.meeting_day || '',
      meeting_time: c.meeting_time || '',
      whatsapp_contact: c.whatsapp_contact || '',
      focus: c.focus || 'GERAL',
      status: c.status || 'ACTIVE'
    });
    setShowModal(true);
  };

  return (
    <div className="broadcasts-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, paddingBottom: 24, borderBottom: '1px solid var(--border-color)', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Gestão de Células</h1>
          <p className="page-subtitle">Cadastre os pequenos grupos, endereços e redes.</p>
        </div>
        <button className="btn-primary flex-center" onClick={openNewModal} style={{ padding: '12px 20px', fontSize: '0.9rem' }}>
          <PlusIcon /> Nova Célula
        </button>
      </div>

      <div className="broadcast-mural">
        {loading ? (
          <div className="loading-state">Carregando células...</div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <UsersIcon />
            <h3>Nenhuma célula cadastrada</h3>
            <p>Clique em Nova Célula para começar a expansão.</p>
          </div>
        ) : (
          groups.map((c) => (
            <div key={c.id} className="broadcast-card card" onClick={() => openEditModal(c)}>
              <div className="card-top">
                <div className={`status-badge ${c.status === 'ACTIVE' ? 'live' : 'scheduled'}`}>
                  {c.status === 'ACTIVE' ? "ATIVA" : "INATIVA"}
                </div>
                {c.pending_count ? c.pending_count > 0 && (
                   <div className="status-badge" style={{ background: '#FF9500', color: '#FFF', marginLeft: 8 }} onClick={(e) => openApprovals(c, e)}>
                     {c.pending_count} {c.pending_count === 1 ? 'Solicitação' : 'Solicitações'}
                   </div>
                ) : null}
                <button className="icon-btn danger-hover" style={{ marginLeft: 'auto' }} onClick={(e) => handleDelete(c.id, e)}>
                  <TrashIcon />
                </button>
              </div>

              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="b-title">{c.name}</h3>
                  <div className="status-badge" style={{ background: 'var(--panel-bg-hover)', color: 'var(--text-main)' }}>
                    {c.focus || 'GERAL'}
                  </div>
                </div>
                <p className="b-desc" style={{ marginBottom: 12 }}>{c.description || 'Sem descrição'}</p>
                
                <div className="b-meta" style={{ flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                  <div className="meta-item">📍 {c.neighborhood ? `${c.neighborhood}` : 'Sem Bairro'}</div>
                  <div className="meta-item">🗓️ {c.meeting_day} às {c.meeting_time}</div>
                  <div className="meta-item" style={{ color: '#5bc3bb', fontWeight: 600 }}>👑 Lider: {c.leader_name || 'Não atribuído'}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && createPortal(
        <div className="modal-overlay animate-fade-in">
          <div className="modal-container scrollable-modal">
            <div className="modal-header">
              <h3>{formData.id ? 'Editar Célula' : 'Cadastrar Nova Célula'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form className="modal-body" onSubmit={handleSave}>
              <div className="form-group">
                <label>Nome da Célula / Grupo *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Célula Ágape" required />
              </div>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Público Alvo / Foco</label>
                  <select value={formData.focus} onChange={e => setFormData({...formData, focus: e.target.value})}>
                    <option value="GERAL">Geral (Misto)</option>
                    <option value="CASAIS">Casais</option>
                    <option value="HOMENS">Homens</option>
                    <option value="MULHERES">Mulheres</option>
                    <option value="JOVENS">Jovens (Juventude)</option>
                    <option value="ADOLESCENTES">Adolescentes</option>
                    <option value="INFANTIL">Infantil</option>
                    <option value="EXPERIENTES">Experientes (3ª Idade)</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Dia da Reunião</label>
                  <select value={formData.meeting_day} onChange={e => setFormData({...formData, meeting_day: e.target.value})}>
                    <option value="">Selecione...</option>
                    <option value="Segunda-feira">Segunda-feira</option>
                    <option value="Terça-feira">Terça-feira</option>
                    <option value="Quarta-feira">Quarta-feira</option>
                    <option value="Quinta-feira">Quinta-feira</option>
                    <option value="Sexta-feira">Sexta-feira</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Horário</label>
                  <input type="time" value={formData.meeting_time} onChange={e => setFormData({...formData, meeting_time: e.target.value})} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Endereço Completo</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Rua XYZ, 123" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Bairro / Região</label>
                  <input type="text" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} placeholder="Ex: Centro" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>WhatsApp Contato (Líder/Anfitrião)</label>
                  <input type="text" value={formData.whatsapp_contact} onChange={e => setFormData({...formData, whatsapp_contact: e.target.value})} placeholder="(11) 90000-0000" />
                </div>
                
                <div className="form-group checkbox-group" style={{ flex: 1 }}>
                  <label className="toggle-label">
                    <input type="checkbox" checked={formData.status === 'ACTIVE'} onChange={e => setFormData({...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE'})} />
                    <span className="toggle-text">Célula Ativa?</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Descrição ou Público (Opcional)</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Célula voltada para jovens universitários..."></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Célula'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showApprovals && activeCellForApproval && createPortal(
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1000 }}>
          <div className="modal-container scrollable-modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Solicitações: {activeCellForApproval.name}</h3>
              <button className="close-btn" onClick={() => setShowApprovals(false)}>&times;</button>
            </div>
            <div className="modal-body">
               {activeCellForApproval.pending_users && activeCellForApproval.pending_users.length > 0 ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {activeCellForApproval.pending_users.map(u => (
                      <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel-bg)', padding: '12px 16px', borderRadius: 8 }}>
                         <div style={{ flex: 1 }}>
                           <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>👤 {u.name}</p>
                           <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                             <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>📧 {u.email || 'Sem e-mail'}</p>
                             <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>📱 {u.phone || 'Sem telefone'}</p>
                           </div>
                         </div>
                         <div style={{ display: 'flex', gap: 8 }}>
                           <button onClick={() => handleEvaluate(u.id, false)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Recusar</button>
                           <button onClick={() => handleEvaluate(u.id, true)} style={{ background: '#34c759', border: 'none', color: '#FFF', padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>Aprovar</button>
                         </div>
                      </div>
                   ))}
                 </div>
               ) : (
                 <p style={{ color: 'var(--text-muted)' }}>Todos os membros foram processados.</p>
               )}
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
