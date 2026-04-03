import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Members.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);

type ProductData = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_urls: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
};

export const PdvProdutos = () => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const defaultForm = (): ProductData => ({
    id: '', name: '', description: '', price: 0.00, category: 'Geral', image_urls: [], status: 'DRAFT'
  });

  const [formData, setFormData] = useState<ProductData>(defaultForm());
  const [newCatMode, setNewCatMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    } catch {
      return { 'Content-Type': 'application/json' };
    }
  };

  const loadProducts = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pdv/products?admin=true`, { headers });
      if (res.ok) {
        const data = await res.json();
        // MySQL JSON comes as array or string depending on driver
        setProducts(data.map((p: any) => ({
           ...p,
           image_urls: typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (p.image_urls || [])
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const openNewModal = () => {
    setFormData(defaultForm());
    setShowModal(true);
  };

  const openEditModal = (p: ProductData) => {
    setFormData(p);
    setNewCatMode(false);
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (formData.image_urls.length >= 3) {
      alert("Aviso: Limite de 3 imagens por produto.");
      return;
    }
    const file = e.target.files[0];
    setUploadingImage(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/upload-url?filename=${encodeURIComponent(file.name)}&contentType=${file.type}&target_route=pdv`, { headers });
      if (!res.ok) throw new Error("Erro ao pegar link S3");
      const { uploadUrl, fileUrl } = await res.json();

      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });

      setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, fileUrl] }));
    } catch(err) {
      console.error(err);
      alert("Falha no envio da imagem.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLinkAdd = (link: string) => {
    if(!link) return;
    if (formData.image_urls.length >= 3) {
      alert("Aviso: Limite de 3 imagens atingido.");
      return;
    }
    setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, link] }));
  };

  const removeImage = (idx: number) => {
    setFormData(prev => ({ ...prev, image_urls: prev.image_urls.filter((_, i) => i !== idx)}));
  };

  const handleSave = async (statusOverride?: 'ACTIVE' | 'DRAFT') => {
    if (!formData.name || formData.price <= 0) {
      alert("⚠️ Você precisa preencher pelo menos NOME e um PREÇO VÁLIDO!");
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...formData, price: Number(formData.price) };
      if (statusOverride) payload.status = statusOverride;

      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pdv/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        loadProducts();
      } else {
        alert("Erro no servidor ao salvar produto.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Remover este produto permanentemente? Operação irreversível.")) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/pdv/products/${id}`, { method: 'DELETE', headers });
      if (res.ok) loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="members-container animate-fade-in" style={{ padding: '0 40px' }}>
      <div className="header-actions" style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Gestão de Produtos</h2>
          <p style={{ color: '#888', marginTop: 8 }}>Cadastre e gerencie os itens do Aplicativo Faith-Hub.</p>
        </div>
        <button className="primary-btn" onClick={openNewModal} style={{ height: 'fit-content' }}>
          <PlusIcon /> Novo Produto
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Carregando Estoque...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {products.map((prod) => (
             <div 
               key={prod.id} 
               className="broadcast-card card" 
               onClick={() => openEditModal(prod)} 
               style={{ padding: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
             >
                {/* Imagem do Produto (Se existir a primeira) */}
                <div style={{ height: 160, background: prod.image_urls && prod.image_urls[0] ? `url(${prod.image_urls[0]})` : '#2c3444', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {(!prod.image_urls || prod.image_urls.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem Foto</span>}
                   
                   {/* Status Badge Optimizado */}
                   <div style={{ position: 'absolute', top: 12, left: 12, padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem', background: prod.status === 'ACTIVE' ? 'var(--success)' : (prod.status === 'DRAFT' ? '#f59e0b' : '#ef4444'), color: '#FFF' }}>
                     {prod.status === 'ACTIVE' ? 'PUBLICADO' : (prod.status === 'DRAFT' ? 'RASCUNHO' : 'INATIVO')}
                   </div>

                   {/* Botao Delete */}
                   <button className="icon-btn danger-hover" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: '#FFF', width: 32, height: 32, padding: 0 }} onClick={(e) => handleDelete(prod.id, e)}>
                     <TrashIcon />
                   </button>
                </div>

                {/* Infos do Produto */}
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: '0.75rem', color: '#0a7ea4', fontWeight: 800, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>
                    {prod.category}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', margin: '0 0 8px 0', lineHeight: 1.2 }}>{prod.name}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40 }}>
                    {prod.description || 'Nenhuma descrição fornecida.'}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                       R$ {Number(prod.price).toFixed(2).replace('.', ',')}
                     </span>
                  </div>
                </div>
             </div>
          ))}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO - NOSSO PADRÃO PREMIUM */}
      {showModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-content" style={{ position: 'absolute', top: '40px', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '900px', maxWidth: '95vw', display: 'flex', flexDirection: 'column', padding: 0, background: 'var(--panel-bg)', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
            
            <div className="modal-header" style={{ position: 'relative', padding: '24px 32px 0 32px', borderBottom: '1px solid var(--border-color)', flexShrink: 0, display: 'flex', flexDirection: 'column', paddingBottom: 24 }}>
              <button type="button" className="icon-btn danger-hover" style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} onClick={() => setShowModal(false)}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{formData.id ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h2>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Crie o cardápio e os itens que estarão disponíveis para os membros da sua Igreja adquirirem através do App Móvel.</p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
               
               {/* FOTOS E STATUS */}
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, marginBottom: 32 }}>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: 12 }}>Galeria de Fotos (Qtd: {formData.image_urls.length}/3)</label>
                    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                       {formData.image_urls.map((url, i) => (
                         <div key={i} style={{ width: 100, height: 100, flexShrink: 0, background: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 12, position: 'relative' }}>
                            <button onClick={() => removeImage(i)} className="danger-hover" style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#FFF', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                         </div>
                       ))}
                       
                       {formData.image_urls.length < 3 && (
                         <div style={{ width: 100, height: 100, flexShrink: 0, borderRadius: 12, border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', position: 'relative' }}>
                            {uploadingImage ? <span style={{fontSize:'0.7rem'}}>Enviando...</span> : <PlusIcon />}
                            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }} />
                         </div>
                       )}
                    </div>
                  </div>
                  
                  <div className="modal-form" style={{ padding: 0, border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                     <div className="form-group" style={{ marginBottom: 20 }}>
                       <label style={{ fontSize: '0.85rem' }}>Ou Link Visual Direto (URL Web)</label>
                       <div style={{ display: 'flex', gap: 8 }}>
                         <input type="text" id="linkInput" placeholder="https://imagem.com/coxinha.jpg" style={{ padding: 14, flex: 1 }} />
                         <button type="button" onClick={() => { const el = document.getElementById('linkInput') as HTMLInputElement; handleLinkAdd(el.value); el.value = ''; }} className="secondary-btn">Adicionar</button>
                       </div>
                     </div>

                     <div className="form-group">
                       <label style={{ fontSize: '0.85rem' }}>Visibilidade Imediata</label>
                       <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} style={{ padding: 14 }}>
                          <option value="ACTIVE">ATIVO (Aparece no App)</option>
                          <option value="INACTIVE">INATIVO (Esgotado / Escondido)</option>
                          <option value="DRAFT">RASCUNHO (Em construção)</option>
                       </select>
                     </div>
                  </div>
               </div>

               {/* FORMS */}
               <div className="modal-form" style={{ padding: 0, border: 'none' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
                     <div className="form-group">
                       <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nome do Item</label>
                       <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Coxinha Artesanal de Frango com Catupiry" style={{ padding: 14, fontSize: '1rem' }} />
                     </div>
                     <div className="form-group" style={{ position: 'relative' }}>
                       <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                         Módulo de Categoria
                         {!newCatMode && <button type="button" onClick={() => setNewCatMode(true)} style={{ background: 'none', border: 'none', color: '#0a7ea4', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>+ Nova Categoria</button>}
                       </label>
                       {newCatMode ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Combos Promocionais" style={{ padding: 14, fontSize: '1rem', flex: 1 }} />
                            <button type="button" onClick={() => setNewCatMode(false)} className="secondary-btn">OK</button>
                          </div>
                       ) : (
                          <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ padding: 14, fontSize: '1rem' }}>
                             {/* Standard defaults plus current dynamic if it doesn't match */}
                             {['Salgados', 'Doces e Bolos', 'Bebidas Geadas / Quentes', 'Livraria e Mercearia'].includes(formData.category) ? null : <option value={formData.category}>{formData.category}</option>}
                             <option value="Salgados">Salgados</option>
                             <option value="Doces e Bolos">Doces e Bolos</option>
                             <option value="Bebidas Geadas / Quentes">Bebidas Geadas / Quentes</option>
                             <option value="Livraria e Mercearia">Livraria e Mercearia</option>
                          </select>
                       )}
                     </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 20 }}>
                     <div className="form-group">
                       <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Preço (R$)</label>
                       <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} placeholder="15.50" style={{ padding: 14, fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }} />
                     </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Descrição do Produto (Opcional)</label>
                    <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="A descrição detalhada que o membro lerá ao abrir o app..." style={{ padding: 14, fontSize: '1rem', lineHeight: 1.5 }}></textarea>
                  </div>
               </div>
            </div>
            
            <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', background: 'var(--panel-bg-hover)', flexShrink: 0 }}>
              <button type="button" className="secondary-btn" onClick={() => setShowModal(false)} disabled={isSaving || uploadingImage} style={{ padding: '12px 24px', fontSize: '1rem' }}>
                Cancelar
              </button>
              <button type="button" onClick={() => handleSave('DRAFT')} className="secondary-btn" disabled={isSaving || uploadingImage} style={{ padding: '12px 24px', fontSize: '1rem', color: '#f59e0b' }}>
                {isSaving ? '...' : 'Salvar como Rascunho'}
              </button>
              <button type="button" onClick={() => handleSave('ACTIVE')} className="primary-btn" disabled={isSaving || uploadingImage} style={{ background: '#0a7ea4', padding: '12px 32px', fontSize: '1rem', fontWeight: 600 }}>
                {isSaving ? 'Salvando...' : 'Salvar e Publicar'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
