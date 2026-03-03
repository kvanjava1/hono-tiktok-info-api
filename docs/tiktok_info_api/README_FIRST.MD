# 📖 TikTok Info API Documentation: Start Here

Welcome! This folder contains the complete documentation for the **TikTok Info API**. To help you find what you need quickly, here is an overview of the directory structure:

### ⚙️ Core Technology Stack
- **Bun**: `v1.3.9`
- **Hono**: `v4.6.0`
- **BullMQ**: `v5.69.3`
- **IORedis**: `v5.9.3`
- **Zod**: `v4.3.6`

---

## 📂 Directory Map

### 🔗 [/api](./api)
Documentation for the API endpoints.
- **[client](./api/client)**: Guides for end-users.
    - [AUTHORIZATION.md](./api/client/AUTHORIZATION.md): M2M Token guide.
    - [TIKTOK.md](./api/client/TIKTOK.md): TikTok Profiles usage.
    - [RATELIMIT.md](./api/client/RATELIMIT.md): Usage quotas explained.

### 🗄️ [/databases](./databases)
Technical details about the data storage.
- **[SQLITE.md](./databases/SQLITE.md)**: Detailed schema for local tracking and M2M database.

### 🛠️ [/development](./development)
Everything you need to get the project running locally.
- **[INSTALLATION.md](./development/INSTALLATION.md)**: Beginner-friendly setup guide.

### 🌐 [/deployment](./deployment)
Guides for hosting the application in production environments.
- **[DEPLOYMENT_GUIDE.md](./deployment/DEPLOYMENT_GUIDE.md)**: Beginner-friendly Linux server deployment and PM2 guide.

### 🔧 [/tools](./tools)
Documentation for internal utilities.
- **[admin](./tools/admin)**: Command-line management tools.
    - [CLIENT_MANAGEMENT.md](./tools/admin/CLIENT_MANAGEMENT.md): Managing M2M clients.

---

## 🚀 Recommended Reading Order
1.  **New Developers**: Start with [INSTALLATION.md](./development/INSTALLATION.md) and understand the stack.
2.  **API Users**: Start with [AUTHORIZATION.md](./api/client/AUTHORIZATION.md).
3.  **DevOps & SysAdmins**: Start with [DEPLOYMENT_GUIDE.md](./deployment/DEPLOYMENT_GUIDE.md) and [CLIENT_MANAGEMENT.md](./tools/admin/CLIENT_MANAGEMENT.md).

---

[⬅️ Back to Main Project Documentation](../README.md)
