import { strings } from "@/lib/strings";
import { formatMoney, formatHours } from "@/lib/format";
import { IconWork, IconCoins, IconInvoices, IconCheck, IconArrowRight } from "@/components/icons";

const s = strings.prehled;

/**
 * Dominantní panel dashboardu: nevyfakturovaná hodnota (produktový příběh
 * práce → hodnota → faktura → zaplaceno). Bez dat ukáže uvítací stav.
 */
export function UnbilledHero({
  hasWork,
  value,
  minutes,
}: {
  hasWork: boolean;
  value: number;
  minutes: number;
}) {
  return (
    <section className="hero">
      {hasWork ? (
        <>
          <div className="hero-label">{s.unbilledLabel}</div>
          <div className="hero-value tnum">{formatMoney(value)}</div>
          <div className="hero-sub">{s.unbilledSub(formatHours(minutes))}</div>
        </>
      ) : (
        <>
          <div className="hero-value" style={{ fontSize: "var(--text-xl)" }}>
            {s.onboardingTitle}
          </div>
          <div className="hero-sub">{s.onboardingSub}</div>
        </>
      )}

      <div className="pipeline" aria-hidden="true">
        <span className="pipeline-step">
          <IconWork /> {s.pipelineWork}
        </span>
        <IconArrowRight className="pipeline-arrow" size={14} />
        <span className="pipeline-step">
          <IconCoins /> {s.pipelineValue}
        </span>
        <IconArrowRight className="pipeline-arrow" size={14} />
        <span className="pipeline-step">
          <IconInvoices /> {s.pipelineInvoice}
        </span>
        <IconArrowRight className="pipeline-arrow" size={14} />
        <span className="pipeline-step">
          <IconCheck /> {s.pipelinePaid}
        </span>
      </div>
    </section>
  );
}
