import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Members.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export const MAX_KANBAN_STAGES = 7;

type OrderItem = {
  name: string;
  qty: number;
  price: number;
  obs?: string;
};

type OrderData = {
  id: string;
  user_name: string;
  status: string;
  delivery_method: string;
  delivery_details: string;
  items_json: string | OrderItem[];
  total_price: number;
  created_at: string;
};

export interface KanbanStage {
  id: string;
  title: string;
  icon: string;
  color: string;
  description: string;
  is_system?: boolean;
}

export const DEFAULT_STAGES: KanbanStage[] = [
  {
    id: 'RECEBIDO',
    title: 'Novos / Recebidos',
    icon: '🔔',
    color: '#ef4444',
    description: 'Pedidos recém-chegados pelo App ou Balcão',
    is_system: true
  },
  {
    id: 'PREPARANDO',
    title: 'Em Separação',
    icon: '⏳',
    color: '#f59e0b',
    description: 'Itens em preparo na cozinha ou separação no estoque',
    is_system: true
  },
  {
    id: 'PRONTO',
    title: 'Aguardando Retirada',
    icon: '✅',
    color: '#3b82f6',
    description: 'Prontos para retirada no balcão ou despacho',
    is_system: true
  },
  {
    id: 'ENTREGUE',
    title: 'Finalizados',
    icon: '🎉',
    color: '#10b981',
    description: 'Venda concluída e entregue ao membro',
    is_system: true
  }
];

const PRESET_SUGGESTIONS = [
  { title: 'Conferência & Pacote', icon: '📦', color: '#8b5cf6', description: 'Conferência de itens e embalagem' },
  { title: 'Em Rota de Entrega', icon: '🛵', color: '#0284c7', description: 'Saiu para entrega com o voluntário/motoboy' },
  { title: 'Aguardando Pagamento', icon: '💳', color: '#ec4899', description: 'Aguardando confirmação do PIX ou balcão' },
  { title: 'Na Cozinha / Forno', icon: '🍳', color: '#ea580c', description: 'Assando salgados ou preparando lanches' },
  { title: 'Separando na Livraria', icon: '📚', color: '#6366f1', description: 'Separando livros ou bíblias do pedido' }
];

export function parseKanbanConfig(raw: any): KanbanStage[] {
  if (!raw) return DEFAULT_STAGES;
  let parsed = raw;
  if (typeof raw === 'string') {
    try { parsed = JSON.parse(raw); } catch { return DEFAULT_STAGES; }
  }
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.slice(0, MAX_KANBAN_STAGES);
  }
  if (parsed.stages && Array.isArray(parsed.stages) && parsed.stages.length > 0) {
    return parsed.stages.slice(0, MAX_KANBAN_STAGES);
  }
  // Suporte a formato legado de 4 chaves
  if (parsed.RECEBIDO || parsed.PREPARANDO) {
    return [
      { id: 'RECEBIDO', is_system: true, ...DEFAULT_STAGES[0], ...(parsed.RECEBIDO || {}) },
      { id: 'PREPARANDO', is_system: true, ...DEFAULT_STAGES[1], ...(parsed.PREPARANDO || {}) },
      { id: 'PRONTO', is_system: true, ...DEFAULT_STAGES[2], ...(parsed.PRONTO || {}) },
      { id: 'ENTREGUE', is_system: true, ...DEFAULT_STAGES[3], ...(parsed.ENTREGUE || {}) }
    ];
  }
  return DEFAULT_STAGES;
}

interface PdvPedidosProps {
  selectedCampusId?: string;
  selectedOrganization?: any;
}

