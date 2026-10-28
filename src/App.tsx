import { lazy, Suspense, useCallback, useState, useEffect, useMemo } from 'react';
import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';
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
import KidsMinistry from './modules/KidsMinistry';
import ChurchBranding from './modules/ChurchBranding';
import PagarmeSettings from './modules/PagarmeSettings';
import Campuses, { type Campus } from './modules/Campuses';
import OrganizationSelector, { type Organization } from './modules/OrganizationSelector';
import { ProposalPublicView } from './modules/ProposalPublicView';
import { BibleConfig } from './modules/BibleConfig';
import { FinancialTreasury } from './modules/FinancialTreasury';
import { MySubscription } from './modules/MySubscription';
import { FeatureFlagsManagement } from './modules/FeatureFlagsManagement';
import { SecurityAuditLogs } from './modules/SecurityAuditLogs';
import { PastoralPrayers } from './modules/PastoralPrayers';
import { PastoralCareRadar } from './modules/PastoralCareRadar';
import { VisitorsFunnel } from './modules/VisitorsFunnel';
import { MinistriesManagement } from './modules/MinistriesManagement';
import { PublicWelcomeView } from './modules/PublicWelcomeView';
import { Secretariat } from './modules/Secretariat';
import { PublicDocumentVerification } from './modules/PublicDocumentVerification';
import { FeatureFlagProvider, useFeatureFlags, FeatureGate } from './context/FeatureFlagContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { StudioWorkspace, type StudioWorkspaceKind } from './components/StudioWorkspace';
import { StudioExperienceProvider } from './context/StudioExperienceContext';
import { StudioCommandPalette, StudioFavoritesNav, StudioSearchTrigger } from './components/StudioCommandPalette';
import { StudioHelpButton, StudioOnboardingCard, StudioOnboardingModal } from './components/StudioOnboarding';
import { getAuthHeaders } from './services/apiClient';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';
const StudioContextNavigationV2 = lazy(() => import('./v2/StudioContextNavigationV2'));

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);

// Professional SVG Icons
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>
);
const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
);
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
const BabyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/><path d="M9 13v2"/><path d="M15 13v2"/></svg>
);
const ArchiveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nav-icon"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
);

// Navigation Structure
export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  featureFlagKey?: string;
  visibleWhenAny?: string[];
  allowedRoles?: string[];
  matchTabs?: string[];
}

