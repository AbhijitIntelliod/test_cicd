# 🔐 Miftah.Ai Backend API Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Management](#user-management)
4. [Roles & Permissions](#roles--permissions)
5. [KYC Verification](#kyc-verification)
6. [Error Handling](#error-handling)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Base Configuration
- **Base URL**: `http://localhost:5000/api/v1`
- **Authentication**: JWT Access Token via AWS Cognito
- **Content-Type**: `application/json` (except file uploads)

### Prerequisites
1. **Server running** on configured ports
2. **AWS Cognito** properly configured
3. **Valid email address** for testing
4. **Postman** or any API testing tool

---

## Authentication

### Base URL
```
http://localhost:5000/api/v1
```

### Required Headers
```json
{
  "Content-Type": "application/json"
}
```

### 1. User Registration (Signup)

**Endpoint**: `POST /auth/signup`

**Purpose**: Register a new user in both local database and AWS Cognito

**Request:**
```json
{
  "email": "testuser@example.com",
  "fullName": "Test User",
  "phoneNumber": "1234567890"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful. Please check your email for verification.",
  "data": {
    "message": "Registration successful. Please check your email for verification code.",
    "email": "testuser@example.com",
    "userId": 37
  }
}
```

### 2. Email Verification

**Endpoint**: `POST /auth/verify-email`

**Purpose**: Verify email using the confirmation code sent by Cognito

**Request:**
```json
{
  "email": "testuser@example.com",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Email verified successfully. You can now log in.",
  "data": {
    "message": "Email verified successfully. You can now log in.",
    "user": {
      "id": 37,
      "email": "testuser@example.com",
      "fullName": "Test User",
      "phoneNumber": "1234567890",
      "isKycVerified": false,
      "status": "active",
      "emailVerifiedAt": "2025-01-16T10:30:00.000Z",
      "roleId": 3,
      "cognitoSub": "testuser@example.com",
      "createdAt": "2025-01-16T10:25:00.000Z",
      "updatedAt": "2025-01-16T10:30:00.000Z"
    }
  }
}
```

### 3. Resend Verification Code

**Endpoint**: `POST /auth/resend-confirmation-code`

**Request:**
```json
{
  "email": "testuser@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Verification email resent successfully",
  "data": {
    "message": "Verification email resent successfully. Please check your email.",
    "email": "testuser@example.com"
  }
}
```

### 4. Login with OTP

**Endpoint**: `POST /auth/send-login-otp`

**Request:**
```json
{
  "email": "testuser@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login OTP sent successfully via Cognito",
  "data": {
    "message": "Login OTP sent successfully via Cognito",
    "email": "testuser@example.com",
    "challengeName": "SOFTWARE_TOKEN_MFA"
  }
}
```

### 5. Verify Login OTP

**Endpoint**: `POST /auth/verify-login-otp`

**Request:**
```json
{
  "email": "testuser@example.com",
  "otp": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful. Cognito tokens provided.",
  "data": {
    "user": {
      "id": 37,
      "email": "testuser@example.com",
      "fullName": "Test User",
      "phoneNumber": "1234567890",
      "isKycVerified": false,
      "status": "active",
      "emailVerifiedAt": "2025-01-16T10:30:00.000Z",
      "createdAt": "2025-01-16T10:25:00.000Z",
      "updatedAt": "2025-01-16T10:35:00.000Z",
      "role": {
        "id": 3,
        "name": "User",
        "type": "user",
        "description": "Standard user role",
        "is_active": true
      },
      "permissions": [
        {
          "id": 1,
          "resource": "users",
          "action": "read"
        },
        {
          "id": 2,
          "resource": "kyc_verifications",
          "action": "create"
        }
      ]
    },
    "cognitoTokens": {
      "accessToken": "eyJraWQiOiJ...",
      "idToken": "eyJraWQiOiJ...",
      "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ...",
      "tokenType": "Bearer",
      "expiresIn": 3600
    }
  }
}
```

### 6. Sign In via Password (Alternative Login)

**Endpoint**: `POST /auth/signin-via-password`

**Purpose**: Login using email and password (alternative to OTP login)

**Request:**
```json
{
  "email": "testuser@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 37,
      "email": "testuser@example.com",
      "fullName": "Test User",
      "phoneNumber": "1234567890",
      "isKycVerified": false,
      "status": "active",
      "emailVerifiedAt": "2025-01-16T10:30:00.000Z",
      "createdAt": "2025-01-16T10:25:00.000Z",
      "updatedAt": "2025-01-16T10:35:00.000Z",
      "role": {
        "id": 3,
        "name": "User",
        "type": "user",
        "description": "Standard user role",
        "is_active": true
      },
      "permissions": [
        {
          "id": 1,
          "resource": "users",
          "action": "read"
        }
      ]
    },
    "cognitoTokens": {
      "accessToken": "eyJraWQiOiJ...",
      "idToken": "eyJraWQiOiJ...",
      "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ...",
      "tokenType": "Bearer",
      "expiresIn": 3600
    }
  }
}
```

### 7. Password Reset Flow

#### 7.1 Send Password Reset OTP

**Endpoint**: `POST /auth/send-password-reset-otp`

**Request:**
```json
{
  "email": "testuser@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset OTP sent successfully via Cognito",
  "data": {
    "message": "Password reset OTP sent successfully via Cognito",
    "email": "testuser@example.com"
  }
}
```

#### 7.2 Confirm Password Reset

**Endpoint**: `POST /auth/confirm-password-reset`

**Request:**
```json
{
  "email": "testuser@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password reset successfully",
  "data": {
    "message": "Password reset successfully",
    "email": "testuser@example.com"
  }
}
```

### 8. Refresh Cognito Tokens

**Endpoint**: `POST /auth/refresh-cognito`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <access_token>"
}
```

**Request:**
```json
{
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cognito tokens refreshed successfully",
  "data": {
    "accessToken": "eyJraWQiOiJ...",
    "idToken": "eyJraWQiOiJ...",
    "tokenType": "Bearer",
    "expiresIn": 3600
  }
}
```

### 9. Legacy Login Endpoint (Disabled)

**Endpoint**: `POST /auth/login`

**Status**: **DISABLED** - This endpoint is currently disabled and will return an error.

**Request:**
```json
{
  "email": "testuser@example.com",
  "password": "SecurePassword123!"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Password login disabled. Use email verification OTP to sign in.",
  "data": null
}
```

**Note**: Use `/auth/signin-via-password` instead for password-based authentication.

---

## User Management

### Base URL
```
http://localhost:5000/api/v1/users
```

### Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer <your_access_token>
```

### 1. Get Current User Profile

**Endpoint**: `GET /api/v1/users/me`

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile retrieved successfully",
  "data": {
    "id": 37,
    "email": "testuser@example.com",
    "fullName": "Test User",
    "phoneNumber": "1234567890",
    "isKycVerified": false,
    "status": "active",
    "emailVerifiedAt": "2025-01-16T10:30:00.000Z",
    "lastLoginAt": "2025-01-16T10:35:00.000Z",
    "roleId": 3,
    "cognitoSub": "uuid-1234-5678-9abc",
    "cognitoUsername": "testuser@example.com",
    "createdAt": "2025-01-16T10:25:00.000Z",
    "updatedAt": "2025-01-16T10:35:00.000Z",
    "role": {
      "id": 3,
      "name": "User",
      "type": "user",
      "description": "Standard user role",
      "is_active": true
    },
    "permissions": [
      {
        "id": 1,
        "resource": "users",
        "action": "read"
      },
      {
        "id": 2,
        "resource": "kyc_verifications",
        "action": "create"
      }
    ]
  }
}
```

### 2. Get All Users (Admin Only)

**Endpoint**: `GET /api/v1/users/all`

**Required Permission**: `users:read`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Users per page (default: 10, max: 100)
- `status` (optional): Filter by status (`active`, `inactive`, `suspended`)
- `role` (optional): Filter by role ID
- `search` (optional): Search by email, full name, or ID number

**Example Request:**
```
GET /api/v1/users/all?page=1&limit=20&status=active&search=test
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": 37,
        "email": "testuser@example.com",
        "fullName": "Test User",
        "phoneNumber": "1234567890",
        "isKycVerified": false,
        "status": "active",
        "emailVerifiedAt": "2025-01-16T10:30:00.000Z",
        "lastLoginAt": "2025-01-16T10:35:00.000Z",
        "roleId": 3,
        "cognitoSub": "uuid-1234-5678-9abc",
        "cognitoUsername": "testuser@example.com",
        "createdAt": "2025-01-16T10:25:00.000Z",
        "updatedAt": "2025-01-16T10:35:00.000Z",
        "role": {
          "id": 3,
          "name": "User",
          "type": "user",
          "description": "Standard user role",
          "is_active": true
        },
        "permissions": [
          {
            "id": 1,
            "resource": "users",
            "action": "read"
          }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "usersPerPage": 10
    }
  }
}
```

### 3. Get User by ID (Admin Only)

**Endpoint**: `GET /api/v1/users/:id`

**Required Permission**: `users:read`

**Path Parameters:**
- `id`: User ID (integer)

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User retrieved successfully",
  "data": {
    "id": 37,
    "email": "testuser@example.com",
    "fullName": "Test User",
    "phoneNumber": "1234567890",
    "isKycVerified": false,
    "status": "active",
    "emailVerifiedAt": "2025-01-16T10:30:00.000Z",
    "lastLoginAt": "2025-01-16T10:35:00.000Z",
    "roleId": 3,
    "cognitoSub": "uuid-1234-5678-9abc",
    "cognitoUsername": "testuser@example.com",
    "createdAt": "2025-01-16T10:25:00.000Z",
    "updatedAt": "2025-01-16T10:35:00.000Z",
    "role": {
      "id": 3,
      "name": "User",
      "type": "user",
      "description": "Standard user role",
      "is_active": true
    },
    "permissions": [
      {
        "id": 1,
        "resource": "users",
        "action": "read"
      }
    ]
  }
}
```

