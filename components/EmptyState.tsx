import Link from "next/link";

export function EmptyState({
  emoji,
  title,
  hint,
  actionLabel,
  actionHref,
}: {
  emoji: string;
  title: string;
  hint: string;
  actionLabel: string;
  /** Když je zadáno, akční tlačítko je odkaz; jinak je jen dekorativní (disabled). */
  actionHref?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-emoji" aria-hidden="true">
        {emoji}
      </span>
      <p className="empty-title">{title}</p>
      <p>{hint}</p>
      {actionHref ? (
        <Link className="btn-primary" href={actionHref}>
          {actionLabel}
        </Link>
      ) : (
        <button className="btn-primary" type="button" disabled>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
