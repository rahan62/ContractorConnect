import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  env: {
    _next_intl_trailing_slash: "never"
  }
};

export default withNextIntl(nextConfig);

