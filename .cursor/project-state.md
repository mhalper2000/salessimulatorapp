# Salescripter App — Project State

> **Maintained by the scheduled dev agent.** Read this at the start of every run.
> Update the **Current status**, **Last run**, and **Next actions** sections at the end of each run.
> Do not delete historical entries in **Run log** — append only.

## Project

| Field | Value |
|-------|-------|
| Repo | `mhalper2000/salessimulatorapp` |
| Local path | `/Users/ajeetre/Work/Salescripter/salescripter-app` |
| Branch | `fix/auth-json-parse-errors` (PR pending) |
| Slack channel (client) | `C0A72HHM7RU` (DM with Michael Halper) |
| Workspace | `T018RSR2MJ4` |

## Current focus

**Signup / login JSON parse error** — Michael reported `JSON Parse error: Unexpected character: <` on login (Aug 6). Root cause: API returned HTML instead of JSON; app used unguarded `.json()` calls.

## Development state (as of 2026-08-13)

### Done (unshipped — needs TestFlight build)

- [x] Added `utils/fetchJson.ts` — safe JSON parsing + friendly error messages
- [x] Fixed `redux/slices/authSlice/index.ts`:
  - Safe parsing on login, signup, restore session
  - Session cookie persistence via `CookieManager`
  - Removed pre-login `user-details` call during signup
  - Signup navigates to `/select-role` or `/ios-subscription` (not `/login`)
- [x] Fixed `app/ios-signup-screen.tsx` — no redirect to login on success
- [x] Fixed `app/login.tsx` — friendly Alert on login failure
- [x] Committed auth fixes to branch `fix/auth-json-parse-errors` (PR opened)

### Not done

- [ ] Merge auth-fix PR to `main`
- [ ] Ship new TestFlight build to Michael (`eas build --platform ios --profile production`)
- [ ] Verify signup + login end-to-end on device
- [ ] Reply to Michael in Slack with fix summary
- [ ] Earlier UI bugs from Jul 9 (form labels, keyboard overlap, agent not responding) — not yet investigated

### Open issues from Slack (Michael)

1. Signup validation error + login JSON parse error (primary — code fix in PR, not deployed)
2. TestFlight build delivery / compliance email (Aug 3)
3. Signup form labels missing, agent UI bugs (Jul 9)

## Next actions (priority order)

1. Merge PR `fix/auth-json-parse-errors` → `main`
2. Run `eas build --platform ios --profile production` and submit to TestFlight
3. Post short update to Slack channel `C0A72HHM7RU` (Slack MCP unavailable this run)
4. Smoke-test signup → login flow on TestFlight

## Run log

| Date (IST) | Summary |
|------------|---------|
| 2026-08-13 | Initial state file created. Auth/signup JSON parse fixes implemented locally; awaiting TestFlight ship. |
| 2026-08-13 (run 2) | Committed auth fixes to branch `fix/auth-json-parse-errors`, opened PR. Slack MCP auth unavailable — could not read/post channel. EAS logged in as `ajeetre`; TestFlight build blocked on PR merge + human approval. |

## Files touched recently

- `utils/fetchJson.ts` (new)
- `utils/authStorage.ts`
- `redux/slices/authSlice/index.ts`
- `app/ios-signup-screen.tsx`
- `app/login.tsx`
