# Multi-Tenant Lead, Booking & Customer Automation Platform

## 1. Product Overview

Build a multi-tenant SaaS platform for businesses and professionals in Bangladesh that need:

- Appointment booking
- Service requests
- Quote requests
- Customer inquiries
- Lead capture
- Website-embedded forms
- Facebook/Instagram lead and booking integrations
- WhatsApp communication
- SMS communication
- Email communication
- Customer CRM
- Automated reminders and follow-ups

The platform does **not** provide websites or landing pages for businesses.

Each business keeps its existing website and social media presence. The platform acts as the central system that connects those channels, captures leads/bookings, stores customer data, and automates communication.

Core positioning:

> Connect your website and social channels to one system, capture every lead, turn inquiries into bookings, and automatically communicate with customers.

---

# 2. Product Architecture

The product is ONE SaaS platform with multi-tenant architecture.

Each business is a tenant.

```text
Platform
│
├── Business A
│   ├── Dashboard
│   ├── Forms
│   ├── Bookings
│   ├── Leads
│   ├── Customers
│   ├── Services
│   ├── Staff
│   ├── Messages
│   ├── Automations
│   ├── Analytics
│   └── Integrations
│
├── Business B
│   └── Same modules, different configuration
│
└── Business C
    └── Same modules, different configuration
```

Data must be tenant-isolated.

Every business-owned database record must have a `tenantId`.

Never allow one tenant to query or modify another tenant's data.

---

# 3. Primary User Types

## 3.1 Platform Super Admin

The platform owner/admin.

Capabilities:

- Manage businesses
- View subscription status
- Manage plans
- Monitor platform usage
- View messaging usage
- Manage integrations
- Manage system settings
- View system logs
- Manage support issues
- Suspend/reactivate businesses

## 3.2 Business Owner

Owns a business workspace.

Capabilities:

- Configure business
- Manage services
- Manage staff
- Build forms
- Customize form design
- Manage bookings
- Manage leads
- Manage customers
- Manage messages
- Configure automations
- Connect social channels
- Connect WhatsApp
- Configure SMS
- Configure email
- View analytics
- Manage subscription

## 3.3 Business Staff

Limited access depending on permissions.

Example permissions:

- View bookings
- Create bookings
- Edit bookings
- View customers
- Manage leads
- Manage assigned services
- View messages

Use role-based access control.

---

# 4. Bangladesh-First Requirements

Initial target market is Bangladesh.

Support:

- Bangladeshi mobile numbers
- `01XXXXXXXXX`
- `+8801XXXXXXXXX`
- `8801XXXXXXXXX`

Normalize phone numbers internally to E.164 format.

Example:

`01712345678`

becomes:

`+8801712345678`

Email should be optional.

Primary customer contact methods:

- Phone
- WhatsApp
- SMS

Secondary:

- Email

Currency:

- BDT / ৳

Timezone:

- Asia/Dhaka

Date/time formatting should support Bangladesh users.

Language architecture should support English initially and allow Bangla localization later.

---

# 5. Business Onboarding

When a business registers, use a setup wizard.

## Step 1 — Business information

Fields:

- Business name
- Business category
- Business description
- Phone
- WhatsApp
- Email
- Address
- City
- Website
- Logo

Business category examples:

- Salon
- Barber
- Doctor
- Dentist
- Clinic
- Lawyer
- Accountant
- Consultant
- Tutor
- Trainer
- Photographer
- Car workshop
- AC repair
- Plumber
- Electrician
- Cleaning service
- Home service
- Beauty
- Fitness
- Veterinary
- Event service
- Restaurant
- Other

Allow custom category.

## Step 2 — Business requirements

Ask:

- Do you accept appointments?
- Do you accept service requests?
- Do you accept quote requests?
- Do customers send inquiries?
- Do you have staff?
- Do customers pay online?
- Do you use WhatsApp?
- Do you use Facebook?
- Do you use Instagram?
- Do you need SMS?
- Do you need email?

## Step 3 — Initial configuration

Based on answers, enable relevant dashboard modules.

Example:

```json
{
  "appointments": true,
  "serviceRequests": true,
  "quotes": false,
  "staff": true,
  "payments": false,
  "whatsapp": true,
  "sms": true,
  "facebook": true,
  "instagram": true
}
```

Do not create separate applications for different industries.

Build one configurable platform.

---

# 6. Business Dashboard

Dashboard modules are dynamically enabled based on business configuration.

Possible navigation:

- Dashboard
- Calendar
- Bookings
- Service Requests
- Leads
- Customers
- Services
- Staff
- Forms
- Messages
- Automations
- Payments
- Analytics
- Integrations
- Settings

Dashboard summary cards:

- Today's bookings
- Pending requests
- New leads
- Upcoming appointments
- Completed bookings
- Cancelled bookings
- Revenue
- Unread messages

Example:

