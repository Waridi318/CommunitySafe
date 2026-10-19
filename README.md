# CommunitySafe frontend

CommunitySafe is a Bitcoin multisignature wallet coordination platform for communities that pool money: chamas, savings groups, NGOs, student organisations and small teams. Instead of one treasurer holding the funds, several trusted members each hold a key, and the group agrees how many of them must sign before anything is spent (for example, 3 of 5). Every member can see the balance, each contribution, each spending request and who signed it.

This repository is the React web frontend.

**Live prototype:** https://waridi318.github.io/communitysafe-frontend/

> **All data is mocked.** There is no backend yet. Everything runs in the browser against an in-memory mock that simulates a regtest Bitcoin network. No real Bitcoin is involved, nothing is saved between page reloads, and the app never asks for or stores a private key or recovery phrase.

## Running locally

Requires Node.js 20.19+ or 22.12+.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173/communitysafe-frontend/
npm run build      # type-checks, then builds to frontend/dist
npm run preview    # serves the production build
```

## Trying it out

- **Log in** with any email and password. Unknown emails sign in as the demo administrator of *Machakos Builders Fund*. The login page also has one-click buttons for each role.
- **Role switcher.** The "View as" control at the top of every screen switches between the three roles from the SRS so you can compare them:
  - *Administrator* (Martha Ngendo): manages members and settings. She is also in the signer set, which the SRS allows, but has no override.
  - *Signer* (Sharnie Essy): proposes, reviews, signs, declines and sends payments.
  - *Member* (Linder Stacy): read-only view of everything.
- **Demo controls** in the top banner simulate a server outage (every screen shows its error and retry state) and a Bitcoin node outage (sending fails and is kept for retry).
- **Sign up** to go through the five-step setup for a new community: create, add members and choose signers, set the approval rule, register signer public keys, then create the wallet.

The seed data includes two requests part-way through signing (one with a decline that does not cancel it), one request whose broadcast failed and can be retried, and one confirmed payment. A simulated block is mined every minute, so confirmation counts go up while the app is open.

## Project structure

```
frontend/
  src/
    types.ts            Domain types, mirroring the SRS entities
    api/index.ts        The only data layer components use (see table below)
    api/errors.ts       ApiError shape the backend should also return
    mock/data.ts        Seed data (regtest addresses, txids, tpubs)
    mock/server.ts      In-memory stand-in for the backend and its business rules
    context/            Session (current user) and community/wallet state
    components/         Layouts, UI primitives, the signer-slot progress display
    pages/              One file per screen
    lib/                Formatting, Bitcoin validation helpers, useAsync hook
```

Components never import from `src/mock`. To connect the real backend, replace the body of each function in `src/api/index.ts` with a `fetch` to the endpoint below and delete `src/mock`. Return types stay the same, so no screen changes.

## API functions and expected backend endpoints

Authentication is token based (SRS FR-03): `login` and `register` return a token, which every other call sends as `Authorization: Bearer <token>`. All role checks must be enforced by the backend; the UI only mirrors them. Errors should be JSON shaped like `ApiError`: `{ code, message, fields }`, where `fields` maps form inputs to messages.

| Function | Method | Endpoint | Notes |
| --- | --- | --- | --- |
| `register` | POST | `/api/auth/register` | name, email, password |
| `login` | POST | `/api/auth/login` | email, password |
| `logout` | POST | `/api/auth/logout` | |
| `listMyCommunities` | GET | `/api/communities` | communities the user belongs to |
| `getCommunity` | GET | `/api/communities/:communityId` | |
| `createCommunity` | POST | `/api/communities` | creator becomes administrator |
| `updateCommunity` | PATCH | `/api/communities/:communityId` | admin only |
| `getMembership` | GET | `/api/communities/:communityId/me` | role and signer record for the current user |
| `getDashboard` | GET | `/api/communities/:communityId/dashboard` | balance, requests, recent history |
| `listMembers` | GET | `/api/communities/:communityId/members` | |
| `addMember` | POST | `/api/communities/:communityId/members` | admin only |
| `listSigners` | GET | `/api/communities/:communityId/signers` | |
| `setAuthorisedSigners` | PUT | `/api/communities/:communityId/signers` | admin only, before wallet creation, at least 2 |
| `registerSignerKey` | PUT | `/api/communities/:communityId/signers/:signerId/public-key` | the signer themself; xpub, fingerprint, path. Public data only |
| `setThreshold` | PUT | `/api/communities/:communityId/wallet/threshold` | admin only, 2 ≤ M ≤ N, before wallet creation |
| `createWallet` | POST | `/api/communities/:communityId/wallet` | locks signer set and threshold |
| `getWallet` | GET | `/api/communities/:communityId/wallet` | address, balance, reserved funds |
| `listContributions` | GET | `/api/communities/:communityId/wallet/contributions` | incoming, with confirmations |
| `listSpendingRequests` | GET | `/api/communities/:communityId/spending-requests` | includes signatures |
| `getSpendingRequest` | GET | `/api/spending-requests/:requestId` | request, signatures, signers, transaction |
| `createSpendingRequest` | POST | `/api/communities/:communityId/spending-requests` | signers only |
| `updateSpendingRequest` | PATCH | `/api/spending-requests/:requestId` | creator only, only while no one has signed |
| `signTransaction` | POST | `/api/spending-requests/:requestId/signatures` | partial signature from the signer's device; one per signer |
| `declineSpendingRequest` | POST | `/api/spending-requests/:requestId/declines` | optional reason |
| `broadcastTransaction` | POST | `/api/spending-requests/:requestId/broadcast` | only once the threshold is met; failure keeps the request and signatures |
| `listTransactions` | GET | `/api/communities/:communityId/transactions` | incoming and outgoing history |
| `getTransaction` | GET | `/api/communities/:communityId/transactions/:txid` | |
| `listAuditEvents` | GET | `/api/communities/:communityId/audit-events` | |

Mock-only helpers with no backend equivalent (remove when the backend lands): `switchDemoRole`, `simulateSignerRegistration`, `getDemoFlags`, `setDemoFlags`, `currentChainTip`.

## Rules the UI reflects

These come from the SRS and must also be enforced server side:

- Membership does not grant signing authority. Only authorised signers can create, sign or send requests.
- The approval rule is at least 2 and never more than the number of signers. Nobody, including the administrator, can bypass it.
- The signer set and rule are fixed once the wallet is created.
- A signer counts once per request. Declining does not cancel a request while the remaining signers can still reach the threshold.
- Request details are read-only once the first signature exists; a different payment needs a new request.
- Nothing is broadcast below the threshold. A failed broadcast keeps the request and its signatures, shows the node error and allows a retry.
- Only public key information is handled. Anything pasted that looks like a private key or recovery words is discarded immediately.

## Stack

React 18, TypeScript, Vite, Tailwind CSS 4, React Router (HashRouter so deep links work on GitHub Pages) and qrcode.react. No component library.

## Deployment

`.github/workflows/deploy.yml` builds `frontend/` on every push to `main` and publishes `frontend/dist` to GitHub Pages.
