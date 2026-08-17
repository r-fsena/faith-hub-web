import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';

const PaletteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
);
const SmartphoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
);
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>
);
const QrCodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const PrinterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
);

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export interface ChurchBrandingSettings {
  church_name: string;
  tagline: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  whatsapp: string;
  email: string;
  instagram: string;
  youtube: string;
  website: string;
  logo_icon_url: string;
  logo_header_url: string;
  banner_url: string;
  primary_color: string;
  secondary_color: string;
  theme_mode: 'LIGHT' | 'DARK' | 'AUTO';
  pwa_short_name: string;
  pwa_slug: string;
  custom_domain: string;
  pwa_description: string;
  pwa_theme_color: string;
  pwa_splash_bg: string;
}

const DEFAULT_SETTINGS: ChurchBrandingSettings = {
  church_name: 'Minha Igreja',
  tagline: '',
  cnpj: '',
  address: '',
  city: '',
  state: '',
  whatsapp: '',
  email: '',
  instagram: '',
  youtube: '',
  website: '',
  logo_icon_url: '',
  logo_header_url: '',
  banner_url: '',
  primary_color: '#0f766e',
  secondary_color: '#14b8a6',
  theme_mode: 'LIGHT',
  pwa_short_name: 'Minha Igreja',
  pwa_slug: 'igreja',
  custom_domain: '',
  pwa_description: 'Aplicativo oficial da igreja para membros, células e eventos.',
  pwa_theme_color: '#0f766e',
  pwa_splash_bg: '#0f172a'
};

const COLOR_PRESETS = [
  { name: 'Deep Teal', hex: '#0f766e', accent: '#14b8a6' },
  { name: 'Royal Indigo', hex: '#4338ca', accent: '#6366f1' },
  { name: 'Celestial Navy', hex: '#0f172a', accent: '#3b82f6' },
  { name: 'Emerald Forest', hex: '#059669', accent: '#10b981' },
  { name: 'Sunset Amber', hex: '#d97706', accent: '#f59e0b' },
  { name: 'Crimson Ruby', hex: '#be123c', accent: '#f43f5e' },
  { name: 'Violet Velvet', hex: '#7c3aed', accent: '#a855f7' },
  { name: 'Charcoal Dark', hex: '#18181b', accent: '#71717a' },
];

interface ChurchBrandingProps {
  selectedOrganization?: {
    id: string;
    name: string;
    slug: string;
    primary_color?: string;
    secondary_color?: string;
  };
}

