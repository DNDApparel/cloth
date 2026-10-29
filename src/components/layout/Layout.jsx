import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { Header } from './Header';
import { Footer } from './Footer';
import { BannerPopup } from './BannerPopup';
import { Crackers } from './Crackers';
import { CartDrawer } from '../cart/CartDrawer';
import { Toaster } from '../ui/Toaster';
import { Button } from '../ui/Button';

export function Layout() {
  const { pathname } = useLocation();
  const { status, error, reload, demoMode } = useStore();

  // Restore scroll position on navigation — routers don't do this for you.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
        <p className="dnd-eyebrow">Something went wrong</p>
        <h1 className="max-w-md text-3xl font-bold">We can't load the shop right now.</h1>
        <p className="max-w-sm text-sm text-ink-500">{error}</p>
        <Button onClick={reload}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Decorative backdrop. Everything below is lifted above it with
          `relative`, so the fireworks never intercept a click. */}
      <Crackers />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-3 focus:text-sm focus:text-sand-100"
      >
        Skip to content
      </a>

      <div className="relative z-10 flex flex-1 flex-col">
        <Header />

        {demoMode && (
          <p role="status" className="bg-sand-200 px-4 py-2 text-center text-xs text-ink-700">
            Showing the bundled catalogue because the published store data could not be loaded.
            Prices and stock may be out of date.
          </p>
        )}

        <main id="main" className="flex-1">
          <Outlet />
        </main>

        <Footer showCollections={pathname !== '/checkout'} />
      </div>
      <CartDrawer />
      <BannerPopup />
      <Toaster />
    </div>
  );
}
