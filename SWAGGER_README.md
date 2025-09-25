# Miftah.Ai Backend API - Swagger Documentation /working

## Overview

This repository contains a comprehensive Swagger/OpenAPI 3.0 specification for the Miftah.Ai Backend API, covering the following modules:

- **Authentication** - User registration, email verification, and OTP-based login
- **User Management** - User profiles and admin user management
- **Roles & Permissions** - Role-based access control system
- **KYC Verification** - Know Your Customer document verification

## Files

- `swagger.yaml` - Complete OpenAPI 3.0 specification
- `SWAGGER_README.md` - This documentation file

## API Base URL

- **API Server**: `http://localhost:5000/api/v1`

## Authentication

The API uses JWT tokens from AWS Cognito for authentication. All endpoints (except authentication endpoints) require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## How to Use the Swagger Documentation

### Option 1: Swagger UI (Recommended)

1. **Online Swagger Editor**:
   - Go to [https://editor.swagger.io/](https://editor.swagger.io/)
   - Copy the contents of `swagger.yaml` and paste it into the editor
   - The documentation will be rendered with an interactive interface

2. **Local Swagger UI**:
   ```bash
   # Install swagger-ui-serve globally
   npm install -g swagger-ui-serve
   
   # Serve the documentation locally
   swagger-ui-serve swagger.yaml
   ```
   Then open `http://localhost:3000` in your browser.

### Option 2: Postman

1. Import the `swagger.yaml` file into Postman
2. Postman will automatically generate a collection with all endpoints
3. Set up environment variables for base URLs and authentication tokens

### Option 3: Other Tools

The OpenAPI 3.0 specification can be imported into various API testing and documentation tools:
- Insomnia
- REST Client (VS Code extension)
- API Blueprint
- Stoplight Studio

## Key Features

### Authentication Flow
1. **Registration**: `POST /api/v1/auth/signup`
2. **Email Verification**: `POST /api/v1/auth/verify-email`
3. **Login OTP**: `POST /api/v1/auth/send-login-otp`
4. **Verify OTP**: `POST /api/v1/auth/verify-login-otp`
5. **Token Refresh**: `POST /api/v1/auth/refresh-cognito`

### User Management
- Get current user profile: `GET /api/v1/users/me`
- Admin user management: `GET /api/v1/users`, `POST /api/v1/users`, `GET /api/v1/users/{id}`

### Roles & Permissions
- Role management: `GET /api/v1/roles`, `POST /api/v1/roles`, `PUT /api/v1/roles/{id}`, `DELETE /api/v1/roles/{id}`
- Permission management: `GET /api/v1/permissions`, `POST /api/v1/permissions/roles/{roleId}`
- User role assignment: `POST /api/v1/roles/assign`

### KYC Verification
- Submit documents: `POST /api/v1/kyc/submit`
- Check status: `GET /api/v1/kyc/status`
- View history: `GET /api/v1/kyc/history`
- Admin review: `GET /api/v1/kyc/admin/review-queue`, `PUT /api/v1/kyc/admin/review/{kycId}`

## File Upload Support

KYC endpoints support file uploads with the following specifications:
- **Content-Type**: `multipart/form-data`
- **Max files**: 5 files per request
- **Max file size**: 10MB per file
- **Supported formats**: PDF, JPEG, PNG, GIF

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "data": null
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Testing the API

### Prerequisites
1. Server running on configured ports
2. AWS Cognito properly configured
3. Valid email address for testing
4. API testing tool (Postman, Swagger UI, etc.)

### Example Test Flow

1. **Register a new user**:
   ```bash
   POST http://localhost:5000/api/v1/auth/signup
   {
     "email": "testuser@example.com",
     "fullName": "Test User",
     "phoneNumber": "1234567890"
   }
   ```

2. **Verify email** (use code from email):
   ```bash
   POST http://localhost:5000/api/v1/auth/verify-email
   {
     "email": "testuser@example.com",
     "otp": "123456"
   }
   ```

3. **Login with OTP**:
   ```bash
   POST http://localhost:5000/api/v1/auth/send-login-otp
   {
     "email": "testuser@example.com"
   }
   ```

4. **Verify login OTP**:
   ```bash
   POST http://localhost:5000/api/v1/auth/verify-login-otp
   {
     "email": "testuser@example.com",
     "otp": "123456"
   }
   ```

5. **Use the returned access token for authenticated requests**:
   ```bash
   GET http://localhost:5000/api/v1/users/me
   Authorization: Bearer <access_token>
   ```

## Schema Validation

The Swagger specification includes comprehensive schema validation for:
- Request body validation
- Query parameter validation
- Path parameter validation
- Response schema definitions
- Error response schemas

## Security

- JWT Bearer token authentication
- Role-based access control
- Permission-based endpoint protection
- File upload security (size limits, type validation)
- Input validation and sanitization

## Support

For questions or issues with the API documentation:
- Check the existing API documentation in the `DOCS/` folder
- Review the test files in the `__tests__/` folder
- Contact the development team

## Version

- **API Version**: 1.0.0
- **OpenAPI Specification**: 3.0.3
- **Last Updated**: January 2025
