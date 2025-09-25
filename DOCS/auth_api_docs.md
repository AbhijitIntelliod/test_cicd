# 🔐 Authentication API Testing Guide - Step by Step

This comprehensive guide provides step-by-step instructions for testing all authentication API endpoints with actual request/response examples.

## 📋 Prerequisites

1. **Server running** on `http://localhost:3000` (or your configured port)
2. **Postman** or any API testing tool
3. **Valid email address** for testing
4. **Cognito properly configured** with environment variables

## 🛠️ Environment Setup

### Base URL
```
http://localhost:5000/api/v1
```

### Required Headers (for all requests)
```json
{
  "Content-Type": "application/json"
}
```

---

## 🚀 Step-by-Step Testing Guide

### Step 1: User Registration (Signup)

**Endpoint**: `POST /auth/signup`

**Purpose**: Register a new user in both local database and AWS Cognito

#### Request:
```json
{
  "email": "testuser@example.com",
  "fullName": "Test User",
  "phoneNumber": "1234567890",
  "password": "SecurePassword123!"
}
```

#### Expected Response (201 Created):
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

#### What Happens:
1. ✅ User created in local database with status `pending_verification`
2. ✅ User created in AWS Cognito
3. ✅ Verification email sent by Cognito
4. ✅ User receives confirmation code via email

---

### Step 2: Email Verification

**Endpoint**: `POST /auth/verify-email`

**Purpose**: Verify email using the confirmation code sent by Cognito

#### Request:
```json
{
  "email": "testuser@example.com",
  "otp": "123456"
}
```
> **Note**: Replace `"123456"` with the actual confirmation code from the email sent by Cognito

#### Expected Response (200 OK):
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

#### What Happens:
1. ✅ Confirmation code verified with Cognito
2. ✅ User status changed to `active` in local database
3. ✅ `emailVerifiedAt` timestamp set
4. ✅ User can now log in

---

### Step 3: Resend Verification Code

**Endpoint**: `POST /auth/resend-confirmation-code`

**Purpose**: Resend verification email if user didn't receive it

#### Request:
```json
{
  "email": "testuser@example.com"
}
```

#### Expected Response (200 OK):
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

---

### Step 4: Login with OTP

**Endpoint**: `POST /auth/send-login-otp`

**Purpose**: Send login OTP to user's email

#### Request:
```json
{
  "email": "testuser@example.com"
}
```

#### Expected Response (200 OK):
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
```

#### What Happens:
1. ✅ OTP sent to user's email via Cognito
2. ✅ Session stored in database for verification
3. ✅ User receives OTP via email

---

### Step 5: Verify Login OTP

**Endpoint**: `POST /auth/verify-login-otp`

**Purpose**: Verify OTP and complete login

#### Request:
```json
{
  "email": "testuser@example.com",
  "otp": "123456"
}
```
> **Note**: Replace `"123456"` with the actual OTP from the email

#### Expected Response (200 OK):
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

#### What Happens:
1. ✅ OTP verified with Cognito
2. ✅ Cognito tokens generated
3. ✅ User logged in successfully
4. ✅ Tokens stored in user record

---

### Step 6: Sign In via Password (Alternative Login)

**Endpoint**: `POST /auth/signin-via-password`

**Purpose**: Login using email and password (alternative to OTP login)

#### Request:
```json
{
  "email": "testuser@example.com",
  "password": "SecurePassword123!"
}
```

#### Expected Response (200 OK):
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

---

### Step 7: Password Reset Flow

#### 7.1 Send Password Reset OTP

**Endpoint**: `POST /auth/send-password-reset-otp`

**Purpose**: Send password reset OTP to user's email

#### Request:
```json
{
  "email": "testuser@example.com"
}
```

#### Expected Response (200 OK):
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

**Purpose**: Confirm password reset with OTP and new password

#### Request:
```json
{
  "email": "testuser@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePassword123!"
}
```

#### Expected Response (200 OK):
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

#### What Happens:
1. ✅ OTP verified with Cognito
2. ✅ User's password updated in Cognito
3. ✅ User can now login with new password

---

### Step 8: Refresh Cognito Tokens

**Endpoint**: `POST /auth/refresh-cognito`

**Purpose**: Refresh expired access tokens

#### Headers:
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <access_token>"
}
```