export default function ChurchBranding({ selectedOrganization }: ChurchBrandingProps = {}) {
  const orgId = selectedOrganization?.id || 'org_default';
  const orgSlug = selectedOrganization?.slug || 'faithhub';
  const orgName = selectedOrganization?.name || 'Minha Igreja';

  const [settings, setSettings] = useState<ChurchBrandingSettings>({
    ...DEFAULT_SETTINGS,
    church_name: orgName,
    pwa_slug: orgSlug,
    primary_color: selectedOrganization?.primary_color || DEFAULT_SETTINGS.primary_color,
    secondary_color: selectedOrganization?.secondary_color || DEFAULT_SETTINGS.secondary_color,
  });
  const [activeTab, setActiveTab] = useState<'profile' | 'visual' | 'pwa'>('profile');
  const [emulatorView, setEmulatorView] = useState<'home' | 'splash' | 'qr'>('home');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);

  const logoIconInputRef = useRef<HTMLInputElement>(null);
  const logoHeaderInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, [orgId, orgSlug]);

  const loadSettings = async () => {
    // 1. Carrega do cache local específico da organização
    const cacheKey = `faithhub_church_branding_${orgId}`;
    const saved = localStorage.getItem(cacheKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, church_name: orgName, pwa_slug: orgSlug, ...parsed });
        applyDynamicTheme(parsed.primary_color);
      } catch (e) {
        console.error("Erro ao carregar branding local", e);
      }
    }

    // 2. Busca as informações persistidas diretamente no banco de dados na nuvem para esta organização
    try {
      const res = await fetch(`${API_URL}/church-settings?organization_id=${encodeURIComponent(orgId)}&slug=${encodeURIComponent(orgSlug)}`);
      if (res.ok) {
        const backendData = await res.json();
        if (backendData && backendData.church_name) {
          const merged: ChurchBrandingSettings = {
            ...DEFAULT_SETTINGS,
            church_name: backendData.church_name || orgName,
            tagline: backendData.slogan || '',
            cnpj: backendData.cnpj || '',
            address: `${backendData.address_street || ''} ${backendData.address_number || ''}`.trim(),
            city: backendData.address_city || '',
            state: backendData.address_state || '',
            whatsapp: backendData.whatsapp || '',
            email: backendData.email || '',
            instagram: backendData.instagram_url || '',
            youtube: backendData.youtube_url || '',
            website: backendData.website_url || '',
            logo_icon_url: backendData.logo_icon_url || '',
            logo_header_url: backendData.logo_header_url || '',
            banner_url: backendData.banner_url || '',
            primary_color: backendData.primary_color || selectedOrganization?.primary_color || DEFAULT_SETTINGS.primary_color,
            secondary_color: backendData.secondary_color || selectedOrganization?.secondary_color || DEFAULT_SETTINGS.secondary_color,
            pwa_short_name: backendData.pwa_short_name || orgName.slice(0, 12),
            pwa_slug: backendData.pwa_slug || orgSlug,
            pwa_theme_color: backendData.pwa_theme_color || backendData.primary_color || DEFAULT_SETTINGS.pwa_theme_color,
            pwa_splash_bg: backendData.pwa_splash_bg || DEFAULT_SETTINGS.pwa_splash_bg,
            pwa_description: backendData.pwa_description || DEFAULT_SETTINGS.pwa_description,
            theme_mode: backendData.theme_mode || 'LIGHT',
            custom_domain: backendData.custom_domain || ''
          };
          setSettings(merged);
          localStorage.setItem(cacheKey, JSON.stringify(merged));
          applyDynamicTheme(merged.primary_color);
        }
      }
    } catch (err) {
      console.log("Usando dados em cache", err);
    }
  };

  const applyDynamicTheme = (primaryColor: string) => {
    if (!primaryColor) return;
    document.documentElement.style.setProperty('--accent-primary', primaryColor);
    document.documentElement.style.setProperty('--accent-primary-gradient', `linear-gradient(135deg, ${primaryColor} 0%, #14b8a6 100%)`);
  };

  const handleColorSelect = (hex: string, accent?: string) => {
    setSettings(prev => ({
      ...prev,
      primary_color: hex,
      pwa_theme_color: hex,
      secondary_color: accent || prev.secondary_color
    }));
    applyDynamicTheme(hex);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const cacheKey = `faithhub_church_branding_${orgId}`;
      localStorage.setItem(cacheKey, JSON.stringify(settings));
      applyDynamicTheme(settings.primary_color);

      // Dispara evento global para que o App.tsx atualize na hora o cabeçalho/sidebar
      window.dispatchEvent(new CustomEvent('church-branding-updated', { detail: settings }));

      // Tenta persistir no backend se o endpoint estiver disponível
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
        await fetch(`${API_URL}/church-settings`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...settings,
            organization_id: orgId,
            pwa_slug: settings.pwa_slug || orgSlug,
            id: `settings_${orgSlug.replace(/-/g, '_')}`
          })
        });
      } catch (backendErr) {
        console.log("Salvo localmente com sucesso.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar configurações da igreja.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'logo_icon_url' | 'logo_header_url' | 'banner_url') => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    setUploadingField(fieldName);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSettings(prev => ({
            ...prev,
            [fieldName]: event.target?.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Erro no upload", err);
    } finally {
      setUploadingField(null);
    }
  };

  const getPwaUrl = () => {
    if (settings.custom_domain) return `https://${settings.custom_domain}`;
    return `https://app.faithhubs.com/${settings.pwa_slug || 'demonstracao'}`;
  };

  const getQrCodeApiUrl = () => {
    const targetUrl = getPwaUrl();
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}`;
  };

  // Gerador de Placa/Totem PNG de Alta Resolução via Canvas nativo
  const handleDownloadTotemPNG = async () => {
    setDownloadingImage(true);
    try {
      const canvas = document.createElement('canvas');
      const width = 1200;
      const height = 1600;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Fundo Branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 2. Banner Superior com Cor Primária da Igreja
      const gradient = ctx.createLinearGradient(0, 0, width, 500);
      gradient.addColorStop(0, settings.primary_color || '#0f766e');
      gradient.addColorStop(1, settings.secondary_color || '#14b8a6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 440);

      // 3. Textos do Topo
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      
      // Tag
      ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('APLICATIVO OFICIAL DA IGREJA', width / 2, 120);

      // Nome da Igreja
      ctx.font = '800 60px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(settings.church_name || 'Comunidade Faith-Hub', width / 2, 210);

      // Slogan
      ctx.font = '500 30px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(settings.tagline || 'Cultos ao Vivo, Células, Devocionais e Eventos', width / 2, 280);

      // 4. Caixa Central do QR Code (Sombra e Bordas Arredondadas)
      const qrBoxSize = 680;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 380;

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;
      
      // Desenha retângulo arredondado para o QR Code
      const radius = 36;
      ctx.beginPath();
      ctx.moveTo(qrBoxX + radius, qrBoxY);
      ctx.lineTo(qrBoxX + qrBoxSize - radius, qrBoxY);
      ctx.quadraticCurveTo(qrBoxX + qrBoxSize, qrBoxY, qrBoxX + qrBoxSize, qrBoxY + radius);
      ctx.lineTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize - radius);
      ctx.quadraticCurveTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize, qrBoxX + qrBoxSize - radius, qrBoxY + qrBoxSize);
      ctx.lineTo(qrBoxX + radius, qrBoxY + qrBoxSize);
      ctx.quadraticCurveTo(qrBoxX, qrBoxY + qrBoxSize, qrBoxX, qrBoxY + qrBoxSize - radius);
      ctx.lineTo(qrBoxX, qrBoxY + radius);
      ctx.quadraticCurveTo(qrBoxX, qrBoxY, qrBoxX + radius, qrBoxY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Borda sutil na caixa
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 5. Carrega e Desenha a imagem do QR Code
      const qrImage = new Image();
      qrImage.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        qrImage.onload = () => resolve();
        qrImage.onerror = () => reject();
        qrImage.src = getQrCodeApiUrl();
      });

      const qrInnerSize = 520;
      const qrInnerX = (width - qrInnerSize) / 2;
      const qrInnerY = qrBoxY + 80;
      ctx.drawImage(qrImage, qrInnerX, qrInnerY, qrInnerSize, qrInnerSize);

      // 6. Instruções Inferiores
      ctx.fillStyle = '#0f172a';
      ctx.font = '800 46px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Aponte a câmera do celular', width / 2, 1180);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Acesse instantaneamente sem precisar baixar na loja', width / 2, 1240);

      // 7. Badge com a URL oficial da igreja
      const badgeY = 1320;
      const badgeWidth = 740;
      const badgeHeight = 90;
      const badgeX = (width - badgeWidth) / 2;

      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 45) : ctx.rect(badgeX, badgeY, badgeWidth, badgeHeight);
      ctx.fill();

      ctx.fillStyle = settings.primary_color || '#0f766e';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(getPwaUrl(), width / 2, badgeY + 58);

      // 8. Rodapé do Sistema
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Ecossistema Faith-Hub • PWA Whitelabel Oficial', width / 2, 1520);

      // Download da imagem PNG
      const link = document.createElement('a');
      link.download = `placa-qrcode-${settings.pwa_slug || 'igreja'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error("Erro ao gerar placa", e);
      alert("Não foi possível gerar a imagem no momento. Tente imprimir diretamente.");
    } finally {
      setDownloadingImage(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Cálculo de progresso de onboarding
  const calculateOnboardingProgress = () => {
    let score = 0;
    if (settings.church_name) score += 25;
    if (settings.logo_icon_url || settings.logo_header_url) score += 25;
    if (settings.primary_color) score += 25;
    if (settings.whatsapp || settings.email) score += 25;
    return score;
  };

  const progress = calculateOnboardingProgress();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner de Onboarding */}
      <div className="onboarding-banner">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <SparklesIcon />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Whitelabel Studio & PWA
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>
            {settings.church_name || 'Personalize o Aplicativo da sua Igreja'}
          </h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px', maxWidth: '600px' }}>
            Defina logotipo, cores oficiais e nome do app para os seus membros instalarem diretamente no celular.
          </p>
        </div>

        <div style={{ textAlign: 'right', minWidth: '160px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.9, marginBottom: '6px' }}>
            Onboarding: {progress}% Completo
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#ffffff', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Colunas (Formulários à esquerda, Emulador PWA à direita) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) 360px', gap: '28px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Parametrizações & Abas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Segmented Tabs */}
          <div className="portal-card" style={{ padding: '10px 16px', display: 'flex', gap: '8px' }}>
            <button 
              className={`segmented-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px' }}
            >
              <BuildingIcon /> 1. Dados & Contato
            </button>
            <button 
              className={`segmented-btn ${activeTab === 'visual' ? 'active' : ''}`}
              onClick={() => setActiveTab('visual')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px' }}
            >
              <PaletteIcon /> 2. Identidade & Cores
            </button>
            <button 
              className={`segmented-btn ${activeTab === 'pwa' ? 'active' : ''}`}
              onClick={() => setActiveTab('pwa')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px' }}
            >
              <SmartphoneIcon /> 3. Link & PWA
            </button>
          </div>

          {/* TAB 1: DADOS & CONTATO */}
          {activeTab === 'profile' && (
            <div className="portal-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header-row" style={{ margin: 0, paddingBottom: 16, borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                  <h3 className="card-title">Informações Institucionais</h3>
                  <p className="card-subtitle">Dados de identificação e canais de acolhimento da igreja.</p>
                </div>
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Nome Oficial da Igreja / Ministério *</label>
                <input 
                  type="text" 
                  className="input-modern"
                  value={settings.church_name} 
                  onChange={e => setSettings({ ...settings, church_name: e.target.value })} 
                  placeholder="Ex: Comunidade da Fé, Igreja Batista Central..." 
                  required
                />
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Slogan ou Versículo Tema</label>
                <input 
                  type="text" 
                  className="input-modern"
                  value={settings.tagline} 
                  onChange={e => setSettings({ ...settings, tagline: e.target.value })} 
                  placeholder="Ex: Uma igreja relevante para a nossa cidade." 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Endereço da Sede Principal</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={settings.address} 
                    onChange={e => setSettings({ ...settings, address: e.target.value })} 
                    placeholder="Av. Principal, 1000" 
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                  <div className="form-group-modern">
                    <label className="form-label-modern">Cidade</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      value={settings.city} 
                      onChange={e => setSettings({ ...settings, city: e.target.value })} 
                      placeholder="São Paulo" 
                    />
                  </div>
                  <div className="form-group-modern">
                    <label className="form-label-modern">UF</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      value={settings.state} 
                      onChange={e => setSettings({ ...settings, state: e.target.value })} 
                      placeholder="SP" 
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">WhatsApp de Boas-Vindas / Recepção</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={settings.whatsapp} 
                    onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} 
                    placeholder="(11) 98765-4321" 
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">E-mail Institucional</label>
                  <input 
                    type="email" 
                    className="input-modern"
                    value={settings.email} 
                    onChange={e => setSettings({ ...settings, email: e.target.value })} 
                    placeholder="contato@igreja.com.br" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Instagram Oficial</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={settings.instagram} 
                    onChange={e => setSettings({ ...settings, instagram: e.target.value })} 
                    placeholder="@suaigreja" 
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Canal do YouTube</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={settings.youtube} 
                    onChange={e => setSettings({ ...settings, youtube: e.target.value })} 
                    placeholder="https://youtube.com/@..." 
                  />
                </div>
                <div className="form-group-modern">
                  <label className="form-label-modern">Website Oficial</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={settings.website} 
                    onChange={e => setSettings({ ...settings, website: e.target.value })} 
                    placeholder="https://..." 
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IDENTIDADE & CORES */}
          {activeTab === 'visual' && (
            <div className="portal-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card-header-row" style={{ margin: 0, paddingBottom: 16, borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                  <h3 className="card-title">Paleta de Cores & Elementos Visuais</h3>
                  <p className="card-subtitle">Escolha as cores e faça upload dos logotipos para o PWA e Web Portal.</p>
                </div>
              </div>

              {/* Seletor de Cores da Marca */}
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <span>Cor Primária da Marca (Identidade Visual)</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 800 }}>{settings.primary_color}</span>
                </label>
                
                <div className="color-preset-grid" style={{ marginBottom: 12 }}>
                  {COLOR_PRESETS.map((preset) => (
                    <button 
                      key={preset.hex}
                      type="button"
                      className={`color-swatch-btn ${settings.primary_color.toLowerCase() === preset.hex.toLowerCase() ? 'active' : ''}`}
                      onClick={() => handleColorSelect(preset.hex, preset.accent)}
                    >
                      <div className="swatch-circle" style={{ background: preset.hex }} />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input 
                    type="color" 
                    value={settings.primary_color} 
                    onChange={e => handleColorSelect(e.target.value)}
                    style={{ width: '44px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                  />
                  <input 
                    type="text" 
                    className="input-modern"
                    value={settings.primary_color}
                    onChange={e => handleColorSelect(e.target.value)}
                    style={{ maxWidth: '140px', fontWeight: 700 }}
                  />
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Aplicado instantaneamente no portal e no emulador mobile.
                  </span>
                </div>
              </div>

              {/* Uploads de Logotipos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* Logo Quadrada / Ícone PWA (1:1) */}
                <div className="form-group-modern">
                  <label className="form-label-modern">
                    <span>Ícone do App / Favicon (1:1)</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>512x512 PNG</span>
                  </label>

                  <input 
                    type="file" 
                    ref={logoIconInputRef} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={e => handleFileUpload(e, 'logo_icon_url')}
                  />

                  <div 
                    className="dropzone-box" 
                    style={{ minHeight: '140px' }}
                    onClick={() => logoIconInputRef.current?.click()}
                  >
                    {uploadingField === 'logo_icon_url' ? (
                      <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.84rem' }}>Enviando...</div>
                    ) : settings.logo_icon_url ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <img src={settings.logo_icon_url} alt="Ícone" style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', boxShadow: 'var(--shadow-sm)' }} />
                        <span style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', fontWeight: 700 }}>Alterar Ícone</span>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>+ Selecionar Ícone 1:1</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Usado na tela inicial do celular</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo Horizontal */}
                <div className="form-group-modern">
                  <label className="form-label-modern">
                    <span>Logotipo Horizontal (Header)</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PNG transparente</span>
                  </label>

                  <input 
                    type="file" 
                    ref={logoHeaderInputRef} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={e => handleFileUpload(e, 'logo_header_url')}
                  />

                  <div 
                    className="dropzone-box" 
                    style={{ minHeight: '140px' }}
                    onClick={() => logoHeaderInputRef.current?.click()}
                  >
                    {uploadingField === 'logo_header_url' ? (
                      <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.84rem' }}>Enviando...</div>
                    ) : settings.logo_header_url ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <img src={settings.logo_header_url} alt="Logo Horizontal" style={{ maxHeight: '48px', maxWidth: '180px', objectFit: 'contain' }} />
                        <span style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', fontWeight: 700 }}>Alterar Logotipo</span>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>+ Selecionar Logo Horizontal</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Usado no menu e no topo do PWA</div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Banner de Boas-Vindas */}
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <span>Banner de Boas-Vindas da Home do App</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>16:9 Recomendado</span>
                </label>

                <input 
                  type="file" 
                  ref={bannerInputRef} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={e => handleFileUpload(e, 'banner_url')}
                />

                <div 
                  className="dropzone-box" 
                  style={{ minHeight: '130px' }}
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {uploadingField === 'banner_url' ? (
                    <div style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>Enviando banner...</div>
                  ) : settings.banner_url ? (
                    <>
                      <img src={settings.banner_url} alt="Banner da Home" className="dropzone-preview-img" style={{ maxHeight: '120px' }} />
                      <div className="dropzone-overlay-btn">Alterar Banner</div>
                    </>
                  ) : (
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>+ Selecionar Imagem de Boas-Vindas</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Aparecerá no topo da tela do membro</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONFIGURAÇÕES PWA */}
          {activeTab === 'pwa' && (
            <div className="portal-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div className="card-header-row" style={{ margin: 0, paddingBottom: 16, borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                  <h3 className="card-title">Link do PWA & Parametrizações Whitelabel</h3>
                  <p className="card-subtitle">Endereço de acesso dos membros no ecossistema faithhubs.com e instalação nos celulares.</p>
                </div>
              </div>

              {/* URL do PWA no faithhubs.com */}
              <div style={{ background: '#f0fdfa', border: '1.5px solid var(--pastel-green-border)', borderRadius: '16px', padding: '20px' }}>
                <label className="form-label-modern" style={{ color: 'var(--accent-primary)', marginBottom: '8px' }}>
                  <span>🌐 Link Oficial do seu Aplicativo PWA no ecossistema Faith-Hub</span>
                  <span style={{ fontSize: '0.74rem', background: '#ccfbf1', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>ATIVO</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '0.95rem' }}>https://app.faithhubs.com/</span>
                  <input 
                    type="text" 
                    className="input-modern"
                    style={{ maxWidth: '220px', fontWeight: 800, color: 'var(--accent-primary)', padding: '9px 12px' }}
                    value={settings.pwa_slug} 
                    onChange={e => setSettings({ ...settings, pwa_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} 
                    placeholder="demonstracao"
                  />

                  <button 
                    type="button" 
                    className="btn-primary"
                    style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: '0.80rem' }}
                    onClick={() => {
                      navigator.clipboard.writeText(getPwaUrl());
                      alert(`Link copiado: ${getPwaUrl()}`);
                    }}
                  >
                    Copiar Link do App
                  </button>
                </div>

                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Seus membros acessam <strong>{getPwaUrl()}</strong> diretamente pelo navegador do celular e instalam o PWA com um toque.
                </div>
              </div>

              {/* Domínio Próprio Personalizado (Whitelabel Total) */}
              <div className="form-group-modern">
                <label className="form-label-modern">
                  <span>Domínio Próprio Personalizado (Opcional)</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Whitelabel Total</span>
                </label>
                <input 
                  type="text" 
                  className="input-modern"
                  value={settings.custom_domain} 
                  onChange={e => setSettings({ ...settings, custom_domain: e.target.value })} 
                  placeholder="Ex: app.minhaigreja.com.br" 
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Caso possua domínio próprio, crie uma entrada CNAME apontando para <code>cname.faithhubs.com</code>.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Nome Curto do App no Celular (Short Name)</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={settings.pwa_short_name} 
                    onChange={e => setSettings({ ...settings, pwa_short_name: e.target.value })} 
                    maxLength={12}
                    placeholder="Ex: Faith App" 
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Máximo 12 caracteres para caber no ícone do celular.</span>
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Cor da Splash Screen (Abertura)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={settings.pwa_splash_bg} 
                      onChange={e => setSettings({ ...settings, pwa_splash_bg: e.target.value })}
                      style={{ width: '44px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <input 
                      type="text" 
                      className="input-modern"
                      value={settings.pwa_splash_bg} 
                      onChange={e => setSettings({ ...settings, pwa_splash_bg: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Descrição de Instalação do PWA</label>
                <textarea 
                  rows={2} 
                  className="textarea-modern"
                  value={settings.pwa_description} 
                  onChange={e => setSettings({ ...settings, pwa_description: e.target.value })} 
                  placeholder="Texto explicativo para os membros adicionarem o app à tela de início..."
                />
              </div>

              {/* Botão de Exportar Placa QR Code */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--pastel-purple-bg)', color: 'var(--pastel-purple-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QrCodeIcon />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Placa / Display de QR Code da Igreja
                    </h4>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                      Gere o totem oficial personalizado para impressão em alta resolução.
                    </p>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700 }}
                  onClick={() => setShowExportModal(true)}
                >
                  <DownloadIcon /> Exportar Display QR Code
                </button>
              </div>
            </div>
          )}

          {/* Action Bar / Save Button */}
          <div className="portal-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {saveSuccess && (
                <div style={{ color: '#059669', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckIcon /> Configurações e Tema Salvos com Sucesso!
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '12px 28px', fontSize: '0.95rem' }}
              >
                {saving ? 'Salvando Alterações...' : 'Salvar Identidade da Igreja'}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE WHITELABEL MOBILE EMULATOR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Emulator Mode Selector */}
          <div className="portal-card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                📱 Live PWA Mobile Emulator
              </div>
              <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '6px' }}>
                ● Tempo Real
              </span>
            </div>
            <div className="segmented-control" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
              <button 
                className={`segmented-btn ${emulatorView === 'home' ? 'active' : ''}`}
                onClick={() => setEmulatorView('home')}
                style={{ fontSize: '0.72rem', padding: '6px 4px' }}
              >
                Início
              </button>
              <button 
                className={`segmented-btn ${emulatorView === 'devotionals' ? 'active' : ''}`}
                onClick={() => setEmulatorView('devotionals')}
                style={{ fontSize: '0.72rem', padding: '6px 4px' }}
              >
                Ensino
              </button>
              <button 
                className={`segmented-btn ${emulatorView === 'splash' ? 'active' : ''}`}
                onClick={() => setEmulatorView('splash')}
                style={{ fontSize: '0.72rem', padding: '6px 4px' }}
              >
                Splash
              </button>
              <button 
                className={`segmented-btn ${emulatorView === 'qr' ? 'active' : ''}`}
                onClick={() => setEmulatorView('qr')}
                style={{ fontSize: '0.72rem', padding: '6px 4px' }}
              >
                QR Code
              </button>
            </div>
          </div>

          {/* Smartphone Mockup Frame */}
          <div style={{
            width: '340px',
            height: '680px',
            borderRadius: '46px',
            border: '10px solid #0f172a',
            background: '#090d16',
            boxShadow: '0 25px 60px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            margin: '0 auto',
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}>

            {/* Top iOS Status Bar + Dynamic Island */}
            <div style={{
              height: '38px',
              background: '#090d16',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              fontSize: '0.70rem',
              fontWeight: 700,
              zIndex: 30,
              flexShrink: 0
            }}>
              <span>9:41</span>
              {/* Dynamic Island */}
              <div style={{
                width: '94px',
                height: '24px',
                background: '#000000',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.05)'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1e293b' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', opacity: 0.8 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem' }}>
                <span>5G</span>
                <span>􀙇</span>
                <span>􀛨</span>
              </div>
            </div>

            {/* VIEW 1: REAL PWA HOME */}
            {emulatorView === 'home' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#f8fafc', position: 'relative' }}>
                
                {/* Real PWA Top Header */}
                <div style={{
                  background: '#ffffff',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e2e8f0',
                  position: 'sticky',
                  top: 0,
                  zIndex: 20
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {settings.logo_icon_url ? (
                      <img src={settings.logo_icon_url} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #e2e8f0' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: settings.primary_color, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.80rem' }}>
                        {settings.church_name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '0.84rem', color: '#0f172a', lineHeight: 1.1, maxWidth: '160px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {settings.church_name}
                      </div>
                      <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>📍 Sede • PWA Ativo</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.80rem', position: 'relative' }}>
                      🔔
                      <span style={{ position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }} />
                    </div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.70rem', fontWeight: 800 }}>
                      M
                    </div>
                  </div>
                </div>

                {/* Main Scrollable Content */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Greeting & Campus Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' }}>
                    <div>
                      <div style={{ fontSize: '0.90rem', fontWeight: 900, color: '#0f172a' }}>✨ Olá, Membro!</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Explore nossa comunidade</div>
                    </div>
                    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🏛️ Sede ▾</span>
                    </div>
                  </div>

                  {/* Hero Banner Card */}
                  <div style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: '18px',
                    background: settings.banner_url ? `url(${settings.banner_url}) center/cover` : `linear-gradient(135deg, ${settings.primary_color} 0%, #0369a1 100%)`,
                    color: '#ffffff',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
                    
                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.60rem', fontWeight: 900, textTransform: 'uppercase', padding: '2px 6px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)', borderRadius: '6px', letterSpacing: '0.04em' }}>
                        APLICATIVO OFICIAL
                      </span>
                      <span style={{ fontSize: '0.58rem', fontWeight: 800, background: '#ef4444', color: '#ffffff', padding: '2px 6px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        ● AO VIVO
                      </span>
                    </div>

                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={{ fontWeight: 900, fontSize: '0.96rem', lineHeight: 1.15 }}>
                        {settings.church_name}
                      </div>
                      <div style={{ fontSize: '0.68rem', opacity: 0.9, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {settings.tagline || 'Cultos, Devocionais e Células'}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <button type="button" style={{ background: '#ffffff', color: '#0f172a', border: 'none', padding: '4px 10px', borderRadius: '8px', fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer' }}>
                          ▶ Assistir Culto
                        </button>
                        <button type="button" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.4)', padding: '4px 8px', borderRadius: '8px', fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer' }}>
                          📖 Bíblia
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 8 Serviços Ministeriais em 4 Colunas */}
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                      Serviços & Comunidade
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                      {[
                        { label: 'Cultos', icon: '🔴', bg: 'rgba(239, 68, 68, 0.1)' },
                        { label: 'Palavra', icon: '📖', bg: 'rgba(2, 132, 199, 0.1)' },
                        { label: 'Células', icon: '📍', bg: 'rgba(15, 118, 110, 0.1)' },
                        { label: 'Cantina', icon: '🛍️', bg: 'rgba(5, 150, 105, 0.1)' },
                        { label: 'Dízimos', icon: '💜', bg: 'rgba(147, 51, 234, 0.1)' },
                        { label: 'Eventos', icon: '🎟️', bg: 'rgba(234, 88, 12, 0.1)' },
                        { label: 'Bíblia', icon: '📜', bg: 'rgba(71, 85, 105, 0.1)' },
                        { label: 'Oração', icon: '🙏', bg: 'rgba(79, 70, 229, 0.1)' },
                      ].map((item, idx) => (
                        <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.90rem' }}>
                            {item.icon}
                          </div>
                          <span style={{ fontSize: '0.60rem', fontWeight: 800, color: '#1e293b' }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Devocional do Dia Card */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 900, color: settings.primary_color, textTransform: 'uppercase' }}>
                        Palavra de Hoje
                      </span>
                      <span style={{ fontSize: '0.60rem', color: '#94a3b8' }}>Hoje</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#0f172a', marginBottom: '2px' }}>
                      O Cuidado de Deus em Cada Detalhe
                    </div>
                    <div style={{ fontSize: '0.66rem', color: '#64748b', lineHeight: 1.3 }}>
                      "O Senhor é o meu pastor e nada me faltará..." (Salmos 23:1)
                    </div>
                  </div>

                </div>

                {/* Real iOS Bottom Navigation Bar */}
                <div style={{
                  marginTop: 'auto',
                  borderTop: '1px solid #e2e8f0',
                  padding: '8px 12px 14px 12px',
                  display: 'flex',
                  justifyContent: 'space-around',
                  background: '#ffffff',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 20
                }}>
                  {[
                    { label: 'Início', icon: '🏠', active: true },
                    { label: 'Ensino', icon: '📖', active: false },
                    { label: 'Células', icon: '👥', active: false },
                    { label: 'Loja', icon: '🛍️', active: false },
                    { label: 'Perfil', icon: '👤', active: false },
                  ].map((tab, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                      <span style={{ fontSize: '0.85rem' }}>{tab.icon}</span>
                      <span style={{ fontSize: '0.58rem', fontWeight: tab.active ? 900 : 600, color: tab.active ? settings.primary_color : '#94a3b8' }}>
                        {tab.label}
                      </span>
                      {tab.active && (
                        <div style={{ width: '12px', height: '2px', background: settings.primary_color, borderRadius: '2px', marginTop: '1px' }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* iOS Bottom Home Indicator */}
                <div style={{ height: '14px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: '80px', height: '3px', background: '#0f172a', borderRadius: '2px' }} />
                </div>

              </div>
            )}

            {/* VIEW 2: DEVOCIONAIS & ENSINO */}
            {emulatorView === 'devotionals' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', overflowY: 'auto' }}>
                <div style={{ background: settings.primary_color, color: '#ffffff', padding: '16px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>📖</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '0.86rem' }}>Palavra & Devocionais</div>
                    <div style={{ fontSize: '0.64rem', opacity: 0.9 }}>Alimento diário para sua fé</div>
                  </div>
                </div>

                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { title: 'Permanecendo Firmes na Promessa', date: 'Hoje', author: 'Pr. Titular', verse: 'Hebreus 10:23' },
                    { title: 'A Paz que Excede Todo Entendimento', date: 'Ontem', author: 'Pastoral', verse: 'Filipenses 4:7' },
                    { title: 'Caminhando em Comunhão e Graça', date: '15 Ago', author: 'Liderança', verse: '1 João 1:7' }
                  ].map((dev, i) => (
                    <div key={i} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.60rem', fontWeight: 800, color: settings.primary_color, background: 'rgba(15,118,110,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{dev.verse}</span>
                        <span style={{ fontSize: '0.60rem', color: '#94a3b8' }}>{dev.date}</span>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '0.80rem', color: '#0f172a' }}>{dev.title}</div>
                      <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Por {dev.author} • 3 min de leitura</div>
                    </div>
                  ))}
                </div>

                {/* Bottom Nav Bar */}
                <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', padding: '8px 12px 14px 12px', display: 'flex', justifyContent: 'space-around', background: '#ffffff' }}>
                  {[
                    { label: 'Início', icon: '🏠', active: false },
                    { label: 'Ensino', icon: '📖', active: true },
                    { label: 'Células', icon: '👥', active: false },
                    { label: 'Loja', icon: '🛍️', active: false },
                    { label: 'Perfil', icon: '👤', active: false },
                  ].map((tab, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span style={{ fontSize: '0.85rem' }}>{tab.icon}</span>
                      <span style={{ fontSize: '0.58rem', fontWeight: tab.active ? 900 : 600, color: tab.active ? settings.primary_color : '#94a3b8' }}>
                        {tab.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: SPLASH SCREEN */}
            {emulatorView === 'splash' && (
              <div style={{ flex: 1, background: settings.pwa_splash_bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', color: '#ffffff', textAlign: 'center' }}>
                <div style={{ width: '84px', height: '84px', borderRadius: '24px', background: settings.primary_color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', boxShadow: '0 12px 30px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
                  {settings.logo_icon_url ? (
                    <img src={settings.logo_icon_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontWeight: 900, fontSize: '1.8rem', color: '#ffffff' }}>
                      {settings.church_name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                  {settings.church_name}
                </h3>
                <p style={{ fontSize: '0.74rem', opacity: 0.75, marginTop: '6px', maxWidth: '220px' }}>
                  {settings.pwa_short_name || 'Carregando seu espaço de fé...'}
                </p>

                <div style={{ width: '32px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginTop: '24px', overflow: 'hidden' }}>
                  <div style={{ width: '60%', height: '100%', background: settings.primary_color, borderRadius: '2px' }} />
                </div>
              </div>
            )}

            {/* VIEW 4: QR CODE DE INSTALAÇÃO */}
            {emulatorView === 'qr' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', background: '#f8fafc' }}>
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '22px', boxShadow: '0 10px 25px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                  <img 
                    src={getQrCodeApiUrl()} 
                    alt="QR Code" 
                    style={{ width: '140px', height: '140px', display: 'block' }}
                  />
                </div>
                <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#0f172a', marginBottom: '2px', wordBreak: 'break-all' }}>
                  {getPwaUrl()}
                </div>
                <div style={{ fontSize: '0.70rem', color: '#64748b', maxWidth: '220px', lineHeight: 1.3, marginBottom: '14px' }}>
                  Aponte a câmera do celular para instalar o PWA oficial da sua comunidade.
                </div>

                <button 
                  type="button" 
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}
                  onClick={() => setShowExportModal(true)}
                >
                  <DownloadIcon /> Exportar Placa QR
                </button>
              </div>
            )}

          </div>

          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Atualização em tempo real conforme você personaliza.
          </div>

        </div>

      </div>

      {/* ========================================================
          MODAL STUDIO: EXPORTAR PLACA / DISPLAY QR CODE DA IGREJA
          ======================================================== */}
      {showExportModal && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowExportModal(false)}>
          <div className="modal-studio-container" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
            
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-purple-bg)', color: 'var(--pastel-purple-text)' }}>
                  <QrCodeIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">Exportar Placa & Display de QR Code</h2>
                  <p className="modal-studio-subtitle">
                    Totem visual pronto para impressão em alta resolução (A4 / Mesa) com a identidade da igreja.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setShowExportModal(false)}>&times;</button>
            </div>

            <div className="modal-studio-body" style={{ display: 'flex', gap: '28px', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
              
              {/* Totem Card Preview */}
              <div style={{ width: '340px', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)', overflow: 'hidden', textAlign: 'center' }}>
                
                {/* Header do Totem */}
                <div style={{ background: `linear-gradient(135deg, ${settings.primary_color} 0%, #14b8a6 100%)`, color: '#ffffff', padding: '24px 20px 18px 20px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                    Aplicativo Oficial
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '8px 0 2px 0' }}>
                    {settings.church_name}
                  </h3>
                  <p style={{ fontSize: '0.74rem', opacity: 0.9, margin: 0 }}>
                    {settings.tagline || 'Cultos, Devocionais e Células'}
                  </p>
                </div>

                {/* QR Code Container */}
                <div style={{ padding: '24px 20px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '20px', border: '2px dashed #cbd5e1', display: 'inline-block', marginBottom: '14px' }}>
                    <img 
                      src={getQrCodeApiUrl()} 
                      alt="QR Code Oficial" 
                      style={{ width: '160px', height: '160px', display: 'block' }}
                    />
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 4px 0' }}>
                    Aponte a Câmera do Celular
                  </h4>
                  <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                    Instale o app e fique por dentro de todas as novidades da nossa comunidade.
                  </p>

                  <div style={{ background: '#f1f5f9', padding: '8px 14px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 800, color: settings.primary_color }}>
                    {getPwaUrl()}
                  </div>
                </div>

              </div>

              {/* Botões e Instruções de Exportação */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '18px', border: '1px solid var(--panel-border)' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                    Onde utilizar esta placa:
                  </h4>
                  <ul style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '16px', listStyle: 'disc' }}>
                    <li>Totens de recepção na entrada da igreja</li>
                    <li>Displays de acrílico nas mesas e bancos</li>
                    <li>Folhetos e boletins semanais de culto</li>
                    <li>Banners e telão de avisos</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ padding: '14px 20px', fontSize: '0.95rem', justifyContent: 'center' }}
                    onClick={handleDownloadTotemPNG}
                    disabled={downloadingImage}
                  >
                    <DownloadIcon /> {downloadingImage ? 'Gerando Imagem...' : 'Baixar Imagem PNG em Alta Resolução'}
                  </button>

                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ padding: '12px 20px', fontSize: '0.90rem', justifyContent: 'center' }}
                    onClick={handlePrint}
                  >
                    <PrinterIcon /> Imprimir Diretamente (A4 / Display)
                  </button>
                </div>
              </div>

            </div>

            <div className="modal-studio-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowExportModal(false)}>
                Fechar
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