```text
Today's Bookings       18
Pending Requests        7
New Leads              12
Upcoming               24
Revenue            ৳18,500
```

---

# 7. Form Builder

The form builder is a core product feature.

Businesses can create multiple forms.

Examples:

- Appointment form
- Service request form
- Quote request form
- Contact form
- Consultation form
- Custom inquiry form

## Form fields

Support:

- Text
- Textarea
- Phone
- WhatsApp
- Email
- Number
- Dropdown
- Radio
- Checkbox
- Multi-select
- Date
- Time
- Date + time
- Address
- File upload
- Image upload
- Service selector
- Staff selector
- Calendar
- Payment
- Hidden field
- Consent checkbox

Each field should support:

- Label
- Placeholder
- Required
- Default value
- Help text
- Validation
- Conditional visibility
- Custom field ID

---

# 8. Conditional Logic

Forms must support conditions.

Example:

```text
IF service = AC Repair
THEN show:
- AC Type
- Brand
- Problem description
- Photo upload
```

Another:

```text
IF customer type = Existing Customer
THEN show:
- Customer ID
```

Support nested conditions where practical.

---

# 9. Multi-Step Forms

Allow:

- Single-page forms
- Multi-step forms

Example:

```text
Step 1
Select Service

↓

Step 2
Select Date & Time

↓

Step 3
Customer Information

↓

Step 4
Confirmation
```

Show progress indicator.

---

# 10. Form Design Builder

Business owners can customize the embedded form without coding.

Controls:

## Colors

- Primary
- Secondary
- Background
- Text
- Border
- Error
- Success
- Button

## Typography

- Font family
- Font size
- Heading size
- Label size

## Layout

- Single column
- Two column
- Compact
- Spacious
- Multi-step

## Components

- Border radius
- Input height
- Button style
- Button text
- Field spacing
- Section spacing
- Label position

Provide real-time preview.

The design configuration must be stored separately from form field configuration.

---

# 11. Form Distribution

Every form gets a unique ID.

Example:

`formId = abc123`

Provide multiple installation methods.

## JavaScript embed

Example:

```html
<script
  src="https://APP_DOMAIN/widget.js"
  data-form="abc123">
</script>
```

The widget must load the correct tenant/form configuration dynamically.

## HTML/JavaScript embed

Provide a documented integration option.

## WordPress shortcode

Example:

```text
[booking_form id="abc123"]
```

Create a WordPress plugin for this.

Plugin capabilities:

- Shortcode
- Elementor widget
- Gutenberg block if practical
- Form ID configuration
- Optional custom CSS
- Automatic script loading

## CMS instructions

Provide simple installation instructions for:

- WordPress
- Shopify
- Wix
- Squarespace
- Webflow
- Framer
- Custom HTML
- Other CMS platforms

Do not build native plugins for every CMS in V1.

The generic JavaScript embed should be the primary integration.

---

# 12. Widget Requirements

The widget must:

- Load asynchronously
- Not block the host website
- Be isolated from host CSS
- Avoid CSS conflicts
- Be responsive
- Work on mobile
- Support iframe or Shadow DOM isolation where appropriate
- Communicate securely with the platform API
- Support form versioning
- Track form views
- Track starts
- Track submissions
- Support UTM/source tracking

Do not expose private API keys in frontend code.

Only publish safe form identifiers/configuration.

---

# 13. Booking Engine

The booking engine must support:

- Services
- Service duration
- Staff
- Staff availability
- Business availability
- Breaks
- Holidays
- Existing bookings
- Buffer time
- Minimum notice
- Maximum advance booking
- Booking limits
- Cancellation windows
- Rescheduling
- Time zones

Example service:

```text
Service:
General Consultation

Duration:
30 minutes

Price:
৳800
```

Pricing models:

- Fixed
- Starting from
- Free
- Request quote
- Custom

Booking types:

- Appointment
- Service request
- Quote request
- Inquiry

---

# 14. Availability

Business can configure:

```text
Monday       09:00–18:00
Tuesday      09:00–18:00
Wednesday    09:00–18:00
Thursday     09:00–18:00
Friday       09:00–15:00
Saturday     Closed
Sunday       Closed
```

Support:

- Breaks
- Holidays
- Special dates
- Staff-specific availability
- Multiple branches later

---

# 15. Staff

Businesses can optionally have staff.

Staff fields:

- Name
- Photo
- Phone
- Email
- Role
- Services
- Availability
- Status

Booking options:

1. Customer selects staff
2. System assigns available staff
3. No staff selection

---

# 16. Booking Lifecycle

Use a defined state machine.

Suggested statuses:

```text
pending
confirmed
rescheduled
completed
cancelled
no_show
rejected
```

Booking events must be logged.

Example:

```text
Booking created
Booking confirmed
Reminder sent
Customer rescheduled
Booking completed
Review requested
```

---

# 17. Service Requests

A service request does not necessarily create an immediate appointment.

Example:

