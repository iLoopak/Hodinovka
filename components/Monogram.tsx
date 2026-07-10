/**
 * Střídmý monogram klienta — 1–2 iniciály v jemné akcentní dlaždici.
 * Vědomě jednobarevný (žádná duhová paleta), aby seznam působil klidně.
 */
export function Monogram({
  name,
  size = "md",
}: {
  name: string;
  size?: "md" | "lg";
}) {
  const initials = deriveInitials(name);
  return (
    <span className="monogram" data-size={size} aria-hidden="true">
      {initials}
    </span>
  );
}

function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
