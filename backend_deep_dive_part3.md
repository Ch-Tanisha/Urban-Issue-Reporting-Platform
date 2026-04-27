# UrbanVoice Backend — Complete Deep Dive (Part 3: Routes & Data Flow)

## TABLE OF CONTENTS — PART 3
16. Routes — URL Mapping
    - authRoutes.js
    - issueRoutes.js
    - adminRoutes.js
    - blockRoutes.js
    - notificationRoutes.js
17. Complete Request-Response Data Flow
18. Complete API Endpoint Reference Table
19. How Files Connect — The Big Picture

---

## 16. ROUTES — URL MAPPING

Routes are the **traffic directors** of your backend. When a request arrives at a URL, the route file decides:
1. Which middleware to run (authentication, role checks)
2. Which controller function handles the business logic

Think of routes like a restaurant menu — each item (URL) is linked to a specific dish (controller function) prepared in the kitchen.

### How Express Routing Works

In `server.js`, you wrote:
```javascript
app.use('/api/auth', authRoutes);
```
This means: "Any URL that starts with `/api/auth` → send it to `authRoutes.js`."

Inside `authRoutes.js`, when you write:
```javascript
router.post('/register', registerCitizen);
```
The FULL URL becomes: `/api/auth` + `/register` = **`/api/auth/register`**

---

### 16.1 routes/authRoutes.js — Authentication URLs

```javascript
const express = require('express');
const router  = express.Router();
```
- **`express.Router()`** — Creates a mini-app (router) that handles a group of related routes. Think of it as a sub-menu within the main menu.

```javascript
const {
  registerCitizen, loginUser, loginCitizen, loginOfficer, loginAdmin, getMe
} = require('../controllers/authController');
const { updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
```
- Imports the controller functions and middleware. Each function handles one specific operation.

```javascript
// Registration
router.post('/register', registerCitizen);
```
- **`router.post('/register', registerCitizen)`**
  - **HTTP Method**: `POST` — Used when creating new data (a new user account).
  - **URL**: `/register` (full: `/api/auth/register`)
  - **Handler**: `registerCitizen` function from authController
  - **No middleware** — This is a public route. Anyone can register.

```javascript
// Role-specific logins
router.post('/login/citizen', loginCitizen);
router.post('/login/officer', loginOfficer);
router.post('/login/admin',   loginAdmin);
```
- Three separate login endpoints. The frontend sends the user to the correct one based on which login form they used.

```javascript
// Legacy unified login
router.post('/login', loginUser);
```
- The old single login endpoint. Kept so older frontend code doesn't break.

```javascript
// Protected routes (require valid JWT token)
router.get('/me',       protect, getMe);
router.put('/profile',  protect, updateProfile);
router.put('/password', protect, changePassword);
```
- **`protect`** middleware runs FIRST. If the user has no valid token, the request stops here with a 401 error. The controller function never executes.
- **`GET`** — Read data (fetch user info).
- **`PUT`** — Update existing data (modify profile, change password).

```javascript
// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('uv_token', { httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Logged out successfully.' });
});
```
- **Inline handler** — Instead of a separate controller function, the logic is written right here because it's only 2 lines.
- **`res.clearCookie('uv_token')`** — Tells the browser to delete the auth cookie. The options must match the ones used when setting the cookie.

```javascript
module.exports = router;
```
- Exports the router so `server.js` can import it with `require('./routes/authRoutes')`.

---

### 16.2 routes/issueRoutes.js — Issue Management URLs

```javascript
const { protect, citizenOnly, officerOnly, adminOnly } = require('../middleware/authMiddleware');
```
- Imports ALL four middleware functions because issues involve all three roles.

```javascript
// POST /api/issues/create — Submit a new issue with optional photo
router.post('/create', protect, citizenOnly, (req, res, next) => {
  const upload = req.app.get('upload');
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, createIssue);
```
This is the most complex route. It has **4 middleware/handlers in a chain**:
1. **`protect`** — Checks JWT token, sets `req.user`.
2. **`citizenOnly`** — Ensures only citizens can report issues.
3. **Inline Multer handler** — `req.app.get('upload')` retrieves the Multer instance stored in `server.js`. `upload.single('photo')` processes ONE file from the form field named 'photo'. If the file is too large or wrong type, it returns 400.
4. **`createIssue`** — The actual controller function.

```javascript
router.get('/my', protect, citizenOnly, getMyIssues);
```
- Only citizens can see their own issues. Protected + role-restricted.

