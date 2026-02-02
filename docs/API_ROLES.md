# Roles Management API Documentation

## Overview
Roles Management API handles system roles and their associated permissions. Roles define what actions users can perform within the Lelang platform. Each role has specific permissions that control access to different features.

---

## Data Model

### Role Interface

```typescript
interface Role {
  id: string;                    // Unique identifier (UUID or auto-increment)
  name: string;                  // Role name (e.g., "Admin", "Moderator")
  description: string;           // Role description
  permissions: string[];         // Array of permission codes
  usersCount: number;           // Number of users with this role
  status: 'ACTIVE' | 'INACTIVE'; // Role status
  createdDate: string;          // ISO 8601 date (e.g., "2024-01-01")
  lastModified: string;         // ISO 8601 date when role was last updated
}
```

### Available Permissions

```
Permission Codes:
- manage_users          // Create, read, update, delete users
- manage_roles          // Manage roles and permissions
- manage_auctions       // Create, edit, delete auctions
- view_analytics        // Access analytics dashboard
- manage_settings       // System settings and configuration
- manage_payments       // Handle payment-related operations
- view_reports          // View system reports
- manage_disputes       // Handle auction disputes
- send_notifications    // Send notifications to users
```

### Mock Data Reference

```json
[
  {
    "id": "1",
    "name": "Admin",
    "description": "Full system access and all permissions",
    "permissions": [
      "manage_users",
      "manage_roles",
      "manage_auctions",
      "view_analytics",
      "manage_settings",
      "manage_payments",
      "view_reports"
    ],
    "usersCount": 2,
    "status": "ACTIVE",
    "createdDate": "2024-01-01",
    "lastModified": "2024-01-10"
  },
  {
    "id": "2",
    "name": "Moderator",
    "description": "Can moderate auctions and view analytics",
    "permissions": [
      "manage_auctions",
      "view_analytics",
      "manage_disputes",
      "send_notifications",
      "view_reports"
    ],
    "usersCount": 3,
    "status": "ACTIVE",
    "createdDate": "2024-01-05",
    "lastModified": "2024-01-20"
  }
]
```

---

## API Endpoints

### 1. Get All Roles
**Endpoint:** `GET /api/roles`

**Description:** Retrieve all system roles with optional filtering

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `ACTIVE` or `INACTIVE` |
| `search` | string | No | Search roles by name or description |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10) |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Admin",
      "description": "Full system access and all permissions",
      "permissions": ["manage_users", "manage_roles", ...],
      "usersCount": 2,
      "status": "ACTIVE",
      "createdDate": "2024-01-01",
      "lastModified": "2024-01-10"
    },
    {
      "id": "2",
      "name": "Moderator",
      "description": "Can moderate auctions and view analytics",
      "permissions": ["manage_auctions", "view_analytics", ...],
      "usersCount": 3,
      "status": "ACTIVE",
      "createdDate": "2024-01-05",
      "lastModified": "2024-01-20"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 2. Get Role by ID
**Endpoint:** `GET /api/roles/:id`

**Description:** Retrieve a specific role by ID

**Path Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `id` | string | Yes |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "name": "Admin",
    "description": "Full system access and all permissions",
    "permissions": [
      "manage_users",
      "manage_roles",
      "manage_auctions",
      "view_analytics",
      "manage_settings",
      "manage_payments",
      "view_reports"
    ],
    "usersCount": 2,
    "status": "ACTIVE",
    "createdDate": "2024-01-01",
    "lastModified": "2024-01-10"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Role not found"
}
```

---

### 3. Create New Role
**Endpoint:** `POST /api/roles`

**Description:** Create a new system role

**Request Body:**
```json
{
  "name": "Supervisor",
  "description": "Can supervise auctions and view reports",
  "permissions": ["manage_auctions", "view_reports", "view_analytics"]
}
```

**Request Validation:**
- `name`: Required, string, max 100 characters, must be unique
- `description`: Required, string, max 500 characters
- `permissions`: Required, array of valid permission codes, min 1 permission

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "3",
    "name": "Supervisor",
    "description": "Can supervise auctions and view reports",
    "permissions": ["manage_auctions", "view_reports", "view_analytics"],
    "usersCount": 0,
    "status": "ACTIVE",
    "createdDate": "2026-01-22",
    "lastModified": "2026-01-22"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Role name already exists"
}
```

---

### 4. Update Role
**Endpoint:** `PUT /api/roles/:id`

**Description:** Update an existing role

**Path Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `id` | string | Yes |

**Request Body:**
```json
{
  "name": "Senior Moderator",
  "description": "Senior moderator with extended permissions",
  "permissions": ["manage_auctions", "view_analytics", "manage_disputes", "send_notifications", "view_reports", "manage_settings"],
  "status": "ACTIVE"
}
```

