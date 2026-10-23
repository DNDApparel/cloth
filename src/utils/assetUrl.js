/**
 * Resolves an image path from the published store data into a URL the browser
 * can load.
 *
 * Paths originate from `store-data.json`, which is edited by hand and
 * committed, so they are treated as untrusted input: only absolute http(s)
 * URLs and site-relative paths are allowed through. Anything carrying a scheme
 * (`javascript:`, `data:`, `vbscript:`) or a protocol-relative `//` prefix is
 * dropped rather than handed to the browser.
 */
export function assetUrl(url) {
  if (typeof url !== 'string' || !url) return '';

  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(url)) return '';

  // Site-relative paths are rebased onto the Pages sub-path (`/repo-name/`).
  if (url.startsWith('/')) {
    return `${import.meta.env.BASE_URL}${url.replace(/^\/+/, '')}`;
  }

  return url;
}
