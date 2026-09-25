# ClientFlow — Project Task Tracker

> Last updated: 2026-09-25
> Platform: Multi-Tenant Lead, Booking & Customer Automation SaaS (Bangladesh-first)

---

## 🟢 PHASE 1 — Foundation (MVP Core)
> **Status: ✅ COMPLETE**

### ✅ Done

- [x] **Project scaffolding** — Next.js 14 (App Router), TypeScript, Tailwind CSS
- [x] **Full Prisma schema** — 30+ models, all tenant-isolated
- [x] **Multi-tenant authentication** — JWT + cookie (`register`, `login`, `me`)
- [x] **Business onboarding wizard** — 3-step setup, saves `activeModules`
- [x] **Dashboard layout** — Sidebar nav with all 8 pages linked
- [x] **Dashboard overview** — Real stats, quota economics, upcoming bookings, recent leads
- [x] **Services management** — CRUD with edit, toggle active/inactive, buffer time, pricing model
- [x] **Staff management** — CRUD, toggle active/inactive, avatar initials, edit inline (`/dashboard/staff`)
- [x] **Availability configuration** — 7-day weekly schedule, Bangladesh defaults (Fri Jummah, Sat/Sun off), per-row or Save All (`/dashboard/availability`)
- [x] **Customers database** — Search (debounced), paginated table, expandable rows, CRM metrics (`/dashboard/customers`)
- [x] **Leads management** — Pipeline view with status filter (`/dashboard/leads`)
- [x] **Bookings management** — Table with status filter, manual booking creation form, contextual action buttons, expandable detail rows (`/dashboard/bookings`)
- [x] **Booking engine** — Real slot calculation: hours, breaks, holidays, buffer time, conflict detection (`src/lib/engine/booking.ts`)
- [x] **Customer engine** — Auto-match/create by normalized phone, CRM metrics update
- [x] **Quota engine** — Monthly lead quota, per-lead messaging cap (3 WA / 2 SMS / 3 Email)
- [x] **Bangladesh utils** — Phone normalization, BDT formatting, date formatting
- [x] **API routes** — `/api/v1/auth/*`, `/api/v1/services`, `/api/v1/staff`, `/api/v1/availability`, `/api/v1/customers`, `/api/v1/bookings`, `/api/v1/leads`, `/api/v1/dashboard/stats`

### ⏳ Remaining (nice-to-have polish)

- [ ] Password reset flow
- [ ] Refresh tokens (currently 7-day JWT)
- [ ] Rate limiting on auth routes
- [ ] Zod validation on all API routes

---

## 🟡 PHASE 2 — Form Builder & Widget
> **Status: ~80% COMPLETE**

### ✅ Done

- [x] **Form schema** — `Form`, `FormField`, conditional logic, multi-step support, design config
- [x] **Forms API** — Full CRUD: GET/POST/PATCH/DELETE with field replacement
- [x] **Form Builder UI** — Create/edit forms with inline field editor:
  - Field type selector (18 types incl. service_selector, staff_selector, date_time)
  - Label, placeholder, help text, required toggle
  - Reorder fields (up/down arrows)
  - Add/remove fields
  - Form name, title, description, type settings
- [x] **Forms list page** — Edit, toggle status, delete, embed codes all in one view
- [x] **Embed codes** — JavaScript snippet + WordPress shortcode, one-click copy
- [x] **QR code** — Direct link to qrserver.com per form
- [x] **Public form URL** — `/f/[formId]` — hosted standalone form page
- [x] **JavaScript widget** — `public/widget.js` async loader, shadow DOM isolation
- [x] **Widget submit API** — `POST /api/v1/widget/[formId]/submit` → creates customer + lead + booking in transaction
- [x] **WordPress plugin** — `wordpress-plugin/clientflow-booking/` with shortcode
- [x] **UTM / source tracking** — stored on FormSubmission records

### ⏳ Remaining — Phase 2

