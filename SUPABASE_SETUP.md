# Connecting ClientFlow to your Supabase PostgreSQL Database

ClientFlow uses **Prisma ORM** with **PostgreSQL**, which connects seamlessly to Supabase.

---

## 1. Retrieve your Supabase Connection Strings

1. Open your project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Project Settings** → **Database**.
3. Under **Connection string**, select **URI**:
   - **Pooled connection string** (Transaction pooler, Port `6543`) → use this as `DATABASE_URL`.
   - **Direct connection string** (Session mode, Port `5432`) → use this as `DIRECT_URL`.

---

## 2. Update your `.env` file

Open `.env` in `c:\business\ClientFlow` and paste your credentials:

```bash
# 1. Supabase PostgreSQL connection strings:
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:5432/postgres"

# 2. Supabase API credentials (found under Project Settings -> API):
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# 3. Application Security Secrets:
NEXTAUTH_SECRET="your-secure-random-secret"
JWT_SECRET="your-jwt-secret"
```

---

## 3. Push the Schema to Supabase

Once you have added your connection string to `.env`, run:

```bash
npx prisma db push
```

This will automatically create all 32 multi-tenant tables, relations, and indexes in your Supabase database:
- `businesses` (tenants)
- `users`, `business_users`
- `services`, `staff`, `availability`, `holidays`
- `forms`, `form_fields`, `form_submissions`
- `customers`, `leads`, `lead_events`
- `bookings`, `booking_events`
- `usage_records` (outbound message tracking ledger)
- `conversations`, `messages`, `automations`, `plans`

---

## 4. Launch the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to create your first business workspace!
