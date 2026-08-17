import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import { KidsBadgeModal } from '../components/KidsBadgeModal';
import { KidsQrScannerModal } from '../components/KidsQrScannerModal';
import './Members.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

// Interfaces
export interface KidsRoom {
  id: string;
  name: string;
  min_age: number;
  max_age: number;
  capacity: number;
  color: string;
  icon: string;
  description?: string;
  organization_id: string;
  campus_id?: string;
}

export interface KidsChild {
  id: string;
  name: string;
  birthdate?: string;
  gender: string;
  allergies?: string;
  medical_notes?: string;
  general_notes?: string;
  parent_name: string;
  parent_phone: string;
  parent_email?: string;
  parent_member_id?: string;
  is_visitor?: boolean;
  member_parent_name?: string;
  member_parent_phone?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  photo_url?: string;
  organization_id: string;
  campus_id?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar_url?: string;
  campus_id?: string;
  children: KidsChild[];
}

export interface KidsCheckin {
  id: string;
  child_id: string;
  child_name: string;
  room_id: string;
  room_name: string;
  room_color?: string;
  room_icon?: string;
  parent_name: string;
  parent_phone: string;
  parent_member_id?: string;
  is_visitor?: boolean;
  security_code: string;
  status: 'CHECKED_IN' | 'CALLING_PARENTS' | 'CHECKED_OUT';
  call_reason?: string;
  call_message?: string;
  called_at?: string;
  checkin_at: string;
  checkout_at?: string;
  checked_in_by?: string;
  checked_out_by?: string;
  birthdate?: string;
  allergies?: string;
  medical_notes?: string;
  general_notes?: string;
  photo_url?: string;
}

// Icons
const BabyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/><path d="M9 13v2"/><path d="M15 13v2"/></svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const AlertBellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

interface KidsMinistryProps {
  selectedCampusId?: string;
  selectedOrganization?: any;
  activeSubtab?: string;
  onNavigateSubtab?: (subtab: string) => void;
}

