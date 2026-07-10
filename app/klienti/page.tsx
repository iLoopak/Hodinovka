import { strings } from "@/lib/strings";
import { EmptyState } from "@/components/EmptyState";

export default function KlientiPage() {
  return (
    <>
      <header className="page-header">
        <h1>{strings.klienti.title}</h1>
      </header>
      <EmptyState
        emoji="👥"
        title={strings.klienti.empty}
        hint={strings.klienti.emptyHint}
        actionLabel={strings.klienti.add}
      />
    </>
  );
}
