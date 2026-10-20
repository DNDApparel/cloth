import { useEffect, useState } from 'react';
import { assetUrl } from '../../api/client';
import { classNames } from '../../utils/format';

/**
 * An `<img>` that degrades to a neutral placeholder.
 *
 * Most of the catalogue has no photography yet, and a bare `<img>` with an
 * empty `src` renders the browser's broken-image glyph. This keeps those tiles
 * looking deliberate until real photos are uploaded.
 */
export function ProductImage({ src, alt = '', className, label = 'Photo coming soon', ...props }) {
  const [failed, setFailed] = useState(false);
  const resolved = src ? assetUrl(src) : '';

  // A colour swap can point at a different (or missing) file, so reset the
  // error flag whenever the source changes.
  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved || failed) {
    return (
      <div
        role="img"
        aria-label={alt || label}
        className={classNames(
          'flex items-center justify-center bg-sand-200 text-center',
          className,
        )}
      >
        <span className="px-2 text-[10px] font-medium uppercase tracking-[0.12em] text-ink-500">
          {label}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
