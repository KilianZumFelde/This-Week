# env.md

Non-secret project references and environment variable guide for the Weekly Focus app.

This file is safe to commit. For actual secret values (API keys, passwords, tokens), see `credentials.md`.

---

## Project References

| Item | Value |
|------|-------|
| GitHub Repository | `https://github.com/KilianZumFelde/This-Week.git` |
| Supabase Project URL | `https://tmwhadppjrpoqytjcgfk.supabase.co` |
| Supabase Project Ref | `tmwhadppjrpoqytjcgfk` |
| Supabase Publishable (Anon) Key | `sb_publishable_LRAi7DwGGnBbKyWOLBP4Ag_wDtwnwRj` |
| Expo Account | `kilianzf@gmail.com` |
| Render Service Name | `weekly-focus-backend` |
| Render Service URL | `https://this-week.onrender.com` |

---

## Backend (`/backend/.env`)

```env
# Supabase
SUPABASE_URL=https://tmwhadppjrpoqytjcgfk.supabase.co
SUPABASE_ANON_KEY=sb_publishable_LRAi7DwGGnBbKyWOLBP4Ag_wDtwnwRj
SUPABASE_SERVICE_ROLE_KEY=<service role key — from credentials.md>

# Anthropic
ANTHROPIC_API_KEY=<API key — from credentials.md>

# Server
BACKEND_PUBLIC_URL=https://this-week.onrender.com
PORT=3000

# Timezone default (server-side)
DEFAULT_TIMEZONE=Europe/Berlin
```

## App (`/app/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://tmwhadppjrpoqytjcgfk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_LRAi7DwGGnBbKyWOLBP4Ag_wDtwnwRj
```

---

## Notes

- `SUPABASE_SERVICE_ROLE_KEY` is backend-only — never expose to the app.
- `EXPO_PUBLIC_*` vars are bundled into the app build — safe for public anon keys, never for secrets.
- In production (Render), set all backend vars in the Render dashboard → Service → Environment.
- In production app builds (EAS), set `EXPO_PUBLIC_*` vars in `eas.json` or via `eas env:create`.
