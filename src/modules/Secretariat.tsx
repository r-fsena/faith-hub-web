import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFeatureFlags } from '../context/FeatureFlagContext';
import { getAuthHeaders } from '../services/apiClient';
import { SecretariatPhase2 } from './SecretariatPhase2';

const API_URL = import.meta.env.VITE_API_URL || 'https://566n5qz7te.execute-api.us-east-2.amazonaws.com';

interface SecretariatProps {
  selectedCampusId?: string;
  selectedOrganization?: { id?: string; name?: string } | null;
  activeSubtab: string;
  onNavigateSubtab: (subtab: string) => void;
}

interface SecretariatMetrics {
  total_members: number;
  completed_records: number;
  incomplete_records: number;
  pending_requests: number;
  issued_documents: number;
  baptism_records: number;
}

interface SecretariatRecord {
  member_id: string;
  name: string;
  email?: string;
  phone?: string;
  account_status?: string;
  campus_id?: string;
  campus_name?: string;
  record_id?: string;
  registry_number?: string;
  membership_status?: string;
  admission_type?: string;
  admission_date?: string;
  origin_church_name?: string;
  baptism_date?: string;
  baptism_church?: string;
  baptism_city?: string;
  baptism_officiant?: string;
  notes?: string;
  updated_at?: string;
}

interface RecordForm {
  registry_number: string;
  membership_status: string;
  admission_type: string;
  admission_date: string;
  origin_church_name: string;
  baptism_date: string;
  baptism_church: string;
  baptism_city: string;
  baptism_officiant: string;
  notes: string;
}

const EMPTY_METRICS: SecretariatMetrics = {
  total_members: 0,
  completed_records: 0,
  incomplete_records: 0,
  pending_requests: 0,
  issued_documents: 0,
  baptism_records: 0
};

const EMPTY_FORM: RecordForm = {
  registry_number: '',
  membership_status: 'PENDING',
  admission_type: '',
  admission_date: '',
  origin_church_name: '',
  baptism_date: '',
  baptism_church: '',
  baptism_city: '',
  baptism_officiant: '',
  notes: ''
};

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card, #ffffff)',
  border: '1px solid var(--panel-border, #e2e8f0)',
  borderRadius: 16,
  boxShadow: 'var(--shadow-sm, 0 4px 12px rgba(15,23,42,0.06))'
};

function dateInput(value?: string): string {
  return value ? String(value).slice(0, 10) : '';
}

function membershipLabel(status?: string): { label: string; color: string; background: string } {
  switch ((status || 'PENDING').toUpperCase()) {
    case 'ACTIVE': return { label: 'Ativo', color: '#047857', background: '#ecfdf5' };
    case 'INACTIVE': return { label: 'Inativo', color: '#475569', background: '#f1f5f9' };
    case 'TRANSFERRED': return { label: 'Transferido', color: '#1d4ed8', background: '#eff6ff' };
    case 'SUSPENDED': return { label: 'Suspenso', color: '#b91c1c', background: '#fef2f2' };
    default: return { label: 'Prontuário pendente', color: '#b45309', background: '#fffbeb' };
  }
}

