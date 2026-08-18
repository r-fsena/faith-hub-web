import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Members.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export interface BibleSettingsState {
  enabled_versions: string[];
  default_version: string;
  allow_user_version_switch: boolean;
  daily_verse_enabled: boolean;
  reading_history_enabled: boolean;
  highlights_enabled: boolean;
  whatsapp_share_enabled: boolean;
  featured_reading_book: string;
  pastoral_note: string;
}

const AVAILABLE_VERSIONS = [
  {
    id: 'nvi',
    label: 'NVI',
    name: 'Nova Versão Internacional',
    description: 'Linguagem contemporânea, dinâmica e de altíssima fidelidade aos originais.',
    badge: 'Mais Utilizada',
    badgeColor: '#059669',
    badgeBg: '#ecfdf5'
  },
  {
    id: 'acf',
    label: 'ACF',
    name: 'Almeida Corrigida Fiel',
    description: 'Tradução tradicional formal e rigorosa baseada no Textus Receptus.',
    badge: 'Tradicional',
    badgeColor: '#0284c7',
    badgeBg: '#e0f2fe'
  },
  {
    id: 'aa',
    label: 'AA',
    name: 'Almeida Atualizada',
    description: 'Edição revista de Almeida com estilo sóbrio, elegante e respeitado.',
    badge: 'Clássica',
    badgeColor: '#7c3aed',
    badgeBg: '#f3e8ff'
  },
  {
    id: 'nvt',
    label: 'NVT',
    name: 'Nova Versão Transformadora',
    description: 'Vocabulário acessível, excelente para novos convertidos e jovens.',
    badge: 'Fácil Leitura',
    badgeColor: '#d97706',
    badgeBg: '#fef3c7'
  },
  {
    id: 'kja',
    label: 'KJA',
    name: 'King James Atualizada',
    description: 'Grande autoridade histórica mundial com notas profundas de estudo.',
    badge: 'Estudo Profundo',
    badgeColor: '#dc2626',
    badgeBg: '#fee2e2'
  }
];

const FEATURED_BOOKS = [
  { id: 'jo', name: 'Evangelho de João', testament: 'Novo Testamento' },
  { id: 'rm', name: 'Romanos', testament: 'Novo Testamento' },
  { id: 'sl', name: 'Salmos', testament: 'Antigo Testamento' },
  { id: 'pv', name: 'Provérbios', testament: 'Antigo Testamento' },
  { id: 'mt', name: 'Evangelho de Mateus', testament: 'Novo Testamento' },
  { id: 'ef', name: 'Efésios', testament: 'Novo Testamento' },
  { id: 'gn', name: 'Gênesis', testament: 'Antigo Testamento' },
  { id: 'at', name: 'Atos dos Apóstolos', testament: 'Novo Testamento' }
];

interface BibleConfigProps {
  organizationId?: string;
  churchSlug?: string;
}

