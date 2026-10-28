import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Members.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

type StockStatus = 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'NOT_TRACKED';
type MovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'LOSS' | 'OPENING_BALANCE';

type InventoryItem = {
  product_id: string;
  name: string;
  category: string;
  sku?: string | null;
  barcode?: string | null;
  unit: string;
  status: string;
  track_inventory: boolean;
  campus_id: string;
  campus_name: string;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  minimum_stock: number;
  stock_status: StockStatus;
};

type Movement = {
  id: string;
  product_name: string;
  sku?: string | null;
  unit: string;
  movement_type: string;
  quantity_delta: number;
  reserved_delta: number;
  reason: string;
  campus_id: string;
  created_at: string;
};

type Summary = {
  products: number;
  units_on_hand: number;
  units_reserved: number;
  low_stock: number;
  out_of_stock: number;
};

const EMPTY_SUMMARY: Summary = { products: 0, units_on_hand: 0, units_reserved: 0, low_stock: 0, out_of_stock: 0 };

const statusMeta: Record<StockStatus, { label: string; color: string; background: string }> = {
  HEALTHY: { label: 'Estoque normal', color: '#047857', background: '#ecfdf5' },
  LOW_STOCK: { label: 'Estoque baixo', color: '#b45309', background: '#fffbeb' },
  OUT_OF_STOCK: { label: 'Sem estoque', color: '#b91c1c', background: '#fef2f2' },
  NOT_TRACKED: { label: 'Não monitorado', color: '#475569', background: '#f1f5f9' }
};

const movementLabels: Record<string, string> = {
  ENTRY: 'Entrada', EXIT: 'Saída', ADJUSTMENT: 'Ajuste', LOSS: 'Perda/avaria', OPENING_BALANCE: 'Saldo inicial',
  RESERVATION: 'Reserva de pedido', RESERVATION_RELEASE: 'Liberação de reserva', SALE: 'Venda', SALE_REVERSAL: 'Estorno da venda'
};

