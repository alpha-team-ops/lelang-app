# Authentication Integration Guide

## ✅ Setup Completion Summary

Integrasi authentication dengan API di `http://localhost:8000` telah selesai. Berikut adalah komponen-komponen yang telah dibuat:

---

## 📁 Files Created & Modified

### 1. **Environment Configuration**
- **`.env`** - Environment variables untuk development
- **`.env.example`** - Template untuk developer

```
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1
```

### 2. **API Client Setup**
- **`src/config/apiClient.ts`** - Axios instance dengan:
  - Base URL dari environment
  - Request interceptor untuk menambah Authorization header
  - Response interceptor untuk auto-refresh token
  - Auto logout jika token invalid

### 3. **Authentication Service**
- **`src/data/services/authService.ts`** - Service untuk:
  - Login dengan email & password
  - Register user baru
  - Logout
  - Verify token
  - Refresh token
  - Change password
  - Forgot password
  - Reset password
  - Token management di localStorage

### 4. **Authentication Context (State Management)**
- **`src/config/AuthContext.tsx`** - React Context dengan:
  - Global auth state (user, isAuthenticated, loading)
  - Methods: login, register, logout, verify
  - Auto-verify token on app load
  - Accessible via `useAuth()` hook

### 5. **Protected Route Component**
- **`src/config/ProtectedRoute.tsx`** - Wrapper untuk:
  - Check authentication status
  - Redirect to login jika not authenticated
  - Support role-based access control
  - Show loading state while verifying

### 6. **Updated Pages**
- **`src/pages/auth/LoginPage.tsx`** - Integration dengan authService
  - Email/password login
  - Error handling
  - Loading state
  - Success redirect ke dashboard

- **`src/pages/auth/RegisterPage.tsx`** - Integration dengan authService
  - User registration dengan validation
  - Password strength indicator
  - Success message & redirect ke login

### 7. **Updated App Component**
- **`src/App.tsx`** - Integrasi:
  - AuthProvider wrapper untuk seluruh app
  - ProtectedRoute untuk dashboard
  - Auto logout handler
  - User data transformation

---

## 🔐 How It Works

### Authentication Flow

```
┌─────────────────────────────────────────────┐
│ 1. User Login/Register                      │
│    (LoginPage/RegisterPage)                 │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. authService API Call                     │
│    (login/register methods)                 │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. apiClient sends request                  │
│    (http://localhost:8000/api/v1/auth/...)  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 4. Response received & Tokens stored        │
│    - accessToken (localStorage)             │
│    - refreshToken (localStorage)            │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 5. AuthContext updated                      │
│    - user data                              │
│    - isAuthenticated = true                 │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 6. Redirect to Dashboard                    │
│    Protected by ProtectedRoute              │
└─────────────────────────────────────────────┘
```

### Token Management

- **Access Token**: Disimpan di localStorage, digunakan untuk setiap request
- **Refresh Token**: Disimpan di localStorage, digunakan untuk mendapat access token baru
- **Auto Refresh**: Jika mendapat 401, apiClient otomatis call `/auth/refresh`
- **Auto Logout**: Jika refresh token invalid, user di-logout otomatis

### Request Flow

Setiap request ke API akan:
1. Include `Authorization: Bearer <accessToken>` header
2. Jika 401, coba refresh token
3. Retry request dengan token baru
4. Jika refresh gagal, logout user

---

## 🚀 Usage Examples

### Login Component
```typescript
import { useAuth } from './config/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError(error.message);
    }
  };
};
```

### Protected Page Component
```typescript
import { useAuth } from './config/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  return (
    <div>
      Welcome, {user?.name}!
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

### API Call dengan Auth
```typescript
import apiClient from './config/apiClient';

// Token otomatis ditambahkan ke header
const response = await apiClient.get('/auctions');
```

---

## ✨ Features

✅ **Automatic Token Management**
- Access token & refresh token otomatis disimpan
- Token otomatis ditambahkan ke setiap request

✅ **Auto Token Refresh**
- Jika access token expired (401), otomatis refresh
- User tidak perlu login ulang

✅ **Error Handling**
- Parse error messages dari API
- Display error notification ke user
- Auto-clear error setelah 5 detik

✅ **Loading States**
- Show loading spinner saat authentication
- Disable buttons saat loading
- Auto verify token on app load

✅ **Role-Based Access**
- ProtectedRoute support role checking
- Redirect ke access-denied page jika tidak authorized

✅ **Responsive Design**
- Mobile-friendly login/register forms
- Gradient backgrounds & smooth animations
- Password visibility toggle

---

## 🔧 Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=v1
```

Pastikan API server berjalan di `http://localhost:8000` saat development.

---

## 📝 API Endpoints

Semua endpoint sesuai dengan dokumentasi di `docs/API_01_AUTHENTICATION.md`:

- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `GET /api/v1/auth/verify` - Verify token
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/forgot-password` - Forgot password
- `POST /api/v1/auth/reset-password` - Reset password

---

## 🧪 Testing

### Test Login
```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:5173
# 3. Click Login
# 4. Enter credentials dari API
# 5. Verify redirect ke dashboard
```

### Test Register
```bash
# 1. Open http://localhost:5173/register
# 2. Fill form dengan data valid
# 3. Verify validation error jika password lemah
# 4. Submit dan verify success message
```

---

## 🐛 Troubleshooting

### "Cannot connect to API"
- Pastikan API server berjalan di `http://localhost:8000`
- Check CORS headers di API server
- Verify `VITE_API_BASE_URL` di `.env`

### "Token invalid"
- Clear localStorage manually: `localStorage.clear()`
- Login kembali untuk mendapat token baru

### "CORS Error"
- Pastikan API server allow CORS dari `http://localhost:5173`
- Check origin header di API response

---

## 📚 Next Steps

1. **Test API integration** - Pastikan login/register bekerja dengan API
2. **Implement other endpoints** - Gunakan authService pattern untuk services lain
3. **Add role-based UI** - Show/hide menu items based on user role
4. **Setup error boundary** - Catch dan handle errors gracefully
5. **Add token refresh timer** - Proactive token refresh sebelum expired

---

## 📦 Dependencies

Pastikan sudah install:
```bash
npm install axios
```

Axios sudah include dalam project untuk HTTP requests.

---

**Setup selesai! Silakan test login dan register dengan API di http://localhost:8000** ✅
