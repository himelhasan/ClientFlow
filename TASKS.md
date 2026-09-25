# ClientFlow — Project Task Tracker

> Last updated: 2026-09-25
> Platform: Multi-Tenant Lead, Booking & Customer Automation SaaS (Bangladesh-first)

---

## 🟢 PHASE 1 — Foundation (MVP Core)
> **Status: ~85% COMPLETE** — Core foundation is built and functional. A few pieces remain.

### ✅ Completed

- [x] **Project scaffolding** — Next.js 14 (App Router), TypeScript, Tailwind CSS
- [x] **Database schema** — Full Prisma schema with 30+ models, all with `tenantId` isolation
  - Users, Businesses, BusinessUsers, Branches
  - Services, Staff, StaffService, Availability, Holidays
  - Forms, FormFields, FormSubmissions
  - Customers, Leads, LeadEvents
  - Bookings, BookingEvents
  - Quotes, QuoteItems, Payments
  - Conversations, Messages
  - Automations, AutomationRuns
  - Integrations, IntegrationEvents, Webhooks
  - Notifications, Plans, Subscriptions, UsageRecords, AuditLogs
- [x] **Multi-tenant authentication** — JWT + cookie-based auth (`src/lib/auth.ts`)
  - `POST /api/v1/auth/register` — Registration with password hashing
  - `POST /api/v1/auth/login` — Login + JWT issuance
  - `GET /api/v1/auth/me` — Current session info
- [x] **Business onboarding wizard** — Multi-step (`/onboarding`) covering:
  - Business info (name, category, phone, address, city, website)
  - Business requirements (modules needed)
  - Initial `activeModules` configuration saved to Business record
- [x] **Business dashboard layout** — Sidebar navigation with dynamic module visibility (`/dashboard/layout.tsx`)
- [x] **Dashboard overview page** — Real-time stats, quota economics, upcoming bookings, recent leads (`/dashboard/page.tsx`)
  - Today's bookings, pending confirmations, total leads, revenue cards
  - Subscription quota indicator (Leads / WhatsApp / SMS)
- [x] **Services management** — CRUD via `GET/POST /api/v1/services` + dashboard UI (`/dashboard/services`)
- [x] **Leads management** — `GET/POST /api/v1/leads` + dashboard UI (`/dashboard/leads`)
- [x] **Bookings management** — `GET/PATCH /api/v1/bookings` + dashboard UI (`/dashboard/bookings`)
  - Status state machine: PENDING → CONFIRMED → COMPLETED / CANCELLED / NO_SHOW / RESCHEDULED
  - BookingEvent audit trail on every status change
- [x] **Booking engine** — `src/lib/engine/booking.ts`
  - Real-time available slot calculation
  - Business/staff working hours per day-of-week
  - Break time support (Friday prayer, lunch, etc.)
  - Holiday blocking
  - Buffer time between appointments
  - Conflict detection against existing bookings
- [x] **Customer engine** — `src/lib/engine/customer.ts`
  - Auto-create/match customers by normalized phone number
  - CRM metrics update (total bookings, revenue, etc.)
- [x] **Quota engine** — `src/lib/engine/quota.ts`
  - Monthly lead quota tracking
  - Per-lead messaging caps (3 WhatsApp / 2 SMS / 3 Email)
  - Atomic usage ledger (`UsageRecord` model)
- [x] **Bangladesh-first utilities** — `src/lib/utils/bangladesh.ts`
  - Phone normalization (`01XXXXXXXXX` → `+8801XXXXXXXXX`)
  - BDT currency formatting (`৳`)
  - BD date formatting (Asia/Dhaka timezone)
- [x] **Dashboard stats API** — `GET /api/v1/dashboard/stats` with real DB queries
- [x] **Supabase / PostgreSQL setup** — `SUPABASE_SETUP.md`, migration file, `.env.example`
- [x] **Messaging abstraction layer** — `src/lib/messaging/` types + provider adapters
- [x] **Registration & login pages** — `/register`, `/login` with form UI

### ⏳ Remaining — Phase 1

- [ ] **Staff management UI** — API exists in schema, no dashboard page yet (`/dashboard/staff`)
- [ ] **Availability configuration UI** — No UI to set business/staff working hours
- [ ] **Customer database view** — `/dashboard/customers` page not built
- [ ] **Password reset flow** — Not implemented
- [ ] **Refresh tokens** — Auth uses short-lived JWT only; refresh not implemented
- [ ] **Rate limiting** — Not yet applied to auth/API routes
- [ ] **Input validation** — Zod validation missing on most API routes

---

## 🟡 PHASE 2 — Form Builder & Widget
> **Status: ~60% COMPLETE** — Infrastructure built, full form builder UI pending.

### ✅ Completed

- [x] **Form schema** — `Form`, `FormField` models with conditional logic (`conditions` JSON), multi-step support
- [x] **Forms API** — `GET/POST /api/v1/forms`
- [x] **Forms dashboard page** — `/dashboard/forms` (listing and embed code)
- [x] **Widget API** — `GET /api/v1/widget/[formId]` (public form config endpoint)
- [x] **Widget submit API** — `POST /api/v1/widget/[formId]/submit` (public submission → lead + customer creation)
- [x] **Embeddable JavaScript widget** — `public/widget.js` (async loader, shadow DOM isolation)
- [x] **Public form page** — `/f/[formId]` — hosted form URL
- [x] **WordPress plugin** — `wordpress-plugin/clientflow-booking/clientflow-booking.php` with shortcode support
- [x] **UTM / source tracking** — `utmSource`, `utmMedium`, `utmCampaign`, `referrer` stored on submissions
- [x] **Form design config** — `designConfig` JSON column in `Form` model