```text
Customer
↓
Select service
↓
Describe requirement
↓
Upload photos
↓
Provide location
↓
Preferred date
↓
Phone/WhatsApp
↓
Submit
```

Business can:

- Accept
- Reject
- Contact customer
- Send quote
- Convert request into booking

---

# 18. Quote Requests

Support:

- Description
- Photos
- Service
- Budget
- Location
- Preferred date
- Customer details

Business can create a quote.

Quote statuses:

- Draft
- Sent
- Viewed
- Accepted
- Rejected
- Expired

Quote can be converted to a booking.

---

# 19. CRM

Every interaction should map to a customer profile.

Customer fields:

- Name
- Phone
- WhatsApp
- Email
- Address
- Tags
- Source
- Notes
- Custom fields
- Total bookings
- Completed bookings
- Cancelled bookings
- Total revenue

Customer timeline:

```text
Sep 24
Facebook inquiry

Sep 24
Quote sent

Sep 25
Website booking

Sep 25
WhatsApp confirmation

Sep 26
Reminder

Sep 26
Service completed
```

Avoid duplicate customer records where possible.

Use normalized phone numbers as one important matching signal.

---

# 20. Lead Management

Lead statuses:

- New
- Contacted
- Qualified
- Quote Sent
- Booking Pending
- Booked
- Completed
- Lost
- Cancelled

Lead source:

- Website
- Facebook
- Instagram
- WhatsApp
- Google
- QR Code
- SMS
- Phone
- Manual
- Other

---

# 21. Unified Inbox

Build a central inbox architecture.

Channels:

- Website
- Facebook
- Instagram
- WhatsApp
- SMS
- Email

The UI should show conversations by customer.

Example:

```text
Inbox

Facebook       4
Instagram      7
WhatsApp      12
Website        5
SMS            2
Email          3
```

Clicking a customer shows conversation history.

Where supported by APIs, allow replies directly from the platform.

---

# 22. WhatsApp Integration

Initial focus should be WhatsApp Business / Meta-supported business messaging.

Business connects their WhatsApp business account.

Use official APIs.

Do not build around unofficial WhatsApp automation.

Support:

- Booking confirmation
- Booking reminders
- Rescheduling
- Cancellation
- Service request notifications
- Quote notifications
- Follow-ups
- Review requests

Use templates where required by WhatsApp policies.

Store:

- Message ID
- Recipient
- Status
- Sent time
- Delivered time
- Read time
- Failed reason

---

# 23. SMS Integration

Use a provider abstraction.

Do not hardcode one SMS provider into business logic.

Example:

```text
SMSService
├── Provider A
├── Provider B
└── Provider C
```

This allows Bangladesh-specific providers later.

Support:

- Confirmation
- Reminder
- OTP
- Follow-up
- Business notification

---

# 24. Email

Support:

- Confirmation
- Reminder
- Quote
- Booking changes
- Review request
- Business notifications

Use a provider abstraction.

---

# 25. Facebook Integration

Allow businesses to connect Facebook Pages through official Meta APIs.

Potential features:

- Lead capture
- Lead source attribution
- Messenger conversations where supported
- Booking CTA/links
- Customer data synchronization where permitted
- Notifications

Do not assume every Facebook feature is available through one API.

Design the integration layer so Meta permissions/capabilities can evolve.

---

# 26. Instagram Integration

Support professional/business Instagram accounts through official Meta APIs where available.

Potential features:

- Lead capture
- DM conversations where supported
- Booking links
- Source attribution

Store integration credentials securely.

---

# 27. Social Lead Flow

Example:

```text
Facebook
↓
Customer inquiry
↓
Lead created
↓
Customer matched
↓
CRM
↓
Business notification
↓
WhatsApp/SMS follow-up
↓
Booking
```

The same architecture should work for Instagram.

---

# 28. Automation Engine

Build automation as a separate subsystem.

Automation consists of:

```text
Trigger
↓
Conditions
↓
Actions
```

Example:

```text
Trigger:
Booking Created

Condition:
Booking Status = Confirmed

Action:
Send WhatsApp Confirmation

Wait:
24 hours

Action:
Send Reminder
```

Triggers:

- Lead created
- Booking created
- Booking confirmed
- Booking cancelled
- Booking rescheduled
- Booking completed
- Quote created
- Quote accepted
- Form submitted
- Customer created
- No response
- Scheduled date reached

Actions:

- Send WhatsApp
- Send SMS
- Send email
- Notify staff
- Notify business owner
- Update lead status
- Add tag
- Create booking
- Send webhook
- Wait
- Branch/condition

---

# 29. Default Automations

Provide templates.

## Booking confirmation

```text
When booking is confirmed
→ Send WhatsApp
→ Send email if enabled
```

## 24-hour reminder

```text
24 hours before appointment
→ Send WhatsApp/SMS
```

## 2-hour reminder

