# UrbanVoice — Frontend Deep Dive (Part 1 of 4)
# 🏗️ Introduction, Architecture & Core Files

---

## 1. WHAT IS URBANVOICE?

UrbanVoice is a **Crowdsourced Urban Issue Reporting Platform** built with the MERN stack. It lets:
- **Citizens** report urban issues (potholes, broken streetlights, garbage)
- **Block Officers** review and resolve issues in their assigned block
- **Admins** monitor all issues, manage officers, and view analytics

## 2. TECH STACK

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI Library | React 18 | Component-based UI rendering |
| Build Tool | Vite 5 | Fast dev server + production bundler |
| Routing | react-router-dom 6 | Client-side page navigation |
| HTTP Client | Axios 1.15 | API calls to Express backend |
| Charts | Chart.js 4 + react-chartjs-2 | Doughnut, Bar, Line charts |
| Styling | Vanilla CSS | Custom design system with CSS variables |
| Font | Inter (Google Fonts) | Modern sans-serif typography |
| Auth | JWT (localStorage) | Token-based authentication |

---

## 3. FOLDER STRUCTURE

```
client/
├── index.html              ← Single HTML page that boots React
├── package.json            ← Dependencies & npm scripts
├── vite.config.js          ← Vite build configuration
├── src/
│   ├── main.jsx            ← React entry point (mounts App into DOM)
│   ├── App.jsx             ← Router + ProtectedRoute logic
│   ├── api/
│   │   └── axios.js        ← Axios instance with JWT interceptors
│   ├── data/
│   │   └── mockData.js     ← Fallback/test data (blocks, categories, sample issues)
│   ├── components/         ← Reusable UI components
│   │   ├── Modal.jsx       ← Popup dialog (used for issue details, confirmations)
│   │   ├── NotificationBell.jsx ← Bell icon + dropdown (fetches from /api/notifications)
│   │   ├── Sidebar.jsx     ← Left navigation panel (shared by all dashboards)
│   │   ├── StatCard.jsx    ← Colored stat box (e.g., "Total Issues: 12")
│   │   └── StatusBadge.jsx ← Pill badge showing status/priority with color
│   ├── styles/
│   │   └── global.css      ← Design tokens, reset, shared component styles
│   └── pages/
│       ├── LandingPage.jsx ← Public homepage with features, stats, CTA
│       ├── landing.css     ← Landing page styles
│       ├── AuthPage.jsx    ← Login + Signup form (single component, mode toggle)
│       ├── auth.css        ← Auth page styles
│       ├── citizen/        ← Citizen dashboard pages
│       │   ├── CitizenDashboard.jsx ← Layout shell (sidebar + view switching)
│       │   ├── CitizenHome.jsx      ← Welcome banner + stats + recent activity
│       │   ├── ReportIssue.jsx      ← New issue form with photo upload
│       │   ├── MyReports.jsx        ← Filterable table of citizen's issues
│       │   ├── CitizenProfile.jsx   ← Edit profile + view assigned officer
│       │   └── citizen.css          ← Citizen-specific styles
│       ├── blockofficer/   ← Block Officer dashboard pages
│       │   ├── OfficerDashboard.jsx ← Layout shell (dark theme)
│       │   ├── OfficerHome.jsx      ← Stats + charts + issue table with status dropdown
│       │   ├── OfficerMyIssues.jsx  ← Cards for In Progress/Resolved issues
│       │   ├── OfficerAnalytics.jsx ← Priority & category breakdowns
│       │   ├── OfficerProfile.jsx   ← Read-only officer profile
│       │   └── officer.css          ← Dark theme overrides
│       └── admin/          ← Admin dashboard pages
│           ├── AdminDashboard.jsx   ← Layout shell
│           ├── AdminHome.jsx        ← KPI stats + block summary + recent issues
│           ├── AdminIssues.jsx      ← Full issue table with resolve/delete
│           ├── AdminOfficers.jsx    ← Officer CRUD (create, list, delete)
│           ├── AdminAnalytics.jsx   ← 5 charts (status, priority, block, trend, category)
│           └── admin.css            ← Admin-specific styles
```

