import { useState, useEffect } from 'react';
import './Members.css';

// Icons used in Members module
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const MoreVerticalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
);
const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
);
const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
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

// Removed Mock Array and AutocompleteCell to use dynamic db fetching

export default function Members() {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [filterRole, setFilterRole] = useState('Todos');
  const [isLoading, setIsLoading] = useState(false);

  // Multi-state configuration
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  
  // Invite State
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'Membro', cellGroupId: '' });
  const [isInviting, setIsInviting] = useState(false);
  const [cellGroups, setCellGroups] = useState<{id: string, name: string}[]>([]);
  
  // Edit State
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  useEffect(() => {
    fetchMembers();
    fetchCellGroups();
  }, []);

  const fetchCellGroups = async () => {
    try {
      const response = await fetch('http://localhost:3000/cell-groups');
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
      const response = await fetch('http://localhost:3000/members');
      if (response.ok) {
        const json = await response.json();
        setMembers(json.data.map((m: any) => ({
          ...m,
          joinedAt: m.created_at,
          baptismDate: m.baptism_date,
          cellGroup: m.cell_group_id
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
      case 'ACTIVE': return <span className="badge badge-success">Ativo</span>;
      case 'Inativo': 
      case 'INACTIVE': return <span className="badge badge-danger">Inativo</span>;
      case 'Pendente': return <span className="badge badge-warning">Pendente</span>;
      default: return <span className="badge">{status}</span>;
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
      const response = await fetch('http://localhost:3000/members/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: member.email, action })
      });
      if (response.ok) {
        fetchMembers(); // recarrega do DB
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
      const resp = await fetch('http://localhost:3000/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      });
      if (resp.ok) {
        setInviteModalOpen(false);
        setInviteForm({ name: '', email: '', role: 'Membro', cellGroupId: '' });
        fetchMembers(); // Atualiza a tabela
      } else {
        const err = await resp.json();
        alert("Erro ao convidar: " + err.error);
      }
    } catch(e) {
      console.error(e);
      alert("Erro ao disparar api.");
    }
    setIsInviting(false);
  };

  const handleSendResetPassword = async (email: string) => {
     try {
       await fetch('http://localhost:3000/members/reset-password', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email })
       });
       alert(`E-Mail de redefinição forçado no Cognito para ${email}`);
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
       const resp = await fetch(`http://localhost:3000/members/${memberToEdit.id}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
       });
       if(resp.ok) {
          setEditModalOpen(false);
          fetchMembers();
       } else {
          alert('Error no update');
       }
    } catch(e) { console.error(e) }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      
      {/* Action Bar */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }}><SearchIcon /></div>
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="table-search-input"
            />
          </div>

          <div className="select-wrapper">
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="table-filter-select"
            >
              <option value="Todos">Todos os Cargos</option>
              <option value="ADMIN">Administrador</option>
              <option value="Líder de Célula">Líder de Célula</option>
              <option value="Membro">Membro comum</option>
            </select>
          </div>
        </div>
        
        <button className="btn-primary" style={{ boxShadow: 'var(--shadow-glow)' }} onClick={() => setInviteModalOpen(true)}>
          <UserPlusIcon />
          Convidar Membro
        </button>
      </div>

      {/* Data Table */}
      <div className="card" style={{ padding: '0', overflowX: 'auto', minHeight: '400px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Cargo</th>
              <th>Célula</th>
              <th>Tempo de Casa</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Carregando dados da AWS...</td></tr>
            ) : filteredMembers.map((member) => {
              // Calculate days since baptism or memberSince. Fallback to joinedAt.
              const referenceDate = member.memberSince || member.baptismDate || member.joinedAt;
              const daysDiff = referenceDate ? Math.floor((new Date().getTime() - new Date(referenceDate).getTime()) / (1000 * 3600 * 24)) : 0;
              const daysText = daysDiff > 0 ? `${daysDiff} dias` : 'Recente';

              return (
              <tr key={member.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="member-avatar">
                      {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{member.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{member.role}</span>
                  {(member.role === 'ADMIN' || member.role === 'Administrador') && <span style={{ color: 'var(--accent-primary)', marginLeft: '6px' }}>★</span>}
                </td>
                <td style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  {cellGroups.find(c => c.id === member.cellGroup)?.name || <span style={{ color: 'var(--text-muted)' }}>Membro Global</span>}
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{daysText}</span>
                </td>
                <td>
                  {getStatusBadge(member.status)}
                </td>
                <td style={{ textAlign: 'right', position: 'relative' }}>
                  <button 
                    className="icon-btn-small" 
                    title="Opções" 
                    onClick={(e) => toggleDropdown(e, member.id)}
                  >
                    <MoreVerticalIcon />
                  </button>
                  
                  {activeDropdownId === member.id && (
                    <div className="dropdown-menu animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <button className="dropdown-item" onClick={() => handleEditClick(member)}>
                          <EditIcon /> Editar Informações
                        </button>
                        {member.status === 'Ativo' || member.status === 'ACTIVE' ? (
                          <button className="dropdown-item danger" onClick={() => handleUpdateStatus(member, 'Inativo')}>
                            <BanIcon /> Inativar Acesso
                          </button>
                        ) : (
                          <button className="dropdown-item" style={{ color: 'var(--success)' }} onClick={() => handleUpdateStatus(member, 'Ativo')}>
                            <CheckCircleIcon /> Reativar Acesso
                          </button>
                        )}
                    </div>
                  )}
                </td>
              </tr>
              );
            })}
            {!isLoading && filteredMembers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Nenhum membro encontrado no banco de dados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (Mock) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <span>Mostrando {filteredMembers.length > 0 ? 1 : 0} a {filteredMembers.length} de {members.length} membros</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} disabled>Anterior</button>
          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} disabled>Próxima</button>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="modal-overlay" onClick={() => setInviteModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Convidar Novo Membro</h2>
              <button className="icon-btn-small" onClick={() => setInviteModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                A AWS enviará um e-mail com senha temporária e acesso ao aplicativo.
              </p>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" className="form-input" placeholder="Ex: Maria" value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input type="email" className="form-input" placeholder="maria@servidor.com" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Atribuir Cargo/Função</label>
                  <select className="form-select" value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})}>
                    <option value="Membro">Membro comum</option>
                    <option value="Líder de Célula">Líder de Célula</option>
                    <option value="Tesouraria">Tesouraria/Finanças</option>
                    <option value="ADMIN">Administrador Geral</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Alocar já em uma Célula</label>
                  <select className="form-select" value={inviteForm.cellGroupId} onChange={e => setInviteForm({...inviteForm, cellGroupId: e.target.value})}>
                    <option value="">Não Alocar</option>
                    {cellGroups.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setInviteModalOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={submitInvite} disabled={isInviting}>
                <SendIcon /> {isInviting ? "Enviando..." : "Enviar Convite AWS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && memberToEdit && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <form className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()} onSubmit={submitEditProfile}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Perfil do Membro</h2>
              <button type="button" className="icon-btn-small" onClick={() => setEditModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              
              <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Dados de Acesso</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Nome Completo</label>
                    <input type="text" name="name" className="form-input" defaultValue={memberToEdit.name} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone (Opcional)</label>
                    <input type="text" name="phone" className="form-input" defaultValue={memberToEdit.phone || ''} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail de Acesso</label>
                    <input type="email" className="form-input" defaultValue={memberToEdit.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CPF (Opcional)</label>
                    <input type="text" name="cpf" className="form-input" defaultValue={memberToEdit.cpf || ''} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label">Alterar Função na Plataforma</label>
                      <button 
                        type="button"
                        className="btn-secondary" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--border-color)', color: 'var(--text-main)', background: 'transparent' }}
                        onClick={() => handleSendResetPassword(memberToEdit.email)}
                      >
                        Enviar Redefinição de Senha
                      </button>
                    </div>
                    <select name="role" className="form-select" defaultValue={memberToEdit.role}>
                      <option value="Membro">Membro comum</option>
                      <option value="Líder de Célula">Líder de Célula</option>
                      <option value="Tesouraria">Tesouraria/Finanças</option>
                      <option value="ADMIN">Administrador Geral</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Histórico e Vínculos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Data de Batismo</label>
                    <input name="baptismDate" type="date" className="form-input" defaultValue={memberToEdit.baptismDate ? memberToEdit.baptismDate.split('T')[0] : ''} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Célula / Base / Departamento</label>
                    <select name="cellGroup" className="form-select" defaultValue={memberToEdit.cellGroup || ''}>
                      <option value="">Nenhum Vínculo Local</option>
                      {cellGroups.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </div>
            <div className="modal-footer">
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
