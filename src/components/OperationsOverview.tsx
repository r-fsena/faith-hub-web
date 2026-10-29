import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '../services/apiClient';
import './OperationsOverview.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

type PeriodPreset = 'today' | 'current_month' | '7d' | '30d' | '90d' | 'custom';

interface SalesPoint {
  sale_date: string;
  weekday: number;
  orders: number;
  revenue: number;
}

interface WeekdayPoint {
  weekday: number;
  label: string;
  orders: number;
  revenue: number;
}

interface ProductInsight {
  product_id: string;
  name: string;
  category: string;
  unit: string;
  orders: number;
  quantity_sold: number;
  revenue: number;
  track_inventory: boolean;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  minimum_stock: number;
}

interface AttentionProduct {
  product_id: string;
  name: string;
  category: string;
  unit: string;
  campus_name: string;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  minimum_stock: number;
  stock_status: 'OUT_OF_STOCK' | 'LOW_STOCK';
}

interface OperationsAnalytics {
  period: { start_date: string; end_date: string };
  inventory_enabled: boolean;
  summary: { gross_sales: number; paid_orders: number; units_sold: number; average_ticket: number };
  sales_by_day: SalesPoint[];
  sales_by_weekday: WeekdayPoint[];
  top_groups: Array<{ category: string; orders: number; quantity_sold: number; revenue: number }>;
  top_products: ProductInsight[];
  attention_products: AttentionProduct[];
}

interface OperationsOverviewProps {
  organizationId: string;
  campusId: string;
  onNavigate: (tab: string) => void;
}

function inputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function presetRange(preset: Exclude<PeriodPreset, 'custom'>): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end);
  if (preset === 'current_month') start.setDate(1);
  if (preset === '7d') start.setDate(end.getDate() - 6);
  if (preset === '30d') start.setDate(end.getDate() - 29);
  if (preset === '90d') start.setDate(end.getDate() - 89);
  return { start: inputDate(start), end: inputDate(end) };
}

