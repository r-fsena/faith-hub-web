import { getAuthHeaders } from './apiClient';

const API_URL = import.meta.env.VITE_API_URL || 'https://usl72lj2m5.execute-api.us-east-2.amazonaws.com';

export interface StudioRecentTab {
  tab: string;
  at: string;
}

export interface StudioPreferences {
  onboarding_steps: string[];
  onboarding_dismissed: boolean;
  favorite_tabs: string[];
  recent_tabs: StudioRecentTab[];
  updated_at?: string | null;
}

export interface StudioRemoteSearchResult {
  kind: 'member' | 'document';
  id: string;
  title: string;
  subtitle: string;
  tab: string;
}

function queryString(organizationId: string, campusId: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams({ organization_id: organizationId });
  if (campusId && campusId !== 'all') params.set('campus_id', campusId);
  Object.entries(extra || {}).forEach(([key, value]) => params.set(key, value));
  return params.toString();
}

export async function loadStudioPreferences(organizationId: string, campusId: string): Promise<StudioPreferences> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/studio/preferences?${queryString(organizationId, campusId)}`, { headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || 'STUDIO_PREFERENCES_LOAD_FAILED');
  return data.data as StudioPreferences;
}

export async function saveStudioPreferences(
  organizationId: string,
  campusId: string,
  preferences: Partial<StudioPreferences>
): Promise<StudioPreferences> {
  const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
  const response = await fetch(`${API_URL}/studio/preferences`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      organization_id: organizationId,
      campus_id: campusId === 'all' ? null : campusId,
      ...preferences
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || 'STUDIO_PREFERENCES_SAVE_FAILED');
  return data.data as StudioPreferences;
}

export async function searchStudio(
  organizationId: string,
  campusId: string,
  term: string,
  signal?: AbortSignal
): Promise<StudioRemoteSearchResult[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/studio/search?${queryString(organizationId, campusId, { q: term })}`, { headers, signal });
  if (response.status === 403) return [];
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || 'STUDIO_SEARCH_FAILED');
  return Array.isArray(data.data) ? data.data : [];
}
