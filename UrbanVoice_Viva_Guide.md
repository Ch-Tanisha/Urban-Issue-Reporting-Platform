# UrbanVoice Project Viva Guide

Prepared for a 3-member group viva.

## 1. Project Overview

UrbanVoice is an urban issue reporting platform. Citizens can report civic problems such as road damage, garbage, water supply issues, electricity problems, drainage, and public safety concerns. Block officers see issues from their assigned block and update progress. Admins manage the whole platform, officers, citizens, and analytics.

The project follows a MERN-style flow:

- Frontend: React + Vite in `client/`
- Backend: Node.js + Express in `server/`
- Database: MongoDB with Mongoose models
- Authentication: JWT tokens, role-based routes, and session storage on frontend
- File uploads: Multer stores issue photos in `server/uploads`

Main user roles:

- Citizen: Register/login, submit issue, view own reports, receive notifications.
- Block Officer: Login, view assigned block issues, update status, flag duplicates, view block analytics.
- Admin: Login, view all issues, update/delete issues, manage officers/citizens, view platform analytics.

## 2. High-Level Request Flow

Example: citizen reports an issue.

1. User opens React app at `http://localhost:5173`.
2. `App.jsx` routes user to `/auth`, `/citizen`, `/officer`, or `/admin`.
3. User logs in through `AuthPage.jsx`.
4. Frontend sends request through `client/src/api/axios.js` to backend API at `http://localhost:5000`.
5. Backend route receives request, for example `POST /api/auth/login/citizen`.
6. Controller validates user from MongoDB, checks password using bcrypt, creates JWT, and returns user data.
7. Frontend stores token, role, and user in `sessionStorage`.
8. Protected dashboard pages attach token to API calls using Axios interceptor.
9. Backend `protect` middleware verifies token and loads `req.user`.
10. Role guards such as `citizenOnly`, `officerOnly`, and `adminOnly` allow or block access.
11. Controller performs database operation using Mongoose models.
12. Response returns JSON to React, and React updates UI state.

## 3. Frontend Code Flow

### Entry Files

`client/src/main.jsx`

- Mounts the React app into the browser.
- Loads `App.jsx`.

`client/src/App.jsx`

- Defines application routes using `react-router-dom`.
- Public routes:
  - `/` -> `LandingPage`
  - `/auth` -> `AuthPage`
- Protected routes:
  - `/citizen/*` -> `CitizenDashboard`
  - `/officer/*` -> `OfficerDashboard`
  - `/admin/*` -> `AdminDashboard`
- `ProtectedRoute` checks `sessionStorage` for `uv_token` and `uv_role`.
- It redirects users to the correct dashboard if they try to open a wrong role page.
- On refresh, it calls `GET /api/auth/me` to verify the token.

`client/src/api/axios.js`

- Creates one shared Axios instance.
- Base URL is `http://localhost:5000`.
- Adds JWT from `sessionStorage` as `Authorization: Bearer <token>`.
- Sends cookies using `withCredentials: true`.
- If token validation fails on auth endpoints, it clears session and redirects to login.

### Authentication Page

`client/src/pages/AuthPage.jsx`

- Handles login, signup, forgot password, and reset password.
- Login has role-specific endpoints:
  - Citizen -> `POST /api/auth/login/citizen`
  - Officer -> `POST /api/auth/login/officer`
  - Admin -> `POST /api/auth/login/admin`
- Signup is citizen-only in the UI.
- Form validation happens before sending API requests.
- On successful login/signup, it stores:
  - `uv_token`
  - `uv_role`
  - `uv_user`
- Then it navigates to the matching dashboard.

### Citizen Dashboard

`client/src/pages/citizen/CitizenDashboard.jsx`

- Validates that the logged-in user is a citizen.
- Fetches citizen's issues using `GET /api/issues/my`.
- Shows four main views:
  - Dashboard home
  - Report issue
  - My reports
  - Profile
