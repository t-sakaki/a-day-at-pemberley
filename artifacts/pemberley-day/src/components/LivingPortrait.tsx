import { useId, useMemo } from 'react';

export type PortraitKind = 'lady' | 'gent' | 'steward';
export type PortraitExpression = 'calm' | 'pleased' | 'concerned' | 'busy';

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

const MOUTHS: Record<PortraitExpression, string> = {
  calm: 'M23 45 Q30 48 37 45',
  pleased: 'M22 44 Q30 52 38 44',
  concerned: 'M23 47 Q30 44 37 47',
  busy: 'M26 45 Q30 49 34 45',
};

// [左眉の回転, 右眉の回転, まぶたの下がり(0-1)]
const BROWS: Record<PortraitExpression, [number, number, number]> = {
  calm: [0, 0, 0],
  pleased: [-8, 8, 0],
  concerned: [14, -14, 0.15],
  busy: [11, -11, 0.32],
};

export function LivingPortrait({ seed, kind, color, expression = 'calm', size = 40, title }: Props) {
  const uid = useId().replace(/:/g, '');
  const rng = useMemo(() => hash(seed), [seed]);
  const blinkDelay = -(rng % 5000) / 1000; // 各人でまばたきをずらす
  const swayDelay = -(rng % 3700) / 1000;
  const cloth = color;
  const ink = mix(color, '#2a241d', 0.4);
  const skin = '#e7d6bd';
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
        <filter id={`${uid}-soft`}><feGaussianBlur stdDeviation="0.6" /></filter>
      </defs>
      <g clipPath={`url(#${uid}-frame)`}>
        <rect x="0" y="0" width="60" height="64" fill={mix(cloth, '#f3ead7', 0.72)} />
        <ellipse cx="30" cy="54" rx="26" ry="20" fill={mix(cloth, '#ffffff', 0.12)} opacity="0.5" filter={`url(#${uid}-soft)`} />

        <g
          className="lp-body"
          style={{ animationDelay: `${swayDelay}s` }}
        >
          {/* 肩・胴 */}
          <path d="M8 64 Q10 44 30 42 Q50 44 52 64 Z" fill={cloth} opacity="0.95" />
          <path d="M8 64 Q10 44 30 42 Q50 44 52 64 Z" fill={ink} opacity="0.14" />
          {/* 襟元 */}
          <path d="M23 45 Q30 52 37 45 L34 42 Q30 45 26 42 Z" fill={mix(skin, '#ffffff', 0.3)} />

          <g className="lp-head" style={{ animationDelay: `${swayDelay}s` }}>
            {/* 首 */}
            <rect x="26" y="36" width="8" height="8" rx="3" fill={mix(skin, ink, 0.12)} />
            {/* 顔 */}
            <ellipse cx="30" cy="26" rx="13" ry="14" fill={skin} />
            <ellipse cx="30" cy="26" rx="13" ry="14" fill={ink} opacity="0.06" />

            {/* 髪・帽子 */}
            {kind === 'lady' && (
              <>
                <path d="M16 24 Q17 8 30 7 Q43 8 44 24 Q44 14 30 13 Q16 14 16 24 Z" fill={mix(cloth, ink, 0.25)} />
                <path d="M14 22 Q30 2 46 22 Q46 12 30 10 Q14 12 14 22 Z" fill={cloth} />
                <path d="M14 22 Q30 2 46 22" fill="none" stroke={ink} strokeWidth="1" opacity="0.35" />
              </>
            )}
            {kind === 'gent' && (
              <>
                <path d="M17 22 Q18 11 30 10 Q42 11 43 22 L43 20 Q30 15 17 20 Z" fill={mix('#3a3128', ink, 0.4)} />
                <rect x="14" y="18" width="32" height="4" rx="1.5" fill="#2c2620" />
                <rect x="19" y="2" width="22" height="17" rx="2" fill="#2c2620" />
              </>
            )}
            {kind === 'steward' && (
              <path d="M17 24 Q17 10 30 9 Q43 10 43 24 Q43 15 30 14 Q17 15 17 24 Z" fill={mix('#6b5642', ink, 0.3)} />
            )}

            {cheeks && (
              <>
                <ellipse cx="22" cy="30" rx="3.4" ry="2.2" fill="#d98c74" opacity="0.4" />
                <ellipse cx="38" cy="30" rx="3.4" ry="2.2" fill="#d98c74" opacity="0.4" />
              </>
            )}

            {/* 目 */}
            <g>
              <ellipse cx="24" cy="25" rx="3" ry={2.4 - lidDrop * 1.4} fill="#fdfaf2" />
              <ellipse cx="36" cy="25" rx="3" ry={2.4 - lidDrop * 1.4} fill="#fdfaf2" />
              <circle cx="24.3" cy="25" r="1.5" fill={ink} />
              <circle cx="35.7" cy="25" r="1.5" fill={ink} />
              {/* まばたき用まぶた */}
              <rect className="lp-lid" x="20.6" y="20.8" width="7" height="5" fill={skin} style={{ animationDelay: `${blinkDelay}s` }} />
              <rect className="lp-lid" x="32.4" y="20.8" width="7" height="5" fill={skin} style={{ animationDelay: `${blinkDelay}s` }} />
            </g>

            {/* 眉 */}
            <rect x="20.5" y="20" width="7" height="1.6" rx="0.8" fill={ink} style={{ transform: `rotate(${browL}deg)`, transformBox: 'fill-box', transformOrigin: 'center' }} />
            <rect x="32.5" y="20" width="7" height="1.6" rx="0.8" fill={ink} style={{ transform: `rotate(${browR}deg)`, transformBox: 'fill-box', transformOrigin: 'center' }} />

            {/* 鼻・口 */}
            <path d="M30 27 L29 31 Q30 32 31 31" fill="none" stroke={ink} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            <path d={mouth} fill="none" stroke={mix(ink, '#7a3b34', 0.5)} strokeWidth="1.6" strokeLinecap="round" />
          </g>
        </g>
        <circle cx="30" cy="32" r="29" fill="none" stroke={mix(cloth, ink, 0.4)} strokeWidth="2" opacity="0.5" />
      </g>
    </svg>
  );
}
