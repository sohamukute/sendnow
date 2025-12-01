# SendNow — Complete Build Specification

> P2P file, text & link sharing across any device, any browser. No login. No cloud. Think AirDrop for everyone.

---

## ALL KEYS ARE PROVIDED — START BUILDING IMMEDIATELY

All credentials are already filled in below. **Do not ask for anything. Start building immediately.**

```env
# Upstash Redis (Mumbai, ap-south-1 — Free Tier)
UPSTASH_REDIS_REST_URL=https://integral-bass-100967.upstash.io
UPSTASH_REDIS_REST_TOKEN=gQAAAAAAAAYpnAAIocDE3NjRhYTQ3NDVjMDU0ZTA1YmMwMjdkNGE3MTljOGFlM3AxMTAwOTY3

# Metered TURN Server (app: sendnow, domain: sendnow.metered.live)
# Metered calls this "SECRET KEY" in their Developers dashboard — it IS the API key
METERED_API_KEY=KLSS3KnUEm6AJElkzdAFyx9hsMzv-9JvhEs7B4WWbaXvCvyl
METERED_DOMAIN=sendnow.metered.live

# TURN credential HMAC signing secret — independent of Metered, used server-side only
TURN_SECRET=sndnw2026$xK9mPqR3vL8nW5yT1bH4jE7aZ2cQ8

# Server
PORT=3001
NODE_ENV=development

# Frontend
VITE_SERVER_URL=http://localhost:3001
VITE_APP_URL=http://localhost:5173
```

> **Note on TURN setup**: Metered's `/api/v1/turn/credentials` endpoint uses the `METERED_API_KEY`
> (their "Secret Key") + `METERED_DOMAIN` to fetch fresh ICE server configs at runtime.
> The `TURN_SECRET` is a separate HMAC key used only by your own `/api/turn-creds` endpoint
> to sign time-limited credentials so they can't be hotlinked. Keep all of these server-side only.

Do **not** ask about Vercel, Render, GitHub, domain names, or any other credentials. Build everything completely without stopping.

---

## STACK

| Layer | Technology |
|---|---|
| Runtime | Bun (not Node) |
| Backend framework | Hono with native Bun WebSockets |
| Frontend | React 18 + Vite (Bun-powered) + TypeScript strict |
| Styling | Tailwind CSS v4 — exact CSS variables below |
| State management | Zustand |
| Redis client | @upstash/redis (HTTP-based, serverless-compatible) |
| P2P transport | Native browser WebRTC DataChannels — no library |
| Validation | Zod (all WS messages server-side + env vars at startup) |
| QR codes | qrcode.react |
| Icons | lucide-react |
| Animations | framer-motion |
| Monorepo | Bun workspaces — /server and /client |

---

## REPO STRUCTURE — CREATE EVERY FILE

```
sendnow/
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── ws.ts
│   │   │   ├── room.ts
│   │   │   └── turn.ts
│   │   ├── services/
│   │   │   ├── redis.ts
│   │   │   ├── rooms.ts
│   │   │   └── presence.ts
│   │   ├── lib/
│   │   │   ├── signaling.ts
│   │   │   ├── codegen.ts
│   │   │   └── logger.ts
│   │   └── types.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   └── Join.tsx
│   │   ├── components/
│   │   │   ├── DeviceBubble.tsx
│   │   │   ├── DropZone.tsx
│   │   │   ├── TransferCard.tsx
│   │   │   ├── ShareModal.tsx
│   │   │   ├── ReceiveToast.tsx
│   │   │   └── SessionHistory.tsx
│   │   ├── hooks/
│   │   │   ├── useSignaling.ts
│   │   │   ├── useWebRTC.ts
│   │   │   ├── useTransfer.ts
│   │   │   └── useDevice.ts
│   │   ├── store/
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   ├── chunker.ts
│   │   │   ├── reassembler.ts
│   │   │   ├── deviceInfo.ts
│   │   │   └── types.ts
│   │   └── globals.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── docker-compose.yml
├── render.yaml
├── vercel.json
├── .env.example
├── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml
└── README.md
```

---

