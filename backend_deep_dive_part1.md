# UrbanVoice Backend — Complete Deep Dive (Part 1)

## TABLE OF CONTENTS — PART 1
1. What is a Backend?
2. Project Folder Structure
3. package.json — The Project's Identity Card
4. .env — Secret Configuration
5. nodemon.json — Auto-Restart Config
6. server.js — The Main Entry Point (Heart of the Backend)
7. config/db.js — Database Connection
8. Models (Database Blueprints)
   - User.js
   - BlockOfficer.js
   - Issue.js
   - Notification.js
9. middleware/authMiddleware.js — The Security Guard

---

## 1. WHAT IS A BACKEND?

Think of a restaurant:
- The **frontend** (React) is the dining area — what customers (users) see
- The **backend** (Node.js/Express) is the kitchen — where food (data) is prepared
- The **database** (MongoDB) is the pantry — where ingredients (data) are stored

When a user clicks "Submit Issue" on the website, a **request** travels from the frontend to the backend. The backend processes it, saves data to the database, and sends a **response** back.

---

## 2. PROJECT FOLDER STRUCTURE

```
server/
├── .env                      ← Secret passwords and config (NEVER shared publicly)
├── package.json              ← Lists all dependencies and scripts
├── nodemon.json              ← Auto-restart configuration for development
├── server.js                 ← THE MAIN FILE — starts everything
├── config/
│   └── db.js                 ← Connects to MongoDB Atlas (cloud database)
├── models/                   ← Database blueprints (what data looks like)
│   ├── User.js               ← Blueprint for user accounts
│   ├── BlockOfficer.js       ← Blueprint for officer profiles
│   ├── Issue.js              ← Blueprint for reported issues
│   └── Notification.js       ← Blueprint for notifications
├── middleware/
│   └── authMiddleware.js     ← Security guard — checks JWT tokens
├── controllers/              ← Business logic (what happens when a request arrives)
│   ├── authController.js     ← Register, Login, Get current user
│   ├── issueController.js    ← Create/Read/Update/Delete issues
│   ├── adminController.js    ← Admin-only operations
│   ├── blockController.js    ← Block Officer operations
│   ├── userController.js     ← Profile update, password change
│   └── notificationController.js ← Notification CRUD
├── routes/                   ← URL mapping — which URL triggers which controller
│   ├── authRoutes.js         ← /api/auth/* URLs
│   ├── issueRoutes.js        ← /api/issues/* URLs
│   ├── adminRoutes.js        ← /api/admin/* URLs
│   ├── blockRoutes.js        ← /api/block/* URLs
│   └── notificationRoutes.js ← /api/notifications/* URLs
└── uploads/                  ← Folder where uploaded issue photos are saved
```

**The flow**: User hits a URL → Route matches it → Middleware checks permission → Controller runs logic → Model talks to database → Response sent back.

---

## 3. package.json — THE PROJECT'S IDENTITY CARD

