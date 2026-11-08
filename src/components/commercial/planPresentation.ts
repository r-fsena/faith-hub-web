export interface SaasPlan {
  id: string; name: string; description?: string;
  monthly_price: number | null; yearly_price: number | null;
  badge_text?: string; is_popular?: boolean; requires_proposal?: boolean;
  max_members: number | null; max_campuses: number | null;
  features?: string[]; entitlements?: Record<string, boolean>; status?: string;
}
export const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const quantity = (value: number) => value.toLocaleString('pt-BR');
export interface ModuleGroup { key: string; name: string; description: string; primary: string; prefixes: string[]; }
export const MODULE_GROUPS: ModuleGroup[] = [
  { key: 'intelligence', name: 'Inteligência', description: 'Indicadores, comparações e adoção digital com coleta opcional.', primary: 'intelligence.overview', prefixes: ['intelligence.'] },
  { key: 'members', name: 'Membros e comunidade', description: 'Cadastros, acesso e identificação dos membros.', primary: 'members.module_enabled', prefixes: ['members.'] },
  { key: 'cells', name: 'Células e redes', description: 'Grupos, encontros, presenças e comunhão.', primary: 'cell_groups.module_enabled', prefixes: ['cell_groups.'] },
  { key: 'content', name: 'Ensino e conteúdo', description: 'Estudos, devocionais e leitura bíblica.', primary: 'studies.module_enabled', prefixes: ['studies.', 'devotionals.', 'bible.'] },
  { key: 'communication', name: 'Orações e transmissões', description: 'Intercessão e participação nos cultos.', primary: 'prayers.module_enabled', prefixes: ['prayers.', 'broadcasts.'] },
  { key: 'giving', name: 'Pix e campanhas', description: 'Contribuições, comprovantes e projetos.', primary: 'financial.online_pix_giving', prefixes: [] },
  { key: 'visitors', name: 'Acolhimento', description: 'Visitantes e integração à comunidade.', primary: 'visitors.module_enabled', prefixes: ['visitors.'] },
  { key: 'pastoral', name: 'Cuidado pastoral', description: 'Ausências, contatos e acompanhamento.', primary: 'pastoral.module_enabled', prefixes: ['pastoral.'] },
  { key: 'teams', name: 'Ministérios e escalas', description: 'Equipes, voluntariado e disponibilidade.', primary: 'ministries.module_enabled', prefixes: ['ministries.', 'volunteers.'] },
  { key: 'kids', name: 'Ministério Kids', description: 'Famílias, recepção e retirada segura.', primary: 'kids.module_enabled', prefixes: ['kids.'] },
  { key: 'secretariat', name: 'Secretaria', description: 'Registros, documentos e modelos.', primary: 'secretariat.module_enabled', prefixes: ['secretariat.'] },
  { key: 'finance', name: 'Gestão financeira', description: 'Tesouraria, caixa e demonstrativos.', primary: 'financial.cashflow_ledger', prefixes: [] },
  { key: 'events', name: 'Eventos e ingressos', description: 'Inscrições, lotes e portaria.', primary: 'events.module_enabled', prefixes: ['events.'] },
  { key: 'store', name: 'Loja e estoque', description: 'Produtos, pedidos e operação.', primary: 'pdv.module_enabled', prefixes: ['pdv.'] },
  { key: 'experience', name: 'Gestão e personalização', description: 'Identidade, navegação e indicadores.', primary: 'system.custom_theme_colors', prefixes: ['system.', 'studio.', 'content.', 'pwa.'] }
];
export const LABELS: Record<string, string> = {
  'intelligence.overview': 'Resumo executivo e comparação de períodos',
  'intelligence.usage_collection': 'Medição opcional de uso do PWA',
  'intelligence.activation': 'Funil de convites e ativação medida do PWA',
  'intelligence.member_journey': 'Jornada e coortes de acolhimento',
  'intelligence.actions': 'Ações com responsável, prazo e acompanhamento',
  'intelligence.finance': 'Indicadores financeiros da tesouraria',
  'intelligence.operations': 'Indicadores de eventos, loja, equipes e Kids',
  'intelligence.multicampus': 'Consolidação de indicadores por unidade',
  'intelligence.goals': 'Metas com progresso consultado nas fontes',
  'members.module_enabled': 'Gestão de membros', 'members.self_registration': 'Cadastro pelo membro', 'members.approval_workflow': 'Aprovação de novos cadastros', 'members.digital_card': 'Carteirinha digital', 'members.lgpd_export_consent': 'Consentimento e dados pessoais', 'members.spiritual_timeline': 'Histórico eclesiástico', 'members.custom_fields': 'Campos personalizados',
  'cell_groups.module_enabled': 'Gestão de células', 'cell_groups.attendance_reports': 'Encontros, presenças e relatórios', 'cell_groups.board_posts': 'Mural e publicações', 'cell_groups.join_request_flow': 'Solicitações de participação', 'cell_groups.public_map_locator': 'Localização no mapa', 'cell_groups.snack_partilhas': 'Partilha de lanche',
  'studies.module_enabled': 'Estudos e discipulado', 'studies.cell_targeted_content': 'Conteúdo direcionado a grupos', 'devotionals.module_enabled': 'Devocionais', 'devotionals.member_private_notes': 'Anotações pessoais', 'devotionals.worship_song_embed': 'Louvor nos devocionais',
  'bible.module_enabled': 'Bíblia digital', 'bible.version_switching': 'Seleção de versões', 'bible.daily_verse_card': 'Versículo do dia', 'bible.social_share_card': 'Compartilhamento de versículos',
  'broadcasts.module_enabled': 'Cultos e transmissões', 'broadcasts.inapp_live_alert': 'Aviso de transmissão', 'broadcasts.interactive_chat': 'Chat ao vivo', 'prayers.module_enabled': 'Pedidos de oração', 'prayers.anonymous_allowed': 'Pedidos anônimos', 'prayers.confidential_pastoral': 'Pedidos confidenciais', 'prayers.intercession_counter': 'Registro de intercessão',
  'financial.module_enabled': 'Área de contribuições e finanças', 'financial.online_pix_giving': 'Contribuições por Pix', 'financial.pix_static_official': 'QR Code e copia e cola Pix', 'financial.special_projects': 'Campanhas e metas', 'financial.cashflow_ledger': 'Tesouraria e livro caixa', 'financial.dre_reports': 'Demonstrativo de resultados', 'financial.advanced_reports': 'Indicadores financeiros avançados', 'financial.credit_card_gateway': 'Gateway de cartão', 'financial.member_tax_statement': 'Informe anual de contribuições',
  'visitors.module_enabled': 'Funil de acolhimento', 'pastoral.module_enabled': 'Radar e histórico de cuidado', 'ministries.module_enabled': 'Ministérios e voluntários', 'volunteers.module_enabled': 'Escalas, confirmações e trocas',
  'kids.module_enabled': 'Gestão do Kids', 'kids.allergy_medical_alerts': 'Alergias e restrições', 'kids.emergency_parent_call': 'Chamados de responsáveis', 'kids.express_kiosk_checkin': 'Recepção expressa', 'kids.live_rooms_dashboard': 'Salas e ocupação', 'kids.reports_export': 'Relatórios e exportação', 'kids.secure_checkout_validation': 'Conferência de retirada', 'kids.thermal_badge_printing': 'Impressão de crachás',
  'secretariat.module_enabled': 'Secretaria eclesiástica', 'secretariat.baptisms': 'Batismos', 'secretariat.documents': 'Cartas e documentos', 'secretariat.document_pdf': 'Emissão em PDF', 'secretariat.member_registry': 'Prontuário eclesiástico', 'secretariat.public_verification': 'Validação por QR Code', 'secretariat.template_editor': 'Editor de modelos', 'secretariat.transfers': 'Movimentações e transferências',
  'events.module_enabled': 'Gestão de eventos', 'events.paid_ticketing': 'Lotes e inscrições pagas', 'events.gate_scanner_qrcode': 'Portaria por QR Code', 'events.custom_forms': 'Formulários personalizados',
  'pdv.module_enabled': 'Loja e cantina', 'pdv.catalog_layout': 'Organização do catálogo', 'pdv.mobile_inapp_ordering': 'Pedidos pelo aplicativo', 'pdv.order_kanban_monitor': 'Monitor de pedidos', 'pdv.stock_inventory': 'Estoque e reservas', 'pdv.counter_quick_sale': 'Venda rápida no balcão', 'pdv.delivery_mode_home': 'Entrega em domicílio',
  'system.custom_theme_colors': 'Identidade da igreja', 'system.multicampus_enabled': 'Gestão de várias unidades', 'system.saas_subscription_portal': 'Portal da assinatura', 'system.custom_domain': 'Domínio próprio', 'system.pwa_offline_sync': 'Sincronização offline', 'studio.guided_onboarding': 'Orientação no Studio', 'studio.global_search': 'Busca global', 'studio.personalized_navigation': 'Favoritos e navegação', 'studio.context_navigation_v2': 'Navegação por contexto', 'content.analytics_dashboard': 'Indicadores de conteúdo', 'pwa.v2_experience': 'Experiência atual do aplicativo'
};
const GIVING_KEYS = ['financial.module_enabled', 'financial.online_pix_giving', 'financial.pix_static_official', 'financial.special_projects'];
export const UNAVAILABLE = new Set(['members.custom_fields', 'broadcasts.interactive_chat', 'events.custom_forms', 'financial.credit_card_gateway', 'financial.member_tax_statement', 'pdv.counter_quick_sale', 'pdv.delivery_mode_home', 'system.custom_domain', 'system.pwa_offline_sync']);
export function groupKeys(group: ModuleGroup, flags: Record<string, boolean>) {
  return Object.keys(flags).filter(key => key !== 'system.plan_entitlements' && (group.key === 'giving' ? GIVING_KEYS.includes(key) : group.key === 'finance' ? key.startsWith('financial.') && !GIVING_KEYS.includes(key) : group.prefixes.some(prefix => key.startsWith(prefix))));
}
export function includedGroups(plan: Pick<SaasPlan, 'entitlements'>) {
  return MODULE_GROUPS.filter(group => groupKeys(group, plan.entitlements || {}).some(key => plan.entitlements?.[key]));
}
export function planHighlights(plan: SaasPlan) {
  const priority = ['secretariat', 'finance', 'events', 'store', 'visitors', 'pastoral', 'teams', 'kids', 'members', 'cells', 'content', 'communication', 'giving', 'experience', 'intelligence'];
  return includedGroups(plan).sort((a, b) => priority.indexOf(a.key) - priority.indexOf(b.key)).slice(0, 4);
}
export function toggleEntitlement(current: Record<string, boolean>, key: string, enabled: boolean) {
  const next = { ...current, [key]: enabled };
  const prefix = key.split('.')[0];
  if (key.endsWith('.module_enabled') && !enabled) {
    for (const child of Object.keys(next)) if (child.startsWith(`${prefix}.`)) next[child] = false;
  } else if (enabled && `${prefix}.module_enabled` in next) next[`${prefix}.module_enabled`] = true;
  if (key === 'ministries.module_enabled' && !enabled) next['volunteers.module_enabled'] = false;
  if (key === 'volunteers.module_enabled' && enabled) next['ministries.module_enabled'] = true;
  if (key === 'financial.cashflow_ledger' && !enabled) { next['financial.dre_reports'] = false; next['financial.advanced_reports'] = false; }
  if (enabled && ['financial.dre_reports', 'financial.advanced_reports'].includes(key)) next['financial.cashflow_ledger'] = true;
  if (key === 'secretariat.documents' && !enabled) for (const child of ['secretariat.document_pdf', 'secretariat.public_verification', 'secretariat.template_editor']) next[child] = false;
  if (enabled && ['secretariat.document_pdf', 'secretariat.public_verification', 'secretariat.template_editor'].includes(key)) next['secretariat.documents'] = true;
  return next;
}
