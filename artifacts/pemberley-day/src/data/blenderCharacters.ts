import type { PortraitExpression } from '../components/LivingPortrait';

// This list mirrors build_characters.py. Unknown people retain the drawn fallback.
export const blenderCharacterIds = [
  'darcy', 'elizabeth-bennet', 'georgiana', 'bingley', 'caroline', 'louisa',
  'the-gardiners', 'jane', 'lady-catherine', 'mrs-reynolds', 'john', 'sarah',
  'mr-adams', 'thomas', 'steward',
] as const;

const ids = new Set<string>(blenderCharacterIds);
export function blenderCharacterId(id: string): string | null {
  const key = id.replace(/^visitor-/, '');
  return ids.has(key) ? key : null;
}

export function blenderPortraitUrl(id: string, expression: PortraitExpression): string | null {
  const key = blenderCharacterId(id);
  return key ? `${import.meta.env.BASE_URL}blender/characters/${key}/${expression}.png` : null;
}
