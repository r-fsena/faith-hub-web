import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFeatureFlags } from './FeatureFlagContext';
import {
  loadStudioPreferences,
  saveStudioPreferences,
  type StudioPreferences,
  type StudioRecentTab
} from '../services/studioExperience';

const EMPTY_PREFERENCES: StudioPreferences = {
  onboarding_steps: [],
  onboarding_dismissed: false,
  favorite_tabs: [],
  recent_tabs: []
};

const WORKSPACE_TABS = new Set([
  'dashboard', 'people_workspace', 'ministries_workspace', 'kids_workspace', 'secretariat_workspace',
  'content_workspace', 'operations_workspace', 'finance_workspace', 'administration_workspace'
]);

export interface StudioOnboardingStep {
  id: string;
  title: string;
  description: string;
  tab: string;
  actionLabel: string;
}

export const STUDIO_ONBOARDING_STEPS: StudioOnboardingStep[] = [
  { id: 'organization', title: 'Confirmar a organização', description: 'Revise o contexto da igreja que está sendo administrada.', tab: 'administration_workspace', actionLabel: 'Revisar organização' },
  { id: 'campus', title: 'Configurar unidades', description: 'Cadastre sede, filiais ou congregações e defina o acesso.', tab: 'campuses', actionLabel: 'Configurar unidades' },
  { id: 'branding', title: 'Personalizar marca e PWA', description: 'Defina nome, logotipo, cores e identidade da igreja.', tab: 'church_branding', actionLabel: 'Personalizar marca' },
  { id: 'members', title: 'Cadastrar ou importar membros', description: 'Crie a base de pessoas que alimenta os demais módulos.', tab: 'membros', actionLabel: 'Gerenciar membros' },
  { id: 'team', title: 'Convidar a equipe administrativa', description: 'Inclua os responsáveis e revise suas permissões.', tab: 'membros', actionLabel: 'Convidar equipe' },
  { id: 'modules', title: 'Revisar módulos disponíveis', description: 'Confira os recursos ativos para sua organização.', tab: 'feature_flags', actionLabel: 'Revisar módulos' },
  { id: 'first_module', title: 'Executar a primeira rotina', description: 'Abra uma área de trabalho e conclua uma atividade real.', tab: 'dashboard', actionLabel: 'Explorar o Studio' }
];

interface StudioExperienceContextType {
  preferences: StudioPreferences;
  loading: boolean;
  onboardingEnabled: boolean;
  searchEnabled: boolean;
  personalizationEnabled: boolean;
  onboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  navigate: (tab: string) => void;
  toggleFavorite: (tab: string) => void;
  isFavorite: (tab: string) => boolean;
  setStepCompleted: (stepId: string, completed?: boolean) => void;
  dismissOnboarding: () => void;
  restartOnboarding: () => void;
  completion: number;
  onboardingSteps: StudioOnboardingStep[];
}

const StudioExperienceContext = createContext<StudioExperienceContextType | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
  organizationId: string;
  campusId: string;
  userId: string;
  activeTab: string;
  onNavigate: (tab: string) => void;
  isDemo?: boolean;
  campusesCount: number;
  membersCount: number;
  brandingConfigured: boolean;
  userRole: string;
}

