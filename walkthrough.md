# Security Summary

**Reviewed Files**: 14  
**Issues Resolved**: 8  

### Issues Resolved
| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| Hardcoded Credentials | `server.ts`, `src/App.tsx` | 3052 / 3951 | Fallback bot token, static passcode string, and client-side passcode verification constants existed in source files. | High | Fixed | Removed all hardcoded secrets from client and server code; bot token and admin passcode now load strictly from gitignored `.env` and server-side scrypt vaults (`.data/bot_config.json`, `.data/admin_security.json`), plus a first-run `/api/admin/setup-passcode` flow when unconfigured. |
| Browser Secret Persistence | `src/utils/telegram.ts` | 1 | Local preview bot credentials were saved in persistent `localStorage`. | Medium | Fixed | Switched preview bot credentials to short-lived in-memory state (`memoryLocalAdminBotConfig`) and actively purged legacy `chickenland_admin_local_bot_v1` entries from browser storage. |
| Unsafe External & Deep-Link URLs | `src/game/economy.ts`, `src/components/TasksView.tsx`, `src/components/ChannelCheckPanel.tsx`, `src/components/RewardedAdModal.tsx`, `src/components/DepositView.tsx`, `src/components/AdminPanelView.tsx` | 118 | External action links, sponsor URLs, and TON transfer deep links were rendered or opened without protocol validation. | High | Fixed | Added `sanitizeExternalUrl` in `src/game/economy.ts` to permit only safe `http:`/`https:` URLs (and `tg:`/`ton:` only when explicitly flagged for Telegram/TON deep links), blocking `javascript:` and `data:` payloads across all UI links and `createPaidTaskOrder`. |
| Admin UI Session Verification | `src/components/AdminPanelView.tsx`, `src/App.tsx` | 480 / 404 | Admin panel tabs, payout approvals, template edits, and System Data Reset relied only on a client `adminUnlocked` boolean without validating a server-signed session token or re-confirming passcode on destructive reset. | High | Fixed | Passed `adminSessionToken` into `AdminPanelView`, enforced `isStrictAdminAuthenticated` + `requireStrictAdminAuth` across every admin mutation and payout control, removed the un-tokenized reset bypass in `App.tsx`, and required fresh passcode re-verification on System Data Reset. |
| Query-String Session Tokens | `server.ts` | 3052 | Telegram `initData` and session tokens could be passed in URL query strings, exposing credentials in server/proxy logs. | Medium | Fixed | Updated `resolveTelegramUserFromRequest` and admin routes to accept authentication tokens exclusively from `Authorization: Bearer`, `x-telegram-init-data` headers, or POST request bodies. |
| Webhook Fail-Open Check | `server.ts` | 5962 | `/api/telegram/webhook` skipped secret-header verification when `TELEGRAM_WEBHOOK_SECRET` was unset or compared strings without constant-time equality. | High | Fixed | Made `/api/telegram/webhook` fail closed (`401`) unless `TELEGRAM_WEBHOOK_SECRET` is configured and matches `x-telegram-webhook-secret` via `crypto.timingSafeEqual`. |
| Permissive CORS Policy | `server.ts` | 4122 | Express left `X-Powered-By` enabled and accepted cross-origin requests from arbitrary third-party origins. | Medium | Fixed | Disabled `x-powered-by` and enforced `isAllowedCorsOrigin` to allow only same-host origins, configured `WEBAPP_URL` origins, `localhost`, and standard Telegram WebApp origins while returning `403` to untrusted origins. |
| Referral Write Authorization | `server.ts` | 6473 | Referral endpoints (`POST /api/referrals`, `/apply`, `/claim-pending`, `/activate`, `/notify`) lacked consistent caller identity binding against authenticated session/Telegram users. | Medium | Fixed | Enforced `resolveTelegramUserFromRequest` caller verification and actor-matching guards across all referral mutation and notification endpoints. |

### Safeguards Verified
| Area | File | How It's Protected |
|---|---|---|
| Bot & Admin Secrets | `.env`, `.data/bot_config.json`, `server.ts` | Telegram Bot Token and Admin Passcode hashes stay server-side with `0600` file permissions and are never returned to unauthenticated clients. |
| Payout Channel Privacy | `src/game/economy.ts`, `server.ts` | Public `@AG_PAYOUTS` notifications include transaction IDs, masked TON wallet previews, and the bot link while omitting private Telegram handles and personal memos. |
| Firestore Access Rules | `firestore.rules` | Passes `@firebase/eslint-plugin-security-rules` cleanly with zero rule errors and scoped document permissions. |
| Batch Data Reset Reliability | `server.ts`, `src/services/farmStore.ts` | System Data Reset executes via chunked `writeBatch` operations, indexed queries, and bounded `20s–25s` deadlines to avoid timeouts. |

