"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { strings } from "@/lib/strings";
import {
  IconOverview,
  IconWork,
  IconClients,
  IconInvoices,
  IconSettings,
} from "@/components/icons";

const items = [
  { href: "/", label: strings.nav.prehled, Icon: IconOverview, exact: true },
  { href: "/vykazy", label: strings.nav.prace, Icon: IconWork },
  { href: "/klienti", label: strings.nav.klienti, Icon: IconClients },
  { href: "/faktury", label: strings.nav.faktury, Icon: IconInvoices },
  { href: "/nastaveni", label: strings.nav.nastaveni, Icon: IconSettings },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label={strings.app.name}>
      <div className="nav-brand">
        <Image src="/icon.svg" alt="" width={30} height={30} priority />
        <span>{strings.app.name}</span>
      </div>
      {items.map(({ href, label, Icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="nav-item"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            <Icon />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
