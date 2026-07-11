"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "@/lib/db";
import { PROFILE_ID, ACCENT_VARS, accentTokens } from "@/lib/profile";

/**
 * Aplikuje uživatelem zvolený akcent z firemního profilu na celou aplikaci
 * (CSS proměnné na <html>). Když profil akcent nemá, ponechá výchozí barvy
 * z globals.css. Nic nevykresluje.
 */
export function AccentProvider() {
  // undefined = načítám, null = bez vlastního akcentu, string = hex.
  const accent = useLiveQuery(
    () => getDb().businessProfile.get(PROFILE_ID).then((p) => p?.accentColor ?? null),
    []
  );

  useEffect(() => {
    if (accent === undefined) return; // ještě nenačteno – necháme default
    const root = document.documentElement;
    if (accent) {
      const tokens = accentTokens(accent);
      for (const [k, v] of Object.entries(tokens)) root.style.setProperty(k, v);
    } else {
      for (const k of ACCENT_VARS) root.style.removeProperty(k);
    }
  }, [accent]);

  return null;
}
