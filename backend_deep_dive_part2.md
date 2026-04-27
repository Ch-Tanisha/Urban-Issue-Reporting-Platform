# UrbanVoice Backend — Complete Deep Dive (Part 2: Controllers)

## TABLE OF CONTENTS — PART 2
10. controllers/authController.js — Authentication Logic
11. controllers/issueController.js — Issue Management
12. controllers/adminController.js — Admin Operations
13. controllers/blockController.js — Block Officer Operations
14. controllers/userController.js — Profile & Password
15. controllers/notificationController.js — Notifications

---

## 10. controllers/authController.js — AUTHENTICATION LOGIC

This is the brain behind Register, Login, and "Get Current User". It handles passwords, tokens, and cookies.

### Helper Functions (Used internally, not exposed as API endpoints)

#### getRoleSecret
```javascript
const getRoleSecret = (role) => {
  switch (role) {
    case 'admin':       return process.env.JWT_SECRET_ADMIN   || process.env.JWT_SECRET;
    case 'blockofficer':return process.env.JWT_SECRET_OFFICER || process.env.JWT_SECRET;
    case 'citizen':     return process.env.JWT_SECRET_CITIZEN || process.env.JWT_SECRET;
    default:            return process.env.JWT_SECRET;
  }
};
```
Same function as in authMiddleware. Maps each role to its dedicated JWT secret. The `||` provides a fallback to the generic secret if role-specific ones aren't configured.

#### generateToken
```javascript
const generateToken = (id, role) => {
  const secret = getRoleSecret(role);
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
};
```
- **`jwt.sign({ id, role }, secret, { expiresIn: '7d' })`** — Creates a JWT token.
  - **Payload**: `{ id, role }` — The data embedded inside the token. When decoded, we can read which user this is and what role they have.
  - **Secret**: The role-specific key used to "stamp" (sign) the token.
  - **expiresIn: '7d'**: Token is valid for 7 days. After that, the user must log in again.
- The generated token looks like: `eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY2M...` — it's a Base64-encoded string with 3 parts separated by dots: header.payload.signature.

