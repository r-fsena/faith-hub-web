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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div 
        className="animate-scale-up"
        style={{
          background: '#ffffff',
          borderRadius: 24,
          maxWidth: 400,
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📸
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900 }}>Escanear QR Code</div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {childName ? `Checkout de ${childName}` : 'Realizar Checkout Seguro'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              width: 30,
              height: 30,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '0.85rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* Camera Viewfinder Area */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 300,
            height: 300,
            background: '#0f172a',
            borderRadius: 20,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
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
                width: 200,
                height: 200,
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
                  background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)',
                  boxShadow: '0 0 10px #22d3ee',
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

          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 12, textAlign: 'center' }}>
            Aponte a câmera para o QR Code no celular do responsável
          </div>

          {/* Divisor "OU" */}
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', margin: '16px 0 12px 0', gap: 10 }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '0.70rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Ou digite o PIN</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
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
                letterSpacing: '0.05em',
                padding: '10px 14px',
                border: '1.5px solid #cbd5e1',
                borderRadius: 12,
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!manualPin.trim()}
              style={{
                background: 'var(--accent-primary, #0f766e)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                padding: '10px 20px',
                fontWeight: 900,
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
