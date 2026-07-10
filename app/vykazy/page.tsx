import { strings } from "@/lib/strings";
import { EmptyState } from "@/components/EmptyState";

export default function VykazyPage() {
  return (
    <>
      <header className="page-header">
        <h1>{strings.vykazy.title}</h1>
      </header>
      <EmptyState
        emoji="⏱️"
        title={strings.vykazy.empty}
        hint={strings.vykazy.emptyHint}
        actionLabel={strings.vykazy.add}
      />
    </>
  );
}
