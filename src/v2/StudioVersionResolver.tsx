import { useEffect } from 'react';
import { useFeatureFlags } from '../context/FeatureFlagContext';

export type StudioVersion = 'v1' | 'v2';
export type StudioVersionOverride = StudioVersion | null;

interface StudioVersionConfig {
  default_version?: StudioVersion;
}

interface StudioVersionResolverProps {
  requestedVersion: StudioVersionOverride;
  onResolve: (version: StudioVersion) => void;
}

export function StudioVersionResolver({ requestedVersion, onResolve }: StudioVersionResolverProps) {
  const { getFeatureConfig, isFeatureEnabled, isLoading } = useFeatureFlags();

  useEffect(() => {
    if (isLoading) return;
    const enabled = isFeatureEnabled('studio.context_navigation_v2', false);
    const config = getFeatureConfig<StudioVersionConfig>('studio.context_navigation_v2', {});
    const tenantDefault = enabled && config?.default_version === 'v2' ? 'v2' : 'v1';

    if (requestedVersion === 'v1') {
      onResolve('v1');
      return;
    }
    if (requestedVersion === 'v2') {
      onResolve(enabled ? 'v2' : 'v1');
      return;
    }
    onResolve(tenantDefault);
  }, [getFeatureConfig, isFeatureEnabled, isLoading, onResolve, requestedVersion]);

  return null;
}
