import { useState } from 'react';
import { LivingPortrait, type PortraitExpression, type PortraitKind } from './LivingPortrait';
import { portraitUrl } from '../data/portraits';

type Props = {
  id: string;
  kind: PortraitKind;
  color: string;
  expression?: PortraitExpression;
  size?: number;
  title?: string;
};

// 差し込みの顔写真があればそれを、無ければ描き顔（LivingPortrait）を表示する。
export function CharacterPortrait({ id, kind, color, expression = 'calm', size = 40, title }: Props) {
  const url = portraitUrl(id, expression);
  const [broken, setBroken] = useState(false);

  if (url && !broken) {
    return (
      <img
        className="character-portrait"
        src={url}
        width={size}
        height={size}
        alt={title ? `${title}（${expression}）` : ''}
        aria-hidden={title ? undefined : true}
        loading="lazy"
        draggable={false}
        onError={() => setBroken(true)}
      />
    );
  }
  return <LivingPortrait seed={id} kind={kind} color={color} expression={expression} size={size} title={title} />;
}
