import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export interface ChurchVisitor {
  id: string;
  organization_id: string;
  campus_id?: string;
  name: string;
  phone: string;
  email?: string;
  neighborhood?: string;
  origin_channel: string;
  stage: 'NEW' | 'CONTACTED_24H' | 'REFERRED_TO_CELL' | 'ATTENDING_CELL' | 'INTEGRATED_MEMBER' | 'ARCHIVED';
  assigned_cell_id?: string;
  assigned_leader_id?: string;
  first_visit_date: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  days_since_first_visit?: number;
  cell_name?: string;
  cell_day?: string;
  cell_time?: string;
  cell_neighborhood?: string;
  leader_name?: string;
  leader_phone?: string;
}

interface CellGroupOption {
  id: string;
  name: string;
  neighborhood?: string;
  meeting_day?: string;
  meeting_time?: string;
  leader_name?: string;
  leader_phone?: string;
}

interface ExecutiveReportData {
  visitor_funnel: {
    total_visitors?: number;
    stage_new?: number;
    stage_contacted?: number;
    stage_referred?: number;
    stage_attending?: number;
    stage_integrated?: number;
  };
  cell_rankings: Array<{
    id: string;
    name: string;
    meeting_day: string;
    neighborhood?: string;
    leader_name?: string;
    total_members: number;
    total_attendances_30d: number;
    meetings_count_30d: number;
  }>;
  care_metrics: Array<{
    contact_type: string;
    count: number;
  }>;
}

interface VisitorsFunnelProps {
  selectedCampusId?: string;
  selectedOrganization?: {
    id: string;
    name: string;
    slug?: string;
  };
}

