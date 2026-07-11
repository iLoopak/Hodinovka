import type { CapacitorConfig } from "@capacitor/cli";

// Hodinovka běží jako 100% klientská statická PWA. Capacitor jen zabalí
// statický export Next.js (`out/`) do nativní Android WebView — žádný server.
const config: CapacitorConfig = {
  appId: "com.iloopak.hodinovka",
  appName: "Hodinovka",
  webDir: "out",
};

export default config;