```json
{
  "name": "server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^17.4.1",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "mongoose": "^9.4.1",
    "multer": "^2.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

### Line-by-Line:
- **"name": "server"** — The project name. Just a label.
- **"version": "1.0.0"** — Version number of your app.
- **"main": "server.js"** — Tells Node.js: "When someone runs this project, start with server.js."
- **"scripts"** — Shortcuts you type in the terminal:
  - `npm start` → runs `node server.js` (production mode, no auto-restart)
  - `npm run dev` → runs `nodemon server.js` (development mode, auto-restarts when you change code)
- **"dependencies"** — Libraries your app NEEDS to run:
  - **express** — The web framework. It creates the server, handles URLs, sends responses.
  - **mongoose** — Talks to MongoDB. Lets you define schemas and query the database.
  - **bcryptjs** — Hashes passwords. Turns "myPassword123" into an unreadable scramble so even if someone steals the database, they can't read passwords.
  - **jsonwebtoken (JWT)** — Creates login tokens. After you log in, the server gives you a token (like a wristband at a concert) that proves you're authenticated.
  - **dotenv** — Reads the `.env` file and loads secrets into `process.env`.
  - **cors* * — Allows the React frontend (port 5173) to talk to the backend (port 5000). Browsers block cross-origin requests by default.
  - **cookie-parser** — Reads cookies from incoming requests. Used for the httpOnly auth cookie.
  - **multer** — Handles file uploads (issue photos).
- **"devDependencies"** — Only needed during development:
  - **nodemon** — Watches your files. When you save a change, it auto-restarts the server.

---

## 4. .env — SECRET CONFIGURATION

```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/urbanissue...
JWT_SECRET=urbanvoice_super_secret_jwt_key_2024_urban_issue_platform
JWT_SECRET_CITIZEN=uv_citizen_secret_xK9#mP2024_platform_citizen_auth
JWT_SECRET_OFFICER=uv_officer_secret_zQ7@nR2024_platform_officer_auth
JWT_SECRET_ADMIN=uv_admin_secret_wL5!sT2024_platform_admin_auth
COOKIE_SECRET=uv_cookie_secret_hJ3^vY2024_platform_sessions
PORT=5000
NODE_ENV=development
```

### What each variable does:
- **MONGO_URI** — The full connection string to your MongoDB Atlas cloud database. Contains username, password, cluster address, and database name.
- **JWT_SECRET** — The legacy/fallback secret key used to sign JWT tokens. Think of it as the master stamp that makes tokens unforgeable.
- **JWT_SECRET_CITIZEN / OFFICER / ADMIN** — Role-specific secrets. Each role gets its own secret, so a citizen's token can't be used to impersonate an admin. This is a security best practice.
- **COOKIE_SECRET** — Used by cookie-parser to sign cookies, preventing tampering.
- **PORT** — The server listens on port 5000.
- **NODE_ENV** — "development" or "production". Controls things like whether cookies require HTTPS.

> **Why .env?** These values are sensitive. The `.gitignore` file ensures `.env` is NEVER uploaded to GitHub. Each team member creates their own `.env` locally.

---

## 5. nodemon.json — AUTO-RESTART CONFIG

```json
{
  "watch": ["**/*.js"],
  "ext": "js,json",
  "ignore": ["uploads/*", "node_modules/*"],
  "delay": 500,
  "env": {
    "NODE_ENV": "development"
  }
}
```

- **"watch": ["**/*.js"]** — Watch ALL `.js` files in all subdirectories.
- **"ext": "js,json"** — Also restart when `.json` files change.
- **"ignore"** — DON'T restart when files in `uploads/` or `node_modules/` change.
- **"delay": 500** — Wait 500ms after a file change before restarting (prevents rapid restarts).
- **"env"** — Sets `NODE_ENV=development` automatically.

---

## 6. server.js — THE MAIN ENTRY POINT

This is the heart of your backend. When you run `npm run dev`, this file executes.

```javascript
const express = require('express');
```
**What it does:** Imports the Express library. Express is a framework that simplifies creating a web server in Node.js. Without it, you'd write hundreds of lines of raw HTTP code.

```javascript
const cors = require('cors');
```
**What it does:** Imports the CORS (Cross-Origin Resource Sharing) library. Your React app runs on `localhost:5173` and the backend on `localhost:5000`. Browsers block requests between different origins by default. CORS tells the browser: "It's okay, let port 5173 talk to port 5000."

```javascript
const dotenv = require('dotenv');
```
**What it does:** Imports dotenv, which reads your `.env` file and makes its values available as `process.env.VARIABLE_NAME`.

```javascript
const path = require('path');
```
**What it does:** A built-in Node.js module for working with file paths. Used to construct the path to the `uploads` folder regardless of operating system.

```javascript
const multer = require('multer');
```
**What it does:** Imports Multer, a middleware for handling `multipart/form-data` — the format used when browsers send file uploads.

```javascript
const cookieParser = require('cookie-parser');
```
**What it does:** Imports cookie-parser. It reads cookies from the incoming HTTP request headers and puts them in `req.cookies` so your code can easily access them.

```javascript
const connectDB = require('./config/db');
```
**What it does:** Imports the database connection function from `config/db.js`. This function will connect to MongoDB Atlas.

```javascript
dotenv.config();
```
**What it does:** Reads the `.env` file RIGHT NOW and loads all variables into `process.env`. This MUST come before any code that reads `process.env`.

```javascript
const app = express();
```
**What it does:** Creates an Express application instance. Think of `app` as your server object. You attach everything (routes, middleware, settings) to this object.

### Multer Setup (File Upload Configuration)

```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
```
- **`multer.diskStorage({...})`** — Tells Multer to save files to disk (not memory).
- **`destination`** — Where to save files. `__dirname` is the current directory (server/), so files go to `server/uploads/`.
- **`filename`** — How to name files. `Date.now()` gives the current timestamp in milliseconds (e.g., `1714153200000`), and `path.extname()` gets the extension (e.g., `.jpg`). Result: `1714153200000.jpg`. This prevents filename conflicts.
- **`cb`** — Callback function. `cb(null, value)` means "no error, here's the value."

```javascript
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed'), false);
  }
};
```
- **Security check** — Only allows image files. If someone tries to upload a `.exe` or `.pdf`, it rejects with an error. `file.mimetype` is the file type reported by the browser.

```javascript
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});
```
- Creates the Multer instance with our storage config, file filter, and a **5MB size limit** (5 × 1024 × 1024 bytes).

```javascript
app.set('upload', upload);
```
- Stores the `upload` middleware on the app object so route files can access it via `req.app.get('upload')`.

### Core Middleware

```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```
- **`app.use()`** — Registers middleware that runs on EVERY request.
- **`origin: 'http://localhost:5173'`** — Only allow requests from the React dev server.
- **`credentials: true`** — Allow cookies to be sent cross-origin. Without this, the browser won't include cookies in requests to port 5000.

```javascript
app.use(cookieParser(process.env.COOKIE_SECRET));
```
- Parses cookies from every incoming request. The `COOKIE_SECRET` is used to verify signed cookies haven't been tampered with. Must come BEFORE routes.

```javascript
app.use(express.json());
```
- Parses incoming JSON request bodies. When the frontend sends `{ "email": "test@mail.com" }`, this middleware converts it from raw text into a JavaScript object accessible via `req.body`.

```javascript
app.use(express.urlencoded({ extended: true }));
```
- Parses URL-encoded form data (like traditional HTML forms). `extended: true` allows nested objects.

```javascript
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```
- Serves files from the `uploads/` folder as static files. If a photo is saved as `uploads/1714153200000.jpg`, it becomes accessible at `http://localhost:5000/uploads/1714153200000.jpg`.

