import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css';

// SVG Icons
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
const CoffeeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

type MemberBrief = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  created_at?: string;
};

type PartilhaItem = {
  id: string;
  cell_group_id: string;
  user_name: string;
  item_name: string;
  quantity?: string;
  event_date: string;
  is_confirmed: boolean | number;
};

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
  campus_id?: string;
  campus_name?: string;
  pending_count?: number;
  member_count?: number;
  pending_users?: MemberBrief[];
  members?: MemberBrief[];
};

interface CellGroupsProps {
  selectedCampusId?: string;
  selectedOrganization?: any;
}

export default function CellGroups({ selectedCampusId = 'all', selectedOrganization }: CellGroupsProps) {
  const [groups, setGroups] = useState<CellGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal de Criação / Edição Rápida
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allChurchMembers, setAllChurchMembers] = useState<MemberBrief[]>([]);

  // Modal de Workspace / Gestão Completa da Célula
  const [selectedCell, setSelectedCell] = useState<CellGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'approvals' | 'partilhas' | 'settings'>('members');
  const [cellMembers, setCellMembers] = useState<MemberBrief[]>([]);
  const [cellPending, setCellPending] = useState<MemberBrief[]>([]);
  const [cellPartilhas, setCellPartilhas] = useState<PartilhaItem[]>([]);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);

  // Estados internos do Workspace
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showAddMemberDropdown, setShowAddMemberDropdown] = useState(false);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');

  // Novo item de partilha
  const [newPartilhaForm, setNewPartilhaForm] = useState({
    user_name: '',
    item_name: '',
    quantity: '1',
    event_date: new Date().toISOString().split('T')[0]
  });
  const [showNewPartilhaModal, setShowNewPartilhaModal] = useState(false);

  // Form de Dados Gerais (usado na criação e na aba de configurações)
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    leader_id: '',
    description: '',
    address: '',
    neighborhood: '',
    meeting_day: 'Quarta-feira',
    meeting_time: '19:30',
    whatsapp_contact: '',
    focus: 'GERAL',
    status: 'ACTIVE'
  });

  useEffect(() => {
    loadGroups();
    loadChurchMembers();
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

  const loadChurchMembers = async () => {
    try {
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const res = await fetch(`${API_URL}/members?organization_id=${orgId}${campusParam}`);
      if (res.ok) {
        const json = await res.json();
        setAllChurchMembers(json.data || []);
      }
    } catch (e) {
      console.error("Erro ao carregar membros da igreja:", e);
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
      console.error("Erro ao puxar células:", err);
    } finally {
      setLoading(false);
    }
  };

  // Abrir Painel de Gestão da Célula (Workspace)
  const openCellWorkspace = async (cell: CellGroup, tab: 'members' | 'approvals' | 'partilhas' | 'settings' = 'members') => {
    setSelectedCell(cell);
    setActiveTab(tab);
    setFormData({
      id: cell.id,
      name: cell.name,
      leader_id: cell.leader_id || '',
      description: cell.description || '',
      address: cell.address || '',
      neighborhood: cell.neighborhood || '',
      meeting_day: cell.meeting_day || 'Quarta-feira',
      meeting_time: cell.meeting_time || '19:30',
      whatsapp_contact: cell.whatsapp_contact || '',
      focus: cell.focus || 'GERAL',
      status: cell.status || 'ACTIVE'
    });
    await refreshWorkspaceData(cell.id);
  };

  const refreshWorkspaceData = async (cellId: string) => {
    setIsWorkspaceLoading(true);
    try {
      const headers = await getAuthHeaders();
      // Puxa detalhes, membros e pendentes da célula
      const res = await fetch(`${API_URL}/cell-groups/${cellId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCellMembers(data.members || []);
        setCellPending(data.pending_users || []);
      }

      // Puxa partilhas/lanches da célula
      const partilhasRes = await fetch(`${API_URL}/partilhas?group_id=${cellId}`, { headers });
      if (partilhasRes.ok) {
        const partilhasData = await partilhasRes.json();
        setCellPartilhas(Array.isArray(partilhasData) ? partilhasData : []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados do workspace da célula:", err);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  // Salvar Criação ou Atualização da Célula
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
        setShowCreateModal(false);
        alert("Célula salva com sucesso!");
        loadGroups();
        if (selectedCell) {
          setSelectedCell(prev => prev ? { ...prev, ...formData } : null);
        }
      } else {
        alert("Erro ao salvar dados da célula.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Excluir Célula
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Tem certeza que deseja remover esta célula? Os membros permanecerão cadastrados na igreja.")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/cell-groups/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        if (selectedCell?.id === id) setSelectedCell(null);
        loadGroups();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Avaliar Pedido de Ingresso (Aprovar ou Recusar)
  const handleEvaluate = async (userId: string, approve: boolean) => {
    if (!selectedCell) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/cell-groups/${selectedCell.id}/join-requests/${userId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: approve ? 'approve' : 'reject' })
      });
      if (res.ok) {
        await refreshWorkspaceData(selectedCell.id);
        loadGroups();
      }
    } catch(err) {
      console.error(err);
    }
  };

  // Adicionar Membro da Igreja à Célula
  const handleAddMemberToCell = async () => {
    if (!selectedCell || !selectedMemberToAdd) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/cell-groups/${selectedCell.id}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ member_id: selectedMemberToAdd })
      });
      if (res.ok) {
        setSelectedMemberToAdd('');
        setShowAddMemberDropdown(false);
        await refreshWorkspaceData(selectedCell.id);
        loadGroups();
      } else {
        alert("Erro ao vincular membro.");
      }
    } catch(err) {
      console.error(err);
    }
  };

  // Remover / Desvincular Membro da Célula
  const handleRemoveMemberFromCell = async (memberId: string) => {
    if (!selectedCell) return;
    if (!window.confirm("Desvincular este membro da célula? Ele continuará como membro geral da igreja.")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/cell-groups/${selectedCell.id}/members/${memberId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        await refreshWorkspaceData(selectedCell.id);
        loadGroups();
      }
    } catch(err) {
      console.error(err);
    }
  };

  // Adicionar Item de Partilha / Escala de Lanche
  const handleCreatePartilha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !newPartilhaForm.item_name) return;
    try {
      const headers = await getAuthHeaders();
      const payload = {
        cell_group_id: selectedCell.id,
        user_name: newPartilhaForm.user_name || 'Voluntário',
        item_name: newPartilhaForm.item_name,
        quantity: newPartilhaForm.quantity,
        event_date: newPartilhaForm.event_date
      };

      const res = await fetch(`${API_URL}/partilhas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowNewPartilhaModal(false);
        setNewPartilhaForm({
          user_name: '',
          item_name: '',
          quantity: '1',
          event_date: new Date().toISOString().split('T')[0]
        });
        await refreshWorkspaceData(selectedCell.id);
      }
    } catch(err) {
      console.error(err);
    }
  };

  // Alternar confirmação do item de partilha
  const handleTogglePartilha = async (partilhaId: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/partilhas/${partilhaId}/toggle`, {
        method: 'PUT',
        headers
      });
      if (res.ok && selectedCell) {
        await refreshWorkspaceData(selectedCell.id);
      }
    } catch(err) {
      console.error(err);
    }
  };

  // Excluir item de partilha
  const handleDeletePartilha = async (partilhaId: string) => {
    if (!window.confirm("Remover este item da escala?")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/partilhas/${partilhaId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok && selectedCell) {
        await refreshWorkspaceData(selectedCell.id);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const openNewModal = () => {
    setFormData({
      id: '',
      name: '',
      leader_id: '',
      description: '',
      address: '',
      neighborhood: '',
      meeting_day: 'Quarta-feira',
      meeting_time: '19:30',
      whatsapp_contact: '',
      focus: 'GERAL',
      status: 'ACTIVE'
    });
    setShowCreateModal(true);
  };

  const filteredCellMembers = cellMembers.filter(m => 
    (m.name || '').toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(memberSearchTerm.toLowerCase())
  );

  const availableMembersToAdd = allChurchMembers.filter(m => 
    !cellMembers.some(cm => cm.id === m.id)
  );

  return (
    <div className="broadcasts-container animate-fade-in">
      
      {/* Header */}
      <div className="card-header-row" style={{ paddingBottom: 20, borderBottom: '1px solid var(--panel-border)', marginBottom: 24 }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.45rem', fontWeight: 800 }}>Células, Redes & Pequenos Grupos</h1>
          <p className="card-subtitle">Gerencie os grupos nos bairros, aprove pedidos de novos membros e organize as escalas de comunhão.</p>
        </div>
        <button className="btn-primary" onClick={openNewModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlusIcon /> Nova Célula
        </button>
      </div>

      {/* Grid de Cards de Células */}
      <div className="broadcast-mural">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando células cadastradas...
          </div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <UsersIcon />
            <h3>Nenhuma célula cadastrada nesta congregação.</h3>
            <p>Clique em "+ Nova Célula" para cadastrar o primeiro pequeno grupo.</p>
          </div>
        ) : (
          groups.map((c) => {
            const hasPending = (c.pending_count || 0) > 0;
            return (
              <div 
                key={c.id} 
                className="portal-card" 
                style={{ 
                  padding: 20, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  gap: 14,
                  border: hasPending ? '2px solid #f59e0b' : '1px solid var(--panel-border)',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Badges do Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`status-badge ${c.status === 'ACTIVE' ? 'excellent' : 'pending'}`}>
                        {c.status === 'ACTIVE' ? "ATIVA NO APP" : "INATIVA"}
                      </span>
                      <span className="status-badge" style={{ background: '#f5f3ff', color: '#7c3aed', fontWeight: 800 }}>
                        {c.focus}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {hasPending && (
                        <button 
                          onClick={() => openCellWorkspace(c, 'approvals')}
                          style={{ 
                            background: '#fef3c7', 
                            color: '#b45309', 
                            border: '1px solid #fde68a', 
                            borderRadius: 20, 
                            padding: '3px 10px', 
                            fontSize: '0.72rem', 
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <span>⏳</span> {c.pending_count} Solicitação(ões)
                        </button>
                      )}
                      <button 
                        className="action-circle-btn" 
                        style={{ width: 30, height: 30, color: 'var(--danger)' }} 
                        onClick={(e) => handleDelete(c.id, e)}
                        title="Excluir Célula"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.10rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                    {c.name}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                    {c.description || 'Sem descrição cadastrada.'}
                  </p>
                  
                  {/* Informações de Local e Reunião */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: 12, borderTop: '1px solid var(--panel-border)' }}>
                    <div>📍 <strong>Região:</strong> {c.neighborhood || 'Bairro a definir'}</div>
                    <div>🗓️ <strong>Reunião:</strong> {c.meeting_day} às {c.meeting_time}</div>
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>👑 <strong>Líder:</strong> {c.leader_name || 'Não atribuído'}</div>
                  </div>
                </div>

                {/* Footer do Card com Botão de Acesso ao Painel de Gestão */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--panel-border)' }}>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    👥 {c.member_count || 0} participante(s)
                  </div>
                  <button 
                    className="btn-primary" 
                    style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => openCellWorkspace(c, 'members')}
                  >
                    <span>⚡</span> Gerenciar Grupo
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          WORKSPACE MODAL DA CÉLULA (PAINEL DE ADMINISTRAÇÃO DO GRUPO)
          ======================================================== */}
      {selectedCell && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setSelectedCell(null)}>
          <div 
            className="modal-studio-container" 
            style={{ maxWidth: 940, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Workspace */}
            <div className="modal-studio-header" style={{ paddingBottom: 16 }}>
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
                  <UsersIcon />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 className="modal-studio-title" style={{ margin: 0 }}>{selectedCell.name}</h2>
                    <span className="status-badge" style={{ background: '#f5f3ff', color: '#7c3aed', fontSize: '0.70rem', fontWeight: 800 }}>
                      {selectedCell.focus}
                    </span>
                  </div>
                  <p className="modal-studio-subtitle" style={{ margin: '2px 0 0 0' }}>
                    {selectedCell.meeting_day} às {selectedCell.meeting_time} • {selectedCell.neighborhood || 'Local no App'} • Líder: {selectedCell.leader_name || 'Não atribuído'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {selectedCell.whatsapp_contact && (
                  <a 
                    href={`https://wa.me/55${selectedCell.whatsapp_contact.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: '#22c55e',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: 10,
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      textDecoration: 'none'
                    }}
                  >
                    <span>📱</span> WhatsApp do Grupo
                  </a>
                )}
                <button className="modal-close-circle" onClick={() => setSelectedCell(null)}>✕</button>
              </div>
            </div>

            {/* Tabs de Navegação do Workspace */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--panel-border)', padding: '0 24px', background: '#f8fafc', gap: 4 }}>
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                style={{
                  padding: '12px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'members' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  color: activeTab === 'members' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'members' ? 800 : 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>👥 Participantes</span>
                <span style={{ background: activeTab === 'members' ? 'var(--accent-primary-light)' : '#e2e8f0', color: activeTab === 'members' ? 'var(--accent-primary)' : 'var(--text-muted)', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800 }}>
                  {cellMembers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('approvals')}
                style={{
                  padding: '12px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'approvals' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  color: activeTab === 'approvals' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'approvals' ? 800 : 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>⏳ Pedidos de Filiação</span>
                {cellPending.length > 0 && (
                  <span style={{ background: '#f59e0b', color: '#ffffff', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800 }}>
                    {cellPending.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('partilhas')}
                style={{
                  padding: '12px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'partilhas' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  color: activeTab === 'partilhas' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'partilhas' ? 800 : 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>🥪 Escala do Lanche & Comunhão</span>
                <span style={{ background: '#e2e8f0', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 800 }}>
                  {cellPartilhas.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                style={{
                  padding: '12px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'settings' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  color: activeTab === 'settings' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'settings' ? 800 : 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>⚙️ Configurações & Dados</span>
              </button>
            </div>

            {/* Conteúdo Dinâmico das Abas */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              
              {/* ABA 1: MEMBROS & PARTICIPANTES */}
              {activeTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div className="search-pill" style={{ maxWidth: 320, flex: 1 }}>
                      <input 
                        type="text" 
                        placeholder="Buscar membro na célula..." 
                        value={memberSearchTerm} 
                        onChange={e => setMemberSearchTerm(e.target.value)} 
                      />
                    </div>

                    {/* Botão de Adicionar Membro */}
                    <div style={{ position: 'relative' }}>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', padding: '8px 14px' }}
                        onClick={() => setShowAddMemberDropdown(!showAddMemberDropdown)}
                      >
                        <PlusIcon /> Adicionar Membro da Igreja
                      </button>

                      {showAddMemberDropdown && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '42px',
                          background: '#ffffff',
                          border: '1px solid var(--panel-border)',
                          borderRadius: 14,
                          boxShadow: 'var(--shadow-lg)',
                          padding: 14,
                          zIndex: 100,
                          width: 320,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10
                        }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            Vincular Membro a este Grupo
                          </div>
                          <select 
                            className="select-modern" 
                            value={selectedMemberToAdd} 
                            onChange={e => setSelectedMemberToAdd(e.target.value)}
                          >
                            <option value="">Selecione um membro da igreja...</option>
                            {availableMembersToAdd.map(m => (
                              <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                            ))}
                          </select>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <button type="button" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.76rem' }} onClick={() => setShowAddMemberDropdown(false)}>
                              Cancelar
                            </button>
                            <button type="button" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.76rem' }} onClick={handleAddMemberToCell} disabled={!selectedMemberToAdd}>
                              Vincular
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isWorkspaceLoading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando membros...</div>
                  ) : filteredCellMembers.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 14, border: '1px dashed var(--panel-border)' }}>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        Nenhum participante alocado nesta célula no momento.
                      </p>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.80rem' }}
                        onClick={() => setShowAddMemberDropdown(true)}
                      >
                        <PlusIcon /> Adicionar Primeiro Participante
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {filteredCellMembers.map(member => (
                        <div 
                          key={member.id} 
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--panel-border)',
                            borderRadius: 12,
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: 'var(--accent-primary-gradient)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.88rem'
                            }}>
                              {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.90rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                {member.name}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {member.email} {member.phone ? `• ${member.phone}` : ''}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {member.phone && (
                              <a
                                href={`https://wa.me/55${member.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  background: '#f0fdf4',
                                  color: '#16a34a',
                                  border: '1px solid #bbf7d0',
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                <span>📱</span> WhatsApp
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveMemberFromCell(member.id)}
                              style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                padding: '4px 10px',
                                borderRadius: 8,
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Desvincular da célula"
                            >
                              ✕ Desvincular
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: PEDIDOS DE FILIAÇÃO & INGRESSO */}
              {activeTab === 'approvals' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.2rem' }}>🔔</span>
                    <p style={{ margin: 0, fontSize: '0.80rem', color: '#92400e', fontWeight: 600 }}>
                      Membros ou visitantes que solicitaram entrada neste pequeno grupo pelo aplicativo móvel. Ao aprovar, o membro é vinculado imediatamente à célula.
                    </p>
                  </div>

                  {cellPending.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 14, border: '1px dashed var(--panel-border)' }}>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.90rem', fontWeight: 600 }}>
                        ✨ Nenhuma solicitação pendente para este grupo.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {cellPending.map(pending => (
                        <div 
                          key={pending.id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #fde68a',
                            borderRadius: 12,
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 42,
                              height: 42,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.92rem'
                            }}>
                              {pending.name ? pending.name.charAt(0).toUpperCase() : 'V'}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                {pending.name}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                {pending.email} {pending.phone ? `• ${pending.phone}` : ''}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleEvaluate(pending.id, false)}
                              style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                padding: '8px 14px',
                                borderRadius: 10,
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <XIcon /> Recusar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEvaluate(pending.id, true)}
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: 10,
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              <CheckIcon /> Aprovar Ingresso
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 3: ESCALA DO LANCHE & COMUNHÃO (PARTILHAS) */}
              {activeTab === 'partilhas' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Escala do Lanche & Itens de Comunhão
                      </h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Organize voluntários para levar bolo, suco, salgados e descartáveis no próximo encontro.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.80rem', padding: '8px 14px' }}
                      onClick={() => setShowNewPartilhaModal(true)}
                    >
                      <PlusIcon /> Adicionar Item à Escala
                    </button>
                  </div>

                  {cellPartilhas.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 14, border: '1px dashed var(--panel-border)' }}>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                        Nenhum item na escala de lanche desta célula.
                      </p>
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.80rem' }}
                        onClick={() => setShowNewPartilhaModal(true)}
                      >
                        <PlusIcon /> Criar Primeira Escala
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cellPartilhas.map(item => {
                        const isConfirmed = Boolean(item.is_confirmed);
                        return (
                          <div
                            key={item.id}
                            style={{
                              background: isConfirmed ? '#f0fdf4' : '#ffffff',
                              border: isConfirmed ? '1px solid #bbf7d0' : '1px solid var(--panel-border)',
                              borderRadius: 12,
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 12
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <input 
                                type="checkbox" 
                                checked={isConfirmed} 
                                onChange={() => handleTogglePartilha(item.id)} 
                                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#16a34a' }}
                              />
                              <div>
                                <div style={{ fontSize: '0.90rem', fontWeight: 800, color: 'var(--text-main)', textDecoration: isConfirmed ? 'line-through' : 'none' }}>
                                  {item.item_name} {item.quantity ? `(${item.quantity})` : ''}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  👤 Responsável: <strong>{item.user_name}</strong> • 🗓️ Data: {item.event_date ? new Date(item.event_date).toLocaleDateString('pt-BR') : 'Próxima reunião'}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                background: isConfirmed ? '#dcfce7' : '#f1f5f9',
                                color: isConfirmed ? '#166534' : 'var(--text-muted)',
                                padding: '2px 8px',
                                borderRadius: 6,
                                fontSize: '0.70rem',
                                fontWeight: 800
                              }}>
                                {isConfirmed ? '✓ CONFIRMADO' : 'PENDENTE'}
                              </span>
                              <button
                                type="button"
                                className="action-circle-btn"
                                style={{ width: 28, height: 28, color: 'var(--danger)' }}
                                onClick={() => handleDeletePartilha(item.id)}
                                title="Excluir item"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 4: CONFIGURAÇÕES & DADOS DO ENCONTRO */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Nome do Pequeno Grupo / Célula *</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        required 
                      />
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label-modern">Líder Responsável</label>
                      <select 
                        className="select-modern"
                        value={formData.leader_id} 
                        onChange={e => setFormData({...formData, leader_id: e.target.value})}
                      >
                        <option value="">Selecione um líder cadastrado...</option>
                        {allChurchMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Foco / Segmento</label>
                      <select 
                        className="select-modern"
                        value={formData.focus} 
                        onChange={e => setFormData({...formData, focus: e.target.value})}
                      >
                        <option value="GERAL">Geral / Família</option>
                        <option value="JOVENS">Jovens / Young</option>
                        <option value="CASAIS">Casais</option>
                        <option value="MULHERES">Mulheres</option>
                        <option value="HOMENS">Homens</option>
                        <option value="TEENS">Adolescentes / Teens</option>
                      </select>
                    </div>

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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Bairro / Região</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        placeholder="Ex: Alphaville, Centro..." 
                        value={formData.neighborhood} 
                        onChange={e => setFormData({...formData, neighborhood: e.target.value})} 
                      />
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label-modern">WhatsApp do Grupo / Líder</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        placeholder="(11) 99999-9999" 
                        value={formData.whatsapp_contact} 
                        onChange={e => setFormData({...formData, whatsapp_contact: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Endereço Completo do Anfitrião</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      placeholder="Rua das Palmeiras, 120 - Apto 42" 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                    />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Descrição / Propósito da Célula</label>
                    <textarea 
                      className="input-modern"
                      rows={3} 
                      placeholder="Espaço de comunhão, oração mútua e estudo da Palavra..."
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--panel-border)' }}>
                    <button type="submit" className="btn-primary" disabled={saving}>
                      <CheckIcon /> {saving ? "Salvando..." : "Atualizar Dados da Célula"}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL DE CRIAR NOVA CÉLULA
          ======================================================== */}
      {showCreateModal && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <form className="modal-studio-container" style={{ maxWidth: 740 }} onClick={e => e.stopPropagation()} onSubmit={handleSave}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon">
                  <UsersIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">Cadastrar Nova Célula</h2>
                  <p className="modal-studio-subtitle">Crie um pequeno grupo e aloque um líder responsável.</p>
                </div>
              </div>
              <button type="button" className="modal-close-circle" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <div className="modal-studio-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Nome da Célula *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    placeholder="Ex: Célula Betel" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    required 
                  />
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Líder Responsável</label>
                  <select 
                    className="select-modern"
                    value={formData.leader_id} 
                    onChange={e => setFormData({...formData, leader_id: e.target.value})}
                  >
                    <option value="">Selecione um membro como líder...</option>
                    {allChurchMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Foco / Segmento</label>
                  <select 
                    className="select-modern"
                    value={formData.focus} 
                    onChange={e => setFormData({...formData, focus: e.target.value})}
                  >
                    <option value="GERAL">Geral / Família</option>
                    <option value="JOVENS">Jovens / Young</option>
                    <option value="CASAIS">Casais</option>
                    <option value="MULHERES">Mulheres</option>
                    <option value="HOMENS">Homens</option>
                    <option value="TEENS">Adolescentes</option>
                  </select>
                </div>

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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Bairro / Região</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    placeholder="Ex: Alphaville" 
                    value={formData.neighborhood} 
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})} 
                  />
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">WhatsApp do Grupo</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    placeholder="(11) 99999-9999" 
                    value={formData.whatsapp_contact} 
                    onChange={e => setFormData({...formData, whatsapp_contact: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Endereço Completo</label>
                <input 
                  type="text" 
                  className="input-modern"
                  placeholder="Rua, Número, Bairro" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                />
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Descrição</label>
                <textarea 
                  className="input-modern"
                  rows={2}
                  placeholder="Breve descrição sobre o propósito do grupo..." 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                />
              </div>
            </div>

            <div className="modal-studio-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                <PlusIcon /> {saving ? "Cadastrando..." : "Cadastrar Célula"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL DE NOVO ITEM DE ESCALA DE LANCHE (PARTILHA)
          ======================================================== */}
      {showNewPartilhaModal && createPortal(
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100 }} onClick={() => setShowNewPartilhaModal(false)}>
          <form className="modal-studio-container" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()} onSubmit={handleCreatePartilha}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                  <CoffeeIcon />
                </div>
                <div>
                  <h3 className="modal-studio-title" style={{ fontSize: '1.10rem' }}>Nova Escala de Lanche</h3>
                  <p className="modal-studio-subtitle">Defina o item e o voluntário responsável.</p>
                </div>
              </div>
              <button type="button" className="modal-close-circle" onClick={() => setShowNewPartilhaModal(false)}>✕</button>
            </div>

            <div className="modal-studio-body">
              <div className="form-group-modern">
                <label className="form-label-modern">Item / Alimento *</label>
                <input 
                  type="text" 
                  className="input-modern"
                  placeholder="Ex: Bolo de Cenoura, Refrigerante, Salgados..." 
                  value={newPartilhaForm.item_name} 
                  onChange={e => setNewPartilhaForm({...newPartilhaForm, item_name: e.target.value})} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Nome do Voluntário</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    placeholder="Ex: Carlos Silva" 
                    value={newPartilhaForm.user_name} 
                    onChange={e => setNewPartilhaForm({...newPartilhaForm, user_name: e.target.value})} 
                  />
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Quantidade</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    placeholder="Ex: 2 garrafas, 1 bolo" 
                    value={newPartilhaForm.quantity} 
                    onChange={e => setNewPartilhaForm({...newPartilhaForm, quantity: e.target.value})} 
                  />
                </div>
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Data do Encontro</label>
                <input 
                  type="date" 
                  className="input-modern"
                  value={newPartilhaForm.event_date} 
                  onChange={e => setNewPartilhaForm({...newPartilhaForm, event_date: e.target.value})} 
                />
              </div>
            </div>

            <div className="modal-studio-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowNewPartilhaModal(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">
                <PlusIcon /> Adicionar à Escala
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

    </div>
  );
}
