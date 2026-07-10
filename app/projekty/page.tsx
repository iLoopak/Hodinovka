import { strings } from "@/lib/strings";
import { EmptyState } from "@/components/EmptyState";

export default function ProjektyPage() {
  return (
    <>
      <header className="page-header">
        <h1>{strings.projekty.title}</h1>
      </header>
      <EmptyState
        emoji="📁"
        title={strings.projekty.empty}
        hint={strings.projekty.emptyHint}
        actionLabel={strings.projekty.add}
      />
    </>
  );
}
