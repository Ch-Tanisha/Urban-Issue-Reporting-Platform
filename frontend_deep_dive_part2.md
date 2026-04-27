# UrbanVoice — Frontend Deep Dive (Part 2 of 4)
# 🧩 Reusable Components + Public Pages (Landing & Auth)

---

## 8. REUSABLE COMPONENTS

---

### ═══════════════════════════════════════
### FILE: src/components/Modal.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
A reusable popup dialog. Used throughout the app to show issue details, confirm deletions, etc. It darkens the background, prevents page scrolling, and closes when clicking outside.

```
1  | import { useEffect } from 'react'
     ↳ React hook for side effects (here: controlling body scroll).

3  | export default function Modal({ isOpen, onClose, title, children, footer, maxWidth = 520 }) {
     ↳ Props:
        isOpen   → boolean: show or hide the modal
        onClose  → function: called when user closes modal
        title    → string: header text
        children → any JSX: the body content
        footer   → optional JSX: buttons at bottom (e.g., Cancel/Confirm)
        maxWidth → number: max pixel width (default 520px)

4-8| useEffect(() => { if (isOpen) document.body.style.overflow = 'hidden' ... }, [isOpen])
     ↳ SIDE EFFECT: When modal opens, disable page scrolling (overflow: hidden).
        When modal closes, restore scrolling. The cleanup function (return) ensures
        scrolling is restored even if the component unmounts unexpectedly.

10 |   if (!isOpen) return null
     ↳ If modal is not open, render nothing. Component exits early.

13 |   <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
     ↳ Dark semi-transparent background. If user clicks the overlay itself (not the box),
        close the modal. e.target === e.currentTarget ensures clicks inside the box don't close it.

14 |   <div className="modal-box" style={{ maxWidth }}>
     ↳ The white box. maxWidth limits how wide it gets.

16 |     <button className="modal-close" onClick={onClose}>✕</button>
     ↳ X button in top-right corner.

19 |     <div className="modal-body">{children}</div>
     ↳ Whatever JSX you pass between <Modal>...</Modal> tags appears here.

20 |     {footer && <div className="modal-footer">{footer}</div>}
     ↳ If footer prop is provided, render it. Used for Cancel/Confirm buttons.
```

**CONNECTIONS:**
- Used by: MyReports, OfficerHome, AdminIssues (issue detail + confirm modals)
- Styled by: global.css (lines 243-290)

---

### ═══════════════════════════════════════
### FILE: src/components/NotificationBell.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
A bell icon with unread count badge and dropdown list. Fetches notifications from the backend every 30 seconds. Supports mark-as-read, mark-all-read, and delete. Closes when clicking outside.

**KEY SECTIONS:**

```
1  | import { useState, useEffect, useRef } from 'react'
     ↳ useState: manages state (open, notifications, unread count, loading)
        useEffect: runs side effects (fetch on mount, polling, click-outside listener)
        useRef: holds reference to the dropdown DOM element (for click-outside detection)

5-8| State variables:
     open          → boolean: is dropdown visible?
     notifications → array: list of notification objects from backend
     unread        → number: count of unread notifications
     loading       → boolean: is data being fetched?
     ref           → DOM reference to the container div

12-18| useEffect — Click outside handler
     ↳ Listens for mousedown events on the entire document.
        If click is OUTSIDE the ref container, close the dropdown.
        Cleanup removes the listener when component unmounts.

21-25| useEffect — Polling
     ↳ Calls fetchNotifs() immediately on mount, then every 30 seconds.
        clearInterval in cleanup prevents memory leaks.

27-38| async function fetchNotifs()
     ↳ GET /api/notifications → sets notifications array and unread count.
        Errors are silently caught (notifications are non-critical).

40-46| async function markAllRead()
     ↳ PUT /api/notifications/read-all → marks all as read on backend.
        Locally updates all notifications to isRead: true and sets unread to 0.

48-53| async function markOne(id)
     ↳ PUT /api/notifications/:id/read → marks single notification as read.

56-63| async function deleteOne(id)
     ↳ DELETE /api/notifications/:id → removes notification.
        If it was unread, decrements the unread counter.

65-70| iconMap — Maps notification types to emoji icons
     ↳ status_update → 🔄, new_issue → 📝, duplicate_flag → ⚠️, system → 🔔

72-80| timeAgo(dateStr) — Converts timestamps to human-readable "5m ago", "2h ago"

86  | onClick={() => { setOpen(!open); if (!open) fetchNotifs() }}
     ↳ Toggle dropdown. When opening, refresh notifications.

102-113| Unread badge
     ↳ Red circle with number. Shows "9+" if unread > 9.
        Positioned absolutely on top-right of bell button.

149-201| Notification list rendering
     ↳ Three states: loading, empty, or list of notifications.
        Each notification shows: type icon, message, time ago, blue dot (if unread), delete button.
        Clicking an unread notification marks it as read.
```

