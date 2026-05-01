# 🏥 Opdify  — Smart Clinic Queue Management

> **Full-stack:** Next.js 14 App Router + Node.js/Express (ES6) + MongoDB + Socket.IO

---

## ✨ Stack
| Layer | Tech |
|-------|------|
| Frontend | **Next.js 14** (App Router, SSR, RSC) |
| Styling | Tailwind CSS (custom design system) |
| Backend | Node.js + Express (ES6 modules) |
| Database | MongoDB + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT (Name + Phone + Password) |

---

## 📁 Structure

```
Opdify2/
├── backend/               Express API
│   ├── config/db.js
│   ├── controllers/       authController, doctorController, appointmentController, queueController, hospitalController
│   ├── middleware/auth.js
│   ├── models/            User, Doctor, Appointment, Queue, Hospital
│   ├── routes/            auth, doctors, appointments, queue, hospitals, users
│   ├── socket/socketManager.js
│   ├── utils/             helpers.js, seed.js
│   └── server.js
│
└── frontend/              Next.js App Router
    └── src/
        ├── app/
        │   ├── page.jsx               / (Home – SSR)
        │   ├── HomeClient.jsx
        │   ├── search/page.jsx        /search
        │   ├── doctor/[id]/page.jsx   /doctor/:id (SSR)
        │   ├── doctor/dashboard/page.jsx  /doctor/dashboard
        │   ├── hospital/[id]/page.jsx /hospital/:id (SSR)
        │   ├── book/[doctorId]/page.jsx   /book/:id
        │   ├── queue/[id]/page.jsx    /queue/:id (live)
        │   ├── profile/page.jsx       /profile
        │   ├── my-appointments/page.jsx
        │   ├── register-doctor/page.jsx
        │   └── not-found.jsx
        ├── components/
        │   ├── common/    Navbar, Footer, AuthModal
        │   └── doctor/    DoctorCard
        ├── context/       AuthContext, SocketContext
        └── lib/api.js
```

---

## 🚀 Quick Start

### 1 — Backend
```bash
cd backend
cp .env.example .env      # Set MONGODB_URI and JWT_SECRET
npm install
npm run seed              # Seed demo data
npm run dev               # http://localhost:5000
```

### 2 — Frontend
```bash
cd frontend
cp .env.example .env      # NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev               # http://localhost:3000
```

---

## 🔑 Demo Credentials
| Role | Phone | Password |
|------|-------|----------|
| Patient | `9876543210` | `patient123` |
| Doctor | *(any seeded)* | `doctor123` |
| Admin | `9000000000` | `admin123` |

---

## 📡 API Reference

### Auth
- `POST /api/auth/register` — name, phone, password, role
- `POST /api/auth/login`    — phone, password
- `GET  /api/auth/me`       — current user

### Doctors
- `GET    /api/doctors`                — search/list
- `GET    /api/doctors/:id`            — profile + queue info (SSR)
- `GET    /api/doctors/me`             — doctor dashboard data
- `PUT    /api/doctors/profile`        — update profile
- `PATCH  /api/doctors/booking-toggle` — toggle open/closed
- `POST   /api/doctors/register-clinic`— register new doctor+clinic

### Appointments
- `POST   /api/appointments/book`      — book
- `GET    /api/appointments/my`        — my bookings
- `GET    /api/appointments/:id/status`— live status
- `PATCH  /api/appointments/:id/cancel`— cancel

### Queue (Doctor only)
- `POST  /api/queue/start`    — start clinic
- `POST  /api/queue/next`     — call next patient
- `POST  /api/queue/skip`     — skip token
- `POST  /api/queue/recall`   — recall skipped
- `PATCH /api/queue/pause`    — pause/resume
- `POST  /api/queue/priority` — add emergency patient
- `POST  /api/queue/end`      — end clinic day
- `GET   /api/queue/:doctorId`— public queue status

---

## 🔌 Socket Events

**Client → Server:** `join_queue`, `join_doctor`, `join_patient`, `leave_queue`

**Server → Client:** `queue_updated`, `new_appointment`, `your_turn`, `be_ready`, `appointment_skipped`, `booking_status_changed`

---

## 🌐 Routing (Next.js App Router)
| Route | Type | Description |
|-------|------|-------------|
| `/` | SSR | Home — hero, search, specializations, featured doctors |
| `/search` | Client | Search with filters |
| `/doctor/[id]` | SSR | Doctor profile |
| `/doctor/dashboard` | Client | Doctor queue panel |
| `/hospital/[id]` | SSR | Hospital + doctors |
| `/book/[doctorId]` | Client | Booking form |
| `/queue/[id]` | Client | Live queue tracker |
| `/profile` | Client | User profile + history |
| `/my-appointments` | Client | All appointments |
| `/register-doctor` | Client | Clinic registration |

---

## ⚡ Performance
- Home, Doctor Profile, Hospital pages use **SSR** with `revalidate` cache
- Dynamic pages (Dashboard, Queue, Booking) are **client-rendered**
- Socket.IO for real-time queue updates — no polling needed
- Next.js Image optimization ready

## 🚀 Deploy
**Backend** →  Render (set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`)
**Frontend** → Vercel (set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`)
