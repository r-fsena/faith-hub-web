import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export interface FeatureFlagItem {
  key: string;
  category: string;
  description: string;
  enabled: boolean;
  hasOverride: boolean;
  config?: any;
}

export interface FeatureFlagContextType {
  flags: Record<string, boolean>;
  configs: Record<string, any>;
  catalog: FeatureFlagItem[];
  plan: string;
  isLoading: boolean;
  isFeatureEnabled: (featureKey: string, defaultValue?: boolean) => boolean;
  getFeatureConfig: <T = any>(featureKey: string, defaultValue?: T) => T;
  toggleFlag: (featureKey: string, isEnabled: boolean, configPayload?: any) => Promise<boolean>;
  batchUpdateFlags: (updatedFlags: Array<{ feature_key: string; is_enabled: boolean; config_payload?: any }>) => Promise<boolean>;
  resetTenantFlags: () => Promise<boolean>;
  refreshFlags: () => Promise<void>;
  selectedEnv: 'all' | 'development' | 'staging' | 'production';
  setSelectedEnv: (env: 'all' | 'development' | 'staging' | 'production') => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  organizationId?: string;
  campusId?: string | null;
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({
  children,
  organizationId = 'org_default',
  campusId = null
}) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [catalog, setCatalog] = useState<FeatureFlagItem[]>([]);
  const [plan, setPlan] = useState<string>('PRO');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedEnv, setSelectedEnv] = useState<'all' | 'development' | 'staging' | 'production'>('production');

  const fetchFlags = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (organizationId) params.append('organization_id', organizationId);
      if (campusId && campusId !== 'all') params.append('campus_id', campusId);
      if (selectedEnv) params.append('environment', selectedEnv);

      const res = await fetch(`${API_URL}/feature-flags?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags || {});
        setConfigs(data.configs || {});
        setCatalog(data.catalog || []);
        setPlan(data.plan || 'PRO');
      }
    } catch (err) {
      console.warn('Erro ao buscar feature flags:', err);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, campusId, selectedEnv]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const isFeatureEnabled = useCallback(
    (featureKey: string, defaultValue: boolean = true): boolean => {
      if (flags[featureKey] !== undefined) {
        return Boolean(flags[featureKey]);
      }
      return defaultValue;
    },
    [flags]
  );

  const getFeatureConfig = useCallback(
    <T = any>(featureKey: string, defaultValue?: T): T => {
      if (configs[featureKey] !== undefined) {
        return configs[featureKey] as T;
      }
      return defaultValue as T;
    },
    [configs]
  );

  const toggleFlag = async (
    featureKey: string,
    isEnabled: boolean,
    configPayload?: any
  ): Promise<boolean> => {
    try {
      const payload = {
        organization_id: organizationId,
        campus_id: campusId === 'all' ? null : campusId,
        environment: selectedEnv,
        feature_key: featureKey,
        is_enabled: isEnabled,
        config_payload: configPayload,
        updated_by: 'Web Admin'
      };

      // Otimistic update
      setFlags(prev => ({ ...prev, [featureKey]: isEnabled }));
      setCatalog(prev =>
        prev.map(item => (item.key === featureKey ? { ...item, enabled: isEnabled, hasOverride: true } : item))
      );

      const res = await fetch(`${API_URL}/feature-flags/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          setFlags(json.result.flags || {});
          setConfigs(json.result.configs || {});
          setCatalog(json.result.catalog || []);
        }
        return true;
      }
      // Revert if failed
      fetchFlags();
      return false;
    } catch (err) {
      console.error('Erro ao alternar feature flag:', err);
      fetchFlags();
      return false;
    }
  };

  const batchUpdateFlags = async (
    updatedFlags: Array<{ feature_key: string; is_enabled: boolean; config_payload?: any }>
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/feature-flags/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          campus_id: campusId === 'all' ? null : campusId,
          environment: selectedEnv,
          flags: updatedFlags,
          updated_by: 'Web Admin Batch'
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          setFlags(json.result.flags || {});
          setConfigs(json.result.configs || {});
          setCatalog(json.result.catalog || []);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao atualizar flags em lote:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetTenantFlags = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/feature-flags/tenant/${organizationId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          setFlags(json.result.flags || {});
          setConfigs(json.result.configs || {});
          setCatalog(json.result.catalog || []);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao resetar flags do tenant:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FeatureFlagContext.Provider
      value={{
        flags,
        configs,
        catalog,
        plan,
        isLoading,
        isFeatureEnabled,
        getFeatureConfig,
        toggleFlag,
        batchUpdateFlags,
        resetTenantFlags,
        refreshFlags: fetchFlags,
        selectedEnv,
        setSelectedEnv
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
};

export function useFeatureFlags(): FeatureFlagContextType {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    // Graceful fallback for non-provider wrappers
    return {
      flags: {},
      configs: {},
      catalog: [],
      plan: 'PRO',
      isLoading: false,
      isFeatureEnabled: () => true,
      getFeatureConfig: () => null,
      toggleFlag: async () => false,
      batchUpdateFlags: async () => false,
      resetTenantFlags: async () => false,
      refreshFlags: async () => {},
      selectedEnv: 'production',
      setSelectedEnv: () => {}
    };
  }
  return context;
}

export function useFeatureFlag(featureKey: string, defaultValue: boolean = true) {
  const { isFeatureEnabled, getFeatureConfig, isLoading } = useFeatureFlags();
  return {
    isEnabled: isFeatureEnabled(featureKey, defaultValue),
    config: getFeatureConfig(featureKey),
    isLoading
  };
}

interface FeatureGateProps {
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  defaultAllowed?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  flag,
  children,
  fallback = null,
  defaultAllowed = true
}) => {
  const { isEnabled, isLoading } = useFeatureFlag(flag, defaultAllowed);

  if (isLoading) {
    return null;
  }

  return isEnabled ? <>{children}</> : <>{fallback}</>;
};
