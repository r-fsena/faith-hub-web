import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

interface Ministry {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
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
  currentUserProfile?: any;
  currentUserRole?: string;
  isSuperAdmin?: boolean;
}

export const MinistriesManagement: React.FC<MinistriesManagementProps> = ({
  selectedCampusId = 'all',
  selectedOrganization,
  currentUserProfile,
  currentUserRole,
  isSuperAdmin = false
}) => {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'schedules' | 'volunteers' | 'roles'>('schedules');
  const [loading, setLoading] = useState(true);

  // Filtros de Ministérios
  const [ministryStatusFilter, setMinistryStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [ministrySearch, setMinistrySearch] = useState('');

  // Filtros de Escalas
  const [schedulesTimeframe, setSchedulesTimeframe] = useState<'UPCOMING' | 'HISTORY' | 'ALL'>('UPCOMING');
  const [schedulesStatusFilter, setSchedulesStatusFilter] = useState<string>('ALL');

  // Dados do Ministério Selecionado
  const [roles, setRoles] = useState<MinistryRole[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [churchMembers, setChurchMembers] = useState<any[]>([]);

  // Modais
  const [showMinistryModal, setShowMinistryModal] = useState(false);
  const [isEditingMinistry, setIsEditingMinistry] = useState(false);
  const [editingMinistryId, setEditingMinistryId] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form Ministério
  const [minName, setMinName] = useState('');
  const [minDescription, setMinDescription] = useState('');
  const [minImageUrl, setMinImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [minColor, setMinColor] = useState('#0f766e');
  const [minLeaderId, setMinLeaderId] = useState('');
  const [minLeaderName, setMinLeaderName] = useState('');
  const [minStatus, setMinStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

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
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [rosterDraft, setRosterDraft] = useState<Array<{ id?: string; role_id: string; member_id: string; status?: string }>>([]);

  // Detecção Inteligente de Conflitos (Fase 3)
  const [conflicts, setConflicts] = useState<{ blockouts: any[]; doubleBookings: any[] }>({ blockouts: [], doubleBookings: [] });
  const [loadingConflicts, setLoadingConflicts] = useState(false);

  // Gerador Inteligente da Escala do Mês (Modalidade 2)
  const [showMonthGeneratorModal, setShowMonthGeneratorModal] = useState(false);
  const [genMonth, setGenMonth] = useState<number>(() => {
    const next = new Date().getMonth() + 2;
    return next > 12 ? 1 : next;
  });
  const [genYear, setGenYear] = useState<number>(() => {
    const d = new Date();
    return d.getMonth() === 11 ? d.getFullYear() + 1 : d.getFullYear();
  });
  const [genWeekdays, setGenWeekdays] = useState<number[]>([0]); // 0 = Domingo
  const [genServiceTime, setGenServiceTime] = useState<string>('18:00');
  const [genScheduleTitle, setGenScheduleTitle] = useState<string>('Culto de Celebração');
  const [genRoleQuantities, setGenRoleQuantities] = useState<Record<string, number>>({});
  const [genStep, setGenStep] = useState<'CONFIG' | 'PREVIEW'>('CONFIG');
  const [loadingMonthGen, setLoadingMonthGen] = useState(false);
  const [savingMonthBatch, setSavingMonthBatch] = useState(false);
  const [genSchedules, setGenSchedules] = useState<Array<{
    date: string;
    formattedDate: string;
    title: string;
    time: string;
    items: Array<{
      id: string;
      role_id: string;
      role_name: string;
      member_id: string;
      member_name: string;
    }>;
  }>>([]);
  const [genInsights, setGenInsights] = useState<{
    totalServices: number;
    totalSlots: number;
    filledSlots: number;
    blockoutsRespected: number;
    doubleBookingsPrevented: number;
    volunteersUsedCount: number;
  }>({
    totalServices: 0,
    totalSlots: 0,
    filledSlots: 0,
    blockoutsRespected: 0,
    doubleBookingsPrevented: 0,
    volunteersUsedCount: 0
  });

  // Lembretes Pré-Culto (WhatsApp 24h)
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [remindersData, setRemindersData] = useState<{ scheduleTitle: string; reminders: any[] } | null>(null);
  const [loadingReminders, setLoadingReminders] = useState(false);

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
      const res = await fetch(`${API_URL}/members?organization_id=${orgId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || data.members || []);
        setChurchMembers(list);
      }
    } catch (e) {
      console.error('Erro ao buscar membros da igreja:', e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploadingImage(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/upload-url?contentType=${encodeURIComponent(file.type)}&prefix=ministries`, { headers });
      const { uploadUrl, url } = await res.json();

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      setMinImageUrl(url);
    } catch (err) {
      console.error("Erro no upload da imagem:", err);
      alert("Erro ao realizar upload da imagem do ministério.");
    } finally {
      setUploadingImage(false);
    }
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

  // Permissões RBAC
  const normalizedRole = (currentUserRole || currentUserProfile?.role || '').toUpperCase();
  const isGlobalAdmin = isSuperAdmin || ['SUPERADMIN', 'PASTOR', 'ADMIN', 'TREASURER'].includes(normalizedRole);

  const canManageMinistry = (min?: Ministry | null): boolean => {
    if (!min) return false;
    if (isGlobalAdmin) return true;
    if (normalizedRole === 'LEADER') {
      const uId = currentUserProfile?.id;
      const uEmail = (currentUserProfile?.email || '').toLowerCase();
      const uName = (currentUserProfile?.name || '').toLowerCase();

      if (uId && min.leader_id === uId) return true;
      if (uEmail && min.leader_id?.toLowerCase() === uEmail) return true;
      if (uName && min.leader_name?.toLowerCase() === uName) return true;
    }
    return false;
  };

  const isCurrentLeader = canManageMinistry(selectedMinistry);

  // Abrir Modal de Criação de Ministério
  const handleOpenCreateMinistry = () => {
    setIsEditingMinistry(false);
    setEditingMinistryId(null);
    setMinName('');
    setMinDescription('');
    setMinImageUrl('');
    setMinLeaderId('');
    setMinLeaderName('');
    setMinColor('#0f766e');
    setMinStatus('ACTIVE');
    setShowMinistryModal(true);
  };

  // Abrir Modal de Edição de Ministério
  const handleOpenEditMinistry = (min: Ministry) => {
    setIsEditingMinistry(true);
    setEditingMinistryId(min.id);
    setMinName(min.name);
    setMinDescription(min.description || '');
    setMinImageUrl(min.image_url || '');
    setMinLeaderId(min.leader_id || '');
    setMinLeaderName(min.leader_name || '');
    setMinColor(min.color || '#0f766e');
    setMinStatus(min.status || 'ACTIVE');
    setShowMinistryModal(true);
  };

  // Ativar / Desativar Ministério com 1 clique
  const handleToggleMinistryStatus = async (min: Ministry) => {
    const nextStatus = min.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = nextStatus === 'ACTIVE' ? 'reativar' : 'desativar';
    if (!window.confirm(`Deseja realmente ${actionLabel} o ministério "${min.name}"?`)) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/ministries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: min.id,
          name: min.name,
          description: min.description,
          image_url: min.image_url,
          color: min.color,
          leader_id: min.leader_id,
          leader_name: min.leader_name,
          status: nextStatus,
          organization_id: selectedOrganization?.id || 'org_default',
          campus_id: selectedCampusId === 'all' ? 'campus_sede' : selectedCampusId
        })
      });

      if (res.ok) {
        fetchMinistries();
        if (selectedMinistry?.id === min.id) {
          setSelectedMinistry({ ...selectedMinistry, status: nextStatus });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || `Erro ao ${actionLabel} ministério`);
      }
    } catch (e) {
      alert(`Erro ao ${actionLabel} ministério`);
    }
  };

  // Salvar Ministério (Criação ou Edição)
  const handleSaveMinistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minName.trim()) return;

    try {
      const headers = await getAuthHeaders();
      const payload: any = {
        name: minName,
        description: minDescription,
        image_url: minImageUrl || null,
        color: minColor,
        leader_id: minLeaderId || null,
        leader_name: minLeaderName || null,
        status: minStatus,
        organization_id: selectedOrganization?.id || 'org_default',
        campus_id: selectedCampusId === 'all' ? 'campus_sede' : selectedCampusId
      };

      if (isEditingMinistry && editingMinistryId) {
        payload.id = editingMinistryId;
      }

      const res = await fetch(`${API_URL}/ministries`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowMinistryModal(false);
        fetchMinistries();
        if (selectedMinistry && isEditingMinistry && selectedMinistry.id === editingMinistryId) {
          setSelectedMinistry({
            ...selectedMinistry,
            name: minName,
            description: minDescription,
            image_url: minImageUrl,
            color: minColor,
            leader_id: minLeaderId,
            leader_name: minLeaderName,
            status: minStatus
          });
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Erro ao salvar ministério');
      }
    } catch (e) {
      alert('Erro ao salvar ministério');
    }
  };

  // Excluir Escala
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!selectedMinistry) return;
    if (!window.confirm('Deseja realmente excluir esta escala? Esta ação removerá as alocações dos voluntários.')) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/ministries/${selectedMinistry.id}/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        fetchMinistryDetails(selectedMinistry.id);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Erro ao excluir escala');
      }
    } catch (e) {
      alert('Erro ao excluir escala');
    }
  };

  // Concluir Escala
  const handleMarkScheduleCompleted = async (sch: ServiceSchedule) => {
    if (!selectedMinistry) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/ministries/${selectedMinistry.id}/schedules`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: sch.id,
          title: sch.title,
          service_date: sch.service_date,
          service_time: sch.service_time,
          notes: sch.notes,
          status: 'COMPLETED'
        })
      });

      if (res.ok) {
        fetchMinistryDetails(selectedMinistry.id);
      }
    } catch (e) {
      alert('Erro ao concluir escala');
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
      const payload: any = {
        title: scheduleTitle,
        service_date: scheduleDate,
        service_time: scheduleTime,
        notes: scheduleNotes,
        status: 'PUBLISHED',
        roster_items: rosterDraft.filter(r => r.role_id && r.member_id)
      };

      if (editingScheduleId) {
        payload.id = editingScheduleId;
      }

      const res = await fetch(`${API_URL}/ministries/${selectedMinistry.id}/schedules`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowScheduleModal(false);
        setEditingScheduleId(null);
        setScheduleTitle('');
        setScheduleNotes('');
        setRosterDraft([]);
        fetchMinistryDetails(selectedMinistry.id);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Erro ao salvar escala do culto');
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
    setEditingScheduleId(null);
    const initialDraft = roles.length > 0 
      ? roles.map(r => ({ role_id: r.id, member_id: '', status: 'PENDING' }))
      : [{ role_id: '', member_id: '', status: 'PENDING' }];
    setRosterDraft(initialDraft);
    setScheduleTitle('Culto de Celebração');
    setScheduleNotes('');
    setShowScheduleModal(true);
    if (scheduleDate) {
      fetchConflicts(scheduleDate);
    }
  };

  const handleOpenEditSchedule = (sch: ServiceSchedule) => {
    setEditingScheduleId(sch.id);
    setScheduleTitle(sch.title);
    setScheduleDate(sch.service_date ? sch.service_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setScheduleTime(sch.service_time || '18:00');
    setScheduleNotes(sch.notes || '');
    if (sch.roster_items && sch.roster_items.length > 0) {
      setRosterDraft(sch.roster_items.map(i => ({ 
        id: i.id,
        role_id: i.role_id, 
        member_id: i.member_id,
        status: i.status
      })));
    } else if (roles.length > 0) {
      setRosterDraft(roles.map(r => ({ role_id: r.id, member_id: '', status: 'PENDING' })));
    } else {
      setRosterDraft([{ role_id: '', member_id: '', status: 'PENDING' }]);
    }
    setShowScheduleModal(true);
    if (sch.service_date) {
      fetchConflicts(sch.service_date.split('T')[0]);
    }
  };

  const handleAddSlotForRole = (roleId: string) => {
    setRosterDraft(prev => [...prev, { role_id: roleId, member_id: '', status: 'PENDING' }]);
  };

  const handleRemoveSlot = (index: number) => {
    setRosterDraft(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSlotMember = (index: number, memberId: string) => {
    setRosterDraft(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], member_id: memberId };
      return copy;
    });
  };

  const handleUpdateSlotRole = (index: number, roleId: string) => {
    setRosterDraft(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], role_id: roleId };
      return copy;
    });
  };

  // =========================================================
  // INTELIGÊNCIA DE ESCALAS: MODALIDADE 1 (SUGESTÃO INDIVIDUAL)
  // =========================================================
  const handleAutoSuggestSingleSchedule = async () => {
    if (!selectedMinistry) return;
    if (!scheduleDate) {
      alert('Por favor, defina a data do culto antes de gerar a sugestão.');
      return;
    }

    let currentBlockouts = conflicts.blockouts;
    let currentDoubleBookings = conflicts.doubleBookings;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/ministries/conflicts?date=${scheduleDate}`, { headers });
      if (res.ok) {
        const data = await res.json();
        currentBlockouts = data.blockouts || [];
        currentDoubleBookings = data.doubleBookings || [];
        setConflicts(data);
      }
    } catch (e) {}

    const alreadyAllocated = new Set<string>(
      rosterDraft.map(r => r.member_id).filter(Boolean)
    );

    let filledCount = 0;
    const newDraft = rosterDraft.map(slot => {
      if (slot.member_id) return slot;

      const roleObj = roles.find(r => r.id === slot.role_id);
      const roleName = roleObj?.name || '';

      const candidates = volunteers.filter(v => {
        if (v.status && v.status !== 'ACTIVE') return false;
        if (alreadyAllocated.has(v.member_id)) return false;

        const isBlocked = currentBlockouts.some(b => b.member_id === v.member_id);
        if (isBlocked) return false;

        const isDoubleBooked = currentDoubleBookings.some(d => d.member_id === v.member_id);
        if (isDoubleBooked) return false;

        return true;
      });

      const skilled = candidates.filter(v =>
        (v.roles_csv || '').toLowerCase().includes(roleName.toLowerCase())
      );

      const pool = skilled.length > 0 ? skilled : candidates;
      pool.sort((a, b) => (a.total_served_count || 0) - (b.total_served_count || 0));

      const selected = pool[0];
      if (selected) {
        alreadyAllocated.add(selected.member_id);
        filledCount++;
        return { ...slot, member_id: selected.member_id };
      }
      return slot;
    });

    setRosterDraft(newDraft);
    if (filledCount > 0) {
      alert(`✨ Inteligência aplicada: ${filledCount} vaga(s) sugerida(s) com sucesso, respeitando bloqueios de agenda e rodízio justo!`);
    } else {
      alert('Todas as vagas já estavam preenchidas ou não foram encontrados voluntários disponíveis sem conflito nesta data.');
    }
  };

  // =========================================================
  // INTELIGÊNCIA DE ESCALAS: MODALIDADE 2 (GERADOR DO MÊS)
  // =========================================================
  const getMonthDatesForWeekdays = (year: number, month: number, targetWeekdays: number[]): string[] => {
    const dates: string[] = [];
    const d = new Date(year, month - 1, 1);
    while (d.getMonth() === month - 1) {
      if (targetWeekdays.includes(d.getDay())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  };

  const handleOpenMonthGenerator = () => {
    const initialQty: Record<string, number> = {};
    roles.forEach(r => {
      initialQty[r.id] = r.min_volunteers || 1;
    });
    setGenRoleQuantities(initialQty);
    setGenStep('CONFIG');
    setShowMonthGeneratorModal(true);
  };

  const runMonthGenerator = async () => {
    const dates = getMonthDatesForWeekdays(genYear, genMonth, genWeekdays);
    if (dates.length === 0) {
      alert('Nenhum culto encontrado para os dias da semana selecionados neste mês.');
      return;
    }

    setLoadingMonthGen(true);
    try {
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      const headers = await getAuthHeaders();
      const confRes = await fetch(`${API_URL}/ministries/conflicts?start_date=${startDate}&end_date=${endDate}`, { headers });
      const confData = confRes.ok ? await confRes.json() : { blockouts: [], doubleBookings: [] };
      const allBlockouts: any[] = confData.blockouts || [];
      const allDoubleBookings: any[] = confData.doubleBookings || [];

      const requiredRolesList: Array<{ id: string; name: string }> = [];
      roles.forEach(r => {
        const qty = genRoleQuantities[r.id] ?? 1;
        for (let i = 0; i < qty; i++) {
          requiredRolesList.push({ id: r.id, name: r.name });
        }
      });

      if (requiredRolesList.length === 0) {
        alert('Por favor, defina pelo menos uma função para a equipe.');
        setLoadingMonthGen(false);
        return;
      }

      const serviceCountMap: Record<string, number> = {};
      volunteers.forEach(v => {
        serviceCountMap[v.member_id] = 0;
      });

      let blockoutsRespected = 0;
      let doubleBookingsPrevented = 0;

      const generatedList = dates.map(dateStr => {
        const allocatedInThisService = new Set<string>();
        const serviceItems: any[] = [];

        const dateBlockouts = allBlockouts.filter(b => dateStr >= b.start_date && dateStr <= b.end_date);
        const dateDoubleBookings = allDoubleBookings.filter(d => d.service_date === dateStr);

        requiredRolesList.forEach(roleReq => {
          const candidates = volunteers.filter(v => {
            if (v.status && v.status !== 'ACTIVE') return false;
            if (allocatedInThisService.has(v.member_id)) return false;

            const isBlocked = dateBlockouts.some(b => b.member_id === v.member_id);
            if (isBlocked) {
              blockoutsRespected++;
              return false;
            }

            const isDoubleBooked = dateDoubleBookings.some(d => d.member_id === v.member_id);
            if (isDoubleBooked) {
              doubleBookingsPrevented++;
              return false;
            }

            return true;
          });

          const skilled = candidates.filter(v =>
            (v.roles_csv || '').toLowerCase().includes(roleReq.name.toLowerCase())
          );

          const poolToUse = skilled.length > 0 ? skilled : candidates;

          poolToUse.sort((a, b) => {
            const countA = serviceCountMap[a.member_id] || 0;
            const countB = serviceCountMap[b.member_id] || 0;
            if (countA !== countB) return countA - countB;
            return (a.total_served_count || 0) - (b.total_served_count || 0);
          });

          const selectedVol = poolToUse[0] || null;

          if (selectedVol) {
            allocatedInThisService.add(selectedVol.member_id);
            serviceCountMap[selectedVol.member_id] = (serviceCountMap[selectedVol.member_id] || 0) + 1;

            serviceItems.push({
              id: `${dateStr}_${roleReq.id}_${Math.random().toString(36).substring(2, 7)}`,
              role_id: roleReq.id,
              role_name: roleReq.name,
              member_id: selectedVol.member_id,
              member_name: selectedVol.member_name
            });
          } else {
            serviceItems.push({
              id: `${dateStr}_${roleReq.id}_${Math.random().toString(36).substring(2, 7)}`,
              role_id: roleReq.id,
              role_name: roleReq.name,
              member_id: '',
              member_name: ''
            });
          }
        });

        const [y, m, d] = dateStr.split('-');
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dateObj.getDay()];

        return {
          date: dateStr,
          formattedDate: `${dayName}, ${d}/${m}/${y}`,
          title: genScheduleTitle,
          time: genServiceTime,
          items: serviceItems
        };
      });

      const totalSlots = generatedList.reduce((acc, s) => acc + s.items.length, 0);
      const filledSlots = generatedList.reduce((acc, s) => acc + s.items.filter(i => i.member_id).length, 0);
      const usedVolunteers = Object.values(serviceCountMap).filter(c => c > 0).length;

      setGenInsights({
        totalServices: dates.length,
        totalSlots,
        filledSlots,
        blockoutsRespected,
        doubleBookingsPrevented,
        volunteersUsedCount: usedVolunteers
      });

      setGenSchedules(generatedList);
      setGenStep('PREVIEW');
    } catch (e) {
      console.error(e);
      alert('Erro ao processar sugestão da escala do mês.');
    } finally {
      setLoadingMonthGen(false);
    }
  };

  const handleUpdateGenSlotMember = (serviceIdx: number, slotIdx: number, newMemberId: string) => {
    setGenSchedules(prev => {
      const copy = [...prev];
      const targetService = { ...copy[serviceIdx] };
      const targetItems = [...targetService.items];
      const mem = churchMembers.find(m => m.id === newMemberId) || volunteers.find(v => v.member_id === newMemberId);
      targetItems[slotIdx] = {
        ...targetItems[slotIdx],
        member_id: newMemberId,
        member_name: mem ? (mem.name || mem.member_name) : ''
      };
      targetService.items = targetItems;
      copy[serviceIdx] = targetService;
      return copy;
    });
  };

  const handleConfirmMonthBatch = async () => {
    if (!selectedMinistry) return;
    setSavingMonthBatch(true);
    try {
      const headers = await getAuthHeaders();
      const payload = {
        schedules: genSchedules.map(s => ({
          title: s.title,
          service_date: s.date,
          service_time: s.time,
          notes: 'Escala gerada automaticamente pelo Motor de Inteligência Faith Hub Serve.',
          status: 'PUBLISHED',
          roster_items: s.items.filter(i => i.member_id).map(i => ({
            role_id: i.role_id,
            member_id: i.member_id
          }))
        }))
      };

      const res = await fetch(`${API_URL}/ministries/${selectedMinistry.id}/schedules/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`🎉 Sucesso! ${genSchedules.length} escalas do mês foram criadas e publicadas com sucesso!`);
        setShowMonthGeneratorModal(false);
        setGenStep('CONFIG');
        fetchMinistryDetails(selectedMinistry.id);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Erro ao criar escalas em lote.');
      }
    } catch (e) {
      alert('Erro ao salvar escalas do mês.');
    } finally {
      setSavingMonthBatch(false);
    }
  };

  const generateWhatsAppEscala = (item: RosterItem, sch: ServiceSchedule) => {
    const cleanPhone = (item.member_phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Olá ${item.member_name}! A paz do Senhor.\n\nVocê foi escalado(a) no *${selectedMinistry?.name}* para a função de *${item.role_name}* no *${sch.title}* no dia *${new Date(sch.service_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}* às *${sch.service_time}*.\n\nPor favor, confirme sua presença acessando o aplicativo Faith Hub!`
    );
    return `https://wa.me/55${cleanPhone}?text=${text}`;
  };

  // Contagens para os Filtros
  const activeCount = ministries.filter(m => (m.status || 'ACTIVE') === 'ACTIVE').length;
  const inactiveCount = ministries.filter(m => (m.status || 'ACTIVE') === 'INACTIVE').length;

  const filteredMinistries = ministries.filter(min => {
    const st = min.status || 'ACTIVE';
    if (ministryStatusFilter === 'ACTIVE' && st !== 'ACTIVE') return false;
    if (ministryStatusFilter === 'INACTIVE' && st !== 'INACTIVE') return false;
    if (ministrySearch.trim()) {
      const q = ministrySearch.toLowerCase().trim();
      const matchName = min.name.toLowerCase().includes(q);
      const matchLeader = (min.leader_name || '').toLowerCase().includes(q);
      if (!matchName && !matchLeader) return false;
    }
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingSchedules = schedules.filter(s => s.service_date >= todayStr && s.status !== 'COMPLETED');
  const pastSchedules = schedules.filter(s => s.service_date < todayStr || s.status === 'COMPLETED');

  const displayedSchedules = schedules.filter(s => {
    const isPast = s.service_date < todayStr || s.status === 'COMPLETED';
    if (schedulesTimeframe === 'UPCOMING' && isPast) return false;
    if (schedulesTimeframe === 'HISTORY' && !isPast) return false;
    if (schedulesStatusFilter !== 'ALL' && s.status !== schedulesStatusFilter) return false;
    return true;
  });

  const getRelativeDateBadge = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: '🔥 Hoje', bg: '#fef3c7', text: '#b45309' };
    if (diffDays === 1) return { label: '⏳ Amanhã', bg: '#e0f2fe', text: '#0369a1' };
    if (diffDays > 1) return { label: `⏳ Em ${diffDays} dias`, bg: '#f1f5f9', text: '#475569' };
    return { label: `🏁 Concluído há ${Math.abs(diffDays)} dia(s)`, bg: '#f8fafc', text: '#64748b' };
  };

  const isUserLeaderOfMin = (min: Ministry) => {
    if (normalizedRole !== 'LEADER') return false;
    const uId = currentUserProfile?.id;
    const uEmail = (currentUserProfile?.email || '').toLowerCase();
    const uName = (currentUserProfile?.name || '').toLowerCase();
    if (uId && min.leader_id === uId) return true;
    if (uEmail && min.leader_id?.toLowerCase() === uEmail) return true;
    if (uName && min.leader_name?.toLowerCase() === uName) return true;
    return false;
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

        {isGlobalAdmin && (
          <button
            onClick={handleOpenCreateMinistry}
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
        )}
      </div>

      {/* BARRA DE FILTROS & BUSCA DE MINISTÉRIOS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '10px' }}>
          {[
            { id: 'ALL', label: `Todos (${ministries.length})` },
            { id: 'ACTIVE', label: `🟢 Ativos (${activeCount})` },
            { id: 'INACTIVE', label: `⏸️ Inativos (${inactiveCount})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setMinistryStatusFilter(f.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: ministryStatusFilter === f.id ? '#ffffff' : 'transparent',
                color: ministryStatusFilter === f.id ? '#0f172a' : '#64748b',
                fontWeight: ministryStatusFilter === f.id ? 800 : 600,
                fontSize: '0.80rem',
                cursor: 'pointer',
                boxShadow: ministryStatusFilter === f.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '260px' }}>
          <span style={{ fontSize: '0.9rem' }}>🔍</span>
          <input
            type="text"
            placeholder="Buscar ministério ou líder..."
            value={ministrySearch}
            onChange={e => setMinistrySearch(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              outline: 'none',
              background: '#ffffff'
            }}
          />
        </div>
      </div>

      {/* CARDS SELETORES DE MINISTÉRIO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {filteredMinistries.map(min => {
          const isSelected = selectedMinistry?.id === min.id;
          const isInactive = (min.status || 'ACTIVE') === 'INACTIVE';
          const isUserLeader = isUserLeaderOfMin(min);

          return (
            <div
              key={min.id}
              onClick={() => setSelectedMinistry(min)}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                cursor: 'pointer',
                border: isSelected ? `2px solid ${min.color || '#0f766e'}` : '1px solid #e2e8f0',
                boxShadow: isSelected ? '0 6px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s',
                position: 'relative',
                opacity: isInactive ? 0.75 : 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Cover Banner do Card */}
              <div style={{
                height: min.image_url ? '105px' : '70px',
                width: '100%',
                position: 'relative',
                background: min.image_url 
                  ? `url("${min.image_url}") center/cover no-repeat` 
                  : `linear-gradient(135deg, ${min.color || '#0f766e'}25, ${min.color || '#0f766e'}50)`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '10px 12px'
              }}>
                {min.image_url && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%)' }} />
                )}

                {/* Ícone / Inicial */}
                <div style={{
                  position: 'relative',
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  color: min.color || '#0f766e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {min.name.charAt(0)}
                </div>

                {/* Badges */}
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{
                    fontSize: '0.68rem',
                    background: isInactive ? '#f1f5f9' : (isSelected ? (min.color || '#0f766e') : '#ecfdf5'),
                    color: isInactive ? '#64748b' : (isSelected ? '#ffffff' : '#047857'),
                    padding: '2px 8px',
                    borderRadius: '8px',
                    fontWeight: 800,
                    border: isInactive ? '1px solid #cbd5e1' : 'none',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
                  }}>
                    {isInactive ? '⏸️ Inativo' : (isSelected ? 'Selecionado' : '🟢 Ativo')}
                  </span>
                  {isUserLeader && (
                    <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '6px', fontWeight: 800, boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                      ⭐ Seu Ministério
                    </span>
                  )}
                </div>
              </div>

              {/* Informações do Ministério */}
              <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.02rem', color: '#0f172a', lineHeight: 1.3 }}>
                    {min.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>👤</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Líder: <strong>{min.leader_name || 'A definir'}</strong>
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '0.74rem', color: '#64748b' }}>
                  <span>👥 {min.volunteers_count || 0} Voluntários</span>
                  <span>•</span>
                  <span>📅 {min.upcoming_schedules_count || 0} Escalas</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMinistries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '36px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔍</div>
          <div style={{ fontWeight: 700, color: '#334155' }}>Nenhum ministério encontrado com os filtros atuais.</div>
        </div>
      )}

      {/* ÁREA DE DETALHES DO MINISTÉRIO SELECIONADO */}
      {selectedMinistry && (
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          
          {/* Header do Ministério Selecionado */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {selectedMinistry.image_url ? (
                <img
                  src={selectedMinistry.image_url}
                  alt={selectedMinistry.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '14px',
                    objectFit: 'cover',
                    border: '2px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                />
              ) : (
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: `${selectedMinistry.color || '#0f766e'}22`,
                  color: selectedMinistry.color || '#0f766e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800
                }}>
                  {selectedMinistry.name.charAt(0)}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedMinistry.name}
                  </h2>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '8px',
                    background: (selectedMinistry.status || 'ACTIVE') === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9',
                    color: (selectedMinistry.status || 'ACTIVE') === 'ACTIVE' ? '#065f46' : '#64748b',
                    border: (selectedMinistry.status || 'ACTIVE') === 'ACTIVE' ? '1px solid #a7f3d0' : '1px solid #cbd5e1'
                  }}>
                    {(selectedMinistry.status || 'ACTIVE') === 'ACTIVE' ? '🟢 Ativo' : '⏸️ Inativo'}
                  </span>
                </div>
                <div style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>{selectedMinistry.description || 'Equipe ministerial'}</span>
                  <span>•</span>
                  <span><strong>Líder:</strong> {selectedMinistry.leader_name || 'A definir'}</span>
                </div>
              </div>

              {/* Botões de Ação do Ministério (Editar / Desativar) */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {(isCurrentLeader || isGlobalAdmin) && (
                  <button
                    onClick={() => handleOpenEditMinistry(selectedMinistry)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontWeight: 700,
                      fontSize: '0.80rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Editar
                  </button>
                )}
                {isGlobalAdmin && (
                  <button
                    onClick={() => handleToggleMinistryStatus(selectedMinistry)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: (selectedMinistry.status || 'ACTIVE') === 'ACTIVE' ? '#fff7ed' : '#ecfdf5',
                      color: (selectedMinistry.status || 'ACTIVE') === 'ACTIVE' ? '#c2410c' : '#047857',
                      fontWeight: 700,
                      fontSize: '0.80rem',
                      cursor: 'pointer'
                    }}
                  >
                    {(selectedMinistry.status || 'ACTIVE') === 'ACTIVE' ? '⏸️ Desativar' : '▶️ Reativar'}
                  </button>
                )}
              </div>
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

          {/* Banner de Modo Leitura para Líderes de Outros Ministérios */}
          {!isCurrentLeader && !isGlobalAdmin && (
            <div style={{
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.82rem',
              color: '#475569'
            }}>
              <span style={{ fontSize: '1.1rem' }}>🔒</span>
              <div>
                <strong>Modo Somente Leitura:</strong> Você está visualizando o ministério liderado por <strong>{selectedMinistry.leader_name || 'outro líder'}</strong>. Apenas o líder responsável ou a Liderança Pastoral podem criar ou alterar escalas e voluntários.
              </div>
            </div>
          )}

          <div style={{ padding: '24px' }}>
            
            {/* SUB-ABA 1: ESCALAS DOS CULTOS */}
            {activeSubTab === 'schedules' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  
                  {/* Filtro de Timeframe e Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      {[
                        { id: 'UPCOMING', label: `📅 Próximas (${upcomingSchedules.length})` },
                        { id: 'HISTORY', label: `📜 Histórico (${pastSchedules.length})` },
                        { id: 'ALL', label: `📋 Todas (${schedules.length})` }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setSchedulesTimeframe(t.id as any)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: schedulesTimeframe === t.id ? '#ffffff' : 'transparent',
                            color: schedulesTimeframe === t.id ? '#0f172a' : '#64748b',
                            fontWeight: schedulesTimeframe === t.id ? 800 : 600,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            boxShadow: schedulesTimeframe === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <select
                      value={schedulesStatusFilter}
                      onChange={e => setSchedulesStatusFilter(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#334155'
                      }}
                    >
                      <option value="ALL">Todos os status</option>
                      <option value="PUBLISHED">Publicadas</option>
                      <option value="DRAFT">Rascunhos</option>
                      <option value="COMPLETED">Concluídas</option>
                    </select>
                  </div>

                  {(isCurrentLeader || isGlobalAdmin) && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={handleOpenMonthGenerator}
                        style={{
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(99,102,241,0.25)'
                        }}
                        title="Planeje automaticamente todas as escalas do mês com inteligência anti-conflito"
                      >
                        <span>✨</span> Gerar Escala do Mês (IA)
                      </button>

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
                  )}
                </div>

                {displayedSchedules.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
                    <div style={{ fontWeight: 700, color: '#334155' }}>
                      {schedulesTimeframe === 'HISTORY' ? 'Nenhuma escala no histórico deste ministério.' : 'Nenhuma escala agendada para os próximos cultos.'}
                    </div>
                    {(isCurrentLeader || isGlobalAdmin) && (
                      <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Clique em "Montar Nova Escala" para organizar a equipe do próximo culto.</div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {displayedSchedules.map(sch => {
                      const relBadge = getRelativeDateBadge(sch.service_date);
                      const isCompleted = sch.status === 'COMPLETED';

                      return (
                        <div key={sch.id} style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '18px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                                  {sch.title}
                                </span>
                                <span style={{
                                  fontSize: '0.72rem',
                                  background: isCompleted ? '#f1f5f9' : (sch.status === 'PUBLISHED' ? '#ecfdf5' : '#fef3c7'),
                                  color: isCompleted ? '#475569' : (sch.status === 'PUBLISHED' ? '#065f46' : '#92400e'),
                                  padding: '2px 8px',
                                  borderRadius: '8px',
                                  fontWeight: 800
                                }}>
                                  {isCompleted ? '✅ Concluída' : (sch.status === 'PUBLISHED' ? '🟢 Publicada' : '🟡 Rascunho')}
                                </span>
                                <span style={{ fontSize: '0.70rem', background: relBadge.bg, color: relBadge.text, padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
                                  {relBadge.label}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                                📅 {new Date(sch.service_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} às {sch.service_time}
                                {sch.notes && <span style={{ marginLeft: '10px', fontStyle: 'italic' }}>• "{sch.notes}"</span>}
                              </div>
                            </div>

                            {/* Termômetro de Confirmações & Ações */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', fontWeight: 800, flexWrap: 'wrap' }}>
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

                              <button
                                onClick={() => handleSendReminders(sch)}
                                title="Disparar lembretes 24h para os voluntários confirmados"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  borderRadius: '8px',
                                  color: '#166534',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                📢 Lembretes 24h
                              </button>

                              {(isCurrentLeader || isGlobalAdmin) && !isCompleted && (
                                <button
                                  onClick={() => handleOpenEditSchedule(sch)}
                                  title="Editar voluntários e informações desta escala"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 10px',
                                    background: '#eff6ff',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: '8px',
                                    color: '#1d4ed8',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✏️ Editar
                                </button>
                              )}

                              {(isCurrentLeader || isGlobalAdmin) && !isCompleted && (
                                <button
                                  onClick={() => handleMarkScheduleCompleted(sch)}
                                  title="Marcar esta escala como realizada/concluída"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 10px',
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    color: '#334155',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✅ Concluir
                                </button>
                              )}

                              {(isCurrentLeader || isGlobalAdmin) && (
                                <button
                                  onClick={() => handleDeleteSchedule(sch.id)}
                                  title="Excluir esta escala"
                                  style={{
                                    padding: '4px 8px',
                                    background: '#fff1f2',
                                    border: '1px solid #fecdd3',
                                    borderRadius: '8px',
                                    color: '#be123c',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </div>

                        {/* Posições escaladas */}
                        <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                          {(sch.roster_items || []).map(item => {
                            const isAccepted = item.status === 'ACCEPTED';
                            const isDeclined = item.status === 'DECLINED';
                            const isSwapRequested = item.status === 'SWAP_REQUESTED';

                            return (
                              <div
                                key={item.id}
                                style={{
                                  background: '#ffffff',
                                  padding: '10px 12px',
                                  borderRadius: '12px',
                                  border: isAccepted ? '1.5px solid #10b981' : (isDeclined ? '1.5px solid #ef4444' : (isSwapRequested ? '1.5px solid #f59e0b' : '1px solid #cbd5e1')),
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
                                  {isSwapRequested && (
                                    <div style={{ background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800, marginTop: '2px', display: 'inline-block' }}>
                                      🔄 Troca Solicitada
                                    </div>
                                  )}
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
                    );
                  })}
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
                  {(isCurrentLeader || isGlobalAdmin) && (
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
                  )}
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
                  {(isCurrentLeader || isGlobalAdmin) && (
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
                  )}
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
      {/* =========================================================
          MODAL: NOVO OU EDITAR MINISTÉRIO
          ========================================================= */}
      {showMinistryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {isEditingMinistry ? `Editar Ministério: ${minName || 'Ministério'}` : 'Novo Ministério'}
                </h3>
                <div style={{ fontSize: '0.80rem', color: '#64748b' }}>
                  {isEditingMinistry ? 'Atualize as informações, o líder responsável e o status deste ministério.' : 'Cadastre um novo ministério na igreja e atribua o líder responsável.'}
                </div>
              </div>
              <button onClick={() => setShowMinistryModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveMinistry} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Nome do Ministério *</label>
                <input required type="text" placeholder="Ex: Ministério de Louvor & Adoração" value={minName} onChange={e => setMinName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Líder Responsável (Membro da Igreja)
                </label>
                <select
                  value={minLeaderId}
                  onChange={e => {
                    const selId = e.target.value;
                    setMinLeaderId(selId);
                    const mem = churchMembers.find(m => m.id === selId);
                    setMinLeaderName(mem ? mem.name : '');
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', background: '#fff', fontSize: '0.85rem' }}
                >
                  <option value="">Nenhum líder selecionado (Definir depois)</option>
                  {churchMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.phone ? `(${m.phone})` : (m.email ? `(${m.email})` : '')}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                  💡 O membro selecionado terá acesso para gerenciar as escalas e os voluntários deste ministério.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Descrição Curta</label>
                <textarea rows={2} placeholder="Propósito e atuação deste ministério..." value={minDescription} onChange={e => setMinDescription(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              {/* Foto de Capa do Ministério */}
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Foto de Capa do Ministério (Opcional)
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {minImageUrl ? (
                    <div style={{ position: 'relative', width: '110px', height: '70px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                      <img src={minImageUrl} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setMinImageUrl('')}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '0.70rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Remover foto"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: '110px', height: '70px', borderRadius: '10px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', padding: '4px', flexShrink: 0 }}>
                      Sem foto
                    </div>
                  )}

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.80rem',
                      fontWeight: 700,
                      color: '#334155',
                      cursor: uploadingImage ? 'not-allowed' : 'pointer'
                    }}>
                      {uploadingImage ? '⏳ Enviando foto...' : '📷 Escolher Foto do Computador'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        disabled={uploadingImage} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                    <input
                      type="url"
                      placeholder="Ou cole a URL da imagem (https://...)"
                      value={minImageUrl}
                      onChange={e => setMinImageUrl(e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Cor do Ministério</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="color" value={minColor} onChange={e => setMinColor(e.target.value)} style={{ width: '42px', height: '38px', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '2px', cursor: 'pointer' }} />
                    <input type="text" value={minColor} onChange={e => setMinColor(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Status do Ministério</label>
                  <select
                    value={minStatus}
                    onChange={e => setMinStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontSize: '0.85rem' }}
                  >
                    <option value="ACTIVE">🟢 Ativo (Operante)</option>
                    <option value="INACTIVE">⏸️ Inativo (Pausado / Desativado)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowMinistryModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '8px 22px', borderRadius: '8px', border: 'none', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                  {isEditingMinistry ? 'Salvar Alterações' : 'Criar Ministério'}
                </button>
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
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Funções que está apto(a) a exercer
                </label>
                {roles.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {roles.map(r => {
                      const activeRoles = volRolesCsv.split(',').map(s => s.trim()).filter(Boolean);
                      const isSelected = activeRoles.includes(r.name);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            let next: string[];
                            if (isSelected) {
                              next = activeRoles.filter(name => name !== r.name);
                            } else {
                              next = [...activeRoles, r.name];
                            }
                            setVolRolesCsv(next.join(', '));
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '16px',
                            border: isSelected ? '1px solid #0f766e' : '1px solid #cbd5e1',
                            background: isSelected ? '#0f766e' : '#f8fafc',
                            color: isSelected ? '#ffffff' : '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isSelected ? '✓ ' : '+ '} {r.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <input type="text" placeholder="Ex: Bateria, Percussão" value={volRolesCsv} onChange={e => setVolRolesCsv(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                  💡 Clique nas funções acima ou digite separadas por vírgula.
                </div>
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
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {editingScheduleId ? 'Editar Escala de Culto' : 'Nova Escala de Culto'}
                </h3>
                <div style={{ fontSize: '0.80rem', color: '#64748b' }}>
                  {selectedMinistry?.name} • Organize a equipe e adicione múltiplos voluntários por função
                </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Alocação da Equipe por Função:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Total: <strong>{rosterDraft.filter(r => r.member_id).length}</strong> pessoa(s)
                    </span>
                    <button
                      type="button"
                      onClick={handleAutoSuggestSingleSchedule}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(99,102,241,0.2)'
                      }}
                      title="Preenche automaticamente as vagas vazias usando IA, respeitando bloqueios de agenda e rodízio"
                    >
                      <span>✨</span> Sugerir com IA
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {roles.map(role => {
                    const roleSlots = rosterDraft
                      .map((slot, originalIdx) => ({ slot, originalIdx }))
                      .filter(item => item.slot.role_id === role.id);

                    return (
                      <div key={role.id} style={{
                        background: '#f8fafc',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.90rem', color: '#0f172a' }}>
                              🏷️ {role.name}
                            </span>
                            <span style={{
                              fontSize: '0.70rem',
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: '6px',
                              background: roleSlots.length > 0 ? '#e0f2fe' : '#f1f5f9',
                              color: roleSlots.length > 0 ? '#0369a1' : '#64748b'
                            }}>
                              {roleSlots.length} voluntário(s)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddSlotForRole(role.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              border: '1px solid #0f766e',
                              background: '#f0fdfa',
                              color: '#0f766e',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            + Adicionar mais um voluntário
                          </button>
                        </div>

                        {roleSlots.length === 0 ? (
                          <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontStyle: 'italic', padding: '4px 0' }}>
                            Nenhum voluntário escalado nesta função.{' '}
                            <button
                              type="button"
                              onClick={() => handleAddSlotForRole(role.id)}
                              style={{ background: 'none', border: 'none', color: '#0f766e', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                            >
                              Clique para escalar voluntário
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {roleSlots.map(({ slot, originalIdx }, slotSeq) => {
                              const slotBlockout = conflicts.blockouts.find(b => b.member_id === slot.member_id);
                              const slotDoubleBooking = conflicts.doubleBookings.find(d => d.member_id === slot.member_id);

                              return (
                                <div key={originalIdx} style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  background: '#ffffff',
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: slotBlockout ? '1.5px solid #fca5a5' : (slotDoubleBooking ? '1.5px solid #fcd34d' : '1px solid #cbd5e1')
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', minWidth: '70px' }}>
                                      Pessoa #{slotSeq + 1}:
                                    </span>
                                    <select
                                      value={slot.member_id}
                                      onChange={e => handleUpdateSlotMember(originalIdx, e.target.value)}
                                      style={{
                                        flex: 1,
                                        padding: '7px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.82rem',
                                        outline: 'none',
                                        background: '#fff'
                                      }}
                                    >
                                      <option value="">Selecione o voluntário...</option>
                                      {volunteers.length > 0 && (
                                        <optgroup label="Voluntários do Ministério">
                                          {volunteers.map(v => {
                                            const isBlocked = conflicts.blockouts.some(b => b.member_id === v.member_id);
                                            const isBooked = conflicts.doubleBookings.some(d => d.member_id === v.member_id);
                                            return (
                                              <option key={v.member_id} value={v.member_id}>
                                                {v.member_name} {isBlocked ? '⛔ [INDISPONÍVEL]' : (isBooked ? '⚠️ [JÁ ESCALADO]' : '')}
                                              </option>
                                            );
                                          })}
                                        </optgroup>
                                      )}
                                      <optgroup label="Todos os Membros da Igreja">
                                        {churchMembers
                                          .filter(m => !volunteers.some(v => v.member_id === m.id))
                                          .map(m => {
                                            const isBlocked = conflicts.blockouts.some(b => b.member_id === m.id);
                                            const isBooked = conflicts.doubleBookings.some(d => d.member_id === m.id);
                                            return (
                                              <option key={m.id} value={m.id}>
                                                {m.name} {isBlocked ? '⛔ [INDISPONÍVEL]' : (isBooked ? '⚠️ [JÁ ESCALADO]' : '')}
                                              </option>
                                            );
                                          })}
                                      </optgroup>
                                    </select>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSlot(originalIdx)}
                                      title="Remover esta vaga da função"
                                      style={{
                                        background: '#fee2e2',
                                        color: '#b91c1c',
                                        border: 'none',
                                        borderRadius: '6px',
                                        width: '28px',
                                        height: '28px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.80rem'
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  {/* Alertas contextuais */}
                                  {slotBlockout && (
                                    <div style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 700, paddingLeft: '4px' }}>
                                      ⛔ Voluntário marcou bloqueio de data: "{slotBlockout.reason || 'Compromisso pessoal'}"
                                    </div>
                                  )}
                                  {slotDoubleBooking && (
                                    <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700, paddingLeft: '4px' }}>
                                      ⚠️ Já escalado no ministério "{slotDoubleBooking.ministry_name}" ({slotDoubleBooking.role_name} às {slotDoubleBooking.service_time})
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Vagas Avulsas ou Funções não cadastradas */}
                  {rosterDraft
                    .map((slot, originalIdx) => ({ slot, originalIdx }))
                    .filter(item => !roles.some(r => r.id === item.slot.role_id))
                    .map(({ slot, originalIdx }) => (
                      <div key={originalIdx} style={{
                        background: '#f1f5f9',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px dashed #cbd5e1'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '8px', alignItems: 'center' }}>
                          <select
                            value={slot.role_id}
                            onChange={e => handleUpdateSlotRole(originalIdx, e.target.value)}
                            style={{ padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem' }}
                          >
                            <option value="">Selecione a função...</option>
                            {roles.map(r => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>

                          <select
                            value={slot.member_id}
                            onChange={e => handleUpdateSlotMember(originalIdx, e.target.value)}
                            style={{ padding: '7px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.80rem' }}
                          >
                            <option value="">Selecione o voluntário...</option>
                            {volunteers.map(v => (
                              <option key={v.member_id} value={v.member_id}>{v.member_name}</option>
                            ))}
                            {churchMembers
                              .filter(m => !volunteers.some(v => v.member_id === m.id))
                              .map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(originalIdx)}
                            style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}

                  {/* Botão de Adicionar Vaga Avulsa */}
                  <button
                    type="button"
                    onClick={() => {
                      const firstRoleId = roles[0]?.id || '';
                      setRosterDraft(prev => [...prev, { role_id: firstRoleId, member_id: '', status: 'PENDING' }]);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px dashed #0f766e',
                      background: '#f0fdfa',
                      color: '#0f766e',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    + Adicionar Vaga Avulsa / Escolher Outra Função
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>Notas / Orientações (Repertório, vestimenta, etc.)</label>
                <textarea rows={2} placeholder="Ex: Ensaio geral às 16:30. Tom das músicas em G..." value={scheduleNotes} onChange={e => setScheduleNotes(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 22px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', color: '#fff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 4px rgba(15,118,110,0.3)' }}>
                  {editingScheduleId ? 'Salvar Alterações na Escala' : 'Publicar Escala & Notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GERADOR INTELIGENTE DA ESCALA DO MÊS (MODALIDADE 2) */}
      {showMonthGeneratorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: genStep === 'CONFIG' ? '700px' : '980px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '22px 28px',
              borderBottom: '1px solid #f1f5f9',
              background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  boxShadow: '0 4px 10px rgba(13, 148, 136, 0.35)'
                }}>
                  ✨
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                    Motor de Escala Inteligente — Mês Completo
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#0f766e', fontWeight: 600 }}>
                    {selectedMinistry?.name} • Rotação Justa, Anti-Conflito e Respeito a Indisponibilidades
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMonthGeneratorModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  width: '36px',
                  height: '36px',
                  fontSize: '1.1rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Stepper Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div
                onClick={() => setGenStep('CONFIG')}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  textAlign: 'center',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  borderBottom: genStep === 'CONFIG' ? '3px solid #0f766e' : '3px solid transparent',
                  color: genStep === 'CONFIG' ? '#0f766e' : '#64748b',
                  background: genStep === 'CONFIG' ? '#ffffff' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                1. Configuração do Período & Equipe
              </div>
              <div
                onClick={() => {
                  if (genSchedules.length > 0) setGenStep('PREVIEW');
                }}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  textAlign: 'center',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: genSchedules.length > 0 ? 'pointer' : 'not-allowed',
                  borderBottom: genStep === 'PREVIEW' ? '3px solid #0f766e' : '3px solid transparent',
                  color: genStep === 'PREVIEW' ? '#0f766e' : '#94a3b8',
                  background: genStep === 'PREVIEW' ? '#ffffff' : 'transparent',
                  opacity: genSchedules.length === 0 ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                2. Prévia & Ajustes da Matriz {genSchedules.length > 0 ? `(${genSchedules.length} Cultos)` : ''}
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
              {genStep === 'CONFIG' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  {/* Banner Explicativo */}
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '1.4rem' }}>💡</span>
                    <div style={{ fontSize: '0.84rem', color: '#166534', lineHeight: 1.5 }}>
                      <strong>Como funciona o Motor Inteligente:</strong> Ao clicar em gerar, o algoritmo analisa todos os cultos dos dias selecionados, verifica a agenda de indisponibilidades dos voluntários, bloqueia conflitos com outros ministérios e prioriza voluntários com menor contagem de escalas recentes para garantir descanso e rotação saudável.
                    </div>
                  </div>

                  {/* Seletor de Mês e Ano */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Mês de Referência
                      </label>
                      <select
                        value={genMonth}
                        onChange={e => setGenMonth(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '12px',
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: '#0f172a'
                        }}
                      >
                        {[
                          { v: 1, l: 'Janeiro' }, { v: 2, l: 'Fevereiro' }, { v: 3, l: 'Março' },
                          { v: 4, l: 'Abril' }, { v: 5, l: 'Maio' }, { v: 6, l: 'Junho' },
                          { v: 7, l: 'Julho' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Setembro' },
                          { v: 10, l: 'Outubro' }, { v: 11, l: 'Novembro' }, { v: 12, l: 'Dezembro' }
                        ].map(m => (
                          <option key={m.v} value={m.v}>{m.l}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Ano
                      </label>
                      <input
                        type="number"
                        value={genYear}
                        onChange={e => setGenYear(Number(e.target.value))}
                        min={2024}
                        max={2030}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '12px',
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: '#0f172a'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Horário Padrão do Culto
                      </label>
                      <input
                        type="time"
                        value={genServiceTime}
                        onChange={e => setGenServiceTime(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          borderRadius: '12px',
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: '#0f172a'
                        }}
                      />
                    </div>
                  </div>

                  {/* Nome Padrão do Culto */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Título / Nome do Culto Padrão
                    </label>
                    <input
                      type="text"
                      value={genScheduleTitle}
                      onChange={e => setGenScheduleTitle(e.target.value)}
                      placeholder="Ex: Culto de Celebração, Culto da Família, Culto Fé..."
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: '#0f172a'
                      }}
                    />
                  </div>

                  {/* Seleção de Dias da Semana dos Cultos */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Dias da Semana em que ocorrem os cultos
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { day: 0, label: 'Domingos' },
                        { day: 1, label: 'Segundas' },
                        { day: 2, label: 'Terças' },
                        { day: 3, label: 'Quartas' },
                        { day: 4, label: 'Quintas' },
                        { day: 5, label: 'Sextas' },
                        { day: 6, label: 'Sábados' }
                      ].map(item => {
                        const isSelected = genWeekdays.includes(item.day);
                        return (
                          <button
                            key={item.day}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                if (genWeekdays.length > 1) {
                                  setGenWeekdays(genWeekdays.filter(d => d !== item.day));
                                } else {
                                  alert('Selecione pelo menos um dia da semana para os cultos.');
                                }
                              } else {
                                setGenWeekdays([...genWeekdays, item.day].sort());
                              }
                            }}
                            style={{
                              padding: '9px 18px',
                              borderRadius: '10px',
                              border: isSelected ? '1.5px solid #0f766e' : '1.5px solid #e2e8f0',
                              background: isSelected ? '#0f766e' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#475569',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Resumo de datas calculadas */}
                    {(() => {
                      const calculatedDates = getMonthDatesForWeekdays(genYear, genMonth, genWeekdays);
                      return (
                        <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: '#0f766e' }}>
                            📅 {calculatedDates.length} cultos no período:
                          </span>
                          {calculatedDates.map(dStr => {
                            const [_, m, d] = dStr.split('-');
                            return (
                              <span key={dStr} style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.76rem', color: '#334155', fontWeight: 600 }}>
                                {d}/{m}
                              </span>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Vagas por Função neste Ministério */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                        Vagas da Equipe por Culto (Funções Necessárias)
                      </label>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Defina quantos voluntários serão escalados em cada posto
                      </span>
                    </div>

                    {roles.length === 0 ? (
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem' }}>
                        Nenhuma função cadastrada neste ministério ainda. Cadastre funções na aba "Funções do Ministério" primeiro.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                        {roles.map(role => {
                          const currentQty = genRoleQuantities[role.id] ?? (role.min_volunteers || 1);
                          return (
                            <div
                              key={role.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                background: currentQty > 0 ? '#f8fafc' : '#ffffff'
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {role.name}
                                </div>
                                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                  Mínimo sugerido: {role.min_volunteers || 1}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => setGenRoleQuantities(prev => ({ ...prev, [role.id]: Math.max(0, currentQty - 1) }))}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#fff',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#475569'
                                  }}
                                >
                                  -
                                </button>
                                <span style={{ width: '24px', textAlign: 'center', fontWeight: 800, fontSize: '0.92rem', color: currentQty > 0 ? '#0f766e' : '#94a3b8' }}>
                                  {currentQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setGenRoleQuantities(prev => ({ ...prev, [role.id]: currentQty + 1 }))}
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    background: '#fff',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#475569'
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ETAPA 2: PRÉVIA & AJUSTES DA MATRIZ MENSAL */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Métricas do Processamento Inteligente */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '10px'
                  }}>
                    <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', padding: '12px 14px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase' }}>Cultos no Mês</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#134e4a', marginTop: '2px' }}>{genInsights.totalServices}</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 14px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Vagas Preenchidas</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: genInsights.filledSlots === genInsights.totalSlots ? '#16a34a' : '#0284c7', marginTop: '2px' }}>
                        {genInsights.filledSlots}/{genInsights.totalSlots}
                      </div>
                    </div>
                    <div style={{ background: '#fefce8', border: '1px solid #fef08a', padding: '12px 14px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#854d0e', textTransform: 'uppercase' }}>Indisponibilidades</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ca8a04', marginTop: '2px' }}>
                        {genInsights.blockoutsRespected}
                      </div>
                    </div>
                    <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 14px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>Conflitos Evitados</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>
                        {genInsights.doubleBookingsPrevented}
                      </div>
                    </div>
                    <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '12px 14px', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>Voluntários Usados</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#7e22ce', marginTop: '2px' }}>
                        {genInsights.volunteersUsedCount}
                      </div>
                    </div>
                  </div>

                  {/* Informação & Dica de Ajuste Fino */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      Revise abaixo as alocações propostas pela IA. Você pode alterar qualquer voluntário diretamente no seletor antes de salvar.
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic' }}>
                      💡 Vagas sem voluntários disponíveis aparecem com borda âmbar.
                    </div>
                  </div>

                  {/* Matriz de Cultos do Mês */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {genSchedules.map((svc, serviceIdx) => (
                      <div
                        key={svc.date}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                      >
                        {/* Header do Culto */}
                        <div style={{
                          padding: '12px 18px',
                          background: '#f8fafc',
                          borderBottom: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{
                              background: '#0f766e',
                              color: '#fff',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: '8px'
                            }}>
                              {svc.formattedDate}
                            </span>
                            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                              {svc.title}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              às {svc.time}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f766e' }}>
                            {svc.items.filter(i => i.member_id).length} de {svc.items.length} vagas preenchidas
                          </div>
                        </div>

                        {/* Itens / Postos do Culto */}
                        <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                          {svc.items.map((slot, slotIdx) => {
                            const isFilled = Boolean(slot.member_id);
                            return (
                              <div
                                key={slot.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px 12px',
                                  borderRadius: '12px',
                                  border: isFilled ? '1px solid #e2e8f0' : '1px dashed #f59e0b',
                                  background: isFilled ? '#f8fafc' : '#fffbeb'
                                }}
                              >
                                <div style={{ width: '90px', flexShrink: 0 }}>
                                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase' }}>
                                    {slot.role_name}
                                  </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                  <select
                                    value={slot.member_id}
                                    onChange={e => handleUpdateGenSlotMember(serviceIdx, slotIdx, e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '6px 10px',
                                      borderRadius: '8px',
                                      border: isFilled ? '1px solid #cbd5e1' : '1.5px solid #f59e0b',
                                      background: '#ffffff',
                                      fontSize: '0.82rem',
                                      fontWeight: isFilled ? 700 : 500,
                                      color: isFilled ? '#1e293b' : '#b45309'
                                    }}
                                  >
                                    <option value="">-- Deixar vaga aberta --</option>
                                    {volunteers
                                      .filter(v => v.status === 'ACTIVE' || v.status === 'TRAINING')
                                      .map(v => (
                                        <option key={v.member_id} value={v.member_id}>
                                          {v.member_name} {v.roles_csv ? `(${v.roles_csv})` : ''}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div style={{
              padding: '16px 28px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {genStep === 'CONFIG' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowMonthGeneratorModal(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={runMonthGenerator}
                    disabled={loadingMonthGen}
                    style={{
                      padding: '12px 26px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                      color: '#ffffff',
                      fontSize: '0.92rem',
                      fontWeight: 800,
                      cursor: loadingMonthGen ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {loadingMonthGen ? (
                      <>
                        <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                        Analisando Bloqueios & Otimizando Escala...
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        Gerar Proposta da Escala com IA
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setGenStep('CONFIG')}
                    disabled={savingMonthBatch}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    ← Voltar e Ajustar Configuração
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmMonthBatch}
                    disabled={savingMonthBatch}
                    style={{
                      padding: '12px 28px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      color: '#ffffff',
                      fontSize: '0.94rem',
                      fontWeight: 900,
                      cursor: savingMonthBatch ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {savingMonthBatch ? (
                      <>
                        <span>⏳</span>
                        Gravando Todas as Escalas...
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        Confirmar e Publicar Todas as Escalas do Mês ({genSchedules.length} Cultos)
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LEMBRETES 24H PRÉ-CULTO (WHATSAPP) */}
      {showRemindersModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                  📢 Disparar Lembretes Pré-Culto (24h)
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  {remindersData?.scheduleTitle}
                </div>
              </div>
              <button onClick={() => setShowRemindersModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
              {loadingReminders ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Consultando voluntários confirmados...
                </div>
              ) : !remindersData?.reminders || remindersData.reminders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🕊️</div>
                  <div>Nenhum voluntário confirmado nesta escala para envio de lembretes.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '0.80rem', color: '#475569', marginBottom: '4px' }}>
                    Envie mensagem individual aos <strong>{remindersData.reminders.length} voluntários confirmados</strong>:
                  </div>

                  {remindersData.reminders.map((rem: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                          {rem.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Função: <strong>{rem.role_name}</strong> {rem.phone ? `• 📱 ${rem.phone}` : ''}
                        </div>
                      </div>

                      {rem.whatsapp_url ? (
                        <a
                          href={rem.whatsapp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: '#22c55e',
                            color: '#ffffff',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 800
                          }}
                        >
                          💬 Enviar
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.70rem', color: '#94a3b8' }}>Sem WhatsApp</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button
                onClick={() => setShowRemindersModal(false)}
                style={{ padding: '8px 16px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
