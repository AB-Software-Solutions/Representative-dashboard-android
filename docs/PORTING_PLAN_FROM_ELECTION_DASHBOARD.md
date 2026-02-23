## Porting plan: ElectionDashboard (web) → representative-dashboard-android (Expo / React Native)

This doc is the “bridge” between:

- **Source of truth (web)**: `/home/onexys/abss/projects/election/ElectionDashboard`
- **Target (mobile)**: this repo (`representative-dashboard-android`)

The web app already defines:

- Feature modules and screens (React Router routes)
- Auth model (Amplify/Cognito) and RBAC (role + permissions)
- Backend contract (OpenAPI) and how requests are made (Amplify REST)

The fastest path is to **reuse the same backend + same auth**, and build a mobile UI optimized for field usage.

---

## 1) What to port (high-level feature list)

From `ElectionDashboard/src/routes/sections/dashboard.jsx`, the main modules are:

- **Analytics**
- **Voters** (list / filters / profile / edit / bulk upload / download)
- **Identifiers** (list / edit / voters under identifier)
- **Representatives** (list / edit / application / voters / profile)
- **Transportations** (list / edit / application / profile)
- **Election Points** (list / voters / representatives)
- **Schedules**
- **Training Courses**
- **Members**
- **Parties**
- **Parking Lot**
- **Election Results**
- **List Analytics**
- **Member Schedules**

The backend endpoints for these live in:

- `ElectionDashboard/public/developers/openapi.yaml`

---

## 2) Decide the mobile persona first (recommended)

Before implementing “everything”, pick the **primary role** this Android app is for:

- `representative`
- `manager`
- `identifier`
- `member`
- `admin`

The web app drives feature access via:

- Role: Cognito custom attribute `custom:role`
- Permissions: `custom:permissions` (JSON array)
  - See: `ElectionDashboard/src/utils/permissions-list.js`
  - Loaded by: `ElectionDashboard/src/redux/features/usersPermission/usersPermissionSlice.js`

**Recommendation**: start mobile with **representative** (or manager) flows:

- My voter list
- Voter profile
- Mark voted (`PATCH /voters/{voterId}/vote`)
- Lightweight search/filter
- Minimal analytics cards

---

## 3) Auth + API approach on mobile (match the web)

The web app uses:

- `aws-amplify/auth` for sign-in/session
- `aws-amplify/api` (`get/post/patch/del`) for REST endpoints using `apiName` and `apiURL`

On mobile (Expo), we should mirror this:

- **Install**: `aws-amplify`
- **Configure**: Cognito + REST API in the RN app startup (similar to web’s `src/main.jsx`)
- **Session**:
  - Fetch user attributes (role/permissions)
  - Keep tokens in memory; if you persist, use something like `expo-secure-store`

Why this is best:

- Backend already expects this auth model (OpenAPI security scheme is `Authorization` header / IAM-style)
- You avoid rewriting auth and signing logic

---

## 4) Suggested mobile architecture (simple and scalable)

In this repo, introduce a `src/` structure like:

- `src/navigation/` — React Navigation stacks/tabs
- `src/auth/` — Amplify auth wrapper + session/role loading
- `src/api/` — thin request helpers (Amplify REST calls)
- `src/features/<module>/` — screens + state (Redux Toolkit or Zustand)
- `src/components/` — shared UI

State choice:

- **Redux Toolkit** is the easiest port** because the web project already uses slices/thunks.

Navigation:

- Use React Navigation (native stack + bottom tabs / drawer).

---

## 5) Screen-by-screen mapping (web → mobile)

Below is a practical mapping you can implement incrementally.

### Voters

- **Mobile screens**
  - `VotersListScreen` (search + filters + pagination)
  - `VoterProfileScreen` (details + actions)
  - `VoterEditScreen` (only fields allowed by your role)
- **Backend**
  - `GET /voters?page&limit&...filters`
  - `GET /voters/{voterId}`
  - `PATCH /voters/{voterId}` (edit)
  - `PATCH /voters/{voterId}/vote` (mark voted)
- **Web reference**
  - Route: `/dashboard/voter/*`
  - Slice: `ElectionDashboard/src/redux/features/voters/voterSlice.js`

### Representatives (if relevant for your persona)

- **Mobile screens**
  - `RepresentativesListScreen`
  - `RepresentativeProfileScreen`
  - `RepresentativeApplicationScreen` (admin/manager)
  - `RepresentativeVotersScreen`
- **Backend**
  - `GET /representatives`
  - `GET /representatives/{representativeId}`
  - `PATCH /representatives/{representativeId}`
  - `PATCH /representatives/{representativeId}/application`
  - `GET /representatives/{representativeId}/voters`
- **Web reference**
  - Slice: `ElectionDashboard/src/redux/features/representative/representativeSlice.js`

### Election Points

- **Mobile screens**
  - `ElectionPointsListScreen`
  - `ElectionPointVotersScreen`
  - `ElectionPointRepresentativesScreen`
- **Backend**
  - `GET /election-points`
  - `GET /election-points/{electionPointId}/voters`
  - `GET /election-points/{electionPointId}/representatives`

### Analytics (mobile-friendly)

- **Mobile screens**
  - `AnalyticsOverviewScreen` (cards + a couple charts)
  - (optional) `AnalyticsTablesScreen` for heavy tables (later)
- **Backend (examples)**
  - `GET /analytics/supporters`
  - `GET /analytics/record-area-stats`
  - `GET /analytics/election-point-stats`
  - `GET /analytics/election-points-representatives-stats`

### Lookup data (Locations / Religions / Political affiliations)

You’ll need these for filters and forms:

- `GET /governates`
- `GET /districts`
- `GET /areas`
- `GET /electoral-districts`
- `GET /religions`
- `GET /political-affiliations`

---

## 6) Implementation phases (recommended order)

### Phase 1 — “App shell + login + gated navigation”

- Add Amplify auth (Cognito sign-in)
- Fetch role/permissions after login
- Implement navigation with 2–4 tabs based on persona:
  - Voters
  - Analytics
  - (optional) Election Points / Profile

### Phase 2 — “Voters MVP”

- Voters list (server pagination + basic filters)
- Voter profile (read-only)
- Mark voted

### Phase 3 — “Edits and assignments”

- Voter edit (PATCH /voters/{id})
- Representative voters list / election point voters list (if needed)

### Phase 4 — “Nice to have / heavier modules”

- Downloads (XLSX endpoints)
- Transportations / Parking Lot / Training Courses
- Admin user management

---

## 7) Open questions I need from you to finalize the port plan

1) **Primary persona** for the Android app (representative vs manager vs identifier vs member vs admin)?
2) Do you want **Cognito username/password** login (same as web) or keep **Facebook login**?
3) Which 3 screens must exist in v1?

