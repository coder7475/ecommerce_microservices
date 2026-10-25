# Monorepo Dockerization & Infrastructure Engineering Plan

## 1. Executive Summary
This document provides the end-to-end engineering architecture and implementation roadmap for containerizing the 8-service e-commerce TypeScript monorepo. It establishes a unified root-level orchestration strategy for development and production, defines production-grade multi-stage Docker builds, centralizes environment management at the root, simulates true database-per-service isolation on a single PostgreSQL instance, coordinates messaging and cache infrastructure, and maps out the future integration of **Kong API Gateway**, **Keycloak IAM**, and **DevSecOps workflows**.

---

## 2. System Architecture & Topology

```mermaid
flowchart TD
    subgraph Client & Perimeter
        Client[Client Applications]
        Kong[Phase 2: Kong API Gateway\nPorts 8000/8443]
        GatewayDev[Phase 1: Express API Gateway\nPort 3000]
        Keycloak[Phase 2: Keycloak IAM\nPort 8080]
    end

    subgraph Internal Network: ecommerce-network
        Auth[auth-service: 3003]
        User[user-service: 3004]
        Prod[product-service: 3001]
        Inv[inventory-service: 3002]
        Cart[cart-service: 3006]
        Order[order-service: 3007]
        Email[email-service: 3005]
    end

    subgraph Single PostgreSQL 17 Server: 5432
        DB_Auth[(auth_db)]
        DB_User[(user_db)]
        DB_Prod[(product_db)]
        DB_Inv[(inventory_db)]
        DB_Order[(order_db)]
        DB_Email[(email_db)]
        DB_Future[(kong_db / keycloak_db)]
    end

    subgraph Infrastructure Tier
        Redis[(Redis Stack\nPort 6379)]
        RabbitMQ[(RabbitMQ 3.8-mgmt\nPort 5672)]
        MailHog[MailHog SMTP/UI\nPort 1025/8025]
    end

    Client --> GatewayDev
    Client -.-> Kong
    GatewayDev --> Auth & User & Prod & Inv
    Kong -.-> Auth & User & Prod & Inv & Cart & Order
    Kong -.-> Keycloak

    Auth --> DB_Auth
    User --> DB_User
    Prod --> DB_Prod
    Inv --> DB_Inv
    Order --> DB_Order
    Email --> DB_Email

    Cart --> Redis
    Order --> RabbitMQ
    RabbitMQ --> Cart
    RabbitMQ --> Email
    Email --> MailHog
```

---

## 3. Engineering Team Analysis & Consensus

### 3.1 Platform & DevOps Engineer
* **Current State**: Microservices have duplicate `Dockerfile`s with inconsistent stages, lack of dedicated hot-reload development targets, and port conflicts in local runs (defaulting to 3000 or 3003).
* **Consensus**:
  - Implement a uniform **5-stage Dockerfile** across all 8 services: `base` -> `development` -> `build` -> `prod-deps` -> `production`.
  - Maintain build contexts per service (`services/<service-name>`) while executing orchestration exclusively from the repository root via Docker Compose.
  - Split orchestration into two root files:
    - `docker-compose.yml`: Development target with volume mounts for live reload (`tsx watch`) and exposed ports.
    - `docker-compose.prod.yml`: Production target running immutable containers with compiled JavaScript, non-root users, and no host volume mounts.
  - Centralize environment configuration into `.env.dev` and `.env.prod` at the root.

### 3.2 Backend Architect
* **Current State**:
  - Six services connect to PostgreSQL (`DATABASE_URL`). Shared database schemas introduce migration collisions and make decoupling difficult.
  - Cart relies on Redis Keyspace notifications (`__keyevent@0__:expired`) requiring explicit server configuration (`notify-keyspace-events Ex`).
  - Order relies on RabbitMQ exchange `order_exchange` and queues `send-email` and `clear-cart`.
* **Consensus**:
  - Use a single PostgreSQL 17 container that automatically boots multiple discrete databases (`auth_db`, `user_db`, `product_db`, `inventory_db`, `order_db`, `email_db`, `kong_db`, `keycloak_db`) using `scripts/init-multiple-dbs.sh` in `/docker-entrypoint-initdb.d/`.
  - This simulates true database-per-service isolation without the resource overhead of running 6+ separate database containers.
  - Introduce Docker Compose healthchecks (`service_healthy` conditions) across PostgreSQL, Redis, and RabbitMQ to guarantee strict boot-order dependency resolution.
  - Configure Redis container command with `--notify-keyspace-events Ex`.

