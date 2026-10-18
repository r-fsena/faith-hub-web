import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

interface ChurchInfo {
  id: string;
  name: string;
  slogan?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export const PublicWelcomeView: React.FC<{ orgIdentifier: string }> = ({ orgIdentifier }) => {
  const [church, setChurch] = useState<ChurchInfo | null>(null);
  const [loadingChurch, setLoadingChurch] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [originChannel, setOriginChannel] = useState('QR_CODE');
  const [cellInterest, setCellInterest] = useState<'YES' | 'MAYBE' | 'NO'>('YES');
  const [prayerRequest, setPrayerRequest] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadChurchInfo();
  }, [orgIdentifier]);

  const loadChurchInfo = async () => {
    setLoadingChurch(true);
    try {
      const param = orgIdentifier ? `?organization_id=${encodeURIComponent(orgIdentifier)}` : '';
      const res = await fetch(`${API_URL}/church-settings${param}`);
      if (res.ok) {
        const data = await res.json();
        const settings = data.data || data;
        if (settings && (settings.church_name || settings.name)) {
          setChurch({
            id: settings.organization_id || orgIdentifier,
            name: settings.church_name || settings.name || 'Nossa Igreja',
            slogan: settings.slogan || 'Um lugar de fé, comunhão e acolhimento',
            logo_url: settings.logo_url || settings.pwa_icon_url || '',
            primary_color: settings.primary_color || '#0f766e',
            secondary_color: settings.secondary_color || '#14b8a6'
          });
        } else {
          setFallbackChurch();
        }
      } else {
        setFallbackChurch();
      }
    } catch (e) {
      console.warn('Erro ao carregar dados da igreja:', e);
      setFallbackChurch();
    } finally {
      setLoadingChurch(false);
    }
  };

  const setFallbackChurch = () => {
    setChurch({
      id: orgIdentifier || 'org_default',
      name: orgIdentifier === 'org_default' ? 'Igreja Viva' : 'Comunidade da Fé',
      slogan: 'Seja muito bem-vindo ao nosso culto!',
      primary_color: '#0f766e',
      secondary_color: '#14b8a6'
    });
  };

  const formatPhoneNumber = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 2) return raw;
    if (raw.length <= 7) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Por favor, informe um WhatsApp válido com DDD.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const fullNotes = [
        prayerRequest ? `🙏 Pedido de Oração: ${prayerRequest}` : '',
        cellInterest === 'YES' ? '🏠 Tem interesse em participar de Célula' : (cellInterest === 'MAYBE' ? '🏠 Gostaria de saber mais sobre Células' : '')
      ].filter(Boolean).join(' | ');

      const payload = {
        name: name.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        origin_channel: originChannel,
        notes: fullNotes || 'Cadastro via QR Code de Acolhimento do Culto',
        organization_id: church?.id || orgIdentifier || 'org_default',
        campus_id: 'campus_sede',
        first_visit_date: new Date().toISOString().split('T')[0]
      };

      const res = await fetch(`${API_URL}/pastoral/visitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || 'Não foi possível registrar seu contato. Tente novamente.');
      }
    } catch (err: any) {
      console.error('Erro ao enviar acolhimento:', err);
      setErrorMessage('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const primaryColor = church?.primary_color || '#0f766e';
  const secondaryColor = church?.secondary_color || '#14b8a6';

  if (loadingChurch) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '3px solid rgba(255,255,255,0.2)',
          borderTopColor: '#38bdf8',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '16px', fontSize: '0.95rem', fontWeight: 500, color: '#94a3b8' }}>
          Preparando acolhimento...
        </p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // TELA DE AGRADECIMENTO / SUCESSO
  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #134e4a 0%, #0f172a 60%, #020617 100%)',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '36px 24px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 0.5s ease-out'
        }}>
          <div style={{
            width: '76px',
            height: '76px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
            fontSize: '2rem'
          }}>
            ❤️
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.02em' }}>
            Seja muito bem-vindo!
          </h2>

          <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 20px 0' }}>
            Olá, <strong style={{ color: '#ffffff' }}>{name.split(' ')[0]}</strong>! É uma alegria imensa ter você conosco hoje na <strong style={{ color: '#5eead4' }}>{church?.name}</strong>.
          </p>

          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '18px',
            marginBottom: '26px',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#94a3b8' }}>
              ✨ <strong>Próximos passos do seu acolhimento:</strong>
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.6' }}>
              <li>Nossa equipe de acolhimento mandará uma mensagem de carinho no seu WhatsApp.</li>
              <li>Sua oração já foi entregue aos nossos intercessores.</li>
              <li>Sinta-se em casa para celebrar e adorar conosco!</li>
            </ul>
          </div>

          <button
            onClick={() => {
              setSubmitted(false);
              setName('');
              setPhone('');
              setEmail('');
              setNeighborhood('');
              setPrayerRequest('');
            }}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(20, 184, 166, 0.3)'
            }}
          >
            Cadastrar outra pessoa da família
          </button>
        </div>
      </div>
    );
  }

  // FORMULÁRIO DE BOAS-VINDAS PÚBLICO
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #0f2d2b 0%, #09131a 50%, #030712 100%)',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px 16px 48px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* HEADER DA IGREJA */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        {church?.logo_url ? (
          <img
            src={church.logo_url}
            alt={church.name}
            style={{ width: '72px', height: '72px', borderRadius: '18px', objectFit: 'cover', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          />
        ) : (
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '1.8rem',
            boxShadow: `0 8px 20px ${primaryColor}40`
          }}>
            ⛪
          </div>
        )}

        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: '#ffffff' }}>
          {church?.name}
        </h1>
        <p style={{ fontSize: '0.92rem', color: '#94a3b8', margin: 0 }}>
          {church?.slogan || 'Cartão Digital de Acolhimento & Boas-Vindas'}
        </p>
      </div>

      {/* CARD DO FORMULÁRIO */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '28px 22px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(20, 184, 166, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2dd4bf',
            fontSize: '1.1rem'
          }}>
            👋
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
              Queremos te conhecer!
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
              Leva menos de 1 minuto para preencher.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '0.85rem',
            color: '#fca5a5',
            marginBottom: '18px'
          }}>
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* NOME COMPLETO */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Seu Nome Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Ana Clara Silva"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '13px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* WHATSAPP */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              WhatsApp / Celular com DDD *
            </label>
            <input
              type="tel"
              required
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={e => setPhone(formatPhoneNumber(e.target.value))}
              style={{
                width: '100%',
                padding: '13px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* BAIRRO / REGIÃO */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Qual o seu Bairro ou Cidade?
            </label>
            <input
              type="text"
              placeholder="Ex: Pinheiros, São Paulo"
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
              style={{
                width: '100%',
                padding: '13px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#ffffff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* COMO CONHECEU A IGREJA */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Como você conheceu a nossa igreja?
            </label>
            <select
              value={originChannel}
              onChange={e => setOriginChannel(e.target.value)}
              style={{
                width: '100%',
                padding: '13px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: '#0f172a',
                color: '#ffffff',
                fontSize: '0.90rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="QR_CODE">📱 QR Code no Culto / Telão</option>
              <option value="FRIEND">👥 Convite de Amigo ou Familiar</option>
              <option value="INSTAGRAM">📸 Redes Sociais / Instagram</option>
              <option value="YOUTUBE">▶️ Transmissão no YouTube</option>
              <option value="NEIGHBORHOOD">🚶 Passou em frente ao templo</option>
              <option value="OTHER">✨ Outro motivo</option>
            </select>
          </div>

          {/* INTERESSE EM CÉLULA */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
              Gostaria de conhecer uma Célula (Grupo nos lares)?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCellInterest('YES')}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: cellInterest === 'YES' ? `2px solid ${secondaryColor}` : '1px solid rgba(255,255,255,0.1)',
                  background: cellInterest === 'YES' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🏠 Sim, adoraria!
              </button>
              <button
                type="button"
                onClick={() => setCellInterest('MAYBE')}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: cellInterest === 'MAYBE' ? `2px solid ${secondaryColor}` : '1px solid rgba(255,255,255,0.1)',
                  background: cellInterest === 'MAYBE' ? 'rgba(20, 184, 166, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ℹ️ Quero saber mais
              </button>
            </div>
          </div>

          {/* PEDIDO DE ORAÇÃO */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
              Gostaria de deixar um Pedido de Oração? (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Escreva aqui seu pedido ou motivo de oração..."
              value={prayerRequest}
              onChange={e => setPrayerRequest(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#ffffff',
                fontSize: '0.90rem',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* BOTÃO DE SUBMISSÃO */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: `0 8px 24px ${primaryColor}50`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {submitting ? (
              <>
                <div style={{ width: '18px', height: '18px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <span>Enviar Cartão de Acolhimento</span>
                <span>✨</span>
              </>
            )}
          </button>
        </form>
      </div>

      <footer style={{ marginTop: '28px', textAlign: 'center', fontSize: '0.78rem', color: '#64748b' }}>
        Plataforma Faith-Hub • CRM Pastoral & Acolhimento
      </footer>
    </div>
  );
};
