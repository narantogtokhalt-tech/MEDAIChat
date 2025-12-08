// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React-ийн strict mode (зөвлөмжит тохиргоо)
  reactStrictMode: true,

  // Redirect-ууд
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "https://docs.netlify.com/frameworks/next-js/overview/",
        permanent: false,
      },
      {
        source: "/old-blog/:slug",
        destination: "/classics",
        permanent: true,
      },
      {
        source: "/github",
        destination: "https://github.com/netlify-templates/next-platform-starter",
        permanent: false,
      },
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ];
  },

  // Rewrites
  async rewrites() {
    return [
      {
        source: "/api/health",
        destination: "/quotes/random",
      },
      {
        source: "/blog",
        destination: "/classics",
      },
    ];
  },
};

export default nextConfig;