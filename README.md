# SendNow

Instant P2P file, text and link sharing across devices. No login, no account, files go directly browser to browser over WebRTC.

Live: https://SendnowP2P.vercel.app

Devices on the same WiFi find each other automatically. To connect across networks, share a room code with the other person.

Built with React, TypeScript, Vite, Bun, Hono, WebRTC DataChannels, Upstash Redis. Frontend on Vercel, backend on Railway.

## Run locally

```
git clone https://github.com/sohamkute/sendnow
cd SendNow
cp server/.env.example server/.env
bun install
bun dev
```

Frontend at http://localhost:5173, server at http://localhost:3000.

Fill in server/.env with your Upstash Redis credentials (free at upstash.com):

```
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