interface PdvEstoqueProps {
  selectedCampusId?: string;
  selectedOrganization?: any;
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export const PdvEstoque: React.FC<PdvEstoqueProps> = ({ selectedCampusId = 'all', selectedOrganization }) => {
  const organizationId = selectedOrganization?.id || 'org_default';
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StockStatus>('ALL');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('ENTRY');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const campusQuery = selectedCampusId && selectedCampusId !== 'all' ? `&campus_id=${encodeURIComponent(selectedCampusId)}` : '&campus_id=all';

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const headers = await authHeaders();
      const response = await fetch(`${API_URL}/pdv/inventory?organization_id=${encodeURIComponent(organizationId)}${campusQuery}`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Não foi possível carregar o estoque.');
      setInventory(Array.isArray(data.inventory) ? data.inventory : []);
      setSummary(data.summary || EMPTY_SUMMARY);
    } catch (currentError: any) {
      setError(currentError.message || 'Não foi possível carregar o estoque.');
    } finally {
      setLoading(false);
    }
  }, [organizationId, campusQuery]);

  const loadMovements = useCallback(async () => {
    try {
      const headers = await authHeaders();
      const response = await fetch(`${API_URL}/pdv/inventory/movements?organization_id=${encodeURIComponent(organizationId)}${campusQuery}`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Não foi possível carregar o histórico.');
      setMovements(Array.isArray(data) ? data : []);
    } catch (currentError: any) {
      setError(currentError.message || 'Não foi possível carregar o histórico.');
    }
  }, [organizationId, campusQuery]);

  useEffect(() => {
    loadInventory();
    loadMovements();
  }, [loadInventory, loadMovements]);

  const filtered = useMemo(() => inventory.filter(item => {
    if (statusFilter !== 'ALL' && item.stock_status !== statusFilter) return false;
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [item.name, item.category, item.sku, item.barcode, item.campus_name].some(value => String(value || '').toLowerCase().includes(term));
  }), [inventory, search, statusFilter]);

  const openMovement = (item: InventoryItem, type: MovementType) => {
    setSelectedItem(item);
    setMovementType(type);
    setQuantity(type === 'ADJUSTMENT' || type === 'OPENING_BALANCE' ? String(item.on_hand_quantity) : '');
    setReason('');
    setNotes('');
  };

  const submitMovement = async () => {
    if (!selectedItem || !reason.trim() || quantity === '' || Number(quantity) < 0) return;
    setSaving(true);
    try {
      const headers = await authHeaders();
      const response = await fetch(`${API_URL}/pdv/inventory/movements`, {
        method: 'POST', headers,
        body: JSON.stringify({
          organization_id: organizationId,
          campus_id: selectedItem.campus_id,
          product_id: selectedItem.product_id,
          type: movementType,
          quantity: Number(quantity),
          reason: reason.trim(),
          notes: notes.trim() || null
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Não foi possível registrar a movimentação.');
      setSelectedItem(null);
      await Promise.all([loadInventory(), loadMovements()]);
    } catch (currentError: any) {
      alert(currentError.message || 'Não foi possível registrar a movimentação.');
    } finally {
      setSaving(false);
    }
  };

  const updateMinimumStock = async (item: InventoryItem) => {
    const input = window.prompt(`Estoque mínimo de “${item.name}” na unidade ${item.campus_name}:`, String(item.minimum_stock));
    if (input === null) return;
    const minimum = Number(input.replace(',', '.'));
    if (!Number.isFinite(minimum) || minimum < 0) {
      alert('Informe um estoque mínimo válido.');
      return;
    }
    try {
      const headers = await authHeaders();
      const response = await fetch(`${API_URL}/pdv/inventory/${item.product_id}/settings`, {
        method: 'PUT', headers,
        body: JSON.stringify({ organization_id: organizationId, campus_id: item.campus_id, minimum_stock: minimum })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Não foi possível atualizar o estoque mínimo.');
      await loadInventory();
    } catch (currentError: any) {
      alert(currentError.message || 'Não foi possível atualizar o estoque mínimo.');
    }
  };

  const cards = [
    { label: 'Produtos monitorados', value: summary.products, helper: 'Com controle de estoque', color: '#0f766e' },
    { label: 'Unidades físicas', value: summary.units_on_hand, helper: `${summary.units_reserved} reservadas`, color: '#2563eb' },
    { label: 'Estoque baixo', value: summary.low_stock, helper: 'No mínimo definido', color: '#d97706' },
    { label: 'Sem estoque', value: summary.out_of_stock, helper: 'Exigem reposição', color: '#dc2626' }
  ];

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      <div className="card-header-row" style={{ paddingBottom: 20, borderBottom: '1px solid var(--panel-border)', marginBottom: 20 }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.4rem' }}>Controle de Estoque</h1>
          <p className="card-subtitle">Saldos por unidade, reservas de pedidos, entradas, saídas e ajustes auditáveis.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowHistory(value => !value)}>{showHistory ? '📦 Ver saldos' : '🕘 Histórico'}</button>
          <button className="btn-primary" onClick={() => Promise.all([loadInventory(), loadMovements()])}>↻ Atualizar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 20 }}>
        {cards.map(card => (
          <div className="portal-card" key={card.label} style={{ padding: 18, borderTop: `3px solid ${card.color}` }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '.76rem', fontWeight: 800 }}>{card.label}</div>
            <div style={{ color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 900, margin: '5px 0 2px' }}>{card.value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '.72rem' }}>{card.helper}</div>
          </div>
        ))}
      </div>

      {error && <div style={{ padding: 14, borderRadius: 12, background: '#fef2f2', color: '#991b1b', marginBottom: 16 }}>{error}</div>}

      {showHistory ? (
        <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 18, borderBottom: '1px solid var(--panel-border)' }}>
            <strong>Livro de movimentações</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: '.76rem', marginTop: 4 }}>Registros cronológicos e imutáveis das alterações de estoque.</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ width: '100%' }}>
              <thead><tr><th>Data</th><th>Produto</th><th>Movimento</th><th>Físico</th><th>Reserva</th><th>Motivo</th></tr></thead>
              <tbody>
                {movements.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 36 }}>Nenhuma movimentação registrada.</td></tr> : movements.map(movement => (
                  <tr key={movement.id}>
                    <td>{new Date(movement.created_at).toLocaleString('pt-BR')}</td>
                    <td><strong>{movement.product_name}</strong><div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{movement.sku || movement.campus_id}</div></td>
                    <td>{movementLabels[movement.movement_type] || movement.movement_type}</td>
                    <td style={{ color: movement.quantity_delta < 0 ? '#dc2626' : movement.quantity_delta > 0 ? '#059669' : 'inherit', fontWeight: 800 }}>{movement.quantity_delta > 0 ? '+' : ''}{movement.quantity_delta}</td>
                    <td style={{ fontWeight: 700 }}>{movement.reserved_delta > 0 ? '+' : ''}{movement.reserved_delta}</td>
                    <td>{movement.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="portal-card" style={{ padding: 14, display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <input className="input-modern" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar produto, SKU ou código de barras" style={{ flex: '1 1 260px' }} />
            <select className="select-modern" value={statusFilter} onChange={event => setStatusFilter(event.target.value as any)} style={{ width: 190 }}>
              <option value="ALL">Todos os status</option><option value="HEALTHY">Estoque normal</option><option value="LOW_STOCK">Estoque baixo</option><option value="OUT_OF_STOCK">Sem estoque</option><option value="NOT_TRACKED">Não monitorados</option>
            </select>
          </div>
          <div className="portal-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%' }}>
                <thead><tr><th>Produto</th><th>Unidade</th><th>Físico</th><th>Reservado</th><th>Disponível</th><th>Mínimo</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Carregando estoque...</td></tr> : filtered.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Nenhum produto encontrado.</td></tr> : filtered.map(item => {
                    const meta = statusMeta[item.stock_status];
                    return (
                      <tr key={`${item.product_id}-${item.campus_id}`}>
                        <td><strong>{item.name}</strong><div style={{ color: 'var(--text-muted)', fontSize: '.7rem' }}>{item.sku || 'Sem SKU'} · {item.category}</div></td>
                        <td>{item.campus_name}</td><td><strong>{item.on_hand_quantity} {item.unit}</strong></td><td>{item.reserved_quantity}</td><td><strong>{item.available_quantity}</strong></td>
                        <td><button type="button" onClick={() => updateMinimumStock(item)} title="Editar estoque mínimo" style={{ border: 0, background: 'transparent', color: 'var(--accent-primary)', fontWeight: 800, cursor: 'pointer' }}>{item.minimum_stock} ✎</button></td>
                        <td><span style={{ background: meta.background, color: meta.color, borderRadius: 999, padding: '5px 9px', fontWeight: 800, fontSize: '.7rem' }}>{meta.label}</span></td>
                        <td>
                          {item.track_inventory ? <div style={{ display: 'flex', gap: 5 }}>
                            <button className="action-circle-btn" title="Registrar entrada" onClick={() => openMovement(item, 'ENTRY')}>＋</button>
                            <button className="action-circle-btn" title="Registrar saída" onClick={() => openMovement(item, 'EXIT')}>−</button>
                            <button className="action-circle-btn" title="Ajustar saldo contado" onClick={() => openMovement(item, item.on_hand_quantity === 0 ? 'OPENING_BALANCE' : 'ADJUSTMENT')}>⚖</button>
                          </div> : <span style={{ color: 'var(--text-muted)', fontSize: '.72rem' }}>Ative no cadastro do produto</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedItem && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => !saving && setSelectedItem(null)}>
          <div className="modal-studio-container" style={{ maxWidth: 560 }} onClick={event => event.stopPropagation()}>
            <div className="modal-studio-header">
              <div><h2 className="modal-studio-title">{movementLabels[movementType]}</h2><p className="modal-studio-subtitle">{selectedItem.name} · {selectedItem.campus_name}</p></div>
              <button className="modal-close-circle" onClick={() => setSelectedItem(null)} disabled={saving}>×</button>
            </div>
            <div className="modal-studio-body" style={{ display: 'grid', gap: 16 }}>
              <div className="form-group-modern"><label className="form-label-modern">{movementType === 'ADJUSTMENT' || movementType === 'OPENING_BALANCE' ? 'Novo saldo físico' : 'Quantidade'}</label><input type="number" min="0" step="0.001" className="input-modern" value={quantity} onChange={event => setQuantity(event.target.value)} /></div>
              <div className="form-group-modern"><label className="form-label-modern">Motivo *</label><input className="input-modern" value={reason} onChange={event => setReason(event.target.value)} placeholder="Ex.: recebimento de fornecedor, contagem física, avaria" maxLength={255} /></div>
              <div className="form-group-modern"><label className="form-label-modern">Observações</label><textarea className="input-modern" value={notes} onChange={event => setNotes(event.target.value)} rows={3} /></div>
              <div style={{ padding: 12, borderRadius: 10, background: '#f8fafc', color: 'var(--text-secondary)', fontSize: '.78rem' }}>Saldo atual: <strong>{selectedItem.on_hand_quantity}</strong> · Reservado: <strong>{selectedItem.reserved_quantity}</strong></div>
            </div>
            <div className="modal-studio-footer"><button className="btn-secondary" onClick={() => setSelectedItem(null)} disabled={saving}>Cancelar</button><button className="btn-primary" onClick={submitMovement} disabled={saving || !reason.trim() || quantity === ''}>{saving ? 'Salvando…' : 'Confirmar movimentação'}</button></div>
          </div>
        </div>, document.body
      )}
    </div>
  );
};
