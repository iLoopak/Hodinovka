import { strings } from "@/lib/strings";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { IconInvoices } from "@/components/icons";

export default function FakturyPage() {
  return (
    <>
      <PageHeader title={strings.faktury.title} />
      <EmptyState
        icon={<IconInvoices />}
        title={strings.faktury.upcomingTitle}
        description={strings.faktury.upcomingHint}
      />
    </>
  );
}
