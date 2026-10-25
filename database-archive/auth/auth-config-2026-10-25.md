# Supabase Auth configuration record — 2026-10-25

Project `vustkojrbefcbzotgorc`. Pulled read-only with `supabase config pull`
(CLI 2.121.0) into a private scratch directory; the hosted project was not
changed. The API itself masks credential values. The **full** pulled
`config.toml` is preserved encrypted (auth-restricted key) in
`backups/2026-10-25T132152Z-authconfig/` and in the Google Drive AUTH
RESTRICTED folder. This page lists **non-secret settings only**.

## Settings that matter to BoviTrack

The app uses only `signInWithPassword`, `signOut` and `getUser`
(no sign-up, password reset, OAuth, magic link or callback route).

| Setting | Value | Rebuild note |
|---|---|---|
| Email/password provider | enabled | required |
| Sign-ups allowed | `enable_signup = true` (auth and email) | decide deliberately on the new service; the app has no sign-up screen |
| Email confirmation required | `enable_confirmations = true` | keep |
| Double confirm e-mail changes | `true` | keep |
| Secure password change (re-auth) | `false` | consider enabling |
| Minimum password length | `6` | raise (≥ 8) on rebuild |
| Password requirements | none | consider adding |
| E-mail OTP | length 8, expiry 3600 s, max frequency 1 min | keep or adjust |
| Site URL | `http://localhost:3000` (**still the default**) | must be set to the real app URL |
| Additional redirect URLs | none | add the app's URLs if any e-mail links are used |
| JWT expiry | 3600 s | keep |
| Refresh-token rotation | enabled, reuse interval 10 s | keep |
| Anonymous sign-ins / manual linking | disabled / disabled | keep |
| MFA | TOTP enroll + verify enabled; phone MFA disabled; max 10 factors | keep |
| Rate limits | e-mails sent 2/h · sign-in+sign-ups 30 · token refresh 150 · token verifications 30 · anonymous 30 · SMS 30 · web3 30 | keep |
| SMS sign-up / Twilio | disabled | — |

## Not configured (nothing to rebuild)

- **Custom SMTP:** none — Supabase's built-in mailer was in use. A rebuilt auth
  service **needs an SMTP provider** before any confirmation or reset e-mail
  can be sent.
- **Custom e-mail templates:** none (defaults).
- **OAuth / external providers:** none enabled (Apple present but disabled;
  its secret field is masked by the API). Third-party auth (Firebase, Auth0,
  Cognito, Clerk), Web3 and the OAuth server: disabled.
- **Auth hooks:** none.

## Secrets that must be recreated (never exported)

| Secret | Why it cannot move | Action on rebuild |
|---|---|---|
| JWT signing secret / keys | platform-held; not in the database or config | generate new ones; every existing session becomes invalid (there are 0) |
| `anon` / `service_role` API keys | derived from the JWT secret | regenerate; update `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| SMTP credentials | none in use today | create with the new SMTP provider |
| OAuth client secrets | none in use | — |

## Password-hash compatibility

The archived user's `encrypted_password` is a **bcrypt** hash (`$2a$`/`$2b$`
family), which self-hosted Supabase Auth (GoTrue) verifies natively and most
other identity providers can import. This is **not** a guarantee that sign-in
will work on a future service. Required tests on any rebuild:

1. Import the archived `auth.users` / `auth.identities` rows; confirm the user
   row and identity load.
2. Sign in with the account's known password (owner only) — or, if unknown,
   complete a password reset (requires SMTP) and sign in.
3. Create a fresh test account end-to-end (sign-up → confirmation e-mail →
   sign-in) to prove SMTP, Site URL and redirect configuration.
4. Confirm `auth.uid()` reaches the database (RLS smoke test as that user).
