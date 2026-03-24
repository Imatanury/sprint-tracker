# Sprint Tracker

A full-stack web application for tracking user stories and sprint progress
across multiple development teams.

## Tech Stack

- **Backend:** Node.js, Express.js v5, SQLite, JWT Auth
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui

## Roles

| Role | Access |
|---|---|
| Admin | Full dashboard, all teams, user management |
| Lead | Team-scoped dashboard |
| Developer | Personal dashboard, story submission |

## Getting Started

### Backend
```bash
cd backend
npm install
npm run seed
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Create a `.env` file in `/backend` with:
```
JWT_SECRET=your_secret_key_here
PORT=5000
```
