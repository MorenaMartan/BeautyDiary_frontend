# BeautyDiary Frontend

Vue 3 frontend for managing a beauty salon's clients, staff, treatments, appointments, reviews and reports. It connects to a separate backend through a JSON API.

## Requirements

- Node.js 20.19+ or 22.12+
- Running backend that exposes the `/api` endpoints

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

For local development, requests to `/api` are proxied to `http://localhost:3000`. For a deployed frontend, set `VITE_API_URL` to the backend URL including `/api`.

```env
VITE_API_URL=https://your-backend.example.com/api
```

## Commands

```bash
npm run dev       # development server
npm run build     # Vue type check and production build
npm run preview   # serve the production build locally
```

## Authentication and authorization

Access tokens are kept only in memory; user display data is stored for the current browser session. The backend's refresh cookie restores the access token after a page reload.

The frontend does not send roles as authorization headers. **The backend must validate the access token and derive the user role from it for every protected endpoint.** UI role checks are only for presentation, never security.

## Deployment

`vercel.json` rewrites client-side routes to `index.html`. Configure `VITE_API_URL` in the deployment environment and configure the backend CORS policy to allow the deployed frontend origin with credentials.
