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

      setStep('payment');
      if (proposal) {
        setProposal({ ...proposal, status: 'ACCEPTED' });
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
              <div style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderRadius: '20px', padding: '24px', color: '#ffffff', boxShadow: '0 10px 25px rgba(2, 132, 199, 0.25)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
                  PLANO RECOMENDADO • {proposal.plan_tier}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '10px 0 4px 0' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>R$</span>
                  <span style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1 }}>{Number(proposal.monthly_amount).toFixed(2).replace('.', ',')}</span>
                  <span style={{ fontSize: '0.84rem', opacity: 0.85 }}>/mês</span>
                </div>
                <div style={{ fontSize: '0.76rem', opacity: 0.9 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
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
                Ao aceitar esta proposta, a <strong>{proposal.church_name}</strong> contrata o licenciamento de uso do ecossistema <strong>Faith-Hub</strong> pelo valor acordado de R$ {Number(proposal.monthly_amount).toFixed(2).replace('.', ',')}/{cycleLabel.toLowerCase()}. A assinatura pode ser cancelada a qualquer momento sem fidelidade ou multas rescisórias. O provisionamento do aplicativo e painel de gestão é liberado instantaneamente após a confirmação do pagamento.
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
                  background: termsAccepted ? 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' : '#334155',
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
                {submitting ? 'Processando Aceite...' : '🤝 Aceitar Proposta e Continuar para Pagamento'}
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
                {proposal.church_name} • R$ {Number(proposal.monthly_amount).toFixed(2).replace('.', ',')}/{cycleLabel.toLowerCase()}
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
                    navigator.clipboard.writeText(`00020126580014br.gov.bcb.pix0136faithhub-${proposal.id}5204000053039865802BR5913Faith Hub SaaS6009Sao Paulo62070503***6304ABCD`);
                    setPixCopied(true);
                    setTimeout(() => setPixCopied(false), 3000);
                  }}
                  style={{ background: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '10px 18px', borderRadius: '12px', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  {pixCopied ? '✓ Código PIX Copiado!' : '📋 Copiar Código PIX Copia e Cola'}
                </button>
              </div>
            )}

            {/* Opção Cartão de Crédito */}
            {billingType === 'CREDIT_CARD' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nome Impresso no Cartão</label>
                  <input type="text" value={cardHolder} onChange={e => setCardHolder(e.target.value)} placeholder="Como no cartão" style={{ width: '100%', background: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px', color: '#ffffff', fontSize: '0.84rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Número do Cartão</label>
                  <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" style={{ width: '100%', background: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px', color: '#ffffff', fontSize: '0.84rem' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Validade (MM/AA)</label>
                    <input type="text" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} placeholder="MM/AA" style={{ width: '100%', background: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px', color: '#ffffff', fontSize: '0.84rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>CVV</label>
                    <input type="text" value={cardCvv} onChange={e => setCardCvv(e.target.value)} placeholder="123" style={{ width: '100%', background: '#090d16', border: '1px solid #334155', borderRadius: '10px', padding: '10px 12px', color: '#ffffff', fontSize: '0.84rem' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Simulação Instantânea de Pagamento para Homologação */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={activating}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '14px',
                  fontWeight: 900,
                  fontSize: '0.90rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                }}
              >
                {activating ? 'Provisionando Ambiente...' : '⚡ Confirmar Pagamento & Liberar Acesso Imediato'}
              </button>
              <span style={{ fontSize: '0.70rem', color: '#64748b', display: 'block', marginTop: '6px' }}>
                O Webhook Asaas provisionará a igreja instantaneamente após a confirmação.
              </span>
            </div>

          </div>
        )}

        {/* STEP 3: AMBIENTE LIBERADO COM SUCESSO! */}
        {step === 'success' && (
          <div style={{ background: '#0f172a', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '28px', padding: '40px 32px', textAlign: 'center', maxWidth: '600px', margin: '0 auto', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 16px auto' }}>
              ✓
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              Parabéns! Ambiente Liberado! 🎉
            </h2>
            <p style={{ fontSize: '0.86rem', color: '#94a3b8', marginTop: '8px', lineHeight: 1.5 }}>
              A assinatura da <strong>{proposal.church_name}</strong> foi confirmada com sucesso no Asaas e seu ecossistema digital já está no ar.
            </p>

            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '18px', padding: '20px', margin: '24px 0', textAlign: 'left' }}>
              <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                DADOS DE ACESSO AO ECOSSISTEMA
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div>🌐 <strong>Portal Web Studio:</strong> <a href="https://studio.faithhubs.com" style={{ color: '#38bdf8', textDecoration: 'none' }}>https://studio.faithhubs.com</a></div>
                <div>📱 <strong>Aplicativo PWA:</strong> <a href={provisionResult?.pwa_url || `https://app.faithhubs.com/${proposal.suggested_slug || 'sua-igreja'}`} style={{ color: '#10b981', textDecoration: 'none' }}>{provisionResult?.pwa_url || `https://app.faithhubs.com/${proposal.suggested_slug || 'sua-igreja'}`}</a></div>
                <div>👤 <strong>Usuário Administrador:</strong> <span style={{ color: '#f8fafc' }}>{proposal.contact_email}</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href="https://studio.faithhubs.com"
                style={{ flex: 1, background: '#0ea5e9', color: '#ffffff', textDecoration: 'none', padding: '14px', borderRadius: '14px', fontWeight: 900, fontSize: '0.88rem' }}
              >
                Acessar Portal Web Studio ➔
              </a>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