```text
2 hours before appointment
→ Send reminder
```

## Cancellation

```text
Booking cancelled
→ Notify business
→ Notify customer
```

## Review request

```text
After completed booking
→ Wait configurable period
→ Send review request
```

## Rebooking

```text
X days after completed service
→ Send rebooking message
```

---

# 30. Automation Reliability

Do not rely on application memory or basic cron timers for critical reminders.

Use a job queue.

Recommended:

- Redis
- BullMQ

Jobs should support:

- Retry
- Exponential backoff
- Failure logging
- Idempotency
- Dead-letter handling
- Scheduled execution

Messages must not accidentally send twice.

Use idempotency keys.

---

# 31. Payments

Payments should be modular.

Initial options:

- No payment
- Pay at business
- Advance payment
- Full payment

Bangladesh integrations should be considered:

- bKash
- Nagad
- SSLCommerz

International:

- Stripe

Payment statuses:

```text
pending
authorized
paid
failed
refunded
partially_refunded
```

Do not make payment mandatory for all businesses.

---

# 32. Analytics

Business analytics:

- Form views
- Form starts
- Form submissions
- Conversion rate
- Leads
- Bookings
- Completed bookings
- Cancelled bookings
- No-shows
- Revenue
- Source
- Service performance
- Staff performance

Lead source example:

```text
Source        Leads    Bookings    Revenue

Facebook       124        48       ৳92,000
Website         98        61       ৳121,000
Instagram       71        22       ৳41,000
WhatsApp        63        38       ৳73,000
Google          42        17       ৳35,000
```

---

# 33. Form Analytics

Track:

- Form view
- Form started
- Field progression
- Form abandoned
- Form submitted
- Conversion rate

Store source data:

- UTM source
- UTM medium
- UTM campaign
- Referrer
- Landing page
- Device
- Browser

Respect privacy requirements and avoid unnecessary personal tracking.

---

# 34. QR Codes

Every form can generate a QR code.

Example:

```text
Book an Appointment

[QR CODE]
```

Business can use QR codes on:

- Visiting cards
- Posters
- Store counters
- Receipts
- Packaging
- Social media
- Printed materials

Track QR traffic using form/source identifiers.

---

# 35. Public Form URL

Every form can have a hosted URL for fallback use.

Example:

```text
https://app.example.com/f/abc123
```

This is not a business website.

It is only the form itself.

---

# 36. Custom Domain Later

Potential future feature:

```text
book.business.com
```

But this is not required for MVP.

---

# 37. WordPress Plugin

Build a small official WordPress plugin.

Features:

- Shortcode
- Gutenberg block
- Elementor widget
- Form selector
- Automatic widget loading
- Optional caching
- Basic troubleshooting

Shortcode:

```text
[platform_form id="abc123"]
```

Do not store customer data in WordPress.

Customer submissions should go directly to the SaaS backend.

---

# 38. API Architecture

Backend should expose versioned APIs.

Example:

```text
/api/v1/auth
/api/v1/businesses
/api/v1/forms
/api/v1/form-submissions
/api/v1/services
/api/v1/staff
/api/v1/bookings
/api/v1/leads
/api/v1/customers
/api/v1/messages
/api/v1/automations
/api/v1/integrations
/api/v1/analytics
```

Separate public/embed APIs from authenticated dashboard APIs.

---

# 39. Security

Implement:

- Password hashing
- JWT or secure session authentication
- Refresh tokens
- Role-based access control
- Tenant isolation
- Input validation
- Rate limiting
- CSRF protection where applicable
- XSS protection
- Secure headers
- API authentication
- Webhook signature verification
- Encrypted integration credentials
- Audit logs

Never expose:

- Database credentials
- API secrets
- OAuth client secrets
- WhatsApp tokens
- Payment secrets

to frontend code.

---

# 40. Webhooks

Build webhook infrastructure.

Incoming:

- WhatsApp events
- Facebook events
- Instagram events
- Payment events
- Other integrations

Outgoing:

```text
booking.created
booking.confirmed
booking.cancelled
lead.created
lead.updated
customer.created
form.submitted
payment.completed
```

Businesses can eventually send events to their own systems.

---

# 41. Notifications

Business notifications:

- New lead
- New booking
- New request
- Booking cancelled
- Payment received
- New message
- Failed automation

Notification channels:

- Dashboard
- Email
- WhatsApp
- SMS

---

# 42. Multi-Branch Architecture

Support this in the data model from the beginning.

```text
Business
├── Branch A
│   ├── Staff
│   ├── Services
│   └── Availability
│
├── Branch B
│   ├── Staff
│   ├── Services
│   └── Availability
```

MVP can hide this functionality.

Do not design the database in a way that makes branches impossible later.

---

# 43. Subscription System

Build subscription architecture even if billing is initially manual.

Plans can contain:

- Number of forms
- Number of staff
- Number of bookings
- Number of messages
- WhatsApp allowance
- SMS allowance
- Number of integrations
- Automation limits
- Analytics features

