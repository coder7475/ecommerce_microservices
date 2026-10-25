# Ecommerce Microservices

A collection of TypeScript/Node.js microservices for an e-commerce platform built with Express, Prisma ORM, PostgreSQL, Redis, and RabbitMQ.

---

## 📦 Services Overview

| Service | Port | Database / Queue | Description & Endpoints |
|---------|------|------------------|-------------------------|
| **[API Gateway](./services/api-gateway/README.md)** | `3000` | None (Reverse Proxy) | Reverse proxy, rate limiting, and auth dispatch |
| **[Product Service](./services/product/README.md)** | `3001` | PostgreSQL (`product_db`) | Products catalog, creation, updates |
| **[Inventory Service](./services/inventory/README.md)** | `3002` | PostgreSQL (`inventory_db`) | Stock tracking and inventory adjustments |
| **[Auth Service](./services/auth/README.md)** | `3003` | PostgreSQL (`auth_db`) | Registration, login, verification codes, JWT |
| **[User Service](./services/user/README.md)** | `3004` | PostgreSQL (`user_db`) | User profiles and account data |
| **[Email Service](./services/email/README.md)** | `3005` | PostgreSQL (`email_db`) + RabbitMQ + MailHog | Transactional email delivery and logging |
| **[Cart Service](./services/cart/README.md)** | `3006` | Redis Stack + RabbitMQ | Cart session store, TTL expiration, event consumer |
| **[Order Service](./services/order/README.md)** | `3007` | PostgreSQL (`order_db`) + RabbitMQ | Checkout orchestrator, order state, event publisher |

---

## 🏗️ Architecture & Backing Infrastructure

- **API Gateway (`3000`)**: Routes incoming client requests to backend services via Axios based on configuration in `services/api-gateway/src/config.json` with environment variable overrides (`PRODUCT_SERVICE_URL`, etc.).
- **Simulated Multi-Database PostgreSQL (`5432`)**: Single PostgreSQL 17 container executing [`scripts/init-multiple-dbs.sh`](./scripts/init-multiple-dbs.sh) on first boot to create isolated databases: `auth_db`, `user_db`, `product_db`, `inventory_db`, `order_db`, `email_db`, `kong_db`, and `keycloak_db`.
- **Cache & Session (Redis `6379`)**: Manages shopping cart sessions with TTL and keyspace expiration notifications (`--notify-keyspace-events Ex`).
- **Message Broker (RabbitMQ `5672` / UI `15672`)**: Direct exchange (`order_exchange`) routes asynchronous tasks from Order Service:
  - `send-email` queue → consumed by Email Service.
  - `clear-cart` queue → consumed by Cart Service.
- **SMTP Server (MailHog `1025` / UI `8025`)**: Intercepts outgoing transactional emails for local testing.

---

## 🛠️ Prerequisites

Ensure you have the following installed on your workstation:
- **Docker & Docker Compose** (v20.10+ / Compose v2+)
- **Node.js** (v20+ LTS recommended)
- **pnpm** (v8 or v10):
  ```bash
  npm install -g pnpm
  ```

---

## 💻 1. Running in Development (`dev`)

You can develop using **Full Docker Compose** (runs everything in containers with live hot-reload) or **Hybrid Mode** (runs databases/queues in Docker, services locally on your machine).

### Option A: Full Docker Compose Development (Recommended)

1. **Configure local environment variables**:
   ```bash
   cp .env.dev.example .env.dev
   ```

2. **Start all backing infrastructure and microservices**:
   ```bash
   docker compose --env-file .env.dev up --build
   ```
   > **How Hot-Reloading Works**: Each service uses the `development` build stage. Source code from `./services/<name>` is bind-mounted directly into `/app` inside the container, triggering `tsx watch` to reload automatically whenever you save a file.

3. **Initialize database tables (First-time setup)**:
   In a separate terminal window, push Prisma schemas to their respective databases:
   ```bash
   pnpm --filter product-service prisma db push
   pnpm --filter inventory-service prisma db push
   pnpm --filter auth-service prisma db push
   pnpm --filter user-service prisma db push
   pnpm --filter order-service prisma db push
   pnpm --filter email-service prisma db push
   ```

4. **Spinning up a single service**:
   If you only want to work on a specific service (e.g. `product-service` and its database):
   ```bash
   docker compose --env-file .env.dev up postgres product-service
   ```

---

### Option B: Hybrid Development (Infra in Docker, Services on Host)

Use this mode if you prefer running services directly via local Node.js/pnpm commands:

1. **Start only backing infrastructure**:
   ```bash
   docker compose --env-file .env.dev up -d postgres redis-stack rabbitmq mailhog
   ```

2. **Install monorepo dependencies**:
   ```bash
   pnpm -r install
   ```

3. **Run all microservices concurrently**:
   ```bash
   pnpm dev
   ```

4. **Or run an individual service**:
   ```bash
   pnpm --filter product-service dev
   # Or directly from its folder:
   cd services/product && pnpm dev
   ```

---

## 🚀 2. Running in Production (`prod`)

Production builds compile TypeScript into optimized JavaScript, prune `devDependencies`, and run as unprivileged `USER nodejs` inside hardened Alpine containers with `dumb-init`.

### Step 1: Prepare Production Environment
Copy the production template and set cryptographically secure passwords:
```bash
cp .env.prod.example .env.prod
```
> [!IMPORTANT]
> Edit `.env.prod` to replace placeholder secrets (`CHANGE_ME_IN_PRODUCTION`, `CHANGE_ME_TO_A_CRYPTOGRAPHICALLY_SECURE_JWT_SECRET`, etc.).