## GLOBALS.CSS — USE EXACTLY AS WRITTEN

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.2845 0.1048 3.9068);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.2845 0.1048 3.9068);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.2845 0.1048 3.9068);
  --primary: oklch(0.7192 0.1690 13.4280);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9414 0.0298 12.5805);
  --secondary-foreground: oklch(0.5143 0.1978 16.9350);
  --muted: oklch(0.9694 0.0152 12.4219);
  --muted-foreground: oklch(0.7192 0.1690 13.4280);
  --accent: oklch(0.9414 0.0298 12.5805);
  --accent-foreground: oklch(0.7192 0.1690 13.4280);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.9414 0.0298 12.5805);
  --input: oklch(0.9414 0.0298 12.5805);
  --ring: oklch(0.7192 0.1690 13.4280);
  --chart-1: oklch(0.7192 0.1690 13.4280);
  --chart-2: oklch(0.6450 0.2154 16.4393);
  --chart-3: oklch(0.8097 0.1061 11.6385);
  --chart-4: oklch(0.5858 0.2220 17.5846);
  --chart-5: oklch(0.7596 0.1500 6.7294);
  --sidebar: oklch(1.0000 0 0);
  --sidebar-foreground: oklch(0.2845 0.1048 3.9068);
  --sidebar-primary: oklch(0.7192 0.1690 13.4280);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.9694 0.0152 12.4219);
  --sidebar-accent-foreground: oklch(0.7192 0.1690 13.4280);
  --sidebar-border: oklch(0.9414 0.0298 12.5805);
  --sidebar-ring: oklch(0.7192 0.1690 13.4280);
  --font-sans: 'Inter', sans-serif;
  --font-serif: 'Georgia', serif;
  --font-mono: monospace;
  --radius: 1rem;
  --shadow-color: #fb7185;
  --shadow-sm: 0px 4px 12px 0px hsl(351.3043 94.5205% 71.3725% / 0.15), 0px 1px 2px -1px hsl(351.3043 94.5205% 71.3725% / 0.15);
  --shadow: 0px 4px 12px 0px hsl(351.3043 94.5205% 71.3725% / 0.15), 0px 1px 2px -1px hsl(351.3043 94.5205% 71.3725% / 0.15);
  --shadow-md: 0px 4px 12px 0px hsl(351.3043 94.5205% 71.3725% / 0.15), 0px 2px 4px -1px hsl(351.3043 94.5205% 71.3725% / 0.15);
  --shadow-lg: 0px 4px 12px 0px hsl(351.3043 94.5205% 71.3725% / 0.15), 0px 4px 6px -1px hsl(351.3043 94.5205% 71.3725% / 0.15);
  --tracking-normal: -0.01em;
}

.dark {
  --background: oklch(0.1450 0.0200 3.9068);
  --foreground: oklch(0.9694 0.0152 12.4219);
  --card: oklch(0.1800 0.0250 3.9068);
  --card-foreground: oklch(0.9694 0.0152 12.4219);
  --popover: oklch(0.1450 0.0200 3.9068);
  --popover-foreground: oklch(0.9694 0.0152 12.4219);
  --primary: oklch(0.7192 0.1690 13.4280);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.2500 0.0400 12.5805);
  --secondary-foreground: oklch(0.8097 0.1061 11.6385);
  --muted: oklch(0.2200 0.0300 12.4219);
  --muted-foreground: oklch(0.6000 0.0800 12.4219);
  --accent: oklch(0.2500 0.0400 12.5805);
  --accent-foreground: oklch(0.7192 0.1690 13.4280);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.2500 0.0400 12.5805);
  --input: oklch(0.2500 0.0400 12.5805);
  --ring: oklch(0.7192 0.1690 13.4280);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --tracking-normal: var(--tracking-normal);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body {
    @apply bg-background text-foreground;
    letter-spacing: var(--tracking-normal);
    font-family: var(--font-sans);
  }
}
```

---

## SIGNALING PROTOCOL — TYPESCRIPT DISCRIMINATED UNION

Define this in both `server/src/types.ts` and `client/src/lib/types.ts`. Validate every incoming server-side message with a matching Zod schema before any processing.

```typescript
export type SignalMessage =
  | { type: 'join';        roomCode: string; peerId: string; deviceName: string; deviceEmoji: string; deviceType: 'mobile'|'laptop'|'tablet'|'desktop'; subnet?: string }
  | { type: 'peer_joined'; peerId: string; deviceName: string; deviceEmoji: string; deviceType: string }
  | { type: 'peer_left';   peerId: string }
  | { type: 'offer';       to: string; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer';      to: string; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice';         to: string; from: string; candidate: RTCIceCandidateInit }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'error';       message: string }