### Route Registration

```javascript
app.use('/api/auth',          authRoutes);
app.use('/api/issues',        issueRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/block',         blockRoutes);
app.use('/api/notifications', notificationRoutes);
```
- **URL prefixing**: When a request arrives at `/api/auth/login`, Express strips `/api/auth` and sends `/login` to `authRoutes`. The route file then matches `/login` to the correct controller function.

### Health Check

```javascript
app.get('/', (req, res) => {
  res.json({ message: 'Urban Issue Reporting Platform API Running', ... });
});
```
- When you visit `http://localhost:5000/` in a browser, you get a JSON response confirming the API is running. Useful for quick testing.

### Global Error Handler

```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});
```
- A special middleware with **4 parameters** (Express recognizes this as an error handler). If any middleware or route throws an error, it lands here. Logs the error and sends a clean JSON error response.

### Server Startup

```javascript
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to connect to database:', err.message);
  process.exit(1);
});
```
- First connects to MongoDB. If successful, starts listening on port 5000. If the database connection fails, prints the error and exits the process (code 1 = error).

---

## 7. config/db.js — DATABASE CONNECTION

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

### Line-by-Line:
- **`const mongoose = require('mongoose')`** — Imports Mongoose, the ODM (Object Data Modeling) library for MongoDB.
- **`async () => {}`** — An async function, because database operations take time (they go over the network to MongoDB Atlas).
- **`await mongoose.connect(process.env.MONGO_URI)`** — Connects to MongoDB using the connection string from `.env`. `await` pauses execution until the connection is established.
- **`conn.connection.host`** — Logs which server we connected to (e.g., `cluster0.abc123.mongodb.net`).
- **`process.exit(1)`** — If connection fails, kill the server. There's no point running if we can't reach the database.
- **`module.exports = connectDB`** — Exports the function so `server.js` can import and call it.