### 3.3 DevSecOps & Security Architect
* **Current State**: Root execution in containers, unpinned dependencies, potential plain-text secrets in git, and no automated container vulnerability scanning.
* **Consensus**:
  - Production stages must drop root privileges to an unprivileged user `nodejs` (UID 1001).
  - Use `dumb-init` as PID 1 to handle signal forwarding (SIGTERM) and reap zombie processes cleanly.
  - Alpine runtime images must include `libc6-compat` and `openssl` for Prisma query engine binaries.
  - Automate secret scanning (Gitleaks), container vulnerability scanning (Trivy), and SBOM generation in CI pipelines before deployment.

---

## 4. Standardized Multi-Stage Dockerfile Blueprint

Each service (`services/<service-name>/Dockerfile`) follows this uniform, cache-optimized structure:

```dockerfile
# =========================================================
# Stage 1: Base Runtime & Dependencies Tooling
# =========================================================
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# =========================================================
# Stage 2: Development Target (Hot Reloading with tsx)
# =========================================================
FROM base AS development
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
# Generate Prisma Client if prisma directory exists
RUN if [ -d "prisma" ]; then pnpm prisma:generate; fi
CMD ["pnpm", "dev"]

# =========================================================
# Stage 3: Builder (TypeScript Compilation & Prisma Client)
# =========================================================
FROM base AS build
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN if [ -d "prisma" ]; then pnpm prisma:generate; fi
RUN pnpm run build

# =========================================================
# Stage 4: Production Dependencies Only
# =========================================================
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN if [ -d "prisma" ]; then pnpm prisma:generate; fi

# =========================================================
# Stage 5: Production Release (Hardened, Non-root)
# =========================================================
FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init openssl libc6-compat
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

COPY --chown=nodejs:nodejs --from=prod-deps /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=build /app/dist ./dist
COPY --chown=nodejs:nodejs package.json ./

USER nodejs
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/index.js"]
```

---

## 5. Root Orchestration & Infrastructure Setup

### 5.1 Directory Layout
```
ecommerce_microservices/
├── .env.dev.example          # Root environment template for local dev
├── .env.dev                  # Active local dev configuration (git-ignored)
├── .env.prod.example         # Production environment template
├── .env.prod                 # Production deployment secrets (managed by CI/K8s/Vault)
├── docker-compose.yml        # Development compose (mounts, hot-reload, infra)
├── docker-compose.prod.yml   # Production compose (builds release images, no volume mounts)
├── plan/
│   └── dockerize_monorepo_engineering_plan.md
├── scripts/
│   └── init-multiple-dbs.sh  # Automated multi-database provisioning for Postgres
└── services/
    ├── api-gateway/
    ├── auth/
    ├── cart/
    ├── email/
    ├── inventory/
    ├── order/
    ├── product/
    └── user/
```

### 5.2 PostgreSQL Multi-Database Provisioning Script (`scripts/init-multiple-dbs.sh`)
```bash
#!/bin/bash
set -e
set -u

function create_database() {
    local database=$1
    echo "Creating database '$database'..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        SELECT 'CREATE DATABASE $database'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$database')\gexec
        GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        create_database $db
    done
    echo "Multiple databases created successfully!"
fi
```

### 5.3 Root Environment Configuration (`.env.dev.example`)
```dotenv
# ========================================================
# Global Infrastructure Config
# ========================================================
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin123
POSTGRES_PORT=5432
POSTGRES_MULTIPLE_DATABASES=auth_db,user_db,product_db,inventory_db,order_db,email_db,kong_db,keycloak_db

REDIS_HOST=redis-stack
REDIS_PORT=6379

RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest

MAILHOG_SMTP_HOST=mailhog
MAILHOG_SMTP_PORT=1025
MAILHOG_HTTP_PORT=8025

# ========================================================
# Service Ports (Exposed on Host)
# ========================================================
API_GATEWAY_PORT=3000
PRODUCT_SERVICE_PORT=3001
INVENTORY_SERVICE_PORT=3002
AUTH_SERVICE_PORT=3003
USER_SERVICE_PORT=3004
EMAIL_SERVICE_PORT=3005
CART_SERVICE_PORT=3006
ORDER_SERVICE_PORT=3007

# ========================================================
# Microservice Database Connection Strings (Clean Multi-DB)
# ========================================================
DATABASE_URL_AUTH="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/auth_db"
DATABASE_URL_USER="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/user_db"
DATABASE_URL_PRODUCT="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/product_db"
DATABASE_URL_INVENTORY="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/inventory_db"
DATABASE_URL_ORDER="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/order_db"
DATABASE_URL_EMAIL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/email_db"

QUEUE_URL="amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@rabbitmq:5672"
JWT_SECRET="super-secret-development-jwt-key"
```

