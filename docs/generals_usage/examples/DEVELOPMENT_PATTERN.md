# 🏗️ Full-Stack Development Pattern

This guide provides a complete blueprint for implementing a new feature in this project, following the layered architecture and best practices.

## 🏁 Example Feature: "Products"

We will demonstrate how to implement a simple "Products" management feature.

---

### 1. Database Migration
Create a schema for the new entity. Run `bun run make migration products` to generate a stub.

**File:** `scripts/migrations/sqlite/files/20260220_create_products_table.ts`
```typescript
import type { Database } from 'bun:sqlite';

export const up = (db: Database) => {
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

export const down = (db: Database) => {
    db.run(`DROP TABLE IF EXISTS products`);
};
```

---

### 2. Seeding
Populate the database with initial/test data.

**File:** `scripts/seeders/sqlite/ProductSeeder.ts`
```typescript
import type { Database } from 'bun:sqlite';

export const seed = (db: Database) => {
    const products = [
        ['iPhone 15', 999.99, 50],
        ['MacBook Air', 1299.00, 30]
    ];

    const stmt = db.prepare('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)');
    for (const p of products) {
        stmt.run(p);
    }
};
```

---

### 3. Repository (Data Access)
Handle raw database queries.

**File:** `src/repositories/product.repository.ts`
```typescript
import { getSqliteDb } from '../database/sqlite.connection.ts';

export interface Product {
    id?: number;
    name: string;
    price: number;
    stock: number;
}

export const findAll = (): Product[] => {
    const db = getSqliteDb();
    return db.query('SELECT * FROM products').all() as Product[];
};

export const findById = (id: number): Product | null => {
    const db = getSqliteDb();
    return db.query('SELECT * FROM products WHERE id = ?').get(id) as Product | null;
};
```

---

### 4. Service (Business Logic)
Orchestrate data flow and apply rules.

**File:** `src/services/product.service.ts`
```typescript
import * as ProductRepository from '../repositories/product.repository.ts';
import { NotFoundError } from '../utils/errors.ts';

export const getAllProducts = () => {
    return ProductRepository.findAll();
};

export const getProductDetail = (id: number) => {
    const product = ProductRepository.findById(id);
    if (!product) {
        // Automatically handled by global error handler
        throw new NotFoundError(`Product with ID ${id} not found`);
    }
    return product;
};
```

---

### 5. Controller (Request Handler)
Bridge between HTTP and Services.

**File:** `src/controllers/product.controller.ts`
```typescript
import type { Context } from 'hono';
import * as ProductService from '../services/product.service.ts';
import { successResponse } from '../utils/response.ts';
import { ValidationError } from '../utils/errors.ts';

export const list = async (c: Context) => {
    const data = ProductService.getAllProducts();
    return successResponse(c, 'Products retrieved', data);
};

export const show = async (c: Context) => {
    const id = parseInt(c.req.param('id'));
    
    if (isNaN(id)) {
        throw new ValidationError('Invalid product ID');
    }

    const data = ProductService.getProductDetail(id);
    return successResponse(c, 'Product detail found', data);
};
```

---

### 6. Routing
Expose the endpoints to the API.

**File:** `src/routes/product.routes.ts`
```typescript
import type { Hono } from 'hono';
import * as ProductController from '../controllers/product.controller.ts';
import { m2mAuthMiddleware } from '../middlewares/m2mAuth.middleware.ts';

export const registerProductRoutes = (app: Hono) => {
    // Grouping and protecting with M2M Auth
    app.get('/api/products', m2mAuthMiddleware, ProductController.list);
    app.get('/api/products/:id', m2mAuthMiddleware, ProductController.show);
};
```

---

### 7. Global Error Handling
You don't need `try/catch` in controllers. Just throw!

| Error Class | Status Code | Usage |
| :--- | :--- | :--- |
| `ValidationError` | `400` | Missing fields, invalid formats. |
| `UnauthorizedError` | `401` | Bad credentials, expired token. |
| `ForbiddenError` | `403` | IP blocked, account suspended. |
| `NotFoundError` | `404` | Resource not found in DB. |
| `RateLimitError` | `429` | Quota exceeded. |

**Example Usage:**
```typescript
if (!apiKey) throw new UnauthorizedError('Missing API Key');
if (price < 0) throw new ValidationError('Price cannot be negative');
```

---

[⬅️ Back to Examples](./README.md)
