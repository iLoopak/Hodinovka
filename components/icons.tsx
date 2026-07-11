/**
 * Jednotná sada ikon (line, stroke 1.75, currentColor, zaoblené konce).
 * Dekorativní ve výchozím stavu (aria-hidden); pro samostatné použití
 * předej `title` / `aria-label` u rodičovského prvku.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconOverview = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 13h7V4H4v9Zm9 7h7v-9h-7v9ZM4 20h7v-4H4v4Zm9-13h7V4h-7v3Z" />
  </Icon>
);

export const IconWork = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 1.5M9 2h6" />
  </Icon>
);

export const IconClients = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.2a3.2 3.2 0 0 1 0 6M17.5 14.5a5.5 5.5 0 0 1 3 5" />
  </Icon>
);

export const IconInvoices = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3h9l4 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v4h4M9 12h6M9 16h4" />
  </Icon>
);

export const IconPlus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const IconSearch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </Icon>
);

export const IconChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

export const IconArrowLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 12H5m6-7-7 7 7 7" />
  </Icon>
);

export const IconEdit = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17v3Z" />
    <path d="M14 7l3 3" />
  </Icon>
);

export const IconTrash = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </Icon>
);

export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

export const IconAlert = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 9v4M12 17h.01M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </Icon>
);

export const IconInbox = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 13h4l2 3h6l2-3h4" />
    <path d="M5 5h14l2 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6L5 5Z" />
  </Icon>
);

export const IconFolder = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6Z" />
  </Icon>
);

export const IconCoins = (p: IconProps) => (
  <Icon {...p}>
    <ellipse cx="9" cy="7" rx="5.5" ry="2.6" />
    <path d="M3.5 7v5c0 1.4 2.5 2.6 5.5 2.6M14.5 9.4c3 0 5.5 1.2 5.5 2.6M9 12v5c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-5" />
  </Icon>
);

export const IconArrowRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14m-7-7 7 7-7 7" />
  </Icon>
);

export const IconSettings = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5a1 1 0 0 1 1 1v.6a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.4-.4a1 1 0 0 1 1.4 1.4l-.4.4a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.6a1 1 0 0 1 0 2h-.6a1 1 0 0 0-.9.6 1 1 0 0 0 .2 1.1l.4.4a1 1 0 0 1-1.4 1.4l-.4-.4a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9v.6a1 1 0 0 1-2 0v-.6a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.4.4a1 1 0 0 1-1.4-1.4l.4-.4a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6h-.6a1 1 0 0 1 0-2h.6a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.4-.4a1 1 0 0 1 1.4-1.4l.4.4a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9v-.6a1 1 0 0 1 1-1Z" />
  </Icon>
);

export const IconImage = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L16 17m-2-3 1.5-1.5a2 2 0 0 1 2.8 0L20 14" />
  </Icon>
);

export const IconDownload = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" />
  </Icon>
);

export const IconShare = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v13M12 3 8 7m4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
  </Icon>
);

export const IconPlay = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4.5v15l12-7.5-12-7.5Z" fill="currentColor" stroke="none" />
  </Icon>
);

export const IconStop = (p: IconProps) => (
  <Icon {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
  </Icon>
);
