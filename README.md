# Live Polling System

A resilient real-time polling system built for the Intervue.io SDE Intern assignment.

## Tech Stack

- **Frontend:** React.js + TypeScript (Vite)
- **Backend:** Node.js + Express + TypeScript
- **Real-time:** Socket.io
- **Database:** MongoDB (Mongoose)

## Project Structure

```
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared TypeScript types
├── IMPLEMENTATION_PLAN.md
└── INTERVIEW_PREP.md
```

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Features

- **Teacher Persona:** Create polls, view live results, poll history
- **Student Persona:** Join with name, vote in real-time, synced timer
- **Resilience:** State recovery on refresh, server-authoritative timer, race condition prevention
