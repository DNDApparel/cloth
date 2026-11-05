import { useEffect } from 'react';
import { classNames } from '../../utils/format';

/**
 * Size selector that visually distinguishes available, low-stock and sold-out sizes.
 *
 * The store currently stocks a single size (XXL), so when a product offers only
 * one there is nothing to choose: the size is selected automatically and shown
 * as a plain label rather than a one-button picker. The component keeps the
 * multi-size branch so the range can grow without touching any call site.
 */
export function SizePicker({ sizes, value, onChange, stockBySize = {}, size = 'md' }) {
  const dimensions = size === 'sm' ? 'h-9 min-w-11 text-xs' : 'h-12 min-w-14 text-sm';

  const onlySize = sizes.length === 1 ? sizes[0] : null;
  const onlySizeInStock = onlySize ? (stockBySize[onlySize] ?? 0) > 0 : false;

  // Pre-select the single size so "Add to bag" works in one tap. Sold-out
  // styles are left unselected, which keeps the disabled button honest.
  useEffect(() => {
    if (onlySize && onlySizeInStock && value !== onlySize) onChange(onlySize);
  }, [onlySize, onlySizeInStock, value, onChange]);

  if (onlySize) {
    return (
      <p
        className={classNames(
          'inline-flex items-center gap-2 rounded-xl border border-sand-300 bg-sand-100 px-3 py-2 font-medium',
          size === 'sm' ? 'text-xs' : 'text-sm',
        )}
      >
        <span>{onlySize}</span>
        <span className="font-normal text-ink-500">
          {onlySizeInStock ? '— the only size we stock' : '— sold out'}
        </span>
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((option) => {
        const stock = stockBySize[option] ?? 0;
        const soldOut = stock <= 0;
        const selected = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => !soldOut && onChange(option)}
            disabled={soldOut}
            aria-pressed={selected}
            title={soldOut ? `${option} — sold out` : `${option} — ${stock} in stock`}
            className={classNames(
              dimensions,
              'relative inline-flex items-center justify-center rounded-xl border px-3 font-medium transition-all duration-200',
              selected
                ? 'border-ink-900 bg-ink-900 text-sand-100'
                : 'border-sand-300 bg-white hover:border-ink-900',
              soldOut &&
                'cursor-not-allowed border-sand-200 bg-sand-100 text-sand-400 hover:border-sand-200',
            )}
          >
            {option}
            {soldOut && (
              <span
                aria-hidden="true"
                className="absolute inset-x-1.5 top-1/2 h-px -rotate-12 bg-sand-400"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
