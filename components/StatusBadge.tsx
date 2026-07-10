import type { ProjectStatus } from "@/lib/project";
import { strings } from "@/lib/strings";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const label =
    status === "ended" ? strings.projekty.statusEnded : strings.projekty.statusActive;
  return <span className={`badge badge-${status}`}>{label}</span>;
}