### ⏳ Remaining — Phase 2

- [ ] **Visual form builder UI** — Drag-and-drop field editor (not yet built)
- [ ] **Form design customizer** — Color/typography/layout editor with live preview
- [ ] **Conditional logic editor** — UI for IF/THEN field visibility rules
- [ ] **Multi-step form UI** — Step progression, progress indicator in widget
- [ ] **Form analytics page** — View counts, starts, submissions, conversion rate
- [ ] **QR code generation** — Per-form QR code download
- [ ] **WordPress Gutenberg block** — Plugin has shortcode only, no block yet
- [ ] **CMS installation guides** — Shopify, Wix, Squarespace, Webflow instructions

---

## 🔴 PHASE 3 — Messaging & Automation
> **Status: ~15% COMPLETE** — Architecture and abstractions in place; no live integrations yet.

### ✅ Completed

- [x] **Messaging data model** — `Conversation`, `Message`, `MessageChannel`, `MessageStatus` enums
- [x] **Messaging provider abstraction** — `src/lib/messaging/adapters.ts` (WhatsApp, SMS, Email interfaces)
- [x] **Idempotency key design** — `idempotencyKey` on `Message` model (prevents duplicate sends)
- [x] **Usage ledger** — `UsageRecord` model for tracking per-lead message consumption

### ⏳ Remaining — Phase 3

- [ ] **WhatsApp Business API integration** — Meta API connection, template management
- [ ] **SMS provider integration** — Bangladesh SMS gateway adapter
- [ ] **Email integration** — Resend or similar provider
- [ ] **Automated booking confirmation** — Trigger on booking created/confirmed
- [ ] **24-hour reminder job** — Scheduled pre-appointment WhatsApp/SMS
- [ ] **2-hour reminder job** — Scheduled pre-appointment reminder
- [ ] **Cancellation notifications** — Notify business + customer on cancellation
- [ ] **Job queue (BullMQ/Redis)** — Background job infrastructure for reliable delivery
- [ ] **Retry / exponential backoff** — Reliable message delivery with dead-letter handling
- [ ] **Webhook handlers (incoming)** — WhatsApp status webhooks, delivery receipts
- [ ] **Unified inbox UI** — `/dashboard/messages` conversation view

---

## 🔴 PHASE 4 — Social Integrations
> **Status: 0% COMPLETE** — Not started.

- [ ] **Facebook Page connection** — OAuth + Meta Graph API
- [ ] **Facebook Lead Ads integration** — Webhook → Lead creation
- [ ] **Instagram Business connection** — Meta API
- [ ] **Instagram DM capture** — Lead source attribution
- [ ] **Unified inbox (multi-channel)** — Facebook, Instagram, WhatsApp threads in one view
- [ ] **Lead source tracking** — Attribution to Facebook/Instagram/Google/QR campaigns

---

## 🔴 PHASE 5 — Advanced Features
> **Status: 0% COMPLETE** — Not started.

- [ ] **Automation builder UI** — Visual Trigger → Condition → Action editor
- [ ] **Automation execution engine** — Process triggers, evaluate conditions, run actions
- [ ] **Quote management UI** — Create, send, accept, convert to booking
- [ ] **Payment integrations** — bKash, Nagad, SSLCommerz, Stripe
- [ ] **Advanced analytics dashboard** — Source attribution, service performance, staff performance
- [ ] **QR code generation** — Per-form dynamic QR codes
- [ ] **Super Admin panel** — Platform-level business management, subscription oversight

---

## 🔴 PHASE 6 — AI & Advanced
> **Status: 0% COMPLETE** — Planned for later.

- [ ] **AI receptionist** — Bangla/English intent detection for lead qualification
- [ ] **AI suggested replies** — Context-aware message drafts in inbox
- [ ] **Multi-branch support** — Branch selector in dashboard, per-branch availability
- [ ] **Public developer API** — API key management for businesses
- [ ] **Custom domain support** — `book.yourbusiness.com` white-label forms

---

## 🛠️ Cross-Cutting Concerns (Ongoing)

| Item | Status |
|------|--------|
| Input validation (Zod on all routes) | ⏳ Partial |
| Rate limiting on APIs | ❌ Not started |
| CSRF protection | ❌ Not started |
| Audit logs (AuditLog model exists) | ⏳ Schema only |
| Security headers | ❌ Not started |
| Tests (booking engine, tenant isolation) | ❌ Not started |
| Error tracking / logging | ❌ Not started |
| Pagination on list APIs | ❌ Not started |
| File/image uploads (logo, form attachments) | ❌ Not started |
| S3-compatible storage integration | ❌ Not started |

---

## 📊 Overall Progress Summary

| Phase | Description | Status | % Done |
|-------|-------------|--------|--------|
| Phase 1 | Foundation (Auth, Booking Engine, Dashboard, CRM) | 🟡 In Progress | ~85% |
| Phase 2 | Form Builder & Widget | 🟡 In Progress | ~60% |
| Phase 3 | Messaging & Automation | 🔴 Minimal | ~15% |
| Phase 4 | Social Integrations | 🔴 Not Started | 0% |
| Phase 5 | Advanced Features | 🔴 Not Started | 0% |
| Phase 6 | AI & Advanced | 🔴 Not Started | 0% |

---

## 🎯 Recommended Next Steps

1. **Complete Phase 1 gaps** — Staff UI, Availability UI, Customer list, validation (Zod), rate limiting
2. **Complete Phase 2 form builder** — Visual drag-and-drop editor is the core differentiating feature
3. **Phase 3 messaging** — Even a basic WhatsApp confirmation message delivers immediate business value
4. **Write tests** — Tenant isolation test is a hard requirement per spec (Section 61)
