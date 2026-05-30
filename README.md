# WebsiteBuilder

AI-powered website builder — create and edit sites from prompts with React, Express, Prisma, and OpenRouter.

## Deploy on Vercel

This repo deploys the **Vite frontend** and **Express API** together on one Vercel project.

### 1. Database

Use a hosted Postgres (recommended: [Neon](https://neon.tech) via Vercel Marketplace). Copy the **pooled** connection string.

Run migrations once (local or CI):

```bash
cd server
npx prisma migrate deploy
```

### 2. Create the Vercel project

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → Import the repository.
3. Leave **Root Directory** as the repo root (`.`).
4. Vercel reads `vercel.json` for build settings.

### 3. Environment variables

Set these in **Project → Settings → Environment Variables** (Production and Preview):

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://...` (pooled URL) |
| `BETTER_AUTH_SECRET` | long random string |
| `BETTER_AUTH_URL` | `https://your-app.vercel.app` |
| `TRUSTED_ORIGINS` | `https://your-app.vercel.app` |
| `AI_API_KEY` | OpenRouter API key |
| `VITE_BASEURL` | `https://your-app.vercel.app` |

`VITE_BASEURL` must match your live URL so the client calls the same host for `/api/*`.

Optional: `AI_MODEL`, `AI_MAX_TOKENS`, `NODE_ENV=production`

### 4. Deploy

```bash
npx vercel
# production:
npx vercel --prod
```

Or push to `main` if Git integration is enabled.

### Notes

- **AI generation** can take longer than the default serverless limit. Hobby plans cap at **10s**; use **Vercel Pro** and raise `maxDuration` in `vercel.json` if builds time out.
- After the first deploy, update `BETTER_AUTH_URL`, `TRUSTED_ORIGINS`, and `VITE_BASEURL` to the real `.vercel.app` URL, then redeploy.

## Local development

```bash
# Server
cd server
cp ../.env.example .env   # fill in values
npm install
npx prisma migrate dev
npm run server

# Client (another terminal)
cd client
npm install
# .env: VITE_BASEURL=http://localhost:3000
npm run dev
```