---

## PoC Verification

### 1. Unsafe Link Injection Blocked (`sanitizeExternalUrl`)

#### Summary
| Field | Value |
|---|---|
| Issue Type | Unsafe Protocol URL Handling |
| Impact | High |
| Affected File | `src/game/economy.ts` & UI Link Components |
| Test Scenario | `javascript:alert(1)` and `data:text/html,<script>alert(1)</script>` passed into task links and deep-link helpers |

#### How It Was Fixed
Added strict scheme parsing via `new URL(...)` in `sanitizeExternalUrl` so only `http:` and `https:` URLs (plus `tg:` and `ton:` only when `allowDeepLinks: true` is explicitly passed) are returned; all other schemes return `''`.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Malicious URL `'javascript:alert(1)'` enters `createPaidTaskOrder` or UI component (`TasksView`, `ChannelCheckPanel`, `AdminPanelView`, `RewardedAdModal`) | Passed to `sanitizeExternalUrl` |
| 2 | `sanitizeExternalUrl` parses protocol `'javascript:'` against allowlist `['http:', 'https:']` | Rejected (`''` returned) |
| 3 | UI omits dangerous `href` / blocks `window.open` and task creation throws validation error | **Handled Safely** |

#### Conclusion
**Fix Verified** - Automated unit tests confirm `javascript:`, `data:`, and disallowed deep links return empty strings and never reach clickable anchors or `openLink`.

---

### 2. Stricter Passcode Authentication in Admin Console & Data Reset

#### Summary
| Field | Value |
|---|---|
| Issue Type | Missing Verified Session & Re-Authentication Guard |
| Impact | High |
| Affected File | `src/components/AdminPanelView.tsx:480` & `src/App.tsx:404` |
| Test Scenario | Attempt to invoke payout approval/rejection, economy edits, or System Data Reset when `adminUnlocked` is true without a valid server-issued `adminSessionToken` or valid reset passcode |

#### How It Was Fixed
`AdminPanelView` now requires both `adminUnlocked` and a valid server-issued `adminSessionToken` before rendering tabs or running background diagnostics, wraps every sensitive handler with `requireStrictAdminAuth(...)`, and requires live `onVerifyAdminPasscode` re-verification before executing System Data Reset.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Unverified state (`!adminSessionToken`) or missing passcode arrives at `AdminPanelView` / `handleReviewWithdrawal` / `handleExecuteDataReset` | Checked at entry guard |
| 2 | `requireStrictAdminAuth` (`AdminPanelView.tsx:489`) and `hasVerifiedAdminSession` (`App.tsx:407`) detect missing server session token; Data Reset additionally verifies `resetPasscodeInput` via `onVerifyAdminPasscode` (`AdminPanelView.tsx:7953`) | Locks admin console & aborts |
| 3 | Payout state and Firestore collections remain untouched | **Handled Safely** |

#### Conclusion
**Fix Verified** - Neither payout modifications nor destructive data resets can execute without an active server-verified passcode session (and fresh passcode re-entry on reset).

---

### 3. Fail-Closed Webhook, Strict CORS, and Authenticated Admin Diagnostics

#### Summary
| Field | Value |
|---|---|
| Issue Type | Cross-Origin Access & Unauthenticated Endpoint Protection |
| Impact | High |
| Affected File | `server.ts:4122`, `server.ts:5962`, `server.ts:6473`, `server.ts:7855` |
| Test Scenario | Requests sent with untrusted `Origin: https://evil.example`, unauthenticated `POST /api/telegram/webhook`, unauthenticated `GET /api/admin/system-diagnostics`, and unauthenticated `POST /api/referrals` |

#### How It Was Fixed
Added strict `isAllowedCorsOrigin` checks (`403`), fail-closed `timingSafeEqual` webhook secret verification (`401`), session/Telegram caller validation on `/api/referrals*` (`401`), and strict header/body admin token verification on `/api/admin/*` (`403`).

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Request with `Origin: https://evil.example` hits Express middleware (`server.ts:4170`); unauthenticated calls hit `/api/telegram/webhook`, `/api/referrals`, or `/api/admin/*` | Inspected before business logic |
| 2 | Origin check returns `403`, webhook secret guard returns `401`, referral auth returns `401`, and admin auth returns `403` | Blocked at middleware/route guard |
| 3 | Protected data and mutations remain inaccessible | **Handled Safely** |

#### Conclusion
**Fix Verified** - Untrusted origins and unauthenticated requests are rejected immediately at the server boundary.
