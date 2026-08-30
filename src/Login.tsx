import React, { useState } from 'react';
import { signIn, signInWithRedirect } from 'aws-amplify/auth';

interface LoginProps {
  onLoginSuccess: () => void;
}

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { isSignedIn } = await signIn({ username: email, password });
      if (isSignedIn) {
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar o login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithRedirect({ provider: 'Google' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="login-split-wrapper animate-fade-in">
      {/* ========================================================
          LEFT COLUMN: HERO SHOWCASE (2/3 da tela)
          ======================================================== */}
      <div className="login-hero-pane">
        <div className="login-hero-glow-1" />
        <div className="login-hero-glow-2" />

        <div className="login-hero-content">
          {/* Header Brand Badge with Official Logo */}
          <div>
            <div style={{ marginBottom: '24px' }}>
              <img 
                src="/brand/logo-transparent.png" 
                alt="Faith-Hub" 
                style={{ height: '56px', maxWidth: '240px', objectFit: 'contain' }}
              />
            </div>

            <div className="login-badge-pill">
              <span className="login-badge-dot" />
              <span>ECOSSISTEMA FAITH-HUB • PORTAL DA LIDERANÇA</span>
            </div>

            <h1 className="login-hero-title">
              A plataforma unificada para liderar, pastorear e engajar sua comunidade.
            </h1>

            <p className="login-hero-subtitle">
              Tecnologia de ponta a serviço do Reino. Centralize o ministério infantil, gestão de membros, pequenos grupos, eventos e financeiro em uma única experiência.
            </p>
          </div>

          {/* 3 Glassmorphism Feature Cards */}
          <div className="login-feature-cards">
            <div className="login-glass-card">
              <div className="login-glass-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                👶
              </div>
              <div>
                <h3 className="login-glass-title">Ministério Infantil & Check-in</h3>
                <p className="login-glass-desc">Totens em tempo real com PIN de segurança, crachás digitais e chamados diretos aos pais.</p>
              </div>
            </div>

            <div className="login-glass-card">
              <div className="login-glass-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                👥
              </div>
              <div>
                <h3 className="login-glass-title">Membros, Células & Liderança</h3>
                <p className="login-glass-desc">Gestão completa de redes, consolidação, voluntários, escalas e filiais conectadas.</p>
              </div>
            </div>

            <div className="login-glass-card">
              <div className="login-glass-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                💳
              </div>
              <div>
                <h3 className="login-glass-title">Gestão Financeira & PDV</h3>
                <p className="login-glass-desc">Recebimento de dízimos, ofertas, ingressos e catálogo da livraria com split automático.</p>
              </div>
            </div>
          </div>

          {/* Footer Trust Badges */}
          <div className="login-hero-footer">
            <div className="login-trust-item">
              <span className="login-trust-icon">🔒</span>
              <span>Nuvem AWS de Alta Performance</span>
            </div>
            <div className="login-trust-item">
              <span className="login-trust-icon">🛡️</span>
              <span>Criptografia Ponta a Ponta</span>
            </div>
            <div className="login-trust-item">
              <span className="login-trust-icon">📱</span>
              <span>PWA Multiplataforma</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          RIGHT COLUMN: AUTH PANEL (~1/3 da tela)
          ======================================================== */}
      <div className="login-auth-pane">
        <div className="login-form-box">
          {/* Brand Header */}
          <div style={{ textAlign: 'left', marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <img
                src="/brand/logo-symbol.png"
                alt="Faith-Hub"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  objectFit: 'contain',
                  boxShadow: '0 4px 12px rgba(15, 118, 110, 0.15)'
                }}
              />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Faith-Hub Studio
                </h2>
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Portal Administrativo Web</span>
              </div>
            </div>

            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 6px 0' }}>
              Bem-vindo de volta 👋
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
              Digite suas credenciais de liderança para acessar as congregações.
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              textAlign: 'left',
              border: '1px solid #fecaca',
              fontWeight: 600,
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                E-mail institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  color: '#1e293b',
                  fontSize: '0.90rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                placeholder="seu.email@igreja.com"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
                  Senha de acesso
                </label>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '13px 44px 13px 16px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    color: '#1e293b',
                    fontSize: '0.90rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                  title={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', marginTop: '6px', fontSize: '0.95rem', fontWeight: 800, justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Validando acesso...' : 'Entrar no Studio'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', color: '#94a3b8', fontSize: '0.80rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ padding: '0 12px', fontWeight: 600 }}>ou autenticação rápida</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin}
            style={{
              width: '100%',
              padding: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: '#ffffff',
              color: '#334155',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <GoogleIcon />
            <span>Entrar com Google Workspace</span>
          </button>

          <div style={{ marginTop: '36px', textAlign: 'center', fontSize: '0.74rem', color: '#94a3b8' }}>
            © {new Date().getFullYear()} Faith-Hub Ecosystem • Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}
