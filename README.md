# Retail Promo Automation – React/Tailwind/Postgres (MVP)

## Quick Start
```bash
docker compose up -d
cp .env.example .env
# edit .env if needed
npm i
npm run db:push
npm run dev
```
- Web: http://localhost:5173
- API: http://localhost:4000
- Adminer: http://localhost:8080

### Optional: AI website generation & Vercel deploy
Fill these env vars (in `.env` and `apps/api/.env`) to enable the Website Builder preview + deploy flow:

```
GEMINI_API_KEY=your-google-generative-ai-key
GEMINI_MODEL=gemini-1.5-flash # or another Gemini model
VERCEL_TOKEN=your-vercel-personal-token
VERCEL_TEAM_ID=team_xxx            # optional
VERCEL_PROJECT_ID=prj_xxx          # optional
VERCEL_PROJECT_NAME=your-project   # optional fallback if no project_id
```

The backend will fall back to a stub HTML template when `GEMINI_API_KEY` is missing. Deployments require a valid `VERCEL_TOKEN`.

This starter includes:
- React + Vite + Tailwind UI
- Express + Drizzle + PostgreSQL
- Basic modules: Brand, Image Studio (stub), Posts, Connections, Analytics
