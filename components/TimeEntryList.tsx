import Link from "next/link";
import type { TimeEntry, Client, Project } from "@/lib/db";
import { strings } from "@/lib/strings";
import { formatHours, formatDuration, formatDayLabel } from "@/lib/format";
import { groupByDay } from "@/lib/time";
import { StatusBadge } from "@/components/StatusBadge";
import { IconChevronRight } from "@/components/icons";

const s = strings.vykazy;

/**
 * Záznamy práce jako časová osa seskupená po dnech.
 * Doba je zdůrazněná vlevo, stav vyfakturování je druhotný (odznak vpravo).
 */
export function TimeEntryList({
  entries,
  clients,
  projects,
  showClient = true,
}: {
  entries: TimeEntry[];
  clients: Client[];
  projects: Project[];
  showClient?: boolean;
}) {
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const groups = groupByDay(entries);

  return (
    <div className="work-timeline">
      {groups.map((g) => (
        <div className="day-group" key={g.date}>
          <div className="day-head">
            <span>{formatDayLabel(g.date)}</span>
            <span className="tnum">{formatDuration(g.minutes)}</span>
          </div>
          <div className="list">
            {g.entries.map((e) => {
              const project = e.projectId != null ? projectById.get(e.projectId) : undefined;
              const client = clientById.get(e.clientId);
              const primary = project?.name ?? client?.name ?? "—";
              const parts: string[] = [];
              if (project && showClient && client) parts.push(client.name);
              if (e.description) parts.push(e.description);
              return (
                <Link key={e.id} href={`/vykazy/upravit/?id=${e.id}`} className="list-row">
                  <span className="dur tnum">{formatHours(e.durationMinutes)} h</span>
                  <div className="lr-body">
                    <div className="lr-title">{primary}</div>
                    {parts.length > 0 && <div className="lr-sub">{parts.join(" · ")}</div>}
                  </div>
                  <StatusBadge
                    tone={e.billed ? "success" : "neutral"}
                    label={e.billed ? s.billedBadge : s.unbilledBadge}
                  />
                  <span className="lr-chevron">
                    <IconChevronRight />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
