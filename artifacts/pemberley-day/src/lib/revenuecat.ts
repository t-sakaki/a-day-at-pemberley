/**
 * RevenueCat integration for A Day at Pemberley.
 *
 * This module targets the **Web Billing** SDK (`@revenuecat/purchases-js`), which
 * is what the Vercel / PWA build uses. The Google Play build must instead route
 * purchases through Play Billing via `@revenuecat/purchases-capacitor` — Play
 * policy forbids selling digital goods through a web checkout inside the app.
 * Both SDKs share the same RevenueCat project, entitlement and product ids, so
 * the UI layer (`usePemberleyPro`) only ever sees `CustomerInfo` / `Offering`.
 *
 * Native wiring is stubbed at the bottom (`configureNative`) and can be filled in
 * before the Play production release.
 */
import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  PurchasesError,
  ErrorCode,
  LogLevel,
  type CustomerInfo,
  type Offering,
  type Offerings,
  type Package,
} from '@revenuecat/purchases-js';

/** The entitlement that unlocks "Pemberley Pro". Configured in the dashboard. */
export const PRO_ENTITLEMENT = 'a_day_at_pemberley_pro';

/** Product identifiers, in the order we want to show them on the paywall. */
export const PRODUCT_IDS = ['lifetime', 'yearly', 'monthly'] as const;

const WEB_API_KEY = import.meta.env.VITE_REVENUECAT_WEB_API_KEY as
  | string
  | undefined;

const APP_USER_ID_STORAGE_KEY = 'pemberley-rc-app-user-id';

export type PurchaseOutcome =
  | { status: 'purchased'; customerInfo: CustomerInfo }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

let configured: Purchases | null = null;
let configurePromise: Promise<Purchases | null> | null = null;

/**
 * A stable per-browser app user id. Web Billing requires an appUserId at
 * configure time; we persist an anonymous one so a returning visitor keeps their
 * purchase. If you later add real accounts, call `Purchases.getSharedInstance()
 * .changeUser(yourUserId)` after login.
 */
function resolveAppUserId(): string {
  try {
    const existing = localStorage.getItem(APP_USER_ID_STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // Storage blocked — fall through to a fresh anonymous id for this session.
  }
  const fresh = Purchases.generateRevenueCatAnonymousAppUserId();
  try {
    localStorage.setItem(APP_USER_ID_STORAGE_KEY, fresh);
  } catch {
    /* ignore */
  }
  return fresh;
}

/** Whether billing can run at all (key present). Lets the UI hide Pro entirely. */
export function isBillingAvailable(): boolean {
  return Boolean(WEB_API_KEY) || Capacitor.isNativePlatform();
}

/**
 * Configure the SDK exactly once. Safe to call repeatedly and concurrently —
 * subsequent callers await the same promise. Returns `null` when billing is not
 * configured (missing key), so callers can degrade gracefully.
 */
export function configureRevenueCat(): Promise<Purchases | null> {
  if (configured) return Promise.resolve(configured);
  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    if (Capacitor.isNativePlatform()) {
      return configureNative();
    }
    if (!WEB_API_KEY) {
      console.warn(
        '[revenuecat] VITE_REVENUECAT_WEB_API_KEY is not set — Pemberley Pro is disabled.',
      );
      return null;
    }
    try {
      configured = Purchases.configure({
        apiKey: WEB_API_KEY,
        appUserId: resolveAppUserId(),
      });
      if (import.meta.env.DEV) {
        Purchases.setLogLevel(LogLevel.Warn);
      }
      // Warm the branding cache so the first paywall render is snappy.
      void configured.preload().catch(() => undefined);
      return configured;
    } catch (error) {
      console.error('[revenuecat] configure failed', error);
      configurePromise = null;
      return null;
    }
  })();

  return configurePromise;
}

function client(): Purchases {
  const instance = configured ?? Purchases.getSharedInstance();
  return instance;
}

/** Latest customer info, or `null` if billing is unavailable / offline. */
export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  const rc = await configureRevenueCat();
  if (!rc) return null;
  try {
    return await client().getCustomerInfo();
  } catch (error) {
    console.error('[revenuecat] getCustomerInfo failed', error);
    return null;
  }
}