### 4. Update Current User Profile

**Endpoint**: `PUT /api/v1/users/me`

**Authentication**: Required (User can only update their own profile)

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "phoneNumber": "9876543210"
}
```

**Request Body Fields:**
- `fullName` (optional): User's full name (2-100 characters)
- `phoneNumber` (optional): User's phone number (must be unique if provided)

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile updated successfully",
  "data": {
    "id": 37,
    "email": "testuser@example.com",
    "fullName": "Updated Name",
    "phoneNumber": "9876543210",
    "isKycVerified": false,
    "status": "active",
    "emailVerifiedAt": "2025-01-16T10:30:00.000Z",
    "lastLoginAt": "2025-01-16T10:35:00.000Z",
    "roleId": 3,
    "cognitoSub": "uuid-1234-5678-9abc",
    "cognitoUsername": "testuser@example.com",
    "createdAt": "2025-01-16T10:25:00.000Z",
    "updatedAt": "2025-01-16T11:00:00.000Z",
    "role": {
      "id": 3,
      "name": "User",
      "type": "user",
      "description": "Standard user role",
      "is_active": true
    },
    "permissions": [
      {
        "id": 1,
        "resource": "users",
        "action": "read"
      }
    ]
  }
}
```

### 5. Get Current User Tokens

**Endpoint**: `GET /api/v1/users/me/tokens`

