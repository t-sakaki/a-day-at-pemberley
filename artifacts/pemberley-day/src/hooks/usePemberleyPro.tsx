import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { CustomerInfo, Offering } from '@revenuecat/purchases-js';

import {
  configureRevenueCat,
  fetchCustomerInfo,
  fetchOffering,
  hasPro,
  isBillingAvailable,
  managementUrl,
  presentPaywall as presentRcPaywall,
  purchasePackage as purchaseRcPackage,
  restore as restoreRc,
  type PurchaseOutcome,
} from '@/lib/revenuecat';

type PemberleyProValue = {
  /** `true` once the SDK has finished its first customer-info fetch. */
  ready: boolean;
  /** Whether billing is wired up at all (API key present). */
  available: boolean;
  /** The single source of truth for gating Pro-only features. */
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  offering: Offering | null;
  /** URL to manage / cancel an active subscription, or `null`. */
  managementUrl: string | null;
  /** Show the RevenueCat-hosted paywall. Resolves with the outcome. */
  openPaywall: (target?: HTMLElement) => Promise<PurchaseOutcome>;
  /** Buy one specific package (for a custom paywall UI). */
  buy: (packageId: string) => Promise<PurchaseOutcome>;
  /** Re-check entitlements (e.g. a "Restore purchases" button). */
  refresh: () => Promise<void>;
};

const PemberleyProContext = createContext<PemberleyProValue | null>(null);

export function PemberleyProProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<Offering | null>(null);
  const available = useMemo(() => isBillingAvailable(), []);
  const mounted = useRef(true);

  const applyCustomerInfo = useCallback((info: CustomerInfo | null) => {
    if (mounted.current) setCustomerInfo(info);
  }, []);

  const refresh = useCallback(async () => {
    const info = await fetchCustomerInfo();
    applyCustomerInfo(info);
  }, [applyCustomerInfo]);

  useEffect(() => {
    mounted.current = true;
    if (!available) {
      setReady(true);
      return;
    }
    (async () => {
      await configureRevenueCat();
      const [info, current] = await Promise.all([
        fetchCustomerInfo(),
        fetchOffering(),
      ]);
      if (!mounted.current) return;
      setCustomerInfo(info);
      setOffering(current);
      setReady(true);
    })();
    // The web SDK has no push updates, so re-check entitlements when the user
    // returns to the tab (e.g. after completing the hosted checkout).
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      mounted.current = false;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [available, refresh]);

  const openPaywall = useCallback<PemberleyProValue['openPaywall']>(
    async (target) => {
      const outcome = await presentRcPaywall(target);
      if (outcome.status === 'purchased') applyCustomerInfo(outcome.customerInfo);
      else await refresh();
      return outcome;
    },
    [applyCustomerInfo, refresh],
  );

  const buy = useCallback<PemberleyProValue['buy']>(
    async (packageId) => {
      const pkg = offering?.availablePackages.find(
        (p) =>
          p.identifier === packageId ||
          p.webBillingProduct.identifier === packageId,
      );
      if (!pkg) return { status: 'error', message: 'That plan is unavailable.' };
      const outcome = await purchaseRcPackage(pkg);
      if (outcome.status === 'purchased') applyCustomerInfo(outcome.customerInfo);
      return outcome;
    },
    [offering, applyCustomerInfo],
  );

  const value = useMemo<PemberleyProValue>(
    () => ({
      ready,
      available,
      isPro: hasPro(customerInfo),
      customerInfo,
      offering,
      managementUrl: managementUrl(customerInfo),
      openPaywall,
      buy,
      refresh: async () => {
        await restoreRc().then(applyCustomerInfo);
      },
    }),
    [ready, available, customerInfo, offering, openPaywall, buy, applyCustomerInfo],
  );

  return (
    <PemberleyProContext.Provider value={value}>
      {children}
    </PemberleyProContext.Provider>
  );
}

export function usePemberleyPro(): PemberleyProValue {
  const ctx = useContext(PemberleyProContext);
  if (!ctx) {
    throw new Error('usePemberleyPro must be used within <PemberleyProProvider>');
  }
  return ctx;
}
