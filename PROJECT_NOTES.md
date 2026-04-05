# Real Estate Management App — Project Notes

## What This App Does

Two-role app: **Owner** manages properties, units, tenants, leases, and maintenance requests. **Tenants** submit maintenance requests with photos, view their assigned property, and download their lease.

No payment features. Designed for small landlords (1–5 units).

---

## Stack

| Layer | Tool |
|---|---|
| Frontend | React + Vite (JavaScript) |
| Database + Auth | Supabase (Postgres + JWT auth) |
| Storage | Supabase Storage (private buckets) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` plugin |
| Components | shadcn/ui |
| Routing | React Router v6 |
| Toasts | Sonner |

---

## Project Structure

```
src/
├── lib/
│   ├── supabase.js              # Supabase singleton client
│   └── utils.js                 # cn() helper
├── context/
│   └── AuthContext.jsx          # Session + profile state (critical — see notes)
├── hooks/
│   ├── useProperties.js         # Properties + units CRUD
│   ├── useTenants.js            # Tenant CRUD + account creation
│   ├── useLeases.js             # Lease upload/download/delete
│   └── useMaintenanceRequests.js # Maintenance CRUD + photo upload
├── components/
│   ├── auth/ProtectedRoute.jsx  # Blocks wrong-role access, redirects to login
│   ├── layout/AppShell.jsx      # Sidebar + TopBar wrapper
│   ├── layout/Sidebar.jsx       # Role-aware navigation
│   ├── layout/TopBar.jsx        # Header with sign out
│   └── maintenance/StatusBadge.jsx
└── pages/
    ├── LoginPage.jsx
    ├── owner/
    │   ├── OwnerDashboard.jsx
    │   ├── PropertiesPage.jsx
    │   ├── PropertyDetailPage.jsx   # Units management
    │   ├── TenantsPage.jsx          # Add tenant + list
    │   ├── TenantDetailPage.jsx     # Lease upload + tenant info
    │   └── MaintenancePage.jsx      # View + update requests + photos
    └── tenant/
        ├── TenantDashboard.jsx
        ├── MyPropertyPage.jsx       # Assigned property + unit
        ├── MyMaintenancePage.jsx    # Submit + view requests
        └── MyLeasePage.jsx          # View + download lease PDF

supabase/schema.sql                  # Full DB schema + RLS + storage policies
```

---

## Routes

```
/login                    → LoginPage (public)
/                         → RootRedirect (sends to dashboard by role)

/owner/dashboard          → OwnerDashboard
/owner/properties         → PropertiesPage
/owner/properties/:id     → PropertyDetailPage
/owner/tenants            → TenantsPage
/owner/tenants/:id        → TenantDetailPage
/owner/maintenance        → MaintenancePage