---

## 4. COMPONENT TREE

```
index.html
└── main.jsx
    └── App.jsx (BrowserRouter)
        ├── "/" → LandingPage
        ├── "/auth" → AuthPage
        ├── "/citizen/*" → ProtectedRoute(citizen)
        │   └── CitizenDashboard
        │       ├── Sidebar
        │       ├── NotificationBell
        │       └── [view switcher]
        │           ├── CitizenHome → StatCard, StatusBadge
        │           ├── ReportIssue
        │           ├── MyReports → StatusBadge, Modal
        │           └── CitizenProfile
        ├── "/officer/*" → ProtectedRoute(officer)
        │   └── OfficerDashboard
        │       ├── Sidebar
        │       ├── NotificationBell
        │       └── [view switcher]
        │           ├── OfficerHome → StatCard, StatusBadge, Modal, Doughnut, Bar
        │           ├── OfficerMyIssues → StatusBadge
        │           ├── OfficerAnalytics → StatCard
        │           └── OfficerProfile
        └── "/admin/*" → ProtectedRoute(admin)
            └── AdminDashboard
                ├── Sidebar
                ├── NotificationBell
                └── [view switcher]
                    ├── AdminHome → StatCard, StatusBadge
                    ├── AdminIssues → StatusBadge, Modal
                    ├── AdminOfficers
                    └── AdminAnalytics → StatCard, Doughnut, Bar, Line
```

---

## 5. ROUTING TABLE

| Path | Component | Protected? | Role Required |
|------|-----------|-----------|---------------|
| `/` | LandingPage | ❌ Public | — |
| `/auth` | AuthPage | ❌ Public | — |
| `/citizen/*` | CitizenDashboard | ✅ Yes | `citizen` |
| `/officer/*` | OfficerDashboard | ✅ Yes | `officer` |
| `/admin/*` | AdminDashboard | ✅ Yes | `admin` |
| `*` (any other) | Redirects to `/` | — | — |

---

## 6. DATA FLOW DIAGRAM

```
USER ACTION (e.g., clicks "Submit Report")
        │
        ▼
  React Component (ReportIssue.jsx)
    └── Validates form fields
    └── Calls parent's onSubmit(formData)
        │
        ▼
  CitizenDashboard.addIssue(formData)
    └── Creates FormData object
    └── Calls API.post('/api/issues/create', fd)
        │
        ▼
  axios.js interceptor
    └── Reads JWT from localStorage('uv_token')
    └── Attaches: Authorization: Bearer <token>
    └── Sends HTTP POST to http://localhost:5000
        │
        ▼
  Express Backend (server)
    └── authMiddleware verifies JWT
    └── issueController.createIssue() saves to MongoDB
    └── Returns { success: true, issue: {...} }
        │
        ▼
  Back in CitizenDashboard
    └── fetchIssues() re-fetches all citizen's issues
    └── setIssues(data) updates React state
    └── setView('reports') switches to MyReports view
        │
        ▼
  React re-renders MyReports with new issue in table
```

---

## 7. FILE-BY-FILE DEEP DIVE — CORE FILES

---

### ═══════════════════════════════════════
### FILE: client/index.html
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
This is the ONE AND ONLY HTML page in the entire React app. React is a Single Page Application (SPA) — the browser loads this file once, then JavaScript takes over and renders all pages dynamically inside the `<div id="root">` element.

**LINE-BY-LINE:**

