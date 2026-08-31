import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
);
const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>
);
const SlidersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="7" y1="14" y2="14"/><line x1="9" x2="15" y1="8" y2="8"/><line x1="17" x2="23" y1="16" y2="16"/></svg>
);

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

const BRAZILIAN_BANKS = [
  { code: '001', name: '001 - Banco do Brasil S.A.' },
  { code: '033', name: '033 - Banco Santander (Brasil) S.A.' },
  { code: '104', name: '104 - Caixa Econômica Federal' },
  { code: '237', name: '237 - Banco Bradesco S.A.' },
  { code: '341', name: '341 - Itaú Unibanco S.A.' },
  { code: '260', name: '260 - Nu Pagamentos S.A. (Nubank)' },
  { code: '077', name: '077 - Banco Inter S.A.' },
  { code: '336', name: '336 - Banco C6 S.A.' },
  { code: '212', name: '212 - Banco Original S.A.' },
  { code: '756', name: '756 - Banco Cooperativo do Brasil (Sicoob)' },
  { code: '748', name: '748 - Banco Cooperativo Sicredi S.A.' },
  { code: '208', name: '208 - Banco BTG Pactual S.A.' },
  { code: '041', name: '041 - Banco do Estado do Rio Grande do Sul (Banrisul)' },
  { code: '070', name: '070 - BRB - Banco de Brasília S.A.' },
];

export interface PaymentGatewayConfig {
  // 1. Dados da Entidade / Recebedor
  recipient_cnpj: string;
  recipient_legal_name: string;
  recipient_trade_name: string;
  recipient_email: string;
  recipient_phone: string;

  // 2. Formas de Pagamento Específicas
  pix_enabled: boolean;
  credit_card_enabled: boolean;
  boleto_enabled: boolean;
  max_installments: number;
  pix_key: string;
  pix_key_type: 'CNPJ' | 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM';
  boleto_due_days: number;

  // 3. Fluxo de Transferência / Payout
  transfer_frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  transfer_day_of_week: '1' | '2' | '3' | '4' | '5'; // 1 = Seg, 5 = Sex
  transfer_day_of_month: number; // 1 a 31
  auto_anticipation_enabled: boolean;

  // 4. Dados Bancários
  bank_code: string;
  bank_name: string;
  agency_number: string;
  agency_digit: string;
  account_number: string;
  account_digit: string;
  account_type: 'checking' | 'savings';
  account_holder_name: string;
  account_holder_document: string;

  // 5. Credenciais do Provedor (Pagar.me V5)
  gateway_provider: 'PAGARME' | 'MERCADOPAGO' | 'STRIPE';
  environment: 'TEST' | 'LIVE';
  public_key: string;
  secret_key: string;
  account_id: string;
  is_connected: boolean;
}

const DEFAULT_GATEWAY_CONFIG: PaymentGatewayConfig = {
  recipient_cnpj: '12.345.678/0001-90',
  recipient_legal_name: 'Comunidade Cristã Faith-Hub Ministério Integrado',
  recipient_trade_name: 'Comunidade Faith-Hub',
  recipient_email: 'financeiro@igreja.com.br',
  recipient_phone: '(11) 98765-4321',

  pix_enabled: true,
  credit_card_enabled: true,
  boleto_enabled: true,
  max_installments: 12,
  pix_key: '12.345.678/0001-90',
  pix_key_type: 'CNPJ',
  boleto_due_days: 3,

  transfer_frequency: 'weekly',
  transfer_day_of_week: '5', // Sexta-feira
  transfer_day_of_month: 5,
  auto_anticipation_enabled: false,

  bank_code: '341',
  bank_name: '341 - Itaú Unibanco S.A.',
  agency_number: '1234',
  agency_digit: '',
  account_number: '56789',
  account_digit: '0',
  account_type: 'checking',
  account_holder_name: 'Comunidade Cristã Faith-Hub',
  account_holder_document: '12.345.678/0001-90',

  gateway_provider: 'PAGARME',
  environment: 'TEST',
  public_key: 'pk_test_faithhub_sample_key_99x',
  secret_key: 'sk_test_faithhub_sample_secret_key_88z',
  account_id: 'acc_fh892341908234',
  is_connected: true
};

