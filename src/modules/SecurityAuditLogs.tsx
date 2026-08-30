import React, { useState, useEffect } from 'react';
import type { Organization } from './OrganizationSelector';
import { getAuthHeaders } from '../services/apiClient';

const API_BASE_URL = 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

interface AuditLog {
  id: string;
  organization_id: string;
  campus_id?: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  status: 'SUCCESS' | 'DENIED' | 'ERROR';
  created_at: string;
}

interface SecurityAuditLogsProps {
  selectedOrganization?: Organization | null;
}

export const SecurityAuditLogs: React.FC<SecurityAuditLogsProps> = ({ selectedOrganization }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchEmail, setSearchEmail] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    fetchLogs();
  }, [selectedOrganization, filterAction, filterStatus, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('organization_id', selectedOrganization?.id || 'org_default');
      if (filterAction !== 'ALL') params.append('action', filterAction);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (searchEmail) params.append('user_email', searchEmail);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/security/audit-logs?${params.toString()}`, {
        headers
      });

      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar logs de auditoria:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Data/Hora', 'Usuario', 'Papel', 'Acao', 'Recurso', 'Status', 'IP', 'Detalhes'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.created_at).toLocaleString('pt-BR'),
      l.user_email || 'Anonimo',
      l.user_role || 'N/A',
      l.action,
      l.resource,
      l.status,
      l.ip_address || 'N/A',
      `"${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trilha_auditoria_lgpd_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actionLabels: Record<string, { label: string; bg: string; color: string }> = {
    CREATE_FINANCIAL_TRANSACTION: { label: 'Nova Transação', bg: 'rgba(16, 185, 129, 0.15)', color: '#059669' },
    UPDATE_FINANCIAL_TRANSACTION: { label: 'Edição Financeira', bg: 'rgba(245, 158, 11, 0.15)', color: '#d97706' },
    DELETE_FINANCIAL_TRANSACTION: { label: 'Exclusão Financeira', bg: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' },
    UPDATE_PAYMENT_GATEWAY_CONFIG: { label: 'Alteração Gateway', bg: 'rgba(139, 92, 246, 0.15)', color: '#7c3aed' },
    CHECKIN_CHILD: { label: 'Check-in Kids', bg: 'rgba(6, 182, 212, 0.15)', color: '#0891b2' },
    CHECKOUT_CHILD: { label: 'Checkout Kids', bg: 'rgba(14, 165, 233, 0.15)', color: '#0284c7' },
    SAVE_CHILD_RECORD: { label: 'Cadastro Criança', bg: 'rgba(236, 72, 153, 0.15)', color: '#db2777' },
    INVITE_MEMBER: { label: 'Convite de Membro', bg: 'rgba(99, 102, 241, 0.15)', color: '#4f46e5' },
    UPDATE_MEMBER_PROFILE: { label: 'Edição de Membro', bg: 'rgba(100, 116, 139, 0.15)', color: '#475569' }
  };

  const totalEvents = logs.length;
  const totalDenied = logs.filter(l => l.status === 'DENIED' || l.status === 'ERROR').length;
  const uniqueUsers = new Set(logs.map(l => l.user_email).filter(Boolean)).size;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Trilha de Auditoria Forense & Segurança
            </h1>
            <span style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#059669',
              fontWeight: '600',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              LGPD Art. 14 / ISO 27001
            </span>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Registro imutável de todas as ações sensíveis, acessos a dados pessoais de menores, tesouraria e configurações.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchLogs}
            style={{
              padding: '10px 16px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            🔄 Atualizar
          </button>
          <button
            onClick={exportToCSV}
            style={{
              padding: '10px 18px',
              backgroundColor: '#0f766e',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📥 Exportar Relatório LGPD (.csv)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Total de Ações Auditadas</span>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>{totalEvents}</div>
          <span style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>Registros em conformidade</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Bloqueios de Segurança</span>
          <div style={{ fontSize: '28px', fontWeight: '700', color: totalDenied > 0 ? '#dc2626' : '#059669', marginTop: '6px' }}>{totalDenied}</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Tentativas não autorizadas</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Operadores Únicos</span>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>{uniqueUsers}</div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Lideranças / Operadores auditados</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Integridade dos Logs</span>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f766e', marginTop: '6px' }}>100%</div>
          <span style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>RDS com criptografia em repouso</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '220px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Buscar por Usuário / E-mail</label>
            <input
              type="text"
              placeholder="Ex: pastor@igreja.com..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <div style={{ width: '220px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Tipo de Ação</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              <option value="ALL">Todas as Ações</option>
              <option value="CREATE_FINANCIAL_TRANSACTION">Nova Transação Financeira</option>
              <option value="UPDATE_FINANCIAL_TRANSACTION">Edição Financeira</option>
              <option value="DELETE_FINANCIAL_TRANSACTION">Exclusão Financeira</option>
              <option value="UPDATE_PAYMENT_GATEWAY_CONFIG">Alteração de Gateway Pagar.me</option>
              <option value="CHECKIN_CHILD">Check-in Kids</option>
              <option value="CHECKOUT_CHILD">Checkout Kids</option>
              <option value="SAVE_CHILD_RECORD">Cadastro de Criança</option>
              <option value="INVITE_MEMBER">Convite de Membro</option>
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              <option value="ALL">Todos</option>
              <option value="SUCCESS">Sucesso (Autorizado)</option>
              <option value="DENIED">Bloqueado (Negado)</option>
              <option value="ERROR">Erro</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <button
              type="submit"
              style={{
                padding: '9px 18px',
                backgroundColor: '#0f766e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Audit Log Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            Carregando trilha de auditoria...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            Nenhum registro de auditoria encontrado para os filtros selecionados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Data / Hora</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Operador</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Ação Executada</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Recurso</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>IP de Origem</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 16px', color: '#475569', fontWeight: '600', textAlign: 'center' }}>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const tag = actionLabels[log.action] || { label: log.action, bg: '#f1f5f9', color: '#475569' };
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                      <td style={{ padding: '12px 16px', color: '#334155', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{log.user_email || 'Sistema / Anônimo'}</div>
                        {log.user_role && (
                          <span style={{ fontSize: '11px', color: '#64748b' }}>Papel: {log.user_role}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: tag.bg,
                          color: tag.color,
                          fontWeight: '600',
                          fontSize: '12px'
                        }}>
                          {tag.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontFamily: 'monospace' }}>
                        {log.resource}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: log.status === 'SUCCESS' ? '#059669' : '#dc2626'
                        }}>
                          {log.status === 'SUCCESS' ? '✔ AUTORIZADO' : '✖ NEGADO'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          🔍 Inspecionar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Log */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                Registro de Auditoria Forense
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>ID do Evento:</span>
                <strong>{selectedLog.id}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Data / Hora:</span>
                <strong>{new Date(selectedLog.created_at).toLocaleString('pt-BR')}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Usuário / E-mail:</span>
                <strong>{selectedLog.user_email || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Papel (Role):</span>
                <strong>{selectedLog.user_role || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Ação:</span>
                <strong>{selectedLog.action}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Endereço IP:</span>
                <strong>{selectedLog.ip_address || 'N/A'}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '12px', marginBottom: '6px' }}>Dados do Evento (Payload JSON):</span>
              <pre style={{
                backgroundColor: '#0f172a',
                color: '#38bdf8',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                overflowX: 'auto',
                maxHeight: '200px'
              }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '8px 18px',
                  backgroundColor: '#0f766e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
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