```
1  | <!DOCTYPE html>
     ↳ Tells browser: "This is HTML5." Required as the very first line.

2  | <html lang="en">
     ↳ Opens HTML document. lang="en" tells search engines the content is English.

3  |   <head>
     ↳ Head section: metadata (not visible on page).

4  |     <meta charset="UTF-8" />
     ↳ Character encoding. UTF-8 supports all languages, emojis, symbols.

5  |     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     ↳ Makes page responsive on mobile. Without this, phones would show zoomed-out desktop view.

6  |     <title>UrbanVoice — Report Urban Issues</title>
     ↳ Text shown in browser tab. Also the title Google shows in search results.

7  |     <meta name="description" content="UrbanVoice empowers citizens...">
     ↳ SEO description. Google shows this below the title in search results.

8  |     <link rel="preconnect" href="https://fonts.googleapis.com" />
     ↳ Performance optimization: tells browser to start connecting to Google Fonts server early.

9  |     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
     ↳ Same for the font file server. crossorigin needed because fonts come from different domain.

10 |     <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;...&display=swap" rel="stylesheet" />
     ↳ Loads the Inter font in weights 300-900. display=swap shows fallback font while Inter loads.

11 |   </head>

12 |   <body>

13 |     <div id="root"></div>
     ↳ ⭐ THE MOST IMPORTANT LINE. This empty div is where React injects the ENTIRE app.
        main.jsx finds this div and renders <App /> inside it.

14 |     <script type="module" src="/src/main.jsx"></script>
     ↳ ⭐ Boots React. Tells browser to load main.jsx. type="module" enables import/export syntax.

15 |   </body>
16 | </html>
```

**CONNECTIONS:**
- Sends data to: `main.jsx` (via the script tag)
- Used by: Vite dev server (serves this as entry point)

---

### ═══════════════════════════════════════
### FILE: client/package.json
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
The project's identity card + ingredient list. Tells npm what libraries to install, what commands to run, and metadata about the project.

**LINE-BY-LINE:**

```
1  | {
2  |   "name": "urbanvoice-client",
     ↳ Project name. Used by npm internally. Not visible to users.

3  |   "private": true,
     ↳ Prevents accidentally publishing this to the npm public registry.

4  |   "version": "1.0.0",
     ↳ Semantic version number. 1.0.0 = first major release.

5  |   "type": "module",
     ↳ Enables ES Module syntax (import/export) instead of old CommonJS (require).

6  |   "scripts": {
7  |     "dev": "vite",
     ↳ npm run dev → starts Vite development server (hot reload, fast refresh).

8  |     "build": "vite build",
     ↳ npm run build → bundles everything into dist/ for production deployment.

9  |     "preview": "vite preview"
     ↳ npm run preview → serves the dist/ folder locally to test production build.
10 |   },

11 |   "dependencies": {
     ↳ Libraries needed in PRODUCTION (shipped to users).

12 |     "axios": "^1.15.0",
     ↳ HTTP client. Used in api/axios.js to make API calls to Express backend.

13 |     "chart.js": "^4.4.4",
     ↳ Chart rendering engine. Draws doughnut, bar, and line charts.

14 |     "react": "^18.3.1",
     ↳ React core. The UI library that powers the entire frontend.

15 |     "react-chartjs-2": "^5.2.0",
     ↳ React wrapper for Chart.js. Lets you use <Doughnut>, <Bar>, <Line> as JSX components.

16 |     "react-dom": "^18.3.1",
     ↳ React DOM renderer. Connects React to the browser's DOM (the actual HTML page).

17 |     "react-router-dom": "^6.26.2"
     ↳ Client-side routing. Enables /citizen, /officer, /admin URLs without page reloads.
18 |   },

19 |   "devDependencies": {
     ↳ Libraries needed ONLY during development. NOT shipped to production.

20 |     "@types/react": "^18.3.5",
     ↳ TypeScript type definitions for React. Gives IDE better autocomplete even in JS.

21 |     "@types/react-dom": "^18.3.0",
     ↳ TypeScript type definitions for ReactDOM.

22 |     "@vitejs/plugin-react": "^4.3.1",
     ↳ Vite plugin that teaches Vite how to process JSX syntax.

23 |     "vite": "^5.4.2"
     ↳ The build tool itself. Serves dev server and creates production bundles.
24 |   }
25 | }
```

---

### ═══════════════════════════════════════
### FILE: client/vite.config.js
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
Configures Vite — the build tool. Tells Vite to use the React plugin so it can understand JSX syntax.

