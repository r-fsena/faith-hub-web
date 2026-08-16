import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css';

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

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

interface CellGroupsProps {
  selectedCampusId?: string;
  selectedOrganization?: any;
}

export default function CellGroups({ selectedCampusId = 'all', selectedOrganization }: CellGroupsProps) {
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
  }, [selectedCampusId, selectedOrganization]);

  const getAuthHeaders = async () => {
    try {
      const session = await fetchAuthSession();
      return {
        'Authorization': `Bearer ${session.tokens?.idToken?.toString()}`,
        'Content-Type': 'application/json'
      };
    } catch {
      return { 'Content-Type': 'application/json' };
    }
  };

  const loadGroups = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const res = await fetch(`${API_URL}/cell-groups?organization_id=${orgId}${campusParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
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
      const payload = {
        ...formData,
        organization_id: selectedOrganization?.id || 'org_default',
        campus_id: selectedCampusId !== 'all' ? selectedCampusId : 'campus_sede'
      };

      const res = await fetch(`${API_URL}/cell-groups`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
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
    if (!window.confirm("Remover esta célula?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/cell-groups/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        loadGroups();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEvaluate = async (userId: string, approve: boolean) => {
    if (!activeCellForApproval) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/cell-groups/${activeCellForApproval.id}/join-requests/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: approve ? 'APPROVED' : 'REJECTED' })
      });
      if (res.ok) {
        const updated = activeCellForApproval.pending_users?.filter(u => u.id !== userId) || [];
        setActiveCellForApproval({ ...activeCellForApproval, pending_users: updated, pending_count: updated.length });
        loadGroups();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setFormData({ id: '', name: '', leader_id: '', description: '', address: '', neighborhood: '', meeting_day: 'Quarta-feira', meeting_time: '19:30', whatsapp_contact: '', focus: 'GERAL', status: 'ACTIVE' });
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

  const openApprovalsModal = (c: CellGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCellForApproval(c);
    setShowApprovals(true);
  };

  return (
    <div className="broadcasts-container animate-fade-in">
      {/* Header */}
      <div className="card-header-row" style={{ paddingBottom: 20, borderBottom: '1px solid var(--panel-border)', marginBottom: 24 }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.4rem' }}>Células e Pequenos Grupos</h1>
          <p className="card-subtitle">Organize os pequenos grupos nos bairros, líderes responsáveis e aprovação de novos membros.</p>
        </div>
        <button className="btn-primary" onClick={openNewModal}>
          <PlusIcon /> Nova Célula
        </button>
      </div>

      <div className="broadcast-mural">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando células...</div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <UsersIcon />
            <h3>Nenhuma célula cadastrada.</h3>
            <p>Clique em Nova Célula para cadastrar a primeira reunião.</p>
          </div>
        ) : (
          groups.map((c) => (
            <div key={c.id} className="portal-card" style={{ padding: 20, cursor: 'pointer' }} onClick={() => openEditModal(c)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className={`status-badge ${c.status === 'ACTIVE' ? 'excellent' : 'pending'}`}>
                    {c.status === 'ACTIVE' ? "ATIVA NO APP" : "INATIVA"}
                  </span>
                  <span className="status-badge" style={{ background: '#f5f3ff', color: '#7c3aed', fontWeight: 800 }}>
                    {c.focus}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {c.pending_count && c.pending_count > 0 ? (
                    <button 
                      onClick={(e) => openApprovalsModal(c, e)} 
                      style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 800 }}
                    >
                      {c.pending_count} Pendente(s)
                    </button>
                  ) : null}
                  <button 
                    className="action-circle-btn" 
                    style={{ width: 30, height: 30, color: 'var(--danger)' }} 
                    onClick={(e) => handleDelete(c.id, e)}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>{c.name}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>{c.description || 'Sem descrição.'}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: 12, borderTop: '1px solid var(--panel-border)' }}>
                <div>📍 <strong>Região:</strong> {c.neighborhood || 'Bairro a definir'}</div>
                <div>🗓️ <strong>Reunião:</strong> {c.meeting_day} às {c.meeting_time}</div>
                <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>👑 Líder: {c.leader_name || 'Não atribuído'}</div>
              </div>
            </div>
          ))
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
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-green-bg)', color: 'var(--pastel-green-text)' }}>
                  <UsersIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">
                    {formData.id ? 'Editar Célula / Pequeno Grupo' : 'Cadastrar Nova Célula'}
                  </h2>
                  <p className="modal-studio-subtitle">
                    Configure endereço, horários de encontro e visibilidade no mapa de células do app.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setShowModal(false)} title="Fechar">
                &times;
              </button>
            </div>

            {/* Modal Body - 2 Column Grid */}
            <form id="cell-studio-form" onSubmit={handleSave} className="modal-studio-body">
              <div className="modal-studio-grid">
                
                {/* LEFT COLUMN: Dados Principais & Localização (60%) */}
                <div className="modal-studio-column">
                  
                  <div className="form-group-modern">
                    <label className="form-label-modern">Nome da Célula / Grupo *</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="Ex: Célula Betel, Ágape Famílias..." 
                      required 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Público Alvo / Foco</label>
                      <select 
                        className="select-modern"
                        value={formData.focus} 
                        onChange={e => setFormData({...formData, focus: e.target.value})}
                      >
                        <option value="GERAL">Geral (Misto / Famílias)</option>
                        <option value="CASAIS">Casais & Noivos</option>
                        <option value="HOMENS">Homens (Gideões)</option>
                        <option value="MULHERES">Mulheres (Déboras)</option>
                        <option value="JOVENS">Jovens (Juventude)</option>
                        <option value="ADOLESCENTES">Adolescentes (Teens)</option>
                        <option value="INFANTIL">Kids / Infantil</option>
                        <option value="EXPERIENTES">Melhor Idade (3ª Idade)</option>
                      </select>
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label-modern">Bairro / Região *</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        value={formData.neighborhood} 
                        onChange={e => setFormData({...formData, neighborhood: e.target.value})} 
                        placeholder="Ex: Centro, Pinheiros..." 
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Endereço do Encontro</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                      placeholder="Rua das Flores, 123 - Apto 402" 
                    />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Descrição & Proposta</label>
                    <textarea 
                      rows={2} 
                      className="textarea-modern"
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      placeholder="Um breve texto acolhedor sobre a célula e seu ambiente..." 
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Dia/Hora, WhatsApp & Status (40%) */}
                <div className="modal-studio-column">
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Dia da Reunião</label>
                      <select 
                        className="select-modern"
                        value={formData.meeting_day} 
                        onChange={e => setFormData({...formData, meeting_day: e.target.value})}
                      >
                        <option value="Segunda-feira">Segunda-feira</option>
                        <option value="Terça-feira">Terça-feira</option>
                        <option value="Quarta-feira">Quarta-feira</option>
                        <option value="Quinta-feira">Quinta-feira</option>
                        <option value="Sexta-feira">Sexta-feira</option>
                        <option value="Sábado">Sábado</option>
                        <option value="Domingo">Domingo</option>
                      </select>
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label-modern">Horário</label>
                      <input 
                        type="time" 
                        className="input-modern"
                        value={formData.meeting_time} 
                        onChange={e => setFormData({...formData, meeting_time: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">WhatsApp de Contato (Líder / Recepção)</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      value={formData.whatsapp_contact} 
                      onChange={e => setFormData({...formData, whatsapp_contact: e.target.value})} 
                      placeholder="(11) 98765-4321" 
                    />
                  </div>

                  {/* Toggle: Célula Ativa */}
                  <div className="toggle-card-modern" style={{ marginTop: 4 }}>
                    <div className="toggle-card-info">
                      <div className="toggle-card-title">
                        <span style={{ color: '#059669' }}>📍</span> Célula Ativa no App
                      </div>
                      <div className="toggle-card-desc">
                        Aparecerá no mapa e na busca para novos membros
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

                  {/* Live Mobile Card Preview */}
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 16, border: '1px solid var(--panel-border)' }}>
                    <div style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      📱 Live Card no App
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.90rem', color: 'var(--text-main)', marginBottom: 2 }}>
                      {formData.name || 'Nome da Célula'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      📍 {formData.neighborhood || 'Bairro'} • {formData.meeting_day} às {formData.meeting_time}
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
                form="cell-studio-form" 
                className="btn-primary" 
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar Célula'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Approvals Modal */}
      {showApprovals && activeCellForApproval && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowApprovals(false)}>
          <div className="modal-studio-container" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-studio-header">
              <h2 className="modal-studio-title">Solicitações: {activeCellForApproval.name}</h2>
              <button className="modal-close-circle" onClick={() => setShowApprovals(false)}>&times;</button>
            </div>
            <div className="modal-studio-body" style={{ padding: 24 }}>
               {activeCellForApproval.pending_users && activeCellForApproval.pending_users.length > 0 ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                   {activeCellForApproval.pending_users.map(u => (
                      <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--panel-border)' }}>
                         <div style={{ flex: 1 }}>
                           <p style={{ fontWeight: 800, margin: 0, color: 'var(--text-main)', fontSize: '0.90rem' }}>👤 {u.name}</p>
                           <div style={{ display: 'flex', gap: 14, marginTop: 4, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                             <span>📧 {u.email || 'Sem e-mail'}</span>
                             <span>📱 {u.phone || 'Sem telefone'}</span>
                           </div>
                         </div>
                         <div style={{ display: 'flex', gap: 8 }}>
                           <button onClick={() => handleEvaluate(u.id, false)} style={{ background: '#fee2e2', border: 'none', color: '#dc2626', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>Recusar</button>
                           <button onClick={() => handleEvaluate(u.id, true)} style={{ background: '#059669', border: 'none', color: '#FFF', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}>Aprovar</button>
                         </div>
                      </div>
                   ))}
                 </div>
               ) : (
                 <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>Todas as solicitações de entrada nesta célula já foram respondidas.</p>
               )}
            </div>
          </div>
        </div>, 
        document.body
      )}
    </div>
  );
}
