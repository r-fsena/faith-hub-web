import { useEffect, useMemo, useState } from 'react';
import { getAuthHeaders } from '../services/apiClient';
import './OperationsOverview.css';
import './ContentOverview.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';
type PeriodPreset = 'current_month' | '7d' | '30d' | '90d' | 'custom';

interface ModuleMetrics {
  published?: number; users?: number; interactions?: number; opens?: number; starts?: number;
  completions?: number; cta_clicks?: number; notes?: number; upcoming?: number; registrations?: number;
  checkins?: number; revenue?: number; capacity?: number; calendar_days?: number; active_series?: number;
  chapters?: number; participants?: number; completed_chapters?: number; measured?: boolean;
}

interface ContentAnalytics {
  period: { start_date: string; end_date: string };
  measurement: { behavioral_tracking_started_at: string; bible_included: boolean; zero_means: string };
  summary: { published_content: number; engaged_users: number; interactions: number; completions: number };
  events: ModuleMetrics; broadcasts: ModuleMetrics; devotionals: ModuleMetrics; studies: ModuleMetrics;
  activity_by_day: Array<{ activity_date: string; interactions: number; users: number; completions: number }>;
}

interface Props { organizationId: string; campusId: string; onNavigate: (tab: string) => void; }
const n = (value: unknown) => Number(value || 0);

function inputDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function presetRange(preset: Exclude<PeriodPreset, 'custom'>) {
  const end = new Date(); const start = new Date(end);
  if (preset === 'current_month') start.setDate(1);
  if (preset === '7d') start.setDate(end.getDate() - 6);
  if (preset === '30d') start.setDate(end.getDate() - 29);
  if (preset === '90d') start.setDate(end.getDate() - 89);
  return { start: inputDate(start), end: inputDate(end) };
}

function rate(part: unknown, total: unknown): string {
  const denominator = n(total);
  return denominator ? `${Math.round((n(part) / denominator) * 100)}%` : '—';
}

