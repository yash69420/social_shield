# 📖 API Reference

This document provides comprehensive documentation for all Social Shield API endpoints.

## 📋 Table of Contents

- [📋 Table of Contents](#-table-of-contents)
- [🌐 Base URLs](#-base-urls)
- [🔒 Authentication](#-authentication)
- [📧 Authentication Endpoints](#-authentication-endpoints)
- [📨 Email Management](#-email-management)
- [🤖 ML Analysis Endpoints](#-ml-analysis-endpoints)
- [👤 User Management](#-user-management)
- [📊 Scores & Analytics](#-scores--analytics)
- [📄 Response Formats](#-response-formats)
- [❌ Error Handling](#-error-handling)
- [🔧 Rate Limiting](#-rate-limiting)
- [📚 SDKs & Libraries](#-sdks--libraries)

## 🌐 Base URLs

### Development

- **Backend API**: `http://localhost:5000`
- **ML Service**: `http://localhost:3000`

### Production

- **Backend API**: `https://your-api-domain.com`
- **ML Service**: `https://your-ml-domain.com`

## 🔒 Authentication

Social Shield uses **JWT (JSON Web Tokens)** for API authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Getting an Access Token

1. Authenticate with Google OAuth
2. Receive JWT token in response
3. Use token for subsequent API calls
4. Token expires in 24 hours

## 📧 Authentication Endpoints

### POST `/api/auth/google-login`

Authenticate user with Google OAuth authorization code.

#### Request

```bash
curl -X POST http://localhost:5000/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{
    "code": "4/0AdQt8qhxxxxxxxxxxxxxxxxxxxxxxx",
    "redirectUri": "http://localhost:5000/api/auth/google/callback"
  }'
```

#### Request Body

| Field         | Type   | Required | Description                     |
| ------------- | ------ | -------- | ------------------------------- |
| `code`        | string | Yes      | Google OAuth authorization code |
| `redirectUri` | string | No       | OAuth redirect URI (optional)   |

#### Response

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ecb54b24a1001f647b8c",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "picture": "https://lh3.googleusercontent.com/a/default-user"
  }
}
```

### GET `/api/auth/google/callback`

OAuth callback endpoint (handled automatically by Google OAuth flow).

### POST `/api/auth/logout`

Logout current user (client-side token invalidation).

#### Request

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

#### Response

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 📨 Email Management

### GET `/api/gmail/emails`

Fetch user's Gmail emails with optional filtering.

#### Request

```bash
curl -X GET "http://localhost:5000/api/gmail/emails?limit=10&pageToken=abc123" \
  -H "Authorization: Bearer <token>"
```

#### Query Parameters

| Parameter   | Type    | Default | Description                        |
| ----------- | ------- | ------- | ---------------------------------- |
| `limit`     | integer | 10      | Number of emails to fetch (max 50) |
| `pageToken` | string  | -       | Pagination token for next page     |
| `query`     | string  | -       | Gmail search query (optional)      |

#### Response

```json
{
  "success": true,
  "emails": [
    {
      "id": "17f4c2d8a1b2c3d4",
      "threadId": "17f4c2d8a1b2c3d4",
      "subject": "Welcome to our service!",
      "from": "noreply@example.com",
      "to": "user@example.com",
      "date": "2024-01-15T10:30:00Z",
      "snippet": "Thank you for signing up...",
      "body": "Full email content here...",
      "headers": [
        {
          "name": "Message-ID",
          "value": "<message-id@example.com>"
        }
      ],
      "attachments": []
    }
  ],
  "nextPageToken": "def456",
  "totalEstimate": 150
}
```

### GET `/api/gmail/email/:id`

Get detailed information about a specific email.

#### Request

```bash
curl -X GET "http://localhost:5000/api/gmail/email/17f4c2d8a1b2c3d4" \
  -H "Authorization: Bearer <token>"
```

#### Response

```json
{
  "success": true,
  "email": {
    "id": "17f4c2d8a1b2c3d4",
    "subject": "Important Account Update",
    "from": "security@bank.com",
    "body": "Dear customer, please verify your account...",
    "headers": [
      {
        "name": "SPF",
        "value": "pass"
      },
      {
        "name": "DKIM",
        "value": "pass"
      }
    ],
    "attachments": [
      {
        "filename": "document.pdf",
        "mimeType": "application/pdf",
        "size": 1024
      }
    ]
  }
}
```

## 🤖 ML Analysis Endpoints

### POST `/api/analyze`

Analyze email content for sentiment and security threats.

#### Request

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Congratulations! You have won $1,000,000! Click here to claim your prize now!",
    "subject": "URGENT: Claim Your Prize Now!",
    "sender": "winner@suspicious-lottery.com",
    "headers": {
      "X-Originating-IP": "192.168.1.1",
      "SPF": "fail",
      "DKIM": "none"
    }
  }'
```

#### Request Body

| Field     | Type   | Required | Description                |
| --------- | ------ | -------- | -------------------------- |
| `text`    | string | Yes      | Email body content         |
| `subject` | string | Yes      | Email subject line         |
| `sender`  | string | Yes      | Sender email address       |
| `headers` | object | No       | Email headers for analysis |

#### Response

```json
{
  "success": true,
  "analysis": {
    "sentiment": "negative",
    "sentiment_confidence": 0.92,
    "sentiment_scores": {
      "positive": 0.05,
      "neutral": 0.03,
      "negative": 0.92
    },
    "suspicion_score": 0.87,
    "prediction": "Suspicious",
    "confidence": 0.94,
    "risk_factors": [
      {
        "factor": "Urgent language",
        "score": 0.8,
        "description": "Email contains urgent call-to-action language"
      },
      {
        "factor": "Financial incentive",
        "score": 0.9,
        "description": "Email promises large monetary reward"
      },
      {
        "factor": "Suspicious sender",
        "score": 0.7,
        "description": "Sender domain has low reputation"
      }
    ],
    "analysis_time": 245,
    "model_version": "v2.1.0"
  }
}
```

### POST `/api/analyze/batch`

Analyze multiple emails in a single request.

#### Request

```bash
curl -X POST http://localhost:3000/api/analyze/batch \
  -H "Content-Type: application/json" \
  -d '{
    "emails": [
      {
        "id": "email_1",
        "text": "Hello, this is a normal email.",
        "subject": "Weekly newsletter",
        "sender": "newsletter@company.com"
      },
      {
        "id": "email_2",
        "text": "Click here to claim your prize!",
        "subject": "You won!",
        "sender": "noreply@suspicious.com"
      }
    ]
  }'
```

#### Response

```json
{
  "success": true,
  "results": [
    {
      "id": "email_1",
      "analysis": {
        "sentiment": "neutral",
        "suspicion_score": 0.1,
        "prediction": "Safe"
      }
    },
    {
      "id": "email_2",
      "analysis": {
        "sentiment": "positive",
        "suspicion_score": 0.85,
        "prediction": "Suspicious"
      }
    }
  ],
  "processed": 2,
  "failed": 0,
  "total_time": 450
}
```

## 👤 User Management

### GET `/api/user/profile`

Get current user's profile information.

#### Request

```bash
curl -X GET http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer <token>"
```

#### Response

```json
{
  "success": true,
  "user": {
    "id": "60d5ecb54b24a1001f647b8c",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/a/default-user",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-15T10:30:00Z",
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "analysis_auto_save": true
    }
  }
}
```

### PUT `/api/user/profile`

Update user profile information.

#### Request

```bash
curl -X PUT http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "theme": "light",
      "notifications": false
    }
  }'
```

#### Response

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "60d5ecb54b24a1001f647b8c",
    "preferences": {
      "theme": "light",
      "notifications": false,
      "analysis_auto_save": true
    }
  }
}
```

### DELETE `/api/user/delete`

Delete user account and all associated data.

#### Request

```bash
curl -X DELETE http://localhost:5000/api/user/delete \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "confirm": true
  }'
```

#### Response

```json
{
  "success": true,
  "message": "User data deleted successfully",
  "clearAllData": true,
  "details": {
    "scoresDeleted": 25,
    "userDeleted": true,
    "analysisDeleted": 150
  }
}
```

## 📊 Scores & Analytics

### GET `/api/scores`

Get user's analysis scores and gaming statistics.

#### Request

```bash
curl -X GET "http://localhost:5000/api/scores?email=user@example.com&limit=10" \
  -H "Authorization: Bearer <token>"
```

#### Query Parameters

| Parameter | Type    | Default      | Description                |
| --------- | ------- | ------------ | -------------------------- |
| `email`   | string  | current user | User email address         |
| `limit`   | integer | 10           | Number of scores to return |

#### Response

```json
{
  "success": true,
  "scores": [
    {
      "id": "60d5ecb54b24a1001f647b8d",
      "email": "user@example.com",
      "score": 85,
      "game_type": "phishing_detection",
      "date": "2024-01-15T10:30:00Z",
      "details": {
        "correct_answers": 17,
        "total_questions": 20,
        "time_taken": 180
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_scores": 25
  }
}
```

### POST `/api/scores`

Save a new analysis score.

#### Request

```bash
curl -X POST http://localhost:5000/api/scores \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "score": 92,
    "game_type": "sentiment_analysis",
    "details": {
      "correct_answers": 23,
      "total_questions": 25,
      "time_taken": 200
    }
  }'
```

#### Response

```json
{
  "success": true,
  "message": "Score saved successfully",
  "score": {
    "id": "60d5ecb54b24a1001f647b8e",
    "email": "user@example.com",
    "score": 92,
    "date": "2024-01-15T11:00:00Z"
  }
}
```

### GET `/api/scores/stats`

Get statistical summary of user's performance.

#### Request

```bash
curl -X GET "http://localhost:5000/api/scores/stats?email=user@example.com" \
  -H "Authorization: Bearer <token>"
```

#### Response

```json
{
  "success": true,
  "stats": {
    "avgScore": 78.5,
    "maxScore": 95,
    "totalGames": 15,
    "improvement": {
      "trend": "increasing",
      "percentage": 12.3
    },
    "categories": {
      "phishing_detection": {
        "avgScore": 82.1,
        "totalGames": 8
      },
      "sentiment_analysis": {
        "avgScore": 74.2,
        "totalGames": 7
      }
    }
  }
}
```

## 📄 Response Formats

### Standard Success Response

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [
    /* array of items */
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "per_page": 10,
    "total_items": 47,
    "has_next": true,
    "has_prev": false
  }
}
```

## ❌ Error Handling

### HTTP Status Codes

| Code | Status                | Description                   |
| ---- | --------------------- | ----------------------------- |
| 200  | OK                    | Request successful            |
| 201  | Created               | Resource created successfully |
| 400  | Bad Request           | Invalid request data          |
| 401  | Unauthorized          | Authentication required       |
| 403  | Forbidden             | Insufficient permissions      |
| 404  | Not Found             | Resource not found            |
| 429  | Too Many Requests     | Rate limit exceeded           |
| 500  | Internal Server Error | Server error                  |

### Error Codes

| Code                  | Description                        |
| --------------------- | ---------------------------------- |
| `VALIDATION_ERROR`    | Request validation failed          |
| `AUTH_TOKEN_INVALID`  | JWT token is invalid or expired    |
| `AUTH_TOKEN_MISSING`  | Authorization header missing       |
| `GOOGLE_AUTH_FAILED`  | Google OAuth authentication failed |
| `EMAIL_NOT_FOUND`     | Requested email not found          |
| `ML_SERVICE_ERROR`    | Machine learning service error     |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded            |
| `DATABASE_ERROR`      | Database operation failed          |

### Example Error Responses

#### Authentication Error

```json
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_INVALID",
    "message": "JWT token has expired",
    "details": {
      "expired_at": "2024-01-15T09:30:00Z"
    }
  }
}
```

#### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "email",
      "message": "Email address is required",
      "value": null
    }
  }
}
```

#### Rate Limit Error

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "limit": 100,
      "window": "1 hour",
      "retry_after": 3600
    }
  }
}
```

## 🔧 Rate Limiting

### Limits

| Endpoint       | Limit         | Window   |
| -------------- | ------------- | -------- |
| Authentication | 10 requests   | 1 minute |
| Email Analysis | 50 requests   | 1 hour   |
| Email Fetching | 100 requests  | 1 hour   |
| General API    | 1000 requests | 1 hour   |

### Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642248000
```

## 📚 SDKs & Libraries

### JavaScript/Node.js

```bash
npm install social-shield-sdk
```

```javascript
import SocialShield from "social-shield-sdk";

const client = new SocialShield({
  apiKey: "your-api-key",
  baseUrl: "https://api.social-shield.com",
});

// Analyze email
const result = await client.analyzeEmail({
  text: "Email content...",
  subject: "Subject line",
  sender: "sender@example.com",
});
```

### Python

```bash
pip install social-shield-python
```

```python
from social_shield import SocialShieldClient

client = SocialShieldClient(
    api_key='your-api-key',
    base_url='https://api.social-shield.com'
)

# Analyze email
result = client.analyze_email(
    text='Email content...',
    subject='Subject line',
    sender='sender@example.com'
)
```

### cURL Examples

Save common requests as shell scripts:

```bash
#!/bin/bash
# analyze-email.sh

EMAIL_TEXT="$1"
SUBJECT="$2"
SENDER="$3"
TOKEN="$4"

curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"text\": \"$EMAIL_TEXT\",
    \"subject\": \"$SUBJECT\",
    \"sender\": \"$SENDER\"
  }"
```

---

## 📞 Support

For API support:

- **GitHub Issues**: Technical problems and bug reports
- **Discord**: Real-time community support
- **Email**: api-support@social-shield.com
- **Documentation**: Check troubleshooting guides

---

_Last updated: January 2024_
