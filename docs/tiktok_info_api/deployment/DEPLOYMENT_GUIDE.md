# High-Level Production Deployment Guide

This guide is designed for beginners. It will walk you through deploying the **Hono TikTok Info API** on a Linux server from scratch.

### ⚙️ Technology Stack
This application specifically requires and is built around:
- **Runtime**: Bun `v1.3.9`
- **Framework**: Hono `v4.6.0`
- **Queue System**: BullMQ `v5.69.3`
- **Redis Client**: ioredis `v5.9.3`
- **Validation**: Zod `v4.3.6`

This system relies on **Bun.js**, a modern, blazing-fast all-in-one JavaScript runtime, bundler, and package manager. Unlike traditional Node.js setups that require separate tools for running code, installing packages (npm/yarn), and testing, Bun handles everything internally with built-in SQLite support and highly optimized performance—which is critical for the scraping and parsing involved in this API.

This system has **two main parts** that must be running simultaneously:
1. **The API Server**: Handles incoming HTTP requests and responses.
2. **The Background Worker**: Processes the queued TikTok scraping requests in the background.

## 🛠️ Step 1: Install Prerequisites

Before you can run the application, your server needs two pieces of software locally: **Bun.js** (the runtime engine) and **Redis** (the memory store used for queues/caching).

### 1.1 Install Bun.js
Bun replaces Node.js, npm, and build tools like Webpack or esbuild. It's written in Zig and runs on the JavaScriptCore engine (used by Safari), making it extraordinarily fast at starting up and processing data.

Run this single command in your terminal to install it securely:
```bash
curl -fsSL https://bun.sh/install | bash
```
After installation, you might need to restart your terminal or run `source ~/.bashrc` so the `bun` command is recognized. Test it worked by running:
```bash
bun --version
```

### 1.2 Install Redis
Redis handles the caching for our profiles and queues our background scraping jobs. 
For Ubuntu/Debian:
```bash
sudo apt update
sudo apt install redis-server -y
```
Ensure Redis is running in the background:
```bash
sudo systemctl enable redis-server
sudo systemctl start redis-server
sudo systemctl status redis-server
```

---

## 🚀 Step 2: Project Setup

### 2.1 Clone / Copy the Code
If you haven't already, move your project folder to your server (e.g., using Git or SFTP) and navigate inside it:
```bash
cd /path/to/your/hono-tiktok-info-api
```

### 2.2 Install Dependencies
Even though Bun eventually compiles your code to a single binary, you still need to resolve your packages first. Because Bun is an all-in-one toolkit, you don't need `npm` or `yarn`. Bun installs Node.js compatible dependencies significantly faster.
```bash
bun install
```

### 2.3 Setup Production Environment Variables
Your application needs configuration settings to run securely.
1. Create your production environment file by copying the example:
   ```bash
   cp .env.example .env.prod
   ```
2. Open `.env.prod` in your text editor (e.g., `nano .env.prod`) and change these very important variables:
   ```env
   NODE_ENV=production
   PORT=8080 # or port 80 if you have root access
   
   # IMPORTANT: Generate a new random secret string! DO NOT USE THE DEFAULT.
   JWT_SECRET="YOUR_SUPER_SECRET_RANDOM_KEY_HERE"
   
   # Redis connection (default usually works on a fresh install)
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   # Enable SQLite Database logic
   DB_SQLITE_ENABLED=true
   ```

---

## 🗄️ Step 3: Database Preparation

The core of your M2M tracking currently runs on SQLite. We need to create the database schemas.

```bash
bun run migrate:prod
```
*Note: Make sure your terminal has writing permissions (CHMOD) in the project directory, as SQLite will generate a database file in `./storages/database/sqlite/`.*

---

## 📦 Step 4: Build the Project

One of Bun's biggest advantages for deployments is its ability to compile your entire TypeScript project and all of its dependencies into a **single, highly-optimized executable file** (powered by its Zig backend). This ensures incredibly fast cold starts and avoids the need to distribute `node_modules` folders to production servers.

Run the build script defined in `package.json`:
```bash
bun run build
```
This will create a new binary file named `server` in your root directory. This executable requires no external dependencies (not even Bun itself!) to run on identical Linux distributions, making true zero-dependency deployment possible.

---

## 🟢 Step 5: Start the API in Production

You have two choices here. You can run it manually to test, or you can use a Process Manager (like `PM2`) to keep it running forever, even if the server reboots or crashes.

### Option A: Manual Start (Testing)
Open **two** separate terminal windows to confirm both systems run.

**Terminal 1 (The Server):**
```bash
bun run server:bin:prod
```

**Terminal 2 (The Background Worker):**
```bash
bun run worker:bin:prod
```

### Option B: Process Manager (Recommended for Real Production)
Instead of keeping terminal windows open, use PM2.

1. Install PM2 globally using Bun:
   ```bash
   bun add -g pm2
   ```

2. Start the API Server process:
   Notice how we inject `.env.prod` explicitly into PM2, as the compiled binary does not auto-load the environment file.
   ```bash
   SERVICE_NAME=app env $(cat .env.prod | grep -v '^#' | xargs) pm2 start ./server --name "tiktok-api-server"
   ```

3. Start the Background Worker process:
   Pass `--worker` after the standalone `--` so PM2 forwards the flag properly to the compiled binary.
   ```bash
   SERVICE_NAME=queue env $(cat .env.prod | grep -v '^#' | xargs) pm2 start ./server --name "tiktok-api-worker" -- --worker
   ```

4. Save your PM2 configurations so they start automatically if the server reboots:
   ```bash
   pm2 save
   pm2 startup
   ```

**You can view your real-time logs anytime with:**
```bash
pm2 logs
```

---

## 🔒 Step 6: Final Verification
1. Has the `storages/` database folder been generated?
2. Is the background worker reporting "Workers are ready and listening for jobs"?
3. Try sending an M2M registration request to your server's IP address and Port (e.g., `http://YOUR_SERVER_IP:8080/api/tiktok/profiles`) to verify the endpoints are reachable.

---

> **Important Security Note:** Because you are deploying an API intended for Machine-to-Machine communication, you must eventually place this server behind a Reverse Proxy (like **Nginx** or **Caddy**) so you can issue SSL/TLS certificates and serve traffic securely over `https://`. Do not send authorization headers over raw HTTP on the open web.
