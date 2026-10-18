import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

interface PastoralMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  member_since: string;
  cell_id: string;
  cell_name: string;
  meeting_day: string;
  meeting_time: string;
  cell_neighborhood?: string;
  leader_name?: string;
  leader_phone?: string;
  last_present_date?: string;
  total_presences: number;
  weeks_absent: number;
  days_absent: number;
  never_attended: boolean;
  risk_tier: 'HEALTHY' | 'ATTENTION' | 'CRITICAL';
  last_care_date?: string;
  last_care_type?: string;
  last_care_summary?: string;
  last_caregiver_name?: string;
}

interface RadarSummary {
  total_cell_members: number;
  critical_count: number;
  attention_count: number;
  healthy_count: number;
  contacts_this_month: number;
}

interface CareLog {
  id: string;
  caregiver_name: string;
  contact_type: string;
  summary: string;
  scheduled_follow_up?: string;
  created_at: string;
}

interface CellLeaderReminder {
  cell_id: string;
  cell_name: string;
  meeting_day: string;
  meeting_time: string;
  leader_id: string;
  leader_name: string;
  leader_phone?: string;
  last_meeting_date?: string;
  days_since_last_meeting?: number;
  whatsapp_url?: string;
  message_text?: string;
}

interface PastoralCareRadarProps {
  selectedCampusId?: string;
  selectedOrganizationId?: string;
}

