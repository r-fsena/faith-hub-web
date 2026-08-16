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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

// Navigation Structure
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
    church_name: 'Minha Igreja',
    logo_icon_url: '',
    primary_color: '#0f766e'
  });

  // Calendar State
  const [selectedCalDay, setSelectedCalDay] = useState(new Date().getDate());

  // Dashboard Live Stats State (Zero Mock)
  const [dashboardStats, setDashboardStats] = useState<{
    membersCount: number;
    cellsCount: number;
    ordersTotal: number;
    eventsCount: number;
    recentMembers: any[];
    upcomingEvents: any[];
    activeBroadcast: any;
  }>({
    membersCount: 0,
    cellsCount: 0,
    ordersTotal: 0,
    eventsCount: 0,
    recentMembers: [],
    upcomingEvents: [],
    activeBroadcast: null
  });

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

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardStats();
    }
  }, [isAuthenticated, activeTab]);

  const loadDashboardStats = async () => {
    try {
      const [membersRes, cellsRes, ordersRes, eventsRes, broadcastRes] = await Promise.allSettled([
        fetch(`${API_URL}/members`),
        fetch(`${API_URL}/cell-groups`),
        fetch(`${API_URL}/pdv/orders`),
        fetch(`${API_URL}/events`),
        fetch(`${API_URL}/broadcasts/active`)
      ]);

      let membersCount = 0;
      let recentMembers: any[] = [];
      if (membersRes.status === 'fulfilled' && membersRes.value.ok) {
        const data = await membersRes.value.json();
        const list = data.data || [];
        membersCount = list.length;
        recentMembers = list.slice(0, 5);
      }

      let cellsCount = 0;
      if (cellsRes.status === 'fulfilled' && cellsRes.value.ok) {
        const list = await cellsRes.value.json();
        cellsCount = Array.isArray(list) ? list.length : 0;
      }

      let ordersTotal = 0;
      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const list = await ordersRes.value.json();
        if (Array.isArray(list)) {
          ordersTotal = list.reduce((acc: number, item: any) => acc + Number(item.total_amount || 0), 0);
        }
      }

      let eventsCount = 0;
      let upcomingEvents: any[] = [];
      if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
        const data = await eventsRes.value.json();
        const list = data.data || [];
        eventsCount = list.length;
        upcomingEvents = list.slice(0, 4);
      }

      let activeBroadcast: any = null;
      if (broadcastRes.status === 'fulfilled' && broadcastRes.value.ok) {
        activeBroadcast = await broadcastRes.value.json();
      }

      setDashboardStats({
        membersCount,
        cellsCount,
        ordersTotal,
        eventsCount,
        recentMembers,
        upcomingEvents,
        activeBroadcast
      });
    } catch (err) {
      console.error("Erro ao carregar métricas do dashboard:", err);
    }
  };

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
          LEFT SIDEBAR
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
            <div className="brand-logo-icon">
              <SparklesIcon />
            </div>
          )}
          <div className="brand-meta">
            <span className="brand-title">{churchSettings.church_name || 'Faith-Hub'}</span>
            <span className="brand-subtitle">Portal Administrativo</span>
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="nav-wrapper">
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx} className="nav-group-section">
              <div className="nav-category-label">{group.category}</div>
              
              {group.items.map((item) => {
                const IconComponent = item.icon;
                const isGroupOpen = openSubmenus[item.id];
                const isItemActive = activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab));

                if (item.hasSubmenu && item.subItems) {
                  return (
                    <div key={item.id} className="nav-tree-item">
                      <button
                        className={`nav-button has-tree ${isItemActive ? 'group-active' : ''}`}
                        onClick={() => toggleSubmenu(item.id)}
                      >
                        <div className="nav-btn-left">
                          <IconComponent />
                          <span>{item.label}</span>
                        </div>
                        <span className="tree-chevron">
                          {isGroupOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        </span>
                      </button>

                      {isGroupOpen && (
                        <div className="submenu-tree-list">
                          {item.subItems.map((sub) => (
                            <button
                              key={sub.id}
                              className={`submenu-btn ${activeTab === sub.id ? 'active' : ''}`}
                              onClick={() => setActiveTab(sub.id)}
                            >
                              <span className="submenu-dot"></span>
                              <span>{sub.label}</span>
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
                    className={`nav-button ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <div className="nav-btn-left">
                      <IconComponent />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Area */}
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar-circle">
              {formattedUserName.charAt(0)}
            </div>
            <div className="user-info-text">
              <span className="user-name">{formattedUserName}</span>
              <span className="user-role">Administrador</span>
            </div>
          </div>

          <button className="logout-btn" onClick={handleSignOut} title="Encerrar Sessão">
            <LogOutIcon />
          </button>
        </div>
      </aside>

      {/* ========================================================
          MAIN CONTENT AREA
          ======================================================== */}
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="page-title-heading">
              {activeTab === 'dashboard' && 'Visão Geral & Dashboard'}
              {activeTab === 'membros' && 'Gestão de Membros & Liderança'}
              {activeTab === 'celulas' && 'Células, Redes & Grupos Familiares'}
              {activeTab === 'devocionais' && 'Devocionais Diários'}
              {activeTab === 'estudos' && 'Biblioteca de Estudos & Mídias'}
              {activeTab === 'eventos' && 'Eventos, Cursos & Inscrições'}
              {activeTab === 'pdv_produtos' && 'Catálogo de Produtos PDV'}
              {activeTab === 'pdv_pedidos' && 'Monitor de Pedidos em Tempo Real'}
              {activeTab === 'transmissoes' && 'Central de Cultos & Transmissões'}
              {activeTab === 'church_branding' && 'Identidade Visual & PWA Studio'}
              {activeTab === 'pagarme_financeiro' && 'Configurações de Pagamento (Pagar.me / Pix)'}
              {activeTab === 'configuracoes' && 'Configurações da Nuvem AWS'}
            </div>
            <div className="search-pill-container">
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
                {/* 1. TOP 4 KPI CARDS (Live RDS Data) */}
                <div className="kpi-grid">
                  {/* KPI 1: Membros */}
                  <div className="kpi-card" onClick={() => setActiveTab('membros')}>
                    <div className="kpi-top-row">
                      <span className="kpi-title-tag">Membros Cadastrados</span>
                      <div className="kpi-icon-wrapper" style={{ background: 'var(--pastel-green-bg)', color: 'var(--pastel-green-text)' }}>
                        <UsersIcon />
                      </div>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-value">{dashboardStats.membersCount}</span>
                      <span className="kpi-pill-badge positive">
                        {dashboardStats.membersCount > 0 ? 'Ativo' : 'Inicial'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="kpi-subtext">Cadastros no sistema</span>
                      <span className="kpi-arrow-btn"><ArrowRightIcon /></span>
                    </div>
                  </div>

                  {/* KPI 2: Células */}
                  <div className="kpi-card" onClick={() => setActiveTab('celulas')}>
                    <div className="kpi-top-row">
                      <span className="kpi-title-tag">Células & Redes</span>
                      <div className="kpi-icon-wrapper" style={{ background: 'var(--pastel-purple-bg)', color: 'var(--pastel-purple-text)' }}>
                        <HeartIcon />
                      </div>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-value">{dashboardStats.cellsCount}</span>
                      <span className="kpi-pill-badge positive">
                        {dashboardStats.cellsCount > 0 ? 'Ativo' : 'Inicial'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="kpi-subtext">Grupos conectados</span>
                      <span className="kpi-arrow-btn"><ArrowRightIcon /></span>
                    </div>
                  </div>

                  {/* KPI 3: Monitor de PDV */}
                  <div className="kpi-card" onClick={() => setActiveTab('pdv_pedidos')}>
                    <div className="kpi-top-row">
                      <span className="kpi-title-tag">Vendas na Cantina / PDV</span>
                      <div className="kpi-icon-wrapper" style={{ background: 'var(--pastel-blue-bg)', color: 'var(--pastel-blue-text)' }}>
                        <CartIcon />
                      </div>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-value">R$ {dashboardStats.ordersTotal.toFixed(2).replace('.', ',')}</span>
                      <span className="kpi-pill-badge positive">
                        Total
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="kpi-subtext">Pedidos via App & Caixa</span>
                      <span className="kpi-arrow-btn"><ArrowRightIcon /></span>
                    </div>
                  </div>

                  {/* KPI 4: Eventos */}
                  <div className="kpi-card" onClick={() => setActiveTab('eventos')}>
                    <div className="kpi-top-row">
                      <span className="kpi-title-tag">Eventos & Cursos</span>
                      <div className="kpi-icon-wrapper" style={{ background: 'var(--pastel-orange-bg)', color: 'var(--pastel-orange-text)' }}>
                        <VideoIcon />
                      </div>
                    </div>
                    <div className="kpi-value-row">
                      <span className="kpi-value">{dashboardStats.eventsCount}</span>
                      <span className="kpi-pill-badge positive">
                        {dashboardStats.eventsCount > 0 ? 'Publicados' : 'Inicial'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="kpi-subtext">Inscrições e passaportes</span>
                      <span className="kpi-arrow-btn"><ArrowRightIcon /></span>
                    </div>
                  </div>
                </div>

                {/* 2. ACTIONS & SETUP CHECKLIST */}
                <div className="portal-card">
                  <div className="card-header-row">
                    <div>
                      <div className="card-title">Configurações & Próximos Passos</div>
                      <div className="card-subtitle">Inicie a implantação do ecossistema da sua igreja</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '12px' }}>
                    <div 
                      className="project-card-item" 
                      onClick={() => setActiveTab('church_branding')}
                      style={{ cursor: 'pointer', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '14px', margin: 0 }}
                    >
                      <div className="project-icon-box" style={{ background: '#f0fdfa', color: '#0f766e' }}>
                        <PaletteIcon />
                      </div>
                      <div className="project-details">
                        <span className="project-title" style={{ fontSize: '0.88rem' }}>Identidade & Cores</span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Configure o nome, logotipo e tema do PWA</div>
                      </div>
                    </div>

                    <div 
                      className="project-card-item" 
                      onClick={() => setActiveTab('pagarme_financeiro')}
                      style={{ cursor: 'pointer', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '14px', margin: 0 }}
                    >
                      <div className="project-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <CreditCardIcon />
                      </div>
                      <div className="project-details">
                        <span className="project-title" style={{ fontSize: '0.88rem' }}>Gateway de Pagamento</span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Ative a chave Pagar.me e chave Pix</div>
                      </div>
                    </div>

                    <div 
                      className="project-card-item" 
                      onClick={() => setActiveTab('pdv_produtos')}
                      style={{ cursor: 'pointer', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '14px', margin: 0 }}
                    >
                      <div className="project-icon-box" style={{ background: '#fdf2f8', color: '#db2777' }}>
                        <CartIcon />
                      </div>
                      <div className="project-details">
                        <span className="project-title" style={{ fontSize: '0.88rem' }}>Cardápio da Cantina</span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Cadastre lanches, cafés e itens da loja</div>
                      </div>
                    </div>

                    <div 
                      className="project-card-item" 
                      onClick={() => setActiveTab('celulas')}
                      style={{ cursor: 'pointer', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '14px', margin: 0 }}
                    >
                      <div className="project-icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
                        <HeartIcon />
                      </div>
                      <div className="project-details">
                        <span className="project-title" style={{ fontSize: '0.88rem' }}>Redes e Células</span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Crie os grupos familiares e líderes</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. MEMBERS TABLE */}
                <div className="portal-card">
                  <div className="card-header-row">
                    <div>
                      <div className="card-title">Membros Cadastrados Recentemente</div>
                      <div className="card-subtitle">Acompanhamento da membresia e liderança</div>
                    </div>
                    <button className="link-btn" onClick={() => setActiveTab('membros')}>
                      Ver Todos <ArrowRightIcon />
                    </button>
                  </div>

                  <div className="members-table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Membro</th>
                          <th>Cargo / Função</th>
                          <th>Status</th>
                          <th>Cadastro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardStats.recentMembers.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                              Nenhum membro cadastrado ainda. Clique em "Ver Todos" para convidar pessoas.
                            </td>
                          </tr>
                        ) : (
                          dashboardStats.recentMembers.map((m: any) => (
                            <tr key={m.id}>
                              <td>
                                <div className="user-cell">
                                  <div className="member-avatar" style={{ background: 'var(--accent-primary-gradient)' }}>
                                    {m.name ? m.name.charAt(0).toUpperCase() : 'M'}
                                  </div>
                                  <div>
                                    <div className="member-meta-title">{m.name}</div>
                                    <div className="member-meta-sub">{m.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{m.role || 'Membro'}</td>
                              <td><span className="status-badge good">Ativo</span></td>
                              <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : 'Hoje'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* ==========================================
                  DASHBOARD RIGHT COLUMN (1/3)
                  ========================================== */}
              <div className="dashboard-right-column">
                {/* 1. CALENDAR WIDGET */}
                <div className="portal-card">
                  <div className="card-header-row">
                    <div className="card-title">Calendário Ministerial</div>
                    <span className="notice-badge">Hoje</span>
                  </div>

                  <div className="calendar-grid">
                    <div className="cal-day-header">D</div>
                    <div className="cal-day-header">S</div>
                    <div className="cal-day-header">T</div>
                    <div className="cal-day-header">Q</div>
                    <div className="cal-day-header">Q</div>
                    <div className="cal-day-header">S</div>
                    <div className="cal-day-header">S</div>

                    {Array.from({ length: 30 }, (_, i) => i + 1).map(day => (
                      <div 
                        key={day} 
                        className={`cal-day-cell ${selectedCalDay === day ? 'active-today' : ''}`}
                        onClick={() => setSelectedCalDay(day)}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. AGENDA & PROGRAMAÇÕES REAIS */}
                <div className="portal-card">
                  <div className="card-header-row">
                    <div>
                      <div className="card-title">Próximos Eventos</div>
                      <div className="card-subtitle">Programações da igreja</div>
                    </div>
                    <button className="link-btn" onClick={() => setActiveTab('eventos')}>
                      + Add
                    </button>
                  </div>

                  {dashboardStats.upcomingEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      Nenhum evento agendado para os próximos dias. Cadastre em "Eventos & Trilhas".
                    </div>
                  ) : (
                    dashboardStats.upcomingEvents.map(ev => (
                      <div key={ev.id} className="schedule-item">
                        <div className="schedule-time-box">
                          <span>{ev.start_date ? new Date(ev.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Em breve'}</span>
                        </div>
                        <div className="schedule-content">
                          <div className="schedule-title">{ev.title}</div>
                          <span className="schedule-tag" style={{ background: '#ecfdf5', color: '#059669' }}>
                            {ev.location || 'Templo Principal'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 3. ATIVIDADES RECENTES */}
                <div className="portal-card">
                  <div className="card-header-row">
                    <div>
                      <div className="card-title">Atividades do Sistema</div>
                      <div className="card-subtitle">Status em tempo real</div>
                    </div>
                    <span className="notice-badge">Online</span>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon-dot" style={{ background: '#10b981' }}>
                      <SparklesIcon />
                    </div>
                    <div>
                      <div className="activity-text">
                        Sistema conectado à nuvem AWS em <strong>us-east-2</strong> com banco RDS MySQL.
                      </div>
                      <div className="activity-time">Pronto para uso</div>
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

          {/* Settings View */}
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
