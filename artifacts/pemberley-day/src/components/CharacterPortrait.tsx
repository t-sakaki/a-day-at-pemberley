import { useState } from 'react';
import { LivingPortrait, type PortraitExpression, type PortraitKind } from './LivingPortrait';
import { portraitUrl } from '../data/portraits';
import { blenderPortraitUrl } from '../data/blenderCharacters';

type Props = {
  id: string;
  kind: PortraitKind;
  color: string;
  expression?: PortraitExpression;
  size?: number;
  title?: string;
};

// Blender portrait → existing painting → drawn face. Failures are scoped to each URL.
export function CharacterPortrait({ id, kind, color, expression = 'calm', size = 40, title }: Props) {
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const url = [blenderPortraitUrl(id, expression), portraitUrl(id, expression)]
    .find((candidate): candidate is string => Boolean(candidate && !failed.has(candidate)));

  if (url) {
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
        onError={() => setFailed(current => new Set(current).add(url))}
      />
    );
  }
  return <LivingPortrait seed={id} kind={kind} color={color} expression={expression} size={size} title={title} />;
}
