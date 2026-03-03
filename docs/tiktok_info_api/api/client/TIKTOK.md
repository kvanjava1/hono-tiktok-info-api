# TikTok Profile API

This endpoint allows fetching structured data from TikTok profiles. It supports three processing modes: **Instant** (synchronous), **Callback** (asynchronous), and **Status Polling**.

## 📌 Endpoint
`POST /api/tiktok/profiles`

---

## ⚡ Mode 1: Instant (Synchronous)
Use this mode for real-time lookups where you need the data immediately.

### Constraints
- Strictly limited to **1 username**.
- Request will timeout if fetching takes too long (standard HTTP timeout).

### Username Format
The system automatically normalizes usernames. You can provide them with or without the `@` prefix.
- **Rules**:
  - Must be 2-24 characters (not including `@`).
  - Can only contain letters, numbers, underscores, and periods.
  - Cannot end with a period.
- **Example**: `@khaby.lame` or `khaby.lame` are both acceptable.

### Request
```json
{
  "request": {
    "process": {
      "type": "instant"
    }
  },
  "usernames": ["@khaby.lame"]
}
```

### Response (200 OK)
```json
{
    "status": "success",
    "message": "TikTok Profiles processed",
    "data": [
        {
            "username": "@khaby.lame",
            "status": "success",
            "data": {
                "user": { ... },
                "stats": { ... }
            },
            "_from_cache": true
        }
    ]
}
```

---

## 🏗 Mode 2: Callback (Asynchronous)
Use this mode for bulk processing (1,000+ users). The system will queue the job and notify you via a webhook when finished.

### Constraints
- **Concurrency Lock**: Only **1 active** callback job is allowed per Client ID. You must wait for the current job to finish before starting a new one.
- **Batching**: Jobs are processed in batches of 10 users every 1 second to ensure stability.

### Request
```json
{
  "request": {
    "process": {
      "type": "callback",
      "callback": {
        "url": "https://your-api.com/webhooks/tiktok"
      }
    }
  },
  "usernames": ["@user1", "@user2", "@user3"]
}
```

### Immediate Response (200 OK)
```json
{
    "status": "success",
    "message": "TikTok Profiles processing queued",
    "data": {
        "request_id": "fe99c57d-bd8a-4e04-b53a-f6e46654207b",
        "total_username": 3,
        "total_process": 0,
        "total_error": 0,
        "total_success": 0,
        "process_status": "pending"
    }
}
```

---

## 🔍 Mode 3: Status Polling
You can check the current progress of a callback job using the `request_id`.

### � Endpoint
`GET /api/tiktok/profiles/:requestId/request`

### Response (200 OK)
```json
{
    "status": "success",
    "message": "TikTok Request status retrieved",
    "data": {
        "request_id": "fe99c57d-bd8a-4e04-b53a-f6e46654207b",
        "total_username": 10,
        "total_process": 5,
        "total_error": 0,
        "total_success": 5,
        "process_percentage": 50,
        "process_status": "processing",
        "created_at": "2024-02-22 15:00:00",
        "result": null
    }
}
```

---

## �🔗 Webhook Payload (POST)
Once completed, the system will send a POST request to your `callback.url`.

```json
{
  "status": "success",
  "message": "TikTok Profiles processed",
  "data": {
    "request_id": "5a7b7a4a...",
    "total_username": 3,
    "total_process": 3,
    "total_success": 3,
    "total_error": 0,
    "process_percentage": 100,
    "process_status": "done",
    "created_at": "2024-02-22 15:00:00",
    "result": [
      { "username": "@user1", "status": "success", "data": { ... } },
      ...
    ]
  }
}
```

---

## 🛑 Mode 4: Request Cancellation
You can cancel an active callback job if it is still in `pending` or `processing` status.

### 📌 Endpoint
`POST /api/tiktok/profiles/:requestId/request/cancel`

### Response (200 OK)
```json
{
    "status": "success",
    "message": "TikTok Request cancellation processed"
}
```

> [!NOTE]
> **Graceful Stop**: The system uses cooperative cancellation. It will stop processing as soon as the current batch of 10 usernames is finished.

---

## ❌ Errors & Validation

Endpoint `/api/tiktok/profiles` menggunakan **Zod Validation** yang ketat. Jika JSON tidak sesuai skema, sistem akan mengembalikan detail kesalahan field.

### Validation Rules
- **usernames**: Minimal 1 username wajib ada.
- **request.process.type**: Harus berupa `"instant"` atau `"callback"`.
- **Logic Conditional**:
  - Jika `type` adalah `"callback"`, maka `callback.url` **wajib** ada dan valid.
  - Jika `type` adalah `"instant"`, maka `callback` bersifat opsional.

### Example Validation Error
```json
{
  "status": "error",
  "message": "Validation failed: request.process: Callback URL is required for type \"callback\"",
  "data": {
    "request": {
      "process": {
        "callback": { "_errors": ["Callback URL is required for type \"callback\""] }
      }
    }
  }
}
```

## ❌ Common Error Codes

| Status | Code | Meaning |
| :--- | :--- | :--- |
| **400** | `VALIDATION_ERROR` | Request is already `done` or `cancelled`. |
| **403** | `FORBIDDEN` | You are trying to access a `request_id` that doesn't belong to you. |
| **404** | `NOT_FOUND` | The `request_id` you provided does not exist. |
| **409** | `CONFLICT` | You already have a job in `pending` or `processing` status. |
| **401** | `UNAUTHORIZED` | Invalid or expired M2M Token. |
| **429** | `RATE_LIMIT` | You have exceeded your hourly request quota. |
