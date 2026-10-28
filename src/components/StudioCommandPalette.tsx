import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFeatureFlags } from '../context/FeatureFlagContext';
import { useStudioExperience } from '../context/StudioExperienceContext';
import { searchStudio, type StudioRemoteSearchResult } from '../services/studioExperience';

export interface StudioDestination {
  tab: string;
  label: string;
  area: string;
  description: string;
  icon: string;
  keywords: string;
  featureFlag?: string;
  roles?: string[];
}

export const STUDIO_DESTINATIONS: StudioDestination[] = [
  { tab: 'dashboard', label: 'Início', area: 'Geral', description: 'Indicadores e visão geral da igreja.', icon: '⌂', keywords: 'dashboard inicio resumo' },
  { tab: 'people_workspace', label: 'Pessoas', area: 'Pessoas', description: 'Área de trabalho de pessoas e comunidade.', icon: '👥', keywords: 'pessoas membros comunidade' },
  { tab: 'membros', label: 'Membros', area: 'Pessoas', description: 'Cadastros, perfis, convites e permissões.', icon: '👤', keywords: 'membro pessoa cadastrar importar convidar', featureFlag: 'members.module_enabled' },
  { tab: 'visitantes', label: 'Visitantes & acolhimento', area: 'Pessoas', description: 'Jornada de visitantes e integração.', icon: '🤝', keywords: 'visitante acolhimento integração', featureFlag: 'cell_groups.module_enabled' },
  { tab: 'pastoral_radar', label: 'Cuidado pastoral', area: 'Pessoas', description: 'Radar de atenção e retenção.', icon: '❤️', keywords: 'pastoral cuidado evasão retenção', featureFlag: 'cell_groups.module_enabled' },
  { tab: 'celulas', label: 'Células & redes', area: 'Pessoas', description: 'Grupos, líderes e participantes.', icon: '🏠', keywords: 'celula rede grupo líder', featureFlag: 'cell_groups.module_enabled' },
  { tab: 'oracoes', label: 'Orações & intercessão', area: 'Pessoas', description: 'Pedidos, cuidado e acompanhamento pastoral.', icon: '🙏', keywords: 'oração pedido intercessão cuidado pessoa', featureFlag: 'prayers.module_enabled' },
  { tab: 'ministries_workspace', label: 'Equipes & Ministérios', area: 'Equipes', description: 'Área de trabalho de equipes e voluntários.', icon: '🙌', keywords: 'equipe ministério voluntário escala' },
  { tab: 'ministerios', label: 'Ministérios & voluntários', area: 'Equipes', description: 'Ministérios, líderes, funções e equipes.', icon: '🙌', keywords: 'ministério voluntário equipe função convidar', featureFlag: 'cell_groups.module_enabled' },
  { tab: 'escalas', label: 'Escalas', area: 'Equipes', description: 'Planejamento, alocação e confirmação das equipes.', icon: '📅', keywords: 'escala culto programação confirmação troca', featureFlag: 'cell_groups.module_enabled' },
  { tab: 'kids_workspace', label: 'Ministério Infantil', area: 'Equipes', description: 'Central de operação do Kids.', icon: '🧸', keywords: 'kids criança infantil', featureFlag: 'kids.module_enabled' },
  { tab: 'kids_checkin', label: 'Check-in Kids', area: 'Ministério Infantil', description: 'Entrada segura de crianças.', icon: '✅', keywords: 'kids checkin entrada criança', featureFlag: 'kids.express_kiosk_checkin' },
  { tab: 'kids_salas', label: 'Salas Kids ao vivo', area: 'Ministério Infantil', description: 'Presença, ocupação e chamados.', icon: '🚸', keywords: 'kids sala presença chamado', featureFlag: 'kids.live_rooms_dashboard' },
  { tab: 'kids_chamados', label: 'Chamados', area: 'Ministério Infantil', description: 'Contato com pais e responsáveis.', icon: '🔔', keywords: 'kids chamado pais responsável', featureFlag: 'kids.emergency_parent_call' },
  { tab: 'kids_familias', label: 'Famílias & crianças', area: 'Ministério Infantil', description: 'Vínculos familiares e cadastros.', icon: '👨‍👩‍👧', keywords: 'kids familia criança responsável', featureFlag: 'kids.module_enabled' },
  { tab: 'kids_config_salas', label: 'Configurar salas Kids', area: 'Ministério Infantil', description: 'Capacidade e faixas etárias.', icon: '🏫', keywords: 'kids configurar sala capacidade idade', featureFlag: 'kids.module_enabled' },
  { tab: 'kids_relatorios', label: 'Relatórios', area: 'Ministério Infantil', description: 'Histórico e exportações da operação.', icon: '📊', keywords: 'kids relatório exportação histórico', featureFlag: 'kids.reports_export' },
  { tab: 'secretariat_workspace', label: 'Secretaria', area: 'Secretaria', description: 'Área de trabalho da Secretaria.', icon: '🗂️', keywords: 'secretaria eclesiástica documento', featureFlag: 'secretariat.module_enabled' },
  { tab: 'secretariat_overview', label: 'Painel detalhado', area: 'Secretaria', description: 'Indicadores e pendências da Secretaria.', icon: '📊', keywords: 'secretaria painel indicador pendência', featureFlag: 'secretariat.module_enabled' },
  { tab: 'secretariat_records', label: 'Prontuários eclesiásticos', area: 'Secretaria', description: 'Registros e situação eclesiástica.', icon: '👤', keywords: 'prontuario cadastro registro', featureFlag: 'secretariat.member_registry' },
  { tab: 'secretariat_movements', label: 'Transferências', area: 'Secretaria', description: 'Movimentações internas e externas.', icon: '↔️', keywords: 'transferencia movimentação carta', featureFlag: 'secretariat.transfers' },
  { tab: 'secretariat_documents', label: 'Documentos & certificados', area: 'Secretaria', description: 'Solicitações, emissão e histórico.', icon: '📄', keywords: 'documento certificado carta emitir', featureFlag: 'secretariat.documents' },
  { tab: 'secretariat_baptisms', label: 'Batismos', area: 'Secretaria', description: 'Registros e certificados de batismo.', icon: '💧', keywords: 'batismo certificado', featureFlag: 'secretariat.baptisms' },
  { tab: 'secretariat_templates', label: 'Modelos de documentos', area: 'Secretaria', description: 'Editor, design e aprovação de modelos.', icon: '🎨', keywords: 'template modelo documento design', featureFlag: 'secretariat.template_editor' },
  { tab: 'content_workspace', label: 'Conteúdo & Comunicação', area: 'Conteúdo', description: 'Área de publicações e comunicação.', icon: '📣', keywords: 'conteúdo comunicação publicar' },
  { tab: 'eventos', label: 'Eventos & jornadas', area: 'Conteúdo', description: 'Programações, inscrições e ingressos.', icon: '📅', keywords: 'evento curso inscrição ingresso', featureFlag: 'events.module_enabled' },
  { tab: 'transmissoes', label: 'Cultos & transmissões', area: 'Conteúdo', description: 'Lives e conteúdos ao vivo.', icon: '🔴', keywords: 'live culto transmissão vivo', featureFlag: 'broadcasts.module_enabled' },
  { tab: 'devocionais', label: 'Devocionais', area: 'Conteúdo', description: 'Conteúdo diário do PWA.', icon: '☀️', keywords: 'devocional conteúdo diário', featureFlag: 'devotionals.module_enabled' },
  { tab: 'estudos', label: 'Estudos & mídias', area: 'Conteúdo', description: 'Biblioteca de ensino.', icon: '📚', keywords: 'estudo ensino mídia', featureFlag: 'studies.module_enabled' },
  { tab: 'bible_config', label: 'Bíblia', area: 'Conteúdo', description: 'Versões e experiência bíblica.', icon: '📖', keywords: 'biblia versão sagrada', featureFlag: 'bible.module_enabled' },
  { tab: 'operations_workspace', label: 'Loja & Operações', area: 'Operações', description: 'Área de trabalho do PDV.', icon: '🛍️', keywords: 'loja pdv operação pedido', featureFlag: 'pdv.module_enabled' },
  { tab: 'pdv_pedidos', label: 'Monitor de pedidos', area: 'Operações', description: 'Fluxo de pedidos em tempo real.', icon: '🧾', keywords: 'pedido venda kanban pdv', featureFlag: 'pdv.order_kanban_monitor' },
  { tab: 'pdv_produtos', label: 'Produtos & estoque', area: 'Operações', description: 'Catálogo, preços e disponibilidade.', icon: '🛍️', keywords: 'produto estoque catálogo preço', featureFlag: 'pdv.stock_inventory' },
  { tab: 'finance_workspace', label: 'Finanças', area: 'Finanças', description: 'Área de trabalho financeira.', icon: '💳', keywords: 'financeiro tesouraria dinheiro', featureFlag: 'financial.module_enabled', roles: ['SUPERADMIN', 'PASTOR', 'ADMIN', 'TREASURER'] },
  { tab: 'financial_treasury', label: 'Tesouraria & DRE', area: 'Finanças', description: 'Entradas, saídas, saldo e relatórios.', icon: '📈', keywords: 'dre tesouraria entrada saída saldo', featureFlag: 'financial.cashflow_ledger', roles: ['SUPERADMIN', 'PASTOR', 'ADMIN', 'TREASURER'] },
  { tab: 'financial_projects', label: 'Campanhas & projetos', area: 'Finanças', description: 'Metas e arrecadações.', icon: '🎯', keywords: 'campanha projeto meta arrecadação', featureFlag: 'financial.cashflow_ledger', roles: ['SUPERADMIN', 'PASTOR', 'ADMIN', 'TREASURER'] },
  { tab: 'pagarme_financeiro', label: 'Gateway de pagamento', area: 'Finanças', description: 'Pix, cartões e conexão financeira.', icon: '🔐', keywords: 'gateway pagarme pix cartão', featureFlag: 'financial.credit_card_gateway', roles: ['SUPERADMIN', 'PASTOR', 'ADMIN', 'TREASURER'] },
  { tab: 'administration_workspace', label: 'Administração', area: 'Administração', description: 'Configurações gerais da organização.', icon: '🏛️', keywords: 'administração configuração igreja', roles: ['SUPERADMIN', 'PASTOR', 'ADMIN'] },
  { tab: 'campuses', label: 'Igreja & unidades', area: 'Administração', description: 'Sede, filiais e congregações.', icon: '🏢', keywords: 'campus unidade filial congregação sede', featureFlag: 'system.multicampus_enabled', roles: ['SUPERADMIN', 'PASTOR', 'ADMIN'] },
  { tab: 'church_branding', label: 'Marca & PWA', area: 'Administração', description: 'Logotipo, cores e identidade.', icon: '🎨', keywords: 'marca logo cor pwa identidade', featureFlag: 'system.custom_theme_colors', roles: ['SUPERADMIN', 'PASTOR', 'ADMIN'] },
  { tab: 'feature_flags', label: 'Módulos da plataforma', area: 'Administração', description: 'Recursos disponíveis para a igreja.', icon: '✨', keywords: 'módulo feature flag recurso', featureFlag: 'system.saas_subscription_portal', roles: ['SUPERADMIN', 'PASTOR', 'ADMIN'] },
  { tab: 'my_subscription', label: 'Assinatura Faith-Hub', area: 'Administração', description: 'Plano, cobrança e situação.', icon: '💎', keywords: 'assinatura plano cobrança saas', featureFlag: 'system.saas_subscription_portal', roles: ['SUPERADMIN', 'PASTOR', 'ADMIN'] },
  { tab: 'security_audit', label: 'Auditoria & LGPD', area: 'Administração', description: 'Segurança e rastreabilidade.', icon: '🛡️', keywords: 'auditoria segurança lgpd log', roles: ['SUPERADMIN', 'PASTOR', 'ADMIN'] },
  { tab: 'configuracoes', label: 'Configurações avançadas', area: 'Administração', description: 'Infraestrutura e integrações técnicas.', icon: '🔧', keywords: 'configuração integração infraestrutura', roles: ['SUPERADMIN', 'PASTOR', 'ADMIN'] }
];

