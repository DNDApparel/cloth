import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';
import { useStore } from '../../context/StoreContext';
import { IconButton } from '../ui/Button';
import { Drawer } from '../ui/Drawer';
import { CloseIcon } from '../ui/Icons';

export function MobileNav({ open, onClose }) {
  const wishlist = useWishlist();
  const { categories, settings } = useStore();
  const location = useLocation();
  const visibility = settings.visibility ?? {};

  // Close the menu whenever navigation happens.
  useEffect(() => {
    onClose();

  }, [location.pathname, location.search]);

  const [first, ...rest] = (settings.storeName ?? 'DND Store').split(' ');

  // Same rule as the desktop header: the shop filter lives partly in the
  // search string, so `NavLink`'s pathname matching would light up "New" and
  // a category at the same time.
  const shopCategory = location.pathname.startsWith('/shop/')
    ? location.pathname.slice('/shop/'.length)
    : location.pathname === '/shop'
      ? new URLSearchParams(location.search).get('category') ?? ''
      : null;

  return (
    <Drawer open={open} onClose={onClose} side="left" label="Site navigation">
      <header className="flex items-center justify-between border-b border-sand-200 px-6 py-5">
        <span className="font-[family-name:var(--font-display)] text-lg font-bold">
          {first}
          {rest.length > 0 && <span className="text-clay-500">{rest.join(' ')}</span>}
        </span>
        <IconButton label="Close menu" onClick={onClose}>
          <CloseIcon className="h-5 w-5" />
        </IconButton>
      </header>

      <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto px-6 py-6">
        <p className="dnd-eyebrow mb-3">Shop</p>
        <ul className="space-y-1">
          <li>
            <MobileLink to="/shop" active={shopCategory === ''}>
              All pieces
            </MobileLink>
          </li>
          {visibility.newArrivals !== false && (
            <li>
              <MobileLink
                to={shopCategory === 'new' ? '/shop' : '/shop?category=new'}
                active={shopCategory === 'new'}
              >
                New arrivals
              </MobileLink>
            </li>
          )}
          {categories.map((category) => {
            const active = shopCategory === category.slug;
            return (
              <li key={category.slug}>
                <MobileLink to={active ? '/shop' : `/shop/${category.slug}`} active={active}>
                  {category.name}
                </MobileLink>
              </li>
            );
          })}
        </ul>

        <p className="dnd-eyebrow mb-3 mt-8">Discover</p>
        <ul className="space-y-1">
          {visibility.collections !== false && (
            <li>
              <MobileLink to="/collections" active={location.pathname.startsWith('/collections')}>
                Collections
              </MobileLink>
            </li>
          )}
          {visibility.bulkOrder !== false && (
            <li>
              <MobileLink to="/bulk-order" active={location.pathname === '/bulk-order'}>
                Wholesale orders
              </MobileLink>
            </li>
          )}
          <li>
            <MobileLink to="/wishlist" active={location.pathname === '/wishlist'}>
              Wishlist ({wishlist.count})
            </MobileLink>
          </li>
          <li>
            <MobileLink to="/cart" active={location.pathname === '/cart'}>
              Bag
            </MobileLink>
          </li>
          <li>
            <MobileLink to="/feedback" active={location.pathname === '/feedback'}>
              Share feedback
            </MobileLink>
          </li>
        </ul>

        <p className="dnd-eyebrow mb-3 mt-8">Orders</p>
        <p className="text-sm leading-relaxed text-ink-500">
          Purchase enquiries are confirmed on WhatsApp before an order is accepted.
        </p>
      </nav>

      <footer className="border-t border-sand-200 px-6 py-5 text-xs text-ink-500">
        {settings.tagline}
      </footer>
    </Drawer>
  );
}

function MobileLink({ to, active = false, children }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={`block rounded-xl px-3 py-2.5 text-base transition-colors ${
        active ? 'bg-ink-900 text-sand-100' : 'hover:bg-sand-100'
      }`}
    >
      {children}
    </Link>
  );
}
