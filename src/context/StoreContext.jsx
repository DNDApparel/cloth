import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { assetUrl } from '../utils/assetUrl';
import { BRAND_VALUES, COLLECTIONS, STORY_BLOCKS } from '../data/collections';
import { DEFAULT_STATIC_STORE } from '../data/storeConfig';

const StoreContext = createContext(null);

const FALLBACK_SETTINGS = {
  storeName: 'DND Store',
  tagline: 'Good clothes for the in-between.',
  supportEmail: '',
  festiveOffer: { active: false, label: '', percent: 0 },
  hero: {},
  banner: { enabled: false },
  productCopy: {},
  whatsapp: { enabled: false },
};

/**
 * Catalogue committed alongside the code. Used when `store-data.json` is
 * missing or unreadable so the storefront still renders something sensible.
 */
const SEEDED_STORE = DEFAULT_STATIC_STORE;

async function loadPublishedStore() {
  const response = await fetch(`${import.meta.env.BASE_URL}store-data.json`, {
    cache: 'no-store',
  });

  if (response.status === 404) return SEEDED_STORE;
  if (!response.ok) {
    throw new Error(`Could not load published store data (${response.status}).`);
  }

  const data = await response.json();
  if (
    !data ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.categories) ||
    !Array.isArray(data.promos) ||
    !Array.isArray(data.announcements) ||
    !data.settings ||
    typeof data.settings !== 'object' ||
    (data.collections !== undefined && !Array.isArray(data.collections)) ||
    (data.brandValues !== undefined && !Array.isArray(data.brandValues)) ||
    (data.storyBlocks !== undefined && !Array.isArray(data.storyBlocks))
  ) {
    throw new Error('Published store data is incomplete or has an invalid format.');
  }

  return {
    products: data.products.filter((product) => product.active !== false),
    categories: data.categories.filter((category) => category.enabled !== false),
    collections: data.collections ?? COLLECTIONS,
    brandValues: data.brandValues ?? BRAND_VALUES,
    storyBlocks: data.storyBlocks ?? STORY_BLOCKS,
    promos: data.promos,
    announcements: data.announcements.filter((announcement) => announcement.active !== false),
    settings: {
      ...FALLBACK_SETTINGS,
      ...data.settings,
      visibility: data.settings.visibility ?? {},
    },
  };
}

/**
 * Store data is read once at boot from the published `store-data.json`, which
 * is committed to the repository and served as a static file. There is no API
 * and no runtime backend.
 */
export function StoreProvider({ children }) {
  const [state, setState] = useState({
    products: [],
    categories: [],
    collections: COLLECTIONS,
    brandValues: BRAND_VALUES,
    storyBlocks: STORY_BLOCKS,
    promos: [],
    announcements: [],
    settings: FALLBACK_SETTINGS,
  });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setState(await loadPublishedStore());
      setError(null);
    } catch (err) {
      // Fall back to the bundled catalogue rather than showing an empty shop.
      setState(SEEDED_STORE);
      setError(err.message);
    }
    setStatus('ready');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const productsById = useMemo(
    () => Object.fromEntries(state.products.map((p) => [p.id, p])),
    [state.products],
  );

  const productsBySlug = useMemo(
    () => Object.fromEntries(state.products.map((p) => [p.slug, p])),
    [state.products],
  );

  const categoryMap = useMemo(
    () => Object.fromEntries(state.categories.map((c) => [c.slug, c])),
    [state.categories],
  );

  const value = useMemo(
    () => ({
      ...state,
      productsById,
      productsBySlug,
      categoryMap,
      activeAnnouncements: state.announcements.filter((a) => a.active !== false),
      status,
      error,
      // True when the published file failed to load and the bundled catalogue
      // is standing in for it.
      demoMode: status === 'ready' && Boolean(error),
      reload: load,
      assetUrl,
    }),
    [state, productsById, productsBySlug, categoryMap, status, error, load],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
