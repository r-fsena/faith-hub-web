import React, { useMemo, useState } from 'react';
import { getAuthHeaders } from '../services/apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

type ApiCall = (path: string, options?: RequestInit) => Promise<any>;

interface Props {
  templates: any[];
  campuses: any[];
  loading: boolean;
  saving: boolean;
  callApi: ApiCall;
  onRefresh: () => Promise<void>;
  onSaving: (value: boolean) => void;
  onFeedback: (kind: 'success' | 'error', message: string) => void;
}

const PLACEHOLDERS = [
  ['member_name', 'Nome do membro'], ['registry_number', 'Número de registro'],
  ['organization_name', 'Nome da igreja'], ['campus_name', 'Nome da unidade'],
  ['issue_date', 'Data de emissão'], ['baptism_date', 'Data do batismo'],
  ['destination_church', 'Igreja de destino'], ['signatory_name', 'Nome do signatário'],
  ['signatory_title', 'Função do signatário'], ['document_number', 'Número do documento']
];

const SAMPLE_VALUES: Record<string, string> = {
  member_name: 'João da Silva', registry_number: 'MEM-2026-0012', organization_name: 'Comunidade Faith-Hub',
  campus_name: 'Sede', issue_date: '28/10/2026', baptism_date: '18/10/2026',
  destination_church: 'Igreja de Destino', signatory_name: 'Pr. Responsável', signatory_title: 'Pastor Presidente',
  document_number: 'FH-DOC-20261028-ABC123'
};

const DEFAULT_SCHEMA = {
  title: 'Novo documento', subtitle: '', body: 'Declaramos, para os devidos fins, que {{member_name}} integra esta comunidade de fé.',
  footer: '{{organization_name}} · Emitido em {{issue_date}}\n{{signatory_name}} · {{signatory_title}}', orientation: 'portrait',
  design: {
    page_size: 'A4', primary_color: '#0f766e', secondary_color: '#d4af37', text_color: '#1e293b',
    background_color: '#ffffff', border_color: '#0f766e', border_style: 'single', border_width: 2,
    margin_mm: 20, title_font_size: 26, body_font_size: 13, font_family: 'times', text_align: 'justify',
    logo_url: '', watermark_url: '', watermark_opacity: .08, show_document_number: true, show_qr_code: true,
    signature_layout: 'single'
  }
};

