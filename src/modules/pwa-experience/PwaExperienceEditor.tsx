import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { getAuthHeaders } from "../../services/apiClient";
import { useFeatureFlags } from "../../context/FeatureFlagContext";
import {
  EXPERIENCE_FLAG,
  SCREEN_LABELS,
  PALETTE_LABELS,
  BLOCK_LABELS,
  COPY_DEFAULTS,
  defaultExperience,
  merge,
  validatePatch,
  resolveExperience,
  contrastIssues,
  preset,
  onColor,
} from "../../config/pwaExperience";
import type {
  ExperiencePatch,
  ExperienceConfig,
  ScreenId,
} from "../../config/pwaExperience";
import "./editor.css";
const API =
  import.meta.env.VITE_API_URL ||
  "https://usl72lj2m5.execute-api.us-east-2.amazonaws.com";
const PWA = import.meta.env.VITE_PWA_PREVIEW_URL || "https://app.faithhubs.com";
const textLabel = (key: string) =>
  key.endsWith(".title")
    ? "Título"
    : key.endsWith(".subtitle")
      ? "Subtítulo"
      : key.startsWith("navigation.")
        ? "Nome na navegação"
        : key.startsWith("shortcuts.")
          ? "Nome do atalho"
          : key === "auth.action"
            ? "Botão de entrada"
            : key.split(".").pop();
