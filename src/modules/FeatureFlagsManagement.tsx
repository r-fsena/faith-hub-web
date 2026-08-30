import React, { useState, useMemo } from 'react';
import { useFeatureFlags } from '../context/FeatureFlagContext';
import { type Organization } from './OrganizationSelector';
import { type Campus } from './Campuses';

interface FeatureFlagsManagementProps {
  selectedOrganization: Organization | null;
  selectedCampusId: string;
  campuses: Campus[];
}

export const FeatureFlagsManagement: React.FC<FeatureFlagsManagementProps> = ({
  selectedOrganization,
  selectedCampusId,
  campuses
}) => {
  const {
    catalog,
    flags,
    plan,
    isLoading,
    toggleFlag,
    batchUpdateFlags,
    resetTenantFlags,
    selectedEnv,
    setSelectedEnv,
    refreshFlags
  } = useFeatureFlags();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active campus name
  const currentCampusName = useMemo(() => {
    if (selectedCampusId === 'all') return 'Todas as Unidades (Geral)';
    const found = campuses.find(c => c.id === selectedCampusId);
    return found ? found.name : selectedCampusId;
  }, [selectedCampusId, campuses]);

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return ['all', ...Array.from(set)];
  }, [catalog]);

  // Filtered flags
  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchesSearch =
        item.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [catalog, searchQuery, selectedCategory]);

  // Stats
  const totalFeatures = catalog.length;
  const enabledCount = catalog.filter(i => flags[i.key]).length;
  const disabledCount = totalFeatures - enabledCount;
  const overridesCount = catalog.filter(i => i.hasOverride).length;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    setIsProcessing(true);
    const nextState = !currentEnabled;
    const ok = await toggleFlag(key, nextState);
    setIsProcessing(false);
    if (ok) {
      showToast(`Flag "${key}" ${nextState ? 'habilitada' : 'desabilitada'} com sucesso!`);
    } else {
      showToast(`Erro ao atualizar a flag "${key}".`, 'error');
    }
  };

  const handleApplyPreset = async (presetPlan: 'STARTER' | 'PRO' | 'ENTERPRISE') => {
    if (!window.confirm(`Deseja aplicar o preset de funcionalidades do plano ${presetPlan}?`)) {
      return;
    }

    setIsProcessing(true);
    const updates: Array<{ feature_key: string; is_enabled: boolean }> = [];

    catalog.forEach(item => {
      let shouldEnable = true;
      if (presetPlan === 'STARTER') {
        if (
          item.key.startsWith('pdv.') ||
          item.key.includes('express_kiosk') ||
          item.key.includes('thermal_badge') ||
          item.key.includes('multicampus') ||
          item.key.includes('custom_domain')
        ) {
          shouldEnable = false;
        }
      } else if (presetPlan === 'PRO') {
        if (item.key.includes('custom_domain') || item.key.includes('delivery_mode_home')) {
          shouldEnable = false;
        }
      }
      updates.push({ feature_key: item.key, is_enabled: shouldEnable });
    });

    const ok = await batchUpdateFlags(updates);
    setIsProcessing(false);
    if (ok) {
      showToast(`Preset do plano ${presetPlan} aplicado com sucesso!`);
    } else {
      showToast(`Erro ao aplicar o preset do plano ${presetPlan}.`, 'error');
    }
  };

  const handleResetOverrides = async () => {
    if (
      !window.confirm(
        'Tem certeza que deseja restaurar as Feature Flags desta congregação para o padrão de fábrica do plano?'
      )
    ) {
      return;
    }

    setIsProcessing(true);
    const ok = await resetTenantFlags();
    setIsProcessing(false);
    if (ok) {
      showToast('Todas as flags foram restauradas para os padrões com sucesso!');
    } else {
      showToast('Erro ao restaurar as flags.', 'error');
    }
  };

  return (
    <div className="module-container" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {statusMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: statusMessage.type === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 500,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <span>{statusMessage.type === 'success' ? '✓' : '⚠'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
              Gestão de Feature Flags & Módulos
            </h1>
            <span
              style={{
                backgroundColor: 'rgba(15, 118, 110, 0.15)',
                color: '#0f766e',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              Plano: {plan}
            </span>
          </div>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
            Habilite ou desabilite módulos e ações granulares com isolamento por ambiente e tenant.
          </p>
        </div>

        {/* Tenant / Campus & Environment Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Environment Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1e293b',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid #334155'
            }}
          >
            {(['production', 'staging', 'development', 'all'] as const).map(env => (
              <button
                key={env}
                onClick={() => setSelectedEnv(env)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedEnv === env ? '#0f766e' : 'transparent',
                  color: selectedEnv === env ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.15s ease'
                }}
              >
                {env === 'production' && 'Produção'}
                {env === 'staging' && 'Homologação'}
                {env === 'development' && 'Dev'}
                {env === 'all' && 'Todos'}
              </button>
            ))}
          </div>

          <button
            onClick={() => refreshFlags()}
            disabled={isLoading}
            style={{
              padding: '8px 14px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.85rem'
            }}
          >
            {isLoading ? 'Atualizando...' : '🔄 Sincronizar'}
          </button>
        </div>
      </div>

      {/* Scope Status Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)',
          border: '1px solid rgba(15, 118, 110, 0.2)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#0f766e',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem'
            }}
          >
            ⛪
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
              Tenant Ativo
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
              {selectedOrganization ? selectedOrganization.name : 'Igreja Faith Hub (Global)'}
              <span style={{ color: '#64748b', fontWeight: 400, marginLeft: '8px', fontSize: '0.9rem' }}>
                • {currentCampusName}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Presets Rápidos:</span>
          <button
            onClick={() => handleApplyPreset('STARTER')}
            disabled={isProcessing}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            STARTER
          </button>
          <button
            onClick={() => handleApplyPreset('PRO')}
            disabled={isProcessing}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(15, 118, 110, 0.1)',
              color: '#0f766e',
              border: '1px solid rgba(15, 118, 110, 0.3)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            PRO
          </button>
          <button
            onClick={() => handleApplyPreset('ENTERPRISE')}
            disabled={isProcessing}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: '#6366f1',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ENTERPRISE
          </button>
          <button
            onClick={handleResetOverrides}
            disabled={isProcessing}
            style={{
              padding: '6px 12px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Restaurar Padrões
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Total de Features</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#0f172a' }}>
            {totalFeatures}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Granularidade Completa</div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>Features Ativas</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#10b981' }}>
            {enabledCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            {Math.round((enabledCount / (totalFeatures || 1)) * 100)}% do catálogo
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>Features Inativas</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#ef4444' }}>
            {disabledCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Ocultas no App/Web</div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600 }}>Customizações da Igreja</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px', color: '#3b82f6' }}>
            {overridesCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Overrides de Tenant</div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: '#ffffff',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem'
        }}
      >
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Buscar por nome da flag (ex: kids.express_kiosk, pdv, relatórios)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.95rem',
              outline: 'none',
              backgroundColor: '#f8fafc'
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: selectedCategory === cat ? '#0f766e' : '#f1f5f9',
                color: selectedCategory === cat ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              {cat === 'all' ? 'Todas as Categorias' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Flags Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {filteredCatalog.map(item => {
          const isEnabled = flags[item.key] !== undefined ? Boolean(flags[item.key]) : item.enabled;

          return (
            <div
              key={item.key}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: isEnabled ? '1px solid #cbd5e1' : '1px solid #e2e8f0',
                padding: '1.25rem',
                boxShadow: isEnabled ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                opacity: isEnabled ? 1 : 0.75
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'rgba(15, 118, 110, 0.1)',
                      color: '#0f766e',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}
                  >
                    {item.category}
                  </span>

                  {item.hasOverride && (
                    <span
                      style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        color: '#2563eb',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}
                    >
                      Override Igreja
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '4px',
                    wordBreak: 'break-all'
                  }}
                >
                  {item.key}
                </div>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    margin: 0,
                    lineHeight: 1.4,
                    minHeight: '38px'
                  }}
                >
                  {item.description}
                </p>
              </div>

              <div
                style={{
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isEnabled ? '#10b981' : '#94a3b8'
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: isEnabled ? '#10b981' : '#64748b'
                    }}
                  >
                    {isEnabled ? 'Habilitado' : 'Desabilitado'}
                  </span>
                </div>

                {/* Switch Toggle */}
                <label
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '46px',
                    height: '24px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    disabled={isProcessing}
                    onChange={() => handleToggle(item.key, isEnabled)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: isEnabled ? '#0f766e' : '#cbd5e1',
                      transition: '0.2s',
                      borderRadius: '24px'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: isEnabled ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '0.2s',
                        borderRadius: '50%',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    />
                  </span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCatalog.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            color: '#64748b'
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
          <div style={{ fontWeight: 600, fontSize: '1rem' }}>Nenhuma feature flag encontrada</div>
          <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Tente buscar por outro termo ou limpar os filtros de categoria.
          </div>
        </div>
      )}
    </div>
  );
};
export default FeatureFlagsManagement;
