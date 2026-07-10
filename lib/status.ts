import type { Project } from "@/lib/db";
import { projectStatus } from "@/lib/project";
import { strings } from "@/lib/strings";

/** Tón odznaku — barevná rodina ve vizuálním systému. */
export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

export interface BadgeSpec {
  tone: BadgeTone;
  label: string;
}

/** Odznak stavu projektu (odvozeno z dat projektu). */
export function projectBadge(project: Project): BadgeSpec {
  return projectStatus(project) === "ended"
    ? { tone: "neutral", label: strings.projekty.statusEnded }
    : { tone: "success", label: strings.projekty.statusActive };
}

/**
 * Prezentační stavy faktury — připraveno pro budoucí sekci Faktury.
 * (Business logika fakturace zatím není implementovaná; tady jen mapujeme
 * stav na vzhled odznaku.)
 */
export type InvoiceStatusView = "draft" | "issued" | "dueSoon" | "overdue" | "paid";

export function invoiceBadge(status: InvoiceStatusView): BadgeSpec {
  const s = strings.faktury.statuses;
  switch (status) {
    case "draft":
      return { tone: "neutral", label: s.draft };
    case "issued":
      return { tone: "accent", label: s.issued };
    case "dueSoon":
      return { tone: "warning", label: s.dueSoon };
    case "overdue":
      return { tone: "danger", label: s.overdue };
    case "paid":
      return { tone: "success", label: s.paid };
  }
}
