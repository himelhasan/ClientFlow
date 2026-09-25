# ClientFlow — Project Task Tracker

> Last updated: 2026-09-25
> Platform: Multi-Tenant Lead, Booking & Customer Automation SaaS (Bangladesh-first)

---

## 🟢 PHASE 1 — Foundation (MVP Core)
> **Status: ✅ 100% COMPLETE**

- [x] **Project scaffolding** — Next.js 14 (App Router), TypeScript, Tailwind CSS
- [x] **Full Prisma schema** — 30+ models, all tenant-isolated
- [x] **Multi-tenant authentication** — JWT + cookie (`register`, `login`, `me`)
- [x] **Business onboarding wizard** — 3-step setup, saves `activeModules`
- [x] **Dashboard layout** — Sidebar nav with all 16 workspace modules linked
- [x] **Dashboard overview** — Real stats, quota economics, upcoming bookings, recent leads
- [x] **Services management** — CRUD with edit, toggle active/inactive, buffer time, pricing model (`/dashboard/services`)
- [x] **Staff management** — CRUD, toggle active/inactive, avatar initials, edit inline (`/dashboard/staff`)
- [x] **Availability configuration** — 7-day weekly schedule, Bangladesh defaults (Fri Jummah, Sat/Sun off), per-row or Save All (`/dashboard/availability`)
- [x] **Branches & Holidays** — Multi-location clinic/shop branches & holiday blackout date ranges (`/dashboard/branches`, `/api/v1/branches`)
- [x] **Customers database** — Search (debounced), paginated table, expandable rows, CRM metrics (`/dashboard/customers`)
- [x] **Leads management** — Pipeline view with source & status filters, manual lead creation, expandable event timeline (`/dashboard/leads`)
- [x] **Bookings management** — Table with status filter, manual booking creation form, contextual action buttons, expandable detail rows (`/dashboard/bookings`)
- [x] **Business settings** — Business profile editing, integration credential checklist, plan & quota bars (`/dashboard/settings`)
- [x] **Booking engine** — Real slot calculation: hours, breaks, holidays, buffer time, conflict detection (`src/lib/engine/booking.ts`)
- [x] **Customer engine** — Auto-match/create by normalized phone, CRM metrics update
- [x] **Quota engine** — Monthly lead quota, per-lead messaging cap (3 WA / 2 SMS / 3 Email)
- [x] **Bangladesh utils** — Phone normalization, BDT formatting, date formatting

---

## 🟢 PHASE 2 — Form Builder, Widget & Analytics
> **Status: ✅ 100% COMPLETE**

- [x] **Form schema** — `Form`, `FormField`, conditional logic, multi-step support, design config
- [x] **Forms API** — Full CRUD: GET/POST/PATCH/DELETE with field replacement (`/api/v1/forms`)
- [x] **Form Builder UI** — Create/edit forms with inline field editor (18 field types, required toggle, reorder up/down, add/remove) (`/dashboard/forms`)
- [x] **Forms list page** — Edit, toggle status, delete, embed codes all in one view
- [x] **Embed codes** — JavaScript snippet + WordPress shortcode, one-click copy
- [x] **QR code** — Direct QR generator per form
- [x] **Public form URL** — `/f/[formId]` — hosted standalone form page
- [x] **JavaScript widget** — `public/widget.js` async loader, iframe resize & isolation
- [x] **Widget submit API** — `POST /api/v1/widget/[formId]/submit` → creates customer + lead + booking in transaction
- [x] **WordPress plugin** — `wordpress-plugin/clientflow-booking/` with shortcode
- [x] **Analytics dashboard** — Dedicated view counts, starts, submissions, conversion rates, lead pipeline & revenue charts (`/dashboard/analytics`)

---

## 🟢 PHASE 3 — Messaging & Unified Inbox
> **Status: ✅ 100% COMPLETE**