export const BibleConfig: React.FC<BibleConfigProps> = ({ organizationId, churchSlug }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [churchName, setChurchName] = useState('Nossa Comunidade');
  const [fullSettings, setFullSettings] = useState<any>(null);

  const [bibleConfig, setBibleConfig] = useState<BibleSettingsState>({
    enabled_versions: ['nvi', 'acf', 'aa'],
    default_version: 'nvi',
    allow_user_version_switch: true,
    daily_verse_enabled: true,
    reading_history_enabled: true,
    highlights_enabled: true,
    whatsapp_share_enabled: true,
    featured_reading_book: 'jo',
    pastoral_note: 'Recomendamos a leitura diária da Palavra de Deus para edificação de sua fé e família.'
  });

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    } catch {
      return { 'Content-Type': 'application/json' };
    }
  };

  useEffect(() => {
    loadSettings();
  }, [organizationId, churchSlug]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organization_id', organizationId);
      if (churchSlug) params.append('slug', churchSlug);

      const res = await fetch(`${API_URL}/church-settings?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setFullSettings(json);
        if (json.church_name) setChurchName(json.church_name);

        if (json.bible_config) {
          const cfg = typeof json.bible_config === 'string' ? JSON.parse(json.bible_config) : json.bible_config;
          setBibleConfig({
            enabled_versions: Array.isArray(cfg.enabled_versions) && cfg.enabled_versions.length > 0 ? cfg.enabled_versions : ['nvi', 'acf', 'aa'],
            default_version: cfg.default_version || 'nvi',
            allow_user_version_switch: cfg.allow_user_version_switch !== false,
            daily_verse_enabled: cfg.daily_verse_enabled !== false,
            reading_history_enabled: cfg.reading_history_enabled !== false,
            highlights_enabled: cfg.highlights_enabled !== false,
            whatsapp_share_enabled: cfg.whatsapp_share_enabled !== false,
            featured_reading_book: cfg.featured_reading_book || 'jo',
            pastoral_note: cfg.pastoral_note !== undefined ? cfg.pastoral_note : 'Recomendamos a leitura diária da Palavra de Deus para edificação de sua fé e família.'
          });
        }
      }
    } catch (e) {
      console.error('Erro ao carregar configurações da Bíblia:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVersion = (versionId: string) => {
    setBibleConfig(prev => {
      const isCurrentlyEnabled = prev.enabled_versions.includes(versionId);
      if (isCurrentlyEnabled) {
        // Não permite desmarcar se for a única versão ativa
        if (prev.enabled_versions.length <= 1) {
          alert('É necessário manter pelo menos uma versão da Bíblia ativa para o aplicativo dos membros.');
          return prev;
        }
        const updated = prev.enabled_versions.filter(v => v !== versionId);
        const newDefault = prev.default_version === versionId ? updated[0] : prev.default_version;
        return { ...prev, enabled_versions: updated, default_version: newDefault };
      } else {
        return { ...prev, enabled_versions: [...prev.enabled_versions, versionId] };
      }
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const headers = await getAuthHeaders();
      const payload = {
        ...(fullSettings || {}),
        organization_id: organizationId || fullSettings?.organization_id,
        bible_config: bibleConfig
      };

      const res = await fetch(`${API_URL}/church-settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      } else {
        alert('Erro ao salvar as configurações da Bíblia.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao comunicar com o servidor.');
    } finally {
      setSaving(false);
    }
  };

  const selectedBookName = FEATURED_BOOKS.find(b => b.id === bibleConfig.featured_reading_book)?.name || 'Evangelho de João';

  return (
    <div className="members-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900 }}>
              📖
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.4px' }}>
                Bíblias
              </h1>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Defina as traduções canônicas disponíveis, versão padrão e orientações pastorais para o App PWA da <strong>{churchName}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Ação Salvar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {savedSuccess && (
            <span className="animate-fade-in" style={{ background: '#ecfdf5', color: '#059669', padding: '8px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              ✓ Configurações salvas e ativas no PWA!
            </span>
          )}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || loading}
            style={{
              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(15, 118, 110, 0.35)',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Salvando...' : '💾 Salvar Alterações'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="portal-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando configurações da Bíblia...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
          
          {/* COLUNA 1: CONFIGURAÇÕES & TRADUÇÕES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* SEÇÃO 1: VERSÕES & TRADUÇÕES DISPONÍVEIS */}
            <div className="portal-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Traduções e Versões Bíblicas
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Ative ou desative as versões que os membros e visitantes poderão consultar no aplicativo.
                  </p>
                </div>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--accent-primary)', background: 'var(--accent-primary-light)', padding: '4px 10px', borderRadius: 999 }}>
                  {bibleConfig.enabled_versions.length} de {AVAILABLE_VERSIONS.length} Ativas
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {AVAILABLE_VERSIONS.map(ver => {
                  const isEnabled = bibleConfig.enabled_versions.includes(ver.id);
                  const isDefault = bibleConfig.default_version === ver.id;

                  return (
                    <div
                      key={ver.id}
                      onClick={() => handleToggleVersion(ver.id)}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '14px',
                        border: isEnabled ? '1.5px solid var(--accent-primary)' : '1px solid var(--panel-border)',
                        background: isEnabled ? 'var(--accent-primary-light)' : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                        {/* Checkbox Visual */}
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          border: isEnabled ? '2px solid var(--accent-primary)' : '2px solid #cbd5e1',
                          background: isEnabled ? 'var(--accent-primary)' : '#ffffff',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 900,
                          flexShrink: 0
                        }}>
                          {isEnabled ? '✓' : ''}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.94rem', color: 'var(--text-main)' }}>
                              {ver.name} ({ver.label})
                            </strong>
                            <span style={{ background: ver.badgeBg, color: ver.badgeColor, fontSize: '0.66rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                              {ver.badge}
                            </span>
                            {isDefault && (
                              <span style={{ background: '#0f766e', color: '#ffffff', fontSize: '0.66rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                                ★ Versão Padrão Inicial
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {ver.description}
                          </p>
                        </div>
                      </div>

                      {/* Botão Tornar Padrão */}
                      {isEnabled && !isDefault && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBibleConfig({ ...bibleConfig, default_version: ver.id });
                          }}
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--panel-border)',
                            color: 'var(--text-main)',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0,
                            marginLeft: '12px'
                          }}
                        >
                          Definir como Padrão
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO 2: EXPERIÊNCIA DO LEITOR NO APP */}
            <div className="portal-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                Experiência & Interatividade no PWA
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                Ajuste os recursos de estudo, leitura e compartilhamento disponíveis para a congregação.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Switch 1: Troca de Versão pelo Usuário */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--panel-border)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                      Permitir troca de versão pelo membro
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Se desativado, o aplicativo ficará fixado apenas na versão padrão definida pela igreja.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={bibleConfig.allow_user_version_switch}
                    onChange={e => setBibleConfig({ ...bibleConfig, allow_user_version_switch: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                </label>

                {/* Switch 2: Destaque do Versículo do Dia */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--panel-border)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                      Exibir Versículo do Dia na Home
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Apresenta uma passagem bíblica inspiradora diária para todos os membros e visitantes.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={bibleConfig.daily_verse_enabled}
                    onChange={e => setBibleConfig({ ...bibleConfig, daily_verse_enabled: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                </label>

                {/* Switch 3: Marca-texto e Destaques */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--panel-border)', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                      Marca-texto colorido nos versículos
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Permite que os membros grifem versículos com 4 cores (amarelo, verde, azul e rosa).
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={bibleConfig.highlights_enabled}
                    onChange={e => setBibleConfig({ ...bibleConfig, highlights_enabled: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                </label>

                {/* Switch 4: Compartilhamento no WhatsApp */}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                      Compartilhamento rápido no WhatsApp
                    </div>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Formata o versículo com o nome do livro, capítulo e a assinatura da igreja para evangelismo.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={bibleConfig.whatsapp_share_enabled}
                    onChange={e => setBibleConfig({ ...bibleConfig, whatsapp_share_enabled: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                </label>

              </div>
            </div>

            {/* SEÇÃO 3: ORIENTAÇÃO PASTORAL & DESTAQUE DO MÊS */}
            <div className="portal-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                🕊️ Orientação Pastoral & Leitura do Mês
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                Exiba uma mensagem pastoral institucional ou indique um livro para leitura conjunta de toda a igreja.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label-modern">Livro / Leitura Recomendada pela Liderança</label>
                  <select
                    value={bibleConfig.featured_reading_book}
                    onChange={e => setBibleConfig({ ...bibleConfig, featured_reading_book: e.target.value })}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--panel-border)', background: '#ffffff', fontWeight: 700, outline: 'none' }}
                  >
                    {FEATURED_BOOKS.map(book => (
                      <option key={book.id} value={book.id}>
                        {book.name} ({book.testament})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label-modern">Nota Pastoral de Edificação (Opcional)</label>
                  <textarea
                    rows={3}
                    value={bibleConfig.pastoral_note}
                    onChange={e => setBibleConfig({ ...bibleConfig, pastoral_note: e.target.value })}
                    placeholder="Ex: Neste mês de avivamento, recomendamos a leitura diária de Provérbios e João..."
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--panel-border)', background: '#ffffff', fontSize: '0.84rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                    Esta mensagem aparece no topo do leitor bíblico do PWA como orientação da liderança.
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* COLUNA 2: PREVIEW INTERATIVO DO SMARTPHONE EM TEMPO REAL */}
          <div style={{ position: 'sticky', top: '20px' }}>
            <div className="portal-card" style={{ padding: '20px', background: '#0f172a', color: '#ffffff', borderRadius: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📱 Preview em Tempo Real no PWA
                </span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  {churchName}
                </span>
              </div>

              {/* MOCKUP DO LEITOR BÍBLICO */}
              <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '20px', padding: '16px', minHeight: '440px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Header Mockup */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.94rem', fontWeight: 900, color: '#0f172a' }}>📖 Bíblia Sagrada</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>66 Livros • 1.189 Capítulos</div>
                  </div>

                  {/* Seletor Preview */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {bibleConfig.allow_user_version_switch && bibleConfig.enabled_versions.length > 1 ? (
                      <div style={{ background: '#f0fdfa', border: '1px solid #0f766e', color: '#0f766e', padding: '3px 8px', borderRadius: '6px', fontSize: '0.70rem', fontWeight: 800 }}>
                        {bibleConfig.default_version.toUpperCase()} ▾
                      </div>
                    ) : (
                      <div style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '0.70rem', fontWeight: 800 }}>
                        {bibleConfig.default_version.toUpperCase()} (Fixo)
                      </div>
                    )}
                    <span style={{ fontSize: '0.70rem', background: '#f1f5f9', padding: '3px 6px', borderRadius: '6px' }}>☀️</span>
                    <span style={{ fontSize: '0.70rem', background: '#f1f5f9', padding: '3px 6px', borderRadius: '6px' }}>A+</span>
                  </div>
                </div>

                {/* Nota Pastoral Mockup */}
                {bibleConfig.pastoral_note && (
                  <div style={{ background: '#f0fdfa', borderRadius: '10px', padding: '8px 10px', border: '1px solid #99f6e4', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.85rem' }}>🕊️</span>
                    <div>
                      <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase' }}>Orientação Pastoral</div>
                      <div style={{ fontSize: '0.68rem', color: '#134e4a', lineHeight: 1.3 }}>
                        {bibleConfig.pastoral_note.length > 90 ? bibleConfig.pastoral_note.slice(0, 90) + '...' : bibleConfig.pastoral_note}
                      </div>
                    </div>
                  </div>
                )}

                {/* Barra do Livro Mockup */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a' }}>{selectedBookName} 1</div>
                    <div style={{ fontSize: '0.62rem', color: '#0f766e', fontWeight: 700 }}>{bibleConfig.default_version.toUpperCase()}</div>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#0f766e', fontWeight: 800 }}>Trocar Livro ▾</span>
                </div>

                {/* Versículos Mockup */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.76rem', lineHeight: 1.5, color: '#334155' }}>
                  <p style={{ margin: 0, padding: '4px', background: bibleConfig.highlights_enabled ? '#fef08a' : 'transparent', borderRadius: '4px' }}>
                    <strong style={{ color: '#0f766e', marginRight: '4px' }}>1</strong>
                    No princípio era o Verbo, e o Verbo estava com Deus, e o Verbo era Deus.
                  </p>
                  <p style={{ margin: 0, padding: '4px' }}>
                    <strong style={{ color: '#0f766e', marginRight: '4px' }}>2</strong>
                    Ele estava no princípio com Deus.
                  </p>
                  <p style={{ margin: 0, padding: '4px' }}>
                    <strong style={{ color: '#0f766e', marginRight: '4px' }}>3</strong>
                    Todas as coisas foram feitas por intermédio dele, e sem ele nada do que foi feito se fez.
                  </p>
                </div>

                {/* Rodapé Ações Mockup */}
                {bibleConfig.whatsapp_share_enabled && (
                  <div style={{ marginTop: 'auto', background: '#ecfdf5', padding: '6px 10px', borderRadius: '8px', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>💬 Compartilhamento com {churchName}</span>
                    <span style={{ fontSize: '0.64rem', background: '#059669', color: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>Ativo</span>
                  </div>
                )}

              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default BibleConfig;
