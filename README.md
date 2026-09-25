# ClientFlow

Multi-Tenant Lead, Booking & Customer Automation Platform tailored for businesses and professionals in Bangladesh.

Connect your website and social channels to one system, capture every lead, turn inquiries into bookings, and automatically communicate with customers via WhatsApp, SMS, and Email.

---

## Features

- **Multi-Tenant SaaS**: Strict tenant isolation across all resources using Prisma ORM & PostgreSQL (Supabase).
- **Bangladesh-First Architecture**:
  - Bangladeshi mobile number validation and E.164 normalization (`+8801XXXXXXXXX`).
  - Currency formatting in BDT (`৳`).
  - Standard timezone: `Asia/Dhaka`.
- **Booking & Availability Engine**:
  - Real-time time slot availability calculation.
  - Accounts for business/staff hours, breaks (e.g. Friday prayer), buffer times, and holidays.
- **Lead & Communication Economics**:
  - Monthly lead quotas (Starter: 50 leads/mo).
  - Outbound messaging limits (3 WhatsApp, 2 SMS, 3 Emails per lead).
  - Atomic ledger tracking in `usage_records`.
- **Distribution & Embeds**:
  - Standalone embeddable JavaScript widget (`public/widget.js`).
  - Official WordPress plugin (`wordpress-plugin/clientflow-booking`).
  - Direct public form URLs and dynamic QR codes.
- **Business Dashboard**:
  - Real-time overview of appointments, pending requests, and lead pipeline.
  - Live quota usage indicators for leads, WhatsApp, and SMS.
  - Service catalog and pricing manager.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL (Supabase) with Prisma ORM
- **Authentication**: JWT & Cookie-based multi-tenant RBAC

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase connection strings:

```bash
cp .env.example .env
```

### 3. Push Database Schema

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