export function ContentOverview({ organizationId, campusId, onNavigate }: Props) {
  const initial = useMemo(() => presetRange('current_month'), []);
  const [preset, setPreset] = useState<PeriodPreset>('current_month');
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [data, setData] = useState<ContentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  const choosePeriod = (next: PeriodPreset) => {
    setPreset(next);
    if (next !== 'custom') { const range = presetRange(next); setStartDate(range.start); setEndDate(range.end); }
  };

  useEffect(() => {
    if (!startDate || !endDate || startDate > endDate) return;
    const controller = new AbortController();
    const load = async () => {
      setLoading(true); setError('');
      try {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams({ organization_id: organizationId, start_date: startDate, end_date: endDate });
        if (campusId && campusId !== 'all') params.set('campus_id', campusId);
        const response = await fetch(`${API_URL}/content/analytics?${params}`, { headers, signal: controller.signal });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || 'Não foi possível carregar os indicadores de conteúdo.');
        setData(payload);
      } catch (current: any) {
        if (current.name !== 'AbortError') setError(current.message || 'Não foi possível carregar os indicadores de conteúdo.');
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    load(); return () => controller.abort();
  }, [campusId, endDate, organizationId, refresh, startDate]);

  const modules = data ? [
    { key: 'events', icon: '📅', title: 'Eventos', tab: 'eventos', data: data.events, facts: [
      ['Próximos', n(data.events.upcoming)], ['Inscrições', n(data.events.registrations)], ['Check-ins', n(data.events.checkins)], ['Presença', rate(data.events.checkins, data.events.registrations)]
    ] },
    { key: 'broadcasts', icon: '🔴', title: 'Cultos & transmissões', tab: 'transmissoes', data: data.broadcasts, facts: [
      ['Disponíveis', n(data.broadcasts.published)], ['Pessoas', n(data.broadcasts.users)], ['Inícios', n(data.broadcasts.starts)], ['Ações', n(data.broadcasts.cta_clicks)]
    ] },
    { key: 'devotionals', icon: '☀️', title: 'Devocionais', tab: 'devocionais', data: data.devotionals, facts: [
      ['Publicados', n(data.devotionals.published)], ['Dias cobertos', n(data.devotionals.calendar_days)], ['Aberturas', n(data.devotionals.opens)], ['Conclusão', rate(data.devotionals.completions, data.devotionals.opens)]
    ] },
    { key: 'studies', icon: '📚', title: 'Estudos', tab: 'estudos', data: data.studies, facts: [
      ['Séries ativas', n(data.studies.active_series)], ['Capítulos', n(data.studies.chapters)], ['Participantes', n(data.studies.participants)], ['Concluídos', n(data.studies.completed_chapters)]
    ] }
  ] : [];
  const maxActivity = Math.max(1, ...(data?.activity_by_day || []).map(point => n(point.interactions)));

  return <section className="operations-intelligence content-intelligence" aria-labelledby="content-intelligence-title">
    <div className="operations-intelligence-header">
      <div><span>Inteligência de conteúdo</span><h2 id="content-intelligence-title">Alcance, jornada e conclusão por módulo</h2><p>Eventos, transmissões, devocionais e estudos. Bíblia não participa desta medição.</p></div>
      <div className="operations-period-filter"><label htmlFor="content-period">Período</label><select id="content-period" value={preset} onChange={event => choosePeriod(event.target.value as PeriodPreset)}>
        <option value="current_month">Este mês</option><option value="7d">Últimos 7 dias</option><option value="30d">Últimos 30 dias</option><option value="90d">Últimos 90 dias</option><option value="custom">Personalizado</option>
      </select>{preset === 'custom' && <div className="operations-custom-period"><input type="date" value={startDate} max={endDate} onChange={event => setStartDate(event.target.value)} /><span>até</span><input type="date" value={endDate} min={startDate} onChange={event => setEndDate(event.target.value)} /></div>}</div>
    </div>

    {error && <div className="operations-error"><div><strong>Indicadores indisponíveis</strong><span>{error}</span></div><button type="button" onClick={() => setRefresh(value => value + 1)}>Tentar novamente</button></div>}
    {loading && !data ? <div className="operations-loading-grid">{Array.from({ length: 8 }, (_, index) => <div key={index} />)}</div> : data && <>
      <div className="content-measurement-note"><span>● Medição comportamental ativa desde {new Date(`${data.measurement.behavioral_tracking_started_at}T12:00:00`).toLocaleDateString('pt-BR')}</span><small>Zero significa nenhuma ocorrência registrada no período; não significa falha de carregamento.</small></div>
      <div className="operations-kpi-grid">
        <div className="operations-kpi tone-brand"><span>Conteúdos disponíveis</span><strong>{n(data.summary.published_content)}</strong><small>Publicados ou ativos agora</small></div>
        <div className="operations-kpi tone-blue"><span>Pessoas engajadas</span><strong>{n(data.summary.engaged_users)}</strong><small>Usuários ou sessões únicas</small></div>
        <div className="operations-kpi tone-violet"><span>Interações reais</span><strong>{n(data.summary.interactions)}</strong><small>Aberturas, inícios e ações</small></div>
        <div className="operations-kpi tone-amber"><span>Conclusões</span><strong>{n(data.summary.completions) + n(data.studies.completed_chapters)}</strong><small>Jornadas concluídas no período</small></div>
      </div>
      <div className="content-module-grid">{modules.map(module => <button type="button" key={module.key} className="content-module-card" onClick={() => onNavigate(module.tab)}>
        <div className="content-module-heading"><span>{module.icon}</span><div><strong>{module.title}</strong><small>Monitoramento ativo</small></div><b>→</b></div>
        <div className="content-module-facts">{module.facts.map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</div>
      </button>)}</div>
      <article className="operations-panel content-activity-panel"><div className="operations-panel-heading"><div><span>Comportamento da comunidade</span><h3>Interações registradas por dia</h3></div><small>Não inclui carregamentos automáticos</small></div>
        {data.activity_by_day.length === 0 ? <div className="operations-empty"><strong>A medição está pronta</strong><span>Os dados surgirão conforme as pessoas interagirem com os conteúdos no PWA.</span></div> : <div className="content-activity-bars">{data.activity_by_day.map(point => <div key={point.activity_date} title={`${point.activity_date}: ${n(point.interactions)} interações`}><i style={{ height: `${Math.max(7, n(point.interactions) / maxActivity * 100)}%` }} /><span>{new Date(`${point.activity_date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></div>)}</div>}
      </article>
    </>}
  </section>;
}
