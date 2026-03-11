## ContractorConnect – Main App

This is a reconstruction of the main ContractorConnect web application based on the architecture docs in this folder.

- **Stack**: Next.js App Router, TypeScript, Tailwind CSS, NextAuth (credentials), Prisma (PostgreSQL), `next-intl`, Resend, Cloudflare Turnstile.
- **Status**: Core config, Prisma schema, basic auth/i18n/theming helpers, and layout are scaffolded; pages and API routes should be added following the docs (`/[locale]/auth/signin`, `/[locale]/auth/register`, `/[locale]/profile`, contracts, pricing, upload + auth/register/verify-email APIs, etc.).
- **Next steps**:
  - Run `npm install` then `npx prisma migrate dev` with a valid `DATABASE_URL`.
  - Implement the described pages and routes inside `app/[locale]/...` as per the markdown specs.