```

---

## REDIS DATA SCHEMA

```
room:{code}           HASH  { hostId, created, type:'p2p'|'broadcast' }   TTL 1800s
room:{code}:peers     SET   peerIds                                         TTL 1800s
peer:{id}:meta        HASH  { deviceName, deviceEmoji, deviceType, room }   TTL 300s (heartbeat-refreshed)
lan:{subnet}          SET   peerIds                                         TTL 120s (heartbeat-refreshed)
```

---

## SERVER HTTP ROUTES

```
GET  /                    → serve client/dist (static files in production)
WS   /ws                  → WebSocket signaling endpoint (?room=CODE query param)
POST /api/room            → create room → { code: string }
GET  /api/room/:code      → check room → { exists: boolean, peerCount: number }
GET  /api/turn-creds      → HMAC-signed TURN credentials → { urls, username, credential }
GET  /api/health          → { status: 'ok', connections: number, uptime: number }
```

---

## FEATURES — BUILD ALL OF THESE COMPLETELY

### 1. Auto LAN Discovery (zero config)
- On WebSocket connect, server extracts IP from `x-forwarded-for` header or socket IP
- Subnet key = first two octets (e.g. `192.168` from `192.168.1.42`)
- Server adds peer to `lan:{subnet}` Redis SET with 120s TTL
- Server publishes `peer_joined` to all peers in that SET via Redis pub/sub
- Client: DeviceBubbles animate into view within ~1 second — no user action needed
- Heartbeat every 25s refreshes TTL and keeps peer visible

### 2. WebRTC P2P Transfer Engine
- Sender creates `RTCPeerConnection` + DataChannel `{ ordered: true, label: 'sendnow' }`
- ICE servers: `stun:stun.l.google.com:19302` + TURN from `/api/turn-creds`
- SDP offer/answer + ICE candidates routed through WebSocket signaling
- **Chunk protocol**:
  - First DataChannel message: JSON metadata `{ transferId, filename, mimeType, size, totalChunks }`
  - Subsequent messages: raw `ArrayBuffer` chunks, 64KB each
- Sender tracks bytes sent, rolling 500ms speed window, ETA calculation
- Receiver collects chunks in `Map<number, ArrayBuffer>`, reassembles on completion, auto-downloads via Blob URL
- **Backpressure**: pause sending when `channel.bufferedAmount > 16MB`, resume at `< 4MB`
- Full cleanup: close DataChannel + PeerConnection on transfer end or unmount

### 3. Transfer Types — All Four
- **Files**: drag-drop onto DropZone or click file picker. Multiple files = sequential transfers
- **Text/Notes**: textarea in DropZone, Ctrl+Enter or Send button. Rendered as text card on receiver
- **Links**: URL regex auto-detection in text input. Rendered as clickable link card with domain shown
- **Clipboard**: `window` paste event anywhere on page — Ctrl+V/Cmd+V reads clipboard, auto-sends to the currently selected (highlighted) DeviceBubble

### 4. One-to-Many Broadcast
- "Broadcast" button → creates room → shows ShareModal with QR + code
- Each joining receiver = separate `RTCPeerConnection` from sender to that receiver
- Sender loops over all DataChannels, sends identical chunk to each in parallel
- TransferCard shows total progress + expandable per-receiver breakdown

### 5. Cross-Network Pairing
- "Share outside WiFi" → POST `/api/room` → 4-char code + QR
- QR encodes full URL: `https://{VITE_APP_URL}/join/{code}`
- `/join/:code` page: auto-connects WebSocket with room code, auto-triggers WebRTC negotiation with host
- If room not found: toast + redirect home after 3s

### 6. Session History (in-memory only)
- Zustand store tracks all completed transfers
- Columns: direction, filename/snippet, size, speed, time ago
- "Download again" button caches Blob URL until page close
- No persistence — cleared on reload by design (privacy default)

---

## UI/UX — EVERY DETAIL MATTERS

### Layout rules
- **No home page. No marketing. No onboarding.** The URL is the app. Arrive and you're live.
- Desktop: two-column. Left = nearby devices grid. Right = DropZone + session history.
- Mobile: single column, large 48px+ tap targets, device bubbles scrollable row at top.
- Tablet: adaptive two-column or single column based on viewport.

### Empty state
- Centered pulsing rose-colored ring animation
- Text: "Open SendNow on another device to connect"
- Subtle — not distracting, not a CTA wall

### DeviceBubble
- ~120px circle desktop / ~80px mobile
- Large emoji (2rem), device name below in small text, OS icon badge corner
- **Entrance**: `spring` from below — `{ stiffness: 300, damping: 24 }`
- **Hover**: scale 1.05 + rose glow using `--shadow-color`
- **Selected**: `--primary` color ring
- **Sending**: pulsing ring animation around bubble
- **Disconnected**: 40% opacity, name has strikethrough