const card: React.CSSProperties = { background: 'var(--bg-card, #fff)', border: '1px solid var(--panel-border, #e2e8f0)', borderRadius: 16, boxShadow: 'var(--shadow-sm, 0 4px 12px rgba(15,23,42,.06))' };
const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid var(--panel-border, #cbd5e1)', borderRadius: 9, padding: '9px 10px', background: 'var(--bg-card, #fff)', color: 'var(--text-main)' };

function typeLabel(type: string): string {
  return ({ PRESENTATION_LETTER: 'Carta de apresentação', TRANSFER_LETTER: 'Carta de transferência', BAPTISM_CERTIFICATE: 'Certificado de batismo', DECLARATION: 'Declaração', OTHER: 'Outro documento' } as Record<string, string>)[type] || type;
}

function statusMeta(status: string): { label: string; color: string; background: string } {
  return ({
    DRAFT: { label: 'Rascunho', color: '#475569', background: '#f1f5f9' },
    PENDING_APPROVAL: { label: 'Aguardando aprovação', color: '#b45309', background: '#fffbeb' },
    PUBLISHED: { label: 'Publicado', color: '#047857', background: '#ecfdf5' },
    REJECTED: { label: 'Rejeitado', color: '#b91c1c', background: '#fef2f2' },
    ARCHIVED: { label: 'Arquivado', color: '#475569', background: '#e2e8f0' }
  } as Record<string, any>)[status] || { label: status || '—', color: '#475569', background: '#f1f5f9' };
}

function replaceFields(value: string): string {
  return String(value || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => SAMPLE_VALUES[key] || `{{${key}}}`);
}

function normalizedSchema(template?: any): any {
  const schema = template?.template_schema || {};
  return { ...DEFAULT_SCHEMA, ...schema, design: { ...DEFAULT_SCHEMA.design, ...(schema.design || {}) } };
}

export const SecretariatTemplateStudio: React.FC<Props> = ({ templates, campuses, loading, saving, callApi, onRefresh, onSaving, onFeedback }) => {
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ name: '', document_type: 'PRESENTATION_LETTER', schema: normalizedSchema() });
  const [history, setHistory] = useState<any[] | null>(null);
  const [historyName, setHistoryName] = useState('');
  const [copying, setCopying] = useState<any | null>(null);
  const [targetCampus, setTargetCampus] = useState('');
  const [previewing, setPreviewing] = useState<any | null>(null);
  const [uploading, setUploading] = useState('');

  const latestTemplates = useMemo(() => {
    const latest = new Map<string, any>();
    for (const template of templates) {
      const key = template.template_key || template.id;
      const current = latest.get(key);
      if (!current || Number(template.version) > Number(current.version)) latest.set(key, template);
    }
    return Array.from(latest.values());
  }, [templates]);

  const beginNew = () => {
    setEditing({ id: null, status: 'DRAFT' });
    setForm({ name: '', document_type: 'PRESENTATION_LETTER', schema: normalizedSchema() });
  };

  const beginEdit = (template: any) => {
    setEditing(template);
    setForm({ name: template.name, document_type: template.document_type, schema: normalizedSchema(template) });
  };

  const updateSchema = (field: string, value: any) => setForm((current: any) => ({ ...current, schema: { ...current.schema, [field]: value } }));
  const updateDesign = (field: string, value: any) => setForm((current: any) => ({ ...current, schema: { ...current.schema, design: { ...current.schema.design, [field]: value } } }));

  const uploadAsset = async (file: File, field: 'logo_url' | 'watermark_url') => {
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      onFeedback('error', 'Envie uma imagem PNG, JPG ou WEBP de até 5 MB.'); return;
    }
    setUploading(field);
    try {
      const headers = await getAuthHeaders();
      const query = new URLSearchParams({ filename: file.name, contentType: file.type, prefix: 'secretariat-templates' });
      const response = await fetch(`${API_URL}/upload-url?${query}`, { headers });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.uploadUrl || !data.fileUrl) throw new Error(data.message || data.error || 'Não foi possível preparar o envio.');
      const upload = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!upload.ok) throw new Error('Não foi possível enviar a imagem.');
      updateDesign(field, data.fileUrl);
      onFeedback('success', field === 'logo_url' ? 'Logotipo enviado.' : "Marca d'água enviada.");
    } catch (error: any) { onFeedback('error', error.message || 'Não foi possível enviar a imagem.'); }
    finally { setUploading(''); }
  };

  const execute = async (work: () => Promise<any>, fallback: string) => {
    onSaving(true);
    try {
      const result = await work();
      onFeedback('success', result.message || fallback);
      await onRefresh();
      return result;
    } catch (error: any) {
      onFeedback('error', error.message || 'Não foi possível concluir a operação.');
      return null;
    } finally { onSaving(false); }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const path = editing?.id ? `templates/${encodeURIComponent(editing.id)}` : 'templates';
    const method = editing?.id ? 'PUT' : 'POST';
    const result = await execute(() => callApi(path, { method, body: JSON.stringify({ name: form.name, document_type: form.document_type, template_schema: form.schema }) }), 'Modelo salvo como rascunho.');
    if (result) setEditing(null);
  };

  const changeStatus = (template: any, action: string) => execute(
    () => callApi(`templates/${encodeURIComponent(template.id)}/status`, { method: 'PATCH', body: JSON.stringify({ action }) }),
    'Situação do modelo atualizada.'
  );

  const duplicate = (template: any) => execute(
    () => callApi(`templates/${encodeURIComponent(template.id)}/duplicate`, { method: 'POST', body: JSON.stringify({}) }),
    'Modelo duplicado.'
  );

  const copyToCampus = async () => {
    if (!copying || !targetCampus) return;
    const result = await execute(
      () => callApi(`templates/${encodeURIComponent(copying.id)}/copy-campus`, { method: 'POST', body: JSON.stringify({ target_campus_id: targetCampus }) }),
      'Modelo copiado para a unidade.'
    );
    if (result) { setCopying(null); setTargetCampus(''); }
  };

  const openHistory = async (template: any) => {
    onSaving(true);
    try {
      const result = await callApi(`templates/${encodeURIComponent(template.id)}/history`);
      setHistory(result.data || []); setHistoryName(template.name);
    } catch (error: any) { onFeedback('error', error.message || 'Não foi possível carregar o histórico.'); }
    finally { onSaving(false); }
  };

  if (editing) {
    const schema = form.schema;
    return <form onSubmit={save} style={{ display: 'grid', gap: 14 }}>
      <div style={{ ...card, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div><strong style={{ fontSize: '1rem' }}>{editing.id ? `Editar ${editing.name}` : 'Novo modelo'}</strong><div style={{ marginTop: 3, color: 'var(--text-muted)', fontSize: '.72rem' }}>A publicação cria uma versão oficial sem alterar documentos anteriores.</div></div>
        <div style={{ display: 'flex', gap: 8 }}><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button><button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar rascunho'}</button></div>
      </div>
      <div className="secretariat-editor-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,.85fr) minmax(380px,1.25fr)', gap: 14, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <EditorSection title="Identificação">
            <Field label="Nome do modelo"><input required style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Tipo"><select style={input} value={form.document_type} onChange={e => setForm({ ...form, document_type: e.target.value })}><option value="PRESENTATION_LETTER">Carta de apresentação</option><option value="TRANSFER_LETTER">Carta de transferência</option><option value="BAPTISM_CERTIFICATE">Certificado de batismo</option><option value="DECLARATION">Declaração</option><option value="OTHER">Outro</option></select></Field>
            <Field label="Título"><input required style={input} value={schema.title} onChange={e => updateSchema('title', e.target.value)} /></Field>
            <Field label="Subtítulo"><input style={input} value={schema.subtitle || ''} onChange={e => updateSchema('subtitle', e.target.value)} /></Field>
          </EditorSection>
          <EditorSection title="Conteúdo e campos dinâmicos">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{PLACEHOLDERS.map(([key, label]) => <button type="button" key={key} title={label} onClick={() => updateSchema('body', `${schema.body || ''} {{${key}}}`.trim())} style={{ border: '1px solid #99f6e4', background: '#f0fdfa', color: '#0f766e', borderRadius: 999, padding: '4px 7px', fontSize: '.63rem', cursor: 'pointer' }}>{label}</button>)}</div>
            <Field label="Texto principal"><textarea required rows={9} style={input} value={schema.body} onChange={e => updateSchema('body', e.target.value)} /></Field>
            <Field label="Rodapé"><textarea rows={3} style={input} value={schema.footer || ''} onChange={e => updateSchema('footer', e.target.value)} /></Field>
          </EditorSection>
          <EditorSection title="Layout e identidade visual">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              <Field label="Orientação"><select style={input} value={schema.orientation} onChange={e => updateSchema('orientation', e.target.value)}><option value="portrait">Retrato</option><option value="landscape">Paisagem</option></select></Field>
              <Field label="Fonte"><select style={input} value={schema.design.font_family} onChange={e => updateDesign('font_family', e.target.value)}><option value="times">Clássica</option><option value="helvetica">Moderna</option><option value="courier">Monoespaçada</option></select></Field>
              <ColorField label="Cor principal" value={schema.design.primary_color} onChange={value => updateDesign('primary_color', value)} />
              <ColorField label="Cor secundária" value={schema.design.secondary_color} onChange={value => updateDesign('secondary_color', value)} />
              <ColorField label="Cor do texto" value={schema.design.text_color} onChange={value => updateDesign('text_color', value)} />
              <ColorField label="Fundo" value={schema.design.background_color} onChange={value => updateDesign('background_color', value)} />
              <Field label="Moldura"><select style={input} value={schema.design.border_style} onChange={e => updateDesign('border_style', e.target.value)}><option value="none">Sem moldura</option><option value="single">Simples</option><option value="double">Dupla</option><option value="classic">Clássica</option></select></Field>
              <ColorField label="Cor da moldura" value={schema.design.border_color} onChange={value => updateDesign('border_color', value)} />
              <Field label="Margem (mm)"><input type="number" min="8" max="40" style={input} value={schema.design.margin_mm} onChange={e => updateDesign('margin_mm', Number(e.target.value))} /></Field>
              <Field label="Título (pt)"><input type="number" min="16" max="48" style={input} value={schema.design.title_font_size} onChange={e => updateDesign('title_font_size', Number(e.target.value))} /></Field>
              <Field label="Texto (pt)"><input type="number" min="9" max="22" style={input} value={schema.design.body_font_size} onChange={e => updateDesign('body_font_size', Number(e.target.value))} /></Field>
              <Field label="Alinhamento"><select style={input} value={schema.design.text_align} onChange={e => updateDesign('text_align', e.target.value)}><option value="left">Esquerda</option><option value="center">Centralizado</option><option value="justify">Justificado</option></select></Field>
            </div>
            <Field label="Logotipo"><input type="url" style={input} value={schema.design.logo_url || ''} onChange={e => updateDesign('logo_url', e.target.value)} placeholder="https://..." /><label className="btn-secondary" style={{ textAlign: 'center', cursor: 'pointer' }}>{uploading === 'logo_url' ? 'Enviando...' : 'Enviar imagem'}<input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={Boolean(uploading)} onChange={e => e.target.files?.[0] && uploadAsset(e.target.files[0], 'logo_url')} /></label></Field>
            <Field label="Marca d'água"><input type="url" style={input} value={schema.design.watermark_url || ''} onChange={e => updateDesign('watermark_url', e.target.value)} placeholder="https://..." /><label className="btn-secondary" style={{ textAlign: 'center', cursor: 'pointer' }}>{uploading === 'watermark_url' ? 'Enviando...' : 'Enviar imagem'}<input type="file" accept="image/png,image/jpeg,image/webp" hidden disabled={Boolean(uploading)} onChange={e => e.target.files?.[0] && uploadAsset(e.target.files[0], 'watermark_url')} /></label></Field>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}><Check label="Exibir número" checked={schema.design.show_document_number} onChange={value => updateDesign('show_document_number', value)} /><Check label="Exibir QR Code" checked={schema.design.show_qr_code} onChange={value => updateDesign('show_qr_code', value)} /></div>
          </EditorSection>
        </div>
        <div style={{ position: 'sticky', top: 16 }}><DocumentPreview schema={schema} name={form.name} /></div>
      </div>
      <style>{`@media(max-width:1000px){.secretariat-editor-grid{grid-template-columns:1fr!important}.secretariat-editor-grid>div:last-child{position:static!important}}`}</style>
    </form>;
  }

  return <div style={{ display: 'grid', gap: 14 }}>
    <div style={{ ...card, padding: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}><div><h2 style={{ margin: 0, fontSize: '1rem' }}>Modelos e identidade dos documentos</h2><p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '.75rem' }}>Rascunhos, aprovação, versões oficiais e designs por unidade.</p></div><button className="btn-primary" onClick={beginNew}>+ Novo modelo</button></div>
    <div style={{ ...card, overflow: 'hidden' }}>
      {loading ? <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando modelos...</div>
        : latestTemplates.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum modelo cadastrado.</div>
          : latestTemplates.map(template => {
            const meta = statusMeta(template.status);
            return <div key={template.id} style={{ padding: '14px 16px', borderTop: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 260px' }}><strong style={{ display: 'block', fontSize: '.83rem' }}>{template.name}</strong><small style={{ display: 'block', color: 'var(--text-muted)', marginTop: 3 }}>{typeLabel(template.document_type)} · Versão {template.version} · {template.campus_name || 'Toda a organização'}</small></div>
              <span style={{ color: meta.color, background: meta.background, borderRadius: 999, padding: '4px 8px', fontSize: '.66rem', fontWeight: 900 }}>{meta.label}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={() => setPreviewing(template)}>Prévia</button>
                <button className="btn-secondary" onClick={() => beginEdit(template)}>Editar</button>
                <button className="btn-secondary" disabled={saving} onClick={() => duplicate(template)}>Duplicar</button>
                {campuses.length > 0 && <button className="btn-secondary" onClick={() => { setCopying(template); setTargetCampus(''); }}>Copiar unidade</button>}
                <button className="btn-secondary" onClick={() => openHistory(template)}>Histórico</button>
                {['DRAFT', 'REJECTED'].includes(template.status) && <button className="btn-primary" disabled={saving} onClick={() => changeStatus(template, 'SUBMIT')}>Enviar para aprovação</button>}
                {template.status === 'PENDING_APPROVAL' && <><button className="btn-secondary" disabled={saving} onClick={() => changeStatus(template, 'REJECT')}>Rejeitar</button><button className="btn-primary" disabled={saving} onClick={() => changeStatus(template, 'APPROVE')}>Aprovar e publicar</button></>}
                {template.status === 'PUBLISHED' && <button className="btn-secondary" disabled={saving} onClick={() => changeStatus(template, 'ARCHIVE')}>Arquivar</button>}
                {template.status === 'ARCHIVED' && <button className="btn-primary" disabled={saving} onClick={() => changeStatus(template, 'RESTORE')}>Restaurar</button>}
              </div>
            </div>;
          })}
    </div>
    {copying && <div style={{ ...card, padding: 16, display: 'flex', gap: 10, alignItems: 'end', flexWrap: 'wrap' }}><Field label={`Copiar “${copying.name}” para`}><select style={{ ...input, minWidth: 240 }} value={targetCampus} onChange={e => setTargetCampus(e.target.value)}><option value="">Selecione a unidade</option>{campuses.map(campus => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select></Field><button className="btn-secondary" onClick={() => setCopying(null)}>Cancelar</button><button className="btn-primary" disabled={!targetCampus || saving} onClick={copyToCampus}>Criar rascunho na unidade</button></div>}
    {history && <div style={{ ...card, padding: 18 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><h3 style={{ margin: 0, fontSize: '.95rem' }}>Histórico · {historyName}</h3><p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: '.7rem' }}>Versões anteriores permanecem preservadas.</p></div><button className="btn-secondary" onClick={() => setHistory(null)}>Fechar</button></div><div style={{ marginTop: 12 }}>{history.map(item => { const meta = statusMeta(item.status); return <div key={item.id} style={{ display: 'flex', gap: 12, justifyContent: 'space-between', padding: '9px 0', borderTop: '1px solid var(--panel-border)', fontSize: '.75rem' }}><span>Versão {item.version} · {item.campus_name || 'Toda a organização'}</span><span>{item.approved_by_name || 'Sem aprovador registrado'}</span><strong style={{ color: meta.color }}>{meta.label}</strong></div>; })}</div></div>}
    {previewing && <div style={{ ...card, padding: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><strong>Prévia · {previewing.name}</strong><button className="btn-secondary" onClick={() => setPreviewing(null)}>Fechar</button></div><DocumentPreview schema={normalizedSchema(previewing)} name={previewing.name} /></div>}
  </div>;
};

const EditorSection = ({ title, children }: { title: string; children: React.ReactNode }) => <section style={{ ...card, padding: 15, display: 'grid', gap: 10 }}><h3 style={{ margin: 0, fontSize: '.85rem' }}>{title}</h3>{children}</section>;
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label style={{ display: 'grid', gap: 5, fontSize: '.68rem', fontWeight: 800, color: 'var(--text-muted)' }}>{label}{children}</label>;
const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => <Field label={label}><div style={{ display: 'flex', gap: 6 }}><input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 42, height: 38, border: 0, background: 'transparent' }} /><input value={value} onChange={e => onChange(e.target.value)} style={input} /></div></Field>;
const Check = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) => <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '.72rem', fontWeight: 700 }}><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />{label}</label>;

