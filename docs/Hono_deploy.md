### 🧩 Prerequisites

Make sure you have:

1. **Node.js ≥ 18**
2. **npm** or **pnpm**
3. A **Cloudflare account**
4. The **Wrangler CLI** (Cloudflare’s deployment tool)

Install Wrangler globally:

```bash
npm install -g wrangler
```

Log in:

```bash
wrangler login
```

---

### ⚙️ 1. Create a New Hono Project

You can scaffold a Hono app using:

```bash
npm create hono@latest
```

Then select:

```
? Which template do you want to use? > cloudflare-workers
```

This will create a Hono project ready for Cloudflare Workers.

---

### 🧱 2. Project Structure

Your structure should look like:

```
my-hono-app/
├─ src/
│  └─ index.ts
├─ package.json
├─ tsconfig.json
├─ wrangler.toml
```

---

### 📝 3. Example `src/index.ts`

```ts
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello from Hono + Cloudflare!"));

export default app;
```

---

### ⚙️ 4. Wrangler Configuration (`wrangler.toml`)

Here’s a minimal setup:

```toml
name = "my-hono-app"
main = "src/index.ts"
compatibility_date = "2025-11-01"
compatibility_flags = ["nodejs_compat"]

[build]
command = "npm run build"

[site]
bucket = "./dist"
```

> 🧠 **Note:** Hono compiles to a single worker script — you don’t need a server.

---

### 🔧 5. Add Build Scripts

In `package.json`, ensure you have:

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "build": "tsc",
    "deploy": "wrangler deploy"
  },
  "dependencies": {
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

Run the TypeScript build:

```bash
npm run build
```

---

### 🚀 6. Deploy to Cloudflare

Finally, deploy:

```bash
npm run deploy
```

You’ll get an output like:

```
✨ Success! Your worker has been deployed:
https://my-hono-app.your-subdomain.workers.dev
```

---

### 🧪 7. Local Testing

You can run locally with:

```bash
npm run dev
```

Then visit:

```
http://localhost:8787/
```

---

### ✅ References

- Official Hono Cloudflare Deployment Docs:
  🔗 [https://hono.dev/getting-started/cloudflare-workers](https://hono.dev/getting-started/cloudflare-workers)
- Cloudflare Wrangler Docs:
  🔗 [https://developers.cloudflare.com/workers/wrangler/](https://developers.cloudflare.com/workers/wrangler/)
- Hono GitHub Repository:
  🔗 [https://github.com/honojs/hono](https://github.com/honojs/hono)
