import { useEffect, useMemo, useState } from 'react';
import { useFeatureFlags } from '../context/FeatureFlagContext';
import { getAuthHeaders } from '../services/apiClient';
import { useStudioExperience } from '../context/StudioExperienceContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export type StudioWorkspaceKind =
  | 'people'
  | 'ministries'
  | 'kids'
  | 'secretariat'
  | 'content'
  | 'operations'
  | 'finance'
  | 'administration';

interface WorkspaceAction {
  tab: string;
  icon: string;
  title: string;
  description: string;
  featureFlag?: string;
  emphasis?: boolean;
}

interface WorkspaceMetric {
  label: string;
  value: string | number;
  helper: string;
  tab?: string;
  tone?: 'brand' | 'blue' | 'amber' | 'rose';
}

interface WorkspaceConfig {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  guidance: string;
  actions: WorkspaceAction[];
}

interface StudioWorkspaceProps {
  kind: StudioWorkspaceKind;
  organizationId: string;
  organizationName: string;
  campusId: string;
  campusesCount: number;
  userRole?: string;
  overview?: {
    membersCount?: number;
    cellsCount?: number;
    ordersTotal?: number;
    eventsCount?: number;
    recentMembersCount?: number;
    hasActiveBroadcast?: boolean;
  };
  onNavigate: (tab: string) => void;
}

