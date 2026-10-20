import { useEffect, useState } from 'react';
import { MAX_LINE_QUANTITY } from '../../utils/cart';
import { classNames } from '../../utils/format';
import { MinusIcon, PlusIcon } from './Icons';

/**
 * Quantity control with +/- buttons and a typable field.
 *
 * Wholesale minimums run to 30 pieces and the ceiling is 100, so stepping one
 * at a time is not practical — the number itself is an input.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = MAX_LINE_QUANTITY,
  size = 'md',
  label = 'Quantity',
}) {
  const buttonSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  // Mirrors `value` but tolerates the transient empty string while typing.
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function commit(raw) {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(Math.max(parsed, min), max);
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  }

  return (
    <div
      className={classNames(
        'inline-flex items-center rounded-full border border-sand-300 bg-white',
        size === 'sm' && 'text-sm',
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={classNames(
          buttonSize,
          'inline-flex items-center justify-center rounded-full transition-colors',
          'hover:bg-sand-100 disabled:opacity-30 disabled:hover:bg-transparent',
        )}
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        aria-label={label}
        onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, ''))}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit(event.currentTarget.value);
            event.currentTarget.blur();
          }
        }}
        className="w-10 bg-transparent text-center text-sm font-medium tabular-nums outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
        className={classNames(
          buttonSize,
          'inline-flex items-center justify-center rounded-full transition-colors',
          'hover:bg-sand-100 disabled:opacity-30 disabled:hover:bg-transparent',
        )}
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