---

## 8. MODELS — DATABASE BLUEPRINTS

Models define the **shape** of your data. Think of them as templates. Just like a form has fields (Name, Email, Phone), a model defines what fields each database record has.

### 8.1 models/User.js

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  phone:   { type: String, default: '' },
  role: {
    type: String,
    enum: ['citizen', 'blockofficer', 'admin'],
    default: 'citizen'
  },
  age:     { type: Number },
  gender:  { type: String },
  address: { type: String },
  city:    { type: String },
  pincode: { type: String },
  block:   { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
```

#### Every field explained:
- **name** — `type: String` means it must be text. `required: [true, 'Name is required']` means if you try to create a user without a name, MongoDB will reject it and show the error message. `trim: true` removes leading/trailing spaces.
- **email** — `unique: true` means no two users can have the same email (MongoDB creates an index to enforce this). `lowercase: true` auto-converts "John@Gmail.COM" to "john@gmail.com".
- **password** — Stored as a hashed string (bcrypt hash), NEVER plain text.
- **phone** — `default: ''` means if not provided, it saves as an empty string.
- **role** — `enum: [...]` restricts the value to ONLY these three options. If you try to save `role: 'superuser'`, MongoDB rejects it. `default: 'citizen'` means new users are citizens unless specified otherwise.
- **age, gender, address, city, pincode, block** — Optional profile fields.
- **`timestamps: true`** — Automatically adds `createdAt` and `updatedAt` fields to every record.
- **`mongoose.model('User', userSchema)`** — Creates a model named 'User'. MongoDB will store these in a collection called `users` (lowercase, pluralized automatically).

### 8.2 models/BlockOfficer.js

```javascript
const blockOfficerSchema = new mongoose.Schema({
  name:          { type: String, required: [true, 'Name is required'] },
  email:         { type: String, required: [true, 'Email is required'] },
  phone:         { type: String, required: [true, 'Phone is required'] },
  assignedBlock: { type: String, required: [true, 'Assigned block is required'] },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  avatar: { type: String, default: '' }
}, { timestamps: true });
```

#### Why a separate model?
Officers are ALSO Users (they have a User account for login). But they need extra info like `assignedBlock`. This model is their "profile card".

- **userId** — `mongoose.Schema.Types.ObjectId` is a special MongoDB ID type. `ref: 'User'` creates a **relationship** — it says "this field points to a record in the Users collection." This lets you use `.populate()` to fetch the linked User data.
- **assignedBlock** — Which geographic block this officer manages (e.g., "Block A").
- **avatar** — Stores the officer's initials (e.g., "JD" for John Doe).

### 8.3 models/Issue.js

```javascript
const issueSchema = new mongoose.Schema({
  title:       { type: String, required: [true, 'Title is required'], trim: true },
  description: { type: String, required: [true, 'Description is required'] },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Road & Infrastructure', 'Garbage & Sanitation', 'Water Supply',
           'Electricity & Lighting', 'Public Safety', 'Drainage', 'Other']
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  address:     { type: String, required: [true, 'Address is required'] },
  coordinates: { type: String, default: '' },
  block:       { type: String, required: [true, 'Block is required'] },
  status: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved'],
    default: 'Reported'
  },
  photo: { type: String, default: '' },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  citizenName:    { type: String },
  citizenContact: { type: String },
  citizenPhone:   { type: String },
  isDuplicate:    { type: Boolean, default: false },
  reportedOn:     { type: String }
}, { timestamps: true });
```

#### Key fields:
- **category** — Uses `enum` to restrict to 7 predefined categories. The frontend dropdown must match these exact strings.
- **status** — The lifecycle: `Reported` → `In Progress` → `Resolved`. Officers/admins change this.
- **photo** — Stores the file path (e.g., `/uploads/1714153200000.jpg`), not the actual image.
- **reportedBy** — Links to the User who created the issue. `ref: 'User'` enables `.populate()`.
- **isDuplicate** — A flag officers can toggle if an issue is a duplicate.
- **reportedOn** — A human-readable date string (e.g., "2026-04-26").

### 8.4 models/Notification.js

```javascript
const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message:    { type: String, required: true },
  type: {
    type: String,
    enum: ['status_update', 'new_issue', 'system', 'duplicate_flag'],
    default: 'system'
  },
  isRead:     { type: Boolean, default: false },
  issueId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
  issueTitle: { type: String, default: '' }
}, { timestamps: true });
```

- **user** — Which user this notification belongs to.
- **type** — Categories the notification: status updates, new issues, system messages, or duplicate flags.
- **isRead** — `false` by default. When the user reads it, it flips to `true`.
- **issueId** — Links to the related issue (so the frontend can link to it).

---

## 9. middleware/authMiddleware.js — THE SECURITY GUARD

This file is the most critical security component. It sits between the route and the controller, checking if the user is who they claim to be.

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');
```
- Imports JWT library and the User model.

