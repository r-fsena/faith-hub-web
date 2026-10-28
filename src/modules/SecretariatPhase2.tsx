import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getAuthHeaders } from '../services/apiClient';
import { useFeatureFlags } from '../context/FeatureFlagContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

interface Props {
  organizationId: string;
  campusId: string;
  activeSubtab: string;
  onDataChanged?: () => void;
}

type ModalType = 'movement' | 'request' | 'document' | 'baptism' | 'template' | 'signatory' | 'preview' | null;

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card, #fff)', border: '1px solid var(--panel-border, #e2e8f0)',
  borderRadius: 16, boxShadow: 'var(--shadow-sm, 0 4px 12px rgba(15,23,42,.06))'
};

const initialForms = {
  movement: { member_id: '', movement_type: 'INTERNAL_TRANSFER', to_campus_id: '', external_church_name: '', effective_date: '', reason: '', notes: '' },
  request: { member_id: '', request_type: 'LETTER_PRESENTATION', notes: '' },
  document: { member_id: '', template_id: '', signatory_id: '', request_id: '', destination_church: '' },
  baptism: { member_id: '', baptism_date: '', baptism_church: '', baptism_location: '', baptism_city: '', officiant_name: '', ceremony_name: '', notes: '' },
  template: { document_type: 'PRESENTATION_LETTER', name: '', title: '', body: '', footer: '', orientation: 'portrait' },
  signatory: { member_id: '', name: '', title: '' }
};

function dateLabel(value?: string): string {
  if (!value) return '—';
  const date = new Date(String(value).slice(0, 10) + 'T12:00:00');
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR');
}

function statusLabel(status?: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendente', UNDER_REVIEW: 'Em análise', APPROVED: 'Aprovado', REJECTED: 'Rejeitado',
    CANCELED: 'Cancelado', COMPLETED: 'Concluído', VALID: 'Válido', REVOKED: 'Cancelado'
  };
  return labels[String(status || '').toUpperCase()] || status || '—';
}

function typeLabel(type?: string): string {
  const labels: Record<string, string> = {
    INTERNAL_TRANSFER: 'Transferência entre unidades', EXTERNAL_TRANSFER_OUT: 'Transferência para outra igreja',
    EXTERNAL_TRANSFER_IN: 'Recebimento de outra igreja', LETTER_PRESENTATION: 'Carta de apresentação',
    LETTER_TRANSFER: 'Carta de transferência', BAPTISM_CERTIFICATE: 'Certificado de batismo',
    PRESENTATION_LETTER: 'Carta de apresentação', TRANSFER_LETTER: 'Carta de transferência',
    DECLARATION: 'Declaração', OTHER: 'Outro documento'
  };
  return labels[String(type || '').toUpperCase()] || type || '—';
}

function statusStyle(status?: string): React.CSSProperties {
  const normalized = String(status || '').toUpperCase();
  const positive = ['APPROVED', 'COMPLETED', 'VALID'].includes(normalized);
  const negative = ['REJECTED', 'CANCELED', 'REVOKED'].includes(normalized);
  return {
    padding: '4px 9px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 900,
    color: positive ? '#047857' : negative ? '#b91c1c' : '#b45309',
    background: positive ? '#ecfdf5' : negative ? '#fef2f2' : '#fffbeb'
  };
}