---

## 6. Future Integration: Kong API Gateway & Keycloak IAM

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend / Mobile Client
    participant Keycloak as Keycloak (OIDC Provider)
    participant Kong as Kong API Gateway
    participant AuthSvc as Auth / User Service
    participant InternalSvc as Product / Order / Inventory

    Note over Client,Keycloak: 1. Authentication Phase
    Client->>Keycloak: POST /realms/ecommerce/protocol/openid-connect/token (Credentials)
    Keycloak-->>Client: Returns JWT Access Token & Refresh Token

    Note over Client,InternalSvc: 2. API Request Phase
    Client->>Kong: GET /api/v1/products (Header: Authorization: Bearer <JWT>)
    Kong->>Kong: Kong OIDC / JWT Plugin verifies Token Signature & Expiry
    Kong->>Kong: Injects headers (x-user-id, x-user-email, x-user-roles)
    Kong->>InternalSvc: Proxies request with validated claims
    InternalSvc-->>Kong: Returns data
    Kong-->>Client: 200 OK Response
```

### 6.1 Kong API Gateway Strategy
- **Mode**: Kong DB-less mode using declarative configuration (`kong.yml`) or DB-backed mode with `kong_db` in PostgreSQL.
- **Upstream Routes**:
  - `/api/products` -> `product-service:3001`
  - `/api/inventory` -> `inventory-service:3002`
  - `/api/cart` -> `cart-service:3006`
  - `/api/orders` -> `order-service:3007`
- **Kong Plugins**:
  - `cors`: Global Cross-Origin Resource Sharing.
  - `rate-limiting`: Distributed rate limiting backed by Redis.
  - `oidc`: Connects with Keycloak to inspect and validate tokens at the edge.

### 6.2 Keycloak IAM Strategy
- Replaces custom password hashing and local JWT signing in `auth-service`.
- Connected to `keycloak_db` in PostgreSQL.
- Keycloak manages user federation, email verification, password reset flows, MFA, and RBAC roles.
- `user-service` continues storing e-commerce domain data (addresses, profile attributes), linked by the Keycloak Subject UUID (`sub`).

---

## 7. DevSecOps & Production Hardening Roadmap

| Layer | DevSecOps Tool | Implementation Detail |
|---|---|---|
| **Base Images** | Minimal Alpine | `node:20-alpine` with dropped root permissions (`USER nodejs:1001`) |
| **Secrets Management** | Doppler / HashiCorp Vault | Never commit `.env`; inject via CI runner or Kubernetes secrets |
| **SAST & Linting** | ESLint + SonarCloud | Runs on pull request to enforce static code hygiene |
| **SCA (Dependencies)** | `pnpm audit` / Snyk | Blocks builds containing critical/high CVEs in npm dependencies |
| **Container Scanning** | Trivy / Grype | Scans built Docker images in GitHub Actions before pushing to registry |
| **Image Integrity** | Cosign | Cryptographically signs production container images |
| **Process Isolation** | `dumb-init` / Tini | Ensures PID 1 signal forwarding (SIGTERM) for graceful container shutdown |

---

## 8. Implementation Phases & Action Plan

### Phase 1: Core Dockerization & Dev Workflow
1. Create `scripts/init-multiple-dbs.sh` and make it executable.
2. Add `.env.dev.example`, `.env.dev`, and `.env.prod.example` at repository root.
3. Update each service's `Dockerfile` to the uniform 5-stage blueprint (`development`, `build`, `prod-deps`, `production`).
4. Refactor root `docker-compose.yml` to define all 8 services with live volume mounts, healthchecks, and backing infrastructure with multi-database PostgreSQL.
5. Create `docker-compose.prod.yml` building immutable production containers (`target: production`).
6. Create `pnpm-workspace.yaml` for workspace commands.
7. Verify local end-to-end dev flow: `docker compose config` and build validation.

### Phase 2: Kong & Keycloak Integration
1. Deploy Keycloak container connected to `keycloak_db` in PostgreSQL.
2. Configure Keycloak Realm, Client, and Roles.
3. Deploy Kong Gateway with declarative route mappings and OIDC plugin.
4. Deprecate Express `api-gateway` in favor of Kong.

### Phase 3: CI/CD & DevSecOps Automation
1. Set up GitHub Actions CI workflow with matrix build for services.
2. Integrate Trivy vulnerability scanning into the container build step.
3. Automate Prisma migration deployments on release tags.
