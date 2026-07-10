import type { ReactNode } from "react";

/**
 * Hlavička stránky: volitelný nadtitulek (eyebrow), titulek, podtitulek
 * a akce vpravo (např. tlačítko „Nový…").
 */
export function PageHeader({
  title,
  eyebrow,
  subtitle,
  action,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="ph-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="ph-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="ph-action">{action}</div>}
    </header>
  );
}
