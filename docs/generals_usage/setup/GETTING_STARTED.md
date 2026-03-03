# Getting Started Guide

Welcome to the **Multi-Database Hono API** template. This project is a production-ready boilerplate built with Bun, Hono, and TypeScript, supporting MySQL, MongoDB, PostgreSQL, and SQLite with built-in Redis caching.

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:
- [Bun](https://bun.sh/) (**v1.3.9** or higher)
- [Docker](https://www.docker.com/) (Recommended for running databases locally)
- Access to your target databases (MySQL, MongoDB, PostgreSQL, or Redis)

## 💻 Tech Stack
- **Bun** `v1.3.9` | **Hono** `v4.6.0` | **BullMQ** `v5.69.3` | **Zod** `v4.3.6`

---

## 📦 Installation

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Setup environment setup:**
   ```bash
   cp .env.example .env.dev
   ```

3. **Configure Database Toggles:**
   Open `.env.dev` and enable the databases you want to use:
   ```env
   DB_MYSQL_ENABLED=true
   DB_MONGO_ENABLED=false
   DB_PG_ENABLED=true
   DB_SQLITE_ENABLED=true
   DB_REDIS_ENABLED=true
   ```

---

## 🛠 Database Setup

### 1. Run Migrations
Set up your tables/collections for your enabled databases:
```bash
# Run all enabled migrations
bun run migrate:dev

# Run for a specific target
bun run migrate:dev:pg
```

### 2. Seed Data
Populate your database with initial mockup data:
```bash
# Seed all enabled databases
bun run seed:dev

# Seed a specific target/file
bun run seed:dev:pg
```

---

## 🏃 Running the Application

### Development Mode (with hot-reload)
```bash
bun run dev
```
The server will start on `http://localhost:8080`.

### Production Mode
```bash
bun run start
```

---

## 🏗 Project Architecture

This project follows a professional 3-layer architecture:

1. **Controllers**: Handle HTTP requests/responses (Hono).
2. **Services**: Orchestrate business logic, hashing, and caching.
3. **Repositories**: Execute raw, high-performance database queries.

### Directory Structure
```text
src/
├── controllers/    # API Request Handlers
├── services/       # Business Logic & Caching Layer
├── repositories/   # Raw Database Query Layer
├── routes/         # Hono Route Definitions
├── database/       # Connection Blueprints
├── schemas/        # Zod Validation & Types
├── utils/          # Logger, Response, & Cache Helpers
└── configs/        # Environment & Constants
```

---

## ⚡ Make CLI (Code Generation)

Speed up your development using our custom Laravel-style CLI:

```bash
# Generate a new migration
bun run make migration pg add_profile_table

# Generate a new seeder
bun run make seeder pg ProfileSeeder

# Generate the 3-layer architecture for a feature
bun run make controller Profile
bun run make service pg Profile
bun run make repository pg Profile
```

---

## 📖 Related Documentation

- [Architecture Overview](../technical/ARCHITECTURE.md)
- [API Endpoints](../api/API.md)
- [Migration Guide](../technical/MIGRATIONS.md)
- [Seeder Guide](../technical/SEEDERS.md)
- [Make CLI Reference](../technical/MAKE_CLI.md)