```
1  | import { defineConfig } from 'vite'
     ↳ Imports Vite's config helper. Provides type hints and validation.

2  | import react from '@vitejs/plugin-react'
     ↳ Imports the React plugin. Without this, Vite cannot process .jsx files.

4  | export default defineConfig({
     ↳ Exports the configuration object.

5  |   plugins: [react()],
     ↳ Activates the React plugin. This enables: JSX transformation, Fast Refresh (hot reload
        without losing component state), and automatic React import.

6  | })
```

**WHAT TO CHANGE IF:**
- You want to add a proxy to backend → add `server: { proxy: { '/api': 'http://localhost:5000' } }`
- You want to change the port → add `server: { port: 3000 }`

---

### ═══════════════════════════════════════
### FILE: client/src/main.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
The JavaScript entry point. This is the FIRST React code that runs. It finds the `<div id="root">` in index.html and mounts the entire React app inside it.

```
1  | import React from 'react'
     ↳ Imports the React library. Needed for JSX and StrictMode.

2  | import ReactDOM from 'react-dom/client'
     ↳ Imports ReactDOM's client renderer. The createRoot API for React 18.

3  | import App from './App.jsx'
     ↳ Imports the root App component (the router and all pages).

4  | import './styles/global.css'
     ↳ Imports the global stylesheet. This applies to the ENTIRE app.
        CSS imports in JS are a Vite feature — Vite injects them as <style> tags.

6  | ReactDOM.createRoot(document.getElementById('root')).render(
     ↳ Finds <div id="root"> in index.html, creates a React root, and starts rendering.
        createRoot is the React 18 API (replaces old ReactDOM.render).

7  |   <React.StrictMode>
     ↳ Development-only wrapper. Runs components twice to catch bugs, warns about
        deprecated APIs. Has ZERO effect in production builds.

8  |     <App />
     ↳ Renders the App component — which contains all routes, pages, and the entire UI.

9  |   </React.StrictMode>
10 | )
```

**CONNECTIONS:**
- Receives: `<div id="root">` from index.html
- Uses: App.jsx, global.css
- This file is the bridge between HTML and React

---

### ═══════════════════════════════════════
### FILE: client/src/App.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
The root React component. It defines ALL routes (URLs) in the app and protects dashboard routes so only authenticated users with the correct role can access them.

```
1  | import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
     ↳ BrowserRouter: Enables URL-based routing (uses browser history API)
       Routes: Container for all Route definitions
       Route: Maps a URL path to a component
       Navigate: Programmatic redirect (replaces the old <Redirect>)

2-6| import LandingPage, AuthPage, CitizenDashboard, OfficerDashboard, AdminDashboard
     ↳ Imports all 5 top-level page components.

8  | function ProtectedRoute({ children, role }) {
     ↳ A guard component. Wraps dashboard routes. Checks if user is logged in AND has the right role.

9  |   const token = localStorage.getItem('uv_token')
     ↳ Reads the JWT token saved during login. If null → user is not logged in.

10 |   const stored = localStorage.getItem('uv_role')
     ↳ Reads the user's role ('citizen', 'officer', or 'admin').

12 |   const normalizedStored = stored === 'blockofficer' ? 'officer' : stored
     ↳ Backend stores role as 'blockofficer', but frontend uses 'officer'. This normalizes it.

13 |   if (!token || !normalizedStored || normalizedStored !== role) return <Navigate to="/auth" replace />
     ↳ If no token, no role, or wrong role → redirect to login page.
        replace prevents the user from clicking "Back" to return to the protected page.

14 |   return children
     ↳ If authenticated with correct role → render the wrapped component (e.g., CitizenDashboard).

17 | export default function App() {
21 |   <Route path="/"       element={<LandingPage />} />
     ↳ Root URL shows the public landing page.

22 |   <Route path="/auth"   element={<AuthPage />} />
     ↳ /auth shows login/signup page.

24-28| <Route path="/citizen/*" element={<ProtectedRoute role="citizen"><CitizenDashboard /></ProtectedRoute>} />
     ↳ /citizen/* is protected. Only users with role="citizen" can see CitizenDashboard.
        The /* means this route also matches /citizen/anything (nested routes).

30-34| <Route path="/officer/*" element={...} />
     ↳ Same for officers.

36-40| <Route path="/admin/*" element={...} />
     ↳ Same for admins.

43 |   <Route path="*" element={<Navigate to="/" replace />} />
     ↳ Fallback: any unknown URL redirects to landing page.
```

