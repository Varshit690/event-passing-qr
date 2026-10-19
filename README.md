# EVENTORA — Discover. Book. Experience.

> **Next-Generation Event Discovery, Cryptographic QR Pass Issuance & Real-Time Gate Verification Platform**

EVENTORA is an event ticketing platform built for college festivals, music concerts, tech conferences, hackathons, workshops, and community events.

---

## 🌟 Key Features

### 1. Modern UI/UX (Linear / Stripe / Apple Inspired)
- **Dark-First Design System**: Handpicked color palette (`#09090F`, `#11111B`, `#171723`, vibrant `#8B5CF6` and `#06B6D4` accents) with a theme switcher supporting dark and light modes.
- **Micro-Interactions**: Smooth hover elevations, glassmorphism blur, badge chips, and celebration confetti.
- **Mobile-First Responsive Layout**: Optimized for mobile phones, tablets, and desktop displays.

### 2. Event Discovery & Browsing
- **Real-Time Search & Filtering**: Filter by category (Music, Tech, Hackathons, College Fests, Workshops, Sports, etc.), location, and pricing tier (Free RSVP vs Paid).
- **URL Parameter Synchronization**: Search queries, categories, and filters sync directly with browser URL parameters for shareable links.
- **Detailed Event Pages**: Hero banners, organizer badges, interactive ticket tier selections, live pricing calculations, and guideline lists.

### 3. Cryptographic Digital QR Passes & PDF Export
- **Security-First QR Pass**: Passes are generated with non-sequential, 128-bit cryptographically secure unpredictable tokens (`EVT-XXXXX`) and stored as SHA-256 hashes.
- **Perforated Ticket Container Design**: Digital passes with notch cutouts, ref codes, attendee details, and live QR code rendering.
- **Instant PDF Export & Print**: One-click PDF download generated client-side using `jspdf`.

### 4. Dedicated Organizer Gate Scanner & Anti-Fraud Verification
- **Dual Verification Modes**: Real-time camera QR scanning via `html5-qrcode` and manual reference code fallback.
- **Atomic Multi-Scanner Protection**: Database transactions guarantee that two gate scanners cannot redeem the same ticket simultaneously.
- **Audio & Visual Feedback**: Distinct audio cues and animated feedback states:
  - 🟢 **VALID**: Access Granted (Green)
  - 🟡 **ALREADY_USED**: Duplicate Rejection with Previous Check-in Timestamp (Amber)
  - 🔴 **INVALID / WRONG_EVENT**: Fraudulent or Wrong Event Pass (Red)

### 5. SaaS Organizer & Admin Dashboards
- **Real-Time Telemetry**: Check-in velocity and gate throughput charts powered by `recharts`.
- **Occupancy Metrics**: Live progress bars tracking capacity utilization, tickets issued, and remaining spots.
- **Platform Administration**: User directory, event moderation, and system health status.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion, TanStack Query, Recharts, Sonner, Canvas Confetti |
| **Backend** | Node.js, Express.js, TypeScript, REST APIs, Helmet, CORS, Cookie-Parser, Morgan, Zod |
| **Database** | SQLite (zero-setup local development) & PostgreSQL compatible, Prisma ORM, Prisma Migrations & Seed |
| **Security** | bcrypt password hashing, JWT sessions, SHA-256 token hashing, atomic transactions |
| **Testing** | Vitest, Supertest integration testing suite |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 1. Installation
Clone or navigate to the repository directory and install dependencies:

```bash
# Install root orchestrator dependencies
npm install

# Install client dependencies
cd client
npm install --legacy-peer-deps
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Database Setup & Seeding
From the `server` directory, push the Prisma schema and seed initial demo data:

```bash
cd server
# Push schema to SQLite database (dev.db)
npx prisma db push

# Seed realistic demo users, events, and tickets
npx tsx prisma/seed.ts
cd ..
```

### 3. Run Development Servers
From the root directory, launch both client and server concurrently:

```bash
# Runs Server on http://localhost:5000 and Client on http://localhost:5173
npm run dev
```

Alternatively, run individually:
- Client: `npm run dev:client` (http://localhost:5173)
- Server: `npm run dev:server` (http://localhost:5000)

---

## 🧪 Running Automated Tests

The backend includes an automated integration test suite covering registration, login, RBAC permissions, ticket booking transactions, capacity limits, and QR verification:

```bash
cd server
npm run test
```

All 15 integration tests run and pass against the Prisma database.

---

## 👤 Demo Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| **Attendee** | `alex@eventora.io` | `password123` | Event booking, digital QR passes, PDF export |
| **Organizer** | `organizer@eventora.io` | `password123` | Event creation, SaaS telemetry, gate QR scanner |
| **Admin** | `admin@eventora.io` | `password123` | Platform governance, user directory, system health |

*(Tip: In the top navigation bar, use the quick role switcher pill to instantly preview the application from any perspective!)*

---

## 📂 Project Structure

```text
eventora/
├── client/                     # Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Reusable design primitives (Button, Card, Badge, Modal, Input, Tabs)
│   │   │   ├── layout/         # Glass Navbar, Footer
│   │   │   ├── events/         # EventCard
│   │   │   └── tickets/        # DigitalTicketCard with perforation & PDF export
│   │   ├── contexts/           # AuthContext, ThemeContext
│   │   ├── pages/              # Landing, Events, EventDetails, Checkout, Tickets, Scanner, Dashboards
│   │   ├── services/           # Axios API client, Mock Events dataset
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # Class merging utilities (cn)
│   ├── tailwind.config.js      # Color tokens & glow shadows
│   └── index.html              # Google Fonts & SEO metadata
├── server/                     # Backend API & Database
│   ├── prisma/
│   │   ├── schema.prisma       # 7 relational models with indexes & cascades
│   │   └── seed.ts             # Comprehensive database seed
│   ├── src/
│   │   ├── config/             # Prisma client singleton, typed environment
│   │   ├── controllers/        # Auth, Events, Bookings, Tickets, CheckIn, Dashboards
│   │   ├── middleware/         # JWT Auth, Role-based guard, Error handler
│   │   ├── routes/             # Express REST route definitions
│   │   ├── validators/         # Zod input schemas
│   │   └── __tests__/          # Vitest integration test suite
│   ├── .env                    # Local environment config
│   └── tsconfig.json           # Backend TypeScript config
├── package.json                # Root orchestrator scripts
└── README.md                   # Documentation
```

---

## 🔒 Security Architecture Highlights
1. **Unpredictable QR Credentials**: Ticket QR codes use `crypto.randomBytes(16)` creating 128 bits of entropy.
2. **Hash-Based Fast Indexing**: Token values are hashed with SHA-256 for rapid lookup while preventing token exposure.
3. **Atomic Gate Check-in**:
   ```sql
   UPDATE tickets SET status = 'CHECKED_IN', checkedInAt = NOW() WHERE id = :id AND status = 'VALID';
   ```
   If two scanners attempt redemption simultaneously, exactly one succeeds and the other receives an `ALREADY_USED` rejection.
4. **Idempotency Key Protection**: Prevents duplicate bookings and multiple charges on network retries or repeated clicks.
