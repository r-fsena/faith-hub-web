import { useState, useEffect, useRef } from 'react';
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

export const PdvPedidos = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const knownOrders = useRef<Set<string>>(new Set());

  // Som de notificação padrão: bipe rápido (base64)
  const beepSound = "data:audio/wav;base64,UklGRnQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAGAACAgICAgICAgICAgICAgICAgICAgICAgIB4d25sZ19bVFFQT1BQUE9RUlVZW2BkcHmAio2SlZeamZmWlZaRjIeDfnl0cW9rZ2NeWVRTUVBPTk1OT1FSVllbYGVweoKJjZKVl5qZmZaVlpGMh4N+eXRxb2tnY15ZVFNROE9OTU5PUVJWVVtgZXB6gomNkpWXmpqZlpaWkYyHg355dHFva2djXllUU1FQTk5NTk9RUlVZW2BkcHmBiY2SlZebmpmWlZaRjIeDfnl0cW9rZ2NeWVRTUVBPTk1OT1FSVllbYGVweoKJjZKVl5qbmZaVlpGMh4N+eXRxb2tnY15ZVFNROE9OTU5PUVJWVVtgZXB6gomNkpWXmpqZlpaWkYyHg355dHFva2djXllUU1FQTk5NTk9RUlVZW2BkcHmBiY2SlZebmpmWlZaRjIeDfnl0cW9rZ2NeWVRTUVBPTk1OT1FSVllbYGVweoKJjZKVl5p=";

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return token ? { 'Authorization': `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  const loadOrders = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pdv/orders`, { headers });
      if (res.ok) {
        const data = await res.json();
        const parsed: OrderData[] = data.map((o: any) => ({
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
    loadOrders();
    const interval = setInterval(() => {
      loadOrders();
    }, 10000); // Poll a cada 10 segundos
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="members-container animate-fade-in" style={{ width: '100%' }}>
      <div className="header-actions" style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Central de Vendas e Pedidos</h2>
          <p style={{ color: '#888', marginTop: 8 }}>Gerencie as vendas, separações e despachos da igreja em tempo real.</p>
        </div>
        <button className="secondary-btn" onClick={loadOrders}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Atualizar Force
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Buscando novas vendas...</div>
      ) : (
        <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 24, minHeight: '60vh', alignItems: 'flex-start' }}>
           {['RECEBIDO', 'PREPARANDO', 'PRONTO', 'ENTREGUE'].map((statusOption) => {
              const colOrders = orders.filter(o => o.status === statusOption);
              
              let colTitle = '';
              let colColor = '';
              if (statusOption === 'RECEBIDO') { colTitle = '🔔 Novos / Recebidos'; colColor = '#ef4444'; }
              if (statusOption === 'PREPARANDO') { colTitle = '⏳ Em Separação'; colColor = '#f59e0b'; }
              if (statusOption === 'PRONTO') { colTitle = '✅ Aguardando Retirada'; colColor = '#3b82f6'; }
              if (statusOption === 'ENTREGUE') { colTitle = '🎉 Finalizados'; colColor = '#10b981'; }

              return (
                 <div key={statusOption} style={{ flex: '0 0 320px', background: 'rgba(0,0,0,0.05)', borderRadius: 16, padding: 16, border: `1px solid var(--border-color)` }}>
                    <div style={{ paddingBottom: 16, borderBottom: `2px solid ${colColor}`, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{colTitle}</span>
                       <span style={{ background: colColor, color: '#FFF', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 800 }}>{colOrders.length}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                       {colOrders.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: 20 }}>Vazio</div>}
                       {colOrders.map(order => {
                          const items: OrderItem[] = Array.isArray(order.items_json) ? order.items_json : [];
                          return (
                             <div key={order.id} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `6px solid ${colColor}` }}>
                                <div style={{ background: 'var(--panel-bg)', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                   <div>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                       <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-main)' }}>#{order.id.substring(0,6).toUpperCase()}</div>
                                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-color)', padding: '2px 6px', borderRadius: 4 }}>{new Date(order.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</div>
                                     </div>
                                     <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        {order.user_name || 'Usuário Não Identificado'}
                                     </div>
                                   </div>
                                </div>
                                <div style={{ padding: 16 }}>
                                   <div style={{ marginBottom: 12, background: 'rgba(10, 126, 164, 0.05)', border: '1px solid rgba(10, 126, 164, 0.2)', padding: 12, borderRadius: 8 }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Logística / Endereço</span>
                                      <span style={{ fontSize: '0.90rem', fontWeight: 600, color: '#0a7ea4', display: 'block', lineHeight: 1.4 }}>{order.delivery_details}</span>
                                      {order.delivery_method === 'home' && <span style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: 8, display: 'inline-block', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: 4, fontWeight: 700 }}>⚠️ Requer Despacho (Motoboy)</span>}
                                   </div>
                                   <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 16 }}>
                                      {items.map((itm, i) => (
                                         <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>{itm.qty}x</span> <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{itm.name}</span>
                                            {itm.obs && (
                                               <div style={{ display: 'flex', alignItems: 'center', marginTop: 4, background: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
                                                  <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>{itm.obs}</span>
                                               </div>
                                            )}
                                         </li>
                                      ))}
                                   </ul>
                                   <select 
                                     value={order.status} 
                                     onChange={(e) => updateStatus(order.id, e.target.value)}
                                     style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontWeight: 600 }}
                                   >
                                     <option value="RECEBIDO">NOVO / RECEBIDO</option>
                                     <option value="PREPARANDO">EM SEPARAÇÃO</option>
                                     <option value="PRONTO">AGUARDANDO RETIRADA</option>
                                     <option value="ENTREGUE">FINALIZADO / ENTREGUE</option>
                                     <option value="CANCELADO">CANCELADO</option>
                                   </select>
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
    </div>
  );
};
