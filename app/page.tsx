"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { strings } from "@/lib/strings";

// Kořen appky zatím jen přesměruje na první sekci (Klienti).
// V Fázi 8 sem přijde dashboard.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/klienti");
  }, [router]);

  return <p style={{ color: "var(--text-muted)" }}>{strings.common.loading}</p>;
}