### TransferCard
- Slides up from bottom (`spring { stiffness: 400, damping: 30 }`)
- MIME-based file icon, filename, human-readable size
- Animated progress bar filling with `--primary` color
- Live speed: "4.2 MB/s" — live ETA: "~3 seconds remaining"
- Cancel button (X) — kills DataChannel cleanly
- On complete: green checkmark animation → auto-dismiss after 3s

### ReceiveToast
- Slides in top-right (`x: 100 → 0`)
- "{emoji} {deviceName} wants to send **{filename}** ({size})"
- Accept (primary button) / Decline (ghost button)
- 30-second countdown ring — auto-decline on timeout
- "Always accept from this device" session toggle

### ShareModal
- Centered modal, backdrop blur
- Left: QR code 256×256
- Right: 4-char code in large monospace, Copy Link button, Web Share API button if supported
- Live 30-minute countdown timer for room expiry

---

## FRAMER-MOTION ANIMATION SPECS

```typescript
// DeviceBubble entrance
initial={{ opacity: 0, y: 40, scale: 0.8 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: 20, scale: 0.9 }}
transition={{ type: 'spring', stiffness: 300, damping: 24 }}

// TransferCard slide up
initial={{ opacity: 0, y: 100 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: 100 }}
transition={{ type: 'spring', stiffness: 400, damping: 30 }}

// ReceiveToast slide in
initial={{ opacity: 0, x: 100 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: 100 }}
transition={{ type: 'spring', stiffness: 350, damping: 28 }}

// Progress bar
// Use framer-motion `animate={{ width: `${progress}%` }}` with `transition={{ ease: 'linear' }}`
```

---

## ERROR HANDLING & RESILIENCE

| Scenario | Behaviour |
|---|---|
| WebSocket disconnect | Exponential backoff: 1s → 2s → 4s → 8s → max 30s. Small reconnecting pill indicator in corner. |
| ICE connection failure | Toast: "Direct connection failed — trying relay…" then retry with TURN automatically |
| Transfer error mid-way | Error state in TransferCard with filename + "Retry" button |
| Room not found | Toast notification + auto-redirect home after 3 seconds |
| File over 100MB | Client-side check before initiating — error toast, no transfer started |
| DataChannel buffer overflow | Pause at `bufferedAmount > 16MB`, auto-resume at `< 4MB` |

---

## CODE QUALITY STANDARDS — NON-NEGOTIABLE

- **TypeScript strict mode** in all `tsconfig.json` — `"strict": true`. Zero `any`. Zero `@ts-ignore`.
- **Zod validation** for every incoming WebSocket message on the server before processing
- **Env validation at startup** — server crashes with readable error if any required env var is missing:
  ```typescript
  const EnvSchema = z.object({
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    METERED_API_KEY: z.string().min(1),
    TURN_SECRET: z.string().min(32),
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
  })
  ```
- **Structured logger** in `server/src/lib/logger.ts`:
  ```typescript
  // Output format: [INFO] 2025-04-17T10:23:11Z [ws] peer joined {"peerId":"abc","room":"X7K2"}
  logger.info('ws', 'peer joined', { peerId, room })
  logger.warn('ice', 'candidate failed', { error: err.message })
  logger.error('redis', 'connection lost', { error })
  ```
- **Clean hooks** — hooks contain all logic. Components only call hooks and render JSX. No fetch/WebSocket/WebRTC code in components.
- **No memory leaks** — every `useEffect` has a cleanup function. All event listeners removed. All timers cleared. All `RTCPeerConnection` instances closed on unmount.
- **AbortController** for all fetch calls that might outlive their component.
- **Error boundaries** wrapping `TransferCard` and `ReceiveToast`.

---

## ENVIRONMENT VARIABLES

### server/.env.example AND root .env.example
```env
# Upstash Redis — free at upstash.com (Mumbai/ap-south-1 for India)
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Metered TURN relay — free 50GB/month at metered.ca
# "SECRET KEY" from metered.ca Developers page goes here
METERED_API_KEY=your_metered_secret_key_here
# Your Metered app domain from the Developers page
METERED_DOMAIN=yourapp.metered.live

# TURN credential HMAC signing — any 32+ char random string, never expose publicly
TURN_SECRET=replace_this_with_32_random_characters_minimum

# Server
PORT=3001
NODE_ENV=development

# Frontend (Vite uses VITE_ prefix)
VITE_SERVER_URL=http://localhost:3001
VITE_APP_URL=http://localhost:5173
```