export const KidsMinistry: React.FC<KidsMinistryProps> = ({ 
  selectedCampusId = 'all', 
  selectedOrganization,
  activeSubtab,
  onNavigateSubtab
}) => {
  const orgId = selectedOrganization?.id || 'org_default';

  const mapSubtabToInternal = (sub?: string): 'salas' | 'checkin_rapido' | 'chamados' | 'familias' | 'config_salas' => {
    if (sub === 'kids_checkin') return 'checkin_rapido';
    if (sub === 'kids_chamados') return 'chamados';
    if (sub === 'kids_familias') return 'familias';
    if (sub === 'kids_config_salas') return 'config_salas';
    return 'salas';
  };

  const mapInternalToSubtab = (internal: string): string => {
    if (internal === 'checkin_rapido') return 'kids_checkin';
    if (internal === 'chamados') return 'kids_chamados';
    if (internal === 'familias') return 'kids_familias';
    if (internal === 'config_salas') return 'kids_config_salas';
    return 'kids_salas';
  };

  // Navigation Subtabs
  const [activeTab, setActiveTabState] = useState<'salas' | 'checkin_rapido' | 'chamados' | 'familias' | 'config_salas'>(
    mapSubtabToInternal(activeSubtab)
  );

  useEffect(() => {
    if (activeSubtab) {
      setActiveTabState(mapSubtabToInternal(activeSubtab));
    }
  }, [activeSubtab]);

  const switchTab = (tab: 'salas' | 'checkin_rapido' | 'chamados' | 'familias' | 'config_salas') => {
    setActiveTabState(tab);
    if (onNavigateSubtab) {
      onNavigateSubtab(mapInternalToSubtab(tab));
    }
  };
  
  // Data States
  const [rooms, setRooms] = useState<KidsRoom[]>([]);
  const [checkins, setCheckins] = useState<KidsCheckin[]>([]);
  const [families, setFamilies] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Totem Check-in Mode: 'MEMBER' | 'VISITOR'
  const [checkinMode, setCheckinMode] = useState<'MEMBER' | 'VISITOR'>('MEMBER');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<FamilyMember | null>(null);
  const [selectedChildForCheckin, setSelectedChildForCheckin] = useState<KidsChild | null>(null);
  
  // Modals States
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Selected Target for Action Modals
  const [selectedCheckinForAction, setSelectedCheckinForAction] = useState<KidsCheckin | null>(null);
  const [checkoutInputPin, setCheckoutInputPin] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  // Scanner de Câmera QR Code
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [scannerTargetChild, setScannerTargetChild] = useState<KidsCheckin | null>(null);

  // Call Parent Form State
  const [callReason, setCallReason] = useState('CHORO');
  const [callCustomMessage, setCallCustomMessage] = useState('');
  const [callingSaving, setCallingSaving] = useState(false);

  // Quick Check-in Form State
  const [quickCheckinForm, setQuickCheckinForm] = useState({
    child_name: '',
    birthdate: '',
    allergies: '',
    medical_notes: '',
    room_id: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    parent_member_id: '',
    is_visitor: false,
    register_as_member: true
  });
  const [checkinSuccessData, setCheckinSuccessData] = useState<any | null>(null);

  // Child Form State (Cadastro/Edição com Vínculo ao Membro)
  const [childForm, setChildForm] = useState<Partial<KidsChild>>({
    name: '',
    birthdate: '',
    gender: 'M',
    allergies: '',
    medical_notes: '',
    general_notes: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    parent_member_id: '',
    is_visitor: false,
    emergency_contact: '',
    emergency_phone: ''
  });

  // Room Form State
  const [roomForm, setRoomForm] = useState<Partial<KidsRoom>>({
    name: '',
    min_age: 0,
    max_age: 12,
    capacity: 25,
    color: '#0f766e',
    icon: '👶',
    description: ''
  });

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  // Load Rooms
  const loadRooms = async () => {
    try {
      const campusParam = selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const res = await fetch(`${API_URL}/kids/rooms?organization_id=${encodeURIComponent(orgId)}${campusParam}`);
      if (res.ok) {
        const json = await res.json();
        const list = json.data || [];
        setRooms(list);
        if (list.length > 0) {
          setQuickCheckinForm(prev => prev.room_id ? prev : { ...prev, room_id: list[0].id });
        }
      }
    } catch (e) {
      console.error("Erro ao carregar salas do Kids:", e);
    }
  };

  // Load Active Check-ins
  const loadCheckins = async () => {
    try {
      const headers = await getAuthHeaders();
      const campusParam = selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const res = await fetch(`${API_URL}/kids/checkins?organization_id=${encodeURIComponent(orgId)}&status=active${campusParam}`, { headers });
      if (res.ok) {
        const json = await res.json();
        setCheckins(json.data || []);
      }
    } catch (e) {
      console.error("Erro ao carregar check-ins do Kids:", e);
    } finally {
      setLoading(false);
    }
  };

  // Load Families (Membros e filhos integrados)
  const loadFamilies = async (query = '') => {
    try {
      const campusParam = selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const searchParam = query ? `&search=${encodeURIComponent(query)}` : '';
      const res = await fetch(`${API_URL}/kids/families?organization_id=${encodeURIComponent(orgId)}${campusParam}${searchParam}`);
      if (res.ok) {
        const json = await res.json();
        setFamilies(json.data || []);
      }
    } catch (e) {
      console.error("Erro ao carregar famílias:", e);
    }
  };

  useEffect(() => {
    loadRooms();
    loadCheckins();
    loadFamilies();

    const interval = setInterval(() => {
      loadCheckins();
    }, 10000);
    return () => clearInterval(interval);
  }, [orgId, selectedCampusId]);

  // Handler: Realizar Check-in
  const handlePerformCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const targetRoomId = quickCheckinForm.room_id || (rooms.length > 0 ? rooms[0].id : '');
      const payload = {
        child_id: selectedChildForCheckin?.id || null,
        child_name: quickCheckinForm.child_name,
        birthdate: quickCheckinForm.birthdate || null,
        allergies: quickCheckinForm.allergies || null,
        medical_notes: quickCheckinForm.medical_notes || null,
        room_id: targetRoomId,
        parent_name: quickCheckinForm.parent_name,
        parent_phone: quickCheckinForm.parent_phone,
        parent_email: quickCheckinForm.parent_email || null,
        parent_member_id: quickCheckinForm.parent_member_id || null,
        is_visitor: quickCheckinForm.is_visitor,
        register_as_member: quickCheckinForm.register_as_member,
        organization_id: orgId,
        campus_id: selectedCampusId !== 'all' ? selectedCampusId : null,
        checked_in_by: 'Equipe Kids'
      };

      const res = await fetch(`${API_URL}/kids/checkin`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        setCheckinSuccessData(json.checkin);
        loadCheckins();
        loadFamilies();
        // Reset form
        setSelectedChildForCheckin(null);
        setSelectedFamilyMember(null);
        setQuickCheckinForm({
          child_name: '',
          birthdate: '',
          allergies: '',
          medical_notes: '',
          room_id: rooms.length > 0 ? rooms[0].id : '',
          parent_name: '',
          parent_phone: '',
          parent_email: '',
          parent_member_id: '',
          is_visitor: false,
          register_as_member: true
        });
      } else {
        alert(json.message || "Erro ao realizar check-in");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Erro de conexão ao realizar check-in");
    }
  };

  // Handler: Chamar Pais
  const handleCallParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheckinForAction) return;

    setCallingSaving(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/kids/call-parent`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: selectedCheckinForAction.id,
          reason: callReason,
          message: callCustomMessage || null
        })
      });

      if (res.ok) {
        setIsCallModalOpen(false);
        loadCheckins();
      } else {
        alert("Erro ao disparar chamada dos pais.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCallingSaving(false);
    }
  };

  // Handler: Resolver Chamado (Pais compareceram)
  const handleResolveCall = async (checkinId: string) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(`${API_URL}/kids/resolve-call`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkin_id: checkinId })
      });
      loadCheckins();
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Checkout com Validação de PIN
  const handlePerformCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheckinForAction) return;

    setCheckoutError('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/kids/checkout`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: selectedCheckinForAction.id,
          security_code: checkoutInputPin,
          checked_out_by: 'Educador da Sala'
        })
      });

      if (res.ok) {
        setIsCheckoutModalOpen(false);
        setCheckoutInputPin('');
        setSelectedCheckinForAction(null);
        loadCheckins();
      } else {
        const errJson = await res.json().catch(() => ({}));
        setCheckoutError(errJson.message || "Código PIN incorreto.");
      }
    } catch (err) {
      console.error(err);
      setCheckoutError("Erro de comunicação ao validar checkout.");
    }
  };

  // Handler: Checkout Seguro via Scanner de Câmera QR Code
  const handleScanSuccessCheckout = async (scannedCode: string) => {
    setIsScannerModalOpen(false);
    const target = scannerTargetChild;
    setScannerTargetChild(null);

    let targetCheckin = target;
    if (!targetCheckin) {
      targetCheckin = checkins.find(c =>
        c.security_code.trim().toUpperCase() === scannedCode.trim().toUpperCase() ||
        scannedCode.includes(c.security_code)
      ) || null;
    }

    if (!targetCheckin) {
      alert(`O QR Code "${scannedCode}" não corresponde a nenhuma criança ativa no Ministério Infantil.`);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/kids/checkout`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkin_id: targetCheckin.id,
          security_code: scannedCode,
          checked_out_by: 'Educador da Sala (Web Studio)'
        })
      });

      if (res.ok) {
        alert(`✅ Checkout de ${targetCheckin.child_name} realizado com sucesso!`);
        loadCheckins();
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.message || "Código QR inválido para esta criança.");
      }
    } catch (e) {
      alert("Erro ao realizar checkout.");
    }
  };

  // Handler: Salvar Criança
  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/kids/children`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...childForm,
          organization_id: orgId,
          campus_id: selectedCampusId !== 'all' ? selectedCampusId : null
        })
      });

      if (res.ok) {
        setIsChildModalOpen(false);
        loadFamilies();
      } else {
        alert("Erro ao salvar cadastro da criança.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Salvar Sala
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/kids/rooms`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...roomForm,
          organization_id: orgId,
          campus_id: selectedCampusId !== 'all' ? selectedCampusId : null
        })
      });

      if (res.ok) {
        setIsRoomModalOpen(false);
        loadRooms();
      } else {
        alert("Erro ao salvar sala.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helpers
  const activeCheckinsCalling = checkins.filter(c => c.status === 'CALLING_PARENTS');
  const filteredCheckins = checkins.filter(c => {
    const matchRoom = selectedRoomFilter === 'all' || c.room_id === selectedRoomFilter;
    const matchSearch = !searchTerm || c.child_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.security_code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRoom && matchSearch;
  });

  const calculateAge = (birthdate?: string) => {
    if (!birthdate) return null;
    const birth = new Date(birthdate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getSuggestedRoomForAge = (age: number | null) => {
    if (age === null || rooms.length === 0) return rooms[0]?.id || '';
    const found = rooms.find(r => age >= r.min_age && age <= r.max_age);
    return found ? found.id : rooms[0]?.id || '';
  };

  return (
    <div className="members-container animate-fade-in" style={{ width: '100%' }}>
      {/* Top Header */}
      <div className="header-actions" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)', width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BabyIcon />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {activeTab === 'salas' && `Painel ao Vivo das Salas (${checkins.length} crianças)`}
                {activeTab === 'checkin_rapido' && 'Totem de Check-in Expresso'}
                {activeTab === 'chamados' && `Central de Chamados de Pais ${activeCheckinsCalling.length > 0 ? `(${activeCheckinsCalling.length})` : ''}`}
                {activeTab === 'familias' && `Base de Famílias & Membros (${families.length})`}
                {activeTab === 'config_salas' && `Configuração de Salas & Turmas (${rooms.length})`}
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 2, fontSize: '0.86rem' }}>
                {activeTab === 'salas' && 'Monitoramento em tempo real das turmas infantis e conferência de crachás.'}
                {activeTab === 'checkin_rapido' && 'Registro ágil de entrada de crianças (membros e visitantes) com geração de PIN.'}
                {activeTab === 'chamados' && 'Disparo e acompanhamento de alertas aos responsáveis via aplicativo e WhatsApp.'}
                {activeTab === 'familias' && 'Crianças agrupadas diretamente por seus responsáveis na base de membros.'}
                {activeTab === 'config_salas' && 'Gestão de turmas, faixas etárias, capacidades e identidade visual das salas.'}
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {activeCheckinsCalling.length > 0 && activeTab !== 'chamados' && (
            <button 
              type="button" 
              onClick={() => switchTab('chamados')}
              style={{
                background: '#fee2e2',
                border: '1px solid #ef4444',
                color: '#b91c1c',
                padding: '8px 14px',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                animation: 'pulse 2s infinite'
              }}
            >
              <span>🚨</span> {activeCheckinsCalling.length} Chamado(s) Ativo(s)
            </button>
          )}

          {activeTab !== 'checkin_rapido' && (
            <button 
              type="button" 
              className="btn-primary"
              onClick={() => {
                switchTab('checkin_rapido');
                setCheckinSuccessData(null);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.84rem', padding: '9px 16px' }}
            >
              <PlusIcon /> Fazer Check-in de Criança
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          TAB 1: PAINEL AO VIVO DAS SALAS & CRIANÇAS ATIVAS
          ======================================================== */}
      {activeTab === 'salas' && (
        <div>
          {/* Top Room Cards Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div 
              onClick={() => setSelectedRoomFilter('all')}
              className="portal-card"
              style={{
                cursor: 'pointer',
                border: selectedRoomFilter === 'all' ? '2px solid var(--accent-primary)' : '1px solid var(--panel-border)',
                background: selectedRoomFilter === 'all' ? 'var(--accent-primary-light)' : '#ffffff',
                padding: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>Todas as Salas</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{checkins.length}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {rooms.length} salas ativas cadastradas
              </div>
            </div>

            {rooms.map(room => {
              const roomCheckins = checkins.filter(c => c.room_id === room.id);
              const isSelected = selectedRoomFilter === room.id;
              return (
                <div 
                  key={room.id}
                  onClick={() => setSelectedRoomFilter(room.id)}
                  className="portal-card"
                  style={{
                    cursor: 'pointer',
                    border: isSelected ? `2px solid ${room.color || 'var(--accent-primary)'}` : '1px solid var(--panel-border)',
                    background: isSelected ? `${room.color || 'var(--accent-primary)'}10` : '#ffffff',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{room.icon}</span> {room.name}
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: room.color || 'var(--accent-primary)' }}>
                      {roomCheckins.length}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Faixa etária: {room.min_age} a {room.max_age} anos • Cap: {room.capacity}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="search-pill" style={{ width: 280 }}>
                <SearchIcon />
                <input 
                  type="text" 
                  placeholder="Buscar por criança, responsável ou PIN..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {selectedRoomFilter !== 'all' && (
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setSelectedRoomFilter('all')}
                  style={{ fontSize: '0.76rem', padding: '6px 12px' }}
                >
                  ✕ Limpar Filtro de Sala
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setScannerTargetChild(null);
                  setIsScannerModalOpen(true);
                }}
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 900,
                  fontSize: '0.80rem',
                  padding: '7px 14px'
                }}
              >
                <span>📸</span> Realizar Checkout (Ler QR Code)
              </button>

              <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Exibindo <strong>{filteredCheckins.length}</strong> de <strong>{checkins.length}</strong> crianças presentes
              </div>
            </div>
          </div>

          {/* Children Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 50, color: 'var(--text-muted)' }}>
              Carregando crianças presentes...
            </div>
          ) : filteredCheckins.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50, background: '#ffffff', borderRadius: 16, border: '1px dashed var(--panel-border)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>👶</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Nenhuma criança presente no momento</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: 4, maxWidth: 380, margin: '6px auto 16px auto' }}>
                Utilize o totem de check-in expresso para registrar a entrada dos pequenos no Ministério Infantil.
              </p>
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => switchTab('checkin_rapido')}
              >
                <PlusIcon /> Fazer Check-in no Totem
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {filteredCheckins.map(item => {
                const isCalling = item.status === 'CALLING_PARENTS';
                const age = calculateAge(item.birthdate);

                return (
                  <div 
                    key={item.id}
                    className="portal-card"
                    style={{
                      margin: 0,
                      padding: 0,
                      overflow: 'hidden',
                      border: isCalling ? '2px solid #ef4444' : '1px solid var(--panel-border)',
                      boxShadow: isCalling ? '0 0 18px rgba(239, 68, 68, 0.2)' : '0 4px 12px rgba(0,0,0,0.03)',
                      background: '#ffffff',
                      position: 'relative'
                    }}
                  >
                    {/* Header do Card */}
                    <div style={{
                      background: isCalling ? '#fef2f2' : '#f8fafc',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          background: item.room_color || 'var(--accent-primary)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1.1rem'
                        }}>
                          {item.child_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.96rem', fontWeight: 900, color: 'var(--text-main)' }}>
                            {item.child_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{item.room_name}</span>
                            {age !== null && <span>• {age} anos</span>}
                            {item.is_visitor && <span style={{ background: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>Visitante</span>}
                          </div>
                        </div>
                      </div>

                      {/* PIN de Segurança com Botão de Ver Crachá */}
                      <button
                        type="button"
                        onClick={() => setCheckinSuccessData(item)}
                        style={{
                          background: '#ffffff',
                          border: '1.5px solid var(--accent-primary)',
                          padding: '4px 10px',
                          borderRadius: 8,
                          textAlign: 'right',
                          cursor: 'pointer'
                        }}
                        title="Ver Crachá & QR Code"
                      >
                        <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>QR & PIN</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--accent-primary)', letterSpacing: '0.05em' }}>
                          {item.security_code}
                        </div>
                      </button>
                    </div>

                    {/* Conteúdo do Card */}
                    <div style={{ padding: '14px 16px' }}>
                      {/* Alerta de Chamada Ativa */}
                      {isCalling && (
                        <div style={{
                          background: '#fee2e2',
                          border: '1px solid #fca5a5',
                          borderRadius: 8,
                          padding: '8px 12px',
                          marginBottom: 12,
                          animation: 'pulse 2s infinite'
                        }}>
                          <div style={{ fontSize: '0.80rem', fontWeight: 800, color: '#991b1b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>🚨 CHAMADO ATIVO: {item.call_reason}</span>
                            <button
                              type="button"
                              onClick={() => handleResolveCall(item.id)}
                              style={{
                                background: '#b91c1c',
                                color: '#ffffff',
                                border: 'none',
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: '0.70rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Resolver
                            </button>
                          </div>
                          {item.call_message && (
                            <div style={{ fontSize: '0.74rem', color: '#7f1d1d', marginTop: 4, fontStyle: 'italic' }}>
                              "{item.call_message}"
                            </div>
                          )}
                        </div>
                      )}

                      {/* Alergias */}
                      {item.allergies && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '6px 10px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.90rem' }}>⚠️</span>
                          <div style={{ fontSize: '0.74rem', color: '#991b1b', fontWeight: 700 }}>
                            Alergia: <strong>{item.allergies}</strong>
                          </div>
                        </div>
                      )}

                      {/* Observações Médicas */}
                      {item.medical_notes && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 10px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '0.90rem' }}>💊</span>
                          <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700 }}>
                            Cuidados: <strong>{item.medical_notes}</strong>
                          </div>
                        </div>
                      )}

                      {/* Informações dos Pais */}
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.4 }}>
                        <div><strong>Responsável:</strong> {item.parent_name} {item.parent_member_id && <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>✓ Membro</span>}</div>
                        <div><strong>WhatsApp:</strong> {item.parent_phone}</div>
                        <div><strong>Entrada:</strong> {new Date(item.checkin_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>

                      {/* Ações Rápidas */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 6, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCheckinForAction(item);
                            setCallReason('CHORO');
                            setCallCustomMessage('');
                            setIsCallModalOpen(true);
                          }}
                          style={{
                            background: isCalling ? '#fee2e2' : '#fff7ed',
                            color: isCalling ? '#b91c1c' : '#c2410c',
                            border: '1px solid #fed7aa',
                            borderRadius: 8,
                            padding: '7px 4px',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <AlertBellIcon /> Chamar
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setScannerTargetChild(item);
                            setIsScannerModalOpen(true);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '7px 4px',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <span>📸</span> Ler QR
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCheckinForAction(item);
                            setCheckoutInputPin('');
                            setCheckoutError('');
                            setIsCheckoutModalOpen(true);
                          }}
                          style={{
                            background: '#f0fdf4',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            borderRadius: 8,
                            padding: '7px 4px',
                            fontWeight: 800,
                            fontSize: '0.74rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            cursor: 'pointer'
                          }}
                        >
                          <ShieldCheckIcon /> PIN Manual
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: TOTEM DE CHECK-IN EXPRESSO (INTEGRADO COM MEMBROS)
          ======================================================== */}
      {activeTab === 'checkin_rapido' && (
        <div className="animate-fade-in" style={{ maxWidth: 880, margin: '0 auto' }}>
          <div className="portal-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  🏷️ Totem de Check-in Expresso Kids
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: 2 }}>
                  Selecione se o responsável é membro cadastrado da igreja ou visitante.
                </p>
              </div>

              {/* Toggle de Modo: Membro vs Visitante */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    setCheckinMode('MEMBER');
                    setQuickCheckinForm(prev => ({ ...prev, is_visitor: false }));
                  }}
                  style={{
                    background: checkinMode === 'MEMBER' ? 'var(--accent-primary)' : 'transparent',
                    color: checkinMode === 'MEMBER' ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  👤 Membro da Igreja
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCheckinMode('VISITOR');
                    setSelectedFamilyMember(null);
                    setSelectedChildForCheckin(null);
                    setQuickCheckinForm(prev => ({ ...prev, is_visitor: true, parent_member_id: '' }));
                  }}
                  style={{
                    background: checkinMode === 'VISITOR' ? 'var(--accent-primary)' : 'transparent',
                    color: checkinMode === 'VISITOR' ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  👋 Visitante / Novo
                </button>
              </div>
            </div>

            {/* MODO MEMBRO: Busca Inteligente na Base de Membros */}
            {checkinMode === 'MEMBER' && (
              <div style={{ marginBottom: 20, background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                <label className="form-label-modern" style={{ fontSize: '0.80rem', fontWeight: 800 }}>
                  🔍 1. Buscar Pai / Mãe na Lista de Membros:
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input 
                    type="text" 
                    className="input-modern"
                    placeholder="Digite o nome, WhatsApp ou e-mail do membro..."
                    onChange={e => loadFamilies(e.target.value)}
                  />
                </div>

                {/* Lista de Membros Encontrados */}
                {families.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {families.slice(0, 6).map(fam => {
                      const isSelected = selectedFamilyMember?.id === fam.id;
                      return (
                        <div
                          key={fam.id}
                          onClick={() => {
                            setSelectedFamilyMember(fam);
                            setSelectedChildForCheckin(null);
                            setQuickCheckinForm({
                              ...quickCheckinForm,
                              parent_name: fam.name,
                              parent_phone: fam.phone || '',
                              parent_email: fam.email || '',
                              parent_member_id: fam.id,
                              is_visitor: false
                            });
                          }}
                          style={{
                            background: isSelected ? 'var(--accent-primary-light)' : '#ffffff',
                            border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid #e2e8f0',
                            borderRadius: 10,
                            padding: '8px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-primary-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                              {fam.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-main)' }}>{fam.name}</div>
                              <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>{fam.phone || fam.email} • {fam.role}</div>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: fam.children.length > 0 ? 'var(--accent-primary)' : '#94a3b8' }}>
                            {fam.children.length > 0 ? `👶 ${fam.children.length} filho(s) cadastrado(s)` : 'Sem filhos vinculados'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Seleção de Filhos do Membro Selecionado */}
                {selectedFamilyMember && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
                      👶 2. Selecione o filho de <strong>{selectedFamilyMember.name}</strong> para check-in:
                    </div>

                    {selectedFamilyMember.children.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: '#64748b', background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
                        Nenhum filho cadastrado para este membro ainda. Preencha o formulário abaixo para registrar e vincular o filho a {selectedFamilyMember.name}!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {selectedFamilyMember.children.map(ch => {
                          const isChildSelected = selectedChildForCheckin?.id === ch.id;
                          const age = calculateAge(ch.birthdate);
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => {
                                setSelectedChildForCheckin(ch);
                                setQuickCheckinForm({
                                  ...quickCheckinForm,
                                  child_name: ch.name,
                                  birthdate: ch.birthdate || '',
                                  allergies: ch.allergies || '',
                                  medical_notes: ch.medical_notes || '',
                                  room_id: getSuggestedRoomForAge(age),
                                  parent_name: selectedFamilyMember.name,
                                  parent_phone: selectedFamilyMember.phone || '',
                                  parent_email: selectedFamilyMember.email || '',
                                  parent_member_id: selectedFamilyMember.id,
                                  is_visitor: false
                                });
                              }}
                              style={{
                                background: isChildSelected ? 'var(--accent-primary)' : '#ffffff',
                                color: isChildSelected ? '#ffffff' : 'var(--text-main)',
                                border: isChildSelected ? '1px solid var(--accent-primary)' : '1px solid #cbd5e1',
                                borderRadius: 10,
                                padding: '8px 14px',
                                fontWeight: 800,
                                fontSize: '0.80rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <span>👶 {ch.name}</span>
                              <span style={{ fontSize: '0.70rem', opacity: 0.8 }}>({age !== null ? `${age} anos` : 'Idade N/I'})</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MODO VISITANTE: Banner Informativo */}
            {checkinMode === 'VISITOR' && (
              <div style={{ marginBottom: 16, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.4rem' }}>👋</span>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#b45309' }}>Check-in de Visitante / Família Nova</div>
                  <div style={{ fontSize: '0.74rem', color: '#92400e' }}>
                    O check-in funciona normalmente com geração do PIN de segurança. Opcionalmente você pode salvá-lo como membro/visitante no sistema.
                  </div>
                </div>
              </div>
            )}

            {/* Formulário de Check-in */}
            <form onSubmit={handlePerformCheckin}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="form-label-modern">Nome Completo da Criança *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={quickCheckinForm.child_name} 
                    onChange={e => setQuickCheckinForm({ ...quickCheckinForm, child_name: e.target.value })}
                    placeholder="Ex: Lucas Gabriel"
                    required
                  />
                </div>

                <div>
                  <label className="form-label-modern">Data de Nascimento / Idade</label>
                  <input 
                    type="date" 
                    className="input-modern"
                    value={quickCheckinForm.birthdate} 
                    onChange={e => {
                      const bdate = e.target.value;
                      const age = calculateAge(bdate);
                      setQuickCheckinForm({ 
                        ...quickCheckinForm, 
                        birthdate: bdate,
                        room_id: getSuggestedRoomForAge(age)
                      });
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="form-label-modern">Sala / Turma Destino *</label>
                  <select 
                    className="select-modern"
                    value={quickCheckinForm.room_id} 
                    onChange={e => setQuickCheckinForm({ ...quickCheckinForm, room_id: e.target.value })}
                    required
                  >
                    <option value="">Selecione a Sala</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.icon} {r.name} ({r.min_age} a {r.max_age} anos)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label-modern">Alergias Alimentares (Opcional)</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={quickCheckinForm.allergies} 
                    onChange={e => setQuickCheckinForm({ ...quickCheckinForm, allergies: e.target.value })}
                    placeholder="Ex: Lactose, Amendoim, Glúten..."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label className="form-label-modern">Nome do Responsável *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={quickCheckinForm.parent_name} 
                    onChange={e => setQuickCheckinForm({ ...quickCheckinForm, parent_name: e.target.value })}
                    placeholder="Ex: Mariana Silva"
                    required
                  />
                </div>

                <div>
                  <label className="form-label-modern">WhatsApp do Responsável *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={quickCheckinForm.parent_phone} 
                    onChange={e => setQuickCheckinForm({ ...quickCheckinForm, parent_phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </div>

              {/* Opção para Visitantes: Salvar no cadastro permanente de membros */}
              {checkinMode === 'VISITOR' && (
                <div style={{ marginBottom: 16, background: '#f8fafc', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox"
                    id="reg_member"
                    checked={quickCheckinForm.register_as_member}
                    onChange={e => setQuickCheckinForm({ ...quickCheckinForm, register_as_member: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="reg_member" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer' }}>
                    Salvar automaticamente os dados deste visitante na base de membros/visitantes para os próximos cultos
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.90rem' }}>
                  <CheckIcon /> Concluir Check-in & Gerar Crachá
                </button>
              </div>
            </form>

            {/* Resultado do Check-in com Crachá de Impressão */}
            {checkinSuccessData && (
              <div style={{ marginTop: 24, padding: 20, background: '#ecfdf5', border: '2px dashed #059669', borderRadius: 16, textAlign: 'center' }}>
                <div style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
                  ✅ Check-in Concluído com Sucesso!
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0 10px 0' }}>
                  {checkinSuccessData.child_name}
                </h2>
                <div style={{ display: 'inline-block', background: '#ffffff', border: '2px solid #059669', padding: '10px 24px', borderRadius: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: '0.70rem', fontWeight: 800, color: '#64748b' }}>CÓDIGO DE SEGURANÇA (PIN)</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#059669', letterSpacing: '0.08em' }}>
                    {checkinSuccessData.security_code}
                  </div>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#065f46', margin: 0 }}>
                  Sala: <strong>{checkinSuccessData.room_name}</strong> • Responsável: <strong>{checkinSuccessData.parent_name}</strong> {checkinSuccessData.parent_member_id && '✓ Membro'}
                </p>
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 10 }}>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => window.print()}
                    style={{ fontSize: '0.78rem' }}
                  >
                    🖨️ Imprimir Etiqueta
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={() => setCheckinSuccessData(null)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Novo Check-in
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: CENTRAL DE CHAMADOS
          ======================================================== */}
      {activeTab === 'chamados' && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              📢 Central de Chamados de Pais em Tempo Real
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: 4 }}>
              Acompanhe as solicitações ativas dos educadores para comparecimento dos pais nas salas.
            </p>
          </div>

          {activeCheckinsCalling.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#ffffff', borderRadius: 16, border: '1px dashed var(--panel-border)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✨</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Nenhum chamado ativo no momento</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: 4 }}>
                Todas as crianças estão tranquilas nas salas com seus respectivos educadores.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {activeCheckinsCalling.map(c => (
                <div 
                  key={c.id}
                  className="portal-card"
                  style={{
                    margin: 0,
                    padding: 16,
                    borderLeft: '6px solid #ef4444',
                    background: '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.72rem', fontWeight: 900, padding: '2px 8px', borderRadius: 6 }}>
                        🚨 CHAMADO ATIVO
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        Sala: <strong>{c.room_name}</strong>
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: '2px 0' }}>
                      {c.child_name} <span style={{ fontSize: '0.90rem', color: '#64748b', fontWeight: 600 }}>({c.security_code})</span>
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: '#b45309', fontWeight: 700, marginTop: 4 }}>
                      Motivo: {c.call_reason} {c.call_message ? `• "${c.call_message}"` : ''}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
                      Responsável: <strong>{c.parent_name}</strong> ({c.parent_phone})
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <a
                      href={`https://wa.me/55${c.parent_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${c.parent_name}, estamos na sala ${c.room_name} com ${c.child_name} e precisamos do seu comparecimento. Motivo: ${c.call_reason}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: '#25d366',
                        color: '#ffffff',
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: '0.80rem',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span>💬</span> WhatsApp Direto
                    </a>

                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleResolveCall(c.id)}
                      style={{ fontSize: '0.80rem', padding: '8px 14px' }}
                    >
                      <CheckIcon /> Pais Compareceram / Resolver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 4: BASE DE FAMÍLIAS & MEMBROS INTEGRADOS
          ======================================================== */}
      {activeTab === 'familias' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                👨‍👩‍👧‍👦 Famílias & Membros Vinculados
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: 4 }}>
                Visualize as crianças agrupadas diretamente por seus pais cadastrados na base de membros.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="search-pill" style={{ width: 260 }}>
                <SearchIcon />
                <input 
                  type="text" 
                  placeholder="Buscar família ou membro..." 
                  onChange={e => loadFamilies(e.target.value)}
                />
              </div>

              <button 
                type="button" 
                className="btn-primary"
                onClick={() => {
                  setChildForm({
                    name: '',
                    birthdate: '',
                    gender: 'M',
                    allergies: '',
                    medical_notes: '',
                    general_notes: '',
                    parent_name: '',
                    parent_phone: '',
                    parent_email: '',
                    parent_member_id: '',
                    is_visitor: false
                  });
                  setIsChildModalOpen(true);
                }}
              >
                <PlusIcon /> Vincular Criança
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {families.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, background: '#ffffff', borderRadius: 14, border: '1px dashed var(--panel-border)', color: 'var(--text-muted)' }}>
                Nenhum membro encontrado com os filtros atuais.
              </div>
            ) : (
              families.map(fam => (
                <div 
                  key={fam.id}
                  className="portal-card"
                  style={{
                    margin: 0,
                    padding: 16,
                    background: '#ffffff',
                    border: '1px solid var(--panel-border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'var(--accent-primary-gradient)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.1rem'
                      }}>
                        {fam.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)' }}>{fam.name}</span>
                          <span style={{ fontSize: '0.70rem', background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: 6, fontWeight: 800 }}>
                            {fam.role}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          📱 {fam.phone || 'Sem telefone'} • ✉️ {fam.email}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        setChildForm({
                          name: '',
                          birthdate: '',
                          gender: 'M',
                          allergies: '',
                          medical_notes: '',
                          general_notes: '',
                          parent_name: fam.name,
                          parent_phone: fam.phone || '',
                          parent_email: fam.email || '',
                          parent_member_id: fam.id,
                          is_visitor: false
                        });
                        setIsChildModalOpen(true);
                      }}
                      style={{ fontSize: '0.78rem', fontWeight: 800 }}
                    >
                      + Adicionar Filho a {fam.name.split(' ')[0]}
                    </button>
                  </div>

                  {/* Lista de Filhos Desta Família */}
                  {fam.children.length === 0 ? (
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      Nenhuma criança vinculada a esta família ainda.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                      {fam.children.map(ch => {
                        const age = calculateAge(ch.birthdate);
                        return (
                          <div 
                            key={ch.id}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: 10,
                              padding: '10px 12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                                👶 {ch.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                {age !== null ? `${age} anos` : 'Idade N/I'} {ch.allergies ? `• ⚠️ ${ch.allergies}` : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="link-btn"
                              onClick={() => {
                                setChildForm({
                                  ...ch,
                                  parent_name: fam.name,
                                  parent_phone: fam.phone,
                                  parent_email: fam.email,
                                  parent_member_id: fam.id
                                });
                                setIsChildModalOpen(true);
                              }}
                              style={{ fontSize: '0.72rem' }}
                            >
                              Editar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: CONFIGURAR SALAS & TURMAS
          ======================================================== */}
      {activeTab === 'config_salas' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                🏫 Salas & Turmas do Ministério Infantil
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: 4 }}>
                Configure as faixas etárias, capacidades e identidade visual de cada turma.
              </p>
            </div>

            <button 
              type="button" 
              className="btn-primary"
              onClick={() => {
                setRoomForm({
                  name: '',
                  min_age: 0,
                  max_age: 12,
                  capacity: 25,
                  color: '#0f766e',
                  icon: '👶',
                  description: ''
                });
                setIsRoomModalOpen(true);
              }}
            >
              <PlusIcon /> Nova Sala
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {rooms.map(r => (
              <div 
                key={r.id}
                className="portal-card"
                style={{
                  margin: 0,
                  padding: 16,
                  borderLeft: `5px solid ${r.color || '#0f766e'}`,
                  background: '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.4rem' }}>{r.icon || '👶'}</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>{r.name}</h4>
                  </div>
                  <button 
                    type="button" 
                    className="link-btn"
                    onClick={() => {
                      setRoomForm(r);
                      setIsRoomModalOpen(true);
                    }}
                  >
                    Editar
                  </button>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 10px 0' }}>
                  {r.description || 'Turma do Ministério Infantil'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
                  <span>Idade: <strong>{r.min_age} a {r.max_age} anos</strong></span>
                  <span>Capacidade: <strong>{r.capacity} crianças</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CHAMAR PAIS (ALERTA NO APP & WHATSAPP)
          ======================================================== */}
      {isCallModalOpen && selectedCheckinForAction && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setIsCallModalOpen(false)}>
          <form className="modal-studio-container" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()} onSubmit={handleCallParent}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                  <AlertBellIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">Chamar Responsáveis</h2>
                  <p className="modal-studio-subtitle">Dispare um alerta sonoro e visual no app dos pais.</p>
                </div>
              </div>
              <button type="button" className="modal-close-circle" onClick={() => setIsCallModalOpen(false)}>✕</button>
            </div>

            <div className="modal-studio-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.80rem', color: '#64748b' }}>Criança:</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  {selectedCheckinForAction.child_name}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                  Pais: <strong>{selectedCheckinForAction.parent_name}</strong> • WhatsApp: <strong>{selectedCheckinForAction.parent_phone}</strong>
                </div>
              </div>

              <div>
                <label className="form-label-modern">Motivo da Chamada *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                  {[
                    { id: 'CHORO', label: '😭 Choro Inconsolável' },
                    { id: 'FRALDA', label: '🍼 Fralda / Banheiro' },
                    { id: 'FEBRE', label: '💊 Febre / Não Passando Bem' },
                    { id: 'COMPARECER_SALA', label: '🚸 Comparecer à Sala' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCallReason(m.id)}
                      style={{
                        background: callReason === m.id ? '#fee2e2' : '#f8fafc',
                        color: callReason === m.id ? '#b91c1c' : 'var(--text-main)',
                        border: callReason === m.id ? '2px solid #ef4444' : '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '10px 8px',
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label-modern">Mensagem Personalizada (Opcional)</label>
                <input 
                  type="text" 
                  className="input-modern"
                  value={callCustomMessage} 
                  onChange={e => setCallCustomMessage(e.target.value)}
                  placeholder="Ex: Pode trazer a mamadeira / troca de roupa..."
                />
              </div>
            </div>

            <div className="modal-studio-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href={`https://wa.me/55${selectedCheckinForAction.parent_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${selectedCheckinForAction.parent_name}, estamos na sala ${selectedCheckinForAction.room_name} com ${selectedCheckinForAction.child_name} e precisamos do seu comparecimento.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#25d366',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>💬</span> WhatsApp
              </a>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCallModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ background: '#b91c1c' }} disabled={callingSaving}>
                  {callingSaving ? "Disparando..." : "🚨 Disparar Alerta"}
                </button>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: CHECKOUT COM VALIDAÇÃO DE SEGURANÇA (PIN)
          ======================================================== */}
      {isCheckoutModalOpen && selectedCheckinForAction && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setIsCheckoutModalOpen(false)}>
          <form className="modal-studio-container" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()} onSubmit={handlePerformCheckout}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: '#f0fdf4', color: '#15803d' }}>
                  <ShieldCheckIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">Checkout de Segurança</h2>
                  <p className="modal-studio-subtitle">Valide o PIN do crachá do responsável.</p>
                </div>
              </div>
              <button type="button" className="modal-close-circle" onClick={() => setIsCheckoutModalOpen(false)}>✕</button>
            </div>

            <div className="modal-studio-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Liberando a criança:</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  {selectedCheckinForAction.child_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Responsável: <strong>{selectedCheckinForAction.parent_name}</strong>
                </div>
              </div>

              <div>
                <label className="form-label-modern" style={{ textAlign: 'center', display: 'block', fontSize: '0.84rem' }}>
                  Digite o Código PIN do Crachá do Pai:
                </label>
                <input 
                  type="text" 
                  className="input-modern"
                  value={checkoutInputPin} 
                  onChange={e => setCheckoutInputPin(e.target.value)}
                  placeholder="Ex: K-4829 ou 4829"
                  style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.1em' }}
                  required
                  autoFocus
                />
              </div>

              {checkoutError && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: 8, fontSize: '0.76rem', fontWeight: 700 }}>
                  {checkoutError}
                </div>
              )}
            </div>

            <div className="modal-studio-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsCheckoutModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" style={{ background: '#15803d' }}>
                <CheckIcon /> Validar PIN & Liberar
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: CADASTRO / EDIÇÃO DE CRIANÇA (VÍNCULO AO MEMBRO)
          ======================================================== */}
      {isChildModalOpen && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setIsChildModalOpen(false)}>
          <form className="modal-studio-container" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()} onSubmit={handleSaveChild}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
                  <BabyIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">{childForm.id ? 'Editar Criança' : 'Cadastrar Criança & Vincular Família'}</h2>
                  <p className="modal-studio-subtitle">Dados cadastrais, médicos e vínculos com a membresia.</p>
                </div>
              </div>
              <button type="button" className="modal-close-circle" onClick={() => setIsChildModalOpen(false)}>✕</button>
            </div>

            <div className="modal-studio-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label-modern">Nome Completo da Criança *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={childForm.name} 
                    onChange={e => setChildForm({ ...childForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label-modern">Data de Nascimento</label>
                  <input 
                    type="date" 
                    className="input-modern"
                    value={childForm.birthdate || ''} 
                    onChange={e => setChildForm({ ...childForm, birthdate: e.target.value })}
                  />
                </div>
              </div>

              {/* Vínculo de Membro Responsável */}
              <div>
                <label className="form-label-modern">Vincular ao Membro Responsável (Opcional)</label>
                <select 
                  className="select-modern"
                  value={childForm.parent_member_id || ''}
                  onChange={e => {
                    const selectedId = e.target.value;
                    const found = families.find(f => f.id === selectedId);
                    if (found) {
                      setChildForm({
                        ...childForm,
                        parent_member_id: found.id,
                        parent_name: found.name,
                        parent_phone: found.phone || childForm.parent_phone,
                        parent_email: found.email || childForm.parent_email,
                        is_visitor: false
                      });
                    } else {
                      setChildForm({ ...childForm, parent_member_id: '' });
                    }
                  }}
                >
                  <option value="">Selecione um Membro da Igreja (ou preencha abaixo para Visitante)</option>
                  {families.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.role}) - {f.phone || f.email}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label-modern">Nome do Pai / Mãe *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={childForm.parent_name} 
                    onChange={e => setChildForm({ ...childForm, parent_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label-modern">WhatsApp do Responsável *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={childForm.parent_phone} 
                    onChange={e => setChildForm({ ...childForm, parent_phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label-modern">Alergias Alimentares</label>
                <input 
                  type="text" 
                  className="input-modern"
                  value={childForm.allergies || ''} 
                  onChange={e => setChildForm({ ...childForm, allergies: e.target.value })}
                  placeholder="Ex: Alérgico a leite e amendoim..."
                />
              </div>

              <div>
                <label className="form-label-modern">Observações Médicas / Remédios</label>
                <textarea 
                  className="input-modern"
                  rows={2}
                  value={childForm.medical_notes || ''} 
                  onChange={e => setChildForm({ ...childForm, medical_notes: e.target.value })}
                  placeholder="Instruções de remédios ou necessidades especiais..."
                />
              </div>
            </div>

            <div className="modal-studio-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsChildModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">
                <CheckIcon /> Salvar Cadastro
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: SALA / TURMA
          ======================================================== */}
      {isRoomModalOpen && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setIsRoomModalOpen(false)}>
          <form className="modal-studio-container" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()} onSubmit={handleSaveRoom}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
                  <span>🏫</span>
                </div>
                <div>
                  <h2 className="modal-studio-title">{roomForm.id ? 'Editar Sala' : 'Nova Sala Kids'}</h2>
                  <p className="modal-studio-subtitle">Defina faixas etárias, ícone e capacidade.</p>
                </div>
              </div>
              <button type="button" className="modal-close-circle" onClick={() => setIsRoomModalOpen(false)}>✕</button>
            </div>

            <div className="modal-studio-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 10 }}>
                <div>
                  <label className="form-label-modern">Ícone</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={roomForm.icon} 
                    onChange={e => setRoomForm({ ...roomForm, icon: e.target.value })}
                    style={{ textAlign: 'center', fontSize: '1.2rem' }}
                  />
                </div>
                <div>
                  <label className="form-label-modern">Nome da Sala *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={roomForm.name} 
                    onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
                    placeholder="Ex: Maternal (3 a 5 anos)"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label-modern">Idade Mínima</label>
                  <input 
                    type="number" 
                    className="input-modern"
                    value={roomForm.min_age} 
                    onChange={e => setRoomForm({ ...roomForm, min_age: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label-modern">Idade Máxima</label>
                  <input 
                    type="number" 
                    className="input-modern"
                    value={roomForm.max_age} 
                    onChange={e => setRoomForm({ ...roomForm, max_age: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label-modern">Capacidade</label>
                  <input 
                    type="number" 
                    className="input-modern"
                    value={roomForm.capacity} 
                    onChange={e => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label-modern">Cor da Sala</label>
                <input 
                  type="color" 
                  value={roomForm.color || '#0f766e'} 
                  onChange={e => setRoomForm({ ...roomForm, color: e.target.value })}
                  style={{ width: '100%', height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                />
              </div>

              <div>
                <label className="form-label-modern">Descrição</label>
                <input 
                  type="text" 
                  className="input-modern"
                  value={roomForm.description || ''} 
                  onChange={e => setRoomForm({ ...roomForm, description: e.target.value })}
                  placeholder="Ex: Bebês de colo e atividades sensoriais"
                />
              </div>
            </div>

            <div className="modal-studio-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsRoomModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">
                <CheckIcon /> Salvar Sala
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Modal de Crachá Digital & QR Code de Check-in */}
      <KidsBadgeModal
        isOpen={!!checkinSuccessData}
        onClose={() => setCheckinSuccessData(null)}
        badge={checkinSuccessData}
      />

      {/* Modal de Scanner de Câmera para Devolução com QR Code */}
      <KidsQrScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => {
          setIsScannerModalOpen(false);
          setScannerTargetChild(null);
        }}
        onScanSuccess={handleScanSuccessCheckout}
        childName={scannerTargetChild?.child_name}
      />

    </div>
  );
};

export default KidsMinistry;
