"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { strings } from "@/lib/strings";

const items = [
  { href: "/klienti", label: strings.nav.klienti, icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21a8 8 0 0 1 16 0" },
  { href: "/projekty", label: strings.nav.projekty, icon: "M3 7h18M3 7l1.5 12a2 2 0 0 0 2 1.9h11a2 2 0 0 0 2-1.9L21 7M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" },
  { href: "/vykazy", label: strings.nav.vykazy, icon: "M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  { href: "/faktury", label: strings.nav.faktury, icon: "M8 7h8M8 11h8M8 15h5M6 3h12a1 1 0 0 1 1 1v17l-3-2-2 2-2-2-2 2-2-2-3 2V4a1 1 0 0 1 1-1Z" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label={strings.app.name}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link key={item.href} href={item.href} data-active={active}>
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
