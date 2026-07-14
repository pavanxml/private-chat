# Private Chat

A private, temporary, admin-controlled chat platform. There is **no public registration** —
only a single Admin exists. The Admin creates chat rooms and generates temporary
username/password credentials that guests use to join. Multiple guests can share the
same credential set. Everything (rooms, credentials, messages, presence) lives in
PostgreSQL, and messaging happens in real time over Socket.IO.

---

## Tech Stack

| Layer          | Technology                              |
|----------------|------------------------------------------|
| Frontend       | React 18, TypeScript, Tailwind CSS, Vite |
| Backend        | Node.js, Express.js, Socket.IO           |
| Database       | PostgreSQL                                |
| Auth           | JWT (separate admin & guest tokens)      |

---

## Project Structure

```
private-chat/
├── backend/
│   ├── database/
│   │   ├── schema.sql          # Full DB schema (tables, indexes, triggers)
│   │   └── seed.js             # Creates/resets the single Admin account
│   ├── src/
│   │   ├── config/             # env.js, db.js (pg pool)
│   │   ├── controllers/        # auth, rooms, credentials, messages
│   │   ├── middleware/         # JWT auth, validation, error handling
│   │   ├── routes/             # Express routers
│   │   ├── sockets/            # Socket.IO connection/message handler
│   │   ├── utils/              # id/credential generators, logger
│   │   ├── app.js              # Express app (security, routes)
│   │   └── server.js           # HTTP + Socket.IO bootstrap
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                # axios client, auth/rooms API calls, socket client
│   │   ├── components/         # Button, Input, Modal, MessageBubble, etc.
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── hooks/               # useChatSocket
│   │   ├── pages/               # AdminLogin, AdminDashboard, ChatRoom, RoomLogin, Error
│   │   ├── types/                # Shared TypeScript interfaces
│   │   ├── App.tsx               # Router configuration
│   │   └── main.tsx
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml
```

---

## Option A — Run with Docker Compose (fastest)

Requires Docker + Docker Compose.

```bash
cd private-chat
cp backend/.env.example backend/.env   # optional, compose sets sane defaults
docker compose up --build
```

This starts PostgreSQL, applies `schema.sql` automatically (via the Postgres init
volume), builds the backend, and builds/serves the frontend with nginx.

- Frontend: http://localhost:8080
- Backend API: http://localhost:5000

Then seed the admin account (one-time):

```bash
docker compose exec backend node database/seed.js admin YourStrongPassword123
```

---

## Option B — Run manually (local development)

### 1. PostgreSQL

Create a database and apply the schema:

```bash
createdb private_chat
psql -d private_chat -f backend/database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL and a strong JWT_SECRET (e.g. `openssl rand -hex 64`)
npm install
npm run db:seed -- admin YourStrongPassword123   # creates the Admin account
npm run dev                                       # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev     # starts on http://localhost:5173, proxies /api and /socket.io to :5000
```

Open http://localhost:5173, log in as admin at `/admin/login`, create a room, and
generate credentials to share with guests.

---

## How It Works

**Admin flow**
1. Admin logs in at `/admin/login` with the one seeded account.
2. From `/admin/dashboard`, the Admin creates chat rooms, generates temporary
   username/password pairs (with optional expiry), views online users, removes
   users, clears chat history, closes/reopens/deletes rooms.
3. Generated credentials are shown **once** in a modal (copy button provided) —
   the plaintext password is never stored, only its bcrypt hash.

**Guest flow**
1. Guest opens the shared URL (e.g. `https://yourapp.com/chat/ABCD123`).
2. Enters the room code (pre-filled from the URL), username, and password.
3. On success, receives a short-lived guest JWT and is redirected into the live
   chat room, connecting over Socket.IO for real-time messaging, typing
   indicators, and presence.
4. Multiple guests can log in with the *same* credential set simultaneously.

---

## Security Notes

- Passwords (admin and guest credentials) are hashed with **bcrypt** — plaintext
  is never persisted.
- **JWT** tokens are role-scoped (`admin` vs `guest`) and validated on every
  REST call and Socket.IO connection.
- **express-validator** validates and sanitizes all inputs.
- **Parameterized SQL queries** (via `pg`) prevent SQL injection.
- **Helmet** sets secure HTTP headers; React's default escaping plus `helmet`'s
  CSP-friendly defaults mitigate XSS. All chat content is rendered as text, never
  raw HTML.
- **express-rate-limit** throttles login endpoints against brute-force attempts.
- Deploy behind HTTPS/TLS (terminate at nginx, a reverse proxy, or a load
  balancer) in production — the app is HTTPS-ready but does not terminate TLS
  itself.

---

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for the full list. At
minimum, set a strong, random `JWT_SECRET` before deploying anywhere real.
