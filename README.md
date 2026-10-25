# EVENTORA — Event Ticketing with QR Pass (JavaScript MERN Stack)

> **College Event Discovery, Cryptographic Digital QR Pass Issuance & Real-Time Gate Verification Platform**

EVENTORA is a JavaScript-only MERN stack event ticketing and pass verification web application designed for campus festivals, technical hackathons, cultural concerts, and academic workshops.

---

## 🛠️ JavaScript MERN Stack Architecture

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React.js (JavaScript + JSX), Vite, Tailwind CSS | Responsive SPA with clean blue-and-white theme, ticket purchasing, digital pass viewer, and camera QR scanner |
| **Backend** | Node.js + Express.js (JavaScript ES Modules) | RESTful API server with JWT authentication, role-based authorization (RBAC), and atomic transaction safety |
| **Database** | MongoDB with Mongoose | Document database with schema validation, indexes, and atomic updates |
| **Database Hosting** | MongoDB Atlas | Cloud-hosted MongoDB cluster for production and team collaboration |
| **Frontend Hosting** | Vercel | Global edge CDN hosting for the Vite React frontend |
| **Backend Hosting** | Render | Managed Node.js service running pure JavaScript Express API |

> **Faculty / Academic Requirement**:
> - Frontend: **React.js using JavaScript and JSX** (no TypeScript)
> - Backend: **Node.js + Express.js using JavaScript** (no TypeScript)
> - Database: **MongoDB using Mongoose**

---

## 🌟 Key Features

### 1. Clean, Accessible College Student UI
- Designed with a clean, professional blue-and-white visual identity:
  - **Primary Blue**: `#2563EB`
  - **Dark Navy Text**: `#0F172A`
  - **Page Background**: `#F8FAFC`
  - **White Cards**: `#FFFFFF`
  - **Success Green**: `#16A34A`
- Fully responsive across mobile smartphones, tablets, and desktop computers.

### 2. Multi-Role Authentication & Access Control (RBAC)
- **Attendee**: Browse events, reserve free/paid tickets, view and download digital QR passes with instant PDF generation.
- **Organizer**: Create and manage events, monitor ticket sales telemetry, and access real-time camera/manual gate scanner.
- **Admin**: Review organizer applications, govern user roles, manage platform events, and review platform-wide analytics.

### 3. Cryptographic QR Passes & Double-Scan Prevention
- **Entropy & Hashing**: Every ticket receives a 128-bit cryptographically secure unpredictable token (`EVT-XXXXX`) and a SHA-256 hash.
- **Atomic Concurrency Guarantee**: Scanner redemption uses atomic MongoDB operations (`findOneAndUpdate({ _id: ticket.id, status: 'VALID' }, ...)`), ensuring duplicate or simultaneous scans at multiple entry gates are immediately rejected with `ALREADY_USED`.
- **Offline / Camera Verification**: Organizers can scan QR passes via device cameras (`html5-qrcode`) or manually enter the ticket reference code.

### 4. Mongoose Document Models
- `User`: Accounts with bcrypt password hashing, roles (`ATTENDEE`, `ORGANIZER`, `ADMIN`), and avatars.
- `Event`: Complete event metadata, dates, venue, pricing, categories, and capacity counters.
- `TicketType`: Event pricing tiers with individual capacities and per-user limits.
- `Booking`: Order records with idempotency keys to prevent duplicate charges or double reservations.
- `Ticket`: Issued digital passes linked to attendee, event, and booking.
- `CheckIn`: Immutable audit logs for entry gate scans with verifier ID and timestamps.
- `EventStaff`: Role delegation for event volunteers and gate verifiers.
- `OrganizerApplication`: Workflow for attendee accounts to apply for verified organizer status.

---

## 📁 Project Structure

