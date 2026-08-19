import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Members.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export interface FinancialTransaction {
  id: string;
  organization_id: string;
  campus_id?: string;
  campus_name?: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  payment_method: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'CASH' | 'TRANSFER';
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  member_id?: string;
  member_name?: string;
  project_id?: string;
  project_title?: string;
  origin_module: 'TITHES' | 'PDV' | 'EVENTS' | 'MANUAL' | 'CELL';
  receipt_url?: string;
  due_date?: string;
  payment_date: string;
  created_at: string;
}

export interface SpecialProject {
  id: string;
  organization_id: string;
  campus_id?: string;
  title: string;
  description?: string;
  image_url?: string;
  target_amount: number;
  collected_amount: number;
  start_date: string;
  end_date?: string;
  pix_key?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  total_donations?: number;
}

export interface FinancialSummaryData {
  total_income: number;
  total_expense: number;
  net_balance: number;
  pending_income: number;
  pending_expense: number;
  total_transactions: number;
  income_by_category: { category: string; total: number; count: number }[];
  expense_by_category: { category: string; total: number; count: number }[];
  income_by_method: { payment_method: string; total: number; count: number }[];
}

interface FinancialTreasuryProps {
  selectedCampusId?: string;
  selectedOrganization?: any;
}

const INCOME_CATEGORIES = [
  'Dízimo',
  'Oferta',
  'Oferta de Missões',
  'Cantina / PDV',
  'Eventos & Cursos',
  'Campanha / Projeto',
  'Doação Especial',
  'Outras Entradas'
];

const EXPENSE_CATEGORIES = [
  'Instalações & Aluguel',
  'Energia & Água',
  'Prebenda Pastoral / Salários',
  'Som & Mídia',
  'Manutenção Predial',
  'Ação Social & Cestas',
  'Ministério Infantil',
  'Evangelismo & Missões',
  'Materiais de Escritório / Limpeza',
  'Outras Despesas'
];