- [ ] **Form analytics page** — Dedicated view counts, starts, submissions, conversion rate
- [ ] **Multi-step form UI** — Step progression + progress indicator in widget
- [ ] **Conditional field logic UI** — Visual IF/THEN rule editor
- [ ] **Form design customizer** — Color/font/layout editor with live preview
- [ ] **WordPress Gutenberg block** — Plugin currently has shortcode only
- [ ] **CMS installation guides** — Shopify, Wix, Squarespace, Webflow instructions page

---

## 🔴 PHASE 3 — Messaging & Automation
> **Status: ~15% COMPLETE** — Architecture in place, no live integrations yet.

### ✅ Done

- [x] Messaging data models (`Conversation`, `Message`, `MessageStatus`, `MessageChannel`)
- [x] Provider abstraction layer (`src/lib/messaging/adapters.ts`)
- [x] Idempotency key on `Message` model
- [x] Usage ledger (`UsageRecord` model)
- [x] Automated confirmation dispatched on widget booking submit (fires WhatsApp → SMS fallback)

### ⏳ Remaining — Phase 3

- [ ] WhatsApp Business API integration (Meta Cloud API)
- [ ] SMS provider integration (Bangladesh gateway)
- [ ] Email integration (Resend or similar)
- [ ] 24h + 2h reminder jobs (BullMQ/Redis job queue)
- [ ] Cancellation notifications
- [ ] Unified inbox UI (`/dashboard/messages`)
- [ ] Incoming webhook handlers (WhatsApp delivery status)

---

## 🔴 PHASE 4 — Social Integrations
> **Status: 0% COMPLETE**

- [ ] Facebook Page OAuth + Meta Graph API
- [ ] Facebook Lead Ads webhook → Lead creation
- [ ] Instagram Business connection
- [ ] Instagram DM capture
- [ ] Unified inbox (multi-channel threads)
- [ ] Lead source attribution to FB/IG/Google/QR

---

## 🔴 PHASE 5 — Advanced Features
> **Status: 0% COMPLETE**

- [ ] Automation builder UI
- [ ] Automation execution engine (Trigger → Condition → Action)
- [ ] Quote management UI (create, send, accept, convert to booking)
- [ ] Payment integrations (bKash, Nagad, SSLCommerz, Stripe)
- [ ] Advanced analytics dashboard
- [ ] Super Admin panel

---

## 🔴 PHASE 6 — AI & Advanced
> **Status: 0% COMPLETE**

- [ ] AI receptionist (Bangla/English intent detection)
- [ ] AI suggested replies in inbox
- [ ] Multi-branch support in dashboard
- [ ] Public developer API (API key management)
- [ ] Custom domain support for forms

---

## 🛠️ Cross-Cutting Concerns

| Item | Status |
|------|--------|
| Input validation (Zod) | ⏳ Partial |
| Rate limiting | ❌ Not started |
| CSRF protection | ❌ Not started |
| Audit logs (model exists) | ⏳ Schema only |
| Security headers | ❌ Not started |
| Tests (booking engine, tenant isolation) | ❌ Not started |
| Error tracking / logging | ❌ Not started |
| File/image uploads (S3) | ❌ Not started |

---

## 📊 Overall Progress Summary

| Phase | Description | Status | % Done |
|-------|-------------|--------|--------|
| Phase 1 | Foundation (Auth, Booking, Dashboard, CRM) | ✅ Complete | ~95% |
| Phase 2 | Form Builder & Widget | 🟡 In Progress | ~80% |
| Phase 3 | Messaging & Automation | 🔴 Minimal | ~15% |
| Phase 4 | Social Integrations | 🔴 Not Started | 0% |
| Phase 5 | Advanced Features | 🔴 Not Started | 0% |
| Phase 6 | AI & Advanced | 🔴 Not Started | 0% |

---

## 🎯 Recommended Next Steps

1. **Phase 2 polish** — Form analytics page, multi-step widget progress, design customizer
2. **Phase 3 messaging** — Wire up a real WhatsApp/SMS provider (even one Bangladesh SMS gateway delivers immediate value)
3. **Job queue** — BullMQ + Redis for 24h/2h booking reminders
4. **Tests** — Tenant isolation and booking engine tests (hard spec requirement)