const DocumentPreview = ({ schema, name }: { schema: any; name: string }) => {
  const design = schema.design || DEFAULT_SCHEMA.design;
  const landscape = schema.orientation === 'landscape';
  const border = design.border_style === 'none' ? 'none' : `${Math.max(1, Number(design.border_width || 2))}px ${design.border_style === 'double' ? 'double' : 'solid'} ${design.border_color}`;
  return <div style={{ ...card, padding: 12, background: '#e2e8f0', overflow: 'auto' }}><div style={{ position: 'relative', width: landscape ? 720 : 510, minHeight: landscape ? 480 : 720, maxWidth: '100%', boxSizing: 'border-box', margin: '0 auto', padding: `${Math.max(24, Number(design.margin_mm || 20) * 1.4)}px`, background: design.background_color, color: design.text_color, border, fontFamily: design.font_family === 'times' ? 'Georgia,serif' : design.font_family === 'courier' ? 'monospace' : 'Arial,sans-serif', overflow: 'hidden' }}>
    {design.watermark_url && <img src={design.watermark_url} alt="" style={{ position: 'absolute', width: '46%', left: '27%', top: '27%', opacity: design.watermark_opacity, pointerEvents: 'none' }} />}
    <div style={{ position: 'relative', zIndex: 1 }}>
      {design.logo_url && <img src={design.logo_url} alt="Logotipo" style={{ display: 'block', maxWidth: 110, maxHeight: 72, margin: '0 auto 18px', objectFit: 'contain' }} />}
      <h1 style={{ margin: 0, textAlign: 'center', color: design.primary_color, fontSize: `${Math.max(18, Number(design.title_font_size || 26))}px` }}>{replaceFields(schema.title || name || 'Documento')}</h1>
      {schema.subtitle && <p style={{ textAlign: 'center', color: design.secondary_color, fontWeight: 700, margin: '8px 0 24px' }}>{replaceFields(schema.subtitle)}</p>}
      {design.show_document_number && <div style={{ textAlign: 'right', color: '#64748b', fontSize: 9, marginTop: 10 }}>Documento {SAMPLE_VALUES.document_number}</div>}
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, textAlign: design.text_align, fontSize: `${Math.max(10, Number(design.body_font_size || 13))}px`, marginTop: 28 }}>{replaceFields(schema.body)}</div>
      <div style={{ marginTop: 70, textAlign: 'center' }}><div style={{ width: 190, borderTop: `1px solid ${design.primary_color}`, margin: '0 auto 7px' }}>{SAMPLE_VALUES.signatory_name}</div><small>{SAMPLE_VALUES.signatory_title}</small></div>
      <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center', color: '#64748b', fontSize: 10, marginTop: 42 }}>{replaceFields(schema.footer)}</div>
      {design.show_qr_code && <div style={{ position: 'absolute', left: 0, bottom: -4, width: 58, height: 58, border: '1px dashed #94a3b8', color: '#64748b', display: 'grid', placeItems: 'center', fontSize: 9, textAlign: 'center' }}>QR<br />validação</div>}
    </div>
  </div></div>;
};
