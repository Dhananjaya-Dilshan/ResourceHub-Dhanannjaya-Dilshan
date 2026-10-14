# ResourceHub — Resource Reservation Management System

**ResourceHub** is a production-grade, centralized resource reservation web application engineered for PrimeWave Lab (Pvt) Ltd's software engineering internship assessment. It solves organizational scheduling friction by providing full-lifecycle management for shared physical and virtual assets while strictly preventing overlapping bookings.

---

## 1. Business Problem & Solution

### The Problem
Organizations commonly manage shared resources (meeting rooms, projectors, lab spaces, pool vehicles) through informal, distributed channels such as spreadsheets or instant messaging. This leads to:
- Conflicting simultaneous reservations (double bookings).
- High uncertainty regarding asset availability and capacity.
- Accidental overwriting or deletion of historical booking records.
- Human error in time-slot calculations across days and local timezones.

### The Solution
ResourceHub eliminates informal friction by offering:
- **Centralized Registry**: Controlled resource catalogs with capacity constraints and location tracking.
- **Two-Tier Reservation Overlap Defense**: Application-level preflight validation paired with a PostgreSQL `btree_gist` Exclusion Constraint (`tstzrange` with `&&`) to mathematically prevent race conditions under concurrent requests.
- **Audit Preservation**: Deactivating a resource or cancelling a booking retains historical audit records without risking orphaned bookings or blocking future slots.
- **Consistent Organization Timezone Policy**: Centralized instant calculation in `Asia/Colombo` (UTC+05:30) with UTC `timestamptz` storage.

---

## 2. Technology Stack

- **Framework**: Next.js 15 (App Router with Server Actions & Server Components)
- **Language**: TypeScript (strict mode enabled)
- **Database**: PostgreSQL
- **ORM & Migrations**: Prisma ORM 6.3.0
- **Styling & UI**: Tailwind CSS v4, shadcn/ui design patterns, Lucide React
- **Validation**: Zod (server-side & client-side schema validation)
- **Forms**: React Hook Form with `@hookform/resolvers/zod`
- **Testing**: Vitest 2.1.8 with jsdom
- **Date & Time**: `date-fns` and `date-fns-tz`

---

## 3. Architecture & Project Structure

```
ResourceHub/
├── app/
│   ├── (dashboard)/
│   │   └── page.tsx                   # Live metric dashboard & recent bookings
│   ├── actions/                       # Next.js Server Actions (mutations)
│   │   ├── reservation.actions.ts
│   │   └── resource.actions.ts
│   ├── reservations/
│   │   ├── page.tsx                   # Reservation list & filtering
│   │   ├── new/page.tsx               # Reservation creation form
│   │   └── [id]/page.tsx              # Reservation details & cancellation
│   ├── resources/
│   │   ├── page.tsx                   # Resource list & catalog
│   │   ├── new/page.tsx               # Resource registration form
│   │   └── [id]/
│   │       ├── page.tsx               # Resource details & timeline
│   │       └── edit/page.tsx          # Resource editing
│   ├── error.tsx                      # Global error boundary
│   ├── not-found.tsx                  # Global 404 page
│   └── layout.tsx                     # Root shell with persistent sidebar
├── components/
│   ├── layout/Sidebar.tsx             # Responsive sidebar navigation
│   ├── reservations/                  # Reservation UI tables, filters & forms
│   ├── resources/                     # Resource UI tables, filters & forms
│   └── ui/                            # Accessible badges, states, toasts, pagination
├── docs/
│   ├── erd.dbml                       # Database Markup Language for ERD visualization
│   └── demo-script.md                 # 3-5 minute technical assessment walkthrough script
├── lib/
│   ├── date-time.ts                   # Organization timezone & interval math
│   ├── errors.ts                      # Custom error hierarchy & constraint mapper
│   ├── prisma.ts                      # Singleton Prisma Client for dev hot-reloading
│   ├── utils.ts                       # Tailwind merge utility
│   └── validations/                   # Zod schemas for resources & reservations
├── prisma/
│   ├── schema.prisma                  # Prisma data model definition
│   ├── seed.ts                        # Idempotent database seeder
│   └── migrations/                    # SQL migrations including btree_gist exclusion
├── services/
│   ├── reservation.service.ts         # Conflict detection & reservation logic
│   └── resource.service.ts            # Resource lifecycle & catalog logic
└── tests/
    ├── setup.ts
    ├── unit/                          # Overlap arithmetic & schema validation tests
    └── integration/                   # PostgreSQL exclusion constraint integration test
```

---



---

## 4. Critical Business Rule: Reservation Overlap Prevention

### Interval Semantics
ResourceHub uses **half-open intervals**: `[startAt, endAt)`
- Two reservations overlap if and only if:
  $$\text{existing.startAt} < \text{requested.endAt} \quad \text{AND} \quad \text{existing.endAt} > \text{requested.startAt}$$
- Adjacent reservations where the requested start strictly equals the existing end (e.g. `10:00–11:00` followed by `11:00–12:00`) **do not overlap** and are accepted.

