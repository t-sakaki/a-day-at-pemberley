import { useId, useMemo } from 'react';

export type PortraitKind = 'lady' | 'gent' | 'steward';
export type PortraitExpression = 'calm' | 'pleased' | 'concerned' | 'busy' | 'tense';

type Props = {
  /** stable id used to vary blink timing / face proportions between characters */
  seed: string;
  kind: PortraitKind;
  color: string;
  expression?: PortraitExpression;
  size?: number;
  title?: string;
};

// 小さな16進ミックス（キャンバスの人物と同じ配色感を出す）
function mix(hex: string, other: string, amount: number): string {
  const parse = (value: string) => {
    const clean = value.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
    return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  };
  const a = parse(hex);
  const b = parse(other);
  const c = a.map((value, i) => Math.round(value + (b[i] - value) * amount));
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// 口の形（上唇/下唇の稜線）
const MOUTHS: Record<PortraitExpression, string> = {
  calm: 'M24 45.5 Q30 47.6 36 45.5 Q30 49 24 45.5',
  pleased: 'M22.5 44.6 Q30 51.5 37.5 44.6 Q30 48 22.5 44.6',
  concerned: 'M24 46.4 Q30 44.4 36 46.4 Q30 48.6 24 46.4',
  busy: 'M25.5 45.6 Q30 47 34.5 45.6 Q30 47.6 25.5 45.6',
  tense: 'M25 45.8 L35 45.8',
};

// [左眉の回転, 右眉の回転, まぶたの下がり(0-1)]
const BROWS: Record<PortraitExpression, [number, number, number]> = {
  calm: [0, 0, 0],
  pleased: [-7, 7, 0],
  concerned: [15, -15, 0.16],
  busy: [12, -12, 0.34],
  tense: [6, -6, 0.1],
};

export function LivingPortrait({ seed, kind, color, expression = 'calm', size = 40, title }: Props) {
  const uid = useId().replace(/:/g, '');
  const rng = useMemo(() => hash(seed), [seed]);
  const blinkDelay = -(rng % 5000) / 1000; // 各人でまばたきをずらす
  const swayDelay = -(rng % 3700) / 1000;
  const tiltDir = rng % 2 === 0 ? 1 : -1;

  const cloth = kind === 'gent' ? mix(color, '#241f1a', 0.55) : color;
  const ink = mix(color, '#241d16', 0.5);
  const skin = mix('#e9d8bd', color, 0.06);
  const skinShadow = mix(skin, '#7c5a44', 0.5);
  const hair = kind === 'lady'
    ? mix(color, '#2e2118', 0.68)
    : mix('#3b2c20', ink, 0.35);
  const hairLit = mix(hair, '#c9a26a', 0.4);
  const [browL, browR, lidDrop] = BROWS[expression];
  const mouth = MOUTHS[expression];
  const cheeks = expression === 'pleased';

  return (
    <svg
      className="living-portrait"
      width={size}
      height={size}
      viewBox="0 0 60 64"
      role="img"
      aria-label={title ? `${title} (${expression})` : undefined}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <clipPath id={`${uid}-frame`}><circle cx="30" cy="32" r="30" /></clipPath>
        <radialGradient id={`${uid}-bg`} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor={mix(cloth, '#f0e4cc', 0.62)} />
          <stop offset="60%" stopColor={mix(cloth, '#6c5b45', 0.45)} />
          <stop offset="100%" stopColor="#241c14" />
        </radialGradient>
        <radialGradient id={`${uid}-skin`} cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor={mix(skin, '#fff4e0', 0.5)} />
          <stop offset="62%" stopColor={skin} />
          <stop offset="100%" stopColor={skinShadow} />
        </radialGradient>
        <linearGradient id={`${uid}-hair`} x1="0" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor={hairLit} />
          <stop offset="55%" stopColor={hair} />
          <stop offset="100%" stopColor={mix(hair, '#000000', 0.35)} />
        </linearGradient>
        <filter id={`${uid}-paint`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={rng % 97} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${uid}-soft`}><feGaussianBlur stdDeviation="0.7" /></filter>
      </defs>

      <g clipPath={`url(#${uid}-frame)`}>
        <rect x="0" y="0" width="60" height="64" fill={`url(#${uid}-bg)`} />

        <g filter={`url(#${uid}-paint)`}>
          <g
            className="lp-body"
            style={{ animationDelay: `${swayDelay}s`, transform: `rotate(${tiltDir * 0.6}deg)` }}
          >
            {/* 肩・胴（衣装） */}
            <path d="M6 64 Q8 43 30 41 Q52 43 54 64 Z" fill={cloth} />
            <path d="M6 64 Q8 43 30 41 Q52 43 54 64 Z" fill={ink} opacity="0.18" />

            {kind === 'lady' ? (
              // 白いフィシュ（胸元の布）
              <path d="M20 46 Q30 60 40 46 Q34 45 30 41 Q26 45 20 46 Z" fill={mix(skin, '#fffaf0', 0.55)} opacity="0.92" />
            ) : (
              // 高い襟＋白クラヴァット
              <>
                <path d="M22 44 L26 62 L30 46 L34 62 L38 44 Q30 40 22 44 Z" fill={mix('#f4ecda', skin, 0.15)} />
                <path d="M24 43 Q30 47 36 43 L38 40 Q30 44 22 40 Z" fill={mix(cloth, '#ffffff', 0.14)} />
              </>
            )}

            <g className="lp-head" style={{ animationDelay: `${swayDelay}s` }}>
              {/* 首 */}
              <path d="M25 34 Q25 42 30 43 Q35 42 35 34 Z" fill={skinShadow} />
              <rect x="26.5" y="33" width="7" height="8" rx="3" fill={skin} />

              {/* 髪（後ろ） */}
              <path d="M14 30 Q13 8 30 6 Q47 8 46 30 Q46 18 30 16 Q14 18 14 30 Z" fill={`url(#${uid}-hair)`} />

              {/* 顔 */}
              <path d="M17 24 Q17 40 30 41 Q43 40 43 24 Q43 10 30 10 Q17 10 17 24 Z" fill={`url(#${uid}-skin)`} />
              {/* 頬骨の陰り */}
              <ellipse cx="19.5" cy="28" rx="3" ry="6" fill={skinShadow} opacity="0.3" filter={`url(#${uid}-soft)`} />
              <ellipse cx="40.5" cy="28" rx="3" ry="6" fill={skinShadow} opacity="0.22" filter={`url(#${uid}-soft)`} />

              {cheeks && (
                <>
                  <ellipse cx="21.5" cy="31" rx="3.6" ry="2.4" fill="#d9866e" opacity="0.4" filter={`url(#${uid}-soft)`} />
                  <ellipse cx="38.5" cy="31" rx="3.6" ry="2.4" fill="#d9866e" opacity="0.4" filter={`url(#${uid}-soft)`} />
                </>
              )}

              {/* 目 */}
              <g>
                <path d="M20.5 25 Q24 22.6 27.5 25 Q24 27 20.5 25 Z" fill="#fbf6ec" />
                <path d="M32.5 25 Q36 22.6 39.5 25 Q36 27 32.5 25 Z" fill="#fbf6ec" />
                <circle cx="24" cy="25" r="1.9" fill={mix(ink, '#3c2c1c', 0.5)} />
                <circle cx="36" cy="25" r="1.9" fill={mix(ink, '#3c2c1c', 0.5)} />
                <circle cx="24" cy="25" r="0.9" fill="#1c140d" />
                <circle cx="36" cy="25" r="0.9" fill="#1c140d" />
                <circle cx="24.7" cy="24.3" r="0.5" fill="#fff" opacity="0.9" />
                <circle cx="36.7" cy="24.3" r="0.5" fill="#fff" opacity="0.9" />
                {/* 上まつげ／ライン */}
                <path d="M20.3 24.6 Q24 22 27.7 24.6" fill="none" stroke={ink} strokeWidth="0.9" strokeLinecap="round" />
                <path d="M32.3 24.6 Q36 22 39.7 24.6" fill="none" stroke={ink} strokeWidth="0.9" strokeLinecap="round" />
                {/* まばたき用まぶた */}
                <rect className="lp-lid" x="20" y="21.4" width="8" height="4.2" fill={skin} style={{ animationDelay: `${blinkDelay}s` }} />
                <rect className="lp-lid" x="32" y="21.4" width="8" height="4.2" fill={skin} style={{ animationDelay: `${blinkDelay}s` }} />
              </g>

              {/* 眉 */}
              <path d="M20.5 20.6 Q24 19 27.5 20.4" fill="none" stroke={hair} strokeWidth="1.7" strokeLinecap="round"
                style={{ transform: `translateY(${lidDrop * 1.6}px) rotate(${browL}deg)`, transformBox: 'fill-box', transformOrigin: 'center' }} />
              <path d="M32.5 20.4 Q36 19 39.5 20.6" fill="none" stroke={hair} strokeWidth="1.7" strokeLinecap="round"
                style={{ transform: `translateY(${lidDrop * 1.6}px) rotate(${browR}deg)`, transformBox: 'fill-box', transformOrigin: 'center' }} />

              {/* 鼻 */}
              <path d="M30 25 Q30.6 30 28.4 32 Q30 33.2 32 32" fill="none" stroke={skinShadow} strokeWidth="1.1" strokeLinecap="round" opacity="0.7" />
              {/* 人中 */}
              <path d="M30 33 L30 35.4" stroke={skinShadow} strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
              {/* 口 */}
              <path d={mouth} fill={mix('#b56a5a', ink, 0.28)} stroke={mix(ink, '#7a3b34', 0.5)} strokeWidth="0.6" />
              <path d="M25 45.4 Q30 46.6 35 45.4" fill="none" stroke={mix(ink, '#7a3b34', 0.5)} strokeWidth="0.9" strokeLinecap="round" />

              {/* 髪（前・ヘアスタイル） */}
              {kind === 'lady' ? (
                <>
                  {/* センター分けの前髪（顔を額縁のように囲う）とこめかみの巻き毛 */}
                  <path d="M15 27 Q14 10 30 8.5 Q46 10 45 27 Q43 17 37 15.5 Q33 19 30 15.5 Q27 19 23 15.5 Q17 17 15 27 Z" fill={`url(#${uid}-hair)`} />
                  <path d="M14.5 22 Q12 31 15.5 35 Q19 31 18 22 Z" fill={hair} />
                  <path d="M45.5 22 Q48 31 44.5 35 Q41 31 42 22 Z" fill={hair} />
                  <path d="M30 9 Q22 10 17 18" fill="none" stroke={hairLit} strokeWidth="0.8" opacity="0.7" />
                  <path d="M30 9 Q38 10 43 18" fill="none" stroke={hairLit} strokeWidth="0.8" opacity="0.7" />
                </>
              ) : (
                <>
                  {/* リージェンシー期の短髪＋もみあげ */}
                  <path d="M16 24 Q15 9 30 8 Q45 9 44 24 Q42 15 36 14 Q33 18 30 14 Q27 18 24 14 Q18 15 16 24 Z" fill={`url(#${uid}-hair)`} />
                  <path d="M16 22 Q16 29 17.5 31 L19 24 Z" fill={hair} />
                  <path d="M44 22 Q44 29 42.5 31 L41 24 Z" fill={hair} />
                  <path d="M20 12 Q28 9 38 13" fill="none" stroke={hairLit} strokeWidth="0.8" opacity="0.7" />
                  {kind === 'gent' && (
                    // シルクハット
                    <g>
                      <path d="M12 15 Q30 9 48 15 L48 17 Q30 12 12 17 Z" fill="#241d17" />
                      <path d="M17 2 Q30 -1 43 2 L43 14 Q30 10 17 14 Z" fill="#2b231b" />
                      <path d="M17 3 Q30 1 43 3" fill="none" stroke="#4a3d2e" strokeWidth="0.8" opacity="0.6" />
                    </g>
                  )}
                </>
              )}
            </g>
          </g>
        </g>

        {/* 額縁・光まわり */}
        <rect x="0" y="0" width="60" height="64" fill="#1c140c" opacity="0.0" />
        <ellipse cx="30" cy="60" rx="30" ry="16" fill="#140f09" opacity="0.4" filter={`url(#${uid}-soft)`} />
        <circle cx="30" cy="32" r="29" fill="none" stroke={mix('#caa25f', ink, 0.2)} strokeWidth="2.4" opacity="0.6" />
        <circle cx="30" cy="32" r="27" fill="none" stroke="#000" strokeWidth="1" opacity="0.25" />
      </g>
    </svg>
  );
}
