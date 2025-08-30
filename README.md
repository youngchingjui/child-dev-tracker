This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Prisma setup

- The Prisma Client is generated automatically on install via the `postinstall` script.
- Configure your database connection string via `DATABASE_URL`.
  - Local development: copy `.env.example` to `.env.local` and set `DATABASE_URL`.
  - Vercel: set `DATABASE_URL` in Project Settings → Environment Variables. Vercel injects env vars at build and runtime, and Prisma Client will use `process.env.DATABASE_URL`.
- The Prisma schema lives in `prisma/schema.prisma`. Update it and run:

```bash
npm run prisma:generate
```

> Note: Prisma CLI reads environment variables from `.env` files. While Next.js also supports `.env.local`, Prisma commands run fine without a database connection for `prisma generate`. For commands that need a DB (e.g. `migrate`), either define `DATABASE_URL` in `.env` or export it in your shell before running Prisma commands.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