export const PdvPedidos: React.FC<PdvPedidosProps> = ({ selectedCampusId = 'all', selectedOrganization }) => {
  const orgId = selectedOrganization?.id || 'org_default';
  const orgSlug = selectedOrganization?.slug || 'faithhub';

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const knownOrders = useRef<Set<string>>(new Set());

  // Kanban Dynamic Stages (Até 7 etapas)
  const [stages, setStages] = useState<KanbanStage[]>(DEFAULT_STAGES);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configFormStages, setConfigFormStages] = useState<KanbanStage[]>(DEFAULT_STAGES);
  const [savingConfig, setSavingConfig] = useState(false);

  // Som de notificação padrão
  const beepSound = "data:audio/wav;base64,UklGRnQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAGAACAgICAgICAgICAgICAgICAgICAgICAgIB4d25sZ19bVFFQT1BQUE9RUlVZW2BkcHmAio2SlZeamZmWlZaRjIeDfnl0cW9rZ2NeWVRTUVBPTk1OT1FSVllbYGVweoKJjZKVl5qZmZaVlpGMh4N+eXRxb2tnY15ZVFNROE9OTU5PUVJWVVtgZXB6gomNkpWXmpqZlpaWkYyHg355dHFva2djXllUU1FQTk5NTk9RUlVZW2BkcHmBiY2SlZebmpmWlZaRjIeDfnl0cW9rZ2NeWVRTUVBPTk1OT1FSVllbYGVweoKJjZKVl5qbmZaVlpGMh4N+eXRxb2tnY15ZVFNROE9OTU5PUVJWVVtgZXB6gomNkpWXmpqZlpaWkYyHg355dHFva2djXllUU1FQTk5NTk9RUlVZW2BkcHmBiY2SlZebmpmWlZaRjIeDfnl0cW9rZ2NeWVRTUVBPTk1OT1FSVllbYGVweoKJjZKVl5=";

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  // Carrega as etapas personalizadas da igreja
  const loadKanbanConfig = async () => {
    const cacheKey = `faithhub_kanban_config_${orgId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = parseKanbanConfig(cached);
        setStages(parsed);
        setConfigFormStages(parsed);
      } catch (e) {
        console.error("Erro ao carregar cache do kanban", e);
      }
    }

    try {
      const res = await fetch(`${API_URL}/church-settings?organization_id=${encodeURIComponent(orgId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.kanban_config) {
          const parsed = parseKanbanConfig(data.kanban_config);
          setStages(parsed);
          setConfigFormStages(parsed);
          localStorage.setItem(cacheKey, JSON.stringify(parsed));
        }
      }
    } catch (err) {
      console.log("Erro ao carregar kanban_config remoto", err);
    }
  };

  const loadOrders = async () => {
    try {
      const headers = await getAuthHeaders();
      const campusParam = selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const res = await fetch(`${API_URL}/pdv/orders?organization_id=${encodeURIComponent(orgId)}${campusParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const parsed: OrderData[] = (Array.isArray(data) ? data : []).map((o: any) => ({
          ...o,
          items_json: typeof o.items_json === 'string' ? JSON.parse(o.items_json) : o.items_json
        }));
        
        // Alerta sonoro para novos pedidos
        let hasNew = false;
        parsed.forEach(o => {
          if (o.status === 'RECEBIDO' && !knownOrders.current.has(o.id)) {
             hasNew = true;
             knownOrders.current.add(o.id);
          }
        });

        if (hasNew) {
           const audio = new Audio(beepSound);
           audio.play().catch(() => console.log('Áudio bloqueado pelo navegador'));
        }

        setOrders(parsed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKanbanConfig();
    loadOrders();
    const interval = setInterval(() => {
      loadOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedCampusId, selectedOrganization]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
       const headers = await getAuthHeaders();
       const res = await fetch(`${API_URL}/pdv/orders/${id}/status`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
       });
       if (res.ok) {
          loadOrders();
       }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSaveKanbanConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const cacheKey = `faithhub_kanban_config_${orgId}`;
      localStorage.setItem(cacheKey, JSON.stringify(configFormStages));
      setStages(configFormStages);

      // Persiste no backend no registro da igreja
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
      
      await fetch(`${API_URL}/church-settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          organization_id: orgId,
          pwa_slug: orgSlug,
          id: `settings_${orgSlug.replace(/-/g, '_')}`,
          kanban_config: configFormStages
        })
      });

      setIsConfigModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar kanban config", err);
      alert("Erro ao salvar configuração do kanban.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddNewStage = () => {
    if (configFormStages.length >= MAX_KANBAN_STAGES) {
      alert(`O limite máximo é de ${MAX_KANBAN_STAGES} etapas para manter a usabilidade ideal da equipe.`);
      return;
    }

    const nextIndex = configFormStages.length;
    const suggestion = PRESET_SUGGESTIONS[nextIndex % PRESET_SUGGESTIONS.length];
    const newStageId = `STAGE_${Date.now().toString(36).toUpperCase()}`;

    const newStage: KanbanStage = {
      id: newStageId,
      title: suggestion.title,
      icon: suggestion.icon,
      color: suggestion.color,
      description: suggestion.description,
      is_system: false
    };

    setConfigFormStages([...configFormStages, newStage]);
  };

  const handleMoveStage = (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= configFormStages.length) return;

    const list = [...configFormStages];
    const item = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = item;
    setConfigFormStages(list);
  };

  const handleDeleteStage = (index: number) => {
    if (configFormStages.length <= 2) {
      alert("O Kanban precisa de no mínimo 2 etapas para funcionar.");
      return;
    }

    const stageToDelete = configFormStages[index];
    const hasActiveOrders = orders.some(o => o.status === stageToDelete.id);

    if (hasActiveOrders) {
      if (!confirm(`Atenção: Existem pedidos atualmente na etapa "${stageToDelete.title}". Se você remover esta etapa, esses pedidos continuarão no sistema, mas você precisará movê-los para outra etapa. Deseja excluir mesmo assim?`)) {
        return;
      }
    } else {
      if (!confirm(`Deseja realmente remover a etapa "${stageToDelete.title}"?`)) {
        return;
      }
    }

    const list = configFormStages.filter((_, idx) => idx !== index);
    setConfigFormStages(list);
  };

  const handleResetToDefault = () => {
    if (confirm("Deseja restaurar o Kanban para as 4 etapas padrão do sistema?")) {
      setConfigFormStages(DEFAULT_STAGES);
    }
  };

  return (
    <div className="members-container animate-fade-in" style={{ width: '100%' }}>
      <div className="header-actions" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Central de Vendas e Pedidos (PDV)
            </h2>
            <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 8 }}>
              ● Tempo Real
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: '0.86rem' }}>
            Fluxo Kanban com {stages.length} etapas ativas (suporta até 7 etapas personalizáveis).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            type="button"
            className="secondary-btn" 
            onClick={() => { setConfigFormStages(stages); setIsConfigModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <span>⚙️</span> Personalizar Etapas ({stages.length}/{MAX_KANBAN_STAGES})
          </button>

          <button 
            type="button"
            className="secondary-btn" 
            onClick={loadOrders}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }} />
          Buscando vendas e pedidos em tempo real...
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 24, minHeight: '65vh', alignItems: 'flex-start' }}>
           {stages.map((stage) => {
              const colOrders = orders.filter(o => o.status === stage.id);
              const colColor = stage.color || '#0f766e';

              return (
                 <div key={stage.id} style={{ flex: '0 0 320px', minWidth: 320, background: '#f8fafc', borderRadius: 18, padding: 16, border: '1px solid var(--panel-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ paddingBottom: 12, borderBottom: `3px solid ${colColor}`, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div style={{ maxWidth: '80%' }}>
                         <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           <span style={{ fontSize: '1.05rem' }}>{stage.icon}</span>
                           <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage.title}</span>
                         </div>
                         {stage.description && (
                           <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, fontWeight: 500, lineHeight: 1.2 }}>
                             {stage.description}
                           </div>
                         )}
                       </div>
                       <span style={{ background: colColor, color: '#FFF', padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                         {colOrders.length}
                       </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       {colOrders.length === 0 && (
                         <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', padding: '30px 10px', background: '#ffffff', borderRadius: 12, border: '1px dashed #e2e8f0' }}>
                           Nenhum pedido nesta etapa
                         </div>
                       )}
                       {colOrders.map(order => {
                          const items: OrderItem[] = Array.isArray(order.items_json) ? order.items_json : [];
                          return (
                             <div key={order.id} className="portal-card" style={{ margin: 0, padding: 0, overflow: 'hidden', borderLeft: `5px solid ${colColor}`, border: '1px solid var(--panel-border)', borderLeftWidth: 5, borderLeftColor: colColor, background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                                <div style={{ background: '#ffffff', padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                   <div>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                       <span style={{ fontWeight: 900, fontSize: '0.92rem', color: 'var(--text-main)' }}>#{order.id.substring(0,6).toUpperCase()}</span>
                                       <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                                         {new Date(order.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                       </span>
                                     </div>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-main)', fontWeight: 700, fontSize: '0.84rem' }}>
                                        <span>👤</span> {order.user_name || 'Membro / Visitante'}
                                     </div>
                                   </div>
                                   <div style={{ textAlign: 'right' }}>
                                     <div style={{ fontSize: '0.90rem', fontWeight: 900, color: 'var(--accent-primary)' }}>
                                       R$ {Number(order.total_price || 0).toFixed(2).replace('.', ',')}
                                     </div>
                                   </div>
                                </div>

                                <div style={{ padding: 14 }}>
                                   <div style={{ marginBottom: 10, background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.15)', padding: 10, borderRadius: 10 }}>
                                      <span style={{ fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', color: '#0284c7', display: 'block', marginBottom: 2 }}>
                                        📍 Logística de Retirada
                                      </span>
                                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', display: 'block', lineHeight: 1.3 }}>
                                        {order.delivery_details || (order.delivery_method === 'counter' ? 'Retirada no Balcão da Loja' : 'Entrega')}
                                      </span>
                                      {order.delivery_method === 'home' && (
                                        <span style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: 6, display: 'inline-block', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>
                                          ⚠️ Despacho / Entrega
                                        </span>
                                      )}
                                   </div>

                                   <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 12 }}>
                                      {items.map((itm, i) => (
                                         <li key={i} style={{ padding: '6px 0', borderBottom: '1px dashed #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                              <span style={{ fontWeight: 900, color: 'var(--accent-primary)', fontSize: '0.80rem' }}>{itm.qty}x</span> <span style={{ color: 'var(--text-main)', fontSize: '0.80rem', fontWeight: 600 }}>{itm.name}</span>
                                              {itm.obs && (
                                                 <div style={{ marginTop: 2, background: '#fffbeb', padding: '2px 6px', borderRadius: 4, fontSize: '0.68rem', color: '#b45309', fontWeight: 600 }}>
                                                    Obs: {itm.obs}
                                                 </div>
                                              )}
                                            </div>
                                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                              R$ {(Number(itm.price || 0) * (itm.qty || 1)).toFixed(2).replace('.', ',')}
                                            </span>
                                         </li>
                                      ))}
                                   </ul>

                                   {/* Status Selector Dynamically Populated with Church Stages */}
                                   <div>
                                     <label style={{ display: 'block', fontSize: '0.66rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                                       Mover Etapa do Pedido:
                                     </label>
                                     <select 
                                       value={order.status} 
                                       onChange={(e) => updateStatus(order.id, e.target.value)}
                                       style={{ width: '100%', padding: '8px 10px', borderRadius: 8, background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.78rem' }}
                                     >
                                       {stages.map((st) => (
                                         <option key={st.id} value={st.id}>
                                           {st.icon} {st.title.toUpperCase()}
                                         </option>
                                       ))}
                                       <option value="CANCELADO">❌ CANCELADO / REEMBOLSADO</option>
                                     </select>
                                   </div>

                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>
              );
           })}
        </div>
      )}

      {/* ========================================================
          MODAL DE PERSONALIZAÇÃO DAS ETAPAS DO KANBAN (ATÉ 7 ETAPAS)
          ======================================================== */}
      {isConfigModalOpen && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setIsConfigModalOpen(false)}>
          <form className="modal-studio-container" style={{ maxWidth: 740, maxHeight: '92vh' }} onClick={e => e.stopPropagation()} onSubmit={handleSaveKanbanConfig}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
                  <span>⚙️</span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 className="modal-studio-title">Personalizar Etapas do Kanban</h2>
                    <span style={{ 
                      background: configFormStages.length >= MAX_KANBAN_STAGES ? '#fef3c7' : '#ecfdf5', 
                      color: configFormStages.length >= MAX_KANBAN_STAGES ? '#b45309' : '#059669', 
                      fontSize: '0.70rem', 
                      fontWeight: 800, 
                      padding: '2px 8px', 
                      borderRadius: 6 
                    }}>
                      {configFormStages.length} de {MAX_KANBAN_STAGES} Etapas Ativas
                    </span>
                  </div>
                  <p className="modal-studio-subtitle">
                    Adicione, renomeie, mude ícones, altere a ordem ou exclua colunas do fluxo de atendimento da sua igreja.
                  </p>
                </div>
              </div>
              <button type="button" className="modal-close-circle" onClick={() => setIsConfigModalOpen(false)}>✕</button>
            </div>

            <div className="modal-studio-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', maxHeight: '60vh', padding: '16px 24px' }}>
              {configFormStages.map((st, idx) => (
                <div key={st.id || idx} style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 14, border: '1px solid #e2e8f0', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: st.color || '#0f766e', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 900 }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        Etapa #{idx + 1}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Reorder Up */}
                      <button 
                        type="button" 
                        disabled={idx === 0}
                        onClick={() => handleMoveStage(idx, 'UP')}
                        style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1, fontSize: '0.75rem' }}
                        title="Mover para a esquerda / cima"
                      >
                        ▲
                      </button>

                      {/* Reorder Down */}
                      <button 
                        type="button" 
                        disabled={idx === configFormStages.length - 1}
                        onClick={() => handleMoveStage(idx, 'DOWN')}
                        style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: idx === configFormStages.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === configFormStages.length - 1 ? 0.4 : 1, fontSize: '0.75rem' }}
                        title="Mover para a direita / baixo"
                      >
                        ▼
                      </button>

                      {/* Color Picker */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#ffffff', padding: '2px 6px', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                        <input 
                          type="color" 
                          value={st.color} 
                          onChange={e => {
                            const updated = [...configFormStages];
                            updated[idx] = { ...updated[idx], color: e.target.value };
                            setConfigFormStages(updated);
                          }}
                          style={{ width: 20, height: 20, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }}
                          title="Escolher cor da etapa"
                        />
                      </div>

                      {/* Delete Stage */}
                      {configFormStages.length > 2 && (
                        <button 
                          type="button" 
                          onClick={() => handleDeleteStage(idx)}
                          style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.80rem' }}
                          title="Excluir esta etapa"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 10, marginBottom: 8 }}>
                    <div>
                      <label className="form-label-modern" style={{ fontSize: '0.68rem', marginBottom: 2 }}>Ícone</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        value={st.icon} 
                        onChange={e => {
                          const updated = [...configFormStages];
                          updated[idx] = { ...updated[idx], icon: e.target.value };
                          setConfigFormStages(updated);
                        }}
                        placeholder="🔔"
                        style={{ textAlign: 'center', fontSize: '1rem', padding: '6px 4px' }}
                      />
                    </div>
                    <div>
                      <label className="form-label-modern" style={{ fontSize: '0.68rem', marginBottom: 2 }}>Nome da Coluna / Etapa *</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        value={st.title} 
                        onChange={e => {
                          const updated = [...configFormStages];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setConfigFormStages(updated);
                        }}
                        placeholder="Ex: Em Separação, Na Cozinha..."
                        required
                        style={{ padding: '6px 10px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label-modern" style={{ fontSize: '0.68rem', marginBottom: 2 }}>Legenda / Descrição da Etapa</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      value={st.description} 
                      onChange={e => {
                        const updated = [...configFormStages];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setConfigFormStages(updated);
                      }}
                      placeholder="Ex: Pedidos em preparo na cozinha..."
                      style={{ padding: '6px 10px' }}
                    />
                  </div>
                </div>
              ))}

              {/* Botão para adicionar nova etapa (se < 7) */}
              {configFormStages.length < MAX_KANBAN_STAGES ? (
                <button
                  type="button"
                  onClick={handleAddNewStage}
                  style={{
                    background: '#f0fdf4',
                    border: '2px dashed #86efac',
                    borderRadius: 14,
                    padding: '14px',
                    color: '#15803d',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>➕</span>
                  Adicionar Nova Etapa ({MAX_KANBAN_STAGES - configFormStages.length} vaga(s) disponível(is))
                </button>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px', background: '#fef3c7', borderRadius: 10, color: '#b45309', fontSize: '0.76rem', fontWeight: 700 }}>
                  ⚠️ Limite máximo de {MAX_KANBAN_STAGES} etapas atingido para manter a visualização fluida no painel.
                </div>
              )}
            </div>

            <div className="modal-studio-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleResetToDefault}
                style={{ fontSize: '0.78rem' }}
              >
                ↺ Restaurar 4 Etapas Padrão
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsConfigModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingConfig}>
                  {savingConfig ? "Salvando..." : "Salvar Configuração"}
                </button>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}

    </div>
  );
};

export default PdvPedidos;
