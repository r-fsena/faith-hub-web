import React, { useState, useEffect } from 'react';
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

const QrCodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
  </svg>
);

interface SaasInvoice {
  id: string;
  subscription_id: string;
  organization_id: string;
  plan_id: string;
  plan_name?: string;
  amount: number;
  due_date: string;
  paid_at?: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  payment_method: string;
  pix_copy_paste?: string;
  pix_qr_code?: string;
  receipt_url?: string;
}

interface MySubscriptionProps {
  selectedOrganization?: any;
}

export const MySubscription: React.FC<MySubscriptionProps> = ({ selectedOrganization }) => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<SaasInvoice[]>([]);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<SaasInvoice | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  const orgId = selectedOrganization?.id || 'org_default';
  const churchName = selectedOrganization?.name || 'Nossa Igreja';

  useEffect(() => {
    loadInvoices();
  }, [orgId]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/saas/invoices?organization_id=${orgId}`);
      if (res.ok) {
        const json = await res.json();
        setInvoices(json.data || []);
      }
    } catch (e) {
      console.error('Erro ao carregar faturas da assinatura:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async (invoiceId: string) => {
    setIsPaying(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

      const res = await fetch(`${API_URL}/saas/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        alert('🎉 Pagamento da mensalidade confirmado com sucesso! Sua assinatura Faith-Hub está em dia.');
        setSelectedInvoiceForPayment(null);
        loadInvoices();
      } else {
        alert('Erro ao processar pagamento.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de comunicação.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCopyPixCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const pendingInvoice = invoices.find(i => i.status === 'PENDING' || i.status === 'OVERDUE');

  return (
    <div className="members-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary-gradient)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <CreditCardIcon />
            </div>
            <div>
              <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.4px' }}>
                Minha Assinatura & Mensalidades
              </h1>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
                Gerencie o plano contratado da <strong>{churchName}</strong>, histórico de faturas e pagamentos da plataforma Faith-Hub.
              </p>
            </div>
          </div>
        </div>

        {/* Falar com Consultor */}
        <a
          href="https://api.whatsapp.com/send?phone=5548991079478&text=Olá!%20Gostaria%20de%20tirar%20dúvidas%20sobre%20a%20minha%20assinatura%20do%20Faith-Hub."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#25D366',
            color: '#ffffff',
            textDecoration: 'none',
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 800,
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
            transition: 'transform 0.15s ease'
          }}
        >
          <span>💬</span> Suporte Financeiro Especializado
        </a>
      </div>

      {/* CARD DO PLANO ATUAL & PRÓXIMA FATURA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        {/* Card 1: Detalhes do Plano */}
        <div className="portal-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ background: '#059669', color: '#ffffff', padding: '4px 10px', borderRadius: '999px', fontSize: '0.70rem', fontWeight: 900 }}>
              PLANO PROFISSIONAL ATIVO
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Renovação Mensal</span>
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
            Faith-Hub Pro
          </h2>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#38bdf8', marginBottom: '16px' }}>
            R$ 297,00 <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>/ mês</span>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: '#cbd5e1' }}>
            <div>✓ Aplicativo PWA Whitelabel Personalizado</div>
            <div>✓ Membros, Células, Ensino & Dízimos Ilimitados</div>
            <div>✓ Módulo Financeiro, DRE e Gateway Pagar.me</div>
            <div>✓ Notificações Push & Central de Cultos</div>
          </div>
        </div>

        {/* Card 2: Status da Próxima Fatura */}
        <div className="portal-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Próximo Vencimento
              </span>
              <span style={{
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.70rem',
                fontWeight: 800,
                background: pendingInvoice ? 'var(--pastel-orange-bg)' : 'var(--pastel-green-bg)',
                color: pendingInvoice ? 'var(--pastel-orange-text)' : 'var(--pastel-green-text)'
              }}>
                {pendingInvoice ? 'AGUARDANDO PAGAMENTO' : 'ASSINATURA EM DIA'}
              </span>
            </div>

            {pendingInvoice ? (
              <>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', margin: '8px 0 4px 0' }}>
                  {formatCurrency(pendingInvoice.amount)}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Vencimento programado para: <strong>{new Date(pendingInvoice.due_date).toLocaleDateString('pt-BR')}</strong>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#059669', margin: '8px 0 4px 0' }}>
                  Tudo em Dia!
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  Nenhuma fatura pendente para a sua congregação.
                </div>
              </>
            )}
          </div>

          {pendingInvoice && (
            <div style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setSelectedInvoiceForPayment(pendingInvoice)}
              >
                <QrCodeIcon /> Pagar Agora com PIX
              </button>
            </div>
          )}
        </div>

      </div>

      {/* HISTÓRICO DE FATURAS */}
      <div className="portal-card" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px 0' }}>
          Histórico de Faturas & Recibos da Assinatura
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--accent-primary)', fontWeight: 700 }}>
            Carregando faturas...
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Nenhuma fatura registrada no histórico.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--panel-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px' }}>Fatura / Ref</th>
                  <th style={{ padding: '12px' }}>Vencimento</th>
                  <th style={{ padding: '12px' }}>Valor</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Data Pagamento</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                      Fatura #{inv.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(inv.due_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 900, color: 'var(--text-main)' }}>
                      {formatCurrency(inv.amount)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: inv.status === 'PAID' ? 'var(--pastel-green-bg)' : 'var(--pastel-orange-bg)',
                        color: inv.status === 'PAID' ? 'var(--pastel-green-text)' : 'var(--pastel-orange-text)'
                      }}>
                        {inv.status === 'PAID' ? '✓ QUITADO' : '⏳ PENDENTE'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                      {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {inv.status === 'PENDING' ? (
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                          onClick={() => setSelectedInvoiceForPayment(inv)}
                        >
                          Pagar Fatura
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>
                          ✓ Quitado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL STUDIO: PAGAMENTO PIX DA FATURA SAAS
          ======================================================== */}
      {selectedInvoiceForPayment && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setSelectedInvoiceForPayment(null)}>
          <div className="modal-studio-container" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-green-bg)', color: 'var(--pastel-green-text)' }}>
                  <QrCodeIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">
                    Pagar Mensalidade Faith-Hub
                  </h2>
                  <p className="modal-studio-subtitle">
                    Pagamento instantâneo via PIX com baixa automática da fatura.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setSelectedInvoiceForPayment(null)} title="Fechar">
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-studio-body" style={{ textAlign: 'center', padding: '28px' }}>
              
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--accent-primary)', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                {formatCurrency(selectedInvoiceForPayment.amount)}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
                Escaneie o QR Code no app do seu banco ou use a chave Copia e Cola:
              </p>

              {/* QR Code Mockup Visual */}
              <div style={{ background: '#f8fafc', border: '2px dashed var(--panel-border)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'inline-block', marginBottom: '20px' }}>
                <div style={{ width: '160px', height: '160px', background: 'var(--brand-navy)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', margin: '0 auto', boxShadow: 'var(--shadow-sm)' }}>
                  <QrCodeIcon />
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 700 }}>
                  QR CODE PIX DINÂMICO
                </div>
              </div>

              {/* Botão Copia e Cola */}
              <div style={{ marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyPixCode(selectedInvoiceForPayment.pix_copy_paste || '00020126580014br.gov.bcb.pix0136fa89c092-231a-493e-bfa1-923847294820520400005303986540297.005802BR5916FAITH HUB SAAS6009SAO PAULO62070503***6304')}
                  style={{
                    width: '100%',
                    background: copiedPix ? 'var(--pastel-green-bg)' : '#f8fafc',
                    color: copiedPix ? 'var(--pastel-green-text)' : 'var(--text-main)',
                    border: '1.5px solid var(--panel-border)',
                    padding: '13px 16px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {copiedPix ? <CheckCircleIcon /> : <CopyIcon />}
                  {copiedPix ? 'Código PIX Copiado com Sucesso!' : 'Copiar Código PIX (Copia e Cola)'}
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="modal-studio-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedInvoiceForPayment(null)}
              >
                Voltar
              </button>

              <button
                type="button"
                className="btn-primary"
                disabled={isPaying}
                onClick={() => handleSimulatePayment(selectedInvoiceForPayment.id)}
              >
                {isPaying ? 'Confirmando...' : '✓ Já realizei o Pagamento'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default MySubscription;
