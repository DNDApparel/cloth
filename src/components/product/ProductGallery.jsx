import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { assetUrl } from '../../utils/assetUrl';
import { colorImages, colorNames } from '../../data/products';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { classNames } from '../../utils/format';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '../ui/Icons';
import { ProductImage } from '../ui/ProductImage';

/**
 * PDP gallery. Images are per-colourway, so selecting a colour upstream moves
 * the gallery to the matching shot.
 *
 * Hovering does nothing but reveal the arrows — clicking the photo opens it
 * full screen, which works the same on touch devices where hover does not
 * exist.
 */
export function ProductGallery({ product, activeColor }) {
  const [imageIndex, setImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const colors = colorNames(product);
  const colorIndex = Math.max(0, colors.indexOf(activeColor));
  const current = product.colors[colorIndex] ?? product.colors[0];
  const images = colorImages(current);
  const selectedImageIndex = Math.min(imageIndex, Math.max(images.length - 1, 0));
  const currentImage = images[selectedImageIndex] ?? '';

  useEffect(() => {
    setImageIndex(0);
  }, [activeColor]);

  const step = useCallback(
    (direction) => {
      if (!images.length) return;
      setImageIndex((index) => {
        const from = Math.min(index, images.length - 1);
        return (from + direction + images.length) % images.length;
      });
    },
    [images.length],
  );

  return (
    <div className="flex flex-col gap-4">
      {images.length > 1 && (
        <div className="order-2 flex gap-3 overflow-x-auto pb-1" role="group" aria-label={`Photos of ${product.name} in ${current?.name}`}>
          {images.map((image, i) => (
            <button
              key={`${image}-${i}`}
              type="button"
              aria-pressed={i === selectedImageIndex}
              aria-label={`Show photo ${i + 1} of ${product.name} in ${current?.name}`}
              onClick={() => setImageIndex(i)}
              className={classNames(
                'h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 sm:h-24 sm:w-20',
                i === selectedImageIndex ? 'border-ink-900' : 'border-transparent opacity-65 hover:opacity-100',
              )}
            >
              <ProductImage src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="group order-1 relative overflow-hidden rounded-3xl bg-sand-200">
        <button
          type="button"
          onClick={() => currentImage && setLightboxOpen(true)}
          disabled={!currentImage}
          aria-label={
            currentImage
              ? `View photo ${selectedImageIndex + 1} of ${product.name} in ${current?.name} full screen`
              : 'No photo available'
          }
          className="block w-full cursor-zoom-in disabled:cursor-default"
        >
          <div className="aspect-[4/5]">
            <ProductImage
              src={currentImage}
              alt={`${product.name} in ${current?.name}, photo ${selectedImageIndex + 1}`}
              label="Photos coming soon"
              className="h-full w-full object-cover"
            />
          </div>
        </button>

        {images.length > 1 && (
          <>
            <GalleryArrow side="left" onClick={() => step(-1)} />
            <GalleryArrow side="right" onClick={() => step(1)} />
          </>
        )}

        <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-sand-50/90 px-3 py-1.5 text-[11px] font-medium backdrop-blur">
          {images.length
            ? `Photo ${selectedImageIndex + 1} of ${images.length} · ${current?.name}`
            : current?.name}
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          image={currentImage}
          alt={`${product.name} in ${current?.name}, photo ${selectedImageIndex + 1}`}
          caption={`${product.name} · ${current?.name} · Photo ${selectedImageIndex + 1} of ${images.length}`}
          hasSiblings={images.length > 1}
          onPrevious={() => step(-1)}
          onNext={() => step(1)}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

/** Full-screen photo viewer. Esc closes it, arrow keys move between photos. */
function Lightbox({ image, alt, caption, hasSiblings, onPrevious, onNext, onClose }) {
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useBodyScrollLock(true);

  useEffect(() => {
    triggerRef.current = document.activeElement;
    panelRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      } else if (hasSiblings && event.key === 'ArrowLeft') {
        onPrevious();
      } else if (hasSiblings && event.key === 'ArrowRight') {
        onNext();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef.current?.focus?.();
    };
  }, [hasSiblings, onClose, onNext, onPrevious]);

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      tabIndex={-1}
      className="fixed inset-0 z-[120] flex flex-col bg-ink-900/95"
    >
      {/* Clicking anywhere outside the photo dismisses the viewer. */}
      <button
        type="button"
        aria-label="Close full screen photo"
        onClick={onClose}
        className="absolute inset-0 cursor-zoom-out"
      />

      <div className="pointer-events-none relative flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8">
        <img
          src={assetUrl(image)}
          alt={alt}
          className="max-h-full max-w-full rounded-2xl object-contain shadow-[var(--shadow-lift)]"
        />
      </div>

      <div className="pointer-events-none relative px-4 pb-6 text-center">
        <p className="text-xs font-medium text-sand-300">{caption}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close full screen photo"
        className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-sand-50/90 text-ink-900 backdrop-blur transition-transform hover:scale-105 sm:right-6 sm:top-6"
      >
        <CloseIcon className="h-5 w-5" />
      </button>

      {hasSiblings && (
        <>
          <LightboxArrow side="left" onClick={onPrevious} />
          <LightboxArrow side="right" onClick={onNext} />
        </>
      )}
    </div>,
    document.body,
  );
}

function LightboxArrow({ side, onClick }) {
  const Icon = side === 'left' ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={classNames(
        'absolute top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full',
        'bg-sand-50/90 text-ink-900 backdrop-blur transition-transform hover:scale-105',
        side === 'left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6',
      )}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}

function GalleryArrow({ side, onClick }) {
  const Icon = side === 'left' ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      className={classNames(
        'absolute top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full',
        'bg-sand-50/90 opacity-0 backdrop-blur transition-opacity duration-200',
        'group-hover:opacity-100 focus-visible:opacity-100',
        side === 'left' ? 'left-4' : 'right-4',
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
