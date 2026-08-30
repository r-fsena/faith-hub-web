import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Retorna os headers de autorização contendo o Bearer Token do Cognito
 */
export async function getAuthHeaders(extraHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString() || session.tokens?.accessToken?.toString();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...extraHeaders
      };
    }
    return {
      'Content-Type': 'application/json',
      ...extraHeaders
    };
  } catch (error) {
    return {
      'Content-Type': 'application/json',
      ...extraHeaders
    };
  }
}

/**
 * Wrapper de fetch autenticado que injeta automaticamente o Bearer Token
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const headers = {
    ...authHeaders,
    ...((options.headers as Record<string, string>) || {})
  };
  return fetch(url, {
    ...options,
    headers
  });
}