export const SecretariatPhase2: React.FC<Props> = ({ organizationId, campusId, activeSubtab, onDataChanged }) => {
  const { isFeatureEnabled } = useFeatureFlags();
  const requiredFlag = activeSubtab === 'secretariat_movements' ? 'secretariat.transfers'
    : activeSubtab === 'secretariat_baptisms' ? 'secretariat.baptisms' : 'secretariat.documents';
  const featureEnabled = isFeatureEnabled(requiredFlag, false);
  const [references, setReferences] = useState<any>({ members: [], campuses: [], templates: [], signatories: [] });
  const [movements, setMovements] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [baptisms, setBaptisms] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [signatories, setSignatories] = useState<any[]>([]);
  const [modal, setModal] = useState<ModalType>(null);
  const [preview, setPreview] = useState<any>(null);
  const [forms, setForms] = useState<any>(initialForms);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const params = useMemo(() => {
    const value = new URLSearchParams({ organization_id: organizationId });
    if (campusId && campusId !== 'all') value.set('campus_id', campusId);
    return value.toString();
  }, [organizationId, campusId]);

  const callApi = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/secretariat/${path}${path.includes('?') ? '&' : '?'}${params}`, {
      ...options, headers: { ...headers, ...((options.headers as Record<string, string>) || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || 'Não foi possível concluir a operação.');
    return data;
  }, [params]);

  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      if (!featureEnabled) throw new Error('Esta funcionalidade ainda não está habilitada para a organização selecionada.');
      const referenceData = await callApi('reference-data');
      setReferences(referenceData);
      if (activeSubtab === 'secretariat_movements') {
        setMovements((await callApi('movements')).data || []);
      } else if (activeSubtab === 'secretariat_documents') {
        const [documentData, requestData] = await Promise.all([callApi('documents'), callApi('requests')]);
        setDocuments(documentData.data || []); setRequests(requestData.data || []);
      } else if (activeSubtab === 'secretariat_baptisms') {
        setBaptisms((await callApi('baptisms')).data || []);
      } else if (activeSubtab === 'secretariat_templates') {
        const [templateData, signatoryData] = await Promise.all([callApi('templates'), callApi('signatories')]);
        setTemplates(templateData.data || []); setSignatories(signatoryData.data || []);
      }
    } catch (loadError: any) {
      setError(loadError.message || 'Não foi possível carregar os dados.');
    } finally { setLoading(false); }
  }, [activeSubtab, callApi, featureEnabled]);

  useEffect(() => { loadData(); }, [loadData]);

  const openModal = (type: ModalType) => {
    setError(''); setSuccess(''); setModal(type);
    if (type && type !== 'preview') setForms((current: any) => ({ ...current, [type]: { ...(initialForms as any)[type] } }));
  };

  const updateForm = (type: string, field: string, value: string) => {
    setForms((current: any) => ({ ...current, [type]: { ...current[type], [field]: value } }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!modal || modal === 'preview') return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const endpoints: Record<string, string> = {
        movement: 'movements', request: 'requests', document: 'documents', baptism: 'baptisms',
        template: 'templates', signatory: 'signatories'
      };
      const form = forms[modal];
      const body = modal === 'template'
        ? { ...form, template_schema: { title: form.title, body: form.body, footer: form.footer, orientation: form.orientation } }
        : modal === 'document'
          ? { ...form, fields: { destination_church: form.destination_church } }
          : form;
      const result = await callApi(endpoints[modal], { method: 'POST', body: JSON.stringify({ ...body, organization_id: organizationId, campus_id: campusId }) });
      setSuccess(result.message || 'Dados salvos com sucesso.');
      setModal(null);
      await loadData();
      onDataChanged?.();
    } catch (saveError: any) {
      setError(saveError.message || 'Não foi possível salvar os dados.');
    } finally { setSaving(false); }
  };

  const updateStatus = async (resource: 'movements' | 'requests', id: string, status: string) => {
    setSaving(true); setError('');
    try {
      const result = await callApi(`${resource}/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: JSON.stringify({ organization_id: organizationId, campus_id: campusId, status }) });
      setSuccess(result.message || 'Situação atualizada.'); await loadData(); onDataChanged?.();
    } catch (statusError: any) { setError(statusError.message); } finally { setSaving(false); }
  };

  const revokeDocument = async (document: any) => {
    const reason = window.prompt(`Informe o motivo do cancelamento de ${document.document_number}:`);
    if (!reason?.trim()) return;
    setSaving(true); setError('');
    try {
      const result = await callApi(`documents/${encodeURIComponent(document.id)}/status`, {
        method: 'PATCH', body: JSON.stringify({ organization_id: organizationId, campus_id: campusId, reason })
      });
      setSuccess(result.message || 'Documento cancelado.'); await loadData(); onDataChanged?.();
    } catch (revokeError: any) { setError(revokeError.message); } finally { setSaving(false); }
  };

  const memberOptions = references.members || [];
  const campusOptions = references.campuses || [];
  const templateOptions = references.templates || [];
  const signatoryOptions = references.signatories || [];
  const pendingRequests = requests.filter(request => !['COMPLETED', 'CANCELED', 'REJECTED'].includes(request.status));

  const actions = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {activeSubtab === 'secretariat_movements' && <button className="btn-primary" onClick={() => openModal('movement')}>+ Nova movimentação</button>}
      {activeSubtab === 'secretariat_documents' && <><button className="btn-secondary" onClick={() => openModal('request')}>+ Nova solicitação</button><button className="btn-primary" onClick={() => openModal('document')}>+ Emitir documento</button></>}
      {activeSubtab === 'secretariat_baptisms' && <button className="btn-primary" onClick={() => openModal('baptism')}>+ Registrar batismo</button>}
      {activeSubtab === 'secretariat_templates' && <><button className="btn-secondary" onClick={() => openModal('signatory')}>+ Signatário</button><button className="btn-primary" onClick={() => openModal('template')}>+ Novo modelo</button></>}
    </div>
  );

  const renderMovements = () => (
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      <SectionHeader title="Movimentações e transferências" subtitle="Fluxos entre unidades e igrejas externas" actions={actions} />
      <DataList empty="Nenhuma movimentação registrada." loading={loading}>
        {movements.map(item => <div key={item.id} className="secretariat-data-row" style={rowStyle}>
          <div style={{ flex: '1 1 280px' }}><strong>{item.member_name}</strong><small>{typeLabel(item.movement_type)} · {item.from_campus_name || 'Unidade atual'}{item.to_campus_name ? ` → ${item.to_campus_name}` : item.external_church_name ? ` · ${item.external_church_name}` : ''}</small>{item.reason && <small>{item.reason}</small>}</div>
          <div><small>Data prevista</small><strong>{dateLabel(item.effective_date)}</strong></div>
          <span style={statusStyle(item.status)}>{statusLabel(item.status)}</span>
          {['PENDING', 'UNDER_REVIEW'].includes(item.status) && <div style={{ display: 'flex', gap: 6 }}><button className="btn-secondary" disabled={saving} onClick={() => updateStatus('movements', item.id, 'REJECTED')}>Rejeitar</button><button className="btn-primary" disabled={saving} onClick={() => updateStatus('movements', item.id, 'APPROVED')}>Aprovar</button></div>}
        </div>)}
      </DataList>
    </div>
  );

  const renderDocuments = () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <SectionHeader title="Documentos emitidos" subtitle="Cartas, declarações e certificados com histórico de versão" actions={actions} />
        <DataList empty="Nenhum documento emitido." loading={loading}>
          {documents.map(item => <div key={item.id} className="secretariat-data-row" style={rowStyle}>
            <div style={{ flex: '1 1 260px' }}><strong>{item.document_number}</strong><small>{item.member_name || 'Sem membro'} · {typeLabel(item.document_type)} · Modelo v{item.template_version}</small></div>
            <div><small>Emissão</small><strong>{dateLabel(item.issued_at)}</strong></div>
            <span style={statusStyle(item.status)}>{statusLabel(item.status)}</span>
            <div style={{ display: 'flex', gap: 6 }}><button className="btn-secondary" onClick={() => { setPreview(item); setModal('preview'); }}>Visualizar</button>{item.status === 'VALID' && <button className="btn-secondary" disabled={saving} onClick={() => revokeDocument(item)}>Cancelar</button>}</div>
          </div>)}
        </DataList>
      </div>
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <SectionHeader title="Solicitações" subtitle="Pedidos que aguardam análise ou emissão" />
        <DataList empty="Nenhuma solicitação registrada." loading={loading}>
          {requests.map(item => <div key={item.id} className="secretariat-data-row" style={rowStyle}>
            <div style={{ flex: '1 1 280px' }}><strong>{item.member_name || 'Membro não informado'}</strong><small>{typeLabel(item.request_type)} · Solicitado em {dateLabel(item.created_at)}</small>{item.payload?.notes && <small>{item.payload.notes}</small>}</div>
            <span style={statusStyle(item.status)}>{statusLabel(item.status)}</span>
            {['PENDING', 'UNDER_REVIEW'].includes(item.status) && <div style={{ display: 'flex', gap: 6 }}><button className="btn-secondary" onClick={() => updateStatus('requests', item.id, 'REJECTED')}>Rejeitar</button><button className="btn-primary" onClick={() => updateStatus('requests', item.id, 'APPROVED')}>Aprovar</button></div>}
          </div>)}
        </DataList>
      </div>
    </div>
  );

  const renderBaptisms = () => (
    <div style={{ ...cardStyle, overflow: 'hidden' }}>
      <SectionHeader title="Registros de batismo" subtitle="Histórico utilizado na emissão de certificados" actions={actions} />
      <DataList empty="Nenhum batismo registrado." loading={loading}>
        {baptisms.map(item => <div key={item.id} className="secretariat-data-row" style={rowStyle}>
          <div style={{ flex: '1 1 260px' }}><strong>{item.member_name}</strong><small>{item.member_email || 'Sem e-mail'} · {item.campus_name || 'Sede'}</small><small>{item.baptism_church || 'Igreja não informada'}</small></div>
          <div><small>Data do batismo</small><strong>{dateLabel(item.baptism_date)}</strong></div>
          <div><small>Local / cidade</small><strong>{item.baptism_location || item.baptism_city || '—'}</strong></div>
          <div><small>Ministro</small><strong>{item.officiant_name || '—'}</strong></div>
        </div>)}
      </DataList>
    </div>
  );

  const renderTemplates = () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <SectionHeader title="Modelos de documentos" subtitle="Cada alteração cria uma nova versão preservando documentos anteriores" actions={actions} />
        <DataList empty="Nenhum modelo cadastrado." loading={loading}>
          {templates.map(item => <div key={item.id} className="secretariat-data-row" style={rowStyle}>
            <div style={{ flex: '1 1 280px' }}><strong>{item.name}</strong><small>{typeLabel(item.document_type)} · Versão {item.version}</small></div>
            <span style={statusStyle(item.is_active ? 'VALID' : 'REVOKED')}>{item.is_active ? 'Ativo' : 'Inativo'}</span>
            <button className="btn-secondary" onClick={() => { setPreview({ ...item, template_snapshot: { rendered: item.template_schema } }); setModal('preview'); }}>Pré-visualizar</button>
          </div>)}
        </DataList>
      </div>
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <SectionHeader title="Signatários autorizados" subtitle="Pessoas exibidas na assinatura dos documentos" />
        <DataList empty="Nenhum signatário cadastrado." loading={loading}>
          {signatories.map(item => <div key={item.id} className="secretariat-data-row" style={rowStyle}><div style={{ flex: 1 }}><strong>{item.name}</strong><small>{item.title}</small></div><span style={statusStyle(item.is_active ? 'VALID' : 'REVOKED')}>{item.is_active ? 'Ativo' : 'Inativo'}</span></div>)}
        </DataList>
      </div>
    </div>
  );

  const rendered = activeSubtab === 'secretariat_movements' ? renderMovements()
    : activeSubtab === 'secretariat_documents' ? renderDocuments()
      : activeSubtab === 'secretariat_baptisms' ? renderBaptisms() : renderTemplates();

  return <>
    <style>{`.secretariat-data-row strong,.secretariat-data-row small{display:block}.secretariat-data-row small{margin-top:3px;color:var(--text-muted);font-size:.7rem}.secretariat-data-row>div>strong{font-size:.8rem}`}</style>
    {error && <Message kind="error">{error}</Message>}
    {success && <Message kind="success">{success}</Message>}
    {rendered}
    {modal && createPortal(
      modal === 'preview'
        ? <PreviewModal item={preview} onClose={() => setModal(null)} />
        : <FormModal type={modal} form={forms[modal]} saving={saving} onClose={() => !saving && setModal(null)} onSubmit={submit} onChange={(field, value) => updateForm(modal, field, value)} members={memberOptions} campuses={campusOptions} templates={templateOptions} signatories={signatoryOptions} requests={pendingRequests} />,
      document.body
    )}
  </>;
};

