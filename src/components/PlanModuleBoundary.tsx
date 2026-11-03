import type { ReactNode } from 'react';
import { useFeatureFlags } from '../context/FeatureFlagContext';

const tabFlags: Record<string, string> = {
  visitantes: 'visitors.module_enabled', pastoral_radar: 'pastoral.module_enabled',
  ministries_workspace: 'ministries.module_enabled', ministerios: 'ministries.module_enabled', escalas: 'volunteers.module_enabled',
  operations_workspace: 'pdv.module_enabled', pdv_produtos: 'pdv.module_enabled', pdv_pedidos: 'pdv.module_enabled', pdv_estoque: 'pdv.stock_inventory',
  eventos: 'events.module_enabled', financial_treasury: 'financial.cashflow_ledger', financial_projects: 'financial.special_projects',
  pagarme_financeiro: 'financial.credit_card_gateway', secretariat_workspace: 'secretariat.module_enabled'
};

export function PlanModuleBoundary({ tab, children }: { tab: string; children: ReactNode }) {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();
  const flag = tabFlags[tab] || (tab.startsWith('kids_') ? 'kids.module_enabled' : tab.startsWith('secretariat_') ? 'secretariat.module_enabled' : undefined);
  if (flag && isLoading) return null;
  if (flag && !isFeatureEnabled(flag)) return <div className="portal-card" style={{ padding: 24 }} role="status">Este módulo não está disponível para esta igreja. Consulte o administrador.</div>;
  return <>{children}</>;
}
