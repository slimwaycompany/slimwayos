# Architecture

## Overview

SlimWay OS is a monorepo with a Next.js 14 frontend and NestJS backend.

```
slimwayos/
├── frontend/   Next.js 14 App Router, Tailwind CSS, TypeScript
└── backend/    NestJS, TypeORM, PostgreSQL, JWT auth
```

## Frontend

- **Routing**: App Router with route groups `(auth)` and `(dashboard)`
- **State**: Zustand for global state, SWR/React Query for server state
- **Forms**: react-hook-form + zod validation
- **Styling**: Tailwind CSS with custom design tokens

## Backend

- **Modules**: `auth`, `users`, `weight` — each with entity/service/controller/dto
- **Auth**: JWT Bearer tokens; bcrypt for password hashing
- **DB**: TypeORM with PostgreSQL; `synchronize: true` in dev only
- **Validation**: class-validator + class-transformer via global ValidationPipe
- **Docs**: Swagger at `/api/docs`

## API

Base URL: `http://localhost:3001/api/v1`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | — | Register user |
| POST | /auth/login | — | Login, returns JWT |
| GET | /auth/me | JWT | Current user |
| GET | /users/profile | JWT | Profile |
| PATCH | /users/profile | JWT | Update profile |
| GET | /weight | JWT | List weight records |
| POST | /weight | JWT | Add weight record |
| DELETE | /weight/:id | JWT | Delete weight record |
