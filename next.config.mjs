/** @type {import('next').NextConfig} */
const nextConfig = {
  // Statický export — 100% klientská PWA, žádný server runtime.
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Kořen pro trasování souborů = tato složka (v nadřazené složce je cizí lockfile).
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
