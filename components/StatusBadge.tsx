import type { ReactNode } from "react";
import type { BadgeTone, BadgeSpec } from "@/lib/status";

/**
 * Odznak stavu — barva + text (nikdy jen barva). Volitelně ikona.
 * Přijme buď `spec` ({ tone, label }) z lib/status, nebo přímo tone+label.
 */
export function StatusBadge({
  spec,
  tone,
  label,
  icon,
}: {
  spec?: BadgeSpec;
  tone?: BadgeTone;
  label?: string;
  icon?: ReactNode;
}) {
  const t = spec?.tone ?? tone ?? "neutral";
  const l = spec?.label ?? label ?? "";
  return (
    <span className={`badge badge-${t}`}>
      {icon}
      {l}
    </span>
  );
}
