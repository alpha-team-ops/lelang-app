# 🎯 Permission System - Points untuk Frontend Implementation

Backend Permission System sudah ready! Berikut adalah point-by-point yang perlu di-implementasikan di frontend:

---

## 📍 POINT 1: Get Current User Permissions (Login Flow)

**After user login successfully:**

```
GET /api/v1/auth/me
Header: Authorization: Bearer {accessToken}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": "...",
    "email": "...",
    "name": "...",
    "organizationCode": "ORG-DERALY-001",
    "role": "ADMIN",
    "roles": [
      { "roleId": "...", "roleName": "Admin", ... }
    ],
    "permissions": [
      "manage_auctions",
      "view_auctions",
      "manage_bids",
      "view_bids",
      ...
    ]
  }
}
```

**Action:** 
- Store `permissions` array di global state (Context/Redux/Zustand)
- Store `roles` array untuk UI display

---

## 📍 POINT 2: Permission Guard - Route Protection

**Create Permission Guard Component:**

```typescript
// ProtectedRoute.tsx
interface ProtectedRouteProps {
  requiredPermission?: string;
  requiredRole?: string;
  children: ReactNode;
}

export const ProtectedRoute = ({
  requiredPermission,
  requiredRole,
  children
}: ProtectedRouteProps) => {
  const { permissions, roles } = useAuth();
  
  if (requiredPermission && !permissions.includes(requiredPermission)) {
    return <Redirect to="/unauthorized" />;
  }
  
  if (requiredRole && !roles.some(r => r.roleName === requiredRole)) {
    return <Redirect to="/unauthorized" />;
  }
  
  return children;
};
```

**Usage:**
```tsx
<ProtectedRoute requiredPermission="manage_auctions">
  <CreateAuctionPage />
</ProtectedRoute>
```

---

## 📍 POINT 3: Permission Check Before API Call

**Create Permission Check Hook:**

```typescript
export const usePermission = () => {
  const { permissions } = useAuth();
  
  const has = (permission: string): boolean => {
    return permissions.includes(permission);
  };
  
  const checkBeforeAction = (permission: string, action: () => void) => {
    if (!has(permission)) {
      toast.error(`You don't have permission: ${permission}`);
      return;
    }
    action();
  };
  
  return { has, checkBeforeAction };
};
```

**Usage:**
```tsx
const { has, checkBeforeAction } = usePermission();

<button
  disabled={!has('manage_auctions')}
  onClick={() => checkBeforeAction('manage_auctions', createAuction)}
>
  Create Auction
</button>
```

---

## 📍 POINT 4: Conditional UI Rendering

**Hide/Show UI based on permissions:**

```tsx
// Example: Create Auction Button
{userPermissions.includes('manage_auctions') && (
  <button onClick={handleCreateAuction}>
    Create Auction
  </button>
)}

// Example: Edit Button
{userPermissions.includes('manage_auctions') && (
  <IconButton onClick={handleEdit} icon="edit" />
)}

// Example: Delete Button
{userPermissions.includes('manage_auctions') && (
  <IconButton onClick={handleDelete} icon="trash" />
)}
```

---

## 📍 POINT 5: Handle API 403 Errors

**Create Axios Interceptor:**

```typescript
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const { error: errorCode, message } = error.response.data;
      
      if (errorCode === 'PERMISSION_DENIED') {
        toast.error('You do not have permission to perform this action');
        logger.warn(`Permission denied: ${message}`);
      } else if (errorCode === 'NO_ROLE') {
        toast.error('No roles assigned in this organization');
      }
      
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);
```

---

## 📍 POINT 6: Display User Roles in UI

**Show user's current roles:**

```tsx
// User Profile/Settings Page
<div className="user-roles">
  <h3>Your Roles</h3>
  <ul>
    {userRoles.map(role => (
      <li key={role.roleId}>
        {role.roleName}
        <small>{role.organizationCode}</small>
      </li>
    ))}
  </ul>
</div>
```

---

## 📍 POINT 7: Permission Constants

**Create constants file:**

```typescript
// constants/permissions.ts
export const PERMISSIONS = {
  // Auction
  MANAGE_AUCTIONS: 'manage_auctions',
  VIEW_AUCTIONS: 'view_auctions',
  
  // Bid
  MANAGE_BIDS: 'manage_bids',
  VIEW_BIDS: 'view_bids',
  
  // Staff
  MANAGE_STAFF: 'manage_staff',
  VIEW_STAFF: 'view_staff',
  
  // Roles
  MANAGE_ROLES: 'manage_roles',
  VIEW_ROLES: 'view_roles',
  
  // Organization
  MANAGE_ORGANIZATION: 'manage_organization',
  VIEW_SETTINGS: 'view_settings',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_OVERVIEW: 'view_overview',
} as const;

