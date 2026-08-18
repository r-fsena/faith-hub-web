import { useState, useEffect } from 'react';
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
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

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
        id: 'kids_group', 
        label: 'Ministério Infantil (Kids)', 
        icon: BabyIcon,
        hasSubmenu: true,
        subItems: [
          { id: 'kids_salas', label: 'Painel ao Vivo das Salas' },
          { id: 'kids_checkin', label: 'Totem de Check-in Expresso' },
          { id: 'kids_chamados', label: 'Central de Chamados' },
          { id: 'kids_familias', label: 'Base de Famílias & Membros' },
          { id: 'kids_config_salas', label: 'Configuração de Salas' },
          { id: 'kids_relatorios', label: 'Relatórios & Exportação' },
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
      { id: 'campuses', label: 'Unidades & Filiais', icon: BuildingIcon },
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
    kids_group: true,
    ensino_group: true,
    pdv_group: true,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);

  // User Profile & Multi-Tenancy Segregation State
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [allowedCampusIds, setAllowedCampusIds] = useState<string[]>([]);

  // Mobile / Responsive Sidebar Drawer State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Multi-Organization / SaaS Master State
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(() => {
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
      const orgParam = selectedOrganization ? `?organization_id=${selectedOrganization.id}` : '';
      const res = await fetch(`${API_URL}/campuses${orgParam}`);
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
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId !== 'all' 
        ? `?organization_id=${orgId}&campus_id=${selectedCampusId}` 
        : `?organization_id=${orgId}`;

      const [membersRes, cellsRes, ordersRes, eventsRes, broadcastRes] = await Promise.allSettled([
        fetch(`${API_URL}/members${campusParam}`),
        fetch(`${API_URL}/cell-groups${campusParam}`),
        fetch(`${API_URL}/pdv/orders${campusParam}`),
        fetch(`${API_URL}/events${campusParam}`),
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

      let userAttrs: any = {};
      try {
        userAttrs = await fetchUserAttributes();
      } catch (e) {}

      const userEmail = currentUser.signInDetails?.loginId || userAttrs.email || '';

      // Consultar perfil de membro e vínculo com a igreja/organização
      try {
        const res = await fetch(`${API_URL}/members?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const json = await res.json();
          const membersList = json.data || [];
          const profile = membersList[0];

          if (profile) {
            setUserProfile(profile);
            const role = (profile.role || userAttrs['custom:role'] || '').toUpperCase();
            const isSuper = role === 'SUPERADMIN' || userEmail.toLowerCase().includes('admin@faithhub') || userEmail.toLowerCase().includes('rafaelsena');
            setIsSuperAdmin(isSuper);

            if (profile.campus_ids && Array.isArray(profile.campus_ids)) {
              setAllowedCampusIds(profile.campus_ids);
            } else if (profile.campus_id) {
              setAllowedCampusIds([profile.campus_id]);
            }

            // Se NÃO for SuperAdmin, conecta automaticamente ao ambiente exclusivo da igreja dele
            if (!isSuper && profile.organization_id) {
              try {
                const orgRes = await fetch(`${API_URL}/organizations/${profile.organization_id}`);
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
            // Se não encontrou cadastro, verifica e-mail de admin master
            const isSuper = userEmail.toLowerCase().includes('admin') || userEmail.toLowerCase().includes('rafaelsena');
            setIsSuperAdmin(isSuper);
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
    setActiveTab('dashboard');
  };

  const handleReturnToMasterHub = () => {
    if (!isSuperAdmin) return;
    setSelectedOrganization(null);
    localStorage.removeItem('faithhub_active_org');
    document.documentElement.style.setProperty('--accent-primary', '#0f766e');
    document.documentElement.style.setProperty('--accent-primary-gradient', 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)');
    document.documentElement.style.setProperty('--accent-primary-light', '#f0fdfa');
  };

  const toggleSubmenu = (groupId: string) => {
    setOpenSubmenus(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Se for acesso direto a uma Proposta Comercial (link público do cliente/pastor)
  const urlParams = new URLSearchParams(window.location.search);
  const proposalToken = urlParams.get('proposta') || (window.location.pathname.startsWith('/proposta/') ? window.location.pathname.split('/proposta/')[1] : null);

  if (proposalToken) {
    return <ProposalPublicView token={proposalToken} />;
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

  return (
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
          <div className="sidebar-header" onClick={() => { setActiveTab('church_branding'); setIsMobileSidebarOpen(false); }} style={{ cursor: 'pointer' }} title="Clique para personalizar a identidade da igreja">
            {churchSettings.logo_icon_url ? (
              <img 
                src={churchSettings.logo_icon_url} 
                alt="Logo da Igreja" 
                style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover' }}
              />
            ) : (
              <div className="sidebar-logo" style={{ background: selectedOrganization.primary_color || 'var(--accent-primary-gradient)' }}>
                {selectedOrganization.name.charAt(0).toUpperCase()}
              </div>
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
                  onClick={() => { setActiveTab('campuses'); setIsCampusDropdownOpen(false); setIsMobileSidebarOpen(false); }}
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
          <div className="sidebar-nav">
            {navigationGroups.map((group, gIdx) => (
              <div key={gIdx}>
                <div className="nav-category">{group.category}</div>
                
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  const isGroupOpen = openSubmenus[item.id];
                  const isItemActive = activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab));

                  if (item.hasSubmenu && item.subItems) {
                    return (
                      <div key={item.id}>
                        <button
                          className={`nav-item-btn ${isItemActive ? 'active' : ''}`}
                          onClick={() => toggleSubmenu(item.id)}
                        >
                          <div className="nav-item-left">
                            <IconComponent />
                            <span>{item.label}</span>
                          </div>
                          {isGroupOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        </button>

                        {isGroupOpen && (
                          <div className="submenu-tree">
                            {item.subItems.map((sub) => (
                              <button
                                key={sub.id}
                                className={`submenu-item-btn ${activeTab === sub.id ? 'active' : ''}`}
                                onClick={() => { setActiveTab(sub.id); setIsMobileSidebarOpen(false); }}
                              >
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
                      className={`nav-item-btn ${activeTab === item.id ? 'active' : ''}`}
                      onClick={() => { setActiveTab(item.id); setIsMobileSidebarOpen(false); }}
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
              <div>
                <div className="greeting-text" style={{ fontSize: '0.90rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedOrganization.name}</span>
                  <span style={{ margin: '0 6px', opacity: 0.5 }}>/</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    {activeTab === 'dashboard' && 'Dashboard Central'}
                    {activeTab === 'membros' && 'Membros & Liderança'}
                    {activeTab === 'kids_salas' && 'Kids • Mural de Salas'}
                    {activeTab === 'kids_checkin' && 'Kids • Totem de Check-in'}
                    {activeTab === 'kids_chamados' && 'Kids • Chamados de Pais'}
                    {activeTab === 'kids_familias' && 'Kids • Famílias & Membros'}
                    {activeTab === 'kids_config_salas' && 'Kids • Configuração de Salas'}
                    {activeTab === 'kids_relatorios' && 'Kids • Relatórios & Exportação'}
                    {activeTab === 'kids_ministerio' && 'Ministério Infantil'}
                    {activeTab === 'celulas' && 'Células & Grupos'}
                    {activeTab === 'devocionais' && 'Devocionais'}
                    {activeTab === 'estudos' && 'Biblioteca de Estudos'}
                    {activeTab === 'eventos' && 'Eventos & Cursos'}
                    {activeTab === 'pdv_produtos' && 'PDV • Catálogo de Produtos'}
                    {activeTab === 'pdv_pedidos' && 'PDV • Monitor de Pedidos'}
                    {activeTab === 'transmissoes' && 'Cultos & Transmissões'}
                    {activeTab === 'campuses' && 'Unidades & Filiais'}
                    {activeTab === 'church_branding' && 'Identidade Visual & PWA'}
                    {activeTab === 'pagarme_financeiro' && 'Gateway Pagar.me'}
                    {activeTab === 'configuracoes' && 'Configurações'}
                  </span>
                </div>
              </div>
            </div>

            <div className="topbar-center">
              <div className="search-pill">
                <SearchIcon />
                <input type="text" placeholder="Buscar no sistema..." />
                <span style={{ fontSize: '0.70rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>⌘K</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f8fafc', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }} title="Notificações">
                <BellIcon />
              </button>
              <button style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#f8fafc', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }} title="Configurações" onClick={() => { setActiveTab('configuracoes'); setIsMobileSidebarOpen(false); }}>
                <SettingsIcon />
              </button>
              <div className="user-avatar-circle" style={{ cursor: 'pointer' }}>
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
                        onClick={() => setActiveTab('campuses')}
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
            <ErrorBoundary fallbackTitle="Erro ao carregar o módulo">
              {activeTab === 'campuses' && <Campuses />}
              {activeTab === 'membros' && <Members selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {(activeTab.startsWith('kids_') || activeTab === 'kids_ministerio') && (
                <KidsMinistry 
                  selectedCampusId={selectedCampusId} 
                  selectedOrganization={selectedOrganization}
                  activeSubtab={activeTab}
                  onNavigateSubtab={(subtab) => setActiveTab(subtab)}
                />
              )}
              {activeTab === 'transmissoes' && <Broadcasts />}
              {activeTab === 'celulas' && <CellGroups selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {activeTab === 'estudos' && <Studies />}
              {activeTab === 'eventos' && <Events selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {activeTab === 'devocionais' && <Devotionals />}
              {activeTab === 'pdv_produtos' && <PdvProdutos selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {activeTab === 'pdv_pedidos' && <PdvPedidos selectedCampusId={selectedCampusId} selectedOrganization={selectedOrganization} />}
              {activeTab === 'pagarme_financeiro' && <PagarmeSettings />}
              {activeTab === 'church_branding' && <ChurchBranding selectedOrganization={selectedOrganization} />}
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
                <button className="btn-primary" onClick={() => setActiveTab('dashboard')}>
                  Retornar ao Dashboard Central
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