export function StudioExperienceProvider({
  children, organizationId, campusId, userId, activeTab, onNavigate, isDemo = false,
  campusesCount, membersCount, brandingConfigured, userRole
}: ProviderProps) {
  const { isFeatureEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const onboardingEnabled = isDemo || isFeatureEnabled('studio.guided_onboarding');
  const searchEnabled = isDemo || isFeatureEnabled('studio.global_search');
  const personalizationEnabled = isDemo || isFeatureEnabled('studio.personalized_navigation');
  const [preferences, setPreferences] = useState<StudioPreferences>(EMPTY_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const loadedRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const localKey = `faithhub_studio_preferences:${organizationId}:${userId || 'anonymous'}`;
  const normalizedRole = String(userRole || 'MEMBER').toUpperCase();
  const canConfigureOrganization = ['SUPERADMIN', 'PASTOR', 'ADMIN'].includes(normalizedRole);
  const onboardingSteps = useMemo(() => canConfigureOrganization
    ? STUDIO_ONBOARDING_STEPS
    : STUDIO_ONBOARDING_STEPS.filter(step => ['organization', 'first_module'].includes(step.id)),
  [canConfigureOrganization]);

  const storeLocal = useCallback((next: StudioPreferences) => {
    try { localStorage.setItem(localKey, JSON.stringify(next)); } catch { /* armazenamento opcional */ }
  }, [localKey]);

  const queueRemoteSave = useCallback((next: StudioPreferences) => {
    if (isDemo) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveStudioPreferences(organizationId, campusId, next).catch(error => {
        console.warn('Preferências do Studio foram mantidas localmente:', error);
      });
    }, 350);
  }, [campusId, isDemo, organizationId]);

  const commit = useCallback((update: (current: StudioPreferences) => StudioPreferences) => {
    setPreferences(current => {
      const next = update(current);
      storeLocal(next);
      queueRemoteSave(next);
      return next;
    });
  }, [queueRemoteSave, storeLocal]);

  useEffect(() => {
    if (flagsLoading) return;
    let active = true;
    loadedRef.current = false;
    setLoading(true);
    let local = EMPTY_PREFERENCES;
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) local = { ...EMPTY_PREFERENCES, ...JSON.parse(raw) };
    } catch { /* preferências locais inválidas são ignoradas */ }
    setPreferences(local);

    const finish = (next: StudioPreferences) => {
      if (!active) return;
      const normalized = { ...EMPTY_PREFERENCES, ...next };
      setPreferences(normalized);
      storeLocal(normalized);
      setLoading(false);
      loadedRef.current = true;
      if (onboardingEnabled && !normalized.onboarding_dismissed && normalized.onboarding_steps.length === 0) {
        setOnboardingOpen(true);
      }
    };

    if (isDemo || (!onboardingEnabled && !personalizationEnabled)) {
      finish(local);
    } else {
      loadStudioPreferences(organizationId, campusId).then(finish).catch(() => finish(local));
    }
    return () => { active = false; };
  }, [campusId, flagsLoading, isDemo, localKey, onboardingEnabled, organizationId, personalizationEnabled, storeLocal]);

  useEffect(() => () => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
  }, []);

  useEffect(() => {
    if (loading || !loadedRef.current || !personalizationEnabled || !activeTab) return;
    commit(current => {
      const recent: StudioRecentTab[] = [
        { tab: activeTab, at: new Date().toISOString() },
        ...current.recent_tabs.filter(item => item.tab !== activeTab)
      ].slice(0, 8);
      return { ...current, recent_tabs: recent };
    });
  }, [activeTab, commit, loading, personalizationEnabled]);

  useEffect(() => {
    if (loading || !loadedRef.current || !onboardingEnabled) return;
    const automatic = new Set<string>();
    if (organizationId) automatic.add('organization');
    if (canConfigureOrganization && campusesCount > 0) automatic.add('campus');
    if (canConfigureOrganization && brandingConfigured) automatic.add('branding');
    if (canConfigureOrganization && membersCount > 0) automatic.add('members');
    if (activeTab && !WORKSPACE_TABS.has(activeTab)) automatic.add('first_module');
    if (!automatic.size) return;
    commit(current => {
      const merged = [...new Set([...current.onboarding_steps, ...automatic])];
      return merged.length === current.onboarding_steps.length ? current : { ...current, onboarding_steps: merged };
    });
  }, [activeTab, brandingConfigured, campusesCount, canConfigureOrganization, commit, loading, membersCount, onboardingEnabled, organizationId]);

  const navigate = useCallback((tab: string) => {
    onNavigate(tab);
    setSearchOpen(false);
  }, [onNavigate]);

  const toggleFavorite = useCallback((tab: string) => {
    if (!personalizationEnabled) return;
    commit(current => ({
      ...current,
      favorite_tabs: current.favorite_tabs.includes(tab)
        ? current.favorite_tabs.filter(item => item !== tab)
        : [tab, ...current.favorite_tabs].slice(0, 8)
    }));
  }, [commit, personalizationEnabled]);

  const setStepCompleted = useCallback((stepId: string, completed = true) => {
    if (!onboardingEnabled) return;
    commit(current => ({
      ...current,
      onboarding_steps: completed
        ? [...new Set([...current.onboarding_steps, stepId])]
        : current.onboarding_steps.filter(item => item !== stepId)
    }));
  }, [commit, onboardingEnabled]);

  const dismissOnboarding = useCallback(() => {
    commit(current => ({ ...current, onboarding_dismissed: true }));
    setOnboardingOpen(false);
  }, [commit]);

  const restartOnboarding = useCallback(() => {
    commit(current => ({ ...current, onboarding_dismissed: false, onboarding_steps: [] }));
    setOnboardingOpen(true);
  }, [commit]);

  const completedVisibleSteps = onboardingSteps.filter(step => preferences.onboarding_steps.includes(step.id)).length;
  const completion = Math.round((completedVisibleSteps / Math.max(1, onboardingSteps.length)) * 100);
  const value = useMemo<StudioExperienceContextType>(() => ({
    preferences, loading, onboardingEnabled, searchEnabled, personalizationEnabled,
    onboardingOpen, setOnboardingOpen, searchOpen, setSearchOpen, navigate, toggleFavorite,
    isFavorite: (tab: string) => preferences.favorite_tabs.includes(tab), setStepCompleted,
    dismissOnboarding, restartOnboarding, completion, onboardingSteps
  }), [
    completion, dismissOnboarding, loading, navigate, onboardingEnabled, onboardingOpen,
    personalizationEnabled, preferences, restartOnboarding, searchEnabled, searchOpen,
    setStepCompleted, toggleFavorite, onboardingSteps
  ]);

  return <StudioExperienceContext.Provider value={value}>{children}</StudioExperienceContext.Provider>;
}

export function useStudioExperience(): StudioExperienceContextType {
  const context = useContext(StudioExperienceContext);
  if (context) return context;
  return {
    preferences: EMPTY_PREFERENCES, loading: false, onboardingEnabled: false, searchEnabled: false,
    personalizationEnabled: false, onboardingOpen: false, setOnboardingOpen: () => {}, searchOpen: false,
    setSearchOpen: () => {}, navigate: () => {}, toggleFavorite: () => {}, isFavorite: () => false,
    setStepCompleted: () => {}, dismissOnboarding: () => {}, restartOnboarding: () => {}, completion: 0,
    onboardingSteps: STUDIO_ONBOARDING_STEPS
  };
}
