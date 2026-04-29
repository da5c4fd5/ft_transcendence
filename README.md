*This project has been created as part of the 42 curriculum by cscache, ldubois, llechert, smamalig.*

# Capsul

A personal memory journal where your consistency shapes a living tree. Write daily capsuls, share memories with friends, and watch your tree grow, or wither, depending on how often you return.

---

## Description

**Capsul** is a digital memory journal built as the final project of the 42 cursus. Users write daily memory entries (*capsuls*), attach photos or audio, classify their mood with AI, and optionally share entries with friends who can contribute their own perspective.

The central gamification mechanic is a **living tree** whose health is computed from four factors: recency of last entry, writing streak, total capsuls, and words written. The tree decays over time if the user stops engaging, creating a gentle retention loop. A companion mini-game on the Timeline page challenges users to guess when one of their past memories was written.

The project was built on a full custom stack (no SaaS shortcuts), self-hosted AI inference, and ships as a single `make` command.

---

## Instructions

### Prerequisites

- [Podman](https://podman.io/) and [podman-compose](https://github.com/containers/podman-compose)
- A `.env` file at the project root (copy from `.env.example`)

### Setup

```bash
cp .env.example .env
# Edit .env — at minimum set DOMAIN, POSTGRES_DB, POSTGRES_USER
make
```

`make` (or `make start`) will:
1. Generate self-signed TLS certificates
2. Build and start all containers (Nginx, backend, frontend, PostgreSQL, Ollama, mood-classifier)

The app will be available at `https://<DOMAIN>` (or `https://localhost` with a self-signed cert).

### Environment variables

| Variable | Description | Default |
|---|---|---|
| `DOMAIN` | Public domain name | `transcen.dence.fr` |
| `HTTP_PORT` | HTTP redirect port | `8080` |
| `HTTPS_PORT` | HTTPS port | `8443` |
| `POSTGRES_DB` | Database name | `capsul` |
| `POSTGRES_USER` | Database user | `capsul` |
| `ROOT_DIR` | Data directory for certs, database, media, models | `~/goinfre/capsul` |
| `OLLAMA_MODEL` | LLM model for writing prompts / wellness tips | `qwen3:4b-instruct-2507-q4_K_M` |
| `MOOD_CLASSIFIER_MODEL_ID` | HuggingFace model for mood analysis | `AnasAlokla/multilingual_go_emotions_V1.2` |
| `SMTP_URL` | SMTP connection string (optional) | — |

### GPU acceleration

GPU is enabled by default (`GPU=1`). To disable it:

```bash
GPU=0 make
```

### Other commands

```bash
make stop      # Stop all containers
make logs      # Stream logs
make fclean    # Full teardown (removes volumes and images)
make cert-status # Inspect the certificate currently served by nginx
```

---

## Resources

### Technologies used

- [Preact](https://preactjs.com/) — lightweight React-compatible frontend library
- [Vite](https://vitejs.dev/) — frontend build tool
- [Elysia.js](https://elysiajs.com/) — TypeScript web framework for Bun
- [Bun](https://bun.sh/) — JavaScript runtime and package manager
- [Prisma](https://www.prisma.io/) — TypeScript ORM
- [PostgreSQL](https://www.postgresql.org/) — relational database
- [Nginx](https://nginx.org/) — reverse proxy and TLS termination
- [Podman](https://podman.io/) — rootless container engine
- [Tailwind CSS](https://tailwindcss.com/) — utility-first CSS framework
- [Ollama](https://ollama.com/) — local LLM inference server
- [FastAPI](https://fastapi.tiangolo.com/) — Python API framework for the mood classifier
- [HuggingFace Transformers](https://huggingface.co/) — sentiment analysis model

### AI usage

AI tools (Claude) were used during development for:
- Code review and debugging assistance
- Writing boilerplate and repetitive patterns
- Drafting and iterating on this README

All AI-generated code was reviewed, tested, and integrated by team members.

---

## Team Information

| Login | Name | Role |
|---|---|---|
| **smamalig** | Serghei | Tech Lead |
| **ldubois** | Louis | Product Owner + DevOps |
| **cscache** | Clothilde | Product Designer |
| **llechert** | Lancelot | Product Manager |

Primary areas of ownership are described in the Individual Contributions section below.

---

## Project Management

- **Tool**: Notion (meeting notes, design, resources)
- **Cadence**: Weekly in-person meetings at 42 Paris + daily in-cluster collaboration
- **Communication**: Private Discord server
- **Methodology**: Lightweight Scrum, weekly sprints, async task tracking on Notion, synchronous reviews at 42

---

## Technical Stack

### Frontend — Preact + Vite + Tailwind CSS

Preact was chosen over vanilla React for its minimal footprint (~3 KB) while keeping full JSX and hooks compatibility. Vite provides near-instant hot reloads during development. Tailwind CSS enables a consistent design system without runtime overhead.

### Backend — Elysia.js on Bun

Elysia is a TypeScript-first framework built on Bun, offering end-to-end type safety, a familiar Express-like API, and native WebSocket support. Bun's fast startup and built-in bundler make it ideal for a small-team project where iteration speed matters.

### Database — PostgreSQL + Prisma

PostgreSQL is battle-tested and well-suited for relational data (users, memories, friends, contributions). Prisma provides type-safe queries, schema migrations, and a readable schema definition language.

### Infrastructure — Nginx + Podman Compose

Nginx handles TLS termination, static frontend serving, and reverse-proxying all API routes. Podman runs rootless containers, satisfying 42's security requirements. The entire stack starts with a single `make` command.

### AI — Ollama + Python mood-classifier

Ollama serves the `qwen3` LLM locally for writing prompt suggestions and daily wellness tips grounded in the user's memory history. A separate FastAPI microservice wraps a HuggingFace multilingual sentiment model (`multilingual_go_emotions`) to classify mood from memory text. Both run fully self-hosted — no external API keys required.

---

## Database Schema

```
User
├── id, email, username, displayName, avatarUrl
├── passwordHash (argon2id), emailVerifiedAt
├── mfaSecret (TOTP, AES-256-GCM encrypted)
├── publicApiKeyHash, publicApiKeyPreview
├── notificationSettings (JSON), treeState (JSON)
├── isAdmin, lastActiveAt
├── sessions[] → Session
├── memories[] → Memory
├── contributions[] → Contribution
├── sentChatMessages[] / receivedChatMessages[] → ChatMessage
└── promptSuggestions[] → PromptSuggestion

Session
└── userId, userAgent, createdAt

Memory
├── userId, content, date (calendar day)
├── mood, moodSource (MANUAL | CLASSIFIED)
├── isOpen (shareable), shareToken
├── media[] → Media
├── contributions[] → Contribution
└── moodClassificationJob → MoodClassificationJob

Media
└── memoryId, url, mimeType

Contribution
└── memoryId, contributorId (nullable), guestName, content, mediaUrl

Friend
└── requesterId, recipientId, status (PENDING | ACCEPTED)

ChatMessage
└── senderId, recipientId, content, readAt

MoodClassificationJob
└── memoryId, status, model, rawLabel, rawScore, mood

PromptSuggestion / PromptSuggestionState
└── userId, prompt, position, generationStatus
```

---

## Features List

### Auth & Security

| Feature | Description | Author(s) |
|---|---|---|
| Email + password auth | Registration, login, JWT sessions, email verification | smamalig |
| Two-Factor Authentication | TOTP via authenticator app, AES-256-GCM secret storage | smamalig |
| Session hardening | Cookie security, JWT subject binding, device metadata | smamalig |

### Profile & Social

| Feature | Description | Author(s) |
|---|---|---|
| User profile | Editable display name, avatar upload, account settings | cscache, smamalig |
| Friends system | Friend requests, friend list, real-time online presence | cscache, smamalig |
| Ping | Send a real-time notification ping to a friend | cscache, smamalig |
| Direct chat | Real-time messages between friends | cscache, smamalig |

### Memory Journal

| Feature | Description | Author(s) |
|---|---|---|
| Daily capsuls | One memory entry per day, 180-char limit, editable until midnight | smamalig, cscache |
| Media uploads | Photos and audio attached to memories, protected file serving | llechert, smamalig |
| Memory sharing | Share via link; friends and guests can add written contributions | smamalig |
| Memory search & filter | Search by keyword, filter by date range with calendar picker | llechert, cscache |

### AI

| Feature | Description | Author(s) |
|---|---|---|
| Mood classification | Automatic sentiment analysis via multilingual go_emotions model | ldubois |
| AI writing prompts | Context-aware prompts streamed from self-hosted Ollama LLM | ldubois |
| Daily wellness tips | Personalized wellbeing tips grounded in the user's memory history | ldubois |

### Gamification & Retention

| Feature | Description | Author(s) |
|---|---|---|
| Living tree | 8-stage tree with 4-variable health score; grows or decays with activity | cscache |
| "When was this?" game | Date-guessing mini-game on real memories, 5 rounds, scored by accuracy | cscache |

### Admin & Platform

| Feature | Description | Author(s) |
|---|---|---|
| Admin dashboard | User CRUD, role management, AI usage analytics, email verification toggle | smamalig, llechert |
| Public API | Rate-limited REST API with API key auth and Swagger docs | smamalig |
| GDPR compliance | Full data export as JSON, confirmed account deletion | smamalig |
| Email notifications | Branded HTML emails: verification, reminders, inactivity alerts | ldubois, cscache |
| Infra & deployment | Podman Compose, Nginx self-signed TLS, Makefile, GPU support | ldubois |

---

## Modules

### WEB

| Module | Ref | Points | Notes |
|---|---|---|---|
| Frameworks frontend + backend | WEB 1 | 2 | Preact + Vite (frontend) / Elysia.js + Bun (backend) |
| Real-time features (WebSockets) | WEB 4 | 2 | Ping, live chat, online presence |
| User interaction (chat + profile + friends) | WEB 5 | 2 | Direct chat, friend requests, public profiles |
| Public API (key, rate-limit, docs, 5+ endpoints) | WEB 6 | 2 | Swagger UI, GET/POST/PUT/DELETE on memories, X-API-Key auth |
| ORM for the database | WEB 7 | 1 | Prisma with PostgreSQL |
| File upload & management | WEB 14 | 1 | Photos and audio on memories + contributions, avatar |
| Custom design system (10+ components) | WEB 12 | 1 | AppLogo, Avatar, Badge, Button, Footer, Input, MediaPreview, MemoryModal, Modal, Navbar, TreeVisual |

**Web: 11 pts**

---

### USER MANAGEMENT

| Module | Ref | Points | Notes |
|---|---|---|---|
| Standard user management & auth | UM 1 | 2 | Editable profile, avatar, friends, online status |
| Advanced permissions system | UM 4 | 2 | Admin panel — user CRUD, admin/user roles, guest contributions |
| 2FA (Two-Factor Authentication) | UM 6 | 1 | TOTP via authenticator app, AES-256-GCM encrypted secret |
| User activity analytics dashboard | UM 7 | 1 | Admin view: user stats, AI prompt consumption per user |

**User Management: 6 pts**

---

### ARTIFICIAL INTELLIGENCE

| Module | Ref | Points | Notes |
|---|---|---|---|
| Sentiment analysis | AI 7 | 1 | Python/FastAPI microservice, multilingual go_emotions model |

**AI: 1 pt**

---

### DATA AND ANALYTICS

| Module | Ref | Points | Notes |
|---|---|---|---|
| GDPR compliance | DA | 1 | Full data export as JSON, confirmed account deletion, email verification |

**Data: 1 pt**

---

### MODULE OF YOUR CHOICE

| Module | Ref | Points | Notes |
|---|---|---|---|
| Behavioral Retention Loop | R2 | 1 | Living tree (8 stages, 4-variable decay algorithm) + "When was this?" date-guessing game |

**Retention: 1 pt**

---

**Total: 20 pts** (minimum required: 14 pts)

---

## Individual Contributions

### smamalig — Serghei (Tech Lead, Backend)

Designed and built the entire backend: Elysia.js module structure, Prisma schema, authentication (JWT, argon2id, cookie hardening), 2FA (TOTP + AES-256-GCM), public API (rate limiting, API keys, Swagger), memory sharing, admin endpoints, GDPR export, and security hardening across the board (MIME validation, session binding, anti-spoofing, SVG rejection).

**Challenge:** Collaborating effectively in a team setting, coordinating API design and decisions across four people working simultaneously.

---

### ldubois — Louis (Product Owner, DevOps, AI, DB)

Managed the team and project organization. Built the full container infrastructure (Podman Compose, Dockerfiles, Makefile, Nginx self-signed TLS). Integrated Ollama for streaming writing prompts and wellness tips. Built the Python mood-classifier microservice (FastAPI + go_emotions model) and its async job queue. Implemented the HTML email system (reminders, inactivity alerts, AI digests).

**Challenge:** Setting up self-hosted AI inference infrastructure from scratch: getting Ollama, the mood-classifier, and their inter-service communication to work reliably inside containers.

---

### cscache — Clothilde (Product Designer, Frontend)

Defined the product vision and UX. Built the living tree (8-stage component with animations), the "When was this?" timeline game, the friends and chat UI, the MemoryModal, the Today page, and memory search. Help to connect the backend.

**Challenge:** Discovering a completely unfamiliar stack (TypeScript, Preact, Elysia) mid-project and becoming productive quickly enough to own large frontend features.

---

### llechert — Lancelot (Product Manager, Frontend Developer)

Set up Tailwind CSS and the frontend scaffold. Built auth pages, Navbar, Footer, and the Memories page with calendar date filter. Iteratively improved the Admin page. Added audio upload with progress, account deletion flow, and frontend–backend synchronization. Fixed animations and UI details across Timeline, Guest, and Profile pages.

**Challenge:** Starting with no prior knowledge of the entire stack (Preact, Vite, Tailwind, TypeScript) and ramping up quickly to contribute full features from the first sprint.
