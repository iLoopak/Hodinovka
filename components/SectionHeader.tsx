import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Nadpis sekce (uvnitř detailu/panelu) s volitelnou akcí vpravo.
 * `action` může být odkaz ({ href, label }) nebo libovolný uzel.
 */
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { href: string; label: ReactNode } | ReactNode;
}) {
  const isLink =
    action != null &&
    typeof action === "object" &&
    "href" in (action as Record<string, unknown>);

  return (
    <div className="section-header">
      <h2>{title}</h2>
      {isLink ? (
        <Link
          className="section-action"
          href={(action as { href: string }).href}
        >
          {(action as { label: ReactNode }).label}
        </Link>
      ) : (
        (action as ReactNode)
      )}
    </div>
  );
}