/** True when the given (or default) customer info grants the Pro entitlement. */
export function hasPro(customerInfo: CustomerInfo | null | undefined): boolean {
  return Boolean(customerInfo?.entitlements.active[PRO_ENTITLEMENT]);
}

/** The current offering, with packages ordered by {@link PRODUCT_IDS}. */
export async function fetchOffering(): Promise<Offering | null> {
  const rc = await configureRevenueCat();
  if (!rc) return null;
  try {
    const offerings: Offerings = await client().getOfferings();
    return offerings.current ?? Object.values(offerings.all)[0] ?? null;
  } catch (error) {
    console.error('[revenuecat] getOfferings failed', error);
    return null;
  }
}

export function orderedPackages(offering: Offering): Package[] {
  const order = new Map<string, number>(
    PRODUCT_IDS.map((id, index) => [id, index]),
  );
  return [...offering.availablePackages].sort((a, b) => {
    const ai = order.get(a.webBillingProduct.identifier) ?? Number.MAX_SAFE_INTEGER;
    const bi = order.get(b.webBillingProduct.identifier) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}

/** Purchase a specific package (used by the fallback list, not the RC paywall). */
export async function purchasePackage(pkg: Package): Promise<PurchaseOutcome> {
  const rc = await configureRevenueCat();
  if (!rc) return { status: 'error', message: 'Billing is not available.' };
  try {
    const { customerInfo } = await client().purchase({ rcPackage: pkg });
    return { status: 'purchased', customerInfo };
  } catch (error) {
    return toOutcome(error);
  }
}

/**
 * Present the RevenueCat-hosted Paywall (designed in the dashboard) as a
 * full-screen overlay, or mounted into `htmlTarget` when provided.
 */
export async function presentPaywall(
  htmlTarget?: HTMLElement,
): Promise<PurchaseOutcome> {
  const rc = await configureRevenueCat();
  if (!rc) return { status: 'error', message: 'Billing is not available.' };
  try {
    const offering = (await fetchOffering()) ?? undefined;
    const result = await client().presentPaywall({
      ...(offering ? { offering } : {}),
      ...(htmlTarget ? { htmlTarget } : {}),
    });
    return { status: 'purchased', customerInfo: result.customerInfo };
  } catch (error) {
    return toOutcome(error);
  }
}

/**
 * "Restore" on the web means re-attaching to a prior purchase, which is keyed by
 * app user id. With anonymous users the purchase already follows the browser, so
 * the practical restore path is: identify with a known id, or open the
 * management page. Here we simply re-fetch and let the caller react.
 */
export async function restore(): Promise<CustomerInfo | null> {
  return fetchCustomerInfo();
}

/**
 * The "Customer Center" for Web Billing: RevenueCat exposes a management URL on
 * the customer info when there is an active subscription (cancel, update card,
 * see renewal date). Native builds get the real Customer Center UI instead.
 */
export function managementUrl(
  customerInfo: CustomerInfo | null | undefined,
): string | null {
  return customerInfo?.managementURL ?? null;
}

function toOutcome(error: unknown): PurchaseOutcome {
  if (error instanceof PurchasesError) {
    if (error.errorCode === ErrorCode.UserCancelledError) {
      return { status: 'cancelled' };
    }
    return { status: 'error', message: error.message };
  }
  if (error instanceof Error) return { status: 'error', message: error.message };
  return { status: 'error', message: 'Something went wrong with the purchase.' };
}

/* -------------------------------------------------------------------------- */
/* Native (Capacitor / Google Play Billing) — to be completed before release. */
/* -------------------------------------------------------------------------- */

async function configureNative(): Promise<Purchases | null> {
  // TODO(shipaton): wire @revenuecat/purchases-capacitor here.
  //
  //   import { Purchases as NativePurchases } from '@revenuecat/purchases-capacitor';
  //   await NativePurchases.configure({ apiKey: ANDROID_PUBLIC_SDK_KEY });
  //
  // Then adapt fetchCustomerInfo / fetchOffering / purchasePackage to call the
  // native plugin when Capacitor.isNativePlatform() is true. The RevenueCat
  // Android Paywall is shown with `@revenuecat/purchases-capacitor-ui`'s
  // `presentPaywall()` rather than the web `presentPaywall` above.
  console.warn(
    '[revenuecat] native billing is not configured yet — Pemberley Pro is disabled on this platform.',
  );
  return null;
}