```javascript
// Admin-only routes (must come BEFORE /:id routes)
router.get('/all', protect, adminOnly, getAllIssues);
```
- **ORDER MATTERS!** This line is placed BEFORE `/:id` routes. If it came after, Express would think "all" is an ID and try to find an issue with `_id: "all"` — which would fail.

```javascript
router.get('/block', protect, officerOnly, getIssuesByBlock);
```
- Only block officers can access this.

```javascript
// Shared route — officers AND admins
router.put('/:id/status', protect, (req, res, next) => {
  if (req.user.role === 'blockofficer' || req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied. Officers and Admins only.' });
}, updateIssueStatus);
```
- **Custom inline middleware** — Neither `officerOnly` nor `adminOnly` alone works here because BOTH roles need access. So a custom check allows either role.
- **`/:id`** — A URL parameter. In `/api/issues/663abc123/status`, `req.params.id` equals `"663abc123"`.

```javascript
router.delete('/:id', protect, adminOnly, deleteIssue);
```
- Only admins can delete issues. DELETE method is for removing data.

---

### 16.3 routes/adminRoutes.js — Admin-Only URLs

```javascript
const { protect, adminOnly } = require('../middleware/authMiddleware');
```
- Every route here uses BOTH `protect` AND `adminOnly` — except `seedAdmin`.

```javascript
router.get('/analytics',      protect, adminOnly, getAnalytics);
router.get('/officers',       protect, adminOnly, getAllOfficers);
router.post('/officers',      protect, adminOnly, createOfficer);
router.put('/officers/:id',   protect, adminOnly, updateOfficer);
router.delete('/officers/:id',protect, adminOnly, deleteOfficer);
router.get('/citizens',       protect, adminOnly, getAllCitizens);
router.delete('/citizens/all',protect, adminOnly, deleteAllCitizens);
router.delete('/citizens/:id',protect, adminOnly, deleteCitizen);
router.post('/create-admin',  protect, adminOnly, createAdmin);
```
- All protected and admin-only. This is a **CRUD** pattern:
  - **C**reate = POST
  - **R**ead = GET
  - **U**pdate = PUT
  - **D**elete = DELETE

```javascript
router.post('/seed-admin', seedAdmin);
```
- **NO middleware!** This is public because it's meant for the very first setup before any admin exists. But the controller self-locks after first use.

**Route order for `/citizens`**:
```javascript
router.delete('/citizens/all', ...);  // Must come FIRST
router.delete('/citizens/:id', ...);  // Must come SECOND
```
If reversed, `/citizens/all` would match `/:id` with `id = "all"`.

---

### 16.4 routes/blockRoutes.js — Block Officer URLs

```javascript
router.get('/profile',   protect, officerOnly, getOfficerProfile);
router.get('/issues',    protect, officerOnly, getAssignedIssues);
router.get('/analytics', protect, officerOnly, getBlockAnalytics);
```
- All three routes: protected + officer-only. Simple and clean.

---

### 16.5 routes/notificationRoutes.js — Notification URLs

```javascript
router.get('/',           protect, getMyNotifications);
router.put('/read-all',   protect, markAllRead);
router.put('/:id/read',   protect, markAsRead);
router.delete('/:id',     protect, deleteNotification);
```
- **`router.get('/')`** — Since this is mounted at `/api/notifications`, the full URL is just `/api/notifications`.
- **`/read-all` before `/:id/read`** — Again, order matters. Without this, `read-all` would be treated as an ID.
- **Only `protect`**, no role guard — ALL logged-in users (citizens, officers, admins) can manage their own notifications.

---

## 17. COMPLETE REQUEST-RESPONSE DATA FLOW

Here's what happens when a citizen submits a new issue, from mouse click to database and back:

### Step 1: Frontend (React) sends a request
```
User clicks "Submit Issue" button
→ React calls: axios.post('/api/issues/create', formData, { headers: { Authorization: 'Bearer eyJhb...' } })
→ HTTP POST request travels from localhost:5173 to localhost:5000
```

### Step 2: Express receives the request
```
server.js receives the request at /api/issues/create
→ CORS middleware: "Is localhost:5173 allowed?" → YES, proceed
→ cookieParser: parses any cookies
→ express.json(): parses the JSON body into req.body
→ URL matching: /api/issues/* → send to issueRoutes.js
```

### Step 3: Route matching
```
issueRoutes.js: POST /create matches!
→ Middleware chain starts: protect → citizenOnly → multer → createIssue
```

