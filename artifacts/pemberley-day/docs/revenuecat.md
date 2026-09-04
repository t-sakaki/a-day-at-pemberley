# RevenueCat — Pemberley Pro

## What's wired in code

| Piece | File |
|---|---|
| SDK config, offerings, purchase, paywall, entitlement, mgmt URL | `src/lib/revenuecat.ts` |
| React provider + `usePemberleyPro()` hook (`isPro` is the gate) | `src/hooks/usePemberleyPro.tsx` |
| Paywall dialog (RC hosted paywall + fallback plan list + restore) | `src/components/PemberleyProDialog.tsx` |
| Settings row + diary-history gate (free = last 3 entries) | `src/App.tsx` |
| API key | `.env` (`VITE_REVENUECAT_WEB_API_KEY`), template in `.env.example` |

- **Entitlement:** `a_day_at_pemberley_pro`
- **Products:** `lifetime`, `yearly`, `monthly`
- SDK: `@revenuecat/purchases-js` (Web Billing). If the key is unset, Pro is
  hidden and everything is free.
- Anonymous `appUserId` is generated once and stored in `localStorage`
  (`pemberley-rc-app-user-id`). Add `changeUser(id)` after login if real accounts
  arrive.

## What you must set up in the RevenueCat dashboard

1. **Project** → enable **Web Billing** (connect Stripe). Copy the public key
   into `.env` (already done with the sandbox `test_…` key).
2. **Products** — create `monthly`, `yearly`, `lifetime` (Web Billing products,
   with prices).
3. **Entitlement** `a_day_at_pemberley_pro` — attach all three products.
4. **Offering** (e.g. `default`) — add three packages ($rc_monthly / $rc_annual /
   $rc_lifetime or custom) pointing at the products. Mark it **current**.
5. **Paywall** — design one on the offering (Tools → Paywalls). `presentPaywall()`
   picks up the `current` offering's paywall automatically.
6. Test with a Stripe test card; confirm `isPro` flips (Settings → Pemberley Pro).

The RevenueCat **AI Toolkit / MCP** (`claude plugins install revenuecat` in an
interactive terminal) can do steps 2–5 from chat once connected.

## Before the Google Play release

Web checkout inside the Play app violates Play policy — digital goods must use
Play Billing. `configureNative()` in `src/lib/revenuecat.ts` is a stub; wire
`@revenuecat/purchases-capacitor` (already installed) + Play Console products +
`@revenuecat/purchases-capacitor-ui` for the native paywall, keyed off
`Capacitor.isNativePlatform()`.