Potential Bangladesh pricing to test:

```text
Free
৳0

Starter
৳499–৳699/month

Business
৳999–৳1,499/month

Pro
৳2,000–৳3,000+/month
```

These are initial product hypotheses, not fixed pricing.

Messaging costs should be usage-based or quota-based.

---

# 44. Database Design

Recommended core collections/tables:

```text
users
businesses
business_users
roles
permissions
branches
services
staff
staff_services
availability
holidays
forms
form_fields
form_versions
form_submissions
customers
customer_tags
leads
lead_events
bookings
booking_events
quotes
quote_items
payments
conversations
messages
automations
automation_runs
notifications
integrations
integration_events
webhooks
subscriptions
plans
usage_records
audit_logs
```

Every tenant-owned record must include:

```text
tenantId
```

Use indexes aggressively for:

- tenantId
- phone
- email
- booking date
- status
- createdAt
- formId
- source

---

# 45. Recommended Tech Stack

Use a modern TypeScript-first architecture.

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Component library such as shadcn/ui

## Backend

Prefer:

- Node.js
- NestJS or well-structured Express.js
- TypeScript

For a large multi-tenant SaaS, NestJS is recommended for structure, modules, dependency injection, validation, and maintainability.

## Database

- PostgreSQL is preferred for the core transactional system.

Use relational models for:

- bookings
- staff
- availability
- payments
- subscriptions
- tenants

If MongoDB is preferred, design carefully around tenant isolation and booking consistency.

For this product, PostgreSQL should be the default recommendation.

## Cache / queues

- Redis
- BullMQ

## Storage

- S3-compatible object storage

Use for:

- uploaded photos
- documents
- business logos
- form attachments

## Frontend hosting

- Vercel

## Backend hosting

Can use:

- AWS
- Railway
- Render
- Fly.io
- similar infrastructure

Use managed PostgreSQL and Redis in production.

---

# 46. Repository Structure

Recommended monorepo:

```text
/apps
  /web
  /api
  /widget
  /admin
  /wordpress-plugin

/packages
  /ui
  /types
  /validation
  /database
  /auth
  /messaging
  /automation
  /integrations
  /booking-engine
  /form-engine

/infrastructure
  /docker
  /deployment
```

If a simpler repository is preferred initially, preserve clear module boundaries.

---

# 47. Frontend Applications

## Business Dashboard

Main application for business owners and staff.

## Super Admin

Separate admin area.

## Widget

Tiny optimized frontend bundle.

Must not ship the entire dashboard application to customer websites.

The widget should be independently bundled and optimized.

---

# 48. UX Requirements

Business owners are often non-technical.

Dashboard must prioritize:

- Simple setup
- Clear labels
- Minimal configuration
- Visual feedback
- Guided onboarding
- Helpful empty states
- Mobile responsiveness

The form builder should be visual.

The integration page should clearly explain:

> Copy this code and paste it into your website.

---

# 49. Onboarding Flow

After registration:

```text
Create Account
↓
Business Information
↓
Select Business Needs
↓
Create First Service
↓
Configure Availability
↓
Create First Form
↓
Customize Form
↓
Install Form
↓
Connect WhatsApp/Facebook/etc.
↓
Finish
```

At the end:

```text
Your form is ready.

[Copy Website Code]

[WordPress Instructions]

[View Form]
```

---

# 50. Form Installation Experience

For each form show:

```text
Form:
Dental Appointment

Status:
Active

Install:

JavaScript
[Copy Code]

WordPress
[Copy Shortcode]

Shopify
[Instructions]

Wix
[Instructions]

HTML
[Copy Code]
```

Also show:

- Preview
- Test form
- Disable form
- Edit form
- Duplicate form
- Analytics

---

# 51. Customer Booking Experience

The customer-facing widget should be:

- Fast
- Responsive
- Accessible
- Mobile-first
- Simple
- Brandable

No unnecessary platform branding unless the business plan requires it.

Booking flow should require the minimum possible information.

Do not force account creation for customers.

Customers should be able to book as guests.

---

# 52. Customer Confirmation

Example:

```text
Hi John,

Your appointment with ABC Dental is confirmed.

Service:
General Consultation

Date:
25 September 2026

Time:
3:00 PM

Booking ID:
#1042

Reply to this message if you need to reschedule.
```

Use templates with variables.

Example variables:

```text
{{customer.name}}
{{business.name}}
{{service.name}}
{{booking.date}}
{{booking.time}}
{{booking.id}}
{{business.phone}}
```

---

# 53. Rescheduling

Customer should be able to reschedule where enabled.

Flow:

```text
Reminder
↓
Reschedule
↓
Available slots
↓
Customer selects slot
↓
Booking updated
↓
Business notified
↓
Confirmation sent
```

---

# 54. Cancellation

Allow configurable cancellation rules.

