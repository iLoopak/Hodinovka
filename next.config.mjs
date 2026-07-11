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
  webpack: (config, { webpack }) => {
    // Export PDF (@react-pdf/renderer) běží v prohlížeči a jeho závislost
    // pdfkit očekává globální Buffer/process. Webpack 5 je automaticky
    // nedodává, takže je doplníme z polyfillů (jinak selže až za běhu).
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
        process: "process/browser",
      })
    );
    return config;
  },
};

export default nextConfig;