**Authentication**: Required (User can only access their own tokens)

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User tokens retrieved successfully",
  "data": {
    "hasAccessToken": true,
    "hasIdToken": true,
    "hasRefreshToken": true,
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "tokens": {
      "accessToken": "eyJraWQiOiJ...",
      "idToken": "eyJraWQiOiJ...",
      "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ...",
      "tokenType": "Bearer",
      "expiresIn": 3600
    }
  }
}
```

### 6. Change User Role (Admin Only)

**Endpoint**: `PUT /api/v1/users/:userId/role`

**Required Permission**: `users:update`

**Path Parameters:**
- `userId`: User ID (integer)

**Request Body:**
```json
{
  "roleId": 2
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User role changed from \"User\" to \"KYC Reviewer\" successfully",
  "data": {
    "user": {
      "id": 37,
      "email": "testuser@example.com",
      "fullName": "Test User",
      "phoneNumber": "1234567890",
      "isKycVerified": false,
      "status": "active",
      "emailVerifiedAt": "2025-01-16T10:30:00.000Z",
      "lastLoginAt": "2025-01-16T10:35:00.000Z",
      "roleId": 2,
      "cognitoSub": "uuid-1234-5678-9abc",
      "cognitoUsername": "testuser@example.com",
      "createdAt": "2025-01-16T10:25:00.000Z",
      "updatedAt": "2025-01-16T11:00:00.000Z",
      "role": {
        "id": 2,
        "name": "KYC Reviewer",
        "type": "kyc_reviewer",
        "description": "Can review and approve KYC documents",
        "is_active": true
      },
      "permissions": [
        {
          "id": 2,
          "resource": "kyc_verifications",
          "action": "read"
        }
      ]
    },
    "roleChange": {
      "oldRole": "User",
      "newRole": "KYC Reviewer",
      "changedBy": 1,
      "changedAt": "2025-01-16T11:00:00.000Z"
    }
  }
}
```

### 7. Create User (Admin Only)

**Endpoint**: `POST /api/v1/users`

**Required Permission**: `users:create`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "fullName": "New User",
  "phoneNumber": "1234567890",
  "roleId": 3,
  "password": "SecurePassword123!"
}
```

