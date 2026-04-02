import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  env: {
    _next_intl_trailing_slash: "never"
  },
  async redirects() {
    return [
      {
        source: "/:locale/directory/teams",
        destination: "/:locale/directory/field-crews",
        permanent: true
      }
    ];
  },
  // Help browsers pick up new favicon/logo during development (favicons are cached aggressively).
  async headers() {
    return [
      {
        source: "/favicon.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }]
      },
      {
        source: "/yuklenicim-logo.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }]
      }
    ];
  }
};

export default withNextIntl(nextConfig);