- `addIssue()` builds `FormData` and posts it to `POST /api/issues/create`.
- The issue photo is sent as multipart form data.

`client/src/pages/citizen/ReportIssue.jsx`

- Issue submission form.
- Collects title, category, priority, block, address, coordinates, date, time, description, and photo.
- Validates important fields before submit.
- Sends form data upward to `CitizenDashboard`.

`client/src/pages/citizen/MyReports.jsx`

- Displays issues reported by the current citizen.
- Provides filters by status, category, priority, search, and sorting.
- Opens a modal for full report details and attached photo.

### Officer Dashboard

`client/src/pages/blockofficer/OfficerDashboard.jsx`

- Validates that the user role is `blockofficer`.
- Fetches officer profile from `GET /api/block/profile`.
- Fetches assigned block issues from `GET /api/block/issues`.
- Allows status update through `PUT /api/issues/:id/status`.
- Allows duplicate flag toggle through `PUT /api/issues/:id/duplicate`.

`client/src/pages/blockofficer/OfficerMyIssues.jsx`

- Shows issues that are already `In Progress` or `Resolved`.
- Provides status dropdown for officer workflow.
- Shows citizen contact details for follow-up.

`client/src/pages/blockofficer/OfficerAnalytics.jsx`

- Displays block-level issue analytics from the issues available to that officer.

### Admin Dashboard

`client/src/pages/admin/AdminDashboard.jsx`

- Validates admin role using `GET /api/auth/me`.
- Fetches all issues using `GET /api/issues/all`.
- Admin can:
  - View dashboard summary
  - Manage all reported issues
  - Manage officers
  - View analytics
  - View profile

`client/src/pages/admin/AdminIssues.jsx`

- Shows all platform issues.
- Supports filtering by status, block, category, priority, and search.
- Admin can change status, mark resolved, view details, or delete issues.

`client/src/pages/admin/AdminOfficers.jsx`

- Manages block officers.
- Connects to admin officer APIs for listing, creating, updating, and deleting officers.

### Shared Components

`Sidebar.jsx`

- Common dashboard navigation for all roles.

`NotificationBell.jsx`

- Fetches notifications from `GET /api/notifications`.
- Polls every 30 seconds.
- Shows unread count.
- Supports mark one read, mark all read, and delete notification.

`StatusBadge.jsx`

- Displays consistent status and priority labels.

`Modal.jsx`

- Reusable popup component for details and confirmations.

`ThemeToggle.jsx`

- Handles light/dark theme switching.

## 4. Backend Code Flow

### Server Entry Point

`server/server.js`

- Loads environment variables with dotenv.
- Creates Express app.
- Enables CORS for frontend origin `http://localhost:5173`.
- Parses cookies using `cookie-parser`.
- Parses JSON and URL encoded request bodies.
- Configures Multer for issue photo uploads:
  - Destination: `server/uploads`
  - Allowed: JPG, JPEG, PNG, WEBP
  - Max size: 5 MB
- Serves uploaded images at `/uploads`.
- Mounts route groups:
  - `/api/auth`
  - `/api/issues`
  - `/api/admin`
  - `/api/block`
  - `/api/notifications`
- Connects to MongoDB through `connectDB()`.
- Starts server on port `5000` by default.

### Database Connection

`server/config/db.js`

- Connects Express backend to MongoDB.
- Uses MongoDB URI from environment variables.

### Middleware

`server/middleware/authMiddleware.js`

- `protect` checks token from:
  - `Authorization: Bearer <token>`
  - or `uv_token` cookie
- Decodes JWT to read role.
- Uses role-specific secret:
  - Admin secret
  - Officer secret
  - Citizen secret
- Verifies token and loads user from database into `req.user`.
- Role guards:
  - `adminOnly`
  - `officerOnly`
  - `citizenOnly`

This is important for viva: frontend route protection is only for user experience; real security is in backend middleware.

## 5. Backend Models

### User Model

`server/models/User.js`

Stores account data for all roles:

