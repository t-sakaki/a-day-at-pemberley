# visuals（Canvas 2D 水彩・パック）

Three.js 依存なし。Canvas 2D の draw ループに後掛けで適用するピクチャレスク的水彩表現。

## モジュール

- `ColorPalette.ts`
  - 18世紀イギリス透明水彩のパレット＋ lerpColor / rgba / hexToRgb
- `PaperTextureGenerator.ts`
  - Canvas 2Dで水彩紙（cold press）をプロシージャル生成。出力は `GeneratedPaperTexture`（canvas + ImageData + size）
- `AtmosphericFog.ts`
  - 時間帯に応じた空のグラデーション生成と前景の霞み（空気吸収色）提供。Three.js FogExp2 に依存せず、Canvas 2D向け。
- `EdgeSoftener.ts`
  - ポリゴンのエッジを「硬い線」ではなく、太さの揺れ＋にじみ線で柔らげるヘルパー。
- `WatercolorPass.ts`
  - 上記を統合して Canvas 2D context に水彩合成パス（ウォッシュ・階調量子化・紙ざわり・大気遠近・ヴィネット）を適用するクラス。

## 廃止・置き換え

- `WatercolorMaterial.ts` は Three.js ShaderMaterial としての実装だったが、現状 three 抜き環境では使えないため除外された。
  - 替わりに `WatercolorPass.ts`（Canvas 2D版水彩合成パス）を用いる。

## App.tsx の draw() への接続イメージ

```typescript
import { AtmosphericFog } from './visuals/AtmosphericFog';
import { PaperTextureGenerator } from './visuals/PaperTextureGenerator';
import { WatercolorPass } from './visuals/WatercolorPass';

// 初期化（コンポーネント外または useEffect で一度だけ）
const fog = new AtmosphericFog();
const paper = PaperTextureGenerator.generate({ size: 512 });
let gameHour = 6; // 朝6時から開始（ピクチャレスク的に最初の光）
```

### 現在の draw() ループ（変更前）

App.tsx の draw() には、すでに以下の構造がある：

```typescript
const draw = (now: number) => {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const t = now / 1000;
  context.clearRect(0, 0, w, h);

  // 現在の空グラデーション（ハードコード）
  const sky = context.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#a8b8c8');
  sky.addColorStop(.52, mode === 'title' ? '#b8a878' : '#7a8f5e');
  sky.addColorStop(1, '#6a5a4a');
  context.fillStyle = sky;
  context.fillRect(0, 0, w, h);

  // ... オブジェクト描画（project, poly, line）...

  // 現状のウォーターカラー紙パス（284〜302行）
  context.save();
  context.globalCompositeOperation = 'soft-light';
  context.fillStyle = 'rgba(255,248,231,.13)';
  context.fillRect(0, 0, w, h);
  context.globalCompositeOperation = 'multiply';
  for (let i = 0; i < Math.min(900, Math.floor(w * h / 850)); i += 1) {
    const px = (i * 47 + 13) % w;
    const py = (i * 83 + 7) % h;
    const alpha = ((i * 17) % 11) / 220;
    context.fillStyle = `rgba(106,90,74,${alpha})`;
    context.fillRect(px, py, 1 + (i % 2), 1);
  }
  const vignette = context.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .28, w / 2, h / 2, Math.max(w, h) * .7);
  vignette.addColorStop(0, 'rgba(106,90,74,0)');
  vignette.addColorStop(1, 'rgba(106,90,74,.3)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, w, h);
  context.restore();

  frame = requestAnimationFrame(draw);
};
```

### 変更後（AtmosphericFog + WatercolorPass を接続）

```typescript
const draw = (now: number) => {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const t = now / 1000;

  // 1. 時間帯の更新（ゲーム時間を進める）
  //    例: 1フレームごとに 0.016時間進む（60FPSで1時間=37.5秒くらいのスピード）
  const deltaTime = 1 / 60;
  gameHour = (gameHour + deltaTime * 0.008) % 24; // 非常に遅い時間進み（雰囲気用）
  fog.update(gameHour, deltaTime);

  context.clearRect(0, 0, w, h);

  // 2. 空のグラデーションを AtmosphericFog から取得して適用
  //    （今までのハードコード '#a8b8c8' などを fog の色に置き換える）
  const skyGradient = fog.getSkyGradient();
  const sky = context.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, skyGradient.top);
  sky.addColorStop(0.52, mode === 'title' ? skyGradient.mid : '#7a8f5e'); // 地面色は適宜調整
  sky.addColorStop(1, '#6a5a4a');
  context.fillStyle = sky;
  context.fillRect(0, 0, w, h);

  // ... オブジェクト描画（project, poly, line）...
  // 建物・菜園・果樹・人などの描画はそのまま

  // 3. 水彩合成パス（今までの紙パスを WatercolorPass で置き換える）
  WatercolorPass.apply(context, w, h, {
    mode: gameHour >= 19 || gameHour < 6 ? 'night' : 'day',
    washStrength: 0.13,
    grainStrength: 1.0,
    tonalSteps: 4,
    vignetteStrength: 0.3,
    atmosphericStrength: 0.25,
    airAbsorptionColor: fog.getAirAbsorptionColor(),
  }, paper);

  frame = requestAnimationFrame(draw);
};
```