#### setAuthCookie
```javascript
const setAuthCookie = (res, token) => {
  res.cookie('uv_token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   7 * 24 * 60 * 60 * 1000
  });
};
```
- **`res.cookie('uv_token', token, options)`** — Sets a cookie named `uv_token` with the JWT as its value.
- **`httpOnly: true`** — JavaScript in the browser CANNOT read this cookie (`document.cookie` won't show it). This prevents XSS attacks from stealing the token.
- **`secure: process.env.NODE_ENV === 'production'`** — In production, only send the cookie over HTTPS. In development (HTTP), this is `false`.
- **`sameSite: 'lax'`** — The cookie is sent on normal navigation and same-site requests, but not on cross-site POST requests. Prevents CSRF attacks.
- **`path: '/'`** — Cookie is available on all URL paths.
- **`maxAge: 7 * 24 * 60 * 60 * 1000`** — Cookie expires after 7 days (in milliseconds). Matches the JWT expiry.

#### userPayload
```javascript
const userPayload = (user) => ({
  id:      user._id,
  name:    user.name,
  email:   user.email,
  role:    user.role,
  phone:   user.phone  || '',
  block:   user.block  || '',
  address: user.address || '',
  city:    user.city    || ''
});
```
- Builds a clean object to send back to the frontend. Notice it NEVER includes the password.
- **`user.phone || ''`** — If `phone` is `null` or `undefined`, default to empty string. Prevents the frontend from crashing on `null.toString()`.

---

### registerCitizen — POST /api/auth/register

```javascript
const registerCitizen = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      role, age, gender, address, city, pincode, block
    } = req.body;
```
- **`req.body`** — Contains the JSON data sent by the frontend. The destructuring `{ name, email, ... }` pulls out each field into its own variable.

```javascript
    if (role === 'admin') {
      return res.status(403).json({
        message: 'Admin accounts cannot be created through public registration.'
      });
    }
```
- **Security block**: Prevents anyone from creating an admin account through the public registration form. Admins can only be created by existing admins (via `createAdmin` in adminController).

```javascript
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: 'An account with this email already exists.'
      });
    }
```
- **Duplicate check**: Searches the database for a user with this email. `email.toLowerCase()` ensures case-insensitive matching. If found, return 400 Bad Request.

```javascript
    let userRole = 'citizen';
    if (role === 'blockofficer' || role === 'officer') {
      userRole = 'blockofficer';
    }
```
- The frontend might send `role: 'officer'` (shorter) but the database stores `'blockofficer'`. This normalizes it.

```javascript
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
```
- **Password hashing** — NEVER store plain text passwords.
  - `bcrypt.genSalt(10)` — Generates a random "salt" (random data mixed into the hash). The `10` is the cost factor — higher = slower but more secure.
  - `bcrypt.hash(password, salt)` — Combines the password + salt and runs the bcrypt algorithm. "myPassword123" becomes something like `$2a$10$xK9mPq...` (60 characters of gibberish). Even if two users have the same password, their hashes will be different because of the random salt.

```javascript
    const user = await User.create({
      name,
      email:    email.toLowerCase(),
      password: hashedPassword,
      phone:    phone    || '',
      role:     userRole,
      age:      age      || null,
      gender:   gender   || '',
      address:  address  || '',
      city:     city     || '',
      pincode:  pincode  || '',
      block:    block    || ''
    });
```
- **`User.create({...})`** — Mongoose method that creates a new document in the `users` collection and saves it to MongoDB. Returns the created document with its auto-generated `_id`.

```javascript
    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);
    res.status(201).json({ token, user: userPayload(user) });
```
- Generates a JWT, sets the auth cookie, and responds with **201 Created**.
- The response includes BOTH the token (for localStorage on the frontend) AND the user data (so the frontend can immediately display the user's name, role, etc.).

---

### loginCitizen — POST /api/auth/login/citizen

```javascript
const loginCitizen = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });
```
- Validates that both fields were sent. If not, returns 400.

```javascript
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(404).json({ message: 'No account found with this email.' });
```
- Searches the database for this email. If no user exists, returns 404.

```javascript
    if (user.role !== 'citizen') {
      const label = user.role === 'blockofficer' ? 'Block Officer' : 'Administrator';
      return res.status(403).json({
        message: `This email is registered as a ${label}. Please use the correct login option.`
      });
    }
```
- **Role enforcement**: If an officer tries to log in through the citizen login page, they get a helpful error telling them to use the correct login form. This prevents cross-role login.

```javascript
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: 'Incorrect password.' });
```
- **`bcrypt.compare()`** — Takes the plain text password the user just typed, hashes it the same way, and compares it to the stored hash. Returns `true` or `false`. We NEVER decrypt the hash — we re-hash and compare.

```javascript
    const token = generateToken(user._id, user.role);
    setAuthCookie(res, token);
    res.json({ token, user: userPayload(user) });
```
- On success: generate token, set cookie, send response. Note: `res.json()` defaults to status 200.

### loginOfficer and loginAdmin
These follow the EXACT same pattern as `loginCitizen`, but check for `role !== 'blockofficer'` and `role !== 'admin'` respectively. Same logic, different role validation.

### loginUser — Legacy Unified Login
```javascript
const loginUser = async (req, res) => {
  const { email, password, role } = req.body;
  // ... finds user, checks password ...
  if (role) {
    const frontendRole = role === 'officer' ? 'blockofficer' : role;
    if (user.role !== frontendRole) {
      return res.status(403).json({ message: `This account is registered as "${user.role}", not "${role}".` });
    }
  }
  // ... generates token, responds ...
};
```
- This is the OLD login endpoint kept for backward compatibility. It accepts an optional `role` field in the request body and validates it if provided.

### getMe — GET /api/auth/me
```javascript
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};
```
- **Protected route** — `req.user` was set by the `protect` middleware. This endpoint lets the frontend fetch the current user's data after a page refresh (when the token exists but the user data isn't in memory).
- **`.select('-password')`** — Excludes the password field from the response.

---

## 11. controllers/issueController.js — ISSUE MANAGEMENT

### createIssue — POST /api/issues/create

```javascript
const createIssue = async (req, res) => {
  try {
    const { title, description, category, priority, address, coordinates, block, citizenContact } = req.body;

    const issue = await Issue.create({
      title,
      description,
      category,
      priority: priority || 'Medium',
      address,
      coordinates: coordinates || '',
      block,
      status: 'Reported',
      photo: req.file ? `/uploads/${req.file.filename}` : '',
      reportedBy: req.user._id,
      citizenName: req.user.name,
      citizenContact: citizenContact || req.user.email,
      citizenPhone: req.user.phone || '',
      isDuplicate: false,
      reportedOn: new Date().toISOString().split('T')[0]
    });
```
- **`req.file`** — Set by Multer middleware. If a photo was uploaded, `req.file.filename` contains the generated filename (e.g., `1714153200000.jpg`). We store the path `/uploads/1714153200000.jpg`.
- **`req.user._id`** and **`req.user.name`** — Set by the `protect` middleware. We know who's creating this issue.
- **`new Date().toISOString().split('T')[0]`** — Gets today's date as "2026-04-26" (splits the ISO string at 'T' and takes the date part).

```javascript
    await createNotification(
      req.user._id,
      `Your issue "${title}" has been submitted and is pending review.`,
      'new_issue',
      issue._id,
      title
    );
    res.status(201).json(issue);
```
- After creating the issue, sends a notification to the citizen confirming submission. Then responds with 201.

### getMyIssues — GET /api/issues/my
```javascript
const getMyIssues = async (req, res) => {
  const issues = await Issue.find({ reportedBy: req.user._id })
    .sort({ createdAt: -1 });
  res.json(issues);
};
```
- **`Issue.find({ reportedBy: req.user._id })`** — Finds ALL issues where the `reportedBy` field matches the current user's ID.
- **`.sort({ createdAt: -1 })`** — Sort by creation date, newest first (`-1` = descending).

### getIssuesByBlock — GET /api/issues/block
```javascript
const getIssuesByBlock = async (req, res) => {
  const officerProfile = await BlockOfficer.findOne({ userId: req.user._id });
  let block;
  if (officerProfile) {
    block = officerProfile.assignedBlock;
  } else {
    block = req.user.block;
  }
  if (!block) {
    return res.status(400).json({ message: 'No block assigned to this officer' });
  }
  const issues = await Issue.find({ block })
    .populate('reportedBy', 'name email phone')
    .sort({ createdAt: -1 });
  res.json(issues);
};
```
- First checks the BlockOfficer profile for the assigned block. Falls back to the User model's `block` field.
- **`.populate('reportedBy', 'name email phone')`** — This is Mongoose's JOIN. Instead of returning just the ObjectId (e.g., `"reportedBy": "663abc..."`), it replaces it with the actual user data: `"reportedBy": { "name": "John", "email": "john@mail.com", "phone": "123" }`. The second argument limits which fields to include.

### updateIssueStatus — PUT /api/issues/:id/status
```javascript
const updateIssueStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Reported', 'In Progress', 'Resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status.` });
  }
  const issue = await Issue.findById(req.params.id);
  if (!issue) {
    return res.status(404).json({ message: 'Issue not found' });
  }
  const oldStatus = issue.status;
  issue.status = status;
  await issue.save();