**WHAT TO CHANGE IF:**
- Add a new public page → add `<Route path="/about" element={<AboutPage />} />` after line 22
- Add a new role → add a new `<Route>` with `<ProtectedRoute role="newrole">`
- Change where users go after login → edit `routes` object in AuthPage.jsx (line 68)

---

### ═══════════════════════════════════════
### FILE: client/src/api/axios.js
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
Creates a pre-configured Axios instance that ALL API calls use. It automatically attaches the JWT token to every request and handles 401 (unauthorized) errors by logging the user out.

```
1  | import axios from 'axios'
     ↳ Imports the axios HTTP library.

3  | const API = axios.create({
4  |   baseURL: 'http://localhost:5000',
     ↳ Every API call will be prefixed with this. So API.get('/api/issues') actually hits
        http://localhost:5000/api/issues

5  |   headers: { 'Content-Type': 'application/json' }
     ↳ Default header. Tells backend we're sending JSON data.
6  | })

9  | API.interceptors.request.use((config) => {
     ↳ REQUEST INTERCEPTOR. Runs BEFORE every HTTP request leaves the browser.

10 |   const token = localStorage.getItem('uv_token')
     ↳ Reads the JWT token from localStorage (saved during login).

11-12| if (token) config.headers.Authorization = `Bearer ${token}`
     ↳ If token exists, attaches it as: Authorization: Bearer eyJhbGc...
        The backend reads this header to identify the user.

14 |   return config
     ↳ Returns the modified config. The request proceeds with the token attached.

15 | }, (error) => Promise.reject(error))
     ↳ If something goes wrong before sending, reject the promise.

18 | API.interceptors.response.use(
19 |   (response) => response,
     ↳ RESPONSE INTERCEPTOR. If response is OK (200), just pass it through.

20-28| (error) => { if (error.response?.status === 401) { ... } }
     ↳ If backend returns 401 (unauthorized = token expired or invalid):
        - Removes all auth data from localStorage
        - Redirects to /auth (login page)
        This is an AUTO-LOGOUT mechanism.

31 | export default API
     ↳ Exports the configured instance. Every file imports this instead of raw axios.
```

**CONNECTIONS:**
- Used by: Every dashboard file, AuthPage, NotificationBell, AdminOfficers, CitizenProfile
- Receives data from: localStorage (JWT token)

**WHAT TO CHANGE IF:**
- Deploy to production → change line 4 baseURL to your server URL (e.g., `https://api.urbanvoice.in`)
- Add request logging → add `console.log(config.url)` inside the request interceptor

---

### ═══════════════════════════════════════
### FILE: client/src/data/mockData.js
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
Contains hardcoded sample data used as fallbacks or for dropdown options. Originally used before the backend was connected. Now primarily used for the `blocks` and `categories` arrays in dropdowns.

```
4  | export const blocks = ['Block A', 'Block B', 'Block C', 'Block D', 'Block E']
     ↳ List of area blocks. Used in CitizenProfile's block dropdown.

6  | export const categories = ['Road & Infrastructure', 'Garbage & Sanitation', ...]
     ↳ Issue categories. Note: ReportIssue.jsx has its OWN copy of this list (line 4-7).

16 | export const officers = [...]
     ↳ Sample officer data. NO LONGER USED — real data comes from /api/admin/officers.

24 | export const initialIssues = [...]
     ↳ 8 sample issues. NO LONGER USED — real data comes from /api/issues/*.

99 | export const currentCitizen = {...}
     ↳ Simulated logged-in citizen. NO LONGER USED — real data comes from localStorage.
```

**CONNECTIONS:**
- Used by: CitizenProfile.jsx (imports `blocks` for dropdown)
- Most data in this file is LEGACY and no longer actively used

---

> **Continued in Part 2** → Reusable Components (Modal, NotificationBell, Sidebar, StatCard, StatusBadge)