const WORKSPACES: Record<StudioWorkspaceKind, WorkspaceConfig> = {
  people: {
    eyebrow: 'Pessoas', title: 'Pessoas & Comunidade', icon: '👥',
    description: 'Acompanhe cada pessoa desde a primeira visita até sua integração, cuidado e participação na comunidade.',
    guidance: 'Comece pelas pessoas que precisam de acompanhamento e use os cadastros como fonte única de informação.',
    actions: [
      { tab: 'membros', icon: '👤', title: 'Membros', description: 'Cadastros, perfis, equipes e permissões.', featureFlag: 'members.module_enabled', emphasis: true },
      { tab: 'visitantes', icon: '🤝', title: 'Visitantes', description: 'Acolhimento, contatos e jornada de integração.', featureFlag: 'cell_groups.module_enabled' },
      { tab: 'pastoral_radar', icon: '❤️', title: 'Cuidado pastoral', description: 'Sinais de atenção, retenção e acompanhamento.', featureFlag: 'cell_groups.module_enabled' },
      { tab: 'celulas', icon: '🏠', title: 'Células & redes', description: 'Grupos, lideranças e acompanhamento comunitário.', featureFlag: 'cell_groups.module_enabled' },
      { tab: 'oracoes', icon: '🙏', title: 'Orações & intercessão', description: 'Pedidos, cuidado e acompanhamento pastoral.', featureFlag: 'prayers.module_enabled' }
    ]
  },
  ministries: {
    eyebrow: 'Equipes', title: 'Equipes & Ministérios', icon: '🙌',
    description: 'Organize ministérios, voluntários, escalas e a operação segura do Ministério Infantil.',
    guidance: 'Use esta área para preparar as equipes antes das programações e acompanhar a operação durante o culto.',
    actions: [
      { tab: 'ministerios', icon: '🙌', title: 'Ministérios & voluntários', description: 'Crie ministérios, funções, líderes e equipes de voluntários.', featureFlag: 'cell_groups.module_enabled', emphasis: true },
      { tab: 'escalas', icon: '📅', title: 'Escalas', description: 'Planeje cultos, distribua funções e acompanhe confirmações.', featureFlag: 'cell_groups.module_enabled', emphasis: true },
      { tab: 'kids_workspace', icon: '🧸', title: 'Ministério Infantil', description: 'Acesse a central de operação do Kids.', featureFlag: 'kids.module_enabled', emphasis: true },
      { tab: 'kids_checkin', icon: '✅', title: 'Check-in Kids', description: 'Inicie rapidamente a recepção de crianças.', featureFlag: 'kids.express_kiosk_checkin' },
      { tab: 'kids_salas', icon: '🚸', title: 'Salas ao vivo', description: 'Ocupação, crianças presentes e chamados.', featureFlag: 'kids.live_rooms_dashboard' }
    ]
  },
  kids: {
    eyebrow: 'Equipes & Ministérios', title: 'Ministério Infantil', icon: '🧸',
    description: 'Opere salas, check-ins, chamados e cadastros familiares em um ambiente seguro e orientado.',
    guidance: 'Antes da programação, confirme salas e famílias. Durante o culto, acompanhe presença e chamados pelo painel ao vivo.',
    actions: [
      { tab: 'kids_salas', icon: '🚸', title: 'Salas ao vivo', description: 'Ocupação, presença e situação das crianças.', featureFlag: 'kids.live_rooms_dashboard', emphasis: true },
      { tab: 'kids_checkin', icon: '✅', title: 'Realizar check-in', description: 'Recepção rápida de membros e visitantes.', featureFlag: 'kids.express_kiosk_checkin', emphasis: true },
      { tab: 'kids_chamados', icon: '🔔', title: 'Chamados', description: 'Acompanhe contatos com pais e responsáveis.', featureFlag: 'kids.emergency_parent_call' },
      { tab: 'kids_familias', icon: '👨‍👩‍👧', title: 'Famílias & crianças', description: 'Cadastros, vínculos e informações importantes.', featureFlag: 'kids.module_enabled' },
      { tab: 'kids_config_salas', icon: '🏫', title: 'Configurar salas', description: 'Faixas etárias, capacidade e identificação.', featureFlag: 'kids.module_enabled' },
      { tab: 'kids_relatorios', icon: '📊', title: 'Relatórios', description: 'Histórico e exportações da operação.', featureFlag: 'kids.reports_export' }
    ]
  },
  secretariat: {
    eyebrow: 'Gestão eclesiástica', title: 'Secretaria', icon: '🗂️',
    description: 'Centralize prontuários, movimentações, batismos e documentos oficiais da igreja.',
    guidance: 'Priorize solicitações e cadastros incompletos; documentos publicados seguem o fluxo oficial de aprovação.',
    actions: [
      { tab: 'secretariat_overview', icon: '📊', title: 'Painel detalhado', description: 'Indicadores, pendências e movimentações recentes.', featureFlag: 'secretariat.module_enabled', emphasis: true },
      { tab: 'secretariat_records', icon: '👤', title: 'Pessoas e registros', description: 'Prontuários e dados eclesiásticos.', featureFlag: 'secretariat.member_registry' },
      { tab: 'secretariat_movements', icon: '↔️', title: 'Movimentações', description: 'Transferências internas e externas.', featureFlag: 'secretariat.transfers' },
      { tab: 'secretariat_documents', icon: '📄', title: 'Documentos', description: 'Solicitações, emissão e histórico oficial.', featureFlag: 'secretariat.documents', emphasis: true },
      { tab: 'secretariat_baptisms', icon: '💧', title: 'Batismos', description: 'Registros e certificados de batismo.', featureFlag: 'secretariat.baptisms' },
      { tab: 'secretariat_templates', icon: '🎨', title: 'Modelos', description: 'Design, versões, signatários e aprovação.', featureFlag: 'secretariat.template_editor' }
    ]
  },
  content: {
    eyebrow: 'Comunicação', title: 'Conteúdo & Comunicação', icon: '📣',
    description: 'Planeje o conteúdo que chega à comunidade no PWA, nos eventos e nas transmissões.',
    guidance: 'Organize primeiro a programação; depois publique conteúdos e acompanhe os canais ativos.',
    actions: [
      { tab: 'eventos', icon: '📅', title: 'Eventos & jornadas', description: 'Programações, inscrições e experiências.', featureFlag: 'events.module_enabled', emphasis: true },
      { tab: 'transmissoes', icon: '🔴', title: 'Cultos & transmissões', description: 'Lives, cultos e conteúdos ao vivo.', featureFlag: 'broadcasts.module_enabled' },
      { tab: 'devocionais', icon: '☀️', title: 'Devocionais', description: 'Conteúdo diário para a comunidade.', featureFlag: 'devotionals.module_enabled' },
      { tab: 'estudos', icon: '📚', title: 'Estudos & mídias', description: 'Biblioteca de ensino e formação.', featureFlag: 'studies.module_enabled' },
      { tab: 'bible_config', icon: '📖', title: 'Bíblia', description: 'Versões e experiência bíblica do PWA.', featureFlag: 'bible.module_enabled' },
    ]
  },
  operations: {
    eyebrow: 'Operação', title: 'Loja & Operações', icon: '🛍️',
    description: 'Acompanhe produtos, vendas e pedidos da loja em uma área operacional única.',
    guidance: 'Use os monitores operacionais durante o atendimento e deixe cadastros e ajustes para os momentos de preparação.',
    actions: [
      { tab: 'pdv_pedidos', icon: '🧾', title: 'Monitor de pedidos', description: 'Acompanhe o fluxo de pedidos em tempo real.', featureFlag: 'pdv.order_kanban_monitor', emphasis: true },
      { tab: 'pdv_produtos', icon: '🛍️', title: 'Produtos & estoque', description: 'Catálogo, preços e disponibilidade.', featureFlag: 'pdv.stock_inventory' }
    ]
  },
  finance: {
    eyebrow: 'Gestão financeira', title: 'Finanças', icon: '💳',
    description: 'Concentre tesouraria, visão de resultado, projetos e meios de pagamento em uma única área.',
    guidance: 'Confira primeiro as pendências financeiras e o saldo; depois avance para lançamentos, projetos ou conciliação.',
    actions: [
      { tab: 'financial_treasury', icon: '📈', title: 'Tesouraria & DRE', description: 'Entradas, saídas, saldo e relatórios.', featureFlag: 'financial.cashflow_ledger', emphasis: true },
      { tab: 'financial_projects', icon: '🎯', title: 'Campanhas & projetos', description: 'Metas, arrecadações e acompanhamento.', featureFlag: 'financial.cashflow_ledger' },
      { tab: 'pagarme_financeiro', icon: '🔐', title: 'Gateway de pagamento', description: 'Conexão financeira, Pix e cartões.', featureFlag: 'financial.credit_card_gateway' }
    ]
  },
  administration: {
    eyebrow: 'Administração', title: 'Administração da igreja', icon: '🏛️',
    description: 'Configure a organização, unidades, identidade, módulos, assinatura e segurança do ambiente.',
    guidance: 'Estas configurações afetam toda a organização. Revise unidade e contexto antes de salvar uma alteração.',
    actions: [
      { tab: 'campuses', icon: '🏢', title: 'Igreja & unidades', description: 'Filiais, congregações e contexto de operação.', featureFlag: 'system.multicampus_enabled', emphasis: true },
      { tab: 'church_branding', icon: '🎨', title: 'Marca & PWA', description: 'Identidade visual e experiência do aplicativo.', featureFlag: 'system.custom_theme_colors' },
      { tab: 'feature_flags', icon: '✨', title: 'Módulos da plataforma', description: 'Recursos disponíveis para a organização.', featureFlag: 'system.saas_subscription_portal' },
      { tab: 'my_subscription', icon: '💎', title: 'Assinatura Faith-Hub', description: 'Plano, cobrança e situação da assinatura.', featureFlag: 'system.saas_subscription_portal' },
      { tab: 'security_audit', icon: '🛡️', title: 'Auditoria & LGPD', description: 'Eventos de segurança e rastreabilidade.' },
      { tab: 'configuracoes', icon: '🔧', title: 'Configurações avançadas', description: 'Infraestrutura e integrações técnicas.' }
    ]
  }
};

