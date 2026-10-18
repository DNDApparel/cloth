import { useEffect, useState } from 'react';
import { colorImages, colorNames } from '../../data/products';
import { classNames } from '../../utils/format';
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/Icons';
import { ProductImage } from '../ui/ProductImage';

/**
 * PDP gallery. Images are per-colourway, so selecting a colour upstream moves
 * the gallery to the matching shot.
 */
export function ProductGallery({ product, activeColor }) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [imageIndex, setImageIndex] = useState(0);

  const colors = colorNames(product);
  const colorIndex = Math.max(0, colors.indexOf(activeColor));
  const current = product.colors[colorIndex] ?? product.colors[0];
  const images = colorImages(current);
  const selectedImageIndex = Math.min(imageIndex, Math.max(images.length - 1, 0));
  const currentImage = images[selectedImageIndex] ?? '';

  useEffect(() => {
    setImageIndex(0);
  }, [activeColor]);

  function step(direction) {
    if (!images.length) return;
    setImageIndex((selectedImageIndex + direction + images.length) % images.length);
  }

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  }

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

      <div
        className="group order-1 relative overflow-hidden rounded-3xl bg-sand-200"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <div className="aspect-[4/5]">
          <ProductImage
            src={currentImage}
            alt={`${product.name} in ${current?.name}, photo ${selectedImageIndex + 1}`}
            label="Photos coming soon"
            className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out-soft)]"
            style={{
              transform: zoomed ? 'scale(1.6)' : 'scale(1)',
              transformOrigin: `${origin.x}% ${origin.y}%`,
            }}
          />
        </div>

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
    </div>
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
