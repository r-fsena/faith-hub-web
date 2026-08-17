import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Members.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

type OrderItem = {
  name: string;
  qty: number;
  price: number;
  obs?: string;
};

type OrderData = {
  id: string;
  user_name: string;
  status: 'RECEBIDO' | 'PREPARANDO' | 'PRONTO' | 'ENTREGUE' | 'CANCELADO';
  delivery_method: string;
  delivery_details: string;
  items_json: string | OrderItem[];
  total_price: number;
  created_at: string;
};

export interface KanbanColumnStage {
  title: string;
  icon: string;
  color: string;
  description: string;
}

export interface KanbanColumnConfig {
  RECEBIDO: KanbanColumnStage;
  PREPARANDO: KanbanColumnStage;
  PRONTO: KanbanColumnStage;
  ENTREGUE: KanbanColumnStage;
}

export const DEFAULT_KANBAN_CONFIG: KanbanColumnConfig = {
  RECEBIDO: {
    title: 'Novos / Recebidos',
    icon: '🔔',
    color: '#ef4444',
    description: 'Pedidos recém-chegados pelo App ou Balcão'
  },
  PREPARANDO: {
    title: 'Em Separação',
    icon: '⏳',
    color: '#f59e0b',
    description: 'Itens em preparo na cozinha ou separação no estoque'
  },
  PRONTO: {
    title: 'Aguardando Retirada',
    icon: '✅',
    color: '#3b82f6',
    description: 'Prontos para retirada no balcão ou despacho'
  },
  ENTREGUE: {
    title: 'Finalizados',
    icon: '🎉',
    color: '#10b981',
    description: 'Venda concluída e entregue ao membro'
  }
};

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

  // Kanban Custom Columns Config State
  const [kanbanConfig, setKanbanConfig] = useState<KanbanColumnConfig>(DEFAULT_KANBAN_CONFIG);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState<KanbanColumnConfig>(DEFAULT_KANBAN_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);

  // Som de notificação padrão: bipe rápido (base64)
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

  // Carrega as configurações personalizadas do Kanban da igreja
  const loadKanbanConfig = async () => {
    const cacheKey = `faithhub_kanban_config_${orgId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setKanbanConfig({ ...DEFAULT_KANBAN_CONFIG, ...parsed });
        setConfigForm({ ...DEFAULT_KANBAN_CONFIG, ...parsed });
      } catch (e) {
        console.error("Erro ao carregar cache do kanban", e);
      }
    }

    try {
      const res = await fetch(`${API_URL}/church-settings?organization_id=${encodeURIComponent(orgId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.kanban_config) {
          const remote = typeof data.kanban_config === 'string' ? JSON.parse(data.kanban_config) : data.kanban_config;
          const merged = { ...DEFAULT_KANBAN_CONFIG, ...remote };
          setKanbanConfig(merged);
          setConfigForm(merged);
          localStorage.setItem(cacheKey, JSON.stringify(merged));
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
        
        // Alerta sonoro para NOVOS pedidos
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
    }, 10000); // Poll a cada 10 segundos
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
          loadOrders(); // Recarrega imediatamente pra UI piscar rápido
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
      localStorage.setItem(cacheKey, JSON.stringify(configForm));
      setKanbanConfig(configForm);

      // Persiste no backend no registro desta igreja
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
          kanban_config: configForm
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

  const handleResetToDefault = () => {
    if (confirm("Deseja restaurar os nomes e cores padrão das etapas do Kanban?")) {
      setConfigForm(DEFAULT_KANBAN_CONFIG);
    }
  };

  const stages: Array<'RECEBIDO' | 'PREPARANDO' | 'PRONTO' | 'ENTREGUE'> = ['RECEBIDO', 'PREPARANDO', 'PRONTO', 'ENTREGUE'];

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
            Gerencie o fluxo de pedidos, preparo, retirada no balcão e entregas em tempo real.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            type="button"
            className="secondary-btn" 
            onClick={() => { setConfigForm(kanbanConfig); setIsConfigModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <span>⚙️</span> Personalizar Etapas & Nomes
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
           {stages.map((statusOption) => {
              const colOrders = orders.filter(o => o.status === statusOption);
              const stageConfig = kanbanConfig[statusOption] || DEFAULT_KANBAN_CONFIG[statusOption];
              const colColor = stageConfig.color || '#0f766e';

              return (
                 <div key={statusOption} style={{ flex: '0 0 320px', background: '#f8fafc', borderRadius: 18, padding: 16, border: '1px solid var(--panel-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ paddingBottom: 12, borderBottom: `3px solid ${colColor}`, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <div>
                         <div style={{ fontWeight: 900, color: 'var(--text-main)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                           <span>{stageConfig.icon}</span>
                           <span>{stageConfig.title}</span>
                         </div>
                         <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>
                           {stageConfig.description}
                         </div>
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
                                        {order.delivery_details || (order.delivery_method === 'counter' ? 'Retirada no Balcão da Cantina' : 'Entrega')}
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

                                   {/* Status Selector with Custom Church Stage Names */}
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
                                         <option key={st} value={st}>
                                           {kanbanConfig[st]?.icon} {kanbanConfig[st]?.title.toUpperCase()}
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
          MODAL DE PERSONALIZAÇÃO DAS ETAPAS DO KANBAN
          ======================================================== */}
      {isConfigModalOpen && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setIsConfigModalOpen(false)}>
          <form className="modal-studio-container" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()} onSubmit={handleSaveKanbanConfig}>
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
                  <span>⚙️</span>
                </div>
                <div>
                  <h2 className="modal-studio-title">Personalizar Etapas do Kanban</h2>
                  <p className="modal-studio-subtitle">
                    Adapte os nomes, ícones e descrições das colunas de acordo com a rotina e vocabulário da sua igreja.
                  </p>
                </div>
              </div>
              <button type="button" className="modal-close-circle" onClick={() => setIsConfigModalOpen(false)}>✕</button>
            </div>

            <div className="modal-studio-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {stages.map((st, idx) => (
                <div key={st} style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 900, color: configForm[st].color || '#0f766e', textTransform: 'uppercase' }}>
                      Etapa #{idx + 1} • Status do Sistema: {st}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Cor:</label>
                      <input 
                        type="color" 
                        value={configForm[st].color} 
                        onChange={e => setConfigForm({
                          ...configForm,
                          [st]: { ...configForm[st], color: e.target.value }
                        })}
                        style={{ width: 24, height: 24, border: 'none', borderRadius: 6, cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 10, marginBottom: 8 }}>
                    <div>
                      <label className="form-label-modern" style={{ fontSize: '0.68rem' }}>Ícone</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        value={configForm[st].icon} 
                        onChange={e => setConfigForm({
                          ...configForm,
                          [st]: { ...configForm[st], icon: e.target.value }
                        })}
                        placeholder="🔔"
                        style={{ textAlign: 'center', fontSize: '1rem' }}
                      />
                    </div>
                    <div>
                      <label className="form-label-modern" style={{ fontSize: '0.68rem' }}>Nome da Coluna / Etapa *</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        value={configForm[st].title} 
                        onChange={e => setConfigForm({
                          ...configForm,
                          [st]: { ...configForm[st], title: e.target.value }
                        })}
                        placeholder="Ex: Em Separação, Na Cozinha..."
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label-modern" style={{ fontSize: '0.68rem' }}>Subtítulo / Descrição da Etapa</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      value={configForm[st].description} 
                      onChange={e => setConfigForm({
                        ...configForm,
                        [st]: { ...configForm[st], description: e.target.value }
                      })}
                      placeholder="Ex: Itens em preparo na cantina..."
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-studio-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleResetToDefault}
                style={{ fontSize: '0.78rem' }}
              >
                ↺ Restaurar Padrão
              </button>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setIsConfigModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={savingConfig}>
                  {savingConfig ? "Salvando..." : "Salvar Nomes Personalizados"}
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
