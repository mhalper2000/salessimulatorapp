# Salescripter App — Project State

> **Maintained by the scheduled dev agent.** Read this at the start of every run.
> Update the **Current status**, **Last run**, and **Next actions** sections at the end of each run.
> Do not delete historical entries in **Run log** — append only.

## Project

| Field | Value |
|-------|-------|
| Repo | `mhalper2000/salessimulatorapp` |
| Local path | `/Users/ajeetre/Work/Salescripter/salescripter-app` |
| Branch | `main` (auth fix merged via PR #1) |
| EAS project | `@ajeetre/salescripter-app` (`6de04f4b-6929-422a-b394-ccc3ec3853cc`) |
| Slack channel (client) | `C0A72HHM7RU` (DM with Michael Halper) |
| Workspace | `T018RSR2MJ4` |

## Current focus

**Ship TestFlight build with auth fixes** — PR #1 merged to `main`. EAS project linked; iOS credentials not yet configured (interactive setup required).

## Development state (as of 2026-08-14)

### Done

- [x] Auth/signup JSON parse fixes merged to `main` (PR #1)
- [x] Added `utils/fetchJson.ts` — safe JSON parsing + friendly error messages
- [x] Fixed `redux/slices/authSlice/index.ts` (login, signup, session restore, cookie persistence)
- [x] Fixed signup flow navigation and login error alerts
- [x] EAS project initialized and linked (`eas init --force`)
- [x] Added `ITSAppUsesNonExemptEncryption: false` in `app.json` (export compliance)

### Not done

- [ ] Configure iOS distribution credentials in EAS (interactive)
- [ ] Ship new TestFlight build (`eas build --platform ios --profile production`)
- [ ] Submit build to TestFlight (`eas submit --platform ios`)
- [ ] Verify signup + login end-to-end on device
- [ ] Reply to Michael in Slack with fix summary + TestFlight ETA
- [ ] Earlier UI bugs from Jul 9 (form labels, keyboard overlap, agent not responding) — not yet investigated

### Open issues from Slack (Michael)

1. Signup validation error + login JSON parse error — **fixed in main**, not yet on TestFlight
2. TestFlight build delivery / compliance email (Aug 3) — compliance flag added; build still pending
3. Signup form labels missing, agent UI bugs (Jul 9)

## Next actions (priority order)

1. **Human:** Run interactive iOS credential setup, then production build:
   ```bash
   cd /Users/ajeetre/Work/Salescripter/salescripter-app
   git checkout main && git pull
   eas credentials --platform ios   # or: eas build --platform ios --profile production
   eas build --platform ios --profile production
   eas submit --platform ios --latest
   ```
2. Post update to Slack channel `C0A72HHM7RU` (fix merged, TestFlight ETA once build starts)
3. Smoke-test signup → login flow on TestFlight
4. Investigate Jul 9 UI bugs (form labels, agent not responding)

## TestFlight build notes

- EAS account: `ajeetre` (logged in locally)
- Bundle ID: `com.salessimulator`
- Build failed non-interactively: *"Credentials are not set up. Run this command again in interactive mode."*
- `app.json` now includes `extra.eas.projectId` and `owner: ajeetre`

## Run log

| Date (IST) | Summary |
|------------|----------|
| 2026-08-13 | Initial state file created. Auth/signup JSON parse fixes implemented locally; awaiting TestFlight ship. |
| 2026-08-13 (run 2) | Committed auth fixes to branch `fix/auth-json-parse-errors`, opened PR. Slack MCP auth unavailable — could not read/post channel. EAS logged in as `ajeetre`; TestFlight build blocked on PR merge + human approval. |
| 2026-08-14 | PR #1 merged to `main`. Ran `eas init --force` (linked `@ajeetre/salescripter-app`). Production iOS build blocked on interactive Apple credential setup. Added export compliance flag. Slack MCP unavailable (local SDK). |

## Files touched recently

- `app.json` (EAS projectId, owner, ITSAppUsesNonExemptEncryption)
- `utils/fetchJson.ts`
- `utils/authStorage.ts`
- `redux/slices/authSlice/index.ts`
- `app/ios-signup-screen.tsx`
- `app/login.tsx`
