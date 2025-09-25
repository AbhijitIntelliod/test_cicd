# KYC API Documentation


## Base URL
```
http://localhost:5000/api/v1/kyc
```

## Authentication
All endpoints require JWT authentication. Include the Access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Route Structure
The API routes are organized with specific admin routes before generic user routes to prevent conflicts. Admin routes (prefixed with `/admin/`) are matched before the generic `/:kycId` route to ensure proper routing.

**Important:** The `/admin/review-queue` route is positioned before the generic `/:kycId` route to prevent the string "review-queue" from being interpreted as a KYC ID parameter, which would cause database errors.

## API Endpoints

### User Endpoints

### 1. Submit KYC Documents
Submit identity documents for verification.

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

**Error Responses:**
- `400 Bad Request`: Invalid document type, missing files, or validation errors
- `401 Unauthorized`: Invalid or missing JWT token
- `404 Not Found`: User not found
- `400 Bad Request`: Email not verified or KYC already submitted

---

### 2. Resubmit KYC Documents
Resubmit documents after rejection.

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

**Error Responses:**
- `400 Bad Request`: No rejected KYC found or KYC already in progress
- `401 Unauthorized`: Invalid or missing JWT token

---

### 3. Get User KYC Status
Get current KYC status for the authenticated user.

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

---

### 4. Get KYC History
Get KYC submission history for the authenticated user.

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

---

### 5. Get KYC by ID
Get specific KYC verification details.

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

---

### 6. Delete KYC Document
Delete a specific document from a KYC submission.

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

**Error Responses:**
- `400 Bad Request`: Cannot delete the last document
- `403 Forbidden`: Access denied
- `404 Not Found`: Document not found

---

## Admin Endpoints

### 7. Get KYC Review Queue
Get pending KYC submissions for review (Admin only).

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

---

### 8. Review KYC
Approve or reject a KYC submission (Admin only).

**Endpoint:** `PUT /api/v1/kyc/admin/review/:kycId`

**Authentication:** Required (Admin with `kyc_verifications:approve` permission)

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Documents verified successfully"
}
```

**For rejection:**
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

**Error Responses:**
- `400 Bad Request`: Invalid status or missing rejection reason
- `404 Not Found`: KYC not found or already reviewed

---

### 9. Update KYC Status
Update KYC status to under_review or pending (Admin only).

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

---

### 10. Get KYC Statistics
Get KYC statistics and analytics (Admin only).

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

---

## File Upload Guidelines

### Supported File Types
- PDF documents
- Image files (JPEG, PNG, GIF)
- Maximum file size: 10MB per file
- Maximum files per submission: 5

### File Upload Process
1. Use `multipart/form-data` content type
2. Include files in the `documents` field
3. Files are automatically uploaded to S3
4. Signed URLs are generated for document access
5. URLs expire after 1 week for security

---

## Status Codes

| Status | Description |
|--------|-------------|
| `pending` | KYC submitted, awaiting review |
| `under_review` | KYC is being reviewed by admin |
| `approved` | KYC approved and user verified |
| `rejected` | KYC rejected, user can resubmit |
| `expired` | KYC expired (if applicable) |

---

## File

- File uploads: 5 files per request (max. file size : 10 mb)

- Document access: Signed URLs expire after 1 week

---

## Troubleshooting

### Common Issues

**Error: "invalid input syntax for type bigint: 'review-queue'"**
- This error occurs when the `/admin/review-queue` route is not properly positioned before the generic `/:kycId` route
- The route ordering ensures that specific admin routes are matched before generic parameterized routes
- If you encounter this error, verify that admin routes are defined before user routes in the route configuration

**Route Matching Order:**
1. User routes (`/submit`, `/resubmit`, `/status`, `/history`)
2. Admin routes (`/admin/review-queue`, `/admin/statistics`, `/admin/review/:kycId`, `/admin/status/:kycId`)
3. Generic user routes (`/:kycId`, `/:kycId/document`)