**Request Body Fields:**
- `email` (required): User's email address (must be unique)
- `fullName` (required): User's full name (2-100 characters)
- `phoneNumber` (required): User's phone number (must be unique, will be automatically formatted to E.164 format for Cognito)
- `roleId` (required): ID of the role to assign to the user
- `password` (required): User's password (will be hashed and stored securely)

**Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User created successfully and welcome email sent",
  "data": {
    "user": {
      "id": 38,
      "email": "newuser@example.com",
      "fullName": "New User",
      "phoneNumber": "1234567890",
      "isKycVerified": false,
      "status": "active",
      "emailVerifiedAt": "2025-01-16T11:00:00.000Z",
      "lastLoginAt": null,
      "roleId": 3,
      "cognitoSub": null,
      "cognitoUsername": null,
      "createdAt": "2025-01-16T11:00:00.000Z",
      "updatedAt": "2025-01-16T11:00:00.000Z",
      "role": {
        "id": 3,
        "name": "User",
        "type": "user",
        "description": "Standard user role",
        "is_active": true
      },
      "permissions": [
        {
          "id": 1,
          "resource": "users",
          "action": "read"
        }
      ]
    },
    "createdBy": 1,
    "createdAt": "2025-01-16T11:00:00.000Z"
  }
}
```

---

## Roles & Permissions

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All endpoints require authentication:
```
Authorization: Bearer <Access Token>
```

## Roles API Endpoints

### 1. Get All Roles

**GET** `/api/v1/roles`

**Required Permission**: `roles:read`

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

**Required Permission**: `roles:read`

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

### 3. Create New Role

**POST** `/api/v1/roles`

**Required Permission**: `roles:create`

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

### 4. Update Role

**PUT** `/api/v1/roles/{id}`

**Required Permission**: `roles:update`

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

**Required Permission**: `roles:delete`

**Response (200):**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

### 6. Assign Role to User

**POST** `/api/v1/roles/assign`

**Required Permission**: `roles:update`

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

**Required Permission**: `users:read`

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 10)

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

**Required Permission**: `permissions:read`

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

**Required Permission**: `permissions:read`

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

**Required Permission**: `permissions:create`

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

### 4. Update All Role Permissions

**PUT** `/api/v1/permissions/roles/{roleId}`

**Required Permission**: `permissions:update`

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

**Required Permission**: `permissions:delete`

**Response (200):**
```json
{
  "success": true,
  "message": "Permission removed successfully"
}
```

### 6. Check User Permission

**GET** `/api/v1/permissions/check/{userId}`

**Required Permission**: `users:read`

**Query Parameters:**
- `resource` (string, required): Resource name
- `action` (string, required): Action name

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

---

## KYC Verification

### Base URL
```
http://localhost:5000/api/v1/kyc
```

### Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer <access_token>
```

