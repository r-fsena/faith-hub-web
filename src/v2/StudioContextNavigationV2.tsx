import { useMemo } from 'react';
import { useFeatureFlags } from '../context/FeatureFlagContext';
import { destinationFor, type StudioDestination } from '../components/StudioCommandPalette';
import './studio-v2.css';

const STUDIO_V2_FLAG = 'studio.context_navigation_v2';

interface NavigationGroupV2 {
  rootTab: string;
  rootLabel: string;
  ancestor?: { tab: string; label: string };
  tabs: string[];
}

const NAVIGATION_GROUPS: NavigationGroupV2[] = [
  {
    rootTab: 'people_workspace', rootLabel: 'Pessoas',
    tabs: ['people_workspace', 'membros', 'visitantes', 'pastoral_radar', 'celulas', 'oracoes']
  },
  {
    rootTab: 'ministries_workspace', rootLabel: 'Equipes & Ministérios',
    tabs: ['ministries_workspace', 'ministerios', 'escalas', 'kids_workspace']
  },
  {
    rootTab: 'kids_workspace', rootLabel: 'Ministério Infantil',
    ancestor: { tab: 'ministries_workspace', label: 'Equipes & Ministérios' },
    tabs: ['kids_workspace', 'kids_salas', 'kids_checkin', 'kids_chamados', 'kids_familias', 'kids_config_salas', 'kids_relatorios']
  },
  {
    rootTab: 'secretariat_workspace', rootLabel: 'Secretaria',
    tabs: ['secretariat_workspace', 'secretariat_overview', 'secretariat_records', 'secretariat_movements', 'secretariat_documents', 'secretariat_baptisms', 'secretariat_templates']
  },
  {
    rootTab: 'content_workspace', rootLabel: 'Conteúdo & Comunicação',
    tabs: ['content_workspace', 'eventos', 'transmissoes', 'devocionais', 'estudos', 'bible_config']
  },
  {
    rootTab: 'operations_workspace', rootLabel: 'Loja & Operações',
    tabs: ['operations_workspace', 'pdv_produtos', 'pdv_estoque', 'pdv_pedidos']
  },
  {
    rootTab: 'finance_workspace', rootLabel: 'Finanças',
    tabs: ['finance_workspace', 'financial_treasury', 'financial_projects', 'pagarme_financeiro']
  },
  {
    rootTab: 'administration_workspace', rootLabel: 'Administração',
    tabs: ['administration_workspace', 'campuses', 'church_branding', 'feature_flags', 'my_subscription', 'security_audit', 'configuracoes']
  }
];

const ROOT_LABELS: Record<string, string> = {
  people_workspace: 'Visão geral',
  ministries_workspace: 'Visão geral',
  kids_workspace: 'Visão geral',
  secretariat_workspace: 'Visão geral',
  content_workspace: 'Visão geral',
  operations_workspace: 'Visão geral',
  finance_workspace: 'Visão geral',
  administration_workspace: 'Visão geral'
};

interface StudioContextNavigationV2Props {
  activeTab: string;
  role: string;
  isDemo?: boolean;
  onNavigate: (tab: string) => void;
  onExitV2: () => void;
}

function canDisplay(destination: StudioDestination | undefined, role: string, isFeatureEnabled: (key: string) => boolean, isDemo: boolean): boolean {
  if (!destination) return false;
  if (destination.roles && !destination.roles.includes(role)) return false;
  if (isDemo) return true;
  return !destination.featureFlag || isFeatureEnabled(destination.featureFlag);
}

function resolveGroup(activeTab: string): NavigationGroupV2 | undefined {
  // Kids possui uma hierarquia própria e deve vencer o grupo mais amplo de Ministérios.
  return NAVIGATION_GROUPS.find(group => group.rootTab === 'kids_workspace' && group.tabs.includes(activeTab))
    || NAVIGATION_GROUPS.find(group => group.tabs.includes(activeTab));
}

export default function StudioContextNavigationV2({
  activeTab, role, isDemo = false, onNavigate, onExitV2
}: StudioContextNavigationV2Props) {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();
  const normalizedRole = String(role || 'MEMBER').toUpperCase();
  const enabled = isDemo || isFeatureEnabled(STUDIO_V2_FLAG, false);
  const group = resolveGroup(activeTab);

  const destinations = useMemo(() => {
    if (!group) return [];
    return group.tabs
      .map(tab => destinationFor(tab))
      .filter((destination): destination is StudioDestination => canDisplay(destination, normalizedRole, isFeatureEnabled, isDemo));
  }, [group, isDemo, isFeatureEnabled, normalizedRole]);

  if (isLoading || !enabled) return null;

  if (!group) {
    return (
      <div className="studio-v2-status" aria-label="Studio V2 em avaliação">
        <span><strong>STUDIO V2</strong> Navegação em avaliação</span>
        <button type="button" onClick={onExitV2}>Usar versão atual</button>
      </div>
    );
  }

  const current = destinationFor(activeTab);
  const isGroupRoot = activeTab === group.rootTab;
  const backTarget = isGroupRoot && group.ancestor ? group.ancestor : { tab: group.rootTab, label: group.rootLabel };
  const showBack = !isGroupRoot || Boolean(group.ancestor);

  return (
    <section className="studio-v2-context" aria-label="Navegação da área atual">
      <div className="studio-v2-context-top">
        <div className="studio-v2-context-location">
          {showBack ? (
            <button type="button" className="studio-v2-back" onClick={() => onNavigate(backTarget.tab)}>
              <span aria-hidden="true">←</span>
              <span>Voltar para <strong>{backTarget.label}</strong></span>
            </button>
          ) : (
            <span className="studio-v2-root-label">Você está em <strong>{group.rootLabel}</strong></span>
          )}

          <nav className="studio-v2-breadcrumb" aria-label="Caminho atual">
            {group.ancestor && (
              <>
                <button type="button" onClick={() => onNavigate(group.ancestor!.tab)}>{group.ancestor.label}</button>
                <span aria-hidden="true">›</span>
              </>
            )}
            <button type="button" onClick={() => onNavigate(group.rootTab)}>{group.rootLabel}</button>
            {!isGroupRoot && (
              <>
                <span aria-hidden="true">›</span>
                <strong>{current?.label || 'Seção atual'}</strong>
              </>
            )}
          </nav>
        </div>

        <div className="studio-v2-pilot">
          <span><strong>STUDIO V2</strong> Em avaliação</span>
          <button type="button" onClick={onExitV2}>Usar versão atual</button>
        </div>
      </div>

      <div className="studio-v2-section-switcher">
        <label htmlFor="studio-v2-section-select">Navegar nesta área</label>
        <select id="studio-v2-section-select" value={activeTab} onChange={event => onNavigate(event.target.value)}>
          {destinations.map(destination => (
            <option key={destination.tab} value={destination.tab}>
              {destination.tab === group.rootTab ? ROOT_LABELS[destination.tab] : destination.label}
            </option>
          ))}
        </select>

        <div className="studio-v2-tabs" role="navigation" aria-label={`Opções de ${group.rootLabel}`}>
          {destinations.map(destination => {
            const active = destination.tab === activeTab;
            return (
              <button
                key={destination.tab}
                type="button"
                className={active ? 'is-active' : ''}
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate(destination.tab)}
              >
                <span aria-hidden="true">{destination.icon}</span>
                <span>{destination.tab === group.rootTab ? ROOT_LABELS[destination.tab] : destination.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
