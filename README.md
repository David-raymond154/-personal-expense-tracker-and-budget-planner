# 💰 Personal Expense Tracker and Budget Planner

A simple, student-friendly full-stack web application that helps university
students track daily expenses, plan monthly budgets, and visualize their
financial habits. Built as a 3-tier layered application: a React frontend, a
Node.js + Express REST API, and a lightweight SQLite database. Everything runs
locally — no paid services, external APIs, or internet connection required after
setup.

---

## ✨ Features

- **User accounts** — register, log in, log out, update your profile, and reset
  a forgotten password (temp password logged to the server console).
- **Income management** — add, edit, delete, and filter income records.
- **Expense tracking** — record expenses across 9 categories, filter by
  category and date range.
- **Budget planning** — set monthly budgets per category with live progress bars
  and overspending alerts.
- **Reports & analysis** — monthly summaries, spending-by-category breakdowns,
  and a 6-month savings trend.
- **Dashboard** — summary cards plus a bar chart (expenses by category) and a
  line chart (savings over time).
- **Secure & isolated** — JWT auth (7-day expiry); every record is scoped to the
  owning user so no one can see another user's data.

---

## 🧱 Tech Stack

| Layer        | Technology                                            |
| ------------ | ----------------------------------------------------- |
| Frontend     | React.js (Vite), React Router v6, Tailwind CSS, Recharts |
| Backend      | Node.js, Express.js                                   |
| Database     | SQLite via `better-sqlite3`                           |
| Auth         | `bcryptjs` (password hashing) + `jsonwebtoken` (JWT)  |
| Testing      | Jest + Supertest (backend)                            |
| Version control | Git, GitHub                                        |

---

## 📋 Prerequisites

- **Node.js v18 or newer** (developed and tested on Node 22)
- **npm** (ships with Node.js)

---

## 🚀 Setup & Run

The project has two parts that run side by side: the **backend** (port `5000`)
and the **frontend** (port `5173`).

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/personal-expense-tracker.git
cd personal-expense-tracker
```

### 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env        # then edit JWT_SECRET to a long random string
npm start                   # API now runs on http://localhost:5000
```

For auto-reload during development use `npm run dev` instead of `npm start`.

### 3. Start the frontend (in a second terminal)

```bash
cd frontend
npm install
cp .env.example .env        # optional — defaults to http://localhost:5000/api
npm run dev                 # app now runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser, register an account, and start
tracking.

---

## 🧪 Running Tests

Backend tests use Jest + Supertest and run against an in-memory SQLite database
(your real data is never touched):

```bash
cd backend
npm test
```

---

## 🔌 API Endpoints

All routes are prefixed with `/api`. Protected routes require an
`Authorization: Bearer <token>` header.

### Auth — `/api/auth`

| Method | Endpoint            | Protected | Description                                   |
| ------ | ------------------- | --------- | --------------------------------------------- |
| POST   | `/register`         | No        | Create an account (name, email, password)     |
| POST   | `/login`            | No        | Log in and receive a JWT                       |
| POST   | `/logout`           | No        | Acknowledge logout (token removed client-side) |
| POST   | `/reset-password`   | No        | Reset password by email (temp logged to console) |
| GET    | `/profile`          | Yes       | Get the current user's profile                 |
| PUT    | `/profile`          | Yes       | Update name and/or password                    |

### Income — `/api/income`

| Method | Endpoint     | Description                                       |
| ------ | ------------ | ------------------------------------------------- |
| POST   | `/`          | Add income (amount, source, description, date)    |
| GET    | `/`          | List income (filter by `month`, `year`)           |
| GET    | `/summary`   | Total income for a period                         |
| PUT    | `/:id`       | Edit an income record                             |
| DELETE | `/:id`       | Delete an income record                           |

### Expenses — `/api/expenses`

| Method | Endpoint       | Description                                                       |
| ------ | -------------- | ---------------------------------------------------------------- |
| POST   | `/`            | Add expense (amount, category, description, date); returns budget warning |
| GET    | `/`            | List expenses (filter by `category`, `month`, `startDate`, `endDate`) |
| GET    | `/categories`  | List all valid expense categories                                |
| PUT    | `/:id`         | Edit an expense                                                  |
| DELETE | `/:id`         | Delete an expense                                               |

### Budgets — `/api/budgets`

| Method | Endpoint   | Description                                                    |
| ------ | ---------- | ------------------------------------------------------------- |
| POST   | `/`        | Set a budget (category, month, year, limit_amount)            |
| GET    | `/`        | List budgets for the current month (or `month`/`year` query)  |
| GET    | `/status`  | Per-budget spent / remaining / `is_exceeded` status           |
| PUT    | `/:id`     | Edit a budget                                                 |
| DELETE | `/:id`     | Delete a budget                                              |

### Reports — `/api/reports`

| Method | Endpoint            | Description                                            |
| ------ | ------------------- | ------------------------------------------------------ |
| GET    | `/monthly`          | Total income, expenses, net savings for a month        |
| GET    | `/summary`          | Overall totals across all time                         |
| GET    | `/by-category`      | Total spending per category for a month                |
| GET    | `/savings-progress` | Monthly savings over the last 6 months (line chart)    |

**Expense categories:** Food, Transport, Rent, Entertainment, Education, Health,
Clothing, Utilities, Other.

---

## 📁 Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers (auth, income, expense, budget, report)
│   │   ├── middleware/     # JWT auth + central error handling
│   │   ├── models/         # SQLite setup + migrations, constants, validators
│   │   ├── routes/         # Express routers
│   │   ├── app.js          # Express app (exported for tests)
│   │   └── server.js       # Starts the HTTP server
│   ├── tests/              # Jest + Supertest test suites
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios instance + API call functions
│   │   ├── components/     # Reusable UI (Navbar, Modal, Spinner, ProgressBar)
│   │   ├── context/        # AuthContext (JWT state + login/logout)
│   │   ├── pages/          # One file per route
│   │   └── main.jsx
│   └── package.json
├── .gitignore
└── README.md
```

---

## 📸 Screenshots

_Screenshots coming soon._

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE)
file for details.
