/** Studio v2 is the standard interface, independent of the tenant's module entitlements. */
export const STUDIO_VERSION = 'v2' as const;

export function canonicalStudioUrl(href: string): URL {
  const url = new URL(href);
  // Keep the destination, proposal, preview and campaign parameters from old links.
  url.searchParams.delete('studio');
  return url;
}
