import React, { useState, useEffect } from 'react';
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
import './index.css';

// Minimal Inline SVG Icons for premium look
const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);
const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
);
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);
const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
const ShoppingCartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
);

const appMenu = [
  { category: 'Administrativo', items: [
    { id: 'dashboard', label: 'Dashboard', icon: GridIcon },
    { id: 'membros', label: 'Gestão de Membros', icon: UsersIcon },
  ]},
  { category: 'Ponto de Venda (PDV)', items: [
    { id: 'pdv_produtos', label: 'Gestão de Produtos', icon: GridIcon },
    { id: 'pdv_pedidos', label: 'Monitor de Pedidos do App', icon: ShoppingCartIcon },
  ]},
  { category: 'Células & Redes', items: [
    { id: 'celulas', label: 'Estrutura e Aprovações', icon: UsersIcon },
    { id: 'estudos', label: 'Estudos e Mídias', icon: VideoIcon },
  ]},
  { category: 'Igreja & Ensino', items: [
    { id: 'transmissoes', label: 'Central de Cultos', icon: VideoIcon },
    { id: 'devocionais', label: 'Devocionais Diários', icon: HeartIcon },
    { id: 'eventos', label: 'Eventos, Cursos e Trilhas', icon: GridIcon },
  ]},
  { category: 'Sistema', items: [
    { id: 'configuracoes', label: 'Configurações', icon: SettingsIcon },
  ]}
];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);

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

  if (isLoadingAuth) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}>Carregando sessão...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={checkAuth} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">FH</div>
          <span className="sidebar-brand">Faith-Hub <span className="gradient-text">Studio</span></span>
        </div>
        
        <nav className="sidebar-nav">
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {appMenu.map((group, gIdx) => (
              <React.Fragment key={gIdx}>
                <li style={{ padding: '16px 16px 4px 16px', fontSize: '0.70rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {group.category}
                </li>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button 
                      className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.id)}
                      style={{ width: '100%', textAlign: 'left', background: activeTab === item.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      <item.icon />
                      <span className="text">{item.label}</span>
                    </button>
                  </li>
                ))}
              </React.Fragment>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile" style={{ marginBottom: '8px' }}>
            <div className="user-avatar" style={{ background: '#5bc3bb', color: '#111' }}>
              {user?.signInDetails?.loginId?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <span className="user-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                {user?.signInDetails?.loginId || 'Usuário'}
              </span>
              <span className="user-role">Administrador</span>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="nav-item" 
            style={{ width: '100%', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', marginTop: '8px' }}
          >
            <LogOutIcon />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-search">
            <SearchIcon />
            <input type="text" placeholder="Buscar membros, transmissões ou vendas..." />
          </div>
          <div className="topbar-actions">
            <button className="icon-btn">
              <span className="notification-dot"></span>
              <BellIcon />
            </button>
            <button className="btn-primary">
              + Nova Ação
            </button>
          </div>
        </header>

        <div className="page-content">
          {activeTab !== 'transmissoes' && (
            <div className="page-header animate-fade-in">
              <div>
                <h1 className="page-title">
                  {appMenu.flatMap(g => g.items).find(m => m.id === activeTab)?.label}
                </h1>
                <p className="page-subtitle">Bem-vindo ao portal de gerenciamento unificado do Faith-Hub.</p>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="dashboard-grid animate-fade-in">
              <div className="stat-card card">
                <div className="stat-header">
                  <span className="stat-title">Membros Ativos</span>
                  <div className="stat-icon purple"><UsersIcon /></div>
                </div>
                <div className="stat-value">1,248</div>
                <div className="stat-change positive"><span>↗ 12%</span> este mês</div>
              </div>

              <div className="stat-card card">
                <div className="stat-header">
                  <span className="stat-title">Arrecadação PDV</span>
                  <div className="stat-icon green"><WalletIcon /></div>
                </div>
                <div className="stat-value">R$ 15.420</div>
                <div className="stat-change positive"><span>↗ 8.4%</span> esta semana</div>
              </div>

              <div className="stat-card card">
                <div className="stat-header">
                  <span className="stat-title">Visualizações em Lives</span>
                  <div className="stat-icon blue"><VideoIcon /></div>
                </div>
                <div className="stat-value">8,409</div>
                <div className="stat-change negative"><span>↘ 3%</span> este mês</div>
              </div>

              <div className="stat-card card">
                <div className="stat-header">
                  <span className="stat-title">Devocionais Lidos</span>
                  <div className="stat-icon orange"><HeartIcon /></div>
                </div>
                <div className="stat-value">42.5k</div>
                <div className="stat-change positive"><span>↗ 24%</span> este mês</div>
              </div>

              <div className="card-wide card">
                <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Crescimento da Comunidade</h3>
                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Gráfico de Atividade de Membros (Implementar Chart.js/Recharts aqui)
                </div>
              </div>

              <div className="card-narrow card">
                <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Últimas Transações PDV</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Doação Dizimo</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Membro #{900+i}</div>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--success)' }}>
                        +R$ 150,00
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'membros' && (
            <Members />
          )}

          {activeTab === 'transmissoes' && (
            <Broadcasts />
          )}

          {activeTab === 'celulas' && (
            <CellGroups />
          )}

          {activeTab === 'estudos' && (
            <Studies />
          )}

          {activeTab === 'eventos' && (
            <Events />
          )}

          {activeTab === 'devocionais' && (
            <Devotionals />
          )}

          {activeTab === 'pdv_produtos' && (
            <PdvProdutos />
          )}

          {activeTab === 'pdv_pedidos' && (
            <PdvPedidos />
          )}

          {activeTab !== 'dashboard' && activeTab !== 'membros' && activeTab !== 'transmissoes' && activeTab !== 'celulas' && activeTab !== 'estudos' && activeTab !== 'eventos' && activeTab !== 'devocionais' && activeTab !== 'pdv_produtos' && activeTab !== 'pdv_pedidos' && (
            <div className="card animate-fade-in" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', color: 'var(--text-muted)' }}>
              <div style={{ background: 'var(--panel-bg-hover)', padding: '24px', borderRadius: '50%' }}>
                <SettingsIcon />
              </div>
              <h2 style={{ color: 'var(--text-main)' }}>Módulo em Desenvolvimento</h2>
              <p>Esta área será conectada em breve.</p>
              <button className="btn-secondary" onClick={() => setActiveTab('dashboard')}>Voltar ao Dashboard</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