export const Secretariat: React.FC<SecretariatProps> = ({
  selectedCampusId = 'all',
  selectedOrganization,
  activeSubtab,
  onNavigateSubtab
}) => {
  const { isFeatureEnabled } = useFeatureFlags();
  const registryEnabled = isFeatureEnabled('secretariat.member_registry', false);
  const [metrics, setMetrics] = useState<SecretariatMetrics>(EMPTY_METRICS);
  const [records, setRecords] = useState<SecretariatRecord[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<SecretariatRecord | null>(null);
  const [recordForm, setRecordForm] = useState<RecordForm>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [phase2Refresh, setPhase2Refresh] = useState(0);

  const organizationId = selectedOrganization?.id || 'org_default';

  const buildParams = useCallback((extra?: Record<string, string>) => {
    const params = new URLSearchParams({ organization_id: organizationId });
    if (selectedCampusId && selectedCampusId !== 'all') params.set('campus_id', selectedCampusId);
    Object.entries(extra || {}).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [organizationId, selectedCampusId]);

  const loadDashboard = useCallback(async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/secretariat/dashboard?${buildParams()}`, { headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || 'Não foi possível carregar a Secretaria.');
    setMetrics({ ...EMPTY_METRICS, ...(data.metrics || {}) });
    setRecentMovements(Array.isArray(data.recent_movements) ? data.recent_movements : []);
  }, [buildParams]);

  const loadRecords = useCallback(async (term: string) => {
    if (!registryEnabled) return;
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/secretariat/records?${buildParams({ search: term.trim() })}`, { headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || 'Não foi possível carregar os prontuários.');
    setRecords(Array.isArray(data.data) ? data.data : []);
  }, [buildParams, registryEnabled]);

  const loadSecretariat = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      await Promise.all([loadDashboard(), loadRecords('')]);
    } catch (loadError: any) {
      setError(loadError.message || 'Não foi possível carregar o módulo.');
    } finally {
      setIsLoading(false);
    }
  }, [loadDashboard, loadRecords]);

  useEffect(() => {
    loadSecretariat();
  }, [loadSecretariat]);

  const openRecord = (record: SecretariatRecord) => {
    setSelectedRecord(record);
    setRecordForm({
      registry_number: record.registry_number || '',
      membership_status: record.membership_status || 'PENDING',
      admission_type: record.admission_type || '',
      admission_date: dateInput(record.admission_date),
      origin_church_name: record.origin_church_name || '',
      baptism_date: dateInput(record.baptism_date),
      baptism_church: record.baptism_church || '',
      baptism_city: record.baptism_city || '',
      baptism_officiant: record.baptism_officiant || '',
      notes: record.notes || ''
    });
  };

  const saveRecord = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRecord) return;
    setIsSaving(true);
    setError('');
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_URL}/secretariat/members/${encodeURIComponent(selectedRecord.member_id)}/record?${buildParams()}`,
        { method: 'PUT', headers, body: JSON.stringify({ ...recordForm, organization_id: organizationId, campus_id: selectedCampusId === 'all' ? selectedRecord.campus_id : selectedCampusId }) }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.message || 'Não foi possível salvar o prontuário.');
      setSelectedRecord(null);
      await Promise.all([loadDashboard(), loadRecords(search)]);
    } catch (saveError: any) {
      setError(saveError.message || 'Não foi possível salvar o prontuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
      <div>
        <div style={{ color: 'var(--accent-primary)', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Secretaria Eclesiástica · Gestão Integrada
        </div>
        <h1 style={{ margin: '4px 0 4px', fontSize: '1.65rem', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
          {{
            secretariat_records: 'Prontuários Eclesiásticos',
            secretariat_movements: 'Movimentações e Transferências',
            secretariat_documents: 'Documentos e Solicitações',
            secretariat_baptisms: 'Batismos e Certificados',
            secretariat_templates: 'Modelos e Signatários'
          }[activeSubtab] || 'Visão Geral da Secretaria'}
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.84rem' }}>
          {selectedOrganization?.name || 'Organização ativa'} · {selectedCampusId === 'all' ? 'Todas as unidades' : 'Unidade selecionada'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => activeSubtab !== 'secretariat_overview' && activeSubtab !== 'secretariat_records'
          ? setPhase2Refresh(value => value + 1)
          : loadSecretariat()}
        disabled={(activeSubtab === 'secretariat_overview' || activeSubtab === 'secretariat_records') && isLoading}
        style={{ border: '1px solid var(--panel-border)', background: 'var(--bg-card)', borderRadius: 10, padding: '9px 14px', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' }}
      >
        {isLoading ? 'Atualizando...' : '↻ Atualizar'}
      </button>
    </div>
  );

  const renderOverview = () => {
    const metricCards = [
      { label: 'Membros cadastrados', value: metrics.total_members, icon: '👥', color: '#0f766e' },
      { label: 'Prontuários completos', value: metrics.completed_records, icon: '✓', color: '#047857' },
      { label: 'Cadastros pendentes', value: metrics.incomplete_records, icon: '!', color: '#b45309' },
      { label: 'Solicitações abertas', value: metrics.pending_requests, icon: '⏳', color: '#7c3aed' },
      { label: 'Documentos válidos', value: metrics.issued_documents, icon: '📄', color: '#1d4ed8' },
      { label: 'Registros de batismo', value: metrics.baptism_records, icon: '💧', color: '#0369a1' }
    ];

    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 12 }}>
          {metricCards.map(card => (
            <div key={card.label} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700 }}>{card.label}</span>
                <span style={{ color: card.color, fontWeight: 900 }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', marginTop: 8 }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, 0.8fr)', gap: 16, marginTop: 16 }} className="responsive-2col-layout">
          <div style={{ ...cardStyle, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>Base de prontuários</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.76rem' }}>Complete os dados eclesiásticos antes de emitir documentos.</p>
              </div>
              {registryEnabled && (
                <button type="button" onClick={() => onNavigateSubtab('secretariat_records')} style={{ border: 0, background: 'var(--accent-primary)', color: '#fff', borderRadius: 10, padding: '9px 12px', fontWeight: 800, cursor: 'pointer' }}>
                  Abrir prontuários
                </button>
              )}
            </div>
            <div style={{ marginTop: 18, background: '#f8fafc', borderRadius: 12, padding: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>
                <span>Progresso cadastral</span>
                <span>{metrics.total_members ? Math.round((metrics.completed_records / metrics.total_members) * 100) : 0}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden', marginTop: 9 }}>
                <div style={{ height: '100%', width: `${metrics.total_members ? Math.round((metrics.completed_records / metrics.total_members) * 100) : 0}%`, background: 'var(--accent-primary)', borderRadius: 999 }} />
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 20 }}>
            <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>Próxima etapa</h2>
            <p style={{ margin: '6px 0 12px', fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Após validar os prontuários, habilitaremos os fluxos de transferência, cartas e certificados.
            </p>
            {['Movimentações entre filiais', 'Cartas de transferência', 'Certificados de batismo', 'Modelos personalizados'].map(item => (
              <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 0', color: '#475569', fontSize: '0.77rem', fontWeight: 700 }}>
                <span style={{ color: '#94a3b8' }}>○</span>{item}
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: 16, padding: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-main)' }}>Movimentações recentes</h2>
          {recentMovements.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.80rem', padding: '22px 0 4px', textAlign: 'center' }}>
              Nenhuma movimentação registrada nesta fase.
            </div>
          ) : recentMovements.map(movement => (
            <div key={movement.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderTop: '1px solid var(--panel-border)' }}>
              <span style={{ fontSize: '0.80rem', color: 'var(--text-main)', fontWeight: 800 }}>{movement.member_name}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{movement.movement_type} · {movement.status}</span>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderRecords = () => (
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      <form
        onSubmit={event => { event.preventDefault(); setIsLoading(true); loadRecords(search).catch((loadError: any) => setError(loadError.message)).finally(() => setIsLoading(false)); }}
        style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--panel-border)', flexWrap: 'wrap' }}
      >
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Buscar por nome, e-mail, telefone ou registro..."
          style={{ flex: '1 1 280px', minWidth: 0, padding: '11px 13px', border: '1px solid var(--panel-border)', borderRadius: 10, background: 'var(--bg-card-subtle, #f8fafc)', color: 'var(--text-main)' }}
        />
        <button type="submit" style={{ border: 0, background: 'var(--accent-primary)', color: '#fff', borderRadius: 10, padding: '11px 16px', fontWeight: 800, cursor: 'pointer' }}>
          Buscar
        </button>
      </form>

      <div style={{ padding: 12, display: 'grid', gap: 10 }}>
        {records.length === 0 && !isLoading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum membro encontrado.</div>
        ) : records.map(record => {
          const status = membershipLabel(record.membership_status);
          return (
            <button
              key={record.member_id}
              type="button"
              onClick={() => openRecord(record)}
              style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', border: '1px solid var(--panel-border)', borderRadius: 12, padding: '13px 14px', background: 'var(--bg-card)', textAlign: 'left', cursor: 'pointer' }}
            >
              <span style={{ minWidth: 0, flex: '1 1 220px' }}>
                <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 900, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.name}</span>
                <span style={{ display: 'block', fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.email || record.phone || 'Sem contato informado'}</span>
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', flex: '0 1 140px' }}>{record.campus_name || 'Sede'}</span>
              <span style={{ padding: '4px 8px', borderRadius: 999, background: status.background, color: status.color, fontSize: '0.68rem', fontWeight: 900 }}>{status.label}</span>
              <span style={{ color: 'var(--accent-primary)', fontSize: '0.76rem', fontWeight: 900 }}>Editar →</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: 32 }}>
      {renderHeader()}
      {error && <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.78rem', fontWeight: 700 }}>{error}</div>}
      {activeSubtab !== 'secretariat_overview' && activeSubtab !== 'secretariat_records' ? (
        <SecretariatPhase2
          key={`${activeSubtab}-${phase2Refresh}`}
          organizationId={organizationId}
          campusId={selectedCampusId}
          activeSubtab={activeSubtab}
          onDataChanged={loadDashboard}
        />
      ) : isLoading && records.length === 0 && metrics.total_members === 0 ? (
        <div style={{ ...cardStyle, padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando dados da Secretaria...</div>
      ) : activeSubtab === 'secretariat_records' && registryEnabled ? renderRecords() : renderOverview()}

      {selectedRecord && createPortal(
        <form className="modal-overlay animate-fade-in" onSubmit={saveRecord} onClick={() => !isSaving && setSelectedRecord(null)}>
          <div className="modal-studio-container" style={{ maxWidth: 920, maxHeight: '94vh' }} onClick={event => event.stopPropagation()}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon">🗂️</div>
                <div>
                  <h2 className="modal-studio-title">Prontuário de {selectedRecord.name}</h2>
                  <p className="modal-studio-subtitle">Dados eclesiásticos vinculados à organização e à unidade selecionada.</p>
                </div>
              </div>
              <button type="button" className="modal-close-circle" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>

            <div className="modal-studio-body" style={{ padding: '24px 30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div className="form-group-modern">
                <label className="form-label-modern">Número de registro</label>
                <input className="input-modern" value={recordForm.registry_number} onChange={event => setRecordForm({ ...recordForm, registry_number: event.target.value })} placeholder="Ex: MEM-2026-0012" />
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Situação da membresia</label>
                <select className="input-modern" value={recordForm.membership_status} onChange={event => setRecordForm({ ...recordForm, membership_status: event.target.value })}>
                  <option value="PENDING">Prontuário pendente</option>
                  <option value="ACTIVE">Membro ativo</option>
                  <option value="INACTIVE">Inativo</option>
                  <option value="TRANSFERRED">Transferido</option>
                  <option value="SUSPENDED">Suspenso</option>
                </select>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Forma de admissão</label>
                <select className="input-modern" value={recordForm.admission_type} onChange={event => setRecordForm({ ...recordForm, admission_type: event.target.value })}>
                  <option value="">Não informada</option>
                  <option value="BAPTISM">Batismo</option>
                  <option value="TRANSFER">Transferência</option>
                  <option value="CONFESSION">Profissão de fé</option>
                  <option value="RESTORATION">Restauração</option>
                  <option value="OTHER">Outra</option>
                </select>
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Data de admissão</label>
                <input type="date" className="input-modern" value={recordForm.admission_date} onChange={event => setRecordForm({ ...recordForm, admission_date: event.target.value })} />
              </div>
              <div className="form-group-modern" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label-modern">Igreja de origem</label>
                <input className="input-modern" value={recordForm.origin_church_name} onChange={event => setRecordForm({ ...recordForm, origin_church_name: event.target.value })} placeholder="Nome da igreja anterior, quando aplicável" />
              </div>

              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--panel-border)', paddingTop: 14, marginTop: 2, fontSize: '0.78rem', fontWeight: 900, color: 'var(--text-main)' }}>Dados de batismo</div>
              <div className="form-group-modern">
                <label className="form-label-modern">Data do batismo</label>
                <input type="date" className="input-modern" value={recordForm.baptism_date} onChange={event => setRecordForm({ ...recordForm, baptism_date: event.target.value })} />
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Igreja do batismo</label>
                <input className="input-modern" value={recordForm.baptism_church} onChange={event => setRecordForm({ ...recordForm, baptism_church: event.target.value })} />
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Cidade</label>
                <input className="input-modern" value={recordForm.baptism_city} onChange={event => setRecordForm({ ...recordForm, baptism_city: event.target.value })} />
              </div>
              <div className="form-group-modern">
                <label className="form-label-modern">Ministro responsável</label>
                <input className="input-modern" value={recordForm.baptism_officiant} onChange={event => setRecordForm({ ...recordForm, baptism_officiant: event.target.value })} />
              </div>
              <div className="form-group-modern" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label-modern">Observações internas</label>
                <textarea className="input-modern" rows={4} value={recordForm.notes} onChange={event => setRecordForm({ ...recordForm, notes: event.target.value })} placeholder="Informações administrativas relevantes para a Secretaria" />
              </div>
            </div>

            <div className="modal-studio-footer">
              <button type="button" className="btn-secondary" onClick={() => setSelectedRecord(null)} disabled={isSaving}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar prontuário'}</button>
            </div>
          </div>
        </form>,
        document.body
      )}
    </div>
  );
};
