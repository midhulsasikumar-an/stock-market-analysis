# 🚀 TradeTrack Register Page - Quick Start Guide

**Stock Market Analysis System**  
**Developed by:** Midhul Sasikumar  
**Registration Number:** 24122018

---

## ⚡ 5-Minute Quick Start

### Step 1: Install Backend Dependencies
```bash
cd Backend_
npm install
```

### Step 2: Setup Environment Files

**Backend (.env):**
```bash
cp .env.example .env
# Edit .env and update:
# - JWT_SECRET=your-secret-key-here
# - MONGODB_URI=mongodb://localhost:27017/TradeTrack_DB
# - GOOGLE_CLIENT_ID=your-google-id
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### Step 3: Start MongoDB
```bash
# Windows
mongod

# Mac/Linux
mongod --dbpath /path/to/db
```

### Step 4: Start Backend
```bash
cd Backend_
npm run dev
# Server runs on http://localhost:5000
```

### Step 5: Start Frontend
```bash
npm install  # (if not already done)
npm start
# App runs on http://localhost:3000
```

---

## 📁 File Structure

```
stock-market-analysiss/
├── Backend_/
│   ├── models/
│   │   └── User.js (Updated with authentication schema)
│   ├── routes/
│   │   └── auth.js (NEW - Authentication routes)
│   ├── middleware/
│   │   └── auth.js (NEW - JWT middleware)
│   ├── server.js (Updated)
│   ├── package.json (Updated)
│   ├── .env.example (NEW)
│   └── .env (Create from example)
├── src/
│   ├── components/
│   │   ├── Register.js (REDESIGNED)
│   │   └── Register.css (NEW - Modern styling)
│   └── services/
│       └── authService.js (NEW - Auth API service)
├── .env (Updated)
├── .env.example (NEW)
├── REGISTER_IMPLEMENTATION_GUIDE.md (NEW)
├── QUICK_START.md (This file)
└── TradeTrack-API-Collection.postman_collection.json (NEW)
```

---

## 🔐 Google OAuth Setup (5 minutes)

1. **Go to:** [Google Cloud Console](https://console.cloud.google.com/)
2. **Create OAuth Credentials:**
   - New Project → Authentication → OAuth 2.0
   - Application Type: Web Application
3. **Add Authorized Origins:**
   - http://localhost:3000
   - http://localhost:5000
4. **Save Client ID & Secret**
5. **Update .env files with credentials**

---

## ✅ Features Ready to Use

- ✅ Modern glassmorphism UI with animations
- ✅ Email/password registration
- ✅ Email/password login
- ✅ Google OAuth 2.0
- ✅ Real-time form validation
- ✅ Password strength indicator
- ✅ JWT token management
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Account security features (locking, hashing)
- ✅ User profile management
- ✅ Complete API documentation

---

## 🧪 Testing the API

### Using Postman

1. **Import Collection:**
   - Open Postman
   - Import `TradeTrack-API-Collection.postman_collection.json`

2. **Test Endpoints:**
   - Register: `POST /api/auth/register`
   - Login: `POST /api/auth/login`
   - Google Auth: `POST /api/auth/google`
   - Get Profile: `GET /api/auth/profile`
   - Update Profile: `PUT /api/auth/profile`

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!","registrationSource":"email"}'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!"}'
```

---

## 📱 Using Register Component

### In React Router

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### Using Auth Service

```jsx
import authService from './services/authService';

// Register
const handleRegister = async (email, password) => {
  try {
    const response = await authService.register(email, password);
    console.log('Registered:', response.user);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Login
const handleLogin = async (email, password) => {
  try {
    const response = await authService.login(email, password);
    console.log('Logged in:', response.user);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Check if authenticated
if (authService.isAuthenticated()) {
  const user = authService.getUser();
  console.log('Current user:', user);
}

// Logout
authService.logout();
```

---

## 🔒 Password Requirements

Users must provide:
- ✅ Minimum 8 characters
- ✅ At least one uppercase letter (A-Z)
- ✅ At least one number (0-9)
- ✅ At least one special character (!@#$%^&*)

Example strong password: `SecurePass123!`

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| MongoDB Connection Failed | Ensure MongoDB is running: `mongod` |
| Port 5000 Already in Use | Kill process or use different port |
| Google OAuth Not Working | Check Client ID in .env, verify authorized origins |
| CORS Error | Check CORS_ORIGIN in backend .env |
| Token Invalid | Clear localStorage, re-login to get new token |
| 404 on Register Endpoint | Verify auth routes imported in server.js |

---

## 📚 Full Documentation

For complete details, see: `REGISTER_IMPLEMENTATION_GUIDE.md`

Topics covered:
- Detailed installation steps
- Backend API documentation
- Frontend component architecture
- Google OAuth complete setup
- Security best practices
- Environment variable configuration
- Troubleshooting guide

---

## 🎨 Design Highlights

- **Dark Professional Theme:** Navy and blue gradients
- **Glassmorphism:** Frosted glass effect with blur
- **Animations:** Smooth transitions and glowing effects
- **Responsive:** Works on all screen sizes
- **Accessible:** High contrast, focus states, reduced motion support
- **Modern:** Current design trends and best practices

---

## 📦 Dependencies Added

**Frontend:**
- No additional dependencies needed (uses native Google Auth)

**Backend:**
```json
{
  "bcrypt": "^5.1.1",
  "jsonwebtoken": "^9.1.2",
  "google-auth-library": "^9.2.0",
  "dotenv": "^16.3.1"
}
```

---

## 🔄 Development Workflow

```bash
# Terminal 1: Backend
cd Backend_
npm run dev

# Terminal 2: Frontend
npm start

# Terminal 3: MongoDB (if local)
mongod
```

---

## 🚀 Production Deployment

Before deploying:
1. [ ] Update `JWT_SECRET` to strong random string
2. [ ] Set `NODE_ENV=production`
3. [ ] Update CORS_ORIGIN to your domain
4. [ ] Switch to MongoDB Atlas
5. [ ] Update Google OAuth authorized domains
6. [ ] Enable HTTPS
7. [ ] Review security headers

---

## ✉️ Getting Help

1. Check `REGISTER_IMPLEMENTATION_GUIDE.md` for detailed help
2. Review browser console for frontend errors
3. Check terminal for backend errors
4. Verify .env configuration
5. Test with Postman collection

---

## 📋 Checklist Before Going Live

- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] MongoDB running and accessible
- [ ] .env files configured
- [ ] Google OAuth credentials set up
- [ ] JWT_SECRET updated
- [ ] All API endpoints tested
- [ ] Register page renders correctly
- [ ] Form validation working
- [ ] Can register with email
- [ ] Can login with email
- [ ] Can authenticate with Google
- [ ] Token stored in localStorage
- [ ] Can logout
- [ ] Profile page showing user info

---

**Developed by:** Midhul Sasikumar | **Reg No:** 24122018  
**Project:** TradeTrack - Professional Stock Market Analysis System  
**Last Updated:** February 18, 2026
