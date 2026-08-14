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

**Ship TestFlight build with auth fixes** — PR #1 merged to `main`. EAS project linked on `chore/eas-testflight-setup` (PR #2 open). iOS distribution credentials still require interactive setup. Signup dark-mode label fix added this run.

## Development state (as of 2026-08-14, run 2)

### Done

- [x] Auth/signup JSON parse fixes merged to `main` (PR #1)
- [x] Added `utils/fetchJson.ts` — safe JSON parsing + friendly error messages
- [x] Fixed `redux/slices/authSlice/index.ts` (login, signup, session restore, cookie persistence)
- [x] Fixed signup flow navigation and login error alerts
- [x] EAS project initialized and linked (`eas init --force`)
- [x] Added `ITSAppUsesNonExemptEncryption: false` in `app.json` (export compliance)
- [x] Signup form labels visible in dark mode (`ios-signup-screen.tsx` — explicit `#EBEBEB` background + heading color)
- [x] Agent chat greeting/display fixes already in `main` (commit `9ceeaaa` — `conversationRef`, immediate welcome message)

### Not done

- [ ] Merge PR #2 (`chore/eas-testflight-setup`) to `main` — EAS projectId + export compliance
- [ ] Configure iOS distribution credentials in EAS (interactive)
- [ ] Ship new TestFlight build (`eas build --platform ios --profile production`)
- [ ] Submit build to TestFlight (`eas submit --platform ios`)
- [ ] Verify signup + login end-to-end on device (after TestFlight)
- [ ] Reply to Michael in Slack with fix summary + TestFlight ETA
- [ ] Confirm Jul 9 agent UI fixes on device (code fixes in `main` since `9ceeaaa`)

### Open issues from Slack (Michael)

1. Signup validation error + login JSON parse error — **fixed in main**, not yet on TestFlight
2. TestFlight build delivery / compliance email (Aug 3) — compliance flag added; build still pending
3. Signup form labels missing, agent UI bugs (Jul 9) — **fixed in code** (labels/dark mode this run; agent chat in `9ceeaaa`); pending TestFlight verification

## Next actions (priority order)

1. **Human:** Merge PR #2, then run interactive iOS credential setup + production build:
   ```bash
   cd /Users/ajeetre/Work/Salescripter/salescripter-app
   git checkout main && git pull
   # Merge PR #2 first (EAS projectId + export compliance on main)
   eas credentials --platform ios   # interactive — sets distribution cert + provisioning profile
   eas build --platform ios --profile production
   eas submit --platform ios --latest
   ```
2. Post update to Slack channel `C0A72HHM7RU` (fix merged, TestFlight ETA once build starts) — blocked: Slack MCP auth unavailable locally
3. Smoke-test signup → login flow on TestFlight (includes dark-mode signup labels)
4. Confirm agent role-play greeting + replies on device

## TestFlight build notes

- EAS account: `ajeetre` (logged in locally)
- Bundle ID: `com.salessimulator`
- Build failed non-interactively: *"Credentials are not set up. Run this command again in interactive mode."*
- `app.json` now includes `extra.eas.projectId` and `owner: ajeetre`

- Build failed non-interactively (2026-08-14 run 2): same credential error; buildNumber auto-incremented to 2 on EAS
- PR #2 open: https://github.com/mhalper2000/salessimulatorapp/pull/2

## Run log

| Date (IST) | Summary |
|------------|----------|
| 2026-08-13 | Initial state file created. Auth/signup JSON parse fixes implemented locally; awaiting TestFlight ship. |
| 2026-08-13 (run 2) | Committed auth fixes to branch `fix/auth-json-parse-errors`, opened PR. Slack MCP auth unavailable — could not read/post channel. EAS logged in as `ajeetre`; TestFlight build blocked on PR merge + human approval. |
| 2026-08-14 | PR #1 merged to `main`. Ran `eas init --force` (linked `@ajeetre/salescripter-app`). Production iOS build blocked on interactive Apple credential setup. Added export compliance flag. Slack MCP unavailable (local SDK). |
| 2026-08-14 (run 2) | Fixed signup labels invisible in dark mode (`#EBEBEB` background + heading color). Confirmed agent chat fixes already in `main` (`9ceeaaa`). EAS build still blocked on interactive credentials. PR #2 open. Slack read/post unavailable. |

## Files touched recently

- `app.json` (EAS projectId, owner, ITSAppUsesNonExemptEncryption)
- `utils/fetchJson.ts`
- `utils/authStorage.ts`
- `redux/slices/authSlice/index.ts`
- `app/ios-signup-screen.tsx` (dark-mode label visibility)
- `app/login.tsx`
