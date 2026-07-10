# IPMS System Architecture

Installer Program Management System — Fronus Solar Energy

Complete system architecture diagram for the IPMS Next.js application (App Router, React Server Components, MongoDB, Vercel deployment).

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Layer 1 — Client](#layer-1--client)
3. [Layer 2 — Rendering & Framework](#layer-2--rendering--framework)
4. [Layer 3 — Data Access & Caching](#layer-3--data-access--caching)
5. [Layer 4 — External Services & Database](#layer-4--external-services--database)
6. [Layer 5 — Infrastructure & CI/CD](#layer-5--infrastructure--cicd)
7. [Request Lifecycle](#request-lifecycle)
8. [Authentication Flow](#authentication-flow)
9. [Installer Registration Flow](#installer-registration-flow)
10. [Caching Strategy](#caching-strategy)
11. [Rendering Modes](#rendering-modes)

---

## System Overview

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#6366f1',
  'primaryTextColor': '#f8fafc',
  'primaryBorderColor': '#818cf8',
  'lineColor': '#94a3b8',
  'secondaryColor': '#1e293b',
  'tertiaryColor': '#0f172a',
  'fontSize': '13px',
  'fontFamily': 'system-ui'
}}}%%

graph TB
    subgraph CLIENT["<b>LAYER 1 — CLIENT</b>"]
        direction LR
        BROWSERS["🖥️ Web Browsers<br/>📱 Mobile Devices"]
        CLIENT_COMPONENTS["React Client Components<br/><code>'use client'</code>"]
        GLOBAL_STATE["Global State<br/>React Query Cache<br/>Context API"]
        UI_BOUNDARIES["Suspense Boundaries<br/>Loading States<br/>Error Boundaries"]

        BROWSERS -->|"HTTP/WS"| CLIENT_COMPONENTS
        CLIENT_COMPONENTS --> GLOBAL_STATE
        CLIENT_COMPONENTS --> UI_BOUNDARIES
    end

    subgraph FRAMEWORK["<b>LAYER 2 — RENDERING & FRAMEWORK</b>"]
        direction TB
        subgraph ROUTES["App Router"]
            DASHBOARD["(dashboard)/<br/>activity · batch-jobs · dashboard<br/>installers · profile · reports<br/>rewards · settings · team"]
            LANDING["(landing)/<br/>page.tsx — Marketing Site"]
            STANDALONE["(standalone)/<br/>auth · installer · my-stats"]
        end

        subgraph SERVER_EXEC["Server Execution"]
            RSC["React Server Components<br/>Direct DB/API calls"]
            SERVER_ACTIONS["Server Actions<br/>Form mutations"]
            ROUTE_HANDLERS["Route Handlers<br/>/api/* endpoints"]
        end

        MIDDLEWARE["Middleware<br/>Auth redirect · Edge runtime"]
        RENDERING_MODES["Rendering Modes<br/>SSG · ISR · Dynamic"]
    end

    subgraph DATA_ACCESS["<b>LAYER 3 — DATA ACCESS & CACHING</b>"]
        direction LR
        subgraph CACHE_LAYERS["Cache Layers"]
            DATA_CACHE["Next.js Data Cache<br/>Route segment cache"]
            REQUEST_MEMO["Request Memoization<br/>fetch() dedup"]
            ROUTER_CACHE["Router Cache<br/>Client-side prefetch"]
            REACT_QUERY["@tanstack/react-query<br/>staleTime: 30s · gcTime: 5m"]
        end

        subgraph ORM["Data Access"]
            MONGOOSE["Mongoose ODM<br/>10 Models"]
            DB_CONNECT["dbConnect()<br/>Singleton · Pool: 10"]
        end
    end

    subgraph EXTERNAL["<b>LAYER 4 — EXTERNAL SERVICES & DATABASE</b>"]
        direction LR
        subgraph DATABASE["Database"]
            MONGODB["MongoDB Atlas<br/>10 Collections"]
        end

        subgraph APIS["Third-party APIs"]
            NEXTAUTH["NextAuth v5<br/>Credentials Provider"]
            WHATSAPP["WhatsApp Cloud API<br/>Meta · Free-form msgs"]
            GOOGLE_CONTACTS["Google Contacts API<br/>People API"]
            NODEMAILER["Nodemailer<br/>Password Reset PIN"]
            EXCELJS["ExcelJS<br/>Report Export"]
        end

        subgraph STORAGE["Storage / CDN"]
            VERCEL_BLOB["Vercel Blob<br/>File Uploads"]
            PUBLIC_ASSETS["public/<br/>Fonts · Images · SW"]
        end
    end

    subgraph INFRA["<b>LAYER 5 — INFRASTRUCTURE & CI/CD</b>"]
        direction LR
        subgraph HOSTING["Hosting"]
            VERCEL_EDGE["Vercel Edge Network<br/>Serverless Functions<br/>ISR/SSG Cache"]
        end

        subgraph CICD["CI/CD Pipeline"]
            GITHUB["GitHub<br/>Git Version Control"]
            PIPELINE["Automated Pipeline<br/>ESLint · tsc · Vitest<br/>Build · Preview Deploy"]
        end

        subgraph MONITORING["Monitoring"]
            ACTIVITY_LOG["Activity Logger<br/>Audit Trail"]
            RATE_LIMIT["Rate Limiter<br/>Login Throttle"]
        end
    end

    CLIENT -->|"HTTPS"| MIDDLEWARE
    MIDDLEWARE -->|"Route match"| ROUTES
    ROUTES --> SERVER_EXEC
    SERVER_EXEC --> CACHE_LAYERS
    CACHE_LAYERS --> MONGOOSE
    MONGOOSE -->|"MongoDB SRV"| MONGODB
    SERVER_EXEC --> APIS
    SERVER_EXEC --> STORAGE
    HOSTING -->|"Git push"| GITHUB
    GITHUB --> PIPELINE
    PIPELINE -->|"Deploy"| HOSTING

    style CLIENT fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style FRAMEWORK fill:#172554,stroke:#3b82f6,color:#dbeafe
    style DATA_ACCESS fill:#14532d,stroke:#22c55e,color:#dcfce7
    style EXTERNAL fill:#7c2d12,stroke:#f97316,color:#fed7aa
    style INFRA fill:#581c87,stroke:#a855f7,color:#e9d5ff
```

---

## Layer 1 — Client

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#6366f1',
  'primaryTextColor': '#f8fafc',
  'lineColor': '#94a3b8',
  'fontSize': '13px'
}}}%%

graph LR
    subgraph BROWSER["Browser / Mobile"]
        USER["👤 User"]
        SERVICE_WORKER["Service Worker<br/><code>/sw.js</code>"]
        CACHE_API["Cache API<br/>Offline Support"]
    end

    subgraph CLIENT_COMPONENTS["Client Components ('use client')"]
        direction TB
        PROVIDERS["providers.tsx<br/>SessionProvider<br/>QueryClientProvider<br/>Toaster"]
        THEME["ThemeProvider<br/>Dark/Light/System"]
        BATCH_CONTEXT["BatchJobProvider<br/>SSE/Polling"]
        BREADCRUMB["BreadcrumbContext"]

        FORMS["Form Components<br/>react-hook-form + zod"]
        TABLES["Data Tables<br/>@tanstack/react-virtual"]
        MODALS["Dialogs / Drawers<br/>Radix UI"]
        CHARTS["Charts<br/>Recharts"]
    end

    subgraph STATE_MANAGEMENT["State & Caching"]
        direction TB
        REACT_QUERY["React Query Client<br/>• staleTime: 30s<br/>• gcTime: 5m<br/>• refetchOnWindowFocus: false<br/>• retry: 1"]
        CONTEXT_STATE["React Context<br/>BatchJobContext<br/>BreadcrumbContext"]
        URL_STATE["URL State<br/>Search params<br/>Route segments"]
    end

    subgraph UI_BOUNDARIES["UI Boundaries"]
        direction TB
        SUSPENSE["Suspense<br/>Streaming SSR"]
        LOADING["loading.tsx<br/>Route-level loading"]
        ERROR_BOUNDARY["error.tsx<br/>Route-level errors"]
        GLOBAL_ERROR["global-error.tsx<br/>Root-level errors"]
        NOT_FOUND["not-found.tsx<br/>404 page"]
    end

    USER -->|"Interaction"| CLIENT_COMPONENTS
    SERVICE_WORKER --> CACHE_API
    CLIENT_COMPONENTS --> STATE_MANAGEMENT
    CLIENT_COMPONENTS --> UI_BOUNDARIES

    style BROWSER fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style CLIENT_COMPONENTS fill:#1e3a5f,stroke:#38bdf8,color:#e0f2fe
    style STATE_MANAGEMENT fill:#14532d,stroke:#22c55e,color:#dcfce7
    style UI_BOUNDARIES fill:#713f12,stroke:#eab308,color:#fef9c3
```

### Client Component Inventory

| Component | Location | Purpose |
|---|---|---|
| `providers.tsx` | `app/providers.tsx` | Wraps SessionProvider, QueryClientProvider, Toaster |
| `BatchJobProvider` | `contexts/BatchJobContext.tsx` | SSE/polling for bulk operation progress |
| `OfflineIndicator` | `components/OfflineIndicator.tsx` | Network status detection |
| `BatchJobProgress` | `components/BatchJobProgress.tsx` | Real-time progress UI |
| Forms | `components/registration/*` | Installer registration with validation |
| Tables | `components/installers/*` | Virtualized data tables |
| Charts | `components/*` | Dashboard analytics (Recharts) |

---

## Layer 2 — Rendering & Framework

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#3b82f6',
  'primaryTextColor': '#f8fafc',
  'lineColor': '#94a3b8',
  'fontSize': '13px'
}}}%%

graph TB
    subgraph MIDDLEWARE["Middleware (proxy.ts)"]
        direction LR
        EDGE_AUTH["Edge Auth Check<br/>Cookie presence only"]
        PUBLIC_ROUTES["Public Routes<br/>/, /auth/*, /installer/*<br/>/my-stats, /_next/*"]
        PROTECTED_REDIRECT["Protected Redirect<br/>→ /auth/signin"]
    end

    subgraph ROUTE_GROUPS["App Router Route Groups"]
        direction TB

        subgraph DASHBOARD_GROUP["(dashboard)/ — Protected"]
            D_DASH["/dashboard<br/>Overview stats"]
            D_INSTALLERS["/installers<br/>CRUD + search + filters"]
            D_REWARDS["/rewards<br/>Payment tracking"]
            D_TEAM["/team<br/>Role management"]
            D_REPORTS["/reports<br/>Excel export"]
            D_ACTIVITY["/activity<br/>Audit log"]
            D_BATCH["/batch-jobs<br/>Bulk operations"]
            D_SETTINGS["/settings<br/>System config"]
            D_PROFILE["/profile<br/>User profile"]
        end

        subgraph LANDING_GROUP["(landing)/ — Public"]
            L_PAGE["/ — Marketing page"]
            L_LAYOUT["Landing layout<br/>No auth required"]
        end

        subgraph STANDALONE_GROUP["(standalone)/ — Mixed"]
            S_SIGNIN["/auth/signin<br/>Credentials login"]
            S_INSTALLER["/installer/[id]<br/>Installer portal"]
            S_STATS["/my-stats<br/>Public stats"]
        end
    end

    subgraph SERVER_COMPONENTS["React Server Components"]
        direction TB
        RSC_EXEC["RSC Execution<br/>Runs on server only"]
        DIRECT_DB["Direct DB Calls<br/>Mongoose queries"]
        DIRECT_API["Direct API Calls<br/>Internal fetch"]
        NO_CLIENT["No 'use client'<br/>Zero client JS"]
    end

    subgraph SERVER_ACTIONS["Server Actions"]
        direction TB
        MUTATIONS["Form Mutations<br/>'use server' functions"]
        REVALIDATION["Cache Revalidation<br/>revalidatePath/revalidateTag"]
    end

    subgraph API_ROUTES["Route Handlers /api/*"]
        direction TB
        API_INSTALLERS["/api/installers<br/>CRUD operations"]
        API_REWARDS["/api/rewards<br/>Payment processing"]
        API_TEAM["/api/team<br/>User management"]
        API_REPORTS["/api/reports<br/>Excel generation"]
        API_WEBHOOK["/api/webhook<br/>WhatsApp events"]
        API_AUTH["/api/auth/[...nextauth]<br/>NextAuth endpoints"]
        API_HEALTH["/api/health<br/>Health check"]
        API_BATCH["/api/batch-jobs<br/>Bulk operations"]
        API_DASHBOARD["/api/dashboard<br/>Stats aggregation"]
        API_SEARCH["/api/search<br/>Full-text search"]
        API_PRODUCTS["/api/products<br/>Product catalog"]
        API_SETTINGS["/api/settings<br/>System settings"]
        API_ACTIVITIES["/api/activities<br/>Audit trail"]
        API_GOOGLE["/api/google-auth<br/>OAuth flow"]
    end

    subgraph RENDERING_MODES["Rendering Modes"]
        direction LR
        SSG["SSG — Static<br/>Landing page, /my-stats"]
        ISR["ISR — Revalidate<br/>Product catalog, reports"]
        DYNAMIC["Dynamic<br/>Dashboard, installers,<br/>rewards, team"]
    end

    MIDDLEWARE -->|"Authenticated"| ROUTE_GROUPS
    MIDDLEWARE -->|"No token"| PROTECTED_REDIRECT
    DASHBOARD_GROUP --> SERVER_COMPONENTS
    SERVER_COMPONENTS --> DIRECT_DB
    DASHBOARD_GROUP --> SERVER_ACTIONS
    SERVER_ACTIONS --> REVALIDATION
    DASHBOARD_GROUP --> API_ROUTES

    style MIDDLEWARE fill:#581c87,stroke:#a855f7,color:#e9d5ff
    style ROUTE_GROUPS fill:#172554,stroke:#3b82f6,color:#dbeafe
    style SERVER_COMPONENTS fill:#14532d,stroke:#22c55e,color:#dcfce7
    style SERVER_ACTIONS fill:#713f12,stroke:#eab308,color:#fef9c3
    style API_ROUTES fill:#7c2d12,stroke:#f97316,color:#fed7aa
    style RENDERING_MODES fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
```

### Middleware Logic (proxy.ts)

```
Request
  → Is public path? (/, /auth/*, /installer/*, /my-stats, /_next/*)
    → YES: NextResponse.next()
    → NO: Check for authjs.session-token cookie
      → Token exists: NextResponse.next()
      → No token: Redirect to /auth/signin?callbackUrl={path}

Note: Edge runtime cannot decode JWT (no DB access).
Full auth + role checks happen in API routes via withAuth HOF.
```

---

## Layer 3 — Data Access & Caching

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#22c55e',
  'primaryTextColor': '#f8fafc',
  'lineColor': '#94a3b8',
  'fontSize': '13px'
}}}%%

graph TB
    subgraph CLIENT_CACHE["Client-Side Caching"]
        direction TB
        REACT_QUERY_CACHE["@tanstack/react-query<br/>staleTime: 30s<br/>gcTime: 5m"]
        ROUTER_CACHE["Next.js Router Cache<br/>Prefetched routes<br/>Client-side navigation"]
        BROWSER_CACHE["Browser Cache<br/>HTTP cache headers"]
    end

    subgraph SERVER_CACHE["Server-Side Caching"]
        direction TB
        DATA_CACHE["Next.js Data Cache<br/>Persistent across deploys<br/>Manual invalidation"]
        REQUEST_MEMO["Request Memoization<br/>Dedup identical fetch()<br/>Per-request lifetime"]
        SEGMENT_CACHE["Route Segment Cache<br/>Static rendering result"]
    end

    subgraph DATA_ACCESS["Data Access Layer"]
        direction TB
        MONGOOSE_SINGLETON["dbConnect() Singleton<br/>globalThis.cached<br/>Connection pooling"]

        subgraph POOL["Connection Pool"]
            POOL_SIZE["maxPoolSize: 10<br/>minPoolSize: 2<br/>maxIdleTimeMS: 30s"]
        end

        subgraph MODELS["Mongoose Models (10)"]
            M_TEAM["TeamMember<br/>Users + roles"]
            M_INSTALLER["Installer<br/>Registration data"]
            M_REWARD["InstallerReward<br/>Payment records"]
            M_PRODUCT["Product<br/>Solar products"]
            M_SETTINGS["Settings<br/>System config"]
            M_ACTIVITY["Activity<br/>Audit log"]
            M_BATCH["BatchJob<br/>Bulk operations"]
            M_GOOGLE["GoogleAuth<br/>OAuth tokens"]
            M_RATE["RateLimit<br/>Throttle records"]
            M_PASSWORD["PasswordReset<br/>Reset tokens"]
        end
    end

    subgraph QUERY_HELPERS["Query Utilities"]
        direction TB
        QUERY_BUILDER["queryBuilder.ts<br/>Sort · Search · Filter"]
        PAGINATION["pagination.ts<br/>Page · Limit · Skip"]
        VALIDATION["validateRequest.ts<br/>Zod schema validation"]
        API_RESPONSE["apiResponse.ts<br/>Standardized responses"]
    end

    REACT_QUERY_CACHE -->|"fetch /api/*"| API_ROUTES
    ROUTER_CACHE -->|"RSC prefetch"| RSC
    DATA_CACHE -->|"revalidatePath()"| MONGOOSE_SINGLETON
    REQUEST_MEMO -->|"same request"| MONGOOSE_SINGLETON
    MONGOOSE_SINGLETON --> POOL_SIZE
    POOL_SIZE --> MODELS
    MODELS --> QUERY_HELPERS

    style CLIENT_CACHE fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style SERVER_CACHE fill:#14532d,stroke:#22c55e,color:#dcfce7
    style DATA_ACCESS fill:#172554,stroke:#3b82f6,color:#dbeafe
    style QUERY_HELPERS fill:#713f12,stroke:#eab308,color:#fef9c3
```

### Cache Hierarchy

```
Request arrives at Next.js server
  │
  ├─ 1. Router Cache (client)    → cached? → return HTML
  │
  ├─ 2. Data Cache (server)      → cached? → return cached response
  │
  ├─ 3. Request Memoization      → same fetch in this request? → dedup
  │
  ├─ 4. Full cache miss
  │     └─ Execute RSC / Route Handler
  │           └─ dbConnect() → Mongoose → MongoDB Atlas
  │
  └─ Store result in Data Cache + return to client
```

---

## Layer 4 — External Services & Database

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#f97316',
  'primaryTextColor': '#f8fafc',
  'lineColor': '#94a3b8',
  'fontSize': '13px'
}}}%%

graph TB
    subgraph MONGODB_ATLAS["MongoDB Atlas"]
        direction TB
        M_CONNECT["Connection String<br/>mongodb+srv://<br/>DNS SRV resolution"]
        M_DB["ipms Database<br/>10 Collections"]
        M_INDEXES["Indexes<br/>Text search · Compound"]
        M_BACKUP["Atlas Backup<br/>Automated snapshots"]
    end

    subgraph AUTH_SERVICE["Authentication"]
        direction TB
        NEXTAUTH_V5["NextAuth v5<br/>Beta 30"]
        CREDENTIALS["Credentials Provider<br/>Email + Password"]
        JWT["JWT Strategy<br/>30-day expiry"]
        BCRYPT["bcryptjs<br/>Password hashing"]
        RATE_LIMIT_LOGIN["Login Rate Limit<br/>5 attempts / 10 min"]
    end

    subgraph WHATSAPP_SERVICE["WhatsApp Integration"]
        direction TB
        META_API["Meta Cloud API<br/>WhatsApp Business"]
        FREE_FORM["Free-form Messages<br/>24-hour window"]
        WEBHOOK["Webhook<br/>lastCustomerMessageAt"]
        PIN_DELIVERY["PIN Delivery<br/>Registration + Reset"]
    end

    subgraph GOOGLE_SERVICE["Google Integration"]
        direction TB
        GOOGLE_CONTACTS["Google Contacts API<br/>People API"]
        CONTACT_SYNC["Contact Sync<br/>Create · Update · Delete"]
        OAUTH_FLOW["OAuth Flow<br/>/api/google-auth"]
    end

    subgraph EMAIL_SERVICE["Email Service"]
        direction TB
        NODEMAILER_E["Nodemailer<br/>SMTP transport"]
        PASSWORD_RESET_E["Password Reset<br/>6-digit PIN"]
    end

    subgraph REPORT_SERVICE["Report Generation"]
        direction TB
        EXCELJS_E["ExcelJS<br/>.xlsx generation"]
        REPORT_ROUTES["Report Routes<br/>/api/reports"]
    end

    subgraph FILE_STORAGE["File Storage"]
        direction TB
        VERCEL_BLOB_E["Vercel Blob<br/>File uploads"]
        PUBLIC_DIR["public/<br/>Fonts · Images"]
    end

    MONGOOSE_SINGLETON -->|"dbConnect()"| M_CONNECT
    M_CONNECT --> M_DB
    M_DB --> M_INDEXES
    M_DB --> M_BACKUP

    API_ROUTES -->|"POST /api/auth/*"| NEXTAUTH_V5
    NEXTAUTH_V5 --> CREDENTIALS
    CREDENTIALS --> BCRYPT
    BCRYPT --> M_DB
    CREDENTIALS --> RATE_LIMIT_LOGIN

    SERVICES_LAYER -->|"sendInstallerRegistrationMessage()"| META_API
    META_API --> FREE_FORM
    M_DB -->|"webhook: lastCustomerMessageAt"| WEBHOOK
    SERVICES_LAYER --> PIN_DELIVERY

    SERVICES_LAYER -->|"createGoogleContact()"| GOOGLE_CONTACTS
    GOOGLE_CONTACTS --> CONTACT_SYNC
    OAUTH_FLOW --> GOOGLE_CONTACTS

    API_ROUTES -->|"Password reset"| NODEMAILER_E
    NODEMAILER_E --> PASSWORD_RESET_E

    API_ROUTES -->|"Excel export"| EXCELJS_E

    style MONGODB_ATLAS fill:#7c2d12,stroke:#f97316,color:#fed7aa
    style AUTH_SERVICE fill:#581c87,stroke:#a855f7,color:#e9d5ff
    style WHATSAPP_SERVICE fill:#14532d,stroke:#22c55e,color:#dcfce7
    style GOOGLE_SERVICE fill:#172554,stroke:#3b82f6,color:#dbeafe
    style EMAIL_SERVICE fill:#713f12,stroke:#eab308,color:#fef9c3
    style REPORT_SERVICE fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style FILE_STORAGE fill:#1e293b,stroke:#94a3b8,color:#e2e8f0
```

### MongoDB Collections

| Model | Collection | Key Fields |
|---|---|---|
| `TeamMember` | team_members | email, password, role, name |
| `Installer` | installers | installerCode, pin, fullName, whatsappNumber |
| `InstallerReward` | installer_rewards | installer, amount, serialNumber |
| `Product` | products | name, category, isActive |
| `Settings` | settings | enableWhatsAppNotifications, maxReferrals |
| `Activity` | activities | type, performedBy, targetType, changes |
| `BatchJob` | batch_jobs | status, progress, results |
| `GoogleAuth` | google_auths | accessToken, refreshToken, expiry |
| `RateLimit` | rate_limits | key, attempts, windowStart |
| `PasswordReset` | password_resets | email, pin, expiresAt |

---

## Layer 5 — Infrastructure & CI/CD

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#a855f7',
  'primaryTextColor': '#f8fafc',
  'lineColor': '#94a3b8',
  'fontSize': '13px'
}}}%%

graph TB
    subgraph VERCEL["Vercel Edge Network"]
        direction TB
        EDGE_FUNCTIONS["Edge Functions<br/>Middleware (proxy.ts)<br/>Auth redirect"]
        SERVERLESS["Serverless Functions<br/>API Routes<br/>Server Components"]
        ISR_CACHE["ISR Cache<br/>Static page revalidation"]
        IMAGE_OPT["Image Optimization<br/>AVIF · WebP"]
        CDN["CDN<br/>Static assets"]
    end

    subgraph GITHUB["GitHub"]
        direction TB
        REPO["Repository<br/>installer-program-next"]
        BRANCHES["Branches<br/>main · feature/*"]
        PR["Pull Requests<br/>Code review"]
    end

    subgraph CICD_PIPELINE["CI/CD Pipeline"]
        direction TB
        LINT["ESLint<br/>Code style"]
        TYPECHECK["TypeScript<br/>Type safety"]
        TEST["Vitest<br/>Unit tests"]
        BUILD["Turbopack Build<br/>Next.js 16"]
        PREVIEW["Preview Deploy<br/>PR staging"]
        PRODUCTION["Production Deploy<br/>main branch"]
    end

    subgraph ENVIRONMENT["Environment"]
        direction TB
        ENV_LOCAL[".env.local<br/>Local development"]
        ENV_VERCEL["Vercel Env Vars<br/>Production · Preview"]
        SECRETS["Secrets<br/>NEXTAUTH_SECRET<br/>MONGODB_URI"]
    end

    subgraph MONITORING_INFRA["Monitoring & Observability"]
        direction TB
        ACTIVITY_LOGGER["Activity Logger<br/>All mutations audited"]
        RATE_LIMITER["Rate Limiter<br/>Login: 5/10min<br/>API: configurable"]
        LOGGER["Logger<br/>Structured logging"]
        HEALTH_CHECK["Health Check<br/>/api/health"]
    end

    REPO -->|"git push"| CICD_PIPELINE
    CICD_PIPELINE --> LINT
    LINT --> TYPECHECK
    TYPECHECK --> TEST
    TEST --> BUILD
    BUILD -->|"PR"| PREVIEW
    BUILD -->|"main"| PRODUCTION

    PRODUCTION --> VERCEL
    VERCEL --> SERVERLESS
    SERVERLESS -->|"MongoDB SRV"| MONGODB_ATLAS
    EDGE_FUNCTIONS -->|"Cookie check"| AUTH_SERVICE

    style VERCEL fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style GITHUB fill:#172554,stroke:#3b82f6,color:#dbeafe
    style CICD_PIPELINE fill:#14532d,stroke:#22c55e,color:#dcfce7
    style ENVIRONMENT fill:#713f12,stroke:#eab308,color:#fef9c3
    style MONITORING_INFRA fill:#581c87,stroke:#a855f7,color:#e9d5ff
```

### Build Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run build:turbo` | Production build with Turbopack |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run test` | Vitest unit tests |
| `npm run test:db` | MongoDB connection diagnostic |

---

## Request Lifecycle

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#3b82f6',
  'primaryTextColor': '#f8fafc',
  'lineColor': '#94a3b8',
  'fontSize': '12px'
}}}%%

sequenceDiagram
    autonumber
    participant U as 👤 User
    participant B as 🌐 Browser
    participant E as ⚡ Edge (Vercel)
    participant M as 🔀 Middleware
    participant R as 📄 Route Handler
    participant RSC as ⚛️ RSC
    participant C as 💾 Cache
    participant DB as 🍃 MongoDB Atlas

    U->>B: Navigate to /dashboard
    B->>E: HTTPS Request
    E->>M: Execute proxy.ts

    alt Public Path
        M-->>E: NextResponse.next()
    else Protected Path
        M->>M: Check authjs.session-token
        alt No Token
            M-->>E: 302 → /auth/signin
            E-->>B: Redirect
        else Token Exists
            M-->>E: NextResponse.next()
        end
    end

    E->>RSC: Render Server Component

    alt Cache Hit
        RSC->>C: Check Data Cache
        C-->>RSC: Cached response
    else Cache Miss
        RSC->>C: Check Request Memoization
        alt Same request, same fetch
            C-->>RSC: Deduped result
        else New fetch
            RSC->>DB: Mongoose query
            DB-->>RSC: Result
            RSC->>C: Store in Data Cache
        end
    end

    RSC-->>E: RSC Payload
    E-->>B: HTML + RSC Stream
    B-->>U: Rendered Page

    Note over U,DB: Client-side hydration
    B->>R: fetch('/api/installers?page=1')
    R->>R: withAuth() — JWT decode
    R->>DB: Mongoose query
    DB-->>R: Results
    R-->>B: JSON Response
    B->>C: React Query cache (30s)
```

---

## Authentication Flow

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#a855f7',
  'primaryTextColor': '#f8fafc',
  'lineColor': '#94a3b8',
  'fontSize': '12px'
}}}%%

sequenceDiagram
    autonumber
    participant U as 👤 User
    participant B as 🌐 Browser
    participant NA as 🔐 NextAuth v5
    participant RL as 🚦 Rate Limiter
    participant DB as 🍃 MongoDB

    U->>B: Enter email + password
    B->>NA: POST /api/auth/callback/credentials

    NA->>RL: Check rate limit<br/>login:{email}:{ip}
    alt Rate Limited
        RL-->>NA: limited: true
        NA-->>B: 401 "Too many attempts"
    else Within Limit
        RL-->>NA: limited: false
        NA->>DB: TeamMember.findOne({email})
        alt User Not Found
            NA->>RL: recordFailedAttempt()
            NA-->>B: 401 "No account found"
        else User Found
            NA->>NA: bcrypt.compare(password)
            alt Invalid Password
                NA->>RL: recordFailedAttempt()
                NA-->>B: 401 "Incorrect password"
            else Valid Password
                NA->>NA: Create JWT<br/>{id, email, name, role}
                NA-->>B: Set session cookie<br/>authjs.session-token
                B-->>U: Redirect to /dashboard
            end
        end
    end

    Note over B,DB: Subsequent requests
    B->>B: Cookie auto-attached
    B->>DB: API route with JWT
    DB-->>B: Protected data
```

---

## Installer Registration Flow

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#22c55e',
  'primaryTextColor': '#f8fafc',
  'lineColor': '#94a3b8',
  'fontSize': '12px'
}}}%%

sequenceDiagram
    autonumber
    participant T as 👨‍💼 Team Member
    participant UI as 🖥️ Dashboard
    participant API as 🔌 API Route
    participant SVC as ⚙️ Service Layer
    participant DB as 🍃 MongoDB
    participant GC as 📇 Google Contacts
    participant WA as 💬 WhatsApp API

    T->>UI: Fill registration form
    UI->>UI: react-hook-form + zod validation
    UI->>API: POST /api/installers

    API->>API: withAuth() — verify JWT + role
    API->>API: validateRequest() — Zod parse
    API->>SVC: createInstaller(input, userId)

    SVC->>DB: Installer.create({...})
    DB-->>SVC: New installer document

    par Parallel Side Effects
        SVC->>GC: createGoogleContact(installerData)
        GC-->>SVC: googleContactId
        SVC->>DB: installer.googleContactId = id
    and
        SVC->>DB: Generate 6-digit PIN
        SVC->>DB: bcrypt.hash(pin, 10)
        SVC->>WA: sendInstallerRegistrationMessage()
        alt 24h window open
            WA-->>SVC: success: true
        else Window closed
            WA-->>SVC: success: false
            SVC-->>UI: whatsappFailed: true<br/>+ manual fallback message
        end
    end

    SVC-->>API: {installer, whatsappFailed, plainPin}
    API-->>UI: ApiResponse success
    UI-->>T: Success toast + navigate
```

---

## Caching Strategy

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#22c55e',
  'primaryTextColor': '#f8fafc',
  'lineColor': '#94a3b8',
  'fontSize': '13px'
}}}%%

graph LR
    subgraph WHAT_IS_CACHED["What Gets Cached"]
        direction TB
        STATIC_ROUTES["Static Routes<br/>/ (landing)<br/>/my-stats<br/>SSG output"]
        ISR_ROUTES["ISR Routes<br/>Product pages<br/>Report templates"]
        API_RESPONSES["API Responses<br/>GET /api/installers<br/>GET /api/rewards"]
        RSC_PAYLOADS["RSC Payloads<br/>Server Component output"]
    end

    subgraph CACHE_INVALIDATION["Cache Invalidation"]
        direction TB
        REVALIDATE_PATH["revalidatePath('/installers')<br/>After create/update/delete"]
        REVALIDATE_TAG["revalidateTag('installers')<br/>Tag-based invalidation"]
        REACT_QUERY_MUTATE["queryClient.invalidateQueries()<br/>Client-side invalidation"]
        MANUAL["Manual Trigger<br/>Settings change"]
    end

    subgraph CACHE_LIFETIMES["Cache Lifetimes"]
        direction TB
        RQ_STALE["React Query staleTime<br/>30 seconds"]
        RQ_GC["React Query gcTime<br/>5 minutes"]
        NEXT_DATA["Next.js Data Cache<br/>Until revalidated"]
        JWT_EXP["JWT expiry<br/>30 days"]
        SW_CACHE["Service Worker<br/>Offline cache"]
    end

    STATIC_ROUTES -->|"Build time"| CACHE_LIFETIMES
    ISR_ROUTES -->|"Revalidate interval"| CACHE_LIFETIMES
    API_RESPONSES -->|"staleTime: 30s"| CACHE_LIFETIMES
    REVALIDATE_PATH -->|"Mutation triggers"| WHAT_IS_CACHED
    REACT_QUERY_MUTATE -->|"Client mutation"| WHAT_IS_CACHED

    style WHAT_IS_CACHED fill:#14532d,stroke:#22c55e,color:#dcfce7
    style CACHE_INVALIDATION fill:#713f12,stroke:#eab308,color:#fef9c3
    style CACHE_LIFETIMES fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
```

---

## Rendering Modes

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#6366f1',
  'primaryTextColor': '#f8fafc',
  'lineColor': '#94a3b8',
  'fontSize': '13px'
}}}%%

graph TB
    subgraph DECISION["Rendering Decision Tree"]
        START["Route Request"]
        START --> Q1{"Needs live<br/>user data?"}

        Q1 -->|"No"| Q2{"Content<br/>changes often?"}
        Q1 -->|"Yes"| DYNAMIC

        Q2 -->|"Rarely"| SSG
        Q2 -->|"Sometimes"| ISR

        SSG["SSG — Static Site Generation<br/>─────────────<br/>Built at build time<br/>Served from CDN<br/>No server cost<br/><br/>Used for:<br/>• / (landing page)<br/>• /my-stats<br/>• Static assets"]

        ISR["ISR — Incremental Static Regeneration<br/>─────────────<br/>Built at build time<br/>Revalidated on interval<br/>Stale-while-revalidate<br/><br/>Used for:<br/>• Product catalog<br/>• Report templates<br/>• Settings page"]

        DYNAMIC["Dynamic Rendering<br/>─────────────<br/>Rendered per request<br/>Always fresh data<br/>Server-side logic<br/><br/>Used for:<br/>• /dashboard (stats)<br/>• /installers (CRUD)<br/>• /rewards (payments)<br/>• /team (roles)<br/>• /activity (audit log)<br/>• /batch-jobs"]
    end

    subgraph IPMS_ROUTES["IPMS Route Mapping"]
        direction LR
        R_LANDING["/ — Landing<br/>SSG ✅"]
        R_STATS["/my-stats<br/>SSG ✅"]
        R_DASH["/dashboard<br/>Dynamic ⚡"]
        R_INSTALL["/installers<br/>Dynamic ⚡"]
        R_REWARD["/rewards<br/>Dynamic ⚡"]
        R_TEAM["/team<br/>Dynamic ⚡"]
        R_REPORT["/reports<br/>Dynamic ⚡"]
        R_ACTIVITY["/activity<br/>Dynamic ⚡"]
        R_BATCH["/batch-jobs<br/>Dynamic ⚡"]
        R_SIGNIN["/auth/signin<br/>Dynamic ⚡"]
    end

    SSG --> R_LANDING
    SSG --> R_STATS
    ISR --> R_DASH
    DYNAMIC --> R_INSTALL
    DYNAMIC --> R_REWARD
    DYNAMIC --> R_TEAM
    DYNAMIC --> R_REPORT
    DYNAMIC --> R_ACTIVITY
    DYNAMIC --> R_BATCH

    style DECISION fill:#0f172a,stroke:#6366f1,color:#e0e7ff
    style IPMS_ROUTES fill:#1e293b,stroke:#94a3b8,color:#e2e8f0
```

---

## Complete Data Flow

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {
  'primaryColor': '#3b82f6',
  'primaryTextColor': '#f8fafc',
  'lineColor': '#94a3b8',
  'fontSize': '12px'
}}}%%

graph TB
    subgraph USER_DEVICE["User Device"]
        U["👤 User"]
        BROWSER["🌐 Browser"]
        SW["Service Worker"]
    end

    subgraph VERCEL_EDGE["Vercel Edge Network"]
        EDGE["Edge Runtime<br/>proxy.ts middleware"]
        CDN_CACHE["CDN Cache<br/>Static assets"]
    end

    subgraph NEXTJS_SERVER["Next.js Server (Vercel)"]
        direction TB
        RSC_LAYER["React Server Components<br/>Direct DB queries"]
        SERVER_ACTION_LAYER["Server Actions<br/>Mutations"]
        API_LAYER["Route Handlers /api/*<br/>15 API routes"]
        MIDDLEWARE_LAYER["withAuth() HOF<br/>JWT + role check"]
        SERVICE_LAYER["Service Layer<br/>Business logic orchestration"]
    end

    subgraph CACHING["Caching Layers"]
        RQ["React Query<br/>30s stale"]
        NDC["Next.js Data Cache<br/>Persistent"]
        RM["Request Memoization<br/>Per-request"]
    end

    subgraph DATA_LAYER["Data Layer"]
        MONGOOSE_L["Mongoose ODM<br/>Connection Pool: 10"]
        MONGODB_L["MongoDB Atlas<br/>10 Collections"]
    end

    subgraph EXTERNAL_SVCS["External Services"]
        AUTH_SVC["NextAuth v5<br/>Credentials + JWT"]
        WHATSAPP_SVC["WhatsApp Cloud API<br/>PIN delivery"]
        GOOGLE_SVC["Google Contacts<br/>Sync"]
        EMAIL_SVC["Nodemailer<br/>Reset emails"]
        EXCEL_SVC["ExcelJS<br/>Reports"]
    end

    U -->|"Navigate / Interact"| BROWSER
    BROWSER -->|"HTTPS"| EDGE
    EDGE -->|"Public: pass-through"| CDN_CACHE
    EDGE -->|"Protected: cookie check"| RSC_LAYER

    RSC_LAYER --> RQ
    RSC_LAYER --> NDC
    RSC_LAYER --> RM
    RQ -->|"Cache miss"| API_LAYER
    NDC -->|"Cache miss"| MONGOOSE_L
    RM -->|"Same fetch"| MONGOOSE_L

    API_LAYER --> MIDDLEWARE_LAYER
    MIDDLEWARE_LAYER --> SERVICE_LAYER
    SERVICE_LAYER --> MONGOOSE_L
    SERVICE_LAYER --> AUTH_SVC
    SERVICE_LAYER --> WHATSAPP_SVC
    SERVICE_LAYER --> GOOGLE_SVC

    MONGOOSE_L -->|"mongodb+srv://"| MONGODB_L
    API_LAYER -->|"GET /api/reports"| EXCEL_SVC
    API_LAYER -->|"POST /api/auth/*"| EMAIL_SVC

    SERVER_ACTION_LAYER --> SERVICE_LAYER
    SERVER_ACTION_LAYER -->|"revalidatePath()"| NDC

    BROWSER -->|"API fetch"| API_LAYER
    API_LAYER -->|"JSON response"| BROWSER
    BROWSER -->|"Render"| U

    style USER_DEVICE fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style VERCEL_EDGE fill:#581c87,stroke:#a855f7,color:#e9d5ff
    style NEXTJS_SERVER fill:#172554,stroke:#3b82f6,color:#dbeafe
    style CACHING fill:#14532d,stroke:#22c55e,color:#dcfce7
    style DATA_LAYER fill:#7c2d12,stroke:#f97316,color:#fed7aa
    style EXTERNAL_SVCS fill:#713f12,stroke:#eab308,color:#fef9c3
```

---

## Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16.0.8 |
| React | React + React DOM | ^19.2.1 |
| Language | TypeScript | ^5 |
| Database | MongoDB Atlas | — |
| ODM | Mongoose | ^8.18.3 |
| Auth | NextAuth v5 (Beta) | ^5.0.0-beta.30 |
| Client Cache | @tanstack/react-query | ^5.90.6 |
| Forms | react-hook-form + zod | ^7.63.0 / ^4.1.12 |
| UI | shadcn/ui + Radix UI | New York style |
| CSS | Tailwind CSS v4 | ^4.1.14 |
| Animation | Framer Motion + GSAP | ^12.23.x / ^3.13.0 |
| Testing | Vitest | ^4.1.9 |
| Deployment | Vercel | Edge + Serverless |
| CI/CD | GitHub Actions | ESLint + tsc + Vitest |
