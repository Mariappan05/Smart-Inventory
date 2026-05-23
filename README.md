# Smart Product Inventory

Enterprise-grade inventory and QR tracking dashboard built with Next.js 15, TypeScript, Prisma, and Tailwind CSS.

## Stack

- Next.js App Router
- TypeScript
- Prisma ORM + PostgreSQL
- Tailwind CSS
- Socket.IO

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed.

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smart_product_inventory?schema=public"
JWT_SECRET="replace-with-secure-secret"
NEXT_PUBLIC_APP_NAME="Smart Product Inventory"
SEED_ADMIN_EMAIL="admin@your-company.local"
SEED_ADMIN_PASSWORD="use-a-strong-password"
SEED_EMPLOYEE_EMAIL="operator@your-company.local"
SEED_EMPLOYEE_PASSWORD="use-a-strong-password"
```

## Scripts

```
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Notes

- MVC structure lives in `src/controllers`, `src/services`, `src/repositories`, and `src/views`.
- The dashboard UI uses the theme tokens in `src/app/globals.css`.
