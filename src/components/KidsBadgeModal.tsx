import React, { useRef } from 'react';
import { createPortal } from 'react-dom';

export interface KidsBadgeData {
  id: string;
  child_name: string;
  room_name: string;
  room_color?: string;
  parent_name: string;
  parent_phone: string;
  security_code: string;
  checkin_at: string;
  allergies?: string;
  medical_notes?: string;
  church_name?: string;
}

interface KidsBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge: KidsBadgeData | null;
  onNewCheckin?: () => void;
}

export const KidsBadgeModal: React.FC<KidsBadgeModalProps> = ({ isOpen, onClose, badge, onNewCheckin }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !badge) return null;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(badge.security_code)}&margin=10`;
  const cleanPhone = badge.parent_phone.replace(/\D/g, '');
  const checkinTime = new Date(badge.checkin_at || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const checkinDate = new Date(badge.checkin_at || Date.now()).toLocaleDateString('pt-BR');

  const whatsappMessage = `*${badge.church_name || 'Ministério Infantil'}* 🚸\n\nOlá *${badge.parent_name}*!\nO check-in de *${badge.child_name}* foi realizado com sucesso na sala *${badge.room_name}*.\n\n🔑 *PIN de Segurança / Retirada:* *${badge.security_code}*\n⏰ *Horário:* ${checkinTime} de ${checkinDate}\n\nGuarde este código ou apresente o QR Code no seu aplicativo Faith-Hub para retirar seu filho ao final do culto.`;

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-studio-container animate-scale-up"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 460, width: '100%' }}
      >
        {/* Top Header */}
        <div className="modal-studio-header">
          <div className="modal-studio-header-left">
            <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-blue-bg)', color: 'var(--pastel-blue-text)' }}>
              ✨
            </div>
            <div>
              <div className="modal-studio-title">Check-in Confirmado!</div>
              <div className="modal-studio-subtitle">Crachá de segurança & QR Code de retirada</div>
            </div>
          </div>

          <div className="modal-close-circle" onClick={onClose}>
            ✕
          </div>
        </div>

        {/* Printable Card Area */}
        <div ref={printRef} style={{ padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          {/* Room Pill */}
          <div style={{
            background: badge.room_color ? `${badge.room_color}18` : 'var(--accent-primary-light)',
            color: badge.room_color || 'var(--accent-primary)',
            border: `1px solid ${badge.room_color || 'var(--accent-primary)'}35`,
            padding: '5px 16px',
            borderRadius: 20,
            fontSize: '0.80rem',
            fontWeight: 800,
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            📍 {badge.room_name}
          </div>

          {/* Child Name */}
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {badge.child_name}
          </h2>

          {/* Parent Info */}
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Responsável: <strong>{badge.parent_name}</strong> • {badge.parent_phone}
          </div>

          {/* Allergies / Medical Notes Warning */}
          {(badge.allergies || badge.medical_notes) && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              color: '#b91c1c',
              borderRadius: 12,
              padding: '8px 14px',
              fontSize: '0.78rem',
              fontWeight: 800,
              width: '100%',
              marginBottom: 14,
              textAlign: 'left'
            }}>
              ⚠️ {badge.allergies ? `Alergia: ${badge.allergies}` : ''} {badge.medical_notes ? `• Obs: ${badge.medical_notes}` : ''}
            </div>
          )}

          {/* QR Code Frame */}
          <div style={{
            background: '#ffffff',
            border: '2px dashed var(--panel-border)',
            borderRadius: 18,
            padding: 14,
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            marginBottom: 16
          }}>
            <img 
              src={qrCodeUrl} 
              alt={`QR Code ${badge.security_code}`} 
              style={{ width: 170, height: 170, borderRadius: 10, display: 'block' }} 
            />
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Apresente no checkout
            </span>
          </div>

          {/* Large Security PIN Box */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1.5px solid var(--accent-primary)',
            borderRadius: 16,
            padding: '12px 24px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Código de Retirada</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Entrada: {checkinTime}</div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-primary)', letterSpacing: '0.08em' }}>
              {badge.security_code}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ padding: '0 22px 22px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {cleanPhone && (
              <a
                href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  background: '#25d366',
                  color: '#ffffff',
                  borderRadius: 12,
                  padding: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)'
                }}
              >
                <span>💬</span> WhatsApp Pais
              </a>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="btn-secondary"
              style={{
                flex: 1,
                padding: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: 'pointer',
                borderRadius: 12
              }}
            >
              <span>🖨️</span> Imprimir Crachá
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: onNewCheckin ? '1fr 1fr' : '1fr', gap: 8 }}>
            {onNewCheckin && (
              <button
                type="button"
                onClick={onNewCheckin}
                className="btn-secondary"
                style={{
                  borderRadius: 12,
                  padding: '12px',
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary)'
                }}
              >
                <span>➕</span> Novo Check-in
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              style={{
                borderRadius: 12,
                padding: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              <span>🚪</span> Voltar às Salas
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
