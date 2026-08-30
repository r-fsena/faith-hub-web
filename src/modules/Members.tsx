import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Members.css';
import { getAuthHeaders } from '../services/apiClient';

// Icons used in Members module
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const MoreVerticalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
);
const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
);
const BanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
);
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
);

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Ativo' | 'Inativo' | 'Pendente' | 'ACTIVE' | 'INACTIVE';
  joinedAt: string;
  phone?: string;
  baptismDate?: string;
  memberSince?: string;
  cellGroup?: string;
  campus_id?: string;
  campus_ids?: string[];
  campusName?: string;
  cpf?: string;
}

interface MembersProps {
  selectedCampusId?: string;
  selectedOrganization?: any;
}

export default function Members({ selectedCampusId = 'all', selectedOrganization }: MembersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [filterRole, setFilterRole] = useState('Todos');
  const [isLoading, setIsLoading] = useState(false);

  // Multi-state configuration
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  
  // Invite State
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ 
    name: '', 
    email: '', 
    role: 'Membro', 
    cellGroupId: '', 
    campusIds: ['campus_sede'] as string[]
  });
  const [isInviting, setIsInviting] = useState(false);
  const [cellGroups, setCellGroups] = useState<{id: string, name: string}[]>([]);
  const [campusesList, setCampusesList] = useState<{id: string, name: string, is_headquarters?: number}[]>([]);
  
  // Edit State
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [editCampusIds, setEditCampusIds] = useState<string[]>([]);

  useEffect(() => {
    fetchMembers();
    fetchCellGroups();
    fetchCampuses();
  }, [selectedCampusId, selectedOrganization]);

  const fetchCampuses = async () => {
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const response = await fetch(`${API_URL}/campuses?organization_id=${orgId}`, { headers });
      if (response.ok) {
        const json = await response.json();
        setCampusesList(json.data || []);
      }
    } catch (e) {}
  };

  const fetchCellGroups = async () => {
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const response = await fetch(`${API_URL}/cell-groups?organization_id=${orgId}${campusParam}`, { headers });
      if (response.ok) {
        const json = await response.json();
        setCellGroups(json);
      }
    } catch (e) {
      console.error("Erro ao puxar células:", e);
    }
  };
  
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const response = await fetch(`${API_URL}/members?organization_id=${orgId}${campusParam}`, { headers });
      if (response.ok) {
        const json = await response.json();
        setMembers((json.data || []).map((m: any) => ({
          ...m,
          joinedAt: m.created_at,
          baptismDate: m.baptism_date,
          cellGroup: m.cell_group_id,
          campus_ids: Array.isArray(m.campus_ids) ? m.campus_ids : (m.campus_ids ? JSON.parse(m.campus_ids) : [m.campus_id || 'campus_sede']),
          campusName: m.campus_name
        })));
      }
    } catch (e) {
      console.error("Erro ao puxar membros:", e);
    }
    setIsLoading(false);
  };

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleDropdown = (e: React.MouseEvent, memberId: string) => {
    e.stopPropagation();
    setActiveDropdownId(prev => prev === memberId ? null : memberId);
  };

  const handleEditClick = (member: Member) => {
    setMemberToEdit(member);
    const initialCampuses = member.campus_ids && member.campus_ids.length > 0 
      ? member.campus_ids 
      : (member.campus_id ? [member.campus_id] : ['campus_sede']);
    setEditCampusIds(initialCampuses);
    setEditModalOpen(true);
    setActiveDropdownId(null);
  };

  const toggleInviteCampus = (cId: string) => {
    setInviteForm(prev => {
      if (cId === 'all') {
        return { ...prev, campusIds: prev.campusIds.includes('all') ? ['campus_sede'] : ['all'] };
      }
      let updated = prev.campusIds.filter(id => id !== 'all');
      if (updated.includes(cId)) {
        updated = updated.filter(id => id !== cId);
        if (updated.length === 0) updated = ['campus_sede'];
      } else {
        updated.push(cId);
      }
      return { ...prev, campusIds: updated };
    });
  };

  const toggleEditCampus = (cId: string) => {
    setEditCampusIds(prev => {
      if (cId === 'all') {
        return prev.includes('all') ? ['campus_sede'] : ['all'];
      }
      let updated = prev.filter(id => id !== 'all');
      if (updated.includes(cId)) {
        updated = updated.filter(id => id !== cId);
        if (updated.length === 0) updated = ['campus_sede'];
      } else {
        updated.push(cId);
      }
      return updated;
    });
  };

  const handleStatusChange = async (member: Member, action: 'enable' | 'disable') => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/members/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ email: member.email, action })
      });
      if (response.ok) {
        fetchMembers();
      } else {
        alert("Erro ao alterar o status na API.");
      }
    } catch(e) {
       console.error("Erro", e);
    }
  };

  const submitInvite = async () => {
    if (!inviteForm.name || !inviteForm.email) return alert("Preencha os campos obrigatórios.");
    setIsInviting(true);
    try {
      const headers = await getAuthHeaders();
      const selectedCampuses = inviteForm.campusIds.length > 0 ? inviteForm.campusIds : ['campus_sede'];
      const payload = {
        name: inviteForm.name,
        email: inviteForm.email,
        role: inviteForm.role,
        cellGroupId: inviteForm.cellGroupId || null,
        organization_id: selectedOrganization?.id || 'org_default',
        campus_id: selectedCampuses[0] || 'campus_sede',
        campus_ids: selectedCampuses
      };

      const resp = await fetch(`${API_URL}/members/invite`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        setInviteModalOpen(false);
        setInviteForm({ 
          name: '', 
          email: '', 
          role: 'Membro', 
          cellGroupId: '', 
          campusIds: selectedCampusId !== 'all' ? [selectedCampusId] : ['campus_sede'] 
        });
        alert("Convite enviado com sucesso! O membro foi cadastrado no sistema.");
        fetchMembers();
      } else {
        const err = await resp.json().catch(() => ({ error: 'Erro desconhecido ao processar convite' }));
        alert("Erro ao convidar: " + (err.error || err.message || 'Falha no processamento'));
      }
    } catch(e: any) {
      console.error("Erro no convite:", e);
      alert("Erro ao comunicar com a API: " + (e?.message || 'Verifique a conexão'));
    }
    setIsInviting(false);
  };

  const handleSendResetPassword = async (email: string) => {
     try {
       const headers = await getAuthHeaders();
       await fetch(`${API_URL}/members/reset-password`, {
         method: 'POST',
         headers,
         body: JSON.stringify({ email })
       });
       alert(`E-Mail de redefinição enviado para ${email}`);
     } catch(e) {}
  };

  const submitEditProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!memberToEdit) return;
    const formData = new FormData(e.currentTarget);
    const selectedCampuses = editCampusIds.length > 0 ? editCampusIds : ['campus_sede'];
    const payload = {
      name: formData.get('name'),
      cpf: formData.get('cpf'),
      baptismDate: formData.get('baptismDate') || null,
      role: formData.get('role'),
      cellGroupId: formData.get('cellGroup') || null,
      campus_id: selectedCampuses[0] || 'campus_sede',
      campus_ids: selectedCampuses,
      phone: formData.get('phone') || null
    };

    try {
       const headers = await getAuthHeaders();
       const resp = await fetch(`${API_URL}/members/${memberToEdit.id}`, {
         method: 'PUT',
         headers,
         body: JSON.stringify(payload)
       });
       if(resp.ok) {
          setEditModalOpen(false);
          fetchMembers();
       } else {
          alert('Erro na atualização');
       }
    } catch(e) { console.error(e) }
  };

  const getStatusBadge = (status: string) => {
    const s = status ? status.toUpperCase() : 'PENDENTE';
    if (s === 'ATIVO' || s === 'ACTIVE') return <span className="status-badge good">Ativo</span>;
    if (s === 'INATIVO' || s === 'INACTIVE') return <span className="status-badge bad">Inativo</span>;
    return <span className="status-badge warn">Pendente</span>;
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'Todos' || m.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.3px' }}>
            Membros & Equipe Ministerial
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
            Gestão de membresia, líderes, credenciais e alocação em congregações.
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => {
            setInviteForm(prev => ({
              ...prev,
              campusIds: selectedCampusId !== 'all' ? [selectedCampusId] : ['campus_sede']
            }));
            setInviteModalOpen(true);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlusIcon /> Convidar Membro / Líder
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '640px' }}>
          <div className="search-pill" style={{ flex: 1 }}>
            <SearchIcon />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="select-pill"
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
          >
            <option value="Todos">Todos os Cargos</option>
            <option value="ADMIN">Administrador</option>
            <option value="Líder de Célula">Líder de Célula</option>
            <option value="Membro">Membro comum</option>
          </select>
        </div>
        
        <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filteredMembers.length} membro(s) encontrado(s)
        </div>
      </div>

      {/* Table Area */}
      <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="members-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Membro</th>
                <th>Cargo / Função</th>
                <th>Unidades / Campi Autorizados</th>
                <th>Célula</th>
                <th>Status</th>
                <th>Cadastro</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Carregando membros cadastrados...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Nenhum membro encontrado nesta seleção.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isAllCampuses = member.campus_ids?.includes('all');
                  return (
                    <tr key={member.id}>
                      <td>
                        <div className="user-cell">
                          <div className="member-avatar" style={{ background: 'var(--accent-primary-gradient)' }}>
                            {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                          </div>
                          <div>
                            <div className="member-meta-title">{member.name}</div>
                            <div className="member-meta-sub">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-main)' }}>
                          {member.role || 'Membro'}
                        </span>
                      </td>
                      <td>
                        {isAllCampuses ? (
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                            🌐 Todas as Unidades
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(member.campus_ids && member.campus_ids.length > 0 ? member.campus_ids : [member.campus_id]).map(cId => {
                              const foundCampus = campusesList.find(c => c.id === cId);
                              const campusName = foundCampus ? foundCampus.name : (cId === 'campus_sede' ? 'Sede' : 'Local');
                              return (
                                <span key={cId} style={{ background: '#f1f5f9', color: 'var(--text-main)', border: '1px solid var(--panel-border)', padding: '2px 7px', borderRadius: '6px', fontSize: '0.70rem', fontWeight: 700 }}>
                                  📍 {campusName}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {cellGroups.find(c => c.id === member.cellGroup)?.name || 'Sem Célula'}
                        </span>
                      </td>
                      <td>
                        {getStatusBadge(member.status)}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>
                          {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', position: 'relative' }}>
                        <button 
                          className="action-circle-btn" 
                          style={{ marginLeft: 'auto', width: 32, height: 32 }}
                          onClick={(e) => toggleDropdown(e, member.id)}
                        >
                          <MoreVerticalIcon />
                        </button>

                        {activeDropdownId === member.id && (
                          <div style={{
                            position: 'absolute',
                            right: '12px',
                            top: '40px',
                            background: '#ffffff',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.12)',
                            border: '1px solid var(--panel-border)',
                            padding: '6px',
                            zIndex: 50,
                            minWidth: '180px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}>
                            <button 
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-main)', textAlign: 'left', fontWeight: 600 }}
                              onClick={() => handleEditClick(member)}
                            >
                              <EditIcon /> Editar Perfil & Unidades
                            </button>
                            <button 
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'left', fontWeight: 600 }}
                              onClick={() => handleSendResetPassword(member.email)}
                            >
                              Redefinir Senha
                            </button>
                            <div style={{ borderTop: '1px solid var(--panel-border)', margin: '4px 0' }}></div>
                            <button 
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', color: '#dc2626', textAlign: 'left', fontWeight: 600 }}
                              onClick={() => handleStatusChange(member, member.status === 'ACTIVE' || member.status === 'Ativo' ? 'disable' : 'enable')}
                            >
                              <BanIcon /> {member.status === 'ACTIVE' || member.status === 'Ativo' ? 'Inativar Acesso' : 'Reativar Acesso'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          INVITE MODAL STUDIO (Com Múltipla Seleção de Unidades)
          ======================================================== */}
      {isInviteModalOpen && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setInviteModalOpen(false)}>
          <div className="modal-studio-container" style={{ maxWidth: 840 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon">
                  <UserPlusIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">Convidar Membro ou Administrador</h2>
                  <p className="modal-studio-subtitle">
                    Cadastre o usuário e selecione uma ou mais unidades que ele terá acesso.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setInviteModalOpen(false)}>✕</button>
            </div>

            <div className="modal-studio-body">
              <div className="modal-studio-grid">
                {/* Left Column: Identificação */}
                <div className="modal-studio-column">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Nome Completo *</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      placeholder="Ex: Pr. João Victor" 
                      value={inviteForm.name} 
                      onChange={e => setInviteForm({...inviteForm, name: e.target.value})} 
                      required
                    />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">E-mail de Acesso *</label>
                    <input 
                      type="email" 
                      className="input-modern"
                      placeholder="joao@igreja.com" 
                      value={inviteForm.email} 
                      onChange={e => setInviteForm({...inviteForm, email: e.target.value})} 
                      required
                    />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Função / Cargo</label>
                    <select 
                      className="select-modern"
                      value={inviteForm.role} 
                      onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                    >
                      <option value="Membro">Membro Comum</option>
                      <option value="Líder de Célula">Líder de Célula / GC</option>
                      <option value="Pastor de Unidade">Pastor de Unidade / Filial</option>
                      <option value="Pastor Regional">Pastor Regional / Multi-Campi</option>
                      <option value="Tesouraria">Tesouraria / Finanças</option>
                      <option value="ADMIN">Administrador Geral</option>
                    </select>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Alocar em Célula</label>
                    <select 
                      className="select-modern"
                      value={inviteForm.cellGroupId} 
                      onChange={e => setInviteForm({...inviteForm, cellGroupId: e.target.value})}
                    >
                      <option value="">Não Alocar Inicialmente</option>
                      {cellGroups.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column: Seleção Múltipla de Unidades */}
                <div className="modal-studio-column">
                  <div className="form-group-modern">
                    <label className="form-label-modern" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Unidades / Campi Autorizados *</span>
                      <span style={{ fontSize: '0.70rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                        {inviteForm.campusIds.includes('all') ? 'Todas as Unidades' : `${inviteForm.campusIds.length} selecionada(s)`}
                      </span>
                    </label>
                    
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '10px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      maxHeight: '260px',
                      overflowY: 'auto'
                    }}>
                      {/* Opção Todas as Unidades */}
                      <div 
                        onClick={() => toggleInviteCampus('all')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: inviteForm.campusIds.includes('all') ? 'var(--accent-primary-light)' : '#ffffff',
                          border: inviteForm.campusIds.includes('all') ? '1px solid var(--accent-primary)' : '1px solid var(--panel-border)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>🌐</span>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>Todas as Unidades</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Gestão Global / Pastor Regional</div>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={inviteForm.campusIds.includes('all')} 
                          onChange={() => {}} 
                          style={{ cursor: 'pointer' }}
                        />
                      </div>

                      {/* Lista de Campi Cadastrados */}
                      {campusesList.map(camp => {
                        const isChecked = inviteForm.campusIds.includes('all') || inviteForm.campusIds.includes(camp.id);
                        return (
                          <div 
                            key={camp.id}
                            onClick={() => toggleInviteCampus(camp.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: isChecked ? 'var(--accent-primary-light)' : '#ffffff',
                              border: isChecked ? '1px solid var(--accent-primary)' : '1px solid var(--panel-border)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1rem' }}>📍</span>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                  {camp.name} {Boolean(camp.is_headquarters) ? '⭐ (Sede)' : ''}
                                </div>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {}} 
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Selecione uma ou mais congregações para liberar o acesso a este usuário.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-studio-footer">
              <button className="btn-secondary" onClick={() => setInviteModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={submitInvite} disabled={isInviting}>
                <SendIcon /> {isInviting ? "Enviando..." : "Disparar Convite AWS"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          EDIT MODAL STUDIO (Com Múltipla Seleção de Unidades)
          ======================================================== */}
      {isEditModalOpen && memberToEdit && createPortal(
        <form className="modal-overlay animate-fade-in" onClick={() => setEditModalOpen(false)} onSubmit={submitEditProfile}>
          <div className="modal-studio-container" style={{ maxWidth: 880 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-green-bg)', color: 'var(--pastel-green-text)' }}>
                  <EditIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">Editar Perfil & Unidades do Membro</h2>
                  <p className="modal-studio-subtitle">
                    Atualize os dados ministeriais, telefone e congregações vinculadas.
                  </p>
                </div>
              </div>
              <button type="button" className="modal-close-circle" onClick={() => setEditModalOpen(false)}>✕</button>
            </div>

            <div className="modal-studio-body">
              <div className="modal-studio-grid">
                
                {/* Left Column: Dados Pessoais */}
                <div className="modal-studio-column">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Nome Completo</label>
                    <input type="text" name="name" className="input-modern" defaultValue={memberToEdit.name} required />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">E-mail (Identificador)</label>
                    <input type="email" className="input-modern" defaultValue={memberToEdit.email} disabled style={{ opacity: 0.7 }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Telefone / WhatsApp</label>
                      <input type="text" name="phone" className="input-modern" defaultValue={memberToEdit.phone || ''} placeholder="(00) 00000-0000" />
                    </div>
                    <div className="form-group-modern">
                      <label className="form-label-modern">CPF (Opcional)</label>
                      <input type="text" name="cpf" className="input-modern" defaultValue={memberToEdit.cpf || ''} />
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label className="form-label-modern" style={{ margin: 0 }}>Função / Cargo</label>
                      <button 
                        type="button"
                        style={{ color: 'var(--accent-primary)', fontSize: '0.74rem', fontWeight: 700 }}
                        onClick={() => handleSendResetPassword(memberToEdit.email)}
                      >
                        Redefinir Senha
                      </button>
                    </div>
                    <select name="role" className="select-modern" defaultValue={memberToEdit.role || 'Membro'}>
                      <option value="Membro">Membro Comum</option>
                      <option value="Líder de Célula">Líder de Célula / GC</option>
                      <option value="Pastor de Unidade">Pastor de Unidade / Filial</option>
                      <option value="Pastor Regional">Pastor Regional / Multi-Campi</option>
                      <option value="Tesouraria">Tesouraria / Finanças</option>
                      <option value="ADMIN">Administrador Geral</option>
                    </select>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Alocar em Célula</label>
                    <select name="cellGroupId" className="select-modern" defaultValue={memberToEdit.cellGroup || ''}>
                      <option value="">Nenhuma Célula</option>
                      {cellGroups.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column: Vínculo de Célula & Múltiplas Unidades */}
                <div className="modal-studio-column">
                  <div className="form-group-modern">
                    <label className="form-label-modern" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Unidades / Campi Autorizados</span>
                      <span style={{ fontSize: '0.70rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                        {editCampusIds.includes('all') ? 'Todas as Unidades' : `${editCampusIds.length} selecionada(s)`}
                      </span>
                    </label>
                    
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '10px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      maxHeight: '280px',
                      overflowY: 'auto'
                    }}>
                      <div 
                        onClick={() => toggleEditCampus('all')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: editCampusIds.includes('all') ? 'var(--accent-primary-light)' : '#ffffff',
                          border: editCampusIds.includes('all') ? '1px solid var(--accent-primary)' : '1px solid var(--panel-border)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>🌐</span>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>Todas as Unidades</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Acesso Global Multi-Campi</div>
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={editCampusIds.includes('all')} 
                          onChange={() => {}} 
                          style={{ cursor: 'pointer' }}
                        />
                      </div>

                      {campusesList.map(camp => {
                        const isChecked = editCampusIds.includes('all') || editCampusIds.includes(camp.id);
                        return (
                          <div 
                            key={camp.id}
                            onClick={() => toggleEditCampus(camp.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              background: isChecked ? 'var(--accent-primary-light)' : '#ffffff',
                              border: isChecked ? '1px solid var(--accent-primary)' : '1px solid var(--panel-border)',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1rem' }}>📍</span>
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                  {camp.name} {Boolean(camp.is_headquarters) ? '⭐ (Sede)' : ''}
                                </div>
                              </div>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {}} 
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="modal-studio-footer">
              <button type="button" className="btn-secondary" onClick={() => setEditModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">
                <CheckCircleIcon /> Salvar Alterações
              </button>
            </div>
          </div>
        </form>,
        document.body
      )}
    </div>
  );
}
