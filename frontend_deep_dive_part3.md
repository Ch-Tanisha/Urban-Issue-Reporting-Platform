# UrbanVoice — Frontend Deep Dive (Part 3 of 4)
# 👤 Citizen Dashboard + 👮 Officer Dashboard

---

## 10. CITIZEN DASHBOARD

---

### ═══════════════════════════════════════
### FILE: src/pages/citizen/CitizenDashboard.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
The layout shell for the citizen portal. Contains the Sidebar, top bar, and a view-switching system. Manages all citizen issues state and API calls. All child pages receive data as props.

```
1-10| Imports
     ↳ useState, useEffect: React state/effect hooks
        Routes, Route, useNavigate: routing (navigate not used but available)
        Sidebar, CitizenHome, ReportIssue, MyReports, CitizenProfile: child views
        NotificationBell: notification dropdown
        API: axios instance
        citizen.css: citizen-specific styles

12-17| NAV array
     ↳ 4 navigation items with view ID, label, and SVG icon.
        home → Dashboard, report → Report Issue, reports → My Reports, profile → My Profile

19 | export default function CitizenDashboard() {
21 |   const [view, setView] = useState('home')
     ↳ Controls which child page is shown. Starts with 'home'.

22 |   const [issues, setIssues] = useState([])
     ↳ Array of ALL issues reported by this citizen. Fetched from backend.

23 |   const [loading, setLoading] = useState(true)
     ↳ Shows loading indicator while fetching.

25-35| citizen object — Built from localStorage
     ↳ Reads uv_user from localStorage (saved during login).
        Extracts: name, email, phone, address, city, zip (pincode), block, id.
        Provides fallback defaults if fields are missing.

38-48| async function fetchIssues()
     ↳ GET /api/issues/my → returns only THIS citizen's issues.
        Saves to issues state. Called on mount (useEffect line 50).

55-81| async function addIssue(formData)
     ↳ Creates FormData object (needed for file upload).
        Appends: title, description, category, priority, address, coordinates, block, citizenContact.
        If formData.image exists, appends it as 'photo' (backend expects this field name).
        POST /api/issues/create with multipart/form-data.
        On success: re-fetches issues, switches view to 'reports'.
        On error: shows alert with server message.

84-86| function deleteIssue(id)
     ↳ Local-only delete (removes from state). Backend delete not implemented for citizens.

88-93| views object — Maps view names to components
     ↳ home → <CitizenHome issues={issues} ... />
        report → <ReportIssue onSubmit={addIssue} ... />
        reports → <MyReports issues={issues} ... />
        profile → <CitizenProfile citizen={citizen} />

96-120| JSX Layout
     ↳ dashboard-wrapper: flex container (sidebar + main)
        Sidebar: left panel with nav items
        main-content: right side with top-bar + page-content
        top-bar: shows current view label + NotificationBell + "New Report" button
        page-content: renders views[view] (the active child page)
```

**CONNECTIONS:**
- Receives data from: localStorage (user info), API /api/issues/my
- Sends data to: all child pages via props
- Children: CitizenHome, ReportIssue, MyReports, CitizenProfile

---

### ═══════════════════════════════════════
### FILE: src/pages/citizen/CitizenHome.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
The citizen's main dashboard view. Shows a welcome banner, 4 stat cards, quick actions, status breakdown bars, block info, and recent activity list.

```
1-2| Imports StatCard, StatusBadge

4  | export default function CitizenHome({ issues, onNav, citizen, loading }) {
     ↳ issues: array of citizen's issues (from parent)
        onNav: function to switch views (e.g., onNav('report'))
        citizen: user object with name, block, etc.
        loading: boolean for loading state

5-8| Computed stats
     ↳ Counts issues by status using .filter().length:
        pending (status=Reported), inProgress, resolved, total

10 |   const recentIssues = [...issues].sort(...).slice(0,5)
     ↳ Sorts by date (newest first), takes top 5.
        Uses reportedOn (backend field) OR createdAt (MongoDB auto-field) as fallback.

15-25| Welcome Banner
     ↳ Gradient background, shows citizen's first name with 👋 emoji.
        Two buttons: "Report New Issue" and "View My Reports".

28-33| Stats Grid — 4 StatCard components
     ↳ Pending Review (red), In Progress (blue), Resolved (green), Total (slate)

38-53| Quick Actions panel
     ↳ 3 clickable chips: Report, Track, Profile. Each calls onNav() on click.

56-73| Status Breakdown panel
     ↳ Visual progress bars. Width = (count/total)*100%.
        Shows Reported, In Progress, Resolved with colored bars.

76-90| Your Block panel
     ↳ Shows block letter in gradient circle, block name, address, city.

94-116| Recent Activity panel
     ↳ 3 states: loading (⏳), empty (📭), or list of recent issues.
        Each row shows: title, category, date, and StatusBadge.
```

