# Ecommerce Microservices

A collection of microservices for ecommerce

## Services

- [Product Service](./services/product/README.md)
- [Inventory Service](./services/inventory/README.md)
- [User Service](./services/user/README.md)
- [API Gateway](./services/api-gateway/README.md)
- [Auth Service](./services/auth/)
- [Email Service](./services/auth/)

## 🛠️ Quickstart

### 1. Install pnpm

```bash
npm install -g pnpm
```

### 2. Install all dependencies for all workspaces

```bash
pnpm install
```

### 3. Run all services in development mode

```bash
pnpm dev
```

---

## Running with Docker Compose

Start all services in the background:

```bash
docker compose up -d
```

---

## Database Access via pgAdmin

You can use **pgAdmin** (running in Docker) to manage your **PostgreSQL** service. Follow these steps:

---

### Step 1: Start the Services

```bash
docker compose up -d
```

This launches both containers:

- **postgres_db** (PostgreSQL)
- **pgadmin_ui** (pgAdmin 4)

Check their status:

```bash
docker ps
```

---

### Step 2: Open pgAdmin in Your Browser

Navigate to:

```
http://localhost:5050
```

Login with:

- **Email:** `admin@example.com`
- **Password:** `admin123`

---

### ⚙️ Step 3: Register the PostgreSQL Server in pgAdmin

1. Right-click **Servers → Register → Server…**
2. Under the **General** tab, choose a name (e.g., `PostgresDB`)
3. Under the **Connection** tab, set:

   - **Host name/address:** `postgres` <sub>(service name from docker-compose)</sub> or `host.docker.internal`
   - **Port:** `5432`
   - **Maintenance database:** `app_db`
   - **Username:** `admin`
   - **Password:** `admin123`
   - (Optional) Check **Save Password**

Click **Save** to connect!

---

### (Optional) Connect from Your Local Machine

To connect with external tools (e.g., DBeaver, psql) use:

```sh
Host: localhost
Port: 5432
User: admin
Password: admin123
Database: app_db
```

This works because your `docker-compose.yml` maps:

```yaml
ports:
  - "5432:5432"
```

---

### Verifying the Connection

After connecting in pgAdmin, you should see:

```
Servers
 └── PostgresDB
      ├── Databases
      │    └── app_db
```

---

### 📚 References

- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [pgAdmin Docker Image](https://hub.docker.com/r/dpage/pgadmin4)
- [Docker Compose Networking](https://docs.docker.com/compose/networking/)
