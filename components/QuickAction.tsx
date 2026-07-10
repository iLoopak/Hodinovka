import type { ReactNode } from "react";
import Link from "next/link";

/** Velká klikací akce (dashboard): ikona + popisek + doplněk. */
export function QuickAction({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  description?: string;
}) {
  return (
    <Link href={href} className="quick-action">
      <span className="qa-icon">{icon}</span>
      <span className="qa-label">{label}</span>
      {description && <span className="qa-desc">{description}</span>}
    </Link>
  );
}
