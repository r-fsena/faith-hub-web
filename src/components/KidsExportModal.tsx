import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export interface KidsExportItem {
  id: string;
  child_id: string;
  child_name: string;
  birthdate?: string;
  room_id: string;
  room_name: string;
  room_color?: string;
  room_icon?: string;
  parent_name: string;
  parent_phone: string;
  parent_email?: string;
  parent_member_id?: string;
  is_visitor?: boolean;
  security_code: string;
  status: 'CHECKED_IN' | 'CALLING_PARENTS' | 'CHECKED_OUT';
  call_count?: number;
  call_reason?: string;
  call_message?: string;
  called_at?: string;
  checkin_at: string;
  checkout_at?: string;
  checked_in_by?: string;
  checked_out_by?: string;
  allergies?: string;
  medical_notes?: string;
}

interface KidsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrganization?: any;
  selectedCampusId?: string;
  rooms?: any[];
}

export const KidsExportModal: React.FC<KidsExportModalProps> = ({
  isOpen,
  onClose,
  selectedOrganization,
  selectedCampusId = 'all',
  rooms = []
}) => {
  const [data, setData] = useState<KidsExportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filtros
  const [period, setPeriod] = useState<'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM'>('TODAY');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchExportData();
    }
  }, [isOpen, period, startDate, endDate, selectedRoom, selectedStatus, selectedCampusId]);

  const fetchExportData = async () => {
    setLoading(true);
    try {
      const orgId = selectedOrganization?.id || 'org_default';
      let url = `${API_URL}/kids/checkins?organization_id=${orgId}`;

      if (selectedCampusId !== 'all') {
        url += `&campus_id=${selectedCampusId}`;
      }

      if (selectedRoom !== 'all') {
        url += `&room_id=${selectedRoom}`;
      }

      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }

      // Cálculo de datas conforme o período
      let sDate = '';
      let eDate = '';
      const now = new Date();

      if (period === 'TODAY') {
        sDate = now.toISOString().split('T')[0];
        eDate = sDate;
      } else if (period === 'LAST_7_DAYS') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        sDate = d.toISOString().split('T')[0];
        eDate = now.toISOString().split('T')[0];
      } else if (period === 'THIS_MONTH') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        sDate = d.toISOString().split('T')[0];
        eDate = now.toISOString().split('T')[0];
      } else if (period === 'CUSTOM') {
        sDate = startDate;
        eDate = endDate;
      }

      if (sDate) url += `&start_date=${sDate}`;
      if (eDate) url += `&end_date=${eDate}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar dados para exportação:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthdate?: string) => {
    if (!birthdate) return null;
    const birth = new Date(birthdate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR');
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return isNaN(d.getTime()) ? '-' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Filtragem local por texto
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      item.child_name.toLowerCase().includes(term) ||
      item.parent_name.toLowerCase().includes(term) ||
      (item.security_code || '').toLowerCase().includes(term) ||
      (item.parent_phone || '').includes(term) ||
      item.room_name.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // KPIs
  const totalChildren = filteredData.length;
  const activeCount = filteredData.filter(d => d.status === 'CHECKED_IN' || d.status === 'CALLING_PARENTS').length;
  const checkoutCount = filteredData.filter(d => d.status === 'CHECKED_OUT').length;
  const totalCalls = filteredData.reduce((acc, d) => acc + (d.call_count || (d.called_at ? 1 : 0)), 0);

  // Média de Idade
  const ages = filteredData.map(d => calculateAge(d.birthdate)).filter((a): a is number => a !== null);
  const avgAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : '-';

  // Exportar para CSV / Excel
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('Não há registros para exportar no período selecionado.');
      return;
    }

    const headers = [
      'ID Registro',
      'Data Culto/Evento',
      'Nome da Criança',
      'Tipo (Membro/Visitante)',
      'Idade (Anos)',
      'Data de Nascimento',
      'Sala / Turma',
      'Nome do Responsável',
      'Telefone / WhatsApp',
      'PIN de Segurança',
      'Hora Check-in',
      'Hora Checkout',
      'Status Atual',
      'Total de Chamados',
      'Motivo Último Chamado',
      'Operador Check-in',
      'Operador Checkout'
    ];

    const rows = filteredData.map(item => {
      const age = calculateAge(item.birthdate);
      const statusLabel = 
        item.status === 'CHECKED_IN' ? 'Presente na Sala' :
        item.status === 'CALLING_PARENTS' ? 'Em Chamado' : 'Checkout Concluído';

      return [
        `"${item.id}"`,
        `"${formatDate(item.checkin_at)}"`,
        `"${item.child_name.replace(/"/g, '""')}"`,
        `"${item.is_visitor ? 'Visitante' : 'Membro'}"`,
        `"${age !== null ? `${age} anos` : 'Não informada'}"`,
        `"${formatDate(item.birthdate)}"`,
        `"${item.room_name.replace(/"/g, '""')}"`,
        `"${item.parent_name.replace(/"/g, '""')}"`,
        `"${item.parent_phone || ''}"`,
        `"${item.security_code}"`,
        `"${formatTime(item.checkin_at)}"`,
        `"${formatTime(item.checkout_at)}"`,
        `"${statusLabel}"`,
        `"${item.call_count || (item.called_at ? 1 : 0)}"`,
        `"${(item.call_reason || '').replace(/"/g, '""')}"`,
        `"${(item.checked_in_by || 'Recepção').replace(/"/g, '""')}"`,
        `"${(item.checked_out_by || '-').replace(/"/g, '""')}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_ministerio_infantil_faith_hub_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copiar para Área de Transferência
  const handleCopyTable = () => {
    if (filteredData.length === 0) return;

    const headers = ['ID', 'Data', 'Criança', 'Idade', 'Sala', 'Responsável', 'Telefone', 'PIN', 'Check-in', 'Checkout', 'Status', 'Chamados'];
    const rows = filteredData.map(item => {
      const age = calculateAge(item.birthdate);
      const statusLabel = 
        item.status === 'CHECKED_IN' ? 'Presente' :
        item.status === 'CALLING_PARENTS' ? 'Em Chamado' : 'Concluído';

      return [
        item.id,
        formatDate(item.checkin_at),
        item.child_name,
        age !== null ? `${age} anos` : '-',
        item.room_name,
        item.parent_name,
        item.parent_phone || '-',
        item.security_code,
        formatTime(item.checkin_at),
        formatTime(item.checkout_at),
        statusLabel,
        item.call_count || (item.called_at ? 1 : 0)
      ].join('\t');
    });

    const text = [headers.join('\t'), ...rows].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Imprimir Relatório
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-backdrop animate-fade-in" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div 
        className="portal-card modal-studio-container" 
        style={{ 
          maxWidth: '1240px', 
          width: '100%', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0, 
          overflow: 'hidden',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)',
          background: '#ffffff'
        }}
      >
        {/* Modal Topbar */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)'
            }}>
              📊
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                Relatório & Exportação de Dados do Ministério Infantil
              </h2>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Auditoria de check-ins, horários, PINs de segurança e chamados aos responsáveis.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleCopyTable}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              title="Copiar dados tabulados para colar no Excel"
            >
              <span>{copied ? '✅' : '📋'}</span> {copied ? 'Copiado!' : 'Copiar'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              title="Imprimir relatório formatado ou salvar como PDF"
            >
              <span>🖨️</span> Imprimir / PDF
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}
              title="Baixar planilha CSV compatível com Excel e Google Sheets"
            >
              <span>📥</span> Exportar Excel (.csv)
            </button>

            <button 
              type="button" 
              onClick={onClose} 
              className="modal-close-circle"
              style={{ marginLeft: 6 }}
              title="Fechar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{
          padding: '16px 24px',
          background: '#f8fafc',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          {/* Período Pill Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: 4 }}>
              Período:
            </span>
            {[
              { id: 'TODAY', label: 'Hoje' },
              { id: 'LAST_7_DAYS', label: 'Últimos 7 dias' },
              { id: 'THIS_MONTH', label: 'Este Mês' },
              { id: 'ALL_TIME', label: 'Todo o Histórico' },
              { id: 'CUSTOM', label: 'Data Específica' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: period === p.id ? 'var(--accent-primary)' : 'var(--panel-border)',
                  background: period === p.id ? 'var(--accent-primary-light)' : '#ffffff',
                  color: period === p.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontWeight: period === p.id ? 800 : 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}

            {period === 'CUSTOM' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                />
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>até</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                />
              </div>
            )}
          </div>

          {/* Sala, Status e Busca */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <select
              value={selectedRoom}
              onChange={e => setSelectedRoom(e.target.value)}
              className="select-modern"
              style={{ width: 'auto', padding: '7px 12px', fontSize: '0.80rem' }}
            >
              <option value="all">Todas as Salas</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="select-modern"
              style={{ width: 'auto', padding: '7px 12px', fontSize: '0.80rem' }}
            >
              <option value="all">Todos os Status</option>
              <option value="CHECKED_IN">Presentes na Sala</option>
              <option value="CHECKED_OUT">Checkout Realizado</option>
              <option value="CALLING_PARENTS">Em Chamado Ativo</option>
            </select>

            <div className="search-pill" style={{ width: '220px', padding: '6px 12px' }}>
              <input
                type="text"
                placeholder="Buscar criança, pai, PIN..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.80rem' }}
              />
            </div>
          </div>
        </div>

        {/* KPI Mini-Bar */}
        <div style={{
          padding: '12px 24px',
          background: '#ffffff',
          borderBottom: '1px solid var(--panel-border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12
        }}>
          <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--panel-border)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total de Registros</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>{totalChildren}</div>
          </div>

          <div style={{ background: '#ecfdf5', padding: '8px 12px', borderRadius: 10, border: '1px solid #a7f3d0' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Presentes na Sala</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#059669', marginTop: 2 }}>{activeCount}</div>
          </div>

          <div style={{ background: '#f0f9ff', padding: '8px 12px', borderRadius: 10, border: '1px solid #bae6fd' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>Checkouts Realizados</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0284c7', marginTop: 2 }}>{checkoutCount}</div>
          </div>

          <div style={{ background: '#fef2f2', padding: '8px 12px', borderRadius: 10, border: '1px solid #fecaca' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>Chamados Disparados</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#dc2626', marginTop: 2 }}>{totalCalls}</div>
          </div>

          <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--panel-border)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Média de Idade</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>{avgAge} {avgAge !== '-' ? 'anos' : ''}</div>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px auto' }} />
              Carregando relatório de check-ins...
            </div>
          ) : filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📋</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Nenhum registro encontrado</h3>
              <p style={{ fontSize: '0.84rem', marginTop: 4 }}>Altere o período ou os filtros selecionados para visualizar os check-ins.</p>
            </div>
          ) : (
            <table className="custom-table" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '12px 14px' }}>Data</th>
                  <th style={{ padding: '12px 14px' }}>Criança</th>
                  <th style={{ padding: '12px 14px' }}>Idade</th>
                  <th style={{ padding: '12px 14px' }}>Sala / Turma</th>
                  <th style={{ padding: '12px 14px' }}>Responsável</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>PIN</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Entrada</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Saída</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Chamados</th>
                  <th style={{ padding: '12px 14px' }}>Operador</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(item => {
                  const age = calculateAge(item.birthdate);
                  const isCalling = item.status === 'CALLING_PARENTS';
                  const isCheckedOut = item.status === 'CHECKED_OUT';

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {formatDate(item.checkin_at)}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{item.child_name}</div>
                        {item.is_visitor ? (
                          <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            Visitante
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#059669', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            Membro
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                        {age !== null ? `${age} anos` : '-'}
                      </td>

                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: item.room_color ? `${item.room_color}15` : '#f1f5f9',
                          color: item.room_color || 'var(--text-main)'
                        }}>
                          <span>{item.room_icon || '🎨'}</span> {item.room_name}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.parent_name}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.parent_phone || '-'}</div>
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.88rem',
                          fontWeight: 900,
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          padding: '3px 8px',
                          borderRadius: 6,
                          letterSpacing: '0.05em',
                          color: 'var(--text-main)'
                        }}>
                          {item.security_code}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#059669' }}>
                        {formatTime(item.checkin_at)}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: isCheckedOut ? '#0284c7' : 'var(--text-muted)' }}>
                        {isCheckedOut ? formatTime(item.checkout_at) : 'Presente'}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {isCalling ? (
                          <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 800 }}>
                            🚨 Em Chamado
                          </span>
                        ) : isCheckedOut ? (
                          <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 800 }}>
                            ✓ Devolvido
                          </span>
                        ) : (
                          <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '3px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 800 }}>
                            ● Na Sala
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        {(item.call_count && item.call_count > 0) || item.called_at ? (
                          <span 
                            style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: 6, fontWeight: 900, fontSize: '0.76rem', cursor: item.call_reason ? 'help' : 'default' }}
                            title={item.call_reason ? `Motivo: ${item.call_reason}` : undefined}
                          >
                            {item.call_count || 1}x {item.call_reason ? `(${item.call_reason})` : ''}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>0</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        <div>Entrada: <strong>{item.checked_in_by || 'Recepção'}</strong></div>
                        {item.checked_out_by && <div>Saída: <strong>{item.checked_out_by}</strong></div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--panel-border)',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            Total de <strong>{filteredData.length}</strong> registro(s) listado(s).
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '6px 16px', fontWeight: 700 }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
