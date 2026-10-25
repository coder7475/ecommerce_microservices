# Ecommerce Microservices

A collection of TypeScript/Node.js microservices for an e-commerce platform built with Express, Prisma ORM, PostgreSQL, Redis, and RabbitMQ.

---

## 📦 Services Overview

| Service | Port (Default / Recommended) | Backing Store / Queue | Description & Routes | Link |
|---------|------------------------------|------------------------|----------------------|------|
| **API Gateway** | `3000` | None (Proxy) | Reverse proxy, rate limiting, and auth dispatch | [README](./services/api-gateway/README.md) |
| **Product Service** | `3001` | PostgreSQL (Prisma) | Products catalog, creation, updates | [README](./services/product/README.md) |
| **Inventory Service** | `3002` | PostgreSQL (Prisma) | Stock tracking and inventory adjustments | [README](./services/inventory/README.md) |
| **Auth Service** | `3003` | PostgreSQL (Prisma) | Registration, login, verification codes, JWT | [README](./services/auth/README.md) |
| **User Service** | `3004` | PostgreSQL (Prisma) | User profiles and account data | [README](./services/user/README.md) |
| **Email Service** | `3005` | PostgreSQL + RabbitMQ + SMTP | Transactional email delivery and email logs | [README](./services/email/README.md) |
| **Cart Service** | `3006` | Redis + RabbitMQ | Cart session store, TTL expiration, event consumer | [README](./services/cart/README.md) |
| **Order Service** | `3007` | PostgreSQL + RabbitMQ | Checkout orchestrator, order state, event publisher | [README](./services/order/README.md) |

---

## 🏗️ Architecture & Backing Infrastructure

- **API Gateway (`3000`)**: Routes incoming client requests to backend services via Axios based on configuration in `services/api-gateway/src/config.json`.
- **Database (PostgreSQL `5432`)**: Used by Product, Inventory, User, Auth, Order, and Email services via Prisma.
- **Cache & Session (Redis `6379`)**: Manages shopping cart sessions with TTL and keyspace expiration notifications (`__keyevent@0__:expired`).
- **Message Broker (RabbitMQ `5672`)**: Direct exchange (`order_exchange`) routes asynchronous tasks from Order Service:
  - `send-email` queue → consumed by Email Service.
  - `clear-cart` queue → consumed by Cart Service.
- **SMTP Server (MailHog `1025` / UI `8025`)**: Intercepts outgoing transactional emails for local testing.

---

## 🛠️ Getting Started

### 1. Prerequisites
- **Node.js** (v20+ recommended)
- **pnpm** (v8 or v10)
  ```bash
  npm install -g pnpm
  ```
- **Docker & Docker Compose**

---

### 2. Start Infrastructure with Docker Compose

Start the shared message broker, Redis cache, and MailHog mail catcher:

```bash
docker compose up -d
```

> **Note on PostgreSQL**: If running PostgreSQL via Docker, ensure the `postgres` service block in `docker-compose.yml` is uncommented and running on port `5432`.

#### Backing Infrastructure Dashboards:
- **MailHog Web UI:** [http://localhost:8025](http://localhost:8025)
- **RabbitMQ Management:** [http://localhost:15672](http://localhost:15672) *(guest / guest)*
- **RedisInsight (Redis Stack):** [http://localhost:8001](http://localhost:8001)
- **pgAdmin 4 (if enabled):** [http://localhost:5050](http://localhost:5050) *(admin@example.com / admin123)*

---

### 3. Install Dependencies

Install all dependencies across all services:

```bash
pnpm -r install
```

---

### 4. Configure Environment Variables

Each service expects a `.env` file in its root directory (`services/<service-name>/.env`).

#### Essential Variables by Service:

- **`services/product/.env`**:
  ```env
  PORT=3001
  NODE_ENV=development
  DATABASE_URL="postgresql://admin:admin123@localhost:5432/app_db?schema=product"
  ```

- **`services/inventory/.env`**:
  ```env
  PORT=3002
  NODE_ENV=development
  DATABASE_URL="postgresql://admin:admin123@localhost:5432/app_db?schema=inventory"
  ```

- **`services/auth/.env`**:
  ```env
  PORT=3003
  NODE_ENV=development
  JWT_SECRET="your_jwt_secret_key"
  DATABASE_URL="postgresql://admin:admin123@localhost:5432/app_db?schema=auth"
  USER_SERVICE_URL="http://localhost:3004/api"
  EMAIL_SERVICE_URL="http://localhost:3005/api"
  ```

- **`services/user/.env`**:
  ```env
  PORT=3004
  NODE_ENV=development
  DATABASE_URL="postgresql://admin:admin123@localhost:5432/app_db?schema=user"
  ```

- **`services/email/.env`**:
  ```env
  PORT=3005
  NODE_ENV=development
  DATABASE_URL="postgresql://admin:admin123@localhost:5432/app_db?schema=email"
  DEFAULT_SENDER_MAIL="admin@example.com"
  SMTP_HOST="localhost"
  SMTP_PORT=1025
  QUEUE_URL="amqp://localhost"
  ```

- **`services/cart/.env`**:
  ```env
  PORT=3006
  NODE_ENV=development
  REDIS_HOST="localhost"
  REDIS_PORT=6379
  CART_TTL=3600
  INVENTORY_SERVICE="http://localhost:3002/api"
  QUEUE_URL="amqp://localhost"
  ```

- **`services/order/.env`**:
  ```env
  PORT=3007
  NODE_ENV=development
  DATABASE_URL="postgresql://admin:admin123@localhost:5432/app_db?schema=order"
  PRODUCT_SERVICE="http://localhost:3001/api"
  CART_SERVICE="http://localhost:3006/api"
  EMAIL_SERVICE="http://localhost:3005/api"
  QUEUE_URL="amqp://localhost"
  ```

- **`services/api-gateway/.env`**:
  ```env
  PORT=3000
  NODE_ENV=development
  ```

---

### 5. Generate Prisma Clients & Push Database Schemas

For services backed by Prisma (`product`, `inventory`, `user`, `auth`, `order`, `email`), generate clients and push migrations:

```bash
# Generate Prisma Client for all services
pnpm -r prisma:generate

# Deploy migrations or push schemas (run in each Prisma service or via pnpm filter)
pnpm --filter product-service prisma db push
pnpm --filter inventory-service prisma db push
pnpm --filter auth-service prisma db push
pnpm --filter user-service prisma db push
pnpm --filter order-service prisma db push
pnpm --filter email-service prisma db push
```

---

### 6. Run the Services

#### Run all services concurrently:
```bash
pnpm dev
```

#### Run a specific service in development:
```bash
pnpm --filter product-service dev
# or navigate into the service directory:
cd services/product && pnpm dev
```

---

## 🗄️ Database Access via pgAdmin

If using the optional pgAdmin container from `docker-compose.yml`:

1. Navigate to: [http://localhost:5050](http://localhost:5050)
2. Login with:
   - **Email:** `admin@example.com`
   - **Password:** `admin123`
3. Register the PostgreSQL Server:
   - **Host:** `postgres` (or `localhost` / `host.docker.internal`)
   - **Port:** `5432`
   - **Maintenance DB:** `app_db`
   - **Username:** `admin`
   - **Password:** `admin123`