### Step 4: protect middleware
```
authMiddleware.js → protect():
→ Reads token from "Authorization: Bearer eyJhb..."
→ jwt.decode() → reads { id: "663abc...", role: "citizen" }
→ getRoleSecret("citizen") → gets JWT_SECRET_CITIZEN
→ jwt.verify(token, citizenSecret) → validates signature + expiry
→ User.findById("663abc...") → fetches user from MongoDB
→ req.user = { _id: "663abc...", name: "John", role: "citizen", ... }
→ next() → passes to citizenOnly
```

### Step 5: citizenOnly middleware
```
authMiddleware.js → citizenOnly():
→ req.user.role === 'citizen'? → YES
→ next() → passes to multer handler
```

### Step 6: Multer middleware
```
Processes multipart form data:
→ Extracts the photo file from the 'photo' field
→ Saves to server/uploads/1714153200000.jpg
→ Sets req.file = { filename: '1714153200000.jpg', ... }
→ next() → passes to createIssue
```

### Step 7: Controller function
```
issueController.js → createIssue():
→ Reads req.body: { title, description, category, ... }
→ Issue.create({...}) → Mongoose sends INSERT to MongoDB Atlas
→ MongoDB saves the document, returns it with auto-generated _id
→ createNotification() → saves a notification to MongoDB
→ res.status(201).json(issue) → sends the created issue back
```

### Step 8: Response travels back
```
Express sends HTTP 201 response with JSON body
→ CORS headers added automatically
→ Response travels from localhost:5000 to localhost:5173
→ React's axios receives the response
→ Frontend updates the UI to show "Issue submitted!"
```

---

## 18. COMPLETE API ENDPOINT REFERENCE

### Authentication (/api/auth)
| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| POST | /api/auth/register | Public | — | Register citizen/officer |
| POST | /api/auth/login/citizen | Public | — | Citizen login |
| POST | /api/auth/login/officer | Public | — | Officer login |
| POST | /api/auth/login/admin | Public | — | Admin login |
| POST | /api/auth/login | Public | — | Legacy login |
| GET | /api/auth/me | Token | Any | Get current user |
| PUT | /api/auth/profile | Token | Any | Update profile |
| PUT | /api/auth/password | Token | Any | Change password |
| POST | /api/auth/logout | Public | — | Clear auth cookie |

### Issues (/api/issues)
| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| POST | /api/issues/create | Token | Citizen | Submit new issue |
| GET | /api/issues/my | Token | Citizen | My reported issues |
| GET | /api/issues/all | Token | Admin | All issues (filterable) |
| GET | /api/issues/block | Token | Officer | Issues in officer's block |
| PUT | /api/issues/:id/status | Token | Officer/Admin | Update issue status |
| PUT | /api/issues/:id/duplicate | Token | Officer/Admin | Toggle duplicate flag |
| DELETE | /api/issues/:id | Token | Admin | Delete an issue |

### Admin (/api/admin)
| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| GET | /api/admin/analytics | Token | Admin | Platform analytics |
| GET | /api/admin/officers | Token | Admin | List all officers |
| POST | /api/admin/officers | Token | Admin | Create officer |
| PUT | /api/admin/officers/:id | Token | Admin | Update officer |
| DELETE | /api/admin/officers/:id | Token | Admin | Delete officer |
| GET | /api/admin/citizens | Token | Admin | List all citizens |
| DELETE | /api/admin/citizens/:id | Token | Admin | Delete one citizen |
| DELETE | /api/admin/citizens/all | Token | Admin | Delete ALL citizens |
| POST | /api/admin/create-admin | Token | Admin | Create new admin |
| POST | /api/admin/seed-admin | Public | — | Bootstrap first admin |

### Block Officer (/api/block)
| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| GET | /api/block/profile | Token | Officer | Officer's profile |
| GET | /api/block/issues | Token | Officer | Issues in assigned block |
| GET | /api/block/analytics | Token | Officer | Block-level analytics |

### Notifications (/api/notifications)
| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| GET | /api/notifications | Token | Any | Get my notifications |
| PUT | /api/notifications/read-all | Token | Any | Mark all read |
| PUT | /api/notifications/:id/read | Token | Any | Mark one read |
| DELETE | /api/notifications/:id | Token | Any | Delete notification |

---

## 19. HOW FILES CONNECT — THE BIG PICTURE

