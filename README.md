This is a Next.js project bootstrapped with create-next-app.

Features
- Add, edit, and delete children
- Track growth measurements (date, height cm, weight kg, optional note) per child
- Automatic BMI calculation for each measurement
- Clean, responsive UI built with Tailwind CSS v4
- Data is stored locally in your browser (localStorage) for simplicity

Getting Started

First, run the development server:

```bash
npm run dev
# or
pnpm dev
```

Open http://localhost:3000 with your browser to see the app.

Notes
- Your data is persisted in localStorage under the key "children".
- If you had an older version that only stored children without measurements, the app will migrate them automatically and initialize empty measurement lists.

Prisma setup

- The Prisma Client is generated automatically on install via the postinstall script.
- If you later want to persist data to a real database, define models in prisma/schema.prisma and wire API routes; for now, the app uses localStorage only.
- Configure your database connection string via DATABASE_URL if you go that route.

Learn More
- Next.js Documentation: https://nextjs.org/docs
- Tailwind CSS v4: https://tailwindcss.com/docs

