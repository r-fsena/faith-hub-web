import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface KidsQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  childName?: string;
}

export const KidsQrScannerModal: React.FC<KidsQrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  childName
}) => {
  const [manualPin, setManualPin] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } }
        });

        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Se o navegador suportar BarcodeDetector nativo
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          
          const scanLoop = async () => {
            if (!active || !videoRef.current) return;
            try {
              if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const rawValue = barcodes[0].rawValue;
                  if (rawValue) {
                    // Beep som
                    try {
                      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const osc = ctx.createOscillator();
                      const gain = ctx.createGain();
                      osc.type = "sine";
                      osc.frequency.setValueAtTime(880, ctx.currentTime);
                      gain.gain.setValueAtTime(0.2, ctx.currentTime);
                      osc.connect(gain);
                      gain.connect(ctx.destination);
                      osc.start();
                      osc.stop(ctx.currentTime + 0.15);
                    } catch (e) {}

                    stopCamera();
                    onScanSuccess(rawValue.trim());
                    return;
                  }
                }
              }
            } catch (e) {}
            animFrameRef.current = requestAnimationFrame(scanLoop);
          };
          scanLoop();
        } else {
          // Se não houver BarcodeDetector nativo, carrega Html5Qrcode via CDN
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
          script.onload = () => {
            if (!active) return;
            const Html5Qrcode = (window as any).Html5Qrcode;
            if (Html5Qrcode) {
              const html5QrCode = new Html5Qrcode('kids-web-qr-canvas');
              html5QrCode.start(
                { facingMode: 'environment' },
                { fps: 15, qrbox: 220 },
                (decodedText: string) => {
                  stopCamera();
                  html5QrCode.stop().catch(() => {}).finally(() => {
                    onScanSuccess(decodedText.trim());
                  });
                },
                () => {}
              ).catch(() => {});
            }
          };
          document.body.appendChild(script);
        }
      } catch (err: any) {
        console.warn("Erro ao abrir câmera no Web Studio:", err);
        if (active) {
          setCameraError("Acesso à câmera indisponível ou permissão negada. Digite o código PIN abaixo.");
        }
      }
    };

    const stopCamera = () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      active = false;
      stopCamera();
    };
  }, [isOpen]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPin.trim()) return;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    onScanSuccess(manualPin.trim());
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-studio-container animate-scale-up"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 420, width: '100%' }}
      >
        {/* Header */}
        <div className="modal-studio-header">
          <div className="modal-studio-header-left">
            <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-blue-bg)', color: 'var(--pastel-blue-text)' }}>
              📸
            </div>
            <div>
              <div className="modal-studio-title">Realizar Checkout</div>
              <div className="modal-studio-subtitle">
                {childName ? `Liberando devolução de ${childName}` : 'Escanear QR Code ou PIN'}
              </div>
            </div>
          </div>

          <div className="modal-close-circle" onClick={onClose}>
            ✕
          </div>
        </div>

        {/* Camera Viewfinder Area */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 300,
            height: 280,
            background: '#0f172a',
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
            border: '1.5px solid var(--panel-border)'
          }}>
            <video 
              ref={videoRef} 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />

            <div id="kids-web-qr-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

            {/* Mira com animação */}
            {!cameraError && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 190,
                height: 190,
                border: '2px solid rgba(255, 255, 255, 0.7)',
                borderRadius: 18,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '90%',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
                  boxShadow: '0 0 10px var(--accent-primary)',
                  animation: 'scanLine 2s infinite ease-in-out'
                }} />
              </div>
            )}

            {cameraError && (
              <div style={{ padding: 24, textAlign: 'center', color: '#cbd5e1', fontSize: '0.82rem', zIndex: 10 }}>
                <div style={{ fontSize: '2.4rem', marginBottom: 10 }}>📷❌</div>
                <div>{cameraError}</div>
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 12, textAlign: 'center' }}>
            Aponte a câmera para o QR Code no celular do responsável
          </div>

          {/* Divisor "OU" */}
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '16px 0 12px 0', gap: 10 }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }} />
            <span style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ou digite o PIN</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--panel-border)' }} />
          </div>

          {/* Digitação Manual do PIN */}
          <form onSubmit={handleManualSubmit} style={{ width: '100%', display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Ex: K-5966 ou 5966"
              value={manualPin}
              onChange={e => setManualPin(e.target.value)}
              style={{
                flex: 1,
                textAlign: 'center',
                fontWeight: 900,
                fontSize: '1.1rem',
                letterSpacing: '0.08em',
                padding: '10px 14px',
                border: '1.5px solid var(--panel-border)',
                borderRadius: 12,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!manualPin.trim()}
              className="btn-primary"
              style={{
                borderRadius: 12,
                padding: '10px 20px',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: manualPin.trim() ? 'pointer' : 'not-allowed',
                opacity: manualPin.trim() ? 1 : 0.6
              }}
            >
              Liberar
            </button>
          </form>

        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