- name
- email
- password
- phone
- role: `citizen`, `blockofficer`, or `admin`
- age, gender, address, city, pincode, block
- reset password token fields
- timestamps

### Issue Model

`server/models/Issue.js`

Stores urban issue reports:

- title and description
- category
- priority: High, Medium, Low
- address, coordinates, block
- status: Reported, In Progress, Resolved
- photo path
- reportedBy user reference
- citizen contact details
- duplicate flag
- reported date
- timestamps

### BlockOfficer Model

`server/models/BlockOfficer.js`

Stores officer profile:

- name
- email
- phone
- assignedBlock
- linked `userId`
- avatar initials

### Notification Model

`server/models/Notification.js`

Stores notifications for users:

- user reference
- message
- type: status_update, new_issue, system, duplicate_flag
- isRead
- issueId reference
- issueTitle
- timestamps

## 6. Backend Routes and Controllers

### Auth Routes

`server/routes/authRoutes.js`

Important endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login/citizen`
- `POST /api/auth/login/officer`
- `POST /api/auth/login/admin`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`

`server/controllers/authController.js`

Main logic:

- Registers citizens and officers, but blocks public admin registration.
- Hashes passwords using bcrypt.
- Checks duplicate email.
- Performs role-specific login.
- Generates JWT with user id and role.
- Sets `uv_token` cookie.
- Supports forgot/reset password using secure token hashing.

`server/controllers/userController.js`

- Updates user profile.
- Changes password after verifying current password.

### Issue Routes

`server/routes/issueRoutes.js`

Important endpoints:

- `POST /api/issues/create` - citizen creates issue
- `GET /api/issues/my` - citizen gets own issues
- `GET /api/issues/all` - admin gets all issues
- `GET /api/issues/block` - officer gets block issues
- `PUT /api/issues/:id/status` - officer/admin updates status
- `PUT /api/issues/:id/duplicate` - officer/admin toggles duplicate flag
- `DELETE /api/issues/:id` - admin deletes issue

`server/controllers/issueController.js`

Main logic:

- Creates issue and stores optional photo path.
- Saves citizen name, email, phone, and block.
- Creates notification when issue is submitted.
- Fetches citizen's own issues.
- Fetches officer's assigned block issues.
- Updates status and notifies citizen.
- Toggles duplicate flag and notifies citizen.
- Filters all issues for admin.
- Deletes issue for admin.

### Block Officer Routes

`server/routes/blockRoutes.js`

Important endpoints:

- `GET /api/block/profile`
- `GET /api/block/issues`
- `GET /api/block/analytics`

`server/controllers/blockController.js`

Main logic:

- Gets officer profile from `BlockOfficer`.
- Falls back to user data if officer profile does not exist.
- Gets issues for assigned block.
- Calculates block-level analytics.

### Admin Routes

`server/routes/adminRoutes.js`

Important endpoints:

- `GET /api/admin/analytics`
- `GET /api/admin/officers`
- `POST /api/admin/officers`
- `PUT /api/admin/officers/:id`
- `DELETE /api/admin/officers/:id`
- `GET /api/admin/citizens`
- `DELETE /api/admin/citizens/:id`
- `DELETE /api/admin/citizens/all`
- `POST /api/admin/create-admin`
- `POST /api/admin/seed-admin`

`server/controllers/adminController.js`

Main logic:

- Calculates platform analytics:
  - total issues
  - status counts
  - block-wise count
  - category-wise count
  - priority count
  - monthly trend
  - total citizens and officers
- Lists, creates, updates, deletes block officers.
- Self-heals officer profiles when a user has role `blockofficer` but no `BlockOfficer` profile.
- Lists and deletes citizens.
- Creates admin accounts from existing admin.
- Seeds first admin only when no admin exists.

### Notification Routes

`server/routes/notificationRoutes.js`

Important endpoints:

- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`
- `DELETE /api/notifications/:id`

`server/controllers/notificationController.js`

Main logic:

- Gets latest 50 notifications for logged-in user.
- Counts unread notifications.
- Marks one notification as read.
- Marks all as read.
- Deletes notification.
- Provides `createNotification()` helper used by issue controller.

## 7. Complete Role-Based Flow

### Citizen Flow

1. Citizen signs up or logs in.
2. Frontend stores token and role.
3. Citizen dashboard validates role with `/api/auth/me`.
4. Citizen reports an issue from `ReportIssue.jsx`.
5. `CitizenDashboard.jsx` sends multipart form data to `/api/issues/create`.
6. Backend verifies token using `protect` and checks role using `citizenOnly`.
7. Multer saves optional photo.
8. `createIssue` stores issue in MongoDB.
9. Backend creates notification: issue submitted.
10. Citizen sees issue in `MyReports`.
11. Later, if officer/admin updates status, citizen receives notification.

### Block Officer Flow

1. Officer logs in through officer login endpoint.
2. Backend confirms user role is `blockofficer`.
3. Officer dashboard fetches profile and assigned block.
4. Officer sees only issues from assigned block.
5. Officer changes issue status to `In Progress` or `Resolved`.
6. Backend updates issue status.
7. Backend creates notification for citizen.
8. Officer can also flag issue as duplicate.
9. Officer analytics show counts for assigned block.

### Admin Flow

1. Admin logs in through admin login endpoint.
2. Backend confirms role is `admin`.
3. Admin dashboard fetches all issues.
4. Admin can filter, update, resolve, or delete issues.
5. Admin manages officers and citizens.
6. Admin analytics summarize full platform data.
7. Admin can create other admin accounts.
8. First admin can be seeded only once through `seed-admin`.

## 8. Important Security Points for Viva

- Passwords are never stored as plain text; they are hashed using bcrypt.
- JWT tokens identify user id and role.
- Backend validates every protected request using `protect`.
- Role guards prevent unauthorized access even if someone changes frontend route manually.
- Admin registration is blocked from public signup.
- First admin seed endpoint locks after an admin already exists.
- File upload accepts only image MIME types and limits size to 5 MB.
- Forgot password stores hashed reset token, not raw token.
- Axios sends token with every API request.
- `sessionStorage` is used so different tabs can hold separate sessions.

## 9. Suggested 3-Member Work Division

### Member 1: Frontend and User Experience

Can say:

"I handled the React frontend, routing, dashboards, forms, reusable components, and user experience."

Files to mention:

- `client/src/App.jsx`
- `client/src/api/axios.js`
- `client/src/pages/AuthPage.jsx`
- `client/src/pages/citizen/*`
- `client/src/pages/blockofficer/*`
- `client/src/pages/admin/*`
- `client/src/components/*`
- CSS files in `client/src/styles` and page folders

Responsibilities:

- Built route structure for landing, auth, citizen, officer, and admin.
- Implemented protected route behavior based on role.
- Built login/signup/reset password UI.
- Built citizen report form and my reports table.
- Built officer and admin dashboards.
- Added filters, modals, status badges, sidebar, notification bell, and theme toggle.
- Connected frontend to backend through Axios.

Strong viva line:

"My part starts when the user interacts with the browser. I handle form validation, page routing, dashboard state, API calls through Axios, and updating the UI based on backend responses."

### Member 2: Backend API, Authentication, and Security

Can say:

"I handled the Express backend, authentication, route protection, user APIs, and server setup."

Files to mention:

- `server/server.js`
- `server/config/db.js`
- `server/middleware/authMiddleware.js`
- `server/routes/authRoutes.js`
- `server/controllers/authController.js`
- `server/controllers/userController.js`
- `server/models/User.js`

Responsibilities:

- Set up Express server, CORS, body parsing, cookie parsing, and route mounting.
- Connected backend to MongoDB.
- Implemented registration and role-based login.
- Used bcrypt for password hashing.
- Used JWT for authentication.
- Added role-specific token secrets.
- Built `protect`, `adminOnly`, `officerOnly`, and `citizenOnly` middleware.
- Implemented profile update, password change, forgot password, and reset password.

Strong viva line:

"My part verifies who the user is and what they are allowed to do. Frontend guards improve navigation, but the backend middleware is the real security layer."

### Member 3: Issue Management, Admin, Officer, Notifications, and Database Models

Can say:

"I handled issue lifecycle, officer/admin operations, notifications, analytics, and the main database schemas."

Files to mention:

- `server/models/Issue.js`
- `server/models/BlockOfficer.js`
- `server/models/Notification.js`
- `server/routes/issueRoutes.js`
- `server/controllers/issueController.js`
- `server/routes/blockRoutes.js`
- `server/controllers/blockController.js`
- `server/routes/adminRoutes.js`
- `server/controllers/adminController.js`
- `server/routes/notificationRoutes.js`
- `server/controllers/notificationController.js`

Responsibilities:

- Designed issue schema with status, priority, category, block, photo, and citizen data.
- Implemented create issue, my issues, all issues, block issues, status update, duplicate flag, and delete issue.
- Implemented officer profile and block analytics.
- Implemented admin analytics, officer management, citizen management, and admin creation.
- Implemented notification model and notification APIs.
- Created notification triggers when issues are submitted, updated, or marked duplicate.

Strong viva line:

"My part handles the actual civic problem workflow: issue creation, assignment by block, status tracking, admin oversight, and notifications to keep citizens updated."

## 10. Safe Way to Answer "Who Did What?"

Use this answer:

"We divided the project by layers and workflows. Member 1 worked on React frontend and UI integration. Member 2 worked on backend authentication, security, and user management. Member 3 worked on issue management, admin/officer modules, notifications, analytics, and database models. We integrated together using API contracts, so each frontend screen maps to a backend route."

If teacher asks for specific examples:

- Frontend member: "Login page calls role-specific endpoints, and dashboards call APIs using Axios."
- Backend auth member: "Login checks bcrypt password, creates JWT, and middleware protects routes."
- Issue/admin member: "When status changes, issue is updated in MongoDB and notification is created for citizen."

## 11. Common Viva Questions and Answers

### What problem does the project solve?

It provides a digital platform for citizens to report civic issues and for authorities to track, manage, and resolve them block-wise.

### Why did you use React?

React helps build reusable components like Sidebar, Modal, StatusBadge, and NotificationBell. It also manages dashboard state efficiently.

### Why did you use Express?

Express gives a simple way to create REST APIs, middleware, route groups, and controller-based backend logic.

### Why MongoDB?

The data is document-based. Users, issues, officers, and notifications can be stored as flexible JSON-like documents using Mongoose schemas.

### How is authentication handled?

User logs in, backend verifies password with bcrypt, creates JWT, and frontend stores it in sessionStorage. Axios sends the token in the Authorization header. Backend middleware verifies token on protected routes.

### How are roles handled?

Each user has a role in the User model. Frontend uses role for navigation, but backend role guards enforce access control.

### Can a citizen access admin APIs?

No. Even if they manually call the URL, backend `adminOnly` middleware checks `req.user.role` and returns 403.

### What happens when a citizen submits an issue?

React form sends data and optional image to backend. Backend verifies citizen, saves image using Multer, creates issue in MongoDB, and creates a notification.

### How does the officer see only assigned block issues?

Officer profile contains assigned block. Backend fetches only issues where `issue.block` matches officer's assigned block.

### How are notifications generated?

`issueController` calls `createNotification()` after issue creation, status update, or duplicate flag change. NotificationBell fetches and displays them.

### What is the role of Admin?

Admin has platform-wide control: all issues, all officers, citizens, analytics, and admin account creation.

### How do analytics work?

Backend uses MongoDB counts and aggregation to calculate status counts, category counts, block-wise issue counts, priority counts, monthly trends, citizens, and officers.

### How is image upload handled?

Multer stores uploaded files in `server/uploads`. The backend saves photo path in Issue model. Frontend displays image using backend static `/uploads` route.

### What are the main collections?

Users, Issues, BlockOfficers, and Notifications.

### What is the difference between frontend and backend validation?

Frontend validation gives quick feedback. Backend validation and middleware enforce real security and data correctness.

### Why sessionStorage instead of localStorage?

Session storage is tab-scoped. It helps avoid one tab's login session overwriting another role session in a different tab.

### What improvement can you add in future?

Maps integration, email/SMS notifications, officer assignment automation, real-time sockets, complaint escalation, image compression, and deployment with environment-based configuration.

## 12. One-Minute Project Explanation

"UrbanVoice is a MERN-style urban issue reporting system with three roles: citizen, block officer, and admin. A citizen can register, login, submit an issue with details and photo, and track report status. The React frontend sends requests using Axios to an Express backend. The backend authenticates users using bcrypt and JWT, protects APIs with role-based middleware, and stores data in MongoDB through Mongoose models. Officers see issues only from their assigned block and can update status or flag duplicates. Admins can view all issues, manage officers and citizens, and see analytics. Notifications keep citizens updated whenever their issue is submitted, updated, or marked duplicate."

## 13. Five-Minute Detailed Explanation

"The project begins from the React frontend. `App.jsx` defines public routes and protected role dashboards. `AuthPage.jsx` handles signup, login, forgot password, and reset password. Once a user logs in, the backend returns a JWT and user object. The frontend stores them in sessionStorage. The shared Axios instance automatically attaches the token to all API calls.

On the backend, `server.js` configures Express, CORS, cookies, JSON parsing, file uploads, static upload serving, and route groups. The authentication middleware checks the JWT from headers or cookies, verifies it using role-specific secrets, loads the user from MongoDB, and then role guards decide whether the user is citizen, officer, or admin.

For citizens, the main workflow is issue reporting. The report form collects category, priority, block, address, description, and optional image. The backend creates an Issue document and notification. Citizens can see their own reports and status updates.

For block officers, the backend finds their assigned block and returns only issues from that block. Officers update issue status from Reported to In Progress or Resolved, and can mark duplicate reports. Each important change creates a notification for the citizen.

For admins, the dashboard fetches all issues and provides management features. Admins can update/delete issues, create or manage block officers, view citizens, and see analytics. Analytics are calculated using MongoDB counts and aggregation by status, block, category, priority, and month.

The database has four main models: User, Issue, BlockOfficer, and Notification. These models connect all workflows: User identifies the role, Issue stores civic reports, BlockOfficer maps officers to blocks, and Notification stores citizen updates."

## 14. Quick File Map

Frontend:

- `client/src/App.jsx` - routes and protected role navigation
- `client/src/api/axios.js` - API base URL and token interceptor
- `client/src/pages/AuthPage.jsx` - login, signup, forgot/reset password
- `client/src/pages/citizen/CitizenDashboard.jsx` - citizen container and API calls
- `client/src/pages/citizen/ReportIssue.jsx` - issue form
- `client/src/pages/citizen/MyReports.jsx` - citizen report list
- `client/src/pages/blockofficer/OfficerDashboard.jsx` - officer container and API calls
- `client/src/pages/admin/AdminDashboard.jsx` - admin container and API calls
- `client/src/components/NotificationBell.jsx` - notification UI

Backend:

- `server/server.js` - Express app setup
- `server/config/db.js` - MongoDB connection
- `server/middleware/authMiddleware.js` - JWT and role guards
- `server/models/User.js` - users and roles
- `server/models/Issue.js` - issue data
- `server/models/BlockOfficer.js` - officer block profile
- `server/models/Notification.js` - notification records
- `server/controllers/authController.js` - login/register/token/reset
- `server/controllers/issueController.js` - issue lifecycle
- `server/controllers/adminController.js` - admin management and analytics
- `server/controllers/blockController.js` - officer block data
- `server/controllers/notificationController.js` - notification APIs

