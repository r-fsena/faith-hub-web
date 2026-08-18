import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

interface ProposalData {
  id: string;
  token: string;
  church_name: string;
  cnpj_cpf?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  plan_tier: string;
  billing_cycle: string;
  monthly_amount: number;
  setup_fee: number;
  status: string;
  features_included: string[];
  notes?: string;
  expires_at?: string;
  accepted_at?: string;
  created_organization_id?: string;
  asaas_payment_link?: string;
  discount_type?: string;
  discount_value?: number;
  discount_duration_months?: number;
  first_cycle_amount?: number;
  notes_commercial?: string;
}

export const ProposalPublicView: React.FC<{ token: string }> = ({ token }) => {
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Checkout & Acceptance State
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'view' | 'payment' | 'success'>('view');
  
  // Payment State
  const [billingType, setBillingType] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [pixCopied, setPixCopied] = useState(false);
  const [activating, setActivating] = useState(false);
  const [provisionResult, setProvisionResult] = useState<any>(null);

  // Credit Card Form
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    loadProposal();
  }, [token]);

  const loadProposal = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/proposals/public/${token}`);
      if (!res.ok) {
        throw new Error('Proposta comercial não encontrada ou expirada.');
      }
      const data = await res.json();
      setProposal(data);

      if (data.status === 'PAID') {
        setStep('success');
      } else if (data.status === 'ACCEPTED') {
        setStep('payment');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar proposta');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposal = async () => {
    if (!termsAccepted) {
      alert('Por favor, confirme que está de acordo com os termos da proposta para continuar.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/proposals/public/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billingType,
          creditCard: billingType === 'CREDIT_CARD' ? {
            holderName: cardHolder,
            number: cardNumber.replace(/\D/g, ''),
            expiryMonth: cardExpiry.split('/')[0],
            expiryYear: cardExpiry.split('/')[1] ? `20${cardExpiry.split('/')[1]}` : '2026',
            ccv: cardCvv
          } : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao aceitar proposta');

      // Se foi carência grátis (1º mês grátis), já foi provisionado na hora!
      if (data.is_free_trial && data.provision_result) {
        setProvisionResult(data.provision_result);
        setStep('success');
        if (proposal) setProposal({ ...proposal, status: 'PAID' });
      } else {
        setStep('payment');
        if (proposal) {
          setProposal({ ...proposal, status: 'ACCEPTED' });
        }
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao processar aceite da proposta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!proposal) return;
    setActivating(true);
    try {
      const res = await fetch(`${API_URL}/proposals/${proposal.id}/simulate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro na ativação');

      setProvisionResult(data.result);
      setStep('success');
    } catch (err: any) {
      alert(err.message || 'Erro ao ativar ambiente.');
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090d16', color: '#ffffff', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #1e293b', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ color: '#94a3b8', fontSize: '0.90rem' }}>Carregando proposta comercial segura...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090d16', color: '#ffffff', padding: '24px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '40px', maxWidth: '460px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>Proposta Indisponível</h2>
          <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginTop: '8px', lineHeight: 1.5 }}>
            {error || 'Esta proposta comercial expirou ou o link não é mais válido. Entre em contato com a equipe comercial do Faith-Hub.'}
          </p>
          <a href="https://faithhubs.com" style={{ display: 'inline-block', marginTop: '20px', background: '#0ea5e9', color: '#ffffff', textDecoration: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '0.84rem' }}>
            Ir para o Site Oficial
          </a>
        </div>
      </div>
    );
  }

  const cycleLabel = proposal.billing_cycle === 'YEARLY' ? 'Anual' : (proposal.billing_cycle === 'SEMIANNUAL' ? 'Semestral' : 'Mensal');
  const isFirstFree = proposal.discount_type === 'FIRST_FREE';
  const hasRecurringDiscount = proposal.discount_type === 'RECURRING_MONTHS_DISCOUNT';
  const hasFirstMonthDiscount = proposal.discount_type === 'FIRST_MONTH_DISCOUNT';

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, #0f172a 0%, #030712 100%)', color: '#f8fafc', padding: '32px 16px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        
        {/* Top Branding Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)' }}>
              ✝
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
                Faith-Hub <span style={{ color: '#0ea5e9', fontSize: '0.80rem', fontWeight: 700, background: 'rgba(14, 165, 233, 0.15)', padding: '2px 8px', borderRadius: '6px', marginLeft: '6px' }}>SaaS B2B</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Ecossistema Digital & Aplicativos para Igrejas</div>
            </div>
          </div>

          <span style={{
            background: proposal.status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(14, 165, 233, 0.15)',
            color: proposal.status === 'PAID' ? '#10b981' : '#38bdf8',
            border: `1px solid ${proposal.status === 'PAID' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(14, 165, 233, 0.3)'}`,
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.74rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {proposal.status === 'PAID' ? '✓ Proposta Aprovada' : (proposal.status === 'ACCEPTED' ? '⏳ Aguardando Pagamento' : '📄 Proposta Comercial Exclusiva')}
          </span>
        </div>

        {/* STEP 1: VISÃO GERAL DA PROPOSTA */}
        {step === 'view' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Discount Promotional Banner (Se houver desconto) */}
            {isFirstFree && (
              <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', borderRadius: '20px', padding: '20px 24px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)' }}>
                <div style={{ fontSize: '2.2rem' }}>🎁</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.15rem' }}>Oferta de Boas-Vindas: 1ª Mensalidade 100% Gratuita!</div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.95 }}>Seu ambiente será ativado imediatamente sem nenhum custo hoje (30 dias de carência para implantação).</div>
                </div>
              </div>
            )}

            {hasRecurringDiscount && (
              <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', borderRadius: '20px', padding: '20px 24px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.25)' }}>
                <div style={{ fontSize: '2.2rem' }}>⏳</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.15rem' }}>Condição Especial: R$ {proposal.discount_value} de Desconto nos Primeiros {proposal.discount_duration_months} Meses!</div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.95 }}>De R$ {Number(proposal.monthly_amount).toFixed(2).replace('.', ',')} por apenas <strong>R$ {Number(proposal.first_cycle_amount).toFixed(2).replace('.', ',')}/mês</strong> durante os primeiros {proposal.discount_duration_months} meses.</div>
                </div>
              </div>
            )}

            {hasFirstMonthDiscount && (
              <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', borderRadius: '20px', padding: '20px 24px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 10px 25px rgba(37, 99, 235, 0.25)' }}>
                <div style={{ fontSize: '2.2rem' }}>🏷️</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.15rem' }}>Desconto Especial na 1ª Mensalidade: R$ {proposal.discount_value} OFF!</div>
                  <div style={{ fontSize: '0.82rem', opacity: 0.95 }}>1º Mês por apenas <strong>R$ {Number(proposal.first_cycle_amount).toFixed(2).replace('.', ',')}</strong>. A partir do 2º mês: R$ {Number(proposal.monthly_amount).toFixed(2).replace('.', ',')}/mês.</div>
                </div>
              </div>
            )}

            {/* Header Hero da Igreja */}
            <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '32px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
              
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                PROPOSTA ELABORADA PARA
              </span>
              <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', fontWeight: 900, color: '#ffffff', margin: '4px 0 12px 0', letterSpacing: '-0.03em' }}>
                {proposal.church_name}
              </h1>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.82rem', color: '#94a3b8' }}>
                <div>👤 <strong>A/C:</strong> {proposal.contact_name}</div>
                {proposal.cnpj_cpf && <div>🏛️ <strong>CNPJ:</strong> {proposal.cnpj_cpf}</div>}
                {proposal.contact_phone && <div>📱 <strong>WhatsApp:</strong> {proposal.contact_phone}</div>}
                <div>✉️ <strong>E-mail:</strong> {proposal.contact_email}</div>
              </div>
            </div>

            {/* Grid de Condições Financeiras */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              
              {/* Card Plano & Mensalidade */}
              <div style={{ background: isFirstFree ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderRadius: '20px', padding: '24px', color: '#ffffff', boxShadow: isFirstFree ? '0 10px 25px rgba(5, 150, 105, 0.25)' : '0 10px 25px rgba(2, 132, 199, 0.25)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
                  PLANO RECOMENDADO • {proposal.plan_tier}
                </span>

                {isFirstFree ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0 2px 0' }}>
                      <span style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>R$ 0,00</span>
                      <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>no 1º mês</span>
                    </div>
                    <div style={{ fontSize: '0.76rem', opacity: 0.9, marginTop: '4px' }}>
                      A partir do 2º mês: <strong>R$ {Number(proposal.monthly_amount).toFixed(2).replace('.', ',')}/mês</strong>
                    </div>
                  </div>
                ) : hasRecurringDiscount ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '8px 0 2px 0' }}>
                      <span style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1 }}>R$ {Number(proposal.first_cycle_amount).toFixed(2).replace('.', ',')}</span>
                      <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>/mês</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', opacity: 0.9, marginTop: '4px' }}>
                      (Desconto por {proposal.discount_duration_months} meses. Após: R$ {Number(proposal.monthly_amount).toFixed(2).replace('.', ',')}/mês)
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '10px 0 4px 0' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>R$</span>
                    <span style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1 }}>{Number(proposal.monthly_amount).toFixed(2).replace('.', ',')}</span>
                    <span style={{ fontSize: '0.84rem', opacity: 0.85 }}>/mês</span>
                  </div>
                )}

                <div style={{ fontSize: '0.74rem', opacity: 0.85, marginTop: '8px' }}>
                  Faturamento Recorrente: <strong>{cycleLabel}</strong>
                </div>
              </div>

              {/* Card Taxa de Setup */}
              <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  IMPLANTAÇÃO & ONBOARDING
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: '6px 0 2px 0' }}>
                  {proposal.setup_fee > 0 ? `R$ ${Number(proposal.setup_fee).toFixed(2).replace('.', ',')}` : 'Isento (R$ 0,00)'}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  Configuração completa dos servidores AWS e customização de cores da igreja.
                </div>
              </div>

            </div>

            {/* Módulos & Recursos Inclusos */}
            <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '28px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 16px 0' }}>
                ✨ Recursos Inclusos na Assinatura:
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '12px' }}>
                {(proposal.features_included || []).map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ color: '#10b981', fontWeight: 900, fontSize: '0.90rem' }}>✓</span>
                    <span style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Termos & Aceite Eletrônico */}
            <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '28px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 10px 0' }}>
                📜 Termos da Proposta e Contrato de Licença de Software
              </h3>
              
              <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '14px', padding: '16px', maxHeight: '130px', overflowY: 'auto', fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
                Ao aceitar esta proposta, a <strong>{proposal.church_name}</strong> contrata o licenciamento de uso do ecossistema <strong>Faith-Hub</strong> pelo valor acordado de R$ {Number(proposal.monthly_amount).toFixed(2).replace('.', ',')}/{cycleLabel.toLowerCase()}. A assinatura pode ser cancelada a qualquer momento sem fidelidade ou multas rescisórias. {isFirstFree ? 'Por contar com a 1ª Mensalidade Grátis, seu acesso é liberado imediatamente no aceite eletrônico.' : 'O provisionamento do aplicativo e painel de gestão é liberado instantaneamente após a confirmação do pagamento.'}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.84rem', color: '#e2e8f0' }}>
                <input 
                  type="checkbox" 
                  checked={termsAccepted} 
                  onChange={e => setTermsAccepted(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0ea5e9' }}
                />
                <span>Li e concordo com os termos comerciais e de serviço da proposta.</span>
              </label>

              <button
                type="button"
                onClick={handleAcceptProposal}
                disabled={!termsAccepted || submitting}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  background: !termsAccepted ? '#334155' : isFirstFree ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: '16px',
                  fontWeight: 900,
                  fontSize: '1rem',
                  cursor: termsAccepted ? 'pointer' : 'not-allowed',
                  boxShadow: termsAccepted ? '0 10px 25px rgba(14, 165, 233, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {submitting ? 'Processando Aceite...' : isFirstFree ? '🚀 Aceitar Proposta & Ativar Meu Aplicativo Grátis Agora' : '🤝 Aceitar Proposta e Continuar para Pagamento'}
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: TELA DE PAGAMENTO / ASSINATURA ASAAS */}
        {step === 'payment' && (
          <div style={{ background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '36px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxWidth: '600px', margin: '0 auto' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '2rem' }}>💳</span>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', margin: '6px 0 2px 0' }}>
                Assinatura Recorrente Asaas
              </h2>
              <p style={{ fontSize: '0.80rem', color: '#94a3b8', margin: 0 }}>
                {proposal.church_name} • R$ {Number(proposal.first_cycle_amount || proposal.monthly_amount).toFixed(2).replace('.', ',')}/{cycleLabel.toLowerCase()}
              </p>
            </div>

            {/* Seleção do Meio de Pagamento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setBillingType('PIX')}
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  border: billingType === 'PIX' ? '2px solid #0ea5e9' : '1px solid #334155',
                  background: billingType === 'PIX' ? 'rgba(14, 165, 233, 0.1)' : '#1e293b',
                  color: billingType === 'PIX' ? '#38bdf8' : '#cbd5e1',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                💠 PIX Recorrente
              </button>

              <button
                type="button"
                onClick={() => setBillingType('CREDIT_CARD')}
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  border: billingType === 'CREDIT_CARD' ? '2px solid #0ea5e9' : '1px solid #334155',
                  background: billingType === 'CREDIT_CARD' ? 'rgba(14, 165, 233, 0.1)' : '#1e293b',
                  color: billingType === 'CREDIT_CARD' ? '#38bdf8' : '#cbd5e1',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                💳 Cartão de Crédito
              </button>
            </div>

            {/* Opção PIX */}
            {billingType === 'PIX' && (
              <div style={{ textAlign: 'center', background: '#090d16', padding: '24px', borderRadius: '18px', border: '1px solid #1e293b' }}>
                <div style={{ width: '180px', height: '180px', margin: '0 auto 16px auto', background: '#ffffff', borderRadius: '14px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`PIX-FAITHHUB-ASAAS-${proposal.id}`)}`}
                    alt="QR Code PIX Asaas" 
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                <div style={{ fontSize: '0.80rem', color: '#94a3b8', marginBottom: '12px' }}>
                  Abra o aplicativo do seu banco e escaneie o QR Code acima para ativar o ambiente.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`00020126580014BR.GOV.BCB.PIX0136${proposal.id}5204000053039865405297.005802BR5913FAITHHUB SAAS6009SAO PAULO62070503***6304E8A1`);
                    setPixCopied(true);
                    setTimeout(() => setPixCopied(false), 3000);
                  }}
                  style={{ background: '#1e293b', color: '#ffffff', border: '1px solid #334155', padding: '10px 18px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', marginBottom: '14px' }}
                >
                  {pixCopied ? '✓ Código PIX Copiado!' : '📋 Copiar Código PIX Copia e Cola'}
                </button>

                {/* Botão de Simulação de Pagamento para Teste */}
                <div style={{ borderTop: '1px dashed #1e293b', paddingTop: '16px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={activating}
                    style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 16px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', width: '100%' }}
                  >
                    {activating ? 'Provisionando na AWS...' : '⚡ Confirmar Pagamento & Provisionar Agora (Modo Simulação)'}
                  </button>
                </div>
              </div>
            )}

            {/* Opção Cartão de Crédito */}
            {billingType === 'CREDIT_CARD' && (
              <form onSubmit={(e) => { e.preventDefault(); handleSimulatePayment(); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Nome Impresso no Cartão</label>
                  <input type="text" value={cardHolder} onChange={e => setCardHolder(e.target.value)} placeholder="Ex: CARLOS E SILVA" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#090d16', color: '#ffffff', fontSize: '0.84rem' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Número do Cartão</label>
                  <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#090d16', color: '#ffffff', fontSize: '0.84rem' }} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>Validade (MM/AA)</label>
                    <input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="12/28" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#090d16', color: '#ffffff', fontSize: '0.84rem' }} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>CVV</label>
                    <input type="text" value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="123" style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155', background: '#090d16', color: '#ffffff', fontSize: '0.84rem' }} required />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={activating}
                  style={{ width: '100%', marginTop: '10px', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 900, fontSize: '0.90rem', cursor: 'pointer' }}
                >
                  {activating ? 'Processando Assinatura...' : '🔒 Assinar e Ativar Ambiente'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => setStep('view')}
              style={{ width: '100%', marginTop: '14px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              ← Voltar para detalhes da proposta
            </button>

          </div>
        )}

        {/* STEP 3: AMBIENTE ATIVADO COM SUCESSO! */}
        {step === 'success' && (
          <div style={{ background: '#0f172a', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '28px', padding: '40px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', maxWidth: '640px', margin: '0 auto' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px auto', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              🎉
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', margin: '0 0 6px 0' }}>
              Parabéns! O ambiente da sua igreja está ativo!
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Tudo foi provisionado com sucesso na nuvem AWS. Os acessos administrativos e o link do aplicativo foram gerados.
            </p>

            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '18px', padding: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div>
                <span style={{ fontSize: '0.70rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Igreja Contratante</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{proposal.church_name}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.70rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>E-mail do Administrador (Login)</span>
                <div style={{ fontSize: '0.90rem', fontWeight: 800, color: '#38bdf8' }}>{proposal.contact_email}</div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Um e-mail de boas-vindas com a senha provisória foi enviado para esta caixa postal.</span>
              </div>

              <div>
                <span style={{ fontSize: '0.70rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Link do Aplicativo dos Membros (PWA)</span>
                <div style={{ fontSize: '0.90rem', fontWeight: 800, color: '#10b981' }}>
                  {provisionResult?.pwa_url || `https://app.faithhubs.com/${proposal.suggested_slug || 'sua-igreja'}`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href="https://studio.faithhubs.com"
                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', color: '#ffffff', textDecoration: 'none', fontWeight: 800, fontSize: '0.90rem', textAlign: 'center' }}
              >
                💻 Entrar no Web Studio
              </a>
              <a
                href={provisionResult?.pwa_url || `https://app.faithhubs.com/${proposal.suggested_slug || ''}`}
                target="_blank"
                rel="noreferrer"
                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#1e293b', color: '#ffffff', textDecoration: 'none', fontWeight: 800, fontSize: '0.90rem', textAlign: 'center', border: '1px solid #334155' }}
              >
                📱 Abrir Aplicativo
              </a>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default ProposalPublicView;
