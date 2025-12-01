# SendNow ⚡

> Instant P2P file, text & link sharing — any device, any browser, zero login.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://sendnow.vercel.app)
![Bun](https://img.shields.io/badge/Bun-1.x-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![WebRTC](https://img.shields.io/badge/WebRTC-P2P-orange)
![Redis](https://img.shields.io/badge/Redis-Upstash-red)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-teal)

![Demo](./demo.gif)
> Recording coming soon — try the live demo above

---

## What it solves

- Sending a file from your phone to your laptop without opening WhatsApp or a USB cable
- Sharing a research paper link from one device to another in under 2 seconds
- Sending the same file to multiple people in the same room at once

---

## How it works

1. **Open SendNow on both devices** — they find each other automatically on the same WiFi, no code needed
2. **Tap the device, drop your file** — or paste text, a link, or hit Ctrl+V to send your clipboard
3. **Transfer happens browser-to-browser** — the server never sees your data, only coordinates the connection

---

## Architecture

```
Browser A ──── WebRTC DataChannel ────▶ Browser B
    │                                       │
    └──── WebSocket ──▶ Hono Server ◀───────┘
                             │
                        Redis Pub/Sub
                      (Upstash — free)

The server only handles matchmaking (tiny signaling messages).
File bytes travel directly between browsers via WebRTC.
Server never sees, stores, or touches your files.
```

---

## Technical Highlights

- **WebRTC DataChannels** with 64KB chunking, backpressure handling, live speed + ETA display
- **Stateless signaling server** backed by Redis pub/sub — horizontally scalable to N instances behind a load balancer
- **LAN auto-discovery** via subnet-based peer rooms — devices on same WiFi appear in ~1 second, zero configuration
- **One-to-many broadcast** — each receiver gets an independent P2P DataChannel stream from the sender in parallel
- **Zod-validated WebSocket protocol** — every message is typed and validated at runtime on the server
- **TypeScript strict mode throughout** — zero `any`, full type safety across server and client
- **Production deploy config included** — render.yaml + vercel.json + GitHub Actions CI/CD in the repo

---

## Run locally (3 commands)

```bash
git clone https://github.com/you/sendnow && cd sendnow
cp .env.example server/.env   # fill in your 3 keys (see .env.example)
bun install && docker-compose up -d && bun dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy your own

**Backend → Render (free)**
1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect repo
3. Render auto-detects `render.yaml` — add your env vars in the dashboard
4. Deploy

**Frontend → Vercel (free)**
1. Go to [vercel.com](https://vercel.com) → New Project → import repo
2. Set `VITE_SERVER_URL` to your Render backend URL
3. Deploy

**GitHub Actions CI/CD**
Add these secrets to your GitHub repo:
- `VERCEL_TOKEN` — from vercel.com/account/tokens
- `RENDER_DEPLOY_HOOK` — from Render service Settings → Deploy Hooks

Every push to `main` auto-typechecks and deploys both services.

---

## Environment Variables

| Variable | Where to get it | Required |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | [upstash.com](https://upstash.com) → New Redis DB | ✅ |
| `UPSTASH_REDIS_REST_TOKEN` | Same dashboard | ✅ |
| `METERED_API_KEY` | [metered.ca](https://metered.ca) → Create App | ✅ |
| `TURN_SECRET` | Any 32+ char random string | ✅ |

---

## Planned v2 features

- End-to-end encryption (sender-side AES key, QR-encoded to receiver)
- Resume interrupted transfers
- Folder sharing (zip on the fly)
- PWA / installable app