function money(value: number): string {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function quantity(value: number): string {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

function shortDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
}

function stockStatus(product: ProductInsight): { label: string; tone: string } {
  if (!product.track_inventory) return { label: 'Não monitorado', tone: 'neutral' };
  if (product.available_quantity <= 0) return { label: 'Sem estoque', tone: 'danger' };
  if (product.available_quantity <= product.minimum_stock) return { label: 'Estoque baixo', tone: 'warning' };
  return { label: 'Normal', tone: 'healthy' };
}

export function OperationsOverview({ organizationId, campusId, onNavigate }: OperationsOverviewProps) {
  const initialRange = useMemo(() => presetRange('current_month'), []);
  const [preset, setPreset] = useState<PeriodPreset>('current_month');
  const [startDate, setStartDate] = useState(initialRange.start);
  const [endDate, setEndDate] = useState(initialRange.end);
  const [data, setData] = useState<OperationsAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  const handlePreset = (nextPreset: PeriodPreset) => {
    setPreset(nextPreset);
    if (nextPreset !== 'custom') {
      const range = presetRange(nextPreset);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  useEffect(() => {
    if (!startDate || !endDate || startDate > endDate) return;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams({ organization_id: organizationId, start_date: startDate, end_date: endDate });
        if (campusId && campusId !== 'all') params.set('campus_id', campusId);
        const response = await fetch(`${API_URL}/pdv/analytics?${params}`, { headers, signal: controller.signal });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || 'Não foi possível carregar os indicadores da loja.');
        setData(payload);
      } catch (currentError: any) {
        if (currentError.name !== 'AbortError') setError(currentError.message || 'Não foi possível carregar os indicadores da loja.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [campusId, endDate, organizationId, refreshToken, startDate]);

  const dailySeries = useMemo(() => {
    const values = new Map((data?.sales_by_day || []).map(point => [point.sale_date, point]));
    const result: SalesPoint[] = [];
    const cursor = new Date(`${startDate}T12:00:00`);
    const end = new Date(`${endDate}T12:00:00`);
    while (cursor <= end && result.length <= 366) {
      const date = inputDate(cursor);
      result.push(values.get(date) || { sale_date: date, weekday: (cursor.getDay() + 6) % 7, orders: 0, revenue: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [data?.sales_by_day, endDate, startDate]);

  const maxDailyOrders = Math.max(1, ...dailySeries.map(point => point.orders));
  const maxWeekdayOrders = Math.max(1, ...(data?.sales_by_weekday || []).map(point => point.orders));
  const maxGroupQuantity = Math.max(1, ...(data?.top_groups || []).map(group => group.quantity_sold));
  const bestWeekday = [...(data?.sales_by_weekday || [])].sort((left, right) => right.orders - left.orders)[0];

  return (
    <section className="operations-intelligence" aria-labelledby="operations-intelligence-title">
      <div className="operations-intelligence-header">
        <div>
          <span>Inteligência da operação</span>
          <h2 id="operations-intelligence-title">Vendas, produtos e estoque em uma única visão</h2>
          <p>Somente pedidos pagos e não cancelados entram nos indicadores.</p>
        </div>
        <div className="operations-period-filter">
          <label htmlFor="operations-period">Período</label>
          <select id="operations-period" value={preset} onChange={event => handlePreset(event.target.value as PeriodPreset)}>
            <option value="today">Hoje</option>
            <option value="current_month">Este mês</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="custom">Personalizado</option>
          </select>
          {preset === 'custom' && (
            <div className="operations-custom-period">
              <input type="date" value={startDate} max={endDate} onChange={event => setStartDate(event.target.value)} aria-label="Data inicial" />
              <span>até</span>
              <input type="date" value={endDate} min={startDate} onChange={event => setEndDate(event.target.value)} aria-label="Data final" />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="operations-error">
          <div><strong>Indicadores indisponíveis</strong><span>{error}</span></div>
          <button type="button" onClick={() => setRefreshToken(value => value + 1)}>Tentar novamente</button>
        </div>
      )}

      {loading && !data ? (
        <div className="operations-loading-grid" aria-label="Carregando indicadores">
          {Array.from({ length: 8 }, (_, index) => <div key={index} />)}
        </div>
      ) : data && (
        <>
          <div className="operations-kpi-grid">
            <button type="button" className="operations-kpi tone-brand" onClick={() => onNavigate('pdv_pedidos')}>
              <span>Vendas no período</span><strong>{money(data.summary.gross_sales)}</strong><small>{data.summary.paid_orders} pedidos pagos</small>
            </button>
            <button type="button" className="operations-kpi tone-blue" onClick={() => onNavigate('pdv_pedidos')}>
              <span>Pedidos pagos</span><strong>{quantity(data.summary.paid_orders)}</strong><small>{bestWeekday?.orders ? `${bestWeekday.label} concentra mais pedidos` : 'Sem concentração no período'}</small>
            </button>
            <div className="operations-kpi tone-violet">
              <span>Itens vendidos</span><strong>{quantity(data.summary.units_sold)}</strong><small>Unidades confirmadas</small>
            </div>
            <div className="operations-kpi tone-amber">
              <span>Ticket médio</span><strong>{money(data.summary.average_ticket)}</strong><small>Valor médio por pedido</small>
            </div>
          </div>

          <div className="operations-dashboard-grid two-columns">
            <article className="operations-panel operations-daily-panel">
              <div className="operations-panel-heading"><div><span>Ritmo de vendas</span><h3>Pedidos pagos por dia</h3></div><small>{shortDate(startDate)} — {shortDate(endDate)}</small></div>
              {data.summary.paid_orders === 0 ? (
                <div className="operations-empty"><strong>Ainda não há vendas pagas</strong><span>O gráfico será preenchido conforme os pagamentos forem confirmados.</span></div>
              ) : (
                <div className="operations-daily-scroll">
                  <div className="operations-daily-chart" style={{ minWidth: Math.max(620, dailySeries.length * 25) }}>
                    {dailySeries.map((point, index) => (
                      <div className="operations-day-column" key={point.sale_date} title={`${shortDate(point.sale_date)}: ${point.orders} pedidos · ${money(point.revenue)}`}>
                        <span className="operations-day-value">{point.orders || ''}</span>
                        <div className="operations-day-track"><i style={{ height: `${Math.max(point.orders ? 7 : 0, (point.orders / maxDailyOrders) * 100)}%` }} /></div>
                        <small>{index === 0 || index === dailySeries.length - 1 || index % Math.ceil(dailySeries.length / 8) === 0 ? shortDate(point.sale_date) : ''}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <article className="operations-panel">
              <div className="operations-panel-heading"><div><span>Comportamento semanal</span><h3>Vendas por dia da semana</h3></div></div>
              <div className="operations-weekdays">
                {data.sales_by_weekday.map(point => (
                  <div className="operations-weekday-row" key={point.weekday}>
                    <strong>{point.label}</strong>
                    <div><i style={{ width: `${(point.orders / maxWeekdayOrders) * 100}%` }} /></div>
                    <span>{point.orders}</span>
                    <small>{money(point.revenue)}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="operations-dashboard-grid product-columns">
            <article className="operations-panel">
              <div className="operations-panel-heading"><div><span>Preferência do público</span><h3>Grupos mais vendidos</h3></div></div>
              {data.top_groups.length === 0 ? <div className="operations-empty compact"><span>Sem grupos vendidos neste período.</span></div> : (
                <div className="operations-group-ranking">
                  {data.top_groups.map((group, index) => (
                    <div key={group.category}>
                      <div><span><b>{index + 1}</b><strong>{group.category}</strong></span><small>{quantity(group.quantity_sold)} itens · {money(group.revenue)}</small></div>
                      <i><span style={{ width: `${(group.quantity_sold / maxGroupQuantity) * 100}%` }} /></i>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="operations-panel operations-products-panel">
              <div className="operations-panel-heading"><div><span>Produtos e disponibilidade</span><h3>10 produtos com maior venda</h3></div><button type="button" onClick={() => onNavigate('pdv_estoque')}>Abrir estoque →</button></div>
              {data.top_products.length === 0 ? <div className="operations-empty compact"><span>Sem produtos vendidos neste período.</span></div> : (
                <div className="operations-table-scroll">
                  <table className="operations-products-table">
                    <thead><tr><th>#</th><th>Produto</th><th>Vendidos</th><th>Faturamento</th><th>Físico</th><th>Reservado</th><th>Disponível</th><th>Situação</th></tr></thead>
                    <tbody>{data.top_products.map((product, index) => {
                      const status = stockStatus(product);
                      return <tr key={product.product_id}>
                        <td><b>{index + 1}</b></td>
                        <td><strong>{product.name}</strong><small>{product.category}</small></td>
                        <td>{quantity(product.quantity_sold)} {product.unit}</td>
                        <td>{money(product.revenue)}</td>
                        <td>{product.track_inventory ? quantity(product.on_hand_quantity) : '—'}</td>
                        <td>{product.track_inventory ? quantity(product.reserved_quantity) : '—'}</td>
                        <td>{product.track_inventory ? quantity(product.available_quantity) : '—'}</td>
                        <td><span className={`operations-stock-badge ${status.tone}`}>{status.label}</span></td>
                      </tr>;
                    })}</tbody>
                  </table>
                </div>
              )}
            </article>
          </div>

          {data.inventory_enabled && (
            <article className="operations-panel operations-attention-panel">
              <div className="operations-panel-heading"><div><span>Reposição e risco</span><h3>Produtos que precisam de atenção</h3></div><button type="button" onClick={() => onNavigate('pdv_estoque')}>Gerenciar estoque →</button></div>
              {data.attention_products.length === 0 ? (
                <div className="operations-all-good"><span>✓</span><div><strong>Estoque sem alertas</strong><small>Nenhum produto monitorado está zerado ou no limite mínimo.</small></div></div>
              ) : (
                <div className="operations-attention-grid">
                  {data.attention_products.map(product => (
                    <button type="button" key={`${product.product_id}-${product.campus_name}`} onClick={() => onNavigate('pdv_estoque')}>
                      <span className={product.stock_status === 'OUT_OF_STOCK' ? 'danger' : 'warning'}>{product.stock_status === 'OUT_OF_STOCK' ? '!' : '↓'}</span>
                      <div><strong>{product.name}</strong><small>{product.campus_name} · mínimo {quantity(product.minimum_stock)} {product.unit}</small></div>
                      <b>{product.stock_status === 'OUT_OF_STOCK' ? 'Sem estoque' : `${quantity(product.available_quantity)} disponíveis`}</b>
                    </button>
                  ))}
                </div>
              )}
            </article>
          )}
        </>
      )}
    </section>
  );
}