**API ENDPOINTS USED:**
| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/api/notifications` | Fetch all notifications |
| PUT | `/api/notifications/read-all` | Mark all as read |
| PUT | `/api/notifications/:id/read` | Mark one as read |
| DELETE | `/api/notifications/:id` | Delete one notification |

---

### ═══════════════════════════════════════
### FILE: src/components/Sidebar.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
The left navigation panel shared by ALL three dashboards. Shows the logo, nav buttons, user info, and logout button. Each dashboard passes different props to customize it.

```
3-8| LOGO_SVG — Inline SVG shield/checkmark icon

10 | export default function Sidebar({ role, navItems, activeView, onNav, userName, userRole }) {
     ↳ Props:
        role       → 'citizen'|'officer'|'admin' (determines gradient color)
        navItems   → array of {view, label, icon} objects
        activeView → string: which nav item is currently active
        onNav      → function: called when user clicks a nav item
        userName   → string: displayed at bottom
        userRole   → string: subtitle under user name

13-18| handleLogout()
     ↳ Removes all auth data from localStorage (uv_token, uv_role, uv_user).
        Navigates to /auth login page.

20-24| gradients — Different sidebar background colors per role
     ↳ citizen: blue→green, officer: dark navy, admin: teal→green

32 |   const initials = (userName || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
     ↳ Extracts initials from name. "Raj Sharma" → "RS". Used as avatar text.

47-56| Nav buttons — Maps navItems array to buttons
     ↳ Active button gets 'active' class (white background, bold text).
        onClick calls onNav(item.view) to switch the dashboard's current view.

60-76| Footer — User avatar + name + role + logout button
```

**CONNECTIONS:**
- Used by: CitizenDashboard, OfficerDashboard, AdminDashboard
- Styled by: global.css (lines 378-466)

---

### ═══════════════════════════════════════
### FILE: src/components/StatCard.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
A colored statistics card. Shows a label (e.g., "Total Issues"), a large number, an optional icon, and a subtitle. Used on every dashboard's home page.

```
1  | export default function StatCard({ label, value, color, icon, sub }) {
     ↳ Props:
        label → "Total Issues"
        value → 12 (or "85%")
        color → 'blue'|'green'|'red'|'amber'|'purple'|'slate'
        icon  → emoji like "📋"
        sub   → "All blocks combined"

2-9| colors object — Maps color names to {val, bg} pairs
     ↳ 'blue' → val: '#2563eb', bg: 'rgba(37,99,235,0.08)'
        val = text color for the number, bg = background for the icon badge

13 |   <div className="stat-card" style={{ borderTop: `3px solid ${c.val}` }}>
     ↳ Colored top border. Makes each card visually distinct.

24 |   <div className="stat-value" style={{ color: c.val }}>{value}</div>
     ↳ The big number, colored to match the theme.
```

---

### ═══════════════════════════════════════
### FILE: src/components/StatusBadge.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
A small colored pill that displays issue status ("Reported", "In Progress", "Resolved") or priority ("High", "Medium", "Low") with matching colors.

```
1  | export default function StatusBadge({ value, type = 'status' }) {
     ↳ value = the status/priority string
        type  = 'status' or 'priority' (determines color scheme)

2-20| Status mode:
     ↳ Maps each status to a CSS class:
        'Reported'    → red badge with 🔴
        'In Progress' → blue badge with 🔵
        'Resolved'    → green badge with 🟢
        'Cancelled'   → grey badge with ⚪

23-30| Priority mode:
     ↳ 'High' → red, 'Medium' → amber/orange, 'Low' → green
```

**CONNECTIONS:** Used by every page that shows issues.

---

## 9. PUBLIC PAGES

---

### ═══════════════════════════════════════
### FILE: src/pages/LandingPage.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
The public homepage visitors see before logging in. Contains a hero section with background image, features grid, "How It Works" steps, issue categories, animated statistics counter, call-to-action, and footer.

**KEY SECTIONS:**

```
5-12| FEATURES array — 6 feature cards with icon, title, description
14-21| CATEGORIES array — 6 issue type cards with icon and label
23-28| STEPS array — 4 "How It Works" steps
30-35| STATS array — 4 statistics (Issues Reported: 1250, etc.)

37-51| useCountUp(target, active) — Custom hook for animated number counting
     ↳ When active becomes true, counts from 0 to target over ~1.5 seconds.
        Uses setInterval with 25ms steps. Math.ceil(target/60) calculates increment per tick.

53-68| StatNumber component — Wraps useCountUp with IntersectionObserver
     ↳ Uses IntersectionObserver to detect when the stat enters the viewport.
        Only starts counting when the user scrolls to it (threshold: 0.5 = 50% visible).

77-85| Navigation bar — Fixed at top with gradient background
     ↳ Logo, nav links (Features, How It Works, Categories, Impact), Login button.
        Login button navigates to /auth.

98-113| Hero section — Full-screen background image with overlay
     ↳ Title uses gradient text (gold color via -webkit-background-clip: text).
        "Get Started Free" and "Learn More" buttons.

116-134| Features section — 6 clickable cards in responsive grid
     ↳ Clicking a card toggles active state (changes to gradient background).

137-151| How It Works — 4 numbered steps
153-167| Categories — 6 icon cards
170-178| Stats — 4 animated counters (triggered on scroll)
181-193| CTA — "Ready to Make a Difference?" with button
196-229| Footer — 4-column layout with links
```

---

### ═══════════════════════════════════════
### FILE: src/pages/AuthPage.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
Combined Login + Signup page. Left side shows a decorative image panel with stats. Right side shows the form. Users toggle between login and signup mode. On success, saves JWT + user data to localStorage and redirects to the correct dashboard.

**KEY SECTIONS:**

```
6  | const BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D', 'Block E']
     ↳ Used in signup form's block dropdown.

8  | function validateEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
     ↳ Regex email validation. Checks for: something@something.something

9  | function validatePhone(v) { return /^[+]?[\d\s\-]{10,}$/.test(v) }
     ↳ Phone validation. At least 10 digits, allows +, spaces, dashes.

10-18| function passwordStrength(p)
     ↳ Returns 0-5 score. Checks: length≥8, lowercase, uppercase, digit, special char.
        Used for the visual strength bar during signup.

22 |   const [mode, setMode] = useState('login')
     ↳ Controls which form is shown: 'login' or 'signup'.

30 |   const [login, setLogin] = useState({ email: '', password: '', role: '' })
     ↳ Login form state. Three fields.

33-37| const [signup, setSignup] = useState({...})
     ↳ Signup form state. 12 fields (name, age, gender, email, phone, address, city,
        pincode, block, password, confirmPass, role, terms).

43-76| async function handleLogin(e)
     ↳ 1. Prevents default form submit (page reload)
        2. Validates: email required, password required, role required
        3. POST /api/auth/login with {email, password, role}
        4. On success:
           - Saves token to localStorage('uv_token')
           - Normalizes role: backend 'blockofficer' → frontend 'officer'
           - Saves role and full user object to localStorage
           - Navigates to /citizen, /officer, or /admin based on role
        5. On error: shows server error message

78-128| async function handleSignup(e)
     ↳ 1. Validates ALL 12 fields (name≥3, age≥18, valid email, valid phone, etc.)
        2. Block validation is SKIPPED for admin role (admins aren't assigned to blocks)
        3. Password strength must be ≥3 ("Good" or better)
        4. POST /api/auth/register with all fields
           - Note: frontend 'officer' is sent as 'blockofficer' to backend (line 105)
        5. On success: same localStorage + redirect flow as login

130-134| const set = (setter) => (field) => (e) => {...}
     ↳ Curried helper function for form field updates. Creates onChange handlers.
        Also clears the field's error and server error when user starts typing.
        For checkboxes, reads e.target.checked instead of e.target.value.
```

**API ENDPOINTS USED:**
| Method | URL | Data Sent | Response |
|--------|-----|-----------|----------|
| POST | `/api/auth/login` | email, password, role | { token, user } |
| POST | `/api/auth/register` | name, email, password, phone, role, age, gender, address, city, pincode, block | { token, user } |

**WHAT TO CHANGE IF:**
- Add a new signup field → add to useState (line 33), validate in handleSignup, add to API call (line 100-112), add form JSX
- Remove role selection from login → remove lines 184-193, hardcode role
- Change password requirements → edit passwordStrength() and line 92

---

> **Continued in Part 3** → Citizen Dashboard pages
