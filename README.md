# 🚗 مرکز کرایه موتر افشار — Afshar Car Rental Center

A complete production-ready car rental management system with full Dari & Pashto support and RTL layout.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS |
| Backend | Express.js (ESM, pure JS) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT |

---

## 📁 Project Structure

```
afshar-car-rental/
├── backend/
│   ├── controllers/       # Business logic
│   ├── routes/            # API routes
│   ├── middleware/        # Auth & error handling
│   ├── utils/             # Helpers (Prisma, response, contract number)
│   ├── prisma/
│   │   ├── schema.prisma  # Database models
│   │   └── seed.js        # Initial data
│   └── server.js          # Entry point
└── frontend/
    ├── app/               # Next.js App Router pages
    │   ├── page.tsx       # Login
    │   ├── dashboard/     # Admin dashboard
    │   ├── cars/          # Car management
    │   ├── customers/     # Customer management
    │   ├── guarantors/    # Guarantor management
    │   ├── contracts/     # Contract management
    │   │   └── new/       # Multi-step contract form
    │   └── payments/      # Payment tracking
    ├── components/
    │   ├── layout/        # Sidebar, Header, MainLayout
    │   └── ui/            # StatCard, Modal, Badge, ConfirmDialog
    └── lib/
        ├── api.ts         # Axios API client
        ├── context.tsx    # App context (lang, auth)
        └── translations.ts # Full Dari & Pashto translations
```

---

## ⚡ Quick Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials

npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js        # Creates admin + sample data
npm run dev                # Starts on port 5000
```

### 3. Frontend Setup

```bash
cd frontend
# Edit .env.local if backend runs on a different port

npm install
npm run dev                # Starts on port 3000
```

### 4. Login
- URL: http://localhost:3000
- Email: `admin@afshar.af`
- Password: `admin123`

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get current user |
| GET/POST | `/api/cars` | List / create cars |
| PUT/DELETE | `/api/cars/:id` | Update / delete car |
| GET/POST | `/api/customers` | List / create customers |
| PUT/DELETE | `/api/customers/:id` | Update / delete customer |
| GET/POST | `/api/guarantors` | List / create guarantors |
| GET/POST | `/api/contracts` | List / create contracts |
| PATCH | `/api/contracts/:id/return` | Mark as returned |
| POST | `/api/contracts/:id/payment` | Record payment |
| DELETE | `/api/contracts/:id` | Delete contract |
| GET | `/api/dashboard/stats` | Dashboard statistics |

---

## ✨ Features

### Admin Dashboard
- Total cars, available, rented
- Active/completed/overdue contracts
- Total income & pending payments
- Monthly income breakdown
- Recent contracts table

### Car Management
- Add, edit, delete cars
- Filter by status (available/rented/maintenance)
- Auto-status update when contract created/returned

### Multi-Step Contract Form (5 Steps)
1. **Car Info** — Select car, dates, pricing with auto-calculation
2. **Customer Info** — Select existing or create new customer
3. **Guarantor Info** — Select existing or create new guarantor
4. **Conditions** — Pre-filled rental agreement + signatures
5. **Review & Submit** — Full summary before saving

### Payment Tracking
- Record partial payments anytime
- Remaining balance auto-updated
- Payment history per contract
- Pending payments dashboard

### Localization
- 🇦🇫 Full **Dari** (دری) support
- 🇦🇫 Full **Pashto** (پښتو) support
- RTL layout throughout
- Language switcher in sidebar & login

---

## 🗄️ Database Models

- **User** — Admin accounts with bcrypt passwords
- **Car** — Vehicle fleet with status tracking
- **Customer** — Renter details with full address info
- **Guarantor** — Guarantor details linked to contracts
- **RentalContract** — Full contract with all relations + conditions
- **Payment** — Payment history per contract

---

## 🎨 Design

- Light golden theme (`#f59e0b` palette)
- RTL-first layout
- Fully responsive (mobile → desktop)
- Amiri + Vazirmatn Arabic fonts
- Smooth fade-in animations
- Professional sidebar navigation

---

## 🔒 Security

- JWT authentication (7-day expiry)
- Password hashing with bcrypt
- Protected API routes via middleware
- CORS configured for frontend origin
- Environment variables for secrets

---

## 📝 Default Admin

| Field | Value |
|-------|-------|
| Email | admin@afshar.af |
| Password | admin123 |

**⚠️ Change the password and JWT_SECRET before production deployment!**