### Step 2: Build & Start Production Containers
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d
```

### Step 3: Run Database Migrations in Production
Deploy existing Prisma migrations safely against the production databases:
```bash
docker compose -f docker-compose.prod.yml exec product-service npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec inventory-service npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec auth-service npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec user-service npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec order-service npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec email-service npx prisma migrate deploy
```

### Step 4: Verify Container Health & Status
```bash
docker compose -f docker-compose.prod.yml ps
```

### Step 5: Graceful Shutdown
```bash
docker compose -f docker-compose.prod.yml down
```

---

## 🔍 3. Debugging & Troubleshooting (`debug`)

### Viewing Logs

- **Stream live logs across all containers**:
  ```bash
  docker compose logs -f
  ```
- **Stream logs for a specific service**:
  ```bash
  docker compose logs -f product-service
  docker compose logs -f order-service
  ```
- **Filter for runtime errors**:
  ```bash
  docker compose logs -f | grep -E "Error|error|ERR|fail"
  ```

---

### Interactive Shell Access

Enter any running container to inspect files, network access, or runtime environment variables:
```bash
# Open an interactive shell inside a microservice
docker compose exec product-service sh

# Inspect running environment variables
docker compose exec product-service env

# Test network connectivity to another service
docker compose exec api-gateway wget -qO- http://product-service:3001/api/health
```

---

### Database Debugging

1. **Connect via CLI (`psql`)**:
   Access any database directly on the PostgreSQL container:
   ```bash
   # Connect to product_db
   docker compose exec postgres psql -U admin -d product_db

   # Useful psql commands:
   # \dt       List all tables
   # \d table  Describe table schema
   # \q        Quit
   ```

2. **Visual Inspection via Prisma Studio**:
   Open a browser-based GUI to view and edit database rows directly:
   ```bash
   cd services/product
   DATABASE_URL="postgresql://admin:admin123@localhost:5432/product_db" npx prisma studio
   ```
   Navigate to [http://localhost:5555](http://localhost:5555).

3. **Visual Inspection via pgAdmin 4**:
   Open [http://localhost:5050](http://localhost:5050) *(Email: `admin@example.com` / Password: `admin123`)*:
   - Host: `postgres`
   - Port: `5432`
   - Maintenance Database: `app_db` (or `product_db`, `order_db`, etc.)
   - Username: `admin` / Password: `admin123`

---

### Message Queue & Cache Debugging

1. **RabbitMQ Management Dashboard**:
   - URL: [http://localhost:15672](http://localhost:15672) *(Credentials: `guest` / `guest`)*
   - Inspect active exchanges (`order_exchange`), queues (`send-email`, `clear-cart`), and message rates.
   - CLI check queue counts:
     ```bash
     docker compose exec rabbitmq rabbitmqctl list_queues
     ```

2. **Redis Stack & Keyspace Notifications**:
   - URL: [http://localhost:8001](http://localhost:8001) (RedisInsight GUI)
   - CLI real-time monitor:
     ```bash
     docker compose exec redis-stack redis-cli MONITOR
     ```
   - Verify cart keys:
     ```bash
     docker compose exec redis-stack redis-cli KEYS "cart:*"
     ```

3. **MailHog Email Interceptor**:
   - URL: [http://localhost:8025](http://localhost:8025)
   - Real-time UI showing all outgoing transactional emails from `auth-service` and `email-service` without sending real emails.

---

### VS Code Debugger Attachment (Breakpoints)

To attach a debugger to any service running with `tsx`:

1. Update the service `command` in `docker-compose.yml` to include the `--inspect` flag:
   ```yaml
   product-service:
     command: ["pnpm", "exec", "tsx", "watch", "--inspect=0.0.0.0:9229", "src/index.ts"]
     ports:
       - "3001:3001"
       - "9229:9229"
   ```

2. Add a `.vscode/launch.json` configuration:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "attach",
         "name": "Attach to Docker: Product Service",
         "port": 9229,
         "address": "localhost",
         "localRoot": "${workspaceFolder}/services/product",
         "remoteRoot": "/app",
         "restart": true
       }
     ]
   }
   ```

---

### Common Issues & Quick Fixes

| Issue | Cause | Solution |
|---|---|---|
| `bind: address already in use` | Local Postgres (`5432`) or Redis (`6379`) is running on host | Stop local host services: `sudo systemctl stop postgresql redis` or modify port mappings in `.env.dev` |
| `database "product_db" does not exist` | PostgreSQL volume was created before `init-multiple-dbs.sh` ran | Reset Postgres volume: `docker compose down -v` and restart with `docker compose --env-file .env.dev up` |
| `Error: P1001: Can't reach database server` | Database container still booting or healthcheck pending | Wait for `postgres_db` status to become `(healthy)` or inspect logs: `docker compose logs postgres` |
| Changes in code not reflecting | Bind mount caching or anonymous volume issue | Ensure service runs `target: development` and verify volumes in `docker-compose.yml` |
| Full reset of all data and containers | Stale cache or corrupt volumes | Run `docker compose down -v && docker compose --env-file .env.dev up --build` |

---

## 🗺️ Architectural Roadmaps

For detailed multi-stage Docker build specs, Kong API Gateway migration, Keycloak OIDC integration, and DevSecOps workflows, see:
- 📄 **[plan/dockerize_monorepo_engineering_plan.md](./plan/dockerize_monorepo_engineering_plan.md)**