/tenant/dashboard         → TenantDashboard
/tenant/property          → MyPropertyPage
/tenant/maintenance       → MyMaintenancePage
/tenant/lease             → MyLeasePage
```

All `/owner/*` and `/tenant/*` routes are wrapped in `ProtectedRoute` with a required role. Wrong role → redirected to their own dashboard. No session → redirected to `/login`.

---

## Supabase Database Tables

| Table | Purpose |
|---|---|
| `profiles` | Extends `auth.users`. Stores `full_name`, `email`, `role` (owner/tenant) |
| `properties` | Owned by `owner_id`. Has address fields + optional description |
| `units` | Belongs to a property. Just a `unit_number` text field |
| `tenants` | Links a `profile_id` to a `unit_id` + `property_id`. Has `is_active` flag |
| `leases` | PDF metadata for a tenant. Points to file in `leases` storage bucket |
| `maintenance_requests` | Submitted by tenant, updated by owner. Has `status` enum: open/in_progress/resolved |
| `maintenance_photos` | Photos attached to a maintenance request, stored in `maintenance-photos` bucket |

A DB trigger (`handle_new_user`) auto-creates a `profiles` row whenever a new `auth.users` row is inserted, pulling `full_name` and `role` from `raw_user_meta_data`.

---

## Storage Buckets

Two **private** buckets — create these in Supabase Dashboard → Storage:

| Bucket | Used for |
|---|---|
| `leases` | Lease PDFs, uploaded by owner |
| `maintenance-photos` | Maintenance photos, uploaded by tenant |

Files are accessed via **signed URLs** (1-hour expiry) using `createSignedUrl()`. Never publicly accessible.

---

## Key Technical Decisions & Why

### 1. AuthContext uses two separate effects

```js
// Effect 1: only manages session state — NO database calls
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => setSession(session ?? null))
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session ?? null)
  })
  return () => subscription.unsubscribe()
}, [])

// Effect 2: fetches profile once session is known
useEffect(() => {
  if (session === undefined) return  // not initialized yet
  if (!session) { setProfile(null); setLoading(false); return }
  supabase.from('profiles').select('*').eq('id', session.user.id).single()
    .then(({ data }) => { setProfile(data ?? null); setLoading(false) })
}, [session?.user?.id, session === null])
```

**Why:** Calling the Supabase DB inside `onAuthStateChange` causes a deadlock — Supabase holds an internal auth lock while the event fires, and a DB call that needs auth will hang forever. Keeping the auth callback pure (only `setState`) and doing the DB fetch in a separate effect avoids this completely.

**Why `session === undefined` (not `null`):** `undefined` means "not initialized yet, don't know". `null` means "we checked, no session". The loading state depends on this distinction — if you start with `null`, the app briefly flashes "no session" before the real check completes.

**Why `session === null` in the dependency array:** When the session goes from `undefined` → `null` (incognito/logged out), `session?.user?.id` stays `undefined` in both states, so React skips the effect. Adding `session === null` as a second dependency ensures it runs on that specific transition.

### 2. Tenant creation uses `signUp` + session restore (not an Edge Function)

```js
async function createTenant(values) {
  const { data: { session: ownerSession } } = await supabase.auth.getSession()
  const { data: authData } = await supabase.auth.signUp({ email, password, options: { data: { full_name, role: 'tenant' } } })
  // Restore owner session immediately — signUp() logs in as the new user
  await supabase.auth.setSession({ access_token: ownerSession.access_token, refresh_token: ownerSession.refresh_token })
  await supabase.from('tenants').insert({ profile_id: authData.user.id, ... })
}
```

**Why not an Edge Function:** Supabase Edge Functions require deployment via the CLI and a service role key. For a simple app this adds a lot of complexity. The `signUp()` approach works client-side with one catch: calling `signUp()` logs in as the new tenant, briefly replacing the owner's session. We fix this by saving the owner's tokens first and restoring them right after.

**Requirement:** Email confirmation must be **disabled** in Supabase Dashboard → Authentication → Settings, otherwise `signUp()` returns a user with no session and the session restore pattern breaks.

### 3. RLS uses direct checks (no security definer functions)

Earlier versions used `security definer` helper functions to prevent cross-table RLS recursion. The current schema uses direct `exists(select 1 from ...)` subqueries in policies, which works because the query planner handles these without infinite loops as long as each policy only references tables in one direction (properties → units → tenants, not back up the chain).

If you ever see a 500 error on a Supabase query that worked before, check for RLS recursion — the fix is to wrap the problematic cross-table lookup in a `security definer` function.

### 4. `unit_number` is just a text label

Units only store a name (e.g. "Unit 1", "Top Floor", "Basement"). No bedrooms/bathrooms/sq_ft. Kept simple because the app targets small landlords who don't need that data.

---

## Environment Variables

Create a `.env` file at the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** The anon key must be the JWT-format key (starts with `eyJ`), found in Supabase Dashboard → Settings → API → `anon` `public`. The `sb_publishable_*` key shown in some places is NOT a JWT and will cause 500 errors from PostgREST.

---

## Supabase Setup Checklist

- [ ] Run `supabase/schema.sql` in SQL Editor
- [ ] Disable email confirmation: Authentication → Settings → "Enable email confirmations" → OFF
- [ ] Create `leases` storage bucket (private)
- [ ] Create `maintenance-photos` storage bucket (private)
- [ ] Run storage policy block from `schema.sql` (bottom of file) in SQL Editor
- [ ] Create owner account by signing up with `role: 'owner'` in metadata (or manually update `profiles.role` in the dashboard)

---

## What's Working

- Owner login + redirect to `/owner/dashboard`
- Tenant login + redirect to `/tenant/dashboard`
- Owner: create/delete properties
- Owner: add/delete units per property
- Owner: create tenant accounts (with email + password), assign to unit
- Owner: deactivate tenants
- Owner: upload lease PDF to a tenant's record
- Owner: view, delete, manage lease documents
- Owner: view all maintenance requests, see photos, update status + add notes
- Tenant: view their assigned property + unit
- Tenant: submit maintenance request with title, description, and photos
- Tenant: view their own maintenance requests + status updates
- Tenant: view and download lease PDFs

---

## Known Constraints

- No self-service tenant signup — owner must create tenant accounts
- No password reset flow implemented yet
- No email notifications
- Photos in maintenance requests are view-only from the tenant side (they can see status updates and owner notes, but not their own uploaded photos after submission)