**Validation Rules:**
- All fields optional except when explicitly updating
- Cannot update `id`, `usersCount`, `createdDate`
- Status change from ACTIVE to INACTIVE requires confirmation if users have this role

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "2",
    "name": "Senior Moderator",
    "description": "Senior moderator with extended permissions",
    "permissions": ["manage_auctions", "view_analytics", "manage_disputes", "send_notifications", "view_reports", "manage_settings"],
    "usersCount": 3,
    "status": "ACTIVE",
    "createdDate": "2024-01-05",
    "lastModified": "2026-01-22"
  }
}
```

**Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Cannot deactivate role with active users. Please reassign users first.",
  "data": {
    "usersCount": 3
  }
}
```

---

### 5. Delete Role
**Endpoint:** `DELETE /api/roles/:id`

**Description:** Delete a role (soft delete or permanent based on business logic)

**Path Parameters:**
| Parameter | Type | Required |
|-----------|------|----------|
| `id` | string | Yes |

**Business Rules:**
- Cannot delete predefined roles (Admin, Moderator)
- Cannot delete role if users are assigned to it
- Consider soft delete (set status to INACTIVE) instead

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Role deleted successfully",
  "data": {
    "id": "3",
    "deletedAt": "2026-01-22T10:30:00Z"
  }
}
```

**Response (409 Conflict):**
```json
{
  "success": false,
  "error": "Cannot delete role with assigned users. Reassign users first.",
  "data": {
    "usersCount": 3
  }
}
```

---

### 6. Get Role Permissions
**Endpoint:** `GET /api/roles/:id/permissions`

**Description:** Get all permissions for a specific role

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "roleId": "1",
    "roleName": "Admin",
    "permissions": [
      {
        "code": "manage_users",
        "description": "Create, read, update, delete users",
        "module": "Users"
      },
      {
        "code": "manage_roles",
        "description": "Manage roles and permissions",
        "module": "Roles"
      },
      {
        "code": "manage_auctions",
        "description": "Create, edit, delete auctions",
        "module": "Auctions"
      },
      ...
    ]
  }
}
```

---

### 7. Update Role Permissions
**Endpoint:** `PUT /api/roles/:id/permissions`

**Description:** Update permissions for a role

**Request Body:**
```json
{
  "permissions": ["manage_auctions", "view_analytics", "manage_disputes"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "2",
    "name": "Moderator",
    "permissions": ["manage_auctions", "view_analytics", "manage_disputes"],
    "lastModified": "2026-01-22"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request body",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "permissions",
      "message": "At least one permission is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized - Missing or invalid token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden - Insufficient permissions",
  "requiredPermission": "manage_roles"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Role not found with id: 99"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "Role name already exists",
  "existingRoleId": "1"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "requestId": "req-12345"
}
```

---

## Business Logic Requirements

### 1. Role Creation
- Role name must be unique
- Minimum 1 permission required
- Default status: ACTIVE
- Set createdDate and lastModified to current timestamp

### 2. Role Updates
- Prevent changes to system roles (Admin, Moderator) unless explicitly allowed
- Update lastModified timestamp
- Audit log all changes

### 3. Role Deletion
- Check if any users have this role
- Cannot delete if usersCount > 0
- Consider soft delete approach (set status to INACTIVE)
- Archive deleted roles for audit purposes

### 4. Permission Management
- Validate all permission codes against predefined list
- No duplicate permissions in array
- Log all permission changes for audit trail

### 5. Status Management
- ACTIVE: Role is available for assignment
- INACTIVE: Role cannot be assigned but keeps existing assignments
- Track status changes with timestamps

---

## Authentication & Authorization

All endpoints require:
- **Authentication:** Valid JWT token in Authorization header
- **Authorization:** User must have `manage_roles` permission to:
  - Create roles
  - Update roles
  - Delete roles
  - Modify permissions

Example header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Database Schema Suggestion

```sql
CREATE TABLE roles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
  users_count INT DEFAULT 0,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  INDEX idx_status (status),
  INDEX idx_name (name)
);

CREATE TABLE role_permissions (
  id VARCHAR(36) PRIMARY KEY,
  role_id VARCHAR(36) NOT NULL,
  permission_code VARCHAR(100) NOT NULL,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_id, permission_code)
);

CREATE TABLE permissions (
  code VARCHAR(100) PRIMARY KEY,
  description TEXT NOT NULL,
  module VARCHAR(50) NOT NULL,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Testing Checklist

- [ ] Create role with all required fields
- [ ] Create role with duplicate name (should fail)
- [ ] Create role with no permissions (should fail)
- [ ] Update existing role
- [ ] Update role status from ACTIVE to INACTIVE
- [ ] Delete role without users
- [ ] Try to delete role with users (should fail)
- [ ] Get all roles with filters
- [ ] Get specific role by ID
- [ ] Test authentication/authorization
- [ ] Test invalid permission codes
- [ ] Test pagination

---

## Notes for Backend Developer

1. **Database Transactions:** Use transactions when updating role permissions
2. **Caching:** Consider caching roles list (invalidate on create/update/delete)
3. **Audit Logging:** Log all role operations with user ID and timestamp
4. **Rate Limiting:** Implement rate limiting on role creation endpoint
5. **Validation:** Validate permission codes against predefined constants
6. **Soft Deletes:** Consider implementing soft deletes for audit trail
7. **Batch Operations:** Consider adding bulk permission assignment endpoint for future