Example:

```text
Cancellation allowed:
Up to 4 hours before appointment
```

Business can choose:

- Customer can cancel
- Customer cannot cancel
- Cancellation requires approval

---

# 55. No-Show

After appointment time:

Business can mark:

- Completed
- No-show

No-show can trigger configurable automation.

---

# 56. AI — Phase 2

Do not make AI the foundation of MVP.

Build the platform so AI can be added later.

Potential AI features:

- Lead classification
- Automatic lead qualification
- Suggested replies
- AI receptionist
- Booking assistant
- Message summarization
- Customer intent detection
- FAQ response
- Automatic service recommendation

Example:

Customer:

> "Amar AC thanda kortese na, kalke keu ashte parbe?"

AI can identify:

```text
Intent: AC repair
Preferred date: Tomorrow
Customer language: Bangla
Booking required: Yes
```

Then query availability.

AI must not directly perform actions without appropriate confirmation/permissions.

---

# 57. Important Product Principle

Do not create industry-specific applications.

Create configurable primitives:

```text
Business
Service
Staff
Availability
Form
Lead
Customer
Booking
Request
Quote
Conversation
Message
Automation
Payment
Integration
```

Any business should be able to combine these primitives.

---

# 58. MVP Scope

Build V1 in this order.

## Phase 1

- Multi-tenant authentication
- Business onboarding
- Business dashboard
- Services
- Staff
- Availability
- Booking engine
- Customer database
- Lead management

## Phase 2

- Form builder
- Form customization
- JavaScript widget
- WordPress plugin
- Form analytics

## Phase 3

- WhatsApp integration
- SMS integration
- Email
- Automated confirmations
- Automated reminders

## Phase 4

- Facebook integration
- Instagram integration
- Unified inbox
- Lead source tracking

## Phase 5

- Automation builder
- Quotes
- Payments
- Advanced analytics
- QR codes

## Phase 6

- AI receptionist
- AI lead qualification
- Advanced integrations
- Multi-branch
- API marketplace

---

# 59. Development Requirements

The implementation must be production-oriented.

Do not build a fake demo with hardcoded data.

Use:

- Real database models
- Real authentication
- Real tenant isolation
- Real API endpoints
- Real form persistence
- Real booking availability calculations
- Real background jobs
- Real webhook handling
- Proper validation
- Error handling
- Logging
- Tests

Use environment variables for all secrets.

Provide:

`.env.example`

Never commit secrets.

---

# 60. Testing

Create tests for:

## Authentication

- Registration
- Login
- Logout
- Password reset
- Role permissions

## Tenant isolation

Business A cannot access Business B data.

This is mandatory.

## Forms

- Create
- Edit
- Delete
- Publish
- Disable
- Conditional fields
- Submission

## Booking

Test:

- Available slot
- Already booked slot
- Staff conflict
- Business closed
- Holiday
- Buffer time
- Cancellation
- Rescheduling

## Messaging

Test:

- Message creation
- Queue
- Retry
- Failed message
- Duplicate prevention

## Automations

Test:

- Trigger
- Condition
- Delay
- Action
- Retry
- Idempotency

---

# 61. Security Testing

Specifically test:

- Tenant data leakage
- Broken access control
- IDOR
- XSS
- SQL injection
- NoSQL injection if MongoDB is used
- CSRF
- Rate limiting
- File upload security
- Webhook spoofing
- OAuth token exposure
- JWT/session vulnerabilities

---

# 62. Performance Requirements

The embedded widget must be lightweight.

Do not load:

- Dashboard UI
- Admin UI
- Unused libraries

into the customer website.

Use lazy loading.

API should support pagination.

Use indexes.

Use background queues for:

- Messaging
- Analytics aggregation
- Automation execution
- Notifications

---

# 63. Future API / Developer Platform

Eventually provide API keys for businesses.

Example:

```text
POST /api/v1/bookings
POST /api/v1/leads
GET /api/v1/customers
GET /api/v1/services
```

Allow businesses to connect their own applications.

---

# 64. Important Data Flow

## Website booking

```text
Customer
↓
Business Website
↓
Embedded Widget
↓
Public API
↓
Validate
↓
Create/Match Customer
↓
Create Booking
↓
Create Lead/Event
↓
Queue Notifications
↓
WhatsApp/SMS/Email
↓
Business Dashboard
```

## Facebook lead

```text
Facebook
↓
Meta Webhook/API
↓
Integration Service
↓
Normalize Lead
↓
Match Customer
↓
Create Lead
↓
CRM
↓
Business Notification
↓
Optional Automation
```

## Booking reminder

```text
Booking
↓
Schedule Reminder Job
↓
Redis/BullMQ
↓
Worker
↓
Check booking status
↓
Check idempotency
↓
Send WhatsApp/SMS
↓
Store message result
```

---

# 65. Branding

The platform should have its own brand.