function money(value: unknown): string {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function StudioWorkspace({
  kind, organizationId, organizationName, campusId, campusesCount, userRole, overview, onNavigate
}: StudioWorkspaceProps) {
  const { isFeatureEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const { navigate, personalizationEnabled, toggleFavorite, isFavorite } = useStudioExperience();
  const config = WORKSPACES[kind];
  const [metrics, setMetrics] = useState<WorkspaceMetric[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState(false);

  const actions = useMemo(() => config.actions.filter(action =>
    !action.featureFlag || isFeatureEnabled(action.featureFlag)
  ), [config.actions, isFeatureEnabled]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ organization_id: organizationId });
    if (campusId && campusId !== 'all') params.set('campus_id', campusId);

    const setSafe = (items: WorkspaceMetric[]) => {
      if (active) setMetrics(items);
    };

    const load = async () => {
      setLoadingMetrics(true);
      setMetricsError(false);
      try {
        if (kind === 'secretariat') {
          const headers = await getAuthHeaders();
          const response = await fetch(`${API_URL}/secretariat/dashboard?${params}`, { headers });
          if (!response.ok) throw new Error('SECRETARIAT_WORKSPACE_FAILED');
          const data = await response.json();
          const summary = data.metrics || {};
          setSafe([
            { label: 'Pessoas cadastradas', value: Number(summary.total_members || 0), helper: 'Base da organização', tab: 'secretariat_records' },
            { label: 'Cadastros incompletos', value: Number(summary.incomplete_records || 0), helper: 'Precisam de atenção', tab: 'secretariat_records', tone: 'amber' },
            { label: 'Solicitações pendentes', value: Number(summary.pending_requests || 0), helper: 'Aguardando andamento', tab: 'secretariat_documents', tone: 'rose' },
            { label: 'Documentos válidos', value: Number(summary.issued_documents || 0), helper: 'Emitidos oficialmente', tab: 'secretariat_documents', tone: 'blue' }
          ]);
          return;
        }

        if (kind === 'ministries') {
          const headers = await getAuthHeaders();
          const ministriesResponse = await fetch(`${API_URL}/ministries?${params}`, { headers });
          const ministries = ministriesResponse.ok ? await ministriesResponse.json() : [];
          const ministryList = Array.isArray(ministries) ? ministries : (ministries.data || []);
          setSafe([
            { label: 'Ministérios ativos', value: ministryList.filter((item: any) => item.status !== 'INACTIVE').length, helper: 'Equipes em operação', tab: 'ministerios' },
            { label: 'Voluntários vinculados', value: ministryList.reduce((sum: number, item: any) => sum + Number(item.volunteers_count || 0), 0), helper: 'Nos ministérios', tab: 'ministerios', tone: 'blue' },
            { label: 'Próximas escalas', value: ministryList.reduce((sum: number, item: any) => sum + Number(item.upcoming_schedules_count || 0), 0), helper: 'Programações organizadas', tab: 'ministerios', tone: 'amber' }
          ]);
          return;
        }

        if (kind === 'kids') {
          const headers = await getAuthHeaders();
          const [roomsResponse, checkinsResponse, familiesResponse] = await Promise.all([
            fetch(`${API_URL}/kids/rooms?${params}`, { headers }),
            fetch(`${API_URL}/kids/checkins?${params}&status=active`, { headers }),
            fetch(`${API_URL}/kids/families?${params}`, { headers })
          ]);
          if (!roomsResponse.ok || !checkinsResponse.ok) throw new Error('KIDS_WORKSPACE_FAILED');
          const roomsData = await roomsResponse.json();
          const checkinsData = await checkinsResponse.json();
          const familiesData = familiesResponse.ok ? await familiesResponse.json() : {};
          const rooms = Array.isArray(roomsData.data) ? roomsData.data : [];
          const checkins = Array.isArray(checkinsData.data) ? checkinsData.data : [];
          const families = Array.isArray(familiesData.data) ? familiesData.data : [];
          const calls = checkins.filter((item: any) => item.status === 'CALLING_PARENTS').length;
          setSafe([
            { label: 'Salas configuradas', value: rooms.length, helper: 'Disponíveis na unidade', tab: 'kids_config_salas' },
            { label: 'Crianças presentes', value: checkins.length, helper: 'Check-ins ativos agora', tab: 'kids_salas', tone: checkins.length ? 'amber' : 'brand' },
            { label: 'Chamados em aberto', value: calls, helper: 'Responsáveis sendo chamados', tab: 'kids_chamados', tone: calls ? 'rose' : 'brand' },
            { label: 'Famílias vinculadas', value: families.length, helper: 'Cadastros disponíveis', tab: 'kids_familias', tone: 'blue' }
          ]);
          return;
        }

        if (kind === 'finance') {
          const headers = await getAuthHeaders();
          const [summaryResponse, projectsResponse] = await Promise.all([
            fetch(`${API_URL}/financial/summary?${params}`, { headers }),
            fetch(`${API_URL}/financial/projects?organization_id=${encodeURIComponent(organizationId)}`, { headers })
          ]);
          if (!summaryResponse.ok) throw new Error('FINANCE_WORKSPACE_FAILED');
          const data = await summaryResponse.json();
          const projectsData = projectsResponse.ok ? await projectsResponse.json() : {};
          const summary = data.summary || {};
          const projects = Array.isArray(projectsData.data) ? projectsData.data : [];
          setSafe([
            { label: 'Saldo atual', value: money(summary.net_balance), helper: 'Resultado consolidado', tab: 'financial_treasury' },
            { label: 'Entradas pendentes', value: money(summary.pending_income), helper: 'A receber', tab: 'financial_treasury', tone: 'amber' },
            { label: 'Saídas pendentes', value: money(summary.pending_expense), helper: 'A pagar', tab: 'financial_treasury', tone: 'rose' },
            { label: 'Projetos ativos', value: projects.filter((item: any) => item.status === 'ACTIVE').length, helper: 'Campanhas em andamento', tab: 'financial_projects', tone: 'blue' }
          ]);
          return;
        }

        if (kind === 'people') {
          setSafe([
            { label: 'Membros', value: overview?.membersCount || 0, helper: 'Pessoas cadastradas', tab: 'membros' },
            { label: 'Células & grupos', value: overview?.cellsCount || 0, helper: 'Comunidades ativas', tab: 'celulas', tone: 'blue' },
            { label: 'Cadastros recentes', value: overview?.recentMembersCount || 0, helper: 'Últimos registros', tab: 'membros' }
          ]);
          return;
        }

        if (kind === 'content') {
          setSafe([
            { label: 'Eventos publicados', value: overview?.eventsCount || 0, helper: 'Programações disponíveis', tab: 'eventos' },
            { label: 'Transmissão', value: overview?.hasActiveBroadcast ? 'Ao vivo' : 'Sem live', helper: overview?.hasActiveBroadcast ? 'Canal ativo agora' : 'Nenhuma transmissão ativa', tab: 'transmissoes', tone: overview?.hasActiveBroadcast ? 'rose' : 'blue' }
          ]);
          return;
        }

        if (kind === 'operations') {
          setSafe([
            { label: 'Vendas registradas', value: money(overview?.ordersTotal), helper: 'Total disponível no painel', tab: 'pdv_pedidos' }
          ]);
          return;
        }

        setSafe([
          { label: 'Unidades', value: campusesCount, helper: 'Filiais e congregações', tab: 'campuses' },
          { label: 'Seu acesso', value: String(userRole || 'ADMIN').replaceAll('_', ' '), helper: 'Perfil atual de administração', tone: 'blue' }
        ]);
      } catch (error) {
        console.warn(`Não foi possível carregar os indicadores da área ${kind}:`, error);
        if (active) setMetricsError(true);
      } finally {
        if (active) setLoadingMetrics(false);
      }
    };

    load();
    return () => { active = false; };
  }, [campusId, campusesCount, kind, organizationId, overview, userRole]);

  return (
    <section className="studio-workspace animate-fade-in" aria-labelledby={`workspace-${kind}-title`}>
      <div className="workspace-hero">
        <div className="workspace-hero-copy">
          <span className="workspace-eyebrow">{config.eyebrow}</span>
          <div className="workspace-title-row">
            <span className="workspace-title-icon" aria-hidden="true">{config.icon}</span>
            <div>
              <h1 id={`workspace-${kind}-title`}>{config.title}</h1>
              <p>{config.description}</p>
            </div>
          </div>
        </div>
        <div className="workspace-context-card">
          <span>Contexto atual</span>
          <strong>{organizationName}</strong>
          <small>{campusId === 'all' ? 'Todas as unidades permitidas' : 'Unidade selecionada no topo'}</small>
        </div>
      </div>

      <div className="workspace-guidance">
        <span aria-hidden="true">💡</span>
        <div><strong>Como usar esta área</strong><p>{config.guidance}</p></div>
      </div>

      <div className="workspace-section-heading">
        <div><span>Visão rápida</span><h2>O que precisa da sua atenção</h2></div>
        {loadingMetrics && <small>Atualizando indicadores…</small>}
        {metricsError && <button type="button" className="workspace-text-button" onClick={() => window.location.reload()}>Tentar novamente</button>}
      </div>

      <div className="workspace-metrics-grid">
        {loadingMetrics && metrics.length === 0 && Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="workspace-skeleton-card" aria-hidden="true" />
        ))}
        {!loadingMetrics && metricsError && metrics.length === 0 && (
          <div className="workspace-empty-state"><strong>Indicadores temporariamente indisponíveis</strong><span>Os atalhos continuam disponíveis para você trabalhar normalmente.</span></div>
        )}
        {metrics.map(metric => (
          <button key={metric.label} type="button" className={`workspace-metric-card tone-${metric.tone || 'brand'}`} onClick={() => metric.tab && onNavigate(metric.tab)} disabled={!metric.tab}>
            <span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.helper}</small>
          </button>
        ))}
      </div>

      <div className="workspace-section-heading workspace-actions-heading">
        <div><span>Atalhos</span><h2>O que você quer fazer?</h2></div>
      </div>
      <div className="workspace-actions-grid">
        {flagsLoading && Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="workspace-skeleton-card workspace-skeleton-action" aria-hidden="true" />
        ))}
        {!flagsLoading && actions.length === 0 && (
          <div className="workspace-empty-state"><strong>Nenhuma ferramenta habilitada nesta área</strong><span>Consulte a administração da organização para revisar os módulos disponíveis.</span></div>
        )}
        {actions.map(action => (
          <article key={action.tab} className={`workspace-action-card ${action.emphasis ? 'is-emphasis' : ''}`}>
            <button type="button" className="workspace-action-main" onClick={() => personalizationEnabled ? navigate(action.tab) : onNavigate(action.tab)}>
              <span className="workspace-action-icon" aria-hidden="true">{action.icon}</span>
              <span className="workspace-action-copy"><strong>{action.title}</strong><small>{action.description}</small></span>
              <span className="workspace-action-arrow" aria-hidden="true">→</span>
            </button>
            {personalizationEnabled && (
              <button type="button" className={`workspace-favorite-button ${isFavorite(action.tab) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(action.tab)} aria-label={isFavorite(action.tab) ? `Remover ${action.title} dos favoritos` : `Favoritar ${action.title}`}>★</button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