// Usage
import { PERMISSIONS } from '@/constants/permissions';

if (permissions.includes(PERMISSIONS.MANAGE_AUCTIONS)) {
  // show button
}
```

---

## 📍 POINT 8: Request Protection

**Add permission header/data for tracking:**

```typescript
// Optional: Add permission info to request
const apiCall = async (endpoint: string, options: any) => {
  const { permissions } = getAuthState();
  
  return fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'X-User-Permissions': permissions.join(','), // Optional logging
    }
  });
};
```

---

## 📍 POINT 9: Offline Permission Caching

**Cache permissions locally:**

```typescript
export const usePermissionCache = () => {
  const cachePermissions = (permissions: string[]) => {
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
  };
  
  const getCachedPermissions = (): string[] => {
    const cached = localStorage.getItem('userPermissions');
    return cached ? JSON.parse(cached) : [];
  };
  
  const clearCache = () => {
    localStorage.removeItem('userPermissions');
  };
  
  return { cachePermissions, getCachedPermissions, clearCache };
};
```

---

## 📍 POINT 10: Refresh Permissions on Change

**Listen for permission updates:**

```typescript
// If user's role changes, refresh permissions
const handleRoleChange = async () => {
  // User role changed
  const meResponse = await fetch('/api/v1/auth/me', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const { data } = await meResponse.json();
  
  // Update global state with new permissions
  setUserPermissions(data.permissions);
  setUserRoles(data.roles);
};
```

---

## 📍 POINT 11: Permission Check Before Form Submit

```typescript
const handleAuctionSubmit = async (formData) => {
  // Check permission first
  if (!userPermissions.includes(PERMISSIONS.MANAGE_AUCTIONS)) {
    toast.error('Permission denied: Cannot create auction');
    return;
  }
  
  try {
    const response = await apiClient.post('/api/v1/auctions', formData);
    toast.success('Auction created successfully');
  } catch (error) {
    if (error.response?.status === 403) {
      toast.error('Your permission has been revoked');
    }
  }
};
```

---

## 📍 POINT 12: Unit Test Permissions

```typescript
// __tests__/permissions.test.ts
describe('Permission System', () => {
  it('should show create button when user has manage_auctions', () => {
    render(<AuctionList permissions={['manage_auctions']} />);
    expect(screen.getByText('Create Auction')).toBeVisible();
  });
  
  it('should hide create button when user lacks manage_auctions', () => {
    render(<AuctionList permissions={['view_auctions']} />);
    expect(screen.queryByText('Create Auction')).not.toBeInTheDocument();
  });
  
  it('should handle 403 error gracefully', async () => {
    mockApiError(403, 'PERMISSION_DENIED');
    // test error handling
  });
});
```

---

## 🎯 Summary Checklist

- [ ] Call `/api/v1/auth/me` after login
- [ ] Store permissions in global state
- [ ] Create ProtectedRoute component
- [ ] Create usePermission hook
- [ ] Add permission checks to buttons/forms
- [ ] Handle 403 errors with toast notifications
- [ ] Create PERMISSIONS constants
- [ ] Add axios interceptor for 403 errors
- [ ] Display user roles somewhere
- [ ] Cache permissions locally
- [ ] Refresh permissions on role change
- [ ] Unit test permission logic

---

## 🔗 Backend Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/auth/me` | GET | Get current user + all permissions |
| `/api/v1/auth/check-permission` | POST | Check specific permission |
| `/api/v1/auctions` (protected) | POST | Create auction (need `manage_auctions`) |
| `/api/v1/auctions/{id}` (protected) | PUT | Edit auction (need `manage_auctions`) |
| `/api/v1/auctions/{id}` (protected) | DELETE | Delete auction (need `manage_auctions`) |
| `/api/v1/staff` (protected) | POST | Create staff (need `manage_staff`) |
| `/api/v1/roles` (protected) | POST | Create role (need `manage_roles`) |

---

## ✅ Ready to Implement!

Semua backend sudah siap. Frontend tinggal konsumsi endpoints dan implement permission logic di UI.

**Files created:**
- `/PERMISSION_SYSTEM.md` - Detailed documentation
- `/PERMISSION_SYSTEM.md` - This summary points

**New Endpoints:**
- `GET /api/v1/auth/me` - Get user with permissions
- `POST /api/v1/auth/check-permission` - Check specific permission

**New Middleware:**
- `permission:permission_name` - Route protection

Happy coding! 🚀
