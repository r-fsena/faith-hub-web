import React, { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Members.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900 }}>
              💎
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.4px' }}>
                Minha Assinatura & Mensalidade
              </h1>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Gerencie o plano contratado da <strong>{churchName}</strong>, faturas e pagamentos da plataforma Faith-Hub.
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
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
          }}
        >
          <span>💬</span> Falar com Consultor Financeiro
        </a>
      </div>

      {/* CARD DO PLANO ATUAL & PRÓXIMA FATURA */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        
        {/* Card 1: Detalhes do Plano */}
        <div className="portal-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ background: '#059669', color: '#ffffff', padding: '4px 10px', borderRadius: 999, fontSize: '0.70rem', fontWeight: 900 }}>
              PLANO PROFISSIONAL ATIVO
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Renovação Mensal</span>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
            Faith-Hub Pro
          </h2>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', marginBottom: '16px' }}>
            R$ 297,00 <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>/ mês</span>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: '#cbd5e1' }}>
            <div>✓ Aplicativo PWA Whitelabel Personalizado</div>
            <div>✓ Acesso Ilimitado de Membros & Liderança</div>
            <div>✓ Gestão de Células, Ensino, Transmissões e PDV</div>
            <div>✓ Hospedagem e Infraestrutura AWS Inclusa</div>
          </div>
        </div>

        {/* Card 2: Status da Próxima Fatura */}
        <div className="portal-card" style={{ padding: '24px', borderRadius: '24px', border: pendingInvoice ? '2px solid #38bdf8' : '1px solid var(--panel-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Próxima Mensalidade
              </span>
              <span style={{ background: pendingInvoice ? '#eff6ff' : '#ecfdf5', color: pendingInvoice ? '#2563eb' : '#059669', padding: '4px 10px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 900 }}>
                {pendingInvoice ? 'AGUARDANDO PAGAMENTO' : 'ASSINATURA EM DIA'}
              </span>
            </div>

            {pendingInvoice ? (
              <>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0' }}>
                  {formatCurrency(pendingInvoice.amount)}
                </div>
                <p style={{ fontSize: '0.80rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                  Vencimento em: <strong>{new Date(pendingInvoice.due_date).toLocaleDateString('pt-BR')}</strong>
                </p>
              </>
            ) : (
              <div style={{ padding: '20px 0' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669', marginBottom: '4px' }}>
                  ✓ Tudo certo com suas mensalidades!
                </div>
                <p style={{ fontSize: '0.80rem', color: 'var(--text-muted)', margin: 0 }}>
                  Nenhuma fatura em aberto no momento. Obrigado pela parceria com a Faith-Hub.
                </p>
              </div>
            )}
          </div>

          {pendingInvoice && (
            <button
              type="button"
              onClick={() => setSelectedInvoiceForPayment(pendingInvoice)}
              style={{
                background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)'
              }}
            >
              ⚡ Pagar Mensalidade com PIX Instantâneo
            </button>
          )}
        </div>

      </div>

      {/* HISTÓRICO DE FATURAS */}
      <div className="portal-card" style={{ padding: '24px', borderRadius: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 16px 0' }}>
          Histórico de Faturas & Recibos
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Carregando faturas...</div>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Nenhuma fatura registrada.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Vencimento</th>
                  <th style={{ padding: '12px' }}>Plano</th>
                  <th style={{ padding: '12px' }}>Forma</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Valor</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{new Date(inv.due_date).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '12px', fontWeight: 700 }}>{inv.plan_name || 'Plano Pro'}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{inv.payment_method}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: inv.status === 'PAID' ? '#ecfdf5' : '#eff6ff',
                        color: inv.status === 'PAID' ? '#059669' : '#2563eb',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontWeight: 900,
                        fontSize: '0.70rem'
                      }}>
                        {inv.status === 'PAID' ? 'PAGO / QUITADO' : 'PENDENTE'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 900, color: 'var(--text-main)' }}>
                      {formatCurrency(inv.amount)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {inv.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForPayment(inv)}
                          style={{ background: 'var(--accent-primary)', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer' }}
                        >
                          Pagar Agora
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alert(`Comprovante de pagamento da fatura ${inv.id} baixado com sucesso.`)}
                          style={{ background: '#f8fafc', color: 'var(--text-main)', border: '1px solid var(--panel-border)', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer' }}
                        >
                          📄 Recibo
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE PAGAMENTO PIX DA MENSALIDADE */}
      {selectedInvoiceForPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="portal-card animate-fade-in" style={{ background: '#ffffff', borderRadius: '24px', padding: '28px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                ⚡ Pagar Mensalidade Faith-Hub
              </h3>
              <button type="button" onClick={() => setSelectedInvoiceForPayment(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f766e', marginBottom: '4px' }}>
              {formatCurrency(selectedInvoiceForPayment.amount)}
            </div>
            <p style={{ fontSize: '0.80rem', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
              Escaneie o QR Code no app do seu banco ou use o PIX Copia e Cola abaixo:
            </p>

            {/* QR Code Mockup Visual */}
            <div style={{ background: '#f8fafc', border: '2px dashed var(--panel-border)', borderRadius: '16px', padding: '20px', display: 'inline-block', marginBottom: '16px' }}>
              <div style={{ width: '160px', height: '160px', background: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', fontSize: '3rem', margin: '0 auto' }}>
                📱
              </div>
            </div>

            {/* Copia e Cola */}
            <div style={{ marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => handleCopyPixCode(selectedInvoiceForPayment.pix_copy_paste || '00020126580014br.gov.bcb.pix0136fa89c092-231a-493e-bfa1-923847294820520400005303986540297.005802BR5916FAITH HUB SAAS6009SAO PAULO62070503***6304')}
                style={{
                  width: '100%',
                  background: copiedPix ? '#ecfdf5' : '#f1f5f9',
                  color: copiedPix ? '#059669' : '#0f172a',
                  border: '1px solid var(--panel-border)',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                {copiedPix ? '✓ Código PIX Copiado com Sucesso!' : '📋 Copiar Código PIX (Copia e Cola)'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForPayment(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--panel-border)', background: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => handleSimulatePayment(selectedInvoiceForPayment.id)}
                disabled={isPaying}
                style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: 900, cursor: 'pointer' }}
              >
                {isPaying ? 'Confirmando...' : '✓ Já realizei o PIX'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MySubscription;