const STAGES = [
  { key: 'NEW', title: 'Novos Visitantes', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', desc: 'Aguardando 1º contato' },
  { key: 'CONTACTED_24H', title: 'Contatados (24h)', color: '#d97706', bg: '#fffbeb', border: '#fde68a', desc: 'Boas-vindas enviada' },
  { key: 'REFERRED_TO_CELL', title: 'Encaminhados p/ Célula', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', desc: 'Líder conectado' },
  { key: 'ATTENDING_CELL', title: 'Frequentando Célula', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', desc: 'Participando ativamente' },
  { key: 'INTEGRATED_MEMBER', title: 'Membro Integrado', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', desc: 'Pronto p/ integração' },
] as const;

export const VisitorsFunnel: React.FC<VisitorsFunnelProps> = ({
  selectedCampusId = 'all',
  selectedOrganization
}) => {
  const [visitors, setVisitors] = useState<ChurchVisitor[]>([]);
  const [cellGroups, setCellGroups] = useState<CellGroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<ChurchVisitor | null>(null);

  // Form de novo visitante
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newOrigin, setNewOrigin] = useState('SUNDAY_SERVICE');
  const [newNotes, setNewNotes] = useState('');
  const [savingVisitor, setSavingVisitor] = useState(false);

  // Encaminhamento de Célula
  const [selectedCellId, setSelectedCellId] = useState('');
  const [referSuccessData, setReferSuccessData] = useState<any>(null);
  const [savingReferral, setSavingReferral] = useState(false);

  // Relatório Executivo
  const [reportData, setReportData] = useState<ExecutiveReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const orgId = selectedOrganization?.id || 'org_default';

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

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        organization_id: orgId
      });
      if (selectedCampusId && selectedCampusId !== 'all') {
        params.append('campus_id', selectedCampusId);
      }
      if (stageFilter !== 'ALL') {
        params.append('stage', stageFilter);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const res = await fetch(`${API_URL}/pastoral/visitors?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setVisitors(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar visitantes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCellGroups = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/cell-groups?organization_id=${orgId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.cell_groups || []);
        setCellGroups(list.map((cg: any) => ({
          id: cg.id,
          name: cg.name,
          neighborhood: cg.neighborhood,
          meeting_day: cg.meeting_day,
          meeting_time: cg.meeting_time,
          leader_name: cg.leader_name,
          leader_phone: cg.leader_phone
        })));
      }
    } catch (err) {
      console.error('Erro ao listar células:', err);
    }
  };

  const fetchExecutiveReport = async () => {
    setLoadingReport(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pastoral/executive-report?organization_id=${orgId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error('Erro ao buscar relatório executivo:', err);
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
    fetchCellGroups();
  }, [orgId, selectedCampusId, stageFilter]);

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Por favor informe pelo menos o nome e o WhatsApp do visitante.');
      return;
    }
    setSavingVisitor(true);
    try {
      const headers = await getAuthHeaders();
      const payload = {
        organization_id: orgId,
        campus_id: selectedCampusId === 'all' ? 'campus_sede' : selectedCampusId,
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
        neighborhood: newNeighborhood.trim() || undefined,
        origin_channel: newOrigin,
        notes: newNotes.trim() || undefined
      };

      const res = await fetch(`${API_URL}/pastoral/visitors`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewName('');
        setNewPhone('');
        setNewEmail('');
        setNewNeighborhood('');
        setNewNotes('');
        fetchVisitors();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Erro ao cadastrar visitante.');
      }
    } catch (err) {
      alert('Falha na comunicação com o servidor.');
    } finally {
      setSavingVisitor(false);
    }
  };

  const handleUpdateStage = async (visitorId: string, newStage: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pastoral/visitors/${visitorId}/stage`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ stage: newStage })
      });
      if (res.ok) {
        setVisitors(prev => prev.map(v => v.id === visitorId ? { ...v, stage: newStage as any } : v));
      }
    } catch (err) {
      console.error('Erro ao atualizar etapa:', err);
    }
  };

  const handleReferVisitor = async () => {
    if (!selectedVisitor || !selectedCellId) {
      alert('Selecione uma célula para encaminhar.');
      return;
    }
    setSavingReferral(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pastoral/visitors/${selectedVisitor.id}/refer`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ cell_group_id: selectedCellId })
      });
      if (res.ok) {
        const data = await res.json();
        setReferSuccessData(data);
        fetchVisitors();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Erro ao encaminhar visitante.');
      }
    } catch (err) {
      alert('Erro na requisição de encaminhamento.');
    } finally {
      setSavingReferral(false);
    }
  };

  const handleDeleteVisitor = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o visitante "${name}" do funil?`)) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pastoral/visitors/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setVisitors(prev => prev.filter(v => v.id !== id));
      }
    } catch (err) {
      console.error('Erro ao remover visitante:', err);
    }
  };

  const openWhatsAppToVisitor = (visitor: ChurchVisitor) => {
    const cleanPhone = (visitor.phone || '').replace(/\D/g, '');
    const churchName = selectedOrganization?.name || 'nossa igreja';
    const message = encodeURIComponent(
      `Olá, ${visitor.name}! 🕊️ Que alegria imensa ter recebido você no culto da ${churchName}! Esperamos de coração que tenha se sentido acolhido por Deus e por nossa família. Estamos aqui para o que precisar!`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const openWhatsAppToLeader = (info: any) => {
    const cleanPhone = (info.leader_phone || '').replace(/\D/g, '');
    const message = encodeURIComponent(
      `Paz do Senhor, Líder ${info.leader_name}! 🚀\n` +
      `Temos um novo visitante acolhido para a sua célula (${info.cell_name}):\n` +
      `👤 Nome: ${info.visitor_name}\n` +
      `📱 WhatsApp: ${info.visitor_phone}\n\n` +
      `Vamos fazer contato acolhedor e convidá-lo para o próximo encontro da célula!`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  // Estatísticas rápidas calculadas
  const totalVisitors = visitors.length;
  const newCount = visitors.filter(v => v.stage === 'NEW').length;
  const contactedCount = visitors.filter(v => v.stage === 'CONTACTED_24H').length;
  const referredCount = visitors.filter(v => v.stage === 'REFERRED_TO_CELL').length;
  const attendingCount = visitors.filter(v => v.stage === 'ATTENDING_CELL').length;
  const integratedCount = visitors.filter(v => v.stage === 'INTEGRATED_MEMBER').length;

  const publicWelcomeUrl = `${window.location.origin}/welcome?org=${selectedOrganization?.id || selectedOrganization?.slug || 'org_default'}`;

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
              🤝
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Funil de Visitantes & CRM de Acolhimento
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                Conexão intencional desde o primeiro culto até a integração plena nas células e membresia.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setShowReportModal(true); fetchExecutiveReport(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📊 Relatório Executivo
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              color: '#166534',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            📱 QR Code do Culto
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(37,99,235,0.3)'
            }}
          >
            + Novo Visitante
          </button>
        </div>
      </div>

      {/* CARDS DE RESUMO DO FUNIL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Ativos no Funil</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{totalVisitors}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Visitantes cadastrados</div>
        </div>

        <div style={{ background: '#eff6ff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>Aguardando Contato</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>{newCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '2px' }}>Meta: contatar em &lt;24h</div>
        </div>

        <div style={{ background: '#fffbeb', padding: '16px 20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase' }}>Contatados</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>{contactedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '2px' }}>Prontos p/ encaminhar</div>
        </div>

        <div style={{ background: '#f5f3ff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5b21b6', textTransform: 'uppercase' }}>Em Conexão Celular</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#6d28d9', marginTop: '4px' }}>{referredCount + attendingCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#7c3aed', marginTop: '2px' }}>Vinculados com líder</div>
        </div>

        <div style={{ background: '#ecfdf5', padding: '16px 20px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065f46', textTransform: 'uppercase' }}>Integrados como Membro</div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#047857', marginTop: '4px' }}>{integratedCount}</div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>
            {totalVisitors > 0 ? `${Math.round((integratedCount / totalVisitors) * 100)}% conversão` : '0%'}
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nome, WhatsApp ou bairro..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') fetchVisitors(); }}
          style={{
            flex: '1',
            minWidth: '260px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.88rem'
          }}
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            fontSize: '0.88rem',
            background: '#ffffff'
          }}
        >
          <option value="ALL">Todas as Etapas</option>
          {STAGES.map(s => (
            <option key={s.key} value={s.key}>{s.title}</option>
          ))}
        </select>
        <button
          onClick={fetchVisitors}
          style={{
            padding: '10px 16px',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Filtrar
        </button>
      </div>

      {/* PIPELINE KANBAN */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Carregando pipeline de acolhimento...</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(280px, 1fr))',
          gap: '16px',
          overflowX: 'auto',
          paddingBottom: '24px'
        }}>
          {STAGES.map(stage => {
            const stageVisitors = visitors.filter(v => v.stage === stage.key);
            return (
              <div
                key={stage.key}
                style={{
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: `1px solid ${stage.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 340px)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                {/* CABEÇALHO DA COLUNA */}
                <div style={{
                  padding: '14px 16px',
                  borderBottom: `2px solid ${stage.border}`,
                  background: stage.bg,
                  borderTopLeftRadius: '11px',
                  borderTopRightRadius: '11px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: stage.color }}>
                      {stage.title}
                    </span>
                    <span style={{
                      background: stage.color,
                      color: '#ffffff',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}>
                      {stageVisitors.length}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    {stage.desc}
                  </div>
                </div>

                {/* LISTA DE CARDS */}
                <div style={{
                  padding: '12px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flex: 1
                }}>
                  {stageVisitors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8', fontSize: '0.80rem' }}>
                      Nenhum visitante nesta etapa
                    </div>
                  ) : (
                    stageVisitors.map(visitor => {
                      const isOverdue = stage.key === 'NEW' && (visitor.days_since_first_visit || 0) >= 2;
                      return (
                        <div
                          key={visitor.id}
                          style={{
                            background: '#ffffff',
                            borderRadius: '10px',
                            padding: '14px',
                            border: isOverdue ? '1.5px solid #f87171' : '1px solid #e2e8f0',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          {/* ALERTA DE ATRASO */}
                          {isOverdue && (
                            <div style={{
                              background: '#fef2f2',
                              color: '#b91c1c',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.70rem',
                              fontWeight: 800,
                              display: 'inline-block',
                              alignSelf: 'flex-start'
                            }}>
                              ⚠️ Sem contato há {visitor.days_since_first_visit} dias!
                            </div>
                          )}

                          {/* NOME & DATA */}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                              {visitor.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                              1ª Visita: {visitor.first_visit_date ? new Date(visitor.first_visit_date).toLocaleDateString('pt-BR') : 'Hoje'}
                              {visitor.neighborhood && ` • 📍 ${visitor.neighborhood}`}
                            </div>
                          </div>

                          {/* CANAL & NOTAS */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{
                              background: '#f1f5f9',
                              color: '#475569',
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}>
                              {visitor.origin_channel === 'SUNDAY_SERVICE' ? 'Culto Domingo' : visitor.origin_channel}
                            </span>
                            {visitor.phone && (
                              <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600 }}>
                                📱 {visitor.phone}
                              </span>
                            )}
                          </div>

                          {/* SE ENCAMINHADO PARA CÉLULA */}
                          {visitor.cell_name && (
                            <div style={{
                              background: '#f5f3ff',
                              border: '1px solid #ddd6fe',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              fontSize: '0.72rem',
                              color: '#5b21b6'
                            }}>
                              <strong>Célula:</strong> {visitor.cell_name}
                              {visitor.leader_name && <div><strong>Líder:</strong> {visitor.leader_name}</div>}
                            </div>
                          )}

                          {visitor.notes && (
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', background: '#f8fafc', padding: '4px 6px', borderRadius: '4px' }}>
                              "{visitor.notes}"
                            </div>
                          )}

                          {/* BOTÕES DE AÇÃO DO CARD */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                            {visitor.phone && (
                              <button
                                onClick={() => openWhatsAppToVisitor(visitor)}
                                title="Enviar mensagem de boas-vindas no WhatsApp"
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  padding: '6px 8px',
                                  background: '#22c55e',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: '#ffffff',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                💬 WhatsApp
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedVisitor(visitor);
                                setReferSuccessData(null);
                                setShowReferModal(true);
                              }}
                              title="Encaminhar para uma célula próxima"
                              style={{
                                flex: 1,
                                padding: '6px 8px',
                                background: '#8b5cf6',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#ffffff',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              📍 Célula
                            </button>
                          </div>

                          {/* AVANÇAR ETAPA DROPDOWN */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Mover:</span>
                            <select
                              value={visitor.stage}
                              onChange={(e) => handleUpdateStage(visitor.id, e.target.value)}
                              style={{
                                flex: 1,
                                fontSize: '0.70rem',
                                padding: '4px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: '#ffffff'
                              }}
                            >
                              {STAGES.map(s => (
                                <option key={s.key} value={s.key}>{s.title}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleDeleteVisitor(visitor.id, visitor.name)}
                              title="Remover visitante"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '0.80rem',
                                padding: '2px 4px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL: CADASTRAR NOVO VISITANTE
          ======================================================== */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Novo Visitante no Acolhimento
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleCreateVisitor} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Silva"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Bairro / Cidade</label>
                  <input
                    type="text"
                    placeholder="Ex: Jardim Paulista"
                    value={newNeighborhood}
                    onChange={(e) => setNewNeighborhood(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>E-mail (opcional)</label>
                  <input
                    type="email"
                    placeholder="carlos@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Canal de Origem</label>
                  <select
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#fff' }}
                  >
                    <option value="SUNDAY_SERVICE">Culto de Domingo</option>
                    <option value="MEMBER_INVITE">Convidado por Membro</option>
                    <option value="EVENT">Evento Especial / Congresso</option>
                    <option value="SOCIAL_MEDIA">Redes Sociais (Instagram/YouTube)</option>
                    <option value="QR_CODE">QR Code Telão</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Pedido de Oração / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Pediu oração pela família e saúde. Gostaria de conhecer uma célula no bairro."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingVisitor}
                  style={{ padding: '10px 20px', background: '#2563eb', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#ffffff', cursor: 'pointer' }}
                >
                  {savingVisitor ? 'Cadastrando...' : 'Cadastrar no Funil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ENCAMINHAR PARA CÉLULA (COM WHATSAPP DO LÍDER)
          ======================================================== */}
      {showReferModal && selectedVisitor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                  Encaminhar Visitante para Célula
                </h3>
                <div style={{ fontSize: '0.80rem', color: '#64748b', marginTop: '2px' }}>
                  {selectedVisitor.name} {selectedVisitor.neighborhood ? `(Bairro: ${selectedVisitor.neighborhood})` : ''}
                </div>
              </div>
              <button onClick={() => setShowReferModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ padding: '24px' }}>
              {referSuccessData ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉</div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#166534', fontWeight: 800 }}>
                    Visitante Encaminhado com Sucesso!
                  </h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#475569' }}>
                    A etapa foi atualizada para <strong>Encaminhado para Célula</strong>. Notifique o líder agora para acolhimento imediato!
                  </p>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.80rem', color: '#64748b' }}>Célula Selecionada:</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{referSuccessData.cell_name}</div>
                    <div style={{ fontSize: '0.80rem', color: '#64748b', marginTop: '6px' }}>Líder Responsável:</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                      {referSuccessData.leader_name} ({referSuccessData.leader_phone || 'Sem telefone'})
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      onClick={() => openWhatsAppToLeader(referSuccessData)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: '#22c55e',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.90rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(34,197,94,0.3)'
                      }}
                    >
                      📲 Enviar Dados ao Líder no WhatsApp
                    </button>
                    <button
                      onClick={() => setShowReferModal(false)}
                      style={{
                        padding: '12px 20px',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#475569' }}>
                    Selecione a célula mais próxima da residência de <strong>{selectedVisitor.name}</strong> para que o líder faça contato e o integre ao grupo:
                  </p>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.80rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Célula de Destino:
                    </label>
                    <select
                      value={selectedCellId}
                      onChange={(e) => setSelectedCellId(e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.90rem', background: '#fff' }}
                    >
                      <option value="">Selecione uma célula...</option>
                      {cellGroups.map(cg => {
                        const isSameNeighborhood = selectedVisitor.neighborhood && cg.neighborhood && 
                          cg.neighborhood.toLowerCase().includes(selectedVisitor.neighborhood.toLowerCase());
                        return (
                          <option key={cg.id} value={cg.id}>
                            {cg.name} {cg.neighborhood ? `(${cg.neighborhood})` : ''} {isSameNeighborhood ? '⭐️ [Mesmo Bairro]' : ''} • Líder: {cg.leader_name || 'N/A'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowReferModal(false)}
                      style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleReferVisitor}
                      disabled={savingReferral || !selectedCellId}
                      style={{ padding: '10px 20px', background: '#8b5cf6', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#ffffff', cursor: 'pointer' }}
                    >
                      {savingReferral ? 'Encaminhando...' : 'Confirmar Encaminhamento'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: QR CODE E LINK PÚBLICO DO CULTO
          ======================================================== */}
      {showQrModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            padding: '28px'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📲</div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              QR Code de Acolhimento do Culto
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748b' }}>
              Projete no telão ou imprima nos cartões de boas-vindas para que os visitantes preencham seus dados pelo celular.
            </p>

            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicWelcomeUrl)}`}
                alt="QR Code de Boas Vindas"
                style={{ width: '180px', height: '180px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '12px' }}>
                Escaneie com a câmera do celular
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                readOnly
                value={publicWelcomeUrl}
                style={{ flex: 1, padding: '10px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc' }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicWelcomeUrl);
                  alert('Link copiado para a área de transferência!');
                }}
                style={{ padding: '10px 14px', background: '#0f766e', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.80rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Copiar
              </button>
              <a
                href={publicWelcomeUrl}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '10px 14px', background: '#0284c7', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.80rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Abrir ↗
              </a>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              style={{ padding: '10px 24px', background: '#f1f5f9', border: 'none', borderRadius: '8px', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: RELATÓRIO EXECUTIVO DE RETENÇÃO (PASTOR SENIOR)
          ======================================================== */}
      {showReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  📊 Relatório Executivo de Retenção & Conversão (90 Dias)
                </h3>
                <div style={{ fontSize: '0.80rem', color: '#64748b', marginTop: '2px' }}>
                  Visão consolidada para Pastores Seniores e Conselho Pastoral
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {loadingReport ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Gerando métricas consolidadas...</div>
              ) : reportData ? (
                <>
                  {/* FUNIL PERCENTUAL */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#334155' }}>
                      📈 Eficiência do Funil de Integração
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 700 }}>Total Recebidos</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8' }}>{reportData.visitor_funnel.total_visitors || 0}</div>
                        <div style={{ fontSize: '0.70rem', color: '#3b82f6' }}>100% entrada</div>
                      </div>
                      <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700 }}>Contatados 24h</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>{reportData.visitor_funnel.stage_contacted || 0}</div>
                        <div style={{ fontSize: '0.70rem', color: '#d97706' }}>
                          {reportData.visitor_funnel.total_visitors ? `${Math.round(((reportData.visitor_funnel.stage_contacted || 0) / reportData.visitor_funnel.total_visitors) * 100)}%` : '0%'}
                        </div>
                      </div>
                      <div style={{ background: '#f5f3ff', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: '#5b21b6', fontWeight: 700 }}>Encaminhados</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6d28d9' }}>{reportData.visitor_funnel.stage_referred || 0}</div>
                        <div style={{ fontSize: '0.70rem', color: '#7c3aed' }}>
                          {reportData.visitor_funnel.total_visitors ? `${Math.round(((reportData.visitor_funnel.stage_referred || 0) / reportData.visitor_funnel.total_visitors) * 100)}%` : '0%'}
                        </div>
                      </div>
                      <div style={{ background: '#f0f9ff', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700 }}>Na Célula</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0284c7' }}>{reportData.visitor_funnel.stage_attending || 0}</div>
                        <div style={{ fontSize: '0.70rem', color: '#0ea5e9' }}>
                          {reportData.visitor_funnel.total_visitors ? `${Math.round(((reportData.visitor_funnel.stage_attending || 0) / reportData.visitor_funnel.total_visitors) * 100)}%` : '0%'}
                        </div>
                      </div>
                      <div style={{ background: '#ecfdf5', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: '#065f46', fontWeight: 700 }}>Integrados Membro</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>{reportData.visitor_funnel.stage_integrated || 0}</div>
                        <div style={{ fontSize: '0.70rem', color: '#059669', fontWeight: 800 }}>
                          {reportData.visitor_funnel.total_visitors ? `${Math.round(((reportData.visitor_funnel.stage_integrated || 0) / reportData.visitor_funnel.total_visitors) * 100)}% total` : '0%'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RANKING DE CÉLULAS */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#334155' }}>
                      🏆 Ranking de Células: Presença e Engajamento (Últimos 30 Dias)
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px' }}>Célula</th>
                          <th style={{ padding: '10px' }}>Líder</th>
                          <th style={{ padding: '10px' }}>Bairro</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Membros</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Reuniões (30d)</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Total Presenças</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.cell_rankings.length === 0 ? (
                          <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Nenhuma célula com atividade nos últimos 30 dias</td></tr>
                        ) : (
                          reportData.cell_rankings.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '10px', fontWeight: 700, color: '#0f172a' }}>{c.name}</td>
                              <td style={{ padding: '10px', color: '#475569' }}>{c.leader_name || 'N/A'}</td>
                              <td style={{ padding: '10px', color: '#64748b' }}>{c.neighborhood || '-'}</td>
                              <td style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>{c.total_members}</td>
                              <td style={{ padding: '10px', textAlign: 'center' }}>{c.meetings_count_30d}</td>
                              <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{c.total_attendances_30d}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* CONTATOS PASTORAIS DO MÊS */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#334155' }}>
                      📞 Contatos Pastorais Registrados no Mês
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {reportData.care_metrics.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Nenhum contato pastoral registrado nos últimos 30 dias.</div>
                      ) : (
                        reportData.care_metrics.map(cm => (
                          <div key={cm.contact_type} style={{ background: '#f1f5f9', padding: '10px 16px', borderRadius: '8px', fontSize: '0.82rem' }}>
                            <strong style={{ color: '#0f172a' }}>{cm.contact_type}:</strong> <span style={{ fontWeight: 800, color: '#2563eb' }}>{cm.count}</span> atendimentos
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
              >
                Fechar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
