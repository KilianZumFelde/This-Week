# env.md

Environment variable reference for the Weekly Focus app.

---

## Backend (`/backend/.env`)

```env
# Supabase
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Server
BACKEND_PUBLIC_URL=http://localhost:3000
PORT=3000

# Timezone default (server-side)
DEFAULT_TIMEZONE=Europe/Berlin
```

## App (`/app/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

---

## Notes

- `SUPABASE_SERVICE_ROLE_KEY` is backend-only — never expose to the app.
- `EXPO_PUBLIC_*` vars are bundled into the app build — safe for public anon keys, never for secrets.
- In production (Render), set all backend vars in the Render dashboard → Service → Environment.
- In production app builds (EAS), set `EXPO_PUBLIC_*` vars in `eas.json` or via `eas env:create`.
