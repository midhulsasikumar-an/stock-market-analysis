# TradeTrack - Register Page Implementation Guide
## Stock Market Analysis System | Developed by Midhul Sasikumar | Reg No: 24122018

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Installation & Setup](#installation--setup)
4. [Configuration](#configuration)
5. [Frontend Implementation](#frontend-implementation)
6. [Backend Implementation](#backend-implementation)
7. [Google OAuth Setup](#google-oauth-setup)
8. [API Endpoints](#api-endpoints)
9. [Environment Variables](#environment-variables)
10. [Security Best Practices](#security-best-practices)
11. [Troubleshooting](#troubleshooting)

---

## 📱 Overview

The Register page has been completely redesigned with a modern, premium stock trading dashboard theme. It features:

- **Modern UI**: Glassmorphism design with gradient backgrounds
- **Professional Theme**: Dark trading theme suitable for financial applications
- **Robust Authentication**: Email/password and Google OAuth 2.0
- **Real-time Validation**: Inline form validation with helpful error messages
- **Responsive Design**: Fully responsive on mobile, tablet, and desktop
- **JWT Security**: Secure token-based authentication
- **User Management**: Complete user profile management system

---

## ✨ Features

### UI/Design Features
- ✅ Dark professional trading theme
- ✅ Gradient background with animated blobs
- ✅ Glassmorphism card design
- ✅ Subtle glow effects
- ✅ Password strength indicator
- ✅ Show/hide password toggle
- ✅ Smooth animations and transitions
- ✅ Professional footer with project information

### Authentication Features
- ✅ Email/Password registration
- ✅ Email/Password login
- ✅ Google OAuth 2.0 integration
- ✅ JWT token management
- ✅ Account locking after failed attempts
- ✅ Email verification support
- ✅ Password reset capability
- ✅ Two-factor authentication ready

### Validation Features
- ✅ Real-time email validation
- ✅ Password strength requirement (8+ chars, uppercase, number, symbol)
- ✅ Password confirmation matching
- ✅ Custom error messages
- ✅ Success indicators

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Google OAuth credentials
- npm or yarn

### Backend Setup

1. **Navigate to Backend Directory**
```bash
cd Backend_
```

2. **Install Dependencies**
```bash
npm install
```

3. **Create .env File**
Copy `.env.example` to `.env` and update with your values:
```bash
cp .env.example .env
```

4. **Update .env with Your Configuration**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/TradeTrack_DB
JWT_SECRET=your-32-character-secret-key-minimum
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

5. **Start MongoDB**
```bash
# On Windows using MongoDB Community Edition
mongod

# Or using MongoDB Atlas (cloud)
# Update MONGODB_URI in .env
```

6. **Start Backend Server**
```bash
# Development with auto-reload
npm run dev

# Or production
npm start
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to Frontend Directory**
```bash
cd ../
```

2. **Update .env File**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
REACT_APP_FINNHUB_API_KEY=your-finnhub-api-key
```

3. **Install Dependencies**
```bash
npm install
```

4. **Start Development Server**
```bash
npm start
```

Frontend will run on `http://localhost:3000`

---

## ⚙️ Configuration

### Database Configuration

#### MongoDB Local Setup
1. Install MongoDB Community Edition
2. Start MongoDB service
3. Update `MONGODB_URI` in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/TradeTrack_DB
```

#### MongoDB Atlas (Cloud) Setup
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/TradeTrack_DB
```

### API Configuration

**Frontend API URL** (.env):
```env
REACT_APP_API_URL=http://localhost:5000
```

**CORS Configuration** (Backend):
Update `server.js` if needed:
```javascript
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true
}));
```

---

## 🎨 Frontend Implementation

### Register Component Structure

The `Register.js` component includes:

1. **State Management**
   - Form data (email, password, confirmPassword)
   - Error tracking
   - Loading states
   - Success messages

2. **Validation Logic**
   - Email format validation
   - Password strength requirements
   - Password matching validation

3. **Form Submission**
   - API call to `/api/auth/register`
   - Token storage
   - User redirect

4. **Google OAuth Integration**
   - Google Sign-In button
   - Token verification
   - User creation/update

### Component Usage

Register page is already integrated. To use in your app:

```jsx
import Register from './components/Register';

<Register />
```

### Styling

The `Register.css` file provides:
- CSS variables for consistent theming
- Animation keyframes
- Responsive breakpoints
- Glassmorphism effects
- Gradient backgrounds
- Focus states for accessibility

---

## 👥 Backend Implementation

### User Model

Located in `Backend_/models/User.js`:

**Schema Fields:**
- `email` (unique, required)
- `password` (hashed with bcrypt)
- `firstName`, `lastName`
- `googleId` (for OAuth)
- `profileImage`
- `registrationSource` (email or google)
- `emailVerified`
- `accountStatus`
- `lastLogin`
- `loginAttempts`, `lockUntil`
- `preferences` (theme, notifications, 2FA)
- Timestamps (createdAt, updatedAt)

**Methods:**
- `comparePassword()` - Verify password hash
- `isAccountLocked()` - Check account lock status
- `incLoginAttempts()` - Increment failed login attempts
- `resetLoginAttempts()` - Reset on successful login

### Authentication Routes

Located in `Backend_/routes/auth.js`:

#### POST `/api/auth/register`
Register new user with email and password.

**Request:**
```json
{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "registrationSource": "email"
}
```

**Response:**
```json
{
    "success": true,
    "message": "User registered successfully",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "_id": "user_id",
        "email": "user@example.com",
        "firstName": null,
        "emailVerified": false
    }
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
    "email": "user@example.com",
    "password": "SecurePass123!"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... }
}
```

#### POST `/api/auth/google`
Authenticate via Google OAuth.

**Request:**
```json
{
    "token": "google_id_token"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Google authentication successful",
    "token": "jwt_token",
    "user": { ... },
    "isNewUser": true
}
```

#### GET `/api/auth/profile`
Get current user profile.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
    "success": true,
    "user": { ... }
}
```

#### PUT `/api/auth/profile`
Update user profile.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request:**
```json
{
    "firstName": "John",
    "lastName": "Doe",
    "preferences": {
        "theme": "dark",
        "notifications": true
    }
}
```

---

## 🔐 Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:5000`
   - Your production domain
7. Add authorized redirect URIs:
   - `http://localhost:3000/login`
   - Your production redirect URIs

### Step 2: Get Credentials

Save your:
- Client ID: `YOUR_GOOGLE_CLIENT_ID`
- Client Secret: `YOUR_GOOGLE_CLIENT_SECRET`

### Step 3: Update Environment Files

**Frontend .env:**
```env
REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
```

**Backend .env:**
```env
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

### Step 4: Test Google OAuth

1. Start both backend and frontend
2. Navigate to Register page
3. Click "Continue with Google"
4. Sign in with your Google account
5. Check that user is created in MongoDB

---

## 🔌 API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| POST | `/api/auth/register` | No | Register with email |
| POST | `/api/auth/login` | No | Login with email |
| POST | `/api/auth/google` | No | Google OAuth |
| POST | `/api/auth/verify-token` | Yes | Verify JWT token |
| GET | `/api/auth/profile` | Yes | Get user profile |
| PUT | `/api/auth/profile` | Yes | Update profile |
| POST | `/api/auth/logout` | Yes | Logout |

### Status Codes

- `200` - Success
- `201` - Created (registration)
- `400` - Bad request
- `401` - Unauthorized
- `409` - Conflict (user exists)
- `423` - Account locked
- `500` - Server error

---

## 🔑 Environment Variables

### Frontend (.env)

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Stock Market APIs
REACT_APP_FINNHUB_API_KEY=your-finnhub-key

# Environment
REACT_APP_ENV=development
```

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/TradeTrack_DB

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Application
APP_NAME=TradeTrack
APP_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

---

## 🔒 Security Best Practices

### Frontend Security
1. ✅ JWT tokens stored in localStorage
2. ✅ Sensitive data cleared on logout
3. ✅ HTTPS for production
4. ✅ XSS protection with React sanitization
5. ✅ CSRF token support ready

### Backend Security
1. ✅ Password hashed with bcrypt (10 salt rounds)
2. ✅ JWT token expiration (7 days)
3. ✅ Account locking after failed attempts
4. ✅ Input validation and sanitization
5. ✅ CORS enabled and configured
6. ✅ Environment variables for secrets
7. ✅ Rate limiting ready (can be added)

### Production Checklist
- [ ] Change `JWT_SECRET` to strong random string
- [ ] Set `NODE_ENV=production`
- [ ] Update CORS_ORIGIN to your domain
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Use MongoDB Atlas for production
- [ ] Add rate limiting
- [ ] Add email verification
- [ ] Add 2FA support
- [ ] Set up monitoring/logging
- [ ] Review security headers

---

## 🐛 Troubleshooting

### Backend Issues

#### MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- For Atlas, verify connection string and IP whitelist

#### bcrypt Installation Issues (Windows)
```
error: 'python' is not recognized
```
**Solution:**
```bash
npm install --global windows-build-tools
npm install
```

#### JWT Secret Not Set
```
Error: JWT_SECRET not defined
```
**Solution:**
```env
JWT_SECRET=your-32-character-minimum-secret-key-here
```

### Frontend Issues

#### Google Sign-In Not Working
```
Error: 401 Unauthorized
```
**Solution:**
1. Verify `REACT_APP_GOOGLE_CLIENT_ID` in `.env`
2. Check Google Console authorized origins
3. Clear browser cache and cookies
4. Check browser console for error details

#### API Endpoint 404
```
Error: POST http://localhost:5000/api/auth/register 404 (Not Found)
```
**Solution:**
1. Ensure backend server is running
2. Verify `REACT_APP_API_URL` in frontend `.env`
3. Check that auth routes are imported in `server.js`

#### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
1. In `server.js`:
```javascript
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
```
2. Update `CORS_ORIGIN` in backend `.env`

#### Password not matching
```
Passwords do not match
```
**Solution:**
- Ensure both password fields have same value
- Check for leading/trailing spaces
- Verify password visible before confirming

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 400 Bad Request | Missing fields | Verify email and password provided |
| 409 Conflict | Email exists | Use different email |
| 401 Unauthorized | Invalid token | Re-login to get new token |
| 423 Locked | Too many attempts | Wait 2 hours or admin unlock |
| 500 Server Error | Backend issue | Check server logs |

---

## 📚 Additional Resources

### Documentation
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [JWT Introduction](https://jwt.io/introduction)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

### Testing
- Test register endpoint: `POST http://localhost:5000/api/auth/register`
- Test login endpoint: `POST http://localhost:5000/api/auth/login`
- Use Postman or Insomnia for API testing
- Test in browser DevTools Network tab

### Performance
- Component render optimization
- CSS animation optimization
- Bundle size analysis: `npm run build`
- API response caching

---

## 📞 Support & Contact

**Developer:** Midhul Sasikumar  
**Registration Number:** 24122018  
**Project:** TradeTrack - Stock Market Analysis System

For issues or questions, refer to this documentation or check:
- Browser console for frontend errors
- Backend terminal for server errors
- MongoDB logs for database issues

---

## 📝 Version History

- **v1.0.0** - Initial implementation
  - Email/password registration
  - Google OAuth integration
  - Modern UI design
  - Complete documentation

---

**Last Updated:** 2026-02-18  
**Project:** TradeTrack - Professional Stock Market Analysis System
