export function EmptyState({
  emoji,
  title,
  hint,
  actionLabel,
}: {
  emoji: string;
  title: string;
  hint: string;
  actionLabel: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-emoji" aria-hidden="true">
        {emoji}
      </span>
      <p className="empty-title">{title}</p>
      <p>{hint}</p>
      {/* Akce zatím bez funkce — přijde v dalších fázích. */}
      <button className="btn-primary" type="button" disabled>
        {actionLabel}
      </button>
    </div>
  );
}
