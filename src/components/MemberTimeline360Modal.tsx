import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://566n5qz7te.execute-api.us-east-2.amazonaws.com';

interface TimelineMeeting {
  meeting_date: string;
  study_topic?: string;
  attendance_status: string;
  justification?: string;
}

interface TimelineCareLog {
  id: string;
  caregiver_name: string;
  contact_type: string;
  summary: string;
  scheduled_follow_up?: string;
  created_at: string;
}

interface TimelineMinistry {
  ministry_name: string;
  role_name: string;
  confirmation_status: string;
  service_title: string;
  service_date: string;
  service_time?: string;
}

interface TimelineMember {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  status?: string;
  created_at?: string;
  cell_name?: string;
  leader_name?: string;
  leader_phone?: string;
}

interface MemberTimeline360ModalProps {
  memberId: string | null;
  memberName?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenCareModal?: (memberId: string, memberName: string) => void;
}

export const MemberTimeline360Modal: React.FC<MemberTimeline360ModalProps> = ({
  memberId,
  memberName,
  isOpen,
  onClose,
  onOpenCareModal
}) => {
  const [activeTab, setActiveTab] = useState<'CARE' | 'CELL' | 'MINISTRIES'>('CARE');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    member?: TimelineMember;
    meetings: TimelineMeeting[];
    careLogs: TimelineCareLog[];
    ministries: TimelineMinistry[];
  } | null>(null);

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

  useEffect(() => {
    if (isOpen && memberId) {
      fetchTimeline();
    } else {
      setData(null);
    }
  }, [isOpen, memberId]);

  const fetchTimeline = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pastoral/members/${memberId}/timeline`, { headers });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erro ao carregar prontuário 360:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const member = data?.member;
  const meetings = data?.meetings || [];
  const careLogs = data?.careLogs || [];
  const ministries = data?.ministries || [];

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>✓ Presente</span>;
      case 'JUSTIFIED':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>⚠️ Justificada</span>;
      default:
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>✕ Ausente</span>;
    }
  };

  const getConfirmationBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>Confirmado</span>;
      case 'DECLINED':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>Indisponível</span>;
      default:
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>Pendente</span>;
    }
  };

  return (
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
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* CABEÇALHO DO MODAL */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '20px' }}>
              🩺
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.20rem', fontWeight: 800, color: '#0f172a' }}>
                  {member?.name || memberName || 'Prontuário 360º'}
                </h3>
                {member?.role && (
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.70rem', fontWeight: 800 }}>
                    {member.role}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.80rem', color: '#64748b', marginTop: '2px' }}>
                {member?.cell_name ? `Célula: ${member.cell_name} (Líder: ${member.leader_name || 'N/A'})` : 'Sem célula vinculada'}
                {member?.phone && ` • 📱 ${member.phone}`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#ffffff', padding: '0 24px' }}>
          <button
            onClick={() => setActiveTab('CARE')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'CARE' ? '2px solid #0f766e' : '2px solid transparent',
              color: activeTab === 'CARE' ? '#0f766e' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            🩺 Cuidados & Contatos ({careLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('CELL')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'CELL' ? '2px solid #0f766e' : '2px solid transparent',
              color: activeTab === 'CELL' ? '#0f766e' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            📅 Célula: 12 Semanas ({meetings.length})
          </button>
          <button
            onClick={() => setActiveTab('MINISTRIES')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'MINISTRIES' ? '2px solid #0f766e' : '2px solid transparent',
              color: activeTab === 'MINISTRIES' ? '#0f766e' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            🤝 Ministérios & Escalas ({ministries.length})
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Carregando prontuário 360º do membro...
            </div>
          ) : (
            <>
              {/* ABA 1: CUIDADOS PASTORAIS */}
              {activeTab === 'CARE' && (
                <div>
                  {careLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🕊️</div>
                      <div>Nenhum contato pastoral registrado para este membro até o momento.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {careLogs.map(log => (
                        <div key={log.id} style={{ padding: '14px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>
                              {log.contact_type}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {new Date(log.created_at).toLocaleDateString('pt-BR')} às {new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ color: '#1e293b', fontSize: '0.88rem', marginTop: '8px', lineHeight: 1.5 }}>
                            "{log.summary}"
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                            Registrado por: <strong>{log.caregiver_name || 'Liderança Pastoral'}</strong>
                            {log.scheduled_follow_up && (
                              <span style={{ marginLeft: '12px', color: '#0f766e', fontWeight: 700 }}>
                                📅 Retorno previsto: {new Date(log.scheduled_follow_up).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: FREQUÊNCIA DE CÉLULA */}
              {activeTab === 'CELL' && (
                <div>
                  {meetings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
                      <div>Nenhum registro de reunião de célula encontrado nas últimas semanas.</div>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px' }}>Data da Reunião</th>
                          <th style={{ padding: '10px' }}>Estudo / Pauta</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Presença</th>
                          <th style={{ padding: '10px' }}>Justificativa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meetings.map((m, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '10px', fontWeight: 700, color: '#0f172a' }}>
                              {new Date(m.meeting_date).toLocaleDateString('pt-BR')}
                            </td>
                            <td style={{ padding: '10px', color: '#475569' }}>
                              {m.study_topic || 'Reunião Regular'}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              {getAttendanceBadge(m.attendance_status)}
                            </td>
                            <td style={{ padding: '10px', color: '#64748b', fontSize: '0.80rem' }}>
                              {m.justification || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* ABA 3: MINISTÉRIOS E ESCALAS */}
              {activeTab === 'MINISTRIES' && (
                <div>
                  {ministries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🤝</div>
                      <div>Membro ainda não possui escalas ou atuações vinculadas aos ministérios.</div>
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '10px' }}>Culto / Evento</th>
                          <th style={{ padding: '10px' }}>Ministério</th>
                          <th style={{ padding: '10px' }}>Função</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ministries.map((min, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '10px', fontWeight: 700, color: '#0f172a' }}>
                              {min.service_title}
                              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                                {new Date(min.service_date).toLocaleDateString('pt-BR')} {min.service_time ? `às ${min.service_time}` : ''}
                              </div>
                            </td>
                            <td style={{ padding: '10px', color: '#475569', fontWeight: 600 }}>
                              {min.ministry_name}
                            </td>
                            <td style={{ padding: '10px', color: '#64748b' }}>
                              {min.role_name}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              {getConfirmationBadge(min.confirmation_status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          {onOpenCareModal && memberId ? (
            <button
              onClick={() => {
                onClose();
                onOpenCareModal(memberId, member?.name || memberName || '');
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#0f766e',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              + Novo Contato Pastoral
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
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
  );
};