### Route Structure
The API routes are organized with specific admin routes before generic user routes to prevent conflicts. Admin routes (prefixed with `/admin/`) are matched before the generic `/:kycId` route to ensure proper routing.

**Important:** The `/admin/review-queue` route is positioned before the generic `/:kycId` route to prevent the string "review-queue" from being interpreted as a KYC ID parameter, which would cause database errors.

## User Endpoints

### 1. Submit KYC Documents

**Endpoint:** `POST /api/v1/kyc/submit`

**Authentication:** Required (User)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `documentType` (string, required): Type of document
  - Values: `passport`, `national_id`, `driver_license`, `other`
- `documentNumber` (string, required): Document number (3-50 characters)
- `documents` (file[], required): Document files (max 5 files)

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "KYC documents submitted successfully",
  "data": {
    "id": 123,
    "status": "pending",
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Resubmit KYC Documents

**Endpoint:** `POST /api/v1/kyc/resubmit`

**Authentication:** Required (User)

**Content-Type:** `multipart/form-data`

**Request Body:**
- `documentType` (string, required): Type of document
- `documentNumber` (string, required): Document number
- `documents` (file[], required): Document files (max 5 files)

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "KYC documents resubmitted successfully",
  "data": {
    "id": 124,
    "status": "pending",
    "submittedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### 3. Get User KYC Status

**Endpoint:** `GET /api/v1/kyc/status`

**Authentication:** Required (User)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "KYC status retrieved successfully",
  "data": {
    "userId": 123,
    "email": "user@example.com",
    "username": "johndoe",
    "isKycVerified": false,
    "onboardingProgress": {
      "emailVerified": true,
      "kycSubmitted": true,
      "kycApproved": false,
      "onboardingCompleted": false,
      "currentStep": "kyc_review"
    },
    "latestKyc": {
      "id": 123,
      "documentType": "passport",
      "documentNumber": "A1234567",
      "status": "pending",
      "submittedAt": "2024-01-15T10:30:00.000Z",
      "documentFiles": [
        {
          "url": "https://signed-url-for-document",
          "key": "documents/kyc/123/passport.pdf",
          "size": 1024000,
          "mimetype": "application/pdf",
          "originalName": "passport.pdf"
        }
      ]
    }
  }
}
```

### 4. Get KYC History

**Endpoint:** `GET /api/v1/kyc/history`

**Authentication:** Required (User)

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "KYC history retrieved successfully",
  "data": {
    "kycVerifications": [
      {
        "id": 123,
        "documentType": "passport",
        "status": "pending",
        "submittedAt": "2024-01-15T10:30:00.000Z",
        "reviewedAt": null,
        "rejectionReason": null
      }
    ],
    "totalCount": 1,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

### 5. Get KYC by ID

**Endpoint:** `GET /api/v1/kyc/:kycId`

**Authentication:** Required (User - can only access own KYC)

**Path Parameters:**
- `kycId` (number, required): KYC verification ID

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "KYC details retrieved successfully",
  "data": {
    "id": 123,
    "userId": 456,
    "documentType": "passport",
    "documentNumber": "A1234567",
    "status": "pending",
    "submittedAt": "2024-01-15T10:30:00.000Z",
    "reviewedAt": null,
    "rejectionReason": null,
    "notes": null,
    "documentFiles": [
      {
        "url": "https://signed-url-for-document",
        "key": "documents/kyc/123/passport.pdf",
        "size": 1024000,
        "mimetype": "application/pdf",
        "originalName": "passport.pdf"
      }
    ],
    "user": {
      "id": 456,
      "email": "user@example.com",
      "username": "johndoe",
      "fullName": "John Doe"
    }
  }
}
```

### 6. Delete KYC Document

**Endpoint:** `DELETE /api/v1/kyc/:kycId/document`

**Authentication:** Required (User - can only modify own KYC)

**Request Body:**
```json
{
  "fileKey": "documents/kyc/123/passport.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "KYC document deleted successfully",
  "data": {
    "id": 123,
    "remainingDocuments": 2
  }
}
```

## Admin Endpoints

### 7. Get KYC Review Queue

**Endpoint:** `GET /api/v1/kyc/admin/review-queue`

**Authentication:** Required (Admin with `kyc_verifications:read` permission)

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "KYC review queue retrieved successfully",
  "data": {
    "kycVerifications": [
      {
        "id": 123,
        "userId": 456,
        "documentType": "passport",
        "documentNumber": "A1234567",
        "status": "pending",
        "submittedAt": "2024-01-15T10:30:00.000Z",
        "documentFiles": [
          {
            "url": "https://signed-url-for-document",
            "key": "documents/kyc/123/passport.pdf",
            "size": 1024000,
            "mimetype": "application/pdf",
            "originalName": "passport.pdf"
          }
        ],
        "user": {
          "id": 456,
          "email": "user@example.com",
          "username": "johndoe",
          "fullName": "John Doe",
          "phoneNumber": "+1234567890"
        }
      }
    ],
    "totalCount": 1,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

### 8. Review KYC

**Endpoint:** `PUT /api/v1/kyc/admin/review/:kycId`

**Authentication:** Required (Admin with `kyc_verifications:approve` permission)

**Request Body (Approval):**
```json
{
  "status": "approved",
  "notes": "Documents verified successfully"
}
```

**Request Body (Rejection):**
```json
{
  "status": "rejected",
  "rejectionReason": "Document quality is poor, please resubmit with clearer images",
  "notes": "Front and back images are blurry"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "KYC approved successfully",
  "data": {
    "id": 123,
    "status": "approved",
    "reviewedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

### 9. Update KYC Status

**Endpoint:** `PUT /api/v1/kyc/admin/status/:kycId`

**Authentication:** Required (Admin with `kyc_verifications:update` permission)

**Request Body:**
```json
{
  "status": "under_review"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "KYC status updated successfully",
  "data": {
    "id": 123,
    "status": "under_review",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### 10. Get KYC Statistics

**Endpoint:** `GET /api/v1/kyc/admin/statistics`

**Authentication:** Required (Admin with `kyc_verifications:read` permission)

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "KYC statistics retrieved successfully",
  "data": {
    "totalSubmissions": 150,
    "recentSubmissions": 25,
    "averageReviewTimeHours": 24,
    "statusBreakdown": {
      "pending": 10,
      "under_review": 5,
      "approved": 120,
      "rejected": 15
    }
  }
}
```

---

## Additional API Endpoints

### Bookings API

**Base URL**: `http://localhost:5000/api/v1/bookings`

**Authentication**: All endpoints require JWT authentication

#### 1. Create Booking

**Endpoint**: `POST /api/v1/bookings`

**Request Body**: (varies based on booking type)

**Response (201 Created)**:
```json
{
  "id": 123,
  "userId": 456,
  "bookingData": "...",
  "createdAt": "2025-01-16T10:30:00.000Z"
}
```

#### 2. Get User Bookings

**Endpoint**: `GET /api/v1/bookings`

**Response (200 OK)**:
```json
[
  {
    "id": 123,
    "userId": 456,
    "bookingData": "...",
    "createdAt": "2025-01-16T10:30:00.000Z"
  }
]
```

#### 3. Get Booking by ID

**Endpoint**: `GET /api/v1/bookings/:id`

#### 4. Update Booking

**Endpoint**: `PUT /api/v1/bookings/:id`

#### 5. Delete Booking

**Endpoint**: `DELETE /api/v1/bookings/:id`

### Events API

**Base URL**: `http://localhost:5000/api/v1/events`

**Authentication**: All endpoints require JWT authentication

#### 1. Create Event

**Endpoint**: `POST /api/v1/events`

**Request Body**: (varies based on event type)

**Response (201 Created)**:
```json
{
  "id": 123,
  "userId": 456,
  "eventData": "...",
  "createdAt": "2025-01-16T10:30:00.000Z"
}
```

#### 2. List User Events

**Endpoint**: `GET /api/v1/events`

**Query Parameters**:
- `from` (optional): Start date filter
- `to` (optional): End date filter
- `limit` (optional): Number of events per page (default: 50)
- `offset` (optional): Number of events to skip (default: 0)

#### 3. Get Event by ID

**Endpoint**: `GET /api/v1/events/:id`

#### 4. Update Event

**Endpoint**: `PUT /api/v1/events/:id`

#### 5. Delete Event

**Endpoint**: `DELETE /api/v1/events/:id`

### Tickets API

**Base URL**: `http://localhost:5000/api/v1/tickets`

**Authentication**: All endpoints require JWT authentication

#### 1. Create Ticket

**Endpoint**: `POST /api/v1/tickets`

**Request Body**:
```json
{
  "subject": "Support Request",
  "description": "Detailed description of the issue",
  "priority": "medium",
  "category": "technical"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Ticket created successfully",
  "data": {
    "id": 123,
    "subject": "Support Request",
    "status": "open",
    "priority": "medium",
    "createdAt": "2025-01-16T10:30:00.000Z"
  }
}
```

#### 2. List User Tickets

**Endpoint**: `GET /api/v1/tickets`

**Query Parameters**:
- `status` (optional): Filter by status
- `priority` (optional): Filter by priority
- `from` (optional): Start date filter
- `to` (optional): End date filter
- `limit` (optional): Number of tickets per page (default: 50)
- `offset` (optional): Number of tickets to skip (default: 0)

#### 3. Get Ticket by ID

**Endpoint**: `GET /api/v1/tickets/:id`

#### 4. Update Ticket

**Endpoint**: `PUT /api/v1/tickets/:id`

#### 5. Delete Ticket

**Endpoint**: `DELETE /api/v1/tickets/:id`

### Recommendations API

**Base URL**: `http://localhost:5000/api/v1/recommendations`

**Authentication**: All endpoints require JWT authentication

### Discovery API

**Base URL**: `http://localhost:5000/api/v1/discoveries`

**Authentication**: All endpoints require JWT authentication

### Corporate Communities API

**Base URL**: `http://localhost:5000/api/v1/corporate-communities`

**Authentication**: All endpoints require JWT authentication

### Individual Professionals API

**Base URL**: `http://localhost:5000/api/v1/individual-professionals`

**Authentication**: All endpoints require JWT authentication

### Likes API

**Base URL**: `http://localhost:5000/api/v1/likes`

**Authentication**: All endpoints require JWT authentication

### SLA Logs API

**Base URL**: `http://localhost:5000/api/v1/sla-logs`

**Authentication**: All endpoints require JWT authentication

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error message",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized access",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Access denied",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Resource not found",
  "data": null
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error",
  "data": null
}
```

### Authentication Error Scenarios

**User Already Exists (400 Bad Request):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "User with this email already exists",
  "data": null
}
```

**Invalid Confirmation Code (400 Bad Request):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid confirmation code. Please check your email and try again.",
  "data": null
}
```

**Invalid OTP (400 Bad Request):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid OTP. Please try again.",
  "data": null
}
```

**Cognito Not Configured (500 Internal Server Error):**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Cognito is not properly configured",
  "data": null
}
```

**Password Reset Errors:**

**Invalid Password Reset OTP (400 Bad Request):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid or expired password reset code",
  "data": null
}
```