const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '14px 16px', borderTop: '1px solid var(--panel-border, #e2e8f0)', color: 'var(--text-main)' };

const SectionHeader = ({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) => <div style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div><h2 style={{ margin: 0, fontSize: '1rem' }}>{title}</h2><p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{subtitle}</p></div>{actions}</div>;

const DataList = ({ empty, loading, children }: { empty: string; loading: boolean; children: React.ReactNode }) => {
  const count = React.Children.count(children);
  if (loading) return <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando dados...</div>;
  if (!count) return <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>{empty}</div>;
  return <div>{children}</div>;
};

const Message = ({ kind, children }: { kind: 'error' | 'success'; children: React.ReactNode }) => <div style={{ marginBottom: 14, padding: '11px 14px', borderRadius: 10, border: `1px solid ${kind === 'error' ? '#fecaca' : '#a7f3d0'}`, background: kind === 'error' ? '#fef2f2' : '#ecfdf5', color: kind === 'error' ? '#b91c1c' : '#047857', fontSize: '0.78rem', fontWeight: 700 }}>{children}</div>;

interface FormModalProps { type: Exclude<ModalType, 'preview' | null>; form: any; saving: boolean; onClose: () => void; onSubmit: (event: React.FormEvent) => void; onChange: (field: string, value: string) => void; members: any[]; campuses: any[]; templates: any[]; signatories: any[]; requests: any[]; }

const FormModal: React.FC<FormModalProps> = ({ type, form, saving, onClose, onSubmit, onChange, members, campuses, templates, signatories, requests }) => {
  const titles: Record<string, string> = { movement: 'Nova movimentação', request: 'Nova solicitação', document: 'Emitir documento', baptism: 'Registrar batismo', template: 'Novo modelo de documento', signatory: 'Cadastrar signatário' };
  const memberSelect = (required = true) => <Field label="Membro"><select className="input-modern" value={form.member_id} required={required} onChange={e => onChange('member_id', e.target.value)}><option value="">{required ? 'Selecione um membro' : 'Vincular a um membro (opcional)'}</option>{members.map(member => <option key={member.id} value={member.id}>{member.name}{member.registry_number ? ` · ${member.registry_number}` : ''}</option>)}</select></Field>;
  return <form className="modal-overlay animate-fade-in" onSubmit={onSubmit} onClick={onClose}>
    <div className="modal-studio-container" style={{ maxWidth: 820, maxHeight: '94vh' }} onClick={event => event.stopPropagation()}>
      <div className="modal-studio-header"><div className="modal-studio-header-left"><div className="modal-studio-header-icon">🗂️</div><div><h2 className="modal-studio-title">{titles[type]}</h2><p className="modal-studio-subtitle">Os dados serão registrados no histórico da Secretaria.</p></div></div><button type="button" className="modal-close-circle" onClick={onClose}>✕</button></div>
      <div className="modal-studio-body" style={{ padding: '22px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 15 }}>
        {type === 'movement' && <>{memberSelect()}<Field label="Tipo"><select className="input-modern" value={form.movement_type} onChange={e => onChange('movement_type', e.target.value)}><option value="INTERNAL_TRANSFER">Entre unidades</option><option value="EXTERNAL_TRANSFER_OUT">Para outra igreja</option><option value="EXTERNAL_TRANSFER_IN">Receber de outra igreja</option></select></Field>{form.movement_type === 'INTERNAL_TRANSFER' ? <Field label="Unidade de destino"><select required className="input-modern" value={form.to_campus_id} onChange={e => onChange('to_campus_id', e.target.value)}><option value="">Selecione</option>{campuses.map(campus => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select></Field> : <Field label="Igreja de origem/destino"><input required className="input-modern" value={form.external_church_name} onChange={e => onChange('external_church_name', e.target.value)} /></Field>}<Field label="Data prevista"><input type="date" className="input-modern" value={form.effective_date} onChange={e => onChange('effective_date', e.target.value)} /></Field><Field label="Motivo" full><textarea required rows={3} className="input-modern" value={form.reason} onChange={e => onChange('reason', e.target.value)} /></Field><Field label="Observações" full><textarea rows={3} className="input-modern" value={form.notes} onChange={e => onChange('notes', e.target.value)} /></Field></>}
        {type === 'request' && <>{memberSelect()}<Field label="Tipo de solicitação"><select className="input-modern" value={form.request_type} onChange={e => onChange('request_type', e.target.value)}><option value="LETTER_PRESENTATION">Carta de apresentação</option><option value="LETTER_TRANSFER">Carta de transferência</option><option value="BAPTISM_CERTIFICATE">Certificado de batismo</option><option value="DECLARATION">Declaração</option><option value="OTHER">Outro</option></select></Field><Field label="Detalhes da solicitação" full><textarea rows={5} className="input-modern" value={form.notes} onChange={e => onChange('notes', e.target.value)} /></Field></>}
        {type === 'document' && <>{memberSelect()}<Field label="Modelo"><select required className="input-modern" value={form.template_id} onChange={e => onChange('template_id', e.target.value)}><option value="">Selecione um modelo</option>{templates.map(template => <option key={template.id} value={template.id}>{template.name} · v{template.version}</option>)}</select></Field><Field label="Signatário"><select className="input-modern" value={form.signatory_id} onChange={e => onChange('signatory_id', e.target.value)}><option value="">Sem signatário</option>{signatories.map(item => <option key={item.id} value={item.id}>{item.name} · {item.title}</option>)}</select></Field><Field label="Vincular solicitação"><select className="input-modern" value={form.request_id} onChange={e => onChange('request_id', e.target.value)}><option value="">Sem solicitação vinculada</option>{requests.filter(request => !form.member_id || request.member_id === form.member_id).map(request => <option key={request.id} value={request.id}>{typeLabel(request.request_type)} · {request.member_name}</option>)}</select></Field><Field label="Igreja de destino (quando aplicável)" full><input className="input-modern" value={form.destination_church} onChange={e => onChange('destination_church', e.target.value)} /></Field></>}
        {type === 'baptism' && <>{memberSelect()}<Field label="Data do batismo"><input required type="date" className="input-modern" value={form.baptism_date} onChange={e => onChange('baptism_date', e.target.value)} /></Field><Field label="Igreja"><input className="input-modern" value={form.baptism_church} onChange={e => onChange('baptism_church', e.target.value)} /></Field><Field label="Local"><input className="input-modern" value={form.baptism_location} onChange={e => onChange('baptism_location', e.target.value)} /></Field><Field label="Cidade"><input className="input-modern" value={form.baptism_city} onChange={e => onChange('baptism_city', e.target.value)} /></Field><Field label="Ministro responsável"><input className="input-modern" value={form.officiant_name} onChange={e => onChange('officiant_name', e.target.value)} /></Field><Field label="Cerimônia"><input className="input-modern" value={form.ceremony_name} onChange={e => onChange('ceremony_name', e.target.value)} /></Field><Field label="Observações" full><textarea rows={3} className="input-modern" value={form.notes} onChange={e => onChange('notes', e.target.value)} /></Field></>}
        {type === 'template' && <><Field label="Tipo"><select className="input-modern" value={form.document_type} onChange={e => onChange('document_type', e.target.value)}><option value="PRESENTATION_LETTER">Carta de apresentação</option><option value="TRANSFER_LETTER">Carta de transferência</option><option value="BAPTISM_CERTIFICATE">Certificado de batismo</option><option value="DECLARATION">Declaração</option><option value="OTHER">Outro</option></select></Field><Field label="Nome do modelo"><input required className="input-modern" value={form.name} onChange={e => onChange('name', e.target.value)} /></Field><Field label="Título do documento" full><input required className="input-modern" value={form.title} onChange={e => onChange('title', e.target.value)} /></Field><Field label="Conteúdo" full><textarea required rows={8} className="input-modern" value={form.body} onChange={e => onChange('body', e.target.value)} placeholder="Use {{member_name}}, {{registry_number}}, {{organization_name}}, {{issue_date}}, {{signatory_name}}..." /></Field><Field label="Rodapé" full><textarea rows={3} className="input-modern" value={form.footer} onChange={e => onChange('footer', e.target.value)} /></Field><Field label="Orientação"><select className="input-modern" value={form.orientation} onChange={e => onChange('orientation', e.target.value)}><option value="portrait">Retrato</option><option value="landscape">Paisagem</option></select></Field></>}
        {type === 'signatory' && <>{memberSelect(false)}<Field label="Nome"><input required className="input-modern" value={form.name} onChange={e => onChange('name', e.target.value)} /></Field><Field label="Função / título"><input required className="input-modern" value={form.title} onChange={e => onChange('title', e.target.value)} placeholder="Ex: Pastor Presidente" /></Field></>}
      </div>
      <div className="modal-studio-footer"><button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button></div>
    </div>
  </form>;
};

const Field = ({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) => <div className="form-group-modern" style={full ? { gridColumn: '1 / -1' } : undefined}><label className="form-label-modern">{label}</label>{children}</div>;

const PreviewModal = ({ item, onClose }: { item: any; onClose: () => void }) => {
  const rendered = item?.template_snapshot?.rendered || {};
  return <div className="modal-overlay animate-fade-in" onClick={onClose}><div className="modal-studio-container" style={{ maxWidth: 820, maxHeight: '94vh' }} onClick={event => event.stopPropagation()}><div className="modal-studio-header"><div><h2 className="modal-studio-title">{rendered.title || item?.name || item?.document_number || 'Documento'}</h2><p className="modal-studio-subtitle">{item?.document_number ? `${item.document_number} · ${statusLabel(item.status)}` : `Prévia do modelo · versão ${item?.version || 1}`}</p></div><button className="modal-close-circle" onClick={onClose}>✕</button></div><div className="modal-studio-body" style={{ padding: 30 }}><div style={{ maxWidth: 680, margin: '0 auto', background: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: 12, padding: '44px 40px', minHeight: 420 }}><h1 style={{ textAlign: 'center', fontSize: '1.45rem', margin: '0 0 34px' }}>{rendered.title || 'Documento Eclesiástico'}</h1><div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '0.92rem' }}>{rendered.body || 'O conteúdo deste modelo será preenchido durante a emissão.'}</div><div style={{ whiteSpace: 'pre-wrap', marginTop: 48, paddingTop: 18, borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#475569', fontSize: '0.78rem' }}>{rendered.footer || ''}</div></div></div><div className="modal-studio-footer"><button className="btn-primary" onClick={onClose}>Fechar</button></div></div></div>;
};
