import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Função segura para renderizar markdown simples (Negrito, Itálico, Sublinhado, Títulos, Listas, Citações)
 */
export const renderSimpleMarkdown = (text: string): string => {
  if (!text) return '';

  // 1. Escapar HTML para evitar XSS
  let safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Re-permitir tags seguras de sublinhado se o usuário utilizou <u>...</u>
  safe = safe.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gi, '<u>$1</u>');

  const lines = safe.split('\n');
  const parsedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Título H1 (# ...)
    if (/^#\s+(.*)/.test(line)) {
      line = line.replace(/^#\s+(.*)/, '<h3 style="font-size: 1.15rem; font-weight: 900; margin: 12px 0 6px 0; color: var(--text-main, #0f172a);">$1</h3>');
    }
    // Título H2 (## ...)
    else if (/^##\s+(.*)/.test(line)) {
      line = line.replace(/^##\s+(.*)/, '<h4 style="font-size: 1.05rem; font-weight: 800; margin: 10px 0 4px 0; color: var(--text-main, #0f172a);">$1</h4>');
    }
    // Título H3 (### ...)
    else if (/^###\s+(.*)/.test(line)) {
      line = line.replace(/^###\s+(.*)/, '<h5 style="font-size: 0.95rem; font-weight: 800; margin: 8px 0 4px 0; color: var(--accent-primary, #0ea5e9);">$1</h5>');
    }
    // Citação (> ...)
    else if (/^&gt;\s*(.*)/.test(line)) {
      line = line.replace(/^&gt;\s*(.*)/, '<blockquote style="border-left: 3px solid var(--accent-primary, #0ea5e9); background: var(--bg-card-subtle, #f8fafc); padding: 8px 14px; margin: 6px 0; border-radius: 4px; font-style: italic; color: var(--text-secondary, #475569);">$1</blockquote>');
    }
    // Item de lista com marcador (• ou - ou *)
    else if (/^[\•\-\*]\s+(.*)/.test(line)) {
      line = line.replace(/^[\•\-\*]\s+(.*)/, '<div style="display: flex; gap: 8px; margin: 4px 0 4px 6px; align-items: flex-start;"><span style="color: var(--accent-primary, #0ea5e9); font-weight: 900;">•</span><span style="flex: 1;">$1</span></div>');
    }
    // Item de lista numerada (1. ...)
    else if (/^(\d+)\.\s+(.*)/.test(line)) {
      line = line.replace(/^(\d+)\.\s+(.*)/, '<div style="display: flex; gap: 8px; margin: 4px 0 4px 6px; align-items: flex-start;"><span style="font-weight: 800; color: var(--accent-primary, #0ea5e9); min-width: 18px;">$1.</span><span style="flex: 1;">$2</span></div>');
    }

    // Negrito (**texto**)
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Itálico (*texto*)
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Sublinhado alternativo (__texto__)
    line = line.replace(/__(.*?)__/g, '<u>$1</u>');

    parsedLines.push(line);
  }

  return parsedLines.join('<br />');
};

interface StudyRichEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  icon?: string;
  subtitle?: string;
}

export const StudyRichEditor: React.FC<StudyRichEditorProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Escreva o conteúdo aqui...',
  required = false,
  rows = 4,
  icon,
  subtitle
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [modalView, setModalView] = useState<'split' | 'editor' | 'preview'>('split');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Inserir formatação no textarea preservando seleção e foco
  const applyFormat = (type: 'bold' | 'italic' | 'underline' | 'h3' | 'bullet' | 'number' | 'quote' | 'tip', inModal: boolean = false) => {
    const targetTextarea = inModal ? modalTextareaRef.current : textareaRef.current;
    if (!targetTextarea) return;

    const start = targetTextarea.selectionStart;
    const end = targetTextarea.selectionEnd;
    const selected = value.substring(start, end);

    let prefix = '';
    let suffix = '';
    let defaultText = '';

    switch (type) {
      case 'bold':
        prefix = '**';
        suffix = '**';
        defaultText = 'texto em negrito';
        break;
      case 'italic':
        prefix = '*';
        suffix = '*';
        defaultText = 'texto em itálico';
        break;
      case 'underline':
        prefix = '<u>';
        suffix = '</u>';
        defaultText = 'texto sublinhado';
        break;
      case 'h3':
        prefix = '\n### ';
        suffix = '\n';
        defaultText = 'Subtítulo / Tópico';
        break;
      case 'bullet':
        prefix = '\n• ';
        suffix = '';
        defaultText = 'Item importante';
        break;
      case 'number':
        prefix = '\n1. ';
        suffix = '';
        defaultText = 'Primeiro passo';
        break;
      case 'quote':
        prefix = '\n> "';
        suffix = '"\n';
        defaultText = 'Versículo ou citação bíblica';
        break;
      case 'tip':
        prefix = '\n> 💡 **Dica Prática:** ';
        suffix = '\n';
        defaultText = 'Aplicação para a semana';
        break;
    }

    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}${defaultText}${suffix}`;
    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    // Reposicionar cursor
    setTimeout(() => {
      targetTextarea.focus();
      const newCursorPos = selected ? start + replacement.length : start + prefix.length + defaultText.length;
      targetTextarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 20);
  };

  // Contadores
  const charCount = value ? value.length : 0;
  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  // Render da barra de ferramentas de formatação
  const renderToolbar = (inModal: boolean = false) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '6px 10px',
      background: 'var(--bg-card-subtle, #f8fafc)',
      borderBottom: '1px solid var(--panel-border, #e2e8f0)',
      borderTopLeftRadius: '10px',
      borderTopRightRadius: '10px',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button
          type="button"
          onClick={() => applyFormat('bold', inModal)}
          title="Negrito (**texto**)"
          style={toolbarBtnStyle}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => applyFormat('italic', inModal)}
          title="Itálico (*texto*)"
          style={toolbarBtnStyle}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => applyFormat('underline', inModal)}
          title="Sublinhado (<u>texto</u>)"
          style={toolbarBtnStyle}
        >
          <u>U</u>
        </button>
      </div>

      <div style={{ width: '1px', height: '16px', background: 'var(--panel-border, #cbd5e1)', margin: '0 4px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <button
          type="button"
          onClick={() => applyFormat('h3', inModal)}
          title="Título / Tópico (### Tópico)"
          style={{ ...toolbarBtnStyle, fontSize: '0.74rem', fontWeight: 800 }}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => applyFormat('bullet', inModal)}
          title="Lista com Marcadores (• Item)"
          style={toolbarBtnStyle}
        >
          •
        </button>
        <button
          type="button"
          onClick={() => applyFormat('number', inModal)}
          title="Lista Numerada (1. Item)"
          style={{ ...toolbarBtnStyle, fontSize: '0.74rem' }}
        >
          1.
        </button>
        <button
          type="button"
          onClick={() => applyFormat('quote', inModal)}
          title="Citação / Versículo (> Citação)"
          style={{ ...toolbarBtnStyle, fontSize: '0.76rem' }}
        >
          ❝
        </button>
        <button
          type="button"
          onClick={() => applyFormat('tip', inModal)}
          title="Dica Prática (> 💡 Dica)"
          style={{ ...toolbarBtnStyle, fontSize: '0.80rem' }}
        >
          💡
        </button>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
        <span>{wordCount} palavras</span>
      </div>
    </div>
  );

  return (
    <div className="form-group-modern" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Header do Campo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <label className="form-label-modern" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon && <span>{icon}</span>}
            <span>{label}</span>
            {required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          {subtitle && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Ações Rápidas: Alternar Pré-visualização & Expandir Modal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'inline-flex', background: 'var(--bg-card-subtle, #f1f5f9)', borderRadius: '8px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              style={{
                border: 'none',
                background: activeTab === 'edit' ? '#ffffff' : 'transparent',
                color: activeTab === 'edit' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'edit' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              ✏️ Editar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              style={{
                border: 'none',
                background: activeTab === 'preview' ? '#ffffff' : 'transparent',
                color: activeTab === 'preview' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: activeTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              👁️ Visualizar
            </button>
          </div>

          {/* Botão de Expansão para Modal */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Expandir para tela cheia / edição confortável"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid var(--panel-border, #e2e8f0)',
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--accent-primary)',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>⛶</span>
            <span>Expandir</span>
          </button>
        </div>
      </div>

      {/* Caixa do Editor / Pré-visualização */}
      <div style={{
        border: '1px solid var(--panel-border, #cbd5e1)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--bg-card, #ffffff)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        {activeTab === 'edit' ? (
          <div>
            {renderToolbar(false)}
            <textarea
              ref={textareaRef}
              rows={rows}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              required={required}
              className="textarea-modern"
              style={{
                width: '100%',
                border: 'none',
                borderRadius: 0,
                padding: '12px 14px',
                fontSize: '0.86rem',
                lineHeight: 1.6,
                boxShadow: 'none',
                outline: 'none',
                resize: 'vertical',
                background: 'transparent'
              }}
            />
          </div>
        ) : (
          <div style={{
            padding: '14px 16px',
            minHeight: `${Math.max(rows * 24, 80)}px`,
            fontSize: '0.86rem',
            lineHeight: 1.6,
            color: value ? 'var(--text-main, #1e293b)' : 'var(--text-muted, #94a3b8)',
            background: 'var(--bg-card, #ffffff)'
          }}>
            {value ? (
              <div dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(value) }} />
            ) : (
              <span style={{ fontStyle: 'italic' }}>Nenhum conteúdo digitado ainda.</span>
            )}
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL DE EDIÇÃO EXPANDIDA & CONFORTÁVEL (createPortal)
          ======================================================== */}
      {isModalOpen && createPortal(
        <div
          className="modal-overlay animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.70)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 960,
              height: '88vh',
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              border: '1px solid var(--panel-border, #e2e8f0)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid var(--panel-border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-card-subtle, #f8fafc)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {icon && <span style={{ fontSize: '1.2rem' }}>{icon}</span>}
                  <h3 style={{ margin: 0, fontSize: '1.10rem', fontWeight: 900, color: 'var(--text-main, #0f172a)' }}>
                    {label}
                  </h3>
                  <span style={{
                    fontSize: '0.70rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--accent-primary-light, #e0f2fe)',
                    color: 'var(--accent-primary, #0284c7)'
                  }}>
                    Edição Expandida
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                  Use as ferramentas de formatação para destacar títulos, versículos, listas e desafios práticos.
                </div>
              </div>

              {/* Botões do Topo: Modo de Visualização e Fechar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '10px', padding: '3px' }}>
                  <button
                    type="button"
                    onClick={() => setModalView('split')}
                    style={{
                      border: 'none',
                      background: modalView === 'split' ? '#ffffff' : 'transparent',
                      color: modalView === 'split' ? 'var(--accent-primary)' : '#64748b',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '7px',
                      cursor: 'pointer'
                    }}
                  >
                    Dividido (Editor + Preview)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalView('editor')}
                    style={{
                      border: 'none',
                      background: modalView === 'editor' ? '#ffffff' : 'transparent',
                      color: modalView === 'editor' ? 'var(--accent-primary)' : '#64748b',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '7px',
                      cursor: 'pointer'
                    }}
                  >
                    Apenas Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalView('preview')}
                    style={{
                      border: 'none',
                      background: modalView === 'preview' ? '#ffffff' : 'transparent',
                      color: modalView === 'preview' ? 'var(--accent-primary)' : '#64748b',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '7px',
                      cursor: 'pointer'
                    }}
                  >
                    Apenas Preview
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.25rem',
                    color: 'var(--text-muted, #64748b)',
                    cursor: 'pointer',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Toolbar do Modal */}
            {modalView !== 'preview' && renderToolbar(true)}

            {/* Corpo do Modal (Editor e/ou Preview) */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Painel do Editor */}
              {modalView !== 'preview' && (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRight: modalView === 'split' ? '1px solid var(--panel-border, #e2e8f0)' : 'none',
                  background: '#ffffff'
                }}>
                  <textarea
                    ref={modalTextareaRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    style={{
                      flex: 1,
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      padding: '20px',
                      fontSize: '0.96rem',
                      lineHeight: 1.7,
                      resize: 'none',
                      fontFamily: 'inherit',
                      color: 'var(--text-main, #0f172a)'
                    }}
                    autoFocus
                  />
                </div>
              )}

              {/* Painel de Pré-visualização em Tempo Real */}
              {modalView !== 'editor' && (
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px',
                  background: 'var(--bg-card-subtle, #f8fafc)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div style={{
                    fontSize: '0.70rem',
                    fontWeight: 900,
                    color: 'var(--accent-primary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    Visualização Formatada (Como o líder e discípulos verão no PWA)
                  </div>
                  <div style={{
                    background: '#ffffff',
                    padding: '22px',
                    borderRadius: '16px',
                    border: '1px solid var(--panel-border, #e2e8f0)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    fontSize: '0.94rem',
                    lineHeight: 1.7,
                    color: 'var(--text-main, #1e293b)'
                  }}>
                    {value ? (
                      <div dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(value) }} />
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Nenhum texto inserido ainda...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 22px',
              borderTop: '1px solid var(--panel-border, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-card-subtle, #f8fafc)'
            }}>
              <div style={{ display: 'flex', gap: 14, fontSize: '0.76rem', color: 'var(--text-muted, #64748b)' }}>
                <span><strong>{wordCount}</strong> palavras</span>
                <span>•</span>
                <span><strong>{charCount}</strong> caracteres</span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: '1px solid var(--panel-border, #cbd5e1)',
                    background: '#ffffff',
                    color: 'var(--text-secondary, #475569)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--accent-primary, #0284c7)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  ✓ Concluir Edição
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

const toolbarBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderRadius: '6px',
  width: '26px',
  height: '26px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--text-secondary, #475569)',
  cursor: 'pointer',
  fontSize: '0.82rem',
  transition: 'background 0.15s ease'
};