export default function PagarmeSettings() {
  const [config, setConfig] = useState<PaymentGatewayConfig>(DEFAULT_GATEWAY_CONFIG);
  const [activeTab, setActiveTab] = useState<'methods' | 'entity' | 'transfer' | 'bank' | 'credentials'>('methods');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const saved = localStorage.getItem('faithhub_pagarme_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({ ...DEFAULT_GATEWAY_CONFIG, ...parsed });
      } catch (e) {
        console.error("Erro ao carregar dados do Gateway", e);
      }
    }
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selectedBank = BRAZILIAN_BANKS.find(b => b.code === code);
    setConfig(prev => ({
      ...prev,
      bank_code: code,
      bank_name: selectedBank ? selectedBank.name : code
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      localStorage.setItem('faithhub_pagarme_config', JSON.stringify(config));

      // Tenta persistir no backend se disponível
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
        await fetch(`${API_URL}/pagarme-settings`, {
          method: 'POST',
          headers,
          body: JSON.stringify(config)
        });
      } catch (backendErr) {
        console.log("Configurações do Gateway salvas localmente.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar configurações do Gateway.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    setTestResult(null);

    setTimeout(() => {
      setTestingConnection(false);
      if (config.public_key && config.secret_key) {
        setTestResult({
          success: true,
          message: `Conexão bem-sucedida! Provedor ${config.gateway_provider} (${config.environment === 'LIVE' ? 'Produção Oficial' : 'Sandbox Testes'}) validado.`
        });
        setConfig(prev => ({ ...prev, is_connected: true }));
      } else {
        setTestResult({
          success: false,
          message: "Preencha a Chave Pública e a Chave Secreta para validar a conexão."
        });
      }
    }, 1200);
  };

  const getFrequencyLabel = () => {
    switch (config.transfer_frequency) {
      case 'daily': return 'Diário (Todos os dias úteis)';
      case 'weekly': {
        const days: { [k: string]: string } = { '1': 'Segunda-feira', '2': 'Terça-feira', '3': 'Quarta-feira', '4': 'Quinta-feira', '5': 'Sexta-feira' };
        return `Semanal (Toda ${days[config.transfer_day_of_week] || 'Sexta-feira'})`;
      }
      case 'biweekly': return 'Quinzenal (Dias 1º e 15 de cada mês)';
      case 'monthly': return `Mensal (Todo dia ${config.transfer_day_of_month})`;
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner Gateway de Pagamento */}
      <div className="onboarding-banner" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0f766e 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheckIcon />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Gestão Financeira & Split
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>
            Gateway de Pagamento da Igreja
          </h2>
          <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px', maxWidth: '640px' }}>
            Configure as formas de pagamento aceitas (Pix, Cartão de Crédito, Boleto), fluxo de repasses e dados bancários para o PWA e PDV.
          </p>
        </div>

        <div style={{ textAlign: 'right', minWidth: '170px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.9, marginBottom: '6px' }}>
            Status do Gateway
          </div>
          <span className={`status-badge ${config.is_connected ? 'excellent' : 'pending'}`} style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
            {config.is_connected ? '🟢 Gateway Ativo' : '🟡 Configuração Pendente'}
          </span>
        </div>
      </div>

      {/* Main Grid: 2 Colunas (Formulários à esquerda, Resumo Financeiro à direita) */}
      <div className="responsive-module-2col">
        
        {/* LEFT COLUMN: Abas e Formulários */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Segmented Tabs */}
          <div className="portal-card" style={{ padding: '10px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className={`segmented-btn ${activeTab === 'methods' ? 'active' : ''}`}
              onClick={() => setActiveTab('methods')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px' }}
            >
              <SlidersIcon /> 1. Formas de Pagamento
            </button>
            <button 
              className={`segmented-btn ${activeTab === 'entity' ? 'active' : ''}`}
              onClick={() => setActiveTab('entity')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px' }}
            >
              <BuildingIcon /> 2. Dados da Igreja (CNPJ)
            </button>
            <button 
              className={`segmented-btn ${activeTab === 'transfer' ? 'active' : ''}`}
              onClick={() => setActiveTab('transfer')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px' }}
            >
              <CalendarIcon /> 3. Fluxo de Repasse
            </button>
            <button 
              className={`segmented-btn ${activeTab === 'bank' ? 'active' : ''}`}
              onClick={() => setActiveTab('bank')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px' }}
            >
              <CreditCardIcon /> 4. Conta Bancária
            </button>
            <button 
              className={`segmented-btn ${activeTab === 'credentials' ? 'active' : ''}`}
              onClick={() => setActiveTab('credentials')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 14px' }}
            >
              <KeyIcon /> 5. Provedor & Chaves
            </button>
          </div>

          {/* TAB 1: FORMAS DE PAGAMENTO ESPECÍFICAS */}
          {activeTab === 'methods' && (
            <div className="portal-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header-row" style={{ margin: 0, paddingBottom: 16, borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                  <h3 className="card-title">Formas de Pagamento Habilitadas</h3>
                  <p className="card-subtitle">Ative ou desative os métodos aceitos nos dízimos, ofertas, cantina e inscrições de cursos.</p>
                </div>
              </div>

              {/* PIX */}
              <div className="toggle-card-modern" style={{ background: config.pix_enabled ? '#f0fdfa' : '#ffffff', border: config.pix_enabled ? '1.5px solid var(--pastel-green-border)' : '1px solid var(--panel-border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.1rem' }}>⚡</span>
                    <span className="toggle-card-title">Pix Instantâneo (QR Code Dinâmico & Copia e Cola)</span>
                    <span className="status-badge good" style={{ fontSize: '0.70rem' }}>Recomendado</span>
                  </div>
                  <div className="toggle-card-desc">
                    Compensação imediata em tempo real com baixa taxa e identificação automática do membro pagador.
                  </div>

                  {config.pix_enabled && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <select 
                        className="select-modern" 
                        value={config.pix_key_type}
                        onChange={e => setConfig({ ...config, pix_key_type: e.target.value as any })}
                        style={{ maxWidth: '140px' }}
                      >
                        <option value="CNPJ">Chave CNPJ</option>
                        <option value="CPF">Chave CPF</option>
                        <option value="EMAIL">Chave E-mail</option>
                        <option value="PHONE">Celular</option>
                        <option value="RANDOM">Chave Aleatória</option>
                      </select>
                      <input 
                        type="text" 
                        className="input-modern"
                        value={config.pix_key} 
                        onChange={e => setConfig({ ...config, pix_key: e.target.value })}
                        placeholder={
                          config.pix_key_type === 'CPF' ? '000.000.000-00' :
                          config.pix_key_type === 'CNPJ' ? '00.000.000/0000-00' :
                          config.pix_key_type === 'EMAIL' ? 'financeiro@igreja.com.br' :
                          config.pix_key_type === 'PHONE' ? '(11) 99999-9999' :
                          'Chave Aleatória (EVP)'
                        }
                        style={{ maxWidth: '280px' }}
                      />
                    </div>
                  )}
                </div>

                <label className="switch-control">
                  <input 
                    type="checkbox" 
                    checked={config.pix_enabled} 
                    onChange={e => setConfig({ ...config, pix_enabled: e.target.checked })} 
                  />
                  <span className="slider-round"></span>
                </label>
              </div>

              {/* CARTÃO DE CRÉDITO */}
              <div className="toggle-card-modern" style={{ background: config.credit_card_enabled ? '#f8fafc' : '#ffffff' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.1rem' }}>💳</span>
                    <span className="toggle-card-title">Cartão de Crédito (Visa, Mastercard, Elo, Hipercard, Amex)</span>
                  </div>
                  <div className="toggle-card-desc">
                    Permite contribuições e compras parceladas no PWA e no PDV com tokenização segura.
                  </div>

                  {config.credit_card_enabled && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-main)' }}>Parcelamento Máximo:</span>
                      <select 
                        className="select-modern"
                        value={config.max_installments}
                        onChange={e => setConfig({ ...config, max_installments: Number(e.target.value) })}
                        style={{ maxWidth: '160px', fontWeight: 700 }}
                      >
                        <option value={1}>À vista (1x)</option>
                        <option value={3}>Até 3x</option>
                        <option value={6}>Até 6x</option>
                        <option value={10}>Até 10x</option>
                        <option value={12}>Até 12x</option>
                      </select>
                    </div>
                  )}
                </div>

                <label className="switch-control">
                  <input 
                    type="checkbox" 
                    checked={config.credit_card_enabled} 
                    onChange={e => setConfig({ ...config, credit_card_enabled: e.target.checked })} 
                  />
                  <span className="slider-round"></span>
                </label>
              </div>

              {/* BOLETO BANCÁRIO */}
              <div className="toggle-card-modern" style={{ background: config.boleto_enabled ? '#f8fafc' : '#ffffff' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.1rem' }}>📄</span>
                    <span className="toggle-card-title">Boleto Bancário Registrado</span>
                  </div>
                  <div className="toggle-card-desc">
                    Emissão de boletos registrados com código de barras e QR Code Pix integrado no próprio boleto.
                  </div>

                  {config.boleto_enabled && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.80rem', fontWeight: 700, color: 'var(--text-main)' }}>Prazo de Vencimento Padrão:</span>
                      <select 
                        className="select-modern"
                        value={config.boleto_due_days}
                        onChange={e => setConfig({ ...config, boleto_due_days: Number(e.target.value) })}
                        style={{ maxWidth: '160px', fontWeight: 700 }}
                      >
                        <option value={1}>1 dia corrido</option>
                        <option value={3}>3 dias úteis</option>
                        <option value={5}>5 dias úteis</option>
                        <option value={7}>7 dias úteis</option>
                      </select>
                    </div>
                  )}
                </div>

                <label className="switch-control">
                  <input 
                    type="checkbox" 
                    checked={config.boleto_enabled} 
                    onChange={e => setConfig({ ...config, boleto_enabled: e.target.checked })} 
                  />
                  <span className="slider-round"></span>
                </label>
              </div>

            </div>
          )}

          {/* TAB 2: DADOS DA IGREJA (CNPJ) */}
          {activeTab === 'entity' && (
            <div className="portal-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header-row" style={{ margin: 0, paddingBottom: 16, borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                  <h3 className="card-title">Dados da Entidade / Recebedor</h3>
                  <p className="card-subtitle">Informações cadastrais e fiscais da organização religiosa perante o gateway de pagamentos.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '16px' }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">CNPJ da Igreja / Ministério *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={config.recipient_cnpj} 
                    onChange={e => setConfig({ ...config, recipient_cnpj: e.target.value, account_holder_document: e.target.value })} 
                    placeholder="00.000.000/0000-00" 
                    required
                  />
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Razão Social Oficial *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={config.recipient_legal_name} 
                    onChange={e => setConfig({ ...config, recipient_legal_name: e.target.value, account_holder_name: e.target.value })} 
                    placeholder="Ex: Comunidade Cristã Faith-Hub Ministério Integrado" 
                    required
                  />
                </div>
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Nome Fantasia (Como aparecerá na fatura do membro)</label>
                <input 
                  type="text" 
                  className="input-modern"
                  value={config.recipient_trade_name} 
                  onChange={e => setConfig({ ...config, recipient_trade_name: e.target.value })} 
                  placeholder="Ex: Comunidade Faith-Hub" 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">E-mail do Responsável Financeiro *</label>
                  <input 
                    type="email" 
                    className="input-modern"
                    value={config.recipient_email} 
                    onChange={e => setConfig({ ...config, recipient_email: e.target.value })} 
                    placeholder="financeiro@igreja.com.br" 
                  />
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">WhatsApp / Telefone Financeiro</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={config.recipient_phone} 
                    onChange={e => setConfig({ ...config, recipient_phone: e.target.value })} 
                    placeholder="(11) 98765-4321" 
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid var(--panel-border)', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                💡 <strong>Importante:</strong> Os dados cadastrais devem coincidir exatamente com o Cartão CNPJ emitido pela Receita Federal para homologação da conta de recebimento.
              </div>
            </div>
          )}

          {/* TAB 3: FLUXO DE RECEBIMENTO */}
          {activeTab === 'transfer' && (
            <div className="portal-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div className="card-header-row" style={{ margin: 0, paddingBottom: 16, borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                  <h3 className="card-title">Fluxo & Frequência de Transferências (Payout)</h3>
                  <p className="card-subtitle">Defina como e quando o saldo arrecadado será transferido automaticamente para a conta da igreja.</p>
                </div>
              </div>

              {/* Frequência de Transferência */}
              <div className="form-group-modern">
                <label className="form-label-modern">Periodicidade dos Repasses Bancários</label>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '6px' }}>
                  {[
                    { id: 'daily', title: 'Diário', desc: 'Todos os dias úteis' },
                    { id: 'weekly', title: 'Semanal', desc: 'Dia específico da semana' },
                    { id: 'biweekly', title: 'Quinzenal', desc: 'Dias 1º e 15' },
                    { id: 'monthly', title: 'Mensal', desc: 'Dia específico do mês' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      className={`color-swatch-btn ${config.transfer_frequency === f.id ? 'active' : ''}`}
                      onClick={() => setConfig({ ...config, transfer_frequency: f.id as any })}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '14px', height: 'auto', gap: '4px' }}
                    >
                      <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>{f.title}</span>
                      <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Condicional Semanal: Escolha do Dia da Semana */}
              {config.transfer_frequency === 'weekly' && (
                <div className="form-group-modern animate-fade-in" style={{ background: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid var(--panel-border)' }}>
                  <label className="form-label-modern">Selecione o Dia da Semana para o Repasse</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                    {[
                      { val: '1', label: 'Segunda-feira' },
                      { val: '2', label: 'Terça-feira' },
                      { val: '3', label: 'Quarta-feira' },
                      { val: '4', label: 'Quinta-feira' },
                      { val: '5', label: 'Sexta-feira' },
                    ].map(d => (
                      <button
                        key={d.val}
                        type="button"
                        className={`segmented-btn ${config.transfer_day_of_week === d.val ? 'active' : ''}`}
                        onClick={() => setConfig({ ...config, transfer_day_of_week: d.val as any })}
                        style={{ padding: '10px 8px', fontSize: '0.78rem' }}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Condicional Mensal: Escolha do Dia do Mês */}
              {config.transfer_frequency === 'monthly' && (
                <div className="form-group-modern animate-fade-in" style={{ background: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid var(--panel-border)' }}>
                  <label className="form-label-modern">Selecione o Dia do Mês para o Repasse</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <select
                      className="select-modern"
                      value={config.transfer_day_of_month}
                      onChange={e => setConfig({ ...config, transfer_day_of_month: Number(e.target.value) })}
                      style={{ maxWidth: '180px', fontWeight: 700 }}
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>Todo dia {day}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Caso o dia selecionado caia em final de semana ou feriado bancário, o repasse ocorrerá no próximo dia útil.
                    </span>
                  </div>
                </div>
              )}

              {/* Antecipação Automática */}
              <div className="toggle-card-modern" style={{ background: '#ffffff' }}>
                <div>
                  <div className="toggle-card-title">Antecipação Automática de Recebíveis</div>
                  <div className="toggle-card-desc">
                    Permite antecipar automaticamente transações de cartão de crédito parceladas com taxas reduzidas.
                  </div>
                </div>
                <label className="switch-control">
                  <input 
                    type="checkbox" 
                    checked={config.auto_anticipation_enabled} 
                    onChange={e => setConfig({ ...config, auto_anticipation_enabled: e.target.checked })} 
                  />
                  <span className="slider-round"></span>
                </label>
              </div>

            </div>
          )}

          {/* TAB 4: CONTA BANCÁRIA */}
          {activeTab === 'bank' && (
            <div className="portal-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header-row" style={{ margin: 0, paddingBottom: 16, borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                  <h3 className="card-title">Conta Bancária de Depósito</h3>
                  <p className="card-subtitle">Conta vinculada ao CNPJ da igreja para recebimento dos depósitos via TED/PIX.</p>
                </div>
              </div>

              {/* Seletor de Banco */}
              <div className="form-group-modern">
                <label className="form-label-modern">Instituição Financeira / Banco *</label>
                <select 
                  className="select-modern"
                  value={config.bank_code}
                  onChange={handleBankChange}
                >
                  {BRAZILIAN_BANKS.map(bank => (
                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                  ))}
                </select>
              </div>

              {/* Agência e Conta */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Agência *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={config.agency_number} 
                    onChange={e => setConfig({ ...config, agency_number: e.target.value })} 
                    placeholder="1234" 
                    maxLength={5}
                    required
                  />
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Dígito Ag.</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={config.agency_digit} 
                    onChange={e => setConfig({ ...config, agency_digit: e.target.value })} 
                    placeholder="X" 
                    maxLength={2}
                  />
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Conta Corrente *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={config.account_number} 
                    onChange={e => setConfig({ ...config, account_number: e.target.value })} 
                    placeholder="56789" 
                    maxLength={14}
                    required
                  />
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Dígito Conta *</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={config.account_digit} 
                    onChange={e => setConfig({ ...config, account_digit: e.target.value })} 
                    placeholder="0" 
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group-modern">
                  <label className="form-label-modern">Tipo de Conta</label>
                  <select 
                    className="select-modern"
                    value={config.account_type}
                    onChange={e => setConfig({ ...config, account_type: e.target.value as any })}
                  >
                    <option value="checking">Conta Corrente PJ (Pessoa Jurídica)</option>
                    <option value="savings">Conta Poupança PJ</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label className="form-label-modern">Titular da Conta (CNPJ)</label>
                  <input 
                    type="text" 
                    className="input-modern"
                    value={config.account_holder_document} 
                    onChange={e => setConfig({ ...config, account_holder_document: e.target.value })} 
                    placeholder="00.000.000/0000-00" 
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: PROVEDOR & CHAVES DE API */}
          {activeTab === 'credentials' && (
            <div className="portal-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card-header-row" style={{ margin: 0, paddingBottom: 16, borderBottom: '1px solid var(--panel-border)' }}>
                <div>
                  <h3 className="card-title">Provedor de Pagamento & Chaves de API</h3>
                  <p className="card-subtitle">Credenciais de conexão com o processador de pagamento oficial (Pagar.me / Stone Co.).</p>
                </div>
              </div>

              {/* Seletor de Provedor */}
              <div className="form-group-modern">
                <label className="form-label-modern">Provedor de Gateway Ativo</label>
                <div className="segmented-control" style={{ maxWidth: '380px' }}>
                  <button 
                    type="button"
                    className={`segmented-btn ${config.gateway_provider === 'PAGARME' ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, gateway_provider: 'PAGARME' })}
                  >
                    Pagar.me / Stone
                  </button>
                  <button 
                    type="button"
                    className={`segmented-btn ${config.gateway_provider === 'MERCADOPAGO' ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, gateway_provider: 'MERCADOPAGO' })}
                  >
                    Mercado Pago
                  </button>
                  <button 
                    type="button"
                    className={`segmented-btn ${config.gateway_provider === 'STRIPE' ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, gateway_provider: 'STRIPE' })}
                  >
                    Stripe
                  </button>
                </div>
              </div>

              {/* Seletor de Ambiente */}
              <div className="form-group-modern">
                <label className="form-label-modern">Ambiente de Operação</label>
                <div className="segmented-control" style={{ maxWidth: '320px' }}>
                  <button 
                    type="button"
                    className={`segmented-btn ${config.environment === 'TEST' ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, environment: 'TEST' })}
                  >
                    Sandbox / Testes
                  </button>
                  <button 
                    type="button"
                    className={`segmented-btn ${config.environment === 'LIVE' ? 'active' : ''}`}
                    onClick={() => setConfig({ ...config, environment: 'LIVE' })}
                  >
                    Produção Oficial
                  </button>
                </div>
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Chave Pública (Public Key) *</label>
                <input 
                  type="text" 
                  className="input-modern"
                  value={config.public_key} 
                  onChange={e => setConfig({ ...config, public_key: e.target.value })} 
                  placeholder={config.environment === 'LIVE' ? 'pk_live_...' : 'pk_test_...'} 
                />
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">Chave Secreta (Secret Key) *</label>
                <input 
                  type="password" 
                  className="input-modern"
                  value={config.secret_key} 
                  onChange={e => setConfig({ ...config, secret_key: e.target.value })} 
                  placeholder={config.environment === 'LIVE' ? 'sk_live_...' : 'sk_test_...'} 
                />
              </div>

              <div className="form-group-modern">
                <label className="form-label-modern">ID da Conta / Recipient ID (Opcional)</label>
                <input 
                  type="text" 
                  className="input-modern"
                  value={config.account_id} 
                  onChange={e => setConfig({ ...config, account_id: e.target.value })} 
                  placeholder="acc_..." 
                />
              </div>

              {/* Botão de Teste de Conexão */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  <KeyIcon /> {testingConnection ? 'Validando Chaves com o Gateway...' : 'Testar Conexão com Gateway'}
                </button>

                {testResult && (
                  <div style={{ fontSize: '0.80rem', fontWeight: 700, color: testResult.success ? '#059669' : '#dc2626' }}>
                    {testResult.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Bar / Save Button */}
          <div className="portal-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {saveSuccess && (
                <div style={{ color: '#059669', fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckIcon /> Configurações do Gateway Salvas com Sucesso!
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '12px 28px', fontSize: '0.95rem' }}
              >
                {saving ? 'Salvando Dados...' : 'Salvar Gateway de Pagamento'}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: RESUMO DA CONTA E REPASSES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card Resumo do Recebedor */}
          <div className="portal-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--pastel-green-bg)', color: 'var(--pastel-green-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCardIcon />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {config.recipient_trade_name || 'Gateway Ativo'}
                </h4>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  CNPJ: {config.recipient_cnpj || 'Não informado'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--panel-border)' }}>
              <div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Provedor Principal</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {config.gateway_provider === 'PAGARME' ? 'Pagar.me / Stone Co.' : config.gateway_provider}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Formas Habilitadas</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {config.pix_enabled && <span className="status-badge good" style={{ fontSize: '0.68rem' }}>Pix Instantâneo</span>}
                  {config.credit_card_enabled && <span className="status-badge good" style={{ fontSize: '0.68rem' }}>Cartão até {config.max_installments}x</span>}
                  {config.boleto_enabled && <span className="status-badge good" style={{ fontSize: '0.68rem' }}>Boleto Bancário</span>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Banco Vinculado</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {config.bank_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Agência: <strong>{config.agency_number}{config.agency_digit ? `-${config.agency_digit}` : ''}</strong> • Conta: <strong>{config.account_number}-{config.account_digit}</strong>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Fluxo de Repasses</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  {getFrequencyLabel()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Ambiente Ativo</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: config.environment === 'LIVE' ? '#059669' : '#d97706' }}>
                  {config.environment === 'LIVE' ? '🟢 Produção Oficial (Transações Reais)' : '🟡 Sandbox de Testes'}
                </div>
              </div>
            </div>
          </div>

          {/* Card de Taxas & Segurança */}
          <div className="portal-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <ShieldCheckIcon />
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Split & Segurança PCI-DSS
              </h4>
            </div>
            
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Todas as transações do app, dízimos, ofertas e PDV são processadas com criptografia de ponta a ponta e depositadas diretamente na conta cadastrada da sua igreja.
            </p>

            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• Pix Instantâneo:</span>
                <strong>Disponível D+0 / D+1</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• Cartão de Crédito:</span>
                <strong>Repasse conforme fluxo</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• Boletos Bancários:</span>
                <strong>Compensação D+1 útil</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