---

### ═══════════════════════════════════════
### FILE: src/pages/citizen/ReportIssue.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
A multi-field form for submitting a new urban issue. Includes text inputs, dropdowns, date/time pickers, textarea, and photo upload with preview.

```
3-7| Local blocks and categories arrays
     ↳ Hardcoded here (not imported from mockData). This is the source of truth for these dropdowns.

9  | export default function ReportIssue({ onSubmit, onCancel, citizen }) {
     ↳ onSubmit: function from CitizenDashboard.addIssue
        onCancel: function to go back to home view
        citizen: used to pre-fill the block field

10-13| Form state — 10 fields
     ↳ title, category, priority, block (pre-filled from citizen.block),
        address, coordinates, description, date, time, image (File object or null)

14-16| preview, errors, submitting states

17 |   const fileRef = useRef()
     ↳ Reference to the hidden <input type="file">. Used to trigger file picker on click.

24-31| handleImage(e)
     ↳ Gets the selected file. Stores it in form.image.
        Uses FileReader.readAsDataURL to create a base64 preview string.
        Sets preview state to show the image thumbnail.

33-43| validate()
     ↳ Checks: title≥5, category selected, priority selected, block selected,
        address≥5, description≥20, date required.
        Returns error object (empty = valid).

45-55| handleSubmit(e)
     ↳ Prevents page reload. Validates. If errors, stops.
        Sets submitting=true, waits 600ms (UX delay), calls onSubmit(form).

77-193| Form JSX
     ↳ Two panels:
        Panel 1 "Issue Details": title, category, priority, block, address, coordinates,
                                  date, time, description with character counter (line 152)
        Panel 2 "Attach Photo": Clickable upload area. Shows placeholder or preview.
                                 Hidden <input type="file"> triggered by clicking the area.
                                 "Remove Photo" button appears when preview exists.
        Submit bar: "Submit Report" + "Cancel" buttons.
```

---

### ═══════════════════════════════════════
### FILE: src/pages/citizen/MyReports.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
Shows ALL issues reported by the citizen in a filterable, sortable table. Includes a detail modal popup.

```
5-7| Filter options arrays (STATUSES, CATEGORIES, PRIORITIES)
     ↳ Each starts with 'all' as the default "show everything" option.

9  | export default function MyReports({ issues, onDelete, onNew, onRefresh }) {

10-15| Filter states
     ↳ search (text), status, category, priority, sort order, detailModal (selected issue or null)

17-24| Filtering logic
     ↳ Chains 4 filters: search query (title or ID match), status, category, priority.
        All filters default to 'all' (no filtering).

26-33| Sorting logic
     ↳ newest/oldest: by date. priorityHigh/Low: by priority rank (High=0, Medium=1, Low=2).

51-76| Filter bar — search input + 4 dropdowns + sort dropdown + reset button

89-119| Table
     ↳ Columns: ID (last 6 chars of MongoDB _id), Title (+address), Category, Priority badge,
        Status badge, Date, Actions (View button).
        Each row = one issue.

123-155| Detail Modal
     ↳ Shows: category, priority, status, reported date, location, description.
        If issue has a photo, displays it: <img src={`http://localhost:5000${detailModal.photo}`}>