function setPath(value: any, path: string[], next: any) {
  const copy = structuredClone(value);
  let cursor = copy;
  for (const key of path.slice(0, -1)) cursor = cursor[key] ??= {};
  if (next === undefined) delete cursor[path.at(-1)!];
  else cursor[path.at(-1)!] = next;
  return copy;
}
export default function PwaExperienceEditor({
  organizationId,
  initialCampus = "all",
}: {
  organizationId: string;
  initialCampus?: string;
}) {
  const { flags, isFeatureEnabled } = useFeatureFlags();
  const enabled = isFeatureEnabled(EXPERIENCE_FLAG, false);
  const [campus, setCampus] = useState(initialCampus),
    [campuses, setCampuses] = useState<Array<{ id: string; name: string }>>([]);
  const [section, setSection] = useState("appearance"),
    [screen, setScreen] = useState<ScreenId>("home"),
    [mode, setMode] = useState<"light" | "dark">("light"),
    [version, setVersion] = useState("v2"),
    [persona, setPersona] = useState("member");
  const [draft, setDraft] = useState<ExperiencePatch>({}),
    [saved, setSaved] = useState<ExperiencePatch>({}),
    [published, setPublished] = useState<ExperiencePatch>({}),
    [inherited, setInherited] = useState<ExperienceConfig>(defaultExperience());
  const [revision, setRevision] = useState(0),
    [publishedRevision, setPublishedRevision] = useState(0),
    [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [selected, setSelected] = useState("background"),
    [compare, setCompare] = useState(false),
    [mobilePreview, setMobilePreview] = useState(false),
    [connected, setConnected] = useState(false),
    [frameError, setFrameError] = useState("");
  const frame = useRef<HTMLIFrameElement>(null),
    nonce = useRef(crypto.randomUUID()),
    sequence = useRef(0),
    drag = useRef<string | null>(null),
    scopeRef = useRef("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const scope = `${organizationId}:${campus}`;
  const resolved = useMemo(() => merge(inherited, draft), [inherited, draft]);
  const live = useMemo(
    () => merge(inherited, published),
    [inherited, published],
  );
  const issues = useMemo(() => {
    try {
      return contrastIssues(resolved);
    } catch {
      return ["Confira os campos de aparência."];
    }
  }, [resolved]);
  const previewUrl = useMemo(() => {
    const u = new URL("/__pwa-preview", PWA);
    u.searchParams.set("parent_origin", location.origin);
    u.searchParams.set("nonce", nonce.current);
    return u.href;
  }, []);
  async function call(action: string, body?: any) {
    const campusId = campus === "all" ? null : campus;
    const response = await fetch(
      `${API}/pwa-experience/${action}?organization_id=${encodeURIComponent(organizationId)}${campusId ? `&campus_id=${encodeURIComponent(campusId)}` : ""}`,
      {
        method: body === undefined ? "GET" : "POST",
        headers: await getAuthHeaders({ "x-organization-id": organizationId }),
        body:
          body === undefined
            ? undefined
            : JSON.stringify({
                ...body,
                organization_id: organizationId,
                campus_id: campusId,
              }),
      },
    );
    const data = await response.json();
    if (!response.ok)
      throw Error(
        data.message || "Não foi possível concluir. Sua edição foi preservada.",
      );
    return data;
  }
  const load = useCallback(async () => {
    const thisScope = scope;
    scopeRef.current = thisScope;
    setLoading(true);
    setError("");
    try {
      const data = await call("editor");
      if (scopeRef.current !== thisScope) return;
      setRevision(data.revision);
      setPublishedRevision(data.published_revision);
      setInherited(data.inherited);
      setPublished(data.published);
      setSaved(data.draft);
      setHistory(data.history);
      let next = data.draft;
      try {
        const local = JSON.parse(
          sessionStorage.getItem(`pwa-editor:${thisScope}`) || "null",
        );
        if (local?.revision === data.revision) {
          validatePatch(local.config);
          next = local.config;
        }
      } catch {}
      setDraft(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (scopeRef.current === thisScope) setLoading(false);
    }
  }, [organizationId, campus]);
  useEffect(() => {
    if (enabled) void load();
    return () => {
      scopeRef.current = "";
    };
  }, [load, enabled]);
  useEffect(() => {
    let live = true;
    void getAuthHeaders({ "x-organization-id": organizationId })
      .then((headers) =>
        fetch(
          `${API}/campuses?organization_id=${encodeURIComponent(organizationId)}`,
          { headers },
        ),
      )
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (live) setCampuses(Array.isArray(data) ? data : data.data || []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [organizationId]);
  useEffect(() => {
    if (!loading)
      sessionStorage.setItem(
        `pwa-editor:${scope}`,
        JSON.stringify({ revision, config: draft }),
      );
  }, [scope, revision, draft, loading]);
  const send = useCallback(() => {
    if (!frame.current?.contentWindow) return;
    frame.current.contentWindow.postMessage(
      {
        type: "PWA_PREVIEW_CONFIG",
        protocol: 1,
        nonce: nonce.current,
        sequence: ++sequence.current,
        config: compare ? live : resolved,
        screen,
        mode,
        version,
        persona,
        flags,
        selected,
      },
      new URL(previewUrl).origin,
    );
  }, [
    compare,
    live,
    resolved,
    screen,
    mode,
    version,
    persona,
    flags,
    selected,
    previewUrl,
  ]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (
        event.source !== frame.current?.contentWindow ||
        event.origin !== new URL(previewUrl).origin ||
        event.data?.nonce !== nonce.current ||
        event.data?.protocol !== 1
      )
        return;
      const data = event.data;
      if (data.type === "PWA_PREVIEW_READY") {
        setConnected(true);
        send();
      }
      if (data.type === "PWA_PREVIEW_APPLIED") {
        setConnected(true);
        setFrameError("");
      }
      if (data.type === "PWA_PREVIEW_ERROR") setFrameError(data.message);
      if (data.type === "PWA_PREVIEW_SELECT") {
        setSelected(data.region);
        setSection("appearance");
      }
      if (data.type === "PWA_PREVIEW_SCREEN" && data.screen in SCREEN_LABELS)
        setScreen(data.screen);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [send, previewUrl]);
  useEffect(() => {
    if (connected) send();
  }, [send, connected]);
  useEffect(() => {
    if (connected) return;
    const timer = setTimeout(
      () =>
        setFrameError(
          "A prévia ainda não carregou. Confira a conexão e tente novamente.",
        ),
      20000,
    );
    return () => clearTimeout(timer);
  }, [connected]);
  function change(path: string[], value: any) {
    setDraft((d) => setPath(d, path, value));
    setNotice("");
    setCompare(false);
  }
  function discard() {
    if (
      dirty &&
      !confirm("Descartar as alterações locais e recarregar o rascunho salvo?")
    )
      return;
    sessionStorage.removeItem(`pwa-editor:${scope}`);
    void load();
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      validatePatch(draft);
      const data = await call("draft", {
        expected_revision: revision,
        config: draft,
      });
      setRevision(data.revision);
      setSaved(structuredClone(draft));
      setNotice(
        "Rascunho salvo. Os membros continuam vendo a versão publicada.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    if (dirty) return;
    if (
      !confirm(
        `Publicar esta experiência para ${campus === "all" ? "a organização" : campuses.find((c) => c.id === campus)?.name || "esta unidade"}?`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const data = await call("publish", { expected_revision: revision });
      setRevision(data.revision);
      setPublishedRevision(data.published_revision);
      setPublished(structuredClone(saved));
      setNotice(
        "Experiência publicada. O PWA recebe a atualização ao abrir ou retornar ao aplicativo.",
      );
      const fresh = await call("editor");
      setHistory(fresh.history);
      setInherited(fresh.inherited);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function restore(id: string) {
    if (
      dirty &&
      !confirm("Substituir as alterações locais pela versão escolhida?")
    )
      return;
    setBusy(true);
    setError("");
    try {
      await call("restore", { expected_revision: revision, version_id: id });
      sessionStorage.removeItem(`pwa-editor:${scope}`);
      await load();
      setNotice(
        "Versão restaurada como rascunho. Confira a prévia e publique quando desejar.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined, path: string[]) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Escolha uma imagem PNG, JPG ou WebP de até 5 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({
        filename: file.name,
        contentType: file.type,
        prefix: "pwa-branding",
        organization_id: organizationId,
      });
      const response = await fetch(`${API}/upload-url?${params}`, {
        headers: await getAuthHeaders({ "x-organization-id": organizationId }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(data.message || "Não foi possível preparar o envio.");
      const target = new URL(data.uploadUrl);
      if (
        target.protocol !== "https:" ||
        !target.hostname.endsWith(".amazonaws.com")
      )
        throw Error("Destino de envio inválido.");
      const result = await fetch(target, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw Error("A imagem não foi enviada. Tente novamente.");
      change(path, data.fileUrl);
      setNotice(
        "Imagem enviada para o rascunho. Confira a prévia antes de publicar.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const pathFor = (key: string) =>
    section === "screens"
      ? ["screens", screen, "palette", key]
      : ["theme", mode, key];
  const palette =
    section === "screens"
      ? { ...resolved.theme[mode], ...resolved.screens[screen]?.palette }
      : resolved.theme[mode];
  const oldPalette =
    section === "screens"
      ? { ...live.theme[mode], ...live.screens[screen]?.palette }
      : live.theme[mode];
  function move(id: string, to: number) {
    const blocks = [...resolved.home.blocks];
    const from = blocks.findIndex((b) => b.id === id);
    if (from < 0 || to < 0 || to >= blocks.length) return;
    blocks.splice(to, 0, blocks.splice(from, 1)[0]);
    change(["home", "blocks"], blocks);
  }
  const resetField = (path: string[]) => change(path, undefined);
  if (!enabled)
    return <p>Personalização do PWA indisponível nesta organização.</p>;
  return (
    <div className={`pe-editor ${mobilePreview ? "pe-show-preview" : ""}`}>
      <header className="pe-heading">
        <div>
          <span className="pe-eyebrow">EXPERIÊNCIA DA SUA COMUNIDADE</span>
          <h1>Personalizar PWA</h1>
          <p>Cores, textos e telas com prévia ao vivo.</p>
        </div>
        <label>
          Aplicar em
          <select
            value={campus}
            disabled={busy}
            onChange={(e) => {
              if (
                dirty &&
                !confirm(
                  "Trocar de escopo? A edição local será preservada para retomar depois.",
                )
              )
                return;
              setCampus(e.target.value);
              setNotice("");
            }}
          >
            <option value="all">Organização · padrão das unidades</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · ajustes da unidade
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className="pe-toolbar">
        <span className={dirty ? "pe-status pe-unsaved" : "pe-status"}>
          {dirty
            ? "Alterações não salvas"
            : revision > publishedRevision
              ? "Rascunho não publicado"
              : publishedRevision
                ? "Versão publicada"
                : "Padrão herdado"}{" "}
          · revisão {revision}
        </span>
        <div>
          <button
            className="pe-button"
            disabled={busy || loading}
            onClick={discard}
          >
            Recarregar
          </button>
          <button
            className="pe-button"
            disabled={busy || loading}
            onClick={() => void save()}
          >
            {busy ? "Aguarde…" : "Salvar rascunho"}
          </button>
          <button
            className="pe-button pe-primary"
            disabled={
              busy || loading || dirty || revision === 0 || issues.length > 0
            }
            title={
              dirty
                ? "Salve o rascunho antes de publicar"
                : issues.length
                  ? "Revise o contraste antes de publicar"
                  : undefined
            }
            onClick={() => void publish()}
          >
            Publicar para os membros
          </button>
          <button
            className="pe-button pe-preview-toggle"
            onClick={() => setMobilePreview((v) => !v)}
          >
            Visualizar PWA
          </button>
        </div>
      </div>
      {error && (
        <div role="alert" className="pe-alert">
          {error}{" "}
          <button className="pe-text-button" onClick={discard}>
            Recarregar configuração
          </button>
        </div>
      )}
      {notice && (
        <p role="status" className="pe-notice">
          {notice}
        </p>
      )}
      <div className="pe-layout">
        <div className="pe-controls">
          <nav className="pe-tabs" aria-label="Personalização">
            {[
              ["templates", "Modelos"],
              ["appearance", "Aparência"],
              ["texts", "Textos"],
              ["home", "Início"],
              ["screens", "Telas"],
              ["history", "Histórico"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={section === id}
                className={section === id ? "active" : ""}
                onClick={() => setSection(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          {loading ? (
            <p role="status">Carregando a configuração…</p>
          ) : (
            <>
              {section === "templates" && (
                <section className="pe-section">
                  <h2>Comece por um modelo</h2>
                  <p>
                    O modelo aplica cores e estilo. Textos, imagens e blocos já
                    editados são preservados.
                  </p>
                  {[
                    ["classic", "Clássico"],
                    ["welcoming", "Acolhedor"],
                    ["contemporary", "Contemporâneo"],
                  ].map(([id, label]) => (
                    <button
                      className="pe-template"
                      key={id}
                      onClick={() => {
                        const model = preset(id as any);
                        setDraft((d) => ({
                          ...d,
                          template_id: id,
                          theme: model.theme,
                        }));
                        setCompare(false);
                      }}
                    >
                      <span
                        style={{
                          background: preset(id as any).theme.light.primary,
                        }}
                      />
                      {label}
                    </button>
                  ))}
                  <button
                    className="pe-text-button"
                    onClick={() => {
                      if (
                        confirm(
                          "Restaurar a herança de todos os campos neste rascunho?",
                        )
                      )
                        setDraft({});
                    }}
                  >
                    Restaurar padrão herdado
                  </button>
                </section>
              )}
              {["appearance", "screens"].includes(section) && (
                <section className="pe-section">
                  <h2>
                    {section === "screens"
                      ? "Ajustes desta tela"
                      : "Cores do aplicativo"}
                  </h2>
                  {section === "screens" && (
                    <>
                      <label>
                        Tela
                        <select
                          value={screen}
                          onChange={(e) =>
                            setScreen(e.target.value as ScreenId)
                          }
                        >
                          {Object.entries(SCREEN_LABELS).map(([id, label]) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p>
                        Os ajustes de uma tela são herdados nos modos claro e
                        escuro. Confira os dois modos antes de publicar.
                      </p>
                    </>
                  )}
                  <div className="pe-segments">
                    {[
                      ["light", "Claro"],
                      ["dark", "Escuro"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        aria-pressed={mode === id}
                        onClick={() => setMode(id as any)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="pe-colors">
                    {Object.entries(PALETTE_LABELS).map(([key, label]) => (
                      <div
                        key={key}
                        className={`pe-color-row ${selected === key ? "selected" : ""}`}
                      >
                        <label>
                          <input
                            aria-label={label}
                            type="color"
                            value={(palette as any)[key]}
                            onFocus={() => setSelected(key)}
                            onChange={(e) => {
                              setSelected(key);
                              setDraft((d) => {
                                let next = setPath(
                                  d,
                                  pathFor(key),
                                  e.target.value,
                                );
                                if (key === "primary")
                                  next = setPath(
                                    next,
                                    pathFor("onPrimary"),
                                    onColor(e.target.value),
                                  );
                                return next;
                              });
                              setCompare(false);
                            }}
                          />
                          <span>
                            {label}
                            <small>{(palette as any)[key]}</small>
                          </span>
                        </label>
                        <span
                          className="pe-color-before"
                          style={{ background: (oldPalette as any)[key] }}
                          title={`Publicado: ${(oldPalette as any)[key]}`}
                        />
                        <button
                          className="pe-text-button"
                          aria-label={`Herdar ${label}`}
                          onClick={() => resetField(pathFor(key))}
                        >
                          Herdar
                        </button>
                      </div>
                    ))}
                  </div>
                  {section === "appearance" && (
                    <>
                      <h3>Estilo e leitura</h3>
                      <label>
                        Modo inicial
                        <select
                          value={resolved.theme.default_mode}
                          onChange={(e) =>
                            change(["theme", "default_mode"], e.target.value)
                          }
                        >
                          <option value="LIGHT">Claro</option>
                          <option value="DARK">Escuro</option>
                          <option value="AUTO">Acompanhar o sistema</option>
                        </select>
                      </label>
                      <label>
                        Fonte
                        <select
                          value={resolved.theme.typography.font}
                          onChange={(e) =>
                            change(
                              ["theme", "typography", "font"],
                              e.target.value,
                            )
                          }
                        >
                          <option value="jakarta">Plus Jakarta Sans</option>
                          <option value="system">Fonte do dispositivo</option>
                          <option value="serif">Serifada</option>
                        </select>
                      </label>
                      {[
                        ["radius", "Arredondamento", 0, 32],
                        ["spacing", "Espaçamento", 8, 28],
                      ].map(([key, label, min, max]) => (
                        <label key={key}>
                          {label} · {(resolved.theme.components as any)[key]}px
                          <input
                            type="range"
                            min={min as number}
                            max={max as number}
                            value={(resolved.theme.components as any)[key]}
                            onChange={(e) =>
                              change(
                                ["theme", "components", key as string],
                                Number(e.target.value),
                              )
                            }
                          />
                        </label>
                      ))}
                      <label>
                        Tamanho dos textos ·{" "}
                        {Math.round(resolved.theme.typography.scale * 100)}%
                        <input
                          type="range"
                          min="0.85"
                          max="1.3"
                          step="0.05"
                          value={resolved.theme.typography.scale}
                          onChange={(e) =>
                            change(
                              ["theme", "typography", "scale"],
                              Number(e.target.value),
                            )
                          }
                        />
                      </label>
                      <label>
                        Sombras
                        <select
                          value={resolved.theme.components.shadow}
                          onChange={(e) =>
                            change(
                              ["theme", "components", "shadow"],
                              e.target.value,
                            )
                          }
                        >
                          <option value="none">Sem sombra</option>
                          <option value="soft">Suave</option>
                          <option value="strong">Marcante</option>
                        </select>
                      </label>
                      <h3>Identidade nas telas</h3>
                      {[
                        ["name", "Nome apresentado"],
                        ["tagline", "Assinatura"],
                        ["logo_url", "URL do logo"],
                        ["banner_url", "URL da imagem principal"],
                      ].map(([key, label]) => (
                        <label key={key}>
                          {label}
                          <input
                            value={(resolved.identity as any)[key]}
                            maxLength={key.endsWith("_url") ? 2000 : 180}
                            onChange={(e) =>
                              change(["identity", key], e.target.value)
                            }
                          />
                          {key.endsWith("_url") && (
                            <>
                              <input
                                aria-label={`Enviar ${label}`}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                disabled={busy}
                                onChange={(e) =>
                                  void upload(e.target.files?.[0], [
                                    "identity",
                                    key,
                                  ])
                                }
                              />
                              <small>
                                PNG, JPG ou WebP, até 5 MB. O envio fica no
                                rascunho até publicar.
                              </small>
                            </>
                          )}
                        </label>
                      ))}
                    </>
                  )}
                  {section === "screens" && (
                    <>
                      <label>
                        Imagem de fundo · URL HTTPS
                        <input
                          value={resolved.screens[screen]?.image_url || ""}
                          onChange={(e) =>
                            change(
                              ["screens", screen, "image_url"],
                              e.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        Enviar imagem desta tela
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={busy}
                          onChange={(e) =>
                            void upload(e.target.files?.[0], [
                              "screens",
                              screen,
                              "image_url",
                            ])
                          }
                        />
                      </label>
                      <label>
                        Escurecimento da imagem
                        <input
                          type="range"
                          min="0"
                          max="0.85"
                          step="0.05"
                          value={resolved.screens[screen]?.overlay ?? 0.35}
                          onChange={(e) =>
                            change(
                              ["screens", screen, "overlay"],
                              Number(e.target.value),
                            )
                          }
                        />
                      </label>
                      <button
                        className="pe-text-button"
                        onClick={() => resetField(["screens", screen])}
                      >
                        Herdar toda esta tela
                      </button>
                    </>
                  )}
                </section>
              )}
              {section === "texts" && (
                <section className="pe-section">
                  <h2>Textos e comunicação</h2>
                  <label>
                    Tela
                    <select
                      value={screen}
                      onChange={(e) => setScreen(e.target.value as ScreenId)}
                    >
                      {Object.entries(SCREEN_LABELS).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {Object.entries(COPY_DEFAULTS)
                    .filter(
                      ([key]) =>
                        key.startsWith(screen + ".") ||
                        (screen === "home" &&
                          (key.startsWith("navigation.") ||
                            key.startsWith("shortcuts."))),
                    )
                    .map(([key, defaultText]) => (
                      <label key={key}>
                        {key.startsWith("navigation.")
                          ? "Menu · "
                          : key.startsWith("shortcuts.")
                            ? "Atalho · "
                            : ""}
                        {textLabel(key)}
                        <input
                          maxLength={
                            key.endsWith(".title") ||
                            key.startsWith("navigation.") ||
                            key.startsWith("shortcuts.")
                              ? 80
                              : 300
                          }
                          value={resolved.copy[key] ?? defaultText}
                          onChange={(e) =>
                            change(["copy", key], e.target.value)
                          }
                        />
                        <button
                          className="pe-text-button"
                          onClick={() => resetField(["copy", key])}
                        >
                          Usar texto padrão
                        </button>
                      </label>
                    ))}
                </section>
              )}
              {section === "home" && (
                <section className="pe-section">
                  <h2>Organize a página inicial</h2>
                  <p>
                    Arraste os blocos ou use as setas. A disponibilidade
                    continua seguindo os módulos contratados.
                  </p>
                  <label>
                    Colunas dos atalhos
                    <select
                      value={resolved.home.columns}
                      onChange={(e) =>
                        change(["home", "columns"], Number(e.target.value))
                      }
                    >
                      <option value="2">Duas</option>
                      <option value="3">Três</option>
                    </select>
                  </label>
                  {resolved.home.blocks.map((block, index) => (
                    <article
                      className="pe-block"
                      key={block.id}
                      draggable
                      onDragStart={() => {
                        drag.current = block.id;
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (drag.current) move(drag.current, index);
                        drag.current = null;
                      }}
                    >
                      <span aria-hidden="true">⠿</span>
                      <label>
                        <input
                          type="checkbox"
                          checked={block.visible}
                          onChange={(e) =>
                            change(
                              ["home", "blocks"],
                              resolved.home.blocks.map((b) =>
                                b.id === block.id
                                  ? { ...b, visible: e.target.checked }
                                  : b,
                              ),
                            )
                          }
                        />
                        {BLOCK_LABELS[block.id]}
                      </label>
                      <select
                        aria-label={`Estilo ${BLOCK_LABELS[block.id]}`}
                        value={block.variant}
                        onChange={(e) =>
                          change(
                            ["home", "blocks"],
                            resolved.home.blocks.map((b) =>
                              b.id === block.id
                                ? { ...b, variant: e.target.value }
                                : b,
                            ),
                          )
                        }
                      >
                        <option value="default">Padrão</option>
                        <option value="compact">Compacto</option>
                        <option value="featured">Destaque</option>
                      </select>
                      <button
                        className="pe-text-button"
                        aria-label={`Subir ${BLOCK_LABELS[block.id]}`}
                        disabled={index === 0}
                        onClick={() => move(block.id, index - 1)}
                      >
                        ↑
                      </button>
                      <button
                        className="pe-text-button"
                        aria-label={`Descer ${BLOCK_LABELS[block.id]}`}
                        disabled={index === resolved.home.blocks.length - 1}
                        onClick={() => move(block.id, index + 1)}
                      >
                        ↓
                      </button>
                    </article>
                  ))}
                </section>
              )}
              {section === "history" && (
                <section className="pe-section">
                  <h2>Versões publicadas</h2>
                  <p>
                    Restaurar cria um rascunho. A versão dos membros só muda
                    depois de publicar.
                  </p>
                  {history.length ? (
                    history.map((item) => (
                      <article className="pe-history" key={item.id}>
                        <div>
                          <strong>Revisão {item.revision}</strong>
                          <p>
                            {new Date(item.created_at).toLocaleString("pt-BR")}{" "}
                            · {item.created_by}
                          </p>
                        </div>
                        <button
                          className="pe-button"
                          disabled={busy}
                          onClick={() => void restore(item.id)}
                        >
                          Usar como rascunho
                        </button>
                      </article>
                    ))
                  ) : (
                    <p>Nenhuma versão publicada neste escopo.</p>
                  )}
                </section>
              )}
              {issues.length > 0 && (
                <details className="pe-contrast">
                  <summary>
                    Revise {issues.length} combinação(ões) de contraste antes de
                    publicar
                  </summary>
                  <ul>
                    {issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
        <aside className="pe-preview">
          <div className="pe-preview-heading">
            <div>
              <strong>Visualizar PWA</strong>
              <small>
                {compare
                  ? "Versão publicada"
                  : "Minhas alterações · prévia ao vivo"}
              </small>
            </div>
            <button className="pe-button" onClick={() => setCompare((v) => !v)}>
              {compare ? "Ver minhas alterações" : "Comparar publicado"}
            </button>
          </div>
          <div className="pe-preview-options">
            <select
              aria-label="Versão da prévia"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            >
              <option value="v1">PWA v1</option>
              <option value="v2">PWA v2</option>
            </select>
            <select
              aria-label="Modo da prévia"
              value={mode}
              onChange={(e) => setMode(e.target.value as any)}
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
            <select
              aria-label="Pessoa da prévia"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
            >
              <option value="member">Membro</option>
              <option value="visitor">Visitante</option>
            </select>
            <select
              aria-label="Tela da prévia"
              value={screen}
              onChange={(e) => setScreen(e.target.value as ScreenId)}
            >
              {Object.entries(SCREEN_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {frameError && (
            <div role="alert" className="pe-alert">
              {frameError}{" "}
              <button
                className="pe-text-button"
                onClick={() => {
                  setConnected(false);
                  setFrameError("");
                  if (frame.current) frame.current.src = previewUrl;
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}
          <div className="pe-phone">
            <iframe
              ref={frame}
              title="Prévia ao vivo do PWA"
              src={previewUrl}
              onLoad={() => send()}
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="origin"
            />
          </div>
          <p className="pe-preview-note">
            Alterações não publicadas. Clique em uma região da prévia para
            selecionar seus controles. Ações reais dos módulos estão
            desativadas.
          </p>
        </aside>
      </div>
      <div className="pe-mobile-switch">
        <button
          onClick={() => setMobilePreview(false)}
          aria-pressed={!mobilePreview}
        >
          Editar
        </button>
        <button
          onClick={() => setMobilePreview(true)}
          aria-pressed={mobilePreview}
        >
          Visualizar PWA
        </button>
      </div>
    </div>
  );
}
