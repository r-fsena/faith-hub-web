import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export const PublicDocumentVerification = ({ token }: { token: string }) => {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    fetch(`${API_URL}/public/secretariat/documents/${encodeURIComponent(token)}`)
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || 'Documento não encontrado.');
        return data;
      })
      .then(data => { if (active) setResult(data); })
      .catch(loadError => { if (active) setError(loadError.message || 'Não foi possível verificar o documento.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const document = result?.document;
  const valid = Boolean(result?.valid);
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: 'linear-gradient(135deg,#f0fdfa,#f8fafc)' }}>
    <section style={{ width: '100%', maxWidth: 620, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, boxShadow: '0 20px 55px rgba(15,23,42,.12)', overflow: 'hidden' }}>
      <header style={{ padding: '24px 28px', background: valid ? '#0f766e' : '#334155', color: '#fff' }}><div style={{ fontSize: '.7rem', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' }}>Faith-Hub · Verificação oficial</div><h1 style={{ margin: '7px 0 0', fontSize: '1.4rem' }}>{loading ? 'Verificando documento...' : valid ? 'Documento autêntico' : 'Documento sem validade'}</h1></header>
      <div style={{ padding: 28 }}>
        {loading && <p style={{ color: '#64748b' }}>Consultando o registro oficial da Secretaria...</p>}
        {error && <div style={{ padding: 14, borderRadius: 10, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>{error}</div>}
        {document && <>
          <div style={{ padding: 14, borderRadius: 12, background: valid ? '#ecfdf5' : '#fef2f2', color: valid ? '#047857' : '#b91c1c', fontWeight: 900, marginBottom: 18 }}>{valid ? '✓ Registro válido e não revogado' : '⚠ Este documento foi cancelado ou revogado'}</div>
          <dl style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '11px 16px', margin: 0, fontSize: '.84rem' }}>
            <dt style={{ color: '#64748b' }}>Organização</dt><dd style={{ margin: 0, fontWeight: 800 }}>{document.organization_name}</dd>
            <dt style={{ color: '#64748b' }}>Documento</dt><dd style={{ margin: 0, fontWeight: 800 }}>{document.document_label}</dd>
            <dt style={{ color: '#64748b' }}>Número oficial</dt><dd style={{ margin: 0, fontWeight: 800 }}>{document.document_number}</dd>
            <dt style={{ color: '#64748b' }}>Versão do modelo</dt><dd style={{ margin: 0 }}>{document.template_version}</dd>
            <dt style={{ color: '#64748b' }}>Emitido em</dt><dd style={{ margin: 0 }}>{new Date(document.issued_at).toLocaleString('pt-BR')}</dd>
          </dl>
          {document.checksum && <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontFamily: 'monospace', fontSize: '.62rem', wordBreak: 'break-all' }}>Integridade: {document.checksum}</div>}
        </>}
      </div>
    </section>
  </main>;
};
