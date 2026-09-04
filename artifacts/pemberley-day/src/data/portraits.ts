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

// Canvas 描画用の画像キャッシュ。読み込み前は null を返し、
// 読み込み完了後のフレームから実体を返す（毎フレーム new Image しない）。
const imageCache = new Map<string, HTMLImageElement>();

/** 芝生を歩く人物などに貼る顔画像。未ロードなら null（次フレーム以降で差し替わる）。 */
export function portraitImage(id: string, expression: PortraitExpression = 'calm'): HTMLImageElement | null {
  const url = portraitUrl(id, expression);
  if (!url) return null;
  let img = imageCache.get(url);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.src = url;
    imageCache.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** その人物の差し込み画像が1枚でもあるか。 */
export function hasPortrait(id: string): boolean {
  if (byKey.has(id)) return true;
  for (const expr of ORDER) if (byKey.has(`${id}-${expr}`)) return true;
  return false;
}
