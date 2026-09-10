# SkillMatch

SkillMatch is a peer-to-peer skill exchange platform. Members list the
skills they can teach and the skills they want to learn, get matched with
compatible peers, schedule live learning sessions, and build reputation
through reviews.

## Architecture

- **Frontend** — [Next.js](https://nextjs.org) (App Router), TypeScript,
  Tailwind CSS
- **Application backend / database** — [Convex](https://convex.dev)
- **Authentication / identity** — [Clerk](https://clerk.com)
- **Video** — [Stream Video](https://getstream.io/video/)
- **Deployment** — [Vercel](https://vercel.com)

This is a **modular monolith** built on managed services — no separate
Node backend, no self-hosted database, no microservices. Convex owns
application data and server-side logic; Clerk owns identity; Stream owns
video call transport. Domain boundaries are enforced in code, not by
splitting services.

## Core Product Loop

```
DISCOVER → MATCH → CONNECT → SCHEDULE → MEET → LEARN → REVIEW → REPUTATION
```

## Domain Modules

Each domain owns its own Convex functions, UI components, and rules:

| Domain          | Responsibility                                              |
| ---------------- | ------------------------------------------------------------ |
| `users`          | Profile, onboarding, account state                           |
| `skills`         | Skill catalog and user-skill relationships                   |
| `matching`       | Candidate discovery, deterministic match scoring/explanation |
| `exchanges`      | Exchange request lifecycle                                   |
| `availability`   | Recurring availability and overlap logic                     |
| `sessions`       | Scheduling, conflict detection, session lifecycle, Stream    |
| `reviews`        | Review eligibility, creation, and derived reputation queries |
| `notifications`  | In-app notification lifecycle                                |

Reputation, session history, and connections are **derived** from existing
data (`reviews` + `learningSessions`, `learningSessions`, and
`exchangeRequests.status = ACCEPTED`, respectively) rather than stored as
separate collections.

## Development Principles

- Modular monolith on managed infrastructure — no bespoke backend services
- Server-side authorization on every protected operation: resolve identity
  → resolve user → load resource → verify ownership/participation/state →
  validate input → mutate. The frontend is not a security boundary.
- Deterministic MVP matching — no AI dependency for core matching
- Derived reputation instead of a separate stored collection
- Avoid premature abstraction — no generic `services/`, `repositories/`,
  or "universal" components until a real need emerges

## Running Locally

```bash
npm install
cp .env.example .env.local   # fill in Convex/Clerk/Stream keys
npx convex dev                # first run links/creates a Convex deployment
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev      # start the Next.js dev server
npm run build    # production build
npm run lint     # ESLint
```