**Password Reset OTP Not Found (404 Not Found):**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Password reset request not found or expired",
  "data": null
}
```

**Password Authentication Errors:**

**Invalid Password (401 Unauthorized):**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "data": null
}
```

**User Not Confirmed (400 Bad Request):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "User account is not confirmed. Please verify your email first.",
  "data": null
}
```

---

**Route Matching Order:**
1. User routes (`/submit`, `/resubmit`, `/status`, `/history`)
2. Admin routes (`/admin/review-queue`, `/admin/statistics`, `/admin/review/:kycId`, `/admin/status/:kycId`)
3. Generic user routes (`/:kycId`, `/:kycId/document`)

### File Upload Guidelines

**Supported File Types:**
- PDF documents
- Image files (JPEG, PNG, GIF)
- Maximum file size: 10MB per file
- Maximum files per submission: 5

**File Upload Process:**
1. Use `multipart/form-data` content type
2. Include files in the `documents` field
3. Files are automatically uploaded to S3
4. Signed URLs are generated for document access
5. URLs expire after 1 week for security

### Status Codes

| Status | Description |
|--------|-------------|
| `pending` | KYC submitted, awaiting review |
| `under_review` | KYC is being reviewed by admin |
| `approved` | KYC approved and user verified |
| `rejected` | KYC rejected, user can resubmit |
| `expired` | KYC expired (if applicable) |

### Testing Checklist

#### ✅ Registration Flow:
- [ ] Signup with valid data
- [ ] Signup with duplicate email (should fail)
- [ ] Signup with missing required fields (should fail)
- [ ] Check user created in database with `pending_verification` status

#### ✅ Email Verification Flow:
- [ ] Verify with correct confirmation code
- [ ] Verify with incorrect confirmation code (should fail)
- [ ] Verify with expired confirmation code (should fail)
- [ ] Check user status changed to `active` after verification

#### ✅ Login Flow:
- [ ] Send login OTP to verified user
- [ ] Send login OTP to unverified user (should fail)
- [ ] Verify login OTP with correct code
- [ ] Verify login OTP with incorrect code (should fail)
- [ ] Check Cognito tokens returned
- [ ] Login with password (signin-via-password)
- [ ] Login with incorrect password (should fail)
- [ ] Test disabled legacy login endpoint (should return error)

#### ✅ Password Reset Flow:
- [ ] Send password reset OTP to existing user
- [ ] Send password reset OTP to non-existent user (should fail)
- [ ] Confirm password reset with correct OTP and new password
- [ ] Confirm password reset with incorrect OTP (should fail)
- [ ] Login with new password after reset

#### ✅ Token Management:
- [ ] Refresh tokens with valid refresh token
- [ ] Refresh tokens with invalid refresh token (should fail)
- [ ] Use access token for authenticated requests

---

## Important Notes

1. **Authentication**: All endpoints require JWT authentication via Cognito tokens.

2. **Dual Authentication Methods**: The system supports both OTP-based and password-based authentication:
   - **OTP Login**: Send OTP to email, verify OTP to login
   - **Password Login**: Use email and password directly via `/auth/signin-via-password`
   - **Legacy Login**: `/auth/login` endpoint is disabled for security

3. **Token Expiry**: Access tokens and ID tokens expire in 1 hour and refresh tokens have longer lifespans.

4. **Password Reset**: Users can reset passwords via OTP verification:
   - Send reset OTP to email
   - Verify OTP with new password
   - Login with new password

5. **Admin Endpoints**: Admin endpoints require specific permissions as documented.

6. **Profile Access**: Users can see their profile via `/me` endpoint with no additional permissions required.

7. **User Creation**: Admin-created users are immediately active and email-verified. The system automatically creates a Cognito account for the user and sends a welcome email.

8. **Email Notifications**: The system automatically sends welcome emails when users are created by admins. If email sending fails, the user creation still succeeds but logs a warning.

9. **Cognito Integration**: Admin-created users automatically get confirmed Cognito accounts created during the user creation process. These users are immediately ready to authenticate and don't require email verification. If Cognito account creation fails, the user is still created and authentication will be set up on their first login attempt.

10. **Phone Number Format**: The system automatically formats phone numbers to E.164 format for AWS Cognito. Examples: `1234567890` → `+11234567890`, `+1234567890` → `+1234567890`.

11. **File Uploads**: 5 files per request (max. file size: 10 MB). Document access: Signed URLs expire after 1 week.
