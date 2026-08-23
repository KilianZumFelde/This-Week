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

---

## Standalone Android builds (EAS)

The app runs as an installed APK, independent of a local Expo dev server.

- `EXPO_PUBLIC_*` vars are set in the `preview` and `production` build profiles in
  `app/eas.json` (`env` block). All three are public keys, so they are committed.
  `app/.env` remains for local development only — EAS does not receive it.
- `app/google-services.json` is gitignored and therefore **not** uploaded with the
  project archive. It is provided to builds as an EAS **file** environment variable
  named `GOOGLE_SERVICES_JSON` (secret visibility, `preview` + `production`):

  ```
  eas env:create --name GOOGLE_SERVICES_JSON --type file \
    --value ./google-services.json --visibility secret \
    --environment preview --environment production
  ```

  `app/app.config.js` extends `app.json` and points `android.googleServicesFile` at
  that variable when set, falling back to the local file. Without this, builds
  succeed but push notifications do not work.
- Build: `eas build --platform android --profile preview` (cloud build, APK).
- Ship JS-only changes without rebuilding: `eas update --branch preview`.
  `runtimeVersion` policy is `appVersion`, so an update only reaches builds with a
  matching `version` in `app.json`. Any change to native code or native dependencies
  requires bumping `version` and producing a new build.