Businesses should primarily see their own brand inside forms.

Form design should allow:

- Business logo
- Brand color
- Button color
- Typography
- Custom success message

The public form should feel like it belongs to the business.

---

# 66. Final Product Model

The product should be understood as:

```text
                BUSINESS
                   │
      ┌────────────┼────────────┐
      ↓            ↓            ↓
   WEBSITE      FACEBOOK     INSTAGRAM
      │            │            │
      └────────────┼────────────┘
                   ↓
              YOUR PLATFORM
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
      FORMS      LEADS      MESSAGES
        │          │          │
        └──────────┼──────────┘
                   ↓
                  CRM
                   │
             BOOKINGS
                   │
             AUTOMATIONS
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
    WhatsApp      SMS       Email
```

The business's existing website and social channels remain in place.

The platform becomes the central operating system for their customer acquisition, booking, lead management, and communication.

---

# 67. Build Instructions for Antigravity

Start by creating the project architecture and database schema before implementing UI.

Recommended order:

1. Repository setup
2. Database schema
3. Authentication
4. Multi-tenancy
5. RBAC
6. Business onboarding
7. Services
8. Staff
9. Availability
10. Booking engine
11. Customer/CRM
12. Lead management
13. Form engine
14. Form builder UI
15. Widget
16. WordPress plugin
17. Notification architecture
18. WhatsApp adapter
19. SMS adapter
20. Email adapter
21. Automation engine
22. Facebook adapter
23. Instagram adapter
24. Unified inbox
25. Analytics
26. Payments
27. Subscription system
28. Super-admin
29. Testing
30. Production deployment

Do not skip tenant isolation.

Do not use hardcoded mock data as the final implementation.

Do not couple the form widget directly to a specific business category.

Do not hardcode WhatsApp/SMS providers into business logic.

Use interfaces/adapters for external services.

Keep the architecture modular so new channels can be added later without rewriting the CRM or booking engine.

The first production milestone should be:

> A real business can sign up, configure a service, create a booking form, customize it, copy the JavaScript embed or WordPress shortcode, install it on an existing website, receive a real booking, see the customer in the dashboard, and send a real confirmation/reminder through the configured communication channel.

# 68. Pricing, Lead Quotas & Messaging Economics

The initial commercial model should be based on **lead volume**, not unlimited messaging.

The business pays for a monthly lead allowance. Each lead receives a configurable communication allowance. This gives the platform predictable messaging costs and prevents unlimited WhatsApp/SMS usage from destroying margins.

## Package 1 — Starter

Target price:

**৳500/month**

Included:

- 50 leads/month
- 3 WhatsApp messages per lead
- 2 SMS messages per lead
- 3 emails per lead
- Website embedded forms
- WordPress shortcode/plugin
- Basic booking system
- Customer CRM
- Basic reminders
- Basic analytics

Maximum included monthly communication volume:

```text
50 leads
× 3 WhatsApp = 150 WhatsApp messages
× 2 SMS      = 100 SMS messages
× 3 emails   = 150 emails
```

A lead is counted once. Multiple interactions with the same lead/customer do not create additional leads.

## Important Messaging Rule

The quota applies to **outbound platform-generated/business messages**. Customer inbound replies should not consume the business's outbound allowance.

The platform should track usage separately:

```text
Lead #1024

WhatsApp
Used: 2 / 3

SMS
Used: 1 / 2

Email
Used: 2 / 3
```

When the allowance is exhausted, the automation engine must not send additional chargeable messages automatically. The business should see the limit and have options to upgrade or purchase additional usage.

## Approximate Package 1 Messaging Cost

Messaging costs are variable and must be calculated from the actual provider, country, message category, and current provider pricing. Do not hardcode these costs into the application.

As a planning example for 50 leads:

### WhatsApp

Maximum: 150 messages/month.

For direct Meta WhatsApp Cloud API, use the applicable Bangladesh rate for the message category. Utility/transactional messages should be preferred for booking confirmations and reminders. Marketing messaging must be treated separately because it can have substantially different pricing.

For September 2026, an illustrative Bangladesh utility rate of approximately **$0.0113/message** gives:

```text
150 × $0.0113 = $1.695
```

At an illustrative exchange rate of approximately ৳123.2/USD:

```text
≈ ৳209
```

A published October 2026 rate change is expected to reduce the Bangladesh utility rate to approximately **$0.0037/message**, which would make the same 150 messages approximately:

```text
150 × $0.0037 = $0.555
≈ ৳68
```

These figures are planning estimates only. The application must retrieve/configure current provider pricing rather than assume a permanent rate.

If a third-party WhatsApp provider such as Twilio is used, its additional platform fee must be included. Prefer a direct Meta integration for cost control where practical.

### SMS

Maximum: 100 SMS/month.

Bangladesh SMS provider pricing varies. For planning, a provider price range of approximately **৳0.25–৳0.55 per SMS** gives:

