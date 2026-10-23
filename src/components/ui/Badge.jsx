import { BADGE_STYLES } from '../../data/taxonomy';
import { classNames } from '../../utils/format';

export function Badge({ tag, className }) {
  const style = BADGE_STYLES[tag];
  if (!style) return null;

  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
        style.className,
        className,
      )}
    >
      {style.label}
    </span>
  );
}

