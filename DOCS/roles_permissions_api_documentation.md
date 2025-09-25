# Roles and Permissions API Documentation


## Base Configuration
- **Base URL**: `http://localhost:5000/api/v1`
- **Authentication**: Access Token
- **Content-Type**: `application/json`

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <Access Token>
```

## Roles API Endpoints

### 1. Get All Roles
**GET** `/api/v1/roles`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `roles:read`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Admin",
      "type": "admin",
      "description": "Full system access",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "permissions": [
        {
          "id": 1,
          "role_id": 1,
          "resource": "users",
          "action": "create",
          "created_at": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ],
  "message": "Roles retrieved successfully"
}
```

### 2. Get Role by ID
**GET** `/api/v1/roles/{id}`

**Path Parameters:**
- `id` (integer, required): Role ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `roles:read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin",
    "type": "admin",
    "description": "Full system access",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "permissions": []
  },
  "message": "Role retrieved successfully"
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Role not found"
}
```

### 3. Create New Role
**POST** `/api/v1/roles`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `roles:create`

**Request Body:**
```json
{
  "name": "KYC Reviewer",
  "type": "kyc_reviewer",
  "description": "Can review and approve KYC documents",
  "permissions": [
    {
      "resource": "kyc_verifications",
      "action": "read"
    },
    {
      "resource": "kyc_verifications",
      "action": "approve"
    },
    {
      "resource": "kyc_verifications",
      "action": "reject"
    }
  ]
}
```

**Validation Rules:**
- `name`: Required, 2-50 characters
- `type`: Required, must be one of: `admin`, `moderator`, `user`, `kyc_reviewer`, `super_admin`
- `description`: Optional, max 500 characters
- `permissions`: Optional array of permission objects

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "KYC Reviewer",
    "type": "kyc_reviewer",
    "description": "Can review and approve KYC documents",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "permissions": [
      {
        "id": 2,
        "role_id": 2,
        "resource": "kyc_verifications",
        "action": "read",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "message": "Role created successfully"
}
```

**Response (400) - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Role name must be between 2 and 50 characters",
      "param": "name",
      "location": "body"
    }
  ]
}
```

### 4. Update Role
**PUT** `/api/v1/roles/{id}`

**Path Parameters:**
- `id` (integer, required): Role ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `roles:update`

**Request Body:**
```json
{
  "name": "Senior KYC Reviewer",
  "description": "Senior level KYC reviewer with additional permissions",
  "is_active": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Senior KYC Reviewer",
    "type": "kyc_reviewer",
    "description": "Senior level KYC reviewer with additional permissions",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "permissions": []
  },
  "message": "Role updated successfully"
}
```

### 5. Delete Role
**DELETE** `/api/v1/roles/{id}`

**Path Parameters:**
- `id` (integer, required): Role ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `roles:delete`

**Response (200):**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

**Response (400) - Role in use:**
```json
{
  "success": false,
  "message": "Cannot delete role. 5 users are assigned to this role"
}
```

### 6. Assign Role to User
**POST** `/api/v1/roles/assign`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `roles:update`

**Request Body:**
```json
{
  "userId": 1,
  "roleId": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role_id": 2,
    "role": {
      "id": 2,
      "name": "KYC Reviewer",
      "type": "kyc_reviewer"
    }
  },
  "message": "Role assigned successfully"
}
```

### 7. Get Users by Role
**GET** `/api/v1/roles/{id}/users`

**Path Parameters:**
- `id` (integer, required): Role ID

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 10)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `users:read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "email": "user@example.com",
        "role_id": 2,
        "role": {
          "id": 2,
          "name": "KYC Reviewer",
          "type": "kyc_reviewer"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalUsers": 1,
      "hasNext": false,
      "hasPrev": false
    }
  },
  "message": "Users retrieved successfully"
}
```

## Permissions API Endpoints

### 1. Get Available Permissions
**GET** `/api/v1/permissions`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `permissions:read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resources": [
      "users",
      "kyc_verifications",
      "roles",
      "permissions",
      "system_settings",
      "reports",
      "audit_logs"
    ],
    "actions": [
      "create",
      "read",
      "update",
      "delete",
      "approve",
      "reject",
      "export"
    ],
    "permissionMatrix": [
      {
        "resource": "users",
        "availableActions": ["create", "read", "update", "delete", "approve", "reject", "export"]
      }
    ]
  },
  "message": "Available permissions retrieved successfully"
}
```

### 2. Get Role Permissions
**GET** `/api/v1/permissions/roles/{roleId}`

**Path Parameters:**
- `roleId` (integer, required): Role ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `permissions:read`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "role": {
      "id": 2,
      "name": "KYC Reviewer",
      "type": "kyc_reviewer"
    },
    "permissions": [
      {
        "id": 2,
        "role_id": 2,
        "resource": "kyc_verifications",
        "action": "read",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "message": "Role permissions retrieved successfully"
}
```

### 3. Add Permission to Role
**POST** `/api/v1/permissions/roles/{roleId}`

**Path Parameters:**
- `roleId` (integer, required): Role ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `permissions:create`

**Request Body:**
```json
{
  "resource": "kyc_verifications",
  "action": "approve"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "role_id": 2,
    "resource": "kyc_verifications",
    "action": "approve",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Permission added successfully"
}
```

**Response (400) - Duplicate Permission:**
```json
{
  "success": false,
  "message": "Permission already exists for this role"
}
```

### 4. Update All Role Permissions
**PUT** `/api/v1/permissions/roles/{roleId}`

**Path Parameters:**
- `roleId` (integer, required): Role ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `permissions:update`

**Request Body:**
```json
{
  "permissions": [
    {
      "resource": "kyc_verifications",
      "action": "read"
    },
    {
      "resource": "kyc_verifications",
      "action": "approve"
    },
    {
      "resource": "kyc_verifications",
      "action": "reject"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "KYC Reviewer",
    "type": "kyc_reviewer",
    "permissions": [
      {
        "id": 4,
        "role_id": 2,
        "resource": "kyc_verifications",
        "action": "read",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "message": "Role permissions updated successfully"
}
```

### 5. Remove Permission from Role
**DELETE** `/api/v1/permissions/roles/{roleId}/{permissionId}`

**Path Parameters:**
- `roleId` (integer, required): Role ID
- `permissionId` (integer, required): Permission ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `permissions:delete`

**Response (200):**
```json
{
  "success": true,
  "message": "Permission removed successfully"
}
```

### 6. Check User Permission
**GET** `/api/v1/permissions/check/{userId}`

**Path Parameters:**
- `userId` (integer, required): User ID

**Query Parameters:**
- `resource` (string, required): Resource name
- `action` (string, required): Action name

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Required Permission:** `users:read`

**Example Request:**
```
GET /api/v1/permissions/check/1?resource=kyc_verifications&action=approve
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "resource": "kyc_verifications",
    "action": "approve",
    "hasPermission": true
  },
  "message": "Permission check completed"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Error message",
      "param": "field_name",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```
