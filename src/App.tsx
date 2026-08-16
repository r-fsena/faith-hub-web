import { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import Login from './Login';
import Members from './modules/Members';
import Broadcasts from './modules/Broadcasts';
import CellGroups from './modules/CellGroups';
import Studies from './modules/Studies';
import Events from './modules/Events';
import { Devotionals } from './modules/Devotionals';
import { PdvProdutos } from './modules/PdvProdutos';
import { PdvPedidos } from './modules/PdvPedidos';
import ChurchBranding from './modules/ChurchBranding';
import PagarmeSettings from './modules/PagarmeSettings';
import './index.css';

// Professional SVG Icons
const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
);
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
);
const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);
const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);
const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const PaletteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
);
const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);
const MoreHorizontalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
);

// Navigation Structure with StaffSphere Tree Submenus
const navigationGroups = [
  {
    category: 'Geral',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    ]
  },
  {
    category: 'Pessoas & Comunidade',
    items: [
      { 
        id: 'membros_group', 
        label: 'Membros & Equipe', 
        icon: UsersIcon,
        hasSubmenu: true,
        subItems: [
          { id: 'membros', label: 'Gestão de Membros' },
          { id: 'celulas', label: 'Células & Redes' },
        ]
      },
      { 
        id: 'ensino_group', 
        label: 'Ensino & Espiritual', 
        icon: BookIcon,
        hasSubmenu: true,
        subItems: [
          { id: 'devocionais', label: 'Devocionais Diários' },
          { id: 'estudos', label: 'Estudos e Mídias' },
          { id: 'eventos', label: 'Eventos & Trilhas' },
        ]
      },
    ]
  },
  {
    category: 'Operações & Mídia',
    items: [
      {
        id: 'pdv_group',
        label: 'Ponto de Venda (PDV)',
        icon: CartIcon,
        hasSubmenu: true,
        subItems: [
          { id: 'pdv_produtos', label: 'Catálogo de Produtos' },
          { id: 'pdv_pedidos', label: 'Monitor de Pedidos' },
        ]
      },
      { id: 'transmissoes', label: 'Central de Cultos & Lives', icon: VideoIcon },
    ]
  },
  {
    category: 'Whitelabel & Sistema',
    items: [
      { id: 'church_branding', label: 'Identidade & PWA Studio', icon: PaletteIcon },
      { id: 'pagarme_financeiro', label: 'Gateway de Pagamento', icon: CreditCardIcon },
      { id: 'configuracoes', label: 'Configurações AWS', icon: SettingsIcon },
    ]
  }
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({
    membros_group: true,
    ensino_group: true,
    pdv_group: true,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Dynamic Church Branding State
  const [churchSettings, setChurchSettings] = useState<any>({
    church_name: 'Faith-Hub',
    logo_icon_url: '',
    primary_color: '#0f766e'
  });

  // Calendar State for Acadex Widget
  const [selectedCalDay, setSelectedCalDay] = useState(14);
  const [chartPeriod, setChartPeriod] = useState('6m');

  useEffect(() => {
    // Carregar Branding Salvo
    const loadBranding = () => {
      const saved = localStorage.getItem('faithhub_church_branding');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setChurchSettings(parsed);
          if (parsed.primary_color) {
            document.documentElement.style.setProperty('--accent-primary', parsed.primary_color);
            document.documentElement.style.setProperty('--accent-primary-gradient', `linear-gradient(135deg, ${parsed.primary_color} 0%, #14b8a6 100%)`);
          }
        } catch (e) {}
      }
    };
    loadBranding();

    const handleBrandingUpdated = (e: any) => {
      if (e.detail) {
        setChurchSettings(e.detail);
      }
    };
    window.addEventListener('church-branding-updated', handleBrandingUpdated);
    return () => window.removeEventListener('church-branding-updated', handleBrandingUpdated);
  }, []);

  useEffect(() => {
    checkAuth();

    const unsubscribe = Hub.listen('auth', ({ payload }: { payload: any }) => {
      switch (payload.event) {
        case 'signedIn':
          checkAuth();
          break;
        case 'signedOut':
          setIsAuthenticated(false);
          setUser(null);
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const toggleSubmenu = (groupId: string) => {
    setOpenSubmenus(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (isLoadingAuth) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f7fb', color: '#1e293b', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#0f766e', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Carregando Faith-Hub Web...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={checkAuth} />;
  }

  const userName = user?.signInDetails?.loginId?.split('@')[0] || 'Pastor & Equipe';
  const formattedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div className="app-container">
      {/* ========================================================
          LEFT SIDEBAR (StaffSphere + Acadex fusion)
          ======================================================== */}
      <aside className="sidebar">
        {/* Brand Header */}
        <div className="sidebar-header" onClick={() => setActiveTab('church_branding')} style={{ cursor: 'pointer' }} title="Clique para personalizar a identidade da igreja">
          {churchSettings.logo_icon_url ? (
            <img 
              src={churchSettings.logo_icon_url} 
              alt="Logo da Igreja" 
              style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)' }}
            />
          ) : (
            <div className="sidebar-logo">
              {churchSettings.church_name ? churchSettings.church_name.substring(0, 2).toUpperCase() : 'FH'}
            </div>
          )}
          <div className="sidebar-brand">
            <div className="sidebar-brand-title">
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {churchSettings.church_name || 'Faith-Hub'}
              </span>
              <span className="sidebar-brand-badge">PWA</span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="sidebar-nav">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <div className="nav-category">{group.category}</div>
              {group.items.map((item: any) => {
                if (item.hasSubmenu) {
                  const isOpen = openSubmenus[item.id] ?? false;
                  const isAnySubActive = item.subItems.some((sub: any) => sub.id === activeTab);
                  
                  return (
                    <div key={item.id}>
                      <button 
                        className={`nav-item-btn ${isAnySubActive ? 'has-active-child' : ''}`}
                        onClick={() => toggleSubmenu(item.id)}
                      >
                        <div className="nav-item-left">
                          <item.icon />
                          <span>{item.label}</span>
                        </div>
                        {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      </button>
                      
                      {isOpen && (
                        <div className="submenu-tree">
                          {item.subItems.map((subItem: any) => (
                            <button
                              key={subItem.id}
                              className={`submenu-item-btn ${activeTab === subItem.id ? 'active' : ''}`}
                              onClick={() => setActiveTab(subItem.id)}
                            >
                              {subItem.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button 
                    key={item.id}
                    className={`nav-item-btn ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <div className="nav-item-left">
                      <item.icon />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom AI Help Card (StaffSphere style) & Profile */}
        <div className="sidebar-footer">
          <div className="ai-help-card">
            <div className="ai-help-title">
              <SparklesIcon /> Faith-AI Assist
            </div>
            <div className="ai-help-desc">
              Gere devocionais, relatórios de células e insights ministeriais com IA.
            </div>
            <button className="ai-help-btn" onClick={() => setActiveTab('devocionais')}>
              Abrir Assistente ✨
            </button>
          </div>

          <div className="user-mini-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="user-avatar-circle">
                {formattedUserName.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {formattedUserName}
                </span>
                <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Administrador</span>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              title="Sair da Conta"
              style={{ color: '#ef4444', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <LogOutIcon />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================
          MAIN CONTENT AREA
          ======================================================== */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <div>
              <div className="greeting-text">
                👋 Olá, {formattedUserName}!
              </div>
              <div className="greeting-sub">
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())}
              </div>
            </div>
          </div>

          <div className="topbar-center">
            <div className="search-pill">
              <SearchIcon />
              <input type="text" placeholder="Buscar membros, cultos, células, devocionais ou pedidos..." />
              <span className="search-shortcut">⌘K</span>
            </div>
          </div>

          <div className="topbar-right">
            <button className="action-circle-btn" title="Notificações">
              <span className="badge-dot"></span>
              <BellIcon />
            </button>
            <button className="action-circle-btn" title="Configurações Rápidas" onClick={() => setActiveTab('configuracoes')}>
              <SettingsIcon />
            </button>
            <div className="user-avatar-circle" style={{ cursor: 'pointer', width: '38px', height: '38px' }}>
              {formattedUserName.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page Container */}
        <div className="page-container">
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in dashboard-grid-layout">
              {/* ==========================================
                  DASHBOARD MAIN COLUMN (Left 2/3)
                  ========================================== */}
              <div className="dashboard-main-column">
                {/* 1. TOP 4 KPI CARDS (StaffSphere + Acadex hybrid) */}
                <div className="kpi-grid">
                  {/* KPI 1: Membros */}
                  <div className="kpi-card" onClick={() => setActiveTab('membros')}>
                    <div className="kpi-top-row">
                      <span className="kpi-title-tag">Membros Ativos</span>
                      <div className="kpi-icon-wrapper" style={{ background: 'var(--pastel-green-bg)', color: 'var(--pastel-green-text)' }}>
                        <UsersIcon />
                      </div>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-value">5.120</span>
                      <span className="kpi-pill-badge positive">
                        +12.5% ↗
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="kpi-subtext">Cadastros verificados</span>
                      <span className="kpi-arrow-btn"><ArrowRightIcon /></span>
                    </div>
                  </div>

                  {/* KPI 2: Frequência em Células */}
                  <div className="kpi-card" onClick={() => setActiveTab('celulas')}>
                    <div className="kpi-top-row">
                      <span className="kpi-title-tag">Frequência em Células</span>
                      <div className="kpi-icon-wrapper" style={{ background: 'var(--pastel-purple-bg)', color: 'var(--pastel-purple-text)' }}>
                        <HeartIcon />
                      </div>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-value">84%</span>
                      <span className="kpi-pill-badge positive">
                        +4.2% ↗
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="kpi-subtext">342 Células ativas</span>
                      <span className="kpi-arrow-btn"><ArrowRightIcon /></span>
                    </div>
                  </div>

                  {/* KPI 3: Monitor de PDV */}
                  <div className="kpi-card" onClick={() => setActiveTab('pdv_pedidos')}>
                    <div className="kpi-top-row">
                      <span className="kpi-title-tag">Pedidos PDV</span>
                      <div className="kpi-icon-wrapper" style={{ background: 'var(--pastel-blue-bg)', color: 'var(--pastel-blue-text)' }}>
                        <CartIcon />
                      </div>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-value">R$ 18.4K</span>
                      <span className="kpi-pill-badge positive">
                        +18.1% ↗
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="kpi-subtext">Cantina & Livraria no App</span>
                      <span className="kpi-arrow-btn"><ArrowRightIcon /></span>
                    </div>
                  </div>

                  {/* KPI 4: Cultos & Mídias */}
                  <div className="kpi-card" onClick={() => setActiveTab('transmissoes')}>
                    <div className="kpi-top-row">
                      <span className="kpi-title-tag">Audiência Cultos</span>
                      <div className="kpi-icon-wrapper" style={{ background: 'var(--pastel-orange-bg)', color: 'var(--pastel-orange-text)' }}>
                        <VideoIcon />
                      </div>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-value">12.8K</span>
                      <span className="kpi-pill-badge positive">
                        +9.4% ↗
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="kpi-subtext">Visualizações mensais</span>
                      <span className="kpi-arrow-btn"><ArrowRightIcon /></span>
                    </div>
                  </div>
                </div>

                {/* 2. CHARTS DUAL ROW (Performance Curve + Membership Donut) */}
                <div className="charts-dual-grid">
                  {/* Chart 1: Curva de Frequência e Presença */}
                  <div className="portal-card">
                    <div className="card-header-row">
                      <div>
                        <div className="card-title">Frequência & Crescimento</div>
                        <div className="card-subtitle">Presença média nos Cultos e Células</div>
                      </div>
                      <select 
                        className="select-pill"
                        value={chartPeriod}
                        onChange={(e) => setChartPeriod(e.target.value)}
                      >
                        <option value="6m">Últimos 6 Meses</option>
                        <option value="1y">Ano Atual (2026)</option>
                        <option value="all">Histórico Completo</option>
                      </select>
                    </div>

                    {/* High-Fidelity SVG Chart with Gradient */}
                    <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                      <svg viewBox="0 0 500 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        <defs>
                          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0f766e" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#0f766e" />
                            <stop offset="100%" stopColor="#14b8a6" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
                        <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeDasharray="4 4" />
                        <line x1="0" y1="130" x2="500" y2="130" stroke="#f1f5f9" strokeDasharray="4 4" />

                        {/* Area Fill */}
                        <path 
                          d="M 20 120 C 90 90, 140 110, 200 65 C 270 20, 340 75, 400 40 C 440 25, 470 35, 480 30 L 480 160 L 20 160 Z" 
                          fill="url(#areaGradient)" 
                        />

                        {/* Line Curve */}
                        <path 
                          d="M 20 120 C 90 90, 140 110, 200 65 C 270 20, 340 75, 400 40 C 440 25, 470 35, 480 30" 
                          fill="none" 
                          stroke="url(#lineGradient)" 
                          strokeWidth="3.5" 
                          strokeLinecap="round" 
                        />

                        {/* Data Points */}
                        <circle cx="20" cy="120" r="4.5" fill="#0f766e" stroke="#ffffff" strokeWidth="2.5" />
                        <circle cx="200" cy="65" r="4.5" fill="#0f766e" stroke="#ffffff" strokeWidth="2.5" />
                        <circle cx="400" cy="40" r="4.5" fill="#0f766e" stroke="#ffffff" strokeWidth="2.5" />
                        <circle cx="480" cy="30" r="5.5" fill="#14b8a6" stroke="#ffffff" strokeWidth="3" />

                        {/* Target highlight tag */}
                        <rect x="360" y="8" width="80" height="22" rx="6" fill="#0f766e" />
                        <text x="400" y="23" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="700">Recorde 94%</text>

                        {/* X-axis labels */}
                        <text x="20" y="175" fill="#94a3b8" fontSize="11" fontWeight="600">Mar</text>
                        <text x="110" y="175" fill="#94a3b8" fontSize="11" fontWeight="600">Abr</text>
                        <text x="200" y="175" fill="#94a3b8" fontSize="11" fontWeight="600">Mai</text>
                        <text x="290" y="175" fill="#94a3b8" fontSize="11" fontWeight="600">Jun</text>
                        <text x="390" y="175" fill="#94a3b8" fontSize="11" fontWeight="600">Jul</text>
                        <text x="475" y="175" fill="#0f766e" fontSize="11" fontWeight="800">Ago</text>
                      </svg>
                    </div>
                  </div>

                  {/* Chart 2: Donut de Distribuição dos Ministérios */}
                  <div className="portal-card">
                    <div className="card-header-row">
                      <div>
                        <div className="card-title">Membresia por Rede</div>
                        <div className="card-subtitle">Segmentação comunitária</div>
                      </div>
                      <span className="notice-badge">Ativo</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '140px', margin: '10px 0' }}>
                      <svg width="130" height="130" viewBox="0 0 100 100">
                        {/* Donut Segments */}
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0f766e" strokeWidth="16" strokeDasharray="80 240" strokeDashoffset="0" />
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0284c7" strokeWidth="16" strokeDasharray="60 240" strokeDashoffset="-80" />
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="16" strokeDasharray="50 240" strokeDashoffset="-140" />
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ec4899" strokeWidth="16" strokeDasharray="50 240" strokeDashoffset="-190" />
                      </svg>
                      <div style={{ position: 'absolute', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>5.100</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0f766e' }}></span>
                        <span>Jovens (35%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }}></span>
                        <span>Casais (25%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                        <span>Crianças (20%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }}></span>
                        <span>Líderes (20%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. MEMBERS & LEADERSHIP TABLE (StaffSphere style) */}
                <div className="portal-card">
                  <div className="card-header-row">
                    <div>
                      <div className="card-title">Membros & Liderança Recente</div>
                      <div className="card-subtitle">Acompanhamento de engajamento e status ministerial</div>
                    </div>
                    <button className="link-btn" onClick={() => setActiveTab('membros')}>
                      Ver Todos <ArrowRightIcon />
                    </button>
                  </div>

                  <div className="members-table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Membro / Líder</th>
                          <th>Ministério</th>
                          <th>Engajamento</th>
                          <th>Presença</th>
                          <th style={{ textAlign: 'right' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <div className="user-cell">
                              <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>JA</div>
                              <div>
                                <div className="member-meta-title">Jordi Anna</div>
                                <div className="member-meta-sub">jordianna@faithhub.org</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Líder de Louvor</td>
                          <td><span className="status-badge excellent">Excelente</span></td>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>98%</td>
                          <td style={{ textAlign: 'right' }}>
                            <button style={{ color: 'var(--text-muted)' }}><MoreHorizontalIcon /></button>
                          </td>
                        </tr>

                        <tr>
                          <td>
                            <div className="user-cell">
                              <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>EM</div>
                              <div>
                                <div className="member-meta-title">Elkan Murphy</div>
                                <div className="member-meta-sub">elkan.murphy@gmail.com</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Supervisão Células</td>
                          <td><span className="status-badge excellent">Excelente</span></td>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>92%</td>
                          <td style={{ textAlign: 'right' }}>
                            <button style={{ color: 'var(--text-muted)' }}><MoreHorizontalIcon /></button>
                          </td>
                        </tr>

                        <tr>
                          <td>
                            <div className="user-cell">
                              <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>HM</div>
                              <div>
                                <div className="member-meta-title">Harry Martin</div>
                                <div className="member-meta-sub">harry.m@faithhub.org</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Comunicação & Mídia</td>
                          <td><span className="status-badge good">Ativo</span></td>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>85%</td>
                          <td style={{ textAlign: 'right' }}>
                            <button style={{ color: 'var(--text-muted)' }}><MoreHorizontalIcon /></button>
                          </td>
                        </tr>

                        <tr>
                          <td>
                            <div className="user-cell">
                              <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>KB</div>
                              <div>
                                <div className="member-meta-title">Kylan Barros</div>
                                <div className="member-meta-sub">kylan.barros@faithhub.org</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Novo Convertido</td>
                          <td><span className="status-badge pending">Acolhimento</span></td>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>60%</td>
                          <td style={{ textAlign: 'right' }}>
                            <button style={{ color: 'var(--text-muted)' }}><MoreHorizontalIcon /></button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. ACTIONS & ONGOING PROJECTS (StaffSphere style) */}
                <div className="portal-card">
                  <div className="card-header-row">
                    <div>
                      <div className="card-title">Projetos & Ações em Andamento</div>
                      <div className="card-subtitle">Iniciativas estratégicas do ecossistema</div>
                    </div>
                    <button className="link-btn" onClick={() => setActiveTab('eventos')}>
                      Gerenciar <ArrowRightIcon />
                    </button>
                  </div>

                  <div className="project-card-item">
                    <div className="project-icon-box" style={{ background: '#fdf2f8', color: '#db2777' }}>
                      <VideoIcon />
                    </div>
                    <div className="project-details">
                      <div className="project-header-row">
                        <span className="project-title">Implantação do Sistema de Transmissão 4K</span>
                        <span className="status-badge good">75% Concluído</span>
                      </div>
                      <div className="project-meta-row">
                        <span>📅 Prazo: 28 de Agosto</span>
                        <span>• Responsável: Mídia & TI</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: '75%', background: 'linear-gradient(90deg, #ec4899, #f43f5e)' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="project-card-item">
                    <div className="project-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                      <UsersIcon />
                    </div>
                    <div className="project-details">
                      <div className="project-header-row">
                        <span className="project-title">Campanha de Multiplicação de Células Jovens</span>
                        <span className="status-badge excellent">90% da Meta</span>
                      </div>
                      <div className="project-meta-row">
                        <span>📅 Prazo: 15 de Setembro</span>
                        <span>• 45 Novas Células</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: '90%', background: 'linear-gradient(90deg, #10b981, #059669)' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="project-card-item">
                    <div className="project-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                      <CartIcon />
                    </div>
                    <div className="project-details">
                      <div className="project-header-row">
                        <span className="project-title">Expansão do PDV Mobile nos Cultos de Domingo</span>
                        <span className="status-badge pending">40% Estruturado</span>
                      </div>
                      <div className="project-meta-row">
                        <span>📅 Prazo: 05 de Setembro</span>
                        <span>• Cantina & Livraria</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: '40%', background: 'linear-gradient(90deg, #3b82f6, #0284c7)' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. NOTICE BOARD (Acadex style) */}
                <div className="portal-card">
                  <div className="card-header-row">
                    <div>
                      <div className="card-title">Mural de Avisos & Comunicados</div>
                      <div className="card-subtitle">Publicações oficiais para toda a liderança</div>
                    </div>
                    <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}>
                      + Novo Aviso
                    </button>
                  </div>

                  <div className="notice-card">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '3px' }}>
                        Inscrições Abertas para a Escola de Líderes 2026.2
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Publicado pela Coordenação Geral • 12 de Agosto de 2026
                      </div>
                    </div>
                    <span className="status-badge good">Destaque</span>
                  </div>

                  <div className="notice-card">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '3px' }}>
                        Alinhamento Geral de Voluntários para a Conferência Anual
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Publicado pelo Ministério Pastoral • 08 de Agosto de 2026
                      </div>
                    </div>
                    <span className="status-badge pending">Importante</span>
                  </div>
                </div>
              </div>

              {/* ==========================================
                  DASHBOARD RIGHT COLUMN (Acadex style - 1/3)
                  ========================================== */}
              <div className="dashboard-sidebar-column">
                {/* 1. MINI CALENDAR WIDGET */}
                <div className="calendar-widget">
                  <div className="calendar-header">
                    <div className="calendar-month-title">Agosto 2026</div>
                    <div className="calendar-nav-btns">
                      <button className="cal-nav-btn">‹</button>
                      <button className="cal-nav-btn">›</button>
                    </div>
                  </div>

                  <div className="calendar-grid">
                    <span className="cal-weekday">Dom</span>
                    <span className="cal-weekday">Seg</span>
                    <span className="cal-weekday">Ter</span>
                    <span className="cal-weekday">Qua</span>
                    <span className="cal-weekday">Qui</span>
                    <span className="cal-weekday">Sex</span>
                    <span className="cal-weekday">Sáb</span>

                    {/* Calendar Days */}
                    <div className="cal-day-cell other-month">27</div>
                    <div className="cal-day-cell other-month">28</div>
                    <div className="cal-day-cell other-month">29</div>
                    <div className="cal-day-cell other-month">30</div>
                    <div className="cal-day-cell other-month">31</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(1)}>1</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(2)}>2</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(3)}>3</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(4)}>4</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(5)}>5</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(6)}>6</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(7)}>7</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(8)}>8</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(9)}>9</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(10)}>10</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(11)}>11</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(12)}>12</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(13)}>13</div>
                    <div className={`cal-day-cell ${selectedCalDay === 14 ? 'active-today' : ''}`} onClick={() => setSelectedCalDay(14)}>14</div>
                    <div className="cal-day-cell has-event" onClick={() => setSelectedCalDay(15)}>15</div>
                    <div className="cal-day-cell has-event" onClick={() => setSelectedCalDay(16)}>16</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(17)}>17</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(18)}>18</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(19)}>19</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(20)}>20</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(21)}>21</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(22)}>22</div>
                    <div className="cal-day-cell has-event" onClick={() => setSelectedCalDay(23)}>23</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(24)}>24</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(25)}>25</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(26)}>26</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(27)}>27</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(28)}>28</div>
                    <div className="cal-day-cell" onClick={() => setSelectedCalDay(29)}>29</div>
                    <div className="cal-day-cell has-event" onClick={() => setSelectedCalDay(30)}>30</div>
                  </div>
                </div>

                {/* 2. TODAY'S SCHEDULE & TIMELINE (Acadex style) */}
                <div className="portal-card">
                  <div className="card-header-row">
                    <div>
                      <div className="card-title">Agenda & Cultos</div>
                      <div className="card-subtitle">Programação de Hoje ({selectedCalDay} de Agosto)</div>
                    </div>
                    <button className="link-btn" onClick={() => setActiveTab('eventos')}>
                      + Add
                    </button>
                  </div>

                  <div className="schedule-item">
                    <div className="schedule-time-box">
                      <span>09:00 AM</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>11:00 AM</span>
                    </div>
                    <div className="schedule-content">
                      <div className="schedule-title">Culto de Celebração Matinal</div>
                      <span className="schedule-tag" style={{ background: '#ecfdf5', color: '#059669' }}>Toda a Igreja • Presencial & Live</span>
                    </div>
                  </div>

                  <div className="schedule-item">
                    <div className="schedule-time-box">
                      <span>15:00 PM</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>17:00 PM</span>
                    </div>
                    <div className="schedule-content">
                      <div className="schedule-title">Reunião Mensal de Liderança</div>
                      <span className="schedule-tag" style={{ background: '#eff6ff', color: '#2563eb' }}>Pastores & Supervisores</span>
                    </div>
                  </div>

                  <div className="schedule-item">
                    <div className="schedule-time-box">
                      <span>19:30 PM</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>21:30 PM</span>
                    </div>
                    <div className="schedule-content">
                      <div className="schedule-title">Culto dos Jovens (The One)</div>
                      <span className="schedule-tag" style={{ background: '#fdf2f8', color: '#db2777' }}>Rede Jovem & Convidados</span>
                    </div>
                  </div>
                </div>

                {/* 3. RECENT ACTIVITY FEED (Acadex style) */}
                <div className="portal-card">
                  <div className="card-header-row">
                    <div>
                      <div className="card-title">Atividades Recentes</div>
                      <div className="card-subtitle">Log de eventos do ecossistema</div>
                    </div>
                    <span className="notice-badge">Tempo Real</span>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon-dot" style={{ background: '#10b981' }}>
                      <UsersIcon />
                    </div>
                    <div>
                      <div className="activity-text">
                        <strong>Mateus Silveira</strong> concluiu o cadastro de membro e foi alocado na Célula Betel.
                      </div>
                      <div className="activity-time">Há 8 minutos</div>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon-dot" style={{ background: '#0284c7' }}>
                      <CartIcon />
                    </div>
                    <div>
                      <div className="activity-text">
                        Pedido <strong>#PDV-1094</strong> (Bíblia de Estudos + Café) aprovado via App.
                      </div>
                      <div className="activity-time">Há 25 minutos</div>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon-dot" style={{ background: '#7c3aed' }}>
                      <HeartIcon />
                    </div>
                    <div>
                      <div className="activity-text">
                        Novo devocional <strong>"Caminhando pela Fé"</strong> publicado para amanhã.
                      </div>
                      <div className="activity-time">Há 1 hora</div>
                    </div>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon-dot" style={{ background: '#f59e0b' }}>
                      <VideoIcon />
                    </div>
                    <div>
                      <div className="activity-text">
                        Live do Culto de Domingo agendada com sucesso no YouTube.
                      </div>
                      <div className="activity-time">Há 3 horas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              ACTIVE MODULE RENDERERS
              ========================================== */}
          {activeTab === 'membros' && <Members />}
          {activeTab === 'transmissoes' && <Broadcasts />}
          {activeTab === 'celulas' && <CellGroups />}
          {activeTab === 'estudos' && <Studies />}
          {activeTab === 'eventos' && <Events />}
          {activeTab === 'devocionais' && <Devotionals />}
          {activeTab === 'pdv_produtos' && <PdvProdutos />}
          {activeTab === 'pdv_pedidos' && <PdvPedidos />}
          {activeTab === 'pagarme_financeiro' && <PagarmeSettings />}
          {activeTab === 'church_branding' && <ChurchBranding />}

          {/* In Construction View */}
          {activeTab === 'configuracoes' && (
            <div className="portal-card animate-fade-in" style={{ padding: '64px', textAlign: 'center', marginTop: '16px' }}>
              <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '24px', borderRadius: '50%', marginBottom: '20px', color: 'var(--accent-primary)' }}>
                <SettingsIcon />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>Configurações do Sistema</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', maxWidth: '460px', margin: '0 auto 28px auto', lineHeight: '1.6', fontSize: '0.92rem' }}>
                Gerencie integrações com AWS Cognito, parâmetros da igreja, credenciais de streaming e notificações push do aplicativo Faith-Hub.
              </p>
              <button className="btn-primary" onClick={() => setActiveTab('dashboard')}>
                Retornar ao Dashboard Central
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
