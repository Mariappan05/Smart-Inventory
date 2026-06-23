# Smart Machine Inventory

Enterprise-grade inventory management and QR tracking system for manufacturing operations.

## Overview

Smart Machine Inventory is a comprehensive web application designed to manage tools, components, production schedules, and inventory tracking for manufacturing environments. The system features role-based access control, real-time updates, and multi-store support.

## Features

- **Inventory Management**: Track tools, components, and products across multiple stores
- **QR Code Integration**: Scan and track items using QR codes
- **Production Scheduling**: Create and manage tentative and final monthly schedules
- **Tool Entry System**: Add and manage tools with operations, suppliers, and lifecycle tracking
- **Role-Based Access Control**: Admin, Store Manager, Employee, and specialized roles
- **Store Filtering**: Users only see data relevant to their assigned store
- **Product Entry**: Create products with raw material tracking
- **Real-time Updates**: Socket.IO for live notifications and updates
- **Supplier Management**: Track suppliers, purchase orders, and deliveries
- **Inward/Outward Tracking**: Log product movements and transfers

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Authentication**: JWT-based auth with HTTP-only cookies
- **Real-time**: Socket.IO
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd smart-machine-inventory
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
DIRECT_URL="postgresql://user:password@host:port/database?schema=public"
JWT_SECRET="your-secure-random-secret-key"
NEXT_PUBLIC_APP_NAME="Smart Product Inventory"
SEED_ADMIN_EMAIL="admin@company.local"
SEED_ADMIN_PASSWORD="secure-password"
SEED_EMPLOYEE_EMAIL="employee@company.local"
SEED_EMPLOYEE_PASSWORD="secure-password"
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

6. Seed the database:
```bash
npx tsx prisma/seed.ts
```

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (GUI)
npm run prisma:studio

# Push schema changes (development only)
npx prisma db push

# Reset database (caution: deletes all data)
npx prisma migrate reset
```

## Build & Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm run start
```

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

**Environment Variables Required in Vercel:**
- `DATABASE_URL` - PostgreSQL connection string (pooled)
- `DIRECT_URL` - PostgreSQL direct connection string
- `JWT_SECRET` - Secret key for JWT tokens

## Project Structure

```
smart-machine-inventory/
├── prisma/
│   ├── migrations/      # Database migrations
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # Reusable UI components
│   ├── lib/             # Utility libraries
│   ├── views/           # Page-level view components
│   ├── controllers/     # Business logic controllers
│   ├── repositories/    # Data access layer
│   └── services/        # Service layer
├── .env.example         # Environment template
└── package.json         # Dependencies
```

## User Roles

- **ADMIN**: Full system access
- **ADMIN_MANAGER**: Administrative management access
- **STORE_MANAGER**: Store-level management
- **EMPLOYEE**: Basic user access
- **SUB_STORE_LOGIN**: Sub-store specific access
- **INWARD_PERSON**: Inward operations only
- **OUTWARD_PERSON**: Outward operations only

## License

Proprietary - All rights reserved

## Support

For support, contact your system administrator.
