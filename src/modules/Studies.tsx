import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css';

const BookOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export type Chapter = {
  id?: string;
  chapter_number: number;
  title: string;
  verse_reference: string;
  icebreaker: string;
  content_text: string;
  discussion_questions: string[];
  practical_challenge: string;
  media_type: 'NONE' | 'VIDEO' | 'PDF';
  media_link: string;
  scheduled_date: string;
  status: 'ACTIVE' | 'DRAFT';
};

export type StudyBook = {
  id: string;
  title: string;
  subtitle: string;
  author_name: string;
  preface: string;
  cover_color: string;
  cover_url?: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  target_group_id: string | null;
  target_group_name?: string;
  chapter_count?: number;
  first_scheduled_date?: string;
  last_scheduled_date?: string;
  chapters?: Chapter[];
  created_at?: string;
};

interface StudiesProps {
  selectedCampusId?: string;
  selectedOrganization?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
}

type Group = {
  id: string;
  name: string;
  leader_name?: string;
  network?: string;
  campus_name?: string;
};

const COVER_GRADIENTS = [
  { label: 'Azul Real', value: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' },
  { label: 'Roxo Profundo', value: 'linear-gradient(135deg, #4c1d95, #8b5cf6)' },
  { label: 'Esmeralda', value: 'linear-gradient(135deg, #064e3b, #10b981)' },
  { label: 'Âmbar Dourado', value: 'linear-gradient(135deg, #78350f, #d97706)' },
  { label: 'Vinho / Rubi', value: 'linear-gradient(135deg, #881337, #e11d48)' },
  { label: 'Dark Slate', value: 'linear-gradient(135deg, #0f172a, #334155)' }
];

export default function Studies({ selectedCampusId, selectedOrganization }: StudiesProps) {
  const [books, setBooks] = useState<StudyBook[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'book' | 'chapters'>('book');
  const [saving, setSaving] = useState(false);
  const [expandedChapterIndex, setExpandedChapterIndex] = useState<number>(0);

  const [formData, setFormData] = useState<{
    id: string;
    title: string;
    subtitle: string;
    author_name: string;
    preface: string;
    cover_color: string;
    cover_url: string;
    status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
    target_group_id: string;
    chapters: Chapter[];
  }>({
    id: '',
    title: '',
    subtitle: '',
    author_name: '',
    preface: '',
    cover_color: COVER_GRADIENTS[0].value,
    cover_url: '',
    status: 'ACTIVE',
    target_group_id: '',
    chapters: []
  });

  useEffect(() => {
    loadBooks();
    loadGroups();
  }, [selectedCampusId, selectedOrganization]);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (token) {
        return {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
      }
      return { 'Content-Type': 'application/json' };
    } catch {
      return { 'Content-Type': 'application/json' };
    }
  };

  const loadBooks = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId && selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const res = await fetch(`${API_URL}/study-books?organization_id=${orgId}${campusParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBooks(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error('Erro ao carregar livros de estudos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId && selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const res = await fetch(`${API_URL}/cell-groups?organization_id=${orgId}${campusParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (err) {
      console.error('Erro ao carregar células para estudos:', err);
    }
  };

  const openNewModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      id: '',
      title: '',
      subtitle: '',
      author_name: 'Pastor da Comunidade',
      preface: '',
      cover_color: COVER_GRADIENTS[0].value,
      cover_url: '',
      status: 'ACTIVE',
      target_group_id: '',
      chapters: [
        {
          chapter_number: 1,
          title: 'Capítulo 1: O Início da Jornada',
          verse_reference: '',
          icebreaker: '',
          content_text: '',
          discussion_questions: ['O que mais chamou sua atenção no estudo de hoje?', 'Como podemos aplicar este princípio em nossa semana?'],
          practical_challenge: '',
          media_type: 'NONE',
          media_link: '',
          scheduled_date: today,
          status: 'ACTIVE'
        }
      ]
    });
    setModalTab('book');
    setExpandedChapterIndex(0);
    setShowModal(true);
  };

  const openEditModal = async (book: StudyBook) => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/study-books/${book.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const fullBook: StudyBook = data.data || data;
        setFormData({
          id: fullBook.id,
          title: fullBook.title,
          subtitle: fullBook.subtitle || '',
          author_name: fullBook.author_name || 'Pastor da Comunidade',
          preface: fullBook.preface || '',
          cover_color: fullBook.cover_color || COVER_GRADIENTS[0].value,
          cover_url: fullBook.cover_url || '',
          status: fullBook.status || 'ACTIVE',
          target_group_id: fullBook.target_group_id || '',
          chapters: (fullBook.chapters && fullBook.chapters.length > 0) ? fullBook.chapters : [
            {
              chapter_number: 1,
              title: 'Capítulo 1: Introdução',
              verse_reference: '',
              icebreaker: '',
              content_text: '',
              discussion_questions: ['Qual a principal aplicação prática deste estudo?'],
              practical_challenge: '',
              media_type: 'NONE',
              media_link: '',
              scheduled_date: new Date().toISOString().split('T')[0],
              status: 'ACTIVE'
            }
          ]
        });
        setModalTab('book');
        setExpandedChapterIndex(0);
        setShowModal(true);
      }
    } catch (err) {
      console.error('Erro ao abrir livro de estudo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Por favor, informe o título do Livro de Estudo.');
      return;
    }

    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      const payload = {
        ...formData,
        target_group_id: formData.target_group_id || null,
        organization_id: selectedOrganization?.id || 'org_default',
        campus_id: selectedCampusId && selectedCampusId !== 'all' ? selectedCampusId : undefined
      };
      const res = await fetch(`${API_URL}/study-books`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        loadBooks();
      } else {
        alert('Erro ao salvar livro de estudo.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao conectar ao servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este Livro e todos os seus capítulos?')) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/study-books/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        loadBooks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Funções de manipulação de capítulos no formulário
  const handleAddChapter = () => {
    const nextNum = formData.chapters.length + 1;
    const newChapter: Chapter = {
      chapter_number: nextNum,
      title: `Capítulo ${nextNum}: Nova Lição`,
      verse_reference: '',
      icebreaker: '',
      content_text: '',
      discussion_questions: ['Como podemos colocar esta lição em prática em nossas vidas?'],
      practical_challenge: '',
      media_type: 'NONE',
      media_link: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };
    setFormData(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter]
    }));
    setExpandedChapterIndex(formData.chapters.length);
  };

  const handleRemoveChapter = (index: number) => {
    if (formData.chapters.length <= 1) {
      alert('O livro deve conter pelo menos 1 capítulo ou lição.');
      return;
    }
    const updated = formData.chapters.filter((_, idx) => idx !== index).map((ch, idx) => ({
      ...ch,
      chapter_number: idx + 1
    }));
    setFormData(prev => ({ ...prev, chapters: updated }));
    setExpandedChapterIndex(Math.max(0, index - 1));
  };

  const handleUpdateChapter = (index: number, field: keyof Chapter, val: any) => {
    const updated = [...formData.chapters];
    updated[index] = { ...updated[index], [field]: val };
    setFormData(prev => ({ ...prev, chapters: updated }));
  };

  const handleAddQuestion = (chapterIdx: number) => {
    const updated = [...formData.chapters];
    const questions = [...(updated[chapterIdx].discussion_questions || []), ''];
    updated[chapterIdx] = { ...updated[chapterIdx], discussion_questions: questions };
    setFormData(prev => ({ ...prev, chapters: updated }));
  };

  const handleUpdateQuestion = (chapterIdx: number, qIdx: number, val: string) => {
    const updated = [...formData.chapters];
    const questions = [...(updated[chapterIdx].discussion_questions || [])];
    questions[qIdx] = val;
    updated[chapterIdx] = { ...updated[chapterIdx], discussion_questions: questions };
    setFormData(prev => ({ ...prev, chapters: updated }));
  };

  const handleRemoveQuestion = (chapterIdx: number, qIdx: number) => {
    const updated = [...formData.chapters];
    const questions = updated[chapterIdx].discussion_questions.filter((_, idx) => idx !== qIdx);
    updated[chapterIdx] = { ...updated[chapterIdx], discussion_questions: questions };
    setFormData(prev => ({ ...prev, chapters: updated }));
  };

  return (
    <div className="broadcasts-container animate-fade-in">
      {/* Header */}
      <div className="card-header-row" style={{ paddingBottom: 20, borderBottom: '1px solid var(--panel-border)', marginBottom: 24 }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>📚</span> Livros e Séries de Estudos
          </h1>
          <p className="card-subtitle">
            Crie roteiros bíblicos estruturados em formato de Livro com Capítulos semanais, quebra-gelo, ministração e perguntas de debate.
          </p>
        </div>
        <button className="btn-primary" onClick={openNewModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PlusIcon /> Novo Livro de Estudo
        </button>
      </div>

      {/* Grid de Livros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {loading && books.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Carregando catálogo de livros...
          </div>
        ) : books.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1', background: '#ffffff', borderRadius: 20, padding: '48px 24px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }}>📖</span>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>Nenhum livro de estudo publicado</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', maxWidth: 460, margin: '0 auto 16px auto' }}>
              Crie a primeira série de estudos da igreja (ex: <em>"A Estátua de Daniel"</em>, <em>"Família Vitoriosa"</em>) para os líderes guiarem suas células.
            </p>
            <button className="btn-primary" onClick={openNewModal}>
              <PlusIcon /> Criar Primeiro Livro
            </button>
          </div>
        ) : (
          books.map(b => (
            <div 
              key={b.id} 
              className="portal-card" 
              onClick={() => openEditModal(b)}
              style={{
                background: '#ffffff',
                borderRadius: 20,
                padding: 0,
                overflow: 'hidden',
                border: '1px solid var(--panel-border)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              {/* Capa do Livro (Gradient Header) */}
              <div style={{
                background: b.cover_color || COVER_GRADIENTS[0].value,
                padding: '24px 20px',
                color: '#ffffff',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '130px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ 
                    fontSize: '0.68rem', 
                    fontWeight: 900, 
                    background: 'rgba(255,255,255,0.22)', 
                    backdropFilter: 'blur(6px)', 
                    padding: '3px 10px', 
                    borderRadius: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    LIVRO DE ESTUDO
                  </span>

                  <button 
                    type="button" 
                    className="action-circle-btn" 
                    style={{ background: 'rgba(0,0,0,0.25)', color: '#ffffff', width: 28, height: 28, border: 'none' }}
                    onClick={(e) => handleDelete(b.id, e)}
                    title="Excluir livro"
                  >
                    <TrashIcon />
                  </button>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '8px 0 2px 0', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {b.title}
                  </h3>
                  {b.subtitle && (
                    <p style={{ fontSize: '0.78rem', margin: 0, opacity: 0.9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Informações e Sumário */}
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'space-between' }}>
                {b.preface && (
                  <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    "{b.preface}"
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.76rem', color: 'var(--text-muted)', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>📍 <strong>Público:</strong> {b.target_group_name || '🌐 Toda a Igreja'}</span>
                    <span style={{ fontWeight: 800, color: 'var(--accent-primary)', background: '#eff6ff', padding: '2px 8px', borderRadius: 8 }}>
                      📑 {b.chapter_count || 0} {(b.chapter_count === 1) ? 'Capítulo' : 'Capítulos'}
                    </span>
                  </div>
                  <div>✍️ <strong>Autor:</strong> {b.author_name || 'Pastor da Comunidade'}</div>
                  {b.first_scheduled_date && (
                    <div>🗓️ <strong>Período:</strong> {b.first_scheduled_date.split('-').reverse().join('/')} {b.last_scheduled_date ? `a ${b.last_scheduled_date.split('-').reverse().join('/')}` : ''}</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================
          MODAL STUDIO - LIVRO E CAPÍTULOS
          ======================================================== */}
      {showModal && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="modal-studio-container" style={{ maxWidth: 940, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header com Abas */}
            <div className="modal-studio-header" style={{ paddingBottom: 0 }}>
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-purple-bg)', color: 'var(--pastel-purple-text)' }}>
                  <BookOpenIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">
                    {formData.id ? 'Editar Livro de Estudo' : 'Cadastrar Novo Livro de Estudo'}
                  </h2>
                  <p className="modal-studio-subtitle">
                    Defina a visão geral da série e os encontros semanais que os líderes aplicarão nas células.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setShowModal(false)} title="Fechar">
                &times;
              </button>
            </div>

            {/* Abas do Editor */}
            <div style={{ display: 'flex', gap: 8, padding: '14px 24px 0 24px', borderBottom: '1px solid var(--panel-border)' }}>
              <button
                type="button"
                onClick={() => setModalTab('book')}
                style={{
                  background: modalTab === 'book' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderBottom: modalTab === 'book' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  color: modalTab === 'book' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>📖</span>
                <span>1. Visão Geral & Prefácio</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('chapters')}
                style={{
                  background: modalTab === 'chapters' ? '#ffffff' : 'transparent',
                  border: 'none',
                  borderBottom: modalTab === 'chapters' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                  padding: '8px 16px',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  color: modalTab === 'chapters' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>📑</span>
                <span>2. Capítulos & Encontros ({formData.chapters.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <form id="study-book-form" onSubmit={handleSave} style={{ overflowY: 'auto', flex: 1, padding: 24 }}>
              {modalTab === 'book' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  
                  {/* Grid Topo: Título e Subtítulo */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Título do Livro / Série *</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        value={formData.title} 
                        onChange={e => setFormData({ ...formData, title: e.target.value })} 
                        placeholder="Ex: As Estátuas de Daniel & O Reino Eterno" 
                        required 
                      />
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label-modern">Subtítulo / Tema</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        value={formData.subtitle} 
                        onChange={e => setFormData({ ...formData, subtitle: e.target.value })} 
                        placeholder="Ex: Profecias e Fidelidade no Exílio" 
                      />
                    </div>
                  </div>

                  {/* Grid Meio: Autor e Público */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group-modern">
                      <label className="form-label-modern">Autor / Pastor Responsável</label>
                      <input 
                        type="text" 
                        className="input-modern"
                        value={formData.author_name} 
                        onChange={e => setFormData({ ...formData, author_name: e.target.value })} 
                        placeholder="Ex: Pr. Rafael Sena" 
                      />
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label-modern">Público / Célula Específica</label>
                      <select 
                        className="select-modern"
                        value={formData.target_group_id} 
                        onChange={e => setFormData({ ...formData, target_group_id: e.target.value })}
                      >
                        <option value="">🌐 Geral (Todas as Células e Membros)</option>
                        {groups.length > 0 && (
                          <optgroup label="Células & Redes Ativas">
                            {groups.map(g => (
                              <option key={g.id} value={g.id}>
                                👥 {g.name} {g.leader_name ? `• Líder: ${g.leader_name}` : ''}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Prefácio do Livro */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">Prefácio / Introdução Geral do Livro</label>
                    <textarea 
                      rows={4} 
                      className="textarea-modern"
                      value={formData.preface} 
                      onChange={e => setFormData({ ...formData, preface: e.target.value })} 
                      placeholder="Apresente aos líderes e discípulos o propósito espiritual desta série de estudos..." 
                    />
                  </div>

                  {/* Seletor de Cores da Capa */}
                  <div className="form-group-modern">
                    <label className="form-label-modern">Estilo Visual da Capa</label>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {COVER_GRADIENTS.map(grad => (
                        <div
                          key={grad.value}
                          onClick={() => setFormData({ ...formData, cover_color: grad.value })}
                          style={{
                            background: grad.value,
                            color: '#ffffff',
                            padding: '10px 14px',
                            borderRadius: 12,
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            border: formData.cover_color === grad.value ? '2.5px solid #ffffff' : '1px solid transparent',
                            boxShadow: formData.cover_color === grad.value ? '0 0 0 2px var(--accent-primary)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {grad.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview da Capa */}
                  <div style={{
                    background: formData.cover_color,
                    padding: 24,
                    borderRadius: 18,
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 900, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 8, width: 'fit-content' }}>
                      PREVIEW DA CAPA
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>{formData.title || 'Título do Livro'}</h3>
                    <p style={{ fontSize: '0.82rem', margin: 0, opacity: 0.9 }}>{formData.subtitle || 'Subtítulo da série'}</p>
                    <span style={{ fontSize: '0.74rem', opacity: 0.8, marginTop: 4 }}>Por {formData.author_name || 'Autor'}</span>
                  </div>

                </div>
              )}

              {modalTab === 'chapters' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        Encontros Semanais ({formData.chapters.length})
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Cada encontro corresponde a um capítulo do livro a ser aplicado em uma reunião de célula.
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={handleAddChapter}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.78rem', fontWeight: 800 }}
                    >
                      <PlusIcon /> + Adicionar Capítulo / Encontro
                    </button>
                  </div>

                  {/* Lista de Capítulos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {formData.chapters.map((ch, idx) => {
                      const isExpanded = expandedChapterIndex === idx;
                      return (
                        <div 
                          key={idx} 
                          style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            border: isExpanded ? '1.5px solid var(--accent-primary)' : '1px solid var(--panel-border)',
                            boxShadow: 'var(--shadow-sm)',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Header do Capítulo (Acordeão) */}
                          <div 
                            onClick={() => setExpandedChapterIndex(isExpanded ? -1 : idx)}
                            style={{
                              padding: '12px 18px',
                              background: isExpanded ? '#f0f9ff' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ 
                                background: 'var(--accent-primary)', 
                                color: '#ffffff', 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '0.74rem', 
                                fontWeight: 900 
                              }}>
                                {ch.chapter_number}
                              </span>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                                  {ch.title || `Capítulo ${ch.chapter_number}`}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {ch.verse_reference ? `📖 ${ch.verse_reference}` : 'Sem versículo'} • 🗓️ {ch.scheduled_date ? ch.scheduled_date.split('-').reverse().join('/') : 'Sem data'}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveChapter(idx); }}
                                style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', padding: '4px 8px' }}
                              >
                                ✕ Remover
                              </button>
                              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                {isExpanded ? '▲' : '▼'}
                              </span>
                            </div>
                          </div>

                          {/* Conteúdo Expansível do Capítulo */}
                          {isExpanded && (
                            <div style={{ padding: 18, borderTop: '1px solid #e0f2fe', display: 'flex', flexDirection: 'column', gap: 14 }}>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12 }}>
                                <div className="form-group-modern">
                                  <label className="form-label-modern">Título do Capítulo *</label>
                                  <input 
                                    type="text" 
                                    className="input-modern"
                                    value={ch.title} 
                                    onChange={e => handleUpdateChapter(idx, 'title', e.target.value)} 
                                    placeholder="Ex: A Cabeça de Ouro - Babilônia" 
                                    required 
                                  />
                                </div>

                                <div className="form-group-modern">
                                  <label className="form-label-modern">Versículo Chave</label>
                                  <input 
                                    type="text" 
                                    className="input-modern"
                                    value={ch.verse_reference} 
                                    onChange={e => handleUpdateChapter(idx, 'verse_reference', e.target.value)} 
                                    placeholder="Ex: Daniel 2:31-38" 
                                  />
                                </div>

                                <div className="form-group-modern">
                                  <label className="form-label-modern">Data do Encontro</label>
                                  <input 
                                    type="date" 
                                    className="input-modern"
                                    value={ch.scheduled_date} 
                                    onChange={e => handleUpdateChapter(idx, 'scheduled_date', e.target.value)} 
                                  />
                                </div>
                              </div>

                              {/* 🧊 Quebra-Gelo */}
                              <div className="form-group-modern">
                                <label className="form-label-modern">🧊 Quebra-Gelo / Dinâmica de Abertura</label>
                                <textarea 
                                  rows={2} 
                                  className="textarea-modern"
                                  value={ch.icebreaker} 
                                  onChange={e => handleUpdateChapter(idx, 'icebreaker', e.target.value)} 
                                  placeholder="Pergunta ou brincadeira inicial para descontrair a célula antes da palavra..." 
                                />
                              </div>

                              {/* 💡 Ministração / Esboço */}
                              <div className="form-group-modern">
                                <label className="form-label-modern">💡 Esboço & Conteúdo do Estudo (Ministração) *</label>
                                <textarea 
                                  rows={5} 
                                  className="textarea-modern"
                                  value={ch.content_text} 
                                  onChange={e => handleUpdateChapter(idx, 'content_text', e.target.value)} 
                                  placeholder="Estrutura do estudo bíblico, tópicos, explicações e contextualização..." 
                                  required
                                />
                              </div>

                              {/* 💬 Perguntas de Debate */}
                              <div className="form-group-modern">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <label className="form-label-modern" style={{ margin: 0 }}>💬 Perguntas para Debate & Compartilhamento</label>
                                  <button
                                    type="button"
                                    onClick={() => handleAddQuestion(idx)}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer' }}
                                  >
                                    + Adicionar Pergunta
                                  </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {(ch.discussion_questions || []).map((q, qIdx) => (
                                    <div key={qIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', width: 18 }}>{qIdx + 1}.</span>
                                      <input 
                                        type="text" 
                                        className="input-modern"
                                        style={{ padding: '8px 12px', fontSize: '0.80rem' }}
                                        value={q} 
                                        onChange={e => handleUpdateQuestion(idx, qIdx, e.target.value)} 
                                        placeholder={`Pergunta ${qIdx + 1} para o grupo...`} 
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveQuestion(idx, qIdx)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}
                                        title="Remover pergunta"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 🎯 Desafio Prático & Mídia */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                                <div className="form-group-modern">
                                  <label className="form-label-modern">🎯 Desafio Prático / Oração da Semana</label>
                                  <input 
                                    type="text" 
                                    className="input-modern"
                                    value={ch.practical_challenge} 
                                    onChange={e => handleUpdateChapter(idx, 'practical_challenge', e.target.value)} 
                                    placeholder="Ex: Orem por 3 pessoas que precisam de paz nesta semana." 
                                  />
                                </div>

                                <div className="form-group-modern">
                                  <label className="form-label-modern">🎥 Mídia de Apoio (Opcional)</label>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <select 
                                      className="select-modern" 
                                      style={{ width: '90px' }}
                                      value={ch.media_type} 
                                      onChange={e => handleUpdateChapter(idx, 'media_type', e.target.value)}
                                    >
                                      <option value="NONE">Nenhum</option>
                                      <option value="VIDEO">Vídeo</option>
                                      <option value="PDF">PDF</option>
                                    </select>
                                    {ch.media_type !== 'NONE' && (
                                      <input 
                                        type="url" 
                                        className="input-modern"
                                        value={ch.media_link} 
                                        onChange={e => handleUpdateChapter(idx, 'media_link', e.target.value)} 
                                        placeholder="Link do YouTube / Drive..." 
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>

            {/* Modal Footer */}
            <div className="modal-studio-footer" style={{ borderTop: '1px solid var(--panel-border)', padding: '16px 24px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              
              <div style={{ display: 'flex', gap: 8 }}>
                {modalTab === 'book' ? (
                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={() => setModalTab('chapters')}
                  >
                    Próximo: Gerenciar Capítulos ➔
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    form="study-book-form" 
                    className="btn-primary" 
                    disabled={saving}
                  >
                    {saving ? 'Salvando Livro...' : 'Salvar & Publicar Livro de Estudo'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
