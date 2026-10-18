import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

interface Ministry {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  leader_id?: string;
  leader_name?: string;
  status: 'ACTIVE' | 'INACTIVE';
  roles_count?: number;
  volunteers_count?: number;
  upcoming_schedules_count?: number;
}

interface MinistryRole {
  id: string;
  ministry_id: string;
  name: string;
  description?: string;
  min_volunteers: number;
}

interface Volunteer {
  id: string;
  ministry_id: string;
  member_id: string;
  member_name: string;
  member_phone?: string;
  member_email?: string;
  status: 'CANDIDATE' | 'TRAINING' | 'ACTIVE' | 'PAUSED';
  preferred_service_time?: string;
  roles_csv?: string;
  notes?: string;
  joined_at: string;
  total_served_count?: number;
  last_served_date?: string;
}

interface RosterItem {
  id: string;
  schedule_id: string;
  role_id: string;
  role_name: string;
  member_id: string;
  member_name: string;
  member_phone?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'SWAP_REQUESTED';
  decline_reason?: string;
}

interface ServiceSchedule {
  id: string;
  ministry_id: string;
  title: string;
  service_date: string;
  service_time: string;
  notes?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
  total_slots?: number;
  accepted_count?: number;
  declined_count?: number;
  pending_count?: number;
  roster_items?: RosterItem[];
}

interface MinistriesManagementProps {
  selectedCampusId?: string;
  selectedOrganization?: any;
}

