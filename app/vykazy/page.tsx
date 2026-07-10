import { strings } from "@/lib/strings";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { IconWork } from "@/components/icons";

export default function VykazyPage() {
  return (
    <>
      <PageHeader title={strings.vykazy.title} />
      <EmptyState
        icon={<IconWork />}
        title={strings.vykazy.upcomingTitle}
        description={strings.vykazy.upcomingHint}
      />
    </>
  );
}
