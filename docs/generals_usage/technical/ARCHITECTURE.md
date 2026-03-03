# Architecture Plan - Hello World API with Multi-Database Support

## 1. Overview

**Project:** Production-ready Hello World API template with multi-database support  
**Stack:** Bun (v1.3.9) + Hono (v4.6.0) + TypeScript (v5.7.0)  
**Architecture:** Layered (Routes → Controllers → Services → Repositories → Models → Database)

---

## 2. Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Runtime | Bun | JavaScript/TypeScript runtime |
| Framework | Hono | Web framework |
| Language | TypeScript | Type safety |
| MongoDB Driver | mongodb | Native MongoDB driver |
| MySQL Driver | mysql2 | MySQL connection pool |
| PostgreSQL | postgres | Native PostgreSQL driver |
| SQLite | bun:sqlite | SQLite database (built-in) |
| Password Hashing | bcrypt | Password hashing |

---

## 3. Database Controls

You can enable or disable database connections in your `.env` file. If a database is disabled, the application will not attempt to connect to it during startup.

| Env Variable | Default | Description |
|--------------|---------|-------------|
| `DB_MONGO_ENABLED` | `true` | Enable/Disable MongoDB connection |
| `DB_MYSQL_ENABLED` | `true` | Enable/Disable MySQL connection |
| `DB_PG_ENABLED` | `true` | Enable/Disable PostgreSQL connection |
| `DB_SQLITE_ENABLED` | `true` | Enable/Disable SQLite connection |

---

```
project-root/
├── src/
│   ├── app.ts                      # Hono app instance, middleware registration
│   ├── index.ts                    # Server bootstrap, DB connections
│   │
│   ├── configs/
│   │   ├── index.ts                # Config loader (env vars)
│   │   └── constants.ts            # App constants
│   │
│   ├── database/
│   │   ├── index.ts                # Export all connections
│   │   ├── mysql.connection.ts     # MySQL pool connection
│   │   ├── mongo.connection.ts     # MongoDB connection
│   │   ├── pg.connection.ts        # PostgreSQL connection (New!)
│   │   ├── redis.connection.ts     # Redis connection (New!)
│   │   └── sqlite.connection.ts    # SQLite connection
│   │
│   ├── services/                   # Business Logic Layer
│   │   ├── mysql/
│   │   │   └── user.service.ts
│   │   ├── mongo/
│   │   │   └── user.service.ts
│   │   ├── pg/
│   │   │   └── user.service.ts
│   │   └── sqlite/
│   │       └── user.service.ts
│   │
│   ├── repositories/               # Raw Query Layer
│   │   ├── mysql/
│   │   │   └── user.repository.ts
│   │   ├── mongo/
│   │   │   └── user.repository.ts
│   │   ├── pg/
│   │   │   └── user.repository.ts
│   │   └── sqlite/
│   │       └── user.repository.ts
│   │
│   ├── controllers/
│   │   ├── hello.controller.ts     # Hello World endpoints
│   │   └── user.controller.ts      # User CRUD endpoints (Calls Services)
│   │
│   ├── routes/
│   │   ├── index.ts                # Route aggregator
│   │   ├── hello.routes.ts         # Hello routes
│   │   └── user.routes.ts          # User routes
│   │
│   ├── middlewares/
│   │   ├── index.ts                # Export middlewares
│   │   ├── errorHandler.ts         # Global error handler
│   │   ├── rateLimiter.ts          # Per-IP rate limiting
│   │   └── logger.ts               # Request logging
│   │
│   └── utils/
│       ├── logger.ts               # File logging utility
│       └── response.ts             # Standard response formatter
│
├── scripts/
│   ├── migrations/                 # Database schema versioning
│   │   ├── mysql/
│   │   ├── mongo/
│   │   ├── pg/
│   │   ├── sqlite/
│   │   ├── index.ts
│   │   └── utils.ts
│   │
│   ├── seeders/                    # Sample/Initial data population
│   │   ├── index.ts
│   │   ├── mysql.seeder.ts
│   │   ├── mongo.seeder.ts
│   │   └── sqlite.seeder.ts
│   │
│   ├── m2m/                        # M2M client management utilities
│   ├── stubs/                      # Code generation templates
│   │
│   ├── make.ts                     # CLI: Code generation
│   ├── migrate.ts                  # CLI: Database migration
│   └── seed.ts                     # CLI: Database seeder
│
├── storages/
│   ├── logs/
│   │   └── {YYYY-MM-DD}/
│   │       ├── errors.txt
│   │       ├── info.txt
│   │       ├── warning.txt
│   │       └── debug.txt
│   └── database/
│       └── sqlite/
│           └── dev.db
│
├── docs/
│   ├── setup/
│   │   ├── GETTING_STARTED.md
│   │   └── DEPLOYMENT.md
│   ├── technical/
│   │   ├── ARCHITECTURE.md
│   │   ├── MIGRATIONS.md
│   │   ├── SEEDERS.md
│   │   └── MAKE_CLI.md
│   ├── features/
│   │   └── QUEUES.md
│   └── api/
│       └── API.md
│
├── .env.dev                        # Development environment
├── .env.prod                       # Production environment (template)
├── .env.example                    # Example env file
├── package.json
└── tsconfig.json
```