```

---

### ═══════════════════════════════════════
### FILE: src/pages/citizen/CitizenProfile.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
Profile page with avatar card and editable form. Fetches the assigned block officer from the backend and displays their contact info.

```
5  | export default function CitizenProfile({ citizen }) {
6-11| States: form (copy of citizen), editing, saved, errors, saving, saveErr, officer

15-26| useEffect — Fetch assigned block officer
     ↳ GET /api/admin/officers → gets all officers.
        Finds the one whose assignedBlock matches citizen's block.
        Sets officer state (or null if no match).

46-73| async function handleSave(e)
     ↳ Validates form fields. PUT /api/auth/profile with updated data.
        On success: updates localStorage with new user info.
        On error: shows error message.

99-109| Avatar Card — Circular initials, name, role, "Active" badge

116-166| Form — Editable fields: name, email (read-only), phone, block (dropdown when editing),
         address, city, postal code. Save/Cancel buttons only show in edit mode.

172-194| Block Officer Contact section
     ↳ Only shows if officer was found. Displays avatar, name, block, email/call links.
```

**API ENDPOINTS USED:**
| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/api/issues/my` | Fetch citizen's issues |
| POST | `/api/issues/create` | Submit new issue (multipart) |
| PUT | `/api/auth/profile` | Update citizen profile |
| GET | `/api/admin/officers` | Find assigned block officer |

---

## 11. BLOCK OFFICER DASHBOARD

---

### ═══════════════════════════════════════
### FILE: src/pages/blockofficer/OfficerDashboard.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
Layout shell for the officer portal. Dark-themed. Fetches officer profile and block issues from backend. Provides status update and duplicate toggle functions.

```
18 | export default function OfficerDashboard() {
19-27| Officer state — Built from localStorage, then updated from API

34-48| async function fetchProfile()
     ↳ GET /api/block/profile → gets officer's name, email, phone, assignedBlock.
        Updates officer state with backend data (more reliable than localStorage).

51-61| async function fetchIssues()
     ↳ GET /api/block/issues → gets all issues in the officer's assigned block.

63-66| useEffect → calls both fetchProfile and fetchIssues on mount

69-77| async function updateStatus(id, status)
     ↳ PUT /api/issues/:id/status with { status }.
        Locally updates the issue in state (optimistic update).

80-87| async function toggleDuplicate(id)
     ↳ PUT /api/issues/:id/duplicate → toggles isDuplicate flag.
        Backend returns new isDuplicate value, updates local state.

97 |   <div className="dashboard-wrapper officer-theme">
     ↳ officer-theme class triggers dark mode CSS overrides from officer.css.
```

---

### ═══════════════════════════════════════
### FILE: src/pages/blockofficer/OfficerHome.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
The officer's main view. Shows 4 stat cards, filter panel, doughnut chart (status distribution), bar chart (categories), and a full issues table with status dropdown + detail modal.

```
1-11| Imports: Doughnut & Bar from react-chartjs-2, Chart.js components, StatCard, StatusBadge, Modal
     ↳ ChartJS.register(...) registers all needed Chart.js plugins.

15 | export default function OfficerHome({ issues, officer, onStatusChange, onToggleDup }) {

21 |   const base = issues.filter(i => !i.isDuplicate)
     ↳ Excludes duplicate-flagged issues from all stats and charts.

28-34| Filtering — Status, priority, and search text
37-47| Chart data preparation
     ↳ donutData: 3 segments (Reported=sky, In Progress=amber, Resolved=green)
        barData: one bar per category, sky blue color

52-57| Stats Grid — 4 StatCards
62-120| Three-column layout: Filters | Doughnut | Bar chart

132-165| Issues table
     ↳ Each row has a status <select> dropdown. Changing it calls onStatusChange(id, newStatus).
        "Details" button opens the modal.

170-217| Detail Modal
     ↳ Shows category, priority, status, date, location, citizen info (name, email, phone),
        description, and a "Mark as Duplicate" / "Mark as Valid" toggle button.
```

---

### ═══════════════════════════════════════
### FILE: src/pages/blockofficer/OfficerMyIssues.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
Shows only issues the officer is actively working on (In Progress or Resolved). Displayed as cards instead of a table.

```
3  | export default function OfficerMyIssues({ issues, officer, onStatusChange }) {
4  |   const active = issues.filter(i => i.status === 'In Progress' || i.status === 'Resolved')
     ↳ Only shows issues the officer has started working on.

22-49| Issue cards — Each card shows:
     ↳ Status + Priority badges, title, category, address, date,
        citizen info (name, email link, phone link), status dropdown.
```

---

### ═══════════════════════════════════════
### FILE: src/pages/blockofficer/OfficerAnalytics.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
Statistics page for the officer's block. Shows 6 stat cards and two breakdown panels (priority and category) with animated progress bars.

```
4  |   const base = issues.filter(i => !i.isDuplicate)
     ↳ Excludes duplicates from all calculations.

12 |   const rate = total > 0 ? Math.round((resolved / total) * 100) : 0
     ↳ Resolution rate percentage.

25-32| 6 StatCards: Total, Reported, In Progress, Resolved, High Priority, Resolution Rate

35-48| Priority Breakdown — 3 horizontal bars (High/Medium/Low) with animated width
51-65| Category Breakdown — one bar per category
```

---

### ═══════════════════════════════════════
### FILE: src/pages/blockofficer/OfficerProfile.jsx
### ═══════════════════════════════════════

**WHAT THIS FILE DOES:**
Read-only profile page for the officer. Shows avatar, name, role, assigned block, email, phone.

```
1  | export default function OfficerProfile({ officer }) {
     ↳ Receives officer data as prop from OfficerDashboard.

9-17| Avatar panel — Initials circle + name + "Block Officer" + "Active" badge

24-35| Info panel — Key-value rows: Full Name, Role, Assigned Block, Email, Phone

36-38| Info note — Explains the officer's responsibilities
```

**OFFICER API ENDPOINTS USED:**
| Method | URL | Purpose |
|--------|-----|---------|
| GET | `/api/block/profile` | Get officer profile |
| GET | `/api/block/issues` | Get issues in officer's block |
| PUT | `/api/issues/:id/status` | Update issue status |
| PUT | `/api/issues/:id/duplicate` | Toggle duplicate flag |

---

> **Continued in Part 4** → Admin Dashboard + CSS Files + Summary Tables
