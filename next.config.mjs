/** @type {import('next').NextConfig} */
const nextConfig = {
  // Statický export — 100% klientská PWA, žádný server runtime.
  // (ARES proxy v Fázi 1 poběží jako samostatná Vercel Edge Function mimo tento export.)
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