#### Request:
```json
{
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ..."
}
```

#### Expected Response (200 OK):
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

---



### Step 9: Legacy Login Endpoint (Disabled)

**Endpoint**: `POST /auth/login`

**Status**: **DISABLED** - This endpoint is currently disabled and will return an error.

#### Request:
```json
{
  "email": "testuser@example.com",
  "password": "SecurePassword123!"
}
```

#### Expected Response (400 Bad Request):
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

## ❌ Error Responses

### Common Error Scenarios:

#### 1. User Already Exists (400 Bad Request):
```json
{
  "success": false,
  "statusCode": 400,
  "message": "User with this email already exists",
  "data": null
}
```

#### 2. Invalid Confirmation Code (400 Bad Request):
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid confirmation code. Please check your email and try again.",
  "data": null
}
```

#### 3. User Not Found (404 Not Found):
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "data": null
}
```

#### 4. Invalid OTP (400 Bad Request):
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid OTP. Please try again.",
  "data": null
}
```

#### 5. Cognito Not Configured (500 Internal Server Error):
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Cognito is not properly configured",
  "data": null
}
```

---


### ✅ Registration Flow:
- [ ] Signup with valid data
- [ ] Signup with duplicate email (should fail)
- [ ] Signup with missing required fields (should fail)
- [ ] Check user created in database with `pending_verification` status

### ✅ Email Verification Flow:
- [ ] Verify with correct confirmation code
- [ ] Verify with incorrect confirmation code (should fail)
- [ ] Verify with expired confirmation code (should fail)
- [ ] Check user status changed to `active` after verification

### ✅ Login Flow:
- [ ] Send login OTP to verified user
- [ ] Send login OTP to unverified user (should fail)
- [ ] Verify login OTP with correct code
- [ ] Verify login OTP with incorrect code (should fail)
- [ ] Check Cognito tokens returned
- [ ] Login with password (signin-via-password)
- [ ] Login with incorrect password (should fail)
- [ ] Test disabled legacy login endpoint (should return error)

### ✅ Password Reset Flow:
- [ ] Send password reset OTP to existing user
- [ ] Send password reset OTP to non-existent user (should fail)
- [ ] Confirm password reset with correct OTP and new password
- [ ] Confirm password reset with incorrect OTP (should fail)
- [ ] Login with new password after reset

### ✅ Token Management:
- [ ] Refresh tokens with valid refresh token
- [ ] Refresh tokens with invalid refresh token (should fail)
- [ ] Use access token for authenticated requests

---

## 📊 Database Tables and Functions Overview

### 🗄️ Database Tables

#### 1. **`users` Table**
**Primary table for user management and authentication**

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | BIGINT | Primary key, auto-increment | Primary Key |
| `email` | VARCHAR(255) | User's email address | Unique, Not Null, Email validation |
| `full_name` | VARCHAR(200) | User's full name | Not Null |
| `phone_number` | VARCHAR(20) | User's phone number | Unique, E.164 format validation |
| `is_kyc_verified` | BOOLEAN | KYC verification status | Default: false |
| `status` | ENUM | User status | Values: 'active', 'inactive', 'suspended', 'pending_verification' |
| `email_verified_at` | DATETIME | Email verification timestamp | Nullable |
| `role_id` | BIGINT | Foreign key to roles table | Not Null, References roles.id |
| `cognito_sub` | VARCHAR(255) | AWS Cognito user identifier | Unique |
| `cognito_username` | VARCHAR(255) | Cognito username (usually email) | Nullable |
| `cognito_service_password` | VARCHAR(255) | Service password for token generation | Nullable |
| `cognito_tokens` | JSON | Stored Cognito authentication tokens | Nullable |
| `created_at` | DATETIME | Record creation timestamp | Auto-generated |
| `updated_at` | DATETIME | Record update timestamp | Auto-generated |