```
- **`req.params.id`** — The `:id` from the URL `/api/issues/663abc.../status`. Express extracts URL parameters into `req.params`.
- **`issue.save()`** — Saves the modified document back to MongoDB.

```javascript
  if (oldStatus !== status && issue.reportedBy) {
    const statusMessages = {
      'In Progress': `Your issue "${issue.title}" is now being worked on.`,
      'Resolved':    `Great news! Your issue "${issue.title}" has been Resolved. ✅`,
      'Reported':    `Your issue "${issue.title}" status has been reset to Reported.`,
    };
    await createNotification(
      issue.reportedBy, statusMessages[status] || `Status changed to ${status}.`,
      'status_update', issue._id, issue.title
    );
  }
  res.json(issue);
};
```
- Only sends a notification if the status actually changed (avoids spam if someone clicks the same status twice).

### toggleDuplicate — PUT /api/issues/:id/duplicate
```javascript
const toggleDuplicate = async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  issue.isDuplicate = !issue.isDuplicate;   // flip true↔false
  await issue.save();
  // ... sends notification to citizen ...
  res.json(issue);
};
```
- **`!issue.isDuplicate`** — The `!` (NOT) operator flips the boolean. If it was `false`, it becomes `true`, and vice versa.

### getAllIssues — GET /api/issues/all (Admin only)
```javascript
const getAllIssues = async (req, res) => {
  const { block, category, status, priority } = req.query;
  const filter = {};
  if (block    && block    !== 'all') filter.block    = block;
  if (category && category !== 'all') filter.category = category;
  if (status   && status   !== 'all') filter.status   = status;
  if (priority && priority !== 'all') filter.priority = priority;
  const issues = await Issue.find(filter)
    .populate('reportedBy', 'name email phone')
    .sort({ createdAt: -1 });
  res.json(issues);
};
```
- **`req.query`** — URL query parameters. For `/api/issues/all?block=A&status=Reported`, `req.query` is `{ block: 'A', status: 'Reported' }`.
- **Dynamic filter building** — Only adds filters that were actually provided and aren't 'all'. If no filters, `filter` is `{}` which matches ALL documents.

### deleteIssue — DELETE /api/issues/:id
```javascript
const deleteIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  await Issue.findByIdAndDelete(req.params.id);
  res.json({ message: 'Issue deleted successfully' });
};
```
- Finds the issue, deletes it permanently from MongoDB.

---

## 12. controllers/adminController.js — ADMIN OPERATIONS

### getAnalytics — GET /api/admin/analytics
```javascript
const getAnalytics = async (req, res) => {
  const totalIssues = await Issue.countDocuments();
  const reported   = await Issue.countDocuments({ status: 'Reported' });
  const inProgress = await Issue.countDocuments({ status: 'In Progress' });
  const resolved   = await Issue.countDocuments({ status: 'Resolved' });
```
- **`countDocuments()`** — Returns the count of documents matching the filter. With no filter, counts all.

```javascript
  const byBlock = await Issue.aggregate([
    { $group: { _id: '$block', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
```
- **MongoDB Aggregation Pipeline** — Like SQL's GROUP BY.
  - `$group` — Groups all issues by their `block` field. `$sum: 1` counts each document.
  - `$sort` — Sorts alphabetically by block name.
  - Result: `[{ _id: "Block A", count: 15 }, { _id: "Block B", count: 8 }]`

```javascript
  const monthlyTrend = await Issue.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 }
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
```
- Gets issue counts per month for the last 6 months. Used for the trend chart on the admin dashboard.
  - `$match` filters to recent issues.
  - `$group` groups by year+month extracted from `createdAt`.

### createOfficer — POST /api/admin/officers
```javascript
const createOfficer = async (req, res) => {
  const { name, email, password, phone, assignedBlock } = req.body;
  // ... validates required fields ...
  // ... checks for duplicate email ...
  // ... hashes password ...

  // Step 1: Create a User account
  const user = await User.create({
    name, email: email.toLowerCase(), password: hashedPassword,
    phone: phone || '', role: 'blockofficer', block: assignedBlock
  });

  // Step 2: Create a BlockOfficer profile linked to that User
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const officer = await BlockOfficer.create({
    name, email: email.toLowerCase(), phone: phone || '',
    assignedBlock, userId: user._id, avatar: initials
  });

  res.status(201).json({ officer, user: { id: user._id, name: user.name, ... } });
};
```
- Creates TWO records: a User (for authentication) and a BlockOfficer (for profile data).
- **Initials generation**: `"John Doe".split(' ')` → `["John", "Doe"]`, `.map(w => w[0])` → `["J", "D"]`, `.join('')` → `"JD"`, `.toUpperCase()` (already upper), `.slice(0, 2)` → `"JD"`.

### updateOfficer — PUT /api/admin/officers/:id
```javascript
const updateOfficer = async (req, res) => {
  const officer = await BlockOfficer.findById(req.params.id);
  if (name) officer.name = name;
  // ... updates other fields ...
  await officer.save();

  // Also update the linked User record
  if (officer.userId) {
    await User.findByIdAndUpdate(officer.userId, userUpdate);
  }
};
```
- Updates BOTH the BlockOfficer profile AND the linked User account to keep them in sync.

### deleteOfficer — DELETE /api/admin/officers/:id
```javascript
const deleteOfficer = async (req, res) => {
  const officer = await BlockOfficer.findById(req.params.id);
  if (officer.userId) {
    await User.findByIdAndDelete(officer.userId);  // Delete User account
  }
  await BlockOfficer.findByIdAndDelete(req.params.id);  // Delete Officer profile
};
```
- Deletes both records. If you only delete the BlockOfficer profile, the User account would still exist (orphaned data).

### deleteCitizen — DELETE /api/admin/citizens/:id
```javascript
const deleteCitizen = async (req, res) => {
  const citizen = await User.findById(req.params.id);
  if (!citizen || citizen.role !== 'citizen') {
    return res.status(404).json({ message: 'Citizen not found' });
  }
  await Issue.deleteMany({ reportedBy: citizen._id });  // Delete all their issues
  await User.findByIdAndDelete(req.params.id);           // Delete user account
};
```
- **Cascade delete**: When deleting a citizen, also deletes ALL issues they reported. Otherwise you'd have orphaned issues pointing to a non-existent user.

### seedAdmin — POST /api/admin/seed-admin
```javascript
const seedAdmin = async (req, res) => {
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    return res.status(403).json({ message: 'An administrator account already exists. Seeding is disabled.' });
  }
  // ... creates admin account ...
};
```
- **One-time use endpoint**: Creates the very first admin account. Since admin registration is blocked publicly, you need this to bootstrap the system. Once an admin exists, this endpoint locks itself permanently.

---

## 13. controllers/blockController.js — BLOCK OFFICER OPERATIONS

### getOfficerProfile — GET /api/block/profile
```javascript
const getOfficerProfile = async (req, res) => {
  const profile = await BlockOfficer.findOne({ userId: req.user._id });
  if (!profile) {
    return res.json({
      name: req.user.name, email: req.user.email,
      phone: req.user.phone || '', assignedBlock: req.user.block || '',
      avatar: req.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    });
  }
  res.json(profile);
};
```
- Tries to find the officer's dedicated BlockOfficer profile. If it doesn't exist (edge case), falls back to basic User model data.

### getBlockAnalytics — GET /api/block/analytics
```javascript
const getBlockAnalytics = async (req, res) => {
  // ... determines officer's block ...
  const total      = await Issue.countDocuments({ block });
  const reported   = await Issue.countDocuments({ block, status: 'Reported' });
  const inProgress = await Issue.countDocuments({ block, status: 'In Progress' });
  const resolved   = await Issue.countDocuments({ block, status: 'Resolved' });
  const byCategory = await Issue.aggregate([ /* groups by category for this block */ ]);
  const byPriority = await Issue.aggregate([ /* groups by priority for this block */ ]);
  res.json({ block, total, statusCounts: { reported, inProgress, resolved }, byCategory, byPriority });
};
```
- Same concept as admin analytics, but filtered to ONE specific block.

---

## 14. controllers/userController.js — PROFILE & PASSWORD

### updateProfile — PUT /api/auth/profile
```javascript
const updateProfile = async (req, res) => {
  const { name, phone, address, city, pincode, block, age, gender } = req.body;
  const user = await User.findById(req.user._id);
  if (name)    user.name    = name.trim();
  if (phone)   user.phone   = phone.trim();
  // ... updates other fields ...
  const updated = await user.save();
  res.json({ id: updated._id, name: updated.name, ... });
};
```
- **Partial update pattern**: Only updates fields that were actually sent in the request. If the frontend only sends `{ name: "New Name" }`, only `name` changes.
- **`.trim()`** — Removes whitespace from both ends of the string.

### changePassword — PUT /api/auth/password
```javascript
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  const user = await User.findById(req.user._id);
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();
  res.json({ message: 'Password changed successfully' });
};
```
- Requires the current password for security (prevents someone who steals your laptop from changing your password).
- Validates minimum length, verifies current password, then hashes and saves the new one.

---

## 15. controllers/notificationController.js — NOTIFICATIONS

### createNotification (Internal Helper)
```javascript
const createNotification = async (userId, message, type = 'system', issueId = null, issueTitle = '') => {
  try {
    await Notification.create({ user: userId, message, type, issueId, issueTitle });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};
```
- NOT an API endpoint — called internally by other controllers (issueController calls this when status changes).
- **Default parameters**: `type = 'system'` means if no type is provided, it defaults to 'system'.
- Wrapped in try/catch so a notification failure doesn't crash the parent operation.

### getMyNotifications — GET /api/notifications
```javascript
const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ notifications, unreadCount });
};
```
- Gets the latest 50 notifications for the logged-in user, newest first.
- Also counts unread notifications (for the badge number on the bell icon).

### markAsRead — PUT /api/notifications/:id/read
```javascript
const markAsRead = async (req, res) => {
  const notif = await Notification.findOne({ _id: req.params.id, user: req.user._id });
```
- **Security**: `{ _id: req.params.id, user: req.user._id }` — Finds the notification ONLY if it belongs to the current user. This prevents User A from marking User B's notifications as read.

### markAllRead — PUT /api/notifications/read-all
```javascript
const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
};
```
- **`updateMany`** — Updates ALL matching documents in one database operation.

---

**End of Part 2 — Continue to Part 3 for Routes and Complete Data Flow.**
