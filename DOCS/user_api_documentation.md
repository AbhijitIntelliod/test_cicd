# User API Documentation

## Base URL
```
http://localhost:5000/api/v1/users
```

## Authentication
All endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

## API Endpoints

### 1. Get Current User Profile

**Endpoint:** `GET /api/v1/users/me`

**Description:** Get the current authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

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

---





### 2. Get All Users (Admin Only)

**Endpoint:** `GET /api/v1/users`

**Description:** Get all users with pagination and filtering options. Requires admin permissions.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Users per page (default: 10, max: 100)
- `status` (optional): Filter by status (`active`, `inactive`, `suspended`)
- `role` (optional): Filter by role ID
- `search` (optional): Search by email, full name, or ID number

**Example Request:**
```
GET /api/v1/users?page=1&limit=20&status=active&search=test
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

---

### 3. Get User by ID (Admin Only)

**Endpoint:** `GET /api/v1/users/:id`

**Description:** Get a specific user by their ID. Requires admin permissions.

**Headers:**
```
Authorization: Bearer <access_token>
```

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

---

### 4. Create User (Admin Only)

**Endpoint:** `POST /api/v1/users`

**Description:** Create a new user with a specific role. Requires admin permissions. Automatically sends a welcome email to the created user.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "fullName": "New User",
  "phoneNumber": "1234567890",
  "roleId": 3
}
```

**Request Body Fields:**
- `email` (required): User's email address (must be unique)
- `fullName` (required): User's full name (2-100 characters)
- `phoneNumber` (required): User's phone number (must be unique, will be automatically formatted to E.164 format for Cognito)
- `roleId` (required): ID of the role to assign to the user

**Phone Number Format:**
- The system automatically formats phone numbers to E.164 format for AWS Cognito
- Examples: `1234567890` → `+11234567890`, `+1234567890` → `+1234567890`
- If phone number formatting fails, the user will still be created but authentication setup will be deferred to first login

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

**Error Responses:**

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Email is required, Full name is required, Role ID is required",
  "error": {
    "validationErrors": [
      {
        "field": "email",
        "message": "Email is required",
        "value": ""
      }
    ],
    "field": "validation",
    "code": "VALIDATION_ERROR"
  }
}
```

**400 Bad Request - User Already Exists:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "User with this email already exists"
}
```

**404 Not Found - Role Not Found:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Role not found"
}
```

**403 Forbidden - Insufficient Permissions:**
```json
{
  "success": false,
  "statusCode": 403,
  "message": "Access denied. Required permission: users:create"
}
```

**400 Bad Request - Phone Number Format Error (during login):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid phone number format. Please contact support to update your phone number."
}
```

**400 Bad Request - User Account Already Exists (during login):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "User account already exists. Please contact support to resolve authentication issues."
}
```

**500 Internal Server Error - Authentication Setup Failed:**
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Authentication setup failed: [specific error message]"
}
```

---

## Important Notes

1. **Authentication**: All endpoints require JWT authentication via Cognito tokens.

2. **Token Expiry**: Access tokens and ID tokens expire in 24 hours and refresh tokens have longer lifespans.

3. **Admin Endpoints**: The `/users/all`, `/users/:id`, and `POST /users` endpoints require admin permissions (`users:read` and `users:create` respectively).

4. **Profile Access**: Users can see their profile via `/me` endpoint with no additional permissions required.

5. **User Creation**: Admin-created users are immediately active and email-verified. The system automatically creates a Cognito account for the user and sends a welcome email.

6. **Email Notifications**: The system automatically sends welcome emails when users are created by admins. If email sending fails, the user creation still succeeds but logs a warning.

7. **Cognito Integration**: Admin-created users automatically get confirmed Cognito accounts created during the user creation process. These users are immediately ready to authenticate and don't require email verification. If Cognito account creation fails, the user is still created and authentication will be set up on their first login attempt.


