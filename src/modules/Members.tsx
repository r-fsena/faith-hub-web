import React, { useState, useEffect } from 'react';
import './Members.css';

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
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Membro', cellGroupId: '', campusId: '' });
  const [isInviting, setIsInviting] = useState(false);
  const [cellGroups, setCellGroups] = useState<{id: string, name: string}[]>([]);
  const [campusesList, setCampusesList] = useState<{id: string, name: string}[]>([]);
  
  // Edit State
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchCellGroups();
    fetchCampuses();
  }, [selectedCampusId, selectedOrganization]);

  const fetchCampuses = async () => {
    try {
      const orgId = selectedOrganization?.id || 'org_default';
      const response = await fetch(`${API_URL}/campuses?organization_id=${orgId}`);
      if (response.ok) {
        const json = await response.json();
        setCampusesList(json.data || []);
      }
    } catch (e) {}
  };

  const fetchCellGroups = async () => {
    try {
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const response = await fetch(`${API_URL}/cell-groups?organization_id=${orgId}${campusParam}`);
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
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const response = await fetch(`${API_URL}/members?organization_id=${orgId}${campusParam}`);
      if (response.ok) {
        const json = await response.json();
        setMembers((json.data || []).map((m: any) => ({
          ...m,
          joinedAt: m.created_at,
          baptismDate: m.baptism_date,
          cellGroup: m.cell_group_id,
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

  const toggleDropdown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  // Filter Logic
  const filteredMembers = members.filter(m => 
    (filterRole === 'Todos' || m.role === filterRole) &&
    (m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || m.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Ativo': 
      case 'ACTIVE': return <span className="status-badge excellent">Ativo</span>;
      case 'Inativo': 
      case 'INACTIVE': return <span className="status-badge" style={{ background: '#fee2e2', color: '#dc2626' }}>Inativo</span>;
      case 'Pendente': return <span className="status-badge pending">Pendente</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  // Actions Handlers
  const handleEditClick = (member: Member) => {
    setMemberToEdit(member);
    setEditModalOpen(true);
  };

  const handleUpdateStatus = async (member: Member, newStatus: string) => {
    try {
      const action = newStatus === 'Inativo' || newStatus === 'INACTIVE' ? 'disable' : 'enable';
      const response = await fetch(`${API_URL}/members/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const payload = {
        name: inviteForm.name,
        email: inviteForm.email,
        role: inviteForm.role,
        cellGroupId: inviteForm.cellGroupId || null,
        organization_id: selectedOrganization?.id || 'org_default',
        campus_id: inviteForm.campusId || (selectedCampusId !== 'all' ? selectedCampusId : 'campus_sede')
      };

      const resp = await fetch(`${API_URL}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        setInviteModalOpen(false);
        setInviteForm({ name: '', email: '', role: 'Membro', cellGroupId: '', campusId: '' });
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
       await fetch(`${API_URL}/members/reset-password`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email })
       });
       alert(`E-Mail de redefinição enviado para ${email}`);
     } catch(e) {}
  };

  const submitEditProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!memberToEdit) return;
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      cpf: formData.get('cpf'),
      baptismDate: formData.get('baptismDate') || null,
      role: formData.get('role'),
      cellGroupId: formData.get('cellGroup') || null,
      phone: formData.get('phone') || null
    };

    try {
       const resp = await fetch(`${API_URL}/members/${memberToEdit.id}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      
      {/* Header */}
      <div className="card-header-row" style={{ paddingBottom: 20, borderBottom: '1px solid var(--panel-border)', margin: 0 }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.4rem' }}>Gestão de Membros & Liderança</h1>
          <p className="card-subtitle">Gerencie os acessos ao aplicativo móvel, batismos, cargos ministeriais e células.</p>
        </div>
        <button className="btn-primary" onClick={() => setInviteModalOpen(true)}>
          <UserPlusIcon /> Convidar Membro
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="portal-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
          
          <div className="search-pill" style={{ maxWidth: '380px' }}>
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
                <th>Vínculo de Célula</th>
                <th>Status de Acesso</th>
                <th>Cadastro</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Carregando membros cadastrados...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Nenhum membro encontrado.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
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
                            <EditIcon /> Editar Cadastro
                          </button>
                          
                          {(member.status === 'Ativo' || member.status === 'ACTIVE') ? (
                            <button 
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--danger)', textAlign: 'left', fontWeight: 600 }}
                              onClick={() => handleUpdateStatus(member, 'INACTIVE')}
                            >
                              <BanIcon /> Desativar Acesso
                            </button>
                          ) : (
                            <button 
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--success)', textAlign: 'left', fontWeight: 600 }}
                              onClick={() => handleUpdateStatus(member, 'ACTIVE')}
                            >
                              <CheckCircleIcon /> Reativar Acesso
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          INVITE MODAL STUDIO (Horizontal 2-Column Format)
          ======================================================== */}
      {isInviteModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setInviteModalOpen(false)}>
          <div className="modal-studio-container" style={{ maxWidth: 840 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-blue-bg)', color: 'var(--pastel-blue-text)' }}>
                  <UserPlusIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">Convidar Novo Membro</h2>
                  <p className="modal-studio-subtitle">
                    A AWS enviará um e-mail com a senha temporária e acesso ao aplicativo mobile.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setInviteModalOpen(false)}>✕</button>
            </div>

            <div className="modal-studio-body">
              <div className="modal-studio-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                <div className="modal-studio-column">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Nome Completo *</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      placeholder="Ex: Maria dos Santos" 
                      value={inviteForm.name} 
                      onChange={e => setInviteForm({...inviteForm, name: e.target.value})} 
                      required
                    />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">E-mail Institucional / Pessoal *</label>
                    <input 
                      type="email" 
                      className="input-modern"
                      placeholder="maria@exemplo.com" 
                      value={inviteForm.email} 
                      onChange={e => setInviteForm({...inviteForm, email: e.target.value})} 
                      required
                    />
                  </div>
                </div>

                <div className="modal-studio-column">
                  <div className="form-group-modern">
                    <label className="form-label-modern">Cargo / Função Ministerial</label>
                    <select 
                      className="select-modern"
                      value={inviteForm.role} 
                      onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                    >
                      <option value="Membro">Membro comum</option>
                      <option value="Líder de Célula">Líder de Célula</option>
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

                  {campusesList.length > 0 && (
                    <div className="form-group-modern">
                      <label className="form-label-modern">Unidade / Campus</label>
                      <select 
                        className="select-modern"
                        value={inviteForm.campusId || (selectedCampusId !== 'all' ? selectedCampusId : '')} 
                        onChange={e => setInviteForm({...inviteForm, campusId: e.target.value})}
                      >
                        <option value="">Campus Padrão / Sede</option>
                        {campusesList.map(camp => (
                          <option key={camp.id} value={camp.id}>{camp.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
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
        </div>
      )}

      {/* ========================================================
          EDIT MODAL STUDIO (Horizontal 2-Column Format)
          ======================================================== */}
      {isEditModalOpen && memberToEdit && (
        <div className="modal-overlay animate-fade-in" onClick={() => setEditModalOpen(false)}>
          <form className="modal-studio-container" style={{ maxWidth: 920 }} onClick={(e) => e.stopPropagation()} onSubmit={submitEditProfile}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-green-bg)', color: 'var(--pastel-green-text)' }}>
                  <EditIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">Editar Perfil do Membro</h2>
                  <p className="modal-studio-subtitle">
                    Atualize os dados ministeriais, telefone e vínculo de célula deste membro.
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
                    <label className="form-label-modern">E-mail de Acesso (Cognito)</label>
                    <input type="email" className="input-modern" defaultValue={memberToEdit.email} disabled style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
                  </div>
                </div>

                {/* Right Column: Cargo & Vínculos */}
                <div className="modal-studio-column">
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
                    <select name="role" className="select-modern" defaultValue={memberToEdit.role}>
                      <option value="Membro">Membro comum</option>
                      <option value="Líder de Célula">Líder de Célula</option>
                      <option value="Tesouraria">Tesouraria/Finanças</option>
                      <option value="ADMIN">Administrador Geral</option>
                    </select>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Data de Batismo</label>
                    <input name="baptismDate" type="date" className="input-modern" defaultValue={memberToEdit.baptismDate ? memberToEdit.baptismDate.split('T')[0] : ''} />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Célula / Base Ministerial</label>
                    <select name="cellGroup" className="select-modern" defaultValue={memberToEdit.cellGroup || ''}>
                      <option value="">Nenhum Vínculo Local</option>
                      {cellGroups.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
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
          </form>
        </div>
      )}
    </div>
  );
}