```text
100 × ৳0.25 = ৳25
100 × ৳0.55 = ৳55
```

Therefore budget approximately **৳25–৳55** for 100 standard SMS messages.

Unicode/Bangla SMS can consume multiple SMS segments. The messaging service must calculate actual provider message segments rather than assuming one message always equals one SMS segment.

### Email

Maximum: 150 emails/month.

Email cost should initially be negligible. For example, a provider such as Resend currently offers a free allowance that is well above 150 emails/month.

Do not make email cost assumptions permanent; use a provider adapter and configurable limits.

### Package 1 Estimated Maximum Communication Cost

Using the above planning assumptions:

```text
Direct Meta WhatsApp:
≈ ৳209 current illustrative utility cost

SMS:
≈ ৳25–৳55

Email:
≈ ৳0 at low volume

Total:
≈ ৳234–৳264 per business/month
```

After the planned October 2026 utility rate change, using the illustrative $0.0037 WhatsApp utility rate:

```text
WhatsApp ≈ ৳68
SMS       ≈ ৳25–৳55
Email     ≈ ৳0

Total     ≈ ৳93–৳123 per business/month
```

These numbers are not guaranteed costs. Provider, Meta, exchange-rate, tax, SMS segmentation, message category, and messaging volume can change the actual amount.

## Pricing Margin Principle

The subscription price must cover:

- Hosting
- Database
- Backups
- Object storage
- Email
- WhatsApp
- SMS
- Payment fees
- Support
- Monitoring
- Other infrastructure

Do not offer unlimited WhatsApp or SMS at the ৳500 plan.

The platform should always know the maximum communication liability created by each plan.

## Suggested Future Plans

These are initial pricing hypotheses and should be adjustable from the Super Admin panel.

### Starter — ৳500/month

```text
50 leads
3 WhatsApp / lead
2 SMS / lead
3 emails / lead
Basic booking
Basic CRM
Website widget
WordPress integration
```

### Business — ৳1,000/month

```text
150 leads
4 WhatsApp / lead
3 SMS / lead
5 emails / lead
Advanced booking
Staff
Advanced CRM
WhatsApp automation
Facebook/Instagram integration
Advanced analytics
```

### Pro — ৳2,000/month

```text
500 leads
5 WhatsApp / lead
4 SMS / lead
8 emails / lead
Advanced automation
Quotes
Payments
Advanced analytics
API access
Priority features
```

### Enterprise

Custom lead and messaging limits.

## Overage

When a business approaches its quota, show usage clearly:

```text
48 / 50 leads used
```

When the limit is reached, offer:

- Upgrade plan
- Purchase additional leads
- Purchase additional messaging credits

Do not silently stop important customer communication without showing the business what happened.

## Billing Data Model

Track quota and usage independently.

Example:

```text
Tenant
├── subscriptionPlan
├── billingCycle
├── leadQuota
├── leadsUsed
├── whatsappQuota
├── whatsappUsed
├── smsQuota
├── smsUsed
├── emailQuota
└── emailUsed
```

Also maintain a usage ledger:

```text
usage_records
├── tenantId
├── leadId
├── channel
├── messageType
├── quantity
├── provider
├── providerCost
├── currency
├── createdAt
└── metadata
```

This allows the platform owner to calculate actual cost and margin per tenant.

## Message Categories

The platform should distinguish at minimum:

- Transactional/utility
- Authentication/OTP
- Marketing
- Customer service/inbound

Booking confirmations and reminders should use the appropriate utility/transactional mechanism supported by the provider.

Do not allow a low-cost transactional quota to be used as an unlimited marketing campaign allowance.

## Automation Cost Control

The automation engine must check quota before sending a chargeable outbound message.

Flow:

```text
Automation Trigger
↓
Check Customer
↓
Check Lead
↓
Check Channel
↓
Check Message Category
↓
Check Quota
↓
Reserve Usage
↓
Queue Message
↓
Send
↓
Record Provider Result
```

Use an atomic reservation/usage mechanism so concurrent workers cannot exceed the same quota accidentally.

If sending fails, define whether the reserved usage is restored based on the provider's failure response.

## Product Economics Goal

The initial goal is not maximum profit from the first 20 customers. The goal is to validate that Bangladeshi businesses will pay a recurring subscription for the platform.

At 20 businesses on the Starter plan:

```text
20 × ৳500 = ৳10,000 MRR
```

Maximum Starter usage across 20 businesses:

```text
1,000 leads
3,000 WhatsApp messages
2,000 SMS
3,000 emails
```

The platform should monitor actual usage before changing plan quotas.

## Important Implementation Requirement

All pricing, quotas, message allowances, overage prices, and provider costs must be configurable in the Super Admin panel.

Do not hardcode:

- 50 leads
- 3 WhatsApp messages
- 2 SMS
- 3 emails
- Provider prices

These are initial commercial settings, not permanent technical constants.