export function destinationFor(tab: string): StudioDestination | undefined {
  return STUDIO_DESTINATIONS.find(item => item.tab === tab);
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function allowed(destination: StudioDestination, role: string, isFeatureEnabled: (key: string) => boolean): boolean {
  if (destination.roles && !destination.roles.includes(role)) return false;
  return !destination.featureFlag || isFeatureEnabled(destination.featureFlag);
}

export function StudioSearchTrigger() {
  const { searchEnabled, setSearchOpen } = useStudioExperience();
  return (
    <button type="button" className={`search-pill studio-search-trigger ${searchEnabled ? '' : 'is-disabled'}`} onClick={() => searchEnabled && setSearchOpen(true)} disabled={!searchEnabled}>
      <span className="studio-search-icon" aria-hidden="true">⌕</span>
      <span>{searchEnabled ? 'Buscar pessoas, documentos ou ações…' : 'Busca global indisponível'}</span>
      {searchEnabled && <kbd>⌘K</kbd>}
    </button>
  );
}

interface FavoritesProps {
  role: string;
  onCloseMobile: () => void;
}

export function StudioFavoritesNav({ role, onCloseMobile }: FavoritesProps) {
  const { preferences, personalizationEnabled, navigate } = useStudioExperience();
  const { isFeatureEnabled } = useFeatureFlags();
  const items = preferences.favorite_tabs
    .map(destinationFor)
    .filter((item): item is StudioDestination => Boolean(item && allowed(item, role, isFeatureEnabled)));
  if (!personalizationEnabled || items.length === 0) return null;
  return (
    <div className="studio-favorites-nav">
      <div className="nav-category">Favoritos</div>
      {items.slice(0, 4).map(item => (
        <button key={item.tab} type="button" className="nav-item-btn favorite-nav-item" onClick={() => { navigate(item.tab); onCloseMobile(); }}>
          <span className="nav-item-left"><span className="favorite-nav-icon">{item.icon}</span><span>{item.label}</span></span>
          <span aria-hidden="true">★</span>
        </button>
      ))}
    </div>
  );
}

interface PaletteProps {
  organizationId: string;
  campusId: string;
  role: string;
}

type PaletteItem = StudioDestination & { remoteKind?: 'member' | 'document'; remoteId?: string };

export function StudioCommandPalette({ organizationId, campusId, role }: PaletteProps) {
  const {
    searchEnabled, searchOpen, setSearchOpen, navigate, preferences, personalizationEnabled,
    toggleFavorite, isFavorite
  } = useStudioExperience();
  const { isFeatureEnabled } = useFeatureFlags();
  const [term, setTerm] = useState('');
  const [remote, setRemote] = useState<StudioRemoteSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleDestinations = useMemo(() => STUDIO_DESTINATIONS.filter(item => allowed(item, role, isFeatureEnabled)), [isFeatureEnabled, role]);
  const localResults = useMemo(() => {
    const query = normalize(term.trim());
    if (!query) {
      const orderedTabs = [...preferences.favorite_tabs, ...preferences.recent_tabs.map(item => item.tab)];
      return [...new Set(orderedTabs)].map(tab => visibleDestinations.find(item => item.tab === tab)).filter(Boolean).slice(0, 8) as StudioDestination[];
    }
    return visibleDestinations.filter(item => normalize(`${item.label} ${item.area} ${item.description} ${item.keywords}`).includes(query)).slice(0, 10);
  }, [preferences.favorite_tabs, preferences.recent_tabs, term, visibleDestinations]);

  const allResults: PaletteItem[] = useMemo(() => [
    ...localResults,
    ...remote.map(item => ({
      tab: item.tab, label: item.title, area: item.kind === 'member' ? 'Pessoa' : 'Documento',
      description: item.subtitle, icon: item.kind === 'member' ? '👤' : '📄', keywords: '',
      remoteKind: item.kind, remoteId: item.id
    }))
  ], [localResults, remote]);

  useEffect(() => {
    if (!searchEnabled) return;
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setSearchOpen(true);
      }
      if (event.key === 'Escape' && searchOpen) setSearchOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchEnabled, searchOpen, setSearchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    setTerm(''); setRemote([]); setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen || term.trim().length < 2) { setRemote([]); setSearching(false); return; }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(() => {
      searchStudio(organizationId, campusId, term.trim(), controller.signal)
        .then(setRemote).catch(error => { if (error?.name !== 'AbortError') setRemote([]); })
        .finally(() => setSearching(false));
    }, 260);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [campusId, organizationId, searchOpen, term]);

  useEffect(() => setActiveIndex(0), [term, remote.length]);

  if (!searchEnabled || !searchOpen) return null;
  const select = (item: PaletteItem) => navigate(item.tab);
  return createPortal(
    <div className="studio-command-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && setSearchOpen(false)}>
      <section className="studio-command-palette" role="dialog" aria-modal="true" aria-label="Busca global do Studio">
        <div className="studio-command-input-row">
          <span aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            value={term}
            onChange={event => setTerm(event.target.value)}
            placeholder="Busque uma pessoa, documento, tela ou ação…"
            onKeyDown={event => {
              if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex(index => Math.min(allResults.length - 1, index + 1)); }
              if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex(index => Math.max(0, index - 1)); }
              if (event.key === 'Enter' && allResults[activeIndex]) { event.preventDefault(); select(allResults[activeIndex]); }
            }}
          />
          {searching ? <span className="studio-searching">Buscando…</span> : <kbd>ESC</kbd>}
        </div>
        <div className="studio-command-body">
          {!term && <div className="studio-command-section-label">{personalizationEnabled && localResults.length ? 'Favoritos e recentes' : 'Acesso rápido'}</div>}
          {term && <div className="studio-command-section-label">Resultados para “{term}”</div>}
          {allResults.length === 0 && !searching ? (
            <div className="studio-command-empty"><strong>Nenhum resultado encontrado</strong><span>Tente buscar pelo nome de uma pessoa, documento ou atividade.</span></div>
          ) : (
            <div className="studio-command-results">
              {allResults.map((item, index) => (
                <div key={`${item.remoteKind || 'nav'}-${item.remoteId || item.tab}-${index}`} className={`studio-command-result ${activeIndex === index ? 'is-active' : ''}`}>
                  <button type="button" className="studio-command-result-main" onMouseEnter={() => setActiveIndex(index)} onClick={() => select(item)}>
                    <span className="studio-command-result-icon">{item.icon}</span>
                    <span><strong>{item.label}</strong><small>{item.area} · {item.description}</small></span>
                  </button>
                  {!item.remoteKind && personalizationEnabled && (
                    <button type="button" className={`studio-result-favorite ${isFavorite(item.tab) ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(item.tab)} aria-label={isFavorite(item.tab) ? `Remover ${item.label} dos favoritos` : `Favoritar ${item.label}`}>★</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <footer className="studio-command-footer"><span>↑↓ navegar</span><span>↵ abrir</span><span>⌘K buscar</span></footer>
      </section>
    </div>, document.body
  );
}