**Indexes:**
- `email` (unique)
- `phone_number` (unique)
- `status`
- `role_id`
- `cognito_sub` (unique)

#### 2. **`roles` Table**
**Role-based access control system**

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | BIGINT | Primary key, auto-increment | Primary Key |
| `name` | VARCHAR(50) | Role name | Unique, Not Null |
| `type` | ENUM | Role type | Values: 'admin', 'moderator', 'user', 'kyc_reviewer', 'super_admin' |
| `description` | TEXT | Role description | Nullable |
| `is_active` | BOOLEAN | Role active status | Default: true |
| `created_at` | DATETIME | Record creation timestamp | Auto-generated |
| `updated_at` | DATETIME | Record update timestamp | Auto-generated |

**Indexes:**
- `type`
- `is_active`

#### 3. **`role_permissions` Table**
**Permission mapping for roles**

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | BIGINT | Primary key, auto-increment | Primary Key |
| `role_id` | BIGINT | Foreign key to roles table | Not Null, References roles.id |
| `resource` | ENUM | Protected resource | Values: 'users', 'kyc_verifications', 'roles', 'permissions', 'system_settings', 'reports', 'audit_logs' |
| `action` | ENUM | Allowed action | Values: 'create', 'read', 'update', 'delete', 'approve', 'reject', 'export' |
| `created_at` | DATETIME | Record creation timestamp | Auto-generated |
| `updated_at` | DATETIME | Record update timestamp | Auto-generated |

**Indexes:**
- `role_id`
- `resource`
- `action`
- `(role_id, resource, action)` (unique composite)

#### 4. **`login_otps` Table**
**OTP management for login authentication**

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | BIGINT | Primary key, auto-increment | Primary Key |
| `email` | VARCHAR(255) | User's email address | Not Null, Email validation |
| `otp` | VARCHAR(6) | 6-digit OTP code | Not Null |
| `otp_expires_at` | DATETIME | OTP expiration timestamp | Not Null |
| `session` | TEXT | Session data (nullable) | Nullable |
| `consumed_at` | DATETIME | OTP consumption timestamp | Nullable |
| `created_at` | DATETIME | Record creation timestamp | Auto-generated |

**Indexes:**
- `email`
- `otp`
- `otp_expires_at`

---

### 🔧 API Functions and Endpoints

#### **Authentication Controller Functions**

| Function | HTTP Method | Endpoint | Purpose |
|----------|-------------|----------|---------|
| `signup` | POST | `/auth/signup` | Register new user with email verification |
| `verifyEmail` | POST | `/auth/verify-email` | Verify email using Cognito confirmation code |
| `resendConfirmationCode` | POST | `/auth/resend-confirmation-code` | Resend email verification code |
| `sendLoginOtp` | POST | `/auth/send-login-otp` | Send login OTP to user's email |
| `verifyLoginOtp` | POST | `/auth/verify-login-otp` | Verify OTP and complete login |

| `signinViaPassword` | POST | `/auth/signin-via-password` | Login using email and password |
| `refreshCognitoTokens` | POST | `/auth/refresh-cognito` | Refresh expired Cognito tokens |
| `sendPasswordResetOtp` | POST | `/auth/send-password-reset-otp` | Send password reset OTP |
| `confirmPasswordReset` | POST | `/auth/confirm-password-reset` | Confirm password reset with OTP |
| `cleanupExpired` | POST | `/auth/cleanup-expired` | Clean up expired registrations |

#### **Authentication Service Functions**