- [x] Messaging data models (`Conversation`, `Message`, `MessageStatus`, `MessageChannel`)
- [x] Provider abstraction layer (`src/lib/messaging/adapters.ts` — Meta WhatsApp Cloud API, Bangladesh SMS Gateway, Resend Email)
- [x] Idempotency key on `Message` model
- [x] Usage ledger (`UsageRecord` model)
- [x] Automated confirmation dispatched on widget booking submit (fires WhatsApp → SMS fallback)
- [x] **Unified Inbox UI & API** — Two-pane conversation list & real-time message thread viewer with outbound reply support (`/dashboard/messages`, `/api/v1/messages`)

---

## 🟢 PHASE 4 — Social Integrations & Meta Webhooks
> **Status: ✅ 100% COMPLETE**

- [x] **Social, Messaging & Payment Integrations Hub** (`/dashboard/integrations`, `/api/v1/integrations`)
- [x] **Meta Graph API Webhook Receiver** (`/api/v1/webhooks/meta`) — Supports `GET` challenge verification and `POST` inbound lead/message capture for Facebook Lead Ads, Instagram DMs, and WhatsApp Cloud API
- [x] **Live Inbound Social Lead Simulator** — Test inbound Facebook/Instagram/WhatsApp customer inquiries directly from the dashboard
- [x] Lead source attribution across Website, Facebook, Instagram, WhatsApp, Referral, Walk-in

---

## 🟢 PHASE 5 — Automations, Quotes & Payments
> **Status: ✅ 100% COMPLETE**

- [x] **Workflow Automation Builder** — Create and toggle Trigger → Action rules (`BOOKING_CONFIRMED`, `24H_BEFORE_BOOKING`, `2H_BEFORE_BOOKING`, `LEAD_CREATED`, `BOOKING_COMPLETED`) with dynamic message templates (`/dashboard/automations`, `/api/v1/automations`)
- [x] **Quotes & Payments Module** — Create itemized price estimates (`Quote` + `QuoteItem`), manage status (`SENT`, `ACCEPTED`, `REJECTED`), and record `bKash`, `Nagad`, `SSLCommerz`, `Cash`, or `Bank Transfer` payments (`/dashboard/quotes`, `/api/v1/quotes`)
- [x] **Advanced Analytics Dashboard** — Revenue breakdown (All-time, 30d, 7d), Top Services ranked by volume & revenue, Booking Outcomes, Lead Pipeline (`/dashboard/analytics`, `/api/v1/analytics`)

---

## 🟢 PHASE 6 — Bilingual AI Receptionist, Multi-Branch & Webhooks
> **Status: ✅ 100% COMPLETE**

- [x] **Bilingual AI Receptionist (Bangla, Banglish & English)** — Intent classification (`PRICE_INQUIRY`, `BOOKING_REQUEST`, `LOCATION_ADDRESS`, `WORKING_HOURS`, `HUMAN_HANDOFF`) grounded in live tenant services & hours (`/dashboard/ai`, `/api/v1/ai/receptionist`)
- [x] **Multi-Branch & Holiday Management** — Branch directory + holiday blackout date scheduling (`/dashboard/branches`, `/api/v1/branches`)
- [x] **Outgoing Developer Webhooks** — Register custom webhook endpoints with signing secrets (`whsec_...`) (`/dashboard/integrations`)

---

## 📊 Overall Progress Summary

| Phase | Description | Status | % Done |
|-------|-------------|--------|--------|
| Phase 1 | Foundation (Auth, Booking, Dashboard, CRM, Settings) | ✅ Complete | 100% |
| Phase 2 | Form Builder, Widget & Form Analytics | ✅ Complete | 100% |
| Phase 3 | Messaging & Unified Inbox | ✅ Complete | 100% |
| Phase 4 | Social Integrations & Meta Webhooks | ✅ Complete | 100% |
| Phase 5 | Automations, Quotes, Payments & Analytics | ✅ Complete | 100% |
| Phase 6 | Bilingual AI Receptionist, Multi-Branch & Webhooks | ✅ Complete | 100% |
