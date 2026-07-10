import { strings } from "@/lib/strings";
import { EmptyState } from "@/components/EmptyState";

export default function FakturyPage() {
  return (
    <>
      <header className="page-header">
        <h1>{strings.faktury.title}</h1>
      </header>
      <EmptyState
        emoji="🧾"
        title={strings.faktury.empty}
        hint={strings.faktury.emptyHint}
        actionLabel={strings.faktury.add}
      />
    </>
  );
}
