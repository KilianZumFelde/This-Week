# TECHSTACK.md

## Overview

This document defines the technology stack for the Weekly Focus app.

---

## Platform

- **Primary platform:** Android
- **Mobile framework:** Expo + React Native
- **Language:** TypeScript
- **Development runtime:** Expo Go
- **Build/distribution:** Expo EAS

---

## Frontend

- **Framework:** React Native via Expo
- **Language:** TypeScript
- **Routing:** Expo Router
- **Styling:** NativeWind
- **Server state:** TanStack Query
- **Client state:** Zustand
- **Forms:** React Hook Form
- **Validation:** Zod
- **Date/time utilities:** date-fns

---

## Backend

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** Fastify
- **API style:** REST
- **Validation:** Zod
- **Hosting:** Render.com
- **Package manager:** pnpm

---

## Database and Auth

- **Database:** Supabase Postgres
- **Authentication:** Supabase Auth
- **Database migrations:** SQL migrations managed in the repository
- **Database access:** Backend-mediated access for core application data

---

## AI

- **AI provider:** Anthropic
- **AI SDK/API usage:** Backend only
- **Structured output validation:** Zod

---

## Notifications and Jobs

- **Push notifications:** Expo Notifications
- **Android push delivery:** FCM through Expo notification infrastructure
- **Scheduled jobs:** Render Cron Jobs or scheduled backend worker endpoints

---

## Environments

Initial setup uses one active environment:

- **Development**

Production can be introduced later when the app is ready for real personal use.

No staging environment is planned for v1.

---

## Repository Structure

```txt
/app
/backend
/packages/shared
/supabase
/docs
```

- `/app` — Expo React Native app
- `/backend` — Fastify backend
- `/packages/shared` — shared TypeScript types, Zod schemas, enums, constants
- `/supabase` — migrations and Supabase config
- `/docs` — project documentation

---

## Testing

- **Backend tests:** Vitest
- **Frontend tests:** React Native Testing Library
- **End-to-end tests:** Not planned for initial v1 unless needed later

---

## Logging and Monitoring

- **Backend logging:** Fastify-compatible structured logging
- **Hosting logs:** Render logs
- **Error tracking:** Sentry optional later

---

## Configuration

Environment variables are used for configuration and secrets.

Expected variables include:

```txt
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
BACKEND_PUBLIC_URL
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Secrets must not be committed to the repository.