### Zod env schema — validate at server startup
```typescript
const EnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  METERED_API_KEY: z.string().min(1),
  METERED_DOMAIN: z.string().min(1),
  TURN_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  CLIENT_URL: z.string().url().optional(),
})
```

### /api/turn-creds — fetch from Metered at request time
```typescript
// Call Metered's REST API to get fresh ICE server list
const res = await fetch(
  `https://${env.METERED_DOMAIN}/api/v1/turn/credentials?apiKey=${env.METERED_API_KEY}`
)
const iceServers = await res.json()
// Always prepend Google STUN as first entry (free, always available)
return c.json([{ urls: 'stun:stun.l.google.com:19302' }, ...iceServers])
```

---

## DEPLOY FILES — PRODUCTION READY

### render.yaml
```yaml
services:
  - type: web
    name: sendnow-server
    runtime: node
    region: oregon
    plan: free
    buildCommand: cd server && bun install && bun run build
    startCommand: cd server && bun run start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: UPSTASH_REDIS_REST_URL
        sync: false
      - key: UPSTASH_REDIS_REST_TOKEN
        sync: false
      - key: METERED_API_KEY
        sync: false
      - key: METERED_DOMAIN
        sync: false
      - key: TURN_SECRET
        sync: false
      - key: CLIENT_URL
        sync: false
```

### vercel.json
```json
{
  "buildCommand": "cd client && bun install && bun run build",
  "outputDirectory": "client/dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### docker-compose.yml (local dev only)
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
volumes:
  redis_data:
```

### .github/workflows/deploy.yml
```yaml
name: CI/CD

on:
  push:
    branches: [main]

jobs:
  typecheck:
    name: TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: cd server && bun run typecheck
      - run: cd client && bun run typecheck

  deploy-frontend:
    name: Deploy Frontend → Vercel
    needs: typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm i -g vercel
      - run: vercel --token=${{ secrets.VERCEL_TOKEN }} --prod --yes

  deploy-backend:
    name: Deploy Backend → Render
    needs: typecheck
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deploy Hook
        run: curl -fsSL -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}"
```

---

## ROOT package.json

```json
{
  "name": "sendnow",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["server", "client"],
  "scripts": {
    "dev": "concurrently -n server,client -c blue,magenta \"bun run dev:server\" \"bun run dev:client\"",
    "dev:server": "cd server && bun run dev",
    "dev:client": "cd client && bun run dev",
    "build": "cd server && bun run build && cd ../client && bun run build",
    "typecheck": "cd server && bun run typecheck && cd ../client && bun run typecheck"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

Server `package.json` dev script: `bun --watch src/index.ts`
Client `vite.config.ts`: proxy `/api` and `/ws` to `http://localhost:3001`

---

## README.md — WRITE THIS EXACTLY

```markdown
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
```

---

## WHAT NOT TO BUILD

- No authentication or user accounts
- No server-side file storage of any kind
- No database other than Redis (ephemeral signaling state only)
- No video or audio calls
- No PWA or service worker
- No analytics or tracking scripts
- No file size above 100MB (enforce client-side)
- No end-to-end encryption (note as v2 in README)

---

## FINAL INSTRUCTIONS

1. **Ask for the 3 keys first. Then build everything. No other questions.**
2. **Build every single file listed in the repo structure.** No placeholders. No `// TODO`. No `// implement this`. Every function fully implemented.
3. The app must run end-to-end with: `bun install && docker-compose up -d && bun dev`
4. TypeScript must compile with zero errors in both workspaces.
5. When complete, print this checklist:

```
✅ Build Complete — SendNow

[ ] All files in repo structure created
[ ] TypeScript strict — zero errors in server/
[ ] TypeScript strict — zero errors in client/
[ ] Zod validation on all WS messages (server)
[ ] Env validation at startup with clear errors
[ ] Structured logger in server/src/lib/logger.ts
[ ] WebRTC P2P transfer working end-to-end
[ ] LAN auto-discovery implemented
[ ] All 4 transfer types: file, text, link, clipboard
[ ] Broadcast (one-to-many) implemented
[ ] Cross-network pairing with QR + 4-char code
[ ] Session history in Zustand store
[ ] All framer-motion animations implemented
[ ] Error handling and reconnect logic complete
[ ] render.yaml present and valid
[ ] vercel.json present and valid
[ ] docker-compose.yml for local dev
[ ] .github/workflows/deploy.yml CI/CD pipeline
[ ] .env.example with all keys documented
[ ] README.md with architecture section
[ ] `bun dev` starts both server and client
```
