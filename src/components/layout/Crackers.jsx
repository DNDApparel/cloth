import { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';

/**
 * Diwali fireworks.
 *
 * Purely decorative, so it is `aria-hidden` and `pointer-events: none`, and it
 * sits behind the page rather than over it — a festive backdrop, not an
 * overlay a shopper has to read through.
 *
 * Everything animates in CSS from a handful of custom properties, so the
 * browser can run it on the compositor; there is no per-frame JavaScript and
 * no canvas. `prefers-reduced-motion` hides the layer entirely (see
 * `index.css`).
 *
 * Controlled by `settings.crackers.enabled`, so the effect can be switched off
 * when the festival is over without a code change.
 */

/** Warm festival palette — golds, marigold and a single festive pink. */
const COLORS = ['#ffd24a', '#ff9f1c', '#ff5f6d', '#f72585', '#8ecae6', '#c77dff'];

const SPARKS_PER_BURST = 12;

/**
 * Hand-placed launch points.
 *
 * Spread across the viewport with staggered delays so bursts never land
 * together, and biased towards the edges to leave the centre — where the
 * content sits — comparatively clear.
 */
const LAUNCHES = [
  { left: '8%', rise: '46vh', delay: '0s', duration: '4.6s', scale: 1 },
  { left: '22%', rise: '34vh', delay: '1.4s', duration: '5.2s', scale: 0.8 },
  { left: '38%', rise: '52vh', delay: '2.9s', duration: '4.9s', scale: 0.9 },
  { left: '58%', rise: '38vh', delay: '0.8s', duration: '5.6s', scale: 0.75 },
  { left: '74%', rise: '50vh', delay: '2.2s', duration: '4.4s', scale: 1 },
  { left: '90%', rise: '42vh', delay: '3.6s', duration: '5.1s', scale: 0.85 },
];

export function Crackers() {
  const { settings } = useStore();
  const enabled = settings.crackers?.enabled;

  // Colours are assigned once per mount: re-rolling them on every render would
  // make each burst change colour mid-flight.
  const shells = useMemo(
    () =>
      LAUNCHES.map((launch, index) => ({
        ...launch,
        color: COLORS[index % COLORS.length],
      })),
    [],
  );

  if (!enabled) return null;

  return (
    <div className="dnd-crackers" aria-hidden="true">
      {shells.map((shell) => (
        <span
          key={shell.left}
          className="dnd-cracker"
          style={{
            left: shell.left,
            color: shell.color,
            '--rise': shell.rise,
            '--delay': shell.delay,
            '--duration': shell.duration,
          }}
        >
          <span className="dnd-cracker__shell" />
          <span className="dnd-cracker__burst">
            {Array.from({ length: SPARKS_PER_BURST }, (_, spark) => (
              <span
                key={spark}
                className="dnd-spark"
                style={{
                  '--angle': `${(360 / SPARKS_PER_BURST) * spark}deg`,
                  '--spread': `${Math.round(46 * shell.scale)}px`,
                }}
              />
            ))}
          </span>
        </span>
      ))}
    </div>
  );
}
