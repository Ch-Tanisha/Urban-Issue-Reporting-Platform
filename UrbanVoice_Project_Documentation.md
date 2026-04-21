# UrbanVoice — Urban Issue Reporting Platform
## Comprehensive Project Documentation

**Version:** 1.0.0 | **Stack:** MERN (MongoDB Atlas + Express + React/Vite + Node.js)  
**Author:** Ch-Tanisha | **Date:** April 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project File Structure](#4-project-file-structure)
5. [MongoDB Atlas Setup (Step-by-Step)](#5-mongodb-atlas-setup)
6. [Environment Configuration](#6-environment-configuration)
7. [Database Models & Schemas](#7-database-models--schemas)
8. [Complete Backend API Reference](#8-complete-backend-api-reference)
9. [Authentication & Security](#9-authentication--security)
10. [Frontend Architecture](#10-frontend-architecture)
11. [How to Run the Project](#11-how-to-run-the-project)
12. [Postman Testing Guide](#12-postman-testing-guide)
13. [User Roles & Permissions Matrix](#13-user-roles--permissions-matrix)
14. [Feature Breakdown](#14-feature-breakdown)
15. [API Error Codes Table](#15-api-error-codes-table)
16. [Workflow Diagrams](#16-workflow-diagrams)

---

## 1. Project Overview

**UrbanVoice** is a full-stack MERN web application that enables citizens to report urban civic issues (potholes, garbage, broken lights, water supply problems, drainage, etc.) to their local block officers and municipal administration.

### Core Goals

- Allow **citizens** to submit issue reports with photos, location, category, and priority
- Allow **block officers** to view, manage, and update issue statuses for their assigned blocks
- Allow **admins** to oversee the entire platform, manage officers, view analytics
- Send **automatic notifications** to citizens when issue status changes

### Key Features

| Feature | Description |
|---|---|
| 🔐 JWT Authentication | Secure login/register with role-based access |
| 📝 Issue Reporting | Citizens submit issues with title, category, priority, location, photo |
| 📊 Live Analytics | Real-time stats by status, block, category, priority, monthly trend |
| 🔔 Notifications | Auto-notifications on issue submission and every status change |
| 👮 Officer Management | Admin creates/updates/deletes block officers |
| 📷 Photo Upload | Multer: JPG, PNG, WEBP — max 5MB |
| 🚩 Duplicate Flagging | Officers can flag duplicate issues |
| 📱 Responsive UI | React + Vite, mobile-friendly |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 CLIENT  (React + Vite)                   │
│  Port 5173                                               │
│  CitizenDashboard | OfficerDashboard | AdminDashboard    │
│               Axios API Layer  (JWT)                     │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP / REST
                       ▼
┌─────────────────────────────────────────────────────────┐
│            SERVER  (Node.js + Express.js)                │
│  Port 5000                                               │
│  /api/auth  /api/issues  /api/admin  /api/block          │
│  /api/notifications                                      │
│  Auth Middleware (JWT) + RBAC Middleware                 │
│  Multer (photo upload → /uploads)                        │
└──────────────────────┬──────────────────────────────────┘
                       │  Mongoose ODM
                       ▼
┌─────────────────────────────────────────────────────────┐
│           MongoDB Atlas  (Cloud Database)                │
│  Collections: users | issues | blockofficers |           │
│               notifications                              │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | React | 18.x | UI Framework |
| Frontend Build | Vite | 5.x | Dev server + bundler |
| HTTP Client | Axios | 1.x | API calls + JWT interceptor |
| Backend | Node.js | 18+ | Server runtime |
| Framework | Express.js | 5.x | REST API |
| Database | MongoDB Atlas | Cloud | NoSQL document database |
| ODM | Mongoose | 9.x | MongoDB object modeling |
| Auth | jsonwebtoken | 9.x | JWT tokens (7-day expiry) |
| Passwords | bcryptjs | 3.x | bcrypt hashing (salt=10) |
| File Upload | Multer | 2.x | Multipart photo handling |
| Dev Server | Nodemon | 3.x | Auto-restart on file change |
| Env Vars | dotenv | 17.x | `.env` loading |
| CORS | cors | 2.x | Cross-origin requests |

---

## 4. Project File Structure

```
URBAN ISSUE/
├── client/                           ← React frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js              ← Axios instance + JWT interceptor
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx          ← Login / Register
│   │   │   ├── LandingPage.jsx       ← Public landing page
│   │   │   ├── citizen/
│   │   │   │   ├── CitizenDashboard.jsx
│   │   │   │   ├── CitizenHome.jsx
│   │   │   │   ├── CitizenProfile.jsx
│   │   │   │   ├── MyReports.jsx
│   │   │   │   └── ReportIssue.jsx
│   │   │   ├── blockofficer/
│   │   │   │   ├── OfficerDashboard.jsx
│   │   │   │   ├── OfficerHome.jsx
│   │   │   │   ├── OfficerMyIssues.jsx
│   │   │   │   ├── OfficerProfile.jsx
│   │   │   │   └── OfficerAnalytics.jsx
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminHome.jsx
│   │   │       ├── AdminIssues.jsx
│   │   │       ├── AdminOfficers.jsx
│   │   │       └── AdminAnalytics.jsx
│   │   ├── App.jsx                   ← Router + role-based routing
│   │   └── main.jsx
│   └── package.json
│
├── server/                           ← Node.js + Express backend
│   ├── config/
│   │   └── db.js                     ← MongoDB Atlas connection
│   ├── controllers/
│   │   ├── authController.js         ← register, login, getMe
│   │   ├── userController.js         ← updateProfile, changePassword
│   │   ├── issueController.js        ← CRUD for issues
│   │   ├── adminController.js        ← Admin management
│   │   ├── blockController.js        ← Officer dashboard APIs
│   │   └── notificationController.js ← Notification system
│   ├── middleware/
│   │   └── authMiddleware.js         ← protect, adminOnly, officerOnly, citizenOnly
│   ├── models/
│   │   ├── User.js
│   │   ├── Issue.js
│   │   ├── BlockOfficer.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js             ← /api/auth/*
│   │   ├── issueRoutes.js            ← /api/issues/*
│   │   ├── adminRoutes.js            ← /api/admin/*
│   │   ├── blockRoutes.js            ← /api/block/*
│   │   └── notificationRoutes.js     ← /api/notifications/*
│   ├── uploads/                      ← Uploaded photos stored here
│   ├── .env                          ← Environment variables
│   └── server.js                     ← Express entry point
│
├── UrbanVoice_API.postman_collection.json  ← Import into Postman
└── .gitignore
```

---

## 5. MongoDB Atlas Setup

### Step 1 — Create a Free Account
1. Go to **https://www.mongodb.com/cloud/atlas**
2. Click **"Try Free"** → Create account
3. Choose **Free Tier (M0)** cluster

### Step 2 — Create a Cluster
1. Cloud Provider: **AWS**
2. Region: **ap-south-1 (Mumbai)** — nearest to India
3. Cluster Name: `urbanissue`
4. Click **"Create Cluster"** (takes ~3 minutes)

### Step 3 — Create a Database User
1. Go to **Security → Database Access**
2. Click **"Add New Database User"**
3. Username: `chtanisha_urbanissue`
4. Password: Your secure password
5. Role: **Atlas Admin** → Click **"Add User"**

### Step 4 — Whitelist Your IP

1. Go to **Security → Network Access**
2. Click **"Add IP Address"**
3. For development: click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
4. Click **"Confirm"**

> [!WARNING]
> For production deployment, restrict to specific server IPs only.

### Step 5 — Get Connection String
1. Go to **Clusters → Connect**
2. Choose **"Connect your application"**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy the connection string:
```
mongodb+srv://<username>:<password>@urbanissue.xxxxx.mongodb.net/urbanissue?retryWrites=true&w=majority
```

### Step 6 — Your Current .env (Already Configured)
```env
MONGO_URI=mongodb+srv://chtanisha_urbanissue:$Komal5002304@urbanissue.353lq55.mongodb.net/urbanissue?retryWrites=true&w=majority&appName=urbanissue
```

> [!NOTE]
> The database `urbanissue` is created automatically on first insert. Collections (`users`, `issues`, `blockofficers`, `notifications`) appear in Atlas after first API calls.

### Step 7 — Verify in Atlas Dashboard
- Navigate to **Collections** tab
- After making API calls you will see all 4 collections populated

---

## 6. Environment Configuration

File: `server/.env`

```env
MONGO_URI=mongodb+srv://chtanisha_urbanissue:$Komal5002304@urbanissue.353lq55.mongodb.net/urbanissue?retryWrites=true&w=majority&appName=urbanissue
JWT_SECRET=urbanvoice_super_secret_jwt_key_2024_urban_issue_platform
PORT=5000
NODE_ENV=development
```

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for signing JWT tokens — keep private |
| `PORT` | Express server port (5000) |
| `NODE_ENV` | `development` or `production` |

> [!CAUTION]
> Never commit `.env` to GitHub. It is already listed in `.gitignore`.

---

## 7. Database Models & Schemas

### 7.1 User Schema

```js
{
  name:      String  (required),
  email:     String  (required, unique, lowercase),
  password:  String  (required — bcrypt hashed),
  phone:     String,
  role:      enum['citizen','blockofficer','admin']  default:'citizen',
  age:       Number,
  gender:    String,
  address:   String,
  city:      String,
  pincode:   String,
  block:     String,
  createdAt, updatedAt   (auto timestamps)
}
```

### 7.2 Issue Schema

```js
{
  title:          String  (required),
  description:    String  (required),
  category:       enum['Road & Infrastructure','Garbage & Sanitation',
                       'Water Supply','Electricity & Lighting',
                       'Public Safety','Drainage','Other'],
  priority:       enum['High','Medium','Low']  default:'Medium',
  address:        String  (required),
  coordinates:    String,
  block:          String  (required),
  status:         enum['Reported','In Progress','Resolved']  default:'Reported',
  photo:          String  (URL: /uploads/<filename>),
  reportedBy:     ObjectId → ref: User  (required),
  citizenName:    String,
  citizenContact: String,
  citizenPhone:   String,
  isDuplicate:    Boolean  default:false,
  reportedOn:     String  (YYYY-MM-DD),
  createdAt, updatedAt
}
```

### 7.3 BlockOfficer Schema

```js
{
  name:          String  (required),
  email:         String  (required),
  phone:         String  (required),
  assignedBlock: String  (required),
  userId:        ObjectId → ref: User,
  avatar:        String  (initials e.g. "RP"),
  createdAt, updatedAt
}
```

### 7.4 Notification Schema

```js
{
  user:       ObjectId → ref: User  (required),
  message:    String  (required),
  type:       enum['status_update','new_issue','system','duplicate_flag'],
  isRead:     Boolean  default:false,
  issueId:    ObjectId → ref: Issue,
  issueTitle: String,
  createdAt, updatedAt
}
```

---

## 8. Complete Backend API Reference

**Base URL:** `http://localhost:5000`

### 8.1 Auth Routes — `/api/auth`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Public | Register user |
| POST | `/api/auth/login` | ❌ | Public | Login → get JWT |
| GET | `/api/auth/me` | ✅ | Any | Get current user |
| PUT | `/api/auth/profile` | ✅ | Any | Update own profile |
| PUT | `/api/auth/password` | ✅ | Any | Change password |

**POST /api/auth/register — Body:**
```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "password": "citizen123",
  "phone": "9876543210",
  "role": "citizen",
  "age": 28,
  "gender": "Female",
  "address": "12 Gandhi Nagar",
  "city": "Pune",
  "pincode": "411001",
  "block": "Block A"
}
```

**POST /api/auth/login — Body:**
```json
{
  "email": "priya@example.com",
  "password": "citizen123",
  "role": "citizen"
}
```

**Login — Success Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": {
    "id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Priya Sharma",
    "email": "priya@example.com",
    "role": "citizen",
    "phone": "9876543210",
    "block": "Block A",
    "city": "Pune"
  }
}
```

**PUT /api/auth/password — Body:**
```json
{
  "currentPassword": "citizen123",
  "newPassword": "newpass456"
}
```

---

### 8.2 Issue Routes — `/api/issues`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/issues/create` | ✅ | citizen | Submit issue (multipart/form-data) |
| GET | `/api/issues/my` | ✅ | citizen | My submitted issues |
| GET | `/api/issues/all` | ✅ | admin | All issues with filters |
| GET | `/api/issues/block` | ✅ | blockofficer | Block issues |
| PUT | `/api/issues/:id/status` | ✅ | officer/admin | Update status |
| PUT | `/api/issues/:id/duplicate` | ✅ | officer/admin | Toggle duplicate |
| DELETE | `/api/issues/:id` | ✅ | admin | Delete issue |

**POST /api/issues/create — Form-Data Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | text | ✅ | Min 5 chars |
| `description` | text | ✅ | Min 20 chars |
| `category` | text | ✅ | Enum value |
| `priority` | text | ✅ | High / Medium / Low |
| `address` | text | ✅ | Location |
| `coordinates` | text | ❌ | Lat, Lng string |
| `block` | text | ✅ | Block A–E |
| `citizenContact` | text | ❌ | Email or phone |
| `photo` | file | ❌ | Max 5MB, JPG/PNG/WEBP |

**GET /api/issues/all — Query Params:**
```
?block=Block A
?status=Reported|In Progress|Resolved
?category=Road & Infrastructure
?priority=High|Medium|Low
```

**PUT /api/issues/:id/status — Body:**
```json
{ "status": "In Progress" }
```

---

### 8.3 Block Officer Routes — `/api/block`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/block/profile` | ✅ | blockofficer | Officer profile |
| GET | `/api/block/issues` | ✅ | blockofficer | Block issues |
| GET | `/api/block/analytics` | ✅ | blockofficer | Block analytics |

**GET /api/block/analytics — Response:**
```json
{
  "block": "Block A",
  "total": 42,
  "statusCounts": { "reported": 15, "inProgress": 18, "resolved": 9 },
  "byCategory": [{ "_id": "Road & Infrastructure", "count": 12 }],
  "byPriority":  [{ "_id": "High", "count": 18 }]
}
```

---

### 8.4 Admin Routes — `/api/admin`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/admin/analytics` | ✅ | admin | Full platform analytics |
| GET | `/api/admin/officers` | ✅ | admin | All block officers |
| POST | `/api/admin/officers` | ✅ | admin | Create officer |
| PUT | `/api/admin/officers/:id` | ✅ | admin | Update officer |
| DELETE | `/api/admin/officers/:id` | ✅ | admin | Delete officer + user account |
| GET | `/api/admin/citizens` | ✅ | admin | All citizens |
| DELETE | `/api/admin/citizens/:id` | ✅ | admin | Delete citizen + their issues |

**POST /api/admin/officers — Body:**
```json
{
  "name": "Suresh Kumar",
  "email": "suresh@urbanvoice.com",
  "password": "officer@123",
  "phone": "9876001234",
  "assignedBlock": "Block C"
}
```

**GET /api/admin/analytics — Response:**
```json
{
  "totalIssues": 156,
  "statusCounts": { "reported": 45, "inProgress": 67, "resolved": 44 },
  "byBlock": [{ "_id": "Block A", "count": 38 }],
  "byCategory": [{ "_id": "Road & Infrastructure", "count": 52 }],
  "byPriority": [{ "_id": "High", "count": 68 }],
  "monthlyTrend": [
    { "_id": { "year": 2026, "month": 1 }, "count": 18 },
    { "_id": { "year": 2026, "month": 2 }, "count": 25 }
  ],
  "totalCitizens": 89,
  "totalOfficers": 5
}
```

---

### 8.5 Notification Routes — `/api/notifications`

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/notifications` | ✅ | Any | Get last 50 notifications |
| PUT | `/api/notifications/read-all` | ✅ | Any | Mark all as read |
| PUT | `/api/notifications/:id/read` | ✅ | Any | Mark one as read |
| DELETE | `/api/notifications/:id` | ✅ | Any | Delete notification |

**GET /api/notifications — Response:**
```json
{
  "notifications": [
    {
      "_id": "64f...",
      "message": "Your issue \"Pothole on Main Road\" has been submitted.",
      "type": "new_issue",
      "isRead": false,
      "issueTitle": "Pothole on Main Road",
      "createdAt": "2026-04-15T13:30:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

---

## 9. Authentication & Security

### JWT Token Flow
```
1. User POST /api/auth/login
2. Server validates credentials (email + bcrypt password match)
3. Server returns: { token (7d expiry), user object }
4. Client stores: localStorage.setItem('uv_token', token)
5. Every API request: Authorization: Bearer <token>  (Axios interceptor adds this)
6. Server authMiddleware.js: jwt.verify(token, JWT_SECRET) → req.user
7. On 401: Axios interceptor clears localStorage → redirects to /auth
```

### Password Security
- Passwords stored as **bcrypt hash** (never plain text)
- Salt rounds: **10**
- Comparison: `bcrypt.compare(inputPassword, storedHash)`

### RBAC Middleware
```js
protect      → any authenticated user (valid JWT)
adminOnly    → role === 'admin'
officerOnly  → role === 'blockofficer'
citizenOnly  → role === 'citizen'
```

---

## 10. Frontend Architecture

### Routing Hierarchy
```
/ ──────────────────── LandingPage (public)
/auth ──────────────── AuthPage (login/register — public)
/citizen/* ─────────── CitizenDashboard (role: citizen)
  /citizen/home
  /citizen/report
  /citizen/reports
  /citizen/profile
/officer/* ─────────── OfficerDashboard (role: blockofficer)
  /officer/home
  /officer/issues
  /officer/analytics
  /officer/profile
/admin/* ───────────── AdminDashboard (role: admin)
  /admin/home
  /admin/issues
  /admin/officers
  /admin/analytics
```

### Axios Instance (`src/api/axios.js`)
- Base URL: `http://localhost:5000`
- **Request Interceptor:** Auto-attaches `Authorization: Bearer <token>`
- **Response Interceptor:** On 401 → clears `uv_token`, `uv_user`, `uv_role` from localStorage → redirects to `/auth`

### LocalStorage Keys
| Key | Value |
|---|---|
| `uv_token` | JWT token string |
| `uv_user` | JSON stringified user object |
| `uv_role` | Role string: citizen / blockofficer / admin |

---

## 11. How to Run the Project

> [!IMPORTANT]
> Make sure MongoDB Atlas IP whitelist is set and `.env` is correctly configured before starting.

### Terminal 1 — Start Backend
```powershell
cd "C:\Users\Admin\OneDrive\Desktop\URBAN ISSUE\server"
npm run dev
```

**Expected output:**
```
[nodemon] starting `node server.js`
MongoDB Connected Successfully: urbanissue.353lq55.mongodb.net
✅ Server running on port 5000
📡 API Base: http://localhost:5000
🗄️  Database: MongoDB Atlas Connected
```

### Terminal 2 — Start Frontend
```powershell
cd "C:\Users\Admin\OneDrive\Desktop\URBAN ISSUE\client"
npm run dev
```

**Expected output:**
```
  VITE v5.x  ready in ~400ms
  ➜  Local:   http://localhost:5173/
```

### Open in Browser
```
http://localhost:5173
```

### Quick MongoDB Connection Test
```powershell
cd "C:\Users\Admin\OneDrive\Desktop\URBAN ISSUE\server"
node -e "require('dotenv').config(); const m=require('mongoose'); m.connect(process.env.MONGO_URI).then(()=>{console.log('✅ Atlas Connected!');process.exit(0)}).catch(e=>{console.error('❌',e.message);process.exit(1)})"
```

---

## 12. Postman Testing Guide

### Step 1 — Import Collection
1. Open **Postman**
2. Click **Import** (top-left)
3. Import file: `UrbanVoice_API.postman_collection.json`

### Step 2 — Create Environment
1. Click **Environments → +** (top-right)
2. Name: `UrbanVoice Local`
3. Add variables:

| Variable | Initial Value |
|---|---|
| `baseUrl` | `http://localhost:5000` |
| `token` | *(paste after login)* |

### Step 3 — Test Scenarios

#### 🔷 Scenario 1: Register & Login as Admin
1. **Auth → Register — Admin** → Send → `201`
2. Copy `token` from response → paste into `token` variable
3. **Auth → Get My Profile** → Send → `200`

#### 🔷 Scenario 2: Register & Login as Citizen
1. **Auth → Register — Citizen** → Send → `201`
2. Copy `token` → set in environment
3. **Auth → Login — Citizen** → Send → `200`

#### 🔷 Scenario 3: Submit an Issue (Citizen)
1. Login as citizen, set token
2. **Issues → Create Issue (no photo)** → Send → `201`
3. Copy `_id` from response (this is your `ISSUE_ID`)

#### 🔷 Scenario 4: Update Issue Status (Admin/Officer)
1. Login as admin, set token
2. **Issues → Update Issue Status** 
3. Replace `ISSUE_ID_HERE` in URL with the copied ID
4. Body: `{ "status": "In Progress" }` → Send → `200`

#### 🔷 Scenario 5: Check Citizen Notifications
1. Login as citizen, set token
2. **Notifications → Get My Notifications** → `200`
3. Should see 2 notifications: submitted + status changed

#### 🔷 Scenario 6: Mark Notifications as Read
1. **Notifications → Mark ALL as Read** → `200`
2. Re-run Get Notifications → `unreadCount` should be `0`

#### 🔷 Scenario 7: Admin — Create Block Officer
1. Login as admin
2. **Admin → Create Block Officer** → Send → `201`
3. Response includes both `officer` and `user` objects

#### 🔷 Scenario 8: Get Full Analytics
1. **Admin → Get Platform Analytics** → `200`
2. Verify `totalIssues`, `statusCounts`, `byBlock`, `monthlyTrend`

### Common Postman Errors

| Error | Cause | Fix |
|---|---|---|
| `401 Not authorized, no token provided` | Token missing | Set `{{token}}` env variable |
| `403 Access denied. Admin only.` | Wrong role | Login with correct role |
| `404 User not found` | Not registered | Register first |
| `400 User already exists` | Duplicate email | Use different email |
| `ECONNREFUSED` | Server not running | Run `npm run dev` in `/server` |
| `500 Internal Server Error` | Atlas connection issue | Check IP whitelist in Atlas |

---

## 13. User Roles & Permissions Matrix

| Feature | Citizen | Block Officer | Admin |
|---|---|---|---|
| Register/Login | ✅ | ✅ (login only) | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| Change password | ✅ | ✅ | ✅ |
| Submit issues | ✅ | ❌ | ❌ |
| View own issues | ✅ | ❌ | ❌ |
| View block issues | ❌ | ✅ | ✅ |
| View ALL issues | ❌ | ❌ | ✅ |
| Update issue status | ❌ | ✅ | ✅ |
| Flag duplicate | ❌ | ✅ | ✅ |
| Delete issue | ❌ | ❌ | ✅ |
| View block analytics | ❌ | ✅ | ✅ |
| View platform analytics | ❌ | ❌ | ✅ |
| Create officers | ❌ | ❌ | ✅ |
| Update officers | ❌ | ❌ | ✅ |
| Delete officers | ❌ | ❌ | ✅ |
| View all citizens | ❌ | ❌ | ✅ |
| Delete citizens | ❌ | ❌ | ✅ |
| Receive notifications | ✅ | ❌ | ✅ |

---

## 14. Feature Breakdown

### Issue Lifecycle
```
Citizen submits issue
       ↓
Status: "Reported"  ← Notification: "Issue submitted"
       ↓
Officer reviews → Status: "In Progress"
                   ← Notification: "Being worked on"
       ↓
Officer resolves → Status: "Resolved"
                   ← Notification: "Resolved ✅"
```

### Automated Notifications (5 triggers)

| Trigger | Message |
|---|---|
| Issue submitted | "Your issue \"X\" has been submitted and is pending review." |
| Status → In Progress | "Your issue \"X\" is now being worked on." |
| Status → Resolved | "Your issue \"X\" has been marked as Resolved. ✅" |
| Duplicate flagged | "Your issue \"X\" has been flagged as a duplicate." |
| Duplicate removed | "Duplicate flag removed from your issue \"X\"." |

### Photo Upload Details
- Endpoint: `POST /api/issues/create` (multipart/form-data)
- Field name: `photo`
- Accepted MIME: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Max file size: **5 MB**
- Storage path: `server/uploads/<timestamp>.<ext>`
- Public URL: `http://localhost:5000/uploads/<filename>`

---

## 15. API Error Codes Table

| HTTP Code | Meaning | Common Causes |
|---|---|---|
| `200` | OK | Successful GET / PUT / DELETE |
| `201` | Created | Successful POST (register, create issue, create officer) |
| `400` | Bad Request | Missing fields, invalid status value, duplicate email |
| `401` | Unauthorized | No token, expired token, wrong password |
| `403` | Forbidden | Valid token but wrong role |
| `404` | Not Found | User / Issue / Officer ID doesn't exist |
| `500` | Internal Server Error | DB error, Mongoose validation, unhandled exception |

---

## 16. Workflow Diagrams

### Registration Flow
```
POST /api/auth/register
         ↓
  Validate required fields
         ↓
  User.findOne({ email }) → exists? → 400 "User already exists"
         ↓
  bcrypt.genSalt(10) → bcrypt.hash(password)
         ↓
  User.create({ name, email, hashedPwd, role, ... })
         ↓
  jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn:'7d' })
         ↓
  201 → { token, user }
         ↓
  Client: localStorage.setItem('uv_token', token)
         ↓
  Redirect → /citizen | /officer | /admin
```

### Issue Submission Flow
```
Citizen fills ReportIssue form
         ↓
POST /api/issues/create (multipart/form-data)
         ↓
  protect middleware → verify JWT → attach req.user
  citizenOnly → confirm role === 'citizen'
         ↓
  Multer → process photo → save to /uploads/<timestamp>.jpg
         ↓
  Issue.create({ ...fields, photo: '/uploads/...', reportedBy: user._id })
         ↓
  createNotification(user._id, "Issue submitted...", 'new_issue')
         ↓
  201 → issue object
         ↓
  Frontend: show success → reload MyReports
```

### Status Update Flow
```
Officer/Admin clicks status change
         ↓
PUT /api/issues/:id/status { "status": "Resolved" }
         ↓
  protect → verify JWT
  role check → blockofficer OR admin
         ↓
  Issue.findById(id)
  oldStatus = issue.status
  issue.status = "Resolved"
  issue.save()
         ↓
  If oldStatus !== newStatus:
    createNotification(issue.reportedBy, "Resolved ✅", 'status_update')
         ↓
  200 → updated issue
         ↓
  Citizen sees notification on next dashboard load
```

---

## Appendix — Quick Reference

### Start Commands
```powershell
# Backend (Terminal 1)
cd "C:\Users\Admin\OneDrive\Desktop\URBAN ISSUE\server"
npm run dev

# Frontend (Terminal 2)
cd "C:\Users\Admin\OneDrive\Desktop\URBAN ISSUE\client"
npm run dev
```

### Install Dependencies (first time)
```powershell
cd server && npm install
cd ..\client && npm install
```

### All 22 API Endpoints Summary

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
PUT    /api/auth/password

POST   /api/issues/create
GET    /api/issues/my
GET    /api/issues/all
GET    /api/issues/block
PUT    /api/issues/:id/status
PUT    /api/issues/:id/duplicate
DELETE /api/issues/:id

GET    /api/block/profile
GET    /api/block/issues
GET    /api/block/analytics

GET    /api/admin/analytics
GET    /api/admin/officers
POST   /api/admin/officers
PUT    /api/admin/officers/:id
DELETE /api/admin/officers/:id
GET    /api/admin/citizens
DELETE /api/admin/citizens/:id

GET    /api/notifications
PUT    /api/notifications/read-all
PUT    /api/notifications/:id/read
DELETE /api/notifications/:id
```

---

*UrbanVoice Platform v1.0.0 — April 2026*
