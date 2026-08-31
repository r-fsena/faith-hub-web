import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

// --- ICONS SVG ---
const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>
  </svg>
);

const PrinterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// --- INTERFACES ---
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
  initialSubTab?: 'dre' | 'tithes' | 'expenses' | 'projects' | 'statement' | 'report';
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
  selectedOrganization,
  initialSubTab = 'dre'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dre' | 'tithes' | 'expenses' | 'projects' | 'statement' | 'report'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
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

  // Modais State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [modalTransactionType, setModalTransactionType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMemberReportModalOpen, setIsMemberReportModalOpen] = useState(false);
  const [selectedMemberForReport, setSelectedMemberForReport] = useState<string>('');
  const [reportYear, setReportYear] = useState<string>(new Date().getFullYear().toString());

  // Upload States & Refs
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadingProjectImage, setUploadingProjectImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const projectImageInputRef = useRef<HTMLInputElement>(null);

  // Form State Transação
  const [formData, setFormData] = useState({
    category: 'Dízimo',
    description: '',
    amount: '',
    payment_method: 'PIX',
    status: 'PAID',
    member_name: '',
    project_id: '',
    receipt_url: '',
    payment_date: new Date().toISOString().split('T')[0],
    due_date: ''
  });

  // Form State Projeto
  const [projectFormData, setProjectFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    target_amount: '',
    collected_amount: '0',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    pix_key: '',
    status: 'ACTIVE'
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

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    setUploadingReceipt(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/upload-url?contentType=${encodeURIComponent(file.type)}&prefix=receipts`, { headers });
      const { uploadUrl, url } = await res.json();

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      setFormData(prev => ({ ...prev, receipt_url: url }));
    } catch (err) {
      console.error('Erro no upload do comprovante', err);
      alert('Erro ao realizar upload do comprovante.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    setUploadingProjectImage(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/upload-url?contentType=${encodeURIComponent(file.type)}&prefix=campaigns`, { headers });
      const { uploadUrl, url } = await res.json();

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      setProjectFormData(prev => ({ ...prev, image_url: url }));
    } catch (err) {
      console.error('Erro no upload da imagem da campanha', err);
      alert('Erro ao realizar upload da imagem.');
    } finally {
      setUploadingProjectImage(false);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      alert('Preencha a descrição e o valor da movimentação.');
      return;
    }

    setIsSaving(true);
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
        receipt_url: formData.receipt_url || null,
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
          receipt_url: '',
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
    } finally {
      setIsSaving(false);
    }
  };

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const handleOpenNewProjectModal = () => {
    setEditingProjectId(null);
    setProjectFormData({
      title: '',
      description: '',
      image_url: '',
      target_amount: '',
      collected_amount: '0',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      pix_key: '',
      status: 'ACTIVE'
    });
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProjectModal = (proj: SpecialProject) => {
    setEditingProjectId(proj.id);
    setProjectFormData({
      title: proj.title || '',
      description: proj.description || '',
      image_url: proj.image_url || '',
      target_amount: proj.target_amount ? String(proj.target_amount) : '',
      collected_amount: proj.collected_amount ? String(proj.collected_amount) : '0',
      start_date: proj.start_date ? proj.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
      end_date: proj.end_date ? proj.end_date.split('T')[0] : '',
      pix_key: proj.pix_key || '',
      status: proj.status || 'ACTIVE'
    });
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta campanha?')) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/financial/projects/${id}`, {
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

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFormData.title || !projectFormData.target_amount) {
      alert('Preencha o título e o valor da meta.');
      return;
    }

    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();
      const payload: any = {
        organization_id: orgId,
        campus_id: selectedCampusId !== 'all' ? selectedCampusId : null,
        title: projectFormData.title,
        description: projectFormData.description,
        image_url: projectFormData.image_url || null,
        target_amount: parseFloat(projectFormData.target_amount),
        collected_amount: parseFloat(projectFormData.collected_amount || '0'),
        start_date: projectFormData.start_date,
        end_date: projectFormData.end_date || null,
        pix_key: projectFormData.pix_key || null,
        status: projectFormData.status || 'ACTIVE'
      };

      if (editingProjectId) {
        payload.id = editingProjectId;
      }

      const res = await fetch(`${API_URL}/financial/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsProjectModalOpen(false);
        setEditingProjectId(null);
        setProjectFormData({
          title: '',
          description: '',
          image_url: '',
          target_amount: '',
          collected_amount: '0',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          pix_key: '',
          status: 'ACTIVE'
        });
        loadAllFinancialData();
      } else {
        alert('Erro ao salvar campanha.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de comunicação.');
    } finally {
      setIsSaving(false);
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
    ? transactions.filter(t => {
        const matchesName = t.member_name && t.member_name.toLowerCase().includes(selectedMemberForReport.toLowerCase());
        const matchesYear = !reportYear || t.payment_date.startsWith(reportYear);
        return matchesName && matchesYear && t.type === 'INCOME';
      })
    : [];
  const totalMemberContributed = memberReportTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);

  const isProjectsOnlyMode = initialSubTab === 'projects';

  const totalProjectsCollected = projects.reduce((acc, p) => acc + Number(p.collected_amount || 0), 0);
  const totalProjectsTarget = projects.reduce((acc, p) => acc + Number(p.target_amount || 0), 0);
  const globalProjectsPct = totalProjectsTarget > 0 ? Math.min(Math.round((totalProjectsCollected / totalProjectsTarget) * 100), 100) : 0;

  return (
    <div className="members-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* HEADER PRINCIPAL */}
      {isProjectsOnlyMode ? (
        /* HEADER EXCLUSIVO PARA CAMPANHAS & PROJETOS */
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <TargetIcon />
              </div>
              <div>
                <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.4px' }}>
                  Campanhas & Projetos Especiais
                </h1>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                  Metas de arrecadação, reformas, missões e projetos com barra de progresso no aplicativo da <strong>{selectedOrganization?.name || 'Igreja'}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
              onClick={handleOpenNewProjectModal}
            >
              <PlusIcon /> Nova Campanha
            </button>
          </div>
        </div>
      ) : (
        /* HEADER GERAL DA TESOURARIA / DRE */
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary-gradient)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <CreditCardIcon />
              </div>
              <div>
                <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.4px' }}>
                  Gestão Financeira & Tesouraria
                </h1>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                  Controle unificado de Dízimos, Ofertas, Despesas, Campanhas e DRE da <strong>{selectedOrganization?.name || 'Igreja'}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Ação Unificada Topo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setModalTransactionType('INCOME');
                setFormData({ ...formData, category: 'Dízimo', description: '' });
                setIsTransactionModalOpen(true);
              }}
            >
              <PlusIcon /> Nova Movimentação
            </button>
          </div>
        </div>
      )}

      {/* KPI STATS CARDS */}
      {isProjectsOnlyMode ? (
        /* KPIS ESPECÍFICOS DE CAMPANHAS & PROJETOS */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '26px' }}>
          
          {/* Card 1: Campanhas Ativas */}
          <div className="portal-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #7c3aed' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
              Campanhas Ativas
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#7c3aed', marginTop: '6px' }}>
              {projects.filter(p => p.status === 'ACTIVE').length} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {projects.length} total</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Divulgadas com arrecadação no PWA
            </div>
          </div>

          {/* Card 2: Total Já Arrecadado */}
          <div className="portal-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
              Total Já Arrecadado
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
              {formatCurrency(totalProjectsCollected)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Doações recebidas via Pix e App
            </div>
          </div>

          {/* Card 3: Meta Global Estipulada */}
          <div className="portal-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
              Meta Total das Campanhas
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#2563eb', marginTop: '6px' }}>
              {formatCurrency(totalProjectsTarget)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Objetivo financeiro somado
            </div>
          </div>

          {/* Card 4: Progresso Geral Médio */}
          <div className="portal-card" style={{ padding: '20px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
              Progresso Geral Médio
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', marginTop: '6px' }}>
              {globalProjectsPct}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Alcançado do objetivo global
            </div>
          </div>

        </div>
      ) : (
        /* KPIS GERAIS DO FLUXO DE CAIXA E DRE */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '26px' }}>
          
          {/* Card 1: Saldo Líquido Consolidado */}
          <div className="portal-card" style={{ padding: '22px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Saldo Consolidado em Caixa
              </span>
              <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 800, background: summary.net_balance >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: summary.net_balance >= 0 ? '#34d399' : '#f87171' }}>
                {summary.net_balance >= 0 ? 'SUPERÁVIT' : 'DÉFICIT'}
              </span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, marginTop: '8px', color: summary.net_balance >= 0 ? '#34d399' : '#f87171', letterSpacing: '-0.5px' }}>
              {formatCurrency(summary.net_balance)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '6px' }}>
              Receitas Pagas menos Despesas Quitadas
            </div>
          </div>

          {/* Card 2: Total de Receitas */}
          <div className="portal-card" style={{ padding: '22px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #059669' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
              Total de Entradas (Receitas)
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#059669', marginTop: '8px' }}>
              {formatCurrency(summary.total_income)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              {summary.income_by_category.length} categorias ativas com lançamentos
            </div>
          </div>

          {/* Card 3: Total de Despesas */}
          <div className="portal-card" style={{ padding: '22px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #dc2626' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
              Total de Saídas (Despesas)
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#dc2626', marginTop: '8px' }}>
              {formatCurrency(summary.total_expense)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Custos ministeriais, aluguéis e contas
            </div>
          </div>

          {/* Card 4: Campanhas & Projetos Ativos */}
          <div className="portal-card" style={{ padding: '22px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #7c3aed' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
              Campanhas & Metas Especiais
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#7c3aed', marginTop: '8px' }}>
              {projects.filter(p => p.status === 'ACTIVE').length} <span style={{ fontSize: '0.90rem', color: 'var(--text-muted)', fontWeight: 600 }}>ativas</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Arrecadações direcionadas no PWA
            </div>
          </div>

        </div>
      )}

      {/* NAVEGAÇÃO DE SUB-ABAS (Ocultadas se estiver no modo exclusivo de campanhas) */}
      {!isProjectsOnlyMode && (
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '14px', marginBottom: '22px', overflowX: 'auto' }}>
          <button
            type="button"
            className={`filter-pill ${activeSubTab === 'dre' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('dre')}
          >
            📊 Demonstrativo DRE
          </button>
          <button
            type="button"
            className={`filter-pill ${activeSubTab === 'tithes' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('tithes')}
          >
            💰 Dízimos & Ofertas ({tithesAndOfferings.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeSubTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('expenses')}
          >
            📉 Despesas & Contas ({expenseTransactions.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeSubTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('projects')}
          >
            🎯 Campanhas & Metas ({projects.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeSubTab === 'statement' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('statement')}
          >
            📋 Extrato Geral ({transactions.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeSubTab === 'report' ? 'active' : ''}`}
            onClick={() => {
              setActiveSubTab('report');
              setIsMemberReportModalOpen(true);
            }}
          >
            📊 Relatório
          </button>
        </div>
      )}

      {/* CONTEÚDO DAS SUB-ABAS */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--accent-primary)', fontWeight: 700 }}>
          Carregando informações financeiras da tesouraria...
        </div>
      ) : isProjectsOnlyMode || activeSubTab === 'projects' ? (
        /* VISUALIZAÇÃO EXCLUSIVA DE CAMPANHAS & PROJETOS COM METAS */
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Campanhas de Arrecadação com Metas
              </h3>
              <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Projetos especiais divulgados com barra de progresso no aplicativo dos membros.
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
              onClick={() => setIsProjectModalOpen(true)}
            >
              <PlusIcon /> Nova Campanha
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="portal-card" style={{ padding: '48px', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
              <TargetIcon />
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '12px' }}>
                Nenhuma campanha cadastrada ainda
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '6px auto 16px auto' }}>
                Crie campanhas como Reforma do Templo, Missões, Som ou Espaço Kids com metas financeiras interativas.
              </p>
              <button type="button" className="btn-primary" onClick={() => setIsProjectModalOpen(true)}>
                + Criar Primeira Campanha
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {projects.map(proj => {
                const collected = Number(proj.collected_amount || 0);
                const target = Number(proj.target_amount || 1);
                const pct = Math.min(Math.round((collected / target) * 100), 100);

                return (
                  <div key={proj.id} className="portal-card" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {proj.image_url ? (
                      <img src={proj.image_url} alt={proj.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ height: '100px', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
                        <TargetIcon />
                      </div>
                    )}

                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.70rem', fontWeight: 800, padding: '3px 8px', borderRadius: '999px', background: proj.status === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9', color: proj.status === 'ACTIVE' ? '#059669' : '#64748b' }}>
                            {proj.status === 'ACTIVE' ? 'EM ANDAMENTO' : 'CONCLUÍDA'}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            Início: {new Date(proj.start_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                          {proj.title}
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 16px 0' }}>
                          {proj.description || 'Sem descrição cadastrada.'}
                        </p>
                      </div>

                      <div>
                        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--panel-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem', marginBottom: '8px' }}>
                            <strong style={{ color: '#059669' }}>{formatCurrency(collected)}</strong>
                            <span style={{ color: 'var(--text-muted)' }}>Meta: {formatCurrency(target)} ({pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #059669)', borderRadius: '999px' }} />
                          </div>
                        </div>

                        {/* Ações do Card */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--panel-border)' }}>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {proj.pix_key ? `🔑 Pix: ${proj.pix_key}` : '🔑 Pix: Chave da Igreja'}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: '0.74rem', fontWeight: 700 }}
                              onClick={() => handleOpenEditProjectModal(proj)}
                              title="Editar Campanha"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.74rem', color: '#dc2626', borderColor: '#fecaca', background: '#fff5f5' }}
                              onClick={() => handleDeleteProject(proj.id)}
                              title="Excluir Campanha"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* MODO COMPLETO DO PAINEL & DRE DA TESOURARIA */
        <>
          {/* TAB 1: DRE CONSOLIDADO */}
          {activeSubTab === 'dre' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px' }}>
              
              {/* DRE Receitas por Categoria */}
              <div className="portal-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Entradas por Categoria (DRE)
                  </h3>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#059669' }}>
                    {formatCurrency(summary.total_income)}
                  </span>
                </div>

                {summary.income_by_category.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', textAlign: 'center', padding: '24px 0' }}>
                    Nenhuma receita lançada no período.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {summary.income_by_category.map((item, idx) => {
                      const pct = summary.total_income > 0 ? Math.round((Number(item.total) / summary.total_income) * 100) : 0;
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>
                            <span style={{ color: 'var(--text-main)' }}>{item.category}</span>
                            <span style={{ color: '#059669' }}>{formatCurrency(Number(item.total))} <small style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({pct}%)</small></span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '999px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DRE Despesas por Categoria */}
              <div className="portal-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Saídas por Categoria (DRE)
                  </h3>
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#dc2626' }}>
                    {formatCurrency(summary.total_expense)}
                  </span>
                </div>

                {summary.expense_by_category.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', textAlign: 'center', padding: '24px 0' }}>
                    Nenhuma despesa lançada no período.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {summary.expense_by_category.map((item, idx) => {
                      const pct = summary.total_expense > 0 ? Math.round((Number(item.total) / summary.total_expense) * 100) : 0;
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px' }}>
                            <span style={{ color: 'var(--text-main)' }}>{item.category}</span>
                            <span style={{ color: '#dc2626' }}>{formatCurrency(Number(item.total))} <small style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({pct}%)</small></span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #f87171, #dc2626)', borderRadius: '999px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: DÍZIMOS E OFERTAS */}
          {activeSubTab === 'tithes' && (
            <div className="portal-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Lançamentos de Dízimos & Ofertas
                </h3>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setModalTransactionType('INCOME');
                    setFormData({ ...formData, category: 'Dízimo' });
                    setIsTransactionModalOpen(true);
                  }}
                >
                  <PlusIcon /> Nova Movimentação
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--panel-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Data</th>
                      <th style={{ padding: '12px' }}>Membro / Dizimista</th>
                      <th style={{ padding: '12px' }}>Categoria</th>
                      <th style={{ padding: '12px' }}>Descrição</th>
                      <th style={{ padding: '12px' }}>Forma</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Valor</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tithesAndOfferings.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          Nenhum dízimo ou oferta registrado ainda.
                        </td>
                      </tr>
                    ) : (
                      tithesAndOfferings.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{new Date(t.payment_date).toLocaleDateString('pt-BR')}</td>
                          <td style={{ padding: '12px', fontWeight: 800, color: 'var(--text-main)' }}>{t.member_name || 'Anônimo / Geral'}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.74rem' }}>
                              {t.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{t.description}</td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{t.payment_method}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                            + {formatCurrency(t.amount)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(t.id)}
                              style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                              title="Remover lançamento"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DESPESAS & CONTAS */}
          {activeSubTab === 'expenses' && (
            <div className="portal-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Despesas, Contas e Custos Fixos
                </h3>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    setModalTransactionType('EXPENSE');
                    setFormData({ ...formData, category: 'Instalações & Aluguel' });
                    setIsTransactionModalOpen(true);
                  }}
                >
                  <PlusIcon /> Nova Movimentação
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--panel-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Data</th>
                      <th style={{ padding: '12px' }}>Categoria</th>
                      <th style={{ padding: '12px' }}>Descrição / Fornecedor</th>
                      <th style={{ padding: '12px' }}>Forma</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Valor</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          Nenhuma despesa lançada ainda.
                        </td>
                      </tr>
                    ) : (
                      expenseTransactions.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{new Date(t.payment_date).toLocaleDateString('pt-BR')}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ background: '#fff1f2', color: '#e11d48', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.74rem' }}>
                              {t.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{t.description}</td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{t.payment_method}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '0.70rem', fontWeight: 800, background: t.status === 'PAID' ? '#ecfdf5' : '#fffbeb', color: t.status === 'PAID' ? '#059669' : '#d97706' }}>
                              {t.status === 'PAID' ? '✓ PAGO' : '⏳ PENDENTE'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                            - {formatCurrency(t.amount)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(t.id)}
                              style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                              title="Remover lançamento"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: EXTRATO GERAL */}
          {activeSubTab === 'statement' && (
            <div className="portal-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                  <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
                    <input
                      type="text"
                      className="input-modern"
                      placeholder="Buscar por descrição, membro ou categoria..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className="select-modern"
                    style={{ width: 'auto' }}
                    value={selectedTypeFilter}
                    onChange={e => setSelectedTypeFilter(e.target.value)}
                  >
                    <option value="">Todos os Tipos</option>
                    <option value="INCOME">🟢 Apenas Entradas (Receitas)</option>
                    <option value="EXPENSE">🔴 Apenas Saídas (Despesas)</option>
                  </select>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid var(--panel-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Data</th>
                      <th style={{ padding: '12px' }}>Tipo</th>
                      <th style={{ padding: '12px' }}>Categoria</th>
                      <th style={{ padding: '12px' }}>Descrição</th>
                      <th style={{ padding: '12px' }}>Forma</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Valor (R$)</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                          Nenhuma transação encontrada com os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map(t => (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{new Date(t.payment_date).toLocaleDateString('pt-BR')}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '999px', fontSize: '0.70rem', fontWeight: 800, background: t.type === 'INCOME' ? '#ecfdf5' : '#fff1f2', color: t.type === 'INCOME' ? '#059669' : '#e11d48' }}>
                              {t.type === 'INCOME' ? 'ENTRADA' : 'SAÍDA'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700 }}>{t.category}</td>
                          <td style={{ padding: '12px', color: 'var(--text-main)' }}>{t.description}</td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{t.payment_method}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: t.type === 'INCOME' ? '#059669' : '#dc2626' }}>
                            {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(t.id)}
                              style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                              title="Remover lançamento"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================
          MODAL STUDIO 1: LANÇAMENTO FINANCEIRO (RECEITA OU DESPESA)
          ======================================================== */}
      {isTransactionModalOpen && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setIsTransactionModalOpen(false)}>
          <div className="modal-studio-container" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: modalTransactionType === 'INCOME' ? 'var(--pastel-green-bg)' : 'var(--pastel-rose-bg)', color: modalTransactionType === 'INCOME' ? 'var(--pastel-green-text)' : 'var(--pastel-rose-text)' }}>
                  <CreditCardIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">
                    {modalTransactionType === 'INCOME' ? 'Registrar Nova Receita / Dízimo' : 'Registrar Nova Despesa / Conta'}
                  </h2>
                  <p className="modal-studio-subtitle">
                    {modalTransactionType === 'INCOME'
                      ? 'Lançamento de dízimos, ofertas, arrecadações e entradas gerais da congregação.'
                      : 'Lançamento de pagamentos, custos fixos, aluguéis e compras da tesouraria.'}
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setIsTransactionModalOpen(false)} title="Fechar">
                &times;
              </button>
            </div>

            {/* Modal Body - 2 Column Split */}
            <form id="transaction-form" onSubmit={handleSaveTransaction} className="modal-studio-body">
              <div className="modal-studio-grid">
                
                {/* LEFT COLUMN: Dados Principais do Lançamento (60%) */}
                <div className="modal-studio-column">
                  
                  {/* Segmented Tipo Control */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">Tipo de Movimentação *</label>
                    <div className="segmented-control">
                      <div
                        className={`segmented-btn ${modalTransactionType === 'INCOME' ? 'active' : ''}`}
                        onClick={() => {
                          setModalTransactionType('INCOME');
                          setFormData({ ...formData, category: 'Dízimo' });
                        }}
                      >
                        🟢 Receita / Dízimo / Entrada
                      </div>
                      <div
                        className={`segmented-btn ${modalTransactionType === 'EXPENSE' ? 'active' : ''}`}
                        onClick={() => {
                          setModalTransactionType('EXPENSE');
                          setFormData({ ...formData, category: 'Instalações & Aluguel' });
                        }}
                      >
                        🔴 Despesa / Conta / Saída
                      </div>
                    </div>
                  </div>

                  {/* Categoria */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">Categoria Financeira *</label>
                    <select
                      className="select-modern"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      {(modalTransactionType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Descrição */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">Descrição e Identificação *</label>
                    <input
                      type="text"
                      className="input-modern"
                      placeholder={modalTransactionType === 'INCOME' ? 'Ex: Dízimo Mensal Culto de Domingo, Oferta Geral...' : 'Ex: Locação do Templo, Conta de Energia Elétrica...'}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  {/* Sub-grid Valor & Datas */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Valor do Lançamento (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-modern"
                        placeholder="0,00"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        required
                        style={{ fontSize: '1.05rem', fontWeight: 800, color: modalTransactionType === 'INCOME' ? '#059669' : '#dc2626' }}
                      />
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label-modern">Data do Pagamento *</label>
                      <input
                        type="date"
                        className="input-modern"
                        value={formData.payment_date}
                        onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Campos Condicionais de Receita */}
                  {modalTransactionType === 'INCOME' && (
                    <>
                      <div className="form-group-modern">
                        <label className="form-label-modern">
                          <span>Nome do Membro / Dizimista</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Opcional (para declaração anual)</span>
                        </label>
                        <input
                          type="text"
                          className="input-modern"
                          placeholder="Ex: Carlos Eduardo Silva..."
                          value={formData.member_name}
                          onChange={e => setFormData({ ...formData, member_name: e.target.value })}
                        />
                      </div>

                      {projects.length > 0 && (
                        <div className="form-group-modern">
                          <label className="form-label-modern">Vincular a Campanha / Projeto Especial</label>
                          <select
                            className="select-modern"
                            value={formData.project_id}
                            onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                          >
                            <option value="">Nenhum (Entrada Geral da Igreja)</option>
                            {projects.map(p => (
                              <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                </div>

                {/* RIGHT COLUMN: Forma, Status & Comprovante (40%) */}
                <div className="modal-studio-column">
                  
                  {/* Forma de Pagamento */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">Forma de Pagamento *</label>
                    <select
                      className="select-modern"
                      value={formData.payment_method}
                      onChange={e => setFormData({ ...formData, payment_method: e.target.value as any })}
                    >
                      <option value="PIX">⚡ PIX</option>
                      <option value="CREDIT_CARD">💳 Cartão de Crédito</option>
                      <option value="DEBIT_CARD">💳 Cartão de Débito</option>
                      <option value="BOLETO">📄 Boleto Bancário</option>
                      <option value="CASH">💵 Dinheiro em Espécie</option>
                      <option value="TRANSFER">🏦 Transferência Bancária</option>
                    </select>
                  </div>

                  {/* Status do Lançamento */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">Status do Lançamento *</label>
                    <select
                      className="select-modern"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="PAID">✓ Quitado / Confirmado</option>
                      <option value="PENDING">⏳ Pendente / Agendado</option>
                    </select>
                  </div>

                  {/* Anexo de Comprovante Dropzone */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">
                      <span>Anexar Comprovante / Recibo</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PDF, PNG ou JPG</span>
                    </label>

                    <input
                      type="file"
                      ref={receiptInputRef}
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                      onChange={handleReceiptUpload}
                    />

                    <div
                      className="dropzone-box"
                      onClick={() => receiptInputRef.current?.click()}
                      style={{ minHeight: '140px' }}
                    >
                      {uploadingReceipt ? (
                        <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                          Fazendo upload do comprovante...
                        </div>
                      ) : formData.receipt_url ? (
                        <div style={{ textAlign: 'center' }}>
                          <CheckIcon />
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                            Comprovante Anexado com Sucesso!
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Clique para substituir o arquivo
                          </div>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>
                            <DocumentIcon />
                          </div>
                          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            Clique para Anexar Comprovante
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Arquivo opcional para prestação de contas
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card de Impacto no Caixa */}
                  <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--panel-border)' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Resumo da Movimentação:
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: modalTransactionType === 'INCOME' ? '#059669' : '#dc2626' }}>
                      {modalTransactionType === 'INCOME' ? '+' : '-'} {formatCurrency(parseFloat(formData.amount) || 0)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {formData.category} • {formData.payment_method}
                    </div>
                  </div>

                </div>

              </div>
            </form>

            {/* Modal Footer */}
            <div className="modal-studio-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsTransactionModalOpen(false)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="transaction-form"
                disabled={isSaving}
                className="btn-primary"
                style={{ background: modalTransactionType === 'INCOME' ? 'var(--accent-primary)' : '#dc2626' }}
              >
                {isSaving ? 'Salvando...' : 'Confirmar Lançamento'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL STUDIO 2: NOVA CAMPANHA / PROJETO COM META
          ======================================================== */}
      {isProjectModalOpen && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setIsProjectModalOpen(false)}>
          <div className="modal-studio-container" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-purple-bg)', color: 'var(--pastel-purple-text)' }}>
                  <TargetIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">
                    Criar Nova Campanha de Arrecadação com Meta
                  </h2>
                  <p className="modal-studio-subtitle">
                    Campanhas para reformas, missões, eventos ou melhorias estruturais exibidas no PWA dos membros.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setIsProjectModalOpen(false)} title="Fechar">
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form id="project-form" onSubmit={handleSaveProject} className="modal-studio-body">
              <div className="modal-studio-grid">
                
                {/* Left Column: Dados da Campanha (60%) */}
                <div className="modal-studio-column">
                  
                  <div className="form-group-modern">
                    <label className="form-label-modern">Título da Campanha *</label>
                    <input
                      type="text"
                      className="input-modern"
                      placeholder="Ex: Reforma e Climatização do Auditório, Missões no Sertão..."
                      value={projectFormData.title}
                      onChange={e => setProjectFormData({ ...projectFormData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Meta Financeira (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-modern"
                        placeholder="Ex: 50000.00"
                        value={projectFormData.target_amount}
                        onChange={e => setProjectFormData({ ...projectFormData, target_amount: e.target.value })}
                        required
                        style={{ fontSize: '1.05rem', fontWeight: 800, color: '#7c3aed' }}
                      />
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label-modern">Data de Início *</label>
                      <input
                        type="date"
                        className="input-modern"
                        value={projectFormData.start_date}
                        onChange={e => setProjectFormData({ ...projectFormData, start_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Descrição e Propósito Missionário</label>
                    <textarea
                      rows={3}
                      className="textarea-modern"
                      placeholder="Explique detalhadamente o objetivo desta arrecadação para mobilizar a membresia..."
                      value={projectFormData.description}
                      onChange={e => setProjectFormData({ ...projectFormData, description: e.target.value })}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">
                      <span>Chave PIX Exclusiva da Campanha</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Opcional</span>
                    </label>
                    <input
                      type="text"
                      className="input-modern"
                      placeholder="Ex: missoes@igrejaviva.com.br ou CNPJ..."
                      value={projectFormData.pix_key}
                      onChange={e => setProjectFormData({ ...projectFormData, pix_key: e.target.value })}
                    />
                  </div>

                </div>

                {/* Right Column: Imagem & Preview (40%) */}
                <div className="modal-studio-column">
                  
                  <div className="form-group-modern">
                    <label className="form-label-modern">
                      <span>Foto de Capa da Campanha</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Proporção 16:9</span>
                    </label>

                    <input
                      type="file"
                      ref={projectImageInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleProjectImageUpload}
                    />

                    <div
                      className="dropzone-box"
                      onClick={() => projectImageInputRef.current?.click()}
                    >
                      {uploadingProjectImage ? (
                        <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                          Fazendo upload da foto...
                        </div>
                      ) : projectFormData.image_url ? (
                        <>
                          <img src={projectFormData.image_url} alt="Preview" className="dropzone-preview-img" />
                          <div className="dropzone-overlay-btn">
                            📷 Alterar Capa da Campanha
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '16px 8px' }}>
                          <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                            <ImageIcon />
                          </div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                            Selecionar Imagem da Campanha
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            PNG, JPG ou WEBP até 5MB
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status da Campanha */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">Status da Campanha</label>
                    <select
                      className="select-modern"
                      value={projectFormData.status}
                      onChange={e => setProjectFormData({ ...projectFormData, status: e.target.value })}
                    >
                      <option value="ACTIVE">🟢 Ativa (Exibida no Aplicativo)</option>
                      <option value="PAUSED">⏸️ Pausada (Oculta temporariamente)</option>
                      <option value="COMPLETED">🏁 Concluída (Meta Atingida)</option>
                    </select>
                  </div>

                </div>

              </div>
            </form>

            {/* Modal Footer */}
            <div className="modal-studio-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsProjectModalOpen(false)}
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="project-form"
                disabled={isSaving}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
              >
                {isSaving ? 'Salvando...' : 'Criar Campanha Oficial'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL STUDIO 3: INFORME ANUAL DE CONTRIBUIÇÕES (IRPF)
          ======================================================== */}
      {isMemberReportModalOpen && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setIsMemberReportModalOpen(false)}>
          <div className="modal-studio-container" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-blue-bg)', color: 'var(--pastel-blue-text)' }}>
                  <DocumentIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">
                    Informe Anual de Contribuições & Dízimos
                  </h2>
                  <p className="modal-studio-subtitle">
                    Emissão de declaração oficial timbrada para comprovação de renda e fins de Imposto de Renda.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setIsMemberReportModalOpen(false)} title="Fechar">
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-studio-body">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Buscar Membro / Dizimista *</label>
                  <input
                    type="text"
                    className="input-modern"
                    placeholder="Digite o nome completo do membro..."
                    value={selectedMemberForReport}
                    onChange={e => setSelectedMemberForReport(e.target.value)}
                  />
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Ano-Base</label>
                  <select
                    className="select-modern"
                    value={reportYear}
                    onChange={e => setReportYear(e.target.value)}
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              </div>

              {selectedMemberForReport ? (
                <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--panel-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{selectedMemberForReport}</strong>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Igreja: {selectedOrganization?.name || 'Comunidade Faith'} • Ano {reportYear}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL CONTRIBUÍDO</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>{formatCurrency(totalMemberContributed)}</div>
                    </div>
                  </div>

                  {memberReportTransactions.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                      Nenhum dízimo ou oferta com comprovante encontrado para este nome no ano {reportYear}.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                      {memberReportTransactions.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '6px 0', borderBottom: '1px dashed #e2e8f0' }}>
                          <span>{new Date(t.payment_date).toLocaleDateString('pt-BR')} • {t.category} ({t.payment_method})</span>
                          <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(t.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  Digite o nome do membro acima para gerar o extrato consolidado.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-studio-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsMemberReportModalOpen(false)}
              >
                Fechar
              </button>

              {selectedMemberForReport && memberReportTransactions.length > 0 && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => window.print()}
                >
                  <PrinterIcon /> Imprimir Declaração Timbrada
                </button>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default FinancialTreasury;