### Two-Tier Concurrency Defense
1. **Tier 1 (Application Layer)**:
   [`services/reservation.service.ts`](file:///c:/Users/STZ/Downloads/ResourceHub/services/reservation.service.ts) performs a pre-flight availability query using half-open boundaries. This supplies fast, intuitive feedback to users.
2. **Tier 2 (PostgreSQL GiST Exclusion Constraint)**:
   A dedicated migration enforces an exclusion constraint using the `btree_gist` extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS btree_gist;

   ALTER TABLE "Reservation"
   ADD CONSTRAINT "reservation_no_overlap"
   EXCLUDE USING gist (
     "resource_id" WITH =,
     tstzrange("start_at", "end_at", '[)') WITH &&
   )
   WHERE ("status" = 'CONFIRMED');
   ```
   If two requests hit the server concurrently and bypass Tier 1 simultaneously, PostgreSQL serializes the transaction and rejects the second request. The application maps code `reservation_no_overlap` into a clean, human-readable conflict error instead of an internal 500 error.

---

## 5. Date and Time Handling Policy

- **Timezone**: Organization local timezone is set to `Asia/Colombo` (UTC+05:30), configurable via `ORG_TIMEZONE`.
- **Storage**: All timestamps are saved in PostgreSQL as `TIMESTAMPTZ(6)` (UTC instants).
- **Display**: All date-time values rendered on the UI are formatted in the organization's timezone using `date-fns-tz`.
- **Boundaries**: Dashboard metrics (e.g. "Today's Reservations") evaluate calendar boundaries localized to the start and end of the organization day rather than UTC midnight.

---

## 6. Prerequisites & Installation

### Prerequisites
- **Node.js**: v20.x or v22.x or v24.x
- **npm**: v10.x or v11.x
- **PostgreSQL**: v14+ with permission to enable `btree_gist` extension

### 1. Clone & Install
```bash
git clone <repository-url>
cd ResourceHub
npm install
```

### 2. Environment Configuration
Create a `.env` file from the provided `.env.example`:
```bash
cp .env.example .env
```
Edit `.env` with your PostgreSQL connection string and secure authentication secret (min 32 characters):
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/resourcehub?schema=public"
AUTH_SECRET="a-very-secure-random-secret-key-at-least-32-chars-long"
ORG_TIMEZONE="Asia/Colombo"
```

### 3. Run Migrations & Seed
```bash
# Generate Prisma Client
npm run db:generate

# Apply PostgreSQL migrations (includes User model and btree_gist exclusion constraint)
npm run db:migrate

# Seed database with initial users (ADMIN & MEMBER), resources and reservations
npm run db:seed
```

Default seeded credentials:
- **Admin**: `admin@example.com` / `Admin@12345` (Full access to all resource management and Admin Dashboard)
- **Member**: `alice@example.com` / `Member@12345` (Standard booking & viewing access)

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Development & Verification Commands

| Action | Command | Purpose |
|---|---|---|
| **Unit Tests** | `npm test` | Runs 35 Vitest tests for auth, overlap math & schemas |
| **Type Check** | `npm run type-check` | Performs strict `tsc --noEmit` check |
| **Lint** | `npm run lint` | Runs ESLint 9 checks across codebase |
| **Integration Test** | `npm run test:integration` | Runs PostgreSQL database integration tests |
| **Production Build** | `npm run build` | Compiles optimized Next.js App Router bundle |
| **Prisma Studio** | `npm run db:studio` | GUI inspector for database tables |

---


## 8. Key Engineering Decisions 

### 1. Minimal Custom Session Auth (`jose` + `bcryptjs`)
- **Decision**: Implemented signed, HTTP-only JWT session cookies using `jose` HS256 and `bcryptjs` with salt rounds = 10, instead of heavy external frameworks like Auth.js or NextAuth.
- **Why**: Zero external provider runtime dependencies, ultra-fast initialization, transparent token verification in Edge middleware, and 100% explainable codebase for technical interviews.
- **Timing Attack Mitigation**: When a non-existent email is queried during login, `bcrypt.compare` executes against a dummy hash (`DUMMY_HASH`) to ensure constant-time response behavior.
- **Multi-Layer RBAC**: Middleware performs edge JWT verification for fast routing, while `services` and server actions enforce explicit server-side role validation (`requireUser()` and `requireAdmin()`) loading fresh DB state with `React.cache()`.

### 2. High-Contrast Enterprise SaaS UI/UX Design System
- **Decision**: Replaced all low-contrast gray/ash text with high-contrast `#09090b` (`text-slate-950`) headings, `#0f172a` (`text-slate-900`) data cells, and `#334155` (`text-slate-700`) secondary metadata.
- **Why**: Enterprise SaaS applications demand immediate legibility across varied display environments and adherence to WCAG AA color contrast guidelines (minimum 4.5:1 ratio).
- **Instant Skeleton Feedback**: Added App Router `loading.tsx` skeletons at root, `/resources`, and `/reservations` to prevent layout shifts.
- **Accessible Dialogs**: Modal confirmations include backdrop blur, `aria-labelledby`, `aria-describedby`, and keyboard `Escape` dismissal listeners.

### 3. PostgreSQL Exclusion Constraint (`btree_gist`)
- **Decision**: Applied PostgreSQL `tstzrange` exclusion constraint on confirmed reservations.
- **Why**: Protects the database against race conditions under concurrent network requests that bypass application-level preflight queries.

### 4. Prisma Client Singleton
- Implemented in [`lib/prisma.ts`](file:///c:/Users/STZ/Downloads/ResourceHub/lib/prisma.ts) to prevent exhausting PostgreSQL connection pools during Next.js hot-module reloading.

### 5. Explicit Soft Deletion / Audit Trail
- Resources are deactivated (`status: INACTIVE`) rather than hard deleted, and reservations are cancelled (`status: CANCELLED`) rather than destroyed, preserving full historical booking accountability.
