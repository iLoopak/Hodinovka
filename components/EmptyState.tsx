import type { ReactNode } from "react";
import Link from "next/link";
import { IconInbox } from "@/components/icons";

/**
 * Střídmý prázdný / „připravujeme" stav.
 * - `actionHref` → akce je odkaz,
 * - jinak `actionLabel` bez href → čestně zakázané tlačítko (funkce zatím není).
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="empty-state">
      <span className="es-icon">{icon ?? <IconInbox />}</span>
      <div className="es-title">{title}</div>
      {description && <p className="es-desc">{description}</p>}
      {actionLabel &&
        (actionHref ? (
          <div className="es-action">
            <Link className="btn btn-primary" href={actionHref}>
              {actionLabel}
            </Link>
          </div>
        ) : (
          <div className="es-action">
            <button className="btn btn-secondary" type="button" disabled>
              {actionLabel}
            </button>
          </div>
        ))}
    </div>
  );
}
