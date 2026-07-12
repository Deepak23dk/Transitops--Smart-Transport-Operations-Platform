# TransitOps — Fleet Management Platform

A full-stack transport operations platform for managing vehicles, drivers, trips, maintenance, and expenses with role-based access control.

## Tech Stack
- **Frontend:** React (Vite), custom CSS design system
- **Backend:** Node.js, Express
- **Database:** SQLite (local file-based, zero-config)
- **Auth:** JWT with Role-Based Access Control (RBAC)

## Features
- 🔐 Role-based login (Fleet Manager, Safety Officer, Financial Analyst, Driver)
- 🚚 Vehicle Registry — CRUD with live status tracking
- 👤 Driver Management — license expiry & safety score tracking
- 🗺️ Trip Dispatch — cargo weight validation, auto status updates
- 🔧 Maintenance Logbook — auto-synced to expenses
- ⛽ Fuel & Expense tracking
- 📊 Live analytics dashboard with custom charts

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Runs both backend and frontend concurrently. Open `http://localhost:5173`.

## Demo Credentials
| Role | Username | Password |
|---|---|---|
| Fleet Manager | alice | password123 |
| Safety Officer | frank | password123 |
| Financial Analyst | henry | password123 |
| Driver | charlie | password123 |

## Author
Deepak — B.E. CSE, Panimalar Engineering College