export const MinistriesManagement: React.FC<MinistriesManagementProps> = ({
  selectedCampusId = 'all',
  selectedOrganization
}) => {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'schedules' | 'volunteers' | 'roles'>('schedules');
  const [loading, setLoading] = useState(true);

  // Dados do Ministério Selecionado
  const [roles, setRoles] = useState<MinistryRole[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [churchMembers, setChurchMembers] = useState<any[]>([]);

  // Modais
  const [showMinistryModal, setShowMinistryModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form Ministério
  const [minName, setMinName] = useState('');
  const [minDescription, setMinDescription] = useState('');
  const [minColor, setMinColor] = useState('#8b5cf6');
  const [minLeaderName, setMinLeaderName] = useState('');

  // Form Função
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');

  // Form Voluntário
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [volStatus, setVolStatus] = useState<'ACTIVE' | 'TRAINING' | 'CANDIDATE'>('ACTIVE');
  const [volRolesCsv, setVolRolesCsv] = useState('');

  // Form Escala
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState('18:00');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [rosterDraft, setRosterDraft] = useState<Array<{ role_id: string; member_id: string }>>([]);

  // Detecção Inteligente de Conflitos (Fase 3)
  const [conflicts, setConflicts] = useState<{ blockouts: any[]; doubleBookings: any[] }>({ blockouts: [], doubleBookings: [] });
  const [loadingConflicts, setLoadingConflicts] = useState(false);

  const getAuthHeaders = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
    } catch {
      return { 'Content-Type': 'application/json' };
    }
  };

  const fetchMinistries = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const res = await fetch(`${API_URL}/ministries?organization_id=${orgId}&campus_id=${selectedCampusId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setMinistries(data);
        if (data.length > 0 && !selectedMinistry) {
          setSelectedMinistry(data[0]);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar ministérios:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMinistryDetails = async (minId: string) => {
    try {
      const headers = await getAuthHeaders();
      const [rolesRes, volsRes, schRes] = await Promise.all([
        fetch(`${API_URL}/ministries/${minId}/roles`, { headers }),
        fetch(`${API_URL}/ministries/${minId}/volunteers`, { headers }),
        fetch(`${API_URL}/ministries/${minId}/schedules`, { headers })
      ]);

      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (volsRes.ok) setVolunteers(await volsRes.json());
      if (schRes.ok) setSchedules(await schRes.json());
    } catch (e) {
      console.error('Erro ao buscar dados do ministério:', e);
    }
  };

  const fetchChurchMembers = async () => {
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const res = await fetch(`${API_URL}/members?organization_id=${orgId}&status=ACTIVE`, { headers });
      if (res.ok) {
        const data = await res.json();
        setChurchMembers(Array.isArray(data) ? data : (data.members || []));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchMinistries();
    fetchChurchMembers();
  }, [selectedCampusId, selectedOrganization]);

  useEffect(() => {
    if (selectedMinistry) {
      fetchMinistryDetails(selectedMinistry.id);
    }
  }, [selectedMinistry]);

  // Salvar Novo Ministério
  const handleSaveMinistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minName.trim()) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/ministries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: minName,
          description: minDescription,
          color: minColor,
          leader_name: minLeaderName,
          organization_id: selectedOrganization?.id || 'org_default',
          campus_id: selectedCampusId === 'all' ? 'campus_sede' : selectedCampusId
        })
      });

      if (res.ok) {
        setShowMinistryModal(false);
        setMinName('');
        setMinDescription('');
        setMinLeaderName('');
        fetchMinistries();
      }
    } catch (e) {
      alert('Erro ao criar ministério');
    }
  };

  // Salvar Nova Função
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMinistry || !newRoleName.trim()) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/ministries/${selectedMinistry.id}/roles`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDescription
        })
      });

      if (res.ok) {
        setShowRoleModal(false);
        setNewRoleName('');
        setNewRoleDescription('');
        fetchMinistryDetails(selectedMinistry.id);
      }
    } catch (e) {
      alert('Erro ao salvar função');
    }
  };

  // Salvar Voluntário no Bolsão
  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMinistry || !selectedMemberId) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/ministries/${selectedMinistry.id}/volunteers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          member_id: selectedMemberId,
          status: volStatus,
          roles_csv: volRolesCsv
        })
      });

      if (res.ok) {
        setShowVolunteerModal(false);
        setSelectedMemberId('');
        setVolRolesCsv('');
        fetchMinistryDetails(selectedMinistry.id);
      }
    } catch (e) {
      alert('Erro ao adicionar voluntário');
    }
  };

  // Salvar Nova Escala de Culto
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMinistry || !scheduleTitle.trim()) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/ministries/${selectedMinistry.id}/schedules`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: scheduleTitle,
          service_date: scheduleDate,
          service_time: scheduleTime,
          notes: scheduleNotes,
          status: 'PUBLISHED',
          roster_items: rosterDraft.filter(r => r.role_id && r.member_id)
        })
      });

      if (res.ok) {
        setShowScheduleModal(false);
        setScheduleTitle('');
        setScheduleNotes('');
        setRosterDraft([]);
        fetchMinistryDetails(selectedMinistry.id);
      }
    } catch (e) {
      alert('Erro ao salvar escala do culto');
    }
  };

  const fetchConflicts = async (dateStr: string) => {
    if (!dateStr) return;
    setLoadingConflicts(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/ministries/conflicts?date=${dateStr}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setConflicts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConflicts(false);
    }
  };

  useEffect(() => {
    if (showScheduleModal && scheduleDate) {
      fetchConflicts(scheduleDate);
    }
  }, [showScheduleModal, scheduleDate]);

  const handleOpenNewSchedule = () => {
    // Inicializa o rascunho com 1 slot para cada função do ministério
    const initialDraft = roles.map(r => ({ role_id: r.id, member_id: '' }));
    setRosterDraft(initialDraft);
    setScheduleTitle('Culto de Celebração');
    setShowScheduleModal(true);
    if (scheduleDate) {
      fetchConflicts(scheduleDate);
    }
  };

  const generateWhatsAppEscala = (item: RosterItem, sch: ServiceSchedule) => {
    const cleanPhone = (item.member_phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá ${item.member_name}! A paz do Senhor.\n\nVocê foi escalado(a) no *${selectedMinistry?.name}* para a função de *${item.role_name}* no *${sch.title}* no dia *${new Date(sch.service_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}* às *${sch.service_time}*.\n\nPor favor, confirme sua presença acessando o aplicativo Faith Hub!`
    );
    return `https://wa.me/55${cleanPhone}?text=${text}`;
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.8rem' }}>🎼</span>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
              Ministérios & Escalas de Voluntários
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted, #64748b)', fontSize: '0.92rem' }}>
            Gerencie equipes, bolsão de voluntários e organize as escalas dos cultos com confirmação em tempo real.
          </p>
        </div>

        <button
          onClick={() => setShowMinistryModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(15, 118, 110, 0.25)'
          }}
        >
          <span>+</span>
          <span>Novo Ministério</span>
        </button>
      </div>

      {/* CARDS SELETORES DE MINISTÉRIO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
        {ministries.map(min => {
          const isSelected = selectedMinistry?.id === min.id;
          return (
            <div
              key={min.id}
              onClick={() => setSelectedMinistry(min)}
              style={{
                background: isSelected ? '#ffffff' : '#ffffff',
                borderRadius: '16px',
                padding: '16px',
                cursor: 'pointer',
                border: isSelected ? `2px solid ${min.color || '#0f766e'}` : '1px solid #e2e8f0',
                boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: `${min.color || '#0f766e'}15`,
                  color: min.color || '#0f766e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 800
                }}>
                  {min.name.charAt(0)}
                </div>
                {isSelected && (
                  <span style={{ fontSize: '0.70rem', background: min.color || '#0f766e', color: '#ffffff', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                    Ativo
                  </span>
                )}
              </div>

              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', marginTop: '12px' }}>
                {min.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                Líder: {min.leader_name || 'A definir'}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '0.74rem', color: '#64748b' }}>
                <span>👥 {min.volunteers_count || 0} Voluntários</span>
                <span>•</span>
                <span>📅 {min.upcoming_schedules_count || 0} Escalas</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ÁREA DE DETALHES DO MINISTÉRIO SELECIONADO */}
      {selectedMinistry && (
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          
          {/* Header do Ministério Selecionado com Abas */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: '#f8fafc' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: selectedMinistry.color || '#0f766e' }}></span>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedMinistry.name}
                </h2>
              </div>
              <p style={{ margin: '4px 0 0 22px', fontSize: '0.82rem', color: '#64748b' }}>
                {selectedMinistry.description || 'Equipe ministerial'}
              </p>
            </div>

            {/* Sub-Navegação */}
            <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '12px' }}>
              {[
                { id: 'schedules', label: `📅 Escalas (${schedules.length})` },
                { id: 'volunteers', label: `👥 Voluntários (${volunteers.length})` },
                { id: 'roles', label: `🏷️ Funções (${roles.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9px',
                    border: 'none',
                    background: activeSubTab === tab.id ? '#ffffff' : 'transparent',
                    color: activeSubTab === tab.id ? '#0f172a' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: activeSubTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            
            {/* SUB-ABA 1: ESCALAS DOS CULTOS */}
            {activeSubTab === 'schedules' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.90rem', color: '#64748b', fontWeight: 600 }}>
                    Próximos cultos e confirmações da equipe:
                  </div>
                  <button
                    onClick={handleOpenNewSchedule}
                    style={{
                      background: '#0f766e',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Montar Nova Escala
                  </button>
                </div>

                {schedules.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
                    <div style={{ fontWeight: 700, color: '#334155' }}>Nenhuma escala montada para este ministério.</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Clique em "Montar Nova Escala" para organizar a equipe do próximo culto.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {schedules.map(sch => (
                      <div key={sch.id} style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                                {sch.title}
                              </span>
                              <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>
                                {sch.status}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                              📅 {new Date(sch.service_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às {sch.service_time}
                              {sch.notes && <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>• "{sch.notes}"</span>}
                            </div>
                          </div>

                          {/* Termômetro de Confirmações */}
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.76rem', fontWeight: 800 }}>
                            <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '10px' }}>
                              ✓ {sch.accepted_count || 0} Confirmados
                            </span>
                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '10px' }}>
                              ⏳ {sch.pending_count || 0} Aguardando
                            </span>
                            {sch.declined_count ? (
                              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '10px' }}>
                                ✗ {sch.declined_count} Recusado(s)
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Posições escaladas */}
                        <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                          {(sch.roster_items || []).map(item => {
                            const isAccepted = item.status === 'ACCEPTED';
                            const isDeclined = item.status === 'DECLINED';

                            return (
                              <div
                                key={item.id}
                                style={{
                                  background: '#ffffff',
                                  padding: '10px 12px',
                                  borderRadius: '12px',
                                  border: isAccepted ? '1.5px solid #10b981' : (isDeclined ? '1.5px solid #ef4444' : '1px solid #cbd5e1'),
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <div>
                                  <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                                    {item.role_name}
                                  </div>
                                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginTop: '2px' }}>
                                    {item.member_name}
                                  </div>
                                  {isDeclined && item.decline_reason && (
                                    <div style={{ fontSize: '0.70rem', color: '#dc2626', marginTop: '2px' }}>
                                      Motivo: "{item.decline_reason}"
                                    </div>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {item.member_phone && (
                                    <a
                                      href={generateWhatsAppEscala(item, sch)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Enviar detalhes no WhatsApp"
                                      style={{
                                        background: '#22c55e',
                                        color: '#ffffff',
                                        borderRadius: '8px',
                                        padding: '4px 8px',
                                        fontSize: '0.74rem',
                                        textDecoration: 'none',
                                        fontWeight: 800
                                      }}
                                    >
                                      💬
                                    </a>
                                  )}
                                  <span style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '3px 8px',
                                    borderRadius: '8px',
                                    background: isAccepted ? '#ecfdf5' : (isDeclined ? '#fee2e2' : '#fef3c7'),
                                    color: isAccepted ? '#059669' : (isDeclined ? '#dc2626' : '#d97706')
                                  }}>
                                    {isAccepted ? 'Confirmado' : (isDeclined ? 'Recusou' : 'Pendente')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-ABA 2: BOLSÃO DE VOLUNTÁRIOS */}
            {activeSubTab === 'volunteers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.90rem', color: '#64748b', fontWeight: 600 }}>
                    Membros capacitados e ativos neste ministério:
                  </div>
                  <button
                    onClick={() => setShowVolunteerModal(true)}
                    style={{
                      background: '#0f766e',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Vincular Voluntário
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: '0.76rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 16px' }}>Voluntário</th>
                        <th style={{ padding: '12px 16px' }}>Funções Aptas</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px' }}>Vezes Escalado</th>
                        <th style={{ padding: '12px 16px' }}>Última Atuação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volunteers.map(vol => (
                        <tr key={vol.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{vol.member_name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📱 {vol.member_phone || 'Sem celular'}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '0.78rem', background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '8px', fontWeight: 600 }}>
                              {vol.roles_csv || 'Geral'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '8px',
                              background: vol.status === 'ACTIVE' ? '#d1fae5' : '#fef3c7',
                              color: vol.status === 'ACTIVE' ? '#065f46' : '#92400e'
                            }}>
                              {vol.status === 'ACTIVE' ? 'Ativo' : (vol.status === 'TRAINING' ? 'Treinamento' : 'Pausa')}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#334155' }}>
                            {vol.total_served_count || 0} cultos
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.80rem' }}>
                            {vol.last_served_date ? new Date(vol.last_served_date).toLocaleDateString('pt-BR') : 'Nunca serviu'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-ABA 3: FUNÇÕES & POSIÇÕES */}
            {activeSubTab === 'roles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.90rem', color: '#64748b', fontWeight: 600 }}>
                    Posições que compõem este ministério (usadas para montar a escala):
                  </div>
                  <button
                    onClick={() => setShowRoleModal(true)}
                    style={{
                      background: '#0f766e',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Nova Função
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {roles.map(r => (
                    <div key={r.id} style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                        🏷️ {r.name}
                      </div>
                      {r.description && (
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>
                          {r.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: NOVO MINISTÉRIO
          ========================================================= */}
      {showMinistryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Novo Ministério</h3>
              <button onClick={() => setShowMinistryModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveMinistry} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Nome do Ministério *</label>
                <input required type="text" placeholder="Ex: Ministério de Teatro & Dança" value={minName} onChange={e => setMinName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Líder Responsável (Nome)</label>
                <input type="text" placeholder="Ex: Pr. Carlos Eduardo" value={minLeaderName} onChange={e => setMinLeaderName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Descrição Curta</label>
                <textarea rows={2} placeholder="Propósito e atuação deste ministério..." value={minDescription} onChange={e => setMinDescription(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowMinistryModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Criar Ministério</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: NOVA FUNÇÃO
          ========================================================= */}
      {showRoleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Nova Função: {selectedMinistry?.name}</h3>
              <button onClick={() => setShowRoleModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Nome da Função / Posição *</label>
                <input required type="text" placeholder="Ex: Baixista, Switcher, Monitor Berçário" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowRoleModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Adicionar Função</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: ADICIONAR VOLUNTÁRIO
          ========================================================= */}
      {showVolunteerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>Vincular Voluntário ao Bolsão</h3>
              <button onClick={() => setShowVolunteerModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleAddVolunteer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Selecione o Membro da Igreja *</label>
                <select required value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none' }}>
                  <option value="">Escolha um membro...</option>
                  {churchMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.phone || m.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Funções que está apto(a) a exercer</label>
                <input type="text" placeholder="Ex: Bateria, Percussão" value={volRolesCsv} onChange={e => setVolRolesCsv(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowVolunteerModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Salvar Voluntário</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: MONTAR ESCALA DE CULTO
          ========================================================= */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Nova Escala de Culto</h3>
                <div style={{ fontSize: '0.80rem', color: '#64748b' }}>{selectedMinistry?.name}</div>
              </div>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Título do Culto *</label>
                  <input required type="text" placeholder="Ex: Culto de Celebração" value={scheduleTitle} onChange={e => setScheduleTitle(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Data *</label>
                  <input required type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Horário *</label>
                  <input required type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* Banner de Prevenção Inteligente de Conflitos */}
              {(conflicts.blockouts.length > 0 || conflicts.doubleBookings.length > 0) && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '0.80rem',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                  <div>
                    <strong>Prevenção de Conflitos:</strong> Detectamos{' '}
                    {conflicts.blockouts.length > 0 && `${conflicts.blockouts.length} voluntário(s) com bloqueio de agenda`}
                    {conflicts.blockouts.length > 0 && conflicts.doubleBookings.length > 0 && ' e '}
                    {conflicts.doubleBookings.length > 0 && `${conflicts.doubleBookings.length} já escalado(s) em outros ministérios nesta data`}.
                  </div>
                </div>
              )}

              {/* Alocação Visual de Voluntários por Função */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                  Alocação da Equipe por Função:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rosterDraft.map((slot, idx) => {
                    const role = roles.find(r => r.id === slot.role_id);
                    const slotBlockout = conflicts.blockouts.find(b => b.member_id === slot.member_id);
                    const slotDoubleBooking = conflicts.doubleBookings.find(d => d.member_id === slot.member_id);

                    return (
                      <div key={idx} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: '#f8fafc',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: slotBlockout ? '1.5px solid #fca5a5' : (slotDoubleBooking ? '1.5px solid #fcd34d' : '1px solid #e2e8f0')
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', alignItems: 'center' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#334155' }}>
                            🏷️ {role?.name || 'Função'}
                          </div>
                          <select
                            value={slot.member_id}
                            onChange={e => {
                              const newDraft = [...rosterDraft];
                              newDraft[idx].member_id = e.target.value;
                              setRosterDraft(newDraft);
                            }}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.82rem',
                              outline: 'none',
                              background: '#fff'
                            }}
                          >
                            <option value="">Selecione o voluntário...</option>
                            {volunteers.map(v => {
                              const isBlocked = conflicts.blockouts.some(b => b.member_id === v.member_id);
                              const isBooked = conflicts.doubleBookings.some(d => d.member_id === v.member_id);

                              return (
                                <option key={v.member_id} value={v.member_id}>
                                  {v.member_name} {isBlocked ? '⛔ [INDISPONÍVEL]' : (isBooked ? '⚠️ [JÁ ESCALADO]' : '')}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Alerta contextual se voluntário selecionado tiver conflito */}
                        {slotBlockout && (
                          <div style={{ fontSize: '0.74rem', color: '#b91c1c', fontWeight: 700, paddingLeft: '4px' }}>
                            ⛔ Voluntário marcou bloqueio de data: "{slotBlockout.reason || 'Compromisso pessoal'}"
                          </div>
                        )}
                        {slotDoubleBooking && (
                          <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700, paddingLeft: '4px' }}>
                            ⚠️ Voluntário já escalado no ministério "{slotDoubleBooking.ministry_name}" ({slotDoubleBooking.role_name} às {slotDoubleBooking.service_time})
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Notas / Orientações (Repertório, vestimenta, etc.)</label>
                <textarea rows={2} placeholder="Ex: Ensaio geral às 16:30. Tom das músicas em G..." value={scheduleNotes} onChange={e => setScheduleNotes(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', color: '#fff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,118,110,0.3)' }}>Publicar Escala & Notificar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