export const PastoralCareRadar: React.FC<PastoralCareRadarProps> = ({
  selectedCampusId = 'all',
  selectedOrganizationId = 'org_default'
}) => {
  const [members, setMembers] = useState<PastoralMember[]>([]);
  const [summary, setSummary] = useState<RadarSummary>({
    total_cell_members: 0,
    critical_count: 0,
    attention_count: 0,
    healthy_count: 0,
    contacts_this_month: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'CRITICAL' | 'ATTENTION' | 'HEALTHY'>('ALL');
  const [selectedCellFilter, setSelectedCellFilter] = useState<string>('all');

  // Modais
  const [careModalMember, setCareModalMember] = useState<PastoralMember | null>(null);
  const [historyModalMember, setHistoryModalMember] = useState<PastoralMember | null>(null);
  const [memberCareLogs, setMemberCareLogs] = useState<CareLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Lembretes semanais de líderes de célula
  const [remindersModalOpen, setRemindersModalOpen] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [cellLeaderReminders, setCellLeaderReminders] = useState<CellLeaderReminder[]>([]);

  // Form de Novo Cuidado
  const [contactType, setContactType] = useState('WHATSAPP');
  const [careSummary, setCareSummary] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [submittingCare, setSubmittingCare] = useState(false);

  const getAuthHeaders = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
    } catch (e) {
      return { 'Content-Type': 'application/json' };
    }
  };

  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (selectedOrganizationId) params.set('organization_id', selectedOrganizationId);
      if (selectedCampusId && selectedCampusId !== 'all') params.set('campus_id', selectedCampusId);

      const res = await fetch(`${API_URL}/pastoral/absenteeism-radar?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const memList = data.members || [];
        setMembers(memList);
        if (data.summary) {
          setSummary(data.summary);
        } else {
          setSummary({
            total_cell_members: memList.length,
            critical_count: memList.filter((m: PastoralMember) => m.risk_tier === 'CRITICAL').length,
            attention_count: memList.filter((m: PastoralMember) => m.risk_tier === 'ATTENTION').length,
            healthy_count: memList.filter((m: PastoralMember) => m.risk_tier === 'HEALTHY').length,
            contacts_this_month: 0
          });
        }
      } else {
        setMembers([]);
        setSummary({
          total_cell_members: 0,
          critical_count: 0,
          attention_count: 0,
          healthy_count: 0,
          contacts_this_month: 0
        });
      }
    } catch (err) {
      console.error('Erro ao carregar radar:', err);
      setMembers([]);
      setSummary({
        total_cell_members: 0,
        critical_count: 0,
        attention_count: 0,
        healthy_count: 0,
        contacts_this_month: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadarData();
  }, [selectedCampusId, selectedOrganizationId]);

  // Lista única de células para filtro
  const availableCells = Array.from(new Set(members.map(m => m.cell_name))).sort();

  // Filtragem
  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.phone && m.phone.includes(searchTerm)) ||
      (m.cell_name && m.cell_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTier = tierFilter === 'ALL' || m.risk_tier === tierFilter;
    const matchesCell = selectedCellFilter === 'all' || m.cell_name === selectedCellFilter;

    return matchesSearch && matchesTier && matchesCell;
  });

  const handleOpenCareModal = (member: PastoralMember) => {
    setCareModalMember(member);
    setCareSummary('');
    setContactType('WHATSAPP');
    setFollowUpDate('');
  };

  const handleOpenHistoryModal = async (member: PastoralMember) => {
    setHistoryModalMember(member);
    setLoadingLogs(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pastoral/care-logs/${member.id}`, { headers });
      if (res.ok) {
        const logs = await res.json();
        setMemberCareLogs(logs);
      } else {
        setMemberCareLogs([]);
      }
    } catch (e) {
      setMemberCareLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSaveCareLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!careModalMember || !careSummary.trim() || submittingCare) return;

    setSubmittingCare(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pastoral/care-logs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          member_id: careModalMember.id,
          contact_type: contactType,
          summary: careSummary,
          scheduled_follow_up: followUpDate || null
        })
      });

      if (res.ok) {
        alert(`✓ Contato pastoral com ${careModalMember.name} registrado com sucesso!`);
        setCareModalMember(null);
        fetchRadarData(); // Atualiza dados
      } else {
        alert('Não foi possível salvar o contato.');
      }
    } catch (err) {
      alert('Erro ao salvar contato pastoral.');
    } finally {
      setSubmittingCare(false);
    }
  };

  const generateWhatsAppLink = (member: PastoralMember) => {
    const cleanPhone = (member.phone || '').replace(/\D/g, '');
    const firstName = member.name.split(' ')[0];
    const text = encodeURIComponent(
      `Olá ${firstName}, a paz do Senhor! Sentimos muito a sua falta na nossa ${member.cell_name}. Estamos em constante oração por você, como você está? Podemos orar por algum motivo específico hoje?`
    );
    return `https://wa.me/55${cleanPhone}?text=${text}`;
  };

  const handleFetchCellReminders = async () => {
    setLoadingReminders(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pastoral/remind-cell-leaders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          organization_id: selectedOrganizationId,
          campus_id: selectedCampusId !== 'all' ? selectedCampusId : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCellLeaderReminders(data.reminders || []);
        setRemindersModalOpen(true);
      } else {
        alert('Não foi possível gerar a lista de cobrança de relatórios.');
      }
    } catch (e) {
      alert('Erro ao conectar ao servidor para buscar líderes com relatórios pendentes.');
    } finally {
      setLoadingReminders(false);
    }
  };

  return (
    <div className="pastoral-radar-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* CABEÇALHO DO MÓDULO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.75rem' }}>🛡️</span>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
              Radar de Cuidado & Retenção Pastoral
            </h1>
          </div>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted, #64748b)', fontSize: '0.92rem' }}>
            Identifique ausências em células, previna a evasão de membros e realize contatos acolhedores em 1 clique.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleFetchCellReminders}
            disabled={loadingReminders}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#0f766e',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <span>📋</span>
            <span>{loadingReminders ? 'Verificando...' : 'Cobrar Relatórios da Semana'}</span>
          </button>

          <button
            onClick={fetchRadarData}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <span>🔄</span>
            <span>{loading ? 'Atualizando...' : 'Recarregar Radar'}</span>
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS EM SEMÁFORO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        {/* Total Membros */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          padding: '18px 20px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Membros em Células
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
            {summary.total_cell_members}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
            Base ativa vinculada a pequenos grupos
          </div>
        </div>

        {/* 🟢 Engajados */}
        <div 
          onClick={() => setTierFilter(tierFilter === 'HEALTHY' ? 'ALL' : 'HEALTHY')}
          style={{
            background: tierFilter === 'HEALTHY' ? '#ecfdf5' : '#ffffff',
            padding: '18px 20px',
            borderRadius: '16px',
            border: tierFilter === 'HEALTHY' ? '2px solid #10b981' : '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
              🟢 Frequência em Dia
            </span>
            <span style={{ fontSize: '0.75rem', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>
              0-1 falta
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
            {summary.healthy_count}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '4px' }}>
            Engajamento pleno e constante
          </div>
        </div>

        {/* 🟡 Atenção Pastoral */}
        <div 
          onClick={() => setTierFilter(tierFilter === 'ATTENTION' ? 'ALL' : 'ATTENTION')}
          style={{
            background: tierFilter === 'ATTENTION' ? '#fffbeb' : '#ffffff',
            padding: '18px 20px',
            borderRadius: '16px',
            border: tierFilter === 'ATTENTION' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
              🟡 Atenção Pastoral
            </span>
            <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>
              2 a 3 faltas
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
            {summary.attention_count}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px' }}>
            Momento ideal para mensagem acolhedora
          </div>
        </div>

        {/* 🔴 Risco Crítico */}
        <div 
          onClick={() => setTierFilter(tierFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          style={{
            background: tierFilter === 'CRITICAL' ? '#fef2f2' : '#ffffff',
            padding: '18px 20px',
            borderRadius: '16px',
            border: tierFilter === 'CRITICAL' ? '2px solid #ef4444' : '1px solid #fee2e2',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
              🔴 Risco de Evasão
            </span>
            <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '20px', fontWeight: 700 }}>
              4+ semanas
            </span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
            {summary.critical_count}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '4px' }}>
            Exige intervenção pastoral direta
          </div>
        </div>

        {/* Contatos Realizados */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)',
          padding: '18px 20px',
          borderRadius: '16px',
          border: '1px solid #ccfbf1',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
            💬 Cuidados no Mês
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f766e', marginTop: '6px' }}>
            {summary.contacts_this_month}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#115e59', marginTop: '4px' }}>
            Ligações, visitas e mensagens registradas
          </div>
        </div>

      </div>

      {/* FILTROS E BUSCA */}
      <div style={{
        background: '#ffffff',
        padding: '16px 20px',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1 }}>
          {/* Busca por Texto */}
          <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por membro, telefone ou célula..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Filtro por Célula */}
          <select
            value={selectedCellFilter}
            onChange={e => setSelectedCellFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.88rem',
              color: '#334155',
              background: '#ffffff',
              outline: 'none'
            }}
          >
            <option value="all">Todas as Células ({availableCells.length})</option>
            {availableCells.map(cell => (
              <option key={cell} value={cell}>{cell}</option>
            ))}
          </select>
        </div>

        {/* Seletor de Semáforo / Tier */}
        <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'CRITICAL', label: '🔴 Risco (4+)' },
            { id: 'ATTENTION', label: '🟡 Atenção (2-3)' },
            { id: 'HEALTHY', label: '🟢 Em Dia' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTierFilter(f.id as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: tierFilter === f.id ? '#ffffff' : 'transparent',
                color: tierFilter === f.id ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: tierFilter === f.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DO RADAR */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔄</div>
            <div>Carregando métricas de frequência e evasão...</div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
            <div style={{ fontWeight: 700, color: '#334155' }}>Nenhum membro encontrado com os filtros selecionados.</div>
            <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Tente alterar o filtro de risco ou limpar a busca.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 18px' }}>Membro</th>
                  <th style={{ padding: '14px 18px' }}>Célula & Liderança</th>
                  <th style={{ padding: '14px 18px' }}>Tempo sem Comparecer</th>
                  <th style={{ padding: '14px 18px' }}>Último Cuidado Pastoral</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Ação Imediata</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => {
                  const isCritical = member.risk_tier === 'CRITICAL';
                  const isAttention = member.risk_tier === 'ATTENTION';

                  return (
                    <tr 
                      key={member.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s',
                        background: isCritical ? '#fffbfa' : '#ffffff'
                      }}
                    >
                      {/* Membro */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: isCritical ? '#fee2e2' : (isAttention ? '#fef3c7' : '#e0f2fe'),
                            color: isCritical ? '#991b1b' : (isAttention ? '#92400e' : '#0369a1'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.9rem'
                          }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                              {member.name}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                              📱 {member.phone || 'Sem celular'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Célula & Líder */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>
                          {member.cell_name}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                          Líder: {member.leader_name || 'Não atribuído'}
                          {member.cell_neighborhood && ` • ${member.cell_neighborhood}`}
                        </div>
                      </td>

                      {/* Semáforo / Tempo Ausente */}
                      <td style={{ padding: '14px 18px' }}>
                        {isCritical ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem' }}>
                            <span>🔴</span>
                            <span>{member.weeks_absent} semanas sem ir</span>
                          </div>
                        ) : isAttention ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem' }}>
                            <span>🟡</span>
                            <span>{member.weeks_absent} semanas ausente</span>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem' }}>
                            <span>🟢</span>
                            <span>Em dia ({member.weeks_absent === 0 ? 'Presente recente' : '1 falta'})</span>
                          </div>
                        )}
                        <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '4px' }}>
                          {member.last_present_date 
                            ? `Última presença: ${new Date(member.last_present_date).toLocaleDateString('pt-BR')}`
                            : 'Sem presenças registradas'}
                        </div>
                      </td>

                      {/* Último Cuidado Pastoral */}
                      <td style={{ padding: '14px 18px' }}>
                        {member.last_care_date ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>
                                {member.last_care_type}
                              </span>
                              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                                {new Date(member.last_care_date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div style={{ color: '#334155', fontSize: '0.78rem', marginTop: '4px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={member.last_care_summary}>
                              "{member.last_care_summary}"
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontStyle: 'italic' }}>
                            Nenhum contato registrado
                          </span>
                        )}
                      </td>

                      {/* Ação Imediata */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          
                          {/* Botão WhatsApp */}
                          {member.phone ? (
                            <a
                              href={generateWhatsAppLink(member)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Abrir WhatsApp com mensagem de carinho pronta"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#22c55e',
                                color: '#ffffff',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                boxShadow: '0 2px 4px rgba(34, 197, 94, 0.25)'
                              }}
                            >
                              <span>💬</span>
                              <span>WhatsApp</span>
                            </a>
                          ) : null}

                          {/* Botão Registrar Cuidado */}
                          <button
                            onClick={() => handleOpenCareModal(member)}
                            title="Registrar ligação, visita ou motivo do afastamento"
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            + Cuidado
                          </button>

                          {/* Botão Histórico */}
                          <button
                            onClick={() => handleOpenHistoryModal(member)}
                            title="Ver histórico de contatos anteriores"
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              color: '#64748b',
                              padding: '8px 10px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            📜
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================
          MODAL: REGISTRAR CUIDADO PASTORAL
          ========================================================= */}
      {careModalMember && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>📝</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Registrar Cuidado Pastoral
                </h3>
              </div>
              <button
                onClick={() => setCareModalMember(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#334155' }}>
              <div><strong>Membro:</strong> {careModalMember.name}</div>
              <div><strong>Célula:</strong> {careModalMember.cell_name} • Líder: {careModalMember.leader_name}</div>
              <div style={{ marginTop: '4px', color: careModalMember.risk_tier === 'CRITICAL' ? '#dc2626' : '#d97706', fontWeight: 700 }}>
                Status: {careModalMember.weeks_absent} semanas sem comparecer
              </div>
            </div>

            <form onSubmit={handleSaveCareLog} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Tipo de Contato */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Canal de Contato Realizado
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
                    { id: 'PHONE_CALL', label: 'Ligação', icon: '📞' },
                    { id: 'IN_PERSON_VISIT', label: 'Visita', icon: '🏠' },
                    { id: 'PRAYER', label: 'Oração', icon: '🙏' }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setContactType(c.id)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '10px',
                        border: contactType === c.id ? '2px solid #0f766e' : '1px solid #cbd5e1',
                        background: contactType === c.id ? '#f0fdfa' : '#ffffff',
                        color: contactType === c.id ? '#0f766e' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div>{c.icon}</div>
                      <div style={{ marginTop: '2px' }}>{c.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumo da Conversa */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Resumo Pastoral & Motivo do Afastamento *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Ex: Liguei para o irmão, ele explicou que está com a mãe doente no hospital. Pediu oração e disse que voltará na célula assim que ela tiver alta..."
                  value={careSummary}
                  onChange={e => setCareSummary(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Agendamento de Retorno */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Agendar Próximo Contato Pastoral (Opcional)
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCareModalMember(null)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCare}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(15, 118, 110, 0.3)'
                  }}
                >
                  {submittingCare ? 'Salvando...' : 'Salvar Registro Pastoral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL: HISTÓRICO DE CUIDADO PASTORAL
          ========================================================= */}
      {historyModalMember && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Histórico Pastoral: {historyModalMember.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  {historyModalMember.cell_name}
                </div>
              </div>
              <button
                onClick={() => setHistoryModalMember(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {loadingLogs ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Carregando histórico de acompanhamentos...
                </div>
              ) : memberCareLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🕊️</div>
                  <div>Nenhum contato registrado anteriormente para este membro.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {memberCareLogs.map(log => (
                    <div 
                      key={log.id} 
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                          {log.contact_type}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {new Date(log.created_at).toLocaleDateString('pt-BR')} às {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ color: '#1e293b', fontSize: '0.88rem', marginTop: '8px', lineHeight: 1.5 }}>
                        "{log.summary}"
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                        Registrado por: <strong>{log.caregiver_name || 'Liderança'}</strong>
                        {log.scheduled_follow_up && (
                          <span style={{ marginLeft: '10px', color: '#0f766e', fontWeight: 700 }}>
                            📅 Retorno previsto: {new Date(log.scheduled_follow_up).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <button
                onClick={() => {
                  const m = historyModalMember;
                  setHistoryModalMember(null);
                  handleOpenCareModal(m);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#0f766e',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                + Adicionar Novo Contato
              </button>
              <button
                onClick={() => setHistoryModalMember(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COBRANÇA DE RELATÓRIOS DA SEMANA PARA LÍDERES DE CÉLULA */}
      {remindersModalOpen && (
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
            borderRadius: '18px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📋</span> Relatórios de Célula Pendentes na Semana
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Líderes cujas células não registraram ata/chamada nos últimos 7 dias.
                </p>
              </div>
              <button
                onClick={() => setRemindersModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cellLeaderReminders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#059669' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700 }}>Tudo em dia!</h4>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                    Todas as células ativas enviaram relatórios de presença nos últimos 7 dias.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', color: '#0f766e' }}>
                    💡 <strong>{cellLeaderReminders.length} célula(s)</strong> sem registro de reunião recente. Clique no botão de WhatsApp para disparar a cobrança carinhosa pré-formatada.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cellLeaderReminders.map(rem => (
                      <div
                        key={rem.cell_id}
                        style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                              {rem.cell_name}
                            </span>
                            <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                              {rem.days_since_last_meeting != null ? `${rem.days_since_last_meeting}d sem ata` : 'Sem ata recente'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                            Líder: <strong>{rem.leader_name}</strong> {rem.leader_phone && `(${rem.leader_phone})`} • {rem.meeting_day} às {rem.meeting_time}
                          </div>
                        </div>

                        {rem.whatsapp_url ? (
                          <a
                            href={rem.whatsapp_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              borderRadius: '8px',
                              background: '#25D366',
                              color: '#ffffff',
                              textDecoration: 'none',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 4px rgba(37, 211, 102, 0.2)'
                            }}
                          >
                            <span>💬</span> Cobrar no WhatsApp
                          </a>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                            Sem telefone
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button
                onClick={() => setRemindersModalOpen(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
