import { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2, Sparkles, X } from 'lucide-react';

import { usePemberleyPro } from '@/hooks/usePemberleyPro';
import { orderedPackages } from '@/lib/revenuecat';

type Props = {
  open: boolean;
  onClose: () => void;
  /** BCP-47 code from the app; only `ja` is localised, everything else uses `en`. */
  language?: string;
};

const COPY = {
  en: {
    eyebrow: 'Pemberley Pro',
    close: 'Close',
    titleLocked: 'Support Pemberley',
    titleUnlocked: 'You have Pemberley Pro',
    blurbLocked:
      'A voluntary way to keep the house in good order. Pro keeps your full diary history and marks you as a patron of the estate.',
    blurbUnlocked:
      'Thank you. Your full diary history is kept, and the estate is glad of your patronage.',
    seePlans: 'See the plans',
    restore: 'Restore a previous purchase',
    manage: 'Manage subscription',
    unavailable:
      'Purchases are not available in this build. Set VITE_REVENUECAT_WEB_API_KEY to enable them.',
    perLifetime: 'one payment',
    perYear: 'per year',
    perMonth: 'per month',
    cancelled: 'No change made.',
    thanks: 'Purchase complete — thank you!',
    genericError: 'Something went wrong. Please try again.',
    loading: 'Loading plans…',
  },
  ja: {
    eyebrow: 'ペンバリー・プロ',
    close: '閉じる',
    titleLocked: 'ペンバリーを支援する',
    titleUnlocked: 'ペンバリー・プロをご利用中です',
    blurbLocked:
      '館を良い状態に保つための、任意のご支援です。プロにすると日誌の全履歴が残り、領地の後援者として記されます。',
    blurbUnlocked:
      'ありがとうございます。日誌の全履歴が保存され、領地はあなたのご後援を歓びます。',
    seePlans: 'プランを見る',
    restore: '購入を復元する',
    manage: 'サブスクリプションの管理',
    unavailable:
      'このビルドでは購入できません。VITE_REVENUECAT_WEB_API_KEY を設定すると有効になります。',
    perLifetime: '買い切り',
    perYear: '年額',
    perMonth: '月額',
    cancelled: '変更はありません。',
    thanks: '購入が完了しました。ありがとうございます！',
    genericError: '問題が発生しました。もう一度お試しください。',
    loading: 'プランを読み込み中…',
  },
} as const;

export function PemberleyProDialog({ open, onClose, language = 'en' }: Props) {
  const pro = usePemberleyPro();
  const t = COPY[language === 'ja' ? 'ja' : 'en'];
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setMessage(null);
      setBusy(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const runPaywall = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    const outcome = await pro.openPaywall();
    setBusy(false);
    if (outcome.status === 'purchased') setMessage(t.thanks);
    else if (outcome.status === 'cancelled') setMessage(t.cancelled);
    else setMessage(outcome.message || t.genericError);
  }, [pro, t]);

  const buy = useCallback(
    async (packageId: string) => {
      setBusy(true);
      setMessage(null);
      const outcome = await pro.buy(packageId);
      setBusy(false);
      if (outcome.status === 'purchased') setMessage(t.thanks);
      else if (outcome.status === 'cancelled') setMessage(t.cancelled);
      else setMessage(outcome.message || t.genericError);
    },
    [pro, t],
  );

  const restore = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    await pro.refresh();
    setBusy(false);
  }, [pro]);

  if (!open) return null;

  const packages = pro.offering ? orderedPackages(pro.offering) : [];

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={t.eyebrow}>
        <button
          className="icon-button"
          style={{ float: 'right', color: '#31554c' }}
          onClick={onClose}
          aria-label={t.close}
        >
          <X size={17} />
        </button>
        <div className="eyebrow" style={{ color: '#a36b48' }}>
          {t.eyebrow}
        </div>
        <h2>{pro.isPro ? t.titleUnlocked : t.titleLocked}</h2>
        <p>{pro.isPro ? t.blurbUnlocked : t.blurbLocked}</p>

        {!pro.available && <p style={{ color: '#8a5a3c' }}>{t.unavailable}</p>}

        {pro.available && !pro.isPro && (
          <>
            {!pro.ready && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={14} className="spin" /> {t.loading}
              </p>
            )}

            {packages.length > 0 && (
              <div style={{ display: 'grid', gap: 8, margin: '16px 0' }}>
                {packages.map((pkg) => {
                  const product = pkg.webBillingProduct;
                  const price =
                    product.price?.formattedPrice ??
                    product.currentPrice.formattedPrice;
                  const cadence =
                    pkg.webBillingProduct.identifier === 'yearly'
                      ? t.perYear
                      : pkg.webBillingProduct.identifier === 'monthly'
                        ? t.perMonth
                        : t.perLifetime;
                  return (
                    <button
                      key={pkg.identifier}
                      disabled={busy}
                      onClick={() => buy(pkg.webBillingProduct.identifier)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 14px',
                        border: '1px solid #9c7e5c',
                        background: '#fff',
                        color: '#3a2f27',
                        cursor: busy ? 'default' : 'pointer',
                        textAlign: 'left',
                        minHeight: 44,
                      }}
                    >
                      <span>{product.title || cadence}</span>
                      <strong>
                        {price}
                        <span
                          style={{
                            color: '#9c795e',
                            fontWeight: 400,
                            marginLeft: 6,
                            fontSize: 10,
                          }}
                        >
                          {cadence}
                        </span>
                      </strong>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="modal-actions">
              <button onClick={restore} disabled={busy}>
                {t.restore}
              </button>
              <button
                className="primary"
                onClick={runPaywall}
                disabled={busy || !pro.ready}
              >
                {busy ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
                <span style={{ marginLeft: 6 }}>{t.seePlans}</span>
              </button>
            </div>
          </>
        )}

        {pro.isPro && (
          <div className="modal-actions">
            {pro.managementUrl && (
              <a
                className="modal-manage-link"
                href={pro.managementUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '11px 15px',
                  border: '1px solid #8b9b91',
                  color: '#31554c',
                  fontSize: 11,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={13} /> {t.manage}
              </a>
            )}
            <button className="primary" onClick={onClose}>
              {t.close}
            </button>
          </div>
        )}

        {message && (
          <p style={{ marginTop: 12, color: '#31554c', fontSize: 11 }}>{message}</p>
        )}
      </div>
    </div>
  );
}