```text
Event Ticketing with QR Pass/
├── client/                     # Frontend (React.js + JSX)
│   ├── index.html              # HTML5 entry pointing to /src/main.jsx
│   ├── package.json            # React & Vite dependencies (no TypeScript)
│   ├── vite.config.js          # Vite configuration in JavaScript
│   └── src/
│       ├── main.jsx            # React root mount
│       ├── App.jsx             # React router & layout routes
│       ├── index.css           # Tailwind CSS & theme tokens
│       ├── components/
│       │   ├── auth/           # ProtectedRoute.jsx
│       │   ├── common/         # ErrorBoundary.jsx
│       │   ├── events/         # EventCard.jsx
│       │   ├── layout/         # Navbar.jsx, Footer.jsx
│       │   ├── tickets/        # DigitalTicketCard.jsx
│       │   └── ui/             # Button, Badge, Card, Input, Modal, Tabs, Skeleton
│       ├── contexts/           # AuthContext.jsx, ThemeContext.jsx
│       ├── pages/              # LandingPage, EventsPage, EventDetailsPage,
│       │                       # CheckoutPage, TicketsPage, QRScannerPage,
│       │                       # OrganizerDashboardPage, CreateEventPage,
│       │                       # AdminDashboardPage, BecomeOrganizerPage,
│       │                       # LoginPage, RegisterPage, NotFoundPage
│       ├── services/           # api.js, mockEvents.js
│       ├── types/              # index.js (constants and configuration)
│       └── utils/              # cn.js (clsx & twMerge)
│
├── server/                     # Backend (Node.js + Express.js + Mongoose)
│   ├── package.json            # Node.js ES Module dependencies (no TypeScript)
│   ├── vitest.config.js        # Vitest configuration in JavaScript
│   └── src/
│       ├── server.js           # Express server entry point
│       ├── app.js              # Express app setup, CORS, helmet, routes
│       ├── config/
│       │   ├── db.js           # MongoDB connection handler via Mongoose
│       │   └── env.js          # Environment variable parser
│       ├── controllers/        # auth, event, booking, ticket, checkIn, dashboard, organizer
│       ├── middleware/         # auth.js (JWT & RBAC), errorHandler.js
│       ├── models/             # User, Event, TicketType, Booking, Ticket, CheckIn, EventStaff, OrganizerApplication
│       ├── routes/             # authRoutes, eventRoutes, bookingRoutes, ticketRoutes, checkInRoutes, dashboardRoutes
│       ├── scripts/            # seed.js, bootstrapAdmin.js
│       ├── validators/         # Zod request validators
│       └── __tests__/          # api.test.js, roleManagement.test.js
│
├── package.json                # Root scripts (npm run dev, npm test)
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB: Local MongoDB instance or free cloud cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)

### 1. Install Dependencies

From the project root:

```bash
# Install client dependencies
cd client
npm install --legacy-peer-deps
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment Variables

Create `server/.env` based on `server/.env.example`:

```env
PORT=5000
NODE_ENV=development

# For Local MongoDB:
MONGODB_URI="mongodb://127.0.0.1:27017/eventora"

# Or for MongoDB Atlas:
# MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/eventora?retryWrites=true&w=majority"

JWT_SECRET="your_secure_random_jwt_secret_here"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

### 3. Seed Database

Populate demo events, users, and ticket passes directly into MongoDB:

```bash
cd server
npm run seed
cd ..
```

### 4. Run Development Servers

Run both the React frontend and Express backend concurrently from the root directory:

```bash
npm run dev
```

Or run them individually in separate terminals:
- **Backend**: `cd server && npm run dev` (starts on `http://localhost:5000`)
- **Frontend**: `cd client && npm run dev` (starts on `http://localhost:5173`)

---

## 👤 Pre-Seeded Demo Accounts

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Attendee** | `alex@eventora.io` | `password123` | Event booking, digital QR passes, PDF export |
| **Organizer** | `organizer@eventora.io` | `password123` | Event publishing, organizer dashboard, QR gate scanner |
| **Admin** | `admin@eventora.io` | `password123` | Platform governance, organizer approvals, user directory |

---

## 🧪 Running Automated Tests

The test suite runs end-to-end integration tests using Vitest and an in-memory MongoDB server:

```bash
cd server
npm test
```

All integration tests validate:
- Authentication & JWT issuance
- Role-based authorization & portal boundaries
- Event CRUD operations
- Concurrency & idempotency during checkout
- Cryptographic QR pass generation & atomic double-scan protection
- Organizer applications, approvals, and role elevation

---

## 🌐 Production Deployment Guide

### A. Database: MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Database Access**, create a user with Read and Write permissions.
3. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from Render.
4. Click **Connect** -> **Drivers** -> Copy the connection string:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/eventora?retryWrites=true&w=majority`

### B. Backend: Render
1. Create a new **Web Service** on [Render](https://render.com) pointing to your GitHub repository.
2. Configure settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `MONGODB_URI`: `<Your MongoDB Atlas connection string>`
   - `JWT_SECRET`: `<Secure random 32+ char string>`
   - `JWT_EXPIRES_IN`: `7d`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://<your-vercel-app>.vercel.app`
4. Deploy the service and copy the Render service URL.

### C. Frontend: Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Configure settings:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variables:
   - `VITE_API_URL`: `https://<your-render-backend-url>/api`
4. Deploy. Vercel automatically assigns your production URL. Update `CLIENT_URL` in Render with this URL.