export interface NavigationCategory {
  category: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationCategory[] = [
  {
    category: 'Geral',
    items: [
      { id: 'dashboard', label: 'Início', icon: DashboardIcon },
    ]
  },
  {
    category: 'Áreas de trabalho',
    items: [
      {
        id: 'people_workspace',
        label: 'Pessoas',
        icon: UsersIcon,
        visibleWhenAny: ['members.module_enabled', 'cell_groups.module_enabled'],
        matchTabs: ['membros', 'celulas', 'pastoral_radar', 'visitantes']
      },
      {
        id: 'ministries_workspace',
        label: 'Equipes & Ministérios',
        icon: HeartIcon,
        visibleWhenAny: ['cell_groups.module_enabled', 'kids.module_enabled'],
        matchTabs: ['ministerios', 'kids_workspace', 'kids_salas', 'kids_checkin', 'kids_chamados', 'kids_familias', 'kids_config_salas', 'kids_relatorios', 'kids_ministerio']
      },
      {
        id: 'secretariat_workspace',
        label: 'Secretaria',
        icon: ArchiveIcon,
        featureFlagKey: 'secretariat.module_enabled',
        matchTabs: ['secretariat_overview', 'secretariat_records', 'secretariat_movements', 'secretariat_documents', 'secretariat_baptisms', 'secretariat_templates']
      },
      {
        id: 'content_workspace',
        label: 'Conteúdo & Comunicação',
        icon: BookIcon,
        visibleWhenAny: ['events.module_enabled', 'broadcasts.module_enabled', 'devotionals.module_enabled', 'studies.module_enabled', 'bible.module_enabled', 'prayers.module_enabled'],
        matchTabs: ['eventos', 'transmissoes', 'devocionais', 'estudos', 'bible_config', 'oracoes']
      },
      {
        id: 'operations_workspace',
        label: 'Loja & Operações',
        icon: CartIcon,
        featureFlagKey: 'pdv.module_enabled',
        matchTabs: ['pdv_produtos', 'pdv_pedidos']
      },
      {
        id: 'finance_workspace',
        label: 'Finanças',
        icon: CreditCardIcon,
        featureFlagKey: 'financial.module_enabled',
        allowedRoles: ['SUPERADMIN', 'PASTOR', 'ADMIN', 'TREASURER'],
        matchTabs: ['financial_treasury', 'financial_projects', 'pagarme_financeiro']
      },
    ]
  },
  {
    category: 'Organização',
    items: [
      {
        id: 'administration_workspace',
        label: 'Administração',
        icon: SettingsIcon,
        allowedRoles: ['SUPERADMIN', 'PASTOR', 'ADMIN'],
        matchTabs: ['church_branding', 'campuses', 'feature_flags', 'security_audit', 'configuracoes', 'my_subscription']
      }
    ]
  }
];

const navigationContext: Record<string, { area: string; title: string }> = {
  dashboard: { area: 'Início', title: 'Visão geral' },
  people_workspace: { area: 'Pessoas', title: 'Visão geral' },
  membros: { area: 'Pessoas', title: 'Membros' },
  visitantes: { area: 'Pessoas', title: 'Visitantes & acolhimento' },
  pastoral_radar: { area: 'Pessoas', title: 'Cuidado pastoral' },
  celulas: { area: 'Pessoas', title: 'Células & redes' },
  ministries_workspace: { area: 'Equipes & Ministérios', title: 'Visão geral' },
  ministerios: { area: 'Equipes & Ministérios', title: 'Ministérios & escalas' },
  kids_workspace: { area: 'Equipes & Ministérios', title: 'Ministério Infantil' },
  kids_salas: { area: 'Ministério Infantil', title: 'Salas ao vivo' },
  kids_checkin: { area: 'Ministério Infantil', title: 'Check-in' },
  kids_chamados: { area: 'Ministério Infantil', title: 'Chamados de responsáveis' },
  kids_familias: { area: 'Ministério Infantil', title: 'Famílias & crianças' },
  kids_config_salas: { area: 'Ministério Infantil', title: 'Configuração de salas' },
  kids_relatorios: { area: 'Ministério Infantil', title: 'Relatórios' },
  kids_ministerio: { area: 'Equipes & Ministérios', title: 'Ministério Infantil' },
  secretariat_workspace: { area: 'Secretaria', title: 'Visão geral' },
  secretariat_overview: { area: 'Secretaria', title: 'Painel detalhado' },
  secretariat_records: { area: 'Secretaria', title: 'Pessoas & registros' },
  secretariat_movements: { area: 'Secretaria', title: 'Movimentações & transferências' },
  secretariat_documents: { area: 'Secretaria', title: 'Documentos' },
  secretariat_baptisms: { area: 'Secretaria', title: 'Batismos' },
  secretariat_templates: { area: 'Secretaria', title: 'Modelos' },
  content_workspace: { area: 'Conteúdo & Comunicação', title: 'Visão geral' },
  eventos: { area: 'Conteúdo & Comunicação', title: 'Eventos & jornadas' },
  transmissoes: { area: 'Conteúdo & Comunicação', title: 'Cultos & transmissões' },
  devocionais: { area: 'Conteúdo & Comunicação', title: 'Devocionais' },
  estudos: { area: 'Conteúdo & Comunicação', title: 'Estudos & mídias' },
  bible_config: { area: 'Conteúdo & Comunicação', title: 'Bíblia' },
  oracoes: { area: 'Conteúdo & Comunicação', title: 'Orações' },
  operations_workspace: { area: 'Loja & Operações', title: 'Visão geral' },
  pdv_produtos: { area: 'Loja & Operações', title: 'Produtos & estoque' },
  pdv_pedidos: { area: 'Loja & Operações', title: 'Monitor de pedidos' },
  finance_workspace: { area: 'Finanças', title: 'Visão geral' },
  financial_treasury: { area: 'Finanças', title: 'Tesouraria & DRE' },
  financial_projects: { area: 'Finanças', title: 'Campanhas & projetos' },
  pagarme_financeiro: { area: 'Finanças', title: 'Gateway de pagamento' },
  administration_workspace: { area: 'Administração', title: 'Visão geral' },
  campuses: { area: 'Administração', title: 'Igreja & unidades' },
  church_branding: { area: 'Administração', title: 'Marca & PWA' },
  feature_flags: { area: 'Administração', title: 'Módulos da plataforma' },
  security_audit: { area: 'Administração', title: 'Auditoria & LGPD' },
  my_subscription: { area: 'Administração', title: 'Assinatura Faith-Hub' },
  configuracoes: { area: 'Administração', title: 'Configurações avançadas' }
};

const workspaceKindsByTab: Record<string, StudioWorkspaceKind> = {
  people_workspace: 'people',
  ministries_workspace: 'ministries',
  kids_workspace: 'kids',
  secretariat_workspace: 'secretariat',
  content_workspace: 'content',
  operations_workspace: 'operations',
  finance_workspace: 'finance',
  administration_workspace: 'administration'
};

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  userRole?: string;
  isSuperAdmin: boolean;
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  setIsMobileSidebarOpen,
  userRole,
  isSuperAdmin
}) => {
  const { isFeatureEnabled } = useFeatureFlags();
  const normalizedRole = isSuperAdmin ? 'SUPERADMIN' : String(userRole || 'MEMBER').toUpperCase();

  const filteredGroups = navigationGroups
    .map(group => {
      const visibleItems = group.items
        .filter(item => !item.allowedRoles || item.allowedRoles.includes(normalizedRole))
        .filter(item => {
          if (item.featureFlagKey && !isFeatureEnabled(item.featureFlagKey)) return false;
          if (item.visibleWhenAny && !item.visibleWhenAny.some(flag => isFeatureEnabled(flag))) return false;
          return true;
        });

      return { ...group, items: visibleItems };
    })
    .filter(group => group.items.length > 0);

  return (
    <div className="sidebar-nav">
      <StudioFavoritesNav role={normalizedRole} onCloseMobile={() => setIsMobileSidebarOpen(false)} />
      {filteredGroups.map((group, gIdx) => (
        <div key={gIdx}>
          <div className="nav-category">{group.category}</div>
          {group.items.map(item => {
            const IconComponent = item.icon;
            const isItemActive = activeTab === item.id || Boolean(item.matchTabs?.includes(activeTab));

            return (
              <button
                key={item.id}
                className={`nav-item-btn ${isItemActive ? 'active' : ''}`}
                aria-current={isItemActive ? 'page' : undefined}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileSidebarOpen(false);
                }}
              >
                <div className="nav-item-left">
                  <IconComponent />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

function App() {
  const demoModeEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_AUTH === 'true';
  const isDemo = demoModeEnabled && typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('demo') === 'true' || localStorage.getItem('faithhub_studio_demo') === 'true');
  const initialTab = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('tab') || localStorage.getItem('faithhub_studio_last_tab') || 'dashboard')
    : 'dashboard';
  const initialStudioVersion = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('studio') === 'v2'
    ? 'v2'
    : 'v1';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [studioVersion, setStudioVersion] = useState<'v1' | 'v2'>(initialStudioVersion);
  const [isAuthenticated, setIsAuthenticated] = useState(isDemo);
  const [isLoadingAuth, setIsLoadingAuth] = useState(!isDemo);
  const [user, setUser] = useState<any>(isDemo ? { signInDetails: { loginId: 'pastor@igrejaviva.com.br' } } : null);

  // User Profile & Multi-Tenancy Segregation State
  const [isSuperAdmin, setIsSuperAdmin] = useState(isDemo);
  const [userProfile, setUserProfile] = useState<any>(isDemo ? {
    id: 'usr_pastor',
    name: 'Pastor Rafael Sena',
    email: 'pastor@igrejaviva.com.br',
    role: 'PASTOR',
    organization_id: 'org_demo'
  } : null);
  const [allowedCampusIds, setAllowedCampusIds] = useState<string[]>([]);

  // Mobile / Responsive Sidebar Drawer State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Multi-Organization / SaaS Master State
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(() => {
    if (isDemo) {
      return {
        id: 'org_demo',
        name: 'Igreja Viva - Demonstração',
        slug: 'igrejaviva',
        primary_color: '#0f766e',
        status: 'ACTIVE'
      };
    }
    const saved = localStorage.getItem('faithhub_active_org');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  // Multi-Campus / Multi-Unit State
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all');
  const [isCampusDropdownOpen, setIsCampusDropdownOpen] = useState<boolean>(false);

  // Dynamic Church Branding State
  const [churchSettings, setChurchSettings] = useState<any>({
    church_name: 'Minha Igreja',
    logo_icon_url: '',
    primary_color: '#0f766e'
  });

  // Calendar State
  const [selectedCalDay, setSelectedCalDay] = useState(new Date().getDate());

  const navigateToTab = useCallback((tab: string) => {
    if (!tab || tab === activeTab) return;
    if (studioVersion === 'v2' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.pushState({ studioTab: tab, studioVersion: 'v2' }, '', url);
    }
    setActiveTab(tab);
  }, [activeTab, studioVersion]);

  const exitStudioV2 = useCallback(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('studio');
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({ studioTab: activeTab, studioVersion: 'v1' }, '', url);
    }
    setStudioVersion('v1');
  }, [activeTab]);

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
  const workspaceOverview = useMemo(() => ({
    membersCount: dashboardStats.membersCount,
    cellsCount: dashboardStats.cellsCount,
    ordersTotal: dashboardStats.ordersTotal,
    eventsCount: dashboardStats.eventsCount,
    recentMembersCount: dashboardStats.recentMembers.length,
    hasActiveBroadcast: Boolean(dashboardStats.activeBroadcast)
  }), [
    dashboardStats.activeBroadcast,
    dashboardStats.cellsCount,
    dashboardStats.eventsCount,
    dashboardStats.membersCount,
    dashboardStats.ordersTotal,
    dashboardStats.recentMembers.length
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const isPublicRoute = window.location.pathname.startsWith('/proposta/')
      || window.location.pathname.startsWith('/verificar-documento/')
      || params.has('proposta')
      || params.has('verificar_documento');
    if (isPublicRoute) return;
    localStorage.setItem('faithhub_studio_last_tab', activeTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState({}, '', url);
  }, [activeTab]);

  useEffect(() => {
    if (studioVersion !== 'v2' || typeof window === 'undefined') return;
    const handleHistoryNavigation = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('studio') !== 'v2') {
        setStudioVersion('v1');
        return;
      }
      setActiveTab(params.get('tab') || 'dashboard');
    };
    window.addEventListener('popstate', handleHistoryNavigation);
    return () => window.removeEventListener('popstate', handleHistoryNavigation);
  }, [studioVersion]);

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
          setUserProfile(null);
          setIsSuperAdmin(false);
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Campuses when Organization is selected
  useEffect(() => {
    if (isAuthenticated && selectedOrganization) {
      loadCampuses();
    }
  }, [isAuthenticated, selectedOrganization, allowedCampusIds]);

  const loadCampuses = async () => {
    try {
      const headers = await getAuthHeaders();
      const orgParam = selectedOrganization ? `?organization_id=${selectedOrganization.id}` : '';
      const res = await fetch(`${API_URL}/campuses${orgParam}`, { headers });
      if (res.ok) {
        const json = await res.json();
        let list: Campus[] = json.data || [];

        // Se o usuário não for SuperAdmin e tiver restrição de unidades específicas
        if (!isSuperAdmin && allowedCampusIds.length > 0 && !allowedCampusIds.includes('all')) {
          list = list.filter(c => allowedCampusIds.includes(c.id));
          if (list.length > 0 && (selectedCampusId === 'all' || !allowedCampusIds.includes(selectedCampusId))) {
            setSelectedCampusId(list[0].id);
          }
        }

        setCampuses(list);
      }
    } catch (e) {
      console.error("Erro ao carregar lista de unidades:", e);
    }
  };

  useEffect(() => {
    const handleCampusesUpdated = () => loadCampuses();
    window.addEventListener('campuses-updated', handleCampusesUpdated);
    return () => window.removeEventListener('campuses-updated', handleCampusesUpdated);
  }, [selectedOrganization, allowedCampusIds]);

  useEffect(() => {
    if (isAuthenticated && selectedOrganization) {
      loadDashboardStats();
    }
  }, [isAuthenticated, activeTab, selectedCampusId, selectedOrganization]);

  const loadDashboardStats = async () => {
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId !== 'all' 
        ? `?organization_id=${orgId}&campus_id=${selectedCampusId}` 
        : `?organization_id=${orgId}`;

      const [membersRes, cellsRes, ordersRes, eventsRes, broadcastRes] = await Promise.allSettled([
        fetch(`${API_URL}/members${campusParam}`, { headers }),
        fetch(`${API_URL}/cell-groups${campusParam}`, { headers }),
        fetch(`${API_URL}/pdv/orders${campusParam}`, { headers }),
        fetch(`${API_URL}/events${campusParam}`, { headers }),
        fetch(`${API_URL}/broadcasts/active`, { headers })
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

      if (isDemo && membersCount === 0) {
        setDashboardStats({
          membersCount: 184,
          cellsCount: 14,
          ordersTotal: 4280,
          eventsCount: 3,
          recentMembers: [
            { id: '1', name: 'Lucas Gabriel Silveira', phone: '(11) 98765-4321', created_at: new Date().toISOString() },
            { id: '2', name: 'Mariana Duarte Costa', phone: '(11) 97654-3210', created_at: new Date().toISOString() },
            { id: '3', name: 'Pr. Carlos Eduardo Ramos', phone: '(11) 96543-2109', created_at: new Date().toISOString() }
          ],
          upcomingEvents: [
            { id: 'e1', title: 'Conferência Avivamento & Reino 2026', event_date: '2026-11-15' },
            { id: 'e2', title: 'Encontro de Casais Blindados', event_date: '2026-11-28' }
          ],
          activeBroadcast: null
        });
      } else {
        setDashboardStats({
          membersCount,
          cellsCount,
          ordersTotal,
          eventsCount,
          recentMembers,
          upcomingEvents,
          activeBroadcast
        });
      }
    } catch (err) {
      console.error("Erro ao carregar métricas do dashboard:", err);
    }
  };

  const checkAuth = async () => {
    if (isDemo) {
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      return;
    }
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);

      let userAttrs: any = {};
      try {
        userAttrs = await fetchUserAttributes();
      } catch (e) {}

      const userEmail = currentUser.signInDetails?.loginId || userAttrs.email || '';

      const checkIsMasterUser = (_email: string, role?: string): boolean =>
        ['SUPERADMIN', 'SUPER_ADMIN', 'MASTER_ADMIN', 'MASTER', 'ADMIN_MASTER'].includes((role || '').toUpperCase());

      // Consultar perfil de membro e vínculo com a igreja/organização
      try {
        const authHeaders = await getAuthHeaders();
        delete authHeaders['x-organization-id'];
        const res = await fetch(`${API_URL}/members/me`, { headers: authHeaders });
        if (res.ok) {
          const json = await res.json();
          const profile = json.data;

          const role = (profile?.role || '').toUpperCase();
          const isSuper = checkIsMasterUser(userEmail, role);
          setIsSuperAdmin(isSuper);

          if (profile) {
            setUserProfile(profile);

            if (profile.campus_ids && Array.isArray(profile.campus_ids)) {
              setAllowedCampusIds(profile.campus_ids);
            } else if (profile.campus_id) {
              setAllowedCampusIds([profile.campus_id]);
            }

            // Se NÃO for SuperAdmin, conecta automaticamente ao ambiente exclusivo da igreja dele
            if (!isSuper && profile.organization_id) {
              try {
                const orgRes = await fetch(`${API_URL}/organizations/${profile.organization_id}`, { headers: authHeaders });
                if (orgRes.ok) {
                  const orgData = await orgRes.json();
                  setSelectedOrganization(orgData);
                  localStorage.setItem('faithhub_active_org', JSON.stringify(orgData));
                  if (orgData.primary_color) {
                    document.documentElement.style.setProperty('--accent-primary', orgData.primary_color);
                    document.documentElement.style.setProperty('--accent-primary-gradient', `linear-gradient(135deg, ${orgData.primary_color} 0%, #14b8a6 100%)`);
                  }
                }
              } catch (orgErr) {
                console.error("Erro ao carregar organização do membro:", orgErr);
              }
            }
          } else {
            // Se não encontrou cadastro em members, verifica se é admin master por e-mail
            const isSuperOnly = false;
            setIsSuperAdmin(isSuperOnly);
          }
        }
      } catch (e) {
        console.error("Erro ao verificar perfil do usuário:", e);
      }
    } catch (err) {
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('faithhub_active_org');
      await signOut();
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const handleSelectOrg = (org: Organization) => {
    setSelectedOrganization(org);
    localStorage.setItem('faithhub_active_org', JSON.stringify(org));
    setChurchSettings((prev: any) => ({
      ...prev,
      church_name: org.name,
      primary_color: org.primary_color || '#0f766e'
    }));
    if (org.primary_color) {
      document.documentElement.style.setProperty('--accent-primary', org.primary_color);
      document.documentElement.style.setProperty('--accent-primary-gradient', `linear-gradient(135deg, ${org.primary_color} 0%, #14b8a6 100%)`);
    }
    setSelectedCampusId('all');
    navigateToTab('dashboard');
  };

  const handleReturnToMasterHub = () => {
    if (!isSuperAdmin) return;
    setSelectedOrganization(null);
    localStorage.removeItem('faithhub_active_org');
    document.documentElement.style.setProperty('--accent-primary', '#0f766e');
    document.documentElement.style.setProperty('--accent-primary-gradient', 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)');
    document.documentElement.style.setProperty('--accent-primary-light', '#f0fdfa');
  };

  // Se for acesso direto a uma Proposta Comercial (link público do cliente/pastor)
  const urlParams = new URLSearchParams(window.location.search);
  const documentVerificationToken = urlParams.get('verificar_documento') || (window.location.pathname.startsWith('/verificar-documento/') ? window.location.pathname.split('/verificar-documento/')[1] : null);
  if (documentVerificationToken) {
    return <PublicDocumentVerification token={decodeURIComponent(documentVerificationToken)} />;
  }
  const proposalToken = urlParams.get('proposta') || (window.location.pathname.startsWith('/proposta/') ? window.location.pathname.split('/proposta/')[1] : null);

  if (proposalToken) {
    return (
      <FeatureFlagProvider organizationId="org_default">
        <ProposalPublicView token={proposalToken} />
      </FeatureFlagProvider>
    );
  }

  // Se for acesso direto ao Cartão de Acolhimento / Boas-Vindas Público do Culto (/welcome ou ?welcome=...)
  const isWelcomePage = window.location.pathname === '/welcome' || 
                        window.location.pathname.startsWith('/welcome/') || 
                        urlParams.has('welcome');
  const welcomeOrg = urlParams.get('org') || urlParams.get('welcome') || (window.location.pathname.startsWith('/welcome/') ? window.location.pathname.split('/welcome/')[1] : 'org_default');

  if (isWelcomePage) {
    return <PublicWelcomeView orgIdentifier={welcomeOrg} />;
  }

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

  const userName = userProfile?.name || user?.signInDetails?.loginId?.split('@')[0] || 'Pastor & Equipe';
  const formattedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

  // SE NÃO SELECIONOU UMA ORGANIZAÇÃO/REDE E FOR SUPERADMIN, EXIBE A TELA DO HUB MASTER!
  if (!selectedOrganization) {
    return (
      <OrganizationSelector
        onSelectOrg={handleSelectOrg}
        onSignOut={handleSignOut}
        userName={formattedUserName}
        userEmail={user?.signInDetails?.loginId || userProfile?.email || ''}
      />
    );
  }

  // SE A ORGANIZAÇÃO ESTIVER INATIVA E O USUÁRIO NÃO FOR MASTER SUPERADMIN, BLOQUEIA O ACESSO AO STUDIO!
  if ((selectedOrganization.status || '').toUpperCase() === 'INACTIVE' && !isSuperAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        padding: '24px',
        fontFamily: 'inherit'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '44px 32px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: '#fee2e2',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 20px auto'
          }}>
            🚫
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
            Ambiente Suspenso
          </h2>
          <span style={{ display: 'inline-block', background: '#fee2e2', color: '#b91c1c', padding: '3px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 800, marginBottom: '16px' }}>
            Acesso Temporariamente Desativado
          </span>
          <p style={{ color: '#64748b', fontSize: '0.90rem', lineHeight: 1.5, margin: '0 0 24px 0' }}>
            O portal da comunidade <strong>{selectedOrganization.name}</strong> foi temporariamente desativado pela administração. Para regularizar ou reativar este ambiente, entre em contato com a equipe Faith-Hub.
          </p>
          <button
            onClick={handleSignOut}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  const selectedCampusName = selectedCampusId === 'all' 
    ? 'Todas as Unidades' 
    : campuses.find(c => c.id === selectedCampusId)?.name || 'Unidade Selecionada';
  const currentNavigation = navigationContext[activeTab] || { area: 'Studio', title: 'Área de trabalho' };
  const canAccessAdministration = isSuperAdmin || ['PASTOR', 'ADMIN'].includes(String(userProfile?.role || '').toUpperCase());

  return (
    <FeatureFlagProvider organizationId={selectedOrganization?.id || 'org_default'} campusId={selectedCampusId}>
      <StudioExperienceProvider
        organizationId={selectedOrganization.id}
        campusId={selectedCampusId}
        userId={userProfile?.id || userProfile?.email || user?.username || 'studio-user'}
        userRole={isSuperAdmin ? 'SUPERADMIN' : (userProfile?.role || 'MEMBER')}
        activeTab={activeTab}
        onNavigate={navigateToTab}
        isDemo={isDemo}
        campusesCount={campuses.length}
        membersCount={dashboardStats.membersCount}
        brandingConfigured={Boolean(churchSettings.logo_icon_url || (churchSettings.church_name && churchSettings.church_name !== 'Minha Igreja'))}
      >
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* ========================================================
          MASTER ADMIN IMPERSONATION BANNER (TOP BAR)
          ======================================================== */}
      {isSuperAdmin && (
        <div style={{
          background: '#0f172a',
          color: '#f8fafc',
          padding: '8px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.80rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 800,
              fontSize: '0.68rem',
              border: '1px solid rgba(52, 211, 153, 0.3)'
            }}>
              MODO MASTER
            </span>
            {(selectedOrganization.status || '').toUpperCase() === 'INACTIVE' && (
              <span style={{
                background: '#dc2626',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 900,
                fontSize: '0.68rem'
              }}>
                🚫 AMBIENTE INATIVO
              </span>
            )}
            <span>
              Gerenciando a Rede: <strong style={{ color: '#ffffff' }}>{selectedOrganization.name}</strong> ({selectedOrganization.plan || 'PRO'})
            </span>
          </div>

          <button
            onClick={handleReturnToMasterHub}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <GridIcon /> Trocar de Rede (Hub Master)
          </button>
        </div>
      )}

      {/* Main Admin Area */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 37px)', position: 'relative' }}>
        
        {/* Mobile Sidebar Backdrop */}
        <div 
          className={`sidebar-backdrop ${isMobileSidebarOpen ? 'active' : ''}`}
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        {/* ========================================================
            LEFT SIDEBAR (Responsive Desktop + Mobile Drawer)
            ======================================================== */}
        <aside className={`sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
          {/* Brand Header */}
          <div className="sidebar-header" onClick={() => { navigateToTab('church_branding'); setIsMobileSidebarOpen(false); }} style={{ cursor: 'pointer' }} title="Clique para personalizar a identidade da igreja">
            {churchSettings.logo_icon_url ? (
              <img 
                src={churchSettings.logo_icon_url} 
                alt="Logo da Igreja" 
                style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }}
              />
            ) : selectedOrganization.logo_url ? (
              <img 
                src={selectedOrganization.logo_url} 
                alt="Logo da Igreja" 
                style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }}
              />
            ) : (
              <img 
                src="/brand/logo-symbol.png" 
                alt="Faith-Hub" 
                style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'contain' }}
              />
            )}
            <div className="sidebar-brand">
              <span className="sidebar-brand-title">{selectedOrganization.name}</span>
              <span className="sidebar-brand-badge">ADMIN</span>
            </div>
          </div>

          {/* Multi-Campus Switcher Pill */}
          <div style={{ padding: '0 16px 12px 16px', position: 'relative' }}>
            <button
              onClick={() => setIsCampusDropdownOpen(!isCampusDropdownOpen)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
                border: '1px solid var(--panel-border)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ color: 'var(--accent-primary)', display: 'flex' }}><BuildingIcon /></span>
                <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {selectedCampusName}
                </span>
              </div>
              <ChevronDownIcon />
            </button>

            {/* Dropdown Menu */}
            {isCampusDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% - 6px)',
                left: '16px',
                right: '16px',
                background: '#ffffff',
                border: '1px solid var(--panel-border)',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
                zIndex: 60,
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}>
                <button
                  onClick={() => { setSelectedCampusId('all'); setIsCampusDropdownOpen(false); }}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '0.80rem',
                    fontWeight: selectedCampusId === 'all' ? 800 : 500,
                    background: selectedCampusId === 'all' ? 'var(--accent-primary-light)' : 'transparent',
                    color: selectedCampusId === 'all' ? 'var(--accent-primary)' : 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                >
                  🌐 Todas as Unidades (Geral)
                </button>

                {campuses.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCampusId(c.id); setIsCampusDropdownOpen(false); }}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '0.80rem',
                      fontWeight: selectedCampusId === c.id ? 800 : 500,
                      background: selectedCampusId === c.id ? 'var(--accent-primary-light)' : 'transparent',
                      color: selectedCampusId === c.id ? 'var(--accent-primary)' : 'var(--text-main)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <span>📍 {c.name}</span>
                    {Boolean(c.is_headquarters) && (
                      <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                        SEDE
                      </span>
                    )}
                  </button>
                ))}

                <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />

                <button
                  onClick={() => { navigateToTab('campuses'); setIsCampusDropdownOpen(false); setIsMobileSidebarOpen(false); }}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Gerenciar Unidades & Filiais
                </button>
              </div>
            )}
          </div>

          {/* Navigation Categories */}
          <SidebarNav
            activeTab={activeTab}
            setActiveTab={navigateToTab}
            setIsMobileSidebarOpen={setIsMobileSidebarOpen}
            userRole={userProfile?.role}
            isSuperAdmin={isSuperAdmin}
          />

          {/* Sidebar Footer User Area */}
          <div className="sidebar-footer">
            <div className="user-mini-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="user-avatar-circle">
                  {formattedUserName.charAt(0)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{formattedUserName}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isSuperAdmin ? 'Administrador Master' : (userProfile?.role || 'Liderança')}
                  </span>
                </div>
              </div>
              {isSuperAdmin && (
                <button onClick={handleReturnToMasterHub} title="Trocar de Igreja / Rede (Hub Master)" style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
                  <GridIcon />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ========================================================
            MAIN CONTENT AREA
            ======================================================== */}
        <main className="main-content">
          {/* Top Header Bar */}
          <header className="topbar">
            <div className="topbar-left">
              <button 
                type="button" 
                className="hamburger-btn" 
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                title="Abrir Menu de Navegação"
                aria-label="Abrir Menu"
              >
                ☰
              </button>
              <div className="studio-breadcrumb" aria-label="Localização atual">
                <span>{selectedOrganization.name}</span>
                <span className="studio-breadcrumb-separator">/</span>
                <button type="button" onClick={() => {
                  const workspaceByArea: Record<string, string> = {
                    'Pessoas': 'people_workspace',
                    'Equipes & Ministérios': 'ministries_workspace',
                    'Ministério Infantil': 'kids_workspace',
                    'Secretaria': 'secretariat_workspace',
                    'Conteúdo & Comunicação': 'content_workspace',
                    'Loja & Operações': 'operations_workspace',
                    'Finanças': 'finance_workspace',
                    'Administração': 'administration_workspace'
                  };
                  navigateToTab(workspaceByArea[currentNavigation.area] || 'dashboard');
                }}>{currentNavigation.area}</button>
                <span className="studio-breadcrumb-separator">/</span>
                <strong>{currentNavigation.title}</strong>
              </div>
            </div>

            <div className="topbar-center">
              <StudioSearchTrigger />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <StudioHelpButton />
              <button style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f8fafc', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }} title="Notificações">
                <BellIcon />
              </button>
              {canAccessAdministration && (
                <button style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f8fafc', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }} title="Administração" onClick={() => { navigateToTab('administration_workspace'); setIsMobileSidebarOpen(false); }}>
                  <SettingsIcon />
                </button>
              )}
              <div className="user-avatar-circle" style={{ cursor: 'pointer' }}>
                {formattedUserName.charAt(0)}
              </div>
            </div>
          </header>

          {/* Page Container */}
          <div className="page-container">
            {studioVersion === 'v2' && (
              <Suspense fallback={null}>
                <StudioContextNavigationV2
                  activeTab={activeTab}
                  role={isSuperAdmin ? 'SUPERADMIN' : String(userProfile?.role || 'MEMBER').toUpperCase()}
                  isDemo={isDemo}
                  onNavigate={navigateToTab}
                  onExitV2={exitStudioV2}
                />
              </Suspense>
            )}
            {activeTab === 'dashboard' && (
              <div className="animate-fade-in dashboard-grid-layout">
                {/* ==========================================
                    DASHBOARD MAIN COLUMN (Left 2/3)
                    ========================================== */}
                <div className="dashboard-main-column">
                  <StudioOnboardingCard />
                  {/* 1. TOP 4 KPI CARDS (Live RDS Data) */}
                  <div className="kpi-grid">
                    {/* KPI 1: Membros */}
                    <div className="kpi-card" onClick={() => navigateToTab('membros')}>
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
                    <div className="kpi-card" onClick={() => navigateToTab('celulas')}>
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
                    <div className="kpi-card" onClick={() => navigateToTab('pdv_pedidos')}>
                      <div className="kpi-top-row">
                        <span className="kpi-title-tag">Vendas na Loja / PDV</span>
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
                        <span className="kpi-subtext">Pedidos via App & Loja Física</span>
                        <span className="kpi-arrow-btn"><ArrowRightIcon /></span>
                      </div>
                    </div>

                    {/* KPI 4: Eventos */}
                    <div className="kpi-card" onClick={() => navigateToTab('eventos')}>
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
                        onClick={() => navigateToTab('campuses')}
                        style={{ cursor: 'pointer', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '14px', margin: 0 }}
                      >
                        <div className="project-icon-box" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                          <BuildingIcon />
                        </div>
                        <div className="project-details">
                          <span className="project-title" style={{ fontSize: '0.88rem' }}>Unidades & Filiais</span>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Cadastre congregações e pastores locais</div>
                        </div>
                      </div>

                      <div 
                        className="project-card-item" 
                        onClick={() => navigateToTab('church_branding')}
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
                        onClick={() => navigateToTab('pagarme_financeiro')}
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
                        onClick={() => navigateToTab('pdv_produtos')}
                        style={{ cursor: 'pointer', border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '14px', margin: 0 }}
                      >
                        <div className="project-icon-box" style={{ background: '#fdf2f8', color: '#db2777' }}>
                          <CartIcon />
                        </div>
                        <div className="project-details">
                          <span className="project-title" style={{ fontSize: '0.88rem' }}>Catálogo da Loja</span>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Cadastre livros, vestuário e produtos</div>
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
                      <button className="link-btn" onClick={() => navigateToTab('membros')}>
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
                                Nenhum membro cadastrado ainda nesta rede/unidade.
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
                      <button className="link-btn" onClick={() => navigateToTab('eventos')}>
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
                        <div className="card-title">Status da Rede</div>
                        <div className="card-subtitle">{selectedOrganization.name}</div>
                      </div>
                      <span className="notice-badge">Online</span>
                    </div>

                    <div className="activity-item">
                      <div className="activity-icon-dot" style={{ background: '#10b981' }}>
                        <SparklesIcon />
                      </div>
                      <div>
                        <div className="activity-text">
                          Rede ativa no plano <strong>{selectedOrganization.plan || 'PRO'}</strong> com <strong>{campuses.length}</strong> unidade(s).
                        </div>
                        <div className="activity-time">Pronto para uso</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ==========================================
                ACTIVE MODULE RENDERERS (Multi-Campus Enabled)
                ========================================== */}
            {workspaceKindsByTab[activeTab] && (
              <StudioWorkspace
                kind={workspaceKindsByTab[activeTab]}
                organizationId={selectedOrganization.id}
                organizationName={selectedOrganization.name}
                campusId={selectedCampusId}
                campusesCount={campuses.length}
                userRole={isSuperAdmin ? 'SUPERADMIN' : userProfile?.role}
                overview={workspaceOverview}
                onNavigate={navigateToTab}
              />
            )}
            <ErrorBoundary fallbackTitle="Erro ao carregar o módulo">
              {activeTab === 'campuses' && <Campuses selectedOrganization={selectedOrganization} />}
              {activeTab === 'membros' && <Members selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {activeTab.startsWith('secretariat_') && (
                <FeatureGate flag="secretariat.module_enabled">
                  <Secretariat
                    selectedCampusId={selectedCampusId}
                    selectedOrganization={selectedOrganization}
                    activeSubtab={activeTab}
                    onNavigateSubtab={navigateToTab}
                  />
                </FeatureGate>
              )}
              {(activeTab.startsWith('kids_') || activeTab === 'kids_ministerio') && (
                <KidsMinistry 
                  selectedCampusId={selectedCampusId} 
                  selectedOrganization={selectedOrganization}
                  activeSubtab={activeTab}
                  onNavigateSubtab={navigateToTab}
                />
              )}
              {activeTab === 'transmissoes' && (
                <Broadcasts 
                  selectedCampusId={selectedCampusId} 
                  selectedOrganization={selectedOrganization} 
                />
              )}
              {activeTab === 'celulas' && <CellGroups selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {activeTab === 'ministerios' && (
                <MinistriesManagement 
                  selectedCampusId={selectedCampusId} 
                  selectedOrganization={selectedOrganization} 
                  currentUserProfile={userProfile}
                  currentUserRole={userProfile?.role || 'MEMBER'}
                  isSuperAdmin={isSuperAdmin}
                />
              )}
              {activeTab === 'pastoral_radar' && (
                <PastoralCareRadar 
                  selectedCampusId={selectedCampusId} 
                  selectedOrganizationId={selectedOrganization?.id} 
                />
              )}
              {activeTab === 'visitantes' && (
                <VisitorsFunnel 
                  selectedCampusId={selectedCampusId} 
                  selectedOrganization={selectedOrganization} 
                />
              )}
              {activeTab === 'estudos' && <Studies selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {activeTab === 'eventos' && <Events selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {activeTab === 'devocionais' && (
                <Devotionals 
                  selectedCampusId={selectedCampusId} 
                  selectedOrganization={selectedOrganization} 
                />
              )}
              {activeTab === 'oracoes' && <PastoralPrayers selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {activeTab === 'bible_config' && (
                <BibleConfig
                  organizationId={selectedOrganization?.id}
                  churchSlug={selectedOrganization?.slug}
                />
              )}
              {(activeTab === 'financial_treasury' || activeTab === 'financial_projects') && (
                <FinancialTreasury
                  selectedCampusId={selectedCampusId}
                  selectedOrganization={selectedOrganization}
                  initialSubTab={activeTab === 'financial_projects' ? 'projects' : 'dre'}
                />
              )}
              {activeTab === 'my_subscription' && (
                <MySubscription
                  selectedOrganization={selectedOrganization}
                />
              )}
              {activeTab === 'pdv_produtos' && <PdvProdutos selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {activeTab === 'pdv_pedidos' && <PdvPedidos selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {activeTab === 'pagarme_financeiro' && <PagarmeSettings key={selectedOrganization?.id} />}
              {activeTab === 'church_branding' && <ChurchBranding selectedOrganization={selectedOrganization} />}
              {activeTab === 'feature_flags' && (
                <FeatureFlagsManagement
                  selectedOrganization={selectedOrganization}
                  selectedCampusId={selectedCampusId}
                  campuses={campuses}
                />
              )}
              {activeTab === 'security_audit' && <SecurityAuditLogs selectedOrganization={selectedOrganization} />}
            </ErrorBoundary>

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
                <button className="btn-primary" onClick={() => navigateToTab('dashboard')}>
                  Retornar ao Dashboard Central
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
      <StudioCommandPalette
        organizationId={selectedOrganization.id}
        campusId={selectedCampusId}
        role={isSuperAdmin ? 'SUPERADMIN' : String(userProfile?.role || 'MEMBER').toUpperCase()}
      />
      <StudioOnboardingModal />
      </StudioExperienceProvider>
    </FeatureFlagProvider>
  );
}

export default App;
