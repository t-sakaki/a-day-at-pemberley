import type { PortraitExpression } from '../components/LivingPortrait';

// 差し込み用の肖像画像。src/assets/portraits/<id>-<expression>.png を置くと
// その顔が使われ、無ければ LivingPortrait（SVGの描き顔）にフォールバックする。
// 例: darcy-calm.png / darcy-pleased.png / darcy-concerned.png / darcy-tense.png
const modules = import.meta.glob('../assets/portraits/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byKey = new Map<string, string>();
for (const [path, url] of Object.entries(modules)) {
  const key = path.split('/').pop()!.replace(/\.[^.]+$/, '').toLowerCase();
  byKey.set(key, url);
}

const ORDER: PortraitExpression[] = ['calm', 'pleased', 'concerned', 'tense'];

/** 指定の表情、無ければ穏やか、それも無ければ最初に見つかった1枚のURLを返す。 */
export function portraitUrl(id: string, expression: PortraitExpression = 'calm'): string | null {
  const want = [expression, 'calm' as PortraitExpression, ...ORDER];
  for (const expr of want) {
    const hit = byKey.get(`${id}-${expr}`);
    if (hit) return hit;
  }
  return byKey.get(id) ?? null;
}

/** その人物の差し込み画像が1枚でもあるか。 */
export function hasPortrait(id: string): boolean {
  if (byKey.has(id)) return true;
  for (const expr of ORDER) if (byKey.has(`${id}-${expr}`)) return true;
  return false;
}