export const FinancialTreasury: React.FC<FinancialTreasuryProps> = ({
  selectedCampusId = 'all',
  selectedOrganization
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dre' | 'tithes' | 'expenses' | 'projects' | 'statement'>('dre');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [projects, setProjects] = useState<SpecialProject[]>([]);
  const [summary, setSummary] = useState<FinancialSummaryData>({
    total_income: 0,
    total_expense: 0,
    net_balance: 0,
    pending_income: 0,
    pending_expense: 0,
    total_transactions: 0,
    income_by_category: [],
    expense_by_category: [],
    income_by_method: []
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');

  // Modais
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [modalTransactionType, setModalTransactionType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMemberReportModalOpen, setIsMemberReportModalOpen] = useState(false);
  const [selectedMemberForReport, setSelectedMemberForReport] = useState<string>('');

  // Form State Transação
  const [formData, setFormData] = useState({
    category: 'Dízimo',
    description: '',
    amount: '',
    payment_method: 'PIX',
    status: 'PAID',
    member_name: '',
    project_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    due_date: ''
  });

  // Form State Projeto
  const [projectFormData, setProjectFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    collected_amount: '0',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    pix_key: ''
  });

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    } catch {
      return { 'Content-Type': 'application/json' };
    }
  };

  const orgId = selectedOrganization?.id || 'org_default';

  useEffect(() => {
    loadAllFinancialData();
  }, [orgId, selectedCampusId]);

  const loadAllFinancialData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('organization_id', orgId);
      if (selectedCampusId && selectedCampusId !== 'all') {
        params.append('campus_id', selectedCampusId);
      }

      const [transRes, summaryRes, projRes] = await Promise.all([
        fetch(`${API_URL}/financial/transactions?${params.toString()}`),
        fetch(`${API_URL}/financial/summary?${params.toString()}`),
        fetch(`${API_URL}/financial/projects?organization_id=${orgId}`)
      ]);

      if (transRes.ok) {
        const json = await transRes.json();
        setTransactions(json.data || []);
      }

      if (summaryRes.ok) {
        const sumJson = await summaryRes.json();
        setSummary(sumJson);
      }

      if (projRes.ok) {
        const projJson = await projRes.json();
        setProjects(projJson.data || []);
      }
    } catch (e) {
      console.error('Erro ao carregar dados financeiros:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      alert('Preencha a descrição e o valor da movimentação.');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const payload = {
        organization_id: orgId,
        campus_id: selectedCampusId !== 'all' ? selectedCampusId : null,
        type: modalTransactionType,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        status: formData.status,
        member_name: formData.member_name || null,
        project_id: formData.project_id || null,
        payment_date: formData.payment_date,
        due_date: formData.due_date || null
      };

      const res = await fetch(`${API_URL}/financial/transactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsTransactionModalOpen(false);
        setFormData({
          category: modalTransactionType === 'INCOME' ? 'Dízimo' : 'Instalações & Aluguel',
          description: '',
          amount: '',
          payment_method: 'PIX',
          status: 'PAID',
          member_name: '',
          project_id: '',
          payment_date: new Date().toISOString().split('T')[0],
          due_date: ''
        });
        loadAllFinancialData();
      } else {
        alert('Erro ao registrar movimentação financeira.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de comunicação.');
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFormData.title || !projectFormData.target_amount) {
      alert('Preencha o título e o valor da meta.');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const payload = {
        organization_id: orgId,
        title: projectFormData.title,
        description: projectFormData.description,
        target_amount: parseFloat(projectFormData.target_amount),
        collected_amount: parseFloat(projectFormData.collected_amount || '0'),
        start_date: projectFormData.start_date,
        end_date: projectFormData.end_date || null,
        pix_key: projectFormData.pix_key || null
      };

      const res = await fetch(`${API_URL}/financial/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsProjectModalOpen(false);
        setProjectFormData({
          title: '',
          description: '',
          target_amount: '',
          collected_amount: '0',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          pix_key: ''
        });
        loadAllFinancialData();
      } else {
        alert('Erro ao criar projeto/campanha.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de comunicação.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Deseja realmente remover este lançamento financeiro?')) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/financial/transactions/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        loadAllFinancialData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  // Filtragem de transações
  const filteredTransactions = transactions.filter(t => {
    if (selectedTypeFilter && t.type !== selectedTypeFilter) return false;
    if (selectedCategoryFilter && t.category !== selectedCategoryFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        t.description.toLowerCase().includes(term) ||
        (t.member_name && t.member_name.toLowerCase().includes(term)) ||
        t.category.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const tithesAndOfferings = transactions.filter(t => t.type === 'INCOME' && ['Dízimo', 'Oferta', 'Oferta de Missões', 'Campanha / Projeto'].includes(t.category));
  const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');

  // Informe anual por membro
  const memberReportTransactions = selectedMemberForReport
    ? transactions.filter(t => t.member_name && t.member_name.toLowerCase().includes(selectedMemberForReport.toLowerCase()) && t.type === 'INCOME')
    : [];
  const totalMemberContributed = memberReportTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);

  return (
    <div className="members-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900 }}>
              💳
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.4px' }}>
                Gestão Financeira & Tesouraria
              </h1>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Controle completo de Dízimos, Ofertas, Projetos, Cantina/PDV, Despesas e DRE da <strong>{selectedOrganization?.name || 'Igreja'}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              setModalTransactionType('INCOME');
              setFormData({ ...formData, category: 'Dízimo' });
              setIsTransactionModalOpen(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
            }}
          >
            + Registrar Entrada / Dízimo
          </button>

          <button
            type="button"
            onClick={() => {
              setModalTransactionType('EXPENSE');
              setFormData({ ...formData, category: 'Instalações & Aluguel' });
              setIsTransactionModalOpen(true);
            }}
            style={{
              background: '#ffffff',
              color: '#dc2626',
              border: '1.5px solid #fca5a5',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            - Nova Despesa / Conta
          </button>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Card 1: Saldo Líquido */}
        <div className="portal-card" style={{ padding: '20px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '18px' }}>
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Saldo Consolidado em Caixa
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, marginTop: '6px', color: summary.net_balance >= 0 ? '#34d399' : '#f87171' }}>
            {formatCurrency(summary.net_balance)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '4px' }}>
            Receitas Líquidas vs Despesas Pagas
          </div>
        </div>

        {/* Card 2: Entradas do Mês */}
        <div className="portal-card" style={{ padding: '20px', borderRadius: '18px', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
            📈 Total de Entradas (Receitas)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
            {formatCurrency(summary.total_income)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
            {summary.income_by_category.length} categorias ativas de arrecadação
          </div>
        </div>

        {/* Card 3: Saídas do Mês */}
        <div className="portal-card" style={{ padding: '20px', borderRadius: '18px', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
            📉 Total de Saídas (Despesas)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626', marginTop: '6px' }}>
            {formatCurrency(summary.total_expense)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
            Custos operacionais e ministeriais
          </div>
        </div>

        {/* Card 4: Campanhas Ativas */}
        <div className="portal-card" style={{ padding: '20px', borderRadius: '18px', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
            🎯 Campanhas com Metas
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#7c3aed', marginTop: '6px' }}>
            {projects.filter(p => p.status === 'ACTIVE').length} Ativas
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
            {formatCurrency(projects.reduce((acc, p) => acc + Number(p.collected_amount || 0), 0))} arrecadados
          </div>
        </div>

      </div>

      {/* TABS DE NAVEGAÇÃO FINANCEIRA */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setActiveSubTab('dre')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: activeSubTab === 'dre' ? 'var(--accent-primary)' : 'transparent',
            color: activeSubTab === 'dre' ? '#ffffff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          📊 Visão Geral & DRE
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tithes')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: activeSubTab === 'tithes' ? 'var(--accent-primary)' : 'transparent',
            color: activeSubTab === 'tithes' ? '#ffffff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          🙏 Dízimos & Ofertas ({tithesAndOfferings.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('expenses')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: activeSubTab === 'expenses' ? 'var(--accent-primary)' : 'transparent',
            color: activeSubTab === 'expenses' ? '#ffffff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          🧾 Despesas & Contas a Pagar ({expenseTransactions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('projects')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: activeSubTab === 'projects' ? 'var(--accent-primary)' : 'transparent',
            color: activeSubTab === 'projects' ? '#ffffff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          🎯 Campanhas & Projetos ({projects.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('statement')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: activeSubTab === 'statement' ? 'var(--accent-primary)' : 'transparent',
            color: activeSubTab === 'statement' ? '#ffffff' : 'var(--text-main)',
            fontWeight: 800,
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          📋 Extrato & Relatórios
        </button>
      </div>

      {loading ? (
        <div className="portal-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando dados financeiros e movimentações...
        </div>
      ) : (
        <>
          {/* TAB 1: VISÃO GERAL & DRE */}
          {activeSubTab === 'dre' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              
              {/* Box Entradas por Categoria */}
              <div className="portal-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#059669', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🟢</span> Fontes de Arrecadação (Entradas)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {summary.income_by_category.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '16px 0' }}>Nenhuma entrada registrada no período.</div>
                  ) : (
                    summary.income_by_category.map((cat, idx) => {
                      const pct = summary.total_income > 0 ? (cat.total / summary.total_income) * 100 : 0;
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                            <span>{cat.category} ({cat.count})</span>
                            <span style={{ color: '#059669' }}>{formatCurrency(cat.total)} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#10b981', width: `${pct}%`, borderRadius: '4px' }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Box Saídas por Categoria */}
              <div className="portal-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#dc2626', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔴</span> Distribuição de Despesas (Saídas)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {summary.expense_by_category.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '16px 0' }}>Nenhuma despesa registrada no período.</div>
                  ) : (
                    summary.expense_by_category.map((cat, idx) => {
                      const pct = summary.total_expense > 0 ? (cat.total / summary.total_expense) * 100 : 0;
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                            <span>{cat.category} ({cat.count})</span>
                            <span style={{ color: '#dc2626' }}>{formatCurrency(cat.total)} ({pct.toFixed(1)}%)</span>
                          </div>
                          <div style={{ height: '8px', background: '#fee2e2', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#ef4444', width: `${pct}%`, borderRadius: '4px' }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Box Formas de Pagamento Utilizadas */}
              <div className="portal-card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px 0' }}>
                  💳 Canais de Pagamento Recebidos
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {summary.income_by_method.map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700 }}>
                      <span>{m.payment_method === 'CREDIT_CARD' ? '💳 Cartão de Crédito' : m.payment_method === 'PIX' ? '⚡ PIX Instantâneo' : m.payment_method === 'CASH' ? '💵 Dinheiro em Espécie' : m.payment_method}</span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>{formatCurrency(m.total)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DÍZIMOS & OFERTAS */}
          {activeSubTab === 'tithes' && (
            <div className="portal-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Extrato de Dízimos e Ofertas
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Total arrecadado: <strong>{formatCurrency(tithesAndOfferings.reduce((acc, t) => acc + Number(t.amount || 0), 0))}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsMemberReportModalOpen(true)}
                    style={{
                      background: '#f0fdfa',
                      color: '#0f766e',
                      border: '1px solid #99f6e4',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    📄 Emitir Informe do Dizimista
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Data</th>
                      <th style={{ padding: '12px' }}>Categoria</th>
                      <th style={{ padding: '12px' }}>Membro / Doador</th>
                      <th style={{ padding: '12px' }}>Descrição</th>
                      <th style={{ padding: '12px' }}>Canal</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Valor</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tithesAndOfferings.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{new Date(t.payment_date).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem' }}>
                            {t.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {t.member_name || 'Oferta Anônima / Culto'}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{t.description}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '0.70rem', fontWeight: 700 }}>
                            {t.payment_method}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#059669' }}>
                          {formatCurrency(t.amount)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(t.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DESPESAS & CONTAS A PAGAR */}
          {activeSubTab === 'expenses' && (
            <div className="portal-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Contas a Pagar & Despesas
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Total de saídas: <strong>{formatCurrency(expenseTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0))}</strong>
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Data</th>
                      <th style={{ padding: '12px' }}>Categoria</th>
                      <th style={{ padding: '12px' }}>Favorecido / Descrição</th>
                      <th style={{ padding: '12px' }}>Forma de Pagamento</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Valor</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseTransactions.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{new Date(t.payment_date).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.72rem' }}>
                            {t.category}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {t.description}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontSize: '0.70rem', fontWeight: 700 }}>
                            {t.payment_method}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: t.status === 'PAID' ? '#ecfdf5' : '#fef3c7', color: t.status === 'PAID' ? '#059669' : '#d97706', padding: '3px 8px', borderRadius: '6px', fontSize: '0.70rem', fontWeight: 800 }}>
                            {t.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: '#dc2626' }}>
                          {formatCurrency(t.amount)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(t.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CAMPANHAS & PROJETOS COM METAS */}
          {activeSubTab === 'projects' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Campanhas e Projetos Especiais de Arrecadação
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Estes projetos aparecem automaticamente no aplicativo PWA para contribuição direta dos membros.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                  }}
                >
                  + Nova Campanha com Meta
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                {projects.map(proj => {
                  const pct = proj.target_amount > 0 ? Math.min(100, (proj.collected_amount / proj.target_amount) * 100) : 0;
                  return (
                    <div key={proj.id} className="portal-card" style={{ padding: '22px', borderRadius: '20px', borderTop: '4px solid #7c3aed' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.70rem', fontWeight: 800, background: proj.status === 'ACTIVE' ? '#f3e8ff' : '#ecfdf5', color: proj.status === 'ACTIVE' ? '#7c3aed' : '#059669', padding: '3px 8px', borderRadius: 999 }}>
                          {proj.status === 'ACTIVE' ? '🎯 Em Andamento' : '✓ Concluído'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Início: {new Date(proj.start_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                        {proj.title}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                        {proj.description || 'Campanha oficial da congregação.'}
                      </p>

                      {/* Barra de Progresso */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem', fontWeight: 800, marginBottom: '6px' }}>
                          <span style={{ color: '#059669' }}>{formatCurrency(proj.collected_amount)}</span>
                          <span style={{ color: 'var(--text-muted)' }}>Meta: {formatCurrency(proj.target_amount)}</span>
                        </div>
                        <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: 'linear-gradient(90deg, #7c3aed 0%, #10b981 100%)', width: `${pct}%`, borderRadius: '6px' }} />
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>
                          {pct.toFixed(1)}% alcançado
                        </div>
                      </div>

                      {proj.pix_key && (
                        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Chave PIX da Campanha:</span>
                          <strong>{proj.pix_key}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: EXTRATO COMPLETO & RELATÓRIOS */}
          {activeSubTab === 'statement' && (
            <div className="portal-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Extrato Financeiro Consolidado
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Exibindo {filteredTransactions.length} movimentações no período selecionado
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid var(--panel-border)',
                      color: 'var(--text-main)',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    🖨️ Imprimir / Gerar PDF
                  </button>
                </div>
              </div>

              {/* Filtros da Tabela */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Buscar favorecido, membro ou descrição..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ flex: 1, minWidth: '220px', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--panel-border)', fontSize: '0.82rem' }}
                />

                <select
                  value={selectedTypeFilter}
                  onChange={e => setSelectedTypeFilter(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--panel-border)', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <option value="">Todos os Tipos (Entradas & Saídas)</option>
                  <option value="INCOME">Apenas Entradas (Receitas)</option>
                  <option value="EXPENSE">Apenas Saídas (Despesas)</option>
                </select>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>Data</th>
                      <th style={{ padding: '12px' }}>Tipo</th>
                      <th style={{ padding: '12px' }}>Categoria</th>
                      <th style={{ padding: '12px' }}>Descrição / Favorecido</th>
                      <th style={{ padding: '12px' }}>Meio</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Valor</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{new Date(t.payment_date).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: t.type === 'INCOME' ? '#ecfdf5' : '#fee2e2', color: t.type === 'INCOME' ? '#059669' : '#dc2626', padding: '3px 8px', borderRadius: '6px', fontSize: '0.70rem', fontWeight: 900 }}>
                            {t.type === 'INCOME' ? 'ENTRADA' : 'SAÍDA'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700 }}>{t.category}</td>
                        <td style={{ padding: '12px' }}>{t.description}</td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{t.payment_method}</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: t.type === 'INCOME' ? '#059669' : '#dc2626' }}>
                          {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(t.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.74rem' }}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>
      )}

      {/* MODAL: REGISTRAR TRANSAÇÃO (ENTRADA OU SAÍDA) */}
      {isTransactionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="portal-card animate-fade-in" style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: modalTransactionType === 'INCOME' ? '#059669' : '#dc2626', margin: 0 }}>
                {modalTransactionType === 'INCOME' ? '+ Registrar Entrada / Dízimo' : '- Registrar Despesa / Conta'}
              </h3>
              <button type="button" onClick={() => setIsTransactionModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label className="form-label-modern">Categoria</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)', fontWeight: 700 }}
                >
                  {(modalTransactionType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label-modern">Descrição / Identificação</label>
                <input
                  type="text"
                  placeholder={modalTransactionType === 'INCOME' ? 'Ex: Dízimo Mensal / Oferta de Domingo' : 'Ex: Aluguel do Templo / Conta de Luz'}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label-modern">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)', fontWeight: 900, fontSize: '1.05rem', color: modalTransactionType === 'INCOME' ? '#059669' : '#dc2626' }}
                  />
                </div>

                <div>
                  <label className="form-label-modern">Data do Pagamento</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label-modern">Forma de Pagamento</label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value as any })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)', fontWeight: 700 }}
                  >
                    <option value="PIX">⚡ PIX</option>
                    <option value="CREDIT_CARD">💳 Cartão de Crédito</option>
                    <option value="DEBIT_CARD">💳 Cartão de Débito</option>
                    <option value="BOLETO">📄 Boleto</option>
                    <option value="CASH">💵 Dinheiro em Espécie</option>
                    <option value="TRANSFER">🏦 Transferência Bancária</option>
                  </select>
                </div>

                <div>
                  <label className="form-label-modern">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)', fontWeight: 700 }}
                  >
                    <option value="PAID">✓ Quitado / Pago</option>
                    <option value="PENDING">⏳ Pendente / A Pagar</option>
                  </select>
                </div>
              </div>

              {modalTransactionType === 'INCOME' && (
                <div>
                  <label className="form-label-modern">Nome do Membro / Dizimista (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Carlos Eduardo Silva (para emissão de informe anual)"
                    value={formData.member_name}
                    onChange={e => setFormData({ ...formData, member_name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)' }}
                  />
                </div>
              )}

              {modalTransactionType === 'INCOME' && projects.length > 0 && (
                <div>
                  <label className="form-label-modern">Vincular à Campanha / Projeto (Opcional)</label>
                  <select
                    value={formData.project_id}
                    onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)' }}
                  >
                    <option value="">Nenhum (Entrada Geral da Igreja)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsTransactionModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--panel-border)', background: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: modalTransactionType === 'INCOME' ? '#059669' : '#dc2626', color: '#ffffff', fontWeight: 900, cursor: 'pointer' }}
                >
                  Confirmar Lançamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA CAMPANHA / PROJETO */}
      {isProjectModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="portal-card animate-fade-in" style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', maxWidth: '520px', width: '100%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#7c3aed', margin: 0 }}>
                🎯 Nova Campanha de Arrecadação com Meta
              </h3>
              <button type="button" onClick={() => setIsProjectModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label-modern">Título da Campanha</label>
                <input
                  type="text"
                  placeholder="Ex: Reforma do Telhado / Missões no Sertão"
                  value={projectFormData.title}
                  onChange={e => setProjectFormData({ ...projectFormData, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)' }}
                />
              </div>

              <div>
                <label className="form-label-modern">Meta Financeira (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50000.00"
                  value={projectFormData.target_amount}
                  onChange={e => setProjectFormData({ ...projectFormData, target_amount: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)', fontWeight: 800, fontSize: '1.05rem', color: '#7c3aed' }}
                />
              </div>

              <div>
                <label className="form-label-modern">Descrição e Propósito</label>
                <textarea
                  rows={3}
                  placeholder="Explique à congregação a importância desta arrecadação..."
                  value={projectFormData.description}
                  onChange={e => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)', resize: 'vertical' }}
                />
              </div>

              <div>
                <label className="form-label-modern">Chave PIX Específica (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: missoes@igrejaviva.com.br ou CNPJ"
                  value={projectFormData.pix_key}
                  onChange={e => setProjectFormData({ ...projectFormData, pix_key: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--panel-border)', background: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', color: '#ffffff', fontWeight: 900, cursor: 'pointer' }}
                >
                  Criar Campanha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INFORME ANUAL DE DÍZIMOS DO MEMBRO */}
      {isMemberReportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="portal-card animate-fade-in" style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  📄 Informe Anual de Contribuições
                </h3>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Declaração de dízimos e ofertas para comprovação de renda e IRPF</span>
              </div>
              <button type="button" onClick={() => setIsMemberReportModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="form-label-modern">Buscar Membro / Dizimista</label>
              <input
                type="text"
                placeholder="Digite o nome do membro..."
                value={selectedMemberForReport}
                onChange={e => setSelectedMemberForReport(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--panel-border)', fontSize: '0.84rem' }}
              />
            </div>

            {selectedMemberForReport && (
              <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1px solid var(--panel-border)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <strong>Membro: {selectedMemberForReport}</strong>
                  <strong style={{ color: '#059669' }}>Total: {formatCurrency(totalMemberContributed)}</strong>
                </div>

                {memberReportTransactions.length === 0 ? (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nenhuma contribuição identificada com este nome.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {memberReportTransactions.map(t => (
                      <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                        <span>{new Date(t.payment_date).toLocaleDateString('pt-BR')} • {t.category}</span>
                        <strong>{formatCurrency(t.amount)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsMemberReportModalOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--panel-border)', background: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                Fechar
              </button>
              {selectedMemberForReport && memberReportTransactions.length > 0 && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{ flex: 2, padding: '10px', borderRadius: '10px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: 900, cursor: 'pointer' }}
                >
                  🖨️ Imprimir Declaração
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FinancialTreasury;