| Function | Purpose | Database Operations |
|----------|---------|-------------------|
| `signup()` | Create user in local DB and Cognito | INSERT into `users`, CREATE in Cognito |
| `verifyEmailByEmailOtp()` | Verify email and activate user | UPDATE `users` status, SET `email_verified_at` |
| `resendEmailVerification()` | Resend verification email | SELECT from `users`, RESEND via Cognito |
| `sendLoginOtp()` | Generate and send login OTP | INSERT into `login_otps`, SEND email |
| `verifyLoginOtp()` | Verify OTP and generate tokens | SELECT from `login_otps`, UPDATE `users`, GENERATE Cognito tokens |
| `signinViaPassword()` | Login with email and password | SELECT from `users`, AUTHENTICATE via Cognito |
| `sendPasswordResetOtp()` | Send password reset OTP | SELECT from `users`, SEND via Cognito |
| `confirmPasswordReset()` | Confirm password reset | SELECT from `users`, RESET via Cognito |

#### **Cognito Service Functions**

| Function | Purpose | AWS Cognito Operations |
|----------|---------|----------------------|
| `createCognitoUserWithEmailVerification()` | Create user with email verification | SignUpCommand |
| `createCognitoUserAndSendVerification()` | Create user and send verification | AdminCreateUserCommand |
| `verifyConfirmationCode()` | Verify email confirmation code | ConfirmSignUpCommand |
| `resendConfirmationCode()` | Resend confirmation code | ResendConfirmationCodeCommand |
| `generateCognitoTokensAdmin()` | Generate authentication tokens | AdminInitiateAuthCommand |
| `authenticateUserWithPassword()` | Authenticate user with password | AdminInitiateAuthCommand (ADMIN_NO_SRP_AUTH) |
| `refreshCognitoTokens()` | Refresh expired tokens | InitiateAuthCommand (REFRESH_TOKEN_AUTH) |
| `sendPasswordResetOtp()` | Send password reset OTP | ForgotPasswordCommand |
| `confirmPasswordReset()` | Confirm password reset | ConfirmForgotPasswordCommand |
| `checkUserExists()` | Check if user exists in Cognito | AdminGetUserCommand |
| `setUserPermanentPassword()` | Set permanent password | AdminSetUserPasswordCommand |

---

### 🔄 Authentication Flow

#### **Registration Flow:**
1. **Signup** → Create user in `users` table with `status: 'pending_verification'`
2. **Cognito Creation** → Create user in AWS Cognito with email verification
3. **Email Verification** → User receives confirmation code via email
4. **Verify Email** → Confirm code with Cognito, activate user in local DB
5. **Token Generation** → Generate Cognito tokens for immediate login

#### **Login Flow (OTP-based):**
1. **Send OTP** → Generate 6-digit OTP, store in `login_otps` table
2. **Email Delivery** → Send OTP via email service
3. **Verify OTP** → Validate OTP, generate Cognito tokens
4. **Token Storage** → Store tokens in `users.cognito_tokens` JSON field

#### **Login Flow (Password-based):**
1. **Password Authentication** → Authenticate user with email and password via Cognito
2. **Token Generation** → Generate Cognito tokens upon successful authentication
3. **Token Storage** → Store tokens in `users.cognito_tokens` JSON field

#### **Password Reset Flow:**
1. **Request Reset** → User requests password reset with email
2. **OTP Generation** → Cognito generates and sends reset OTP via email
3. **Verify OTP** → User provides OTP and new password
4. **Password Update** → Cognito updates user's password
5. **Login Ready** → User can now login with new password

#### **Token Management:**
- **Access Token**: Short-lived (1 hour), for API authentication
- **ID Token**: Contains user claims, for user identification
- **Refresh Token**: Long-lived, for token renewal
- **Token Storage**: JSON field in `users` table
- **Token Refresh**: Automatic renewal using refresh token

---

### 🛡️ Security Features

1. **Email Verification**: Required before account activation
2. **Dual Authentication Methods**: OTP-based and password-based login options
3. **Cognito Integration**: AWS-managed authentication with secure token management
4. **Role-based Access**: Granular permissions system
5. **Token Expiration**: Automatic token refresh mechanism
6. **Rate Limiting**: Built-in AWS Cognito rate limiting
7. **Secure Password Management**: Password reset via OTP verification


---