---

## 4. Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Routes** | Define endpoints and attach validation/middlewares |
| **Controllers** | Handle request/response, parse params, call services |
| **Services** | Business logic, hashing, caching, and Repo orchestration |
| **Repositories** | High-performance raw DB queries (Native SQL/NoSQL) |
| **Schemas** | Data shapes, Zod validation rules, and TypeScript types |
| **Middlewares** | Error handling, rate limiting, logging, security, request-id, compression |
| **Utils** | Logger, response, cache, and error model helpers |
| **Configs** | Environment variables, constants |
| **Migrations** | Database schema versioning |
| **Seeders** | Sample/Initial data population |
| **Make CLI** | Code generation (Controllers, Repositories, etc.) |

---

## 5. Error Handling Architecture

Sistem menggunakan **Unified AppError** (extended dari `Error`) dengan dukungan payload data:
- **`AppError`**: Base class dengan properti `statusCode` dan `data`.
- **`ValidationError`**: Secara otomatis menangkap dan memformat error dari Zod menjadi pesan yang lebih ramah pengguna.
- **Global `errorHandler`**: Menangkap semua error di level top-level, merekam log dengan `requestId`, dan mengembalikan response standar.

---

## 5. Middleware Pipeline

```
Request → RequestId → Compress → CORS → SecureHeaders → JSON Only → Rate Limiter → Logger → Routes → ErrorHandler → Response
```

---

## 6. Connection Pool Configuration

| Database | Setting | Value |
|----------|---------|-------|
| **MongoDB** | maxPoolSize | 10 |
| **MongoDB** | minPoolSize | 2 |
| **MySQL** | connectionLimit | 10 |
| **MySQL** | waitForConnections | true |
| **SQLite** | N/A | (single file) |

---

## 8. Data Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             Middleware Stack                                │
│  ┌──────────┐ ┌──────────┐ ┌─────┐ ┌───────────────┐ ┌──────────┐ ┌─────┐   │
│  │RequestId │→│ Compress │→│CORS │→│SecureHeaders │→│RateLimit │→│Log  │   │
│  └──────────┘ └──────────┘ └─────┘ └───────────────┘ └──────────┘ └─────┘   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│              Router                     │
│  GET /, GET /health, /api/users/*       │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│           Controller                    │
│  - Validate request                     │
│  - Call service                         │
│  - Format response                      │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│             Service                     │
│  - Business logic                       │
│  - Password hashing                     │
│  - Call repository                      │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│           Repository                    │
│  - Abstract DB operations               │
│  - CRUD methods                         │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│              Model                      │
│  - Database-specific queries            │
│  - MySQL / MongoDB / SQLite             │
└──────────────────┬──────────────────────┘
                   ▼
┌─────────────────────────────────────────┐
│          Database                       │
│  ┌───────┐ ┌───────┐ ┌───────┐         │
│  │ MySQL │ │ MongoDB│ │SQLite │         │
│  └───────┘ └───────┘ └───────┘         │
└─────────────────────────────────────────┘
```