### getRoleSecret — Role-to-Secret Mapping

```javascript
const getRoleSecret = (role) => {
  switch (role) {
    case 'admin':        return process.env.JWT_SECRET_ADMIN   || process.env.JWT_SECRET;
    case 'blockofficer': return process.env.JWT_SECRET_OFFICER || process.env.JWT_SECRET;
    case 'citizen':      return process.env.JWT_SECRET_CITIZEN || process.env.JWT_SECRET;
    default:             return process.env.JWT_SECRET;
  }
};
```
- **Purpose**: Each role has its own secret key. A token signed with the citizen secret can ONLY be verified with the citizen secret. This prevents cross-role token abuse.
- **`|| process.env.JWT_SECRET`** — Fallback: if the role-specific secret isn't set in `.env`, use the legacy secret.

### protect — The Main Authentication Check

```javascript
const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback: check httpOnly cookie
  else if (req.cookies && req.cookies.uv_token) {
    token = req.cookies.uv_token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized — no token provided.' });
  }
```

**Step 1: Find the token.** The frontend sends the JWT in one of two ways:
- **Authorization header**: `Authorization: Bearer eyJhbGciOiJI...` — The `split(' ')[1]` grabs everything after "Bearer ".
- **Cookie**: A cookie named `uv_token` set during login.

If neither exists → 401 Unauthorized.

```javascript
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Not authorized — malformed token.' });
    }

    const secret = getRoleSecret(decoded.role);
    const verified = jwt.verify(token, secret);

    req.user = await User.findById(verified.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized — user no longer exists.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized — token invalid or expired.' });
  }
};
```

**Step 2: Decode without verifying** — `jwt.decode()` reads the token's payload WITHOUT checking if it's genuine. We need to peek at the `role` field first to know WHICH secret to use for verification.

**Step 3: Verify with the correct secret** — `jwt.verify()` checks: (a) was this token signed with this exact secret? (b) has it expired? If either fails, it throws an error caught by the `catch` block.

**Step 4: Load the user from database** — `User.findById(verified.id)` fetches the user record. `.select('-password')` excludes the password hash from the result (security measure).

**Step 5: Attach to request** — `req.user = ...` makes the user data available to ALL subsequent middleware and controller functions in the chain.

**Step 6: `next()`** — Passes control to the next middleware or the controller function.

### Role Guards

```javascript
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Access denied. Administrators only.' });
};

const officerOnly = (req, res, next) => {
  if (req.user && req.user.role === 'blockofficer') return next();
  return res.status(403).json({ message: 'Access denied. Block Officers only.' });
};

const citizenOnly = (req, res, next) => {
  if (req.user && req.user.role === 'citizen') return next();
  return res.status(403).json({ message: 'Access denied. Citizens only.' });
};
```

These run AFTER `protect`. By this point, `req.user` is already set. They simply check the role:
- **403 Forbidden** — "You're logged in, but you don't have permission for THIS action."
- **401 Unauthorized** — "You're not logged in at all."

### How middleware chains work:
```
router.get('/analytics', protect, adminOnly, getAnalytics);
```
1. `protect` runs first → checks token → sets `req.user`
2. `adminOnly` runs second → checks if `req.user.role === 'admin'`
3. `getAnalytics` runs last → the actual business logic

If step 1 or 2 fails, the chain STOPS and an error response is sent.

---

**End of Part 1 — Continue to Part 2 for Controllers, Routes, and Data Flow.**