### `applySkyGradient` ヘルパーを使う方法

AtmosphericFog には `applySkyGradient(ctx, fog, width, height)` が用意されている。 これを使うと、gradiant を自分で作る必要がなくなる。

```typescript
// 空の描画部分を次の1行に置き換える
applySkyGradient(context, fog, w, h);
```

ただし、現状の App.tsx は空だけでなく「地面色（#7a8f5e）」もグラデの中間点で混ぜているため、完全置き換えではなく、 空の上部〜中間までは AtmosphericFog、 中間〜下部は地面色、という感じで併用するのが自然。

### EdgeSoftener の使い方（オプション）

ポリゴンのエッジを柔らげたい場合は、fill の直後に `applyEdgeSoftening` を呼ぶ。

```typescript
// 例：家の輪郭を柔らかく描く
const housePoints = [
  project(-5.5, -3.4),
  project(4.4, -3.4),
  project(4.4, 1.4),
  project(-5.5, 1.4),
];

// 通常の塗りつぶし
context.fillStyle = '#c4b5a0';
context.beginPath();
housePoints.forEach((p, i) => i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y));
context.closePath();
context.fill();

// エッジを柔らかく（任意）
applyEdgeSoftening(context, housePoints, '#c4b5a0', {
  addBleed: true,
  minWidth: 1,
  maxWidth: 2.5,
});
```

詳細は `EdgeSoftener.ts` の `applyEdgeSoftening` のインターフェースを参照。

## ピクチャレスク的チューニングの観点

18世紀イギリスのピクチャレスク（絵のように美しい）的視覚では、以下が要になる。

1. **紙の支持体感**
   - 単なる背景画像ではなく、紙の繊維・凹凸・かすれが視覚に残る
   - `PaperTextureGenerator` の生成結果を `WatercolorPass` の `grainStrength` で乗せる

2. **エッジの暴力性の低下**
   - 建築の直線でも、隅が鋭角で刺さらない
   - `EdgeSoftener` や、線の太さ・濃淡の揺らぎ、ソフトなブレンドで輪郭を和らげる

3. **空気遠近と光の一貫性**
   - 遠い丘・木・建物ほど色が空の色に吸収される
   - 時間帯で空・地面・建築石・葉の色がまとめて遷移する（色がバラバラに動かない）
   - `AtmosphericFog` の `getSkyGradient()` と `getAirAbsorptionColor()` を使う

4. **影を「黒い層」ではなく色の関係で処理する**
   - 水彩の影は、塗り重ね・滲み・紙の白の残し方でできる
   - 純粋な黒や「diffuseを50%にする」という計算より、影側の色を別の色（青み・紫み・茶み）で用意し、明部と混ざる関係で作るほうが様式に合う

5. **「積み重ね」で深さを作る**
   - 遠景 → 地面 → 建築の面 → 建築の羽・屋根 → 窓・ドア → 前の植え込み、のようにレイヤーが重なると、等角でも絵画的な奥行きが出る
   - 現状の App.tsx はこの層構造に近いので、そのまま活かせる

## 注意

- `WatercolorPass` は毎フレーム `getImageData` / `putImageData` を行うため、キャンバスが大きいとコストが上がる。
  - モバイルでは `tonalSteps` を 0 にしたり、`grainStrength` を下げるなどして調整する。
- `PaperTextureGenerator.generate()` は一度呼べば再利用可能な `GeneratedPaperTexture` を返す。 毎フレーム生成せず、初期化時に一度生成して使い回す。
- 現状の `draw()` ループの「ウォーターカラー紙パス」は、`WatercolorPass` と機能が重なる部分がある。 置き換える場合は、`WatercolorPass` の `washStrength=0.13`, `grainStrength=1.0`, `vignetteStrength=0.3` あたりから始めると近い結果になる。