```
USER'S BROWSER (React on port 5173)
        │
        │  HTTP Request (POST /api/auth/login/citizen)
        ▼
┌─────────────────────────────────────────────┐
│  server.js (THE ENTRY POINT)                │
│  ├── Loads .env variables                   │
│  ├── Creates Express app                    │
│  ├── Configures Multer (file uploads)       │
│  ├── Sets up CORS, cookies, JSON parsing    │
│  ├── Mounts all route files                 │
│  ├── Connects to MongoDB (config/db.js)     │
│  └── Starts listening on port 5000          │
└──────────────────┬──────────────────────────┘
                   │
                   │  URL: /api/auth/login/citizen
                   │  Matches: app.use('/api/auth', authRoutes)
                   ▼
┌─────────────────────────────────────────────┐
│  routes/authRoutes.js (TRAFFIC DIRECTOR)    │
│  ├── POST /login/citizen → loginCitizen     │
│  │   (no middleware — public route)          │
│  └── Calls controller function               │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  controllers/authController.js (LOGIC)      │
│  ├── Reads email & password from req.body   │
│  ├── Queries database via User model         │
│  ├── Compares password with bcrypt           │
│  ├── Generates JWT token                     │
│  ├── Sets httpOnly cookie                    │
│  └── Sends JSON response with token + user   │
└──────────────────┬──────────────────────────┘
                   │
                   │  User.findOne({ email })
                   ▼
┌─────────────────────────────────────────────┐
│  models/User.js (DATABASE BLUEPRINT)        │
│  ├── Defines the schema (fields + types)    │
│  ├── Mongoose translates to MongoDB query    │
│  └── Returns matching document               │
└──────────────────┬──────────────────────────┘
                   │
                   │  MongoDB query over the internet
                   ▼
┌─────────────────────────────────────────────┐
│  MongoDB Atlas (CLOUD DATABASE)             │
│  └── Collection: users                       │
│      └── Document: { name, email, ... }      │
└──────────────────┬──────────────────────────┘
                   │
                   │  Document returned
                   ▼
        Response travels back up the chain
        → Controller builds response
        → Express sends it
        → Browser receives JSON
        → React stores token in localStorage
        → User sees their dashboard
```

### For a PROTECTED route (e.g., GET /api/issues/my):

```
Request arrives → server.js → issueRoutes.js
    │
    ├──► middleware/authMiddleware.js → protect()
    │    ├── Extracts token from header/cookie
    │    ├── Decodes to find role
    │    ├── Verifies with role-specific secret
    │    ├── Loads user from DB → sets req.user
    │    └── Calls next()
    │
    ├──► middleware/authMiddleware.js → citizenOnly()
    │    ├── Checks req.user.role === 'citizen'
    │    └── Calls next()
    │
    └──► controllers/issueController.js → getMyIssues()
         ├── Issue.find({ reportedBy: req.user._id })
         └── res.json(issues)
```

---

## SUMMARY: WHAT EACH FILE DOES (QUICK REFERENCE)

| File | Purpose |
|------|---------|
| `server.js` | Entry point. Creates Express app, configures middleware, mounts routes, starts server |
| `.env` | Secret config (DB password, JWT secrets, port) |
| `package.json` | Lists dependencies and npm scripts |
| `nodemon.json` | Auto-restart config for development |
| `config/db.js` | Connects to MongoDB Atlas using Mongoose |
| `models/User.js` | Schema for user accounts (all roles) |
| `models/BlockOfficer.js` | Schema for officer profiles (linked to User) |
| `models/Issue.js` | Schema for reported urban issues |
| `models/Notification.js` | Schema for user notifications |
| `middleware/authMiddleware.js` | JWT verification + role guards (protect, adminOnly, etc.) |
| `controllers/authController.js` | Register, Login (3 role-specific + 1 legacy), GetMe |
| `controllers/issueController.js` | Create/Read/Update/Delete issues + notifications |
| `controllers/adminController.js` | Analytics, officer/citizen CRUD, admin seeding |
| `controllers/blockController.js` | Officer profile, block issues, block analytics |
| `controllers/userController.js` | Update profile, change password |
| `controllers/notificationController.js` | Get/read/delete notifications + internal helper |
| `routes/authRoutes.js` | Maps /api/auth/* URLs to auth + user controllers |
| `routes/issueRoutes.js` | Maps /api/issues/* URLs to issue controller |
| `routes/adminRoutes.js` | Maps /api/admin/* URLs to admin controller |
| `routes/blockRoutes.js` | Maps /api/block/* URLs to block controller |
| `routes/notificationRoutes.js` | Maps /api/notifications/* URLs to notification controller |

---

**This completes the full backend deep dive. All 3 parts together cover every single file and every line of code in your UrbanVoice backend.**
