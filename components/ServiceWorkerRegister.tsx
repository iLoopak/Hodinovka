"use client";

import { useEffect } from "react";

/**
 * Zaregistruje service worker (public/sw.js) pro offline shell caching.
 * Běží jen v produkci, aby nekomplikoval vývoj (hot reload).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Registrace service workeru selhala:", err);
    });
  }, []);

  return null;
}
