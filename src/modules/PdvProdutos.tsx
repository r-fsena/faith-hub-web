import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchAuthSession } from 'aws-amplify/auth';
import './Broadcasts.css';

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const ShoppingBagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
);
const TagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r=".5" fill="currentColor"/></svg>
);
const GripVerticalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'grab', color: 'var(--text-muted)' }}><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
);
const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
);
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export type ProductGroup = {
  id: string;
  name: string;
  active: boolean;
};

const DEFAULT_GROUPS: ProductGroup[] = [
  { id: 'grp_1', name: 'Livraria & Bíblias', active: true },
  { id: 'grp_2', name: 'Vestuário & Camisas', active: true },
  { id: 'grp_3', name: 'Café & Alimentação', active: true }
];

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_urls: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
};

interface PdvProdutosProps {
  selectedCampusId?: string;
  selectedOrganization?: any;
}

export const PdvProdutos: React.FC<PdvProdutosProps> = ({ selectedCampusId = 'all', selectedOrganization }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newGroupInput, setNewGroupInput] = useState('');
  const [inlineNewGroup, setInlineNewGroup] = useState(false);
  const [quickGroupName, setQuickGroupName] = useState('');
  
  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState<Product>({
    id: '',
    name: '',
    category: '',
    description: '',
    price: 0,
    image_urls: [],
    status: 'ACTIVE'
  });

  useEffect(() => {
    loadProducts();
  }, [selectedCampusId, selectedOrganization]);

  const sortGroupsWithInactiveAtBottom = (list: ProductGroup[]): ProductGroup[] => {
    const active = list.filter(g => g.active);
    const inactive = list.filter(g => !g.active);
    return [...active, ...inactive];
  };

  const loadGroups = async (loadedProducts?: Product[]) => {
    const orgId = selectedOrganization?.id || 'org_default';
    const cacheKey = `faithhub_pdv_groups_${orgId}`;
    
    // 1. Tenta carregar do backend church-settings
    let backendGroups: ProductGroup[] | null = null;
    try {
      const res = await fetch(`${API_URL}/church-settings?organization_id=${encodeURIComponent(orgId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.store_config?.product_groups && Array.isArray(data.store_config.product_groups)) {
          backendGroups = data.store_config.product_groups.map((g: any, idx: number) => ({
            id: g.id || `grp_${idx}`,
            name: typeof g === 'string' ? g : (g.name || 'Geral'),
            active: typeof g === 'string' ? true : g.active !== false
          }));
        }
      }
    } catch {}

    // 2. Se não veio do backend, tenta do cache local da organização
    let initialList = backendGroups;
    if (!initialList) {
      const saved = localStorage.getItem(cacheKey) || localStorage.getItem('faithhub_pdv_groups');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            initialList = parsed.map((item: any, idx: number) => ({
              id: item.id || `grp_${idx}`,
              name: typeof item === 'string' ? item : (item.name || 'Geral'),
              active: typeof item === 'string' ? true : item.active !== false
            }));
          }
        } catch {}
      }
    }

    // 3. Mescla com categorias existentes nos produtos cadastrados
    const prods = loadedProducts || products;
    const existingFromProducts = Array.from(new Set(prods.map(p => p.category?.trim()).filter(Boolean)));

    let finalGroups: ProductGroup[] = initialList || [];
    
    existingFromProducts.forEach(catName => {
      if (!finalGroups.some(g => g.name.toLowerCase() === catName.toLowerCase())) {
        finalGroups.push({
          id: `grp_prod_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name: catName,
          active: true
        });
      }
    });

    // Se ainda assim não houver nenhum grupo e não houver produtos, fornece grupos padrão limpos
    if (finalGroups.length === 0 && prods.length === 0) {
      finalGroups = DEFAULT_GROUPS;
    }

    setGroups(sortGroupsWithInactiveAtBottom(finalGroups));
  };

  const saveGroupsList = async (newGroupsList: ProductGroup[]) => {
    const sorted = sortGroupsWithInactiveAtBottom(newGroupsList);
    setGroups(sorted);
    const orgId = selectedOrganization?.id || 'org_default';
    localStorage.setItem(`faithhub_pdv_groups_${orgId}`, JSON.stringify(sorted));
    localStorage.setItem('faithhub_pdv_groups', JSON.stringify(sorted));

    // Salva no backend church-settings para sincronizar com PWA de todos os membros
    try {
      const headers = await getAuthHeaders();
      const getRes = await fetch(`${API_URL}/church-settings?organization_id=${encodeURIComponent(orgId)}`);
      let currentSettings = {};
      if (getRes.ok) {
        currentSettings = await getRes.json();
      }
      await fetch(`${API_URL}/church-settings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...currentSettings,
          organization_id: orgId,
          store_config: {
            ...(currentSettings as any).store_config,
            product_groups: sorted
          }
        })
      });
    } catch (e) {
      console.warn("Erro ao sincronizar grupos de produtos com backend", e);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const updated = [...groups];
      const [movedItem] = updated.splice(draggedIndex, 1);
      updated.splice(dragOverIndex, 0, movedItem);
      saveGroupsList(updated);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveGroup = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= groups.length) return;
    const updated = [...groups];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    saveGroupsList(updated);
  };

  const handleAddGroup = (groupName: string) => {
    const trimmed = groupName.trim();
    if (!trimmed) return;
    if (groups.some(g => g.name.toLowerCase() === trimmed.toLowerCase())) {
      alert("Este grupo de produtos já existe.");
      return;
    }
    const newGroup: ProductGroup = {
      id: `grp_${Date.now()}`,
      name: trimmed,
      active: true
    };
    const updated = [newGroup, ...groups];
    saveGroupsList(updated);
    setNewGroupInput('');
    setQuickGroupName('');
    setInlineNewGroup(false);
    setFormData(prev => ({ ...prev, category: trimmed }));
  };

  const handleToggleGroupActive = (groupId: string) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, active: !g.active };
      }
      return g;
    });
    saveGroupsList(updated);
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    if (!window.confirm(`Deseja remover permanentemente o grupo "${groupName}"?`)) return;
    const updated = groups.filter(g => g.id !== groupId);
    saveGroupsList(updated);
    if (formData.category === groupName) {
      setFormData(prev => ({ ...prev, category: updated[0]?.name || '' }));
    }
  };

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

  const loadProducts = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const orgId = selectedOrganization?.id || 'org_default';
      const campusParam = selectedCampusId !== 'all' ? `&campus_id=${selectedCampusId}` : '';
      const res = await fetch(`${API_URL}/pdv/products?admin=true&organization_id=${orgId}${campusParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const loaded = Array.isArray(data) ? data : (data.data || []);
        setProducts(loaded);
        await loadGroups(loaded);
      } else {
        await loadGroups([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeGroups = groups.filter(g => g.active);

  const openNewModal = () => {
    const initialCategory = activeGroups.length > 0 ? activeGroups[0].name : (groups[0]?.name || '');
    setFormData({
      id: '',
      name: '',
      category: initialCategory,
      description: '',
      price: 0,
      image_urls: [],
      status: 'ACTIVE'
    });
    setInlineNewGroup(false);
    setQuickGroupName('');
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setFormData({ ...p });
    setInlineNewGroup(false);
    setQuickGroupName('');
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    setUploadingImage(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/upload-url?contentType=${encodeURIComponent(file.type)}&prefix=pdv`, { headers });
      const { uploadUrl, url } = await res.json();

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      setFormData(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, url]
      }));
    } catch (err) {
      console.error("Erro no upload", err);
      alert("Erro ao enviar imagem.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const urls = [...formData.image_urls];
    urls.splice(index, 1);
    setFormData({ ...formData, image_urls: urls });
  };

  const handleLinkAdd = (url: string) => {
    if (!url.trim()) return;
    setFormData(prev => ({
      ...prev,
      image_urls: [...prev.image_urls, url.trim()]
    }));
  };

  const handleSave = async (overrideStatus?: 'ACTIVE' | 'INACTIVE' | 'DRAFT') => {
    if (!formData.name.trim()) {
      alert("Informe o nome do produto.");
      return;
    }

    if (!formData.category.trim()) {
      alert("Selecione ou crie um grupo para o produto.");
      return;
    }

    setIsSaving(true);
    try {
      const headers = await getAuthHeaders();
      const payload = {
        ...formData,
        status: overrideStatus || formData.status,
        price: Number(formData.price),
        organization_id: selectedOrganization?.id || 'org_default',
        campus_id: selectedCampusId !== 'all' ? selectedCampusId : 'campus_sede'
      };

      const res = await fetch(`${API_URL}/pdv/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        loadProducts();
      } else {
        alert("Erro ao salvar produto.");
      }
    } catch (err) {
      console.error(err);
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

  // Filtragem de produtos por grupo
  const filteredProducts = selectedGroupFilter === 'ALL' 
    ? products 
    : products.filter(p => p.category === selectedGroupFilter);

  return (
    <div className="animate-fade-in" style={{ width: '100%' }}>
      
      {/* Header */}
      <div className="card-header-row" style={{ paddingBottom: 20, borderBottom: '1px solid var(--panel-border)', marginBottom: 20 }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.4rem' }}>Loja Oficial & Ponto de Venda (PDV)</h1>
          <p className="card-subtitle">Cadastre e gerencie os livros, devocionais, vestuário, cursos e produtos disponíveis para compra no App.</p>
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => setShowGroupsModal(true)}
            style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 700 }}
          >
            <FolderIcon /> Gerenciar Grupos ({activeGroups.length} ativos)
          </button>
          
          <button className="btn-primary" onClick={openNewModal}>
            <PlusIcon /> Novo Produto
          </button>
        </div>
      </div>

      {/* Filter Bar: Segmented Grupos de Produtos (Apenas grupos ativos) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto', paddingBottom: 14, marginBottom: 16 }}>
        <button
          type="button"
          className={`segmented-btn ${selectedGroupFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedGroupFilter('ALL')}
          style={{ padding: '8px 16px', fontSize: '0.80rem', whiteSpace: 'nowrap' }}
        >
          Todos ({products.length})
        </button>

        {activeGroups.map(group => {
          const count = products.filter(p => p.category === group.name).length;
          return (
            <button
              key={group.id}
              type="button"
              className={`segmented-btn ${selectedGroupFilter === group.name ? 'active' : ''}`}
              onClick={() => setSelectedGroupFilter(group.name)}
              style={{ padding: '8px 16px', fontSize: '0.80rem', whiteSpace: 'nowrap' }}
            >
              {group.name} ({count})
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Carregando catálogo de produtos...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <ShoppingBagIcon />
          <h3>{selectedGroupFilter === 'ALL' ? 'Nenhum produto cadastrado no PDV' : `Nenhum produto no grupo "${selectedGroupFilter}"`}</h3>
          <p>Clique em Novo Produto para cadastrar itens e disponibilizá-los aos membros.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
          {filteredProducts.map((prod) => (
             <div 
               key={prod.id} 
               className="portal-card" 
               onClick={() => openEditModal(prod)} 
               style={{ padding: 0, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
             >
                {/* Imagem do Produto */}
                <div style={{ height: 160, background: prod.image_urls && prod.image_urls[0] ? `url(${prod.image_urls[0]})` : '#f1f5f9', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                   {(!prod.image_urls || prod.image_urls.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sem Foto</span>}
                   
                   {/* Status Badge */}
                   <div style={{ position: 'absolute', top: 12, left: 12 }}>
                     <span className={`status-badge ${prod.status === 'ACTIVE' ? 'excellent' : (prod.status === 'DRAFT' ? 'pending' : '')}`} style={prod.status === 'INACTIVE' ? { background: '#fee2e2', color: '#dc2626' } : {}}>
                       {prod.status === 'ACTIVE' ? 'PUBLICADO' : (prod.status === 'DRAFT' ? 'RASCUNHO' : 'ESGOTADO')}
                     </span>
                   </div>

                   {/* Botao Delete */}
                   <button 
                     className="action-circle-btn" 
                     style={{ position: 'absolute', top: 10, right: 10, width: 32, height: 32, background: 'rgba(255,255,255,0.9)', color: 'var(--danger)' }} 
                     onClick={(e) => handleDelete(prod.id, e)}
                     title="Excluir"
                   >
                     <TrashIcon />
                   </button>
                </div>

                {/* Infos do Produto */}
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', fontWeight: 800, marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {prod.category}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>{prod.name}</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14, minHeight: 36 }}>
                    {prod.description || 'Nenhuma descrição detalhada fornecida.'}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--panel-border)' }}>
                     <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
                       R$ {Number(prod.price).toFixed(2).replace('.', ',')}
                     </span>
                     <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>App Mobile</span>
                  </div>
                </div>
             </div>
          ))}
        </div>
      )}

      {/* ========================================================
          MODAL STUDIO: CADASTRO / EDIÇÃO DE PRODUTO
          ======================================================== */}
      {showModal && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="modal-studio-container" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-blue-bg)', color: 'var(--pastel-blue-text)' }}>
                  <ShoppingBagIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">
                    {formData.id ? 'Editar Produto do PDV' : 'Cadastrar Novo Produto no PDV'}
                  </h2>
                  <p className="modal-studio-subtitle">
                    Configure os itens, precificação e fotos disponíveis para compra dos membros no App.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setShowModal(false)} title="Fechar">
                &times;
              </button>
            </div>

            {/* Modal Body - 2 Column Grid */}
            <div className="modal-studio-body">
              <div className="modal-studio-grid">
                
                {/* LEFT COLUMN: Dados do Produto (60%) */}
                <div className="modal-studio-column">
                  
                  <div className="form-group-modern">
                    <label className="form-label-modern">Nome do Produto *</label>
                    <input 
                      type="text" 
                      className="input-modern"
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="Ex: Coxinha Artesanal com Catupiry, Bíblia NVI..." 
                      required 
                    />
                  </div>

                  {/* Campo de Grupo de Produtos Inteligente */}
                  <div className="form-group-modern">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label-modern" style={{ margin: 0 }}>
                        <span>Grupo / Categoria do Produto *</span>
                      </label>

                      {groups.length > 0 && !inlineNewGroup && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            type="button" 
                            onClick={() => setInlineNewGroup(true)} 
                            style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            + Novo Grupo
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Caso NÃO existam grupos cadastrados ainda */}
                    {groups.length === 0 ? (
                      <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '14px' }}>
                        <div style={{ fontSize: '0.80rem', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>
                          ⚠️ Nenhum grupo de produtos criado ainda.
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#78350f', marginBottom: '10px' }}>
                          Crie o primeiro grupo (ex: Cantina, Livraria, Vestuário, Cursos) para vincular este produto:
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input 
                            type="text" 
                            className="input-modern"
                            value={quickGroupName} 
                            onChange={e => setQuickGroupName(e.target.value)} 
                            placeholder="Nome do Novo Grupo (ex: Cantina)" 
                          />
                          <button 
                            type="button" 
                            className="btn-primary" 
                            style={{ padding: '8px 16px', fontSize: '0.80rem', whiteSpace: 'nowrap' }}
                            onClick={() => handleAddGroup(quickGroupName)}
                          >
                            Criar Grupo
                          </button>
                        </div>
                      </div>
                    ) : inlineNewGroup ? (
                      /* Formulário Inline de Criação Rápida de Grupo */
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid var(--panel-border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input 
                          type="text" 
                          className="input-modern"
                          value={quickGroupName} 
                          onChange={e => setQuickGroupName(e.target.value)} 
                          placeholder="Digite o nome do novo grupo..." 
                          autoFocus
                        />
                        <button 
                          type="button" 
                          className="btn-primary" 
                          style={{ padding: '8px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                          onClick={() => handleAddGroup(quickGroupName)}
                        >
                          Adicionar
                        </button>
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          style={{ padding: '8px 12px', fontSize: '0.78rem' }}
                          onClick={() => setInlineNewGroup(false)}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      /* Dropdown com os grupos disponíveis */
                      <select 
                        className="select-modern"
                        value={formData.category} 
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      >
                        {groups.map(g => (
                          <option key={g.id} value={g.name}>
                            {g.name} {!g.active ? '(Desativado)' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Preço Unitário (R$) *</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="input-modern"
                      style={{ fontWeight: 800, color: '#059669', fontSize: '1.1rem' }}
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} 
                      placeholder="0.00" 
                      required 
                    />
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label-modern">Descrição & Ingredientes</label>
                    <textarea 
                      rows={3} 
                      className="textarea-modern"
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      placeholder="Descreva o sabor, ingredientes, autor do livro ou detalhes que o membro lerá ao selecionar..." 
                    />
                  </div>
                </div>

                {/* RIGHT COLUMN: Fotos & Visibilidade (40%) */}
                <div className="modal-studio-column">
                  
                  <div className="form-group-modern">
                    <label className="form-label-modern">
                      <span>Galeria de Imagens ({formData.image_urls.length}/3)</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Upload ou Link</span>
                    </label>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
                      {formData.image_urls.map((url, i) => (
                        <div 
                          key={i} 
                          style={{ 
                            width: 80, 
                            height: 80, 
                            flexShrink: 0, 
                            background: `url(${url})`, 
                            backgroundSize: 'cover', 
                            backgroundPosition: 'center', 
                            borderRadius: 12, 
                            position: 'relative',
                            border: '1px solid var(--panel-border)'
                          }}
                        >
                          <button 
                            onClick={() => removeImage(i)} 
                            style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#FFF', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      {formData.image_urls.length < 3 && (
                        <label 
                          style={{ 
                            width: 80, 
                            height: 80, 
                            flexShrink: 0, 
                            borderRadius: 12, 
                            border: '2px dashed var(--panel-border)', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'var(--text-muted)', 
                            cursor: 'pointer',
                            background: '#f8fafc',
                            fontSize: '0.74rem',
                            fontWeight: 700
                          }}
                        >
                          {uploadingImage ? 'Enviando...' : '+ Foto'}
                          <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <input 
                        type="text" 
                        id="linkInput" 
                        placeholder="Ou cole a URL da foto..." 
                        className="input-modern"
                        style={{ padding: '7px 10px', fontSize: '0.80rem' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => { const el = document.getElementById('linkInput') as HTMLInputElement; handleLinkAdd(el.value); el.value = ''; }} 
                        className="btn-secondary" 
                        style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Toggle: Visibilidade no App */}
                  <div className="toggle-card-modern" style={{ marginTop: 4 }}>
                    <div className="toggle-card-info">
                      <div className="toggle-card-title">
                        <span style={{ color: '#059669' }}>🛒</span> Disponível para Compra
                      </div>
                      <div className="toggle-card-desc">
                        Aparecerá no cardápio de compras do membro
                      </div>
                    </div>
                    <label className="switch-control">
                      <input 
                        type="checkbox" 
                        checked={formData.status === 'ACTIVE'} 
                        onChange={e => setFormData({...formData, status: e.target.checked ? 'ACTIVE' : 'INACTIVE'})} 
                      />
                      <span className="slider-round"></span>
                    </label>
                  </div>

                  {/* Live Mobile Card Preview */}
                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 16, border: '1px solid var(--panel-border)' }}>
                    <div style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      📱 Live Card no App
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.90rem', color: 'var(--text-main)', marginBottom: 2 }}>
                      {formData.name || 'Nome do Produto'}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669' }}>
                      R$ {Number(formData.price).toFixed(2).replace('.', ',')} • <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{formData.category || 'Sem Grupo'}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-studio-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowModal(false)}
                disabled={isSaving || uploadingImage}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={() => handleSave('DRAFT')} 
                className="btn-secondary" 
                disabled={isSaving || uploadingImage} 
                style={{ color: 'var(--warning)' }}
              >
                Salvar Rascunho
              </button>
              <button 
                type="button" 
                onClick={() => handleSave('ACTIVE')} 
                className="btn-primary" 
                disabled={isSaving || uploadingImage}
              >
                {isSaving ? 'Salvando...' : 'Salvar & Publicar no App'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: GERENCIADOR DE GRUPOS DE PRODUTOS
          ======================================================== */}
      {showGroupsModal && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={() => setShowGroupsModal(false)}>
          <div className="modal-studio-container" style={{ maxWidth: 660 }} onClick={e => e.stopPropagation()}>
            
            <div className="modal-studio-header">
              <div className="modal-studio-header-left">
                <div className="modal-studio-header-icon" style={{ background: 'var(--pastel-green-bg)', color: 'var(--pastel-green-text)' }}>
                  <FolderIcon />
                </div>
                <div>
                  <h2 className="modal-studio-title">Grupos & Categorias de Produtos</h2>
                  <p className="modal-studio-subtitle">
                    Ative, desative ou arraste para definir a ordem dos grupos no cardápio do App e PDV.
                  </p>
                </div>
              </div>
              <button className="modal-close-circle" onClick={() => setShowGroupsModal(false)}>&times;</button>
            </div>

            <div className="modal-studio-body" style={{ padding: '24px' }}>
              
              {/* Adicionar Novo Grupo */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input 
                  type="text" 
                  className="input-modern"
                  value={newGroupInput} 
                  onChange={e => setNewGroupInput(e.target.value)} 
                  placeholder="Nome do novo grupo (ex: Cursos, Livraria, Cantina...)" 
                  onKeyDown={e => { if (e.key === 'Enter') handleAddGroup(newGroupInput); }}
                />
                <button 
                  type="button" 
                  className="btn-primary" 
                  onClick={() => handleAddGroup(newGroupInput)}
                  style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}
                >
                  <PlusIcon /> Criar Grupo
                </button>
              </div>

              {/* Lista de Grupos com Drag & Drop e Flag Ativo/Inativo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Ordem dos Grupos ({activeGroups.length} ativos / {groups.length - activeGroups.length} desativados)
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                    ⠿ Arraste para ordenar
                  </span>
                </div>

                {groups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', background: '#f8fafc', borderRadius: 12 }}>
                    Nenhum grupo cadastrado. Crie um grupo acima.
                  </div>
                ) : (
                  groups.map((group, idx) => {
                    const count = products.filter(p => p.category === group.name).length;
                    const isOver = dragOverIndex === idx;
                    const isDragging = draggedIndex === idx;
                    const isGroupActive = group.active;

                    return (
                      <div 
                        key={group.id}
                        draggable={isGroupActive}
                        onDragStart={() => handleDragStart(idx)}
                        onDragEnter={() => handleDragEnter(idx)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => e.preventDefault()}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '10px 14px', 
                          background: isDragging ? '#e0f2fe' : (isOver ? '#f0fdfa' : (isGroupActive ? '#ffffff' : '#f1f5f9')), 
                          borderRadius: '12px',
                          border: isOver ? '2px dashed var(--accent-primary)' : (isGroupActive ? '1px solid var(--panel-border)' : '1px solid #cbd5e1'),
                          cursor: isGroupActive ? 'grab' : 'default',
                          opacity: isDragging ? 0.6 : (isGroupActive ? 1 : 0.65),
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div title={isGroupActive ? "Arraste para mudar a ordem" : "Ative o grupo para reordenar"} style={{ display: 'flex', alignItems: 'center', opacity: isGroupActive ? 1 : 0.3 }}>
                            <GripVerticalIcon />
                          </div>

                          <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: isGroupActive ? '#e2e8f0' : '#cbd5e1', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.70rem', fontWeight: 800 }}>
                            {isGroupActive ? `${idx + 1}º` : '—'}
                          </div>

                          <TagIcon />
                          
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '0.90rem', color: isGroupActive ? 'var(--text-main)' : 'var(--text-muted)', textDecoration: isGroupActive ? 'none' : 'line-through' }}>
                              {group.name}
                            </span>
                            <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                              {count} produto(s)
                            </div>
                          </div>
                        </div>

                        {/* Controles: Switch Ativar/Desativar + Subir/Descer + Delete */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          
                          {/* Switch de Ativação */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.70rem', fontWeight: 800, color: isGroupActive ? '#059669' : '#94a3b8' }}>
                              {isGroupActive ? 'ATIVO' : 'DESATIVADO'}
                            </span>
                            <label className="switch-control" style={{ transform: 'scale(0.8)' }}>
                              <input 
                                type="checkbox" 
                                checked={isGroupActive} 
                                onChange={() => handleToggleGroupActive(group.id)} 
                              />
                              <span className="slider-round"></span>
                            </label>
                          </div>

                          {/* Botões Subir/Descer */}
                          {isGroupActive && (
                            <div style={{ display: 'flex', gap: 2 }}>
                              <button
                                type="button"
                                className="action-circle-btn"
                                onClick={() => moveGroup(idx, 'up')}
                                disabled={idx === 0}
                                title="Mover para cima"
                                style={{ opacity: idx === 0 ? 0.3 : 1, width: 28, height: 28 }}
                              >
                                <ChevronUpIcon />
                              </button>

                              <button
                                type="button"
                                className="action-circle-btn"
                                onClick={() => moveGroup(idx, 'down')}
                                disabled={idx >= activeGroups.length - 1}
                                title="Mover para baixo"
                                style={{ opacity: idx >= activeGroups.length - 1 ? 0.3 : 1, width: 28, height: 28 }}
                              >
                                <ChevronDownIcon />
                              </button>
                            </div>
                          )}

                          {/* Excluir Grupo */}
                          <button 
                            type="button" 
                            className="action-circle-btn" 
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            title="Remover Grupo"
                            style={{ color: '#ef4444', width: 28, height: 28 }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            <div className="modal-studio-footer">
              <button type="button" className="btn-primary" onClick={() => setShowGroupsModal(false)}>
                Concluir
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
