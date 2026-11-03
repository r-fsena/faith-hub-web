import { useCallback, useEffect, useState } from "react";
import { getAuthHeaders } from "../services/apiClient";
import { useFeatureFlags } from "../context/FeatureFlagContext";
import "./public-journey.css";
const API =
  import.meta.env.VITE_API_URL ||
  "https://usl72lj2m5.execute-api.us-east-2.amazonaws.com";
interface Request {
  id: string;
  church_name: string;
  contact_name: string;
  owner_email?: string;
  contact_phone?: string;
  plan_id: string;
  mode: string;
  status: string;
  organization_id?: string;
  trial_started_at?: string;
  trial_expires_at?: string;
  created_at?: string;
}
const statusName: Record<string, string> = {
  DRAFT: "Cadastro iniciado",
  TRIAL_REQUESTED: "Aguardando aprovação",
  TRIAL_READY: "Pronto para iniciar",
  TRIAL_ACTIVE: "Teste em andamento",
  CHECKOUT_PENDING: "Aguardando pagamento",
  ACTIVE: "Assinatura ativa",
};
async function call(path: string, body?: unknown) {
  const res = await fetch(`${API}/public/journey${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: await getAuthHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw Error(data.message || "Não foi possível concluir.");
  return data;
}
export function PublicJourneyRequests() {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();
  const enabled = isFeatureEnabled("system.saas_public_journey", false);
  const [rows, setRows] = useState<Request[]>([]),
    [loading, setLoading] = useState(false),
    [pending, setPending] = useState(""),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("ALL");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await call("/admin")).requests);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);
  async function approve(row: Request) {
    if (
      !window.confirm(
        `Preparar e liberar o teste Conectar de ${row.church_name}? Os 14 dias começarão somente quando o responsável confirmar o início.`,
      )
    )
      return;
    setPending(row.id);
    setError("");
    try {
      await call(`/admin/${row.id}/approve`, {});
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending("");
    }
  }
  if (isLoading) return <p>Carregando jornada…</p>;
  if (!enabled) return <p>Jornada pública indisponível neste ambiente.</p>;
  const visible = rows.filter((r) => filter === "ALL" || r.status === filter);
  return (
    <section className="pj-master">
      <header>
        <div>
          <span className="pj-eyebrow">AQUISIÇÃO E ATIVAÇÃO</span>
          <h1>Jornada digital</h1>
          <p>
            Acompanhe contratações e prepare os testes assistidos do Conectar.
          </p>
        </div>
        <button
          type="button"
          className="pj-button"
          disabled={loading}
          onClick={() => void load()}
        >
          Atualizar
        </button>
      </header>
      <div className="pj-filters">
        <label>
          Etapa
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">Todas as solicitações</option>
            {Object.entries(statusName).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <a href="https://faithhubs.com/planos" target="_blank" rel="noreferrer">
          Abrir jornada pública ↗
        </a>
      </div>
      {error && (
        <p role="alert" className="pj-error">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Carregando solicitações…</p>
      ) : !visible.length ? (
        <div className="pj-empty">
          Nenhuma solicitação nesta etapa. Novos cadastros do site aparecerão
          aqui.
        </div>
      ) : (
        <div className="pj-requests">
          {visible.map((row) => (
            <article key={row.id}>
              <div className="pj-request-heading">
                <span className="pj-tag">
                  {row.mode === "TRIAL"
                    ? "Teste assistido Conectar"
                    : row.plan_id}
                </span>
                <span>{statusName[row.status] || row.status}</span>
              </div>
              <h2>{row.church_name}</h2>
              <p>{row.contact_name}</p>
              <a href={`mailto:${row.owner_email}`}>{row.owner_email}</a>
              {row.contact_phone && <p>{row.contact_phone}</p>}
              {row.trial_expires_at && (
                <p>
                  Até{" "}
                  {new Date(row.trial_expires_at).toLocaleDateString("pt-BR")}
                </p>
              )}
              {row.status === "TRIAL_REQUESTED" ? (
                <>
                  <p className="pj-note">
                    Uma sede e até 300 membros. A confirmação do responsável
                    inicia os 14 dias; não há cartão ou cobrança automática.
                  </p>
                  <button
                    className="pj-button"
                    disabled={!!pending}
                    onClick={() => void approve(row)}
                  >
                    {pending === row.id
                      ? "Preparando…"
                      : "Preparar e liberar teste"}
                  </button>
                </>
              ) : row.organization_id ? (
                <p className="pj-note">
                  Ambiente vinculado. Abra a igreja na área de redes para
                  auxiliar a configuração.
                </p>
              ) : (
                <p className="pj-note">
                  Ambiente será liberado após a confirmação financeira.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
export function PublicJourneyOnboarding({
  organizationId,
  onNavigate,
  onActivated,
}: {
  organizationId: string;
  onNavigate: (tab: string) => void;
  onActivated?: () => void;
}) {
  const { isFeatureEnabled } = useFeatureFlags();
  const enabled = isFeatureEnabled("system.saas_public_onboarding", false);
  const multi = isFeatureEnabled("system.multicampus_enabled", false);
  const [request, setRequest] = useState<Request | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    if (enabled)
      void call("/current")
        .then((data) => {
          if (active && data.request?.organization_id === organizationId)
            setRequest(data.request);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled, organizationId]);
  if (!enabled || !request) return null;
  async function start() {
    setBusy(true);
    setError("");
    try {
      setRequest(
        (await call(`/requests/${request!.id}/start-trial`, {})).request,
      );
      onActivated?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="pj-onboarding">
      <div>
        <span className="pj-eyebrow">BEM-VINDO À SUA IGREJA DIGITAL</span>
        <h2>
          {request.status === "TRIAL_READY"
            ? "Seu Conectar está pronto para começar"
            : request.mode === "TRIAL" && request.status !== "ACTIVE"
              ? "Seu teste Conectar de 14 dias"
              : "Vamos preparar seu ambiente"}
        </h2>
        <p>
          A sede já está criada. Confirme os dados, personalize a identidade e
          convide sua equipe.
        </p>
      </div>
      {request.status === "TRIAL_READY" && (
        <div className="pj-start">
          <p>
            Você já recebeu o acesso. Confirme abaixo quando estiver pronto; os
            14 dias começam agora, sem cartão ou cobrança automática.
          </p>
          <button
            className="pj-button"
            disabled={busy}
            onClick={() => void start()}
          >
            {busy ? "Iniciando…" : "Iniciar meus 14 dias"}
          </button>
        </div>
      )}
      {request.trial_expires_at && (
        <p>
          Teste até{" "}
          <strong>
            {new Date(request.trial_expires_at).toLocaleDateString("pt-BR")}
          </strong>
          .{" "}
          <a href="https://faithhubs.com/contratar">
            Contratar e manter meus dados ↗
          </a>
        </p>
      )}
      {request.status !== "TRIAL_READY" && (
        <div className="pj-steps">
          <button onClick={() => onNavigate("campuses")}>
            1 · Confirmar a sede
          </button>
          <button onClick={() => onNavigate("church_branding")}>
            2 · Personalizar identidade
          </button>
          {multi && (
            <button onClick={() => onNavigate("campuses")}>
              3 · Cadastrar filiais
            </button>
          )}
          <button onClick={() => onNavigate("membros")}>
            {multi ? "4" : "3"} · Convidar equipe e importar membros
          </button>
        </div>
      )}
      {!multi && (
        <p className="pj-note">
          Sua oferta inclui uma unidade. A gestão de filiais está disponível no
          Gestão ou por proposta Enterprise.
        </p>
      )}
      {error && (
        <p role="alert" className="pj-error">
          {error}
        </p>
      )}
    </section>
  );
}
