import type { ReactNode } from "react";
import Link from "next/link";
import { IconChevronRight } from "@/components/icons";

/**
 * Kompaktní informační řádek do seznamu.
 * Když je zadáno `href`, celý řádek je odkaz s šipkou.
 */
export function ListRow({
  href,
  leading,
  title,
  subtitle,
  meta,
  showChevron = true,
}: {
  href?: string;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  showChevron?: boolean;
}) {
  const inner = (
    <>
      {leading}
      <div className="lr-body">
        <div className="lr-title">{title}</div>
        {subtitle && <div className="lr-sub">{subtitle}</div>}
      </div>
      {meta && <div className="lr-meta">{meta}</div>}
      {href && showChevron && (
        <span className="lr-chevron">
          <IconChevronRight />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="list-row">
        {inner}
      </Link>
    );
  }
  return <div className="list-row">{inner}</div>;
}
